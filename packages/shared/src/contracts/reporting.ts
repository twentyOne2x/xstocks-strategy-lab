import { z } from "zod";

import {
  contractVersionSchema,
  nonEmptyStringSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";
import { authenticatedOwnerSchema } from "./auth.js";
import {
  executionLegStateSchema,
  executionRequestStateSchema,
} from "./execution.js";

export const XSTOCKS_REPORTING_LADDER_STAGE_VALUES = [
  "landing_viewed",
  "onboarding_started",
  "qualification_completed",
  "portfolio_recommended",
  "activation_viewed",
  "wallet_connected",
  "funding_required",
  "quote_ready",
  "awaiting_approval",
  "submitted",
  "confirmed",
  "failed",
] as const;
export const xstocksReportingLadderStageSchema = z.enum(
  XSTOCKS_REPORTING_LADDER_STAGE_VALUES,
);
export type XStocksReportingLadderStage = z.infer<
  typeof xstocksReportingLadderStageSchema
>;

export const XSTOCKS_FUNNEL_LEDGER_STAGE_VALUES = [
  "landing_viewed",
  "onboarding_started",
  "qualification_completed",
  "portfolio_recommended",
  "activation_viewed",
  "wallet_connected",
] as const;
export const xstocksFunnelLedgerStageSchema = z.enum(
  XSTOCKS_FUNNEL_LEDGER_STAGE_VALUES,
);
export type XStocksFunnelLedgerStage = z.infer<
  typeof xstocksFunnelLedgerStageSchema
>;

export const XSTOCKS_FUNNEL_INGEST_STAGE_VALUES = [
  "landing_viewed",
  "onboarding_started",
  "activation_viewed",
  "wallet_connected",
] as const;
export const xstocksFunnelIngestStageSchema = z.enum(
  XSTOCKS_FUNNEL_INGEST_STAGE_VALUES,
);
export type XStocksFunnelIngestStage = z.infer<
  typeof xstocksFunnelIngestStageSchema
>;

export const XSTOCKS_FUNNEL_EVENT_SOURCE_VALUES = ["web", "api"] as const;
export const xstocksFunnelEventSourceSchema = z.enum(
  XSTOCKS_FUNNEL_EVENT_SOURCE_VALUES,
);
export type XStocksFunnelEventSource = z.infer<
  typeof xstocksFunnelEventSourceSchema
>;

export const XSTOCKS_FUNNEL_VERIFICATION_METHOD_VALUES = [
  "web_subject_bootstrap",
  "web_subject_known",
  "questionnaire_qualification",
  "manifest_activation_route",
  "privy_wallet_auth",
] as const;
export const xstocksFunnelVerificationMethodSchema = z.enum(
  XSTOCKS_FUNNEL_VERIFICATION_METHOD_VALUES,
);
export type XStocksFunnelVerificationMethod = z.infer<
  typeof xstocksFunnelVerificationMethodSchema
>;

const ethereumAddressSchema = z
  .string()
  .trim()
  .regex(/^0x([A-Fa-f0-9]{40})$/u);

export const xstocksFunnelEventSchema = z.object({
  version: contractVersionSchema,
  eventId: nonEmptyStringSchema,
  stage: xstocksFunnelLedgerStageSchema,
  occurredAt: timestampSchema,
  subjectId: nonEmptyStringSchema,
  owner: authenticatedOwnerSchema.nullable(),
  walletAddress: ethereumAddressSchema.nullable(),
  manifestId: nonEmptyStringSchema.nullable(),
  slotId: strategySlotIdSchema.nullable(),
  recommendationId: nonEmptyStringSchema.nullable(),
  source: xstocksFunnelEventSourceSchema,
  verificationMethod: xstocksFunnelVerificationMethodSchema,
  dedupeKey: nonEmptyStringSchema,
});
export type XStocksFunnelEvent = z.infer<typeof xstocksFunnelEventSchema>;

const optionalSubjectIdSchema = nonEmptyStringSchema.optional();

export const xstocksFunnelEventIngestRequestSchema = z.discriminatedUnion(
  "stage",
  [
    z.object({
      stage: z.literal("landing_viewed"),
      subjectId: optionalSubjectIdSchema,
    }),
    z.object({
      stage: z.literal("onboarding_started"),
      subjectId: optionalSubjectIdSchema,
    }),
    z.object({
      stage: z.literal("activation_viewed"),
      subjectId: optionalSubjectIdSchema,
      manifestId: nonEmptyStringSchema.optional(),
      slotId: strategySlotIdSchema.optional(),
    }),
    z.object({
      stage: z.literal("wallet_connected"),
      subjectId: optionalSubjectIdSchema,
    }),
  ],
);
export type XStocksFunnelEventIngestRequest = z.infer<
  typeof xstocksFunnelEventIngestRequestSchema
>;

export const XSTOCKS_REPORTING_COVERAGE_VALUES = [
  "canonical",
  "lower_bound",
  "missing",
] as const;
export const xstocksReportingCoverageSchema = z.enum(
  XSTOCKS_REPORTING_COVERAGE_VALUES,
);
export type XStocksReportingCoverage = z.infer<
  typeof xstocksReportingCoverageSchema
>;

export const XSTOCKS_REPORTING_BLOCKER_SEVERITY_VALUES = [
  "info",
  "warning",
  "critical",
] as const;
export const xstocksReportingBlockerSeveritySchema = z.enum(
  XSTOCKS_REPORTING_BLOCKER_SEVERITY_VALUES,
);
export type XStocksReportingBlockerSeverity = z.infer<
  typeof xstocksReportingBlockerSeveritySchema
>;

const nullableCountSchema = z.number().int().nonnegative().nullable();

export const xstocksReportingStageCountsSchema = z.object({
  subjects: nullableCountSchema,
  users: nullableCountSchema,
  wallets: nullableCountSchema,
  smartWallets: nullableCountSchema,
  activations: nullableCountSchema,
  executionRequests: nullableCountSchema,
  executionLegs: nullableCountSchema,
});
export type XStocksReportingStageCounts = z.infer<
  typeof xstocksReportingStageCountsSchema
>;

export const xstocksReportingStageSummarySchema = z.object({
  stage: xstocksReportingLadderStageSchema,
  order: z.number().int().positive(),
  coverage: xstocksReportingCoverageSchema,
  definition: nonEmptyStringSchema,
  source: nonEmptyStringSchema,
  reached: xstocksReportingStageCountsSchema,
  notes: z.array(nonEmptyStringSchema),
  blockers: z.array(nonEmptyStringSchema),
});
export type XStocksReportingStageSummary = z.infer<
  typeof xstocksReportingStageSummarySchema
>;

export const xstocksReportingBlockerSchema = z.object({
  blockerId: nonEmptyStringSchema,
  severity: xstocksReportingBlockerSeveritySchema,
  title: nonEmptyStringSchema,
  detail: nonEmptyStringSchema,
  affectedStage: xstocksReportingLadderStageSchema.nullable(),
  affectedUsers: nullableCountSchema,
  affectedExecutionRequests: nullableCountSchema,
});
export type XStocksReportingBlocker = z.infer<
  typeof xstocksReportingBlockerSchema
>;

export const xstocksReportingPrivacySchema = z.object({
  accessMode: z.literal("operator_token"),
  rawUserIds: z.literal("hidden"),
  walletAddresses: z.literal("masked"),
});
export type XStocksReportingPrivacy = z.infer<
  typeof xstocksReportingPrivacySchema
>;

export const xstocksReportingTruthBoundarySchema = z.object({
  durableUserIdentity: nonEmptyStringSchema,
  preActivationFunnelLedger: nonEmptyStringSchema,
  activationViewLedger: nonEmptyStringSchema,
  walletConnectionCoverage: nonEmptyStringSchema,
  executionVolumeCoverage: nonEmptyStringSchema,
  notes: z.array(nonEmptyStringSchema),
});
export type XStocksReportingTruthBoundary = z.infer<
  typeof xstocksReportingTruthBoundarySchema
>;

export const xstocksReportingMetricsSchema = z.object({
  funnel: z.object({
    landingViewed: z.number().int().nonnegative(),
    onboardingStarted: z.number().int().nonnegative(),
    qualificationCompleted: z.number().int().nonnegative(),
    portfolioRecommended: z.number().int().nonnegative(),
    activationViewed: z.number().int().nonnegative(),
  }),
  users: z.object({
    authenticated: z.number().int().nonnegative(),
    walletConnected: z.number().int().nonnegative(),
    fundingRequired: z.number().int().nonnegative(),
    quoteReady: z.number().int().nonnegative(),
    awaitingApproval: z.number().int().nonnegative(),
    submitted: z.number().int().nonnegative(),
    confirmed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  wallets: z.object({
    connected: z.number().int().nonnegative(),
    smart: z.number().int().nonnegative(),
    quoteReady: z.number().int().nonnegative(),
    awaitingApproval: z.number().int().nonnegative(),
    submitted: z.number().int().nonnegative(),
    confirmed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  activations: z.object({
    total: z.number().int().nonnegative(),
    ready: z.number().int().nonnegative(),
    blocked: z.number().int().nonnegative(),
    fundingRequired: z.number().int().nonnegative(),
  }),
  executions: z.object({
    requestsTotal: z.number().int().nonnegative(),
    requestsWithQuotedLeg: z.number().int().nonnegative(),
    requestsAwaitingApproval: z.number().int().nonnegative(),
    requestsWithSubmittedLeg: z.number().int().nonnegative(),
    requestsWithConfirmedLeg: z.number().int().nonnegative(),
    requestsWithFailedLeg: z.number().int().nonnegative(),
    submittedLegs: z.number().int().nonnegative(),
    confirmedLegs: z.number().int().nonnegative(),
    failedLegs: z.number().int().nonnegative(),
  }),
  volumeUsd: z.object({
    submitted: z.number().finite().nonnegative(),
    confirmed: z.number().finite().nonnegative(),
  }),
});
export type XStocksReportingMetrics = z.infer<
  typeof xstocksReportingMetricsSchema
>;

export const xstocksReportingRecentExecutionSchema = z.object({
  executionRequestId: nonEmptyStringSchema,
  activationId: nonEmptyStringSchema,
  userLabel: nonEmptyStringSchema.nullable(),
  walletLabel: nonEmptyStringSchema.nullable(),
  smartWalletLabel: nonEmptyStringSchema.nullable(),
  assetSymbols: z.array(nonEmptyStringSchema),
  requestedNotionalUsd: z.number().finite().nonnegative(),
  state: executionRequestStateSchema,
  submittedLegCount: z.number().int().nonnegative(),
  confirmedLegCount: z.number().int().nonnegative(),
  failedLegCount: z.number().int().nonnegative(),
  submittedVolumeUsd: z.number().finite().nonnegative(),
  confirmedVolumeUsd: z.number().finite().nonnegative(),
  blockerCount: z.number().int().nonnegative(),
  blockers: z.array(nonEmptyStringSchema),
  updatedAt: timestampSchema,
});
export type XStocksReportingRecentExecution = z.infer<
  typeof xstocksReportingRecentExecutionSchema
>;

export const xstocksReportingReconciliationLineSchema = z.object({
  executionRequestId: nonEmptyStringSchema,
  legId: nonEmptyStringSchema,
  userLabel: nonEmptyStringSchema.nullable(),
  walletLabel: nonEmptyStringSchema.nullable(),
  assetSymbol: nonEmptyStringSchema.nullable(),
  targetNotionalUsd: z.number().finite().nonnegative(),
  legState: executionLegStateSchema,
  includedInSubmittedVolume: z.boolean(),
  includedInConfirmedVolume: z.boolean(),
  inclusionReasons: z.array(nonEmptyStringSchema),
  updatedAt: timestampSchema,
});
export type XStocksReportingReconciliationLine = z.infer<
  typeof xstocksReportingReconciliationLineSchema
>;

export const xstocksReportingReconciliationSchema = z.object({
  methodology: nonEmptyStringSchema,
  submittedVolumeUsd: z.number().finite().nonnegative(),
  confirmedVolumeUsd: z.number().finite().nonnegative(),
  lines: z.array(xstocksReportingReconciliationLineSchema),
});
export type XStocksReportingReconciliation = z.infer<
  typeof xstocksReportingReconciliationSchema
>;

export const xstocksReportingSnapshotSchema = z.object({
  privacy: xstocksReportingPrivacySchema,
  truthBoundary: xstocksReportingTruthBoundarySchema,
  ladder: z.array(xstocksReportingStageSummarySchema).length(
    XSTOCKS_REPORTING_LADDER_STAGE_VALUES.length,
  ),
  metrics: xstocksReportingMetricsSchema,
  blockers: z.array(xstocksReportingBlockerSchema),
  recentExecutions: z.array(xstocksReportingRecentExecutionSchema),
  reconciliation: xstocksReportingReconciliationSchema,
});
export type XStocksReportingSnapshot = z.infer<
  typeof xstocksReportingSnapshotSchema
>;
