import { z } from "zod";

import { authenticatedOwnerSchema } from "./auth.js";
import {
  chainSchema,
  contractVersionSchema,
  jsonRecordSchema,
  canonicalActivationManifestRefSchema,
  manifestBadgeSchema,
  nonEmptyStringSchema,
  railTruthStateSchema,
  routeAvailabilitySchema,
  routeChainSchema,
  routeKindSchema,
  routeRequirementSchema,
  routeTruthLabelRowSchema,
  routeTruthLabelSchema,
  routeVerificationTierSchema,
  stringArraySchema,
  strategyModeSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";
import {
  canonicalPromotedBasketExplanationBundleSchema,
  canonicalPromotedBasketTuningSummarySchema,
  directionalExpressionSchema,
  portfolioTargetAllocationSchema,
  targetAllocationSchema,
  targetDirectionalExpressionSchema,
} from "./portfolio.js";

export const legacyActivationManifestFrontendSchema = z.object({
  title: nonEmptyStringSchema,
  subtitle: nonEmptyStringSchema,
  riskLabel: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  badges: stringArraySchema,
});
export type LegacyActivationManifestFrontend = z.infer<
  typeof legacyActivationManifestFrontendSchema
>;

export const promotedActivationManifestFrontendSchema = z.object({
  title: nonEmptyStringSchema,
  subtitle: nonEmptyStringSchema,
  risk_label: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  badges: z.array(manifestBadgeSchema),
});
export type PromotedActivationManifestFrontend = z.infer<
  typeof promotedActivationManifestFrontendSchema
>;

export const activationManifestFrontendSchema = z.union([
  legacyActivationManifestFrontendSchema,
  promotedActivationManifestFrontendSchema,
]);
export type ActivationManifestFrontend = z.infer<
  typeof activationManifestFrontendSchema
>;

export const legacyActivationManifestValidationSchema = z.object({
  datasetVersion: nonEmptyStringSchema,
  evaluatorVersion: nonEmptyStringSchema,
  objectiveId: nonEmptyStringSchema,
  score: z.number().finite(),
  deltaVsIncumbent: z.number().finite().nullable(),
  promotedAt: timestampSchema,
});
export type LegacyActivationManifestValidation = z.infer<
  typeof legacyActivationManifestValidationSchema
>;

export const promotedActivationManifestValidationSchema = z.object({
  dataset_version: nonEmptyStringSchema,
  evaluator_version: nonEmptyStringSchema,
  objective_id: nonEmptyStringSchema,
  score: z.number().finite(),
  delta_vs_incumbent: z.number().finite().nullable(),
  promoted_at: timestampSchema,
});
export type PromotedActivationManifestValidation = z.infer<
  typeof promotedActivationManifestValidationSchema
>;

export const activationManifestValidationSchema = z.union([
  legacyActivationManifestValidationSchema,
  promotedActivationManifestValidationSchema,
]);
export type ActivationManifestValidation = z.infer<
  typeof activationManifestValidationSchema
>;

export const basketActivationTemplateSchema = z.object({
  mode: z.literal("basket"),
  templateId: nonEmptyStringSchema,
  fundingAssetSymbol: nonEmptyStringSchema,
  starterBasketId: nonEmptyStringSchema,
  targetAllocations: z.array(portfolioTargetAllocationSchema).min(1),
});
export type BasketActivationTemplate = z.infer<
  typeof basketActivationTemplateSchema
>;

export const directionalActivationTemplateSchema = z.object({
  mode: z.literal("directional"),
  templateId: nonEmptyStringSchema,
  fundingAssetSymbol: nonEmptyStringSchema,
  assetSymbol: nonEmptyStringSchema,
  targetDirectionalExpression: directionalExpressionSchema,
});
export type DirectionalActivationTemplate = z.infer<
  typeof directionalActivationTemplateSchema
>;

const legacyActivationTemplateSchema = z.discriminatedUnion("mode", [
  basketActivationTemplateSchema,
  directionalActivationTemplateSchema,
]);

export const promotedActivationTemplateWalletRequirementsSchema = z.object({
  requires_wallet: z.boolean(),
  requires_smart_account: z.boolean(),
  min_funding_usd: z.number().finite().nonnegative(),
  preferred_funding_provider: nonEmptyStringSchema.optional(),
  preferred_bridge_provider: nonEmptyStringSchema.optional(),
  top_up_asset: nonEmptyStringSchema.optional(),
});
export type PromotedActivationTemplateWalletRequirements = z.infer<
  typeof promotedActivationTemplateWalletRequirementsSchema
>;

export const promotedActivationTemplatePermissionsSchema = z.object({
  allow_pause: z.boolean(),
  allow_turn_off: z.boolean(),
});
export type PromotedActivationTemplatePermissions = z.infer<
  typeof promotedActivationTemplatePermissionsSchema
>;

export const promotedActivationTemplateSchema = z.object({
  template_id: nonEmptyStringSchema,
  preview_available: z.boolean(),
  required_assets: z.array(nonEmptyStringSchema).min(1),
  required_routes: z.array(routeRequirementSchema).min(1),
  target_allocations: z.array(targetAllocationSchema),
  target_directional_expressions: z.array(targetDirectionalExpressionSchema),
  wallet_requirements: promotedActivationTemplateWalletRequirementsSchema,
  permissions: promotedActivationTemplatePermissionsSchema,
});
export type PromotedActivationTemplate = z.infer<
  typeof promotedActivationTemplateSchema
>;

export const activationTemplateSchema = z.union([
  legacyActivationTemplateSchema,
  promotedActivationTemplateSchema,
]);
export type ActivationTemplate = z.infer<typeof activationTemplateSchema>;

const legacyActivationManifestSchema = z
  .object({
    version: contractVersionSchema,
    manifestId: nonEmptyStringSchema,
    slotId: strategySlotIdSchema,
    mode: strategyModeSchema,
    chain: chainSchema,
    strategyVersion: nonEmptyStringSchema,
    frontend: legacyActivationManifestFrontendSchema,
    validation: legacyActivationManifestValidationSchema,
    activationTemplate: legacyActivationTemplateSchema,
    fallback: z.object({
      previousIncumbentId: nonEmptyStringSchema.nullable(),
      disableConditions: stringArraySchema,
    }),
  })
  .refine(
    (manifest) => manifest.mode === manifest.activationTemplate.mode,
    {
      message: "activationTemplate.mode must match manifest mode",
      path: ["activationTemplate", "mode"],
    },
  );

export const promotedActivationManifestSchema = z.object({
  manifest_id: nonEmptyStringSchema,
  slot_id: strategySlotIdSchema,
  mode: strategyModeSchema,
  chain: chainSchema,
  strategy_version: nonEmptyStringSchema,
  promoted: z.literal(true),
  frontend: promotedActivationManifestFrontendSchema,
  validation: promotedActivationManifestValidationSchema,
  signal_refs: z.array(nonEmptyStringSchema).optional(),
  activation_template: promotedActivationTemplateSchema,
  explanation_bundle: canonicalPromotedBasketExplanationBundleSchema.optional(),
  tuning_summary: canonicalPromotedBasketTuningSummarySchema.optional(),
  fallback: z.object({
    previous_incumbent_id: nonEmptyStringSchema.nullable(),
    disable_conditions: stringArraySchema,
  }),
}).superRefine((manifest, ctx) => {
  const hasBasketExplanationSurface =
    manifest.explanation_bundle !== undefined ||
    manifest.tuning_summary !== undefined;

  if (manifest.mode !== "basket" && hasBasketExplanationSurface) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["explanation_bundle"],
      message:
        "Promoted basket explanation and tuning fields are only allowed on basket manifests.",
    });
  }

  if (
    manifest.mode === "basket" &&
    (manifest.explanation_bundle === undefined) !==
      (manifest.tuning_summary === undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path:
        manifest.explanation_bundle === undefined
          ? ["explanation_bundle"]
          : ["tuning_summary"],
      message:
        "Basket explanation_bundle and tuning_summary must be omitted together or provided together.",
    });
  }
});
export type PromotedActivationManifest = z.infer<
  typeof promotedActivationManifestSchema
