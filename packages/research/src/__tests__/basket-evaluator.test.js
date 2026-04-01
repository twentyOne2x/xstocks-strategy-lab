import test from "node:test";
import assert from "node:assert/strict";

import { loadResearchBundle } from "../bundle.js";
import {
  describeBasketPolicyChanges,
  summarizeBasketPolicyChanges,
} from "../explanations.js";
import { createPromotedIncumbent } from "../incumbents.js";
import { buildDefaultDirectionalCandidate } from "../directional-preview.js";
import { evaluateBasket, evaluateDirectional } from "../evaluate.js";
import {
  buildBaselineBasketCandidate,
  describeBasketSearchSurface,
  diffBasketPolicyProfiles,
  listBasketChallengerCandidates,
} from "../hot/basket-policy.js";
import { getDirectionalSlot, listOnboardingBasketSlots } from "../slots.js";

test("baseline basket candidate respects frozen caps and remains fully allocated", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const candidate = buildBaselineBasketCandidate(slot.slotId, bundle);
  const totalWeight =
    candidate.plan.cashWeight +
    candidate.plan.targetWeights.reduce((sum, entry) => sum + entry.weight, 0);

  assert.ok(Math.abs(totalWeight - 1) < 0.0001);
  assert.ok(
    Math.max(...candidate.plan.targetWeights.map((entry) => entry.weight * 100)) <=
      slot.concentrationCapPct + 0.001,
  );
});

test("basket evaluator emits a keepable baseline row on the pinned dataset", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const candidate = buildBaselineBasketCandidate(slot.slotId, bundle);
  const evaluation = evaluateBasket(candidate, {
    bundle,
    stage: "baseline",
    completedAtUtc: "2026-03-31T00:00:00.000Z",
    runId: "baseline-test",
  });

  assert.equal(evaluation.resultRow.mode, "basket");
  assert.equal(evaluation.resultRow.status, "keep");
  assert.equal(evaluation.summary.bundle.datasetVersion, "research-bundle-v2");
  assert.equal(evaluation.summary.resultRow.slotId, slot.slotId);
  assert.equal(evaluation.summary.resultRow.guardrailPass, true);
  assert.equal(evaluation.summary.explanationBundle.truthMode, "promoted_incumbent_and_run_summary_only");
  assert.equal(evaluation.summary.explanationBundle.cashWeightPct, 5);
  assert.equal(evaluation.summary.explanationBundle.rebalanceThresholdBps, 300);
  assert.equal(
    evaluation.summary.explanationBundle.portfolioMetrics.rebalanceSimulation.modelId,
    "path_dependent_rebalance_after_cost_v1",
  );
  assert.equal(
    typeof evaluation.summary.explanationBundle.summaries.realityCheck,
    "string",
  );
  assert.equal(evaluation.summary.score.scoringModelId, "path_dependent_rebalance_after_cost_v1");
  assert.equal(typeof evaluation.summary.score.legacyPrimaryScore, "number");
  assert.equal(evaluation.summary.tuningSummary.currentKnobs.length >= 5, true);
});

test("research bundle v2 uses a full-year stress primary window while preserving H1 as a reference", () => {
  const bundle = loadResearchBundle();

  assert.equal(bundle.manifest.dataset_version, "research-bundle-v2");
  assert.equal(bundle.validationWindows.validation_set_id, "validation.monthly.2025_full_year_stress_v2");
  assert.equal(bundle.validationWindows.primary_window_id, "2025_full_year_stress_v2");
  assert.equal(
    bundle.validationWindows.windows.some(
      (window) =>
        window.window_id === "2025_h1_reference_v1" &&
        window.start === "2025-01-31" &&
        window.end === "2025-06-30",
    ),
    true,
  );
  assert.equal(bundle.prices.points.length, 12);
});

test("basket search surface exposes explicit score-affecting knobs including rebalance threshold", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const surface = describeBasketSearchSurface(slot.slotId, bundle);

  assert.equal(surface.anchorBasketId, slot.starterBasketId);
  assert.equal(surface.defaultPolicyProfile.anchorBasketId, slot.starterBasketId);
  assert.equal(surface.defaultPolicyProfile.parameters.breadth.topN, 7);
  assert.equal(
    surface.searchProfiles.every(
      (profile) =>
        typeof profile.taxonomy?.familyId === "string" &&
        typeof profile.taxonomy?.familyLabel === "string" &&
        typeof profile.taxonomy?.operatorSummary === "string",
    ),
    true,
  );
  assert.equal(
    surface.tunableParameters.some(
      (parameter) =>
        parameter.parameterId === "selection_universe" &&
        parameter.allowedValues.includes("core_universe") &&
        parameter.scoreAffects === true,
    ),
    true,
  );
  assert.equal(
    surface.tunableParameters.some(
      (parameter) =>
        parameter.parameterId === "rebalance_threshold_bps" &&
        parameter.scoreAffects === true,
    ),
    true,
  );
  assert.equal(
    surface.searchProfiles.every(
      (profile) =>
        Array.isArray(profile.changedParameterIds) &&
        profile.policyProfile.parameters.cashSleeve.mode === "static_target_weight",
    ),
    true,
  );
});

