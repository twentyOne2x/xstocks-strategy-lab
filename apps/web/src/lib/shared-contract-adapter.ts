import type {
  ActivationAction as SharedActivationAction,
  ActivationManifest as SharedActivationManifest,
  ActivationPayload as SharedActivationPayload,
  DiscoverySelection as SharedDiscoverySelection,
  OnboardingAnswers as SharedOnboardingAnswers,
  OnboardingModePreference as SharedOnboardingModePreference,
  Recommendation as SharedRecommendation,
  RailTruthState as SharedRailTruthState,
  SignalArtifact as SharedSignalArtifact,
  SleeveId as SharedSleeveId,
  StrategyMode as SharedStrategyMode,
  StrategySlotId as SharedStrategySlotId,
  UserProfile as SharedUserProfile,
} from "@/lib/shared-contract-types";

import type {
  BlotterData,
  QualificationFlowResult,
  ManifestContractSnapshot,
  OnboardingQuestion,
  PromotedManifest,
  PublicStrategyCardData,
  QualificationModePreference,
  RebalanceRow,
  StrategyMode,
  UserVisibleState,
} from "@/lib/contracts";
import { DEFAULT_STRATEGY_SLOT_ID } from "@/lib/promoted-manifest-identity";

function getSharedSlotId(slotId: string | null | undefined): SharedStrategySlotId {
  if (
    slotId === "onboarding.default_basket" ||
    slotId === "onboarding.alt_basket_1" ||
    slotId === "onboarding.alt_basket_2" ||
    slotId === "advanced.default_directional"
  ) {
    return slotId;
  }

  return DEFAULT_STRATEGY_SLOT_ID;
}

function parseWeightBps(weightLabel: string): number {
  return Math.round(Number.parseFloat(weightLabel) * 100);
}

function toManifestBadgeObject(
  label: string,
  tone: string,
  detail?: string,
) {
  return {
    kind: tone,
    label: detail ? `${label}: ${detail}` : label,
  };
}

function normalizeModePreference(
  mode: QualificationModePreference,
): SharedOnboardingModePreference {
  if (mode === "basket" || mode === "directional") {
    return mode;
  }

  return "not_sure_yet";
}

function toSharedMode(mode: StrategyMode): SharedStrategyMode {
  return mode;
}

function toSharedSelection(
  type: "theme" | "hero_asset" | "public_strategy",
  key: string,
): SharedDiscoverySelection {
  return {
    type,
    key,
  };
}

function toSharedTruthState(
  state: UserVisibleState,
): SharedRailTruthState {
  switch (state) {
    case "blocked":
      return "blocked";
    case "active":
    case "pending":
    case "paused":
    case "settled":
      return "live";
    case "activation_ready":
      return "mentor_confirmed";
    case "connect_required":
    case "funding_required":
    case "view_ready":
    case "explore":
      return "preview";
  }
}

function parseMultiplier(multiplierLabel: string): number | null {
  const match = multiplierLabel.match(/(\d+(?:\.\d+)?)x/);

  if (!match) {
    return null;
  }

  return Number.parseFloat(match[1]);
}

function mapSleeveId(
  symbol: string,
  mode: StrategyMode,
): SharedSleeveId {
  if (mode === "directional") {
    return symbol === "USDC" ? "yield_buffer" : "directional";
  }

  return symbol === "USDC" ? "yield_buffer" : "core_xstocks";
}

