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
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const DEFAULT_MANIFEST_ID = JSON.parse(
  readFileSync(SLOT_REGISTRY_PATH, "utf8"),
).slots["onboarding.default_basket"].currentManifestRef.manifestId;
const DEFAULT_SHARED_ENV_PATH =
  process.env.XSTOCKS_SHARED_ENV_PATH ??
  process.env.ATTN_SHARED_ENV_PATH ??
  resolve(process.env.HOME ?? "~", ".config/attn/shared.env");
const DEFAULT_NOTIONAL_USD = 20;
const MAX_NOTIONAL_USD = 25;

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
    throw new Error(`${name} is required for the 1inch Fusion proof runner.`);
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
    `${names.join(" or ")} is required for the 1inch Fusion proof runner.`,
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
  const notional = Number(value ?? DEFAULT_NOTIONAL_USD);

  if (!Number.isFinite(notional) || notional <= 0) {
    throw new Error("XSTOCKS_NOTIONAL_USD must be a positive number.");
  }

  if (notional > MAX_NOTIONAL_USD) {
    throw new Error(
      `XSTOCKS_NOTIONAL_USD must not exceed the approved cap of $${MAX_NOTIONAL_USD}.`,
    );
  }

  return Number(notional.toFixed(2));
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

async function requestJson(baseUrl, pathname, { headers = {}, body } = {}) {
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

  return payload.data;
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
    sleeve: leg.sleeve,
    state: leg.state,
    quoteKind: leg.quote?.kind ?? null,
    quoteId: leg.quote?.quoteId ?? null,
    orderHash:
      leg.approval?.orderToSign?.orderHash ??
      leg.quote?.orderHash ??
      leg.approval?.venueOrderId ??
      null,
    approvalStatus: leg.approval?.status ?? null,
    approvalTarget: leg.approval?.approvalTarget ?? null,
    signerAddress: redactAddress(leg.approval?.signerAddress ?? null),
    receiverAddress: redactAddress(
      leg.quote?.receiver ??
        leg.approval?.orderToSign?.order?.receiver ??
        null,
    ),
    venueOrderId: leg.approval?.venueOrderId ?? null,
    venueStatus: leg.venueStatus?.status ?? null,
    txHash: leg.receipt?.txHash ?? null,
    receiptStatus: leg.receipt?.receiptStatus ?? null,
    blockers: leg.blockers ?? [],
    warnings: leg.warnings ?? [],
  };
}

function buildApprovalPayloadArtifact(leg) {
  return {
    legId: leg.legId,
    assetSymbol: leg.assetSymbol ?? null,
    sleeve: leg.sleeve,
    state: leg.state,
    quote: leg.quote ?? null,
    approval: leg.approval ?? null,
    venueStatus: leg.venueStatus ?? null,
  };
}

function selectActionableLegs(executionRequest) {
  return executionRequest.legs.filter((leg) => leg.state !== "deferred");
}

function summarizeExecutionRequest(executionRequest) {
  const actionableLegs = selectActionableLegs(executionRequest);
  const deferredLegs = executionRequest.legs.filter((leg) => leg.state === "deferred");

  return {
    state: executionRequest.state,
    totalLegCount: executionRequest.legs.length,
    actionableLegCount: actionableLegs.length,
    deferredLegCount: deferredLegs.length,
    legs: actionableLegs.map(summarizeLeg),
    deferredLegs: deferredLegs.map(summarizeLeg),
  };
}

function parseSignatureMap(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return new Map();
  }

  const parsed = JSON.parse(rawValue);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON must be a JSON object keyed by legId or assetSymbol.",
    );
  }

  return new Map(
    Object.entries(parsed)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => [key, value.trim()]),
  );
}

function resolveSignatureForLeg(leg, signatureMap, fallbackSignature = null) {
  return (
    signatureMap.get(leg.legId) ??
    (leg.assetSymbol ? signatureMap.get(leg.assetSymbol) : null) ??
    fallbackSignature
  );
}

