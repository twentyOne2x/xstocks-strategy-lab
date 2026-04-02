import type {
  OnboardingAnswers as SharedOnboardingAnswers,
  Recommendation as SharedRecommendation,
  UserProfile as SharedUserProfile,
} from "@/lib/shared-contract-types";

export type StrategyMode = "basket" | "directional";

export type QualificationModePreference =
  | StrategyMode
  | "not_sure_yet";

export type DiscoveryScopeType =
  | "theme"
  | "hero_asset"
  | "public_strategy";

export type UserVisibleState =
  | "explore"
  | "view_ready"
  | "connect_required"
  | "funding_required"
  | "activation_ready"
  | "active"
  | "paused"
  | "blocked";

export type RouteId =
  | "home"
  | "onboarding"
  | "comparison"
  | "detail"
  | "activation"
  | "activity";

export type BadgeTone =
  | "validated"
  | "current"
  | "methodology"
  | "accent"
  | "warning"
  | "positive"
  | "neutral";

export interface MethodologyBadge {
  label: string;
  detail: string;
  tone: BadgeTone;
}

export interface ThemeSummary {
  id: string;
  title: string;
  stance: string;
  description: string;
  leadSymbols: string[];
  manifestSlugs: string[];
}

export interface PublicStrategyCardData {
  id: string;
  manifestSlug: string;
  title: string;
  summary: string;
  mode: StrategyMode;
  convictionLabel: string;
  audience: string;
  riskLabel: string;
  promotedAt: string;
  themeTitle: string;
}

export interface StateStripItem {
  label: string;
  value: string;
  delta: string;
  status: "up" | "steady" | "attention";
  note: string;
}

export interface MarketDriver {
  label: string;
  value: string;
  tone: "positive" | "neutral" | "warning";
  note: string;
}

export interface MarketIntelligencePrompt {
  label: string;
  prompt: string;
}

export interface RouteState {
  chain: string;
  primaryVenue: string;
  backupVenue: string;
  reserveWindow: string;
  multiplierWindow: string;
  proofOfReserves: string;
  status: string;
}

export interface WalletState {
  state: UserVisibleState;
  accountLabel: string;
  fundingLabel: string;
  permissionSummary: string;
}

export interface VaultState {
  venue: string;
  structure: string;
  borrowAsset: string;
  reversibility: string;
  status: string;
}

export interface MarketIntelligencePanelData {
  scopeLabel: string;
  currentView: string;
  confidence: string;
  horizon: string;
  implication: string;
  whatChanged: string[];
  promptQueue: MarketIntelligencePrompt[];
  drivers: MarketDriver[];
  routeState: RouteState;
  walletState: WalletState;
  vaultState: VaultState;
  actions: string[];
}

export interface ReplaySnapshot {
  startingCapital: number;
  endingCapital: number;
  netReturnPct: number;
  maxDrawdownPct: number;
  turnoverPct: number;
  winRatePct: number;
  monthlyEdgePct: number;
  points?: ReplayPoint[];
}

export interface ComparisonEntry {
  label: string;
  mode: StrategyMode;
  posture: string;
  whyItWon: string;
  endingValue: number;
  alphaPct: number;
  drawdownPct: number;
  score: number;
  riskLabel: string;
  href: string;
}

export interface AllocationRow {
  symbol: string;
  targetWeight: string;
  sleeve: string;
  venue: string;
  multiplier: string;
  proofOfReserves: string;
  rationale: string;
}

export interface ManifestHoldingRationale {
  symbol: string;
  sleeve: string;
  rationale: string;
}

export type PortfolioExplanationComponentKind =
  | "asset"
  | "basket"
  | "cash_buffer"
  | "core_holding"
  | "yield_buffer"
  | "directional_expression";

export interface PortfolioExplanationComponent {
  componentId: string;
  kind: PortfolioExplanationComponentKind;
  sleeve: string;
  title: string;
  rationale: string;
  targetWeightPct: number | null;
  grossExposurePct: number | null;
  assetSymbol: string | null;
  basketId: string | null;
  venueId: string | null;
}

