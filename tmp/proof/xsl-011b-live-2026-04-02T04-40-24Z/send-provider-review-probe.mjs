import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { privateKeyToAccount } from "../../../node_modules/.pnpm/node_modules/viem/_esm/accounts/privateKeyToAccount.js";

import {
  CHAINLINK_CRE_ETH_JWT_ALGORITHM,
  computeChainlinkCreEventDigest,
} from "../../../packages/shared/src/rebalance-provider.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const providerSigner = await loadJson(
  resolve(CURRENT_DIR, "provider-signer.secret.json"),
);
const hotTreasury = await loadJson(
  resolve(CURRENT_DIR, "hot-treasury.secret.json"),
);

const apiBaseUrl =
  process.env.XSL011B_PROVIDER_REVIEW_API_BASE_URL ??
  "https://api-production-e70b.up.railway.app";
const slotId =
  process.env.XSL011B_PROVIDER_REVIEW_SLOT_ID ?? "onboarding.default_basket";
const chain = process.env.XSL011B_PROVIDER_REVIEW_CHAIN ?? "ethereum";
const targetManifestId =
  process.env.XSL011B_PROVIDER_REVIEW_TARGET_MANIFEST_ID ??
  "onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted";
const baselineManifestId =
  process.env.XSL011B_PROVIDER_REVIEW_BASELINE_MANIFEST_ID ??
  "onboarding.default_basket:basket-baseline-v1";
const workflowId =
  process.env.XSL011B_PROVIDER_REVIEW_WORKFLOW_ID ??
  "xsl011b-provider-review-hot-20260402";
const now = new Date();
const compactTimestamp = now.toISOString().replace(/[-:.]/gu, "").replace("Z", "Z");
const workflowExecutionId =
  process.env.XSL011B_PROVIDER_REVIEW_WORKFLOW_EXECUTION_ID ??
  `exec_${compactTimestamp}`;
const providerEventId =
  process.env.XSL011B_PROVIDER_REVIEW_EVENT_ID ?? `evt_${compactTimestamp}`;
const reviewReasonKind =
  process.env.XSL011B_PROVIDER_REVIEW_REASON_KIND ?? "manifest_drift";
const observedDriftBps = Number(
  process.env.XSL011B_PROVIDER_REVIEW_OBSERVED_DRIFT_BPS ?? 425,
);
const thresholdBps = Number(
  process.env.XSL011B_PROVIDER_REVIEW_THRESHOLD_BPS ?? 300,
);
const triggeredAt =
  process.env.XSL011B_PROVIDER_REVIEW_TRIGGERED_AT ?? now.toISOString();
const jti = process.env.XSL011B_PROVIDER_REVIEW_JTI ?? `jti_${workflowExecutionId}`;

const body = {
  version: "1",
  providerId: "chainlink_cre",
  providerEventId,
  workflowId,
  workflowExecutionId,
  triggerType: "cron",
  triggeredAt,
  slotId,
  chain,
  targetManifestId,
  baselineManifestId,
  reviewReason: {
    kind: reviewReasonKind,
    observedDriftBps,
    thresholdBps,
  },
  reviewIntent: {
    requestedState: "awaiting_operator",
    executionMode: "review_only",
  },
};

const digest = computeChainlinkCreEventDigest(body);
const issuedAt = Math.floor(now.getTime() / 1000);
const expiresAt = issuedAt + 240;
const claims = {
  digest,
  iss: "chainlink-cre.xstocks.live",
  iat: issuedAt,
  exp: expiresAt,
  jti,
  providerId: body.providerId,
  workflowId: body.workflowId,
  workflowExecutionId: body.workflowExecutionId,
  slotId: body.slotId,
  targetManifestId: body.targetManifestId,
  chain: body.chain,
};
const account = privateKeyToAccount(providerSigner.privateKey);
const header = {
  alg: CHAINLINK_CRE_ETH_JWT_ALGORITHM,
  kid: account.address,
  typ: "JWT",
};
const encodedHeader = encodeBase64UrlJson(header);
const encodedPayload = encodeBase64UrlJson(claims);
const signingInput = `${encodedHeader}.${encodedPayload}`;
const signature = await account.signMessage({
  message: signingInput,
});
const token =
  `${signingInput}.` +
  Buffer.from(signature.slice(2), "hex").toString("base64url");

const response = await fetch(
  `${apiBaseUrl}/api/internal/rebalances/provider-triggered-review`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  },
);
const responseText = await response.text();
let responseJson = null;

try {
  responseJson = JSON.parse(responseText);
} catch {
  responseJson = null;
}

await writeJson(resolve(CURRENT_DIR, "provider-review-probe.request.json"), {
  apiBaseUrl,
  route: "/api/internal/rebalances/provider-triggered-review",
  signerAddress: providerSigner.issuerAddress,
  workflowId,
  workflowExecutionId,
  providerEventId,
  hotTreasuryWalletAddress: hotTreasury.walletAddress,
  body,
});
await writeJson(resolve(CURRENT_DIR, "provider-review-probe.jwt-header.json"), header);
await writeJson(resolve(CURRENT_DIR, "provider-review-probe.jwt-claims.json"), claims);
await writeJson(resolve(CURRENT_DIR, "provider-review-probe.response.json"), {
  status: response.status,
  ok: response.ok,
  body: responseJson,
  rawText: responseJson ? null : responseText,
});

console.log(
  JSON.stringify(
    {
      status: response.status,
      ok: response.ok,
      signerAddress: providerSigner.issuerAddress,
      hotTreasuryWalletAddress: hotTreasury.walletAddress,
      workflowId,
      workflowExecutionId,
      providerEventId,
      digest,
      response: responseJson,
    },
    null,
    2,
  ),
);
