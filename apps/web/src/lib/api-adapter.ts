/**
 * Adapts API responses to existing frontend contract types.
 * Where the API doesn't provide a field, we mark it with
 * explicit local-fallback values rather than pretending.
 */

import type {
  AllocationRow,
  BasketExplanationBundle,
  BasketTuningSummary,
  BlotterData,
  ExecutionPreviewView,
  PortfolioExplanationBundle,
  PositionRow,
  HistoryRow,
  ActivityEvent,
  RebalanceRow,
  RebalanceOrchestrationView,
  PromotedManifest,
  SmartAccountPanelData,
  StateStripItem,
} from "@/lib/contracts";
import type {
  ApiActivityData,
  ApiBasketExplanationBundle,
  ApiBasketTuningSummary,
  ApiExecutionPlan,
  ApiExecutionPreview,
  ApiLiveState,
  ApiManifestView,
  ApiPortfolioExplanationBundle,
  ApiRebalanceOrchestration,
  ApiRecommendation,
  ApiSlot,
} from "@/lib/api-client";

/* ── Slot to slug mapping ── */

const SLOT_TO_SLUG: Record<string, string> = {
  "onboarding.default_basket": "ai-infra-autopilot",
  "onboarding.alt_basket_1": "mag7-cash-balance",
  "onboarding.alt_basket_2": "spy-core-shield",
  "advanced.default_directional": "mstr-conviction-long",
};

function slugFromSlot(slotId: string): string {
  return SLOT_TO_SLUG[slotId] ?? slotId.replace(/\./g, "-");
}

function adaptExplanationBundle(
  bundle: ApiPortfolioExplanationBundle,
): PortfolioExplanationBundle {
  return {
    whatThisPortfolioDoes: bundle.whatThisPortfolioDoes,
    howItIsBuilt: bundle.howItIsBuilt,
    howItChanges: bundle.howItChanges,
    whatWouldTriggerNextRebalance: bundle.whatWouldTriggerNextRebalance,
    howToReadReplay: bundle.howToReadReplay,
    bestFor: bundle.bestFor,
    components: bundle.components.map((component) => ({
      componentId: component.componentId,
      kind: component.kind,
      sleeve: component.sleeve,
      title: component.title,
      rationale: component.rationale,
      targetWeightPct: component.targetWeightPct,
      grossExposurePct: component.grossExposurePct,
      assetSymbol: component.assetSymbol,
      basketId: component.basketId,
      venueId: component.venueId,
    })),
  };
}

function adaptBasketExplanationBundle(
  bundle: ApiBasketExplanationBundle,
): BasketExplanationBundle {
  return {
    truthMode: bundle.truthMode,
    incumbentState: bundle.incumbentState,
    reasonCodes: bundle.reasonCodes.map((reasonCode) => ({
      code: reasonCode.code,
      kind: reasonCode.kind,
      value: reasonCode.value,
      label: reasonCode.label,
    })),
    targetWeights: bundle.targetWeights.map((targetWeight) => ({
      rank: targetWeight.rank,
      symbol: targetWeight.symbol,
      assetName: targetWeight.assetName,
      targetWeightPct: targetWeight.targetWeightPct,
    })),
    cashWeightPct: bundle.cashWeightPct,
    rebalanceThresholdBps: bundle.rebalanceThresholdBps,
    rebalanceThresholdPct: bundle.rebalanceThresholdPct,
    benchmarkDelta: {
      benchmarkId: bundle.benchmarkDelta.benchmarkId,
      returnAnnPct: bundle.benchmarkDelta.returnAnnPct,
      benchmarkReturnAnnPct: bundle.benchmarkDelta.benchmarkReturnAnnPct,
      afterCostReturnAnnPct: bundle.benchmarkDelta.afterCostReturnAnnPct,
      benchmarkAfterCostReturnAnnPct: bundle.benchmarkDelta.benchmarkAfterCostReturnAnnPct,
      excessReturnAfterCostPct: bundle.benchmarkDelta.excessReturnAfterCostPct,
      score: bundle.benchmarkDelta.score,
      deltaVsIncumbent: bundle.benchmarkDelta.deltaVsIncumbent,
    },
    portfolioMetrics: {
      constituentCount: bundle.portfolioMetrics.constituentCount,
      concentrationPct: bundle.portfolioMetrics.concentrationPct,
      concentrationCapPct: bundle.portfolioMetrics.concentrationCapPct,
      turnoverAnnPct: bundle.portfolioMetrics.turnoverAnnPct,
      costsTotalBps: bundle.portfolioMetrics.costsTotalBps,
    },
    summaries: {
      construction: bundle.summaries.construction,
      benchmark: bundle.summaries.benchmark,
      rebalance: bundle.summaries.rebalance,
    },
  };
}

