import { normalizeUsd, normalizeWalletState } from "./contracts.js";
import { derivePortfolioExplanationBundle } from "./explanation.js";
import {
  assertPromotedActivationManifest,
  createActivationManifestRef,
} from "./manifest.js";
import { deriveExecutionPlan } from "./execution-plan.js";
import {
  basketRecommendationSchema,
  CONTRACT_VERSION,
  directionalRecommendationSchema,
} from "./shared-contracts.js";

function deriveRebalanceDecision(manifest, requestedNotionalUsd, executionPlan) {
  const hasDirectionalSleeve = manifest.mode === "directional";
  const routeChecksPassed = executionPlan.routeTruthLabels.every(
    (route) => route.truthState === executionPlan.surfaceTruth || route.truthState === "live",
  );

  if (requestedNotionalUsd <= 0) {
    return {
      state: "monitor",
      rationale:
        "No notional was supplied, so the recommendation stays in preview-monitor mode.",
      signalFresh: true,
      routeChecksPassed,
      mandateChecksPassed: true,
    };
  }

  return {
    state: "full_rebalance",
    rationale:
      "The requested notional assumes a fresh activation from the promoted manifest.",
    signalFresh: true,
    routeChecksPassed,
    mandateChecksPassed: !hasDirectionalSleeve || executionPlan.surfaceTruth !== "blocked",
  };
}

export function deriveRecommendation({
  activation_manifest,
  live_xstocks_state,
  live_route_state,
  user_notional_usd,
  wallet_state,
}) {
  const manifest = assertPromotedActivationManifest(activation_manifest);
  const normalizedWalletState = normalizeWalletState(wallet_state);
  const requestedNotionalUsd = normalizeUsd(user_notional_usd, 0);
  const executionPlan = deriveExecutionPlan({
    activation_manifest: manifest,
    live_xstocks_state,
    live_route_state,
    user_notional_usd: requestedNotionalUsd,
    wallet_state: normalizedWalletState,
  });

  const targetAllocations = manifest.targetAllocations ?? [];
  const explanationBundle = derivePortfolioExplanationBundle(manifest);
  const yieldBufferTarget = targetAllocations.find(
    (allocation) => allocation.sleeve === "yield_buffer",
  ) ?? {
    assetSymbol: manifest.activationTemplate.fundingAssetSymbol,
    targetWeightPct: 0,
  };

  if (manifest.mode === "basket") {
    return basketRecommendationSchema.parse({
      version: CONTRACT_VERSION,
      recommendationId: `rec_${manifest.manifestId}`,
      slotId: manifest.slotId,
      portfolioMode: "basket",
      activationManifestRef: createActivationManifestRef(manifest),
      targetAllocations,
      cashOrYieldBufferTarget: {
        assetSymbol: yieldBufferTarget.assetSymbol,
        venueId: yieldBufferTarget.venueId,
        targetWeightPct: yieldBufferTarget.targetWeightPct,
      },
      explanationSummary: manifest.frontend.summary,
      explanationBundle,
      signalRefs: manifest.signalRefs,
      rebalanceDecision: deriveRebalanceDecision(
        manifest,
        requestedNotionalUsd,
        executionPlan,
      ),
      validationBadges: manifest.frontend.badges,
    });
  }

  return directionalRecommendationSchema.parse({
    version: CONTRACT_VERSION,
    recommendationId: `rec_${manifest.manifestId}`,
    slotId: manifest.slotId,
    portfolioMode: "directional",
    activationManifestRef: createActivationManifestRef(manifest),
    targetDirectionalExpression: manifest.targetDirectionalExpression ?? null,
    explanationSummary: manifest.frontend.summary,
    explanationBundle,
    signalRefs: manifest.signalRefs,
    rebalanceDecision: deriveRebalanceDecision(
      manifest,
      requestedNotionalUsd,
      executionPlan,
    ),
  });
}
