import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  adaptResearchPromotedManifest,
  applyRebalanceTransition,
  assertPromotedActivationManifest,
  compileQuestionnaireQualification,
  deriveAgentQualification,
  deriveExecutionPlan,
  deriveQualificationDecision,
  deriveRebalanceOrchestration,
  deriveRecommendation,
  normalizeOnboardingAnswers,
  REBALANCE_ORCHESTRATION_STATE,
  REBALANCE_RUNTIME_OWNER,
  REBALANCE_TRIGGER_SOURCE,
} from "../src/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const DEFAULT_MANIFEST_ID = JSON.parse(
  readFileSync(SLOT_REGISTRY_PATH, "utf8"),
).slots["onboarding.default_basket"].currentManifestRef.manifestId;

async function loadResearchManifest(slotId) {
  const raw = await readFile(
    resolve(
      REPO_ROOT,
      `packages/research/manifests/promoted/${slotId}/current.json`,
    ),
    "utf8",
  );

  return adaptResearchPromotedManifest(JSON.parse(raw));
}

async function loadRawResearchManifest(slotId) {
  const raw = await readFile(
    resolve(
      REPO_ROOT,
      `packages/research/manifests/promoted/${slotId}/current.json`,
    ),
    "utf8",
  );

  return JSON.parse(raw);
}

async function loadQualificationFixture(name) {
  const raw = await readFile(
    resolve(REPO_ROOT, `scripts/fixtures/qualification/${name}.json`),
    "utf8",
  );

  return JSON.parse(raw);
}

function createBoundaryState(manifest) {
  return {
    liveXStocksState: {
      stateVersion: "policy-test.xstocks.v1",
      asOf: "2026-03-31T12:00:00.000Z",
      assets: manifest.executionBoundary.requiredAssets.map((assetSymbol) => ({
        assetSymbol,
        chain: "ethereum",
        status: "active",
        priceUsd: assetSymbol === "AUSD" ? 1 : 100,
      })),
    },
    liveRouteState: {
      stateVersion: "policy-test.routes.v1",
      asOf: "2026-03-31T12:00:00.000Z",
      routes: [
        {
          routeId: "cow_swap.ethereum",
          label: "Cow Swap on Ethereum",
          routeKind: "execution",
          chain: "ethereum",
          verificationTier: "public_verified",
          availability: "available",
          notes: "Verified Ethereum execution rail.",
        },
        {
          routeId: "flowdesk.ausd-rwa-strategy",
          label: "Flowdesk AUSD RWA Strategy",
          routeKind: "yield_vault",
          chain: "ethereum",
          verificationTier: "public_verified",
          availability: "available",
          notes: "Verified AUSD yield-buffer sleeve.",
        },
        {
          routeId: "euler.ethereum.directional",
          label: "Euler Directional",
          routeKind: "directional_market",
          chain: "ethereum",
          verificationTier: "unverified",
          availability: "preview_only",
          notes: "Directional lane remains preview-only until exact live proof exists.",
        },
      ],
    },
  };
}

function createActivationBaseline({
  activationId = "act_prev",
  manifestId = "onboarding.default_basket:basket-baseline-v0:promoted",
  slotId = "onboarding.default_basket",
} = {}) {
  return {
    activationId,
    manifestId,
    slotId,
  };
}

const rawBasketManifest = await loadRawResearchManifest("onboarding.default_basket");
const basketManifest = await loadResearchManifest("onboarding.default_basket");
const directionalManifest = await loadResearchManifest("advanced.default_directional");
const basketBoundaryState = createBoundaryState(basketManifest);
const directionalBoundaryState = createBoundaryState(directionalManifest);

test("research-provided execution boundary is consumed directly when present", () => {
  assert.equal(basketManifest.legacyFallback, false);
  assert.deepEqual(basketManifest.executionBoundary, rawBasketManifest.executionBoundary);
  assert.deepEqual(basketManifest.requiredRoutes, rawBasketManifest.executionBoundary.requiredRoutes);
  assert.deepEqual(
    basketManifest.walletRequirements,
    rawBasketManifest.executionBoundary.walletRequirements,
  );
  assert.equal(basketManifest.signalRefs[0].signalId, rawBasketManifest.signal_refs[0]);
});

test("basket manifests carry validated research explanation truth without exposing it on the default recommendation path", () => {
  assert.equal(
    basketManifest.researchExplanationBundle.truthMode,
    "promoted_incumbent_and_run_summary_only",
  );
  assert.equal(basketManifest.researchExplanationBundle.reasonCodes.length > 0, true);
  assert.match(
    basketManifest.researchTuningSummary.headline,
    /300 bps rebalance trigger/i,
  );
  assert.equal(Object.hasOwn(basketManifest, "tuningSummary"), false);
  assert.equal(Object.hasOwn(directionalManifest, "researchExplanationBundle"), false);
  assert.equal(Object.hasOwn(directionalManifest, "researchTuningSummary"), false);
});

