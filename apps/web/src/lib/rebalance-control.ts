import type {
  ExecutionPreviewView,
  PromotedManifest,
  RebalanceOrchestrationView,
} from "@/lib/contracts";

export interface RebalanceEventDraft {
  source: string;
  summary: string;
  confidence: string;
  affectedSleeves: string[];
  affectedSymbols: string[];
  portfolioImplication: string;
  persistence: "local_stub";
  updatedAt: string | null;
}

export interface RebalanceRecommendationView {
  id: string;
  label: string;
  rationale: string;
  portfolioEffect: string;
  tone: "act" | "consider" | "monitor";
}

export interface DoAllRecommendationsControl {
  mode: "review_only" | "stage_only" | "blocked";
  enabled: boolean;
  badgeLabel: string;
  detail: string;
}

export interface RebalanceControlSnapshot {
  eventSummary: string;
  confidenceLabel: string;
  portfolioImplication: string;
  readinessLabel: string;
  executeAllBlocker: string | null;
  blockers: string[];
  warnings: string[];
  liveBoundary: string | null;
  executeAllEnabled: boolean;
  doAllControl: DoAllRecommendationsControl;
}

const NEGATIVE_EVENT_KEYWORDS = [
  "drawdown",
  "downgrade",
  "fraud",
  "headwind",
  "higher rates",
  "investigation",
  "miss",
  "negative",
  "overheated",
  "pullback",
  "risk",
  "selloff",
  "slowdown",
  "stress",
  "volatile",
  "volatility",
  "weaker",
];

const POSITIVE_EVENT_KEYWORDS = [
  "approval",
  "beat",
  "breakout",
  "expansion",
  "improving",
  "momentum",
  "positive",
  "reacceleration",
  "rebound",
  "stronger",
  "tailwind",
  "upgrade",
];

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

function parseTargetWeight(value: string): number {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function sortAllocationsByTargetWeight(manifest: PromotedManifest) {
  return [...manifest.allocations].sort(
    (left, right) => parseTargetWeight(right.targetWeight) - parseTargetWeight(left.targetWeight),
  );
}

function pickAffectedSymbols(manifest: PromotedManifest): string[] {
  return sortAllocationsByTargetWeight(manifest)
    .filter((allocation) => !allocation.symbol.toLowerCase().includes("usd"))
    .map((allocation) => allocation.symbol)
    .slice(0, 3);
}

function pickAffectedSleeves(manifest: PromotedManifest): string[] {
  return uniqueStrings(
    sortAllocationsByTargetWeight(manifest)
      .map((allocation) => allocation.sleeve)
      .slice(0, 4),
  ).slice(0, 3);
}

function normalizeDraftList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(
    value.map((entry) => (typeof entry === "string" ? entry.trim() : null)),
  ).slice(0, 4);
}

