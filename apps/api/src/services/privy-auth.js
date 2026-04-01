import { Buffer } from "node:buffer";
import { createPublicKey, verify as verifySignature } from "node:crypto";

import { HttpError } from "../errors.js";

const PRIVY_ISSUER = "privy.io";
const JWKS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_PRIVY_API_BASE_URL = "https://api.privy.io";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x[a-fA-F0-9]{40}$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

function uniqueAddresses(values = []) {
  return [...new Set(values.map(normalizeEthereumAddress).filter(Boolean))];
}

function base64UrlDecode(value, label) {
  try {
    return Buffer.from(String(value), "base64url");
  } catch {
    throw new HttpError(401, `Privy ${label} is not valid base64url data.`);
  }
}

function parseJsonChunk(value, label) {
  try {
    return JSON.parse(base64UrlDecode(value, label).toString("utf8"));
  } catch {
    throw new HttpError(401, `Privy ${label} is not valid JSON.`);
  }
}

function parseJwt(token) {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new HttpError(401, "Privy token is missing.");
  }

  const normalized = token.trim();
  const parts = normalized.split(".");

  if (parts.length !== 3) {
    throw new HttpError(401, "Privy token must be a three-part JWT.");
  }

  return {
    token: normalized,
    header: parseJsonChunk(parts[0], "JWT header"),
    payload: parseJsonChunk(parts[1], "JWT payload"),
    signingInput: Buffer.from(`${parts[0]}.${parts[1]}`, "utf8"),
    signature: base64UrlDecode(parts[2], "JWT signature"),
  };
}

function parseCookieHeader(headerValue) {
  if (typeof headerValue !== "string" || headerValue.trim().length === 0) {
    return {};
  }

  return Object.fromEntries(
    headerValue
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const separatorIndex = chunk.indexOf("=");

        if (separatorIndex === -1) {
          return [chunk, ""];
        }

        return [
          chunk.slice(0, separatorIndex),
          decodeURIComponent(chunk.slice(separatorIndex + 1)),
        ];
      }),
  );
}

function readRequestHeader(request, headerName) {
  const raw = request?.headers?.[headerName.toLowerCase()];

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw ?? null;
}

function extractAccessToken(request) {
  const authorization = readRequestHeader(request, "authorization");

  if (typeof authorization === "string") {
    const match = authorization.match(/^Bearer\s+(.+)$/iu);

    if (match?.[1]) {
      return {
        token: match[1].trim(),
        source: "authorization_header",
      };
    }
  }

  const cookies = parseCookieHeader(readRequestHeader(request, "cookie"));
  const cookieToken = cookies["privy-token"];

  if (cookieToken) {
    return {
      token: cookieToken,
      source: "privy_token_cookie",
    };
  }

  return null;
}

function extractIdentityToken(request) {
  const headerToken = readRequestHeader(request, "x-privy-identity-token");

  if (typeof headerToken === "string" && headerToken.trim().length > 0) {
    return {
      token: headerToken.trim(),
      source: "x_privy_identity_token_header",
    };
  }

  const cookies = parseCookieHeader(readRequestHeader(request, "cookie"));
  const cookieToken = firstDefined(
    cookies["privy-identity-token"],
    cookies["privy-id-token"],
  );

  if (cookieToken) {
    return {
      token: cookieToken,
      source: "privy_identity_cookie",
    };
  }

  return null;
}

