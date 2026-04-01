/**
 * API client for the xStocks API (apps/api).
 * All functions are async and return typed responses.
 * Falls back gracefully on network/parse errors.
 */

/**
 * Resolves the API base URL.
 * - Uses NEXT_PUBLIC_API_URL if set.
 * - Falls back to localhost:3001 only in development/test.
 * - Throws in production if NEXT_PUBLIC_API_URL is missing.
 */
export function resolveApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit;

  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test";

  if (isDev) return "http://localhost:3001";

  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. " +
      "In production, the API base URL must be configured explicitly. " +
      "Localhost fallback is only allowed in development.",
  );
}

/* ── Raw Response Types ── */

export interface ApiManifestFrontend {
  title: string;
  subtitle: string;
  riskLabel: string;
  summary: string;
  badges: Array<string | { kind: string; label: string }>;
}

export interface ApiManifestHoldingRationale {
  symbol: string;
  sleeve: string;
  rationale: string;
}

export interface ApiBasketReasonCode {
  code: string;
  kind: string;
  value: string | null;
  label: string;
}

export interface ApiBasketTargetWeight {
  rank: number;
  symbol: string;
  assetName: string;
  targetWeightPct: number;
}

export interface ApiBasketBenchmarkDelta {
  benchmarkId: string | null;
  returnAnnPct: number;
  benchmarkReturnAnnPct: number;
  afterCostReturnAnnPct: number;
  benchmarkAfterCostReturnAnnPct: number;
  excessReturnAfterCostPct: number;
  score: number;
  deltaVsIncumbent: number | null;
}

export interface ApiBasketPortfolioMetrics {
  constituentCount: number;
  concentrationPct: number | null;
  concentrationCapPct: number | null;
  turnoverAnnPct: number | null;
  costsTotalBps: number | null;
}

export interface ApiBasketExplanationBundle {
  truthMode: string;
  incumbentState: string;
  reasonCodes: ApiBasketReasonCode[];
  targetWeights: ApiBasketTargetWeight[];
  cashWeightPct: number;
  rebalanceThresholdBps: number;
  rebalanceThresholdPct: number;
  benchmarkDelta: ApiBasketBenchmarkDelta;
  portfolioMetrics: ApiBasketPortfolioMetrics;
  summaries: {
    construction: string;
    benchmark: string;
    rebalance: string;
  };
}

export interface ApiBasketTuningKnob {
  knobId: string;
  label: string;
  currentValue: string | null;
  tuningImpact: string;
}

export interface ApiBasketTuningSummary {
  headline: string;
  currentKnobs: ApiBasketTuningKnob[];
  watchpoints: string[];
}

export interface ApiPortfolioExplanationComponent {
  componentId: string;
  kind:
    | "asset"
    | "basket"
    | "cash_buffer"
    | "core_holding"
    | "yield_buffer"
    | "directional_expression";
  sleeve: string;
  title: string;
  rationale: string;
  targetWeightPct: number | null;
  grossExposurePct: number | null;
  assetSymbol: string | null;
  basketId: string | null;
  venueId: string | null;
}

export interface ApiPortfolioExplanationBundle {
  whatThisPortfolioDoes: string;
  howItIsBuilt: string;
  howItChanges: string;
  whatWouldTriggerNextRebalance: string;
  howToReadReplay: string;
  bestFor: string;
  components: ApiPortfolioExplanationComponent[];
}

export interface ApiManifestExplanation {
  thesis: string;
  whatThisDoes: string;
  bestForUser: string;
  howItChanges: string;
  replayInterpretation: string;
  holdingRationales: ApiManifestHoldingRationale[];
  bundle: ApiPortfolioExplanationBundle;
}

export interface ApiManifestValidation {
  datasetVersion: string;
  evaluatorVersion: string;
  objectiveId: string;
  score: number;
  deltaVsIncumbent: number | null;
  promotedAt: string;
}

export interface ApiManifestReplayPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ApiManifestReplay {
  startingCapital: number;
  endingCapital: number;
  netReturnPct: number;
  maxDrawdownPct: number;
  turnoverPct: number;
  winRatePct: number;
  points: ApiManifestReplayPoint[];
}