export interface PortfolioExplanationBundle {
  whatThisPortfolioDoes: string;
  howItIsBuilt: string;
  howItChanges: string;
  whatWouldTriggerNextRebalance: string;
  howToReadReplay: string;
  bestFor: string;
  components: PortfolioExplanationComponent[];
}

export interface BasketReasonCode {
  code: string;
  kind: string;
  value: string | null;
  label: string;
}

export interface BasketTargetWeight {
  rank: number;
  symbol: string;
  assetName: string;
  targetWeightPct: number;
}

export interface BasketBenchmarkDelta {
  benchmarkId: string | null;
  returnAnnPct: number;
  benchmarkReturnAnnPct: number;
  afterCostReturnAnnPct: number;
  benchmarkAfterCostReturnAnnPct: number;
  excessReturnAfterCostPct: number;
  score: number;
  deltaVsIncumbent: number | null;
}

export interface BasketPortfolioMetrics {
  constituentCount: number;
  concentrationPct: number | null;
  concentrationCapPct: number | null;
  turnoverAnnPct: number | null;
  costsTotalBps: number | null;
}

export interface BasketSummarySurface {
  construction: string;
  benchmark: string;
  rebalance: string;
}

export interface BasketExplanationBundle {
  truthMode: string;
  incumbentState: string;
  reasonCodes: BasketReasonCode[];
  targetWeights: BasketTargetWeight[];
  cashWeightPct: number;
  rebalanceThresholdBps: number;
  rebalanceThresholdPct: number;
  benchmarkDelta: BasketBenchmarkDelta;
  portfolioMetrics: BasketPortfolioMetrics;
  summaries: BasketSummarySurface;
}

export interface BasketTuningKnob {
  knobId: string;
  label: string;
  currentValue: string | null;
  tuningImpact: string;
}

export interface BasketTuningSummary {
  headline: string;
  currentKnobs: BasketTuningKnob[];
  watchpoints: string[];
}

export interface RebalanceAutomationTruth {
  operatorManualRequired: boolean;
  autonomousExecutionProven: boolean;
  providerTriggeredProven: boolean;
  supportedTriggerSources: Array<
    "operator_manual" | "scheduled_cron" | "policy_event" | "provider_triggered"
  >;
  notes: string[];
}

export interface RebalanceNextAction {
  title: string;
  detail: string;
  status: string;
}

export interface RouteTruthView {
  routeId: string;
  label: string;
  routeKind: string;
  chain?: string;
  verificationTier: string;
  truthState: string;
  availability: string;
  requiredFor: string;
  reason: string;
}

export interface ExecutionPreviewView {
  surfaceTruth: string;
  executionState: string;
  executionEligibility: string;
  routeTruthLabels: RouteTruthView[];
  blockers: string[];
  warnings: string[];
}

export interface RebalanceOrchestrationView {
  rebalanceId: string;
  slotId: string;
  chain: string;
  targetManifestId: string;
  state:
    | "preview_only"
    | "rebalance_recommended"
    | "rebalance_deferred"
    | "scheduled"
    | "awaiting_operator"
    | "executing"
    | "rebalanced"
    | "blocked"
    | "paused"
    | "failed";
  runtimeOwner: "operator_manual" | "worker_offchain_scheduler";
  triggerSource:
    | "operator_manual"
    | "scheduled_cron"
    | "policy_event"
    | "provider_triggered";
  summary: string;
  rationale: string;
  scheduledFor: string | null;
  recommendationState: string;
  executionState: string;
  executionEligibility: string;
  surfaceTruth: string;
  providerReceiptId: string | null;
  executionRequestId: string | null;
  executionTriggerSource: string | null;
  executionRequestState: string | null;
  blockers: string[];
  warnings: string[];
  automationTruth: RebalanceAutomationTruth;
  nextAction: RebalanceNextAction | null;
}