test("basket challenger candidates stay deduped, parseable, and promotable with their own strategy versions", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const surface = describeBasketSearchSurface(slot.slotId, bundle);
  const challengers = listBasketChallengerCandidates(slot.slotId, bundle);
  const candidateRefs = new Set(challengers.map((candidate) => candidate.candidateRef));
  const strategyVersions = new Set(challengers.map((candidate) => candidate.strategyVersion));
  const challenger = challengers[0];
  const evaluation = evaluateBasket(challenger, {
    bundle,
    stage: "challenger_running",
    incumbentRunId: "baseline-test",
    incumbentScore: 0,
    completedAtUtc: "2026-04-01T00:00:00.000Z",
    runId: "challenger-test",
  });
  const incumbent = createPromotedIncumbent({
    slot,
    evaluation: evaluation.summary,
    previousIncumbentId: `${slot.slotId}:${slot.strategyVersion}`,
  });

  assert.ok(challengers.length > 0);
  assert.equal(candidateRefs.size, challengers.length);
  assert.equal(strategyVersions.size, challengers.length);
  assert.notEqual(challenger.strategyVersion, slot.strategyVersion);
  assert.ok(challenger.policyProfile);
  assert.equal(challenger.taxonomy.familyId, "starter_breadth_trim");
  assert.equal(challenger.taxonomy.familyClassId, "starter_reshaping");
  assert.ok(challenger.description.includes("basket_policy_profile"));
  assert.ok(challenger.description.includes("candidate_family_id="));
  assert.ok(challenger.description.includes("candidate_family_class="));
  assert.ok(challenger.description.includes("top_n="));
  assert.ok(challenger.description.includes("weight_exponent="));
  assert.ok(challenger.description.includes("cash_weight_pct="));
  assert.ok(challenger.description.includes("rebalance_threshold_bps="));
  assert.ok(
    Math.abs(
      challenger.plan.cashWeight +
        challenger.plan.targetWeights.reduce((sum, entry) => sum + entry.weight, 0) -
        1,
    ) < 0.0001,
  );
  assert.equal(incumbent.strategyVersion, challenger.strategyVersion);
  assert.equal(incumbent.previousIncumbentId, `${slot.slotId}:${slot.strategyVersion}`);
  assert.equal(
    diffBasketPolicyProfiles(surface.defaultPolicyProfile, challenger.policyProfile).length > 0,
    true,
  );
});

test("basket evaluator disambiguates run ids per candidate when multiple challengers finish at the same timestamp", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const challengers = listBasketChallengerCandidates(slot.slotId, bundle);
  const [firstChallenger, secondChallenger] = challengers;
  const completedAtUtc = "2026-04-01T00:00:00.000Z";
  const firstEvaluation = evaluateBasket(firstChallenger, {
    bundle,
    stage: "challenger_running",
    incumbentRunId: "baseline-test",
    incumbentScore: 0,
    completedAtUtc,
  });
  const secondEvaluation = evaluateBasket(secondChallenger, {
    bundle,
    stage: "challenger_running",
    incumbentRunId: "baseline-test",
    incumbentScore: 0,
    completedAtUtc,
  });

  assert.notEqual(firstEvaluation.resultRow.runId, secondEvaluation.resultRow.runId);
  assert.match(firstEvaluation.resultRow.runId, new RegExp(firstChallenger.strategyVersion));
  assert.match(secondEvaluation.resultRow.runId, new RegExp(secondChallenger.strategyVersion));
});

