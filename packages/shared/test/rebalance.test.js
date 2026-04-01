import test from "node:test";
import assert from "node:assert/strict";

import {
  applyRebalanceTransition,
  createAutomationTruth,
  createChainlinkTriggerBoundary,
  createRebalanceRecord,
} from "../src/rebalance.js";

test("default Chainlink boundary stays fail closed and does not allow provider-triggered review", () => {
  const boundary = createChainlinkTriggerBoundary();
  const truth = createAutomationTruth({
    scheduledReviewEnabled: true,
    chainlinkBoundary: boundary,
  });

  assert.equal(boundary.canTriggerReview, false);
  assert.equal(boundary.canExecute, false);
  assert.equal(boundary.classification, "externally_plausible_but_unproven");
  assert.deepEqual(boundary.missing, [
    "missing_provider_adapter",
    "missing_signed_event_validation",
    "missing_provider_proof",
    "missing_settlement_artifact",
  ]);
  assert.deepEqual(truth.supportedTriggerSources, [
    "operator_manual",
    "policy_event",
    "scheduled_cron",
  ]);
});

test("rebalance transitions keep operator review explicit", () => {
  const rebalance = createRebalanceRecord({
    rebalanceId: "rebalance_1",
    slotId: "onboarding.default_basket",
    chain: "ethereum",
    targetManifestId: "manifest_v2",
    state: "rebalance_recommended",
    runtimeOwner: "operator_manual",
    triggerSource: "policy_event",
    summary: "Policy recommends review.",
    rationale: "Drift cleared the rebalance threshold.",
  });

  const awaitingOperator = applyRebalanceTransition(rebalance, {
    toState: "awaiting_operator",
    triggerSource: "operator_manual",
    summary: "Operator opened the review.",
    rationale: "Manual review must begin before any CoW request is staged.",
  });

  assert.equal(awaitingOperator.state, "awaiting_operator");
  assert.equal(awaitingOperator.runtimeOwner, "operator_manual");
  assert.equal(awaitingOperator.history.length, 1);
  assert.equal(awaitingOperator.history[0].fromState, "rebalance_recommended");
  assert.equal(awaitingOperator.history[0].toState, "awaiting_operator");
});
