import { buildDirectionalPreviewPayload } from "../../euler/dist/index.js";

import { getStarterBasket, getUniverseAsset, loadResearchBundle } from "./bundle.js";
import {
  CHAIN,
  CONTRACT_VERSION,
  DATASET_VERSION,
  EVALUATOR_VERSION,
  LIVE_TRUTH_SOURCE_ID,
  MANUAL_VERSION,
  OBJECTIVES,
  PRIMARY_BENCHMARK_ID,
  PROMOTION_EPSILON,
  RESEARCH_DATASET_ID,
  UNIVERSE_ID,
  VALIDATION_SET_ID,
} from "./constants.js";
import { deriveBasketSummaryArtifacts } from "./explanations.js";
import { parseResearchResultRow } from "./shared-contracts.js";
import { getBasketSlot } from "./slots.js";

function round(value, places = 6) {
  return Number(value.toFixed(places));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function roundNullable(value, places = 6) {
  return isFiniteNumber(value) ? round(value, places) : null;
}

function percentFromFraction(value, places = 4) {
  return isFiniteNumber(value) ? round(value * 100, places) : null;
}

function normalizeRunIdPart(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || null;
}

function createRunId(stage, slotId, completedAtUtc, disambiguator = null) {
  const compactTimestamp = completedAtUtc.replaceAll("-", "").replaceAll(":", "").replaceAll(".", "");
  const normalizedDisambiguator = normalizeRunIdPart(disambiguator);
  const baseRunId = `${stage}-${slotId}-${compactTimestamp}`.replaceAll("Z", "z");
  return normalizedDisambiguator ? `${baseRunId}-${normalizedDisambiguator}` : baseRunId;
}

function weightsBySymbol(plan) {
  return Object.fromEntries(plan.targetWeights.map((entry) => [entry.symbol, entry.weight]));
}

function computeMaxDrawdown(navSeries) {
  let peak = navSeries[0];
  let maxDrawdown = 0;

  for (const nav of navSeries) {
    peak = Math.max(peak, nav);
    const drawdown = ((peak - nav) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return round(maxDrawdown, 4);
}

function buildBenchmarkPlan(bundle) {
  const benchmarkBasket = getStarterBasket(bundle, "sp500_core");
  return {
    basketId: benchmarkBasket.basket_id,
    targetWeights: benchmarkBasket.members.map((symbol) => ({
      symbol,
      weight: round(1 / benchmarkBasket.members.length),
    })),
    cashWeight: 0,
    rebalanceThresholdBps: 0,
    reasonCodes: ["benchmark:sp500_core"],
  };
}

function resolvePrimaryValidationWindow(bundle) {
  const validationWindows = bundle.validationWindows.windows ?? [];
  const primaryWindowId = bundle.validationWindows.primary_window_id ?? validationWindows[0]?.window_id;
  const validationWindow = validationWindows.find((window) => window.window_id === primaryWindowId);

  if (!validationWindow) {
    throw new Error(`Primary validation window not found: ${primaryWindowId}`);
  }

  return validationWindow;
}

function filterValidationPoints(bundle) {
  const validationWindow = resolvePrimaryValidationWindow(bundle);
  return bundle.prices.points.filter(
    (point) => point.date >= validationWindow.start && point.date <= validationWindow.end,
  );
}

function computeLegacyStaticWeightMetrics(bundle, plan, points) {
  const periodCount = Math.max(points.length - 1, 0);
  const weights = weightsBySymbol(plan);
  const navSeries = [1];
  let nav = 1;

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];
    const periodReturn = Object.entries(weights).reduce((sum, [symbol, weight]) => {
      const previousPrice = previousPoint.prices[symbol];
      const currentPrice = currentPoint.prices[symbol];
      return sum + weight * ((currentPrice - previousPrice) / previousPrice);
    }, 0);
    nav *= 1 + periodReturn;
    navSeries.push(nav);
  }

  const annualPeriods = bundle.executionCostModel.periods_per_year;
  const turnoverAnnPct = round((1 - plan.cashWeight) * 100, 4);
  const costsTotalBps = round(
    (turnoverAnnPct / 100) * bundle.executionCostModel.turnover_cost_bps_per_100pct +
      bundle.executionCostModel.fixed_rebalance_gas_bps,
    4,
  );
  const returnAnnPct =
    periodCount > 0 ? round((nav ** (annualPeriods / periodCount) - 1) * 100, 4) : 0;

  return {
    modelId: "static_weight_proxy_v1",
    navFinal: round(nav, 6),
    returnAnnPct,
    maxDrawdownPct: computeMaxDrawdown(navSeries),
    turnoverAnnPct,
    costsTotalBps,
  };
}

function computePathDependentRebalanceMetrics(bundle, plan, points) {
  const periodCount = Math.max(points.length - 1, 0);
  if (periodCount === 0) {
    return {
      modelId: "path_dependent_rebalance_after_cost_v1",
      thresholdBps: plan.rebalanceThresholdBps ?? 0,
      rebalanceEventCount: 0,
      rebalanceEventsAnn: 0,
      turnoverWindowPct: 0,
      turnoverAnnPct: 0,
      costsTotalBps: 0,
      maxObservedDriftBps: 0,
      avgObservedDriftBps: 0,
      rebalanceDates: [],
      navFinal: 1,
      netNavFinal: 1,
      returnAnnPct: 0,
      afterCostReturnAnnPct: 0,
      maxDrawdownPct: 0,
      netMaxDrawdownPct: 0,
      observedWeightMaxPct: round(
        Math.max(...plan.targetWeights.map((entry) => entry.weight * 100), plan.cashWeight * 100),
        4,
      ),
      pointDates: points.map((point) => point.date),
      netNavSeries: [1],
    };
  }

  const targetAssetWeights = Object.fromEntries(
    plan.targetWeights.map((entry) => [entry.symbol, entry.weight]),
  );
  const symbols = Object.keys(targetAssetWeights);
  const targetCashWeight = plan.cashWeight ?? 0;
  const thresholdFraction = Math.max((plan.rebalanceThresholdBps ?? 0) / 10000, 0);
  const annualizationFactor = bundle.executionCostModel.periods_per_year / periodCount;
  const rebalanceDates = [];
  const driftSamples = [];
  const grossNavSeries = [1];
  const netNavSeries = [1];
  let rebalanceEventCount = 0;
  let turnoverWindowFraction = 0;
  let totalCostWindowFraction = 0;
  let grossNav = 1;
  let netNav = 1;
  let cashNotional = grossNav * targetCashWeight;
  let observedWeightMaxPct = round(
    Math.max(...plan.targetWeights.map((entry) => entry.weight * 100), targetCashWeight * 100),
    4,
  );
  const assetNotionals = Object.fromEntries(
    symbols.map((symbol) => [symbol, grossNav * (targetAssetWeights[symbol] ?? 0)]),
  );

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];

    for (const symbol of symbols) {
      assetNotionals[symbol] *= currentPoint.prices[symbol] / previousPoint.prices[symbol];
    }

    const assetTotal = symbols.reduce((sum, symbol) => sum + assetNotionals[symbol], 0);
    let grossPortfolioValue = cashNotional + assetTotal;
    const currentCashWeight = grossPortfolioValue > 0 ? cashNotional / grossPortfolioValue : 0;
    const currentAssetWeights = Object.fromEntries(
      symbols.map((symbol) => [
        symbol,
        grossPortfolioValue > 0 ? assetNotionals[symbol] / grossPortfolioValue : 0,
      ]),
    );
    observedWeightMaxPct = Math.max(
      observedWeightMaxPct,
      round(Math.max(currentCashWeight * 100, ...Object.values(currentAssetWeights).map((weight) => weight * 100)), 4),
    );
    const maxObservedDriftFraction = Math.max(
      Math.abs(currentCashWeight - targetCashWeight),
      ...symbols.map((symbol) => Math.abs((currentAssetWeights[symbol] ?? 0) - targetAssetWeights[symbol])),
    );
    const turnoverFraction =
      (Math.abs(currentCashWeight - targetCashWeight) +
        symbols.reduce(
          (sum, symbol) => sum + Math.abs((currentAssetWeights[symbol] ?? 0) - targetAssetWeights[symbol]),
          0,
        )) /
      2;

    driftSamples.push(maxObservedDriftFraction);

    if (maxObservedDriftFraction + 1e-12 < thresholdFraction || turnoverFraction <= 0) {
      grossNav = grossPortfolioValue;
      netNav *= grossPortfolioValue / Math.max(grossNavSeries.at(-1), Number.EPSILON);
      grossNavSeries.push(grossNav);
      netNavSeries.push(netNav);
      continue;
    }

    const costFraction =
      turnoverFraction *
        (bundle.executionCostModel.turnover_cost_bps_per_100pct / 10000) +
      bundle.executionCostModel.fixed_rebalance_gas_bps / 10000;
    turnoverWindowFraction += turnoverFraction;
    totalCostWindowFraction += costFraction;
    rebalanceEventCount += 1;
    rebalanceDates.push(currentPoint.date);
    const grossGrowth = grossPortfolioValue / Math.max(grossNavSeries.at(-1), Number.EPSILON);
    grossNav = grossPortfolioValue;
    netNav *= grossGrowth * (1 - costFraction);
    cashNotional = grossNav * targetCashWeight;

    for (const symbol of symbols) {
      assetNotionals[symbol] = grossNav * targetAssetWeights[symbol];
    }

    grossNavSeries.push(grossNav);
    netNavSeries.push(netNav);
  }

  const turnoverWindowPct = round(turnoverWindowFraction * 100, 4);
  const turnoverAnnPct = round(turnoverWindowPct * annualizationFactor, 4);
  const rebalanceEventsAnn = round(rebalanceEventCount * annualizationFactor, 4);
  const costsTotalBps = round(totalCostWindowFraction * 10000 * annualizationFactor, 4);
  const returnAnnPct = round(
    (grossNav ** (bundle.executionCostModel.periods_per_year / periodCount) - 1) * 100,
    4,
  );
  const afterCostReturnAnnPct = round(
    (netNav ** (bundle.executionCostModel.periods_per_year / periodCount) - 1) * 100,
    4,
  );

  return {
    modelId: "path_dependent_rebalance_after_cost_v1",
    thresholdBps: plan.rebalanceThresholdBps ?? 0,
    rebalanceEventCount,
    rebalanceEventsAnn,
    turnoverWindowPct,
    turnoverAnnPct,
    costsTotalBps,
    maxObservedDriftBps: round(Math.max(...driftSamples, 0) * 10000, 4),
    avgObservedDriftBps:
      driftSamples.length > 0
        ? round(
            (driftSamples.reduce((sum, driftFraction) => sum + driftFraction, 0) / driftSamples.length) *
              10000,
            4,
          )
        : 0,
    rebalanceDates,
    navFinal: round(grossNav, 6),
    netNavFinal: round(netNav, 6),
    returnAnnPct,
    afterCostReturnAnnPct,
    maxDrawdownPct: computeMaxDrawdown(grossNavSeries),
    netMaxDrawdownPct: computeMaxDrawdown(netNavSeries),
    observedWeightMaxPct,
    pointDates: points.map((point) => point.date),
    netNavSeries: netNavSeries.map((value) => round(value, 6)),
  };
}

