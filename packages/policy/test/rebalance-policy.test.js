import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveRebalanceOrchestration,
} from "../src/rebalance-policy.js";

const baseInput = {
  rebalanceId: "rebalance_slot_1",
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

test("material drift on the live CoW lane recommends a manual rebalance", () => {
  const rebalance = deriveRebalanceOrchestration(baseInput);

  assert.equal(rebalance.state, "rebalance_recommended");
  assert.equal(rebalance.runtimeOwner, "operator_manual");
  assert.equal(rebalance.triggerSource, "policy_event");
  assert.equal(rebalance.automationTruth.operatorManualRequired, true);
});

test("scheduled reviews exist but stay manual at the execution boundary", () => {
  const rebalance = deriveRebalanceOrchestration({
    ...baseInput,
    triggerSource: "scheduled_cron",
    scheduledReviewEnabled: true,
    scheduledFor: "2026-04-01T17:00:00Z",
  });

  assert.equal(rebalance.state, "scheduled");
  assert.equal(rebalance.runtimeOwner, "worker_offchain_scheduler");
  assert.equal(rebalance.triggerSource, "scheduled_cron");
  assert.match(rebalance.rationale, /cannot create, sign, or submit a CoW order/i);
});

test("provider-triggered requests fail closed when Chainlink proof is absent", () => {
  const rebalance = deriveRebalanceOrchestration({
    ...baseInput,
    triggerSource: "provider_triggered",
  });

  assert.equal(rebalance.state, "blocked");
  assert.equal(rebalance.runtimeOwner, "operator_manual");
  assert.ok(rebalance.blockers.includes("provider_trigger_unproven"));
  assert.ok(rebalance.blockers.includes("missing_provider_adapter"));
});