function mapActionKind(action: string): SharedActivationAction["kind"] {
  const normalized = action.toLowerCase();

  if (normalized.includes("pause")) {
    return "rebalance";
  }

  if (normalized.includes("fund")) {
    return "approve";
  }

  if (normalized.includes("activate")) {
    return "supply";
  }

  if (normalized.includes("connect")) {
    return "approve";
  }

  return "swap";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fundingAmountForMode(_mode: StrategyMode): number {
  return 10;
}

function buildSignalArtifact(manifest: PromotedManifest): SharedSignalArtifact {
  const confidenceValue = Number.parseInt(
    manifest.market_intelligence.confidence.split("/")[0]?.trim() ?? "65",
    10,
  );
  const stance =
    confidenceValue >= 80
      ? "strong_positive"
      : confidenceValue >= 68
        ? "positive"
        : confidenceValue >= 55
          ? "neutral"
          : "negative";
  const rebalanceUrgency: "none" | "monitor" | "consider" | "act" =
    manifest.live_state.state === "blocked"
      ? "act"
      : manifest.live_state.state === "funding_required"
        ? "consider"
        : manifest.live_state.state === "active"
          ? "monitor"
          : "none";
  const riskRegime =
    manifest.frontend.risk_label === "High"
      ? "risk_on"
      : manifest.frontend.risk_label === "Measured"
        ? "risk_off"
        : "balanced";

  return {
    version: "1",
    chain: "ethereum",
    signalId: `signal_${manifest.slug}`,
    generatedAt: manifest.validation.last_validated_at,
    expiresAt: "2026-04-01T12:00:00Z",
    scopeType: manifest.mode === "basket" ? "basket" : "asset",
    scopeKey: manifest.mode === "basket" ? manifest.theme_id : manifest.hero_symbol,
    stance,
    confidence: Math.min(confidenceValue / 100, 0.99),
    horizon:
      manifest.mode === "directional" ? "tactical" : "swing",
    riskRegime,
    rebalanceUrgency,
    allocatorHint:
      manifest.mode === "directional"
        ? "increase"
        : manifest.live_state.state === "active"
          ? "hold"
          : "park_in_ausd",
    topReasons: manifest.market_intelligence.whatChanged,
    providerSummary: {
      providerCount: 3,
      providers: ["pinned_research_bundle", "market_intelligence", "route_monitor"],
      tags: ["promoted_only", "xstocks", manifest.mode],
    },
  };
}

function buildActivationActions(
  manifest: PromotedManifest,
): SharedActivationAction[] {
  return manifest.activation_template.allowed_actions.map((action, index) => ({
    actionId: `${manifest.slug}_action_${index + 1}`,
    kind: mapActionKind(action),
    venueId: manifest.market_intelligence.routeState.primaryVenue,
    assetSymbol:
      action.toLowerCase().includes("fund") || action.toLowerCase().includes("activate")
        ? "USDC"
        : manifest.hero_symbol,
    amountUsd:
      action.toLowerCase().includes("fund") || action.toLowerCase().includes("activate")
        ? fundingAmountForMode(manifest.mode)
        : undefined,
    summary: action,
  }));
}

function buildActivationManifest(
  manifest: PromotedManifest,
): SharedActivationManifest {
  const slotId = getSharedSlotId(manifest.slot_id);
  const fundingAssetSymbol = "USDC";
  const targetAllocations = manifest.allocations.map((allocation) => ({
    sleeve: mapSleeveId(allocation.symbol, manifest.mode),
    targetWeightPct:
      allocation.symbol === "USDC"
        ? Number.parseFloat(allocation.targetWeight)
        : Math.min(Number.parseFloat(allocation.targetWeight), 100),
    ...(allocation.symbol === "USDC"
      ? {}
      : { assetSymbol: allocation.symbol }),
    ...(allocation.venue.includes("xChange") || allocation.venue.includes("Swap")
      ? { venueId: allocation.venue.split(" / ")[0] }
      : {}),
    ...(manifest.mode === "basket"
      ? { basketId: `${manifest.theme_id}-promoted` }
      : {}),
  }));

  const activationTemplate =
    manifest.mode === "basket"
      ? {
          mode: "basket" as const,
          templateId: `${manifest.slug}_template`,
          fundingAssetSymbol,
          starterBasketId: `${manifest.theme_id}-promoted`,
          targetAllocations,
        }
      : {
          mode: "directional" as const,
          templateId: `${manifest.slug}_template`,
          fundingAssetSymbol,
          assetSymbol: manifest.hero_symbol,
          targetDirectionalExpression: {
            view: "conviction_long" as const,
            assetSymbol: manifest.hero_symbol,
            grossExposurePct: (parseMultiplier(
              manifest.live_state.multiplierLabel,
            ) ?? 1) * 100,
            netExposurePct: 100,
            targetLtvPct: 35,
          },
        };

  return {
    version: "1",
    manifestId: manifest.manifest_id,
    slotId,
    mode: toSharedMode(manifest.mode),
    chain: "ethereum",
    strategyVersion: manifest.strategy_version,
    frontend: {
      title: manifest.frontend.title,
      subtitle: manifest.frontend.subtitle,
      riskLabel: manifest.frontend.risk_label,
      summary: manifest.frontend.summary,
      badges: manifest.frontend.badges.map(
        (badge) => `${badge.label}: ${badge.detail}`,
      ),
    },
    validation: {
      datasetVersion: manifest.validation.dataset_version,
      evaluatorVersion: manifest.validation.evaluator_version,
      objectiveId: manifest.validation.objective_id,
      score: manifest.validation.score,
      deltaVsIncumbent: manifest.validation.delta_vs_incumbent,
      promotedAt: manifest.validation.promoted_at,
    },
    activationTemplate,
    fallback: {
      previousIncumbentId: manifest.fallback.previous_incumbent_id,
      disableConditions: manifest.fallback.disable_conditions,
    },
  };
}

function buildActivationPayload(
  manifest: PromotedManifest,
): SharedActivationPayload {
  const truthState = toSharedTruthState(manifest.live_state.state);
  const hasConnectedWallet =
    manifest.market_intelligence.walletState.state !== "view_ready";
  const slotId = getSharedSlotId(manifest.slot_id);
  const common = {
    version: "1" as const,
    payloadId: `payload_${manifest.slug}`,
    manifestId: manifest.manifest_id,
    chain: "ethereum" as const,
    mode: toSharedMode(manifest.mode),
    fundingAssetSymbol: "USDC",
    fundingAmountUsd: fundingAmountForMode(manifest.mode),
    routeContext: {
      truthState,
      venueId: manifest.market_intelligence.routeState.primaryVenue,
      routeId: `${manifest.slug}_route`,
      quoteExpiresAt: "2026-03-31T18:00:00Z",
    },
    permissions: {
      canPause: manifest.activation_template.allowed_actions.some((action) =>
        action.toLowerCase().includes("pause"),
      ),
      canTurnOff: manifest.activation_template.allowed_actions.some((action) =>
        action.toLowerCase().includes("turn off"),
      ),
      maxSlippageBps: manifest.mode === "directional" ? 85 : 35,
      ...(manifest.mode === "directional" ? { maxLeverage: 1.35 } : {}),
    },
    actions: buildActivationActions(manifest),
  };

  return {
    ...common,
    ...(hasConnectedWallet ? { ownerAddress: "0x4D21...9C7A" } : {}),
    ...(manifest.market_intelligence.walletState.state === "funding_required" ||
    manifest.market_intelligence.walletState.state === "activation_ready" ||
    manifest.market_intelligence.walletState.state === "active" ||
    manifest.market_intelligence.walletState.state === "paused"
      ? { smartAccountAddress: "0xSAfe...4412" }
      : {}),
    source:
      manifest.mode === "basket"
        ? {
            recommendationId: `rec_${slotId}`,
          }
        : {
            directionalPreviewId: `preview_${slotId}`,
          },
  };
}

function buildRecommendationContract(
  manifest: PromotedManifest,
): SharedRecommendation {
  const slotId = getSharedSlotId(manifest.slot_id);
  const truthState = toSharedTruthState(manifest.live_state.state);
  const targetAllocations =
    manifest.mode === "basket"
      ? manifest.allocations.map((allocation) => ({
          sleeve: mapSleeveId(allocation.symbol, manifest.mode),
          asset_symbol: allocation.symbol,
          ...(manifest.mode === "basket"
            ? { basket_id: `${manifest.theme_id}-promoted` }
            : {}),
          ...(allocation.venue.includes("xChange") || allocation.venue.includes("Swap")
            ? { venue_id: allocation.venue.split(" / ")[0] }
            : {}),
          weight_bps: parseWeightBps(allocation.targetWeight),
        }))
      : [];
  const yieldBuffer = manifest.allocations.find(
    (allocation) => allocation.symbol === "USDC",
  );

  return {
    recommendation_id: `rec_${slotId}`,
    slot_id: slotId,
    portfolio_mode: toSharedMode(manifest.mode),
    activation_manifest_ref: {
      manifest_id: manifest.manifest_id,
      slot_id: slotId,
      mode: toSharedMode(manifest.mode),
      chain: "ethereum",
      strategy_version: manifest.strategy_version,
      promoted_at: manifest.validation.promoted_at,
    },
    target_allocations: targetAllocations,
    target_directional_expressions:
      manifest.mode === "directional"
        ? [
            {
              asset_symbol: manifest.hero_symbol,
              stance: "conviction_long",
              notional_share_bps: 10_000,
            },
          ]
        : [],
    cash_or_yield_buffer_target: yieldBuffer
      ? {
          sleeve: "yield_buffer",
          asset_symbol: "USDC",
          weight_bps: parseWeightBps(yieldBuffer.targetWeight),
        }
      : null,
    explanation_summary: manifest.frontend.summary,
    signal_refs: [`signal_${manifest.slug}`],
    rebalance_decision: {
      state: manifest.mode === "directional" ? "full_rebalance" : "monitor",
      reason: manifest.frontend.thesis,
      approval_required: manifest.mode === "directional",
      route_truth_surface: truthState,
    },
    validation_badges: manifest.frontend.badges.map((badge) =>
      toManifestBadgeObject(badge.label, badge.tone, badge.detail),
    ),
    route_truth_labels: [
      {
        route_id: `${manifest.slug}_execution`,
        label: `${manifest.market_intelligence.routeState.primaryVenue} execution`,
        route_kind: "execution",
        chain: "ethereum",
        verification_tier: "public_verified",
        truth_label: truthState,
        availability:
          manifest.live_state.state === "blocked"
            ? "missing"
            : manifest.live_state.state === "active"
              ? "available"
              : "preview_only",
        required_for:
          manifest.mode === "directional" ? "directional" : "core_xstocks",
        reason: manifest.live_state.routeSummary,
      },
      {
        route_id: `${manifest.slug}_vault`,
        label: manifest.market_intelligence.vaultState.venue,
        route_kind: "vault",
        chain: "ethereum",
        verification_tier:
          manifest.mode === "directional"
            ? "mentor_reported"
            : "public_verified",
        truth_label: truthState,
        availability:
          manifest.live_state.state === "blocked"
            ? "missing"
            : "preview_only",
        required_for:
          manifest.mode === "directional" ? "directional" : "yield_buffer",
        reason: manifest.market_intelligence.vaultState.reversibility,
      },
    ],
    user_state:
      manifest.market_intelligence.walletState.state === "view_ready"
        ? "guest"
        : "wallet_linked",
  };
}

function buildContractSnapshot(
  manifest: PromotedManifest,
  activationPayload: SharedActivationPayload,
): ManifestContractSnapshot {
  return {
    slotId: getSharedSlotId(manifest.slot_id),
    truthState: activationPayload.routeContext.truthState,
    sourceId:
      "recommendationId" in activationPayload.source
        ? activationPayload.source.recommendationId ?? "n/a"
        : activationPayload.source.directionalPreviewId ?? "n/a",
    fundingAsset: activationPayload.fundingAssetSymbol,
    actionCount: activationPayload.actions.length,
    venueId: activationPayload.routeContext.venueId,
  };
}

export interface SharedManifestContractBundle {
  activationManifest: SharedActivationManifest;
  activationPayload: SharedActivationPayload;
  signalArtifact: SharedSignalArtifact;
  snapshot: ManifestContractSnapshot;
}

export function buildManifestContractBundle(
  manifest: PromotedManifest,
): SharedManifestContractBundle {
  const signalArtifact = buildSignalArtifact(manifest);
  const activationManifest = buildActivationManifest(manifest);
  const activationPayload = buildActivationPayload(manifest);

  return {
    activationManifest,
    activationPayload,
    signalArtifact,
    snapshot: buildContractSnapshot(manifest, activationPayload),
  };
}

function getSelectedOptions(
  questions: OnboardingQuestion[],
  answers: Record<string, string>,
) {
  return questions.flatMap((question) => {
    const selectedId = answers[question.id];
    const option = question.options.find((candidate) => candidate.id === selectedId);

    return option ? [option] : [];
  });
}

function findLastOption<T>(
  options: T[],
  predicate: (option: T) => boolean,
) {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    const option = options[index];

    if (predicate(option)) {
      return option;
    }
  }

  return undefined;
}

