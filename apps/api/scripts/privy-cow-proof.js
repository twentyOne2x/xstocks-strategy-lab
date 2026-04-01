import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createPrivyAuthService } from "../src/services/privy-auth.js";
import { createApiServer } from "../src/server.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const DEFAULT_SLOT_ID = "onboarding.default_basket";
const DEFAULT_SHARED_ENV_PATH = process.env.XSTOCKS_SHARED_ENV_PATH ?? null;
const DEFAULT_NOTIONAL_USD = 25;
const DEFAULT_QUOTE_SWEEP_LADDER_USD = [25, 50, 100, 250, 500];
const MAX_PROOF_NOTIONAL_USD = 25;
const MAX_QUOTE_SWEEP_NOTIONAL_USD = 500;

function parseEnvFile(raw) {
  const entries = {};

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value =
      rawValue.length >= 2 &&
      ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'")))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!key || Object.hasOwn(process.env, key)) {
      continue;
    }

    entries[key] = value;
  }

  return entries;
}

function loadEnvFromFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    Object.assign(process.env, parseEnvFile(raw));
    return true;
  } catch {
    return false;
  }
}

function bootstrapEnvironment() {
  if (DEFAULT_SHARED_ENV_PATH) {
    loadEnvFromFile(DEFAULT_SHARED_ENV_PATH);
  }

  loadEnvFromFile(resolve(REPO_ROOT, ".vercel/.env.production.local"));
  loadEnvFromFile(resolve(REPO_ROOT, "apps/web/.env.local"));
}

function requiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required for the authenticated CoW proof runner.`);
  }

  return value.trim();
}

function optionalEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function requiredOneOf(...names) {
  for (const name of names) {
    const value = optionalEnv(name);

    if (value) {
      return value;
    }
  }

  throw new Error(
    `${names.join(" or ")} is required for the authenticated CoW proof runner.`,
  );
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

function redactAddress(value) {
  const normalized = normalizeEthereumAddress(value);
  return normalized
    ? `${normalized.slice(0, 6)}...${normalized.slice(-4)}`
    : null;
}

function normalizeNotionalUsd(value) {
  return normalizeBoundedNotionalUsd(value, {
    fallback: DEFAULT_NOTIONAL_USD,
    max: MAX_PROOF_NOTIONAL_USD,
    envLabel: "XSTOCKS_NOTIONAL_USD",
  });
}

function normalizeBoundedNotionalUsd(
  value,
  { fallback, max, envLabel = "XSTOCKS_NOTIONAL_USD" },
) {
  const notional = Number(value ?? fallback);

  if (!Number.isFinite(notional) || notional <= 0) {
    throw new Error(`${envLabel} must be a positive number.`);
  }

  if (notional > max) {
    throw new Error(
      `${envLabel} must not exceed the approved cap of $${max}.`,
    );
  }

  return Number(notional.toFixed(2));
}

function parseQuoteSweepLadder(value) {
  if (!value) {
    return null;
  }

  const rungValues = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (rungValues.length === 0) {
    throw new Error(
      "XSTOCKS_NOTIONAL_LADDER_USD must contain at least one numeric rung.",
    );
  }

  return [...new Set(rungValues)]
    .map((item) =>
      normalizeBoundedNotionalUsd(item, {
        fallback: DEFAULT_NOTIONAL_USD,
        max: MAX_QUOTE_SWEEP_NOTIONAL_USD,
        envLabel: "XSTOCKS_NOTIONAL_LADDER_USD",
      }),
    )
    .sort((left, right) => left - right);
}

function sanitizeBaseUrl(value) {
  if (!value) {
    return null;
  }

  return String(value).trim().replace(/\/+$/u, "");
}

function createAuthHeaders(accessToken, identityToken = null) {
  return {
    authorization: `Bearer ${accessToken}`,
    ...(identityToken
      ? {
          "x-privy-identity-token": identityToken,
        }
      : {}),
  };
}

async function listen(server) {
  await new Promise((resolveListen, rejectListen) => {
    server.listen(0, (error) => {
      if (error) {
        rejectListen(error);
        return;
      }

      resolveListen();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Proof runner could not resolve the local API address.");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) {
        rejectClose(error);
        return;
      }

      resolveClose();
    });
  });
}

async function requestApi(baseUrl, pathname, { headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? headers
        : {
            "Content-Type": "application/json",
            ...headers,
          },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(
      payload?.error ?? `Request to ${pathname} failed with status ${response.status}.`,
    );
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    statusCode: response.status,
    payload,
    data: payload.data,
  };
}

function pickAddress(label, preferredValue, fallbacks = []) {
  const normalizedPreferred = normalizeEthereumAddress(preferredValue);

  if (normalizedPreferred) {
    return normalizedPreferred;
  }

  for (const value of fallbacks) {
    const normalized = normalizeEthereumAddress(value);

    if (normalized) {
      return normalized;
    }
  }

  throw new Error(`${label} is required but no verified address was available.`);
}

function buildWalletState({
  walletAddress,
  smartWalletAddress,
  fundedNotionalUsd,
  linkedEmbeddedWalletAddresses,
}) {
  const embeddedWalletAddress = linkedEmbeddedWalletAddresses.includes(walletAddress)
    ? walletAddress
    : null;

  return {
    walletConnected: true,
    walletAddress,
    fundedNotionalUsd,
    ...(embeddedWalletAddress
      ? {
          embeddedWallet: {
            status: "ready",
            address: embeddedWalletAddress,
            providerId: "privy_embedded",
          },
        }
      : {}),
    smartAccount: smartWalletAddress
      ? {
          status: "ready",
          address: smartWalletAddress,
          providerId: "privy_smart_account",
        }
      : {
          status: "not_started",
          address: null,
        },
  };
}

function summarizeLeg(leg) {
  return {
    legId: leg.legId,
    assetSymbol: leg.assetSymbol ?? null,
    state: leg.state,
    receivingTokenAddress: leg.receivingTokenAddress ?? null,
    quoteId: leg.quote?.quoteId ?? null,
    quoteVerified: leg.quote?.verified ?? null,
    approvalStatus: leg.approval?.status ?? null,
    signerAddress: redactAddress(leg.approval?.signerAddress ?? null),
    receiverAddress: redactAddress(
      leg.quote?.order?.receiver ?? leg.venueStatus?.rawStatus?.receiver ?? null,
    ),
    venueOrderId: leg.approval?.venueOrderId ?? null,
    venueStatus: leg.venueStatus?.status ?? null,
    quoteBuyToken:
      leg.quote?.order?.buyToken ?? leg.venueStatus?.rawStatus?.buyToken ?? null,
    sellAmountBeforeFee: leg.venueStatus?.rawStatus?.sellAmountBeforeFee ?? null,
    targetNotionalUsd:
      leg.venueStatus?.rawStatus?.targetNotionalUsd ?? leg.targetNotionalUsd ?? null,
    txHash: leg.receipt?.txHash ?? null,
    receiptStatus: leg.receipt?.receiptStatus ?? null,
    firstBlocker: leg.blockers?.[0] ?? null,
    blockers: leg.blockers ?? [],
    warnings: leg.warnings ?? [],
  };
}

function summarizeExecutionRequest(executionRequest) {
  return {
    executionRequestId: executionRequest.executionRequestId,
    state: executionRequest.state,
    legs: executionRequest.legs.map(summarizeLeg),
  };
}

function buildActivationRequestBody({
  manifestId,
  slotId,
  notionalUsd,
  walletState,
}) {
  return {
    ...(manifestId ? { manifestId } : { slotId }),
    userNotionalUsd: notionalUsd,
    walletState,
  };
}

function buildQuoteabilityArtifact(executionRequest) {
  const actionableLegs = executionRequest.legs.filter(
    (leg) => leg.state !== "deferred",
  );
  const approvalReadyLegs = actionableLegs.filter(
    (leg) => leg.state === "awaiting_approval",
  );
  const blockedLegs = actionableLegs.filter((leg) => leg.state === "blocked");

  return {
    executionRequestId: executionRequest.executionRequestId,
    executionRequestState: executionRequest.state,
    actionableLegCount: actionableLegs.length,
    approvalReadyLegCount: approvalReadyLegs.length,
    blockedLegCount: blockedLegs.length,
    deferredLegCount: executionRequest.legs.length - actionableLegs.length,
    allActionableLegsQuoteable:
      actionableLegs.length > 0 &&
      actionableLegs.every((leg) => leg.state === "awaiting_approval"),
    approvalReadyLegs: approvalReadyLegs.map(summarizeLeg),
    blockedLegs: blockedLegs.map(summarizeLeg),
    legs: executionRequest.legs,
  };
}

function buildApprovalBoundaryArtifact(executionRequest) {
  const approvalReadyLegs = executionRequest.legs.filter(
    (leg) => leg.state === "awaiting_approval",
  );

  return {
    reached: approvalReadyLegs.length > 0,
    count: approvalReadyLegs.length,
    executionRequestId: executionRequest.executionRequestId,
    executionRequestState: executionRequest.state,
    legs: approvalReadyLegs,
  };
}

function buildSubmissionBoundaryArtifact({
  quoteability,
  orderSignature,
  submissionResponse,
  submittedLeg,
}) {
  if (!quoteability.allActionableLegsQuoteable) {
    return {
      reached: false,
      state: "not_reached",
      reason: "basket_not_all_leg_quoteable",
      blockedLegs: quoteability.blockedLegs,
    };
  }

  if (!orderSignature) {
    return {
      reached: false,
      state: "not_requested",
      reason: "user_signature_not_supplied",
    };
  }

  if (!submissionResponse || !submittedLeg) {
    return {
      reached: false,
      state: "not_reached",
      reason: "submission_response_missing",
    };
  }

  return {
    reached: true,
    state: submittedLeg.state,
    executionRequestId: submissionResponse.data.executionRequest.executionRequestId,
    leg: summarizeLeg(submittedLeg),
    activityEvents: (submissionResponse.data.activityEvents ?? []).map((event) => ({
      eventType: event.eventType,
      summary: event.summary,
    })),
    executionRequest: summarizeExecutionRequest(submissionResponse.data.executionRequest),
  };
}

function buildReceiptOrBlockerArtifact({
  quoteability,
  submissionBoundary,
  submittedLeg,
}) {
  if (submittedLeg?.receipt) {
    return {
      kind: "receipt",
      leg: summarizeLeg(submittedLeg),
      receipt: submittedLeg.receipt,
    };
  }

  if (!quoteability.allActionableLegsQuoteable) {
    return {
      kind: "blocker",
      reason: "basket_not_all_leg_quoteable",
      blockedLegs: quoteability.blockedLegs,
    };
  }

  if (!submissionBoundary.reached) {
    return {
      kind: "blocker",
      reason: submissionBoundary.reason ?? "submission_not_reached",
    };
  }

  return {
    kind: "blocker",
    reason: submittedLeg?.blockers?.[0] ?? "receipt_not_reached",
    leg: submittedLeg ? summarizeLeg(submittedLeg) : null,
  };
}

function buildStrongestClaim({ quoteability, submissionBoundary, receiptOrBlocker }) {
  if (
    submissionBoundary.reached &&
    (submissionBoundary.state === "confirmed" ||
      receiptOrBlocker.kind === "receipt")
  ) {
    return "Hosted linked-wallet activation, quoteability, signed submission, and receipt are proven for the promoted CoW lane.";
  }

  if (quoteability.allActionableLegsQuoteable) {
    return "Hosted linked-wallet activation and all-leg quoteability are proven at $25, but user-approved submission remains unproven.";
  }

  if (quoteability.approvalReadyLegCount > 0) {
    return `Hosted linked-wallet activation and partial CoW quote boundary are proven at $25, but the promoted basket is not all-leg quoteable: ${quoteability.approvalReadyLegCount}/${quoteability.actionableLegCount} core legs reached awaiting approval and ${quoteability.blockedLegCount}/${quoteability.actionableLegCount} hit exact venue blockers.`;
  }

  return "Hosted linked-wallet activation is proven, but no actionable leg reached the quote boundary.";
}

function buildQuoteSweepStrongestClaim({
  ladder,
  minimumExecutableGrossNotionalUsd,
  structurallyBlockedAssets,
  quoteSweepMatrix,
}) {
  if (minimumExecutableGrossNotionalUsd !== null) {
    return `Hosted linked-wallet quote-only sweep proves the promoted basket becomes all-leg quoteable at ${minimumExecutableGrossNotionalUsd} USD gross.`;
  }

  if (structurallyBlockedAssets.length > 0) {
    return `Hosted linked-wallet quote-only sweep across ${ladder.join(", ")} USD gross proves the promoted basket does not become all-leg quoteable in the tested band; structurally blocked assets on current CoW venue truth are ${structurallyBlockedAssets.join(", ")}.`;
  }

  const highestRung = quoteSweepMatrix.at(-1)?.requestedNotionalUsd ?? ladder.at(-1);
  return `Hosted linked-wallet quote-only sweep across ${ladder.join(", ")} USD gross did not find an all-leg quoteable floor by ${highestRung} USD gross.`;
}

function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildSummaryMarkdown(proofBundle) {
  return [
    "# Authenticated CoW Proof",
    "",
    `- Generated at: ${proofBundle.generatedAt}`,
    `- Proof mode: ${proofBundle.proofMode}`,
    `- API base URL: ${proofBundle.apiBaseUrl}`,
    `- Slot ID: ${proofBundle.slotId}`,
    `- Manifest ID: ${proofBundle.manifestId}`,
    `- Requested notional USD: ${proofBundle.requestedNotionalUsd}`,
    `- Activation ID: ${proofBundle.activationId}`,
    `- Execution request ID: ${proofBundle.executionRequestId}`,
    `- Strongest truthful claim: ${proofBundle.strongestClaim}`,
    "",
    "## Quoteability",
    "",
    `- All actionable legs quoteable: ${proofBundle.quoteability.allActionableLegsQuoteable ? "yes" : "no"}`,
    `- Approval-ready legs: ${proofBundle.quoteability.approvalReadyLegCount}`,
    `- Blocked legs: ${proofBundle.quoteability.blockedLegCount}`,
    `- Deferred legs: ${proofBundle.quoteability.deferredLegCount}`,
    "",
    "## Submission Boundary",
    "",
    `- Reached: ${proofBundle.submissionBoundary.reached ? "yes" : "no"}`,
    `- State: ${proofBundle.submissionBoundary.state}`,
    `- Reason: ${proofBundle.submissionBoundary.reason ?? "n/a"}`,
    "",
    "## Receipt Or Blocker",
    "",
    `- Kind: ${proofBundle.receiptOrBlocker.kind}`,
    `- Reason: ${proofBundle.receiptOrBlocker.reason ?? "n/a"}`,
  ].join("\n");
}

async function writeArtifact(filePath, value) {
  await writeFile(filePath, toJson(value), "utf8");
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function findExecutionRequest(runtimeStore, executionRequestId) {
  if (!Array.isArray(runtimeStore?.executionRequests)) {
    return null;
  }

  return (
    runtimeStore.executionRequests.find(
      (request) =>
        request.executionRequestId === executionRequestId ||
        request.execution_request_id === executionRequestId,
    ) ?? null
  );
}

function captureRuntimeStoreSnapshot({
  hosted,
  localRuntimeStorePath,
  executionRequestId,
}) {
  if (!hosted) {
    const runtimeStore = parseJson(
      readFileSync(localRuntimeStorePath, "utf8"),
      localRuntimeStorePath,
    );

    return {
      captureMode: "local",
      captured: true,
      runtimeStore,
      executionRequest: findExecutionRequest(runtimeStore, executionRequestId),
    };
  }

  const captureMode = optionalEnv("XSTOCKS_RUNTIME_STORE_CAPTURE") ?? "railway";

  if (captureMode === "skip") {
    return {
      captureMode,
      captured: false,
      reason: "runtime_store_capture_skipped",
    };
  }

  const railwayServiceName = optionalEnv("XSTOCKS_RAILWAY_SERVICE") ?? "api";

  try {
    const raw = execFileSync(
      "/bin/sh",
      [
        "-lc",
        `railway ssh -s ${railwayServiceName} 'cat /app/apps/api/data/runtime-store.json'`,
      ],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
      },
    );
    const runtimeStore = parseJson(raw, "hosted runtime store");

    return {
      captureMode: "railway",
      captured: true,
      runtimeStore,
      executionRequest: findExecutionRequest(runtimeStore, executionRequestId),
    };
  } catch (error) {
    return {
      captureMode: "railway",
      captured: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runQuoteAttemptSequence({
  baseUrl,
  authHeaders,
  executionRequest,
}) {
  const executionRequestId = executionRequest.executionRequestId;
  const quoteAttemptArtifacts = [];
  let latestExecutionRequest = executionRequest;

  for (const leg of executionRequest.legs) {
    if (leg.state !== "pending") {
      quoteAttemptArtifacts.push({
        legId: leg.legId,
        assetSymbol: leg.assetSymbol ?? null,
        skipped: true,
        reason: `leg_state_${leg.state}`,
      });
      continue;
    }

    const quoteResponse = await requestApi(baseUrl, "/api/executions", {
      headers: authHeaders,
      body: {
        action: "quote_leg",
        executionRequestId,
        legId: leg.legId,
      },
    });
    const quotedLeg =
      quoteResponse.data.executionRequest.legs.find(
        (candidate) => candidate.legId === leg.legId,
      ) ?? null;

    if (!quotedLeg) {
      throw new Error(`Quoted execution leg ${leg.legId} could not be found.`);
    }

    latestExecutionRequest = quoteResponse.data.executionRequest;
    quoteAttemptArtifacts.push({
      legId: quotedLeg.legId,
      assetSymbol: quotedLeg.assetSymbol ?? null,
      state: quotedLeg.state,
      leg: quotedLeg,
    });
  }

  const executionLatestResponse = await requestApi(
    baseUrl,
    `/api/executions?executionRequestId=${encodeURIComponent(executionRequestId)}&limit=1`,
    {
      headers: authHeaders,
    },
  );
  const executionLatest =
    executionLatestResponse.data.items[0] ?? latestExecutionRequest;

  return {
    executionRequestId,
    quoteAttemptArtifacts,
    executionLatestResponse,
    executionLatest,
    quoteability: buildQuoteabilityArtifact(executionLatest),
    approvalBoundary: buildApprovalBoundaryArtifact(executionLatest),
  };
}

function summarizeBlockedLegForSweep(leg) {
  const rawStatus = leg.venueStatus?.rawStatus ?? {};

  return {
    assetSymbol: leg.assetSymbol ?? null,
    state: leg.state,
    targetNotionalUsd: rawStatus.targetNotionalUsd ?? leg.targetNotionalUsd ?? null,
    blockerClass: rawStatus.blockerClass ?? null,
    errorStatusCode: rawStatus.errorStatusCode ?? null,
    errorType: rawStatus.errorType ?? null,
    errorDescription: rawStatus.errorDescription ?? null,
    blocker: leg.blockers?.[0] ?? null,
  };
}

function summarizeActionableLegForSweep(leg) {
  const rawStatus = leg.venueStatus?.rawStatus ?? {};

  return {
    assetSymbol: leg.assetSymbol ?? null,
    state: leg.state,
    targetNotionalUsd: rawStatus.targetNotionalUsd ?? leg.targetNotionalUsd ?? null,
    blockerClass: rawStatus.blockerClass ?? null,
    errorStatusCode: rawStatus.errorStatusCode ?? null,
    errorType: rawStatus.errorType ?? null,
    errorDescription: rawStatus.errorDescription ?? null,
    blocker: leg.blockers?.[0] ?? null,
  };
}

function buildQuoteSweepRungArtifact({
  requestedNotionalUsd,
  activationResponse,
  executionCreateResponse,
  quoteAttemptArtifacts,
  executionLatestResponse,
  executionLatest,
  quoteability,
  approvalBoundary,
}) {
  const actionableLegs = executionLatest.legs.filter(
    (leg) => leg.state !== "deferred",
  );

  return {
    requestedNotionalUsd,
    activationId: activationResponse.data.activation.activationId,
    executionRequestId:
      executionCreateResponse.data.executionRequest.executionRequestId,
    quoteability,
    approvalBoundary,
    quoteAttemptArtifacts,
    actionableLegs: actionableLegs.map(summarizeActionableLegForSweep),
    blockedLegs: executionLatest.legs
      .filter((leg) => leg.state === "blocked")
      .map(summarizeBlockedLegForSweep),
    approvalReadyLegs: quoteability.approvalReadyLegs.map((leg) => ({
      assetSymbol: leg.assetSymbol ?? null,
      state: leg.state,
      targetNotionalUsd: leg.targetNotionalUsd ?? null,
      quoteId: leg.quoteId ?? null,
    })),
    allActionableLegsQuoteable: quoteability.allActionableLegsQuoteable,
    executionRequestLatest: executionLatestResponse.payload,
  };
}

function buildQuoteSweepSummary({ ladder, quoteSweepMatrix }) {
  const minimumExecutableRung =
    quoteSweepMatrix.find((rung) => rung.allActionableLegsQuoteable) ?? null;
  const structurallyBlockedAssets = [];

  if (!minimumExecutableRung) {
    const assetMap = new Map();

    for (const rung of quoteSweepMatrix) {
      for (const blockedLeg of rung.blockedLegs) {
        const current = assetMap.get(blockedLeg.assetSymbol) ?? {
          blockedAtEveryRung: true,
          blockerClasses: new Set(),
          errorTypes: new Set(),
        };

        if (blockedLeg.blockerClass) {
          current.blockerClasses.add(blockedLeg.blockerClass);
        }

        if (blockedLeg.errorType) {
          current.errorTypes.add(blockedLeg.errorType);
        }

        assetMap.set(blockedLeg.assetSymbol, current);
      }
    }

    const assetsPerRung = quoteSweepMatrix.map(
      (rung) => new Set(rung.blockedLegs.map((leg) => leg.assetSymbol)),
    );
    const allBlockedSymbols =
      assetsPerRung.length > 0
        ? [...assetsPerRung[0]].filter((symbol) =>
            assetsPerRung.every((symbols) => symbols.has(symbol)),
          )
        : [];

    for (const symbol of allBlockedSymbols) {
      const details = assetMap.get(symbol);
      structurallyBlockedAssets.push({
        assetSymbol: symbol,
        blockerClasses: [...(details?.blockerClasses ?? [])].sort(),
        errorTypes: [...(details?.errorTypes ?? [])].sort(),
      });
    }
  }

  return {
    ladder,
    minimumExecutableGrossNotionalUsd:
      minimumExecutableRung?.requestedNotionalUsd ?? null,
    structurallyBlockedAssets,
    quoteSweepMatrix: quoteSweepMatrix.map((rung) => ({
      requestedNotionalUsd: rung.requestedNotionalUsd,
      allActionableLegsQuoteable: rung.allActionableLegsQuoteable,
      approvalReadyAssets: rung.approvalReadyLegs.map((leg) => leg.assetSymbol),
      blockedAssets: rung.blockedLegs.map((leg) => ({
        assetSymbol: leg.assetSymbol,
        blockerClass: leg.blockerClass,
        errorType: leg.errorType,
      })),
    })),
  };
}

function buildQuoteSweepAssetMatrix({ ladder, quoteSweepMatrix }) {
  const assetSymbols = [
    ...new Set(
      quoteSweepMatrix.flatMap((rung) =>
        rung.actionableLegs.map((leg) => leg.assetSymbol).filter(Boolean),
      ),
    ),
  ];

  return assetSymbols.map((assetSymbol) => ({
    assetSymbol,
    rungs: ladder.map((requestedNotionalUsd) => {
      const rung =
        quoteSweepMatrix.find(
          (item) => item.requestedNotionalUsd === requestedNotionalUsd,
        ) ?? null;
      const leg =
        rung?.actionableLegs.find((item) => item.assetSymbol === assetSymbol) ?? null;

      return {
        requestedNotionalUsd,
        state: leg?.state ?? "not_present",
        targetNotionalUsd: leg?.targetNotionalUsd ?? null,
        blockerClass: leg?.blockerClass ?? null,
        errorStatusCode: leg?.errorStatusCode ?? null,
        errorType: leg?.errorType ?? null,
        errorDescription: leg?.errorDescription ?? null,
      };
    }),
  }));
}

function buildQuoteSweepMarkdown(summary) {
  const lines = [
    "# CoW Quote Sweep",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Proof mode: ${summary.proofMode}`,
    `- API base URL: ${summary.apiBaseUrl}`,
    `- Slot ID: ${summary.slotId}`,
    `- Manifest ID: ${summary.manifestId}`,
    `- Ladder: ${summary.ladder.join(", ")}`,
    `- Minimum executable gross notional USD: ${summary.minimumExecutableGrossNotionalUsd ?? "not_found"}`,
    `- Strongest truthful claim: ${summary.strongestClaim}`,
    `- Structurally blocked assets: ${
      summary.structurallyBlockedAssets.length > 0
        ? summary.structurallyBlockedAssets.map((item) => item.assetSymbol).join(", ")
        : "none_observed"
    }`,
    "",
    "## Matrix",
    "",
  ];

  for (const rung of summary.quoteSweepMatrix) {
    lines.push(
      `- ${rung.requestedNotionalUsd} USD: allActionableLegsQuoteable=${rung.allActionableLegsQuoteable ? "yes" : "no"}; approvalReadyAssets=${rung.approvalReadyAssets.join(", ") || "none"}; blockedAssets=${rung.blockedAssets.map((asset) => `${asset.assetSymbol}:${asset.blockerClass ?? asset.errorType ?? "unknown"}`).join(", ") || "none"}`,
    );
  }

  if (Array.isArray(summary.quoteabilityByAsset) && summary.quoteabilityByAsset.length > 0) {
    lines.push("", "## Assets", "");

    for (const asset of summary.quoteabilityByAsset) {
      lines.push(
        `- ${asset.assetSymbol}: ${asset.rungs.map((rung) => `${rung.requestedNotionalUsd}=${rung.state}${rung.blockerClass ? `(${rung.blockerClass})` : ""}`).join(", ")}`,
      );
    }
  }

  return lines.join("\n");
}

