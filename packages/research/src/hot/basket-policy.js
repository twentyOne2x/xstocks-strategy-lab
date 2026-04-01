import { getStarterBasket, getUniverseAsset } from "../bundle.js";
import { getBasketSlot } from "../slots.js";

const CORE_UNIVERSE_MODE = "core_universe";
const STARTER_ONLY_MODE = "starter_only";
const SCORE_SIGNAL_ID = "baseline_signal_score";
const SIGNAL_POWER_OPTIONS = [0.85, 1, 1.2, 1.4];
const STARTER_BIAS_OPTIONS = [0, 12];
const CASH_WEIGHT_DELTA = 0.03;
const REBALANCE_THRESHOLD_DELTA_BPS = 50;
const CONCENTRATION_CAP_DELTA_PCT = 2;
const MIN_HOLDINGS_COUNT = 4;
const MAX_CASH_WEIGHT = 0.15;
const BASKET_POLICY_VERSION = "v1";
const BASKET_CANDIDATE_TAXONOMY_VERSION = "v1";
const CASH_SLEEVE_ASSET_SYMBOL = "AUSD";
const CASH_SLEEVE_MODE = "static_target_weight";
const CAP_POLICY_MODE = "single_name_max_weight_pct";
const CAP_REDISTRIBUTION_MODE = "redistribute_proportionally_to_uncapped_names";
const REBALANCE_POLICY_MODE = "absolute_drift_threshold_bps";
const HOLDINGS_PARAMETER_ID = "holdings_count";
const SIGNAL_POWER_PARAMETER_ID = "signal_power";
const CAP_PARAMETER_ID = "max_weight_pct";
const CASH_PARAMETER_ID = "cash_weight";
const REBALANCE_PARAMETER_ID = "rebalance_threshold_bps";
const UNIVERSE_PARAMETER_ID = "selection_universe";
const STARTER_BIAS_PARAMETER_ID = "starter_bias_pct";
const SLOT_EXTRA_CASH_WEIGHT_OPTIONS = {
  "onboarding.alt_basket_1": [0.02],
};

