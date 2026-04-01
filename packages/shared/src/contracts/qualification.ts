import { z } from "zod";

import {
  activationManifestRefSchema,
  contractVersionSchema,
  executionEligibilitySchema,
  executionStateSchema,
  nonEmptyStringSchema,
  routeTruthLabelSchema,
  strategyModeSchema,
  strategySlotIdSchema,
  stringArraySchema,
} from "./common.js";
import { onboardingAnswersSchema, userProfileSchema } from "./onboarding.js";
import {
  basketRecommendationSchema,
  directionalRecommendationSchema,
  portfolioExplanationBundleSchema,
} from "./portfolio.js";

export const qualificationSelectionSchema = z.object({
  slotId: strategySlotIdSchema,
  mode: strategyModeSchema,
  starterBasketId: nonEmptyStringSchema.optional(),
  safeFallbackApplied: z.boolean(),
  reasonCodes: z.array(nonEmptyStringSchema).min(1),
});
export type QualificationSelection = z.infer<
  typeof qualificationSelectionSchema
>;

export const qualificationExplanationSurfaceSchema = z.object({
  surfaceId: z.literal("recommendation.explanationBundle"),
  summary: nonEmptyStringSchema,
  bundle: portfolioExplanationBundleSchema,
  researchExplanationAvailable: z.boolean(),
  researchTuningSummaryAvailable: z.boolean(),
});
export type QualificationExplanationSurface = z.infer<
  typeof qualificationExplanationSurfaceSchema
>;

export const qualificationActivationTruthSchema = z.object({
  surfaceTruth: routeTruthLabelSchema,
  executionState: executionStateSchema,
  executionEligibility: executionEligibilitySchema,
  requestedNotionalUsd: z.number().finite().nonnegative(),
  fundedNotionalUsd: z.number().finite().nonnegative(),
  fundingGapUsd: z.number().finite().nonnegative(),
  fundingAssetSymbol: nonEmptyStringSchema,
  minFundingUsd: z.number().finite().nonnegative(),
  depositRequired: z.boolean(),
  activationReady: z.boolean(),
  directionalPreviewOnly: z.boolean(),
  blockers: stringArraySchema,
  warnings: stringArraySchema,
});
export type QualificationActivationTruth = z.infer<
  typeof qualificationActivationTruthSchema
>;

export const agentQualificationSchema = z.object({
  version: contractVersionSchema,
  normalizedAnswers: onboardingAnswersSchema,
  userProfile: userProfileSchema,
  selection: qualificationSelectionSchema,
  manifestId: nonEmptyStringSchema,
  manifestRef: activationManifestRefSchema,
  recommendation: z.union([
    basketRecommendationSchema,
    directionalRecommendationSchema,
  ]),
  explanationSurface: qualificationExplanationSurfaceSchema,
  activationTruth: qualificationActivationTruthSchema,
});
export type AgentQualification = z.infer<typeof agentQualificationSchema>;