bootstrapEnvironment();

const configuredProofMode = optionalEnv("XSTOCKS_PROOF_MODE");
const quoteSweepLadder =
  parseQuoteSweepLadder(optionalEnv("XSTOCKS_NOTIONAL_LADDER_USD")) ??
  DEFAULT_QUOTE_SWEEP_LADDER_USD;
const proofMode =
  configuredProofMode ??
  (optionalEnv("XSTOCKS_NOTIONAL_LADDER_USD") ? "quote_sweep" : "proof");

if (!["proof", "quote_sweep"].includes(proofMode)) {
  throw new Error(
    "XSTOCKS_PROOF_MODE must be either 'proof' or 'quote_sweep'.",
  );
}

const appId = requiredOneOf("PRIVY_APP_ID", "NEXT_PUBLIC_PRIVY_APP_ID");
const accessToken = requiredEnv("XSTOCKS_PRIVY_ACCESS_TOKEN");
const identityToken = optionalEnv("XSTOCKS_PRIVY_IDENTITY_TOKEN");
const orderSignature = optionalEnv("XSTOCKS_COW_ORDER_SIGNATURE");
const notionalUsd =
  proofMode === "quote_sweep"
    ? null
    : normalizeNotionalUsd(process.env.XSTOCKS_NOTIONAL_USD);