const BASKET_CANDIDATE_FAMILIES = {
  baseline: {
    familyId: "slot_baseline",
    familyLabel: "Slot Baseline",
    familyClassId: "baseline",
    familyClassLabel: "Pinned baseline",
    operatorSummary:
      "Keeps the pinned starter basket with the slot-default breadth, cash sleeve, cap, and rebalance trigger.",
  },
  trim_holdings: {
    familyId: "starter_breadth_trim",
    familyLabel: "Starter Breadth Trim",
    familyClassId: "starter_reshaping",
    familyClassLabel: "Starter reshaping",
    operatorSummary:
      "Keeps starter-only selection and trims one name so the basket is slightly more concentrated.",
  },
  trim_holdings_lighter_cash: {
    familyId: "starter_breadth_trim_low_cash",
    familyLabel: "Starter Breadth Trim + Low Cash",
    familyClassId: "starter_capital_mix",
    familyClassLabel: "Starter capital mix",
    operatorSummary:
      "Keeps the trimmed starter-only basket shape and lowers the AUSD sleeve so the current local winner can compete with more xStocks exposure.",
  },
  higher_conviction: {
    familyId: "starter_conviction_up",
    familyLabel: "Starter Conviction Up",
    familyClassId: "starter_reshaping",
    familyClassLabel: "Starter reshaping",
    operatorSummary:
      "Keeps starter-only selection but makes the weighting curve more conviction-heavy.",
  },
  lighter_cash: {
    familyId: "starter_low_cash",
    familyLabel: "Starter Low Cash",
    familyClassId: "starter_capital_mix",
    familyClassLabel: "Starter capital mix",
    operatorSummary:
      "Keeps starter-only selection and shifts more capital out of AUSD into xStocks.",
  },
  tighter_cap: {
    familyId: "starter_tighter_cap",
    familyLabel: "Starter Tighter Cap",
    familyClassId: "starter_risk_controls",
    familyClassLabel: "Starter risk controls",
    operatorSummary:
      "Keeps starter-only selection while tightening the single-name cap.",
  },
  broader_core: {
    familyId: "core_entry",
    familyLabel: "Core Entry",
    familyClassId: "core_universe_expansion",
    familyClassLabel: "Core-universe expansion",
    operatorSummary:
      "Widens from the starter basket to the broader core universe at similar breadth.",
  },
  broader_core_anchor_bias: {
    familyId: "core_entry_anchored",
    familyLabel: "Core Entry Anchored",
    familyClassId: "core_universe_expansion",
    familyClassLabel: "Core-universe expansion",
    operatorSummary:
      "Widens into the core universe while preserving a starter-basket score bias.",
  },
  broader_core_focused: {
    familyId: "core_focus",
    familyLabel: "Core Focus",
    familyClassId: "core_universe_expansion",
    familyClassLabel: "Core-universe expansion",
    operatorSummary:
      "Widens into the core universe and trims one name so the basket is more focused.",
  },
  broader_core_same_breadth_lighter_cash: {
    familyId: "core_low_cash",
    familyLabel: "Core Low Cash",
    familyClassId: "core_universe_capital_mix",
    familyClassLabel: "Core-universe capital mix",
    operatorSummary:
      "Widens into the core universe and lowers the AUSD sleeve while keeping breadth unchanged.",
  },
  broader_core_same_breadth_lighter_cash_anchor_bias: {
    familyId: "core_low_cash_anchored",
    familyLabel: "Core Low Cash Anchored",
    familyClassId: "core_universe_capital_mix",
    familyClassLabel: "Core-universe capital mix",
    operatorSummary:
      "Widens into the core universe, lowers cash, and keeps a starter-basket score bias.",
  },
  broader_core_same_breadth_lighter_cash_lower_rebalance: {
    familyId: "core_low_cash_lower_rebalance",
    familyLabel: "Core Low Cash + Lower Rebalance Threshold",
    familyClassId: "core_universe_rebalance_controls",
    familyClassLabel: "Core-universe rebalance controls",
    operatorSummary:
      "Keeps the winning core-universe low-cash structure for AI Infra but lowers the drift trigger so rebalance timing can compete under the richer path.",
  },
  broader_core_focused_lighter_cash: {
    familyId: "core_focus_low_cash",
    familyLabel: "Core Focus + Low Cash",
    familyClassId: "core_universe_capital_mix",
    familyClassLabel: "Core-universe capital mix",
    operatorSummary:
      "Widens into the core universe, trims breadth by one name, and lowers the AUSD sleeve.",
  },
  broader_core_focused_tighter_cap: {
    familyId: "core_focus_tighter_cap",
    familyLabel: "Core Focus + Tighter Cap",
    familyClassId: "core_universe_risk_controls",
    familyClassLabel: "Core-universe risk controls",
    operatorSummary:
      "Widens into the core universe, trims breadth, and tightens concentration limits.",
  },
  broader_core_focused_tighter_cap_conviction: {
    familyId: "core_focus_tighter_cap_conviction",
    familyLabel: "Core Focus + Tighter Cap + Conviction",
    familyClassId: "core_universe_risk_controls",
    familyClassLabel: "Core-universe risk controls",
    operatorSummary:
      "Widens into the core universe, trims breadth, lowers cash, tightens the cap, and increases weighting conviction.",
  },
  broader_core_deep_focus_tighter_cap_conviction: {
    familyId: "core_deep_focus_tighter_cap_conviction",
    familyLabel: "Core Deep Focus + Tighter Cap + Conviction",
    familyClassId: "core_universe_risk_controls",
    familyClassLabel: "Core-universe risk controls",
    operatorSummary:
      "Builds a deeper-focus core-universe basket with lower cash, a tighter cap, and higher conviction weights.",
  },
  starter_deep_focus_tighter_cap_conviction: {
    familyId: "starter_deep_focus_tighter_cap_conviction",
    familyLabel: "Starter Deep Focus + Tighter Cap + Conviction",
    familyClassId: "starter_risk_controls",
    familyClassLabel: "Starter risk controls",
    operatorSummary:
      "Keeps starter-only selection but deepens the focus basket with lower cash, a tighter cap, and higher conviction weights.",
  },
};

