import { describe, expect, it } from "vitest";

import {
  buildXStocksOpsDashboardModel,
  type XStocksReportingSnapshot,
} from "./xstocks-ops-dashboard";

const REPORT_FIXTURE: XStocksReportingSnapshot = {
  version: "1",
  generatedAt: "2026-04-01T12:00:00.000Z",
  privacy: {
    accessMode: "operator_token",
    rawUserIds: "hidden",
    walletAddresses: "masked",
  },
  truthBoundary: {
    durableUserIdentity:
      "Distinct users appear only after authenticated funnel or execution events.",
    preActivationFunnelLedger: "Canonical subject ledger exists.",
    activationViewLedger: "Activation views are canonical from tracked route entry.",
    walletConnectionCoverage:
      "Wallet connection is canonical; funding required remains lower-bound.",
    executionVolumeCoverage:
      "Submitted and confirmed volume come from execution leg truth only.",
    notes: ["No raw wallet addresses are exposed."],
  },
  ladder: [
    ["landing_viewed", "canonical", 120, null, null],
    ["onboarding_started", "canonical", 84, null, null],
    ["qualification_completed", "canonical", 63, null, null],
    ["portfolio_recommended", "canonical", 54, null, null],
    ["activation_viewed", "canonical", 36, null, null],
    ["wallet_connected", "canonical", 30, 24, 18],
    ["activation_saved_funding_blocked", "canonical", null, 8, 6],
    ["quote_ready", "canonical", null, 16, 12],
    ["awaiting_approval", "canonical", null, 10, 8],
    ["submitted", "canonical", null, 7, 6],
    ["confirmed", "canonical", null, 5, 4],
    ["failed", "canonical", null, 2, 2],
  ].map(([stage, coverage, subjects, users, wallets], index) => ({
    stage,
    order: index + 1,
    coverage,
    definition: String(stage),
    source: "fixture",
    reached: {
      subjects,
      users,
      wallets,
      smartWallets: wallets,
      activations: users,
      executionRequests: users,
      executionLegs: users,
    },
    notes: [],
    blockers:
      stage === "activation_saved_funding_blocked"
        ? ["Users must deposit before execution."]
        : [],
  })) as XStocksReportingSnapshot["ladder"],
  metrics: {
    funnel: {
      landingViewed: 120,
      onboardingStarted: 84,
      qualificationCompleted: 63,
      portfolioRecommended: 54,
      activationViewed: 36,
    },
    users: {
      authenticated: 24,
      walletConnected: 24,
      activationSavedFundingBlocked: 8,
      quoteReady: 16,
      awaitingApproval: 10,
      submitted: 7,
      confirmed: 5,
      failed: 2,
    },
    wallets: {
      connected: 18,
      smart: 18,
      quoteReady: 12,
      awaitingApproval: 8,
      submitted: 6,
      confirmed: 4,
      failed: 2,
    },
    activations: {
      total: 24,
      ready: 16,
      blocked: 0,
      savedFundingBlocked: 8,
    },
    executions: {
      requestsTotal: 18,
      requestsWithQuotedLeg: 16,
      requestsAwaitingApproval: 10,
      requestsWithSubmittedLeg: 7,
      requestsWithConfirmedLeg: 5,
      requestsWithFailedLeg: 2,
      submittedLegs: 7,
      confirmedLegs: 5,
      failedLegs: 2,
    },
    volumeUsd: {
      submitted: 7425.5,
      confirmed: 5180.25,
    },
  },
  blockers: [
    {
      blockerId: "generic_funding_readiness_pre_save_unproven",
      severity: "warning",
      title: "Generic funding readiness is only canonical at activation save.",
      detail:
        "The repo can canonically record activation_saved_funding_blocked when a saved activation snapshot is funding-blocked. It still does not independently verify pre-save or current funding balances before activation persistence.",
      affectedStage: null,
      affectedUsers: null,
      affectedExecutionRequests: null,
    },
    {
      blockerId: "venue_rejected",
      severity: "warning",
      title: "Venue rejected the signed order.",
      detail: "One submission failed at the venue.",
      affectedStage: null,
      affectedUsers: 2,
      affectedExecutionRequests: 2,
    },
  ],
  recentExecutions: [
    {
      executionRequestId: "req_failed",
      activationId: "act_failed",
      userLabel: "usr_001",
      walletLabel: "0x1111...1111",
      smartWalletLabel: "0xaaaa...aaaa",
      assetSymbols: ["SPYx"],
      requestedNotionalUsd: 1000,
      state: "failed",
      submittedLegCount: 1,
      confirmedLegCount: 0,
      failedLegCount: 1,
      submittedVolumeUsd: 2245.25,
      confirmedVolumeUsd: 0,
      blockerCount: 1,
      blockers: ["Venue rejected the signed order."],
      updatedAt: "2026-04-01T11:45:00.000Z",
    },
  ],
  reconciliation: {
    methodology: "Submitted and confirmed volume are summed from execution legs only.",
    submittedVolumeUsd: 7425.5,
    confirmedVolumeUsd: 5180.25,
    lines: [
      {
        executionRequestId: "req_a",
        legId: "leg_a",
        userLabel: "usr_002",
        walletLabel: "0x2222...2222",
        assetSymbol: "SPYx",
        targetNotionalUsd: 5180.25,
        legState: "confirmed",
        includedInSubmittedVolume: true,
        includedInConfirmedVolume: true,
        inclusionReasons: ["approval_submitted_or_receipt_recorded", "receipt_confirmed"],
        updatedAt: "2026-04-01T11:40:00.000Z",
      },
      {
        executionRequestId: "req_failed",
        legId: "leg_failed",
        userLabel: "usr_001",
        walletLabel: "0x1111...1111",
        assetSymbol: "SPYx",
        targetNotionalUsd: 2245.25,
        legState: "failed",
        includedInSubmittedVolume: true,
        includedInConfirmedVolume: false,
        inclusionReasons: ["approval_submitted_or_receipt_recorded"],
        updatedAt: "2026-04-01T11:45:00.000Z",
      },
    ],
  },
};