function normalizeDraftText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function findAllocationForSymbol(manifest: PromotedManifest, symbol: string) {
  return manifest.allocations.find(
    (allocation) => allocation.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

function inferEventTone(event: RebalanceEventDraft): "negative" | "positive" | "mixed" {
  const text = [
    event.summary,
    event.portfolioImplication,
    event.affectedSleeves.join(" "),
    event.affectedSymbols.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const hasNegativeSignal = NEGATIVE_EVENT_KEYWORDS.some((keyword) => text.includes(keyword));
  const hasPositiveSignal = POSITIVE_EVENT_KEYWORDS.some((keyword) => text.includes(keyword));

  if (hasNegativeSignal) {
    return "negative";
  }

  if (hasPositiveSignal) {
    return "positive";
  }

  return "mixed";
}

function parseConfidenceScore(label: string): number {
  const percentMatch = label.match(/(\d+(?:\.\d+)?)\s*%/);

  if (percentMatch) {
    return Number(percentMatch[1]);
  }

  const scoreMatch = label.match(/score\s*(\d+(?:\.\d+)?)/i);

  if (scoreMatch) {
    const parsed = Number(scoreMatch[1]);
    return parsed <= 1 ? parsed * 100 : parsed;
  }

  if (/high|strong|conviction|ready/i.test(label)) {
    return 80;
  }

  if (/low|uncertain|preview|tentative/i.test(label)) {
    return 40;
  }

  return 55;
}

function describeTriggerSource(
  triggerSource: RebalanceOrchestrationView["triggerSource"],
): string {
  switch (triggerSource) {
    case "operator_manual":
      return "operator_manual";
    case "scheduled_cron":
      return "scheduled_cron";
    case "policy_event":
      return "policy_event";
    case "provider_triggered":
      return "provider_triggered";
  }
}

export function humanizeRebalanceState(state: string | null | undefined): string {
  if (!state) {
    return "No review truth loaded";
  }

  return state.replaceAll("_", " ");
}

export function getExecuteAllBlocker({
  orchestration,
}: {
  orchestration: RebalanceOrchestrationView | null;
}): string | null {
  if (!orchestration) {
    return "No persisted rebalance review is loaded for this slot.";
  }

  if (orchestration.triggerSource !== "provider_triggered") {
    return "Execute all currently supports provider-triggered awaiting operator review only.";
  }

  if (orchestration.state !== "awaiting_operator") {
    return `Execute all requires awaiting_operator review, received ${orchestration.state}.`;
  }

  if (orchestration.executionState !== "ready") {
    return `Execute all requires executionState=ready, received ${orchestration.executionState}.`;
  }

  if (orchestration.executionEligibility !== "executable") {
    return `Execute all requires executionEligibility=executable, received ${orchestration.executionEligibility}.`;
  }

  if (orchestration.surfaceTruth !== "live") {
    return `Execute all requires surfaceTruth=live, received ${orchestration.surfaceTruth}.`;
  }

  return null;
}

export function getOneInchBoundaryNote({
  manifest,
  executionPreview,
}: {
  manifest: PromotedManifest;
  executionPreview: ExecutionPreviewView | null;
}): string | null {
  const primaryVenue = manifest.market_intelligence.routeState.primaryVenue.toLowerCase();
  const routeLabels =
    executionPreview?.routeTruthLabels.map((route) => route.label.toLowerCase()) ?? [];
  const oneInchVisible =
    primaryVenue.includes("1inch") || routeLabels.some((label) => label.includes("1inch"));

  if (
    !oneInchVisible ||
    !executionPreview ||
    executionPreview.surfaceTruth !== "live" ||
    executionPreview.executionEligibility !== "executable"
  ) {
    return null;
  }

  return "Signer-owned 1inch Fusion EIP-712 signatures are still required before backend submission can be recorded.";
}

export function buildDefaultRebalanceEventDraft(
  manifest: PromotedManifest,
): RebalanceEventDraft {
  return {
    source: "Manual operator stub",
    summary:
      manifest.market_intelligence.whatChanged[0] ??
      manifest.market_intelligence.currentView,
    confidence: manifest.market_intelligence.confidence,
    affectedSleeves: pickAffectedSleeves(manifest),
    affectedSymbols: pickAffectedSymbols(manifest),
    portfolioImplication: manifest.market_intelligence.implication,
    persistence: "local_stub",
    updatedAt: null,
  };
}

export function hydrateRebalanceEventDraft(
  manifest: PromotedManifest,
  value: unknown,
): RebalanceEventDraft {
  return coerceRebalanceEventDraft(value, buildDefaultRebalanceEventDraft(manifest));
}

export function coerceRebalanceEventDraft(
  value: unknown,
  fallback: RebalanceEventDraft,
): RebalanceEventDraft {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const stored = value as Record<string, unknown>;
  const affectedSleeves = normalizeDraftList(stored.affectedSleeves);
  const affectedSymbols = normalizeDraftList(stored.affectedSymbols);

  return {
    source: normalizeDraftText(stored.source, fallback.source),
    summary: normalizeDraftText(stored.summary, fallback.summary),
    confidence: normalizeDraftText(stored.confidence, fallback.confidence),
    affectedSleeves:
      affectedSleeves.length > 0 ? affectedSleeves : fallback.affectedSleeves,
    affectedSymbols:
      affectedSymbols.length > 0 ? affectedSymbols : fallback.affectedSymbols,
    portfolioImplication: normalizeDraftText(
      stored.portfolioImplication,
      fallback.portfolioImplication,
    ),
    persistence: "local_stub",
    updatedAt:
      typeof stored.updatedAt === "string" && stored.updatedAt.length > 0
        ? stored.updatedAt
        : null,
  };
}

export function buildDoAllRecommendationsControl({
  orchestration,
  executeAllBlocker,
  latestActivationId,
  authenticated,
  ready,
  executionRequest,
}: {
  orchestration: RebalanceOrchestrationView | null;
  executeAllBlocker: string | null;
  latestActivationId: string | null;
  authenticated: boolean;
  ready: boolean;
  executionRequest: {
    state?: string | null;
    triggerSource?: string | null;
  } | null;
}): DoAllRecommendationsControl {
  if (!ready) {
    return {
      mode: "blocked",
      enabled: false,
      badgeLabel: "Blocked",
      detail: "Wallet auth is still loading on this surface.",
    };
  }

  if (!authenticated) {
    return {
      mode: "blocked",
      enabled: false,
      badgeLabel: "Blocked",
      detail:
        "Connect wallet with Privy before this surface can stage the canonical execute_all handoff.",
    };
  }

  if (!orchestration) {
    return {
      mode: "review_only",
      enabled: false,
      badgeLabel: "Review only",
      detail:
        "Manual event recommendations are live on this rail, but no persisted provider-triggered rebalance review is loaded yet.",
    };
  }

  if (executeAllBlocker === null) {
    const continuingStagedRequest =
      executionRequest?.triggerSource === "provider_staging" &&
      executionRequest.state !== "confirmed" &&
      executionRequest.state !== "failed";

    return {
      mode: "stage_only",
      enabled: true,
      badgeLabel: continuingStagedRequest ? "Continue staging" : "Stage only",
      detail: continuingStagedRequest
        ? `Continue the canonical execute_all staging request from ${humanizeRebalanceState(executionRequest.state)} and sign any returned wallet-first venue approvals.`
        : latestActivationId
          ? "Reuse the canonical execute_all path for this provider-triggered review. The flow stages execution truthfully and can still prompt for wallet-first 1inch signatures before backend submission is recorded."
          : "Persist activation truth, then reuse the canonical execute_all path for this provider-triggered review. This surface stays fail-closed and does not claim autonomous live execution.",
    };
  }

  if (
    orchestration.triggerSource !== "provider_triggered" ||
    orchestration.state !== "awaiting_operator"
  ) {
    return {
      mode: "review_only",
      enabled: false,
      badgeLabel: "Review only",
      detail:
        orchestration.state !== "awaiting_operator"
          ? `Backend review truth is ${humanizeRebalanceState(orchestration.state)}, so this rail will only stage recommendations for review right now.`
          : `Current trigger source is ${describeTriggerSource(orchestration.triggerSource)}, so this rail will not call provider-backed execute_all yet.`,
    };
  }

  return {
    mode: "blocked",
    enabled: false,
    badgeLabel: "Blocked",
    detail: executeAllBlocker ?? "Execution posture is not ready for staging on this surface.",
  };
}

export function buildRebalanceControlSnapshot({
  manifest,
  orchestration,
  executionPreview,
  latestActivationId,
  authenticated,
  ready,
  executionRequest,
}: {
  manifest: PromotedManifest;
  orchestration: RebalanceOrchestrationView | null;
  executionPreview: ExecutionPreviewView | null;
  latestActivationId: string | null;
  authenticated: boolean;
  ready: boolean;
  executionRequest: {
    state?: string | null;
    triggerSource?: string | null;
  } | null;
}): RebalanceControlSnapshot {
  const executeAllBlocker = getExecuteAllBlocker({
    orchestration,
  });
  const liveBoundary = getOneInchBoundaryNote({
    manifest,
    executionPreview,
  });
  const blockers = uniqueStrings([
    executeAllBlocker,
    ...(orchestration?.blockers ?? []),
    ...(executionPreview?.blockers ?? []),
  ]);
  const warnings = uniqueStrings([
    liveBoundary,
    ...(orchestration?.warnings ?? []),
    ...(executionPreview?.warnings ?? []),
  ]);
  const doAllControl = buildDoAllRecommendationsControl({
    orchestration,
    executeAllBlocker,
    latestActivationId,
    authenticated,
    ready,
    executionRequest,
  });

  return {
    eventSummary: manifest.market_intelligence.currentView,
    confidenceLabel: manifest.market_intelligence.confidence,
    portfolioImplication: manifest.market_intelligence.implication,
    readinessLabel: orchestration
      ? `${humanizeRebalanceState(orchestration.state)} · ${orchestration.surfaceTruth}`
      : executionPreview
        ? `${executionPreview.executionState.replaceAll("_", " ")} · ${executionPreview.surfaceTruth}`
        : "No backend readiness loaded",
    executeAllBlocker,
    blockers,
    warnings,
    liveBoundary,
    executeAllEnabled: doAllControl.enabled,
    doAllControl,
  };
}

export function buildRebalanceRecommendations({
  manifest,
  event,
  snapshot,
}: {
  manifest: PromotedManifest;
  event: RebalanceEventDraft;
  snapshot: RebalanceControlSnapshot;
}): RebalanceRecommendationView[] {
  const tone = inferEventTone(event);
  const confidenceScore = parseConfidenceScore(event.confidence);
  const lowConfidence = confidenceScore < 55;
  const recommendations: RebalanceRecommendationView[] = [];
  const primarySymbol =
    event.affectedSymbols[0] ?? pickAffectedSymbols(manifest)[0] ?? null;
  const primaryAllocation = primarySymbol
    ? findAllocationForSymbol(manifest, primarySymbol)
    : null;
  const affectedSleeveLabel =
    event.affectedSleeves.slice(0, 2).join(", ") || "the affected sleeves";
  const cashBufferAvailable = manifest.allocations.some(
    (allocation) =>
      allocation.symbol.toLowerCase().includes("usd") ||
      allocation.sleeve.toLowerCase().includes("cash"),
  );

  const pushRecommendation = (recommendation: RebalanceRecommendationView) => {
    if (recommendations.some((item) => item.label === recommendation.label)) {
      return;
    }

    recommendations.push(recommendation);
  };

  if (!lowConfidence && primarySymbol && tone !== "positive") {
    pushRecommendation({
      id: `trim-${primarySymbol.toLowerCase()}`,
      label: `Trim ${primarySymbol}`,
      rationale: primaryAllocation
        ? `${primarySymbol} is one of the highest-weight names in the promoted mix at ${primaryAllocation.targetWeight}. A defensive trim keeps the event stub fail-closed without rewriting the whole basket.`
        : `${primarySymbol} is directly affected by the current event stub, so the safest first move is to reduce concentration before any staged execute_all call.`,
      portfolioEffect: primaryAllocation
        ? `Reduce concentration in ${primarySymbol} from ${primaryAllocation.targetWeight} and redirect the freed notional toward cash or lower-beta holdings on the next review.`
        : `Reduce direct exposure to ${primarySymbol} before any live venue request is staged.`,
      tone: "act",
    });
  }

  if (!lowConfidence && tone !== "positive" && cashBufferAvailable) {
    pushRecommendation({
      id: "raise-cash",
      label: "Raise cash",
      rationale: "The current basket already uses an explicit cash sleeve. Increasing that buffer is the lowest-risk way to absorb the event without pretending the backend can autonomously rebalance from the rail.",
      portfolioEffect: "Increase reserve capacity so the portfolio can absorb fresh drift and leave room for a later reviewed rebalance.",
      tone: "consider",
    });
  }

  if (tone !== "positive") {
    pushRecommendation({
      id: "pause-adds",
      label: "Pause adds",
      rationale: `New capital should stay out of ${affectedSleeveLabel} until the event confidence and backend review truth are aligned.`,
      portfolioEffect: "Keep fresh deposits from increasing exposure to the affected sleeves while this event stays active.",
      tone: lowConfidence ? "monitor" : "consider",
    });
  }

  if (!lowConfidence && tone === "negative") {
    pushRecommendation({
      id: "rotate-defensives",
      label: "Rotate to defensives",
      rationale: "When the event tone is adverse, the next review should favor the lower-volatility names already present in the promoted mix instead of forcing new directional adds.",
      portfolioEffect: "Shift the next reviewed rebalance toward steadier sleeves or the cash buffer without fabricating a new automation path.",
      tone: "consider",
    });
  }

  pushRecommendation({
    id: "monitor-only",
    label: "Monitor only",
    rationale: lowConfidence
      ? "Confidence is still light enough that this surface should default to observation over turnover."
      : "Even after staging, the current backend path still depends on explicit review and signer-owned venue approvals.",
    portfolioEffect: `Leave weights unchanged while the current backend posture remains ${snapshot.readinessLabel.toLowerCase()}.`,
    tone: "monitor",
  });

  return recommendations.slice(0, 4);
}
