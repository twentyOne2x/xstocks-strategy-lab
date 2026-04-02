import { describe, expect, it } from "vitest";

import type { ApiManifestView, ApiSlot } from "./api-client";
import { adaptManifestToFrontend } from "./api-adapter";
import { getWorkspaceSpotlightData } from "./data-source";
import { buildPromotedManifestSlug } from "./promoted-manifest-identity";

const slot: ApiSlot = {
  slotId: "onboarding.default_basket",
  mode: "basket",
  chain: "ethereum",
  surface: "onboarding",
  position: 1,
  title: "Autopilot: Mag 7 Core",
  description: "Default onboarding basket.",
  starterBasketId: "mag7",
};

const manifest: ApiManifestView = {
  manifestId: "test-manifest",
  slotId: "onboarding.default_basket",
  mode: "basket",
  chain: "ethereum",
  strategyVersion: "basket-test-v1",
  promoted: true,
  source: {
    type: "research_promoted_manifest",
    manifestId: "test-manifest",
    slotId: "onboarding.default_basket",
  },
  frontend: {
    title: "Replay Truth Basket",
    subtitle: "Uses API replay and signal surfaces.",
    riskLabel: "moderate",
    summary: "Summary",
    badges: ["validated_strategy"],
  },
  explanation: {
    thesis: "Thesis",
    whatThisDoes: "What this does",
    bestForUser: "Best for",
    howItChanges: "How it changes",
    replayInterpretation: "Interpret replay carefully.",
    holdingRationales: [
      {
        symbol: "NVDAx",
        sleeve: "core_xstocks",
        rationale: "Lead weight",
      },
    ],
    bundle: {
      whatThisPortfolioDoes: "What this does",
      howItIsBuilt: "How it is built",
      howItChanges: "How it changes",
      whatWouldTriggerNextRebalance: "Drift breach",
      howToReadReplay: "Interpret replay carefully.",
      bestFor: "Best for",
      components: [
        {
          componentId: "nvda",
          kind: "core_holding",
          sleeve: "core_xstocks",
          title: "NVDAx",
          rationale: "Lead weight",
          targetWeightPct: 55,
          grossExposurePct: null,
          assetSymbol: "NVDAx",
          basketId: null,
          venueId: "cow_swap.ethereum",
        },
      ],
    },
  },
  explanationBundle: {
    truthMode: "promoted",
    incumbentState: "kept_promoted_run",
    reasonCodes: [
      {
        code: "selection_universe:starter_only",
        kind: "selection_universe",
        value: "starter_only",
        label: "Starter only",
      },
    ],
    targetWeights: [
      {
        rank: 1,
        symbol: "NVDAx",
        assetName: "NVIDIA",
        targetWeightPct: 55,
      },
    ],
    cashWeightPct: 5,
    rebalanceThresholdBps: 300,
    rebalanceThresholdPct: 3,
    benchmarkDelta: {
      benchmarkId: "basket.sp500_core_v1",
      returnAnnPct: 24,
      benchmarkReturnAnnPct: 13,
      afterCostReturnAnnPct: 23.5,
      benchmarkAfterCostReturnAnnPct: 13,
      excessReturnAfterCostPct: 10.5,
      score: 0.12,
      deltaVsIncumbent: 0.04,
    },
    portfolioMetrics: {
      constituentCount: 1,
      concentrationPct: 55,
      concentrationCapPct: 55,
      turnoverAnnPct: 7.5,
      costsTotalBps: 12,
    },
    summaries: {
      construction: "Construction summary",
      benchmark: "Benchmark summary",
      rebalance: "Rebalance summary",
    },
  },
  tuningSummary: {
    headline: "Tuning headline",
    currentKnobs: [
      {
        knobId: "cash_weight",
        label: "Cash sleeve",
        currentValue: "5%",
        tuningImpact: "Changes reserve capital.",
      },
    ],
    watchpoints: ["Watchpoint one"],
  },
  replay: {
    startingCapital: 1000,
    endingCapital: 1450,
    netReturnPct: 45,
    maxDrawdownPct: -6.5,
    turnoverPct: 7.5,
    winRatePct: 72.5,
    points: [
      { label: "Open", value: 1000, date: "2025-01-31" },
      { label: "Now", value: 1450, date: "2025-12-31" },
    ],
  },
  marketIntelligence: {
    currentView: "Current view from API",
    horizon: "Validation window 2025-01-31 to 2025-12-31",
    whatChanged: ["Real weight change", "Real benchmark edge"],
    drivers: [
      {
        label: "Benchmark edge",
        value: "+10.50%",
        tone: "positive",
        note: "Derived from research output.",
      },
    ],
  },
  validation: {
    datasetVersion: "dataset-v1",
    evaluatorVersion: "eval-v1",
    objectiveId: "objective-v1",
    score: 0.12,
    deltaVsIncumbent: 0.04,
    promotedAt: "2026-04-01T00:00:00.000Z",
  },
  fallback: {
    previousIncumbentId: null,
    disableConditions: [],
  },
  activationTemplate: {
    mode: "basket",
    templateId: "xstocks_basket_allocations_v1",
    fundingAssetSymbol: "USDC",
    starterBasketId: "mag7",
  },
  requiredAssets: ["NVDAx", "AUSD"],
  requiredRoutes: [
    {
      routeId: "cow_swap.ethereum",
      label: "Cow Swap on Ethereum",
      routeKind: "execution",
      requiredFor: "core_xstocks",
    },
  ],
  walletRequirements: {
    requiresWallet: true,
    requiresSmartAccount: false,
    minFundingUsd: 0,
    preferredFundingProvider: "privy",
    topUpAsset: "USDC",
    manualSigningMode: "wallet_first",
    automationAccountMode: "smart_account_required",
    venueSigningMode: "wallet_signer_manual_only",
    supportsSeparateExecutionDestination: true,
  },
  signalRefs: [
    {
      signalId: "manifest:test-manifest",
      scopeType: "basket",
      scopeKey: "mag7",
    },
  ],
  targetAllocations: [
    {
      sleeve: "core_xstocks",
      targetWeightPct: 55,
      assetSymbol: "NVDAx",
      venueId: "cow_swap.ethereum",
    },
    {
      sleeve: "yield_buffer",
      targetWeightPct: 45,
      assetSymbol: "AUSD",
      venueId: "flowdesk_ausd_rwa_strategy",
    },
  ],
  targetDirectionalExpression: null,
  routeValidation: {
    executionEligibility: "preview_only",
    surfaceTruth: "preview",
    routeTruthLabels: [
      {
        routeId: "cow_swap.ethereum",
        label: "Cow Swap on Ethereum",
        routeKind: "execution",
        verificationTier: "public_verified",
        truthState: "preview",
        availability: "preview_only",
        requiredFor: "core_xstocks",
        reason: "Preview only",
      },
    ],
    proofNotes: ["Proof note"],
    validationBadges: ["validated_strategy"],
  },
  permissions: {
    allowPause: true,
    allowTurnOff: true,
  },
  legacyFallback: false,
};