async function writeArtifact(outputDir, fileName, value) {
  await writeFile(
    resolve(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

const proofTimestamp = new Date().toISOString().replaceAll(":", "-");
const proofDir = resolve(REPO_ROOT, "tmp/proof", `oneinch-fusion-${proofTimestamp}`);

function resolveFailureStage(summary) {
  if (summary.executionRequest) {
    return "submission_or_status";
  }

  if (summary.executionRequestId) {
    return "quote";
  }

  if (summary.activationId) {
    return "execution_create";
  }

  if (summary.auth) {
    return "activation_or_create";
  }

  return "environment_or_authentication";
}

let server = null;

const summary = {
  generatedAt: new Date().toISOString(),
  manifestId: DEFAULT_MANIFEST_ID,
  requestedNotionalUsd: null,
  executionRouteId: "1inch.ethereum",
  runtimeStorePath: null,
  auth: null,
  signerAddress: null,
  smartAccountAddress: null,
  state: "starting",
  blocker: null,
  activationId: null,
  executionRequestId: null,
  executionRequest: null,
  approvalPayloadCount: 0,
  submissionResults: [],
};

try {
  await mkdir(proofDir, { recursive: true });
  bootstrapEnvironment();

  const manifestId = optionalEnv("XSTOCKS_MANIFEST_ID") ?? DEFAULT_MANIFEST_ID;
  const notionalUsd = normalizeNotionalUsd(process.env.XSTOCKS_NOTIONAL_USD);
  const runtimeStorePath =
    optionalEnv("XSTOCKS_RUNTIME_STORE_PATH") ??
    resolve(tmpdir(), `xstocks-oneinch-fusion-proof-${Date.now()}.json`);

  summary.manifestId = manifestId;
  summary.requestedNotionalUsd = notionalUsd;
  summary.runtimeStorePath = runtimeStorePath;

  requiredEnv("ONEINCH_API_KEY");

  const appId = requiredOneOf("PRIVY_APP_ID", "NEXT_PUBLIC_PRIVY_APP_ID");
  const accessToken = requiredEnv("XSTOCKS_PRIVY_ACCESS_TOKEN");
  const identityToken = optionalEnv("XSTOCKS_PRIVY_IDENTITY_TOKEN");
  const orderSignature =
    optionalEnv("XSTOCKS_ONEINCH_ORDER_SIGNATURE") ??
    optionalEnv("XSTOCKS_ONEINCH_SIGNATURE") ??
    optionalEnv("XSTOCKS_ORDER_SIGNATURE") ??
    optionalEnv("XSTOCKS_COW_ORDER_SIGNATURE");
  const signatureMap = parseSignatureMap(
    optionalEnv("XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON"),
  );
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

  summary.auth = {
    providerId: requestContext.owner.providerId,
    userId: requestContext.owner.userId,
    linkedAccountsSource: requestContext.linkedAccountsSource,
    accessTokenVerified: requestContext.accessTokenVerified,
    identityTokenVerified: requestContext.identityTokenVerified,
  };

  const walletAddress = pickAddress(
    "A linked wallet address",
    optionalEnv("XSTOCKS_WALLET_ADDRESS") ??
      optionalEnv("XSTOCKS_SIGNER_ADDRESS") ??
      optionalEnv("XSTOCKS_ONEINCH_WALLET_ADDRESS"),
    requestContext.linkedWalletAddresses,
  );
  const smartWalletAddress =
    normalizeEthereumAddress(optionalEnv("XSTOCKS_SMART_ACCOUNT_ADDRESS")) ??
    requestContext.linkedSmartWalletAddresses[0] ??
    null;
  const walletState = buildWalletState({
    walletAddress,
    smartWalletAddress,
    fundedNotionalUsd: notionalUsd,
    linkedEmbeddedWalletAddresses: requestContext.linkedEmbeddedWalletAddresses,
  });

  summary.signerAddress = redactAddress(walletAddress);
  summary.smartAccountAddress = redactAddress(smartWalletAddress);

  server = createApiServer({
    storePath: runtimeStorePath,
  });

  const baseUrl = await listen(server);

  const activation = await requestJson(baseUrl, "/api/activations", {
    headers: authHeaders,
    body: {
      manifestId,
      userNotionalUsd: notionalUsd,
      walletState,
    },
  });
  summary.activationId = activation.activation.activationId;
  summary.state = "activation_saved";
  await writeArtifact(proofDir, "activation.json", activation);

  const executionCreation = await requestJson(baseUrl, "/api/executions", {
    headers: authHeaders,
    body: {
      action: "create",
      activationId: activation.activation.activationId,
      executionRouteId: "1inch.ethereum",
    },
  });
  summary.executionRequestId = executionCreation.executionRequest.executionRequestId;
  summary.state = executionCreation.executionRequest.state;
  summary.executionRequest = summarizeExecutionRequest(
    executionCreation.executionRequest,
  );
  await writeArtifact(proofDir, "execution-create.json", executionCreation);

  const actionableLegs = selectActionableLegs(executionCreation.executionRequest);

  if (actionableLegs.length === 0) {
    throw new Error(
      "Execution request did not produce any actionable legs to quote.",
    );
  }

  const quoteResults = [];
  let latestExecutionRequest = executionCreation.executionRequest;

  for (const leg of actionableLegs) {
    const quoteResult = await requestJson(baseUrl, "/api/executions", {
      headers: authHeaders,
      body: {
        action: "quote_leg",
        executionRequestId: executionCreation.executionRequest.executionRequestId,
        legId: leg.legId,
      },
    });

    const quotedLeg =
      quoteResult.executionRequest.legs.find(
        (nextLeg) => nextLeg.legId === leg.legId,
      ) ?? null;

    if (!quotedLeg) {
      throw new Error(
        `Quoted execution leg ${leg.legId} could not be found after 1inch quoting.`,
      );
    }

    quoteResults.push({
      legId: leg.legId,
      assetSymbol: leg.assetSymbol ?? null,
      state: quotedLeg.state,
      summary: summarizeLeg(quotedLeg),
    });
    latestExecutionRequest = quoteResult.executionRequest;
  }
  await writeArtifact(proofDir, "quotes.json", quoteResults);

  summary.state = latestExecutionRequest.state;
  summary.executionRequest = summarizeExecutionRequest(latestExecutionRequest);

  const blockedLegs = summary.executionRequest.legs.filter(
    (leg) => leg.state === "blocked" || (leg.blockers?.length ?? 0) > 0,
  );
  const quotedLegs = summary.executionRequest.legs.filter(
    (leg) => leg.state === "awaiting_approval" || leg.state === "quote_ready",
  );
  const approvalPayloads = latestExecutionRequest.legs
    .filter((leg) => leg.state === "awaiting_approval" || leg.state === "quote_ready")
    .map(buildApprovalPayloadArtifact);

  summary.approvalPayloadCount = approvalPayloads.length;

  if (approvalPayloads.length > 0) {
    await writeArtifact(proofDir, "approval-payloads.json", approvalPayloads);
  }

  if (blockedLegs.length > 0) {
    summary.blocker = {
      code: "basket_leg_blocked",
      stage: "quote",
      message:
        "At least one actionable basket leg remained blocked after 1inch quote attempts.",
      legs: blockedLegs,
    };
  } else if (quotedLegs.length === 0) {
    summary.blocker = {
      code: "no_quoteable_legs",
      stage: "quote",
      message:
        "The basket did not produce any quoted 1inch legs after the authenticated multi-leg run.",
    };
  } else {
    const signaturesByLeg = quotedLegs.map((leg) => ({
      leg,
      signature: resolveSignatureForLeg(
        leg,
        signatureMap,
        quotedLegs.length === 1 ? orderSignature : null,
      ),
    }));
    await writeArtifact(
      proofDir,
      "signature-inputs.json",
      signaturesByLeg.map(({ leg, signature }) => ({
        legId: leg.legId,
        assetSymbol: leg.assetSymbol ?? null,
        orderHash:
          leg.approval?.orderToSign?.orderHash ??
          leg.quote?.orderHash ??
          null,
        signature: signature ?? null,
      })),
    );
    const unsignedLegs = signaturesByLeg
      .filter((entry) => !entry.signature)
      .map((entry) => ({
        legId: entry.leg.legId,
        assetSymbol: entry.leg.assetSymbol,
        quoteId: entry.leg.quoteId,
        orderHash: entry.leg.orderHash,
      }));

    if (unsignedLegs.length > 0) {
      summary.blocker = {
        code: "missing_user_signature",
        stage: "awaiting_signature",
        message:
          quotedLegs.length === 1
            ? "A signer-owned 1inch Fusion EIP-712 signature is still required before backend submission can be recorded."
            : `Signer-owned 1inch Fusion EIP-712 signatures are still required for ${unsignedLegs.length} quoted core legs before backend submission can be recorded.`,
        legs: unsignedLegs,
      };
    } else {
      let latestSubmissionRequest = latestExecutionRequest;

      for (const { leg, signature } of signaturesByLeg) {
        const submissionResult = await requestJson(baseUrl, "/api/executions", {
          headers: authHeaders,
          body: {
            action: "record_submission",
            executionRequestId: executionCreation.executionRequest.executionRequestId,
            legId: leg.legId,
            signature,
          },
        });

        latestSubmissionRequest = submissionResult.executionRequest;
        const submittedLeg =
          submissionResult.executionRequest.legs.find(
            (nextLeg) => nextLeg.legId === leg.legId,
          ) ?? null;
        summary.submissionResults.push({
          legId: leg.legId,
          assetSymbol: leg.assetSymbol,
          executionRequestState: submissionResult.executionRequest.state,
          signature,
          leg: submittedLeg ? summarizeLeg(submittedLeg) : null,
          venueStatus: submittedLeg?.venueStatus ?? null,
          receipt: submittedLeg?.receipt ?? null,
          activityEvents: submissionResult.activityEvents.map((event) => ({
            eventType: event.eventType,
            summary: event.summary,
          })),
        });
      }

      summary.state = latestSubmissionRequest.state;
      summary.executionRequest = summarizeExecutionRequest(latestSubmissionRequest);
      await writeArtifact(proofDir, "submissions.json", summary.submissionResults);
    }
  }
  await writeArtifact(proofDir, "summary.json", summary);

  process.stdout.write(`${JSON.stringify({ proofDir, summary }, null, 2)}\n`);
} catch (error) {
  summary.state = "blocked";
  summary.blocker = {
    code:
      error instanceof Error &&
      error.message.includes("is required for the 1inch Fusion proof runner")
        ? "missing_environment_input"
        : "proof_request_failed",
    stage: resolveFailureStage(summary),
    message: error instanceof Error ? error.message : String(error),
    statusCode:
      typeof error?.statusCode === "number" ? error.statusCode : null,
    payload: error?.payload ?? null,
  };
  await mkdir(proofDir, { recursive: true });
  await writeArtifact(proofDir, "summary.json", summary);
  process.stdout.write(`${JSON.stringify({ proofDir, summary }, null, 2)}\n`);
  process.exitCode = 1;
} finally {
  if (server?.listening) {
    await closeServer(server);
  }
}