const slotId = optionalEnv("XSTOCKS_SLOT_ID") ?? DEFAULT_SLOT_ID;
const manifestId = optionalEnv("XSTOCKS_MANIFEST_ID") ?? null;
const apiBaseUrl = sanitizeBaseUrl(optionalEnv("XSTOCKS_API_BASE_URL"));
const proofTimestamp = new Date().toISOString().replaceAll(":", "-");
const proofDir = resolve(REPO_ROOT, "tmp/proof", proofTimestamp);
const summaryPath = resolve(proofDir, "summary.json");
const summaryMarkdownPath = resolve(proofDir, "summary.md");
const localRuntimeStorePath =
  optionalEnv("XSTOCKS_RUNTIME_STORE_PATH") ??
  resolve(tmpdir(), `xstocks-authenticated-cow-proof-${Date.now()}.json`);

const authHeaders = createAuthHeaders(accessToken, identityToken);
const privyAuthService = createPrivyAuthService({
  appId,
  appSecret: requiredEnv("PRIVY_APP_SECRET"),
  jwksUrl: requiredEnv("PRIVY_JWKS_URL"),
  apiBaseUrl: optionalEnv("PRIVY_API_BASE_URL") ?? undefined,
});

const requestContext = await privyAuthService.authenticateRequest(
  {
    headers: authHeaders,
  },
  {
    required: true,
  },
);

