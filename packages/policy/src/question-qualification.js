import { z } from "../../shared/node_modules/zod/index.js";

import {
  STARTER_BASKET_IDS,
  STARTER_SLOT_CONSTANTS,
  STARTER_SLOT_IDS,
} from "../../shared/dist/index.js";
import { onboardingAnswersSchema } from "../../shared/dist/contracts/onboarding.js";

import {
  getQualificationOption,
  QUALIFICATION_QUESTION_CATALOG,
  qualificationAnswerMapSchema,
} from "./qualification-catalog.js";
import { normalizeOnboardingAnswers } from "./qualification.js";

const resolvedThemePreferenceSchema = z.enum([
  "broad_market",
  "tech_ai",
  "consumer_platforms",
  "quality_cashflow",
  "cross_market_leaders",
]);

export const onboardingProfileSchema = z.object({
  profile_version: z.literal("xstocks_onboarding_v1"),
  chain: z.literal("ethereum_mainnet"),
  goal_preference: z.enum([
    "broad_exposure",
    "theme_tilt",
    "leaders",
    "unsure",
  ]),
  theme_preference: z.enum([
    "broad_market",
    "tech_ai",
    "consumer_platforms",
    "quality_cashflow",
    "cross_market_leaders",
    "unsure",
  ]),
  expression_preference: z.enum(["simple", "tilted", "active", "unsure"]),
  risk_level: z.enum(["low", "medium", "high", "unsure"]),
  rebalance_preference: z.enum([
    "low_touch",
    "scheduled",
    "active",
    "unsure",
  ]),
  strategy_appetite: z.enum([
    "long_only",
    "adaptive",
    "directional",
    "unsure",
  ]),
  automation_comfort: z.enum(["low", "medium", "high", "unsure"]),
  certainty_level: z.enum(["high", "medium", "low"]),
  uncertainty_path: z.enum([
    "none",
    "some_answers_unsure",
    "exploring",
    "default_requested",
  ]),
  drawdown_sensitivity: z.enum(["high", "medium", "low", "unset"]),
  volatility_tolerance: z.enum(["low", "medium", "high", "unset"]),
  not_sure_count: z.number().int().nonnegative(),
  contradiction_flags: z.array(
    z.enum([
      "risk_drawdown_mismatch",
      "leaders_simple_mismatch",
      "active_low_touch_mismatch",
      "directional_low_automation_mismatch",
      "directional_low_certainty_mismatch",
      "theme_missing_mismatch",
    ]),
  ),
  resolved: z.object({
    goal_preference: z.enum(["broad_exposure", "theme_tilt", "leaders"]),
    theme_preference: resolvedThemePreferenceSchema,
    risk_level: z.enum(["low", "medium", "high"]),
    rebalance_band: z.enum(["low", "medium", "high"]),
    expression_band: z.enum(["simple", "tilted", "active"]),
    strategy_appetite: z.enum(["long_only", "adaptive", "directional"]),
    safe_fallback_applied: z.boolean(),
    directional_eligible: z.boolean(),
  }),
  recommendation_confidence: z.enum(["high", "medium", "low"]),
});

export const strategyRecommendationPreviewSchema = z.object({
  mode_id: z.enum([
    "onboarding.default_basket",
    "onboarding.alt_basket_1",
    "onboarding.alt_basket_2",
    "advanced.default_directional",
  ]),
  title: z.string().trim().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  safe_fallback_applied: z.boolean(),
  blocked_paths: z.array(
    z.enum([
      "onboarding.default_basket",
      "onboarding.alt_basket_1",
      "onboarding.alt_basket_2",
      "advanced.default_directional",
    ]),
  ),
  why_recommended: z.array(z.string().trim().min(1)),
});

export const questionQualificationSchema = z.object({
  questionAnswers: qualificationAnswerMapSchema,
  onboardingProfile: onboardingProfileSchema,
  slotPreview: strategyRecommendationPreviewSchema,
  normalizedOnboardingAnswers: onboardingAnswersSchema,
});

const MODE_TITLES = Object.freeze({
  "onboarding.default_basket": "Core xStocks Basket",
  "onboarding.alt_basket_1": "Theme Tilt Basket",
  "onboarding.alt_basket_2": "Active Leaders Basket",
  "advanced.default_directional": "Adaptive Market View",
});

const STARTER_SLOT_BY_ID = new Map(
  STARTER_SLOT_CONSTANTS.map((slot) => [slot.slotId, slot]),
);

function getSelectedQuestionOptions(questionAnswers) {
  return QUALIFICATION_QUESTION_CATALOG.questions.flatMap((question) => {
    const answerId = questionAnswers[question.id];
    if (!answerId) {
      return [];
    }

    const option = getQualificationOption(question.id, answerId);
    return option ? [option] : [];
  });
}

function lastQualificationValue(questionAnswers, selector) {
  let value;

  for (const question of QUALIFICATION_QUESTION_CATALOG.questions) {
    const answerId = questionAnswers[question.id];
    if (!answerId) {
      continue;
    }

    const option = getQualificationOption(question.id, answerId);
    if (!option) {
      continue;
    }

    const nextValue = selector(option.qualification);
    if (nextValue !== undefined) {
      value = nextValue;
    }
  }

  return value;
}

