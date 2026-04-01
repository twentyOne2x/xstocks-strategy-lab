import test from "node:test";
import assert from "node:assert/strict";

import { deriveRebalanceOrchestration } from "../../../packages/policy/src/rebalance-policy.js";
import {
  captureCowQuoteArtifacts,
  confirmCowSettlements,
  createOperatorExecuteAllCoWRebalanceRequest,
  createOperatorManualCoWRebalanceRequest,
  recordSignedCowSubmission,
} from "../src/rebalance-service.js";

function createRecommendedRebalance() {
  return deriveRebalanceOrchestration({
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
  });
}

function createProviderTriggeredRebalance() {
  return deriveRebalanceOrchestration({
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
    triggerSource: "provider_triggered",
    chainlinkBoundary: {
      providerId: "chainlink",
      label: "Chainlink-oriented rebalance trigger boundary",
      classification: "implemented",
      automationClassification: "implemented",
      creClassification: "implemented",
      signedEventValidation: true,
      reviewProofArtifacts: ["provider_receipt_1"],
      executionProofArtifacts: [],
      reviewProven: true,
      executionProven: false,
      canTriggerReview: true,
      canExecute: false,
      missing: [],
      notes: [],
    },
  });
}

test("manual CoW request staging turns a recommended review into explicit operator review", () => {
  const staged = createOperatorManualCoWRebalanceRequest({
    rebalance: createRecommendedRebalance(),
    ownerAddress: "0xowner",
    settlementAddress: "0xsettlement",
    activationId: "activation_1",
    requestedNotionalUsd: 1000,
    fundingAssetSymbol: "USDC",
    legs: [
      {
        legId: "leg_1",
        sleeve: "core_xstocks",
        assetSymbol: "NVDAx",
        targetWeightPct: 32,
        targetNotionalUsd: 320,
        paymentAssetSymbol: "USDC",
      },
    ],
  });

  assert.equal(staged.rebalance.state, "awaiting_operator");
  assert.equal(staged.executionRequest.state, "requested");
  assert.equal(staged.executionRequest.runtimeOwner, "operator_manual");
  assert.equal(staged.executionRequest.triggerSource, "operator_manual");
});

test("manual CoW flow captures quotes, submission, and settlement without autonomous execution", () => {
  const staged = createOperatorManualCoWRebalanceRequest({
    rebalance: createRecommendedRebalance(),
    ownerAddress: "0xowner",
    settlementAddress: "0xsettlement",
    activationId: "activation_1",
    requestedNotionalUsd: 1000,
    fundingAssetSymbol: "USDC",
    legs: [
      {
        legId: "leg_1",
        sleeve: "core_xstocks",
        assetSymbol: "NVDAx",
        targetWeightPct: 32,
        targetNotionalUsd: 320,
        paymentAssetSymbol: "USDC",
      },
    ],
  });
  const quoted = captureCowQuoteArtifacts({
    ...staged,
    quotes: [
      {
        legId: "leg_1",
        signerAddress: "0xowner",
        quote: {
          kind: "cow_swap",
          quoteId: "quote_1",
          quotedAt: "2026-04-01T16:00:00Z",
          expiration: "2026-04-01T16:05:00Z",
          verified: true,
          order: {
            sellToken: "0xusdc",
            buyToken: "0xnvdax",
            receiver: "0xsettlement",
            sellAmount: "320000000",
            buyAmount: "10",
            validTo: 1711987500,
            appData: "0xapp",
            feeAmount: "0",
            kind: "sell",
            partiallyFillable: false,
            sellTokenBalance: "erc20",
            buyTokenBalance: "erc20",
            signingScheme: "eip712",
          },
          owner: "0xowner",
        },
      },
    ],
  });
  const submitted = recordSignedCowSubmission({
    ...quoted,
    submissions: [
      {
        legId: "leg_1",
        signerAddress: "0xowner",
        signature: "0xsigned",
        venueOrderId: "0xorder",
      },
    ],
  });
  const settled = confirmCowSettlements({
    ...submitted,
    confirmations: [
      {
        legId: "leg_1",
        status: "confirmed",
        txHash: "0xtx",
      },
    ],
  });

  assert.equal(quoted.executionRequest.state, "awaiting_approval");
  assert.equal(submitted.rebalance.state, "executing");
  assert.equal(submitted.executionRequest.state, "submitted");
  assert.equal(settled.rebalance.state, "rebalanced");
  assert.equal(settled.executionRequest.state, "confirmed");
});

test("provider-triggered review can only enter the existing operator-manual CoW lane", () => {
  const staged = createOperatorManualCoWRebalanceRequest({
    rebalance: createProviderTriggeredRebalance(),
    ownerAddress: "0xowner",
    settlementAddress: "0xsettlement",
    activationId: "activation_1",
    requestedNotionalUsd: 1000,
    fundingAssetSymbol: "USDC",
    legs: [
      {
        legId: "leg_1",
        sleeve: "core_xstocks",
        assetSymbol: "NVDAx",
        targetWeightPct: 32,
        targetNotionalUsd: 320,
        paymentAssetSymbol: "USDC",
      },
    ],
  });

  assert.equal(staged.rebalance.state, "awaiting_operator");
  assert.equal(staged.rebalance.triggerSource, "provider_triggered");
  assert.equal(staged.rebalance.automationTruth.providerTriggeredProven, true);
  assert.equal(staged.executionRequest.triggerSource, "operator_manual");
  assert.equal(staged.executionRequest.runtimeOwner, "operator_manual");
});

test("execute_all stages provider-triggered review with explicit provider_staging provenance", () => {
  const staged = createOperatorExecuteAllCoWRebalanceRequest({
    rebalance: createProviderTriggeredRebalance(),
    ownerAddress: "0xowner",
    settlementAddress: "0xsettlement",
    activationId: "activation_1",
    requestedNotionalUsd: 1000,
    fundingAssetSymbol: "USDC",
    legs: [
      {
        legId: "leg_1",
        sleeve: "core_xstocks",
        assetSymbol: "NVDAx",
        targetWeightPct: 32,
        targetNotionalUsd: 320,
        paymentAssetSymbol: "USDC",
      },
    ],
  });

  assert.equal(staged.rebalance.state, "awaiting_operator");
  assert.equal(staged.rebalance.triggerSource, "provider_triggered");
  assert.equal(staged.executionRequest.triggerSource, "provider_staging");
  assert.equal(staged.executionRequest.runtimeOwner, "operator_manual");
});
