import { createRuntimeStore } from "/app/apps/api/src/repositories/runtime-store.js";

const now = new Date().toISOString();
const store = createRuntimeStore({ storePath: "/app/apps/api/data/runtime-store.json" });
const existing = await store.listActivations({
  activationId: "act_hot_treasury_provider_baseline_20260402",
});

if (existing.length === 0) {
  const walletAddress = "0x188c00f138cda59cdabcc3eac1144837742281dd";
  const manifestId = "onboarding.default_basket:basket-baseline-v1";
  const activationManifestRef = {
    manifestId,
    slotId: "onboarding.default_basket",
    strategyVersion: "basket-baseline-v1",
    chain: "ethereum",
    mode: "basket",
  };

  await store.appendActivation({
    activation: {
      activationId: "act_hot_treasury_provider_baseline_20260402",
      owner: {
        providerId: "hot_treasury",
        appId: "xstocks-internal",
        userId: "did:xstocks:hot_treasury_xsl011b",
        sessionId: null,
        issuer: "internal://xsl011b/hot-treasury",
        authenticatedAt: now,
      },
      chain: "ethereum",
      manifestId,
      slotId: "onboarding.default_basket",
      recommendationId: "rec_hot_treasury_provider_baseline_20260402",
      activationManifestRef,
      requestedNotionalUsd: 1000,
      surfaceTruth: "live",
      status: "ready",
      createdAt: now,
      updatedAt: now,
      walletState: {
        walletConnected: true,
        walletAddress,
        fundedNotionalUsd: 1250,
        smartAccount: {
          status: "not_required",
          address: walletAddress,
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: {
        executionPlanId: "exec_hot_treasury_provider_baseline_20260402",
        generatedAt: now,
        activationManifestRef,
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        requestedNotionalUsd: 1000,
        walletConnectionLate: true,
        routeTruthLabels: [],
        assetChecks: [],
        blockers: [],
        warnings: [],
        fundingPath: {
          provider: "privy",
          minRequiredUsd: 1000,
          fundedNotionalUsd: 1250,
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
            notes: ["Repo-owned hot treasury baseline for XSL-011B provider review proof."],
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
            bootstrapBoundary: "Repo-owned hot treasury bootstrap for XSL-011B provider proof.",
            fundingBoundary: "Hot treasury baseline is funded and review-only for provider-triggered proof.",
            walletConnectionLate: true,
            notes: ["Operator approval remains required before execution staging."],
          },
        },
      },
    },
    activityEvents: [],
  });
}

const activations = await store.listActivations({ slotId: "onboarding.default_basket" });
console.log(
  JSON.stringify(
    {
      activationCount: activations.length,
      latestActivation: activations[0],
    },
    null,
    2,
  ),
);
