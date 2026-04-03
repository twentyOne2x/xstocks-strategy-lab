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
const DEFAULT_NOTIONAL_USD = 1000;
const MAX_NOTIONAL_USD = 5000;

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
    throw new Error(`${name} is required for the Enso proof runner.`);
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
    `${names.join(" or ")} is required for the Enso proof runner.`,
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
      `XSTOCKS_NOTIONAL_USD must not exceed the approved Enso proof cap of $${MAX_NOTIONAL_USD}.`,
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
    approvalStatus: leg.approval?.status ?? null,
    approvalTarget: leg.approval?.approvalTarget ?? null,
    signerAddress: redactAddress(leg.approval?.signerAddress ?? null),
    venueOrderId: leg.venueStatus?.venueOrderId ?? null,
    venueStatus: leg.venueStatus?.status ?? null,
    txHash: leg.receipt?.txHash ?? null,
    receiptStatus: leg.receipt?.receiptStatus ?? null,
    blockers: leg.blockers ?? [],
    warnings: leg.warnings ?? [],
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
    warnings: executionRequest.warnings ?? [],
    blockers: executionRequest.blockers ?? [],
    legs: actionableLegs.map(summarizeLeg),
    deferredLegs: deferredLegs.map(summarizeLeg),
  };
}

async function writeArtifact(outputDir, fileName, value) {
  await writeFile(
    resolve(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

const proofTimestamp = new Date().toISOString().replaceAll(":", "-");
const proofDir = resolve(REPO_ROOT, "tmp/proof", `enso-portfolio-${proofTimestamp}`);

function resolveFailureStage(summary) {
  if (summary.executionRequest) {
    return "quote_portfolio";
  }

  if (summary.executionRequestId) {
    return "execution_create";
  }

  if (summary.activationId) {
    return "activation_or_create";
  }

  if (summary.auth) {
    return "environment_or_authentication";
  }

  return "environment";
}

let server = null;

const summary = {
  generatedAt: new Date().toISOString(),
  manifestId: DEFAULT_MANIFEST_ID,
  requestedNotionalUsd: null,
  executionAdapterId: "enso_bundle",
  executionRouteId: "enso.ethereum",
  runtimeStorePath: null,
  auth: null,
  signerAddress: null,
  smartAccountAddress: null,
  state: "starting",
  blocker: null,
  activationId: null,
  executionRequestId: null,
  executionRequest: null,
  bundleQuoteId: null,
  approvalTransactionTo: null,
  bundleTransactionTo: null,
};

try {
  await mkdir(proofDir, { recursive: true });
  bootstrapEnvironment();

  const manifestId = optionalEnv("XSTOCKS_MANIFEST_ID") ?? DEFAULT_MANIFEST_ID;
  const notionalUsd = normalizeNotionalUsd(process.env.XSTOCKS_NOTIONAL_USD);
  const runtimeStorePath =
    optionalEnv("XSTOCKS_RUNTIME_STORE_PATH") ??
    resolve(tmpdir(), `xstocks-enso-proof-${Date.now()}.json`);

  summary.manifestId = manifestId;
  summary.requestedNotionalUsd = notionalUsd;
  summary.runtimeStorePath = runtimeStorePath;

  requiredEnv("ENSO_API_KEY");

  const appId = requiredOneOf("PRIVY_APP_ID", "NEXT_PUBLIC_PRIVY_APP_ID");
  const accessToken = requiredEnv("XSTOCKS_PRIVY_ACCESS_TOKEN");
  const identityToken = optionalEnv("XSTOCKS_PRIVY_IDENTITY_TOKEN");
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
      executionAdapterId: "enso_bundle",
    },
  });
  summary.executionRequestId = executionCreation.executionRequest.executionRequestId;
  summary.state = executionCreation.executionRequest.state;
  summary.executionRequest = summarizeExecutionRequest(
    executionCreation.executionRequest,
  );
  await writeArtifact(proofDir, "execution-create.json", executionCreation);

  const quotedPortfolio = await requestJson(baseUrl, "/api/executions", {
    headers: authHeaders,
    body: {
      action: "quote_portfolio",
      executionRequestId: executionCreation.executionRequest.executionRequestId,
    },
  });
  const latestExecutionRequest = quotedPortfolio.executionRequest;
  const actionableLegs = selectActionableLegs(latestExecutionRequest);
  const blockedLegs = actionableLegs.filter(
    (leg) => leg.state === "blocked" || (leg.blockers?.length ?? 0) > 0,
  );
  const approvalLegs = actionableLegs.filter(
    (leg) => leg.state === "awaiting_approval" && leg.quote?.kind === "enso_bundle",
  );
  const primaryLeg = approvalLegs[0] ?? actionableLegs[0] ?? null;
  const bundleQuote =
    primaryLeg?.quote && typeof primaryLeg.quote === "object"
      ? primaryLeg.quote
      : null;
  const approvalTransaction =
    primaryLeg?.approval?.transactionRequest &&
    typeof primaryLeg.approval.transactionRequest === "object"
      ? primaryLeg.approval.transactionRequest
      : null;

  summary.state = latestExecutionRequest.state;
  summary.executionRequest = summarizeExecutionRequest(latestExecutionRequest);
  summary.bundleQuoteId =
    typeof bundleQuote?.quoteId === "string" ? bundleQuote.quoteId : null;
  summary.approvalTransactionTo =
    typeof approvalTransaction?.to === "string" ? approvalTransaction.to : null;
  summary.bundleTransactionTo =
    typeof bundleQuote?.tx?.to === "string" ? bundleQuote.tx.to : null;

  await writeArtifact(proofDir, "portfolio-quote.json", quotedPortfolio);

  if (approvalTransaction) {
    await writeArtifact(proofDir, "approval-transaction.json", approvalTransaction);
  }

  if (bundleQuote) {
    await writeArtifact(proofDir, "bundle-transaction.json", {
      quoteId: bundleQuote.quoteId ?? null,
      tx: bundleQuote.tx ?? {},
      gas: bundleQuote.gas ?? null,
      route: Array.isArray(bundleQuote.route) ? bundleQuote.route : [],
      bundle: Array.isArray(bundleQuote.bundle) ? bundleQuote.bundle : [],
      amountsOut:
        bundleQuote.amountsOut && typeof bundleQuote.amountsOut === "object"
          ? bundleQuote.amountsOut
          : {},
      selectedOutputTokenAddress: bundleQuote.selectedOutputTokenAddress ?? null,
      selectedOutputAmount: bundleQuote.selectedOutputAmount ?? null,
    });
  }

  await writeArtifact(proofDir, "wallet-packet.json", {
    generatedAt: summary.generatedAt,
    manifestId: summary.manifestId,
    executionRequestId: summary.executionRequestId,
    approvalModel:
      "Approve the starting USDC if required, then send the Enso bundle transaction with the connected wallet.",
    approvalTransaction,
    bundleTransaction: bundleQuote?.tx ?? null,
    route: Array.isArray(bundleQuote?.route) ? bundleQuote.route : [],
    bundle: Array.isArray(bundleQuote?.bundle) ? bundleQuote.bundle : [],
  });

  if (actionableLegs.length === 0) {
    summary.blocker = {
      code: "no_actionable_bundle_legs",
      stage: "quote_portfolio",
      message:
        "The Enso portfolio request did not produce any actionable legs on the promoted basket.",
    };
  } else if (blockedLegs.length > 0) {
    summary.blocker = {
      code: "basket_leg_blocked",
      stage: "quote_portfolio",
      message:
        "At least one promoted-basket leg remained blocked after the Enso portfolio quote attempt.",
      legs: blockedLegs.map(summarizeLeg),
    };
  } else if (approvalLegs.length === 0 || !bundleQuote) {
    summary.blocker = {
      code: "missing_bundle_quote",
      stage: "quote_portfolio",
      message:
        "Enso did not return a usable bundle quote for the promoted basket.",
      executionRequest: summary.executionRequest,
    };
  } else {
    summary.blocker = {
      code: "missing_user_wallet_submission",
      stage: "awaiting_wallet_transaction",
      message:
        "Enso returned the approval and bundle transaction payloads, but a connected wallet still must approve the starting USDC and send the bundle transaction.",
      approvalRequired: Boolean(approvalTransaction),
      bundleQuoteId: summary.bundleQuoteId,
    };
  }

  await writeArtifact(proofDir, "summary.json", summary);
  process.stdout.write(`${JSON.stringify({ proofDir, summary }, null, 2)}\n`);
} catch (error) {
  summary.state = "blocked";
  summary.blocker = {
    code:
      error instanceof Error &&
      error.message.includes("is required for the Enso proof runner")
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