export interface ApiManifestMarketDriver {
  label: string;
  value: string;
  tone: "positive" | "neutral" | "warning";
  note: string;
}

export interface ApiManifestMarketIntelligence {
  currentView: string;
  horizon: string;
  whatChanged: string[];
  drivers: ApiManifestMarketDriver[];
}

export interface ApiManifestView {
  manifestId: string;
  slotId: string;
  mode: "basket" | "directional";
  chain: string;
  strategyVersion: string;
  promoted: true;
  source: { type: string; manifestId: string; slotId: string };
  frontend: ApiManifestFrontend;
  explanation: ApiManifestExplanation;
  explanationBundle: ApiBasketExplanationBundle | null;
  tuningSummary: ApiBasketTuningSummary | null;
  replay: ApiManifestReplay | null;
  marketIntelligence: ApiManifestMarketIntelligence | null;
  validation: ApiManifestValidation;
  fallback: { previousIncumbentId: string | null; disableConditions: string[] };
  activationTemplate: {
    mode: string;
    templateId: string;
    fundingAssetSymbol: string;
    starterBasketId?: string;
    assetSymbol?: string;
  };
  requiredAssets: string[];
  requiredRoutes: Array<{ routeId: string; label: string; routeKind: string; requiredFor: string }>;
  walletRequirements: {
    requiresWallet: boolean;
    requiresSmartAccount: boolean;
    minFundingUsd: number;
    preferredFundingProvider: string;
    topUpAsset: string;
    manualSigningMode: string;
    automationAccountMode: string;
    venueSigningMode: string;
    supportsSeparateExecutionDestination: boolean;
  };
  signalRefs: Array<{ signalId: string; scopeType: string; scopeKey: string }>;
  targetAllocations: Array<{
    sleeve: string;
    targetWeightPct: number;
    assetSymbol?: string;
    basketId?: string;
    venueId?: string;
  }>;
  targetDirectionalExpression: {
    view: string;
    assetSymbol: string;
    grossExposurePct: number;
    netExposurePct: number;
    targetLtvPct: number | null;
  } | null;
  routeValidation: {
    executionEligibility: string;
    surfaceTruth: string;
    routeTruthLabels: ApiRouteTruthLabel[];
    proofNotes: string[];
    validationBadges: string[];
  } | null;
  permissions: { allowPause: boolean; allowTurnOff: boolean };
  legacyFallback: boolean;
}

