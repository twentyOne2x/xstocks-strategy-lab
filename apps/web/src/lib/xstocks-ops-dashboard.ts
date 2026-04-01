import { resolveApiBase } from "@/lib/api-client";

export type XStocksReportingStage =
  | "landing_viewed"
  | "onboarding_started"
  | "qualification_completed"
  | "portfolio_recommended"
  | "activation_viewed"
  | "wallet_connected"
  | "activation_saved_funding_blocked"
  | "quote_ready"
  | "awaiting_approval"
  | "submitted"
  | "confirmed"
  | "failed";

export type XStocksReportingCoverage =
  | "canonical"
  | "lower_bound"
  | "missing";

export interface XStocksReportingStageCounts {
  subjects: number | null;
  users: number | null;
  wallets: number | null;
  smartWallets: number | null;
  activations: number | null;
  executionRequests: number | null;
  executionLegs: number | null;
}

export interface XStocksReportingStageSummary {
  stage: XStocksReportingStage;
  order: number;
  coverage: XStocksReportingCoverage;
  definition: string;
  source: string;
  reached: XStocksReportingStageCounts;
  notes: string[];
  blockers: string[];
}

export interface XStocksReportingBlocker {
  blockerId: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  affectedStage: XStocksReportingStage | null;
  affectedUsers: number | null;
  affectedExecutionRequests: number | null;
}

export interface XStocksReportingRecentExecution {
  executionRequestId: string;
  activationId: string;
  userLabel: string | null;
  walletLabel: string | null;
  smartWalletLabel: string | null;
  assetSymbols: string[];
  requestedNotionalUsd: number;
  state: string;
  submittedLegCount: number;
  confirmedLegCount: number;
  failedLegCount: number;
  submittedVolumeUsd: number;
  confirmedVolumeUsd: number;
  blockerCount: number;
  blockers: string[];
  updatedAt: string;
}

export interface XStocksReportingReconciliationLine {
  executionRequestId: string;
  legId: string;
  userLabel: string | null;
  walletLabel: string | null;
  assetSymbol: string | null;
  targetNotionalUsd: number;
  legState: string;
  includedInSubmittedVolume: boolean;
  includedInConfirmedVolume: boolean;
  inclusionReasons: string[];
  updatedAt: string;
}

export interface XStocksReportingSnapshot {
  version: string;
  generatedAt: string;
  privacy: {
    accessMode: "operator_token";
    rawUserIds: "hidden";
    walletAddresses: "masked";
  };
  truthBoundary: {
    durableUserIdentity: string;
    preActivationFunnelLedger: string;
    activationViewLedger: string;
    walletConnectionCoverage: string;
    executionVolumeCoverage: string;
    notes: string[];
  };
  ladder: XStocksReportingStageSummary[];
  metrics: {
    funnel: {
      landingViewed: number;
      onboardingStarted: number;
      qualificationCompleted: number;
      portfolioRecommended: number;
      activationViewed: number;
    };
    users: {
      authenticated: number;
      walletConnected: number;
      activationSavedFundingBlocked: number;
      quoteReady: number;
      awaitingApproval: number;
      submitted: number;
      confirmed: number;
      failed: number;
    };
    wallets: {
      connected: number;
      smart: number;
      quoteReady: number;
      awaitingApproval: number;
      submitted: number;
      confirmed: number;
      failed: number;
    };
    activations: {
      total: number;
      ready: number;
      blocked: number;
      savedFundingBlocked: number;
    };
    executions: {
      requestsTotal: number;
      requestsWithQuotedLeg: number;
      requestsAwaitingApproval: number;
      requestsWithSubmittedLeg: number;
      requestsWithConfirmedLeg: number;
      requestsWithFailedLeg: number;
      submittedLegs: number;
      confirmedLegs: number;
      failedLegs: number;
    };
    volumeUsd: {
      submitted: number;
      confirmed: number;
    };
  };
  blockers: XStocksReportingBlocker[];
  recentExecutions: XStocksReportingRecentExecution[];
  reconciliation: {
    methodology: string;
    submittedVolumeUsd: number;
    confirmedVolumeUsd: number;
    lines: XStocksReportingReconciliationLine[];
  };
}

