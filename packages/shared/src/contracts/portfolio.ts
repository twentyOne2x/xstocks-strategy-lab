import { z } from "zod";

import {
  activationManifestRefSchema,
  basketStrategySlotIdSchema,
  canonicalActivationManifestRefSchema,
  chainSchema,
  contractVersionSchema,
  directionalStanceSchema,
  directionalStrategySlotIdSchema,
  directionalViewSchema,
  manifestBadgeSchema,
  nonEmptyStringSchema,
  percentageSchema,
  recommendationUserStateSchema,
  rebalanceDecisionStateSchema,
  routeTruthLabelRowSchema,
  routeTruthLabelSchema,
  signalRefSchema,
  sleeveIdSchema,
  stringArraySchema,
  strategyModeSchema,
  strategySlotIdSchema,
  unitIntervalSchema,
  weightBpsSchema,
} from "./common.js";

export const starterBasketConstituentSchema = z.object({
  assetSymbol: nonEmptyStringSchema,
  targetWeightPct: percentageSchema,
});
export type StarterBasketConstituent = z.infer<
  typeof starterBasketConstituentSchema
>;

export const starterBasketSchema = z.object({
  version: contractVersionSchema,
  basketId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  chain: chainSchema,
  universe: z.literal("xstocks"),
  themeKey: nonEmptyStringSchema,
  constituents: z.array(starterBasketConstituentSchema).min(1),
});
export type StarterBasket = z.infer<typeof starterBasketSchema>;

const strategySlotBaseSchema = z.object({
  chain: chainSchema,
  surface: z.enum(["onboarding", "advanced"]),
  position: z.number().int().nonnegative(),
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
});

export const basketStrategySlotSchema = strategySlotBaseSchema.extend({
  slotId: basketStrategySlotIdSchema,
  mode: z.literal("basket"),
  starterBasketId: nonEmptyStringSchema,
});
export type BasketStrategySlot = z.infer<typeof basketStrategySlotSchema>;

export const directionalStrategySlotSchema = strategySlotBaseSchema.extend({
  slotId: directionalStrategySlotIdSchema,
  mode: z.literal("directional"),
  assetSymbol: nonEmptyStringSchema,
});
export type DirectionalStrategySlot = z.infer<
  typeof directionalStrategySlotSchema
>;

export const strategySlotSchema = z.discriminatedUnion("mode", [
  basketStrategySlotSchema,
  directionalStrategySlotSchema,
]);
export type StrategySlot = z.infer<typeof strategySlotSchema>;

export const portfolioTargetAllocationSchema = z.object({
  sleeve: sleeveIdSchema,
  targetWeightPct: percentageSchema,
  basketId: nonEmptyStringSchema.optional(),
  assetSymbol: nonEmptyStringSchema.optional(),
  venueId: nonEmptyStringSchema.optional(),
});
export type PortfolioTargetAllocation = z.infer<
  typeof portfolioTargetAllocationSchema
>;

export const cashOrYieldBufferTargetSchema = z.object({
  assetSymbol: nonEmptyStringSchema,
  venueId: nonEmptyStringSchema.optional(),
  targetWeightPct: percentageSchema,
});
export type CashOrYieldBufferTarget = z.infer<
  typeof cashOrYieldBufferTargetSchema
>;

export const rebalanceDecisionSchema = z.object({
  state: rebalanceDecisionStateSchema,
  rationale: nonEmptyStringSchema,
  signalFresh: z.boolean(),
  routeChecksPassed: z.boolean(),
  mandateChecksPassed: z.boolean(),
});
export type RebalanceDecision = z.infer<typeof rebalanceDecisionSchema>;

export const directionalExpressionSchema = z.object({
  view: directionalViewSchema,
  assetSymbol: nonEmptyStringSchema,
  grossExposurePct: z.number().finite().nonnegative(),
  netExposurePct: z.number().finite(),
  targetLtvPct: percentageSchema.nullable(),
});
export type DirectionalExpression = z.infer<typeof directionalExpressionSchema>;

export const portfolioExplanationComponentKindSchema = z.enum([
  "core_holding",
  "yield_buffer",
  "directional_expression",
]);
export type PortfolioExplanationComponentKind = z.infer<
  typeof portfolioExplanationComponentKindSchema
>;

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
export type PortfolioExplanationComponent = z.infer<
  typeof portfolioExplanationComponentSchema
