import {
  assertPromotedActivationManifest,
  createActivationManifestRef,
} from "./manifest.js";

export const REBALANCE_RUNTIME_OWNER = Object.freeze({
  OPERATOR_MANUAL: "operator_manual",
  WORKER_OFFCHAIN_SCHEDULER: "worker_offchain_scheduler",
  POLICY_BOUNDED_AUTOMATION: "policy_bounded_automation",
});

export const REBALANCE_TRIGGER_SOURCE = Object.freeze({
  OPERATOR_MANUAL: "operator_manual",
  SCHEDULED_CRON: "scheduled_cron",
  POLICY_EVENT: "policy_event",
  PROVIDER_TRIGGERED: "provider_triggered",
});

export const REBALANCE_ORCHESTRATION_STATE = Object.freeze({
  PREVIEW_ONLY: "preview_only",
  REBALANCE_RECOMMENDED: "rebalance_recommended",
  REBALANCE_DEFERRED: "rebalance_deferred",
  SCHEDULED: "scheduled",
  AWAITING_OPERATOR: "awaiting_operator",
  EXECUTING: "executing",
  REBALANCED: "rebalanced",
  BLOCKED: "blocked",
  PAUSED: "paused",
  FAILED: "failed",
});

const REBALANCE_TRIGGER_SOURCE_VALUES = new Set(
  Object.values(REBALANCE_TRIGGER_SOURCE),
);
const REBALANCE_RUNTIME_OWNER_VALUES = new Set(
  Object.values(REBALANCE_RUNTIME_OWNER),
);
const REBALANCE_STATE_VALUES = new Set(
  Object.values(REBALANCE_ORCHESTRATION_STATE),
);
const HOLD_STATES = new Set([
  REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
  REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR,
  REBALANCE_ORCHESTRATION_STATE.EXECUTING,
  REBALANCE_ORCHESTRATION_STATE.PAUSED,
]);
const POLICY_EVENT_BLOCKERS = Object.freeze([
  "Promoted-manifest drift can recommend a rebalance, but no autonomous policy-event emitter is implemented in this repo.",
]);
const CHAINLINK_TRIGGER_BLOCKERS = Object.freeze([
  "Chainlink-oriented provider triggers are not implemented or proven in this repo; no live Chainlink Automation, CRE, or CCIP path exists here.",
  "Provider-triggered rebalance review stays fail-closed until a repo-owned adapter, signed-event validation, and proof artifact exist.",
]);
const ALLOWED_TRANSITIONS = Object.freeze({
  [REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY]: [],
  [REBALANCE_ORCHESTRATION_STATE.REBALANCE_RECOMMENDED]: [
    REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
    REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR,
    REBALANCE_ORCHESTRATION_STATE.EXECUTING,
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
    REBALANCE_ORCHESTRATION_STATE.FAILED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.REBALANCE_DEFERRED]: [
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.SCHEDULED]: [
    REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR,
    REBALANCE_ORCHESTRATION_STATE.EXECUTING,
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
    REBALANCE_ORCHESTRATION_STATE.FAILED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR]: [
    REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
    REBALANCE_ORCHESTRATION_STATE.EXECUTING,
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
    REBALANCE_ORCHESTRATION_STATE.FAILED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.EXECUTING]: [
    REBALANCE_ORCHESTRATION_STATE.REBALANCED,
    REBALANCE_ORCHESTRATION_STATE.FAILED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.REBALANCED]: [],
  [REBALANCE_ORCHESTRATION_STATE.BLOCKED]: [
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
  ],
  [REBALANCE_ORCHESTRATION_STATE.PAUSED]: [],
  [REBALANCE_ORCHESTRATION_STATE.FAILED]: [
    REBALANCE_ORCHESTRATION_STATE.SCHEDULED,
    REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR,
    REBALANCE_ORCHESTRATION_STATE.PAUSED,
  ],
});

function assertKnownTriggerSource(triggerSource) {
  if (REBALANCE_TRIGGER_SOURCE_VALUES.has(triggerSource)) {
    return triggerSource;
  }

  throw new Error(`Unknown rebalance trigger source ${triggerSource}.`);
}

