import {
  XSTOCKS_DEFAULT_NETWORK
} from "../constants.js";
import {
  normalizeAsset,
  normalizeMultiplier,
  normalizeMultiplierHistory,
  normalizePriceData,
  normalizeProofOfReserves,
  normalizeSystemStatus
} from "../normalize.js";
import { buildXStocksStateStripCollection } from "../payloads/state-strip.js";
import {
  ROUTE_TRUTH,
  XSTOCKS_EXECUTION_RAIL,
  XSTOCKS_RAIL_PROOF_SOURCE,
  buildExecutionRoutes,
  deriveExecutionRouteTruth
} from "../truth.js";
import type {
  XStocksAssetRaw,
  XStocksMultiplierHistoryRaw,
  XStocksMultiplierRaw,
  XStocksNetwork,
  XStocksNormalizedLiveState,
  XStocksPriceDataRaw,
  XStocksProofOfReservesRaw,
  XStocksStateStripCollectionPayload,
  XStocksSystemStatusRaw
} from "../types.js";
import type { XStocksExecutionRailId, XStocksRailProofSource } from "../truth.js";

export const CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP = "2026-03-31T12:00:00.000Z";
export const CANONICAL_XSTOCKS_STATE_VERSION = "2026-03-31.xstocks-live.v1";

export interface XStocksLiveFixtureBundle {
  readonly symbol: string;
  readonly network: XStocksNetwork;
  readonly fetchedAt: string;
  readonly asset: XStocksAssetRaw;
  readonly priceData: XStocksPriceDataRaw;
  readonly multiplier: XStocksMultiplierRaw;
  readonly multiplierHistory: XStocksMultiplierHistoryRaw;
  readonly proofOfReserves: XStocksProofOfReservesRaw | null;
  readonly systemStatus: XStocksSystemStatusRaw;
}

export type XStocksFixtureChain = Lowercase<XStocksNetwork>;
export type XStocksPolicyAssetStatus = "active" | "halted";
export type XStocksPolicyProofOfReservesState = "verified" | "missing";

export interface XStocksPolicyAssetFixture {
  readonly asset_symbol: string;
  readonly chain: XStocksFixtureChain;
  readonly status: XStocksPolicyAssetStatus;
  readonly price_usd: number | null;
  readonly multiplier: number;
  readonly proof_of_reserves: XStocksPolicyProofOfReservesState;
}

export interface XStocksPolicyLiveStateFixture {
  readonly state_version: string;
  readonly as_of: string;
  readonly assets: readonly XStocksPolicyAssetFixture[];
}

export type XStocksRouteVerificationTier = "public_verified" | "mentor_reported" | "unverified";
export type XStocksRouteAvailability = "available" | "preview_only" | "unavailable" | "unknown";

export interface XStocksPolicyExecutionRouteFixture {
  readonly route_id: string;
  readonly label: string;
  readonly route_kind: "execution";
  readonly chain: XStocksFixtureChain;
  readonly verification_tier: XStocksRouteVerificationTier;
  readonly availability: XStocksRouteAvailability;
  readonly notes: string;
}

export const CANONICAL_SPYX_LIVE_FIXTURE: XStocksLiveFixtureBundle = {
  symbol: "SPYx",
  network: "Ethereum",
  fetchedAt: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
  asset: {
    id: "spyx",
    name: "SPYx",
    symbol: "SPYx",
    isin: "US78462F1030",
    underlyingSymbol: "SPY",
    underlyingIsin: "US78462F1030",
    description: "Tokenized SPY exposure for canonical xStocks runtime fixtures.",
    logo: "https://cdn.xstocks.fi/assets/spyx.png",
    isTradingHalted: false,
    deployments: [
      {
        address: "0xspyxeth",
        network: "Ethereum",
        supportsAtomicSwaps: true,
        stablecoins: [
          {
            symbol: "AUSD",
            currency: "USD",
            network: "Ethereum",
            address: "0xausdeth",
            decimals: 18,
            issuance: true,
            redemption: true,
            supportsAtomicSwaps: true
          }
        ]
      },
      {
        address: "0xspyxink",
        network: "Ink",
        wrapperAddress: "0xspyxinkwrapper",
        supportsAtomicSwaps: true,
        stablecoins: [
          {
            symbol: "AUSD",
            currency: "USD",
            network: "Ink",
            address: "0xausdink",
            decimals: 18,
            issuance: true,
            redemption: true,
            supportsAtomicSwaps: true
          }
        ]
      }
    ]
  },
  priceData: {
    quote: 563.14
  },
  multiplier: {
    currentMultiplier: 1,
    newMultiplier: 1.02,
    activationDateTime: Date.parse("2026-04-15T12:00:00.000Z"),
    reason: "Dividend"
  },
  multiplierHistory: {
    page: {
      currentPage: 0,
      hasNextPage: false
    },
    nodes: [
      {
        id: "spyx-multiplier-2026-03-01",
        reason: "Dividend",
        multiplier: 1,
        previousMultiplier: 0.98,
        activationDateTime: "2026-03-01T12:00:00.000Z"
      },
      {
        id: "spyx-multiplier-2026-01-01",
        reason: "Split",
        multiplier: 0.98,
        previousMultiplier: 0.49,
        activationDateTime: "2026-01-01T12:00:00.000Z"
      }
    ]
  },
  proofOfReserves: {
    symbol: "SPYx",
    timestamp: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
    sharesHeld: "1005000",
    circulatingSupply: "1000000",
    holdings: [
      {
        provider: "Flowdesk",
        quantity: "605000",
        symbol: "SPY"
      },
      {
        provider: "Custodian",
        quantity: "400000",
        symbol: "SPY"
      }
    ]
  },
  systemStatus: {
    symbol: "SPYx",
    isMarketTradingHalted: false,
    isAtomicTradingHalted: false
  }
};