test("promoted manifests are required at the execution boundary", () => {
  assert.doesNotThrow(() => assertPromotedActivationManifest(basketManifest));

  assert.throws(() =>
    assertPromotedActivationManifest({
      ...basketManifest,
      promoted: false,
    }),
  );
});

test("verified rails with no wallet stay preview-only until wallet connection", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {},
  });

  assert.equal(executionPlan.surfaceTruth, "preview");
  assert.equal(executionPlan.executionState, "wallet_required");
  assert.equal(
    executionPlan.routeTruthLabels.every((route) => route.truthState === "live"),
    true,
  );
});

test("verified rails become live only after wallet, funding, and smart account are ready", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  assert.equal(executionPlan.surfaceTruth, "live");
  assert.equal(executionPlan.executionState, "ready");
  assert.equal(executionPlan.executionEligibility, "executable");
});

test("directional preflight stays preview-only and fails closed on unverified Euler rails", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: directionalManifest,
    live_xstocks_state: directionalBoundaryState.liveXStocksState,
    live_route_state: directionalBoundaryState.liveRouteState,
    user_notional_usd: 2500,
    wallet_state: {
      walletConnected: true,
      fundedNotionalUsd: 3000,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  assert.equal(executionPlan.surfaceTruth, "preview");
  assert.equal(executionPlan.executionState, "blocked");
  assert.equal(executionPlan.routeTruthLabels[0].truthState, "unverified");
});

test("recommendations stay tied to canonical promoted manifest refs", () => {
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {},
  });

  assert.equal(
    recommendation.activationManifestRef.manifestId,
    DEFAULT_MANIFEST_ID,
  );
  assert.equal(recommendation.rebalanceDecision.state, "full_rebalance");
  assert.equal(recommendation.signalRefs[0].signalId, rawBasketManifest.signal_refs[0]);
  assert.deepEqual(
    recommendation.targetAllocations,
    basketManifest.targetAllocations,
  );
  assert.equal(
    recommendation.explanationBundle.whatThisPortfolioDoes,
    `${basketManifest.frontend.summary} It keeps ${basketManifest.researchExplanationBundle.cashWeightPct}% in AUSD as a yield buffer instead of forcing full equity exposure.`,
  );
  assert.equal(Object.hasOwn(recommendation, "researchExplanationBundle"), false);
  assert.equal(Object.hasOwn(recommendation, "researchTuningSummary"), false);
  assert.equal(recommendation.explanationBundle.components[0].assetSymbol, "NVDAx");
  assert.equal(recommendation.explanationBundle.components.at(-1).kind, "yield_buffer");
});

test("execution plans keep Privy funding surfaces available when smart-wallet bootstrap is optional for CoW", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      embeddedWallet: {
        status: "ready",
        address: "0xembedded",
      },
      smartAccount: {
        status: "pending",
      },
    },
  });

  assert.equal(executionPlan.executionState, "ready");
  assert.equal(executionPlan.executionEligibility, "executable");
  assert.equal(executionPlan.smartAccount.providerId, "privy");
  assert.equal(executionPlan.smartAccount.readiness, "not_required");
  assert.equal(executionPlan.smartAccount.bootstrap.state, "ready");
  assert.equal(executionPlan.smartAccount.bootstrap.destinationAddress, "0xembedded");
  assert.equal(executionPlan.fundingPath.destinationAddress, "0xembedded");
  assert.equal(executionPlan.fundingPath.destinationKind, "embedded_wallet");
  assert.equal(executionPlan.fundingPath.readiness, "funded");
  assert.deepEqual(
    executionPlan.fundingPath.surfaces.map((surface) => surface.methodId),
    ["privy_card", "privy_wallet", "privy_exchange", "manual_transfer"],
  );
});

test("verified CoW basket rails become live at the requested notional without a smart wallet", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 25,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 25,
    },
  });

  assert.equal(executionPlan.surfaceTruth, "live");
  assert.equal(executionPlan.executionState, "ready");
  assert.equal(executionPlan.executionEligibility, "executable");
  assert.equal(executionPlan.fundingPath.minRequiredUsd, 25);
  assert.equal(executionPlan.fundingPath.fundingGapUsd, 0);
  assert.equal(executionPlan.smartAccount.readiness, "not_required");
  assert.equal(
    executionPlan.steps.find((step) => step.stepId === "prepare_smart_account")?.status,
    "complete",
  );
});

