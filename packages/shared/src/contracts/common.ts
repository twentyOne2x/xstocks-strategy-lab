import { z } from "zod";

export const contractVersionSchema = z.literal("1");
export type ContractVersion = z.infer<typeof contractVersionSchema>;

export const timestampSchema = z.string().trim().min(1);
export type Timestamp = z.infer<typeof timestampSchema>;

export const blankStringSchema = z.literal("");
export const nonEmptyStringSchema = z.string().trim().min(1);
export const stringArraySchema = z.array(nonEmptyStringSchema);
export const percentageSchema = z.number().finite().min(0).max(100);
export const unitIntervalSchema = z.number().finite().min(0).max(1);
export const weightBpsSchema = z.number().int().min(0).max(10_000);
export const scoreSchema = z.number().finite();
export const jsonRecordSchema = z.record(z.string(), z.unknown());
export const finiteNumberOrBlankSchema = z.union([
  z.number().finite(),
  blankStringSchema,
]);
export const nonEmptyStringOrBlankSchema = z.union([
  nonEmptyStringSchema,
  blankStringSchema,
]);

export const CHAIN_VALUES = ["ethereum"] as const;
export const chainSchema = z.enum(CHAIN_VALUES);
export type Chain = z.infer<typeof chainSchema>;

export const ROUTE_CHAIN_VALUES = ["ethereum", "ink"] as const;
export const routeChainSchema = z.enum(ROUTE_CHAIN_VALUES);
export type RouteChain = z.infer<typeof routeChainSchema>;

export const STRATEGY_MODE_VALUES = ["basket", "directional"] as const;
export const strategyModeSchema = z.enum(STRATEGY_MODE_VALUES);
export type StrategyMode = z.infer<typeof strategyModeSchema>;

export const ONBOARDING_MODE_PREFERENCE_VALUES = [
  "basket",
  "directional",
  "not_sure_yet",
] as const;
export const onboardingModePreferenceSchema = z.enum(
  ONBOARDING_MODE_PREFERENCE_VALUES,
);
export type OnboardingModePreference = z.infer<
  typeof onboardingModePreferenceSchema
>;

export const DISCOVERY_SCOPE_TYPE_VALUES = [
  "theme",
  "hero_asset",
  "public_strategy",
] as const;
export const discoveryScopeTypeSchema = z.enum(DISCOVERY_SCOPE_TYPE_VALUES);
export type DiscoveryScopeType = z.infer<typeof discoveryScopeTypeSchema>;

export const STRATEGY_SLOT_ID_VALUES = [
  "onboarding.default_basket",
  "onboarding.alt_basket_1",
  "onboarding.alt_basket_2",
  "advanced.default_directional",
] as const;
export const strategySlotIdSchema = z.enum(STRATEGY_SLOT_ID_VALUES);
export type StrategySlotId = z.infer<typeof strategySlotIdSchema>;

export const BASKET_STRATEGY_SLOT_ID_VALUES = [
  "onboarding.default_basket",
  "onboarding.alt_basket_1",
  "onboarding.alt_basket_2",
] as const;
export const basketStrategySlotIdSchema = z.enum(BASKET_STRATEGY_SLOT_ID_VALUES);
export type BasketStrategySlotId = z.infer<typeof basketStrategySlotIdSchema>;

export const DIRECTIONAL_STRATEGY_SLOT_ID_VALUES = [
  "advanced.default_directional",
] as const;
export const directionalStrategySlotIdSchema = z.enum(
  DIRECTIONAL_STRATEGY_SLOT_ID_VALUES,
);
export type DirectionalStrategySlotId = z.infer<
  typeof directionalStrategySlotIdSchema
>;

export const SIGNAL_SCOPE_TYPE_VALUES = ["asset", "theme", "basket"] as const;
export const signalScopeTypeSchema = z.enum(SIGNAL_SCOPE_TYPE_VALUES);
export type SignalScopeType = z.infer<typeof signalScopeTypeSchema>;

export const SIGNAL_STANCE_VALUES = [
  "strong_positive",
  "positive",
  "neutral",
  "negative",
  "strong_negative",
] as const;
export const signalStanceSchema = z.enum(SIGNAL_STANCE_VALUES);
export type SignalStance = z.infer<typeof signalStanceSchema>;

export const SIGNAL_HORIZON_VALUES = [
  "tactical",
  "swing",
  "strategic",
] as const;
export const signalHorizonSchema = z.enum(SIGNAL_HORIZON_VALUES);
export type SignalHorizon = z.infer<typeof signalHorizonSchema>;

export const RISK_REGIME_VALUES = ["risk_on", "balanced", "risk_off"] as const;
export const riskRegimeSchema = z.enum(RISK_REGIME_VALUES);
export type RiskRegime = z.infer<typeof riskRegimeSchema>;

export const REBALANCE_URGENCY_VALUES = [
  "none",
  "monitor",
  "consider",
  "act",
] as const;
export const rebalanceUrgencySchema = z.enum(REBALANCE_URGENCY_VALUES);
export type RebalanceUrgency = z.infer<typeof rebalanceUrgencySchema>;

