import { z } from "../../../packages/shared/node_modules/zod/index.js";

import { activityEventSchema } from "../../../packages/shared/dist/contracts/activity.js";
import { authenticatedOwnerSchema } from "../../../packages/shared/dist/contracts/auth.js";
import {
  activationActionSchema,
  activationPermissionSchema,
} from "../../../packages/shared/dist/contracts/activation.js";
import { executionRequestSchema } from "../../../packages/shared/dist/contracts/execution.js";
import {
  xstocksFunnelEventIngestRequestSchema,
  xstocksFunnelEventSchema,
  xstocksReportingSnapshotSchema,
} from "../../../packages/shared/dist/contracts/reporting.js";
import {
  activationManifestRefSchema,
  chainSchema,
  executionEligibilitySchema,
  executionStateSchema,
  manifestBadgeSchema,
  nonEmptyStringSchema,
  routeChainSchema,
  routeTruthLabelSchema,
  routeVerificationTierSchema,
  signalRefSchema,
  smartAccountReadinessSchema,
  strategyModeSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "../../../packages/shared/dist/contracts/common.js";
import {
  basketRecommendationSchema,
  directionalRecommendationSchema,
  directionalExpressionSchema,
  portfolioExplanationBundleSchema,
  portfolioTargetAllocationSchema,
  promotedBasketExplanationBundleSchema,
  promotedBasketTuningSummarySchema,
  strategySlotSchema,
} from "../../../packages/policy/src/shared-contracts.js";
import { agentQualificationSchema } from "../../../packages/shared/dist/contracts/qualification.js";

const API_CONTRACT_VERSION = "1";
const apiContractVersionSchema = z.literal(API_CONTRACT_VERSION);
const routeAvailabilitySchema = z.enum([
  "available",
  "preview_only",
  "unknown",
  "missing",
  "unavailable",
]);
const rebalanceStateSchema = z.enum([
  "preview_only",
  "rebalance_recommended",
  "rebalance_deferred",
  "scheduled",
  "awaiting_operator",
  "executing",
  "rebalanced",
  "blocked",
  "paused",
  "failed",
]);
const rebalanceTriggerSourceSchema = z.enum([
  "operator_manual",
  "scheduled_cron",
  "policy_event",
  "provider_triggered",
]);
const rebalanceRuntimeOwnerSchema = z.enum([
  "operator_manual",
  "worker_offchain_scheduler",
]);
const routeTruthLabelViewSchema = z.object({
  routeId: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  routeKind: nonEmptyStringSchema,
  chain: routeChainSchema.optional(),
  verificationTier: routeVerificationTierSchema,
  truthState: routeTruthLabelSchema,
  availability: routeAvailabilitySchema,
  requiredFor: nonEmptyStringSchema,
  reason: nonEmptyStringSchema,
});
const requiredRouteViewSchema = z.object({
  routeId: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  routeKind: nonEmptyStringSchema,
  requiredFor: nonEmptyStringSchema,
});
const walletRequirementsViewSchema = z.object({
  requiresWallet: z.boolean(),
  requiresSmartAccount: z.boolean(),
  minFundingUsd: z.number().finite().nonnegative(),
  preferredFundingProvider: nonEmptyStringSchema,
  topUpAsset: nonEmptyStringSchema,
});
const manifestSourceViewSchema = z.object({
  type: nonEmptyStringSchema,
  manifestId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
});
const manifestFrontendViewSchema = z.object({
  title: nonEmptyStringSchema,
  subtitle: nonEmptyStringSchema,
  riskLabel: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  badges: z.array(manifestBadgeSchema),
});
const manifestHoldingRationaleViewSchema = z.object({
  symbol: nonEmptyStringSchema,
  sleeve: nonEmptyStringSchema,
  rationale: nonEmptyStringSchema,
});
const manifestExplanationViewSchema = z.object({
  thesis: nonEmptyStringSchema,
  whatThisDoes: nonEmptyStringSchema,
  bestForUser: nonEmptyStringSchema,
  howItChanges: nonEmptyStringSchema,
  replayInterpretation: nonEmptyStringSchema,
  holdingRationales: z.array(manifestHoldingRationaleViewSchema),
  bundle: portfolioExplanationBundleSchema,
});
const manifestValidationViewSchema = z.object({
  datasetVersion: nonEmptyStringSchema,
  evaluatorVersion: nonEmptyStringSchema,
  objectiveId: nonEmptyStringSchema,
  score: z.number().finite(),
  deltaVsIncumbent: z.number().finite().nullable(),
  promotedAt: timestampSchema,
});
const manifestFallbackViewSchema = z.object({
  previousIncumbentId: nonEmptyStringSchema.nullable(),
  disableConditions: z.array(nonEmptyStringSchema),
});
const manifestActivationTemplateViewSchema = z.object({
  mode: strategyModeSchema,
  templateId: nonEmptyStringSchema,
  fundingAssetSymbol: nonEmptyStringSchema,
  starterBasketId: nonEmptyStringSchema.optional(),
  assetSymbol: nonEmptyStringSchema.optional(),
});
const routeValidationViewSchema = z
  .object({
    executionEligibility: executionEligibilitySchema,
    surfaceTruth: routeTruthLabelSchema,
    routeTruthLabels: z.array(routeTruthLabelViewSchema),
    proofNotes: z.array(nonEmptyStringSchema),
    validationBadges: z.array(nonEmptyStringSchema),
  })
  .nullable();
const permissionsViewSchema = z.object({
  allowPause: z.boolean(),
  allowTurnOff: z.boolean(),
});
const manifestViewSchema = z.object({
  manifestId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  mode: strategyModeSchema,
  chain: chainSchema,
  strategyVersion: nonEmptyStringSchema,
  promoted: z.literal(true),
  source: manifestSourceViewSchema,
  frontend: manifestFrontendViewSchema,
  explanation: manifestExplanationViewSchema,
  explanationBundle: promotedBasketExplanationBundleSchema.nullable(),
  tuningSummary: promotedBasketTuningSummarySchema.nullable(),
  validation: manifestValidationViewSchema,
  fallback: manifestFallbackViewSchema,
  activationTemplate: manifestActivationTemplateViewSchema,
  requiredAssets: z.array(nonEmptyStringSchema),
  requiredRoutes: z.array(requiredRouteViewSchema),
  walletRequirements: walletRequirementsViewSchema,
  signalRefs: z.array(signalRefSchema),
  targetAllocations: z.array(portfolioTargetAllocationSchema),
  targetDirectionalExpression: directionalExpressionSchema.nullable(),
  routeValidation: routeValidationViewSchema,
  permissions: permissionsViewSchema,
  legacyFallback: z.boolean(),
});
const executionPlanPreviewSchema = z.object({
  surfaceTruth: routeTruthLabelSchema,
  executionState: executionStateSchema,
  executionEligibility: executionEligibilitySchema,
  routeTruthLabels: z.array(routeTruthLabelViewSchema),
  blockers: z.array(nonEmptyStringSchema),
  warnings: z.array(nonEmptyStringSchema),
});
const catalogItemSchema = z.object({
  slot: strategySlotSchema,
  manifest: manifestViewSchema,
  defaultRequestedNotionalUsd: z.number().finite().nonnegative(),
  targetSummary: z.object({
    fundingAssetSymbol: nonEmptyStringSchema,
    allocationCount: z.number().int().nonnegative(),
    requiredAssetCount: z.number().int().nonnegative(),
    leadAssets: z.array(nonEmptyStringSchema),
  }),
  executionPreview: executionPlanPreviewSchema,
});
const recommendationViewSchema = z.union([
  basketRecommendationSchema,
  directionalRecommendationSchema,
]);
const liveAssetDeploymentSchema = z.object({
  supportsAtomicSwaps: z.boolean(),
  address: z.union([nonEmptyStringSchema, z.null()]),
  wrapperAddress: z.union([nonEmptyStringSchema, z.null()]),
});
const liveAssetSchema = z.object({
  assetSymbol: nonEmptyStringSchema,
  source: nonEmptyStringSchema.optional(),
  chain: chainSchema,
  status: nonEmptyStringSchema,
  priceUsd: z.number().finite().nullable(),
  proofOfReserves: nonEmptyStringSchema.nullable().optional(),
  notes: z.array(nonEmptyStringSchema).optional(),
  deployments: z.record(z.string(), liveAssetDeploymentSchema),
});
const liveRouteSchema = z.object({
  routeId: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  routeKind: nonEmptyStringSchema,
  chain: z.string().trim().min(1),
  verificationTier: routeVerificationTierSchema,
  availability: routeAvailabilitySchema,
  notes: nonEmptyStringSchema,
});
const liveStateViewSchema = z.object({
  liveXStocksState: z.object({
    stateVersion: nonEmptyStringSchema,
    asOf: timestampSchema,
    assets: z.array(liveAssetSchema),
  }),
  liveRouteState: z.object({
    stateVersion: nonEmptyStringSchema,
    asOf: timestampSchema,
    routes: z.array(liveRouteSchema),
  }),
});
const targetAllocationPreviewSchema = z.object({
  allocationId: nonEmptyStringSchema,
  sleeve: nonEmptyStringSchema,
  assetSymbol: nonEmptyStringSchema.optional(),
  basketId: nonEmptyStringSchema.optional(),
  venueId: nonEmptyStringSchema.optional(),
  targetWeightPct: z.number().finite().nonnegative(),
  targetNotionalUsd: z.number().finite().nonnegative(),
  liveAsset: z
    .object({
      status: nonEmptyStringSchema,
      priceUsd: z.number().finite().nullable(),
      proofOfReserves: nonEmptyStringSchema.nullable(),
    })
    .nullable(),
});
const activitySummaryNextActionSchema = z
  .object({
    title: nonEmptyStringSchema,
    detail: nonEmptyStringSchema,
    status: nonEmptyStringSchema,
  })
  .nullable();
const activitySummarySchema = z.object({
  activationCount: z.number().int().nonnegative(),
  eventCount: z.number().int().nonnegative(),
  latestActivationId: nonEmptyStringSchema.nullable(),
  latestActivationStatus: executionStateSchema.nullable(),
  latestEventId: nonEmptyStringSchema.nullable(),
  latestEventType: nonEmptyStringSchema.nullable(),
  latestEventAt: timestampSchema.nullable(),
  nextAction: activitySummaryNextActionSchema,
});
const rebalanceTransitionSchema = z.object({
  transitionId: nonEmptyStringSchema,
  eventType: nonEmptyStringSchema,
  fromState: rebalanceStateSchema.nullable(),
  toState: rebalanceStateSchema,
  triggerSource: rebalanceTriggerSourceSchema,
  summary: nonEmptyStringSchema,
  rationale: nonEmptyStringSchema,
  scheduledFor: timestampSchema.nullable(),
  occurredAt: timestampSchema,
});
const rebalanceAutomationTruthSchema = z.object({
  operatorManualRequired: z.boolean(),
  autonomousExecutionProven: z.boolean(),
  providerTriggeredProven: z.boolean(),
  supportedTriggerSources: z.array(rebalanceTriggerSourceSchema),
  notes: z.array(nonEmptyStringSchema),
});
const rebalanceOrchestrationSchema = z.object({
  rebalanceId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  chain: chainSchema,
  activationManifestRef: activationManifestRefSchema,
  targetManifestId: nonEmptyStringSchema,
  baselineActivationId: nonEmptyStringSchema.nullable(),
  baselineManifestId: nonEmptyStringSchema.nullable(),
  baselineManifestMatchesTarget: z.boolean(),
  state: rebalanceStateSchema,
  runtimeOwner: rebalanceRuntimeOwnerSchema,
  triggerSource: rebalanceTriggerSourceSchema,
  summary: nonEmptyStringSchema,
  rationale: nonEmptyStringSchema,
  scheduledFor: timestampSchema.nullable(),
  allowedTransitions: z.array(rebalanceStateSchema),
  recommendationState: nonEmptyStringSchema,
  executionState: executionStateSchema,
  executionEligibility: executionEligibilitySchema,
  surfaceTruth: routeTruthLabelSchema,
  blockers: z.array(nonEmptyStringSchema),
  warnings: z.array(nonEmptyStringSchema),
  automationTruth: rebalanceAutomationTruthSchema,
  nextAction: activitySummaryNextActionSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
const workspacePayloadSchema = z.object({
  requestedNotionalUsd: z.number().finite().nonnegative(),
  fundingAssetSymbol: nonEmptyStringSchema,
  targetAllocations: z.array(targetAllocationPreviewSchema),
  targetDirectionalExpression: directionalExpressionSchema.nullable(),
  cashOrYieldBufferTarget: z
    .object({
      assetSymbol: nonEmptyStringSchema,
      venueId: nonEmptyStringSchema.optional(),
      targetWeightPct: z.number().finite().nonnegative(),
    })
    .nullable(),
  recommendation: recommendationViewSchema,
  executionPlanPreview: executionPlanPreviewSchema,
  liveState: liveStateViewSchema,
  rebalanceOrchestration: rebalanceOrchestrationSchema,
  activitySummary: activitySummarySchema,
});
const executionAssetCheckSchema = z.object({
  assetSymbol: nonEmptyStringSchema,
  truthState: routeTruthLabelSchema,
  status: nonEmptyStringSchema,
  reason: nonEmptyStringSchema,
  chain: chainSchema.optional(),
  priceUsd: z.number().finite().nullable().optional(),
});
const fundingPathSchema = z.object({
  provider: nonEmptyStringSchema,
  minRequiredUsd: z.number().finite().nonnegative(),
  fundedNotionalUsd: z.number().finite().nonnegative(),
  fundingGapUsd: z.number().finite().nonnegative(),
  topUpAsset: nonEmptyStringSchema,
  destinationAddress: nonEmptyStringSchema.nullable(),
  destinationKind: nonEmptyStringSchema,
  readiness: nonEmptyStringSchema,
  recommendedMethodId: nonEmptyStringSchema.nullable(),
  surfaces: z.array(
    z.object({
      methodId: nonEmptyStringSchema,
      providerId: nonEmptyStringSchema,
      kind: nonEmptyStringSchema,
      status: nonEmptyStringSchema,
      destinationAddress: nonEmptyStringSchema.nullable(),
      assetSymbol: nonEmptyStringSchema,
      notes: z.array(nonEmptyStringSchema),
    }),
  ),
  status: nonEmptyStringSchema,
});
const smartAccountReviewArtifactSchema = z.object({
  providerId: nonEmptyStringSchema,
  providerName: nonEmptyStringSchema,
  supportedChains: z.array(chainSchema),
  permissions: z.array(nonEmptyStringSchema),
  approvalMode: nonEmptyStringSchema,
  bootstrapBoundary: nonEmptyStringSchema,
  fundingBoundary: nonEmptyStringSchema,
  walletConnectionLate: z.boolean(),
  notes: z.array(nonEmptyStringSchema),
});
const smartAccountInspectionSchema = z.object({
  readiness: smartAccountReadinessSchema,
  providerId: nonEmptyStringSchema,
  status: nonEmptyStringSchema,
  address: nonEmptyStringSchema.nullable(),
  bootstrap: z.object({
    state: nonEmptyStringSchema,
    chain: chainSchema,
    implementation: nonEmptyStringSchema,
    signerAddress: nonEmptyStringSchema.nullable(),
    embeddedWalletAddress: nonEmptyStringSchema.nullable(),
    smartAccountAddress: nonEmptyStringSchema.nullable(),
    destinationAddress: nonEmptyStringSchema.nullable(),
    approvalMode: nonEmptyStringSchema,
    paymasterReady: z.boolean(),
    notes: z.array(nonEmptyStringSchema),
  }),
  reviewArtifact: smartAccountReviewArtifactSchema,
});
const executionPlanStepSchema = z.object({
  stepId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  status: nonEmptyStringSchema,
  detail: nonEmptyStringSchema,
});
const executionPlanSchema = z.object({
  executionPlanId: nonEmptyStringSchema,
  generatedAt: timestampSchema,
  activationManifestRef: activationManifestRefSchema,
  surfaceTruth: routeTruthLabelSchema,
  executionState: executionStateSchema,
  executionEligibility: executionEligibilitySchema,
  requestedNotionalUsd: z.number().finite().nonnegative(),
  walletConnectionLate: z.boolean(),
  routeTruthLabels: z.array(routeTruthLabelViewSchema),
  assetChecks: z.array(executionAssetCheckSchema),
  fundingPath: fundingPathSchema,
  smartAccount: smartAccountInspectionSchema,
  steps: z.array(executionPlanStepSchema),
  allowedActions: z.array(nonEmptyStringSchema),
  blockers: z.array(nonEmptyStringSchema),
  warnings: z.array(nonEmptyStringSchema),
  liveStateSummary: z.object({
    xstocksStateVersion: z.union([nonEmptyStringSchema, z.null()]),
    routeStateVersion: z.union([nonEmptyStringSchema, z.null()]),
  }),
});
const walletStateViewSchema = z.object({
  walletConnected: z.boolean(),
  walletAddress: nonEmptyStringSchema.nullable(),
  fundedNotionalUsd: z.number().finite().nonnegative(),
  fundingSource: nonEmptyStringSchema.nullable().optional(),
  embeddedWallet: z.object({
    providerId: nonEmptyStringSchema,
    status: nonEmptyStringSchema,
    address: nonEmptyStringSchema.nullable(),
  }),
  smartAccount: z.object({
    providerId: nonEmptyStringSchema.optional(),
    status: nonEmptyStringSchema,
    address: nonEmptyStringSchema.nullable(),
    implementation: nonEmptyStringSchema.optional(),
    chain: chainSchema.optional(),
  }),
});
const activationViewSchema = z.object({
  activationId: nonEmptyStringSchema,
  owner: authenticatedOwnerSchema.nullable(),
  chain: chainSchema,
  manifestId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  recommendationId: nonEmptyStringSchema,
  activationManifestRef: activationManifestRefSchema,
  requestedNotionalUsd: z.number().finite().nonnegative(),
  surfaceTruth: routeTruthLabelSchema,
  status: executionStateSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  walletState: walletStateViewSchema,
  routeTruthLabels: z.array(routeTruthLabelViewSchema),
  executionPlanSnapshot: executionPlanSchema,
});
const activitySurfaceSchema = z
  .object({
    source: z.enum(["activation_snapshot", "manifest_preview"]),
    currentState: z.object({
      surfaceTruth: routeTruthLabelSchema.nullable(),
      executionState: executionStateSchema.nullable(),
      pauseAvailable: z.boolean(),
      turnOffAvailable: z.boolean(),
    }),
    positions: z.array(
      z.object({
        positionId: nonEmptyStringSchema,
        assetSymbol: nonEmptyStringSchema,
        sleeve: nonEmptyStringSchema,
        targetWeightPct: z.number().finite().nonnegative(),
        targetNotionalUsd: z.number().finite().nonnegative(),
        venueId: nonEmptyStringSchema.nullable(),
        priceUsd: z.number().finite().nullable(),
        status: nonEmptyStringSchema,
        updatedAt: timestampSchema,
      }),
    ),
    history: z.array(
      z.object({
        id: nonEmptyStringSchema,
        occurredAt: timestampSchema,
        type: nonEmptyStringSchema,
        summary: nonEmptyStringSchema,
        status: nonEmptyStringSchema,
      }),
    ),
    lifecycle: z.array(
      z.object({
        id: nonEmptyStringSchema,
        occurredAt: timestampSchema,
        title: nonEmptyStringSchema,
        detail: nonEmptyStringSchema,
        state: nonEmptyStringSchema,
        nextAction: nonEmptyStringSchema.nullable(),
      }),
    ),
    nextAction: activitySummaryNextActionSchema,
  })
  .nullable();

export const API_ENDPOINTS = Object.freeze({
  HEALTH: "/health",
  RECOMMENDATIONS: "/api/recommendations",
  QUALIFY: "/api/qualify",
  CATALOG: "/api/catalog",
  WORKSPACE: "/api/workspace",
  ACTIVATION_PREVIEW: "/api/activation-preview",
  MANIFEST_PREFLIGHT: "/api/manifests/preflight",
  ACTIVATIONS: "/api/activations",
  ACTIVITY: "/api/activity",
  EXECUTIONS: "/api/executions",
  XSTOCKS_FUNNEL_EVENTS: "/api/funnel-events/xstocks",
  XSTOCKS_REPORTING: "/api/reporting/xstocks",
});

export const API_ENDPOINT_CONTRACTS = Object.freeze({
  recommendation_fetch: {
    method: "GET",
    path: API_ENDPOINTS.RECOMMENDATIONS,
    query: ["manifestId? | slotId?", "userNotionalUsd?", "wallet*?"],
    response: "recommendation_fetch_v1",
  },
  qualification_read: {
    method: "POST",
    path: API_ENDPOINTS.QUALIFY,
    body: ["answers", "userNotionalUsd?", "walletState?"],
    response: "qualification_read_v1",
  },
  catalog_read: {
    method: "GET",
    path: API_ENDPOINTS.CATALOG,
    query: ["surface?", "mode?"],
    response: "catalog_read_v1",
  },
  workspace_read: {
    method: "GET",
    path: API_ENDPOINTS.WORKSPACE,
    query: ["manifestId? | slotId?", "userNotionalUsd?", "wallet*?"],
    response: "workspace_read_v1",
  },
  activation_preview_read: {
    method: "GET",
    path: API_ENDPOINTS.ACTIVATION_PREVIEW,
    query: ["manifestId? | slotId?", "userNotionalUsd?", "wallet*?"],
    response: "activation_preview_read_v1",
  },
  manifest_preflight: {
    method: "POST",
    path: API_ENDPOINTS.MANIFEST_PREFLIGHT,
    body: ["manifestId? | slotId?", "userNotionalUsd", "walletState?"],
    response: "manifest_preflight_v1",
  },
  activation_save: {
    method: "POST",
    path: API_ENDPOINTS.ACTIVATIONS,
    body: ["manifestId? | slotId?", "userNotionalUsd", "walletState?"],
    response: "activation_save_v1",
  },
  activity_read: {
    method: "GET",
    path: API_ENDPOINTS.ACTIVITY,
    query: ["activationId?", "manifestId?", "slotId?", "limit?"],
    response: "activity_read_v1",
  },
  execution_write: {
    method: "POST",
    path: API_ENDPOINTS.EXECUTIONS,
    body: [
      "action",
      "activationId?",
      "executionRequestId?",
      "legId?",
      "signature?",
      "txHash?",
    ],
    response: "execution_write_v1",
  },
  execution_read: {
    method: "GET",
    path: API_ENDPOINTS.EXECUTIONS,
    query: [
      "executionRequestId?",
      "activationId?",
      "manifestId?",
      "slotId?",
      "limit?",
    ],
    response: "execution_read_v1",
  },
  xstocks_funnel_event_ingest: {
    method: "POST",
    path: API_ENDPOINTS.XSTOCKS_FUNNEL_EVENTS,
    body: ["stage", "subjectId?", "manifestId? | slotId?"],
    response: "xstocks_funnel_event_ingest_v1",
  },
  xstocks_reporting_read: {
    method: "GET",
    path: API_ENDPOINTS.XSTOCKS_REPORTING,
    query: ["limit?"],
    response: "xstocks_reporting_read_v1",
  },
});

export const API_RESPONSE_SCHEMAS = Object.freeze({
  recommendation_fetch: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    manifestRef: activationManifestRefSchema,
    manifest: manifestViewSchema,
    recommendation: recommendationViewSchema,
    executionPlanPreview: executionPlanPreviewSchema,
  }),
  qualification_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    qualification: agentQualificationSchema,
  }),
  catalog_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    defaultSlotId: strategySlotIdSchema,
    items: z.array(catalogItemSchema),
  }),
  workspace_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    slot: strategySlotSchema,
    manifest: manifestViewSchema,
    workspace: workspacePayloadSchema,
  }),
  activation_preview_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    slot: strategySlotSchema,
    manifest: manifestViewSchema,
    requestedNotionalUsd: z.number().finite().nonnegative(),
    recommendation: recommendationViewSchema,
    executionPlan: executionPlanSchema,
    liveState: liveStateViewSchema,
    rebalanceOrchestration: rebalanceOrchestrationSchema,
    latestActivation: activationViewSchema.nullable(),
  }),
  activity_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    limit: z.number().int().positive(),
    manifest: manifestViewSchema.nullable(),
    slot: strategySlotSchema.nullable(),
    items: z.array(activityEventSchema),
    activations: z.array(activationViewSchema),
    rebalanceOrchestration: rebalanceOrchestrationSchema.nullable(),
    rebalanceHistory: z.array(rebalanceTransitionSchema),
    activitySurface: activitySurfaceSchema,
  }),
  execution_write: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    action: z.enum([
      "create",
      "quote_leg",
      "record_submission",
      "poll_receipt",
    ]),
    executionRequest: executionRequestSchema,
    activityEvents: z.array(activityEventSchema),
  }),
  execution_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    limit: z.number().int().positive(),
    items: z.array(executionRequestSchema),
  }),
  xstocks_funnel_event_ingest: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    request: xstocksFunnelEventIngestRequestSchema,
    subjectId: nonEmptyStringSchema,
    createdSubject: z.boolean(),
    events: z.array(xstocksFunnelEventSchema).min(1),
  }),
  xstocks_reporting_read: z.object({
    version: apiContractVersionSchema,
    generatedAt: timestampSchema,
    ...xstocksReportingSnapshotSchema.shape,
  }),
});

export function parseApiResponse(contractName, payload) {
  const schema = API_RESPONSE_SCHEMAS[contractName];

  if (!schema) {
    throw new Error(`Unknown API response contract ${contractName}.`);
  }

  return schema.parse(payload);
}