export const CANONICAL_MSTRX_LIVE_FIXTURE: XStocksLiveFixtureBundle = {
  symbol: "MSTRx",
  network: "Ethereum",
  fetchedAt: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
  asset: {
    id: "mstrx",
    name: "MSTRx",
    symbol: "MSTRx",
    isin: "US5949724083",
    underlyingSymbol: "MSTR",
    underlyingIsin: "US5949724083",
    description: "Tokenized MSTR exposure for canonical xStocks runtime fixtures.",
    logo: "https://cdn.xstocks.fi/assets/mstrx.png",
    isTradingHalted: false,
    deployments: [
      {
        address: "0xmstrxeth",
        network: "Ethereum",
        supportsAtomicSwaps: true,
        stablecoins: [
          {
            symbol: "AUSD",
            currency: "USD",
            network: "Ethereum",
            address: "0xausdeth",
            decimals: 18,
            issuance: true,
            redemption: true,
            supportsAtomicSwaps: true
          }
        ]
      }
    ]
  },
  priceData: {
    quote: 1921.7
  },
  multiplier: {
    currentMultiplier: 1,
    newMultiplier: 0,
    activationDateTime: 0,
    reason: null
  },
  multiplierHistory: {
    page: {
      currentPage: 0,
      hasNextPage: false
    },
    nodes: [
      {
        id: "mstrx-multiplier-2025-12-01",
        reason: "Administrative",
        multiplier: 1,
        previousMultiplier: 1,
        activationDateTime: "2025-12-01T00:00:00.000Z"
      }
    ]
  },
  proofOfReserves: {
    symbol: "MSTRx",
    timestamp: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
    sharesHeld: "250000",
    circulatingSupply: "250000",
    holdings: [
      {
        provider: "Custodian",
        quantity: "250000",
        symbol: "MSTR"
      }
    ]
  },
  systemStatus: {
    symbol: "MSTRx",
    isMarketTradingHalted: false,
    isAtomicTradingHalted: false
  }
};

export function buildNormalizedXStocksLiveStateFromFixture(
  fixture: XStocksLiveFixtureBundle
): XStocksNormalizedLiveState {
  const asset = normalizeAsset(fixture.asset);
  const priceData = normalizePriceData(fixture.priceData, fixture.symbol);
  const multiplier = normalizeMultiplier(fixture.multiplier, fixture.symbol, fixture.network);
  const multiplierHistory = normalizeMultiplierHistory(
    fixture.multiplierHistory,
    fixture.symbol,
    fixture.network
  );
  const proofOfReserves = normalizeProofOfReserves(fixture.proofOfReserves, fixture.symbol);
  const systemStatus = normalizeSystemStatus(fixture.systemStatus, fixture.symbol, asset);
  const executionRoutes = buildExecutionRoutes(asset, systemStatus);

  return {
    symbol: fixture.symbol,
    network: fixture.network,
    fetchedAt: fixture.fetchedAt,
    asset,
    priceData,
    multiplier,
    multiplierHistory,
    proofOfReserves,
    systemStatus,
    executionRoutes,
    routeTruth: deriveExecutionRouteTruth(executionRoutes)
  };
}

export const CANONICAL_SPYX_NORMALIZED_LIVE_STATE =
  buildNormalizedXStocksLiveStateFromFixture(CANONICAL_SPYX_LIVE_FIXTURE);

export const CANONICAL_MSTRX_NORMALIZED_LIVE_STATE =
  buildNormalizedXStocksLiveStateFromFixture(CANONICAL_MSTRX_LIVE_FIXTURE);

