const COW_EXECUTION_USD_LADDER = Object.freeze([
  15,
  25,
  50,
  100,
  250,
  500,
  1000,
  2500,
  5000,
]);

const QUOTEABLE_SYMBOLS = Object.freeze(["NVDAx", "TSLAx", "SPYx"]);

const BLOCKED_SYMBOLS = Object.freeze({
  AAPLx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  AMDx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  AMZNx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  AVGOx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  GOOGLx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  METAx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  MSFTx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
  ORCLx: {
    blockerClass: "cow_no_liquidity",
    statusCode: 404,
    errorType: "NoLiquidity",
  },
});

const STARTER_BASKET_COVERAGE = Object.freeze({
  ai_infra: Object.freeze({
    quoteableSymbols: Object.freeze(["NVDAx"]),
    blockedSymbols: Object.freeze(["AMDx", "AVGOx", "MSFTx", "ORCLx"]),
    fullyExecutable: false,
  }),
  mag7: Object.freeze({
    quoteableSymbols: Object.freeze(["NVDAx", "TSLAx"]),
    blockedSymbols: Object.freeze(["AAPLx", "AMZNx", "GOOGLx", "METAx", "MSFTx"]),
    fullyExecutable: false,
  }),
  sp500_core: Object.freeze({
    quoteableSymbols: Object.freeze(["SPYx"]),
    blockedSymbols: Object.freeze([]),
    fullyExecutable: true,
  }),
  us_tech_leaders: Object.freeze({
    quoteableSymbols: Object.freeze(["NVDAx"]),
    blockedSymbols: Object.freeze(["AAPLx", "AMZNx", "GOOGLx", "METAx", "MSFTx", "ORCLx"]),
    fullyExecutable: false,
  }),
});

export const PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS = 4;

export const COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH = Object.freeze({
  asOf: "2026-04-01",
  chain: "ethereum",
  quoteAssetSymbol: "USDC",
  routeId: "cow_swap.ethereum",
  testedUsdLadder: COW_EXECUTION_USD_LADDER,
  quoteableSymbols: QUOTEABLE_SYMBOLS,
  blockedSymbols: BLOCKED_SYMBOLS,
  starterBasketCoverage: STARTER_BASKET_COVERAGE,
  productUsableMinCoreHoldings: PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS,
});

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function replaceLiveReadyBadge(badges, nextBadge) {
  const normalized = uniqueStrings(badges).filter((badge) => badge !== "basket_live_ready");
  if (!normalized.includes(nextBadge)) {
    normalized.push(nextBadge);
  }
  return normalized;
}

export function isCowQuoteableXStockSymbol(symbol) {
  return QUOTEABLE_SYMBOLS.includes(symbol);
}

export function getCowBlockedSymbolInfo(symbol) {
  if (!symbol || isCowQuoteableXStockSymbol(symbol)) {
    return null;
  }

  const blocked = BLOCKED_SYMBOLS[symbol];
  if (!blocked) {
    return {
      blockerClass: "cow_quote_unproven",
      statusCode: null,
      errorType: null,
    };
  }

  return {
    ...blocked,
  };
}

export function getCowQuoteabilityAssessmentForSymbols(symbols = []) {
  const coreSymbols = uniqueStrings(symbols.filter((symbol) => typeof symbol === "string"));
  const quoteableSymbols = coreSymbols.filter((symbol) => isCowQuoteableXStockSymbol(symbol));
  const blockedCoreSymbols = coreSymbols
    .filter((symbol) => !isCowQuoteableXStockSymbol(symbol))
    .map((symbol) => ({
      symbol,
      ...getCowBlockedSymbolInfo(symbol),
    }));

  return {
    coreSymbols,
    quoteableSymbols,
    blockedCoreSymbols,
    allCoreSymbolsQuoteable: blockedCoreSymbols.length === 0,
  };
}

export function getCowQuoteabilityAssessmentForManifest(manifest) {
  const coreSymbols =
    manifest?.mode === "basket"
      ? (manifest.targetAllocations ?? [])
          .filter((allocation) => allocation?.sleeve === "core_xstocks")
          .map((allocation) => allocation.assetSymbol)
      : [];

  return getCowQuoteabilityAssessmentForSymbols(coreSymbols);
}

export function deriveCowOnlyBasketCandidateAssessment() {
  const candidateCoreSymbols = [...QUOTEABLE_SYMBOLS];
  const isViable = candidateCoreSymbols.length >= PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS;

  return {
    candidateCoreSymbols,
    isViable,
    reason: isViable
      ? "The current direct-quoteable universe clears the minimum breadth for a product-usable CoW-only basket."
      : `Only ${candidateCoreSymbols.length} xStocks currently quote directly on CoW (${candidateCoreSymbols.join(", ")}), which is below the research minimum holdings_count=${PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS}; the only fully intact repo basket is the benchmark-only sp500_core/SPYx lane.`,
  };
}

export function deriveCowExecutionSurfaceForManifest(manifest, frontendBadges = []) {
  const assessment = getCowQuoteabilityAssessmentForManifest(manifest);
  if (manifest?.mode !== "basket") {
    return {
      frontendBadges: uniqueStrings(frontendBadges),
      executionEligibility: null,
      surfaceTruth: null,
      cowRouteTruthState: null,
      cowRouteAvailability: null,
      cowRouteReason: null,
      proofNotes: [],
    };
  }

  if (assessment.allCoreSymbolsQuoteable) {
    return {
      frontendBadges: replaceLiveReadyBadge(frontendBadges, "basket_live_ready"),
      executionEligibility: "executable",
      surfaceTruth: "live",
      cowRouteTruthState: "live",
      cowRouteAvailability: "available",
      cowRouteReason:
        "Public xStocks basket execution route is verified for live onboarding baskets.",
      proofNotes: [
        "Basket execution routes are validated for live onboarding activations.",
        "Yield-buffer sleeve uses the verified Flowdesk AUSD vault whenever AUSD is present.",
      ],
    };
  }

  const blockedSymbols = assessment.blockedCoreSymbols.map((symbol) => symbol.symbol);
  const blockerClasses = uniqueStrings(
    assessment.blockedCoreSymbols.map((symbol) => symbol.blockerClass),
  );

  return {
    frontendBadges: replaceLiveReadyBadge(frontendBadges, "preview_only"),
    executionEligibility: "preview_only",
    surfaceTruth: "preview",
    cowRouteTruthState: "preview",
    cowRouteAvailability: "preview_only",
    cowRouteReason: `Direct standalone USDC -> xStock CoW quotes on Ethereum currently clear only for ${QUOTEABLE_SYMBOLS.join(", ")}; required core legs ${blockedSymbols.join(", ")} remain blocked (${blockerClasses.join(", ")}), so this basket stays recommendation-only.`,
    proofNotes: [
      `Direct standalone USDC -> xStock CoW quotes across the repo-owned Ethereum xStocks universe currently succeed only for ${QUOTEABLE_SYMBOLS.join(", ")}.`,
      `This basket still requires ${blockedSymbols.join(", ")}, which remain blocked on current CoW venue truth (${blockerClasses.join(", ")}), so activation stays preview-only until basket or venue truth changes.`,
    ],
  };
}