>;

export const portfolioExplanationBundleSchema = z.object({
  whatThisPortfolioDoes: nonEmptyStringSchema,
  howItIsBuilt: nonEmptyStringSchema,
  howItChanges: nonEmptyStringSchema,
  whatWouldTriggerNextRebalance: nonEmptyStringSchema,
  howToReadReplay: nonEmptyStringSchema,
  bestFor: nonEmptyStringSchema,
  components: z.array(portfolioExplanationComponentSchema).min(1),
});
export type PortfolioExplanationBundle = z.infer<
  typeof portfolioExplanationBundleSchema
>;

export const promotedBasketReasonCodeSchema = z.object({
  code: nonEmptyStringSchema,
  kind: nonEmptyStringSchema,
  value: nonEmptyStringSchema.nullable(),
  label: nonEmptyStringSchema,
});
export type PromotedBasketReasonCode = z.infer<
  typeof promotedBasketReasonCodeSchema
>;

export const canonicalPromotedBasketReasonCodeSchema = z.object({
  code: nonEmptyStringSchema,
  kind: nonEmptyStringSchema,
  value: nonEmptyStringSchema.nullable(),
  label: nonEmptyStringSchema,
});
export type CanonicalPromotedBasketReasonCode = z.infer<
  typeof canonicalPromotedBasketReasonCodeSchema
>;

export const promotedBasketTargetWeightSchema = z.object({
  rank: z.number().int().positive(),
  symbol: nonEmptyStringSchema,
  assetName: nonEmptyStringSchema,
  targetWeightPct: z.number().finite().nonnegative(),
});
export type PromotedBasketTargetWeight = z.infer<
  typeof promotedBasketTargetWeightSchema
>;

export const canonicalPromotedBasketTargetWeightSchema = z.object({
  rank: z.number().int().positive(),
  symbol: nonEmptyStringSchema,
  asset_name: nonEmptyStringSchema,
  target_weight_pct: z.number().finite().nonnegative(),
});
export type CanonicalPromotedBasketTargetWeight = z.infer<
  typeof canonicalPromotedBasketTargetWeightSchema
>;

export const promotedBasketBenchmarkDeltaSchema = z.object({
  benchmarkId: nonEmptyStringSchema.nullable(),
  returnAnnPct: z.number().finite(),
  benchmarkReturnAnnPct: z.number().finite(),
  afterCostReturnAnnPct: z.number().finite(),
  benchmarkAfterCostReturnAnnPct: z.number().finite(),
  excessReturnAfterCostPct: z.number().finite(),
  score: z.number().finite(),
  deltaVsIncumbent: z.number().finite().nullable(),
});
export type PromotedBasketBenchmarkDelta = z.infer<
  typeof promotedBasketBenchmarkDeltaSchema
>;

export const canonicalPromotedBasketBenchmarkDeltaSchema = z.object({
  benchmark_id: nonEmptyStringSchema.nullable(),
  return_ann_pct: z.number().finite(),
  benchmark_return_ann_pct: z.number().finite(),
  after_cost_return_ann_pct: z.number().finite(),
  benchmark_after_cost_return_ann_pct: z.number().finite(),
  excess_return_after_cost_pct: z.number().finite(),
  score: z.number().finite(),
  delta_vs_incumbent: z.number().finite().nullable(),
});
export type CanonicalPromotedBasketBenchmarkDelta = z.infer<
  typeof canonicalPromotedBasketBenchmarkDeltaSchema
>;

export const promotedBasketPortfolioMetricsSchema = z.object({
  constituentCount: z.number().int().nonnegative(),
  concentrationPct: z.number().finite().nonnegative().nullable(),
  concentrationCapPct: z.number().finite().nonnegative().nullable(),
  turnoverAnnPct: z.number().finite().nonnegative().nullable(),
  costsTotalBps: z.number().finite().nonnegative().nullable(),
});
export type PromotedBasketPortfolioMetrics = z.infer<
  typeof promotedBasketPortfolioMetricsSchema
>;