/* ── Qualification Profile Builder ── */

import type {
  OnboardingProfile,
  StrategyRecommendation,
  ContradictionFlag,
  StrategySlotId as LocalStrategySlotId,
  GoalPreference,
  ThemePreference,
  ExpressionPreference,
  RiskLevel,
  DrawdownSensitivity,
  RebalancePreference,
  StrategyAppetite,
  AutomationComfort,
  CertaintyLevel,
  UncertaintyPath,
} from "@/lib/contracts";

const MODE_TITLES: Record<string, string> = {
  "onboarding.default_basket": "Core xStocks Basket",
  "onboarding.alt_basket_1": "Theme Tilt Basket",
  "onboarding.alt_basket_2": "Active Leaders Basket",
  "advanced.default_directional": "Adaptive Market View",
};

const MODE_RIGHT_PANEL: Record<string, string[]> = {
  "onboarding.default_basket": [
    "Why this basket stays broad",
    "What would trigger the next rebalance",
    "Which names are largest today",
  ],
  "onboarding.alt_basket_1": [
    "Why this theme is overweight",
    "Which names are carrying the theme",
    "What would make the basket rotate",
  ],
  "onboarding.alt_basket_2": [
    "Which names entered leadership recently",
    "What fell out of the basket",
    "Why turnover is higher here",
  ],
  "advanced.default_directional": [
    "Current stance",
    "What would change the stance",
    "Why this mode is more advanced",
  ],
};

