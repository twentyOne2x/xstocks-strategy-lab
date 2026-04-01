import {
  deriveRebalanceOrchestration,
  openManualReview,
} from "../../../packages/policy/src/rebalance-policy.js";

function buildQueueItem(rebalance, createdAt) {
  if (rebalance.state !== "scheduled") {
    return null;
  }

  return {
    queueId: `rebalance_queue_${rebalance.rebalanceId}`,
    rebalanceId: rebalance.rebalanceId,
    createdAt,
    scheduledFor: rebalance.scheduledFor ?? createdAt,
    runtimeOwner: "operator_manual",
    autoExecution: false,
    nextAction: rebalance.nextAction,
  };
}

export function runScheduledRebalanceReview(input) {
  const now = input.now ?? new Date().toISOString();
  const rebalance = deriveRebalanceOrchestration({
    ...input,
    triggerSource: "scheduled_cron",
    scheduledReviewEnabled: true,
    scheduledFor: input.scheduledFor ?? now,
  });

  return {
    rebalance,
    operatorQueueItem: buildQueueItem(rebalance, now),
    executionRequest: null,
  };
}

export function runRegularRebalanceLoop(inputs, options = {}) {
  return (inputs ?? []).map((input, index) =>
    runScheduledRebalanceReview({
      rebalanceId: input.rebalanceId ?? `rebalance_scheduled_${index + 1}`,
      ...input,
      now: options.now ?? input.now,
    }));
}

export function handoffScheduledReviewToOperator(rebalance, options = {}) {
  return openManualReview(rebalance, {
    occurredAt: options.occurredAt,
    summary: options.summary ?? "Operator opened the scheduled review.",
    rationale:
      options.rationale
      ?? "Scheduled worker review only queues manual work; the operator still decides whether to stage CoW execution.",
  });
}
