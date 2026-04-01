import test from "node:test";
import assert from "node:assert/strict";

import {
  handoffScheduledReviewToOperator,
  runScheduledRebalanceReview,
} from "../src/rebalance-review-loop.js";

const scheduledInput = {
  slotId: "onboarding.default_basket",
  chain: "ethereum",
  targetManifestId: "manifest_v2",
  baselineManifestId: "manifest_v1",
  hasLivePosition: true,
  driftBps: 425,
  thresholdBps: 300,
  signalFresh: true,
  confidencePassed: true,
  turnoverWithinBudget: true,
  routeAvailable: true,
  executionEligibility: "ready",
  executionState: "ready",
  surfaceTruth: "live",
};

test("scheduled review loop queues operator work but no execution request", () => {
  const review = runScheduledRebalanceReview({
    rebalanceId: "rebalance_slot_1",
    ...scheduledInput,
    now: "2026-04-01T16:00:00Z",
  });

  assert.equal(review.rebalance.state, "scheduled");
  assert.equal(review.rebalance.runtimeOwner, "worker_offchain_scheduler");
  assert.equal(review.operatorQueueItem?.autoExecution, false);
  assert.equal(review.executionRequest, null);
});

test("scheduled reviews hand off to operator review before the CoW lane starts", () => {
  const review = runScheduledRebalanceReview({
    rebalanceId: "rebalance_slot_1",
    ...scheduledInput,
    now: "2026-04-01T16:00:00Z",
  });
  const handedOff = handoffScheduledReviewToOperator(review.rebalance, {
    occurredAt: "2026-04-01T16:01:00Z",
  });

  assert.equal(handedOff.state, "awaiting_operator");
  assert.equal(handedOff.runtimeOwner, "operator_manual");
  assert.equal(handedOff.triggerSource, "operator_manual");
});