export interface ManifestExplanation {
  thesis: string;
  whatThisDoes: string;
  bestForUser: string;
  howItChanges: string;
  replayInterpretation: string;
  holdingRationales: ManifestHoldingRationale[];
  bundle: PortfolioExplanationBundle;
}

export interface ValidationSummary {
  dataset_version: string;
  evaluator_version: string;
  objective_id: string;
  score: number;
  delta_vs_incumbent: number;
  promoted_at: string;
  last_validated_at: string;
}

export interface ActivationTemplate {
  route_summary: string;
  allowed_actions: string[];
  funding_options: string[];
  rails: string[];
  reversible: boolean;
  required_state: UserVisibleState;
}

export interface PromotedManifest {
  manifest_id: string;
  slot_id: string;
  mode: StrategyMode;
  chain: string;
  strategy_version: string;
  theme_id: string;
  slug: string;
  hero_symbol: string;
  frontend: {
    title: string;
    subtitle: string;
    risk_label: string;
    summary: string;
    thesis: string;
    badges: MethodologyBadge[];
  };
  validation: ValidationSummary;
  activation_template: ActivationTemplate;
  fallback: {
    previous_incumbent_id: string | null;
    disable_conditions: string[];
  };
  market_intelligence: MarketIntelligencePanelData;
  explanation: ManifestExplanation;
  explanationBundle?: BasketExplanationBundle | null;
  tuningSummary?: BasketTuningSummary | null;
  replay: ReplaySnapshot;
  comparison: ComparisonEntry[];
  allocations: AllocationRow[];
  route_notes: string[];
  methodology_notes: string[];
  live_state: {
    state: UserVisibleState;
    routeLabel: string;
    routeSummary: string;
    reserveLabel: string;
    multiplierLabel: string;
    proofOfReservesLabel: string;
    pauseRule: string;
  };
  preview?: {
    recommendationExplanationBundle: PortfolioExplanationBundle | null;
    rebalanceOrchestration: RebalanceOrchestrationView | null;
    executionPreview: ExecutionPreviewView | null;
  };
}

export interface PositionRow {
  id: string;
  symbol: string;
  sleeve: string;
  mode: StrategyMode;
  exposureUsd: string;
  pnlPct: string;
  route: string;
  nextRebalance: string;
  state: "active" | "paused" | "watch";
  updatedAt: string;
}

export interface HistoryRow {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  venue: string;
  amount: string;
  status: "settled" | "pending" | "blocked";
}

export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  state: UserVisibleState;
  nextAction: string;
}

export type RebalanceState = "act" | "consider" | "monitor" | "none";

export interface RebalanceRow {
  id: string;
  manifestSlug: string;
  strategyTitle: string;
  window: string;
  trigger: string;
  action: string;
  route: string;
  impact: string;
  state: RebalanceState;
}

export interface BlotterData {
  positions: PositionRow[];
  history: HistoryRow[];
  activity: ActivityEvent[];
  rebalancing: RebalanceRow[];
}

export interface DiscoverySelection {
  type: DiscoveryScopeType;
  key: string;
}

export interface QualificationPreference {
  modePreference?: QualificationModePreference;
  selection?: DiscoverySelection;
  fundingState?: Extract<
    UserVisibleState,
    "view_ready" | "connect_required" | "funding_required" | "activation_ready"
  >;
  directionalOptIn?: boolean;
  yieldBufferAllowed?: boolean;
  fitNote: string;
}

/* ── Onboarding Qualification Types (canonical from brief) ── */

export type GoalPreference = "broad_exposure" | "theme_tilt" | "leaders" | "unsure";
export type ThemePreference = "broad_market" | "tech_ai" | "consumer_platforms" | "quality_cashflow" | "cross_market_leaders" | "unsure";
export type ExpressionPreference = "simple" | "tilted" | "active" | "unsure";
export type RiskLevel = "low" | "medium" | "high" | "unsure";
export type DrawdownSensitivity = "high" | "medium" | "low" | "unset";
export type RebalancePreference = "low_touch" | "scheduled" | "active" | "unsure";
export type StrategyAppetite = "long_only" | "adaptive" | "directional" | "unsure";
export type AutomationComfort = "low" | "medium" | "high" | "unsure";
export type CertaintyLevel = "high" | "medium" | "low";
export type UncertaintyPath = "none" | "some_answers_unsure" | "exploring" | "default_requested";

