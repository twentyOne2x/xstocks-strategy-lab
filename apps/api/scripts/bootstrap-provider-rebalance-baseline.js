import { createRuntimeStore } from "../src/repositories/runtime-store.js";

function requiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

function optionalEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/u.test(normalized) ? normalized : null;
}

function normalizeUsd(value, name, fallback) {
  const resolved = value ?? fallback;
  const amount = Number(resolved);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${name} must be a non-negative number.`);
  }

  return Number(amount.toFixed(2));
}

const storePath =
  optionalEnv("XSTOCKS_RUNTIME_STORE_PATH") ??
  "/app/apps/api/data/runtime-store.json";
const activationId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_ACTIVATION_ID") ??
  "act_hot_treasury_provider_baseline_20260402";
const manifestId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_MANIFEST_ID") ??
  "onboarding.default_basket:basket-baseline-v1";
const slotId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_SLOT_ID") ??
  "onboarding.default_basket";
const strategyVersion =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_STRATEGY_VERSION") ??
  "basket-baseline-v1";
const recommendationId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_RECOMMENDATION_ID") ??
  "rec_hot_treasury_provider_baseline_20260402";
const requestedNotionalUsd = normalizeUsd(
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_REQUESTED_NOTIONAL_USD"),
  "XSTOCKS_PROVIDER_BASELINE_REQUESTED_NOTIONAL_USD",
  1000,
);
const fundedNotionalUsd = normalizeUsd(
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_FUNDED_NOTIONAL_USD"),
  "XSTOCKS_PROVIDER_BASELINE_FUNDED_NOTIONAL_USD",
  1250,
);
const walletAddress = normalizeEthereumAddress(
  requiredEnv("XSTOCKS_PROVIDER_BASELINE_WALLET_ADDRESS"),
);

if (!walletAddress) {
  throw new Error("XSTOCKS_PROVIDER_BASELINE_WALLET_ADDRESS must be a valid Ethereum address.");
}

const ownerUserId = requiredEnv("XSTOCKS_PROVIDER_BASELINE_OWNER_USER_ID");
const ownerIssuer = requiredEnv("XSTOCKS_PROVIDER_BASELINE_OWNER_ISSUER");
const ownerProviderId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_OWNER_PROVIDER_ID") ?? "hot_treasury";
const ownerAppId =
  optionalEnv("XSTOCKS_PROVIDER_BASELINE_OWNER_APP_ID") ?? "xstocks-internal";

const runtimeStore = createRuntimeStore({
  storePath,
});
const now = new Date().toISOString();
const existing = await runtimeStore.listActivations({ activationId });

if (existing.length === 0) {
  const activationManifestRef = {
    manifestId,
    slotId,
    strategyVersion,
    chain: "ethereum",
    mode: "basket",
  };

  await runtimeStore.appendActivation({
    activation: {
      activationId,
      owner: {
        providerId: ownerProviderId,
        appId: ownerAppId,
        userId: ownerUserId,
        sessionId: null,
        issuer: ownerIssuer,
        authenticatedAt: now,
      },
      chain: "ethereum",
      manifestId,
      slotId,
      recommendationId,
      activationManifestRef,
      requestedNotionalUsd,
      surfaceTruth: "live",
      status: "ready",
      createdAt: now,
      updatedAt: now,
      walletState: {
        walletConnected: true,
        walletAddress,
        fundedNotionalUsd,
        smartAccount: {
          status: "not_required",
          address: walletAddress,
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: {
        executionPlanId: `exec_${activationId}`,
        generatedAt: now,
        activationManifestRef,
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        requestedNotionalUsd,
        walletConnectionLate: true,
        routeTruthLabels: [],
        assetChecks: [],
        blockers: [],
        warnings: [],
        fundingPath: {
          provider: "privy",
          minRequiredUsd: requestedNotionalUsd,
          fundedNotionalUsd,
          fundingGapUsd: 0,
          topUpAsset: "USDC",
          destinationAddress: walletAddress,
          destinationKind: "embedded_wallet",
          readiness: "funded",
          recommendedMethodId: null,
          surfaces: [],
          status: "funded",
        },
        smartAccount: {
          readiness: "not_required",
          providerId: "privy",
          status: "not_required",
          address: walletAddress,
          bootstrap: {
            state: "ready",
            chain: "ethereum",
            implementation: "privy_smart_wallet",
            signerAddress: walletAddress,
            embeddedWalletAddress: walletAddress,
            smartAccountAddress: null,
            destinationAddress: walletAddress,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              "Repo-owned hot treasury baseline for XSL-011B provider review proof.",
            ],
          },
          reviewArtifact: {
            providerId: "privy",
            providerName: "Privy smart wallet",
            supportedChains: ["ethereum"],
            permissions: [
              "activate_promoted_manifest_only",
              "pause_strategy",
              "turn_off_strategy",
            ],
            approvalMode: "user_approved_only",
            bootstrapBoundary:
              "Repo-owned hot treasury bootstrap for XSL-011B provider review proof.",
            fundingBoundary:
              "Hot treasury baseline is funded and review-only for provider-triggered proof.",
            walletConnectionLate: true,
            notes: ["Operator approval remains required before execution staging."],
          },
        },
      },
    },
    activityEvents: [],
  });
}

const [latestActivation] = await runtimeStore.listActivations({
  slotId,
  limit: 1,
});

console.log(
  JSON.stringify(
    {
      storePath,
      activationId,
      slotId,
      manifestId,
      walletAddress,
      latestActivation,
    },
    null,
    2,
  ),
);
