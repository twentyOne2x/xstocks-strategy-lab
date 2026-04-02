import { describe, expect, it } from "vitest";

import { getPromotedManifest } from "./data-source";
import { onboardingQuestions, publicStrategies } from "./mock-data";
import {
  buildManifestContractBundle,
  buildOnboardingProfile,
  buildQualificationFlowResult,
  buildStrategyRecommendation,
  buildStrategyRecommendationForMode,
  recommendStrategyFromAnswers,
} from "./shared-contract-adapter";

describe("shared contract adapter", () => {
  it("maps a basket manifest into the shared activation contract shape", () => {
    const manifest = getPromotedManifest("ai-infra-autopilot");

    expect(manifest).toBeDefined();

    const bundle = buildManifestContractBundle(manifest!);

    expect(bundle.activationManifest.slotId).toBe("onboarding.default_basket");
    expect(bundle.activationManifest.chain).toBe("ethereum");
    expect(bundle.activationPayload.source).toHaveProperty("recommendationId");
    expect(bundle.snapshot.truthState).toBe("preview");
  });

  it("maps a directional manifest into a funding-aware payload", () => {
    const manifest = getPromotedManifest("mstr-conviction-long");

    expect(manifest).toBeDefined();

    const bundle = buildManifestContractBundle(manifest!);

    expect(bundle.activationManifest.slotId).toBe("advanced.default_directional");
    expect(bundle.activationPayload.smartAccountAddress).toBeDefined();
    expect(bundle.activationPayload.permissions.maxLeverage).toBe(1.35);
    expect(bundle.snapshot.truthState).toBe("preview");
  });

  it("builds a directional recommendation when all hard-gate conditions are met", () => {
    const answers = {
      q_goal_preference: "leaders",
      q_expression_preference: "active",
      q_risk_level: "high",
      q_drawdown_sensitivity: "low",
      q_rebalance_preference: "active",
      q_directional_appetite: "directional",
      q_automation_comfort: "high",
      q_certainty: "high",
    };

    const profile = buildOnboardingProfile(answers);
    const recommendation = buildStrategyRecommendation(profile);

    expect(profile.resolved.directional_eligible).toBe(true);
    expect(recommendation.mode_id).toBe("advanced.default_directional");
    expect(recommendation.stance).toBe("directional");
  });

  it("downgrades to default basket on safe fallback", () => {
    const answers = {
      q_goal_preference: "unsure",
      q_expression_preference: "unsure",
      q_risk_level: "unsure",
      q_rebalance_preference: "unsure",
      q_directional_appetite: "unsure",
      q_automation_comfort: "unsure",
      q_certainty: "default_requested",
    };

    const profile = buildOnboardingProfile(answers);
    const recommendation = buildStrategyRecommendation(profile);

    expect(profile.resolved.safe_fallback_applied).toBe(true);
    expect(recommendation.mode_id).toBe("onboarding.default_basket");
    expect(recommendation.safe_fallback_applied).toBe(true);
  });

  it("treats certainty skip as exploring without breaking deterministic defaults", () => {
    const answers = {
      q_goal_preference: "theme_tilt",
      q_theme_preference: "tech_ai",
      q_expression_preference: "tilted",
      q_risk_level: "medium",
      q_rebalance_preference: "scheduled",
      q_directional_appetite: "adaptive",
      q_automation_comfort: "medium",
      q_certainty: "unsure",
    };

    const profile = buildOnboardingProfile(answers);
    const recommendation = buildStrategyRecommendation(profile);

    expect(profile.certainty_level).toBe("low");
    expect(profile.uncertainty_path).toBe("exploring");
    expect(profile.resolved.safe_fallback_applied).toBe(false);
    expect(recommendation.mode_id).toBe("onboarding.default_basket");
  });

  it("can align recommendation copy to a backend-selected slot", () => {
    const answers = {
      q_goal_preference: "broad_exposure",
      q_expression_preference: "simple",
      q_risk_level: "medium",
      q_rebalance_preference: "scheduled",
      q_directional_appetite: "long_only",
      q_automation_comfort: "medium",
      q_certainty: "medium",
    };

    const profile = buildOnboardingProfile(answers);
    const recommendation = buildStrategyRecommendationForMode(
      profile,
      "onboarding.alt_basket_1",
    );

    expect(recommendation.mode_id).toBe("onboarding.alt_basket_1");
    expect(recommendation.title).toBe("Theme Tilt Basket");
    expect(recommendation.stance).toBe("long_only");
  });

  it("builds qualification flow result with deposit CTA", () => {
    const answers = {
      q_goal_preference: "broad_exposure",
      q_expression_preference: "simple",
      q_risk_level: "medium",
      q_rebalance_preference: "scheduled",
      q_directional_appetite: "long_only",
      q_automation_comfort: "medium",
      q_certainty: "medium",
    };
    const recommendedStrategy = recommendStrategyFromAnswers({
      answers,
      questions: onboardingQuestions,
      recommendedStrategies: publicStrategies,
    });
    const manifest = getPromotedManifest(recommendedStrategy.manifestSlug);

    expect(manifest).toBeDefined();

    const result = buildQualificationFlowResult({
      answers,
      questions: onboardingQuestions,
      recommendedStrategy,
      manifest: manifest!,
    });

    expect(result.depositCtaLabel).toMatch(/Deposit/);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.profileContract.activeSlotId).toBe("onboarding.default_basket");
    expect(result.optimizationMethod.pillLabel).toBe(
      "OPTIMISATION METHOD: AUTORESEARCH",
    );
    expect(
      result.optimizationMethod.details.some((detail) =>
        /simulated performance tests|testing many candidates|many portfolio configurations/i.test(
          detail,
        ),
      ),
    ).toBe(true);
    expect(
      result.optimizationMethod.details.some((detail) =>
        /keeping the best performer|picks the winner|current champion/i.test(
          detail,
        ),
      ),
    ).toBe(true);
  });
});
