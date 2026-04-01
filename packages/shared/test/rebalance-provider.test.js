import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChainlinkCreEventDedupeKey,
  canonicalizeChainlinkCreEventBody,
  CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA,
  computeChainlinkCreEventDigest,
} from "../src/rebalance-provider.js";

function createProviderEvent(overrides = {}) {
  return {
    version: "1",
    providerId: "chainlink_cre",
    providerEventId: "evt_1",
    workflowId: "workflow_1",
    workflowExecutionId: "exec_1",
    triggerType: "cron",
    triggeredAt: "2026-04-01T18:00:00.000Z",
    slotId: "onboarding.default_basket",
    chain: "ethereum",
    targetManifestId: "onboarding.default_basket:basket-core-v1:promoted",
    baselineManifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
    reviewReason: {
      kind: "manifest_drift",
      observedDriftBps: 425,
      thresholdBps: 300,
    },
    reviewIntent: {
      requestedState: "awaiting_operator",
      executionMode: "review_only",
    },
    ...overrides,
  };
}

test("Chainlink CRE provider event digest is canonical across key ordering", () => {
  const left = createProviderEvent();
  const right = {
    reviewIntent: left.reviewIntent,
    workflowExecutionId: left.workflowExecutionId,
    workflowId: left.workflowId,
    providerEventId: left.providerEventId,
    providerId: left.providerId,
    version: left.version,
    triggerType: left.triggerType,
    triggeredAt: left.triggeredAt,
    reviewReason: left.reviewReason,
    slotId: left.slotId,
    chain: left.chain,
    targetManifestId: left.targetManifestId,
    baselineManifestId: left.baselineManifestId,
  };

  assert.equal(
    canonicalizeChainlinkCreEventBody(left),
    canonicalizeChainlinkCreEventBody(right),
  );
  assert.equal(
    computeChainlinkCreEventDigest(left),
    computeChainlinkCreEventDigest(right),
  );
});

test("Chainlink CRE provider event schema and dedupe key stay deterministic", () => {
  const event = CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA.parse(createProviderEvent());

  assert.equal(
    buildChainlinkCreEventDedupeKey(event),
    "chainlink_cre:workflow_1:exec_1:onboarding.default_basket:onboarding.default_basket:basket-core-v1:promoted:ethereum",
  );
});