test("authoritative rebalance metrics react to threshold changes while the legacy score stays comparable", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const candidate = buildBaselineBasketCandidate(slot.slotId, bundle);
  const lowThresholdCandidate = {
    ...candidate,
    strategyVersion: "shadow-low-threshold",
    candidateRef: "shadow-low-threshold",
    plan: {
      ...candidate.plan,
      rebalanceThresholdBps: 0,
      reasonCodes: [
        ...(candidate.plan.reasonCodes ?? []).filter((code) => !String(code).startsWith("rebalance_threshold:")),
        "rebalance_threshold:0bps",
      ],
    },
  };
  const highThresholdCandidate = {
    ...candidate,
    strategyVersion: "shadow-high-threshold",
    candidateRef: "shadow-high-threshold",
    plan: {
      ...candidate.plan,
      rebalanceThresholdBps: 10000,
      reasonCodes: [
        ...(candidate.plan.reasonCodes ?? []).filter((code) => !String(code).startsWith("rebalance_threshold:")),
        "rebalance_threshold:10000bps",
      ],
    },
  };
  const lowThresholdEvaluation = evaluateBasket(lowThresholdCandidate, {
    bundle,
    stage: "challenger_running",
    incumbentRunId: "baseline-test",
    incumbentScore: 0,
    completedAtUtc: "2026-04-01T00:00:00.000Z",
    runId: "shadow-low-threshold",
  });
  const highThresholdEvaluation = evaluateBasket(highThresholdCandidate, {
    bundle,
    stage: "challenger_running",
    incumbentRunId: "baseline-test",
    incumbentScore: 0,
    completedAtUtc: "2026-04-01T00:00:00.000Z",
    runId: "shadow-high-threshold",
  });

  assert.equal(
    lowThresholdEvaluation.summary.score.legacyPrimaryScore,
    highThresholdEvaluation.summary.score.legacyPrimaryScore,
  );
  assert.ok(
    lowThresholdEvaluation.summary.metrics.turnoverAnnPct >
      highThresholdEvaluation.summary.metrics.turnoverAnnPct,
  );
  assert.ok(
    lowThresholdEvaluation.summary.metrics.rebalanceSimulation.rebalanceEventCount >
      highThresholdEvaluation.summary.metrics.rebalanceSimulation.rebalanceEventCount,
  );
  assert.notEqual(
    lowThresholdEvaluation.resultRow.primaryScore,
    highThresholdEvaluation.resultRow.primaryScore,
  );
});

test("basket policy change descriptions stay operator-legible and ordered", () => {
  const bundle = loadResearchBundle();
  const [slot] = listOnboardingBasketSlots();
  const surface = describeBasketSearchSurface(slot.slotId, bundle);
  const targetProfile = surface.searchProfiles.find(
    (profile) => profile.profileId === "broader_core_focused_lighter_cash",
  )?.policyProfile;
  const changes = describeBasketPolicyChanges(surface.defaultPolicyProfile, targetProfile);
  const summary = summarizeBasketPolicyChanges(surface.defaultPolicyProfile, targetProfile);

  assert.deepEqual(
    changes.map((change) => change.parameterId),
    ["selection_universe", "holdings_count", "cash_weight"],
  );
  assert.equal(changes[0].summary, "Selection universe: starter basket only -> core universe");
  assert.equal(changes[1].summary, "Breadth: 7 names -> 6 names");
  assert.equal(changes[2].summary, "Cash sleeve: 5% AUSD -> 2% AUSD");
  assert.equal(
    summary,
    "Selection universe: starter basket only -> core universe; Breadth: 7 names -> 6 names; Cash sleeve: 5% AUSD -> 2% AUSD",
  );
});

test("basket search surface includes decoupled core-universe lighter-cash templates for AI Infra", () => {
  const bundle = loadResearchBundle();
  const surface = describeBasketSearchSurface("onboarding.alt_basket_1", bundle);
  const profileIds = surface.searchProfiles.map((profile) => profile.profileId);
  const cashParameter = surface.tunableParameters.find(
    (parameter) => parameter.parameterId === "cash_weight",
  );

  assert.equal(profileIds.includes("broader_core_same_breadth_lighter_cash"), true);
  assert.equal(
    profileIds.includes("broader_core_same_breadth_lighter_cash_lower_rebalance"),
    true,
  );
  assert.equal(
    profileIds.includes("broader_core_same_breadth_lighter_cash_anchor_bias"),
    true,
  );
  assert.deepEqual(cashParameter?.allowedValues, [0.02, 0.05, 0.08, 0.11]);
  assert.equal(profileIds.includes("broader_core_focused_lighter_cash"), false);
  const anchoredProfile = surface.searchProfiles.find(
    (profile) => profile.profileId === "broader_core_same_breadth_lighter_cash_anchor_bias",
  );
  const lowerThresholdProfile = surface.searchProfiles.find(
    (profile) => profile.profileId === "broader_core_same_breadth_lighter_cash_lower_rebalance",
  );
  assert.equal(anchoredProfile?.taxonomy.familyId, "core_low_cash_anchored");
  assert.equal(anchoredProfile?.taxonomy.familyClassId, "core_universe_capital_mix");
  assert.equal(lowerThresholdProfile?.taxonomy.familyId, "core_low_cash_lower_rebalance");
  assert.equal(
    lowerThresholdProfile?.policyProfile.parameters.rebalance.thresholdBps,
    275,
  );
});

