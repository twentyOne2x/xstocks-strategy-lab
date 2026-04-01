import type {
  BasketExplanationBundle,
  BasketTuningSummary,
  PortfolioExplanationBundle,
  PromotedManifest,
  RebalanceOrchestrationView,
} from "@/lib/contracts";

export function getManifestExplanationBundle(
  manifest: PromotedManifest,
): PortfolioExplanationBundle {
  return manifest.explanation.bundle;
}

export function getRecommendationExplanationBundle(
  manifest: PromotedManifest,
): PortfolioExplanationBundle {
  return manifest.preview?.recommendationExplanationBundle ?? manifest.explanation.bundle;
}

export function getBasketExplanationBundle(
  manifest: PromotedManifest,
): BasketExplanationBundle | null {
  return manifest.explanationBundle ?? null;
}

export function getBasketTuningSummary(
  manifest: PromotedManifest,
): BasketTuningSummary | null {
  return manifest.tuningSummary ?? null;
}

export function getBasketExplainability(
  manifest: PromotedManifest,
): {
  explanationBundle: BasketExplanationBundle;
  tuningSummary: BasketTuningSummary;
} | null {
  const explanationBundle = getBasketExplanationBundle(manifest);
  const tuningSummary = getBasketTuningSummary(manifest);

  if (!explanationBundle || !tuningSummary || manifest.mode !== "basket") {
    return null;
  }

  return { explanationBundle, tuningSummary };
}

export function getRebalanceOrchestration(
  manifest: PromotedManifest,
): RebalanceOrchestrationView | null {
  return manifest.preview?.rebalanceOrchestration ?? null;
}

export function isDirectionalPreviewOnly(manifest: PromotedManifest): boolean {
  return manifest.mode === "directional";
}

export function describeRuntimeOwner(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) return "You approve changes";
  return orchestration.runtimeOwner === "worker_offchain_scheduler"
    ? "Scheduled check — you approve"
    : "You approve changes";
}

export function describeTriggerSource(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) return "Review trigger unavailable";

  switch (orchestration.triggerSource) {
    case "operator_manual":
      return "Started by you";
    case "scheduled_cron":
      return "Scheduled check suggested review";
    case "policy_event":
      return "Condition flagged for review";
    case "provider_triggered":
      return "External trigger flagged";
  }
}

