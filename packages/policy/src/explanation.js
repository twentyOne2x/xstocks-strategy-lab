import { portfolioExplanationBundleSchema } from "./shared-contracts.js";

const STARTER_BASKET_LABELS = Object.freeze({
  mag7: "Mag 7",
  ai_infra: "AI Infra",
  us_tech_leaders: "US Tech Leaders",
});

function formatPct(value) {
  const rounded = Number(Number(value ?? 0).toFixed(1));
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function humanizeIdentifier(value) {
  return String(value ?? "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((token) => {
      if (token.toUpperCase() === token || /^\d+$/.test(token)) {
        return token;
      }

      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(" ");
}

function getBasketLabel(manifest) {
  const starterBasketId = manifest.activationTemplate?.starterBasketId;
  const titleSuffix = manifest.frontend?.title?.split(":").slice(1).join(":").trim();

  if (
    typeof starterBasketId === "string" &&
    Object.hasOwn(STARTER_BASKET_LABELS, starterBasketId)
  ) {
    return STARTER_BASKET_LABELS[starterBasketId];
  }

  if (typeof starterBasketId === "string" && starterBasketId.length > 0) {
    return humanizeIdentifier(starterBasketId);
  }

  return titleSuffix || manifest.frontend?.title || "promoted basket";
}

function getCoreAllocations(manifest) {
  return [...(manifest.targetAllocations ?? [])]
    .filter((allocation) => allocation.sleeve === "core_xstocks")
    .sort((left, right) => right.targetWeightPct - left.targetWeightPct);
}

function getYieldBufferAllocation(manifest) {
  return (manifest.targetAllocations ?? []).find(
    (allocation) => allocation.sleeve === "yield_buffer",
  );
}

function getRawExplanationBundle(manifest) {
  return manifest?.rawExplanationBundle &&
    typeof manifest.rawExplanationBundle === "object"
    ? manifest.rawExplanationBundle
    : null;
}

function getRawReasonCodes(rawExplanationBundle) {
  return rawExplanationBundle?.reasonCodes ?? rawExplanationBundle?.reason_codes ?? [];
}

function getRawTargetWeights(rawExplanationBundle) {
  return rawExplanationBundle?.targetWeights ?? rawExplanationBundle?.target_weights ?? [];
}

function getRawCashWeightPct(rawExplanationBundle) {
  return rawExplanationBundle?.cashWeightPct ?? rawExplanationBundle?.cash_weight_pct ?? null;
}

function getRawRebalanceThresholdPct(rawExplanationBundle) {
  return (
    rawExplanationBundle?.rebalanceThresholdPct ??
    rawExplanationBundle?.rebalance_threshold_pct ??
    null
  );
}

function getRawPortfolioMetrics(rawExplanationBundle) {
  return (
    rawExplanationBundle?.portfolioMetrics ??
    rawExplanationBundle?.portfolio_metrics ??
    {}
  );
}

function getRawSummaries(rawExplanationBundle) {
  return rawExplanationBundle?.summaries ?? {};
}

function buildBasketComponents(manifest) {
  const rawExplanationBundle = getRawExplanationBundle(manifest);
  const rawTargetWeights = getRawTargetWeights(rawExplanationBundle);
  const basketId = manifest.activationTemplate?.starterBasketId ?? null;
  const topCoreAllocations =
    rawTargetWeights.length > 0
      ? rawTargetWeights.slice(0, 3).map((entry) => ({
          assetSymbol: entry.symbol ?? null,
          targetWeightPct: entry.targetWeightPct ?? entry.target_weight_pct ?? null,
        }))
      : getCoreAllocations(manifest).slice(0, 3);
  const yieldBufferAllocation = getYieldBufferAllocation(manifest);
  const components = topCoreAllocations.map((allocation, index) => ({
    componentId: `${manifest.manifestId}:component:${allocation.assetSymbol ?? index + 1}`,
    kind: "core_holding",
    sleeve: "core_xstocks",
    title:
      index === 0
        ? `${allocation.assetSymbol} lead holding`
        : `${allocation.assetSymbol} core holding`,
    rationale:
      index === 0
        ? "Largest target weight in the promoted basket, so it anchors the portfolio's main theme exposure."
        : "Core xStocks holding used to widen the basket beyond the lead name while staying inside the promoted weights.",
    targetWeightPct: allocation.targetWeightPct,
    grossExposurePct: null,
    assetSymbol: allocation.assetSymbol ?? null,
    basketId,
    venueId: allocation.venueId ?? null,
  }));

  const rawCashWeightPct = getRawCashWeightPct(rawExplanationBundle);
  const yieldBufferTargetWeightPct =
    yieldBufferAllocation?.targetWeightPct ?? rawCashWeightPct;

  if (
    yieldBufferTargetWeightPct !== null &&
    yieldBufferTargetWeightPct !== undefined &&
    yieldBufferTargetWeightPct > 0
  ) {
    components.push({
      componentId: `${manifest.manifestId}:component:yield_buffer`,
      kind: "yield_buffer",
      sleeve: "yield_buffer",
      title: `${yieldBufferAllocation?.assetSymbol ?? "AUSD"} yield buffer`,
      rationale: `A ${formatPct(yieldBufferTargetWeightPct)} sleeve stays outside the core basket as a liquidity and yield buffer instead of forcing full equity exposure.`,
      targetWeightPct: yieldBufferTargetWeightPct,
      grossExposurePct: null,
      assetSymbol: yieldBufferAllocation?.assetSymbol ?? "AUSD",
      basketId: null,
      venueId: yieldBufferAllocation?.venueId ?? null,
    });
  }

  return components;
}

function buildDirectionalComponents(manifest) {
  const targetDirectionalExpression = manifest.targetDirectionalExpression;

  if (!targetDirectionalExpression) {
    return [
      {
        componentId: `${manifest.manifestId}:component:directional_lane`,
        kind: "directional_expression",
        sleeve: "directional",
        title: `${manifest.activationTemplate.assetSymbol} directional lane`,
        rationale:
          "This promoted lane is still preview-only and does not expose a live directional position until route proof is verified.",
        targetWeightPct: null,
        grossExposurePct: null,
        assetSymbol: manifest.activationTemplate.assetSymbol ?? null,
        basketId: null,
        venueId: null,
      },
    ];
  }

  const ltvText =
    targetDirectionalExpression.targetLtvPct === null
      ? ""
      : ` with a ${formatPct(targetDirectionalExpression.targetLtvPct)} target LTV`;

  return [
    {
      componentId: `${manifest.manifestId}:component:${targetDirectionalExpression.assetSymbol}`,
      kind: "directional_expression",
      sleeve: "directional",
      title: `${targetDirectionalExpression.assetSymbol} directional expression`,
      rationale: `The promoted lane expresses a ${humanizeIdentifier(targetDirectionalExpression.view)} view in ${targetDirectionalExpression.assetSymbol} at ${formatPct(targetDirectionalExpression.grossExposurePct)} gross exposure${ltvText}.`,
      targetWeightPct: null,
      grossExposurePct: targetDirectionalExpression.grossExposurePct,
      assetSymbol: targetDirectionalExpression.assetSymbol ?? null,
      basketId: null,
      venueId: null,
    },
  ];
}

function buildBasketExplanationBundle(manifest) {
  const rawExplanationBundle = getRawExplanationBundle(manifest);
  const rawSummaries = getRawSummaries(rawExplanationBundle);
  const rawReasonCodes = getRawReasonCodes(rawExplanationBundle);
  const rawPortfolioMetrics = getRawPortfolioMetrics(rawExplanationBundle);
  const rawRebalanceThresholdPct = getRawRebalanceThresholdPct(rawExplanationBundle);
  const basketLabel = getBasketLabel(manifest);
  const coreAllocations = getCoreAllocations(manifest);
  const leadAllocations = coreAllocations
    .slice(0, 3)
    .map((allocation) => `${allocation.assetSymbol} (${formatPct(allocation.targetWeightPct)})`);
  const yieldBufferAllocation = getYieldBufferAllocation(manifest);
  const yieldBufferSentence =
    yieldBufferAllocation && yieldBufferAllocation.targetWeightPct > 0
      ? ` It keeps ${formatPct(yieldBufferAllocation.targetWeightPct)} in ${yieldBufferAllocation.assetSymbol} as a yield buffer instead of forcing full equity exposure.`
      : " It stays fully allocated to the promoted basket weights.";
  const rawConstructionSummary =
    typeof rawSummaries.construction === "string" ? rawSummaries.construction : null;
  const rawBenchmarkSummary =
    typeof rawSummaries.benchmark === "string" ? rawSummaries.benchmark : null;
  const rawRebalanceSummary =
    typeof rawSummaries.rebalance === "string" ? rawSummaries.rebalance : null;
  const reasonCodeSummary = rawReasonCodes
    .slice(0, 3)
    .map((reasonCode) => reasonCode.label)
    .filter(Boolean)
    .join(" ");
  const constructionSummary =
    rawConstructionSummary ??
    `The manifest spreads capital across ${coreAllocations.length} core xStocks names in the ${basketLabel} basket, led by ${leadAllocations.join(", ")}.`;
  const bestForBufferText =
    yieldBufferAllocation && yieldBufferAllocation.targetWeightPct > 0
      ? ` with a visible ${formatPct(yieldBufferAllocation.targetWeightPct)} ${yieldBufferAllocation.assetSymbol} buffer`
      : "";
  const concentrationPct =
    rawPortfolioMetrics.concentrationPct ??
    rawPortfolioMetrics.concentration_pct ??
    coreAllocations[0]?.targetWeightPct ??
    null;

  return {
    whatThisPortfolioDoes: `${manifest.frontend.summary}${yieldBufferSentence}`,
    howItIsBuilt: `${constructionSummary}${reasonCodeSummary ? ` ${reasonCodeSummary}` : ""}`,
    howItChanges:
      rawRebalanceSummary ??
      "Weights only change when a newer promoted manifest replaces this incumbent or when route truth forces the lane to fail closed instead of executing.",
    whatWouldTriggerNextRebalance:
      rawRebalanceThresholdPct === null
        ? "The next rebalance only becomes actionable if promoted target weights change and the lane is still allowed to activate under current route truth. The repo does not prove an autonomous scheduler today."
        : `A rebalance only becomes actionable when drift clears ${formatPct(rawRebalanceThresholdPct)} and the lane is still allowed to activate under current route truth. The repo does not prove an autonomous scheduler today.`,
    howToReadReplay:
      rawBenchmarkSummary
        ? `${rawBenchmarkSummary} Treat replay as validation, not a promise of future returns.`
        : "Read the replay as a validation view of how the promoted basket behaved under the pinned research bundle. It is a decision aid, not a promise of future returns.",
    bestFor: `Best for someone who wants ${basketLabel} exposure through a curated xStocks basket${bestForBufferText} and can accept ${String(manifest.frontend.riskLabel ?? "moderate").toLowerCase()} risk${concentrationPct === null ? "" : ` with roughly ${formatPct(concentrationPct)} in the largest name`}.`,
    components: buildBasketComponents(manifest),
  };
}

function buildDirectionalExplanationBundle(manifest) {
  const targetDirectionalExpression = manifest.targetDirectionalExpression;
  const assetSymbol =
    targetDirectionalExpression?.assetSymbol ??
    manifest.activationTemplate.assetSymbol ??
    "the promoted asset";

  return {
    whatThisPortfolioDoes: `${manifest.frontend.summary} The current promoted lane expresses its view through ${assetSymbol} while the live activation path remains preview-only.`,
    howItIsBuilt: targetDirectionalExpression
      ? `The manifest defines one directional expression in ${assetSymbol} at ${formatPct(targetDirectionalExpression.grossExposurePct)} gross exposure and keeps activation blocked until the exact live route is verified.`
      : `The manifest holds one preview-only directional lane for ${assetSymbol} and keeps activation blocked until the exact live route is verified.`,
    howItChanges:
      "This lane does not auto-rotate live. It only changes when a newer promoted directional manifest replaces it, and it remains preview-only until route proof changes.",
    whatWouldTriggerNextRebalance:
      "Directional remains preview-only until exact live route proof exists, so no live automated rebalance trigger is surfaced beyond a future promoted-manifest change.",
    howToReadReplay:
      "Read the replay as a validation view of the promoted directional thesis under the pinned research bundle, not as a guarantee that live execution is available now.",
    bestFor:
      "Best for someone who wants to inspect a higher-risk directional preview and is comfortable waiting for verified live execution proof before acting.",
    components: buildDirectionalComponents(manifest),
  };
}

export function derivePortfolioExplanationBundle(manifest) {
  if (manifest?.explanationBundle) {
    const parsedBundle = portfolioExplanationBundleSchema.safeParse(
      manifest.explanationBundle,
    );

    if (parsedBundle.success) {
      return parsedBundle.data;
    }
  }

  const derivedBundle =
    manifest.mode === "directional"
      ? buildDirectionalExplanationBundle(manifest)
      : buildBasketExplanationBundle(manifest);

  return portfolioExplanationBundleSchema.parse(derivedBundle);
}