test("basket search surface includes exactly one local trimmed low-cash expansion for US Tech Leaders", () => {
  const bundle = loadResearchBundle();
  const altBasket2Surface = describeBasketSearchSurface("onboarding.alt_basket_2", bundle);
  const defaultSurface = describeBasketSearchSurface("onboarding.default_basket", bundle);
  const altBasket1Surface = describeBasketSearchSurface("onboarding.alt_basket_1", bundle);
  const altBasket2Profile = altBasket2Surface.searchProfiles.find(
    (profile) => profile.profileId === "trim_holdings_lighter_cash",
  );

  assert.equal(Boolean(altBasket2Profile), true);
  assert.equal(altBasket2Profile?.taxonomy.familyId, "starter_breadth_trim_low_cash");
  assert.equal(altBasket2Profile?.policyProfile.parameters.breadth.topN, 6);
  assert.equal(altBasket2Profile?.policyProfile.parameters.cashSleeve.targetWeightPct, 1);
  assert.equal(altBasket2Profile?.policyProfile.parameters.capPolicy.maxWeightPct, 17);
  assert.equal(altBasket2Profile?.policyProfile.parameters.rebalance.thresholdBps, 275);
  assert.equal(
    defaultSurface.searchProfiles.some((profile) => profile.profileId === "trim_holdings_lighter_cash"),
    false,
  );
  assert.equal(
    altBasket1Surface.searchProfiles.some((profile) => profile.profileId === "trim_holdings_lighter_cash"),
    false,
  );
});

test("directional evaluator emits conservative preview metrics while staying fail-closed", () => {
  const slot = getDirectionalSlot("advanced.default_directional");
  const candidate = buildDefaultDirectionalCandidate();
  const evaluation = evaluateDirectional(candidate, {
    stage: "preview_stub",
    completedAtUtc: "2026-03-31T00:00:00.000Z",
    runId: "directional-preview-test",
  });

  assert.equal(slot.slotId, evaluation.resultRow.slotId);
  assert.equal(evaluation.resultRow.mode, "directional");
  assert.equal(evaluation.resultRow.status, "preview_only");
  assert.equal(evaluation.resultRow.grossExposureAvgPct, 60);
  assert.equal(evaluation.resultRow.netExposureAvgPct, 60);
  assert.equal(evaluation.resultRow.leverageAvg, 1.35);
  assert.equal(evaluation.resultRow.borrowCostBps, 540);
  assert.equal(evaluation.resultRow.eulerMarketSetId, "euler.ethereum.placeholder_v1");
  assert.ok(evaluation.resultRow.eulerHealthMin !== null);
  assert.ok(evaluation.resultRow.eulerHealthMin > 1.8);
  assert.ok(evaluation.summary.metrics.liquidationDistancePct !== null);
  assert.ok(evaluation.summary.metrics.liquidationDistancePct > 50);
  assert.equal(evaluation.summary.metrics.healthBufferPct, 85.7143);
  assert.equal(evaluation.summary.guardrailPass, true);
  assert.equal(evaluation.summary.readiness.previewable, true);
  assert.equal(evaluation.summary.readiness.executable, false);
  assert.equal(evaluation.summary.readiness.executionEligibility, "preview_only");
  assert.equal(evaluation.summary.readiness.activationAllowed, false);
  assert.equal(
    evaluation.summary.previewContext.requiredDirectionalRoute.routeId,
    "euler.ethereum.directional",
  );
  assert.equal(evaluation.summary.previewContext.requiredDirectionalRoute.truth, "unverified");
  assert.equal(
    evaluation.summary.previewContext.requiredDirectionalRoute.proofSource,
    "unverified",
  );
  assert.equal(
    evaluation.summary.previewContext.routeEntries.find(
      (route) => route.routeId === "euler.ethereum.directional",
    )?.availability,
    "preview_only",
  );
  assert.equal(
    evaluation.summary.previewContext.xstocksAssetSurface.executionRoutes.some(
      (route) => route.routeId === "cow_swap.ethereum" && route.availability === "available",
    ),
    true,
  );
  assert.equal(
    evaluation.summary.previewContext.verifiedOverlay.morphoMarket.truth,
    "live",
  );
  assert.equal(
    evaluation.summary.previewContext.previewPayload.activationAllowed,
    false,
  );
  assert.ok(
    evaluation.summary.invalidators.includes("route_unverified"),
  );
  assert.ok(
    evaluation.summary.previewContext.unavailableMetrics.includes(
      "exact_live_euler_execution_proof",
    ),
  );
});
