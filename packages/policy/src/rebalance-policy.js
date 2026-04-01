import {
  applyRebalanceTransition,
  createAutomationTruth,
  createChainlinkTriggerBoundary,
  createRebalanceRecord,
} from "../../shared/src/rebalance.js";

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === "string" && value.length > 0))];
}

function recommendationStateFor(input) {
  return input.driftBps >= input.thresholdBps
    && input.signalFresh
    && input.confidencePassed
    && input.turnoverWithinBudget
    ? "full_rebalance"
    : "monitor";
}

function buildNextAction(title, detail, status) {
  return { title, detail, status };
}

export function deriveRebalanceOrchestration(input) {
  const scheduledReviewEnabled = input.scheduledReviewEnabled === true;
  const chainlinkBoundary = input.chainlinkBoundary ?? createChainlinkTriggerBoundary();
  const automationTruth =
    input.automationTruth
    ?? createAutomationTruth({
      scheduledReviewEnabled,
      chainlinkBoundary,
    });
  const triggerSource = input.triggerSource ?? "policy_event";
  const runtimeOwner =
    input.runtimeOwner
    ?? (triggerSource === "scheduled_cron"
      ? "worker_offchain_scheduler"
      : "operator_manual");
  const materialDrift = input.driftBps >= input.thresholdBps;
  const policyGatePassed =
    input.signalFresh !== false
    && input.confidencePassed !== false
    && input.turnoverWithinBudget !== false;
  const liveBaselinePresent = input.hasLivePosition !== false && Boolean(input.baselineManifestId);
  const routeReady = input.routeAvailable !== false;
  const executionEligibility = input.executionEligibility ?? "ready";
  const executionState = input.executionState ?? "ready";
  const surfaceTruth = input.surfaceTruth ?? "live";
  const warnings = uniqueStrings(input.warnings);
  const blockers = uniqueStrings(input.blockers);
  const recommendationState = recommendationStateFor({
    driftBps: input.driftBps,
    thresholdBps: input.thresholdBps,
    signalFresh: input.signalFresh !== false,
    confidencePassed: input.confidencePassed !== false,
    turnoverWithinBudget: input.turnoverWithinBudget !== false,
  });

  if (!liveBaselinePresent) {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "preview_only",
      runtimeOwner,
      triggerSource,
      summary: "Preview only until a live baseline exists.",
      rationale:
        "Promoted-manifest drift is informational until there is a live baseline allocation to compare and an operator-approved lane to act on.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers,
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Wait for a live baseline",
        "A live activation or recorded baseline is required before rebalancing can move beyond preview.",
        "preview_only",
      ),
      baselineManifestId: input.baselineManifestId ?? null,
    });
  }

  if (input.operatorPaused === true) {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "paused",
      runtimeOwner: "operator_manual",
      triggerSource,
      summary: "Rebalance handling is paused by operator override.",
      rationale:
        "Operator pause must win over any scheduled or external rebalance trigger until the lane is explicitly resumed.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers: uniqueStrings([...blockers, "operator_paused"]),
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Resume when ready",
        "Operator must explicitly resume this slot before a manual CoW request can be staged.",
        "paused",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (triggerSource === "provider_triggered" && !chainlinkBoundary.canTriggerReview) {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "blocked",
      runtimeOwner: "operator_manual",
      triggerSource,
      summary: "External provider trigger failed closed.",
      rationale:
        "The Chainlink-oriented trigger surface is classified but not proven in repo truth, so provider-triggered rebalance requests cannot open a live execution path.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers: uniqueStrings([
        ...blockers,
        "provider_trigger_unproven",
        ...chainlinkBoundary.missing,
      ]),
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Use manual or scheduled review",
        "Re-run the rebalance through operator review or the worker-owned scheduled loop until provider proof exists.",
        "blocked",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (!materialDrift) {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "rebalance_deferred",
      runtimeOwner,
      triggerSource,
      summary: "Promoted-manifest drift is below the rebalance boundary.",
      rationale: `Observed drift of ${input.driftBps} bps does not clear the ${input.thresholdBps} bps policy threshold, so no manual CoW request should be staged.`,
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers,
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Keep monitoring drift",
        "Wait for a larger promoted-manifest delta or the next scheduled review.",
        "monitor",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (!policyGatePassed) {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "rebalance_deferred",
      runtimeOwner,
      triggerSource,
      summary: "Rebalance stays deferred because policy gates did not clear.",
      rationale:
        "Promoted-manifest drift is material, but freshness, confidence, or turnover checks did not justify a live rebalance request.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers,
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Refresh policy inputs",
        "Wait for fresher signals or a better turnover profile before staging operator review.",
        "monitor",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (!routeReady || executionEligibility !== "ready" || surfaceTruth !== "live") {
    const readinessBlockers = [];

    if (!routeReady) {
      readinessBlockers.push("cow_route_unavailable");
    }
    if (executionEligibility !== "ready") {
      readinessBlockers.push(`execution_${executionEligibility}`);
    }
    if (surfaceTruth !== "live") {
      readinessBlockers.push(`surface_${surfaceTruth}`);
    }

    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "blocked",
      runtimeOwner,
      triggerSource,
      summary: "Rebalance is recommended but the manual CoW lane is not ready.",
      rationale:
        "Promoted-manifest drift clears policy gates, but route truth or execution readiness still blocks a truthful manual CoW request.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers: uniqueStrings([...blockers, ...readinessBlockers]),
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Clear readiness blockers",
        "Restore live CoW readiness and operator approval prerequisites before staging execution.",
        "blocked",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (triggerSource === "scheduled_cron") {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "scheduled",
      runtimeOwner: "worker_offchain_scheduler",
      triggerSource,
      summary: "Scheduled worker review queued a manual rebalance.",
      rationale:
        "The worker-owned loop can detect drift and queue operator review, but it cannot create, sign, or submit a CoW order by itself.",
      scheduledFor: input.scheduledFor ?? input.asOf ?? new Date().toISOString(),
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers,
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Open operator review",
        "Inspect the scheduled review and decide whether to stage a manual CoW request.",
        "operator_action_required",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  if (triggerSource === "provider_triggered") {
    return createRebalanceRecord({
      rebalanceId: input.rebalanceId,
      slotId: input.slotId,
      chain: input.chain,
      targetManifestId: input.targetManifestId,
      state: "awaiting_operator",
      runtimeOwner: "operator_manual",
      triggerSource,
      summary: "Validated external trigger opened operator review.",
      rationale:
        "External provider input may only open a manual review surface; it cannot bypass operator approval or CoW signing requirements.",
      scheduledFor: null,
      recommendationState,
      executionState,
      executionEligibility,
      surfaceTruth,
      blockers,
      warnings,
      automationTruth,
      nextAction: buildNextAction(
        "Review the external trigger",
        "Inspect the event payload and decide whether to stage a manual CoW request.",
        "operator_action_required",
      ),
      baselineManifestId: input.baselineManifestId,
    });
  }

  return createRebalanceRecord({
    rebalanceId: input.rebalanceId,
    slotId: input.slotId,
    chain: input.chain,
    targetManifestId: input.targetManifestId,
    state: "rebalance_recommended",
    runtimeOwner,
    triggerSource,
    summary: "Promoted-manifest drift recommends a manual CoW rebalance.",
    rationale:
      "Policy gates passed and the CoW lane is live, but operator approval is still required before any quote or order submission.",
    scheduledFor: null,
    recommendationState,
    executionState,
    executionEligibility,
    surfaceTruth,
    blockers,
    warnings,
    automationTruth,
    nextAction: buildNextAction(
      "Stage manual CoW request",
      "Open the operator lane, request CoW quotes, and collect the required signature before submission.",
      "operator_action_required",
    ),
    baselineManifestId: input.baselineManifestId,
  });
}

export function openManualReview(rebalance, options = {}) {
  return applyRebalanceTransition(rebalance, {
    toState: "awaiting_operator",
    triggerSource: "operator_manual",
    runtimeOwner: "operator_manual",
    summary: options.summary ?? "Operator opened the rebalance review.",
    rationale:
      options.rationale
      ?? "Manual review must begin before a CoW execution request can be staged.",
    occurredAt: options.occurredAt,
    nextAction:
      options.nextAction
      ?? buildNextAction(
        "Prepare CoW request",
        "Create a manual CoW execution request and capture quotes for operator approval.",
        "operator_action_required",
      ),
  });
}

export function markRebalanceExecuting(rebalance, options = {}) {
  return applyRebalanceTransition(rebalance, {
    toState: "executing",
    triggerSource: "operator_manual",
    runtimeOwner: "operator_manual",
    summary: options.summary ?? "User-approved CoW execution is in progress.",
    rationale:
      options.rationale
      ?? "A signed CoW submission exists, so the rebalance has moved from review into tracked execution.",
    occurredAt: options.occurredAt,
    nextAction:
      options.nextAction
      ?? buildNextAction(
        "Monitor settlement",
        "Track CoW venue status and settlement confirmation until the rebalance is complete.",
        "monitor",
      ),
  });
}

export function markRebalanced(rebalance, options = {}) {
  return applyRebalanceTransition(rebalance, {
    toState: "rebalanced",
    triggerSource: "operator_manual",
    runtimeOwner: "operator_manual",
    summary: options.summary ?? "Manual CoW rebalance settled successfully.",
    rationale:
      options.rationale
      ?? "Every submitted execution leg reported confirmed settlement, so the rebalance can be marked complete.",
    occurredAt: options.occurredAt,
    nextAction:
      options.nextAction
      ?? buildNextAction(
        "Continue monitoring",
        "Future drift will be evaluated against the new live baseline.",
        "monitor",
      ),
  });
}

export function blockRebalance(rebalance, options = {}) {
  return applyRebalanceTransition(rebalance, {
    toState: "blocked",
    triggerSource: options.triggerSource ?? rebalance.triggerSource,
    runtimeOwner: "operator_manual",
    summary: options.summary ?? "Rebalance moved into a blocked state.",
    rationale:
      options.rationale
      ?? "A fail-closed runtime blocker prevents the current rebalance from moving forward.",
    occurredAt: options.occurredAt,
    blockers: uniqueStrings([...(rebalance.blockers ?? []), ...(options.blockers ?? [])]),
    nextAction:
      options.nextAction
      ?? buildNextAction(
        "Resolve the blocker",
        "Clear the fail-closed condition before staging or continuing execution.",
        "blocked",
      ),
  });
}

export function failRebalance(rebalance, options = {}) {
  return applyRebalanceTransition(rebalance, {
    toState: "failed",
    triggerSource: "operator_manual",
    runtimeOwner: "operator_manual",
    summary: options.summary ?? "Manual CoW rebalance failed.",
    rationale:
      options.rationale
      ?? "At least one submitted execution leg failed, so the rebalance must return to explicit operator handling.",
    occurredAt: options.occurredAt,
    blockers: uniqueStrings([...(rebalance.blockers ?? []), ...(options.blockers ?? [])]),
    nextAction:
      options.nextAction
      ?? buildNextAction(
        "Review failure details",
        "Inspect the failed leg and decide whether to retry, defer, or pause the lane.",
        "operator_action_required",
      ),
  });
}