function round(value, places = 6) {
  return Number(value.toFixed(places));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function uniqueNumbers(values) {
  return [...new Set(values.filter((value) => Number.isFinite(value)))].sort((left, right) => left - right);
}

function pctToReasonValue(value) {
  return `${round(value, 2)}pct`;
}

function signalPowerReasonValue(value) {
  return `${round(value, 2)}x`;
}

function rebalanceThresholdReasonValue(value) {
  return `${Math.round(value)}bps`;
}

function weightingCurveCode(signalPower) {
  return signalPower === 1 ? "signal_score_proportional" : "signal_score_power";
}

function extraCashWeightOptions(slotId) {
  return SLOT_EXTRA_CASH_WEIGHT_OPTIONS[slotId] ?? [];
}

function buildCandidateTaxonomy(policyId) {
  const family = BASKET_CANDIDATE_FAMILIES[policyId] ?? {
    familyId: "unclassified",
    familyLabel: "Unclassified",
    familyClassId: "unclassified",
    familyClassLabel: "Unclassified",
    operatorSummary: "Candidate family was not classified.",
  };

  return {
    taxonomyVersion: BASKET_CANDIDATE_TAXONOMY_VERSION,
    templateId: policyId,
    familyId: family.familyId,
    familyLabel: family.familyLabel,
    familyClassId: family.familyClassId,
    familyClassLabel: family.familyClassLabel,
    operatorSummary: family.operatorSummary,
  };
}

function buildBasketPolicySlug(policy) {
  const universeCode = policy.selectionUniverse === CORE_UNIVERSE_MODE ? "core" : "starter";
  return [
    universeCode,
    `h${policy.holdingsCount}`,
    `p${Math.round(policy.signalPower * 100)}`,
    `c${Math.round(policy.cashWeight * 100)}`,
    `cap${policy.maxWeightPct}`,
    `a${policy.starterBiasPct}`,
    `r${policy.rebalanceThresholdBps}`,
  ].join("-");
}

function activeCoreUniverseAssets(bundle) {
  return bundle.universeSnapshot.assets
    .filter(
      (asset) =>
        asset.status === "active" &&
        asset.symbol !== "SPYx" &&
        Array.isArray(asset.starter_baskets) &&
        asset.starter_baskets.some((basketId) => basketId !== "sp500_core"),
    )
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
}

function buildBaselineBasketPolicy(slotId, bundle) {
  const slot = getBasketSlot(slotId);
  const starterBasket = getStarterBasket(bundle, slot.starterBasketId);

  return {
    policyId: "baseline",
    selectionUniverse: STARTER_ONLY_MODE,
    holdingsCount: starterBasket.members.length,
    starterBiasPct: 0,
    signalPower: 1,
    cashWeight: round(slot.targetCashWeight, 4),
    maxWeightPct: slot.concentrationCapPct,
    rebalanceThresholdBps: slot.rebalanceThresholdBps,
  };
}

function buildPolicyProfile(policy, slot, starterBasket) {
  return {
    profileId: policy.policyId,
    profileVersion: BASKET_POLICY_VERSION,
    slotId: slot.slotId,
    anchorBasketId: starterBasket.basket_id,
    benchmarkId: slot.benchmarkId,
    parameters: {
      breadth: {
        topN: policy.holdingsCount,
      },
      weighting: {
        rankingSignalId: SCORE_SIGNAL_ID,
        curveId: weightingCurveCode(policy.signalPower),
        exponent: policy.signalPower,
      },
      capPolicy: {
        mode: CAP_POLICY_MODE,
        maxWeightPct: policy.maxWeightPct,
        redistributionMode: CAP_REDISTRIBUTION_MODE,
      },
      cashSleeve: {
        mode: CASH_SLEEVE_MODE,
        assetSymbol: CASH_SLEEVE_ASSET_SYMBOL,
        targetWeightPct: round(policy.cashWeight * 100, 2),
      },
      rebalance: {
        mode: REBALANCE_POLICY_MODE,
        thresholdBps: policy.rebalanceThresholdBps,
      },
      starterAnchoring: {
        selectionUniverse: policy.selectionUniverse,
        starterBiasPct: policy.starterBiasPct,
      },
    },
  };
}

function policyProfileValue(profile, parameterId) {
  switch (parameterId) {
    case UNIVERSE_PARAMETER_ID:
      return profile.parameters.starterAnchoring.selectionUniverse;
    case HOLDINGS_PARAMETER_ID:
      return profile.parameters.breadth.topN;
    case STARTER_BIAS_PARAMETER_ID:
      return profile.parameters.starterAnchoring.starterBiasPct;
    case SIGNAL_POWER_PARAMETER_ID:
      return profile.parameters.weighting.exponent;
    case CASH_PARAMETER_ID:
      return profile.parameters.cashSleeve.targetWeightPct;
    case CAP_PARAMETER_ID:
      return profile.parameters.capPolicy.maxWeightPct;
    case REBALANCE_PARAMETER_ID:
      return profile.parameters.rebalance.thresholdBps;
    default:
      return undefined;
  }
}

function changedParameterIds(fromProfile, toProfile) {
  return [
    UNIVERSE_PARAMETER_ID,
    HOLDINGS_PARAMETER_ID,
    STARTER_BIAS_PARAMETER_ID,
    SIGNAL_POWER_PARAMETER_ID,
    CASH_PARAMETER_ID,
    CAP_PARAMETER_ID,
    REBALANCE_PARAMETER_ID,
  ].filter((parameterId) => policyProfileValue(fromProfile, parameterId) !== policyProfileValue(toProfile, parameterId));
}

function buildProfileDescription(profile, taxonomy) {
  return [
    "basket_policy_profile",
    `profile_id=${profile.profileId}`,
    `candidate_family_id=${taxonomy.familyId}`,
    `candidate_family_class=${taxonomy.familyClassId}`,
    `anchor_basket=${profile.anchorBasketId}`,
    `selection_universe=${profile.parameters.starterAnchoring.selectionUniverse}`,
    `top_n=${profile.parameters.breadth.topN}`,
    `starter_bias_pct=${profile.parameters.starterAnchoring.starterBiasPct}`,
    `weighting_curve=${profile.parameters.weighting.curveId}`,
    `weight_exponent=${round(profile.parameters.weighting.exponent, 2)}`,
    `cap_policy=${profile.parameters.capPolicy.mode}`,
    `max_weight_pct=${profile.parameters.capPolicy.maxWeightPct}`,
    `cap_redistribution=${profile.parameters.capPolicy.redistributionMode}`,
    `cash_sleeve=${profile.parameters.cashSleeve.mode}`,
    `cash_asset=${profile.parameters.cashSleeve.assetSymbol}`,
    `cash_weight_pct=${profile.parameters.cashSleeve.targetWeightPct}`,
    `rebalance_policy=${profile.parameters.rebalance.mode}`,
    `rebalance_threshold_bps=${profile.parameters.rebalance.thresholdBps}`,
  ].join(";");
}

function buildSearchSurface(slot, bundle, starterBasket) {
  const baselinePolicy = buildBaselineBasketPolicy(slot.slotId, bundle);
  const coreUniverseCount = activeCoreUniverseAssets(bundle).length;
  const baselineHoldingsCount = starterBasket.members.length;
  const focusHoldingsCount = Math.max(MIN_HOLDINGS_COUNT, baselineHoldingsCount - 1);
  const deeperFocusHoldingsCount =
    baselineHoldingsCount >= MIN_HOLDINGS_COUNT + 2
      ? Math.max(MIN_HOLDINGS_COUNT, baselineHoldingsCount - 2)
      : null;
  const breadthExpansionCount =
    baselineHoldingsCount >= 6
      ? Math.min(coreUniverseCount, baselineHoldingsCount)
      : Math.min(coreUniverseCount, baselineHoldingsCount + 1);
  const cashWeightOptions = uniqueNumbers([
    round(clamp(slot.targetCashWeight - CASH_WEIGHT_DELTA, 0, MAX_CASH_WEIGHT), 4),
    round(slot.targetCashWeight, 4),
    round(clamp(slot.targetCashWeight + CASH_WEIGHT_DELTA, 0, MAX_CASH_WEIGHT), 4),
    ...extraCashWeightOptions(slot.slotId),
  ]);
  const concentrationCapOptions = uniqueNumbers([
    clamp(slot.concentrationCapPct - CONCENTRATION_CAP_DELTA_PCT, 10, bundle.executionCostModel.max_concentration_pct),
    slot.concentrationCapPct,
  ]);
  const rebalanceThresholdOptions = uniqueNumbers([
    slot.rebalanceThresholdBps - REBALANCE_THRESHOLD_DELTA_BPS,
    slot.rebalanceThresholdBps,
    slot.rebalanceThresholdBps + REBALANCE_THRESHOLD_DELTA_BPS,
  ]);
  const holdingsCountOptions = uniqueNumbers([
    baselineHoldingsCount,
    focusHoldingsCount,
    deeperFocusHoldingsCount,
    breadthExpansionCount,
  ]);

  return {
    slotId: slot.slotId,
    anchorBasketId: starterBasket.basket_id,
    baselinePolicy,
    defaultPolicyProfile: buildPolicyProfile(baselinePolicy, slot, starterBasket),
    fixedParameters: [
      {
        parameterId: "anchor_basket",
        value: starterBasket.basket_id,
        note: "Slot identity stays anchored to the pinned starter basket even when candidate selection widens.",
      },
      {
        parameterId: "ranking_signal",
        value: SCORE_SIGNAL_ID,
        note: "The frozen bundle exposes only baseline signal score for basket ranking.",
      },
      {
        parameterId: "min_weight_pct",
        value: 0,
        note: "Minimum single-name floors stay disabled to avoid hidden redistribution complexity in the frozen harness.",
      },
      {
        parameterId: "benchmark_id",
        value: slot.benchmarkId,
        note: "Benchmark comparison stays pinned by slot and evaluator semantics.",
      },
    ],
    tunableParameters: [
      {
        parameterId: UNIVERSE_PARAMETER_ID,
        parameterPath: "parameters.starterAnchoring.selectionUniverse",
        baselineValue: STARTER_ONLY_MODE,
        allowedValues: [STARTER_ONLY_MODE, CORE_UNIVERSE_MODE],
        scoreAffects: true,
        note: "Core-universe mode keeps the slot anchor but can admit non-starter xStocks names.",
      },
      {
        parameterId: HOLDINGS_PARAMETER_ID,
        parameterPath: "parameters.breadth.topN",
        baselineValue: baselinePolicy.holdingsCount,
        allowedValues: holdingsCountOptions,
        scoreAffects: true,
        note: "Controls basket breadth after ranking and before weighting.",
      },
      {
        parameterId: STARTER_BIAS_PARAMETER_ID,
        parameterPath: "parameters.starterAnchoring.starterBiasPct",
        baselineValue: 0,
        allowedValues: STARTER_BIAS_OPTIONS,
        scoreAffects: true,
        note: "Only applies in core-universe mode. Starter names can keep a score boost inside the broader pool.",
      },
      {
        parameterId: SIGNAL_POWER_PARAMETER_ID,
        parameterPath: "parameters.weighting.exponent",
        baselineValue: 1,
        allowedValues: SIGNAL_POWER_OPTIONS,
        scoreAffects: true,
        note: "Raises or flattens the weighting curve after ranking.",
      },
      {
        parameterId: CASH_PARAMETER_ID,
        parameterPath: "parameters.cashSleeve.targetWeightPct",
        baselineValue: baselinePolicy.cashWeight,
        allowedValues: cashWeightOptions,
        scoreAffects: true,
        note: "Controls how much stays in the AUSD yield buffer instead of xStocks exposure.",
      },
      {
        parameterId: CAP_PARAMETER_ID,
        parameterPath: "parameters.capPolicy.maxWeightPct",
        baselineValue: baselinePolicy.maxWeightPct,
        allowedValues: concentrationCapOptions,
        scoreAffects: true,
        note: "Can tighten concentration below the slot cap, but cannot loosen beyond the slot cap without changing frozen slot semantics.",
      },
      {
        parameterId: REBALANCE_PARAMETER_ID,
        parameterPath: "parameters.rebalance.thresholdBps",
        baselineValue: baselinePolicy.rebalanceThresholdBps,
        allowedValues: rebalanceThresholdOptions,
        scoreAffects: true,
        note: "Authoritative scoring now uses path-dependent drift-triggered rebalances, so this threshold changes turnover, costs, and score.",
      },
    ],
  };
}

function normalizeBasketPolicy(policy, slot, bundle, starterBasket) {
  const surface = buildSearchSurface(slot, bundle, starterBasket);
  const allowedValues = Object.fromEntries(
    surface.tunableParameters.map((parameter) => [parameter.parameterId, parameter.allowedValues]),
  );
  const mergedPolicy = {
    ...surface.baselinePolicy,
    ...policy,
  };
  const eligibleUniverseCount =
    mergedPolicy.selectionUniverse === CORE_UNIVERSE_MODE
      ? activeCoreUniverseAssets(bundle).length
      : starterBasket.members.length;

  if (!allowedValues.selection_universe.includes(mergedPolicy.selectionUniverse)) {
    throw new Error(`Unsupported selection_universe for ${slot.slotId}: ${mergedPolicy.selectionUniverse}`);
  }

  if (!allowedValues.holdings_count.includes(mergedPolicy.holdingsCount)) {
    throw new Error(`Unsupported holdings_count for ${slot.slotId}: ${mergedPolicy.holdingsCount}`);
  }

  if (!allowedValues.starter_bias_pct.includes(mergedPolicy.starterBiasPct)) {
    throw new Error(`Unsupported starter_bias_pct for ${slot.slotId}: ${mergedPolicy.starterBiasPct}`);
  }

  if (!allowedValues.signal_power.includes(mergedPolicy.signalPower)) {
    throw new Error(`Unsupported signal_power for ${slot.slotId}: ${mergedPolicy.signalPower}`);
  }

  if (!allowedValues.cash_weight.includes(mergedPolicy.cashWeight)) {
    throw new Error(`Unsupported cash_weight for ${slot.slotId}: ${mergedPolicy.cashWeight}`);
  }

  if (!allowedValues.max_weight_pct.includes(mergedPolicy.maxWeightPct)) {
    throw new Error(`Unsupported max_weight_pct for ${slot.slotId}: ${mergedPolicy.maxWeightPct}`);
  }

  if (!allowedValues.rebalance_threshold_bps.includes(mergedPolicy.rebalanceThresholdBps)) {
    throw new Error(
      `Unsupported rebalance_threshold_bps for ${slot.slotId}: ${mergedPolicy.rebalanceThresholdBps}`,
    );
  }

  if (mergedPolicy.holdingsCount * mergedPolicy.maxWeightPct < (1 - mergedPolicy.cashWeight) * 100) {
    throw new Error(
      `Infeasible basket policy for ${slot.slotId}: ${mergedPolicy.holdingsCount} holdings cannot absorb ${(1 - mergedPolicy.cashWeight) * 100}% investable capital under a ${mergedPolicy.maxWeightPct}% cap.`,
    );
  }

  if (mergedPolicy.selectionUniverse === STARTER_ONLY_MODE) {
    mergedPolicy.starterBiasPct = 0;
  }

  mergedPolicy.holdingsCount = Math.min(mergedPolicy.holdingsCount, eligibleUniverseCount);
  return mergedPolicy;
}

function eligibleAssetsForPolicy(bundle, starterBasket, policy) {
  const starterSet = new Set(starterBasket.members);
  const assets =
    policy.selectionUniverse === CORE_UNIVERSE_MODE
      ? activeCoreUniverseAssets(bundle)
      : starterBasket.members.map((symbol) => getUniverseAsset(bundle, symbol));

  return assets
    .map((asset) => {
      const starterBoost = starterSet.has(asset.symbol) ? 1 + policy.starterBiasPct / 100 : 1;
      return {
        ...asset,
        adjustedSignalScore: asset.baseline_signal_score * starterBoost,
      };
    })
    .sort(
      (left, right) =>
        right.adjustedSignalScore - left.adjustedSignalScore ||
        left.symbol.localeCompare(right.symbol),
    );
}

function capWeights(rawWeights, investableCapital, maxWeightFraction) {
  const cappedSymbols = new Set();
  const finalWeights = {};
  const workingWeights = new Map(rawWeights.map(([symbol, weight]) => [symbol, weight]));

  while (true) {
    const uncappedEntries = [...workingWeights.entries()].filter(([symbol]) => !cappedSymbols.has(symbol));
    const uncappedRawTotal = uncappedEntries.reduce((sum, [, weight]) => sum + weight, 0);
    const lockedWeight = Object.values(finalWeights).reduce((sum, value) => sum + value, 0);
    const remainingCapital = investableCapital - lockedWeight;

    if (uncappedEntries.length === 0 || remainingCapital <= 0) {
      break;
    }

    if (uncappedRawTotal <= 0) {
      const equalShare = remainingCapital / uncappedEntries.length;
      for (const [symbol] of uncappedEntries) {
        finalWeights[symbol] = Math.min(maxWeightFraction, equalShare);
      }
      break;
    }

    let overflowDetected = false;

    for (const [symbol, rawWeight] of uncappedEntries) {
      const normalized = (rawWeight / uncappedRawTotal) * remainingCapital;
      if (normalized > maxWeightFraction) {
        finalWeights[symbol] = maxWeightFraction;
        cappedSymbols.add(symbol);
        overflowDetected = true;
      }
    }

    if (!overflowDetected) {
      for (const [symbol, rawWeight] of uncappedEntries) {
        finalWeights[symbol] = (rawWeight / uncappedRawTotal) * remainingCapital;
      }
      break;
    }
  }

  return finalWeights;
}

function buildReasonCodes(policy, starterBasket) {
  return [
    `starter_basket:${starterBasket.basket_id}`,
    `selection_universe:${policy.selectionUniverse}`,
    `holdings_count:${policy.holdingsCount}`,
    `starter_bias:${pctToReasonValue(policy.starterBiasPct)}`,
    `ranking:${SCORE_SIGNAL_ID}`,
    `weighting_curve:${weightingCurveCode(policy.signalPower)}`,
    `signal_power:${signalPowerReasonValue(policy.signalPower)}`,
    `cash_weight:${pctToReasonValue(policy.cashWeight * 100)}`,
    `concentration_cap:${pctToReasonValue(policy.maxWeightPct)}`,
    `rebalance_threshold:${rebalanceThresholdReasonValue(policy.rebalanceThresholdBps)}`,
  ];
}

export function basketPlanSignature(plan) {
  return JSON.stringify({
    cashWeight: round(plan.cashWeight ?? 0, 6),
    rebalanceThresholdBps: plan.rebalanceThresholdBps ?? null,
    targetWeights: [...plan.targetWeights]
      .map((entry) => ({
        symbol: entry.symbol,
        weight: round(entry.weight, 6),
      }))
      .sort((left, right) => left.symbol.localeCompare(right.symbol)),
  });
}

export function buildBasketPlan({ slotId, bundle, policy = null }) {
  const slot = getBasketSlot(slotId);
  const starterBasket = getStarterBasket(bundle, slot.starterBasketId);
  const normalizedPolicy = normalizeBasketPolicy(policy, slot, bundle, starterBasket);
  const rankedAssets = eligibleAssetsForPolicy(bundle, starterBasket, normalizedPolicy);
  const selectedAssets = rankedAssets.slice(0, normalizedPolicy.holdingsCount);
  const investableCapital = 1 - normalizedPolicy.cashWeight;
  const maxWeightFraction = normalizedPolicy.maxWeightPct / 100;
  const rawWeights = selectedAssets.map((asset) => [
    asset.symbol,
    asset.adjustedSignalScore ** normalizedPolicy.signalPower,
  ]);
  const targetWeights = Object.entries(capWeights(rawWeights, investableCapital, maxWeightFraction))
    .map(([symbol, weight]) => ({
      symbol,
      weight: round(weight),
      assetName: getUniverseAsset(bundle, symbol).name,
    }))
    .sort((left, right) => right.weight - left.weight || left.symbol.localeCompare(right.symbol));

  return {
    targetWeights,
    cashWeight: round(normalizedPolicy.cashWeight, 6),
    rebalanceThresholdBps: normalizedPolicy.rebalanceThresholdBps,
    reasonCodes: buildReasonCodes(normalizedPolicy, starterBasket),
  };
}

function createChallengerStrategyVersion(policy) {
  return `basket-${buildBasketPolicySlug(policy)}-${BASKET_POLICY_VERSION}`;
}

function createChallengerRef(slotId, policy) {
  return `basket-challenger:${slotId}:${buildBasketPolicySlug(policy)}:${BASKET_POLICY_VERSION}`;
}

function createCandidate(slot, starterBasket, bundle, policy, mode) {
  const policyProfile = buildPolicyProfile(policy, slot, starterBasket);
  const taxonomy = buildCandidateTaxonomy(policy.policyId);
  const plan = buildBasketPlan({
    slotId: slot.slotId,
    bundle,
    policy,
  });

  return {
    candidateRef:
      mode === "baseline"
        ? `basket-baseline:${slot.slotId}:${slot.starterBasketId}:v1`
        : createChallengerRef(slot.slotId, policy),
    mode: "basket",
    slotId: slot.slotId,
    strategyVersion:
      mode === "baseline" ? slot.strategyVersion : createChallengerStrategyVersion(policy),
    basketId: slot.starterBasketId,
    benchmarkId: slot.benchmarkId,
    description: buildProfileDescription(policyProfile, taxonomy),
    policy,
    policyProfile,
    taxonomy,
    plan,
  };
}

function wavePolicyTemplates(surface) {
  const baseline = surface.baselinePolicy;
  const lowerCashWeight =
    surface.tunableParameters.find((parameter) => parameter.parameterId === CASH_PARAMETER_ID)?.allowedValues[0] ??
    baseline.cashWeight;
  const lowerRebalanceThreshold =
    surface.tunableParameters.find((parameter) => parameter.parameterId === REBALANCE_PARAMETER_ID)
      ?.allowedValues[0] ?? baseline.rebalanceThresholdBps;
  const tighterCap =
    surface.tunableParameters.find((parameter) => parameter.parameterId === CAP_PARAMETER_ID)?.allowedValues[0] ??
    baseline.maxWeightPct;
  const convictionPower = 1.4;
  const broadenedBreadth = Math.min(
    6,
    surface.tunableParameters.find((parameter) => parameter.parameterId === HOLDINGS_PARAMETER_ID)?.allowedValues.at(-1) ??
      baseline.holdingsCount,
  );
  const reducedBreadths = [
    ...surface.tunableParameters.find((parameter) => parameter.parameterId === HOLDINGS_PARAMETER_ID)?.allowedValues ??
      [],
  ].filter((count) => count < baseline.holdingsCount);
  const moderateFocusBreadth = reducedBreadths.at(-1) ?? baseline.holdingsCount;
  const deepFocusBreadth = reducedBreadths[0] ?? moderateFocusBreadth;
  return [
    { templateId: "trim_holdings", overrides: { holdingsCount: moderateFocusBreadth } },
    ...(surface.slotId === "onboarding.alt_basket_2"
      ? [
          {
            templateId: "trim_holdings_lighter_cash",
            overrides: {
              holdingsCount: moderateFocusBreadth,
              cashWeight: lowerCashWeight,
            },
          },
        ]
      : []),
    { templateId: "higher_conviction", overrides: { signalPower: convictionPower } },
    { templateId: "lighter_cash", overrides: { cashWeight: lowerCashWeight } },
    { templateId: "tighter_cap", overrides: { maxWeightPct: tighterCap } },
    {
      templateId: "broader_core",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: Math.max(baseline.holdingsCount, broadenedBreadth),
        starterBiasPct: 0,
      },
    },
    {
      templateId: "broader_core_anchor_bias",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: Math.max(baseline.holdingsCount, broadenedBreadth),
        starterBiasPct: 12,
      },
    },
    {
      templateId: "broader_core_focused",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: moderateFocusBreadth,
        starterBiasPct: 0,
      },
    },
    {
      templateId: "broader_core_same_breadth_lighter_cash",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: baseline.holdingsCount,
        starterBiasPct: 0,
        cashWeight: lowerCashWeight,
      },
    },
    ...(surface.slotId === "onboarding.alt_basket_1" &&
    lowerRebalanceThreshold < baseline.rebalanceThresholdBps
      ? [
          {
            templateId: "broader_core_same_breadth_lighter_cash_lower_rebalance",
            overrides: {
              selectionUniverse: CORE_UNIVERSE_MODE,
              holdingsCount: baseline.holdingsCount,
              starterBiasPct: 0,
              cashWeight: lowerCashWeight,
              rebalanceThresholdBps: lowerRebalanceThreshold,
            },
          },
        ]
      : []),
    {
      templateId: "broader_core_same_breadth_lighter_cash_anchor_bias",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: baseline.holdingsCount,
        starterBiasPct: 12,
        cashWeight: lowerCashWeight,
      },
    },
    {
      templateId: "broader_core_focused_lighter_cash",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: moderateFocusBreadth,
        starterBiasPct: 0,
        cashWeight: lowerCashWeight,
      },
    },
    {
      templateId: "broader_core_focused_tighter_cap",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: moderateFocusBreadth,
        starterBiasPct: 0,
        maxWeightPct: tighterCap,
      },
    },
    {
      templateId: "broader_core_focused_tighter_cap_conviction",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: moderateFocusBreadth,
        starterBiasPct: 0,
        cashWeight: lowerCashWeight,
        maxWeightPct: tighterCap,
        signalPower: convictionPower,
      },
    },
    {
      templateId: "broader_core_deep_focus_tighter_cap_conviction",
      overrides: {
        selectionUniverse: CORE_UNIVERSE_MODE,
        holdingsCount: deepFocusBreadth,
        starterBiasPct: 0,
        cashWeight: lowerCashWeight,
        maxWeightPct: tighterCap,
        signalPower: convictionPower,
      },
    },
    {
      templateId: "starter_deep_focus_tighter_cap_conviction",
      overrides: {
        holdingsCount: deepFocusBreadth,
        cashWeight: lowerCashWeight,
        maxWeightPct: tighterCap,
        signalPower: convictionPower,
      },
    },
  ];
}