function parseAudienceClaim(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

function verifyJwtClaims(payload, { appId, nowMs, tokenLabel }) {
  if (payload?.iss !== PRIVY_ISSUER) {
    throw new HttpError(401, `Privy ${tokenLabel} issuer must be ${PRIVY_ISSUER}.`);
  }

  if (!parseAudienceClaim(payload?.aud).includes(appId)) {
    throw new HttpError(401, `Privy ${tokenLabel} audience does not match this app.`);
  }

  if (typeof payload?.sub !== "string" || payload.sub.trim().length === 0) {
    throw new HttpError(401, `Privy ${tokenLabel} is missing a subject.`);
  }

  const nowSeconds = Math.floor(nowMs / 1000);

  if (typeof payload?.exp !== "number" || payload.exp <= nowSeconds) {
    throw new HttpError(401, `Privy ${tokenLabel} is expired.`);
  }

  if (typeof payload?.nbf === "number" && payload.nbf > nowSeconds) {
    throw new HttpError(401, `Privy ${tokenLabel} is not valid yet.`);
  }

  if (typeof payload?.iat === "number" && payload.iat > nowSeconds + 300) {
    throw new HttpError(401, `Privy ${tokenLabel} was issued in the future.`);
  }
}

function createKeyRecordsFromParsedValue(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value?.keys)) {
    return value.keys.map((entry) => ({
      kid: typeof entry.kid === "string" ? entry.kid : null,
      key: createPublicKey({ key: entry, format: "jwk" }),
    }));
  }

  if (typeof value?.kty === "string") {
    return [
      {
        kid: typeof value.kid === "string" ? value.kid : null,
        key: createPublicKey({ key: value, format: "jwk" }),
      },
    ];
  }

  return [];
}

function verifyTokenSignature({ alg, signingInput, signature, key }) {
  if (alg === "ES256") {
    return verifySignature(
      "sha256",
      signingInput,
      {
        key,
        dsaEncoding: "ieee-p1363",
      },
      signature,
    );
  }

  if (alg === "RS256") {
    return verifySignature("RSA-SHA256", signingInput, key, signature);
  }

  if (alg === "EdDSA") {
    return verifySignature(null, signingInput, key, signature);
  }

  throw new HttpError(401, `Privy JWT alg ${alg} is not supported by this backend.`);
}

function parseLinkedAccountsClaim(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new HttpError(401, "Privy identity token linked_accounts claim is invalid.");
  }
}

function collectLinkedAddresses(linkedAccounts) {
  const walletAddresses = [];
  const embeddedWalletAddresses = [];
  const smartWalletAddresses = [];

  for (const account of linkedAccounts) {
    const address = normalizeEthereumAddress(account?.address);

    if (!address) {
      continue;
    }

    if (account?.type === "smart_wallet") {
      smartWalletAddresses.push(address);
      continue;
    }

    if (account?.type === "wallet") {
      walletAddresses.push(address);

      if (account?.wallet_client_type === "privy") {
        embeddedWalletAddresses.push(address);
      }
    }
  }

  return {
    linkedWalletAddresses: uniqueAddresses(walletAddresses),
    linkedEmbeddedWalletAddresses: uniqueAddresses(embeddedWalletAddresses),
    linkedSmartWalletAddresses: uniqueAddresses(smartWalletAddresses),
  };
}