export function describeRebalanceState(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) return "No review truth loaded";

  switch (orchestration.state) {
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

export function formatUtcTimestamp(timestamp: string | null): string {
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

export function formatExplainabilityPercent(
  value: number,
  options: {
    signed?: boolean;
    digits?: number;
  } = {},
): string {
  const digits = options.digits ?? 1;
  const rounded = Number(value.toFixed(digits));
  const rendered = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(digits);
  const prefix = options.signed && rounded > 0 ? "+" : "";
  return `${prefix}${rendered}%`;
}

export function formatExplainabilityBps(value: number): string {
  const rounded = Number(value.toFixed(1));
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} bps`;
}

export function buildExplainabilityWeightRows(
  manifest: PromotedManifest,
  limit = 5,
): Array<{
  key: string;
  label: string;
  symbol: string;
  weightLabel: string;
  note: string;
}> {
  const basketExplainability = getBasketExplainability(manifest);

  if (!basketExplainability) {
    return [];
  }

  const { explanationBundle } = basketExplainability;
  const rows = explanationBundle.targetWeights.slice(0, limit).map((targetWeight) => ({
    key: targetWeight.symbol,
    label: targetWeight.assetName,
    symbol: targetWeight.symbol,
    weightLabel: formatExplainabilityPercent(targetWeight.targetWeightPct),
    note: `Rank ${targetWeight.rank} target weight`,
  }));

  if (explanationBundle.cashWeightPct > 0) {
    rows.push({
      key: "AUSD",
      label: "Cash reserve",
      symbol: "AUSD",
      weightLabel: formatExplainabilityPercent(explanationBundle.cashWeightPct),
      note: "Held as the cash and yield buffer",
    });
  }

  return rows;
}

export function buildExplainabilityMetricCards(
  manifest: PromotedManifest,
): Array<{
  label: string;
  value: string;
  note: string;
}> {
  const basketExplainability = getBasketExplainability(manifest);

  if (!basketExplainability) {
    return [];
  }

  const { explanationBundle } = basketExplainability;
  const leadWeight = explanationBundle.targetWeights[0];
  const benchmarkId =
    explanationBundle.benchmarkDelta.benchmarkId ?? "the current benchmark";
  const turnover =
    explanationBundle.portfolioMetrics.turnoverAnnPct === null
      ? "Not stated"
      : formatExplainabilityPercent(
          explanationBundle.portfolioMetrics.turnoverAnnPct,
        );
  const costs =
    explanationBundle.portfolioMetrics.costsTotalBps === null
      ? "Costs not stated"
      : `${formatExplainabilityBps(
          explanationBundle.portfolioMetrics.costsTotalBps,
        )} estimated costs`;

  return [
    {
      label: "Benchmark edge",
      value: formatExplainabilityPercent(
        explanationBundle.benchmarkDelta.excessReturnAfterCostPct,
        { signed: true },
      ),
      note: `After costs versus ${benchmarkId}`,
    },
    {
      label: "Largest sleeve",
      value: leadWeight
        ? `${leadWeight.symbol} ${formatExplainabilityPercent(
            leadWeight.targetWeightPct,
          )}`
        : "Not stated",
      note: `${explanationBundle.portfolioMetrics.constituentCount} names in the basket`,
    },
    {
      label: "Trading pace",
      value: turnover,
      note: costs,
    },
    {
      label: "Rebalance trigger",
      value: formatExplainabilityBps(explanationBundle.rebalanceThresholdBps),
      note: `Weights only react after ${formatExplainabilityPercent(
        explanationBundle.rebalanceThresholdPct,
      )} drift`,
    },
  ];
}

export function describeNextReviewWindow(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) return "No review truth loaded";
  if (orchestration.scheduledFor) return formatUtcTimestamp(orchestration.scheduledFor);
  return describeRebalanceState(orchestration);
}

export function describeManualVsScheduledTruth(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) {
    return "You approve all changes. Nothing executes without your confirmation.";
  }

  const statements: string[] = [];

  if (orchestration.automationTruth.operatorManualRequired) {
    statements.push("You approve all rebalances.");
  }

  if (!orchestration.automationTruth.autonomousExecutionProven) {
    statements.push("Nothing trades without your confirmation.");
  }

  if (orchestration.automationTruth.supportedTriggerSources.includes("scheduled_cron")) {
    statements.push("Scheduled checks can suggest reviews.");
  }

  return statements.join(" ");
}

export function describeExecutionTruth(
  orchestration: RebalanceOrchestrationView | null,
): string {
  if (!orchestration) {
    return "Nothing trades without your approval.";
  }

  if (orchestration.automationTruth.autonomousExecutionProven) {
    return "Autonomous rebalancing is available.";
  }

  if (orchestration.state === "blocked") {
    return "Changes are paused until conditions clear.";
  }

  if (orchestration.runtimeOwner === "worker_offchain_scheduler") {
    return "Scheduled checks can suggest reviews. You approve changes.";
  }

  if (orchestration.state === "rebalance_deferred") {
    return "No review queued. Future changes still need your approval.";
  }

  return "You approve all changes before they execute.";
}

export function getPrimaryActionLabel(manifest: PromotedManifest): string {
  return isDirectionalPreviewOnly(manifest)
    ? "View directional preview"
    : "Deposit to activate";
}

export function getSecondaryActionLabel(manifest: PromotedManifest): string {
  return isDirectionalPreviewOnly(manifest)
    ? "See full detail"
    : "See full detail";
}