function buildReplayPointIndices(length, maxPoints) {
  if (length <= maxPoints) {
    return Array.from({ length }, (_, index) => index);
  }

  const indices = new Set([0, length - 1]);
  const interiorPointCount = Math.max(maxPoints - 2, 0);

  for (let position = 1; position <= interiorPointCount; position += 1) {
    indices.add(Math.round((position * (length - 1)) / (interiorPointCount + 1)));
  }

  return [...indices].sort((left, right) => left - right);
}

function labelReplayPoint(date, index, lastIndex) {
  if (index === 0) {
    return "Open";
  }

  if (index === lastIndex) {
    return "Now";
  }

  return typeof date === "string" && date.length >= 10 ? date.slice(5) : `T${index + 1}`;
}

export function deriveBasketReplaySurface(summary, options = {}) {
  const bundle = options.bundle ?? loadResearchBundle();
  const startingCapitalUsd = Number(options.startingCapitalUsd ?? 1000);
  const maxPoints = Number(options.maxPoints ?? 8);
  const plan = summary?.candidate?.plan;

  if (!plan) {
    throw new Error("Basket replay surface requires summary.candidate.plan.");
  }

  const validationPoints = filterValidationPoints(bundle);
  const replayMetrics = computePathDependentRebalanceMetrics(
    bundle,
    plan,
    validationPoints,
  );
  const navSeries = replayMetrics.netNavSeries ?? [1];
  const pointDates = replayMetrics.pointDates ?? validationPoints.map((point) => point.date);
  const replayIndices = buildReplayPointIndices(navSeries.length, maxPoints);
  const replayPoints = replayIndices.map((index) => ({
    label: labelReplayPoint(pointDates[index], index, navSeries.length - 1),
    date: pointDates[index],
    value: round(startingCapitalUsd * navSeries[index], 2),
  }));
  const winningPeriods = navSeries.slice(1).filter((value, index) => value > navSeries[index]).length;
  const periodCount = Math.max(navSeries.length - 1, 0);

  return {
    startingCapital: round(startingCapitalUsd, 2),
    endingCapital: round(startingCapitalUsd * navSeries.at(-1), 2),
    netReturnPct: round((navSeries.at(-1) - 1) * 100, 4),
    maxDrawdownPct: round(-(replayMetrics.netMaxDrawdownPct ?? replayMetrics.maxDrawdownPct ?? 0), 4),
    turnoverPct: round(replayMetrics.turnoverAnnPct ?? summary?.metrics?.turnoverAnnPct ?? 0, 4),
    winRatePct: round(periodCount === 0 ? 0 : (winningPeriods / periodCount) * 100, 4),
    points: replayPoints,
  };
}