function assertKnownState(state) {
  if (REBALANCE_STATE_VALUES.has(state)) {
    return state;
  }

  throw new Error(`Unknown rebalance orchestration state ${state}.`);
}

function assertKnownRuntimeOwner(runtimeOwner) {
  if (REBALANCE_RUNTIME_OWNER_VALUES.has(runtimeOwner)) {
    return runtimeOwner;
  }

  throw new Error(`Unknown rebalance runtime owner ${runtimeOwner}.`);
}

function defaultRuntimeOwnerForState({ state, triggerSource }) {
  if (
    state === REBALANCE_ORCHESTRATION_STATE.SCHEDULED &&
    triggerSource === REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON
  ) {
    return REBALANCE_RUNTIME_OWNER.WORKER_OFFCHAIN_SCHEDULER;
  }

  return REBALANCE_RUNTIME_OWNER.OPERATOR_MANUAL;
}

function createRebalanceId(slotId) {
  const normalizedSlotId = String(slotId)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `rebalance_${normalizedSlotId}`;
}

function buildSupportedTriggerSources(providerTriggeredProven) {
  return providerTriggeredProven
    ? [
        REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
        REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON,
        REBALANCE_TRIGGER_SOURCE.PROVIDER_TRIGGERED,
      ]
    : [
        REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
        REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON,
      ];
}

function buildAutomationTruth({
  latestRebalance = null,
  providerTriggeredProven = false,
} = {}) {
  const existingAutomationTruth = latestRebalance?.automationTruth ?? {};
  const nextProviderTriggeredProven = Boolean(
    existingAutomationTruth.providerTriggeredProven ??
      existingAutomationTruth.provider_triggered_proven ??
      providerTriggeredProven,
  );
  const supportedTriggerSources = buildSupportedTriggerSources(
    nextProviderTriggeredProven,
  );

  return {
    operatorManualRequired: true,
    autonomousExecutionProven: false,
    providerTriggeredProven: nextProviderTriggeredProven,
    supportedTriggerSources,
    notes: [
      "Operator confirmation remains required before any rebalance execution claim.",
      "Scheduled cron evaluation is supported as a shell trigger, but this repo does not prove a deployed cron host.",
      nextProviderTriggeredProven
        ? "Validated provider-triggered review is proven for this runtime, but operator approval remains mandatory before execution staging."
        : "Supported trigger sources in current repo truth are operator_manual and scheduled_cron only.",
      nextProviderTriggeredProven
        ? "Chainlink-oriented provider review is proven only for authenticated review opening; no autonomous execution claim exists."
        : "Chainlink-oriented provider triggers stay classification-only and fail-closed until a concrete adapter, signed-event validation, and proof path exist.",
    ],
  };
}

function buildAllowedTransitions(state) {
  return ALLOWED_TRANSITIONS[state] ?? [];
}