function adaptBasketTuningSummary(
  tuningSummary: ApiBasketTuningSummary,
): BasketTuningSummary {
  return {
    headline: tuningSummary.headline,
    currentKnobs: tuningSummary.currentKnobs.map((knob) => ({
      knobId: knob.knobId,
      label: knob.label,
      currentValue: knob.currentValue,
      tuningImpact: knob.tuningImpact,
    })),
    watchpoints: [...tuningSummary.watchpoints],
  };
}

function buildHoldingRationaleMap(manifest: ApiManifestView): Map<string, string> {
  const bundleEntries = manifest.explanation.bundle.components.map((component) => [
    `${component.assetSymbol ?? component.basketId ?? component.title}::${component.sleeve}`,
    component.rationale,
  ] as const);

  if (bundleEntries.length > 0) {
    return new Map(bundleEntries);
  }

  return new Map(
    manifest.explanation.holdingRationales.map((entry) => [
      `${entry.symbol}::${entry.sleeve}`,
      entry.rationale,
    ]),
  );
}

function humanizeRebalanceState(state: RebalanceOrchestrationView["state"]): string {
  switch (state) {
    case "preview_only":
      return "Preview only";
    case "rebalance_recommended":
      return "Review recommended";
    case "rebalance_deferred":
      return "No review queued";
    case "scheduled":
      return "Scheduled review";
    case "awaiting_operator":
      return "Waiting for your review";
    case "executing":
      return "Execution in progress";
    case "rebalanced":
      return "Marked complete";
    case "blocked":
      return "Blocked";
    case "paused":
      return "Paused";
    case "failed":
      return "Failed";
  }
}

function humanizeRuntimeOwner(
  runtimeOwner: RebalanceOrchestrationView["runtimeOwner"],
): string {
  return runtimeOwner === "worker_offchain_scheduler"
    ? "Scheduled review"
    : "You approve changes";
}

export function describeRebalanceAutomationTruth(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) {
    return "Nothing trades without your approval.";
  }

  if (orchestration.automationTruth.autonomousExecutionProven) {
    return "Autonomous rebalancing is available.";
  }

  if (orchestration.runtimeOwner === "worker_offchain_scheduler") {
    return "Scheduled checks can suggest reviews. You approve changes.";
  }

  if (orchestration.state === "rebalance_deferred") {
    return "No review queued. Future changes need your approval.";
  }

  if (orchestration.state === "blocked") {
    return "Changes paused until conditions clear.";
  }

  return "You approve all changes before they execute.";
}

function toRebalanceRowState(
  state: RebalanceOrchestrationView["state"],
): RebalanceRow["state"] {
  switch (state) {
    case "blocked":
    case "failed":
      return "act";
    case "rebalance_recommended":
    case "awaiting_operator":
      return "consider";
    case "scheduled":
    case "executing":
    case "rebalance_deferred":
    case "paused":
    case "rebalanced":
      return "monitor";
    default:
      return "none";
  }
}

function formatUtcTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Not scheduled";
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function adaptExecutionPreview(
  preview: ApiExecutionPreview | ApiExecutionPlan,
): ExecutionPreviewView {
  return {
    surfaceTruth: preview.surfaceTruth,
    executionState: preview.executionState,
    executionEligibility: preview.executionEligibility,
    routeTruthLabels: preview.routeTruthLabels.map((routeTruthLabel) => ({
      routeId: routeTruthLabel.routeId,
      label: routeTruthLabel.label,
      routeKind: routeTruthLabel.routeKind,
      chain: routeTruthLabel.chain,
      verificationTier: routeTruthLabel.verificationTier,
      truthState: routeTruthLabel.truthState,
      availability: routeTruthLabel.availability,
      requiredFor: routeTruthLabel.requiredFor,
      reason: routeTruthLabel.reason,
    })),
    blockers: [...preview.blockers],
    warnings: [...preview.warnings],
  };
}

