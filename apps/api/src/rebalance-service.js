import { createCowSwapApiClient } from "../../../packages/xstocks/dist/adapters/cow.js";
import {
  MANUAL_COW_REVIEW_START_STATES,
} from "../../../packages/shared/src/rebalance.js";
import {
  blockRebalance,
  failRebalance,
  markRebalanceExecuting,
  markRebalanced,
  openManualReview,
} from "../../../packages/policy/src/rebalance-policy.js";

export const OPERATOR_MANUAL_EXECUTION_ADAPTER_ID = "cow_swap";
export const OPERATOR_MANUAL_EXECUTION_ROUTE_ID = "cow_swap.ethereum";

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === "string" && value.length > 0))];
}

function buildExecutionRequestId(rebalanceId) {
  return `execution_${rebalanceId}`;
}

function ensureManualExecutionEligibility(rebalance) {
  if (
    rebalance.state !== "awaiting_operator"
    && !MANUAL_COW_REVIEW_START_STATES.includes(rebalance.state)
  ) {
    throw new Error(`Rebalance state ${rebalance.state} cannot start the manual CoW lane.`);
  }
  if (rebalance.executionEligibility !== "ready") {
    throw new Error(`Manual CoW execution requires readiness=ready, received ${rebalance.executionEligibility}.`);
  }
  if (rebalance.surfaceTruth !== "live") {
    throw new Error(`Manual CoW execution requires live surface truth, received ${rebalance.surfaceTruth}.`);
  }
  if (rebalance.automationTruth.operatorManualRequired !== true) {
    throw new Error("Manual CoW execution requires operator-manual approval truth.");
  }
  if (rebalance.triggerSource === "provider_triggered" && !rebalance.automationTruth.providerTriggeredProven) {
    throw new Error("Provider-triggered manual execution cannot start until provider proof exists.");
  }
}

function normalizeLeg(leg, index) {
  if (!leg.legId) {
    throw new Error("Every rebalance execution leg requires a legId.");
  }
  if (!leg.targetWeightPct && leg.targetWeightPct !== 0) {
    throw new Error(`Execution leg ${leg.legId} is missing targetWeightPct.`);
  }
  if (!leg.targetNotionalUsd && leg.targetNotionalUsd !== 0) {
    throw new Error(`Execution leg ${leg.legId} is missing targetNotionalUsd.`);
  }
  if (!leg.paymentAssetSymbol) {
    throw new Error(`Execution leg ${leg.legId} is missing paymentAssetSymbol.`);
  }

  return {
    legId: leg.legId,
    sequence: leg.sequence ?? index + 1,
    sleeve: leg.sleeve,
    assetSymbol: leg.assetSymbol ?? null,
    venueId: leg.venueId ?? OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
    adapterId: OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
    requiredRouteId: leg.requiredRouteId ?? OPERATOR_MANUAL_EXECUTION_ROUTE_ID,
    targetWeightPct: leg.targetWeightPct,
    targetNotionalUsd: leg.targetNotionalUsd,
    paymentAssetSymbol: leg.paymentAssetSymbol,
    paymentTokenAddress: leg.paymentTokenAddress ?? null,
    paymentTokenDecimals: leg.paymentTokenDecimals ?? null,
    receivingTokenAddress: leg.receivingTokenAddress ?? null,
    receivingTokenDecimals: leg.receivingTokenDecimals ?? null,
    settlementAddress: leg.settlementAddress ?? null,
    state: "pending",
    blockers: uniqueStrings(leg.blockers),
    warnings: uniqueStrings(leg.warnings),
    quote: null,
    approval: null,
    venueStatus: null,
    receipt: null,
    trade: null,
  };
}

function normalizeRebalanceForManualLane(rebalance, now) {
  return rebalance.state === "awaiting_operator"
    ? rebalance
    : openManualReview(rebalance, {
      occurredAt: now,
      summary: "Operator opened a manual CoW review.",
      rationale:
        "The scheduled or policy-triggered rebalance moved into explicit operator review before any CoW request was created.",
    });
}

function mapReceiptStatus(status) {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "failed":
      return "reverted";
    default:
      return "not_found";
  }
}