function buildSearchProfiles(surface, slot, starterBasket, bundle) {
  return wavePolicyTemplates(surface).flatMap(({ templateId, overrides }) => {
    try {
      const policy = normalizeBasketPolicy(
        {
          ...surface.baselinePolicy,
          ...overrides,
          policyId: templateId,
        },
        slot,
        bundle,
        starterBasket,
      );
      const policyProfile = buildPolicyProfile(policy, slot, starterBasket);

      return [
        {
          profileId: templateId,
          changedParameterIds: changedParameterIds(surface.defaultPolicyProfile, policyProfile),
          policy,
          policyProfile,
          taxonomy: buildCandidateTaxonomy(templateId),
        },
      ];
    } catch {
      return [];
    }
  });
}

export function describeBasketSearchSurface(slotId, bundle) {
  const slot = getBasketSlot(slotId);
  const starterBasket = getStarterBasket(bundle, slot.starterBasketId);
  const surface = buildSearchSurface(slot, bundle, starterBasket);

  return {
    ...surface,
    searchProfiles: buildSearchProfiles(surface, slot, starterBasket, bundle).map((searchProfile) => ({
      profileId: searchProfile.profileId,
      changedParameterIds: searchProfile.changedParameterIds,
      policyProfile: searchProfile.policyProfile,
      taxonomy: searchProfile.taxonomy,
    })),
  };
}