export function adaptRebalanceOrchestration(
  orchestration: ApiRebalanceOrchestration,
): RebalanceOrchestrationView {
  return {
    rebalanceId: orchestration.rebalanceId,
    slotId: orchestration.slotId,
    chain: orchestration.chain,
    targetManifestId: orchestration.targetManifestId,
    state: orchestration.state,
    runtimeOwner: orchestration.runtimeOwner,
    triggerSource: orchestration.triggerSource,
    summary: orchestration.summary,
    rationale: orchestration.rationale,
    scheduledFor: orchestration.scheduledFor,
    recommendationState: orchestration.recommendationState,
    executionState: orchestration.executionState,
    executionEligibility: orchestration.executionEligibility,
    surfaceTruth: orchestration.surfaceTruth,
    providerReceiptId: orchestration.providerReceiptId,
    executionRequestId: orchestration.executionRequestId,
    executionTriggerSource: orchestration.executionTriggerSource,
    executionRequestState: orchestration.executionRequestState,
    blockers: [...orchestration.blockers],
    warnings: [...orchestration.warnings],
    automationTruth: {
      operatorManualRequired: orchestration.automationTruth.operatorManualRequired,
      autonomousExecutionProven: orchestration.automationTruth.autonomousExecutionProven,
      providerTriggeredProven: orchestration.automationTruth.providerTriggeredProven,
      supportedTriggerSources: [...orchestration.automationTruth.supportedTriggerSources],
      notes: [...orchestration.automationTruth.notes],
    },
    nextAction: orchestration.nextAction
      ? {
          title: orchestration.nextAction.title,
          detail: orchestration.nextAction.detail,
          status: orchestration.nextAction.status,
        }
      : null,
  };
}

export function attachPreviewTruthToManifest(
  manifest: PromotedManifest,
  options: {
    recommendation?: ApiRecommendation | null;
    rebalanceOrchestration?: ApiRebalanceOrchestration | null;
    executionPreview?: ApiExecutionPreview | ApiExecutionPlan | null;
  },
): PromotedManifest {
  const preview = manifest.preview ?? {
    recommendationExplanationBundle: null,
    rebalanceOrchestration: null,
    executionPreview: null,
  };
  const executionState = options.executionPreview?.executionState ?? null;
  const readinessState =
    executionState === "ready"
      ? "activation_ready"
      : executionState === "wallet_required"
        ? "connect_required"
        : executionState === "funding_required"
          ? "funding_required"
          : executionState === "smart_account_required" ||
              executionState === "smart_account_pending"
            ? "connect_required"
            : executionState === "blocked"
              ? "blocked"
              : null;
  const fundingLabel =
    readinessState === "activation_ready"
      ? "Requested notional looks funded"
      : readinessState === "funding_required"
        ? "Additional USDC funding required"
        : manifest.market_intelligence.walletState.fundingLabel;
  const accountLabel =
    readinessState === "connect_required"
      ? "Connect wallet to reveal deposit destination"
      : readinessState === "activation_ready"
        ? "Linked wallet path is ready"
        : manifest.market_intelligence.walletState.accountLabel;

  return {
    ...manifest,
    activation_template:
      readinessState === null
        ? manifest.activation_template
        : {
            ...manifest.activation_template,
            required_state: readinessState,
          },
    market_intelligence:
      readinessState === null
        ? manifest.market_intelligence
        : {
            ...manifest.market_intelligence,
            walletState: {
              ...manifest.market_intelligence.walletState,
              state: readinessState,
              accountLabel,
              fundingLabel,
            },
          },
    live_state:
      readinessState === null
        ? manifest.live_state
        : {
            ...manifest.live_state,
            state: readinessState,
          },
    preview: {
      recommendationExplanationBundle: options.recommendation?.explanationBundle
        ? adaptExplanationBundle(options.recommendation.explanationBundle)
        : preview.recommendationExplanationBundle,
      rebalanceOrchestration: options.rebalanceOrchestration
        ? adaptRebalanceOrchestration(options.rebalanceOrchestration)
        : preview.rebalanceOrchestration,
      executionPreview: options.executionPreview
        ? adaptExecutionPreview(options.executionPreview)
        : preview.executionPreview,
    },
  };
}

function buildRebalanceRowFromTruth(
  manifest: PromotedManifest,
  orchestration: RebalanceOrchestrationView,
): RebalanceRow {
  const scheduledLabel = orchestration.scheduledFor
    ? `Review window: ${formatUtcTimestamp(orchestration.scheduledFor)}`
    : orchestration.summary;

  return {
    id: orchestration.rebalanceId,
    manifestSlug: manifest.slug,
    strategyTitle: manifest.frontend.title,
    window: humanizeRebalanceState(orchestration.state),
    trigger: orchestration.state === "scheduled" ? scheduledLabel : orchestration.summary,
    action: orchestration.nextAction?.detail ?? orchestration.rationale,
    route: humanizeRuntimeOwner(orchestration.runtimeOwner),
    impact: describeRebalanceAutomationTruth(orchestration),
    state: toRebalanceRowState(orchestration.state),
  };
}

