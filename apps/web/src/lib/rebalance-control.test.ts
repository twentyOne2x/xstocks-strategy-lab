import { describe, expect, it } from "vitest";

import { manifests } from "./mock-data";
import {
  buildRebalanceControlSnapshot,
  getExecuteAllBlocker,
  getOneInchBoundaryNote,
} from "./rebalance-control";

const manifest = manifests[0];

describe("rebalance-control", () => {
  it("requires a provider-triggered awaiting operator review before execute_all is enabled", () => {
    const blocker = getExecuteAllBlocker({
      orchestration: {
        rebalanceId: "rebalance_1",
        slotId: manifest.slot_id,
        chain: manifest.chain,
        targetManifestId: manifest.manifest_id,
        state: "awaiting_operator",
        runtimeOwner: "operator_manual",
        triggerSource: "provider_triggered",
        summary: "Provider event opened review.",
        rationale: "Review opened.",
        scheduledFor: null,
        recommendationState: "rebalance",
        executionState: "ready",
        executionEligibility: "executable",
        surfaceTruth: "live",
        providerReceiptId: "provider_receipt_1",
        executionRequestId: null,
        executionTriggerSource: null,
        executionRequestState: null,
        blockers: [],
        warnings: [],
        automationTruth: {
          operatorManualRequired: true,
          autonomousExecutionProven: false,
          providerTriggeredProven: true,
          supportedTriggerSources: ["operator_manual", "scheduled_cron", "policy_event", "provider_triggered"],
          notes: [],
        },
        nextAction: {
          title: "Review and stage",
          detail: "Stage the request.",
          status: "ready",
        },
      },
      latestActivationId: "act_1",
    });

    expect(blocker).toBeNull();
  });

  it("fails closed when there is no saved activation to stage execute_all against", () => {
    const blocker = getExecuteAllBlocker({
      orchestration: {
        rebalanceId: "rebalance_1",
        slotId: manifest.slot_id,
        chain: manifest.chain,
        targetManifestId: manifest.manifest_id,
        state: "awaiting_operator",
        runtimeOwner: "operator_manual",
        triggerSource: "provider_triggered",
        summary: "Provider event opened review.",
        rationale: "Review opened.",
        scheduledFor: null,
        recommendationState: "rebalance",
        executionState: "ready",
        executionEligibility: "executable",
        surfaceTruth: "live",
        providerReceiptId: "provider_receipt_1",
        executionRequestId: null,
        executionTriggerSource: null,
        executionRequestState: null,
        blockers: [],
        warnings: [],
        automationTruth: {
          operatorManualRequired: true,
          autonomousExecutionProven: false,
          providerTriggeredProven: true,
          supportedTriggerSources: ["operator_manual", "scheduled_cron", "policy_event", "provider_triggered"],
          notes: [],
        },
        nextAction: null,
      },
      latestActivationId: null,
    });

    expect(blocker).toMatch(/Saved activation is required/i);
  });

  it("surfaces the 1inch signature boundary when venue-routed execution is otherwise live", () => {
    const note = getOneInchBoundaryNote({
      manifest: {
        ...manifest,
        market_intelligence: {
          ...manifest.market_intelligence,
          routeState: {
            ...manifest.market_intelligence.routeState,
            primaryVenue: "1inch",
          },
        },
      },
      executionPreview: {
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        blockers: [],
        warnings: [],
        routeTruthLabels: [
          {
            routeId: "1inch.ethereum",
            label: "1inch on Ethereum",
            routeKind: "dex",
            chain: "ethereum",
            verificationTier: "verified",
            truthState: "live",
            availability: "available",
            requiredFor: "core_xstocks",
            reason: "Venue-routed proof exists.",
          },
        ],
      },
    });

    expect(note).toMatch(/1inch Fusion EIP-712 signatures are still required/i);
  });

  it("builds a combined snapshot with blockers and the live venue boundary", () => {
    const snapshot = buildRebalanceControlSnapshot({
      manifest: {
        ...manifest,
        market_intelligence: {
          ...manifest.market_intelligence,
          routeState: {
            ...manifest.market_intelligence.routeState,
            primaryVenue: "1inch",
          },
        },
      },
      orchestration: null,
      executionPreview: {
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        blockers: [],
        warnings: [],
        routeTruthLabels: [
          {
            routeId: "1inch.ethereum",
            label: "1inch on Ethereum",
            routeKind: "dex",
            chain: "ethereum",
            verificationTier: "verified",
            truthState: "live",
            availability: "available",
            requiredFor: "core_xstocks",
            reason: "Venue-routed proof exists.",
          },
        ],
      },
      latestActivationId: null,
    });

    expect(snapshot.executeAllEnabled).toBe(false);
    expect(snapshot.blockers[0]).toMatch(/No persisted rebalance review is loaded/i);
    expect(snapshot.liveBoundary).toMatch(/1inch Fusion EIP-712 signatures are still required/i);
  });
});
