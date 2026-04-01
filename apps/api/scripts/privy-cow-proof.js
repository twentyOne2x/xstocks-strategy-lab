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
const DEFAULT_SHARED_ENV_PATH = process.env.XSTOCKS_SHARED_ENV_PATH ?? null;
const DEFAULT_NOTIONAL_USD = 25;
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
    const value = trimmed.slice(separatorIndex + 1).trim();

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
    state: leg.state,
    quoteId: leg.quote?.quoteId ?? null,
    quoteVerified: leg.quote?.verified ?? null,
    approvalStatus: leg.approval?.status ?? null,
    signerAddress: redactAddress(leg.approval?.signerAddress ?? null),
    receiverAddress: redactAddress(leg.quote?.order?.receiver ?? null),
    venueOrderId: leg.approval?.venueOrderId ?? null,
    venueStatus: leg.venueStatus?.status ?? null,
    txHash: leg.receipt?.txHash ?? null,
    receiptStatus: leg.receipt?.receiptStatus ?? null,
    blockers: leg.blockers ?? [],
    warnings: leg.warnings ?? [],
  };
}

function selectPendingLeg(executionRequest) {
  return (
    executionRequest.legs.find((leg) => leg.state === "pending") ??
    executionRequest.legs[0] ??
    null
  );
}

bootstrapEnvironment();

const appId = requiredOneOf("PRIVY_APP_ID", "NEXT_PUBLIC_PRIVY_APP_ID");
const accessToken = requiredEnv("XSTOCKS_PRIVY_ACCESS_TOKEN");
const identityToken = optionalEnv("XSTOCKS_PRIVY_IDENTITY_TOKEN");
const orderSignature = optionalEnv("XSTOCKS_COW_ORDER_SIGNATURE");
const notionalUsd = normalizeNotionalUsd(process.env.XSTOCKS_NOTIONAL_USD);
const manifestId = optionalEnv("XSTOCKS_MANIFEST_ID") ?? DEFAULT_MANIFEST_ID;
const proofTimestamp = new Date().toISOString().replaceAll(":", "-");
const proofDir = resolve(REPO_ROOT, "tmp/proof", proofTimestamp);
const proofPath = resolve(proofDir, "authenticated-cow-proof.json");
const runtimeStorePath =
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
const walletState = buildWalletState({
  walletAddress,
  smartWalletAddress,
  fundedNotionalUsd: notionalUsd,
  linkedEmbeddedWalletAddresses: requestContext.linkedEmbeddedWalletAddresses,
});

const server = createApiServer({
  storePath: runtimeStorePath,
});

let proofBundle;

try {
  const baseUrl = await listen(server);

  const activation = await requestJson(baseUrl, "/api/activations", {
    headers: authHeaders,
    body: {
      manifestId,
      userNotionalUsd: notionalUsd,
      walletState,
    },
  });
  const executionCreation = await requestJson(baseUrl, "/api/executions", {
    headers: authHeaders,
    body: {
      action: "create",
      activationId: activation.activation.activationId,
    },
  });
  const initialLeg = selectPendingLeg(executionCreation.executionRequest);

  if (!initialLeg) {
    throw new Error("Execution request did not produce a pending leg to quote.");
  }

  const quoteResult = await requestJson(baseUrl, "/api/executions", {
    headers: authHeaders,
    body: {
      action: "quote_leg",
      executionRequestId: executionCreation.executionRequest.executionRequestId,
      legId: initialLeg.legId,
    },
  });
  const quotedLeg =
    quoteResult.executionRequest.legs.find((leg) => leg.legId === initialLeg.legId) ??
    null;

  if (!quotedLeg) {
    throw new Error("Quoted execution leg could not be found after CoW quoting.");
  }

  proofBundle = {
    generatedAt: new Date().toISOString(),
    manifestId,
    requestedNotionalUsd: notionalUsd,
    auth: {
      providerId: requestContext.owner.providerId,
      userId: requestContext.owner.userId,
      linkedAccountsSource: requestContext.linkedAccountsSource,
      accessTokenVerified: requestContext.accessTokenVerified,
      identityTokenVerified: requestContext.identityTokenVerified,
    },
    activationId: activation.activation.activationId,
    executionRequestId: executionCreation.executionRequest.executionRequestId,
    signerAddress: redactAddress(walletAddress),
    smartAccountAddress: redactAddress(smartWalletAddress),
    runtimeStorePath,
    state: quotedLeg.state,
    leg: summarizeLeg(quotedLeg),
  };

  if (orderSignature) {
    const submissionResult = await requestJson(baseUrl, "/api/executions", {
      headers: authHeaders,
      body: {
        action: "record_submission",
        executionRequestId: executionCreation.executionRequest.executionRequestId,
        legId: initialLeg.legId,
        signature: orderSignature,
      },
    });
    const submittedLeg =
      submissionResult.executionRequest.legs.find(
        (leg) => leg.legId === initialLeg.legId,
      ) ?? null;

    if (!submittedLeg) {
      throw new Error("Submitted execution leg could not be found after CoW submission.");
    }

    proofBundle = {
      ...proofBundle,
      state: submittedLeg.state,
      leg: summarizeLeg(submittedLeg),
      activityEvents: submissionResult.activityEvents.map((event) => ({
        eventType: event.eventType,
        summary: event.summary,
      })),
    };
  }

  await mkdir(proofDir, { recursive: true });
  await writeFile(proofPath, `${JSON.stringify(proofBundle, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ proofPath, proofBundle }, null, 2)}\n`);
} finally {
  if (server.listening) {
    await closeServer(server);
  }
}