export function buildOnboardingProfile(answers: Record<string, string>): OnboardingProfile {
  const goal = (answers.q_goal_preference ?? "unsure") as GoalPreference;
  const theme = (answers.q_theme_preference ?? (goal === "broad_exposure" ? "broad_market" : goal === "leaders" ? "cross_market_leaders" : "unsure")) as ThemePreference;
  const expression = (answers.q_expression_preference ?? "unsure") as ExpressionPreference;
  const risk = (answers.q_risk_level ?? "unsure") as RiskLevel;
  const drawdown = (answers.q_drawdown_sensitivity ?? "unset") as DrawdownSensitivity;
  const rebalance = (answers.q_rebalance_preference ?? "unsure") as RebalancePreference;
  const appetite = (answers.q_directional_appetite ?? "unsure") as StrategyAppetite;
  const automation = (answers.q_automation_comfort ?? "unsure") as AutomationComfort;
  const certaintyRaw = answers.q_certainty ?? "low";

  const certaintyLevel: CertaintyLevel = certaintyRaw === "high" ? "high" : certaintyRaw === "medium" ? "medium" : "low";
  const uncertaintyPath: UncertaintyPath =
    certaintyRaw === "default_requested" ? "default_requested"
    : certaintyRaw === "low" || certaintyRaw === "unsure" ? "exploring"
    : [goal, expression, risk, rebalance, appetite, automation].filter((v) => v === "unsure").length > 0 ? "some_answers_unsure"
    : "none";

  const notSureCount = [goal, theme, expression, risk, rebalance, appetite, automation].filter((v) => v === "unsure").length;

  // Contradiction detection
  const contradictions: ContradictionFlag[] = [];
  if (risk === "high" && drawdown === "high") contradictions.push("risk_drawdown_mismatch");
  if (goal === "leaders" && expression === "simple") contradictions.push("leaders_simple_mismatch");
  if (expression === "active" && rebalance === "low_touch") contradictions.push("active_low_touch_mismatch");
  if (appetite === "directional" && automation !== "high") contradictions.push("directional_low_automation_mismatch");
  if (appetite === "directional" && (certaintyLevel === "low" || notSureCount >= 2)) contradictions.push("directional_low_certainty_mismatch");
  if (goal === "theme_tilt" && theme === "unsure") contradictions.push("theme_missing_mismatch");

  // Volatility tolerance from drawdown sensitivity
  const volatilityTolerance = drawdown === "high" ? "low" as const : drawdown === "medium" ? "medium" as const : drawdown === "low" ? "high" as const : "unset" as const;

  // Safe resolution
  const resolvedGoal = goal === "unsure" ? "broad_exposure" as const : goal;
  const resolvedTheme = theme === "unsure" ? "broad_market" as const : theme;
  const resolvedRisk = risk === "unsure" ? (uncertaintyPath === "default_requested" ? "low" as const : "medium" as const) : risk;
  const resolvedRebalance = rebalance === "unsure" ? "medium" as const : rebalance === "low_touch" ? "low" as const : rebalance === "active" ? "high" as const : "medium" as const;
  const resolvedExpression = expression === "unsure" ? (certaintyLevel === "low" || uncertaintyPath === "default_requested" ? "simple" as const : "tilted" as const) : expression;
  const resolvedAppetite = appetite === "unsure" ? "long_only" as const : appetite;

  // Directional eligibility hard gate
  const directionalEligible =
    appetite === "directional" &&
    automation === "high" &&
    expression === "active" &&
    rebalance === "active" &&
    certaintyLevel === "high" &&
    (risk === "medium" || risk === "high") &&
    drawdown !== "high" &&
    notSureCount <= 1 &&
    !contradictions.some((f) => f === "directional_low_automation_mismatch" || f === "directional_low_certainty_mismatch");

  const safeFallbackApplied = uncertaintyPath === "default_requested" || notSureCount >= 3 || contradictions.length >= 2;

  const confidence = safeFallbackApplied ? "low" as const : notSureCount >= 2 || certaintyLevel === "low" ? "low" as const : certaintyLevel === "medium" || notSureCount === 1 ? "medium" as const : "high" as const;

  return {
    profile_version: "xstocks_onboarding_v1",
    chain: "ethereum_mainnet",
    goal_preference: goal,
    theme_preference: theme,
    expression_preference: expression,
    risk_level: risk,
    rebalance_preference: rebalance,
    strategy_appetite: appetite,
    automation_comfort: automation,
    certainty_level: certaintyLevel,
    uncertainty_path: uncertaintyPath,
    drawdown_sensitivity: drawdown,
    volatility_tolerance: volatilityTolerance,
    not_sure_count: notSureCount,
    contradiction_flags: contradictions,
    resolved: {
      goal_preference: resolvedGoal,
      theme_preference: resolvedTheme,
      risk_level: resolvedRisk,
      rebalance_band: resolvedRebalance,
      expression_band: resolvedExpression,
      strategy_appetite: resolvedAppetite,
      safe_fallback_applied: safeFallbackApplied,
      directional_eligible: directionalEligible,
    },
    recommendation_confidence: confidence,
  };
}