>;

export const activationManifestSchema = z.union([
  legacyActivationManifestSchema,
  promotedActivationManifestSchema,
]);
export type ActivationManifest = z.infer<typeof activationManifestSchema>;

export const liveRouteStateRouteSchema = z.object({
  route_id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  route_kind: routeKindSchema,
  chain: routeChainSchema,
  verification_tier: routeVerificationTierSchema,
  availability: routeAvailabilitySchema,
  notes: nonEmptyStringSchema,
});
export type LiveRouteStateRoute = z.infer<typeof liveRouteStateRouteSchema>;

export const routeTruthStateSchema = z.object({
  state_version: nonEmptyStringSchema,
  as_of: timestampSchema,
  routes: z.array(liveRouteStateRouteSchema).min(1),
});
export type RouteTruthState = z.infer<typeof routeTruthStateSchema>;

export const walletStateSchema = z.object({
  wallet_connected: z.boolean(),
  wallet_address: nonEmptyStringSchema.nullable(),
  funded_notional_usd: z.number().finite().nonnegative(),
  funding_source: nonEmptyStringSchema.nullable(),
  embedded_wallet: z
    .object({
      provider_id: nonEmptyStringSchema,
      status: nonEmptyStringSchema,
      address: nonEmptyStringSchema.nullable(),
    })
    .optional(),
  smart_account: z.object({
    provider_id: nonEmptyStringSchema,
    status: nonEmptyStringSchema,
    address: nonEmptyStringSchema.nullable(),
    implementation: nonEmptyStringSchema.optional(),
    chain: chainSchema.optional(),
  }),
});
export type WalletState = z.infer<typeof walletStateSchema>;