export function createPrivyAuthService({
  appId = null,
  appSecret = null,
  jwksUrl = null,
  apiBaseUrl = DEFAULT_PRIVY_API_BASE_URL,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
} = {}) {
  let cachedKeyRecords = null;
  let cachedAtMs = 0;

  function isConfigured() {
    return Boolean(appId && appSecret && jwksUrl);
  }

  async function loadKeyRecords({ forceRefresh = false } = {}) {
    if (
      !forceRefresh &&
      cachedKeyRecords &&
      now() - cachedAtMs < JWKS_REFRESH_INTERVAL_MS
    ) {
      return cachedKeyRecords;
    }

    if (typeof fetchImpl !== "function") {
      throw new HttpError(503, "Privy JWKS fetching is not available in this runtime.");
    }

    const response = await fetchImpl(jwksUrl);

    if (!response.ok) {
      throw new HttpError(
        503,
        `Privy JWKS fetch failed with status ${response.status}.`,
      );
    }

    const records = createKeyRecordsFromParsedValue(await response.json());
    cachedKeyRecords = records;
    cachedAtMs = now();
    return records;
  }

  async function verifyJwt(token, { tokenLabel }) {
    const parsed = parseJwt(token);
    const alg = typeof parsed.header?.alg === "string" ? parsed.header.alg : null;

    if (!alg) {
      throw new HttpError(401, `Privy ${tokenLabel} is missing an alg header.`);
    }

    verifyJwtClaims(parsed.payload, {
      appId,
      nowMs: now(),
      tokenLabel,
    });

    let candidates = await loadKeyRecords();
    const headerKid =
      typeof parsed.header?.kid === "string" ? parsed.header.kid : null;

    if (headerKid) {
      const keyedCandidates = candidates.filter(
        (candidate) => candidate.kid === headerKid || candidate.kid === null,
      );

      if (keyedCandidates.length > 0) {
        candidates = keyedCandidates;
      } else if (jwksUrl) {
        candidates = await loadKeyRecords({ forceRefresh: true });
      }
    }

    for (const candidate of candidates) {
      try {
        if (
          verifyTokenSignature({
            alg,
            signingInput: parsed.signingInput,
            signature: parsed.signature,
            key: candidate.key,
          })
        ) {
          return parsed.payload;
        }
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }
      }
    }

    throw new HttpError(401, `Privy ${tokenLabel} signature verification failed.`);
  }

  async function fetchPrivyUser(userId) {
    if (typeof fetchImpl !== "function") {
      throw new HttpError(503, "Privy API fetching is not available in this runtime.");
    }

    const response = await fetchImpl(
      `${apiBaseUrl.replace(/\/+$/u, "")}/v1/users/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`,
          "privy-app-id": appId,
        },
      },
    );

    if (response.status === 404) {
      throw new HttpError(
        401,
        "Authenticated Privy user could not be loaded from Privy.",
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        503,
        "Privy API rejected the configured app credentials.",
      );
    }

    if (!response.ok) {
      throw new HttpError(
        503,
        `Privy user lookup failed with status ${response.status}.`,
      );
    }

    const payload = await response.json();
    return payload?.id === userId ? payload : null;
  }

  return {
    isConfigured,
    async authenticateRequest(
      request,
      { required = false } = {},
    ) {
      const accessToken = extractAccessToken(request);
      const identityToken = extractIdentityToken(request);

      if (!isConfigured()) {
        if (required || accessToken || identityToken) {
          throw new HttpError(
            503,
            "Privy auth verification requires PRIVY_APP_ID, PRIVY_APP_SECRET, and PRIVY_JWKS_URL.",
          );
        }

        return null;
      }

      if (!accessToken) {
        if (identityToken) {
          throw new HttpError(401, "Privy access token is required.");
        }

        if (required) {
          throw new HttpError(401, "Privy access token is required.");
        }

        return null;
      }

      const accessPayload = await verifyJwt(accessToken.token, {
        tokenLabel: "access token",
      });
      const privyUser = await fetchPrivyUser(accessPayload.sub);

      if (!privyUser) {
        throw new HttpError(
          401,
          "Authenticated Privy user could not be loaded from Privy.",
        );
      }

      let identityPayload = null;

      if (identityToken) {
        identityPayload = await verifyJwt(identityToken.token, {
          tokenLabel: "identity token",
        });

        if (identityPayload.sub !== accessPayload.sub) {
          throw new HttpError(
            401,
            "Privy identity token does not match the authenticated access token.",
          );
        }
      }

      const linkedAccounts = Array.isArray(privyUser.linked_accounts)
        ? privyUser.linked_accounts
        : parseLinkedAccountsClaim(identityPayload?.linked_accounts);
      const linkedAddresses = collectLinkedAddresses(linkedAccounts);
      const authenticatedAt =
        typeof accessPayload.iat === "number"
          ? new Date(accessPayload.iat * 1000).toISOString()
          : new Date(now()).toISOString();

      return {
        owner: {
          providerId: "privy",
          appId,
          userId: accessPayload.sub,
          sessionId:
            typeof accessPayload.sid === "string" ? accessPayload.sid : null,
          issuer: accessPayload.iss,
          authenticatedAt,
        },
        accessTokenSource: accessToken.source,
        accessTokenVerified: true,
        identityTokenSource: identityToken?.source ?? null,
        identityTokenVerified: Boolean(identityPayload),
        linkedAccountsSource: "privy_api",
        privyUserId: privyUser.id,
        linkedAccounts,
        ...linkedAddresses,
      };
    },
  };
}