/* ── Manifest adapter ── */

export function adaptManifestToFrontend(
  manifest: ApiManifestView,
  slot: ApiSlot,
): PromotedManifest {
  const slugVal = slugFromSlot(manifest.slotId);
  const leadAsset = manifest.requiredAssets.find((a) => a !== "AUSD") ?? manifest.requiredAssets[0] ?? "xStock";
  const rationaleMap = buildHoldingRationaleMap(manifest);
  const explanationBundle = adaptExplanationBundle(manifest.explanation.bundle);
  const basketExplanationBundle = manifest.explanationBundle
    ? adaptBasketExplanationBundle(manifest.explanationBundle)
    : null;
  const tuningSummary = manifest.tuningSummary
    ? adaptBasketTuningSummary(manifest.tuningSummary)
    : null;
  const constructionSummary =
    basketExplanationBundle?.summaries.construction ??
    explanationBundle.whatThisPortfolioDoes;
  const benchmarkSummary =
    basketExplanationBundle?.summaries.benchmark ??
    explanationBundle.bestFor;
  const rebalanceSummary =
    basketExplanationBundle?.summaries.rebalance ??
    explanationBundle.howItChanges;
  const watchpoints = tuningSummary?.watchpoints ?? [];
  const apiReplay = manifest.replay;
  const apiMarketIntelligence = manifest.marketIntelligence;
  const replay = apiReplay
    ? {
        startingCapital: apiReplay.startingCapital,
        endingCapital: apiReplay.endingCapital,
        netReturnPct: apiReplay.netReturnPct,
        maxDrawdownPct: apiReplay.maxDrawdownPct,
        turnoverPct: apiReplay.turnoverPct,
        winRatePct: apiReplay.winRatePct,
        monthlyEdgePct: basketExplanationBundle
          ? Number(
              (
                basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct / 12
              ).toFixed(4),
            )
          : 0,
        points: apiReplay.points.map((point) => ({
          label: point.label,
          value: point.value,
        })),
      }
    : {
        startingCapital: 1000,
        endingCapital: 1000,
        netReturnPct: 0,
        maxDrawdownPct: 0,
        turnoverPct: basketExplanationBundle?.portfolioMetrics.turnoverAnnPct ?? 0,
        winRatePct: 0,
        monthlyEdgePct: basketExplanationBundle
          ? Number(
              (
                basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct / 12
              ).toFixed(4),
            )
          : 0,
      };

  // Map target allocations to frontend AllocationRow
  const allocations: AllocationRow[] = manifest.targetAllocations.map((a) => ({
    symbol: a.assetSymbol ?? a.basketId ?? "Unknown",
    targetWeight: `${a.targetWeightPct.toFixed(1)}%`,
    sleeve: a.sleeve.replace(/_/g, " "),
    venue: a.venueId ?? "xChange",
    multiplier: manifest.mode === "directional" && manifest.targetDirectionalExpression
      ? `${manifest.targetDirectionalExpression.grossExposurePct / 100}x`
      : "1.00x",
    proofOfReserves: "—", // filled from live state when available
    rationale: rationaleMap.get(`${a.assetSymbol ?? a.basketId ?? "Unknown"}::${a.sleeve}`)
      ?? "",
  }));

  // Route validation data
  const rv = manifest.routeValidation;
  const surfaceTruth = rv?.surfaceTruth ?? "preview";
  const execRoutes = manifest.requiredRoutes;
  const primaryVenue = execRoutes[0]?.label ?? "xChange";
  const backupVenue = execRoutes[1]?.label ?? "None";

  // Build a state from API data
  const stateMap: Record<string, string> = {
    preview: "view_ready",
    live: "active",
    blocked: "blocked",
    mentor_confirmed: "activation_ready",
    unverified: "view_ready",
  };
  const userState = (stateMap[surfaceTruth] ?? "view_ready") as PromotedManifest["live_state"]["state"];

  return {
    manifest_id: manifest.manifestId,
    slot_id: manifest.slotId,
    mode: manifest.mode,
    chain: manifest.chain === "ethereum" ? "Ethereum" : manifest.chain,
    strategy_version: manifest.strategyVersion,
    theme_id: slot.slotId.includes("alt_basket_1") ? "ai-infra"
      : slot.slotId.includes("alt_basket_2") ? "us-tech-leaders"
      : slot.slotId.includes("directional") ? "directional"
      : "mag7-core",
    slug: slugVal,
    hero_symbol: leadAsset,
    frontend: {
      title: manifest.frontend.title,
      subtitle: manifest.frontend.subtitle,
      risk_label: manifest.frontend.riskLabel,
      summary: manifest.frontend.summary,
      thesis: constructionSummary,
      badges: manifest.frontend.badges.map((b) =>
        typeof b === "string"
          ? { label: b.split(":")[0]?.trim() ?? b, detail: b.split(":")[1]?.trim() ?? "", tone: "methodology" as const }
          : { label: b.label.split(":")[0]?.trim() ?? b.label, detail: b.label.split(":")[1]?.trim() ?? "", tone: (b.kind ?? "methodology") as "methodology" },
      ),
    },
    validation: {
      dataset_version: manifest.validation.datasetVersion,
      evaluator_version: manifest.validation.evaluatorVersion,
      objective_id: manifest.validation.objectiveId,
      score: manifest.validation.score,
      delta_vs_incumbent: manifest.validation.deltaVsIncumbent ?? 0,
      promoted_at: manifest.validation.promotedAt,
      last_validated_at: manifest.validation.promotedAt,
    },
    activation_template: {
      route_summary: `Move ${manifest.activationTemplate.fundingAssetSymbol} from your own wallet, then execute through verified routes on ${manifest.chain}.`,
      allowed_actions: ["Connect wallet", "Fund wallet", "Activate strategy", "Pause strategy"],
      funding_options: [
        `${manifest.activationTemplate.fundingAssetSymbol} transfer`,
        "Privy-linked wallet balance",
      ],
      rails: execRoutes.map((r) => r.label),
      reversible: manifest.permissions.allowPause || manifest.permissions.allowTurnOff,
      required_state: userState === "active" ? "activation_ready" as const : userState as PromotedManifest["activation_template"]["required_state"],
    },
    fallback: {
      previous_incumbent_id: manifest.fallback.previousIncumbentId,
      disable_conditions: manifest.fallback.disableConditions,
    },
    market_intelligence: {
      scopeLabel: "Market Intelligence",
      currentView: apiMarketIntelligence?.currentView ?? constructionSummary,
      confidence: basketExplanationBundle
        ? `${basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct >= 0 ? "+" : ""}${basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct.toFixed(2)}% edge`
        : `Score ${manifest.validation.score.toFixed(3)}`,
      horizon:
        apiMarketIntelligence?.horizon ??
        (manifest.mode === "directional"
          ? "10 to 30 trading days"
          : "15 to 60 trading days"),
      implication:
        apiMarketIntelligence?.whatChanged[0] ??
        tuningSummary?.headline ??
        explanationBundle.bestFor,
      whatChanged:
        apiMarketIntelligence?.whatChanged ?? [
          rebalanceSummary,
          ...watchpoints.slice(0, 2),
          ...(rv?.proofNotes ?? ["Route truth loaded from live API."]),
        ],
      promptQueue: [
        {
          label: manifest.mode === "basket" && basketExplanationBundle ? "Why these weights" : "Why now",
          prompt:
            manifest.mode === "basket" && basketExplanationBundle
              ? `Explain why ${manifest.frontend.title} uses its current basket weights and cash reserve.`
              : `Explain the current setup for ${manifest.frontend.title}.`,
        },
        {
          label:
            manifest.mode === "basket" && basketExplanationBundle
              ? "Rebalance trigger"
              : "Route truth",
          prompt:
            manifest.mode === "basket" && basketExplanationBundle
              ? `Explain what would cause the next rebalance review for ${manifest.frontend.title}.`
              : "Show route verification status for this portfolio.",
        },
      ],
      drivers:
        apiMarketIntelligence?.drivers ?? [
          {
            label: "Surface truth",
            value: surfaceTruth,
            tone: surfaceTruth === "live" ? "positive" as const : "neutral" as const,
            note: `Current truth state from API: ${surfaceTruth}`,
          },
          ...(basketExplanationBundle
            ? [
                {
                  label: "Cash reserve",
                  value: `${basketExplanationBundle.cashWeightPct}% AUSD`,
                  tone: "neutral" as const,
                  note: "Keeps a visible cash reserve instead of forcing full equity exposure.",
                },
                {
                  label: "Rebalance trigger",
                  value: `${basketExplanationBundle.rebalanceThresholdBps} bps`,
                  tone: "warning" as const,
                  note: `Review starts only when drift clears ${basketExplanationBundle.rebalanceThresholdPct}%`,
                },
                {
                  label: "Benchmark edge",
                  value: `${basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct >= 0 ? "+" : ""}${basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct.toFixed(2)}%`,
                  tone:
                    basketExplanationBundle.benchmarkDelta.excessReturnAfterCostPct >= 0
                      ? "positive" as const
                      : "warning" as const,
                  note: `After estimated costs versus ${basketExplanationBundle.benchmarkDelta.benchmarkId ?? "the benchmark"}`,
                },
              ]
            : []),
          {
            label: "Execution eligibility",
            value: rv?.executionEligibility ?? "preview_only",
            tone: rv?.executionEligibility === "executable" ? "positive" as const : "warning" as const,
            note: `Eligibility: ${rv?.executionEligibility ?? "preview_only"}`,
          },
        ],
      routeState: {
        chain: manifest.chain === "ethereum" ? "Ethereum" : manifest.chain,
        primaryVenue,
        backupVenue,
        reserveWindow: manifest.walletRequirements.minFundingUsd > 0
          ? `Min $${manifest.walletRequirements.minFundingUsd} required`
          : "No fixed minimum in policy",
        multiplierWindow: manifest.targetDirectionalExpression
          ? `${(manifest.targetDirectionalExpression.grossExposurePct / 100).toFixed(2)}x`
          : "1.00x spot",
        proofOfReserves: "Live from API",
        status: surfaceTruth,
      },
      walletState: {
        state: userState,
        accountLabel: manifest.walletRequirements.requiresWallet
          ? "Wallet connection happens at activation"
          : "No wallet required",
        fundingLabel: manifest.walletRequirements.minFundingUsd > 0
          ? `Min $${manifest.walletRequirements.minFundingUsd} to activate`
          : "No fixed minimum in policy",
        permissionSummary: "Permissions appear at activation.",
      },
      vaultState: {
        venue: primaryVenue,
        structure: manifest.mode === "basket" ? "Spot basket" : "Directional view",
        borrowAsset: manifest.targetDirectionalExpression ? "AUSD" : "None",
        reversibility: manifest.permissions.allowPause ? "Pause available" : "Review required",
        status: surfaceTruth === "preview" ? "Preview" : "Active",
      },
      actions: ["See the view", "Compare replay", "Deposit to activate"],
    },
    explanation: {
      thesis: constructionSummary,
      whatThisDoes: constructionSummary,
      bestForUser: explanationBundle.bestFor,
      howItChanges: rebalanceSummary,
      replayInterpretation: explanationBundle.howToReadReplay,
      holdingRationales: explanationBundle.components.map((component) => ({
        symbol: component.assetSymbol ?? component.basketId ?? component.title,
        sleeve: component.sleeve.replace(/_/g, " "),
        rationale: component.rationale,
      })),
      bundle: explanationBundle,
    },
    replay,
    comparison: [],
    allocations,
    route_notes: rv?.proofNotes ?? ["Route truth loaded from live API."],
    methodology_notes: [
      `Dataset: ${manifest.validation.datasetVersion}`,
      `Evaluator: ${manifest.validation.evaluatorVersion}`,
      `Objective: ${manifest.validation.objectiveId}`,
      benchmarkSummary,
      ...watchpoints.slice(0, 2),
      explanationBundle.howToReadReplay,
    ],
    explanationBundle: basketExplanationBundle,
    tuningSummary,
    live_state: {
      state: userState,
      routeLabel: surfaceTruth === "preview" ? "Preview" : "Live",
      routeSummary: `${primaryVenue}${backupVenue !== "None" ? ` / ${backupVenue}` : ""}`,
      reserveLabel: "From API",
      multiplierLabel: manifest.targetDirectionalExpression
        ? `${(manifest.targetDirectionalExpression.grossExposurePct / 100).toFixed(2)}x`
        : "Spot only",
      proofOfReservesLabel: "Live from API",
      pauseRule: manifest.permissions.allowPause
        ? "Pause stops future rebalances."
        : "Your review required.",
    },
    preview: {
      recommendationExplanationBundle: null,
      rebalanceOrchestration: null,
      executionPreview: null,
    },
  };
}

