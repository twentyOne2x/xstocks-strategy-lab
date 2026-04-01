import { z } from "zod";

import {
  basketActivationTemplateSchema,
  directionalActivationTemplateSchema,
  legacyActivationManifestFrontendSchema,
  legacyActivationManifestValidationSchema,
} from "./activation.js";
import {
  canonicalActivationManifestRefSchema,
  chainSchema,
  contractVersionSchema,
  finiteNumberOrBlankSchema,
  legacyActivationManifestRefSchema,
  nonEmptyStringOrBlankSchema,
  nonEmptyStringSchema,
  percentageSchema,
  routeTruthLabelSchema,
  scoreSchema,
  strategyModeSchema,
  strategySlotIdSchema,
  stringArraySchema,
  timestampSchema,
} from "./common.js";
import {
  directionalExpressionSchema,
  portfolioTargetAllocationSchema,
  strategySlotSchema,
} from "./portfolio.js";

function addIssue(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  message: string,
): void {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export function buildPromotedManifestId(
  slotId: z.infer<typeof strategySlotIdSchema>,
  strategyVersion: string,
): string {
  return `${slotId}:${strategyVersion}:promoted`;
}

export const RESEARCH_EVALUATION_STAGE_VALUES = [
  "baseline",
  "promotion",
  "invalid",
] as const;
export const researchEvaluationStageSchema = z.enum(
  RESEARCH_EVALUATION_STAGE_VALUES,
);
export type ResearchEvaluationStage = z.infer<
  typeof researchEvaluationStageSchema
>;

export const RESEARCH_RESULT_STATUS_VALUES = [
  "keep",
  "discard",
  "invalid",
] as const;
export const researchResultStatusSchema = z.enum(RESEARCH_RESULT_STATUS_VALUES);
export type ResearchResultStatus = z.infer<typeof researchResultStatusSchema>;

export const researchChainIdSchema = z.literal("1");
export type ResearchChainId = z.infer<typeof researchChainIdSchema>;

export const researchResultRowSchema = z.object({
  run_id: nonEmptyStringSchema,
  completed_at_utc: timestampSchema,
  stage: researchEvaluationStageSchema,
  mode: strategyModeSchema,
  slot_id: strategySlotIdSchema,
  objective_id: nonEmptyStringSchema,
  status: researchResultStatusSchema,
  candidate_ref: nonEmptyStringSchema,
  incumbent_run_id: nonEmptyStringOrBlankSchema,
  manual_version: nonEmptyStringSchema,
  evaluator_version: nonEmptyStringSchema,
  research_dataset_id: nonEmptyStringSchema,
  validation_set_id: nonEmptyStringSchema,
  universe_id: nonEmptyStringSchema,
  chain_id: researchChainIdSchema,
  live_truth_source_id: nonEmptyStringSchema,
  primary_score: scoreSchema,
  incumbent_score: scoreSchema,
  delta_score: scoreSchema,
  guardrail_pass: z.boolean(),
  return_ann_pct: z.number().finite(),
  max_drawdown_pct: z.number().finite(),
  turnover_ann_pct: z.number().finite(),
  costs_total_bps: z.number().finite(),
  description: nonEmptyStringSchema,
  benchmark_id: nonEmptyStringSchema,
  constituent_count_avg: z.number().finite().nonnegative(),
  weight_max_pct: percentageSchema,
  gross_exposure_avg_pct: finiteNumberOrBlankSchema,
  net_exposure_avg_pct: finiteNumberOrBlankSchema,
  leverage_avg: finiteNumberOrBlankSchema,
  borrow_cost_bps: finiteNumberOrBlankSchema,
  euler_market_set_id: nonEmptyStringOrBlankSchema,
  euler_health_min: finiteNumberOrBlankSchema,
});
export type ResearchResultRow = z.infer<typeof researchResultRowSchema>;

export const slotRegistryEntrySchema = z.object({
  mode: strategyModeSchema,
  current_manifest_id: nonEmptyStringSchema,
  current_manifest_path: nonEmptyStringSchema,
  versioned_manifest_path: nonEmptyStringSchema,
  strategy_version: nonEmptyStringSchema,
  promoted_at: timestampSchema,
});
export type SlotRegistryEntry = z.infer<typeof slotRegistryEntrySchema>;

export const canonicalSlotRegistryEntrySchema = slotRegistryEntrySchema;
export type CanonicalSlotRegistryEntry = z.infer<
  typeof canonicalSlotRegistryEntrySchema
>;

export const slotRegistrySchema = z
  .object({
    registry_version: z.literal("strategy_lab_slot_registry_v1"),
    authority: z.literal("promoted_manifests_only"),
    generated_at_utc: timestampSchema,
    promoted_manifest_root: nonEmptyStringSchema,
    slots: z.record(nonEmptyStringSchema, slotRegistryEntrySchema),
  })
  .superRefine((registry, ctx) => {
    for (const slotId of Object.keys(registry.slots)) {
      const parsed = strategySlotIdSchema.safeParse(slotId);
      if (!parsed.success) {
        addIssue(
          ctx,
          ["slots", slotId],
          `Unsupported slot registry key: ${slotId}`,
        );
      }
    }
  });
export type SlotRegistry = z.infer<typeof slotRegistrySchema>;

export const canonicalSlotRegistrySchema = slotRegistrySchema;
export type CanonicalSlotRegistry = z.infer<
  typeof canonicalSlotRegistrySchema
>;

export const currentManifestRefArtifactSchema = legacyActivationManifestRefSchema;
export type CurrentManifestRefArtifact = z.infer<
  typeof currentManifestRefArtifactSchema
>;

export const currentManifestRefCompatibleSchema = z.union([
  currentManifestRefArtifactSchema,
  canonicalActivationManifestRefSchema,
]);
export type CurrentManifestRefCompatible = z.infer<
  typeof currentManifestRefCompatibleSchema
>;

export const promotedSlotMetadataArtifactSchema = strategySlotSchema;
export type PromotedSlotMetadataArtifact = z.infer<
  typeof promotedSlotMetadataArtifactSchema
>;

export const promotedSlotRegistryArtifactEntrySchema = z
  .object({
    version: contractVersionSchema,
    slot: promotedSlotMetadataArtifactSchema,
    mode: strategyModeSchema,
    currentManifestRef: currentManifestRefArtifactSchema,
    currentManifestPath: nonEmptyStringSchema,
    current_manifest_id: nonEmptyStringSchema,
    current_manifest_path: nonEmptyStringSchema,
    versionedManifestPath: nonEmptyStringSchema,
    versioned_manifest_path: nonEmptyStringSchema,
    strategyVersion: nonEmptyStringSchema,
    strategy_version: nonEmptyStringSchema,
    promotedAt: timestampSchema,
    promoted_at: timestampSchema,
  })
  .superRefine((entry, ctx) => {
    if (entry.slot.slotId !== entry.currentManifestRef.slotId) {
      addIssue(
        ctx,
        ["currentManifestRef", "slotId"],
        "currentManifestRef.slotId must match slot.slotId",
      );
    }

    if (entry.slot.mode !== entry.mode) {
      addIssue(ctx, ["mode"], "mode must match slot.mode");
    }

    if (entry.currentManifestRef.mode !== entry.mode) {
      addIssue(
        ctx,
        ["currentManifestRef", "mode"],
        "currentManifestRef.mode must match mode",
      );
    }

    if (entry.currentManifestRef.manifestId !== entry.current_manifest_id) {
      addIssue(
        ctx,
        ["current_manifest_id"],
        "current_manifest_id must match currentManifestRef.manifestId",
      );
    }

    if (entry.currentManifestPath !== entry.current_manifest_path) {
      addIssue(
        ctx,
        ["current_manifest_path"],
        "current_manifest_path must match currentManifestPath",
      );
    }

    if (entry.versionedManifestPath !== entry.versioned_manifest_path) {
      addIssue(
        ctx,
        ["versioned_manifest_path"],
        "versioned_manifest_path must match versionedManifestPath",
      );
    }

    if (entry.currentManifestRef.strategyVersion !== entry.strategyVersion) {
      addIssue(
        ctx,
        ["strategyVersion"],
        "strategyVersion must match currentManifestRef.strategyVersion",
      );
    }

    if (entry.strategyVersion !== entry.strategy_version) {
      addIssue(
        ctx,
        ["strategy_version"],
        "strategy_version must match strategyVersion",
      );
    }

    if (entry.promotedAt !== entry.promoted_at) {
      addIssue(ctx, ["promoted_at"], "promoted_at must match promotedAt");
    }
  });
export type PromotedSlotRegistryArtifactEntry = z.infer<
  typeof promotedSlotRegistryArtifactEntrySchema
>;

export const slotRegistryArtifactEntrySchema =
  promotedSlotRegistryArtifactEntrySchema;
export type SlotRegistryArtifactEntry = z.infer<
  typeof slotRegistryArtifactEntrySchema
>;

export const promotedSlotRegistryArtifactSchema = z
  .object({
    version: contractVersionSchema,
    registryVersion: z.literal("strategy_lab_slot_registry_v1"),
    registry_version: z.literal("strategy_lab_slot_registry_v1"),
    authority: z.literal("promoted_manifests_only"),
    generatedAtUtc: timestampSchema,
    generated_at_utc: timestampSchema,
    promotedManifestRoot: nonEmptyStringSchema,
    promoted_manifest_root: nonEmptyStringSchema,
    slots: z.record(nonEmptyStringSchema, promotedSlotRegistryArtifactEntrySchema),
  })
  .superRefine((registry, ctx) => {
    if (registry.generatedAtUtc !== registry.generated_at_utc) {
      addIssue(
        ctx,
        ["generated_at_utc"],
        "generated_at_utc must match generatedAtUtc",
      );
    }

    if (registry.promotedManifestRoot !== registry.promoted_manifest_root) {
      addIssue(
        ctx,
        ["promoted_manifest_root"],
        "promoted_manifest_root must match promotedManifestRoot",
      );
    }

    for (const [slotId, entry] of Object.entries(registry.slots)) {
      const parsedSlotId = strategySlotIdSchema.safeParse(slotId);
      if (!parsedSlotId.success) {
        addIssue(
          ctx,
          ["slots", slotId],
          `Unsupported slot registry key: ${slotId}`,
        );
        continue;
      }

      if (entry.slot.slotId !== slotId) {
        addIssue(
          ctx,
          ["slots", slotId, "slot", "slotId"],
          "slot.slotId must match the registry key",
        );
      }

      if (entry.currentManifestRef.slotId !== slotId) {
        addIssue(
          ctx,
          ["slots", slotId, "currentManifestRef", "slotId"],
          "currentManifestRef.slotId must match the registry key",
        );
      }
    }
  });
export type PromotedSlotRegistryArtifact = z.infer<
  typeof promotedSlotRegistryArtifactSchema
>;

export const slotRegistryArtifactSchema = promotedSlotRegistryArtifactSchema;
export type SlotRegistryArtifact = z.infer<typeof slotRegistryArtifactSchema>;

export function parsePromotedSlotRegistryArtifact(value: unknown) {
  return promotedSlotRegistryArtifactSchema.parse(value);
}

export const currentManifestRefNormalizationContextSchema = z
  .object({
    chain: chainSchema,
    promoted_at: timestampSchema.optional(),
    promotedAt: timestampSchema.optional(),
  })
  .superRefine((context, ctx) => {
    if (!context.promoted_at && !context.promotedAt) {
      addIssue(
        ctx,
        ["promoted_at"],
        "promoted_at or promotedAt is required to normalize a current manifest ref",
      );
    }

    if (
      context.promoted_at &&
      context.promotedAt &&
      context.promoted_at !== context.promotedAt
    ) {
      addIssue(
        ctx,
        ["promoted_at"],
        "promoted_at must match promotedAt when both are provided",
      );
    }
  });
export type CurrentManifestRefNormalizationContext = z.infer<
  typeof currentManifestRefNormalizationContextSchema
>;

export function normalizeCurrentManifestRefArtifact(
  value: unknown,
  context: unknown,
) {
  const manifestRef = currentManifestRefArtifactSchema.parse(value);
  const parsedContext = currentManifestRefNormalizationContextSchema.parse(context);
  const promotedAt = parsedContext.promoted_at ?? parsedContext.promotedAt;

  return canonicalActivationManifestRefSchema.parse({
    manifest_id: manifestRef.manifestId,
    slot_id: manifestRef.slotId,
    mode: manifestRef.mode,
    chain: parsedContext.chain,
    strategy_version: manifestRef.strategyVersion,
    promoted_at: promotedAt,
  });
}

export function normalizePromotedSlotRegistryArtifactEntry(value: unknown) {
  const entry = promotedSlotRegistryArtifactEntrySchema.parse(value);

  return slotRegistryEntrySchema.parse({
    mode: entry.mode,
    current_manifest_id: entry.current_manifest_id,
    current_manifest_path: entry.current_manifest_path,
    versioned_manifest_path: entry.versioned_manifest_path,
    strategy_version: entry.strategy_version,
    promoted_at: entry.promoted_at,
  });
}

export function normalizePromotedSlotRegistryArtifact(value: unknown) {
  const registry = parsePromotedSlotRegistryArtifact(value);

  return slotRegistrySchema.parse({
    registry_version: registry.registry_version,
    authority: registry.authority,
    generated_at_utc: registry.generated_at_utc,
    promoted_manifest_root: registry.promoted_manifest_root,
    slots: Object.fromEntries(
      Object.entries(registry.slots).map(([slotId, entry]) => [
        slotId,
        normalizePromotedSlotRegistryArtifactEntry(entry),
      ]),
    ),
  });
}

export function normalizePromotedSlotRegistryEntryManifestRef(value: unknown) {
  const entry = promotedSlotRegistryArtifactEntrySchema.parse(value);

  return normalizeCurrentManifestRefArtifact(entry.currentManifestRef, {
    chain: entry.slot.chain,
    promoted_at: entry.promoted_at,
  });
}

export const PROMOTED_INCUMBENT_ARTIFACT_STATUS_VALUES = [
  "promoted",
  "promoted_preview",
] as const;
export const promotedIncumbentArtifactStatusSchema = z.enum(
  PROMOTED_INCUMBENT_ARTIFACT_STATUS_VALUES,
);
export type PromotedIncumbentArtifactStatus = z.infer<
  typeof promotedIncumbentArtifactStatusSchema
>;

const promotedIncumbentArtifactFallbackSchema = z.object({
  previousIncumbentId: nonEmptyStringSchema.nullable(),
  disableConditions: stringArraySchema,
});

const promotedIncumbentArtifactBaseSchema = z.object({
  version: contractVersionSchema,
  incumbentId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  mode: strategyModeSchema,
  chain: chainSchema,
  strategyVersion: nonEmptyStringSchema,
  promotedAt: timestampSchema,
  previousIncumbentId: nonEmptyStringSchema.nullable(),
  runId: nonEmptyStringSchema,
  frontend: legacyActivationManifestFrontendSchema,
  validation: legacyActivationManifestValidationSchema,
  fallback: promotedIncumbentArtifactFallbackSchema,
});

export const basketPromotedIncumbentResearchArtifactSchema = z.object({
  candidateRef: nonEmptyStringSchema,
  basketId: nonEmptyStringSchema,
  starterBasketId: nonEmptyStringSchema,
  benchmarkId: nonEmptyStringSchema,
  targetAllocations: z.array(portfolioTargetAllocationSchema).min(1),
  rebalanceThresholdBps: z.number().int().nonnegative(),
  reasonCodes: stringArraySchema,
});
export type BasketPromotedIncumbentResearchArtifact = z.infer<
  typeof basketPromotedIncumbentResearchArtifactSchema
>;

export const directionalPromotedIncumbentResearchArtifactSchema = z.object({
  candidateRef: nonEmptyStringSchema,
  venueId: nonEmptyStringSchema,
  assetSymbol: nonEmptyStringSchema,
  borrowAssetSymbol: nonEmptyStringSchema,
  truthState: routeTruthLabelSchema,
  healthFactor: z.number().finite().nullable(),
  liquidationDistancePct: z.number().finite().nullable(),
  targetDirectionalExpression: directionalExpressionSchema,
  previewOnly: z.boolean(),
});
export type DirectionalPromotedIncumbentResearchArtifact = z.infer<
  typeof directionalPromotedIncumbentResearchArtifactSchema
>;

export const basketPromotedIncumbentArtifactSchema =
  promotedIncumbentArtifactBaseSchema
    .extend({
      mode: z.literal("basket"),
      status: z.literal("promoted"),
      activationTemplate: basketActivationTemplateSchema,
      research: basketPromotedIncumbentResearchArtifactSchema,
    })
    .superRefine((artifact, ctx) => {
      if (artifact.fallback.previousIncumbentId !== artifact.previousIncumbentId) {
        addIssue(
          ctx,
          ["fallback", "previousIncumbentId"],
          "fallback.previousIncumbentId must match previousIncumbentId",
        );
      }

      if (artifact.research.starterBasketId !== artifact.activationTemplate.starterBasketId) {
        addIssue(
          ctx,
          ["research", "starterBasketId"],
          "research.starterBasketId must match activationTemplate.starterBasketId",
        );
      }

      if (
        stableJson(artifact.research.targetAllocations) !==
        stableJson(artifact.activationTemplate.targetAllocations)
      ) {
        addIssue(
          ctx,
          ["research", "targetAllocations"],
          "research.targetAllocations must match activationTemplate.targetAllocations",
        );
      }
    });
export type BasketPromotedIncumbentArtifact = z.infer<
  typeof basketPromotedIncumbentArtifactSchema
>;

export const directionalPromotedIncumbentArtifactSchema =
  promotedIncumbentArtifactBaseSchema
    .extend({
      mode: z.literal("directional"),
      status: z.literal("promoted_preview"),
      activationTemplate: directionalActivationTemplateSchema,
      research: directionalPromotedIncumbentResearchArtifactSchema,
    })
    .superRefine((artifact, ctx) => {
      if (artifact.fallback.previousIncumbentId !== artifact.previousIncumbentId) {
        addIssue(
          ctx,
          ["fallback", "previousIncumbentId"],
          "fallback.previousIncumbentId must match previousIncumbentId",
        );
      }

      if (artifact.research.assetSymbol !== artifact.activationTemplate.assetSymbol) {
        addIssue(
          ctx,
          ["research", "assetSymbol"],
          "research.assetSymbol must match activationTemplate.assetSymbol",
        );
      }

      if (
        stableJson(artifact.research.targetDirectionalExpression) !==
        stableJson(artifact.activationTemplate.targetDirectionalExpression)
      ) {
        addIssue(
          ctx,
          ["research", "targetDirectionalExpression"],
          "research.targetDirectionalExpression must match activationTemplate.targetDirectionalExpression",
        );
      }

      if (!artifact.research.previewOnly) {
        addIssue(
          ctx,
          ["research", "previewOnly"],
          "research.previewOnly must be true for promoted_preview artifacts",
        );
      }
    });
export type DirectionalPromotedIncumbentArtifact = z.infer<
  typeof directionalPromotedIncumbentArtifactSchema
>;

export const promotedIncumbentArtifactSchema = z.discriminatedUnion("mode", [
  basketPromotedIncumbentArtifactSchema,
  directionalPromotedIncumbentArtifactSchema,
]);
export type PromotedIncumbentArtifact = z.infer<
  typeof promotedIncumbentArtifactSchema
>;

export function parsePromotedIncumbentArtifact(value: unknown) {
  return promotedIncumbentArtifactSchema.parse(value);
}

export function normalizePromotedIncumbentArtifactManifestRef(value: unknown) {
  const artifact = parsePromotedIncumbentArtifact(value);

  return canonicalActivationManifestRefSchema.parse({
    manifest_id: buildPromotedManifestId(artifact.slotId, artifact.strategyVersion),
    slot_id: artifact.slotId,
    mode: artifact.mode,
    chain: artifact.chain,
    strategy_version: artifact.strategyVersion,
    promoted_at: artifact.promotedAt,
  });
}