function buildStrategyRecommendationForResolvedMode(
  profile: OnboardingProfile,
  modeId: LocalStrategySlotId,
): StrategyRecommendation {
  const title = MODE_TITLES[modeId] ?? "Core xStocks Basket";
  const isDirectional = modeId === "advanced.default_directional";

  // Build why-recommended lines
  const why: string[] = [];
  if (profile.goal_preference === "broad_exposure") why.push("You chose broad xStocks exposure.");
  else if (profile.goal_preference === "theme_tilt") why.push("You wanted a clear equity theme.");
  else if (profile.goal_preference === "leaders") why.push("You chose highest-conviction leaders.");
  else why.push("You left the goal open, so this preview stays broad.");

  if (profile.resolved.expression_band === "simple") why.push("You preferred a simpler, easier-to-track setup.");
  if (profile.resolved.strategy_appetite === "long_only") why.push("You wanted the strategy to stay long and rotate within xStocks.");
  if (profile.resolved.safe_fallback_applied) why.push("We kept this broader because you were still exploring.");
  if (isDirectional) why.push("You explicitly opted into stance changes when conditions shift.");

  // Portfolio shape
  const shape = isDirectional
    ? { breadth: "concentrated" as const, holdings_min: 4, holdings_max: 8, max_single_name_weight_pct: 50 }
    : modeId === "onboarding.alt_basket_2"
    ? { breadth: "concentrated" as const, holdings_min: 6, holdings_max: 10, max_single_name_weight_pct: 35 }
    : modeId === "onboarding.alt_basket_1"
    ? { breadth: "focused" as const, holdings_min: 8, holdings_max: 12, max_single_name_weight_pct: 25 }
    : { breadth: "broad" as const, holdings_min: 12, holdings_max: 16, max_single_name_weight_pct: 20 };

  const cadence = isDirectional ? "weekly_plus_event" as const
    : modeId === "onboarding.alt_basket_2" ? "weekly" as const
    : modeId === "onboarding.alt_basket_1" ? "biweekly" as const
    : "monthly_threshold" as const;

  const actLevel = isDirectional ? "high" as const
    : modeId === "onboarding.alt_basket_2" ? "high" as const
    : modeId === "onboarding.alt_basket_1" ? "medium" as const
    : "low" as const;

  const behaviorChips = isDirectional
    ? [`Concentrated / ${shape.holdings_min}-${shape.holdings_max} names`, "Weekly + event-driven", "High activity", "Directional", "Ethereum mainnet"]
    : modeId === "onboarding.alt_basket_2"
    ? [`Concentrated / ${shape.holdings_min}-${shape.holdings_max} names`, "Weekly or biweekly", "High activity", "Long-only or adaptive-long", "Ethereum mainnet"]
    : modeId === "onboarding.alt_basket_1"
    ? [`Focused / ${shape.holdings_min}-${shape.holdings_max} names`, "Biweekly or monthly", "Medium activity", "Long-only", "Ethereum mainnet"]
    : [`Broad / ${shape.holdings_min}-${shape.holdings_max} names`, "Monthly + drift checks", "Low activity", "Long-only", "Ethereum mainnet"];

  const blockedPaths: LocalStrategySlotId[] = [];
  if (!profile.resolved.directional_eligible) blockedPaths.push("advanced.default_directional");
  if (profile.resolved.safe_fallback_applied) {
    blockedPaths.push("onboarding.alt_basket_1", "onboarding.alt_basket_2");
  }

  return {
    mode_id: modeId,
    title,
    chain: "ethereum_mainnet",
    stance: isDirectional ? "directional" : "long_only",
    theme_used: profile.resolved.theme_preference,
    risk_band: profile.resolved.risk_level,
    rebalance_cadence: cadence,
    activity_level: actLevel,
    portfolio_shape: shape,
    why_recommended: why,
    expected_behavior: [
      `${shape.breadth} basket with ${shape.holdings_min}-${shape.holdings_max} names`,
      `Refreshes ${cadence.replace("_", " ")}`,
      `${actLevel} activity level`,
      isDirectional ? "Can change market stance" : "Stays long and rotates within xStocks",
    ],
    confidence: profile.recommendation_confidence,
    safe_fallback_applied: profile.resolved.safe_fallback_applied,
    blocked_paths: blockedPaths,
    preview_defaults: {
      center_view: "behavior_path",
      blotter_tab: "positions",
      right_panel_cards: MODE_RIGHT_PANEL[modeId] ?? MODE_RIGHT_PANEL["onboarding.default_basket"],
    },
    deposit_cta: {
      primary_label: "Deposit to activate on Ethereum",
      secondary_label: "Keep exploring in demo",
      helper_text: "This runs the exact preview ruleset in your wallet on Ethereum mainnet.",
    },
    behavior_chips: behaviorChips,
  };
}