function buildNextAction({
  state,
  manifest,
  blockers,
  scheduledFor,
}) {
  switch (state) {
    case REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY:
      return {
        title: "Create activation baseline",
        detail:
          "No live activation snapshot exists for this slot yet, so rebalance orchestration stays preview-only.",
        status: "preview_only",
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCE_RECOMMENDED:
      return {
        title: "Review promoted manifest drift",
        detail: `Operator review is required before moving ${manifest.slotId} onto ${manifest.manifestId}.`,
        status: "pending",
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCE_DEFERRED:
      return {
        title: "Keep monitoring promoted output",
        detail:
          "The latest activation already matches the promoted manifest, so no rebalance is queued.",
        status: "deferred",
      };
    case REBALANCE_ORCHESTRATION_STATE.SCHEDULED:
      return {
        title: "Wait for scheduled review window",
        detail:
          scheduledFor === null
            ? "A scheduled review record exists, but the exact execution window was not supplied."
            : `Manual review is queued for ${scheduledFor}.`,
        status: "scheduled",
      };
    case REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR:
      return {
        title: "Approve or reject manual rebalance",
        detail:
          "The worker shell will not submit execution without an explicit operator-driven state transition.",
        status: "pending",
      };
    case REBALANCE_ORCHESTRATION_STATE.EXECUTING:
      return {
        title: "Monitor manual execution",
        detail:
          "Execution is in progress and must be closed by an explicit success or failure transition.",
        status: "executing",
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCED:
      return null;
    case REBALANCE_ORCHESTRATION_STATE.BLOCKED:
      return {
        title: "Resolve rebalance blocker",
        detail:
          blockers[0] ??
          "A rebalance was identified, but the current readiness checks fail closed.",
        status: "blocked",
      };
    case REBALANCE_ORCHESTRATION_STATE.PAUSED:
      return {
        title: "Resume rebalance evaluation",
        detail:
          "The slot is paused until the operator deliberately reruns evaluation or changes state.",
        status: "paused",
      };
    case REBALANCE_ORCHESTRATION_STATE.FAILED:
      return {
        title: "Review failure and retry manually",
        detail:
          "The last rebalance attempt failed and requires an operator-driven follow-up.",
        status: "failed",
      };
    default:
      return null;
  }
}

function buildStateNarrative({
  state,
  manifest,
  baselineManifestId,
  triggerSource,
  scheduledFor,
  blockers,
  note = null,
}) {
  switch (state) {
    case REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY:
      return {
        summary: "Rebalance orchestration is preview-only.",
        rationale:
          "No prior activation snapshot exists for this slot, so the worker has no live portfolio baseline to rebalance against.",
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCE_RECOMMENDED:
      return {
        summary: "A manual rebalance review is recommended.",
        rationale: `The latest activation baseline (${baselineManifestId}) differs from the current promoted manifest (${manifest.manifestId}), so operator review is required before any execution claim.`,
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCE_DEFERRED:
      return {
        summary: "No rebalance is queued right now.",
        rationale:
          "The latest activation already matches the current promoted manifest, so the worker defers without scheduling a rebalance.",
      };
    case REBALANCE_ORCHESTRATION_STATE.SCHEDULED:
      return {
        summary: "Manual rebalance review has been scheduled.",
        rationale:
          triggerSource === REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON
            ? `A cron-triggered worker evaluation queued a manual review${scheduledFor ? ` for ${scheduledFor}` : ""}.`
            : `The operator queued a manual rebalance review${scheduledFor ? ` for ${scheduledFor}` : ""}.`,
      };
    case REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR:
      return {
        summary: "Rebalance is awaiting operator confirmation.",
        rationale:
          note ??
          "Execution remains manual-first and requires an explicit operator confirmation step before it can begin.",
      };
    case REBALANCE_ORCHESTRATION_STATE.EXECUTING:
      return {
        summary: "Rebalance execution is in progress.",
        rationale:
          note ??
          "The worker is only recording operator-driven execution progress; it is not claiming autonomous submission.",
      };
    case REBALANCE_ORCHESTRATION_STATE.REBALANCED:
      return {
        summary: "Rebalance was marked complete.",
        rationale:
          note ??
          "An operator marked the rebalance complete. This record is audit truth, not autonomous execution proof.",
      };
    case REBALANCE_ORCHESTRATION_STATE.BLOCKED:
      return {
        summary: "Rebalance is blocked.",
        rationale:
          blockers[0] ??
          "A promoted-manifest drift exists, but the current readiness checks fail closed.",
      };
    case REBALANCE_ORCHESTRATION_STATE.PAUSED:
      return {
        summary: "Rebalance orchestration is paused.",
        rationale:
          note ??
          "The operator paused this slot, so the worker will hold rebalance progress until evaluation is resumed.",
      };
    case REBALANCE_ORCHESTRATION_STATE.FAILED:
      return {
        summary: "Rebalance failed.",
        rationale:
          note ??
          "The last operator-driven rebalance attempt was marked failed and needs manual follow-up.",
      };
    default:
      throw new Error(`Unhandled rebalance state ${state}.`);
  }
}

function createSnapshot({
  manifest,
  latestActivation,
  recommendation,
  executionPlan,
  state,
  triggerSource,
  runtimeOwner,
  scheduledFor,
  summary,
  rationale,
  now,
  latestRebalance = null,
  providerTriggeredProven = false,
}) {
  const baselineManifestId = latestActivation?.manifestId ?? null;
  const blockers = [...(executionPlan?.blockers ?? [])];
  const warnings = [...(executionPlan?.warnings ?? [])];

  return {
    rebalanceId: createRebalanceId(manifest.slotId),
    slotId: manifest.slotId,
    chain: manifest.chain,
    activationManifestRef: createActivationManifestRef(manifest),
    targetManifestId: manifest.manifestId,
    baselineActivationId: latestActivation?.activationId ?? null,
    baselineManifestId,
    baselineManifestMatchesTarget:
      baselineManifestId !== null && baselineManifestId === manifest.manifestId,
    state,
    runtimeOwner,
    triggerSource,
    summary,
    rationale,
    scheduledFor,
    allowedTransitions: buildAllowedTransitions(state),
    recommendationState:
      recommendation?.rebalanceDecision?.state ?? "monitor",
    executionState: executionPlan.executionState,
    executionEligibility: executionPlan.executionEligibility,
    surfaceTruth: executionPlan.surfaceTruth,
    providerReceiptId: latestRebalance?.providerReceiptId ?? null,
    executionRequestId: latestRebalance?.executionRequestId ?? null,
    executionTriggerSource: latestRebalance?.executionTriggerSource ?? null,
    executionRequestState: latestRebalance?.executionRequestState ?? null,
    blockers,
    warnings,
    automationTruth: buildAutomationTruth({
      latestRebalance,
      providerTriggeredProven,
    }),
    nextAction: buildNextAction({
      state,
      manifest,
      blockers,
      scheduledFor,
    }),
    createdAt: latestRebalance?.createdAt ?? now,
    updatedAt: now,
  };
}

export function deriveRebalanceOrchestration({
  activation_manifest,
  recommendation,
  execution_plan,
  latest_activation = null,
  latest_rebalance = null,
  trigger_source = REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
  runtime_owner = null,
  scheduled_for = null,
  now = new Date().toISOString(),
  resume = false,
  provider_triggered_proven = false,
}) {
  const manifest = assertPromotedActivationManifest(activation_manifest);
  const executionPlan = execution_plan;
  const triggerSource = assertKnownTriggerSource(trigger_source);
  const latestActivation = latest_activation;
  const latestRebalance = latest_rebalance;
  const providerTriggeredProven =
    latestRebalance?.automationTruth?.providerTriggeredProven === true ||
    provider_triggered_proven === true;
  const hasActivationBaseline = Boolean(latestActivation);
  const manifestDriftDetected =
    hasActivationBaseline && latestActivation.manifestId !== manifest.manifestId;

  if (
    latestRebalance &&
    !resume &&
    HOLD_STATES.has(latestRebalance.state) &&
    (latestRebalance.state === REBALANCE_ORCHESTRATION_STATE.PAUSED ||
      manifestDriftDetected)
  ) {
    const preservedState = assertKnownState(latestRebalance.state);
    const preservedTriggerSource =
      latestRebalance.triggerSource ?? triggerSource;
    const preservedRuntimeOwner = assertKnownRuntimeOwner(
      runtime_owner ??
        latestRebalance.runtimeOwner ??
        defaultRuntimeOwnerForState({
          state: preservedState,
          triggerSource: preservedTriggerSource,
        }),
    );
    const narrative = buildStateNarrative({
      state: preservedState,
      manifest,
      baselineManifestId: latestActivation?.manifestId ?? null,
      triggerSource: preservedTriggerSource,
      scheduledFor: latestRebalance.scheduledFor ?? scheduled_for,
      blockers: executionPlan.blockers,
      note: latestRebalance.rationale,
    });

    return createSnapshot({
      manifest,
      latestActivation,
      recommendation,
      executionPlan,
      state: preservedState,
      triggerSource: preservedTriggerSource,
      runtimeOwner: preservedRuntimeOwner,
      scheduledFor: latestRebalance.scheduledFor ?? scheduled_for,
      summary: latestRebalance.summary ?? narrative.summary,
      rationale: latestRebalance.rationale ?? narrative.rationale,
      now,
      latestRebalance,
      providerTriggeredProven,
    });
  }

  let state = REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY;
  let scheduledFor = null;

  if (!buildSupportedTriggerSources(providerTriggeredProven).includes(triggerSource)) {
    state = REBALANCE_ORCHESTRATION_STATE.BLOCKED;
  } else if (!hasActivationBaseline) {
    state = REBALANCE_ORCHESTRATION_STATE.PREVIEW_ONLY;
  } else if (!manifestDriftDetected) {
    state = REBALANCE_ORCHESTRATION_STATE.REBALANCE_DEFERRED;
  } else if (
    executionPlan.executionState !== "ready" ||
    executionPlan.executionEligibility !== "executable"
  ) {
    state = REBALANCE_ORCHESTRATION_STATE.BLOCKED;
  } else if (triggerSource === REBALANCE_TRIGGER_SOURCE.SCHEDULED_CRON) {
    state = REBALANCE_ORCHESTRATION_STATE.SCHEDULED;
    scheduledFor = scheduled_for ?? now;
  } else if (triggerSource === REBALANCE_TRIGGER_SOURCE.PROVIDER_TRIGGERED) {
    state = REBALANCE_ORCHESTRATION_STATE.AWAITING_OPERATOR;
  } else {
    state = REBALANCE_ORCHESTRATION_STATE.REBALANCE_RECOMMENDED;
  }

  const blockers =
    triggerSource === REBALANCE_TRIGGER_SOURCE.PROVIDER_TRIGGERED &&
    !providerTriggeredProven
      ? [...CHAINLINK_TRIGGER_BLOCKERS]
      : triggerSource === REBALANCE_TRIGGER_SOURCE.POLICY_EVENT
        ? [...POLICY_EVENT_BLOCKERS]
        : executionPlan.blockers;
  const runtimeOwner = assertKnownRuntimeOwner(
    runtime_owner ??
      latestRebalance?.runtimeOwner ??
      defaultRuntimeOwnerForState({
        state,
        triggerSource,
      }),
  );
  const narrative = buildStateNarrative({
    state,
    manifest,
    baselineManifestId: latestActivation?.manifestId ?? null,
    triggerSource,
    scheduledFor,
    blockers,
  });

  return createSnapshot({
    manifest,
    latestActivation,
    recommendation,
    executionPlan: {
      ...executionPlan,
      blockers,
    },
    state,
    triggerSource,
    runtimeOwner,
    scheduledFor,
    summary: narrative.summary,
    rationale: narrative.rationale,
    now,
    latestRebalance,
    providerTriggeredProven,
  });
}

export function applyRebalanceTransition({
  current_rebalance,
  next_state,
  trigger_source = REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
  scheduled_for = null,
  note = null,
  now = new Date().toISOString(),
}) {
  if (!current_rebalance || typeof current_rebalance !== "object") {
    throw new Error("A current rebalance snapshot is required for transitions.");
  }

  const currentState = assertKnownState(current_rebalance.state);
  const nextState = assertKnownState(next_state);
  const triggerSource = assertKnownTriggerSource(trigger_source);
  const allowedTransitions = buildAllowedTransitions(currentState);

  if (!allowedTransitions.includes(nextState)) {
    throw new Error(
      `Cannot transition rebalance ${current_rebalance.slotId} from ${currentState} to ${nextState}.`,
    );
  }

  const scheduledFor =
    nextState === REBALANCE_ORCHESTRATION_STATE.SCHEDULED
      ? scheduled_for ?? now
      : null;
  const runtimeOwner = defaultRuntimeOwnerForState({
    state: nextState,
    triggerSource,
  });
  const narrative = buildStateNarrative({
    state: nextState,
    manifest: {
      slotId: current_rebalance.slotId,
      manifestId: current_rebalance.targetManifestId,
    },
    baselineManifestId: current_rebalance.baselineManifestId,
    triggerSource,
    scheduledFor,
    blockers: current_rebalance.blockers ?? [],
    note,
  });

  return {
    ...current_rebalance,
    state: nextState,
    runtimeOwner,
    triggerSource,
    summary: narrative.summary,
    rationale: narrative.rationale,
    scheduledFor,
    allowedTransitions: buildAllowedTransitions(nextState),
    nextAction: buildNextAction({
      state: nextState,
      manifest: {
        slotId: current_rebalance.slotId,
        manifestId: current_rebalance.targetManifestId,
      },
      blockers: current_rebalance.blockers ?? [],
      scheduledFor,
    }),
    updatedAt: now,
  };
}