export function createOperatorManualCoWRebalanceRequest(input) {
  const now = input.now ?? new Date().toISOString();
  const rebalance = normalizeRebalanceForManualLane(input.rebalance, now);

  ensureManualExecutionEligibility(rebalance);

  if (!input.ownerAddress) {
    throw new Error("A verified ownerAddress is required before the manual CoW lane can be staged.");
  }
  if (!input.settlementAddress) {
    throw new Error("A settlementAddress is required before the manual CoW lane can be staged.");
  }

  return {
    rebalance,
    executionRequest: {
      version: "1",
      executionRequestId: buildExecutionRequestId(rebalance.rebalanceId),
      rebalanceId: rebalance.rebalanceId,
      ownerAddress: input.ownerAddress,
      activationId: input.activationId,
      manifestId: input.manifestId ?? rebalance.targetManifestId,
      slotId: rebalance.slotId,
      chain: rebalance.chain,
      mode: input.mode ?? "basket",
      runtimeOwner: "operator_manual",
      triggerSource: "operator_manual",
      adapterId: OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
      activationManifestRef: input.activationManifestRef ?? null,
      requestedNotionalUsd: input.requestedNotionalUsd,
      fundingAssetSymbol: input.fundingAssetSymbol,
      settlementAddress: input.settlementAddress,
      state: "requested",
      blockers: [],
      warnings: uniqueStrings([...(rebalance.warnings ?? []), ...(input.warnings ?? [])]),
      legs: (input.legs ?? []).map(normalizeLeg),
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function captureCowQuoteArtifacts(input) {
  const now = input.now ?? new Date().toISOString();
  const quotesByLegId = new Map((input.quotes ?? []).map((quote) => [quote.legId, quote]));
  const executionRequest = {
    ...input.executionRequest,
    state: "awaiting_approval",
    updatedAt: now,
    legs: input.executionRequest.legs.map((leg) => {
      const quoteEntry = quotesByLegId.get(leg.legId);

      if (!quoteEntry) {
        return leg;
      }

      return {
        ...leg,
        state: "awaiting_approval",
        quote: quoteEntry.quote,
        approval: {
          approvalType: "eip712_signature",
          status: "awaiting_user",
          signerAddress: quoteEntry.signerAddress ?? input.executionRequest.ownerAddress,
          approvalTarget: "cow_order",
          orderToSign: quoteEntry.quote.order,
          signature: null,
          approvedAt: null,
          submittedAt: null,
          venueOrderId: null,
          notes: [
            "The operator must collect a user or owner signature before backend submission.",
          ],
        },
      };
    }),
  };

  return {
    rebalance: input.rebalance,
    executionRequest,
  };
}

export function recordSignedCowSubmission(input) {
  const now = input.now ?? new Date().toISOString();
  const submissionsByLegId = new Map((input.submissions ?? []).map((submission) => [submission.legId, submission]));
  const executionRequest = {
    ...input.executionRequest,
    state: "submitted",
    updatedAt: now,
    legs: input.executionRequest.legs.map((leg) => {
      const submission = submissionsByLegId.get(leg.legId);

      if (!submission) {
        return leg;
      }
      if (!leg.approval || !leg.quote) {
        throw new Error(`Execution leg ${leg.legId} requires a quote and approval scaffold before submission.`);
      }

      return {
        ...leg,
        state: "submitted",
        approval: {
          ...leg.approval,
          status: "submitted",
          signerAddress: submission.signerAddress,
          signature: submission.signature,
          approvedAt: submission.approvedAt ?? now,
          submittedAt: submission.submittedAt ?? now,
          venueOrderId: submission.venueOrderId,
          notes: uniqueStrings([
            ...(leg.approval.notes ?? []),
            "Signed CoW order submitted through the operator-manual lane.",
          ]),
        },
        venueStatus: {
          venueId: leg.venueId,
          venueOrderId: submission.venueOrderId,
          status: "submitted",
          settlementTxHash: null,
          lastCheckedAt: now,
          updatedAt: now,
          rawStatus: submission.rawStatus ?? null,
        },
      };
    }),
  };

  return {
    rebalance: markRebalanceExecuting(input.rebalance, {
      occurredAt: now,
      summary: "Signed CoW order submitted.",
      rationale:
        "The operator-manual lane collected a valid signature and moved into tracked execution.",
    }),
    executionRequest,
  };
}

export function confirmCowSettlements(input) {
  const now = input.now ?? new Date().toISOString();
  const confirmationsByLegId = new Map((input.confirmations ?? []).map((confirmation) => [confirmation.legId, confirmation]));
  let anyFailed = false;
  let anyManualFollowup = false;
  let allConfirmed = true;

  const executionRequest = {
    ...input.executionRequest,
    updatedAt: now,
    legs: input.executionRequest.legs.map((leg) => {
      const confirmation = confirmationsByLegId.get(leg.legId);

      if (!confirmation) {
        allConfirmed = false;
        return leg;
      }

      if (confirmation.status === "failed") {
        anyFailed = true;
      } else if (confirmation.status === "manual_followup_required") {
        anyManualFollowup = true;
        allConfirmed = false;
      } else if (confirmation.status !== "confirmed") {
        allConfirmed = false;
      }

      return {
        ...leg,
        state:
          confirmation.status === "confirmed"
            ? "confirmed"
            : confirmation.status === "failed"
              ? "failed"
              : "submitted",
        warnings: uniqueStrings([
          ...(leg.warnings ?? []),
          ...(confirmation.status === "manual_followup_required"
            ? ["manual_followup_required"]
            : []),
        ]),
        venueStatus: {
          ...(leg.venueStatus ?? {
            venueId: leg.venueId,
            venueOrderId: leg.approval?.venueOrderId ?? null,
          }),
          status: confirmation.status,
          settlementTxHash: confirmation.txHash ?? null,
          lastCheckedAt: now,
          updatedAt: now,
          rawStatus: confirmation.rawStatus ?? null,
        },
        receipt: confirmation.txHash
          ? {
            txHash: confirmation.txHash,
            submittedAt: leg.approval?.submittedAt ?? now,
            lastCheckedAt: now,
            receiptStatus: mapReceiptStatus(confirmation.status),
            confirmedAt: confirmation.status === "confirmed" ? now : null,
            revertedAt: confirmation.status === "failed" ? now : null,
            blockNumber: confirmation.blockNumber ?? null,
            transactionIndex: confirmation.transactionIndex ?? null,
            rpcUrl: confirmation.rpcUrl ?? null,
            rawReceipt: confirmation.rawReceipt ?? null,
          }
          : leg.receipt,
      };
    }),
  };

  if (anyFailed) {
    return {
      rebalance: failRebalance(input.rebalance, {
        occurredAt: now,
        summary: "At least one CoW leg failed.",
        rationale:
          "The operator-manual execution lane recorded a failed settlement, so the rebalance returned to explicit operator handling.",
        blockers: ["cow_execution_failed"],
      }),
      executionRequest: {
        ...executionRequest,
        state: "failed",
      },
    };
  }

  if (anyManualFollowup) {
    return {
      rebalance: blockRebalance(input.rebalance, {
        occurredAt: now,
        summary: "CoW execution needs operator follow-up.",
        rationale:
          "The venue reported progress, but the settlement artifact is incomplete, so the rebalance must stay fail-closed until the operator resolves it.",
        blockers: ["manual_followup_required"],
      }),
      executionRequest: {
        ...executionRequest,
        state: "manual_followup_required",
      },
    };
  }

  if (allConfirmed) {
    return {
      rebalance: markRebalanced(input.rebalance, {
        occurredAt: now,
        summary: "CoW execution settled successfully.",
        rationale:
          "Every submitted execution leg reported confirmed settlement, so the rebalance can be marked complete.",
      }),
      executionRequest: {
        ...executionRequest,
        state: "confirmed",
      },
    };
  }

  return {
    rebalance: input.rebalance,
    executionRequest,
  };
}

export function createOperatorManualCoWRebalanceService(config = {}) {
  return {
    cowClient:
      config.cowClient
      ?? createCowSwapApiClient(config.cowClientConfig ?? {}),
    createExecutionRequest: createOperatorManualCoWRebalanceRequest,
    captureQuotes: captureCowQuoteArtifacts,
    recordSubmission: recordSignedCowSubmission,
    confirmSettlement: confirmCowSettlements,
  };
}
