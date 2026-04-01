import { z } from "../../shared/node_modules/zod/index.js";

export const CONTRACT_VERSION = "1";

export {
  activationManifestSchema,
} from "../../shared/dist/contracts/activation.js";
export { activityEventSchema } from "../../shared/dist/contracts/activity.js";
export {
  activationManifestRefSchema,
  basketStrategySlotIdSchema,
  contractVersionSchema,
  directionalStrategySlotIdSchema,
  executionEligibilitySchema,
  nonEmptyStringSchema,
  percentageSchema,
  routeRequirementSchema,
  routeTruthLabelRowSchema,
  routeTruthLabelSchema,
  signalRefSchema,
  sleeveIdSchema,
  stringArraySchema,
} from "../../shared/dist/contracts/common.js";
export {
  cashOrYieldBufferTargetSchema,
  canonicalPromotedBasketExplanationBundleSchema,
  canonicalPromotedBasketTuningSummarySchema,
  directionalExpressionSchema,
  portfolioTargetAllocationSchema,
  promotedBasketExplanationBundleSchema,
  promotedBasketTuningSummarySchema,
  rebalanceDecisionSchema,
  starterBasketSchema,
  strategySlotSchema,
  targetAllocationSchema,
  targetDirectionalExpressionSchema,
} from "../../shared/dist/contracts/portfolio.js";

import {
  activationManifestRefSchema,
  basketStrategySlotIdSchema,
  contractVersionSchema,
  directionalStrategySlotIdSchema,
  nonEmptyStringSchema,
  percentageSchema,
  signalRefSchema,
  sleeveIdSchema,
  stringArraySchema,
} from "../../shared/dist/contracts/common.js";
import {
  basketRecommendationSchema as baseBasketRecommendationSchema,
  cashOrYieldBufferTargetSchema,
  directionalExpressionSchema,
  portfolioTargetAllocationSchema,
  rebalanceDecisionSchema,
} from "../../shared/dist/contracts/portfolio.js";

export const portfolioExplanationComponentKindSchema = z.enum([
  "core_holding",
  "yield_buffer",
  "directional_expression",
]);

export const portfolioExplanationComponentSchema = z.object({
  componentId: nonEmptyStringSchema,
  kind: portfolioExplanationComponentKindSchema,
  sleeve: sleeveIdSchema,
  title: nonEmptyStringSchema,
  rationale: nonEmptyStringSchema,
  targetWeightPct: percentageSchema.nullable(),
  grossExposurePct: percentageSchema.nullable(),
  assetSymbol: nonEmptyStringSchema.nullable(),
  basketId: nonEmptyStringSchema.nullable(),
  venueId: nonEmptyStringSchema.nullable(),
});

export const portfolioExplanationBundleSchema = z.object({
  whatThisPortfolioDoes: nonEmptyStringSchema,
  howItIsBuilt: nonEmptyStringSchema,
  howItChanges: nonEmptyStringSchema,
  whatWouldTriggerNextRebalance: nonEmptyStringSchema,
  howToReadReplay: nonEmptyStringSchema,
  bestFor: nonEmptyStringSchema,
  components: z.array(portfolioExplanationComponentSchema).min(1),
});

export const basketRecommendationSchema =
  baseBasketRecommendationSchema.extend({
    explanationBundle: portfolioExplanationBundleSchema,
  });

export const directionalRecommendationSchema = z.object({
  version: contractVersionSchema,
  recommendationId: nonEmptyStringSchema,
  slotId: directionalStrategySlotIdSchema,
  portfolioMode: z.literal("directional"),
  activationManifestRef: activationManifestRefSchema,
  targetDirectionalExpression: directionalExpressionSchema.nullable(),
  explanationSummary: nonEmptyStringSchema,
  explanationBundle: portfolioExplanationBundleSchema,
  signalRefs: z.array(signalRefSchema).min(1),
  rebalanceDecision: rebalanceDecisionSchema,
});