function computePortfolioMetrics(bundle, plan) {
  const points = filterValidationPoints(bundle);
  const legacyStaticWeight = computeLegacyStaticWeightMetrics(bundle, plan, points);
  const rebalanceSimulation = computePathDependentRebalanceMetrics(bundle, plan, points);
  const weightMaxPct = round(
    Math.max(...plan.targetWeights.map((entry) => entry.weight), 0) * 100,
    4,
  );

  return {
    navFinal: rebalanceSimulation.navFinal,
    returnAnnPct: rebalanceSimulation.returnAnnPct,
    maxDrawdownPct: rebalanceSimulation.maxDrawdownPct,
    turnoverAnnPct: rebalanceSimulation.turnoverAnnPct,
    costsTotalBps: rebalanceSimulation.costsTotalBps,
    constituentCountAvg: plan.targetWeights.length,
    weightMaxPct,
    rebalanceSimulation,
    legacyStaticWeight,
  };
}

function validateBasketCandidate(candidate, bundle, slot) {
  if (candidate.mode !== "basket") {
    throw new Error(`evaluateBasket received non-basket mode: ${candidate.mode}`);
  }

  const totalWeight =
    candidate.plan.cashWeight +
    candidate.plan.targetWeights.reduce((sum, entry) => sum + entry.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.0001) {
    throw new Error(`Target weights must sum to 1. Received ${totalWeight}`);
  }

  const maxConcentrationPct = Math.max(
    ...candidate.plan.targetWeights.map((entry) => entry.weight * 100),
  );
  if (maxConcentrationPct > slot.concentrationCapPct + 0.001) {
    throw new Error(`Concentration cap breached for ${candidate.slotId}`);
  }

  if (candidate.plan.targetWeights.some((entry) => entry.weight < 0)) {
    throw new Error("Negative weights are not allowed.");
  }

  const allowedSymbols = new Set(bundle.universeSnapshot.assets.map((asset) => asset.symbol));
  for (const weightEntry of candidate.plan.targetWeights) {
    if (!allowedSymbols.has(weightEntry.symbol)) {
      throw new Error(`Symbol outside pinned universe: ${weightEntry.symbol}`);
    }
  }
}

