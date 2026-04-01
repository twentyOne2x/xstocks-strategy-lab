export type Chain = "ethereum";

export type StrategyMode = "basket" | "directional";

export type OnboardingModePreference =
  | StrategyMode
  | "not_sure_yet";

export type DiscoveryScopeType =
  | "theme"
  | "hero_asset"
  | "public_strategy";

export interface DiscoverySelection {
  type: DiscoveryScopeType;
  key: string;
}

export type StrategySlotId =
  | "onboarding.default_basket"
  | "onboarding.alt_basket_1"
  | "onboarding.alt_basket_2"
  | "advanced.default_directional";

export type SignalScopeType =
  | "asset"
  | "theme"
  | "basket";

export type SignalStance =
  | "strong_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "strong_negative";

export type SignalHorizon =
  | "tactical"
  | "swing"
  | "strategic";

export type RiskRegime =
  | "risk_on"
  | "balanced"
  | "risk_off";

export type RebalanceUrgency =
  | "none"
  | "monitor"
  | "consider"
  | "act";

export type AllocatorHint =
  | "increase"
  | "trim"
  | "hold"
  | "hedge"
  | "park_in_ausd";

export type RailTruthState =
  | "live"
  | "preview"
  | "blocked"
  | "mentor_confirmed"
  | "unverified";

export type SleeveId =
  | "core_xstocks"
  | "directional"
  | "yield_buffer";

export interface OnboardingAnswers {
  version: "1";
  preferredChain: Chain;
  modePreference: OnboardingModePreference;
  initialSelection: DiscoverySelection;
  selectedStarterSlotId?: StrategySlotId;
  selectedStarterBasketId?: string;
  directionalOptIn: boolean;
  submittedAt: string;
}

export interface UserProfile {
  version: "1";
  preferredChain: Chain;
  modePreference: OnboardingModePreference;
  selectedScope: DiscoverySelection;
  activeSlotId: StrategySlotId;
  starterBasketId?: string;
  directionalAllowed: boolean;
  yieldBufferAllowed: boolean;
  updatedAt: string;
}

export interface ProviderSummary {
  providerCount: number;
  providers: string[];
  tags: string[];
}

export interface SignalArtifact {
  version: "1";
  chain: Chain;
  signalId: string;
  generatedAt: string;
  expiresAt: string;
  scopeType: SignalScopeType;
  scopeKey: string;
  stance: SignalStance;
  confidence: number;
  horizon: SignalHorizon;
  riskRegime: RiskRegime;
  rebalanceUrgency: RebalanceUrgency;
  allocatorHint: AllocatorHint;
  topReasons: string[];
  providerSummary: ProviderSummary;
}

export interface ActivationPermission {
  canPause: boolean;
  canTurnOff: boolean;
  maxSlippageBps: number;
  maxLeverage?: number | null;
}

export type ActivationActionKind =
  | "approve"
  | "swap"
  | "supply"
  | "borrow"
  | "repay"
  | "rebalance";

export interface ActivationAction {
  actionId: string;
  kind: ActivationActionKind;
  venueId: string;
  assetSymbol?: string;
  amountUsd?: number;
  summary: string;
}

export interface ActivationPayloadSource {
  recommendationId?: string;
  directionalPreviewId?: string;
}

export interface ActivationPayload {
  version: "1";
  payloadId: string;
  manifestId: string;
  chain: Chain;
  mode: StrategyMode;
  ownerAddress?: string;
  smartAccountAddress?: string;
  fundingAssetSymbol: string;
  fundingAmountUsd: number;
  source: ActivationPayloadSource;
  routeContext: {
    truthState: RailTruthState;
    venueId: string;
    routeId?: string;
    quoteExpiresAt?: string;
  };
  permissions: ActivationPermission;
  actions: ActivationAction[];
}

export interface CanonicalActivationManifestRef {
  manifest_id: string;
  slot_id: StrategySlotId;
  mode: StrategyMode;
  chain: Chain;
  strategy_version: string;
  promoted_at: string;
}

export interface RecommendationTargetAllocation {
  sleeve: SleeveId;
  asset_symbol?: string;
  basket_id?: string;
  venue_id?: string;
  weight_bps: number;
}

export interface RecommendationTargetDirectionalExpression {
  asset_symbol: string;
  stance: "conviction_long" | "conviction_short" | "hedged_view";
  notional_share_bps: number;
}

export interface Recommendation {
  recommendation_id: string;
  slot_id: StrategySlotId;
  portfolio_mode: StrategyMode;
  activation_manifest_ref: CanonicalActivationManifestRef;
  target_allocations: RecommendationTargetAllocation[];
  target_directional_expressions: RecommendationTargetDirectionalExpression[];
  cash_or_yield_buffer_target: RecommendationTargetAllocation | null;
  explanation_summary: string;
  signal_refs: string[];
  rebalance_decision: {
    state: "monitor" | "full_rebalance";
    reason: string;
    approval_required: boolean;
    route_truth_surface: RailTruthState;
  };
  validation_badges: Array<string | { kind: string; label: string }>;
  route_truth_labels: Array<{
    route_id: string;
    label: string;
    route_kind: "execution" | "vault" | "unknown";
    chain?: "ethereum" | "ink";
    verification_tier: "public_verified" | "mentor_reported" | "unverified";
    truth_label: RailTruthState;
    availability: "available" | "preview_only" | "unknown" | "missing";
    required_for: "core_xstocks" | "yield_buffer" | "directional" | "activation";
    reason: string;
  }>;
  user_state: "guest" | "wallet_linked";
}

export interface ActivationManifestFrontend {
  title: string;
  subtitle: string;
  riskLabel: string;
  summary: string;
  badges: Array<string | { kind: string; label: string }>;
}

export interface ActivationManifestValidation {
  datasetVersion: string;
  evaluatorVersion: string;
  objectiveId: string;
  score: number;
  deltaVsIncumbent: number | null;
  promotedAt: string;
}

export interface ActivationManifest {
  version: "1";
  manifestId: string;
  slotId: StrategySlotId;
  mode: StrategyMode;
  chain: Chain;
  strategyVersion: string;
  frontend: ActivationManifestFrontend;
  validation: ActivationManifestValidation;
  activationTemplate:
    | {
        mode: "basket";
        templateId: string;
        fundingAssetSymbol: string;
        starterBasketId: string;
        targetAllocations: Array<{
          sleeve: SleeveId;
          targetWeightPct: number;
          assetSymbol?: string;
          basketId?: string;
          venueId?: string;
        }>;
      }
    | {
        mode: "directional";
        templateId: string;
        fundingAssetSymbol: string;
        assetSymbol: string;
        targetDirectionalExpression: {
          view: "conviction_long" | "conviction_short" | "hedged_view";
          assetSymbol: string;
          grossExposurePct: number;
          netExposurePct: number;
          targetLtvPct: number | null;
        };
      };
  fallback: {
    previousIncumbentId: string | null;
    disableConditions: string[];
  };
}
