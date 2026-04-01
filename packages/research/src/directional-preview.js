import {
  CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE,
  CANONICAL_DIRECTIONAL_POLICY_ROUTE_ENTRIES,
  CANONICAL_DIRECTIONAL_PREVIEW_INPUT,
  CANONICAL_FLOWDESK_AUSD_VAULT,
  CANONICAL_MORPHO_SPYX_AUSD_MARKET,
} from "../../euler/dist/index.js";
import {
  CANONICAL_XSTOCKS_NORMALIZED_LIVE_STATES,
  buildPolicyExecutionRouteFixtures,
  buildPolicyLiveXStocksStateFixture,
} from "../../xstocks/dist/index.js";

import { getDirectionalSlot } from "./slots.js";

function getCanonicalXStocksState(symbol) {
  const state = CANONICAL_XSTOCKS_NORMALIZED_LIVE_STATES.find((entry) => entry.symbol === symbol);

  if (!state) {
    throw new Error(`Missing canonical xStocks live fixture for directional preview asset ${symbol}.`);
  }

  return state;
}

export function buildDefaultDirectionalCandidate() {
  const slot = getDirectionalSlot("advanced.default_directional");
  const xstocksLiveState = getCanonicalXStocksState(slot.assetSymbol);
  const [xstocksAssetState] = buildPolicyLiveXStocksStateFixture([xstocksLiveState]).assets;
  const xstocksExecutionRoutes = buildPolicyExecutionRouteFixtures(xstocksLiveState).map(
    (route) => ({
      routeId: route.route_id,
      label: route.label,
      routeKind: route.route_kind,
      chain: route.chain,
      verificationTier: route.verification_tier,
      availability: route.availability,
      notes: route.notes,
    }),
  );

  return {
    candidateRef: `directional-preview:${slot.slotId}:${slot.assetSymbol}:v2`,
    mode: "directional",
    slotId: slot.slotId,
    strategyVersion: slot.strategyVersion,
    assetSymbol: slot.assetSymbol,
    borrowAssetSymbol: slot.borrowAssetSymbol,
    venueId: slot.venueId,
    description:
      "Preview-only SPYx directional incumbent that stays blocked until exact live xStocks-on-Euler proof is verified.",
    expression: {
      view: "conviction_long",
      assetSymbol: slot.assetSymbol,
      grossExposurePct: 60,
      netExposurePct: 60,
      targetLtvPct: 35,
    },
    preview: {
      truthState: CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE.eulerRouteContext.truth,
      executionEligibility: "preview_only",
      healthFactor: null,
      liquidationDistancePct: null,
      liveSupport: false,
      executable: false,
      previewInputs: {
        source: "canonical_directional_preview_input_v2",
        side: CANONICAL_DIRECTIONAL_PREVIEW_INPUT.side,
        currentPriceUsd: xstocksAssetState.price_usd,
        collateralUsd: CANONICAL_DIRECTIONAL_PREVIEW_INPUT.collateralUsd,
        targetHealthFactor: CANONICAL_DIRECTIONAL_PREVIEW_INPUT.targetHealthFactor,
        grossExposurePct: 60,
        netExposurePct: 60,
        targetLtvPct: 35,
      },
      xstocksLiveState: {
        assetSymbol: slot.assetSymbol,
        asOf: xstocksLiveState.fetchedAt,
        status: xstocksAssetState.status,
        priceUsd: xstocksAssetState.price_usd,
        multiplier: xstocksAssetState.multiplier,
        proofOfReserves: xstocksAssetState.proof_of_reserves,
        routeTruth: xstocksLiveState.routeTruth,
        executionRoutes: xstocksExecutionRoutes,
      },
      boundaryContext: CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE,
      routeEntries: CANONICAL_DIRECTIONAL_POLICY_ROUTE_ENTRIES,
      overlayMarket: CANONICAL_MORPHO_SPYX_AUSD_MARKET,
      overlayVault: CANONICAL_FLOWDESK_AUSD_VAULT,
      supportableMetrics: {
        borrowCostBps: CANONICAL_MORPHO_SPYX_AUSD_MARKET.borrowApyBps,
        supplyApyBps: CANONICAL_MORPHO_SPYX_AUSD_MARKET.supplyApyBps,
        utilizationBps: CANONICAL_MORPHO_SPYX_AUSD_MARKET.utilizationBps,
        overlayLiquidityUsd: CANONICAL_MORPHO_SPYX_AUSD_MARKET.liquidityUsd,
        vaultApyBps: CANONICAL_FLOWDESK_AUSD_VAULT.apyBps,
        vaultTvlUsd: CANONICAL_FLOWDESK_AUSD_VAULT.tvlUsd,
      },
      notes: [
        "Preview metrics use the frozen research market map plus verified Morpho SPYx/AUSD and Flowdesk AUSD overlay context.",
        "SPYx xStocks asset state is read from canonical package fixtures, not inferred from policy or API synthesis.",
        "Preview only: exact live xStocks-on-Euler route proof remains unverified.",
        "Directional activation stays fail-closed until a verified live rail replaces this preview incumbent.",
      ],
    },
  };
}