function computePrimaryScore(metrics, benchmarkMetrics) {
  const afterCostReturn = metrics.returnAnnPct - metrics.costsTotalBps / 100;
  const benchmarkAfterCostReturn =
    benchmarkMetrics.returnAnnPct - benchmarkMetrics.costsTotalBps / 100;
  const excessReturnAfterCost = afterCostReturn - benchmarkAfterCostReturn;
  return round(excessReturnAfterCost / Math.max(metrics.maxDrawdownPct, 5), 6);
}

function sharedSummaryBase({
  runId,
  completedAtUtc,
  stage,
  mode,
  slotId,
  status,
  objectiveId,
  candidateRef,
  resultRow,
}) {
  return {
    version: CONTRACT_VERSION,
    runId,
    completedAtUtc,
    stage,
    mode,
    slotId,
    status,
    objectiveId,
    candidateRef,
    resultRow,
    bundle: {
      researchDatasetId: RESEARCH_DATASET_ID,
      datasetVersion: DATASET_VERSION,
      validationSetId: VALIDATION_SET_ID,
      evaluatorVersion: EVALUATOR_VERSION,
      chainId: CHAIN,
      liveTruthSourceId: LIVE_TRUTH_SOURCE_ID,
    },
  };
}

function getDirectionalPreviewMarket(bundle, candidate) {
  const market = bundle.eulerMarketMap.markets.find(
    (entry) =>
      entry.base_asset === candidate.assetSymbol &&
      entry.borrow_asset === candidate.borrowAssetSymbol,
  );

  if (!market) {
    throw new Error(
      `Directional preview market missing from frozen bundle for ${candidate.assetSymbol}/${candidate.borrowAssetSymbol}.`,
    );
  }

  return market;
}