export const activationSnapshotSchema = z.object({
  activation_id: nonEmptyStringSchema,
  owner: authenticatedOwnerSchema.nullable(),
  manifest_id: nonEmptyStringSchema,
  slot_id: strategySlotIdSchema,
  recommendation_id: nonEmptyStringSchema.optional(),
  directional_preview_id: nonEmptyStringSchema.optional(),
  activation_manifest_ref: canonicalActivationManifestRefSchema,
  requested_notional_usd: z.number().finite().nonnegative(),
  surface_truth: routeTruthLabelSchema,
  status: nonEmptyStringSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
  wallet_state: walletStateSchema,
  route_truth_labels: z.array(routeTruthLabelRowSchema),
  execution_plan_snapshot: jsonRecordSchema,
});
export type ActivationSnapshot = z.infer<typeof activationSnapshotSchema>;

export const activationPermissionSchema = z.object({
  canPause: z.boolean(),
  canTurnOff: z.boolean(),
  maxSlippageBps: z.number().int().nonnegative(),
  maxLeverage: z.number().finite().positive().nullable().optional(),
});
export type ActivationPermission = z.infer<typeof activationPermissionSchema>;

export const activationActionKindSchema = z.enum([
  "approve",
  "swap",
  "supply",
  "borrow",
  "repay",
  "rebalance",
]);
export type ActivationActionKind = z.infer<typeof activationActionKindSchema>;

export const activationActionSchema = z.object({
  actionId: nonEmptyStringSchema,
  kind: activationActionKindSchema,
  venueId: nonEmptyStringSchema,
  assetSymbol: nonEmptyStringSchema.optional(),
  amountUsd: z.number().finite().positive().optional(),
  summary: nonEmptyStringSchema,
});
export type ActivationAction = z.infer<typeof activationActionSchema>;

export const activationPayloadSourceSchema = z
  .object({
    recommendationId: nonEmptyStringSchema.optional(),
    directionalPreviewId: nonEmptyStringSchema.optional(),
  })
  .refine(
    (source) =>
      source.recommendationId !== undefined ||
      source.directionalPreviewId !== undefined,
    {
      message: "activation payloads must reference a recommendation or preview",
    },
  );
export type ActivationPayloadSource = z.infer<
  typeof activationPayloadSourceSchema
>;

export const activationPayloadSchema = z.object({
  version: contractVersionSchema,
  payloadId: nonEmptyStringSchema,
  manifestId: nonEmptyStringSchema,
  chain: chainSchema,
  mode: strategyModeSchema,
  ownerAddress: nonEmptyStringSchema.optional(),
  smartAccountAddress: nonEmptyStringSchema.optional(),
  fundingAssetSymbol: nonEmptyStringSchema,
  fundingAmountUsd: z.number().finite().positive(),
  source: activationPayloadSourceSchema,
  routeContext: z.object({
    truthState: railTruthStateSchema,
    venueId: nonEmptyStringSchema,
    routeId: nonEmptyStringSchema.optional(),
    quoteExpiresAt: timestampSchema.optional(),
  }),
  permissions: activationPermissionSchema,
  actions: z.array(activationActionSchema).min(1),
});
export type ActivationPayload = z.infer<typeof activationPayloadSchema>;