describe("xstocks ops dashboard model", () => {
  it("separates subject funnel conversion from authenticated user execution conversion", () => {
    const model = buildXStocksOpsDashboardModel(REPORT_FIXTURE);

    expect(model.subjectConversionRows[0]).toMatchObject({
      fromStage: "landing_viewed",
      toStage: "onboarding_started",
      measurement: "subjects",
      fromCount: 120,
      toCount: 84,
      conversionRatePct: 70,
      dropOffCount: 36,
      coverage: "canonical",
    });
    expect(model.userConversionRows[0]).toMatchObject({
      fromStage: "wallet_connected",
      toStage: "quote_ready",
      measurement: "users",
      fromCount: 24,
      toCount: 16,
      conversionRatePct: 66.7,
      dropOffCount: 8,
    });
    expect(model.walletConversionRows[2]).toMatchObject({
      fromStage: "awaiting_approval",
      toStage: "submitted",
      measurement: "wallets",
      fromCount: 8,
      toCount: 6,
      conversionRatePct: 75,
      dropOffCount: 2,
    });
  });

  it("surfaces blocker cohorts and keeps failed execution blockers attached", () => {
    const model = buildXStocksOpsDashboardModel(REPORT_FIXTURE);

    expect(model.blockerCohorts).toEqual([
      {
        stage: "activation_saved_funding_blocked",
        label: "Saved Funding-Blocked Cohort",
        measurement: "users",
        count: 8,
        coverage: "canonical",
        blockers: ["Users must deposit before execution."],
        note:
          "Canonical only at activation save: this cohort exists when a persisted activation snapshot is funding-blocked.",
      },
      {
        stage: "failed",
        label: "Failed Execution Cohort",
        measurement: "users",
        count: 2,
        coverage: "canonical",
        blockers: ["Venue rejected the signed order."],
        note: "Canonical terminal execution failures tied to stored execution requests.",
      },
    ]);
    expect(model.summaryCards.find((card) => card.key === "confirmed_volume")?.value).toBe(
      "$5,180.25",
    );
  });
});