test("directional recommendations carry preview-safe explanation bundles", () => {
  const recommendation = deriveRecommendation({
    activation_manifest: directionalManifest,
    live_xstocks_state: directionalBoundaryState.liveXStocksState,
    live_route_state: directionalBoundaryState.liveRouteState,
    user_notional_usd: 2500,
    wallet_state: {
      walletConnected: true,
      fundedNotionalUsd: 3000,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  assert.equal(recommendation.portfolioMode, "directional");
  assert.match(
    recommendation.explanationBundle.whatWouldTriggerNextRebalance,
    /preview-only/i,
  );
  assert.equal(
    recommendation.explanationBundle.components[0].kind,
    "directional_expression",
  );
});

test("legacy fallback remains basket-only and bounded", () => {
  const legacyManifest = adaptResearchPromotedManifest({
    manifest_id: "onboarding.default_basket:legacy-v1:promoted",
    slot_id: "onboarding.default_basket",
    mode: "basket",
    chain: "ethereum",
    strategy_version: "legacy-v1",
    frontend: {
      title: "Legacy basket",
      subtitle: "Compatibility lane",
      risk_label: "moderate",
      summary: "Legacy compatibility manifest.",
      badges: ["promoted_manifest"],
    },
    validation: {
      dataset_version: "research-bundle-v1",
      evaluator_version: "strategy_lab_evaluator_v1",
      objective_id: "basket_excess_calmar_after_cost_v1",
      score: 1,
      delta_vs_incumbent: 0,
      promoted_at: "2026-03-31T12:51:52.958Z",
    },
    activation_template: {
      template_id: "legacy_basket_v1",
      basket_id: "mag7",
      target_weights: [
        { symbol: "NVDAx", weight: 0.6 },
        { symbol: "MSFTx", weight: 0.35 },
      ],
      cash_weight: 0.05,
    },
    fallback: {
      previous_incumbent_id: null,
      disable_conditions: ["slot_not_promoted"],
    },
  });

  assert.equal(legacyManifest.legacyFallback, true);
  assert.equal(legacyManifest.requiredRoutes[0].routeId, "cow_swap.ethereum");
  assert.throws(
    () =>
      adaptResearchPromotedManifest({
        manifest_id: "advanced.default_directional:legacy-v1:promoted",
        slot_id: "advanced.default_directional",
        mode: "directional",
        chain: "ethereum",
        strategy_version: "legacy-v1",
        frontend: {
          title: "Legacy directional",
          subtitle: "Compatibility lane",
          risk_label: "high",
          summary: "Should not be accepted.",
          badges: ["preview_only"],
        },
        validation: {
          dataset_version: "research-bundle-v1",
          evaluator_version: "strategy_lab_evaluator_v1",
          objective_id: "directional_calmar_after_cost_v1",
          score: 0,
          delta_vs_incumbent: 0,
          promoted_at: "2026-03-31T12:51:52.958Z",
        },
        activation_template: {
          template_id: "legacy_directional_v1",
        },
        fallback: {
          previous_incumbent_id: null,
          disable_conditions: ["preview_only"],
        },
      }),
    /Legacy research manifest fallback only supports promoted basket manifests/,
  );
});

test("rebalance orchestration stays preview-only until a live activation baseline exists", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  const rebalance = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: null,
  });

  assert.equal(
    rebalance.state,
    REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY,
  );
  assert.equal(rebalance.nextAction?.status, "preview_only");
});

test("rebalance orchestration recommends operator review when a newer promoted manifest replaces the activation baseline", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  const rebalance = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: createActivationBaseline(),
  });

  assert.equal(
    rebalance.state,
    REBALANCE_ORCHESTRATION_STATE.REBALANCE_RECOMMENDED,
  );
  assert.equal(
    rebalance.allowedTransitions.includes(
      REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
    ),
    true,
  );
});

test("scheduled cron evaluations can queue a truthful scheduled rebalance review", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  const rebalance = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: createActivationBaseline(),
    trigger_source: REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON,
    now: "2026-04-01T08:00:00.000Z",
  });

  assert.equal(rebalance.state, REBALANCE_ORCHESTRATION_STATE.SCHEDULED);
  assert.equal(rebalance.scheduledFor, "2026-04-01T08:00:00.000Z");
  assert.equal(
    rebalance.runtimeOwner,
    REBALANCE_RUNTIME_OWNER.WORKER_OFFCHAIN_SCHEDULER,
  );
});