export interface XStocksOpsStageRow extends XStocksReportingStageSummary {
  label: string;
}

export interface XStocksOpsSummaryCard {
  key: string;
  label: string;
  value: string;
  tone: "neutral" | "positive" | "warning";
  detail: string;
}

export interface XStocksOpsConversionRow {
  key: string;
  measurement: "subjects" | "users" | "wallets";
  fromStage: XStocksReportingStage;
  toStage: XStocksReportingStage;
  fromLabel: string;
  toLabel: string;
  fromCount: number | null;
  toCount: number | null;
  conversionRatePct: number | null;
  dropOffCount: number | null;
  coverage: XStocksReportingCoverage;
  blockers: string[];
}

export interface XStocksOpsBlockerCohort {
  stage: XStocksReportingStage;
  label: string;
  measurement: "users" | "wallets";
  count: number | null;
  coverage: XStocksReportingCoverage;
  blockers: string[];
  note: string;
}

export interface XStocksOpsDashboardModel {
  generatedAt: string;
  stageRows: XStocksOpsStageRow[];
  coverageLegend: Array<{
    coverage: XStocksReportingCoverage;
    label: string;
    detail: string;
  }>;
  summaryCards: XStocksOpsSummaryCard[];
  subjectConversionRows: XStocksOpsConversionRow[];
  userConversionRows: XStocksOpsConversionRow[];
  walletConversionRows: XStocksOpsConversionRow[];
  blockerCohorts: XStocksOpsBlockerCohort[];
  truthBoundary: XStocksReportingSnapshot["truthBoundary"];
  blockers: XStocksReportingBlocker[];
  recentExecutions: XStocksReportingRecentExecution[];
  reconciliation: XStocksReportingSnapshot["reconciliation"];
  metrics: XStocksReportingSnapshot["metrics"];
}

const STAGE_LABELS: Record<XStocksReportingStage, string> = {
  landing_viewed: "Landing Viewed",
  onboarding_started: "Onboarding Started",
  qualification_completed: "Qualification Completed",
  portfolio_recommended: "Portfolio Recommended",
  activation_viewed: "Activation Viewed",
  wallet_connected: "Wallet Connected",
  activation_saved_funding_blocked: "Funding Required (Saved Activation Only)",
  quote_ready: "Quote Ready",
  awaiting_approval: "Awaiting Approval",
  submitted: "Submitted",
  confirmed: "Confirmed",
  failed: "Failed",
};

const COVERAGE_COPY: Record<
  XStocksReportingCoverage,
  { label: string; detail: string }
> = {
  canonical: {
    label: "Canonical",
    detail: "Backed directly by repo-owned funnel or execution records.",
  },
  lower_bound: {
    label: "Lower Bound",
    detail: "Truthful but partial; the repo only captures a subset of the real stage population.",
  },
  missing: {
    label: "Missing",
    detail: "This branch of the funnel is not measured canonically and must not be inferred.",
  },
};

const SUBJECT_FUNNEL_STAGES: XStocksReportingStage[] = [
  "landing_viewed",
  "onboarding_started",
  "qualification_completed",
  "portfolio_recommended",
  "activation_viewed",
  "wallet_connected",
];

const EXECUTION_FLOW_STAGES: XStocksReportingStage[] = [
  "wallet_connected",
  "quote_ready",
  "awaiting_approval",
  "submitted",
  "confirmed",
];

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function formatStageLabel(stage: XStocksReportingStage) {
  return STAGE_LABELS[stage];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `${value.toFixed(1)}%`;
}

function roundPct(value: number) {
  return Number(value.toFixed(1));
}

function combineCoverage(
  left: XStocksReportingCoverage,
  right: XStocksReportingCoverage,
): XStocksReportingCoverage {
  if (left === "missing" || right === "missing") {
    return "missing";
  }

  if (left === "lower_bound" || right === "lower_bound") {
    return "lower_bound";
  }

  return "canonical";
}

function countForStage(
  stage: XStocksReportingStageSummary,
  measurement: "subjects" | "users" | "wallets",
) {
  return stage.reached[measurement];
}

