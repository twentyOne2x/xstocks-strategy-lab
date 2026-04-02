import type {
  ExecutionPreviewView,
  PromotedManifest,
  RebalanceOrchestrationView,
} from "@/lib/contracts";

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
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

export function humanizeRebalanceState(state: string | null | undefined): string {
  if (!state) {
    return "No review truth loaded";
  }

  return state.replaceAll("_", " ");
}

export function getExecuteAllBlocker({
  orchestration,
  latestActivationId,
}: {
  orchestration: RebalanceOrchestrationView | null;
  latestActivationId: string | null;
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

  if (!latestActivationId) {
    return "Saved activation is required before execute_all can stage execution.";
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
  const routeLabels = executionPreview?.routeTruthLabels.map((route) => route.label.toLowerCase()) ?? [];
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

export function buildRebalanceControlSnapshot({
  manifest,
  orchestration,
  executionPreview,
  latestActivationId,
}: {
  manifest: PromotedManifest;
  orchestration: RebalanceOrchestrationView | null;
  executionPreview: ExecutionPreviewView | null;
  latestActivationId: string | null;
}): RebalanceControlSnapshot {
  const executeAllBlocker = getExecuteAllBlocker({
    orchestration,
    latestActivationId,
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
    executeAllEnabled: executeAllBlocker === null,
  };
}
