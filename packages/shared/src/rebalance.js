export const REBALANCE_STATES = Object.freeze([
  "preview_only",
  "rebalance_recommended",
  "rebalance_deferred",
  "scheduled",
  "awaiting_operator",
  "executing",
  "rebalanced",
  "blocked",
  "paused",
  "failed",
]);

export const REBALANCE_RUNTIME_OWNERS = Object.freeze([
  "operator_manual",
  "worker_offchain_scheduler",
]);

export const REBALANCE_TRIGGER_SOURCES = Object.freeze([
  "operator_manual",
  "scheduled_cron",
  "policy_event",
  "provider_triggered",
]);

export const PROVIDER_CLASSIFICATIONS = Object.freeze([
  "implemented",
  "prototype",
  "externally_plausible_but_unproven",
  "not_in_current_design",
]);

export const REBALANCE_ALLOWED_TRANSITIONS = Object.freeze({
  preview_only: Object.freeze(["rebalance_deferred", "rebalance_recommended", "blocked", "paused"]),
  rebalance_recommended: Object.freeze(["awaiting_operator", "scheduled", "rebalance_deferred", "blocked", "paused"]),
  rebalance_deferred: Object.freeze(["rebalance_recommended", "scheduled", "blocked", "paused"]),
  scheduled: Object.freeze(["awaiting_operator", "rebalance_deferred", "blocked", "paused"]),
  awaiting_operator: Object.freeze(["executing", "rebalance_deferred", "blocked", "paused", "failed"]),
  executing: Object.freeze(["rebalanced", "blocked", "paused", "failed"]),
  rebalanced: Object.freeze(["rebalance_deferred", "rebalance_recommended", "scheduled", "blocked", "paused"]),
  blocked: Object.freeze(["rebalance_deferred", "rebalance_recommended", "scheduled", "paused"]),
  paused: Object.freeze(["rebalance_deferred", "rebalance_recommended", "scheduled", "blocked"]),
  failed: Object.freeze(["awaiting_operator", "rebalance_deferred", "blocked", "paused"]),
});

export const MANUAL_COW_REVIEW_START_STATES = Object.freeze([
  "rebalance_recommended",
  "scheduled",
  "failed",
]);

const PROVIDER_CLASSIFICATION_RANK = Object.freeze({
  implemented: 4,
  prototype: 3,
  externally_plausible_but_unproven: 2,
  not_in_current_design: 1,
});

function assertMember(name, value, supported) {
  if (!supported.includes(value)) {
    throw new Error(`${name} must be one of: ${supported.join(", ")}.`);
  }
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === "string" && value.length > 0))];
}

function createTransitionId(prefix, occurredAt) {
  const compactTime = String(occurredAt ?? new Date().toISOString()).replace(/[^\d]/g, "");
  return `${prefix}_${compactTime}`;
}

export function getRuntimeOwnerForTrigger(triggerSource) {
  assertMember("triggerSource", triggerSource, REBALANCE_TRIGGER_SOURCES);
  return triggerSource === "scheduled_cron"
    ? "worker_offchain_scheduler"
    : "operator_manual";
}

export function canTransitionRebalanceState(fromState, toState) {
  assertMember("fromState", fromState, REBALANCE_STATES);
  assertMember("toState", toState, REBALANCE_STATES);
  return REBALANCE_ALLOWED_TRANSITIONS[fromState].includes(toState);
}

export function assertRebalanceTransition(fromState, toState) {
  if (!canTransitionRebalanceState(fromState, toState)) {
    throw new Error(`Invalid rebalance transition: ${fromState} -> ${toState}.`);
  }
}

export function createTransitionRecord(input) {
  const occurredAt = input.occurredAt ?? new Date().toISOString();

  if (input.fromState !== null) {
    assertMember("fromState", input.fromState, REBALANCE_STATES);
  }
  assertMember("toState", input.toState, REBALANCE_STATES);
  assertMember("triggerSource", input.triggerSource, REBALANCE_TRIGGER_SOURCES);

  return {
    transitionId: input.transitionId ?? createTransitionId("rebalance_transition", occurredAt),
    eventType: input.eventType ?? input.toState,
    fromState: input.fromState ?? null,
    toState: input.toState,
    triggerSource: input.triggerSource,
    summary: input.summary,
    rationale: input.rationale,
    scheduledFor: input.scheduledFor ?? null,
    occurredAt,
  };
}

function pickProviderClassification(classifications) {
  let winner = "not_in_current_design";

  for (const classification of classifications) {
    assertMember("providerClassification", classification, PROVIDER_CLASSIFICATIONS);

    if (
      PROVIDER_CLASSIFICATION_RANK[classification]
      > PROVIDER_CLASSIFICATION_RANK[winner]
    ) {
      winner = classification;
    }
  }

  return winner;
}