export const canonicalPromotedBasketPortfolioMetricsSchema = z.object({
  constituent_count: z.number().int().nonnegative(),
  concentration_pct: z.number().finite().nonnegative().nullable(),
  concentration_cap_pct: z.number().finite().nonnegative().nullable(),
  turnover_ann_pct: z.number().finite().nonnegative().nullable(),
  costs_total_bps: z.number().finite().nonnegative().nullable(),
});
export type CanonicalPromotedBasketPortfolioMetrics = z.infer<
  typeof canonicalPromotedBasketPortfolioMetricsSchema
>;

export const promotedBasketSummarySurfaceSchema = z.object({
  construction: nonEmptyStringSchema,
  benchmark: nonEmptyStringSchema,
  rebalance: nonEmptyStringSchema,
});
export type PromotedBasketSummarySurface = z.infer<
  typeof promotedBasketSummarySurfaceSchema
>;

export const canonicalPromotedBasketSummarySurfaceSchema = z.object({
  construction: nonEmptyStringSchema,
  benchmark: nonEmptyStringSchema,
  rebalance: nonEmptyStringSchema,
});
export type CanonicalPromotedBasketSummarySurface = z.infer<
  typeof canonicalPromotedBasketSummarySurfaceSchema
>;

export const promotedBasketExplanationBundleSchema = z.object({
  truthMode: nonEmptyStringSchema,
  incumbentState: nonEmptyStringSchema,
  reasonCodes: z.array(promotedBasketReasonCodeSchema).min(1),
  targetWeights: z.array(promotedBasketTargetWeightSchema).min(1),
  cashWeightPct: z.number().finite().nonnegative(),
  rebalanceThresholdBps: z.number().finite().nonnegative(),
  rebalanceThresholdPct: z.number().finite().nonnegative(),
  benchmarkDelta: promotedBasketBenchmarkDeltaSchema,
  portfolioMetrics: promotedBasketPortfolioMetricsSchema,
  summaries: promotedBasketSummarySurfaceSchema,
});
export type PromotedBasketExplanationBundle = z.infer<
  typeof promotedBasketExplanationBundleSchema
>;

export const canonicalPromotedBasketExplanationBundleSchema = z.object({
  truth_mode: nonEmptyStringSchema,
  incumbent_state: nonEmptyStringSchema,
  reason_codes: z.array(canonicalPromotedBasketReasonCodeSchema).min(1),
  target_weights: z.array(canonicalPromotedBasketTargetWeightSchema).min(1),
  cash_weight_pct: z.number().finite().nonnegative(),
  rebalance_threshold_bps: z.number().finite().nonnegative(),
  rebalance_threshold_pct: z.number().finite().nonnegative(),
  benchmark_delta: canonicalPromotedBasketBenchmarkDeltaSchema,
  portfolio_metrics: canonicalPromotedBasketPortfolioMetricsSchema,
  summaries: canonicalPromotedBasketSummarySurfaceSchema,
});
export type CanonicalPromotedBasketExplanationBundle = z.infer<
  typeof canonicalPromotedBasketExplanationBundleSchema
>;

export const promotedBasketTuningKnobSchema = z.object({
  knobId: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  currentValue: nonEmptyStringSchema.nullable(),
  tuningImpact: nonEmptyStringSchema,
});
export type PromotedBasketTuningKnob = z.infer<
  typeof promotedBasketTuningKnobSchema
>;

export const canonicalPromotedBasketTuningKnobSchema = z.object({
  knob_id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  current_value: nonEmptyStringSchema.nullable(),
  tuning_impact: nonEmptyStringSchema,
});
export type CanonicalPromotedBasketTuningKnob = z.infer<
  typeof canonicalPromotedBasketTuningKnobSchema
>;

export const promotedBasketTuningSummarySchema = z.object({
  headline: nonEmptyStringSchema,
  currentKnobs: z.array(promotedBasketTuningKnobSchema).min(1),
  watchpoints: z.array(nonEmptyStringSchema).min(1),
});
export type PromotedBasketTuningSummary = z.infer<
  typeof promotedBasketTuningSummarySchema
>;

export const canonicalPromotedBasketTuningSummarySchema = z.object({
  headline: nonEmptyStringSchema,
  current_knobs: z.array(canonicalPromotedBasketTuningKnobSchema).min(1),
  watchpoints: z.array(nonEmptyStringSchema).min(1),
});
export type CanonicalPromotedBasketTuningSummary = z.infer<
  typeof canonicalPromotedBasketTuningSummarySchema
>;