export function buildStrategyRecommendationForMode(
  profile: OnboardingProfile,
  modeId: LocalStrategySlotId,
): StrategyRecommendation {
  return buildStrategyRecommendationForResolvedMode(profile, modeId);
}

function resolveLocalStrategySlot(
  profile: OnboardingProfile,
): LocalStrategySlotId {
  const resolvedTheme = profile.resolved.theme_preference;
  const resolvedRisk = profile.resolved.risk_level;
  const prefersLongOnlySimpleBasket =
    (resolvedRisk === "low" || resolvedRisk === "medium") &&
    profile.resolved.strategy_appetite === "long_only" &&
    profile.resolved.expression_band === "simple";
  const prefersBroaderBasket =
    resolvedRisk === "medium" &&
    (
      profile.resolved.goal_preference === "broad_exposure" ||
      resolvedTheme === "broad_market" ||
      profile.resolved.expression_band === "tilted" ||
      profile.resolved.strategy_appetite === "adaptive"
    );
  const highRiskAiTechTheme =
    resolvedRisk === "high" && resolvedTheme === "tech_ai";

  if (profile.resolved.directional_eligible) {
    return "advanced.default_directional";
  }

  if (profile.resolved.safe_fallback_applied) {
    return "onboarding.default_basket";
  }

  if (prefersLongOnlySimpleBasket) {
    return "onboarding.alt_basket_2";
  }

  if (highRiskAiTechTheme) {
    return "onboarding.default_basket";
  }

  if (prefersBroaderBasket || profile.resolved.goal_preference === "theme_tilt") {
    return "onboarding.alt_basket_1";
  }

  if (profile.resolved.goal_preference === "leaders") {
    return "onboarding.alt_basket_2";
  }

  return "onboarding.default_basket";
}