export const ALLOCATOR_HINT_VALUES = [
  "increase",
  "trim",
  "hold",
  "hedge",
  "park_in_ausd",
] as const;
export const allocatorHintSchema = z.enum(ALLOCATOR_HINT_VALUES);
export type AllocatorHint = z.infer<typeof allocatorHintSchema>;

export const SLEEVE_ID_VALUES = [
  "core_xstocks",
  "directional",
  "yield_buffer",
] as const;
export const sleeveIdSchema = z.enum(SLEEVE_ID_VALUES);
export type SleeveId = z.infer<typeof sleeveIdSchema>;

export const DIRECTIONAL_STANCE_VALUES = [
  "conviction_long",
  "conviction_short",
  "hedged_view",
] as const;
export const directionalStanceSchema = z.enum(DIRECTIONAL_STANCE_VALUES);
export type DirectionalStance = z.infer<typeof directionalStanceSchema>;

export const DIRECTIONAL_VIEW_VALUES = [
  "no_directional_expression",
  "conviction_long",
  "conviction_short",
  "hedged_view",
] as const;
export const directionalViewSchema = z.enum(DIRECTIONAL_VIEW_VALUES);
export type DirectionalView = z.infer<typeof directionalViewSchema>;

export const REBALANCE_DECISION_STATE_VALUES = [
  "no_action",
  "monitor",
  "partial_rebalance",
  "full_rebalance",
] as const;
export const rebalanceDecisionStateSchema = z.enum(
  REBALANCE_DECISION_STATE_VALUES,
);
export type RebalanceDecisionState = z.infer<
  typeof rebalanceDecisionStateSchema
>;

export const RAIL_TRUTH_STATE_VALUES = [
  "live",
  "preview",
  "blocked",
  "mentor_confirmed",
  "unverified",
] as const;
export const railTruthStateSchema = z.enum(RAIL_TRUTH_STATE_VALUES);
export type RailTruthState = z.infer<typeof railTruthStateSchema>;

export const routeTruthLabelSchema = railTruthStateSchema;
export type RouteTruthLabel = z.infer<typeof routeTruthLabelSchema>;

export const ROUTE_VERIFICATION_TIER_VALUES = [
  "public_verified",
  "mentor_reported",
  "unverified",
] as const;
export const routeVerificationTierSchema = z.enum(
  ROUTE_VERIFICATION_TIER_VALUES,
);
export type RouteVerificationTier = z.infer<
  typeof routeVerificationTierSchema
>;

export const ROUTE_AVAILABILITY_VALUES = [
  "available",
  "preview_only",
  "unknown",
  "missing",
] as const;
export const routeAvailabilitySchema = z.enum(ROUTE_AVAILABILITY_VALUES);
export type RouteAvailability = z.infer<typeof routeAvailabilitySchema>;

export const ROUTE_KIND_VALUES = ["execution", "vault"] as const;
export const routeKindSchema = z.enum(ROUTE_KIND_VALUES);
export type RouteKind = z.infer<typeof routeKindSchema>;

export const ROUTE_TRUTH_LABEL_KIND_VALUES = [
  "execution",
  "vault",
  "unknown",
] as const;
export const routeTruthLabelKindSchema = z.enum(
  ROUTE_TRUTH_LABEL_KIND_VALUES,
);
export type RouteTruthLabelKind = z.infer<typeof routeTruthLabelKindSchema>;

export const ROUTE_REQUIRED_FOR_VALUES = [
  "core_xstocks",
  "yield_buffer",
  "directional",
  "activation",
] as const;
export const routeRequiredForSchema = z.enum(ROUTE_REQUIRED_FOR_VALUES);
export type RouteRequiredFor = z.infer<typeof routeRequiredForSchema>;

export const EXECUTION_STATE_VALUES = [
  "ready",
  "wallet_required",
  "funding_required",
  "smart_account_required",
  "smart_account_pending",
  "blocked",
] as const;
export const executionStateSchema = z.enum(EXECUTION_STATE_VALUES);
export type ExecutionState = z.infer<typeof executionStateSchema>;

export const EXECUTION_ELIGIBILITY_VALUES = [
  "executable",
  "preview_only",
  "blocked",
] as const;
export const executionEligibilitySchema = z.enum(
  EXECUTION_ELIGIBILITY_VALUES,
);
export type ExecutionEligibility = z.infer<typeof executionEligibilitySchema>;

export const SMART_ACCOUNT_READINESS_VALUES = [
  "not_required",
  "wallet_required",
  "smart_account_required",
  "smart_account_pending",
  "ready",
] as const;
export const smartAccountReadinessSchema = z.enum(
  SMART_ACCOUNT_READINESS_VALUES,
);
export type SmartAccountReadiness = z.infer<
  typeof smartAccountReadinessSchema
>;

export const SMART_ACCOUNT_BOOTSTRAP_STATE_VALUES = [
  "wallet_required",
  "embedded_wallet_pending",
  "smart_account_required",
  "smart_account_pending",
  "ready",
  "blocked",
] as const;
export const smartAccountBootstrapStateSchema = z.enum(
  SMART_ACCOUNT_BOOTSTRAP_STATE_VALUES,
);
export type SmartAccountBootstrapState = z.infer<
  typeof smartAccountBootstrapStateSchema