function resolveConservativeLiquidationThresholdBps(bundleMarket, overlayMarket) {
  const bundleThresholdBps = isFiniteNumber(bundleMarket?.max_ltv_pct)
    ? Math.round(bundleMarket.max_ltv_pct * 100)
    : null;
  const overlayThresholdBps = isFiniteNumber(overlayMarket?.liquidationThresholdBps)
    ? overlayMarket.liquidationThresholdBps
    : null;

  if (bundleThresholdBps !== null && overlayThresholdBps !== null) {
    return Math.min(bundleThresholdBps, overlayThresholdBps);
  }

  return bundleThresholdBps ?? overlayThresholdBps ?? null;
}

function enrichDirectionalCandidate(candidate, bundle) {
  getUniverseAsset(bundle, candidate.assetSymbol);
  const bundleMarket = getDirectionalPreviewMarket(bundle, candidate);
  const preview = candidate.preview ?? {};
  const previewInputs = preview.previewInputs ?? {};
  const overlayMarket = preview.overlayMarket ?? {};
  const overlayVault = preview.overlayVault ?? {};
  const boundaryContext = preview.boundaryContext ?? {};
  const routeContext = boundaryContext.eulerRouteContext ?? null;
  const liquidationThresholdBps = resolveConservativeLiquidationThresholdBps(
    bundleMarket,
    overlayMarket,
  );
  const collateralUsd = roundNullable(previewInputs.collateralUsd, 4);
  const targetLtvPct = roundNullable(candidate.expression?.targetLtvPct ?? previewInputs.targetLtvPct, 4);
  const debtUsd =
    collateralUsd !== null && targetLtvPct !== null
      ? round((collateralUsd * targetLtvPct) / 100, 4)
      : null;
  const currentPriceUsd = roundNullable(previewInputs.currentPriceUsd, 4);
  const grossExposureUsd =
    collateralUsd !== null && debtUsd !== null ? round(collateralUsd + debtUsd, 4) : null;
  const positionSizeUnits =
    grossExposureUsd !== null && currentPriceUsd !== null && currentPriceUsd > 0
      ? round(grossExposureUsd / currentPriceUsd, 6)
      : null;
  const previewPayload =
    routeContext &&
    currentPriceUsd !== null &&
    collateralUsd !== null &&
    debtUsd !== null &&
    liquidationThresholdBps !== null &&
    positionSizeUnits !== null
      ? buildDirectionalPreviewPayload({
          symbol: candidate.assetSymbol,
          side: previewInputs.side ?? "long",
          currentPriceUsd,
          collateralUsd,
          debtUsd,
          liquidationThresholdBps,
          positionSizeUnits,
          targetHealthFactor: previewInputs.targetHealthFactor,
          routeContext,
          vaultContext: boundaryContext.flowdeskVaultContext ?? null,
          liveProofOverlay: boundaryContext.liveProofOverlay ?? null,
          notes: preview.notes ?? [],
        })
      : null;

  const healthFactor = roundNullable(previewPayload?.healthFactor?.value, 6);
  const liquidationDistancePct = percentFromFraction(
    previewPayload?.liquidationDistance?.distancePct,
    4,
  );
  const leverageMultiple = roundNullable(previewPayload?.leverageMultiple, 6);
  const liquidationDistanceUsd = roundNullable(
    previewPayload?.liquidationDistance?.distanceUsd,
    4,
  );
  const ltvHeadroomPct =
    targetLtvPct !== null && isFiniteNumber(bundleMarket.max_ltv_pct)
      ? round(bundleMarket.max_ltv_pct - targetLtvPct, 4)
      : null;
  const healthBufferPct = percentFromFraction(previewPayload?.healthFactor?.liquidationMargin, 4);
  const previewGuardrails = {
    targetLtvWithinFrozenCap:
      targetLtvPct !== null && isFiniteNumber(bundleMarket.max_ltv_pct)
        ? targetLtvPct <= bundleMarket.max_ltv_pct
        : false,
    healthBufferAboveFrozenFloor:
      healthBufferPct !== null && isFiniteNumber(bundleMarket.min_health_buffer_pct)
        ? healthBufferPct >= bundleMarket.min_health_buffer_pct
        : false,
    liquidationPathIntact:
      previewPayload !== null && previewPayload.liquidationDistance.status !== "breached",
    overlayBorrowCostAvailable: isFiniteNumber(overlayMarket.borrowApyBps),
  };
  const previewGuardrailPass = Object.values(previewGuardrails).every(Boolean);
  const enrichedNotes = [
    ...(preview.notes ?? []),
    "Frozen research market-map constraints are applied conservatively before overlay metrics are surfaced.",
    "Verified Morpho and Flowdesk surfaces are treated as read-only proof overlays, not as evidence of live Euler execution.",
  ];

  return {
    ...candidate,
    preview: {
      ...preview,
      truthState: routeContext?.truth ?? preview.truthState ?? "unverified",
      executionEligibility: "preview_only",
      healthFactor,
      liquidationDistancePct,
      debtUsd,
      grossExposureUsd,
      leverageMultiple,
      borrowCostBps: roundNullable(overlayMarket.borrowApyBps, 4),
      eulerMarketSetId: bundle.eulerMarketMap.market_set_id ?? null,
      eulerMarketMapStatus: bundle.eulerMarketMap.status ?? null,
      previewPayload:
        previewPayload === null
          ? null
          : {
              activationAllowed: previewPayload.activationAllowed,
              currentPriceUsd: roundNullable(previewPayload.currentPriceUsd, 4),
              collateralUsd: roundNullable(previewPayload.collateralUsd, 4),
              debtUsd: roundNullable(previewPayload.debtUsd, 4),
              grossExposureUsd: roundNullable(previewPayload.grossExposureUsd, 4),
              leverageMultiple,
              healthFactor,
              healthStatus: previewPayload.healthFactor.status,
              healthDeltaToTarget: roundNullable(previewPayload.healthFactor.deltaToTarget, 6),
              targetHealthFactor: roundNullable(previewPayload.healthFactor.target, 6),
              liquidationDistancePct,
              liquidationDistanceUsd,
              liquidationStatus: previewPayload.liquidationDistance.status,
              liquidationThresholdBps,
            },
      marketContext: {
        marketSetId: bundle.eulerMarketMap.market_set_id ?? null,
        marketStatus: bundle.eulerMarketMap.status ?? null,
        baseAsset: bundleMarket.base_asset,
        borrowAsset: bundleMarket.borrow_asset,
        maxLtvPct: roundNullable(bundleMarket.max_ltv_pct, 4),
        minHealthBufferPct: roundNullable(bundleMarket.min_health_buffer_pct, 4),
        liquidityTier: bundleMarket.liquidity_tier ?? null,
        ltvHeadroomPct,
        healthBufferPct,
        conservativeLiquidationThresholdBps: liquidationThresholdBps,
      },
      overlayInsights: {
        morphoBorrowCostBps: roundNullable(overlayMarket.borrowApyBps, 4),
        morphoSupplyApyBps: roundNullable(overlayMarket.supplyApyBps, 4),
        morphoUtilizationBps: roundNullable(overlayMarket.utilizationBps, 4),
        morphoLiquidityUsd: roundNullable(overlayMarket.liquidityUsd, 2),
        flowdeskVaultApyBps: roundNullable(overlayVault.apyBps, 4),
        flowdeskVaultTvlUsd: roundNullable(overlayVault.tvlUsd, 2),
      },
      guardrails: previewGuardrails,
      guardrailPass: previewGuardrailPass,
      notes: [...new Set(enrichedNotes)],
    },
  };
}