export const CANONICAL_XSTOCKS_LIVE_FIXTURES = [
  CANONICAL_SPYX_LIVE_FIXTURE,
  CANONICAL_MSTRX_LIVE_FIXTURE
] as const;

export const CANONICAL_XSTOCKS_NORMALIZED_LIVE_STATES = [
  CANONICAL_SPYX_NORMALIZED_LIVE_STATE,
  CANONICAL_MSTRX_NORMALIZED_LIVE_STATE
] as const;

export const CANONICAL_XSTOCKS_STATE_STRIP_COLLECTION: XStocksStateStripCollectionPayload =
  buildXStocksStateStripCollection(CANONICAL_XSTOCKS_NORMALIZED_LIVE_STATES, {
    generatedAt: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
    network: XSTOCKS_DEFAULT_NETWORK,
    page: {
      currentPage: 0,
      hasNextPage: false
    }
  });

function toFixtureChain(network: XStocksNetwork): XStocksFixtureChain {
  return network.toLowerCase() as XStocksFixtureChain;
}

function toPolicyAssetStatus(state: XStocksNormalizedLiveState): XStocksPolicyAssetStatus {
  return state.asset.isTradingHalted || state.systemStatus.isMarketTradingHalted ? "halted" : "active";
}

function toPolicyProofOfReservesState(
  state: XStocksNormalizedLiveState
): XStocksPolicyProofOfReservesState {
  return state.proofOfReserves.proofAvailable ? "verified" : "missing";
}

function toRouteVerificationTier(
  proofSource: XStocksRailProofSource
): XStocksRouteVerificationTier {
  if (proofSource === XSTOCKS_RAIL_PROOF_SOURCE.VERIFIED_PUBLIC) {
    return "public_verified";
  }

  if (proofSource === XSTOCKS_RAIL_PROOF_SOURCE.MENTOR_REPORTED) {
    return "mentor_reported";
  }

  return "unverified";
}

function toRouteAvailability(truth: typeof ROUTE_TRUTH[keyof typeof ROUTE_TRUTH]): XStocksRouteAvailability {
  if (truth === ROUTE_TRUTH.LIVE || truth === ROUTE_TRUTH.MENTOR_CONFIRMED) {
    return "available";
  }

  if (truth === ROUTE_TRUTH.PREVIEW) {
    return "preview_only";
  }

  if (truth === ROUTE_TRUTH.BLOCKED) {
    return "unavailable";
  }

  return "unknown";
}

function toRouteStateId(routeId: XStocksExecutionRailId, chain: XStocksNetwork): string {
  const normalizedChain = toFixtureChain(chain);

  if (routeId === XSTOCKS_EXECUTION_RAIL.COW_SWAP) {
    return `cow_swap.${normalizedChain}`;
  }

  if (routeId === XSTOCKS_EXECUTION_RAIL.ONEINCH) {
    return `1inch.${normalizedChain}`;
  }

  return `spread.${normalizedChain}`;
}

export function buildPolicyLiveXStocksStateFixture(
  states: readonly XStocksNormalizedLiveState[],
  options: {
    readonly asOf?: string;
    readonly stateVersion?: string;
  } = {}
): XStocksPolicyLiveStateFixture {
  return {
    state_version: options.stateVersion ?? CANONICAL_XSTOCKS_STATE_VERSION,
    as_of: options.asOf ?? states[0]?.fetchedAt ?? CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
    assets: [...states]
      .map((state) => ({
        asset_symbol: state.symbol,
        chain: toFixtureChain(state.network),
        status: toPolicyAssetStatus(state),
        price_usd: state.priceData.quoteUsd,
        multiplier: state.multiplier.currentMultiplier,
        proof_of_reserves: toPolicyProofOfReservesState(state)
      }))
      .sort((left, right) => left.asset_symbol.localeCompare(right.asset_symbol))
  };
}

export function buildPolicyExecutionRouteFixtures(
  state: XStocksNormalizedLiveState
): readonly XStocksPolicyExecutionRouteFixture[] {
  return state.executionRoutes.map((route) => ({
    route_id: toRouteStateId(route.id, route.chain),
    label: `${route.label} on ${route.chain}`,
    route_kind: "execution",
    chain: toFixtureChain(route.chain),
    verification_tier: toRouteVerificationTier(route.proofSource),
    availability: toRouteAvailability(route.truth),
    notes: route.notes.join(" ")
  }));
}

export const CANONICAL_POLICY_LIVE_XSTOCKS_STATE = buildPolicyLiveXStocksStateFixture(
  CANONICAL_XSTOCKS_NORMALIZED_LIVE_STATES
);

export const CANONICAL_POLICY_EXECUTION_ROUTE_FIXTURES = buildPolicyExecutionRouteFixtures(
  CANONICAL_SPYX_NORMALIZED_LIVE_STATE
);
