import { loadResearchBundle } from "./bundle.js";
import { describeBasketSearchSurface } from "./hot/basket-policy.js";
import { getBasketSlot } from "./slots.js";

function round(value, places = 4) {
  return Number(value.toFixed(places));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function stableJson(value) {
  return JSON.stringify(value);
}

function camelToSnakeKey(key) {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export function toSnakeKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => toSnakeKeys(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [camelToSnakeKey(key), toSnakeKeys(entryValue)]),
  );
}

function formatNumber(value, places = 2) {
  if (!isFiniteNumber(value)) {
    return "n/a";
  }

  const rounded = round(value, places);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatPct(value, places = 2) {
  return `${formatNumber(value, places)}%`;
}

function formatBps(value, places = 2) {
  return `${formatNumber(value, places)} bps`;
}

const STARTER_BASKET_LABELS = {
  mag7: "Mag 7",
  ai_infra: "AI Infra",
  us_tech_leaders: "US Tech Leaders",
  sp500_core: "S&P 500 Core",
};

function humanizeCodeValue(value) {
  if (!value) {
    return value;
  }

  if (STARTER_BASKET_LABELS[value]) {
    return STARTER_BASKET_LABELS[value];
  }

  if (/^\d+(\.\d+)?pct$/.test(value)) {
    return `${value.replace(/pct$/, "")}%`;
  }

  if (/^\d+(\.\d+)?bps$/.test(value)) {
    return `${value.replace(/bps$/, "")} bps`;
  }

  if (/^\d+(\.\d+)?x$/.test(value)) {
    return value;
  }

  if (value === "starter_only") {
    return "starter basket only";
  }

  if (value === "core_universe") {
    return "core universe";
  }

  if (value === "off") {
    return "off";
  }

  return value.replaceAll("_", " ");
}

function parseSignalPowerValue(rawValue) {
  const normalized = Number(String(rawValue).replace(/x$/, ""));
  return Number.isFinite(normalized) ? normalized : 1;
}

function normalizedBasketReasonCodes(summary) {
  const plan = getCandidatePlan(summary);
  const slot = getBasketSlot(summary.slotId);
  const existingReasonCodes = [...(plan.reasonCodes ?? [])];
  const reasonCodeMap = new Map(
    existingReasonCodes.map((code) => {
      const [kind, rawValue = ""] = String(code).split(/:(.+)/);
      return [kind, rawValue];
    }),
  );
  const signalPower = parseSignalPowerValue(reasonCodeMap.get("signal_power") ?? "1x");

  if (!reasonCodeMap.has("starter_basket")) {
    existingReasonCodes.push(`starter_basket:${summary.candidate?.basketId ?? slot.starterBasketId}`);
  }

  if (!reasonCodeMap.has("selection_universe")) {
    existingReasonCodes.push("selection_universe:starter_only");
  }

  if (!reasonCodeMap.has("holdings_count")) {
    existingReasonCodes.push(`holdings_count:${plan.targetWeights.length}`);
  }

  if (!reasonCodeMap.has("starter_bias")) {
    existingReasonCodes.push("starter_bias:0pct");
  }

  if (!reasonCodeMap.has("ranking")) {
    existingReasonCodes.push("ranking:baseline_signal_score");
  }

  if (!reasonCodeMap.has("weighting_curve")) {
    existingReasonCodes.push(
      `weighting_curve:${signalPower === 1 ? "signal_score_proportional" : "signal_score_power"}`,
    );
  }

  if (!reasonCodeMap.has("signal_power")) {
    existingReasonCodes.push("signal_power:1x");
  }

  if (!reasonCodeMap.has("cash_weight")) {
    existingReasonCodes.push(`cash_weight:${round((plan.cashWeight ?? 0) * 100, 2)}pct`);
  }

  if (!reasonCodeMap.has("concentration_cap")) {
    existingReasonCodes.push(`concentration_cap:${round(slot.concentrationCapPct, 2)}pct`);
  }

  if (!reasonCodeMap.has("rebalance_threshold")) {
    existingReasonCodes.push(`rebalance_threshold:${Math.round(plan.rebalanceThresholdBps ?? 0)}bps`);
  }

  return existingReasonCodes;
}

function parseReasonCode(code) {
  const [kind, rawValue = ""] = String(code).split(/:(.+)/);
  const displayValue = humanizeCodeValue(rawValue);

  switch (kind) {
    case "starter_basket":
      return {
        code,
        kind,
        value: rawValue,
        label: `Starts from the pinned ${displayValue} basket membership.`,
      };
    case "selection_universe":
      return {
        code,
        kind,
        value: rawValue,
        label: `Selects names from the ${displayValue}.`,
      };
    case "holdings_count":
      return {
        code,
        kind,
        value: rawValue,
        label: `Keeps the basket at ${displayValue} names.`,
      };
    case "starter_bias":
      return {
        code,
        kind,
        value: rawValue,
        label: `Applies a ${displayValue} score boost to starter-basket names inside broader selection.`,
      };
    case "ranking":
      return {
        code,
        kind,
        value: rawValue,
        label: `Ranks names by ${displayValue}.`,
      };
    case "weighting_curve":
      return {
        code,
        kind,
        value: rawValue,
        label: `Weights names with the ${displayValue} curve.`,
      };
    case "signal_power":
      return {
        code,
        kind,
        value: rawValue,
        label: `Raises ranking scores to the ${displayValue} power before weights are normalized.`,
      };
    case "cash_weight":
      return {
        code,
        kind,
        value: rawValue,
        label: `Keeps ${displayValue} in the AUSD yield buffer.`,
      };
    case "concentration_cap":
      return {
        code,
        kind,
        value: rawValue,
        label: `Limits any single name to ${displayValue}.`,
      };
    case "rebalance_threshold":
      return {
        code,
        kind,
        value: rawValue,
        label: `Only rebalances after ${displayValue} of drift.`,
      };
    default:
      return {
        code,
        kind,
        value: rawValue || null,
        label: `Uses ${humanizeCodeValue(code)} in the promoted basket policy.`,
      };
  }
}

function parsePercentReasonValue(reasonCodes, kind) {
  const reasonCode = reasonCodes.find((code) => String(code).startsWith(`${kind}:`));
  if (!reasonCode) {
    return null;
  }

  const [, rawValue = ""] = reasonCode.split(/:(.+)/);
  const normalized = Number(rawValue.replace(/pct$/, ""));
  return Number.isFinite(normalized) ? normalized : null;
}

function parseScalarReasonValue(reasonCodes, kind) {
  const reasonCode = reasonCodes.find((code) => String(code).startsWith(`${kind}:`));
  if (!reasonCode) {
    return null;
  }

  const [, rawValue = ""] = reasonCode.split(/:(.+)/);
  return rawValue || null;
}

function parseIntegerReasonValue(reasonCodes, kind) {
  const rawValue = parseScalarReasonValue(reasonCodes, kind);
  const normalized = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(normalized) ? normalized : null;
}

const BASKET_POLICY_PARAMETER_ORDER = [
  "selection_universe",
  "holdings_count",
  "starter_bias_pct",
  "signal_power",
  "cash_weight",
  "max_weight_pct",
  "rebalance_threshold_bps",
];

const BASKET_POLICY_PARAMETER_LABELS = {
  selection_universe: "Selection universe",
  holdings_count: "Breadth",
  starter_bias_pct: "Starter-basket bias",
  signal_power: "Weighting curve",
  cash_weight: "Cash sleeve",
  max_weight_pct: "Single-name cap",
  rebalance_threshold_bps: "Rebalance trigger",
};

function policyProfileParameterValue(profile, parameterId) {
  switch (parameterId) {
    case "selection_universe":
      return profile?.parameters?.starterAnchoring?.selectionUniverse ?? null;
    case "holdings_count":
      return profile?.parameters?.breadth?.topN ?? null;
    case "starter_bias_pct":
      return profile?.parameters?.starterAnchoring?.starterBiasPct ?? null;
    case "signal_power":
      return {
        curveId: profile?.parameters?.weighting?.curveId ?? null,
        exponent: profile?.parameters?.weighting?.exponent ?? null,
      };
    case "cash_weight":
      return profile?.parameters?.cashSleeve?.targetWeightPct ?? null;
    case "max_weight_pct":
      return profile?.parameters?.capPolicy?.maxWeightPct ?? null;
    case "rebalance_threshold_bps":
      return profile?.parameters?.rebalance?.thresholdBps ?? null;
    default:
      return null;
  }
}

function signalPowerDisplayValue(value) {
  if (!value || !isFiniteNumber(value.exponent)) {
    return null;
  }

  if (value.curveId === "signal_score_proportional" || value.exponent === 1) {
    return "1x proportional";
  }

  return `${formatNumber(value.exponent, 2)}x power`;
}

function formatPolicyParameterDisplayValue(parameterId, value) {
  switch (parameterId) {
    case "selection_universe":
      return humanizeCodeValue(value);
    case "holdings_count":
      return isFiniteNumber(value) ? `${value} names` : null;
    case "starter_bias_pct":
      return isFiniteNumber(value) ? formatPct(value) : null;
    case "signal_power":
      return signalPowerDisplayValue(value);
    case "cash_weight":
      return isFiniteNumber(value) ? `${formatPct(value)} AUSD` : null;
    case "max_weight_pct":
      return isFiniteNumber(value) ? formatPct(value) : null;
    case "rebalance_threshold_bps":
      return isFiniteNumber(value) ? formatBps(value, 0) : null;
    default:
      return value === null ? null : String(value);
  }
}

function buildPolicyChangeSummary(parameterId, fromValue, toValue) {
  const fromDisplayValue = formatPolicyParameterDisplayValue(parameterId, fromValue);
  const toDisplayValue = formatPolicyParameterDisplayValue(parameterId, toValue);
  const label = BASKET_POLICY_PARAMETER_LABELS[parameterId] ?? parameterId;

  return `${label}: ${fromDisplayValue ?? "n/a"} -> ${toDisplayValue ?? "n/a"}`;
}

export function describeBasketPolicyChanges(previousProfile, nextProfile) {
  const changes = [];

  for (const parameterId of BASKET_POLICY_PARAMETER_ORDER) {
    const fromValue = policyProfileParameterValue(previousProfile, parameterId);
    const toValue = policyProfileParameterValue(nextProfile, parameterId);

    if (stableJson(fromValue) === stableJson(toValue)) {
      continue;
    }

    changes.push({
      parameterId,
      label: BASKET_POLICY_PARAMETER_LABELS[parameterId] ?? parameterId,
      fromValue: formatPolicyParameterDisplayValue(parameterId, fromValue),
      toValue: formatPolicyParameterDisplayValue(parameterId, toValue),
      summary: buildPolicyChangeSummary(parameterId, fromValue, toValue),
    });
  }

  return changes;
}

export function summarizeBasketPolicyChanges(previousProfile, nextProfile) {
  const changes = describeBasketPolicyChanges(previousProfile, nextProfile);

  if (changes.length === 0) {
    return "No basket policy changes.";
  }

  return changes.map((change) => change.summary).join("; ");
}

function getCandidatePlan(summary) {
  const plan = summary?.candidate?.plan;
  if (!plan || !Array.isArray(plan.targetWeights)) {
    throw new Error(`Basket run summary for ${summary?.slotId ?? "unknown"} is missing candidate.plan.`);
  }

  return plan;
}

function getCashWeightPctFromSummary(summary) {
  const plan = getCandidatePlan(summary);
  return round((plan.cashWeight ?? 0) * 100, 4);
}

function getCandidateTaxonomy(summary) {
  const taxonomy = summary?.candidate?.taxonomy;
  if (!taxonomy || typeof taxonomy !== "object") {
    return {
      taxonomyVersion: "v1",
      templateId: summary?.candidate?.policy?.policyId ?? "unknown",
      familyId: "unclassified",
      familyLabel: "Unclassified",
      familyClassId: "unclassified",
      familyClassLabel: "Unclassified",
      operatorSummary: "Candidate family was not classified.",
    };
  }

  return taxonomy;
}

function getBaselineComparison(summary) {
  const currentProfile = summary?.candidate?.policyProfile;
  if (!currentProfile) {
    return {
      changeCount: 0,
      changes: [],
      changeSummary: "Current run does not expose a policy-profile diff versus the slot baseline.",
    };
  }

  const surface = describeBasketSearchSurface(summary.slotId, loadResearchBundle());
  const changes = describeBasketPolicyChanges(surface.defaultPolicyProfile, currentProfile);

  return {
    changeCount: changes.length,
    changes,
    changeSummary:
      changes.length === 0
        ? "No parameter changes from the slot baseline."
        : summarizeBasketPolicyChanges(surface.defaultPolicyProfile, currentProfile),
  };
}

function getTargetWeightRows(summary) {
  return getCandidatePlan(summary).targetWeights.map((entry, index) => ({
    rank: index + 1,
    symbol: entry.symbol,
    assetName: entry.assetName,
    targetWeightPct: round(entry.weight * 100, 4),
  }));
}

function getBenchmarkDelta(summary) {
  const metrics = summary.metrics ?? {};
  const benchmarkMetrics = summary.benchmark?.metrics ?? {};
  const afterCostReturnAnnPct = round(
    (metrics.returnAnnPct ?? 0) - (metrics.costsTotalBps ?? 0) / 100,
    4,
  );
  const benchmarkAfterCostReturnAnnPct = round(
    (benchmarkMetrics.returnAnnPct ?? 0) - (benchmarkMetrics.costsTotalBps ?? 0) / 100,
    4,
  );

  return {
    benchmarkId: summary.resultRow?.benchmarkId ?? summary.benchmark?.benchmarkId ?? null,
    returnAnnPct: round(metrics.returnAnnPct ?? 0, 4),
    benchmarkReturnAnnPct: round(benchmarkMetrics.returnAnnPct ?? 0, 4),
    afterCostReturnAnnPct,
    benchmarkAfterCostReturnAnnPct,
    excessReturnAfterCostPct: round(
      afterCostReturnAnnPct - benchmarkAfterCostReturnAnnPct,
      4,
    ),
    score: round(summary.score?.primaryScore ?? 0, 6),
    deltaVsIncumbent: summary.score?.deltaScore ?? null,
  };
}

function summarizeConstruction(targetWeights, cashWeightPct) {
  const topHoldings = targetWeights
    .slice(0, 3)
    .map((entry) => `${entry.symbol} ${formatPct(entry.targetWeightPct)}`)
    .join(", ");
  const investedWeightPct = round(100 - cashWeightPct, 4);

  if (cashWeightPct > 0) {
    return `${formatPct(investedWeightPct)} stays in xStocks across ${targetWeights.length} names. ${formatPct(cashWeightPct)} remains in AUSD. Largest sleeves: ${topHoldings}.`;
  }

  return `${formatPct(investedWeightPct)} stays in xStocks across ${targetWeights.length} names. Largest sleeves: ${topHoldings}.`;
}

function summarizeBenchmark(benchmarkDelta) {
  const signedExcess =
    benchmarkDelta.excessReturnAfterCostPct >= 0
      ? `+${formatPct(benchmarkDelta.excessReturnAfterCostPct)}`
      : formatPct(benchmarkDelta.excessReturnAfterCostPct);

  return `After estimated costs, the pinned run delivered ${formatPct(benchmarkDelta.afterCostReturnAnnPct)} versus ${formatPct(benchmarkDelta.benchmarkAfterCostReturnAnnPct)} for ${benchmarkDelta.benchmarkId}, an excess of ${signedExcess}.`;
}

function summarizeRebalance(summary, cashWeightPct) {
  const plan = getCandidatePlan(summary);
  const metrics = summary.metrics ?? {};
  const rebalanceSimulation = metrics.rebalanceSimulation ?? null;
  const legacyStaticWeight = metrics.legacyStaticWeight ?? null;
  const legacySummary = legacyStaticWeight
    ? `Legacy static proxy would have printed ${formatPct(legacyStaticWeight.turnoverAnnPct ?? 0)} turnover and ${formatBps(legacyStaticWeight.costsTotalBps ?? 0)} total costs with ${formatPct(cashWeightPct)} parked in AUSD.`
    : "Legacy static proxy is unavailable.";

  if (!rebalanceSimulation) {
    return `Rebalance only when drift clears ${formatBps(plan.rebalanceThresholdBps, 0)}. ${legacySummary}`;
  }

  const rebalanceLabel =
    rebalanceSimulation.rebalanceEventCount === 1
      ? "1 rebalance"
      : `${formatNumber(rebalanceSimulation.rebalanceEventCount, 0)} rebalances`;

  return `Rebalance only when drift clears ${formatBps(plan.rebalanceThresholdBps, 0)}. Authoritative path-dependent scoring implies ${formatPct(rebalanceSimulation.turnoverAnnPct ?? 0)} annualized turnover, ${formatBps(rebalanceSimulation.costsTotalBps ?? 0)} annualized costs, and ${rebalanceLabel} over the frozen window. ${legacySummary}`;
}

function buildOperatorConstructionReadout(summary, targetWeights, cashWeightPct) {
  const taxonomy = getCandidateTaxonomy(summary);
  const reasonCodes = normalizedBasketReasonCodes(summary);
  const starterBasket = humanizeCodeValue(
    parseScalarReasonValue(reasonCodes, "starter_basket") ?? summary.candidate?.basketId,
  );
  const selectionUniverse = humanizeCodeValue(
    parseScalarReasonValue(reasonCodes, "selection_universe") ?? "starter_only",
  );
  const holdingsCount =
    parseIntegerReasonValue(reasonCodes, "holdings_count") ?? targetWeights.length;
  const topSleeves = targetWeights
    .slice(0, 3)
    .map((entry) => `${entry.symbol} ${formatPct(entry.targetWeightPct)}`)
    .join(", ");

  return `${taxonomy.familyLabel} keeps ${formatPct(100 - cashWeightPct)} in xStocks across ${holdingsCount} ${selectionUniverse} names anchored to ${starterBasket}, with ${formatPct(cashWeightPct)} in AUSD. Top sleeves: ${topSleeves}.`;
}

function buildOperatorWatchSummary(watchpoints) {
  if (!Array.isArray(watchpoints) || watchpoints.length === 0) {
    return "No watchpoints were recorded.";
  }

  return watchpoints.slice(0, 2).join(" ");
}

function buildCurrentKnobs(summary) {
  const plan = getCandidatePlan(summary);
  const reasonCodes = normalizedBasketReasonCodes(summary);
  const taxonomy = getCandidateTaxonomy(summary);

  return [
    {
      knobId: "candidate_family",
      label: "Candidate family",
      currentValue: taxonomy.familyLabel,
      tuningImpact: taxonomy.operatorSummary,
    },
    {
      knobId: "starter_basket",
      label: "Starter basket",
      currentValue: humanizeCodeValue(
        parseScalarReasonValue(reasonCodes, "starter_basket") ?? summary.candidate?.basketId,
      ),
      tuningImpact: "Changes basket membership before weights are assigned.",
    },
    {
      knobId: "selection_universe",
      label: "Selection universe",
      currentValue: humanizeCodeValue(parseScalarReasonValue(reasonCodes, "selection_universe")),
      tuningImpact: "Widens the eligible pool beyond the starter basket without changing slot identity.",
    },
    {
      knobId: "holdings_count",
      label: "Holdings breadth",
      currentValue: String(
        parseIntegerReasonValue(reasonCodes, "holdings_count") ?? plan.targetWeights.length,
      ),
      tuningImpact: "Changes how many names survive ranking into the target basket.",
    },
    {
      knobId: "starter_bias",
      label: "Starter anchor bias",
      currentValue: humanizeCodeValue(parseScalarReasonValue(reasonCodes, "starter_bias")),
      tuningImpact: "Keeps the slot anchored to its starter basket even when broader selection is enabled.",
    },
    {
      knobId: "ranking_signal",
      label: "Ranking signal",
      currentValue: humanizeCodeValue(parseScalarReasonValue(reasonCodes, "ranking")),
      tuningImpact: "Changes which names rise or fall inside the current basket.",
    },
    {
      knobId: "weighting_curve",
      label: "Weighting curve",
      currentValue: humanizeCodeValue(parseScalarReasonValue(reasonCodes, "weighting_curve")),
      tuningImpact: "Changes how aggressively higher-ranked names dominate the basket.",
    },
    {
      knobId: "signal_power",
      label: "Signal power",
      currentValue: humanizeCodeValue(parseScalarReasonValue(reasonCodes, "signal_power")),
      tuningImpact: "Makes the weighting curve flatter or more conviction-heavy without changing the underlying signal.",
    },
    {
      knobId: "cash_weight",
      label: "Cash sleeve",
      currentValue: formatPct((plan.cashWeight ?? 0) * 100),
      tuningImpact: "Changes how much capital stays in AUSD instead of xStocks exposure.",
    },
    {
      knobId: "concentration_cap",
      label: "Single-name cap",
      currentValue: humanizeCodeValue(
        parseScalarReasonValue(reasonCodes, "concentration_cap") ??
          formatPct(summary.metrics?.weightMaxPct ?? 0),
      ),
      tuningImpact: "Limits the maximum weight of one name.",
    },
    {
      knobId: "rebalance_threshold",
      label: "Rebalance trigger",
      currentValue: formatBps(plan.rebalanceThresholdBps ?? 0, 0),
      tuningImpact: "Skips smaller drifts to reduce churn.",
    },
  ];
}

function buildWatchpoints(summary, targetWeights, benchmarkDelta) {
  const plan = getCandidatePlan(summary);
  const reasonCodes = normalizedBasketReasonCodes(summary);
  const concentrationCapPct = parsePercentReasonValue(reasonCodes, "concentration_cap");
  const selectionUniverse = parseScalarReasonValue(reasonCodes, "selection_universe");
  const holdingsCount = parseIntegerReasonValue(reasonCodes, "holdings_count");
  const weightMaxPct = summary.metrics?.weightMaxPct ?? null;
  const turnoverAnnPct = summary.metrics?.turnoverAnnPct ?? null;
  const costsTotalBps = summary.metrics?.costsTotalBps ?? null;
  const rebalanceSimulation = summary.metrics?.rebalanceSimulation ?? null;
  const legacyStaticWeight = summary.metrics?.legacyStaticWeight ?? null;
  const topWeight = targetWeights[0] ?? null;
  const notes = [];

  if (topWeight && concentrationCapPct !== null && weightMaxPct !== null) {
    notes.push(
      `${topWeight.symbol} is the largest sleeve at ${formatPct(topWeight.targetWeightPct)} against a ${formatPct(concentrationCapPct)} single-name cap.`,
    );
  }

  if (
    rebalanceSimulation &&
    isFiniteNumber(rebalanceSimulation.turnoverAnnPct) &&
    isFiniteNumber(rebalanceSimulation.costsTotalBps)
  ) {
    notes.push(
      `Authoritative rebalance simulation implies ${formatPct(rebalanceSimulation.turnoverAnnPct)} turnover and ${formatBps(rebalanceSimulation.costsTotalBps)} of annualized costs across ${formatNumber(rebalanceSimulation.rebalanceEventCount, 0)} rebalance events.`,
    );
  }

  if (isFiniteNumber(turnoverAnnPct) && isFiniteNumber(costsTotalBps)) {
    notes.push(
      `Authoritative turnover is ${formatPct(turnoverAnnPct)} with ${formatBps(costsTotalBps)} of total costs.`,
    );
  }

  if (
    legacyStaticWeight &&
    isFiniteNumber(legacyStaticWeight.turnoverAnnPct) &&
    isFiniteNumber(legacyStaticWeight.costsTotalBps)
  ) {
    notes.push(
      `Legacy static proxy would have printed ${formatPct(legacyStaticWeight.turnoverAnnPct)} turnover and ${formatBps(legacyStaticWeight.costsTotalBps)} of total costs.`,
    );
  }

  if (selectionUniverse || holdingsCount !== null) {
    notes.push(
      `${holdingsCount ?? targetWeights.length} names are selected from the ${humanizeCodeValue(
        selectionUniverse ?? "starter_only",
      )}.`,
    );
  }

  notes.push(
    `Benchmark edge after costs is ${formatPct(benchmarkDelta.excessReturnAfterCostPct)} versus ${benchmarkDelta.benchmarkId}.`,
  );

  return notes;
}

function buildIncumbentInterpretation(summary, benchmarkDelta, targetWeights, cashWeightPct) {
  const reasonCodes = normalizedBasketReasonCodes(summary);
  const taxonomy = getCandidateTaxonomy(summary);
  const selectionUniverse = humanizeCodeValue(
    parseScalarReasonValue(reasonCodes, "selection_universe") ?? "starter_only",
  );
  const holdingsCount =
    parseIntegerReasonValue(reasonCodes, "holdings_count") ?? targetWeights.length;
  const topWeight = targetWeights[0] ?? null;
  const signedExcess =
    benchmarkDelta.excessReturnAfterCostPct >= 0
      ? `outperformed ${benchmarkDelta.benchmarkId} by ${formatPct(
          benchmarkDelta.excessReturnAfterCostPct,
        )}`
      : `trailed ${benchmarkDelta.benchmarkId} by ${formatPct(
          Math.abs(benchmarkDelta.excessReturnAfterCostPct),
        )}`;
  const leadText = topWeight
    ? ` ${topWeight.symbol} is the largest sleeve at ${formatPct(topWeight.targetWeightPct)}.`
    : "";
  const scoringLead =
    summary.score?.scoringModelId === "path_dependent_rebalance_after_cost_v1"
      ? " Under the authoritative path-dependent rebalance scorer,"
      : "";

  return `${taxonomy.familyLabel}. ${holdingsCount}-name ${selectionUniverse} basket with ${formatPct(cashWeightPct)} in AUSD.${leadText}${scoringLead} after costs it ${signedExcess} in the frozen window.`;
}

export function deriveBasketSummaryArtifacts(summary) {
  if (!summary || summary.mode !== "basket") {
    throw new Error("deriveBasketSummaryArtifacts only supports basket summaries.");
  }

  const plan = getCandidatePlan(summary);
  const targetWeights = getTargetWeightRows(summary);
  const cashWeightPct = getCashWeightPctFromSummary(summary);
  const benchmarkDelta = getBenchmarkDelta(summary);
  const normalizedReasonCodes = normalizedBasketReasonCodes(summary);
  const reasonCodes = normalizedReasonCodes.map((code) => parseReasonCode(code));
  const taxonomy = getCandidateTaxonomy(summary);
  const baselineComparison = getBaselineComparison(summary);
  const concentrationCapPct = parsePercentReasonValue(normalizedReasonCodes, "concentration_cap");
  const selectionUniverse = humanizeCodeValue(
    parseScalarReasonValue(normalizedReasonCodes, "selection_universe"),
  );
  const holdingsCount =
    parseIntegerReasonValue(normalizedReasonCodes, "holdings_count") ?? targetWeights.length;

  const explanationBundle = {
    truthMode: "promoted_incumbent_and_run_summary_only",
    incumbentState: summary.stage === "baseline" ? "baseline_kept" : "kept_promoted_run",
    strategyTaxonomy: taxonomy,
    reasonCodes,
    targetWeights,
    cashWeightPct,
    rebalanceThresholdBps: plan.rebalanceThresholdBps,
    rebalanceThresholdPct: round((plan.rebalanceThresholdBps ?? 0) / 100, 4),
    benchmarkDelta,
    portfolioMetrics: {
      constituentCount: summary.metrics?.constituentCountAvg ?? targetWeights.length,
      concentrationPct: summary.metrics?.weightMaxPct ?? null,
      concentrationCapPct,
      turnoverAnnPct: summary.metrics?.turnoverAnnPct ?? null,
      costsTotalBps: summary.metrics?.costsTotalBps ?? null,
      rebalanceSimulation: summary.metrics?.rebalanceSimulation ?? null,
      legacyStaticWeight: summary.metrics?.legacyStaticWeight ?? null,
    },
    summaries: {
      construction: summarizeConstruction(targetWeights, cashWeightPct),
      benchmark: summarizeBenchmark(benchmarkDelta),
      rebalance: summarizeRebalance(summary, cashWeightPct),
      realityCheck:
        summary.metrics?.rebalanceSimulation === null ||
        summary.metrics?.rebalanceSimulation === undefined
          ? "Path-dependent rebalance simulation unavailable."
          : `Authoritative scoring now uses ${formatBps(
              summary.metrics.rebalanceSimulation.thresholdBps ?? 0,
              0,
            )} drift bands and implies ${formatPct(
              summary.metrics.rebalanceSimulation.turnoverAnnPct ?? 0,
            )} annualized turnover across ${formatNumber(
              summary.metrics.rebalanceSimulation.rebalanceEventCount ?? 0,
              0,
            )} rebalance events; legacy static proxy remains available for comparison.`,
      operator:
        `${buildOperatorConstructionReadout(summary, targetWeights, cashWeightPct)} ` +
        `Change from slot baseline: ${baselineComparison.changeSummary}. ` +
        `${summarizeBenchmark(benchmarkDelta)}`,
    },
  };

  const incumbentInterpretation = buildIncumbentInterpretation(
    summary,
    benchmarkDelta,
    targetWeights,
    cashWeightPct,
  );
  const watchpoints = buildWatchpoints(summary, targetWeights, benchmarkDelta);
  const tuningSummary = {
    headline: `${formatPct(100 - cashWeightPct)} invested across ${holdingsCount} names selected from the ${selectionUniverse} with ${formatPct(cashWeightPct)} in AUSD and a ${formatBps(plan.rebalanceThresholdBps ?? 0, 0)} rebalance trigger.`,
    strategyFamily: taxonomy,
    incumbentInterpretation,
    currentKnobs: buildCurrentKnobs(summary),
    watchpoints,
    operatorSummary: {
      whatThisIs: buildOperatorConstructionReadout(summary, targetWeights, cashWeightPct),
      changedFromBaseline: baselineComparison.changeSummary,
      whyThisIncumbent: incumbentInterpretation,
      whatToWatch: buildOperatorWatchSummary(watchpoints),
    },
  };

  return {
    explanationBundle,
    tuningSummary,
  };
}

export function basketSummaryNeedsRefresh(summary) {
  if (!summary || summary.mode !== "basket") {
    return false;
  }

  if (!summary.explanationBundle || !summary.tuningSummary) {
    return true;
  }

  const derived = deriveBasketSummaryArtifacts(summary);
  return (
    stableJson(summary.explanationBundle) !== stableJson(derived.explanationBundle) ||
    stableJson(summary.tuningSummary) !== stableJson(derived.tuningSummary)
  );
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertPromotedBasketSummaryMatchesIncumbent(incumbent, summary) {
  assertCondition(incumbent?.mode === "basket", "Promoted basket explanation requires a basket incumbent.");
  assertCondition(summary?.mode === "basket", `Run summary for ${incumbent.slotId} must stay in basket mode.`);
  assertCondition(summary.slotId === incumbent.slotId, `Run summary slot drift detected for ${incumbent.slotId}.`);

  const plan = getCandidatePlan(summary);
  assertCondition(
    stableJson(plan.reasonCodes ?? []) === stableJson(incumbent.research.reasonCodes),
    `Reason-code drift detected for ${incumbent.slotId}.`,
  );
  assertCondition(
    plan.rebalanceThresholdBps === incumbent.research.rebalanceThresholdBps,
    `Rebalance-threshold drift detected for ${incumbent.slotId}.`,
  );
  assertCondition(
    (summary.resultRow?.benchmarkId ?? null) === incumbent.research.benchmarkId,
    `Benchmark drift detected for ${incumbent.slotId}.`,
  );

  const planWeightsBySymbol = Object.fromEntries(
    plan.targetWeights.map((entry) => [entry.symbol, round(entry.weight * 100, 4)]),
  );
  const incumbentCoreAllocations = incumbent.research.targetAllocations.filter(
    (allocation) => allocation.sleeve === "core_xstocks",
  );
  assertCondition(
    incumbentCoreAllocations.length === plan.targetWeights.length,
    `Target-allocation count drift detected for ${incumbent.slotId}.`,
  );

  for (const allocation of incumbentCoreAllocations) {
    assertCondition(
      planWeightsBySymbol[allocation.assetSymbol] === round(allocation.targetWeightPct, 4),
      `Target weight drift detected for ${incumbent.slotId}:${allocation.assetSymbol}.`,
    );
  }

  const incumbentCashWeightPct = round(
    incumbent.research.targetAllocations
      .filter((allocation) => allocation.sleeve === "yield_buffer")
      .reduce((sum, allocation) => sum + allocation.targetWeightPct, 0),
    4,
  );
  assertCondition(
    incumbentCashWeightPct === getCashWeightPctFromSummary(summary),
    `Cash-weight drift detected for ${incumbent.slotId}.`,
  );
}
