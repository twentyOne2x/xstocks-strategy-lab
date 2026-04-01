import { Buffer } from "node:buffer";
import { createPublicKey, verify as verifySignature } from "node:crypto";

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x[a-fA-F0-9]{40}$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

function base64UrlDecode(value) {
  return Buffer.from(String(value), "base64url");
}

function parseJsonChunk(value) {
  return JSON.parse(base64UrlDecode(value).toString("utf8"));
}

function parseJwt(token) {
  const normalized = String(token ?? "").trim();
  const parts = normalized.split(".");

  if (parts.length !== 3) {
    throw new Error("JWT must have exactly three segments.");
  }

  return {
    token: normalized,
    header: parseJsonChunk(parts[0]),
    payload: parseJsonChunk(parts[1]),
    signingInput: Buffer.from(`${parts[0]}.${parts[1]}`, "utf8"),
    signature: base64UrlDecode(parts[2]),
  };
}

function parseAudienceClaim(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function toIsoTimestamp(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function createJwtSummary(parsed) {
  return {
    alg: typeof parsed.header?.alg === "string" ? parsed.header.alg : null,
    kid: typeof parsed.header?.kid === "string" ? parsed.header.kid : null,
    issuer: normalizeEthereumAddress(parsed.payload?.iss),
    subject:
      typeof parsed.payload?.sub === "string" && parsed.payload.sub.trim().length > 0
        ? parsed.payload.sub.trim()
        : null,
    audience: parseAudienceClaim(parsed.payload?.aud),
    jwtId:
      typeof parsed.payload?.jti === "string" && parsed.payload.jti.trim().length > 0
        ? parsed.payload.jti.trim()
        : null,
    issuedAt: toIsoTimestamp(parsed.payload?.iat),
    expiresAt: toIsoTimestamp(parsed.payload?.exp),
    notBefore: toIsoTimestamp(parsed.payload?.nbf),
    digest:
      typeof firstDefined(
        parsed.payload?.digest,
        parsed.payload?.requestDigest,
        parsed.payload?.request_digest,
      ) === "string"
        ? firstDefined(
          parsed.payload?.digest,
          parsed.payload?.requestDigest,
          parsed.payload?.request_digest,
        ).trim()
        : null,
  };
}

function failure(statusCode, reasonCode, detail, extra = {}) {
  return {
    ok: false,
    statusCode,
    reasonCode,
    detail,
    ...extra,
  };
}

function success(context) {
  return {
    ok: true,
    ...context,
  };
}

function normalizeAllowlist(signerAllowlist = []) {
  if (!Array.isArray(signerAllowlist)) {
    return [];
  }

  return signerAllowlist
    .map((entry) => {
      const address = normalizeEthereumAddress(entry?.address);

      if (!address || !entry?.jwk || typeof entry.jwk !== "object") {
        return null;
      }

      try {
        return {
          address,
          providerIds: (
            entry.providerIds ??
            (entry.providerId ? [entry.providerId] : [])
          ).map((value) => String(value)),
          kid: typeof entry.kid === "string" ? entry.kid : null,
          key: createPublicKey({
            key: entry.jwk,
            format: "jwk",
          }),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function createProviderRebalanceAuthService({
  audience = null,
  signerAllowlist = [],
  now = () => Date.now(),
} = {}) {
  const allowlist = normalizeAllowlist(signerAllowlist);

  function isConfigured() {
    return Boolean(audience && allowlist.length > 0);
  }

  function authenticateAuthorizationHeader(
    authorizationHeader,
    { providerId, expectedDigest } = {},
  ) {
    if (!isConfigured()) {
      return failure(
        503,
        "provider_auth_not_configured",
        "Provider-triggered rebalance auth requires XSTOCKS_PROVIDER_REBALANCE_JWT_AUDIENCE and XSTOCKS_PROVIDER_REBALANCE_SIGNER_ALLOWLIST_JSON.",
      );
    }

    if (typeof authorizationHeader !== "string" || authorizationHeader.trim().length === 0) {
      return failure(401, "authorization_missing", "Authorization bearer token is required.");
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/iu);

    if (!match?.[1]) {
      return failure(
        401,
        "authorization_scheme_invalid",
        "Authorization must use the Bearer scheme.",
      );
    }

    let parsed;

    try {
      parsed = parseJwt(match[1]);
    } catch {
      return failure(401, "jwt_malformed", "Provider token must be a valid three-part JWT.");
    }

    const jwt = createJwtSummary(parsed);

    if (jwt.alg !== "ES256K") {
      return failure(
        401,
        "jwt_signature_invalid",
        "Provider token alg must be ES256K.",
        { jwt },
      );
    }

    if (!jwt.issuer) {
      return failure(
        401,
        "jwt_signer_invalid",
        "Provider token issuer must be a checksummed or lowercase Ethereum address.",
        { jwt },
      );
    }

    if (!jwt.audience.includes(audience)) {
      return failure(
        401,
        "jwt_audience_invalid",
        "Provider token audience does not match this API receiver.",
        { jwt },
      );
    }

    if (!jwt.jwtId) {
      return failure(401, "jwt_id_missing", "Provider token jti is required.", {
        jwt,
      });
    }

    if (!jwt.digest) {
      return failure(
        401,
        "jwt_digest_missing",
        "Provider token digest claim is required.",
        { jwt },
      );
    }

    if (jwt.digest !== expectedDigest) {
      return failure(
        401,
        "jwt_digest_mismatch",
        "Provider token digest does not match the request body digest.",
        { jwt },
      );
    }

    const nowSeconds = Math.floor(now() / 1000);

    if (typeof parsed.payload?.exp !== "number" || parsed.payload.exp <= nowSeconds) {
      return failure(401, "jwt_expired", "Provider token is expired.", { jwt });
    }

    if (typeof parsed.payload?.nbf === "number" && parsed.payload.nbf > nowSeconds) {
      return failure(401, "jwt_not_yet_valid", "Provider token is not valid yet.", {
        jwt,
      });
    }

    if (typeof parsed.payload?.iat === "number" && parsed.payload.iat > nowSeconds + 300) {
      return failure(
        401,
        "jwt_issued_in_future",
        "Provider token was issued in the future.",
        { jwt },
      );
    }

    let candidates = allowlist.filter((entry) => entry.address === jwt.issuer);

    if (providerId) {
      candidates = candidates.filter(
        (entry) =>
          entry.providerIds.length === 0 || entry.providerIds.includes(providerId),
      );
    }

    if (jwt.kid) {
      const keyedCandidates = candidates.filter(
        (entry) => entry.kid === null || entry.kid === jwt.kid,
      );

      if (keyedCandidates.length > 0) {
        candidates = keyedCandidates;
      }
    }

    if (candidates.length === 0) {
      return failure(
        403,
        "jwt_signer_invalid",
        "Provider signer is not allowlisted for this receiver.",
        { jwt },
      );
    }

    const signatureValid = candidates.some((candidate) =>
      verifySignature(
        "sha256",
        parsed.signingInput,
        {
          key: candidate.key,
          dsaEncoding: "ieee-p1363",
        },
        parsed.signature,
      ),
    );

    if (!signatureValid) {
      return failure(
        401,
        "jwt_signature_invalid",
        "Provider token signature verification failed.",
        { jwt },
      );
    }

    return success({
      signerAddress: jwt.issuer,
      jwt,
    });
  }

  return {
    isConfigured,
    authenticateAuthorizationHeader,
  };
}