test("provider-triggered evaluations stay fail-closed at the Chainlink-oriented boundary", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });

  const rebalance = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: createActivationBaseline(),
    trigger_source: REBALANCE_TRIGGER_SOURCE.PROVIDER_TRIGGERED,
  });

  assert.equal(rebalance.state, REBALANCE_ORCHESTRATION_STATE.BLOCKED);
  assert.equal(rebalance.automationTruth.providerTriggeredProven, false);
  assert.deepEqual(rebalance.automationTruth.supportedTriggerSources, [
    "operator_manual",
    "scheduled_cron",
  ]);
  assert.match(rebalance.blockers[0], /Chainlink/i);
});

test("rebalance orchestration fails closed when manifest drift exists but readiness checks are not satisfied", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {},
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {},
  });

  const rebalance = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: createActivationBaseline(),
  });

  assert.equal(rebalance.state, REBALANCE_ORCHESTRATION_STATE.BLOCKED);
  assert.equal(rebalance.executionState, "wallet_required");
});

test("explicit rebalance transitions stay bounded to manual operator actions", () => {
  const executionPlan = deriveExecutionPlan({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommendation = deriveRecommendation({
    activation_manifest: basketManifest,
    live_xstocks_state: basketBoundaryState.liveXStocksState,
    live_route_state: basketBoundaryState.liveRouteState,
    user_notional_usd: 1000,
    wallet_state: {
      walletConnected: true,
      walletAddress: "0xabc",
      fundedNotionalUsd: 1250,
      smartAccount: {
        status: "ready",
        address: "0xsmart",
      },
    },
  });
  const recommended = deriveRebalanceOrchestration({
    activation_manifest: basketManifest,
    recommendation,
    execution_plan: executionPlan,
    latest_activation: createActivationBaseline(),
  });
  const scheduled = applyRebalanceTransition({
    current_rebalance: recommended,
    next_state: REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
    scheduled_for: "2026-04-01T10:00:00.000Z",
  });
  const executing = applyRebalanceTransition({
    current_rebalance: scheduled,
    next_state: REBALANCE_ORCHESTRATION_STATE.EXECUTING,
  });
  const rebalanced = applyRebalanceTransition({
    current_rebalance: executing,
    next_state: REBALANCE_ORCHESTRATION_STATE.REBALANCED,
  });

  assert.equal(scheduled.state, REBALANCE_ORCHESTRATION_STATE.SCHEDULED);
  assert.equal(executing.state, REBALANCE_ORCHESTRATION_STATE.EXECUTING);
  assert.equal(rebalanced.state, REBALANCE_ORCHESTRATION_STATE.REBALANCED);
});

for (const fixtureName of [
  "broad-cautious",
  "theme-tilt",
  "active-leaders",
  "directional-opt-in",
]) {
  test(`qualification fixture ${fixtureName} resolves canonical slot and truth`, async () => {
    const fixture = await loadQualificationFixture(fixtureName);
    const compiled = compileQuestionnaireQualification({
      question_answers: fixture.answers,
      submittedAt: "2026-04-01T12:00:00.000Z",
    });
    const normalizedAnswers = compiled.normalizedOnboardingAnswers;
    const decision = deriveQualificationDecision({
      onboarding_answers: normalizedAnswers,
    });
    const manifest = await loadResearchManifest(fixture.expected.slotId);
    const boundaryState = createBoundaryState(manifest);
    const qualification = deriveAgentQualification({
      onboarding_answers: normalizedAnswers,
      activation_manifest: manifest,
      live_xstocks_state: boundaryState.liveXStocksState,
      live_route_state: boundaryState.liveRouteState,
      user_notional_usd: manifest.walletRequirements.minFundingUsd,
      wallet_state: fixture.walletState,
    });

    assert.equal(decision.selection.slotId, fixture.expected.slotId);
    assert.equal(qualification.selection.mode, fixture.expected.mode);
    assert.equal(
      qualification.normalizedAnswers.selectedStarterSlotId,
      fixture.expected.slotId,
    );
    assert.equal(
      qualification.activationTruth.executionState,
      fixture.expected.executionState,
    );
    assert.equal(
      qualification.activationTruth.directionalPreviewOnly,
      fixture.expected.directionalPreviewOnly,
    );
    assert.equal(
      qualification.activationTruth.activationReady,
      fixture.expected.activationReady,
    );
    assert.equal(
      qualification.activationTruth.executionEligibility,
      fixture.expected.executionEligibility,
    );
    assert.equal(
      qualification.explanationSurface.surfaceId,
      "recommendation.explanationBundle",
    );
  });
}