describe("adaptManifestToFrontend", () => {
  it("uses API replay and market intelligence fields instead of local score formulas", () => {
    const adapted = adaptManifestToFrontend(manifest, slot);

    expect(adapted.slug).toBe(
      buildPromotedManifestSlug(
        manifest.slotId,
        manifest.strategyVersion,
      ),
    );
    expect(adapted.replay.endingCapital).toBe(1450);
    expect(adapted.replay.netReturnPct).toBe(45);
    expect(adapted.replay.maxDrawdownPct).toBe(-6.5);
    expect(adapted.replay.turnoverPct).toBe(7.5);
    expect(adapted.replay.points).toEqual([
      { label: "Open", value: 1000 },
      { label: "Now", value: 1450 },
    ]);
    expect(adapted.market_intelligence.currentView).toBe("Current view from API");
    expect(adapted.market_intelligence.horizon).toBe(
      "Validation window 2025-01-31 to 2025-12-31",
    );
    expect(adapted.market_intelligence.whatChanged).toEqual([
      "Real weight change",
      "Real benchmark edge",
    ]);
    expect(adapted.market_intelligence.drivers).toEqual([
      {
        label: "Benchmark edge",
        value: "+10.50%",
        tone: "positive",
        note: "Derived from research output.",
      },
    ]);
  });

  it("renders API replay from replayCurve when the API omits legacy points", () => {
    const adapted = adaptManifestToFrontend(
      {
        ...manifest,
        replay: {
          ...manifest.replay,
          replayCurve: [
            { label: "Open", value: 1000, date: "2025-01-31" },
            { label: "Now", value: 1450, date: "2025-12-31" },
          ],
          points: undefined,
        },
      },
      slot,
    );

    const spotlight = getWorkspaceSpotlightData(adapted);

    expect(adapted.replay.netReturnPct).toBe(45);
    expect(adapted.replay.points).toEqual([
      { label: "Open", value: 1000 },
      { label: "Now", value: 1450 },
    ]);
    expect(spotlight.points.at(-1)?.value).toBe(1450);
  });
});