export function evaluateBasket(candidate, options = {}) {
  const bundle = options.bundle ?? loadResearchBundle();
  const slot = getBasketSlot(candidate.slotId);
  validateBasketCandidate(candidate, bundle, slot);

  const stage = options.stage ?? "challenger_running";
  const completedAtUtc = options.completedAtUtc ?? new Date().toISOString();
  const runId =
    options.runId ??
    createRunId(stage, candidate.slotId, completedAtUtc, candidate.strategyVersion ?? candidate.candidateRef);
  const benchmarkPlan = buildBenchmarkPlan(bundle);
  const metrics = computePortfolioMetrics(bundle, candidate.plan);
  const benchmarkMetrics = computePortfolioMetrics(bundle, benchmarkPlan);
  const primaryScore = computePrimaryScore(metrics, benchmarkMetrics);
  const legacyPrimaryScore = computePrimaryScore(
    metrics.legacyStaticWeight,
    benchmarkMetrics.legacyStaticWeight,
  );
  const incumbentScore =
    options.incumbentScore === undefined ? primaryScore : Number(options.incumbentScore);
  const deltaScore = round(primaryScore - incumbentScore, 6);
  const guardrailPass =
    metrics.weightMaxPct <= slot.concentrationCapPct + 0.001 &&
    metrics.turnoverAnnPct <= bundle.executionCostModel.max_turnover_ann_pct;

  const status =
    stage === "baseline"
      ? guardrailPass
        ? "keep"
        : "invalid"
      : guardrailPass && deltaScore > PROMOTION_EPSILON
        ? "keep"
        : "discard";

  const resultRow = parseResearchResultRow({
    version: CONTRACT_VERSION,
    runId,
    completedAtUtc,
    stage,
    mode: "basket",
    slotId: candidate.slotId,
    objectiveId: OBJECTIVES.basket,
    status,
    candidateRef: candidate.candidateRef,
    incumbentRunId: options.incumbentRunId ?? null,
    manualVersion: MANUAL_VERSION,
    evaluatorVersion: EVALUATOR_VERSION,
    researchDatasetId: RESEARCH_DATASET_ID,
    validationSetId: VALIDATION_SET_ID,
    universeId: UNIVERSE_ID,
    chainId: CHAIN,
    liveTruthSourceId: LIVE_TRUTH_SOURCE_ID,
    primaryScore,
    incumbentScore,
    deltaScore,
    guardrailPass,
    returnAnnPct: metrics.returnAnnPct,
    maxDrawdownPct: metrics.maxDrawdownPct,
    turnoverAnnPct: metrics.turnoverAnnPct,
    costsTotalBps: metrics.costsTotalBps,
    description: candidate.description,
    benchmarkId: candidate.benchmarkId ?? PRIMARY_BENCHMARK_ID,
    constituentCountAvg: metrics.constituentCountAvg,
    weightMaxPct: metrics.weightMaxPct,
    grossExposureAvgPct: null,
    netExposureAvgPct: null,
    leverageAvg: null,
    borrowCostBps: null,
    eulerMarketSetId: null,
    eulerHealthMin: null,
  });

  const summary = {
    ...sharedSummaryBase({
      runId,
      completedAtUtc,
      stage,
      mode: "basket",
      slotId: candidate.slotId,
      status,
      objectiveId: OBJECTIVES.basket,
      candidateRef: candidate.candidateRef,
      resultRow,
    }),
    guardrailPass,
    candidate,
    metrics,
    benchmark: {
      benchmarkId: PRIMARY_BENCHMARK_ID,
      basketId: "sp500_core",
      metrics: benchmarkMetrics,
    },
    score: {
      scoringModelId: "path_dependent_rebalance_after_cost_v1",
      primaryScore,
      legacyPrimaryScore,
      incumbentScore,
      deltaScore,
      promotionEpsilon: PROMOTION_EPSILON,
    },
    invalidators: [],
  };

  Object.assign(summary, deriveBasketSummaryArtifacts(summary));

  return { resultRow, summary };
}