function stageBlockersFor(
  report: XStocksReportingSnapshot,
  stage: XStocksReportingStage,
) {
  const stageSummary = report.ladder.find((item) => item.stage === stage);
  const directStageBlockers = stageSummary?.blockers ?? [];
  const affectedBlockers = report.blockers
    .filter((blocker) => blocker.affectedStage === stage)
    .map((blocker) => blocker.title);
  const failedExecutionBlockers =
    stage === "failed"
      ? report.recentExecutions
          .filter((item) => item.state === "failed")
          .flatMap((item) => item.blockers)
      : [];

  return uniqueStrings([
    ...directStageBlockers,
    ...affectedBlockers,
    ...failedExecutionBlockers,
  ]);
}

function buildConversionRows(
  report: XStocksReportingSnapshot,
  stages: XStocksReportingStage[],
  measurement: "subjects" | "users" | "wallets",
) {
  const stageById = new Map(report.ladder.map((stage) => [stage.stage, stage]));

  return stages.slice(0, -1).map((stageId, index) => {
    const nextStageId = stages[index + 1];
    const fromStage = stageById.get(stageId);
    const toStage = stageById.get(nextStageId);

    if (!fromStage || !toStage) {
      throw new Error(`Missing reporting stages for ${stageId} -> ${nextStageId}.`);
    }

    const fromCount = countForStage(fromStage, measurement);
    const toCount = countForStage(toStage, measurement);
    const conversionRatePct =
      fromCount === null || toCount === null || fromCount === 0
        ? null
        : roundPct((toCount / fromCount) * 100);
    const dropOffCount =
      fromCount === null || toCount === null
        ? null
        : Math.max(fromCount - toCount, 0);

    return {
      key: `${measurement}:${stageId}:${nextStageId}`,
      measurement,
      fromStage: stageId,
      toStage: nextStageId,
      fromLabel: formatStageLabel(stageId),
      toLabel: formatStageLabel(nextStageId),
      fromCount,
      toCount,
      conversionRatePct,
      dropOffCount,
      coverage: combineCoverage(fromStage.coverage, toStage.coverage),
      blockers: stageBlockersFor(report, nextStageId),
    } satisfies XStocksOpsConversionRow;
  });
}

function buildSummaryCards(
  report: XStocksReportingSnapshot,
) {
  const landingSubjects = report.metrics.funnel.landingViewed;
  const walletConnectedSubjects =
    report.ladder.find((stage) => stage.stage === "wallet_connected")?.reached.subjects ??
    0;
  const landingToWalletRate =
    landingSubjects === 0
      ? null
      : roundPct((walletConnectedSubjects / landingSubjects) * 100);
  const quoteToSubmittedUsers =
    report.metrics.users.quoteReady === 0
      ? null
      : roundPct(
          (report.metrics.users.submitted / report.metrics.users.quoteReady) * 100,
        );
  const submittedToConfirmedUsers =
    report.metrics.users.submitted === 0
      ? null
      : roundPct(
          (report.metrics.users.confirmed / report.metrics.users.submitted) * 100,
        );

  return [
    {
      key: "landing_subjects",
      label: "Tracked Funnel Subjects",
      value: String(landingSubjects),
      tone: "neutral",
      detail: "Canonical anonymous-to-authenticated subject ledger.",
    },
    {
      key: "wallet_connected_users",
      label: "Wallet-Connected Users",
      value: String(report.metrics.users.walletConnected),
      tone: "positive",
      detail: "Distinct authenticated users at the wallet-connected stage.",
    },
    {
      key: "landing_to_wallet_rate",
      label: "Landing -> Wallet Conversion",
      value: formatPercent(landingToWalletRate),
      tone: landingToWalletRate !== null && landingToWalletRate >= 20 ? "positive" : "warning",
      detail: "Subject-led conversion across the canonical funnel track.",
    },
    {
      key: "quote_to_submitted_rate",
      label: "Quote -> Submitted Conversion",
      value: formatPercent(quoteToSubmittedUsers),
      tone:
        quoteToSubmittedUsers !== null && quoteToSubmittedUsers >= 50
          ? "positive"
          : "warning",
      detail: "Authenticated-user execution progression from quote readiness to real submission.",
    },
    {
      key: "submitted_volume",
      label: "Submitted Volume",
      value: formatCurrency(report.metrics.volumeUsd.submitted),
      tone: "neutral",
      detail: "Submitted notional only after a real operator/user-approved submission exists.",
    },
    {
      key: "confirmed_volume",
      label: "Confirmed Volume",
      value: formatCurrency(report.metrics.volumeUsd.confirmed),
      tone:
        report.metrics.volumeUsd.confirmed > 0 &&
        submittedToConfirmedUsers !== null &&
        submittedToConfirmedUsers >= 50
          ? "positive"
          : "neutral",
      detail: "Settlement-confirmed notional only.",
    },
  ] satisfies XStocksOpsSummaryCard[];
}