export function createChainlinkTriggerBoundary(options = {}) {
  const automationClassification =
    options.automationClassification ?? "externally_plausible_but_unproven";
  const creClassification =
    options.creClassification ?? "externally_plausible_but_unproven";
  const classification = pickProviderClassification([
    automationClassification,
    creClassification,
  ]);
  const reviewProofArtifacts = uniqueStrings(options.reviewProofArtifacts);
  const executionProofArtifacts = uniqueStrings(options.executionProofArtifacts);
  const signedEventValidation = options.signedEventValidation === true;
  const reviewProven =
    classification === "implemented"
    && signedEventValidation
    && reviewProofArtifacts.length > 0;
  const executionProven =
    reviewProven
    && classification === "implemented"
    && executionProofArtifacts.length > 0;
  const missing = [];

  if (classification !== "implemented") {
    missing.push("missing_provider_adapter");
  }
  if (!signedEventValidation) {
    missing.push("missing_signed_event_validation");
  }
  if (reviewProofArtifacts.length === 0) {
    missing.push("missing_provider_proof");
  }
  if (executionProofArtifacts.length === 0) {
    missing.push("missing_settlement_artifact");
  }

  return {
    providerId: "chainlink",
    label: "Chainlink-oriented rebalance trigger boundary",
    classification,
    automationClassification,
    creClassification,
    signedEventValidation,
    reviewProofArtifacts,
    executionProofArtifacts,
    reviewProven,
    executionProven,
    canTriggerReview: reviewProven,
    canExecute: executionProven,
    missing: uniqueStrings(missing),
    notes: [
      "Chainlink automation may only open a review after repo-owned adapter, signed-event validation, and proof artifacts exist.",
      "Chainlink CRE/CCIP stays classification-only until a repo-owned adapter and proof artifact exist.",
      "Even with provider review proof, operator approval remains mandatory before any CoW submission.",
    ],
  };
}

export function createAutomationTruth(options = {}) {
  const scheduledReviewEnabled = options.scheduledReviewEnabled === true;
  const autonomousExecutionProven = options.autonomousExecutionProven === true;
  const chainlinkBoundary = options.chainlinkBoundary ?? createChainlinkTriggerBoundary();
  const supportedTriggerSources = ["operator_manual", "policy_event"];

  if (scheduledReviewEnabled) {
    supportedTriggerSources.push("scheduled_cron");
  }
  if (chainlinkBoundary.canTriggerReview) {
    supportedTriggerSources.push("provider_triggered");
  }

  return {
    operatorManualRequired: true,
    autonomousExecutionProven,
    providerTriggeredProven: chainlinkBoundary.reviewProven,
    supportedTriggerSources,
    notes: uniqueStrings([
      "Operator approval is required before any CoW execution request is created.",
      scheduledReviewEnabled
        ? "Worker-owned scheduled reviews can queue operator review, but cannot submit trades."
        : "No worker-owned scheduled review loop is enabled in this runtime.",
      chainlinkBoundary.canTriggerReview
        ? "Provider-triggered review is enabled only for validated external events."
        : `Provider-triggered review stays fail-closed because the Chainlink-oriented boundary is ${chainlinkBoundary.classification}.`,
      autonomousExecutionProven
        ? "Autonomous execution proof exists for this runtime."
        : "No autonomous execution proof exists for this runtime.",
    ]),
  };
}

export function createRebalanceRecord(input) {
  assertMember("state", input.state, REBALANCE_STATES);
  assertMember("runtimeOwner", input.runtimeOwner, REBALANCE_RUNTIME_OWNERS);
  assertMember("triggerSource", input.triggerSource, REBALANCE_TRIGGER_SOURCES);

  return {
    rebalanceId: input.rebalanceId,
    slotId: input.slotId,
    chain: input.chain,
    targetManifestId: input.targetManifestId,
    state: input.state,
    runtimeOwner: input.runtimeOwner,
    triggerSource: input.triggerSource,
    summary: input.summary,
    rationale: input.rationale,
    scheduledFor: input.scheduledFor ?? null,
    recommendationState: input.recommendationState ?? "monitor",
    executionState: input.executionState ?? "ready",
    executionEligibility: input.executionEligibility ?? "blocked",
    surfaceTruth: input.surfaceTruth ?? "preview",
    blockers: uniqueStrings(input.blockers),
    warnings: uniqueStrings(input.warnings),
    automationTruth: input.automationTruth ?? createAutomationTruth(),
    nextAction: input.nextAction ?? null,
    allowedTransitions: [...REBALANCE_ALLOWED_TRANSITIONS[input.state]],
    history: [...(input.history ?? [])],
  };
}

export function applyRebalanceTransition(current, transition) {
  assertRebalanceTransition(current.state, transition.toState);

  const occurredAt = transition.occurredAt ?? new Date().toISOString();
  const triggerSource = transition.triggerSource ?? current.triggerSource;
  const runtimeOwner = transition.runtimeOwner ?? getRuntimeOwnerForTrigger(triggerSource);
  const scheduledFor = Object.prototype.hasOwnProperty.call(transition, "scheduledFor")
    ? transition.scheduledFor
    : transition.toState === "scheduled"
      ? current.scheduledFor
      : null;
  const blockers = Object.prototype.hasOwnProperty.call(transition, "blockers")
    ? transition.blockers
    : current.blockers;
  const warnings = Object.prototype.hasOwnProperty.call(transition, "warnings")
    ? transition.warnings
    : current.warnings;
  const record = createTransitionRecord({
    fromState: current.state,
    toState: transition.toState,
    triggerSource,
    summary: transition.summary,
    rationale: transition.rationale,
    scheduledFor,
    occurredAt,
    eventType: transition.eventType,
  });

  return createRebalanceRecord({
    ...current,
    state: transition.toState,
    runtimeOwner,
    triggerSource,
    summary: transition.summary,
    rationale: transition.rationale,
    scheduledFor,
    blockers,
    warnings,
    nextAction: transition.nextAction ?? current.nextAction,
    recommendationState: transition.recommendationState ?? current.recommendationState,
    executionState: transition.executionState ?? current.executionState,
    executionEligibility:
      transition.executionEligibility ?? current.executionEligibility,
    surfaceTruth: transition.surfaceTruth ?? current.surfaceTruth,
    history: [...(current.history ?? []), record],
  });
}