export function buildOnboardingProfile(question_answers = {}) {
  const questionAnswers = qualificationAnswerMapSchema.parse(question_answers);
  const goal = questionAnswers.q_goal_preference ?? "unsure";
  const theme =
    questionAnswers.q_theme_preference ??
    (goal === "broad_exposure"
      ? "broad_market"
      : goal === "leaders"
        ? "cross_market_leaders"
        : "unsure");
  const expression = questionAnswers.q_expression_preference ?? "unsure";
  const risk = questionAnswers.q_risk_level ?? "unsure";
  const drawdown = questionAnswers.q_drawdown_sensitivity ?? "unset";
  const rebalance = questionAnswers.q_rebalance_preference ?? "unsure";
  const appetite = questionAnswers.q_directional_appetite ?? "unsure";
  const automation = questionAnswers.q_automation_comfort ?? "unsure";
  const certaintyRaw = questionAnswers.q_certainty ?? "low";

  const certaintyLevel =
    certaintyRaw === "high"
      ? "high"
      : certaintyRaw === "medium"
        ? "medium"
        : "low";
  const uncertaintyPath =
    certaintyRaw === "default_requested"
      ? "default_requested"
      : certaintyRaw === "low" || certaintyRaw === "unsure"
        ? "exploring"
        : [goal, expression, risk, rebalance, appetite, automation].filter(
              (value) => value === "unsure",
            ).length > 0
          ? "some_answers_unsure"
          : "none";
  const notSureCount = [
    goal,
    theme,
    expression,
    risk,
    rebalance,
    appetite,
    automation,
  ].filter((value) => value === "unsure").length;

  const contradictions = [];
  if (risk === "high" && drawdown === "high") {
    contradictions.push("risk_drawdown_mismatch");
  }
  if (goal === "leaders" && expression === "simple") {
    contradictions.push("leaders_simple_mismatch");
  }
  if (expression === "active" && rebalance === "low_touch") {
    contradictions.push("active_low_touch_mismatch");
  }
  if (appetite === "directional" && automation !== "high") {
    contradictions.push("directional_low_automation_mismatch");
  }
  if (
    appetite === "directional" &&
    (certaintyLevel === "low" || notSureCount >= 2)
  ) {
    contradictions.push("directional_low_certainty_mismatch");
  }
  if (goal === "theme_tilt" && theme === "unsure") {
    contradictions.push("theme_missing_mismatch");
  }

  const volatilityTolerance =
    drawdown === "high"
      ? "low"
      : drawdown === "medium"
        ? "medium"
        : drawdown === "low"
          ? "high"
          : "unset";
  const resolvedGoal = goal === "unsure" ? "broad_exposure" : goal;
  const resolvedTheme = theme === "unsure" ? "broad_market" : theme;
  const resolvedRisk =
    risk === "unsure"
      ? uncertaintyPath === "default_requested"
        ? "low"
        : "medium"
      : risk;
  const resolvedRebalance =
    rebalance === "unsure"
      ? "medium"
      : rebalance === "low_touch"
        ? "low"
        : rebalance === "active"
          ? "high"
          : "medium";
  const resolvedExpression =
    expression === "unsure"
      ? certaintyLevel === "low" || uncertaintyPath === "default_requested"
        ? "simple"
        : "tilted"
      : expression;
  const resolvedAppetite = appetite === "unsure" ? "long_only" : appetite;
  const directionalEligible =
    appetite === "directional" &&
    automation === "high" &&
    expression === "active" &&
    rebalance === "active" &&
    certaintyLevel === "high" &&
    (risk === "medium" || risk === "high") &&
    drawdown !== "high" &&
    notSureCount <= 1 &&
    !contradictions.some(
      (flag) =>
        flag === "directional_low_automation_mismatch" ||
        flag === "directional_low_certainty_mismatch",
    );
  const safeFallbackApplied =
    uncertaintyPath === "default_requested" ||
    notSureCount >= 3 ||
    contradictions.length >= 2;
  const confidence = safeFallbackApplied
    ? "low"
    : notSureCount >= 2 || certaintyLevel === "low"
      ? "low"
      : certaintyLevel === "medium" || notSureCount === 1
        ? "medium"
        : "high";

  return onboardingProfileSchema.parse({
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
  });
}