export type ContradictionFlag =
  | "risk_drawdown_mismatch"
  | "leaders_simple_mismatch"
  | "active_low_touch_mismatch"
  | "directional_low_automation_mismatch"
  | "directional_low_certainty_mismatch"
  | "theme_missing_mismatch";

export type StrategySlotId =
  | "onboarding.default_basket"
  | "onboarding.alt_basket_1"
  | "onboarding.alt_basket_2"
  | "advanced.default_directional";

export type RebalanceCadence = "monthly_threshold" | "biweekly" | "weekly" | "weekly_plus_event";
export type ActivityLevel = "low" | "medium" | "high";
export type PortfolioBreadth = "broad" | "focused" | "concentrated";

export interface OnboardingProfile {
  profile_version: "xstocks_onboarding_v1";
  chain: "ethereum_mainnet";
  goal_preference: GoalPreference;
  theme_preference: ThemePreference;
  expression_preference: ExpressionPreference;
  risk_level: RiskLevel;
  rebalance_preference: RebalancePreference;
  strategy_appetite: StrategyAppetite;
  automation_comfort: AutomationComfort;
  certainty_level: CertaintyLevel;
  uncertainty_path: UncertaintyPath;
  drawdown_sensitivity: DrawdownSensitivity;
  volatility_tolerance: "low" | "medium" | "high" | "unset";
  not_sure_count: number;
  contradiction_flags: ContradictionFlag[];
  resolved: {
    goal_preference: "broad_exposure" | "theme_tilt" | "leaders";
    theme_preference: "broad_market" | "tech_ai" | "consumer_platforms" | "quality_cashflow" | "cross_market_leaders";
    risk_level: "low" | "medium" | "high";
    rebalance_band: "low" | "medium" | "high";
    expression_band: "simple" | "tilted" | "active";
    strategy_appetite: "long_only" | "adaptive" | "directional";
    safe_fallback_applied: boolean;
    directional_eligible: boolean;
  };
  recommendation_confidence: "high" | "medium" | "low";
}

export interface StrategyRecommendation {
  mode_id: StrategySlotId;
  title: string;
  chain: "ethereum_mainnet";
  stance: "long_only" | "directional";
  theme_used: ThemePreference;
  risk_band: "low" | "medium" | "high";
  rebalance_cadence: RebalanceCadence;
  activity_level: ActivityLevel;
  portfolio_shape: {
    breadth: PortfolioBreadth;
    holdings_min: number;
    holdings_max: number;
    max_single_name_weight_pct: number;
  };
  why_recommended: string[];
  expected_behavior: string[];
  confidence: "high" | "medium" | "low";
  safe_fallback_applied: boolean;
  blocked_paths: StrategySlotId[];
  preview_defaults: {
    center_view: "behavior_path";
    blotter_tab: "positions";
    right_panel_cards: string[];
  };
  deposit_cta: {
    primary_label: string;
    secondary_label: string;
    helper_text: string;
  };
  behavior_chips: string[];
}

/* ── Onboarding Question Types ── */

export interface OnboardingQuestionOption {
  id: string;
  label: string;
  helper?: string;
  description: string;
  manifestSlugs: string[];
  qualification: QualificationPreference;
}

export interface OnboardingQuestion {
  id: string;
  screenIndex: number;
  conditional?: boolean;
  triggeredByQuestionId?: string;
  triggeredByOptionIds?: string[];
  prompt: string;
  helper: string;
  options: OnboardingQuestionOption[];
}

export interface QualificationCheck {
  label: string;
  status: "ready" | "monitor" | "gated";
  detail: string;
}