export function buildStrategyRecommendation(profile: OnboardingProfile): StrategyRecommendation {
  return buildStrategyRecommendationForResolvedMode(
    profile,
    resolveLocalStrategySlot(profile),
  );
}

export function recommendStrategyFromAnswers({
  answers,
  recommendedStrategies,
}: {
  answers: Record<string, string>;
  questions: OnboardingQuestion[];
  recommendedStrategies: PublicStrategyCardData[];
}): PublicStrategyCardData {
  const profile = buildOnboardingProfile(answers);
  const recommendation = buildStrategyRecommendation(profile);
  const matchingStrategy = recommendedStrategies.find(
    (strategy) => strategy.slotId === recommendation.mode_id,
  );

  if (!matchingStrategy) {
    throw new Error(
      `No public strategy card matches slot ${recommendation.mode_id}.`,
    );
  }

  return matchingStrategy;
}

export function buildQualificationFlowResult({
  answers,
  questions,
  recommendedStrategy,
  manifest,
}: {
  answers: Record<string, string>;
  questions: OnboardingQuestion[];
  recommendedStrategy: PublicStrategyCardData;
  manifest: PromotedManifest;
}): QualificationFlowResult {
  const selectedOptions = getSelectedOptions(questions, answers);
  const modePreference =
    findLastOption(selectedOptions, (option) => option.qualification.modePreference !== undefined)
      ?.qualification.modePreference ??
    (recommendedStrategy.mode === "directional" ? "directional" : "basket");
  const selection =
    findLastOption(selectedOptions, (option) => option.qualification.selection !== undefined)
      ?.qualification.selection ?? {
      type: "public_strategy" as const,
      key: recommendedStrategy.manifestSlug,
    };
  const readinessState =
    findLastOption(selectedOptions, (option) => option.qualification.fundingState !== undefined)
      ?.qualification.fundingState ??
    (recommendedStrategy.mode === "directional"
      ? "funding_required"
      : "view_ready");
  const directionalOptIn = selectedOptions.some(
    (option) => option.qualification.directionalOptIn,
  );
  const yieldBufferAllowed =
    selectedOptions.some((option) => option.qualification.yieldBufferAllowed) ||
    recommendedStrategy.mode === "basket";
  const activeSlotId = getSharedSlotId(recommendedStrategy.slotId);
  const whyRecommended = [
    manifest.frontend.summary,
    manifest.frontend.thesis,
    ...manifest.market_intelligence.whatChanged.slice(0, 2),
  ];

  const onboardingAnswers: SharedOnboardingAnswers = {
    version: "1",
    preferredChain: "ethereum",
    modePreference: normalizeModePreference(modePreference),
    initialSelection: toSharedSelection(selection.type, selection.key),
    selectedStarterSlotId: activeSlotId,
    ...(recommendedStrategy.mode === "basket"
      ? { selectedStarterBasketId: recommendedStrategy.manifestSlug }
      : {}),
    directionalOptIn,
    submittedAt: "2026-03-31T10:00:00Z",
  };

  const userProfile: SharedUserProfile = {
    version: "1",
    preferredChain: "ethereum",
    modePreference: onboardingAnswers.modePreference,
    selectedScope: onboardingAnswers.initialSelection,
    activeSlotId,
    ...(recommendedStrategy.mode === "basket"
      ? { starterBasketId: recommendedStrategy.manifestSlug }
      : {}),
    directionalAllowed:
      directionalOptIn ||
      recommendedStrategy.mode === "directional" ||
      readinessState === "funding_required",
    yieldBufferAllowed,
    updatedAt: "2026-03-31T10:00:00Z",
  };
  const recommendationContract = buildRecommendationContract(manifest);

  const isDirectionalLane =
    recommendedStrategy.mode === "directional" ||
    onboardingAnswers.modePreference === "directional";
  const nextStep =
    readinessState === "activation_ready"
      ? {
          label: "Open activation review",
          href: `/activate/${recommendedStrategy.manifestSlug}`,
        }
      : {
          label: "Open strategy detail",
          href: `/workspace/detail/${recommendedStrategy.manifestSlug}`,
        };
  const fitNotes = selectedOptions.map((option) => option.qualification.fitNote);
  const optimizationMethod = {
    label: "Optimisation method",
    pillLabel: "OPTIMISATION METHOD: AUTORESEARCH",
    summary:
      "Your portfolio is selected automatically by testing many candidates and keeping the best performer.",
    details: [
      "Your answers narrow down which type of portfolio fits you best.",
      "Autoresearch then runs simulated performance tests on many portfolio configurations — different weights, different holdings — and picks the winner. Inspired by Andrej Karpathy's approach to training neural networks: run many experiments, keep the best.",
      "The portfolio you see is the current champion from the latest evaluation cycle. It gets re-evaluated regularly so it stays competitive.",
    ],
  };
  const profileRows = [
    {
      label: "Preferred chain",
      value: onboardingAnswers.preferredChain,
    },
    {
      label: "Selected scope",
      value: `${onboardingAnswers.initialSelection.type}:${onboardingAnswers.initialSelection.key}`,
    },
    {
      label: "Mode id",
      value: userProfile.activeSlotId,
      note: recommendedStrategy.title,
    },
    {
      label: "Directional allowed",
      value: userProfile.directionalAllowed ? "Opt-in enabled" : "Basket only",
    },
    {
      label: "Yield buffer",
      value: userProfile.yieldBufferAllowed ? "Allowed" : "Hidden",
    },
    {
      label: "Funding posture",
      value: readinessState.replaceAll("_", " "),
      note: "Preview remains non-live until deposit.",
    },
  ];
  const recommendationRows = [
    {
      label: "Recommendation id",
      value: recommendationContract.recommendation_id,
    },
    {
      label: "Portfolio mode",
      value: recommendationContract.portfolio_mode,
    },
    {
      label: "Manifest ref",
      value: recommendationContract.activation_manifest_ref.manifest_id,
    },
    {
      label: "Route truth",
      value: recommendationContract.rebalance_decision.route_truth_surface,
    },
    {
      label: "Signal refs",
      value: recommendationContract.signal_refs.join(", "),
    },
    {
      label: "Preview state",
      value:
        recommendedStrategy.mode === "directional"
          ? "Directional preview only"
          : "Basket preview only",
      note: "Deposit is the activation gate.",
    },
  ];
  const depositCtaLabel =
    recommendedStrategy.mode === "directional"
      ? "Deposit to unlock directional activation"
      : "Deposit to activate basket";

  return {
    recommendedManifestSlug: recommendedStrategy.manifestSlug,
    qualifiedMode: recommendedStrategy.mode,
    readinessState,
    headline: isDirectionalLane
      ? "Matched to a directional xStocks portfolio with explicit route and funding controls."
      : "Matched to an xStocks basket portfolio with rules-based rebalancing.",
    summary: isDirectionalLane
      ? "Your answers point to a directional xStocks position. The portfolio stays in preview with funding and unwind controls visible until deposit."
      : "Your answers point to an xStocks basket portfolio. Preview shows the exact holdings and rebalance rules before deposit.",
    whyRecommended,
    previewLabel:
      recommendedStrategy.mode === "directional"
        ? "Directional preview"
        : "Basket preview",
    depositCtaLabel,
    nextStepLabel: nextStep.label,
    nextStepHref: nextStep.href,
    fitNotes,
    optimizationMethod,
    checks: [
      {
        label: "Discovery fit",
        status: selection.type === "theme" ? "ready" : "monitor",
        detail: `${selection.type.replace("_", " ")} selected: ${selection.key}`,
      },
      {
        label: "Mode qualification",
        status: isDirectionalLane ? "monitor" : "ready",
        detail: `Mode preference: ${onboardingAnswers.modePreference}`,
      },
      {
        label: "Funding posture",
        status:
          readinessState === "activation_ready"
            ? "ready"
            : readinessState === "funding_required"
              ? "monitor"
              : "gated",
        detail: `Current readiness: ${readinessState.replaceAll("_", " ")}`,
      },
      {
        label: "Control surface",
        status: directionalOptIn || yieldBufferAllowed ? "ready" : "monitor",
        detail:
          directionalOptIn
            ? "User opted into explicit route and permission controls."
            : "Reserve-first controls remain the preferred surface.",
        },
    ],
    profileRows,
    recommendationRows,
    answersContract: onboardingAnswers,
    profileContract: userProfile,
    recommendationContract,
  };
}

export function buildSharedLifecycleSummary(
  manifest: PromotedManifest,
  blotter: BlotterData,
): Array<{ title: string; detail: string }> {
  const activeRebalance = blotter.rebalancing.find(
    (entry) => entry.manifestSlug === manifest.slug,
  );

  return [
    {
      title: "Promoted contract slot",
      detail: getSharedSlotId(manifest.slot_id),
    },
    {
      title: "Route truth state",
      detail: toSharedTruthState(manifest.live_state.state),
    },
    {
      title: "Next rebalance window",
      detail: activeRebalance?.window ?? "No rebalance queued",
    },
  ];
}

export function findManifestRebalance(
  blotter: BlotterData,
  manifestSlug: string,
): RebalanceRow {
  return (
    blotter.rebalancing.find((entry) => entry.manifestSlug === manifestSlug) ??
    blotter.rebalancing[0]
  );
}