function buildBlockerCohorts(report: XStocksReportingSnapshot) {
  const stageById = new Map(report.ladder.map((stage) => [stage.stage, stage]));
  const savedFundingBlockedStage = stageById.get("activation_saved_funding_blocked");
  const failedStage = stageById.get("failed");

  if (!savedFundingBlockedStage || !failedStage) {
    throw new Error(
      "Missing activation_saved_funding_blocked or failed stage in reporting ladder.",
    );
  }

  return [
    {
      stage: "activation_saved_funding_blocked",
      label: "Saved Funding-Blocked Cohort",
      measurement: "users",
      count: savedFundingBlockedStage.reached.users,
      coverage: savedFundingBlockedStage.coverage,
      blockers: stageBlockersFor(report, "activation_saved_funding_blocked"),
      note:
        "Canonical only at activation save: this cohort exists when a persisted activation snapshot is funding-blocked.",
    },
    {
      stage: "failed",
      label: "Failed Execution Cohort",
      measurement: "users",
      count: failedStage.reached.users,
      coverage: failedStage.coverage,
      blockers: stageBlockersFor(report, "failed"),
      note: "Canonical terminal execution failures tied to stored execution requests.",
    },
  ] satisfies XStocksOpsBlockerCohort[];
}

async function readApiErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload?.error ?? payload?.data?.error ?? `Request failed with ${response.status}.`;
  } catch {
    return `Request failed with ${response.status}.`;
  }
}

export async function fetchXStocksOpsReport({
  limit = 25,
  reportingToken,
}: {
  limit?: number;
  reportingToken: string;
}) {
  const response = await fetch(
    `${resolveApiBase()}/api/reporting/xstocks?limit=${encodeURIComponent(String(limit))}`,
    {
      headers: {
        "X-Reporting-Token": reportingToken,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const payload = await response.json();
  return payload.data as XStocksReportingSnapshot;
}

export function buildXStocksOpsDashboardModel(
  report: XStocksReportingSnapshot,
): XStocksOpsDashboardModel {
  const stageRows = report.ladder.map((stage) => ({
    ...stage,
    label: formatStageLabel(stage.stage),
  }));
  const subjectConversionRows = buildConversionRows(
    report,
    SUBJECT_FUNNEL_STAGES,
    "subjects",
  );
  const userConversionRows = buildConversionRows(
    report,
    EXECUTION_FLOW_STAGES,
    "users",
  );
  const walletConversionRows = buildConversionRows(
    report,
    EXECUTION_FLOW_STAGES,
    "wallets",
  );

  return {
    generatedAt: report.generatedAt,
    stageRows,
    coverageLegend: (["canonical", "lower_bound", "missing"] as const).map(
      (coverage) => ({
        coverage,
        label: COVERAGE_COPY[coverage].label,
        detail: COVERAGE_COPY[coverage].detail,
      }),
    ),
    summaryCards: buildSummaryCards(
      report,
    ),
    subjectConversionRows,
    userConversionRows,
    walletConversionRows,
    blockerCohorts: buildBlockerCohorts(report),
    truthBoundary: report.truthBoundary,
    blockers: report.blockers,
    recentExecutions: report.recentExecutions,
    reconciliation: report.reconciliation,
    metrics: report.metrics,
  };
}