>;

export const FUNDING_READINESS_VALUES = [
  "destination_required",
  "funding_required",
  "funded",
  "blocked",
] as const;
export const fundingReadinessSchema = z.enum(FUNDING_READINESS_VALUES);
export type FundingReadiness = z.infer<typeof fundingReadinessSchema>;

export const FUNDING_METHOD_KIND_VALUES = [
  "card",
  "wallet",
  "exchange",
  "manual_transfer",
] as const;
export const fundingMethodKindSchema = z.enum(FUNDING_METHOD_KIND_VALUES);
export type FundingMethodKind = z.infer<typeof fundingMethodKindSchema>;

export const FUNDING_METHOD_STATUS_VALUES = [
  "available",
  "recommended",
  "blocked",
  "not_enabled",
] as const;
export const fundingMethodStatusSchema = z.enum(FUNDING_METHOD_STATUS_VALUES);
export type FundingMethodStatus = z.infer<typeof fundingMethodStatusSchema>;

export const EXECUTION_APPROVAL_STATUS_VALUES = [
  "not_requested",
  "awaiting_user",
  "awaiting_backend",
  "approved",
  "submitted",
  "failed",
] as const;
export const executionApprovalStatusSchema = z.enum(
  EXECUTION_APPROVAL_STATUS_VALUES,
);
export type ExecutionApprovalStatus = z.infer<
  typeof executionApprovalStatusSchema
>;

export const RECOMMENDATION_USER_STATE_VALUES = [
  "guest",
  "wallet_linked",
] as const;
export const recommendationUserStateSchema = z.enum(
  RECOMMENDATION_USER_STATE_VALUES,
);
export type RecommendationUserState = z.infer<
  typeof recommendationUserStateSchema
>;

export const ACTIVITY_SCOPE_TYPE_VALUES = [
  "guest_session",
  "user",
  "smart_account",
  "activation",
  "recommendation",
  "directional_preview",
] as const;
export const activityScopeTypeSchema = z.enum(ACTIVITY_SCOPE_TYPE_VALUES);
export type ActivityScopeType = z.infer<typeof activityScopeTypeSchema>;

export const discoverySelectionSchema = z.object({
  type: discoveryScopeTypeSchema,
  key: nonEmptyStringSchema,
});
export type DiscoverySelection = z.infer<typeof discoverySelectionSchema>;

export const signalRefSchema = z.object({
  signalId: nonEmptyStringSchema,
  scopeType: signalScopeTypeSchema,
  scopeKey: nonEmptyStringSchema,
});
export type SignalRef = z.infer<typeof signalRefSchema>;

export const signalArtifactIdSchema = nonEmptyStringSchema;
export type SignalArtifactId = z.infer<typeof signalArtifactIdSchema>;

export const validationBadgeSchema = nonEmptyStringSchema;
export type ValidationBadge = z.infer<typeof validationBadgeSchema>;

export const manifestBadgeObjectSchema = z.object({
  kind: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
});
export type ManifestBadgeObject = z.infer<typeof manifestBadgeObjectSchema>;

export const manifestBadgeSchema = z.union([
  nonEmptyStringSchema,
  manifestBadgeObjectSchema,
]);
export type ManifestBadge = z.infer<typeof manifestBadgeSchema>;

export const routeRequirementSchema = z.object({
  route_id: nonEmptyStringSchema,
  route_kind: routeKindSchema,
  required_for: routeRequiredForSchema.optional(),
  label: nonEmptyStringSchema.optional(),
});
export type RouteRequirement = z.infer<typeof routeRequirementSchema>;

export const routeTruthLabelRowSchema = z.object({
  route_id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  route_kind: routeTruthLabelKindSchema,
  chain: routeChainSchema.optional(),
  verification_tier: routeVerificationTierSchema,
  truth_label: routeTruthLabelSchema,
  availability: routeAvailabilitySchema,
  required_for: routeRequiredForSchema,
  reason: nonEmptyStringSchema,
});
export type RouteTruthLabelRow = z.infer<typeof routeTruthLabelRowSchema>;

export const canonicalActivationManifestRefSchema = z.object({
  manifest_id: nonEmptyStringSchema,
  slot_id: strategySlotIdSchema,
  mode: strategyModeSchema,
  chain: chainSchema,
  strategy_version: nonEmptyStringSchema,
  promoted_at: timestampSchema,
});
export type CanonicalActivationManifestRef = z.infer<
  typeof canonicalActivationManifestRefSchema
>;

export const legacyActivationManifestRefSchema = z.object({
  manifestId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  mode: strategyModeSchema,
  strategyVersion: nonEmptyStringSchema,
});
export type LegacyActivationManifestRef = z.infer<
  typeof legacyActivationManifestRefSchema
>;

export const activationManifestRefSchema = z.union([
  canonicalActivationManifestRefSchema,
  legacyActivationManifestRefSchema,
]);
export type ActivationManifestRef = z.infer<typeof activationManifestRefSchema>;