export function listBasketChallengerCandidates(slotId, bundle) {
  const slot = getBasketSlot(slotId);
  const starterBasket = getStarterBasket(bundle, slot.starterBasketId);
  const surface = buildSearchSurface(slot, bundle, starterBasket);
  const baselineCandidate = createCandidate(slot, starterBasket, bundle, surface.baselinePolicy, "baseline");
  const seenPlanSignatures = new Set([basketPlanSignature(baselineCandidate.plan)]);

  return buildSearchProfiles(surface, slot, starterBasket, bundle)
    .map(({ policy }) => createCandidate(slot, starterBasket, bundle, policy, "challenger"))
    .filter((candidate) => {
      const signature = basketPlanSignature(candidate.plan);
      if (seenPlanSignatures.has(signature)) {
        return false;
      }

      seenPlanSignatures.add(signature);
      return true;
    });
}

export function buildBaselineBasketCandidate(slotId, bundle) {
  const slot = getBasketSlot(slotId);
  const starterBasket = getStarterBasket(bundle, slot.starterBasketId);
  const baselinePolicy = buildBaselineBasketPolicy(slotId, bundle);
  return createCandidate(slot, starterBasket, bundle, baselinePolicy, "baseline");
}

export function diffBasketPolicyProfiles(fromProfile, toProfile) {
  return changedParameterIds(fromProfile, toProfile);
}