export function evaluateDirectional(candidate, options = {}) {
  const bundle = options.bundle ?? loadResearchBundle();
  const completedAtUtc = options.completedAtUtc ?? new Date().toISOString();
  const stage = options.stage ?? "preview_stub";
  const slotId = candidate.slotId ?? "advanced.default_directional";
  const runId =
    options.runId ??
    createRunId(stage, slotId, completedAtUtc, candidate.strategyVersion ?? candidate.candidateRef);
  const enrichedCandidate = enrichDirectionalCandidate(candidate, bundle);
  const previewSnapshot = enrichedCandidate.preview.previewPayload;
  const previewGuardrailPass = enrichedCandidate.preview.guardrailPass ?? false;
  const invalidators = [
    "preview_only",
    "route_unverified",
    "directional_activation_disabled",
  ];

  if (enrichedCandidate.preview.guardrails?.targetLtvWithinFrozenCap === false) {
    invalidators.push("target_ltv_above_frozen_cap");
  }
  if (enrichedCandidate.preview.guardrails?.healthBufferAboveFrozenFloor === false) {
    invalidators.push("health_buffer_below_frozen_floor");
  }
  if (enrichedCandidate.preview.guardrails?.liquidationPathIntact === false) {
    invalidators.push("liquidation_path_breached");
  }

  const resultRow = parseResearchResultRow({
    version: CONTRACT_VERSION,
    runId,
    completedAtUtc,
    stage,
    mode: "directional",
    slotId,
    objectiveId: OBJECTIVES.directional,
    status: "preview_only",
    candidateRef: enrichedCandidate.candidateRef,
    incumbentRunId: null,
    manualVersion: MANUAL_VERSION,
    evaluatorVersion: EVALUATOR_VERSION,
    researchDatasetId: RESEARCH_DATASET_ID,
    validationSetId: VALIDATION_SET_ID,
    universeId: UNIVERSE_ID,
    chainId: CHAIN,
    liveTruthSourceId: LIVE_TRUTH_SOURCE_ID,
    primaryScore: 0,
    incumbentScore: null,
    deltaScore: null,
    guardrailPass: previewGuardrailPass,
    returnAnnPct: 0,
    maxDrawdownPct: 0,
    turnoverAnnPct: 0,
    costsTotalBps: 0,
    description:
      enrichedCandidate.description ??
      "Directional lane remains preview-only until the Euler market map and live proof are implemented.",
    benchmarkId: null,
    constituentCountAvg: null,
    weightMaxPct: null,
    grossExposureAvgPct: enrichedCandidate.expression?.grossExposurePct ?? null,
    netExposureAvgPct: enrichedCandidate.expression?.netExposurePct ?? null,
    leverageAvg: enrichedCandidate.preview?.leverageMultiple ?? null,
    borrowCostBps: enrichedCandidate.preview?.borrowCostBps ?? null,
    eulerMarketSetId: enrichedCandidate.preview?.eulerMarketSetId ?? null,
    eulerHealthMin: enrichedCandidate.preview?.healthFactor ?? null,
  });

  return {
    resultRow,
    summary: {
      ...sharedSummaryBase({
        runId,
        completedAtUtc,
        stage,
        mode: "directional",
        slotId,
        status: "preview_only",
        objectiveId: OBJECTIVES.directional,
        candidateRef: enrichedCandidate.candidateRef,
        resultRow,
      }),
      guardrailPass: previewGuardrailPass,
      candidate: enrichedCandidate,
      metrics: {
        grossExposureAvgPct: resultRow.grossExposureAvgPct,
        netExposureAvgPct: resultRow.netExposureAvgPct,
        leverageAvg: resultRow.leverageAvg,
        borrowCostBps: resultRow.borrowCostBps,
        eulerHealthMin: resultRow.eulerHealthMin,
        liquidationDistancePct: enrichedCandidate.preview?.liquidationDistancePct ?? null,
        debtUsd: enrichedCandidate.preview?.debtUsd ?? null,
        grossExposureUsd: enrichedCandidate.preview?.grossExposureUsd ?? null,
        ltvHeadroomPct: enrichedCandidate.preview?.marketContext?.ltvHeadroomPct ?? null,
        healthBufferPct: enrichedCandidate.preview?.marketContext?.healthBufferPct ?? null,
      },
      score: {
        scoringMode: "preview_metrics_only",
        primaryScore: 0,
        incumbentScore: null,
        deltaScore: null,
        promotionEpsilon: PROMOTION_EPSILON,
      },
      invalidators,
      message:
        "Directional lane now emits conservative preview metrics from the frozen Euler market map plus verified overlay context, but activation remains blocked until exact live xStocks-on-Euler support is independently verified.",
      readiness: {
        previewable: true,
        executable: false,
        liveSupport: false,
        executionEligibility: "preview_only",
        activationAllowed: false,
      },
      previewContext: {
        marketContext: enrichedCandidate.preview?.marketContext ?? null,
        requiredDirectionalRoute: {
          routeId: "euler.ethereum.directional",
          truth: enrichedCandidate.preview?.truthState ?? null,
          proofSource:
            enrichedCandidate.preview?.boundaryContext?.eulerRouteContext?.proofSource ?? null,
          implementationState:
            enrichedCandidate.preview?.boundaryContext?.eulerRouteContext?.implementationState ??
            null,
          notes: enrichedCandidate.preview?.boundaryContext?.eulerRouteContext?.notes ?? [],
        },
        verifiedOverlay: {
          note: enrichedCandidate.preview?.boundaryContext?.liveProofOverlay?.note ?? null,
          morphoMarket: enrichedCandidate.preview?.overlayMarket ?? null,
          flowdeskVault: enrichedCandidate.preview?.overlayVault ?? null,
        },
        xstocksAssetSurface: enrichedCandidate.preview?.xstocksLiveState ?? null,
        routeEntries: enrichedCandidate.preview?.routeEntries ?? [],
        previewPayload:
          previewSnapshot === null
            ? null
            : {
                activationAllowed: previewSnapshot.activationAllowed,
                healthStatus: previewSnapshot.healthStatus,
                liquidationStatus: previewSnapshot.liquidationStatus,
              },
        unavailableMetrics: [
          "historical_return_ann_pct",
          "historical_max_drawdown_pct",
          "exact_live_euler_execution_proof",
        ],
      },
    },
  };
}