export const basketRecommendationSchema = z.object({
  version: contractVersionSchema,
  recommendationId: nonEmptyStringSchema,
  slotId: basketStrategySlotIdSchema,
  portfolioMode: z.literal("basket"),
  activationManifestRef: activationManifestRefSchema,
  targetAllocations: z.array(portfolioTargetAllocationSchema).min(1),
  cashOrYieldBufferTarget: cashOrYieldBufferTargetSchema,
  explanationSummary: nonEmptyStringSchema,
  explanationBundle: portfolioExplanationBundleSchema,
  signalRefs: z.array(signalRefSchema).min(1),
  rebalanceDecision: rebalanceDecisionSchema,
  validationBadges: stringArraySchema,
});
export type BasketRecommendation = z.infer<typeof basketRecommendationSchema>;

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
export type DirectionalRecommendation = z.infer<
  typeof directionalRecommendationSchema
>;

export const targetAllocationSchema = z.object({
  sleeve: sleeveIdSchema,
  asset_symbol: nonEmptyStringSchema.optional(),
  basket_id: nonEmptyStringSchema.optional(),
  venue_id: nonEmptyStringSchema.optional(),
  weight_bps: weightBpsSchema,
});
export type TargetAllocation = z.infer<typeof targetAllocationSchema>;

export const targetDirectionalExpressionSchema = z.object({
  asset_symbol: nonEmptyStringSchema,
  stance: directionalStanceSchema,
  notional_share_bps: weightBpsSchema,
});
export type TargetDirectionalExpression = z.infer<
  typeof targetDirectionalExpressionSchema
>;

export const recommendationDecisionStateSchema = z.enum([
  "monitor",
  "full_rebalance",
]);
export type RecommendationDecisionState = z.infer<
  typeof recommendationDecisionStateSchema
>;

export const recommendationRebalanceDecisionSchema = z.object({
  state: recommendationDecisionStateSchema,
  reason: nonEmptyStringSchema,
  approval_required: z.boolean(),
  route_truth_surface: routeTruthLabelSchema,
});
export type RecommendationRebalanceDecision = z.infer<
  typeof recommendationRebalanceDecisionSchema
>;

export const recommendationSchema = z.object({
  recommendation_id: nonEmptyStringSchema,
  slot_id: strategySlotIdSchema,
  portfolio_mode: strategyModeSchema,
  activation_manifest_ref: canonicalActivationManifestRefSchema,
  target_allocations: z.array(targetAllocationSchema),
  target_directional_expressions: z.array(targetDirectionalExpressionSchema),
  cash_or_yield_buffer_target: targetAllocationSchema.nullable(),
  explanation_summary: nonEmptyStringSchema,
  signal_refs: z.array(nonEmptyStringSchema),
  rebalance_decision: recommendationRebalanceDecisionSchema,
  validation_badges: z.array(manifestBadgeSchema),
  route_truth_labels: z.array(routeTruthLabelRowSchema),
  user_state: recommendationUserStateSchema,
});
export type Recommendation = z.infer<typeof recommendationSchema>;

const directionalPlatformChainSchema = z.enum(["Ethereum", "Ink"]);
const directionalVenueSchema = z.enum(["euler", "morpho"]);
const directionalPlatformSchema = z.enum(["Euler", "Morpho"]);
const directionalRouteKindSchema = z.enum([
  "directional_market",
  "lending_market",
]);
const directionalVaultVenueSchema = z.literal("flowdesk");
const directionalVaultKindSchema = z.literal("yield_vault");
const railProofSourceSchema = z.enum([
  "verified_public",
  "mentor_reported",
  "unverified",
]);
const adapterImplementationStateSchema = z.enum([
  "implemented",
  "scaffolded",
]);
const directionalSideSchema = z.enum(["long", "short"]);
const healthFactorStatusSchema = z.enum([
  "no_debt",
  "below_liquidation",
  "critical",
  "tight",
  "buffered",
  "healthy",
]);
const liquidationMoveSchema = z.enum(["down", "up", "unknown"]);
const liquidationDistanceStatusSchema = z.enum([
  "unavailable",
  "breached",
  "danger",
  "watch",
  "safe",
]);