export function buildStrategyRecommendation(profile) {
  const parsedProfile = onboardingProfileSchema.parse(profile);
  const prefersLongOnlySimpleBasket =
    (parsedProfile.resolved.risk_level === "low" ||
      parsedProfile.resolved.risk_level === "medium") &&
    parsedProfile.resolved.strategy_appetite === "long_only" &&
    parsedProfile.resolved.expression_band === "simple";
  const prefersBroaderBasket =
    parsedProfile.resolved.risk_level === "medium" &&
    (
      parsedProfile.resolved.goal_preference === "broad_exposure" ||
      parsedProfile.resolved.theme_preference === "broad_market" ||
      parsedProfile.resolved.expression_band === "tilted" ||
      parsedProfile.resolved.strategy_appetite === "adaptive"
    );
  const highRiskAiTechTheme =
    parsedProfile.resolved.risk_level === "high" &&
    parsedProfile.resolved.theme_preference === "tech_ai";
  let modeId = STARTER_SLOT_IDS.ONBOARDING_DEFAULT_BASKET;

  if (parsedProfile.resolved.directional_eligible) {
    modeId = STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL;
  } else if (parsedProfile.resolved.safe_fallback_applied) {
    modeId = STARTER_SLOT_IDS.ONBOARDING_DEFAULT_BASKET;
  } else if (prefersLongOnlySimpleBasket) {
    modeId = STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_2;
  } else if (highRiskAiTechTheme) {
    modeId = STARTER_SLOT_IDS.ONBOARDING_DEFAULT_BASKET;
  } else if (
    prefersBroaderBasket ||
    parsedProfile.resolved.goal_preference === "theme_tilt"
  ) {
    modeId = STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_1;
  } else if (parsedProfile.resolved.goal_preference === "leaders") {
    modeId = STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_2;
  }

  const whyRecommended = [];
  if (parsedProfile.goal_preference === "broad_exposure") {
    whyRecommended.push("You chose broad xStocks exposure.");
  } else if (parsedProfile.goal_preference === "theme_tilt") {
    whyRecommended.push("You wanted a clear equity theme.");
  } else if (parsedProfile.goal_preference === "leaders") {
    whyRecommended.push("You chose highest-conviction leaders.");
  } else {
    whyRecommended.push("You left the goal open, so this preview stays broad.");
  }

  if (parsedProfile.resolved.expression_band === "simple") {
    whyRecommended.push("You preferred a simpler, easier-to-track setup.");
  }
  if (parsedProfile.resolved.strategy_appetite === "long_only") {
    whyRecommended.push(
      "You wanted the strategy to stay long and rotate within xStocks.",
    );
  }
  if (parsedProfile.resolved.safe_fallback_applied) {
    whyRecommended.push("We kept this broader because you were still exploring.");
  }
  if (modeId === STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL) {
    whyRecommended.push(
      "You explicitly opted into stance changes when conditions shift.",
    );
  }

  const blockedPaths = [];
  if (!parsedProfile.resolved.directional_eligible) {
    blockedPaths.push(STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL);
  }
  if (parsedProfile.resolved.safe_fallback_applied) {
    blockedPaths.push(
      STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_1,
      STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_2,
    );
  }

  return strategyRecommendationPreviewSchema.parse({
    mode_id: modeId,
    title: MODE_TITLES[modeId] ?? "Core xStocks Basket",
    confidence: parsedProfile.recommendation_confidence,
    safe_fallback_applied: parsedProfile.resolved.safe_fallback_applied,
    blocked_paths: blockedPaths,
    why_recommended: whyRecommended,
  });
}

function deriveInitialSelection(questionAnswers, slotPreview) {
  if (slotPreview.mode_id === STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL) {
    return {
      type: "hero_asset",
      key: "SPYx",
    };
  }

  const explicitSelection = lastQualificationValue(
    questionAnswers,
    (qualification) => qualification.selection,
  );

  if (explicitSelection) {
    return explicitSelection;
  }

  return {
    type: "public_strategy",
    key: slotPreview.mode_id,
  };
}

function deriveModePreference(questionAnswers, slotPreview) {
  return (
    lastQualificationValue(questionAnswers, (qualification) => qualification.modePreference) ??
    (slotPreview.mode_id === STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL
      ? "directional"
      : "basket")
  );
}

function deriveStarterBasketId(slotPreview) {
  const slot = STARTER_SLOT_BY_ID.get(slotPreview.mode_id);
  return slot?.mode === "basket" ? slot.starterBasketId : undefined;
}

export function compileQuestionnaireQualification({
  question_answers = {},
  submittedAt = new Date().toISOString(),
}) {
  const questionAnswers = qualificationAnswerMapSchema.parse(question_answers);
  const onboardingProfile = buildOnboardingProfile(questionAnswers);
  const slotPreview = buildStrategyRecommendation(onboardingProfile);
  const starterBasketId = deriveStarterBasketId(slotPreview);
  const normalizedOnboardingAnswers = normalizeOnboardingAnswers(
    {
      preferredChain: "ethereum",
      modePreference: deriveModePreference(questionAnswers, slotPreview),
      initialSelection: deriveInitialSelection(questionAnswers, slotPreview),
      selectedStarterSlotId:
        slotPreview.mode_id === STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL
          ? undefined
          : slotPreview.mode_id,
      ...(starterBasketId ? { selectedStarterBasketId: starterBasketId } : {}),
      directionalOptIn:
        slotPreview.mode_id === STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL,
      submittedAt,
    },
    { submittedAt },
  );

  return questionQualificationSchema.parse({
    questionAnswers,
    onboardingProfile,
    slotPreview,
    normalizedOnboardingAnswers,
  });
}