export interface QualificationSummary {
  recommendedManifestSlug: string;
  qualifiedMode: StrategyMode;
  readinessState: UserVisibleState;
  headline: string;
  summary: string;
  nextStepLabel: string;
  nextStepHref: string;
  fitNotes: string[];
  checks: QualificationCheck[];
  sharedAnswers: {
    preferredChain: string;
    modePreference: QualificationModePreference;
    selectionLabel: string;
    selectedStarterSlotId: string;
    directionalOptIn: boolean;
  };
  sharedProfile: {
    activeSlotId: string;
    directionalAllowed: boolean;
    yieldBufferAllowed: boolean;
    fundingState: UserVisibleState;
  };
}

export interface StructuredObjectRow {
  label: string;
  value: string;
  note?: string;
}

export interface QualificationFlowResult {
  recommendedManifestSlug: string;
  qualifiedMode: StrategyMode;
  readinessState: UserVisibleState;
  headline: string;
  summary: string;
  whyRecommended: string[];
  previewLabel: string;
  depositCtaLabel: string;
  nextStepLabel: string;
  nextStepHref: string;
  fitNotes: string[];
  optimizationMethod: {
    label: string;
    pillLabel: string;
    summary: string;
    details: string[];
  };
  checks: QualificationCheck[];
  profileRows: StructuredObjectRow[];
  recommendationRows: StructuredObjectRow[];
  answersContract: SharedOnboardingAnswers;
  profileContract: SharedUserProfile;
  recommendationContract: SharedRecommendation;
}

export interface ModeEntryCard {
  title: string;
  description: string;
  href: string;
  stats: string[];
}

export interface SmartAccountActionLink {
  label: string;
  href: string;
  tone: "primary" | "secondary" | "ghost";
}

export interface SmartAccountPermissionRow {
  label: string;
  value: string;
  note: string;
}

export interface SmartAccountSurfaceRow {
  label: string;
  value: string;
  note: string;
}

export interface SmartAccountPanelData {
  readinessLabel: string;
  readinessState: UserVisibleState;
  addressLabel: string;
  ownerLabel: string;
  fundingAsset: string;
  buyingPower: string;
  policyLabel: string;
  syncLabel: string;
  automationLabel: string;
  nextAction: string;
  accountSurfaces: SmartAccountSurfaceRow[];
  actionLinks: SmartAccountActionLink[];
  permissions: SmartAccountPermissionRow[];
}

export interface ReplayPoint {
  label: string;
  value: number;
}

export interface WorkspaceSpotlightData {
  points: ReplayPoint[];
  rebalance: RebalanceRow;
}

export interface ManifestContractSnapshot {
  slotId: string;
  truthState: string;
  sourceId: string;
  fundingAsset: string;
  actionCount: number;
  venueId: string;
}

export interface TerminalChromeProps {
  currentRoute: RouteId;
  stateStrip: StateStripItem[];
  themes: ThemeSummary[];
  publicStrategies: PublicStrategyCardData[];
  promotedWinners: PromotedManifest[];
  selectedManifest: PromotedManifest;
  blotter: BlotterData;
}

export interface HomeTerminalProps {
  featuredManifest: PromotedManifest;
  highlightedTheme: ThemeSummary;
  modeEntries: ModeEntryCard[];
  blotter: BlotterData;
}

export interface OnboardingQuestionFlowProps {
  questions: OnboardingQuestion[];
  recommendedStrategies: PublicStrategyCardData[];
  answers: Record<string, string>;
  qualification: QualificationFlowResult;
  recommendedStrategy: PublicStrategyCardData;
  recommendedManifest: PromotedManifest;
  onAnswer: (questionId: string, optionId: string) => void;
  onBack: () => void;
  onReset: () => void;
}

export interface ComparisonWorkspaceProps {
  focusManifest: PromotedManifest;
  blotter: BlotterData;
}

export interface DetailScreenProps {
  manifest: PromotedManifest;
  blotter: BlotterData;
}

export interface ActivationScreenProps {
  manifest: PromotedManifest;
}

export interface ActivityWorkspaceProps {
  manifest: PromotedManifest;
  blotter: BlotterData;
}