const walletAddress = pickAddress(
  "A linked wallet address",
  optionalEnv("XSTOCKS_WALLET_ADDRESS") ?? optionalEnv("XSTOCKS_SIGNER_ADDRESS"),
  requestContext.linkedWalletAddresses,
);
const smartWalletAddress =
  normalizeEthereumAddress(optionalEnv("XSTOCKS_SMART_ACCOUNT_ADDRESS")) ??
  requestContext.linkedSmartWalletAddresses[0] ??
  null;

if (proofMode === "quote_sweep" && orderSignature) {
  throw new Error(
    "Quote sweep mode is quote-only and does not accept XSTOCKS_COW_ORDER_SIGNATURE.",
  );
}

const server = apiBaseUrl
  ? null
  : createApiServer({
      storePath: localRuntimeStorePath,
    });

let proofBundle = null;

try {
  const baseUrl = apiBaseUrl ?? (await listen(server));
  const hosted = Boolean(apiBaseUrl);
  await mkdir(proofDir, { recursive: true });

  if (proofMode === "quote_sweep") {
    const rungArtifacts = [];
    let resolvedManifestId = manifestId;
    let resolvedSlotId = slotId;

    for (const rungNotionalUsd of quoteSweepLadder) {
      const rungWalletState = buildWalletState({
        walletAddress,
        smartWalletAddress,
        fundedNotionalUsd: rungNotionalUsd,
        linkedEmbeddedWalletAddresses: requestContext.linkedEmbeddedWalletAddresses,
      });
      const activationRequestBody = buildActivationRequestBody({
        manifestId,
        slotId,
        notionalUsd: rungNotionalUsd,
        walletState: rungWalletState,
      });
      const activationResponse = await requestApi(baseUrl, "/api/activations", {
        headers: authHeaders,
        body: activationRequestBody,
      });
      resolvedManifestId =
        activationResponse.data.activation.manifestId ?? resolvedManifestId;
      resolvedSlotId = activationResponse.data.activation.slotId ?? resolvedSlotId;
      const activationId = activationResponse.data.activation.activationId;
      const executionCreateResponse = await requestApi(baseUrl, "/api/executions", {
        headers: authHeaders,
        body: {
          action: "create",
          activationId,
        },
      });
      const rungResult = await runQuoteAttemptSequence({
        baseUrl,
        authHeaders,
        executionRequest: executionCreateResponse.data.executionRequest,
      });
      const rungArtifact = buildQuoteSweepRungArtifact({
        requestedNotionalUsd: rungNotionalUsd,
        activationResponse,
        executionCreateResponse,
        quoteAttemptArtifacts: rungResult.quoteAttemptArtifacts,
        executionLatestResponse: rungResult.executionLatestResponse,
        executionLatest: rungResult.executionLatest,
        quoteability: rungResult.quoteability,
        approvalBoundary: rungResult.approvalBoundary,
      });
      rungArtifacts.push(rungArtifact);

      const rungDir = resolve(
        proofDir,
        `rung-${String(rungNotionalUsd).replace(/\./gu, "_")}-usd`,
      );
      await mkdir(rungDir, { recursive: true });
      await writeArtifact(
        resolve(rungDir, "activation-save.json"),
        activationResponse.payload,
      );
      await writeArtifact(
        resolve(rungDir, "execution-create.json"),
        executionCreateResponse.payload,
      );
      await writeArtifact(
        resolve(rungDir, "quote-attempts.json"),
        {
          executionRequestId: rungResult.executionRequestId,
          attempts: rungResult.quoteAttemptArtifacts,
        },
      );
      await writeArtifact(
        resolve(rungDir, "quoteability.json"),
        rungResult.quoteability,
      );
      await writeArtifact(
        resolve(rungDir, "approval-boundary.json"),
        rungResult.approvalBoundary,
      );
      await writeArtifact(
        resolve(rungDir, "execution-request-latest.json"),
        rungResult.executionLatestResponse.payload,
      );
      await writeArtifact(
        resolve(rungDir, "quote-sweep-rung.json"),
        rungArtifact,
      );
    }

    const quoteSweepSummary = buildQuoteSweepSummary({
      ladder: quoteSweepLadder,
      quoteSweepMatrix: rungArtifacts,
    });
    quoteSweepSummary.generatedAt = new Date().toISOString();
    quoteSweepSummary.proofMode = hosted ? "hosted_quote_sweep" : "local_quote_sweep";
    quoteSweepSummary.apiBaseUrl = baseUrl;
    quoteSweepSummary.slotId = resolvedSlotId;
    quoteSweepSummary.manifestId = resolvedManifestId;
    quoteSweepSummary.quoteabilityByAsset = buildQuoteSweepAssetMatrix({
      ladder: quoteSweepLadder,
      quoteSweepMatrix: rungArtifacts,
    });
    proofBundle = {
      generatedAt: quoteSweepSummary.generatedAt,
      proofMode: quoteSweepSummary.proofMode,
      apiBaseUrl: baseUrl,
      slotId: resolvedSlotId,
      manifestId: resolvedManifestId,
      quoteSweepLadderUsd: quoteSweepLadder,
      minimumExecutableGrossNotionalUsd:
        quoteSweepSummary.minimumExecutableGrossNotionalUsd,
      structurallyBlockedAssets: quoteSweepSummary.structurallyBlockedAssets,
      quoteSweepMatrix: rungArtifacts,
    };
    proofBundle.strongestClaim = buildQuoteSweepStrongestClaim({
      ladder: quoteSweepLadder,
      minimumExecutableGrossNotionalUsd:
        quoteSweepSummary.minimumExecutableGrossNotionalUsd,
      structurallyBlockedAssets: quoteSweepSummary.structurallyBlockedAssets.map(
        (item) => item.assetSymbol,
      ),
      quoteSweepMatrix: rungArtifacts,
    });
    quoteSweepSummary.strongestClaim = proofBundle.strongestClaim;

    await writeArtifact(summaryPath, proofBundle);
    await writeArtifact(
      resolve(proofDir, "quote-sweep-summary.json"),
      quoteSweepSummary,
    );
    await writeFile(
      summaryMarkdownPath,
      `${buildQuoteSweepMarkdown(quoteSweepSummary)}\n`,
      "utf8",
    );

    process.stdout.write(
      `${JSON.stringify({ proofDir, proofBundle }, null, 2)}\n`,
    );
  } else {
    const walletState = buildWalletState({
      walletAddress,
      smartWalletAddress,
      fundedNotionalUsd: notionalUsd,
      linkedEmbeddedWalletAddresses: requestContext.linkedEmbeddedWalletAddresses,
    });
    const activationRequestBody = buildActivationRequestBody({
      manifestId,
      slotId,
      notionalUsd,
      walletState,
    });

    const activationResponse = await requestApi(baseUrl, "/api/activations", {
      headers: authHeaders,
      body: activationRequestBody,
    });
    const activationId = activationResponse.data.activation.activationId;

    const executionCreateResponse = await requestApi(baseUrl, "/api/executions", {
      headers: authHeaders,
      body: {
        action: "create",
        activationId,
      },
    });
    const {
      executionRequestId,
      quoteAttemptArtifacts,
      executionLatestResponse,
      executionLatest,
      quoteability,
      approvalBoundary,
    } = await runQuoteAttemptSequence({
      baseUrl,
      authHeaders,
      executionRequest: executionCreateResponse.data.executionRequest,
    });

    let submissionResponse = null;
    let submittedLeg = null;

    if (
      orderSignature &&
      quoteability.allActionableLegsQuoteable &&
      approvalBoundary.legs.length === 1
    ) {
      submissionResponse = await requestApi(baseUrl, "/api/executions", {
        headers: authHeaders,
        body: {
          action: "record_submission",
          executionRequestId,
          legId: approvalBoundary.legs[0].legId,
          signature: orderSignature,
        },
      });
      submittedLeg =
        submissionResponse.data.executionRequest.legs.find(
          (leg) => leg.legId === approvalBoundary.legs[0].legId,
        ) ?? null;
    }

    const submissionBoundary = buildSubmissionBoundaryArtifact({
      quoteability,
      orderSignature,
      submissionResponse,
      submittedLeg,
    });
    const receiptOrBlocker = buildReceiptOrBlockerArtifact({
      quoteability,
      submissionBoundary,
      submittedLeg,
    });
    const runtimeStoreSnapshot = captureRuntimeStoreSnapshot({
      hosted,
      localRuntimeStorePath,
      executionRequestId,
    });

    await writeArtifact(resolve(proofDir, "activation-save.json"), activationResponse.payload);
    await writeArtifact(
      resolve(proofDir, "execution-create.json"),
      executionCreateResponse.payload,
    );
    await writeArtifact(
      resolve(proofDir, "quote-attempts.json"),
      {
        executionRequestId,
        attempts: quoteAttemptArtifacts,
      },
    );
    await writeArtifact(resolve(proofDir, "quoteability.json"), quoteability);
    await writeArtifact(
      resolve(proofDir, "approval-boundary.json"),
      approvalBoundary,
    );
    await writeArtifact(
      resolve(proofDir, "submission-boundary.json"),
      submissionBoundary,
    );
    await writeArtifact(
      resolve(proofDir, "receipt-or-blocker.json"),
      receiptOrBlocker,
    );
    await writeArtifact(
      resolve(proofDir, "execution-request-latest.json"),
      executionLatestResponse.payload,
    );

    if (runtimeStoreSnapshot.captured) {
      await writeArtifact(
        resolve(proofDir, "runtime-store.json"),
        runtimeStoreSnapshot.runtimeStore,
      );

      if (runtimeStoreSnapshot.executionRequest) {
        await writeArtifact(
          resolve(proofDir, "runtime-store-execution-request.json"),
          runtimeStoreSnapshot.executionRequest,
        );
      }
    } else {
      await writeArtifact(
        resolve(proofDir, "runtime-store-capture.json"),
        runtimeStoreSnapshot,
      );
    }

    proofBundle = {
      generatedAt: new Date().toISOString(),
      proofMode: hosted ? "hosted" : "local",
      apiBaseUrl: baseUrl,
      slotId: activationResponse.data.activation.slotId ?? slotId,
      manifestId: activationResponse.data.activation.manifestId ?? manifestId,
      requestedNotionalUsd: notionalUsd,
      auth: {
        providerId: requestContext.owner.providerId,
        userId: requestContext.owner.userId,
        linkedAccountsSource: requestContext.linkedAccountsSource,
        accessTokenVerified: requestContext.accessTokenVerified,
        identityTokenVerified: requestContext.identityTokenVerified,
      },
      activationId,
      executionRequestId,
      signerAddress: redactAddress(walletAddress),
      smartAccountAddress: redactAddress(smartWalletAddress),
      quoteability,
      approvalBoundary,
      submissionBoundary,
      receiptOrBlocker,
      runtimeStore: {
        captureMode: runtimeStoreSnapshot.captureMode,
        captured: runtimeStoreSnapshot.captured,
        executionRequestCaptured: Boolean(runtimeStoreSnapshot.executionRequest),
      },
    };
    proofBundle.strongestClaim = buildStrongestClaim({
      quoteability,
      submissionBoundary,
      receiptOrBlocker,
    });

    await writeArtifact(summaryPath, proofBundle);
    await writeFile(summaryMarkdownPath, `${buildSummaryMarkdown(proofBundle)}\n`, "utf8");

    process.stdout.write(
      `${JSON.stringify({ proofDir, proofBundle }, null, 2)}\n`,
    );
  }
} finally {
  if (server?.listening) {
    await closeServer(server);
  }
}