export const directionalRouteContextSchema = z.object({
  adapter_id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  venue: directionalVenueSchema,
  platform: directionalPlatformSchema,
  chain: directionalPlatformChainSchema,
  kind: directionalRouteKindSchema,
  truth: routeTruthLabelSchema,
  proof_source: railProofSourceSchema,
  implementation_state: adapterImplementationStateSchema,
  market_key: nonEmptyStringSchema.nullable(),
  market_address: nonEmptyStringSchema.nullable(),
  collateral_symbol: nonEmptyStringSchema.nullable(),
  debt_symbol: nonEmptyStringSchema.nullable(),
  notes: stringArraySchema,
});
export type DirectionalRouteContext = z.infer<
  typeof directionalRouteContextSchema
>;

export const directionalVaultContextSchema = z.object({
  adapter_id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  venue: directionalVaultVenueSchema,
  platform: z.literal("Morpho"),
  chain: directionalPlatformChainSchema,
  kind: directionalVaultKindSchema,
  truth: routeTruthLabelSchema,
  proof_source: railProofSourceSchema,
  implementation_state: adapterImplementationStateSchema,
  vault_key: nonEmptyStringSchema,
  vault_address: nonEmptyStringSchema.nullable(),
  deposit_symbol: nonEmptyStringSchema,
  reward_symbol: nonEmptyStringSchema.nullable(),
  notes: stringArraySchema,
});
export type DirectionalVaultContext = z.infer<
  typeof directionalVaultContextSchema
>;

export const healthFactorSummarySchema = z.object({
  value: z.number().finite().nullable(),
  target: z.number().finite().positive(),
  delta_to_target: z.number().finite().nullable(),
  liquidation_margin: z.number().finite().nullable(),
  status: healthFactorStatusSchema,
  truth: routeTruthLabelSchema,
  can_activate: z.boolean(),
});
export type HealthFactorSummary = z.infer<typeof healthFactorSummarySchema>;

export const liquidationDistanceSummarySchema = z.object({
  side: directionalSideSchema,
  current_price_usd: z.number().finite().nonnegative(),
  liquidation_price_usd: z.number().finite().nullable(),
  distance_usd: z.number().finite().nullable(),
  distance_pct: z.number().finite().nullable(),
  move_to_liquidation: liquidationMoveSchema,
  status: liquidationDistanceStatusSchema,
});
export type LiquidationDistanceSummary = z.infer<
  typeof liquidationDistanceSummarySchema
>;

export const directionalLiveProofOverlaySchema = z.object({
  truth: routeTruthLabelSchema,
  route_context: directionalRouteContextSchema.nullable(),
  vault_context: directionalVaultContextSchema.nullable(),
  note: nonEmptyStringSchema,
});
export type DirectionalLiveProofOverlay = z.infer<
  typeof directionalLiveProofOverlaySchema
>;

export const directionalPreviewSchema = z.object({
  preview_id: nonEmptyStringSchema,
  slot_id: directionalStrategySlotIdSchema,
  chain: chainSchema,
  asset_symbol: nonEmptyStringSchema,
  activation_manifest_ref: canonicalActivationManifestRefSchema,
  truth_state: routeTruthLabelSchema,
  target_allocations: z.array(targetAllocationSchema),
  target_directional_expressions: z.array(targetDirectionalExpressionSchema).min(1),
  explanation_summary: nonEmptyStringSchema,
  signal_refs: z.array(nonEmptyStringSchema),
  validation_badges: z.array(manifestBadgeSchema),
  route_truth_labels: z.array(routeTruthLabelRowSchema),
  side: directionalSideSchema,
  current_price_usd: z.number().finite().nonnegative(),
  collateral_usd: z.number().finite().nonnegative(),
  debt_usd: z.number().finite().nonnegative(),
  gross_exposure_usd: z.number().finite().nonnegative(),
  leverage_multiple: z.number().finite().positive().nullable(),
  activation_allowed: z.boolean(),
  health_factor: healthFactorSummarySchema,
  liquidation_distance: liquidationDistanceSummarySchema,
  route_context: directionalRouteContextSchema,
  vault_context: directionalVaultContextSchema.nullable(),
  live_proof_overlay: directionalLiveProofOverlaySchema.nullable(),
  notes: stringArraySchema,
});
export type DirectionalPreview = z.infer<typeof directionalPreviewSchema>;

export const strategySlotLookupSchema = z.record(strategySlotIdSchema, strategyModeSchema);
export type StrategySlotLookup = z.infer<typeof strategySlotLookupSchema>;