export interface ApiRouteTruthLabel {
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

export interface ApiSlot {
  slotId: string;
  mode: string;
  chain: string;
  surface: string;
  position: number;
  title: string;
  description: string;
  starterBasketId?: string;
  assetSymbol?: string;
}

export interface ApiCatalogItem {
  slot: ApiSlot;
  manifest: ApiManifestView;
  defaultRequestedNotionalUsd: number;
  targetSummary: {
    fundingAssetSymbol: string;
    allocationCount: number;
    requiredAssetCount: number;
    leadAssets: string[];
  };
  executionPreview: ApiExecutionPreview;
}

export interface ApiExecutionPreview {
  surfaceTruth: string;
  executionState: string;
  executionEligibility: string;
  routeTruthLabels: ApiRouteTruthLabel[];
  blockers: string[];
  warnings: string[];
}

export interface ApiTargetAllocationPreview {
  allocationId: string;
  sleeve: string;
  assetSymbol?: string;
  basketId?: string;
  venueId?: string;
  targetWeightPct: number;
  targetNotionalUsd: number;
  liveAsset: { status: string; priceUsd: number | null; proofOfReserves: string | null } | null;
}

export interface ApiLiveAsset {
  assetSymbol: string;
  chain: string;
  status: string;
  priceUsd: number | null;
  proofOfReserves?: string | null;
  notes?: string[];
}

export interface ApiLiveRoute {
  routeId: string;
  label: string;
  routeKind: string;
  chain: string;
  verificationTier: string;
  availability: string;
  notes: string;
}

export interface ApiLiveState {
  liveXStocksState: { stateVersion: string; asOf: string; assets: ApiLiveAsset[] };
  liveRouteState: { stateVersion: string; asOf: string; routes: ApiLiveRoute[] };
}

export interface ApiActivitySummary {
  activationCount: number;
  eventCount: number;
  latestActivationId: string | null;
  latestActivationStatus: string | null;
  latestEventId: string | null;
  latestEventType: string | null;
  latestEventAt: string | null;
  nextAction: { title: string; detail: string; status: string } | null;
}

export interface ApiWorkspaceData {
  version: string;
  generatedAt: string;
  slot: ApiSlot;
  manifest: ApiManifestView;
  workspace: {
    requestedNotionalUsd: number;
    fundingAssetSymbol: string;
    targetAllocations: ApiTargetAllocationPreview[];
    targetDirectionalExpression: unknown | null;
    cashOrYieldBufferTarget: unknown | null;
    recommendation: ApiRecommendation;
    executionPlanPreview: ApiExecutionPreview;
    liveState: ApiLiveState;
    rebalanceOrchestration: ApiRebalanceOrchestration;
    activitySummary: ApiActivitySummary;
  };
}

export interface ApiExecutionPlan {
  executionPlanId: string;
  generatedAt: string;
  surfaceTruth: string;
  executionState: string;
  executionEligibility: string;
  requestedNotionalUsd: number;
  walletConnectionLate: boolean;
  routeTruthLabels: ApiRouteTruthLabel[];
  assetChecks: Array<{ assetSymbol: string; truthState: string; status: string; reason: string }>;
  fundingPath: {
    provider: string;
    minRequiredUsd: number;
    fundedNotionalUsd: number;
    fundingGapUsd: number;
    topUpAsset: string;
    destinationAddress: string | null;
    destinationKind: string;
    readiness: string;
    recommendedMethodId: string | null;
    surfaces: Array<{
      methodId: string;
      providerId: string;
      kind: string;
      status: string;
      destinationAddress: string | null;
      assetSymbol: string;
      notes: string[];
    }>;
    status: string;
  };
  smartAccount: {
    readiness: string;
    automationReadiness: string;
    providerId: string;
    status: string;
    address: string | null;
    manualSigningMode: string;
    automationAccountMode: string;
    venueSigningMode: string;
    bridgeState: {
      manualSignerAddress: string | null;
      manualSignerKind: string;
      policyAccountAddress: string | null;
      executionDestinationAddress: string | null;
      executionDestinationKind: string;
      supportsSeparateExecutionDestination: boolean;
      manualSigningMode: string;
      automationAccountMode: string;
      venueSigningMode: string;
      notes: string[];
    };
    bootstrap: {
      state: string;
      chain: string;
      implementation: string;
      signerAddress: string | null;
      embeddedWalletAddress: string | null;
      smartAccountAddress: string | null;
      destinationAddress: string | null;
      approvalMode: string;
      paymasterReady: boolean;
      notes: string[];
    };
    reviewArtifact: {
      providerId: string;
      providerName: string;
      supportedChains: string[];
      permissions: string[];
      approvalMode: string;
      bootstrapBoundary: string;
      fundingBoundary: string;
      walletConnectionLate: boolean;
      notes: string[];
    };
  };
  automationExecution: {
    accountMode: string;
    readiness: string;
    status: string;
    manualSigningMode: string;
    venueSigningMode: string;
    policyAccountAddress: string | null;
    executionDestinationAddress: string | null;
    blockers: string[];
    notes: string[];
  };
  steps: Array<{ stepId: string; title: string; status: string; detail: string }>;
  allowedActions: string[];
  blockers: string[];
  warnings: string[];
}

export interface ApiActivationPreviewData {
  version: string;
  generatedAt: string;
  slot: ApiSlot;
  manifest: ApiManifestView;
  requestedNotionalUsd: number;
  recommendation: ApiRecommendation;
  executionPlan: ApiExecutionPlan;
  liveState: ApiLiveState;
  rebalanceOrchestration: ApiRebalanceOrchestration;
  latestActivation: unknown | null;
}

export interface ApiActivityPosition {
  positionId: string;
  assetSymbol: string;
  sleeve: string;
  targetWeightPct: number;
  targetNotionalUsd: number;
  venueId: string | null;
  priceUsd: number | null;
  status: string;
  updatedAt: string;
}

export interface ApiActivityHistoryItem {
  id: string;
  occurredAt: string;
  type: string;
  summary: string;
  status: string;
}

export interface ApiActivityLifecycleItem {
  id: string;
  occurredAt: string;
  title: string;
  detail: string;
  state: string;
  nextAction: string | null;
}

export interface ApiActivitySurface {
  source: string;
  currentState: {
    surfaceTruth: string | null;
    executionState: string | null;
    pauseAvailable: boolean;
    turnOffAvailable: boolean;
  };
  positions: ApiActivityPosition[];
  history: ApiActivityHistoryItem[];
  lifecycle: ApiActivityLifecycleItem[];
  nextAction: { title: string; detail: string; status: string } | null;
}

export interface ApiActivityData {
  version: string;
  generatedAt: string;
  limit: number;
  manifest: ApiManifestView | null;
  slot: ApiSlot | null;
  items: unknown[];
  activations: unknown[];
  rebalanceOrchestration: ApiRebalanceOrchestration | null;
  rebalanceHistory: ApiRebalanceTransition[];
  activitySurface: ApiActivitySurface | null;
}

export interface ApiRecommendation {
  portfolioMode: "basket" | "directional";
  explanationBundle: ApiPortfolioExplanationBundle;
}

export interface ApiRebalanceNextAction {
  title: string;
  detail: string;
  status: string;
}

export interface ApiRebalanceAutomationTruth {
  operatorManualRequired: boolean;
  autonomousExecutionProven: boolean;
  providerTriggeredProven: boolean;
  supportedTriggerSources: Array<
    "operator_manual" | "scheduled_cron" | "policy_event" | "provider_triggered"
  >;
  notes: string[];
}

export interface ApiRebalanceOrchestration {
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
  blockers: string[];
  warnings: string[];
  automationTruth: ApiRebalanceAutomationTruth;
  nextAction: ApiRebalanceNextAction | null;
}

export interface ApiRebalanceTransition {
  transitionId: string;
  eventType: string;
  fromState: string | null;
  toState: string;
  triggerSource: string;
  summary: string;
  rationale: string;
  scheduledFor: string | null;
  occurredAt: string;
}

export interface ApiCatalogData {
  version: string;
  generatedAt: string;
  defaultSlotId: string;
  items: ApiCatalogItem[];
}

/* ── Fetch Functions ── */

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const base = resolveApiBase();
    const isServer = typeof window === "undefined";
    const res = await fetch(`${base}${path}`, isServer ? { next: { revalidate: 30 } } : {});
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export async function fetchCatalog(surface?: string): Promise<ApiCatalogData | null> {
  const qs = surface ? `?surface=${surface}` : "";
  return apiFetch<ApiCatalogData>(`/api/catalog${qs}`);
}

export async function fetchWorkspace(slotId: string, notionalUsd = 10): Promise<ApiWorkspaceData | null> {
  return apiFetch<ApiWorkspaceData>(
    `/api/workspace?slotId=${encodeURIComponent(slotId)}&userNotionalUsd=${notionalUsd}`,
  );
}

export async function fetchActivationPreview(slotId: string, notionalUsd = 10): Promise<ApiActivationPreviewData | null> {
  return apiFetch<ApiActivationPreviewData>(
    `/api/activation-preview?slotId=${encodeURIComponent(slotId)}&userNotionalUsd=${notionalUsd}`,
  );
}

export async function fetchActivity(slotId: string): Promise<ApiActivityData | null> {
  return apiFetch<ApiActivityData>(
    `/api/activity?slotId=${encodeURIComponent(slotId)}`,
  );
}

export async function fetchRecommendation(slotId: string, notionalUsd = 10): Promise<ApiRecommendation | null> {
  return apiFetch<ApiRecommendation>(
    `/api/recommendations?slotId=${encodeURIComponent(slotId)}&userNotionalUsd=${notionalUsd}`,
  );
}