/* ── Blotter adapter from activity surface ── */

export function adaptActivityToBlotter(
  activity: ApiActivityData,
  manifests: PromotedManifest[],
): BlotterData {
  const surface = activity.activitySurface;
  const activityManifest = activity.manifest
    ? manifests.find((manifest) => manifest.slot_id === activity.manifest?.slotId)
    : null;
  const orchestration = activity.rebalanceOrchestration
    ? adaptRebalanceOrchestration(activity.rebalanceOrchestration)
    : null;

  const positions: PositionRow[] = surface?.positions.map((p, i) => ({
    id: `pos_api_${i}`,
    symbol: p.assetSymbol,
    sleeve: p.sleeve.replace(/_/g, " "),
    mode: manifests.find((m) => m.allocations.some((a) => a.symbol === p.assetSymbol))?.mode ?? "basket",
    exposureUsd: `$${Math.round(p.targetNotionalUsd).toLocaleString("en-US")}`,
    pnlPct: "—",
    route: p.venueId ?? "xChange",
    nextRebalance: orchestration
      ? humanizeRebalanceState(orchestration.state)
      : "Preview",
    state: p.status === "preview" ? "active" as const : p.status === "active" ? "active" as const : "watch" as const,
    updatedAt: new Date(p.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
  })) ?? [];

  const history: HistoryRow[] = surface?.history.map((h) => ({
    id: h.id,
    timestamp: new Date(h.occurredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
    type: h.type,
    description: h.summary,
    venue: "API",
    amount: "—",
    status: h.status as "settled" | "pending" | "blocked",
  })) ?? [];

  const activityEvents: ActivityEvent[] = surface?.lifecycle.map((l) => ({
    id: l.id,
    time: new Date(l.occurredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
    title: l.title,
    detail: l.detail,
    state: (l.state === "preview" ? "view_ready" : l.state) as ActivityEvent["state"],
    nextAction: l.nextAction ?? "No action",
  })) ?? [];

  const rebalancing: RebalanceRow[] =
    activityManifest && orchestration
      ? [buildRebalanceRowFromTruth(activityManifest, orchestration)]
      : manifests.slice(0, 1).map((manifest, index) => ({
          id: `rebalance_api_${index}`,
          manifestSlug: manifest.slug,
          strategyTitle: manifest.frontend.title,
          window: "Preview only",
          trigger:
            manifest.mode === "directional"
              ? "Directional stays preview-only until live execution is proven."
              : manifest.explanation.bundle.whatWouldTriggerNextRebalance,
          action:
            manifest.mode === "directional"
              ? "No basket rebalance rationale is shown on directional preview."
              : "No truthful rebalance runtime was loaded for this screen.",
          route: "You review changes",
          impact: "You approve all changes.",
          state: manifest.mode === "directional" ? "none" as const : "monitor" as const,
        }));

  return { positions, history, activity: activityEvents, rebalancing };
}

/* ── Smart account adapter from execution plan ── */

export function adaptExecutionPlanToSmartAccount(
  plan: ApiExecutionPlan,
  manifest: PromotedManifest,
): SmartAccountPanelData {
  const sa = plan.smartAccount;
  const bridge = sa.bridgeState;
  const fp = plan.fundingPath;
  const automation = plan.automationExecution;
  const orchestration = manifest.preview?.rebalanceOrchestration ?? null;
  const formatAddress = (value: string | null) =>
    value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not ready";

  const readinessState = plan.executionState === "ready" ? "activation_ready" as const
    : plan.executionState === "wallet_required" ? "connect_required" as const
    : plan.executionState === "funding_required" ? "funding_required" as const
    : plan.executionState === "smart_account_required" ? "connect_required" as const
    : "view_ready" as const;

  return {
    readinessLabel: `${plan.executionState.replace(/_/g, " ")} — ${plan.executionEligibility.replace(/_/g, " ")}`,
    readinessState,
    addressLabel: formatAddress(bridge.policyAccountAddress),
    ownerLabel:
      automation.readiness === "ready"
        ? "Automation account ready"
        : automation.readiness.replace(/_/g, " "),
    fundingAsset: fp.topUpAsset,
    buyingPower: fp.fundingGapUsd > 0
      ? `$${fp.fundingGapUsd.toLocaleString()} gap`
      : `$${fp.fundedNotionalUsd.toLocaleString()} funded`,
    policyLabel: `${bridge.manualSigningMode.replace(/_/g, " ")} / ${bridge.venueSigningMode.replace(/_/g, " ")}`,
    syncLabel: `Generated ${new Date(plan.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`,
    automationLabel: orchestration
      ? orchestration.runtimeOwner === "worker_offchain_scheduler"
        ? "A scheduled review record exists, but operator confirmation is still required before any rebalance execution claim."
        : orchestration.summary
      : automation.notes[1] ?? "Rebalance review truth was not loaded for this screen.",
    nextAction:
      (
        automation.readiness !== "ready"
          ? automation.blockers[0] ?? automation.notes[0]
          : orchestration?.nextAction?.detail
      )
      ?? plan.steps.find((s) => s.status === "pending")?.detail
      ?? plan.steps.find((s) => s.status === "blocked")?.detail
      ?? "Review the preview before deposit.",
    accountSurfaces: [
      {
        label: "Manual signer",
        value: formatAddress(bridge.manualSignerAddress),
        note: "Current user-approved venue signing remains wallet-first.",
      },
      {
        label: "Policy account",
        value: formatAddress(bridge.policyAccountAddress),
        note: "Canonical automation and policy ownership surface.",
      },
      {
        label: "Execution destination",
        value: formatAddress(bridge.executionDestinationAddress),
        note: bridge.supportsSeparateExecutionDestination
          ? "Separate receiver is supported on the current venue path."
          : "Settlement stays on the manual signer until a separate destination is proven.",
      },
      {
        label: "Venue signing",
        value: bridge.venueSigningMode.replace(/_/g, " "),
        note: "AA-native CoW or 1inch signing remains deferred.",
      },
      {
        label: "Automation readiness",
        value: automation.readiness.replace(/_/g, " "),
        note: automation.blockers[0] ?? automation.notes[0],
      },
    ],
    actionLinks: [
      {
        label: "Open detail",
        href: `/workspace/detail/${manifest.slug}`,
        tone: "ghost" as const,
      },
      {
        label: "Deposit to activate",
        href: `/activate/${manifest.slug}`,
        tone: readinessState === "activation_ready" || readinessState === "funding_required"
          ? "primary" as const
          : "secondary" as const,
      },
    ],
    permissions: [
      {
        label: "Pause",
        value: plan.allowedActions.some((a) => a.toLowerCase().includes("pause")) ? "Enabled" : "Not available",
        note: manifest.live_state.pauseRule,
      },
      {
        label: "Turn off",
        value: plan.allowedActions.some((a) => a.toLowerCase().includes("turn off")) ? "Enabled" : "Not exposed",
        note: manifest.activation_template.reversible ? "Reversible." : "Your review required.",
      },
      {
        label: "Slippage band",
        value: manifest.mode === "directional" ? "85 bps" : "35 bps",
        note: `Via ${manifest.live_state.routeSummary}`,
      },
      {
        label: "Surface truth",
        value: plan.surfaceTruth,
        note: `Eligibility: ${plan.executionEligibility}`,
      },
    ],
  };
}

/* ── State strip from live state ── */

export function adaptLiveStateToStrip(
  liveState: ApiLiveState,
  manifests: PromotedManifest[],
): StateStripItem[] {
  const assets = liveState.liveXStocksState.assets;
  const routes = liveState.liveRouteState.routes;
  const availableRoutes = routes.filter((r) => r.availability === "available" || r.availability === "preview_only");

  return [
    {
      label: "Live routes",
      value: `${availableRoutes.length} of ${routes.length}`,
      delta: `${availableRoutes.length}`,
      status: availableRoutes.length > 0 ? "up" as const : "attention" as const,
      note: routes.map((r) => `${r.label}: ${r.availability}`).join(". "),
    },
    {
      label: "Promoted portfolios",
      value: `${manifests.length} preview`,
      delta: `${manifests.length}`,
      status: "steady" as const,
      note: "Only promoted manifests are surfaced.",
    },
    {
      label: "Live assets",
      value: `${assets.length} tracked`,
      delta: `${assets.filter((a) => a.priceUsd !== null).length} priced`,
      status: "up" as const,
      note: `Prices as of ${liveState.liveXStocksState.asOf}`,
    },
    {
      label: "Funding posture",
      value: "Preview until deposit",
      delta: "explicit",
      status: "steady" as const,
      note: "All portfolios stay preview-only before deposit.",
    },
  ];
}

/* ── Enrich allocations with live asset data ── */

export function enrichAllocationsWithLiveState(
  manifest: PromotedManifest,
  liveState: ApiLiveState,
): PromotedManifest {
  const assetMap = new Map(
    liveState.liveXStocksState.assets.map((a) => [a.assetSymbol, a]),
  );

  const enrichedAllocations = manifest.allocations.map((alloc) => {
    const live = assetMap.get(alloc.symbol);
    return {
      ...alloc,
      proofOfReserves: live?.proofOfReserves ?? alloc.proofOfReserves,
    };
  });

  return { ...manifest, allocations: enrichedAllocations };
}
