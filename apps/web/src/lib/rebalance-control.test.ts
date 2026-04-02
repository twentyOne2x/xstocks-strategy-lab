import { describe, expect, it } from "vitest";

import { manifests } from "./mock-data";
import {
  buildDefaultRebalanceEventDraft,
  buildDoAllRecommendationsControl,
  buildRebalanceControlSnapshot,
  buildRebalanceRecommendations,
  getExecuteAllBlocker,
  getOneInchBoundaryNote,
} from "./rebalance-control";

const manifest = manifests[0];

const providerAwaitingOperatorReview = {
  rebalanceId: "rebalance_1",
  slotId: manifest.slot_id,
  chain: manifest.chain,
  targetManifestId: manifest.manifest_id,
  state: "awaiting_operator" as const,
  runtimeOwner: "operator_manual" as const,
  triggerSource: "provider_triggered" as const,
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
    supportedTriggerSources: [
      "operator_manual",
      "scheduled_cron",
      "policy_event",
      "provider_triggered",
    ],
    notes: [],
  },
  nextAction: {
    title: "Review and stage",
    detail: "Stage the request.",
    status: "ready",
  },
};

describe("rebalance-control", () => {
  it("requires a provider-triggered awaiting operator review before execute_all is enabled", () => {
    const blocker = getExecuteAllBlocker({
      orchestration: providerAwaitingOperatorReview,
    });

    expect(blocker).toBeNull();
  });

  it("builds a default local-only event draft from the manifest", () => {
    const event = buildDefaultRebalanceEventDraft(manifest);

    expect(event.persistence).toBe("local_stub");
    expect(event.source).toMatch(/manual/i);
    expect(event.affectedSymbols.length).toBeGreaterThan(0);
    expect(event.affectedSleeves.length).toBeGreaterThan(0);
  });

  it("classifies the grouped action as stage-only when provider-backed review is ready", () => {
    const control = buildDoAllRecommendationsControl({
      orchestration: providerAwaitingOperatorReview,
      executeAllBlocker: null,
      latestActivationId: null,
      authenticated: true,
      ready: true,
      executionRequest: null,
    });

    expect(control.mode).toBe("stage_only");
    expect(control.enabled).toBe(true);
    expect(control.detail).toMatch(/Persist activation truth/i);
  });

  it("fails closed to review-only when there is no persisted review loaded", () => {
    const control = buildDoAllRecommendationsControl({
      orchestration: null,
      executeAllBlocker: "No persisted rebalance review is loaded for this slot.",
      latestActivationId: null,
      authenticated: true,
      ready: true,
      executionRequest: null,
    });

    expect(control.mode).toBe("review_only");
    expect(control.enabled).toBe(false);
  });

  it("derives conservative recommendations from a low-confidence manual event", () => {
    const snapshot = buildRebalanceControlSnapshot({
      manifest,
      orchestration: null,
      executionPreview: null,
      latestActivationId: null,
      authenticated: true,
      ready: true,
      executionRequest: null,
    });
    const recommendations = buildRebalanceRecommendations({
      manifest,
      event: {
        source: "Manual operator stub",
        summary: "AI infra leadership is softer after a volatile week.",
        confidence: "Low confidence",
        affectedSleeves: ["core xstocks"],
        affectedSymbols: ["NVDAx"],
        portfolioImplication: "Keep turnover light until route truth is fresher.",
        persistence: "local_stub",
        updatedAt: null,
      },
      snapshot,
    });

    expect(recommendations.map((item) => item.label)).toContain("Monitor only");
    expect(recommendations.map((item) => item.label)).toContain("Pause adds");
    expect(recommendations.map((item) => item.label)).not.toContain("Trim NVDAx");
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
      authenticated: true,
      ready: true,
      executionRequest: null,
    });

    expect(snapshot.executeAllEnabled).toBe(false);
    expect(snapshot.blockers[0]).toMatch(/No persisted rebalance review is loaded/i);
    expect(snapshot.liveBoundary).toMatch(/1inch Fusion EIP-712 signatures are still required/i);
  });
});
