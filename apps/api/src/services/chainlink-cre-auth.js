import { recoverMessageAddress } from "../../../../node_modules/.pnpm/node_modules/viem/_esm/index.js";
import {
  buildChainlinkCreEventDedupeKey,
  CHAINLINK_CRE_ETH_JWT_ALGORITHM,
  CHAINLINK_CRE_JWT_CLAIMS_SCHEMA,
  CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA,
  computeChainlinkCreEventDigest,
} from "../../../../packages/shared/src/rebalance-provider.js";

const MAX_TOKEN_WINDOW_SECONDS = 300;
const MAX_TOKEN_FUTURE_SKEW_SECONDS = 60;

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{40})$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

function normalizeStringList(values) {
  if (Array.isArray(values)) {
    return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
  }

  if (typeof values === "string") {
    return normalizeStringList(values.split(","));
  }

  return [];
}

function normalizeAddressList(values) {
  return normalizeStringList(values)
    .map((value) => normalizeEthereumAddress(value))
    .filter(Boolean);
}

function readBearerTokenFromRequest(request) {
  const authorization = request.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function parseBase64UrlJson(segment, label) {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new ChainlinkCreValidationError(
      401,
      `invalid_${label}`,
      `Chainlink CRE token ${label} segment is invalid.`,
    );
  }
}

function decodeSignatureSegment(segment) {
  try {
    const raw = Buffer.from(segment, "base64url");

    if (raw.length === 65) {
      return `0x${raw.toString("hex")}`;
    }

    const utf8Hex = raw.toString("utf8").trim();
    return /^0x([A-Fa-f0-9]{130})$/u.test(utf8Hex) ? utf8Hex.toLowerCase() : null;
  } catch {
    return null;
  }
}

function toIsoTimestamp(seconds) {
  return Number.isFinite(seconds)
    ? new Date(seconds * 1000).toISOString()
    : null;
}

function buildReceiptCandidate({
  requestBody = null,
  claims = null,
  signerAddress = null,
  digest = null,
  reason = "Chainlink CRE event validation failed.",
  errorCode = null,
  duplicateOfReceiptId = null,
} = {}) {
  return {
    providerId: requestBody?.providerId ?? claims?.providerId ?? null,
    providerEventId: requestBody?.providerEventId ?? null,
    workflowId: requestBody?.workflowId ?? claims?.workflowId ?? null,
    workflowExecutionId:
      requestBody?.workflowExecutionId ?? claims?.workflowExecutionId ?? null,
    slotId: requestBody?.slotId ?? claims?.slotId ?? null,
    chain: requestBody?.chain ?? claims?.chain ?? null,
    targetManifestId:
      requestBody?.targetManifestId ?? claims?.targetManifestId ?? null,
    dedupeKey:
      requestBody &&
      requestBody.workflowId &&
      requestBody.workflowExecutionId &&
      requestBody.slotId &&
      requestBody.targetManifestId &&
      requestBody.chain
        ? buildChainlinkCreEventDedupeKey(requestBody)
        : null,
    digest,
    signerAddress,
    issuer: claims?.iss ?? null,
    jti: claims?.jti ?? null,
    tokenIssuedAt: toIsoTimestamp(claims?.iat),
    tokenExpiresAt: toIsoTimestamp(claims?.exp),
    decision: "rejected",
    errorCode,
    reason,
    duplicateOfReceiptId,
  };
}

export class ChainlinkCreValidationError extends Error {
  constructor(
    statusCode,
    errorCode,
    message,
    receiptCandidate = null,
    details = null,
  ) {
    super(message);
    this.name = "ChainlinkCreValidationError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.receiptCandidate = receiptCandidate;
    this.details = details;
  }
}

export async function authenticateChainlinkCreProviderEvent({
  request,
  requestBody,
  signerAllowlist,
  workflowAllowlist,
  now = () => new Date().toISOString(),
}) {
  const configuredSignerAllowlist = new Set(normalizeAddressList(signerAllowlist));
  const configuredWorkflowAllowlist = new Set(normalizeStringList(workflowAllowlist));

  if (configuredSignerAllowlist.size === 0) {
    throw new ChainlinkCreValidationError(
      503,
      "missing_signer_allowlist",
      "Chainlink CRE signer allowlist is not configured on this backend.",
    );
  }

  if (configuredWorkflowAllowlist.size === 0) {
    throw new ChainlinkCreValidationError(
      503,
      "missing_workflow_allowlist",
      "Chainlink CRE workflow allowlist is not configured on this backend.",
    );
  }

  let parsedBody;

  try {
    parsedBody = CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA.parse(requestBody ?? {});
  } catch (error) {
    throw new ChainlinkCreValidationError(
      400,
      "invalid_provider_event_body",
      error instanceof Error
        ? error.message
        : "Chainlink CRE provider event body is invalid.",
      buildReceiptCandidate({
        requestBody:
          requestBody && typeof requestBody === "object" ? requestBody : null,
        digest:
          requestBody && typeof requestBody === "object"
            ? computeChainlinkCreEventDigest(requestBody)
            : null,
        errorCode: "invalid_provider_event_body",
        reason:
          error instanceof Error
            ? error.message
            : "Chainlink CRE provider event body is invalid.",
      }),
    );
  }

  const suppliedToken = readBearerTokenFromRequest(request);

  if (!suppliedToken) {
    throw new ChainlinkCreValidationError(
      401,
      "missing_provider_token",
      "Chainlink CRE bearer token is required.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        digest: computeChainlinkCreEventDigest(parsedBody),
        errorCode: "missing_provider_token",
        reason: "Chainlink CRE bearer token is required.",
      }),
    );
  }

  const tokenSegments = suppliedToken.split(".");

  if (tokenSegments.length !== 3) {
    throw new ChainlinkCreValidationError(
      401,
      "invalid_provider_token",
      "Chainlink CRE token must contain header, payload, and signature segments.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        digest: computeChainlinkCreEventDigest(parsedBody),
        errorCode: "invalid_provider_token",
        reason:
          "Chainlink CRE token must contain header, payload, and signature segments.",
      }),
    );
  }

  const [encodedHeader, encodedPayload, encodedSignature] = tokenSegments;
  const parsedHeader = parseBase64UrlJson(encodedHeader, "header");
  const rawClaims = parseBase64UrlJson(encodedPayload, "payload");
  const claims = CHAINLINK_CRE_JWT_CLAIMS_SCHEMA.safeParse(rawClaims);
  const digest = computeChainlinkCreEventDigest(parsedBody);

  if (!claims.success) {
    throw new ChainlinkCreValidationError(
      401,
      "invalid_provider_claims",
      "Chainlink CRE token claims are invalid.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        digest,
        errorCode: "invalid_provider_claims",
        reason: "Chainlink CRE token claims are invalid.",
      }),
      claims.error.flatten(),
    );
  }

  const signature = decodeSignatureSegment(encodedSignature);

  if (!signature) {
    throw new ChainlinkCreValidationError(
      401,
      "invalid_provider_signature_encoding",
      "Chainlink CRE token signature segment is invalid.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "invalid_provider_signature_encoding",
        reason: "Chainlink CRE token signature segment is invalid.",
      }),
    );
  }

  if (parsedHeader?.alg !== CHAINLINK_CRE_ETH_JWT_ALGORITHM) {
    throw new ChainlinkCreValidationError(
      401,
      "unsupported_provider_algorithm",
      `Chainlink CRE token alg must be ${CHAINLINK_CRE_ETH_JWT_ALGORITHM}.`,
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "unsupported_provider_algorithm",
        reason: `Chainlink CRE token alg must be ${CHAINLINK_CRE_ETH_JWT_ALGORITHM}.`,
      }),
    );
  }

  const normalizedKid =
    parsedHeader?.kid === undefined
      ? null
      : normalizeEthereumAddress(parsedHeader.kid);

  if (parsedHeader?.kid !== undefined && !normalizedKid) {
    throw new ChainlinkCreValidationError(
      400,
      "invalid_provider_kid",
      "Chainlink CRE token kid must be a 20-byte EVM address when supplied.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "invalid_provider_kid",
        reason:
          "Chainlink CRE token kid must be a 20-byte EVM address when supplied.",
      }),
    );
  }

  const scopeMismatches = [
    parsedBody.providerId !== claims.data.providerId ? "providerId" : null,
    parsedBody.workflowId !== claims.data.workflowId ? "workflowId" : null,
    parsedBody.workflowExecutionId !== claims.data.workflowExecutionId
      ? "workflowExecutionId"
      : null,
    parsedBody.slotId !== claims.data.slotId ? "slotId" : null,
    parsedBody.targetManifestId !== claims.data.targetManifestId
      ? "targetManifestId"
      : null,
    parsedBody.chain !== claims.data.chain ? "chain" : null,
  ].filter(Boolean);

  if (scopeMismatches.length > 0) {
    throw new ChainlinkCreValidationError(
      403,
      "provider_scope_mismatch",
      `Signed Chainlink CRE claims do not match request body fields: ${scopeMismatches.join(", ")}.`,
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "provider_scope_mismatch",
        reason: `Signed Chainlink CRE claims do not match request body fields: ${scopeMismatches.join(", ")}.`,
      }),
    );
  }

  if (digest !== claims.data.digest.toLowerCase()) {
    throw new ChainlinkCreValidationError(
      403,
      "provider_digest_mismatch",
      "Signed Chainlink CRE digest does not match the canonical request body.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "provider_digest_mismatch",
        reason:
          "Signed Chainlink CRE digest does not match the canonical request body.",
      }),
    );
  }

  if (!configuredWorkflowAllowlist.has(claims.data.workflowId)) {
    throw new ChainlinkCreValidationError(
      403,
      "workflow_not_allowlisted",
      `Workflow ${claims.data.workflowId} is not allowlisted for Chainlink CRE review intake.`,
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "workflow_not_allowlisted",
        reason: `Workflow ${claims.data.workflowId} is not allowlisted for Chainlink CRE review intake.`,
      }),
    );
  }

  const nowSeconds = Math.floor(new Date(now()).getTime() / 1000);

  if (claims.data.exp - claims.data.iat > MAX_TOKEN_WINDOW_SECONDS) {
    throw new ChainlinkCreValidationError(
      401,
      "token_window_too_large",
      "Chainlink CRE token validity window exceeds five minutes.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "token_window_too_large",
        reason: "Chainlink CRE token validity window exceeds five minutes.",
      }),
    );
  }

  if (claims.data.exp < nowSeconds) {
    throw new ChainlinkCreValidationError(
      401,
      "provider_token_expired",
      "Chainlink CRE token has expired.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "provider_token_expired",
        reason: "Chainlink CRE token has expired.",
      }),
    );
  }

  if (claims.data.iat > nowSeconds + MAX_TOKEN_FUTURE_SKEW_SECONDS) {
    throw new ChainlinkCreValidationError(
      401,
      "provider_token_future_skew",
      "Chainlink CRE token iat is too far in the future.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "provider_token_future_skew",
        reason: "Chainlink CRE token iat is too far in the future.",
      }),
    );
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  let signerAddress = null;

  try {
    signerAddress = normalizeEthereumAddress(
      await recoverMessageAddress({
        message: signingInput,
        signature,
      }),
    );
  } catch {
    signerAddress = null;
  }

  if (!signerAddress) {
    throw new ChainlinkCreValidationError(
      401,
      "provider_signature_invalid",
      "Chainlink CRE signature could not be recovered.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        digest,
        errorCode: "provider_signature_invalid",
        reason: "Chainlink CRE signature could not be recovered.",
      }),
    );
  }

  if (normalizedKid && normalizedKid !== signerAddress) {
    throw new ChainlinkCreValidationError(
      403,
      "provider_kid_mismatch",
      "Chainlink CRE token kid does not match the recovered signer address.",
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        signerAddress,
        digest,
        errorCode: "provider_kid_mismatch",
        reason:
          "Chainlink CRE token kid does not match the recovered signer address.",
      }),
    );
  }

  if (!configuredSignerAllowlist.has(signerAddress)) {
    throw new ChainlinkCreValidationError(
      403,
      "provider_signer_not_allowlisted",
      `Signer ${signerAddress} is not allowlisted for Chainlink CRE review intake.`,
      buildReceiptCandidate({
        requestBody: parsedBody,
        claims: claims.data,
        signerAddress,
        digest,
        errorCode: "provider_signer_not_allowlisted",
        reason: `Signer ${signerAddress} is not allowlisted for Chainlink CRE review intake.`,
      }),
    );
  }

  return {
    body: parsedBody,
    claims: claims.data,
    digest,
    dedupeKey: buildChainlinkCreEventDedupeKey(parsedBody),
    signerAddress,
  };
}
