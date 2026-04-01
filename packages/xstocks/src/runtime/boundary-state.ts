import type {
  Chain,
  RouteChain,
  RouteVerificationTier
} from "@xstocks-strategy-lab/shared/contracts/common";

import { getXStocksAsset } from "../adapters/assets.js";
import { getXStocksPriceData } from "../adapters/price-data.js";
import { getXStocksProofOfReserves } from "../adapters/proof-of-reserves.js";
import { getXStocksSystemStatus } from "../adapters/system-status.js";
import { BACKED_API_BASE_URL, BACKED_PUBLIC_PATHS } from "../constants.js";
import { createXStocksPublicClient, type XStocksFetch, type XStocksPublicClient, type XStocksPublicClientConfig } from "../http.js";
import {
  ROUTE_TRUTH,
  XSTOCKS_RAIL_PROOF_SOURCE,
  buildExecutionRoutes,
  deriveExecutionRouteTruth,
  type RouteTruth
} from "../truth.js";
import type {
  XStocksAsset,
  XStocksExecutionRoute,
  XStocksNetwork,
  XStocksPriceData,
  XStocksProofOfReserves,
  XStocksSystemStatus
} from "../types.js";

export const XSTOCKS_BOUNDARY_LIVE_STATE_VERSION = "2026-03-31.xstocks-live.package.v1";
export const XSTOCKS_BOUNDARY_ROUTE_STATE_VERSION = "2026-03-31.route-live.package.v1";

export const XSTOCKS_BOUNDARY_ASSET_SOURCE = {
  XSTOCKS: "xstocks",
  STABLECOIN_BRIDGE: "stablecoin_bridge"
} as const;

export type XStocksBoundaryAssetSource =
  (typeof XSTOCKS_BOUNDARY_ASSET_SOURCE)[keyof typeof XSTOCKS_BOUNDARY_ASSET_SOURCE];

export const XSTOCKS_BOUNDARY_ASSET_STATUS = {
  ACTIVE: "active",
  HALTED: "halted",
  MISSING: "missing"
} as const;

export type XStocksBoundaryAssetStatus =
  (typeof XSTOCKS_BOUNDARY_ASSET_STATUS)[keyof typeof XSTOCKS_BOUNDARY_ASSET_STATUS];

export const XSTOCKS_BOUNDARY_PROOF_STATE = {
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  UNAVAILABLE: "unavailable",
  REPO_SCAFFOLDED: "repo_scaffolded"
} as const;

export type XStocksBoundaryProofState =
  (typeof XSTOCKS_BOUNDARY_PROOF_STATE)[keyof typeof XSTOCKS_BOUNDARY_PROOF_STATE];

export type XStocksPolicyRouteAvailability = "available" | "preview_only" | "unavailable" | "unknown" | "missing";
export type XStocksPolicyRouteKind =
  | "execution"
  | "yield_vault"
  | "lending_market"
  | "directional_market";

export interface XStocksBoundaryDeploymentSnapshot {
  readonly supportsAtomicSwaps: boolean;
  readonly address: string | null;
  readonly wrapperAddress: string | null;
  readonly stablecoinSymbols: readonly string[];
}

export type XStocksBoundaryDeploymentMap = Partial<Record<XStocksNetwork, XStocksBoundaryDeploymentSnapshot>>;

export interface XStocksFetchedBoundaryAsset {
  readonly assetSymbol: string;
  readonly source: XStocksBoundaryAssetSource;
  readonly chain: Chain;
  readonly status: XStocksBoundaryAssetStatus;
  readonly priceUsd: number | null;
  readonly proofOfReserves: XStocksBoundaryProofState;
  readonly deployments: XStocksBoundaryDeploymentMap;
  readonly executionRoutes: readonly XStocksExecutionRoute[];
  readonly routeTruth: RouteTruth | null;
  readonly asset: XStocksAsset | null;
  readonly priceData: XStocksPriceData | null;
  readonly proofOfReservesDetail: XStocksProofOfReserves | null;
  readonly systemStatus: XStocksSystemStatus | null;
  readonly notes: readonly string[];
}

export interface XStocksBoundaryAssetSnapshot {
  readonly assetSymbol: string;
  readonly source: XStocksBoundaryAssetSource;
  readonly chain: Chain;
  readonly status: XStocksBoundaryAssetStatus;
  readonly priceUsd: number | null;
  readonly proofOfReserves: XStocksBoundaryProofState;
  readonly deployments: XStocksBoundaryDeploymentMap;
  readonly notes?: readonly string[];
}

export interface XStocksPolicyRouteStateRoute {
  readonly routeId: string;
  readonly label: string;
  readonly routeKind: XStocksPolicyRouteKind;
  readonly chain: RouteChain;
  readonly verificationTier: RouteVerificationTier;
  readonly availability: XStocksPolicyRouteAvailability;
  readonly notes: string;
}

export interface XStocksPolicyLiveStatePayload {
  readonly stateVersion: string;
  readonly asOf: string;
  readonly assets: readonly XStocksBoundaryAssetSnapshot[];
}

export interface XStocksPolicyRouteStatePayload {
  readonly stateVersion: string;
  readonly asOf: string;
  readonly routes: readonly XStocksPolicyRouteStateRoute[];
}

export interface XStocksPolicyBoundaryStatePayload {
  readonly liveXStocksState: XStocksPolicyLiveStatePayload;
  readonly liveRouteState: XStocksPolicyRouteStatePayload;
}

export interface FetchXStocksBoundaryAssetOptions {
  readonly fetchedAt?: string;
}

export interface ComposeXStocksPolicyBoundaryStateOptions {
  readonly asOf?: string;
  readonly liveStateVersion?: string;
  readonly routeStateVersion?: string;
  readonly additionalRoutes?: readonly XStocksPolicyRouteStateRoute[];
}

export interface LoadXStocksBoundaryStateInput {
  readonly requiredAssets?: readonly string[];
  readonly manifest?: {
    readonly executionBoundary?: {
      readonly requiredAssets?: readonly string[];
    };
  };
  readonly asOf?: string;
  readonly additionalRoutes?: readonly XStocksPolicyRouteStateRoute[];
}

export interface XStocksBoundaryRepositoryConfig extends XStocksPublicClientConfig {
  readonly client?: XStocksPublicClient;
  readonly fetchImpl?: XStocksPublicClientConfig["fetch"];
  readonly backedBaseUrl?: string;
  readonly now?: () => string;
  readonly additionalRoutes?: readonly XStocksPolicyRouteStateRoute[];
}

export interface XStocksBoundaryRepository {
  fetchAssetSnapshot(symbol: string, options?: FetchXStocksBoundaryAssetOptions): Promise<XStocksFetchedBoundaryAsset>;
  fetchRequiredAssets(symbols: readonly string[], options?: FetchXStocksBoundaryAssetOptions): Promise<readonly XStocksFetchedBoundaryAsset[]>;
  loadBoundaryState(input: LoadXStocksBoundaryStateInput): Promise<XStocksPolicyBoundaryStatePayload>;
}

const AUSD_SYMBOL = "AUSD";

interface BackedAssetQuoteRaw {
  readonly symbol?: string;
  readonly bid?: number | null;
  readonly ask?: number | null;
}

interface BackedQuoteRequestConfig {
  readonly baseUrl?: string;
  readonly fetchImpl?: XStocksFetch;
}

function resolveFetch(fetchImpl?: XStocksFetch): XStocksFetch {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation was provided for Backed quotes.");
  }

  return fetch;
}

function buildBackedQuoteUrl(
  symbol: string,
  baseUrl = BACKED_API_BASE_URL,
): URL {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const path = BACKED_PUBLIC_PATHS.assetQuote(symbol).replace(/^\/+/u, "");
  return new URL(path, base);
}

function normalizeBackedQuotePrice(raw: BackedAssetQuoteRaw): number | null {
  const bidValue = typeof raw.bid === "number" ? raw.bid : null;
  const askValue = typeof raw.ask === "number" ? raw.ask : null;

  if (
    bidValue === null ||
    askValue === null ||
    !Number.isFinite(bidValue) ||
    !Number.isFinite(askValue)
  ) {
    return null;
  }

  return Number((((bidValue + askValue) / 2) / 100).toFixed(6));
}

async function getBackedQuotePriceUsd(
  assetSymbol: string,
  config: BackedQuoteRequestConfig = {},
): Promise<number | null> {
  const fetchImpl = resolveFetch(config.fetchImpl);
  const url = buildBackedQuoteUrl(assetSymbol, config.baseUrl);
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Backed quote request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  return normalizeBackedQuotePrice(
    (await response.json()) as BackedAssetQuoteRaw,
  );
}

function toBoundaryDeployments(asset: XStocksAsset): XStocksBoundaryDeploymentMap {
  return Object.fromEntries(
    asset.deployments.map((deployment) => [
      deployment.network,
      {
        supportsAtomicSwaps:
          deployment.supportsAtomicSwaps ||
          deployment.stablecoins.some((stablecoin) => stablecoin.supportsAtomicSwaps),
        address: deployment.address,
        wrapperAddress: deployment.wrapperAddress,
        stablecoinSymbols: deployment.stablecoins.map((stablecoin) => stablecoin.symbol)
      }
    ])
  ) as XStocksBoundaryDeploymentMap;
}

function toBoundaryStatus(asset: XStocksAsset, systemStatus: XStocksSystemStatus): XStocksBoundaryAssetStatus {
  if (asset.isTradingHalted || systemStatus.isMarketTradingHalted) {
    return XSTOCKS_BOUNDARY_ASSET_STATUS.HALTED;
  }

  return XSTOCKS_BOUNDARY_ASSET_STATUS.ACTIVE;
}

function toProofState(proofOfReserves: XStocksProofOfReserves): XStocksBoundaryProofState {
  if (proofOfReserves.proofAvailable) {
    return XSTOCKS_BOUNDARY_PROOF_STATE.VERIFIED;
  }

  return XSTOCKS_BOUNDARY_PROOF_STATE.UNVERIFIED;
}

function toRouteAvailability(
  fetchedAssets: readonly XStocksFetchedBoundaryAsset[],
  network: XStocksNetwork
): XStocksPolicyRouteAvailability {
  const xstocksAssets = fetchedAssets.filter(
    (asset) => asset.source === XSTOCKS_BOUNDARY_ASSET_SOURCE.XSTOCKS
  );

  if (xstocksAssets.length === 0) {
    return "missing";
  }

  const supportsAtomicRoute = xstocksAssets.every(
    (asset) => asset.deployments[network]?.supportsAtomicSwaps === true
  );

  return supportsAtomicRoute ? "available" : "unavailable";
}

function resolveRequiredAssets(input: LoadXStocksBoundaryStateInput): readonly string[] {
  const requiredAssets =
    input.requiredAssets ??
    input.manifest?.executionBoundary?.requiredAssets ??
    [];

  if (requiredAssets.length === 0) {
    throw new Error("At least one required asset is needed to load xstocks boundary state.");
  }

  return requiredAssets;
}

function toPolicyRoute(
  route: XStocksExecutionRoute,
  availability: XStocksPolicyRouteAvailability
): XStocksPolicyRouteStateRoute {
  const verificationTier: RouteVerificationTier =
    route.proofSource === XSTOCKS_RAIL_PROOF_SOURCE.VERIFIED_PUBLIC
      ? "public_verified"
      : route.proofSource === XSTOCKS_RAIL_PROOF_SOURCE.MENTOR_REPORTED
        ? "mentor_reported"
        : "unverified";

  return {
    routeId:
      route.id === "cow_swap"
        ? "cow_swap.ethereum"
        : route.id === "oneinch"
          ? "1inch.ethereum"
          : "spread.ink",
    label: `${route.label} on ${route.chain}`,
    routeKind: "execution",
    chain: route.chain.toLowerCase() as RouteChain,
    verificationTier,
    availability,
    notes: route.notes.join(" ")
  };
}

export function createAusdBridgeAssetSnapshot(): XStocksFetchedBoundaryAsset {
  return {
    assetSymbol: AUSD_SYMBOL,
    source: XSTOCKS_BOUNDARY_ASSET_SOURCE.STABLECOIN_BRIDGE,
    chain: "ethereum",
    status: XSTOCKS_BOUNDARY_ASSET_STATUS.ACTIVE,
    priceUsd: 1,
    proofOfReserves: XSTOCKS_BOUNDARY_PROOF_STATE.REPO_SCAFFOLDED,
    deployments: {
      Ethereum: {
        supportsAtomicSwaps: true,
        address: null,
        wrapperAddress: null,
        stablecoinSymbols: [AUSD_SYMBOL]
      }
    },
    executionRoutes: [],
    routeTruth: null,
    asset: null,
    priceData: null,
    proofOfReservesDetail: null,
    systemStatus: null,
    notes: [
      "AUSD is surfaced here through a package-owned execution-boundary bridge helper.",
      "This is not a claim that AUSD is an xStocks public asset."
    ]
  };
}

export async function fetchXStocksBoundaryAsset(
  client: XStocksPublicClient,
  assetSymbol: string,
  _options: FetchXStocksBoundaryAssetOptions = {},
  backedQuoteConfig: BackedQuoteRequestConfig = {},
): Promise<XStocksFetchedBoundaryAsset> {
  if (assetSymbol === AUSD_SYMBOL) {
    return createAusdBridgeAssetSnapshot();
  }

  try {
    const asset = await getXStocksAsset(client, assetSymbol);
    const [priceData, systemStatus, proofOfReserves] = await Promise.all([
      getXStocksPriceData(client, assetSymbol),
      getXStocksSystemStatus(client, assetSymbol, asset),
      getXStocksProofOfReserves(client, assetSymbol)
    ]);
    const executionRoutes = buildExecutionRoutes(asset, systemStatus);
    const notes: string[] = [];
    let priceUsd = priceData.quoteUsd;

    try {
      const backedQuotePriceUsd = await getBackedQuotePriceUsd(
        assetSymbol,
        backedQuoteConfig,
      );

      if (backedQuotePriceUsd !== null) {
        priceUsd = backedQuotePriceUsd;
      } else {
        notes.push(
          `Backed quote response for ${assetSymbol} did not include a usable bid/ask pair; falling back to xStocks price data.`,
        );
      }
    } catch (error) {
      notes.push(
        error instanceof Error
          ? `${error.message} Falling back to xStocks price data for ${assetSymbol}.`
          : `Backed quote request failed for ${assetSymbol}. Falling back to xStocks price data.`,
      );
    }

    return {
      assetSymbol,
      source: XSTOCKS_BOUNDARY_ASSET_SOURCE.XSTOCKS,
      chain: "ethereum",
      status: toBoundaryStatus(asset, systemStatus),
      priceUsd,
      proofOfReserves: toProofState(proofOfReserves),
      deployments: toBoundaryDeployments(asset),
      executionRoutes,
      routeTruth: deriveExecutionRouteTruth(executionRoutes),
      asset,
      priceData,
      proofOfReservesDetail: proofOfReserves,
      systemStatus,
      notes
    };
  } catch (error) {
    return {
      assetSymbol,
      source: XSTOCKS_BOUNDARY_ASSET_SOURCE.XSTOCKS,
      chain: "ethereum",
      status: XSTOCKS_BOUNDARY_ASSET_STATUS.MISSING,
      priceUsd: null,
      proofOfReserves: XSTOCKS_BOUNDARY_PROOF_STATE.UNAVAILABLE,
      deployments: {},
      executionRoutes: [],
      routeTruth: ROUTE_TRUTH.BLOCKED,
      asset: null,
      priceData: null,
      proofOfReservesDetail: null,
      systemStatus: null,
      notes: [error instanceof Error ? error.message : String(error)]
    };
  }
}

export async function fetchXStocksBoundaryAssets(
  client: XStocksPublicClient,
  assetSymbols: readonly string[],
  options: FetchXStocksBoundaryAssetOptions = {},
  backedQuoteConfig: BackedQuoteRequestConfig = {},
): Promise<readonly XStocksFetchedBoundaryAsset[]> {
  return Promise.all(
    assetSymbols.map((assetSymbol) =>
      fetchXStocksBoundaryAsset(client, assetSymbol, options, backedQuoteConfig),
    ),
  );
}

export function buildPolicyLiveXStocksStatePayload(
  fetchedAssets: readonly XStocksFetchedBoundaryAsset[],
  options: {
    readonly asOf?: string;
    readonly stateVersion?: string;
  } = {}
): XStocksPolicyLiveStatePayload {
  return {
    stateVersion: options.stateVersion ?? XSTOCKS_BOUNDARY_LIVE_STATE_VERSION,
    asOf: options.asOf ?? new Date().toISOString(),
    assets: fetchedAssets.map((asset) => ({
      assetSymbol: asset.assetSymbol,
      source: asset.source,
      chain: asset.chain,
      status: asset.status,
      priceUsd: asset.priceUsd,
      proofOfReserves: asset.proofOfReserves,
      deployments: asset.deployments,
      ...(asset.notes.length === 0 ? {} : { notes: asset.notes })
    }))
  };
}

export function buildPolicyRouteStateFromFetchedAssets(
  fetchedAssets: readonly XStocksFetchedBoundaryAsset[],
  options: {
    readonly asOf?: string;
    readonly stateVersion?: string;
    readonly additionalRoutes?: readonly XStocksPolicyRouteStateRoute[];
  } = {}
): XStocksPolicyRouteStatePayload {
  const ethereumAvailability = toRouteAvailability(fetchedAssets, "Ethereum");
  const inkAvailability = toRouteAvailability(fetchedAssets, "Ink");
  const executionRoutesSource =
    fetchedAssets.find((asset) => asset.source === XSTOCKS_BOUNDARY_ASSET_SOURCE.XSTOCKS)?.executionRoutes ?? [];
  const routeById = new Map(executionRoutesSource.map((route) => [route.id, route]));
  const executionRoutes: XStocksPolicyRouteStateRoute[] = [];

  const cowSwapRoute = routeById.get("cow_swap");
  if (cowSwapRoute) {
    executionRoutes.push(toPolicyRoute(cowSwapRoute, ethereumAvailability));
  } else {
    executionRoutes.push({
      routeId: "cow_swap.ethereum",
      label: "Cow Swap on Ethereum",
      routeKind: "execution",
      chain: "ethereum",
      verificationTier: "public_verified",
      availability: ethereumAvailability,
      notes: "Verified Ethereum execution surface remains derived from xstocks deployments and atomic-swap support."
    });
  }

  const oneInchRoute = routeById.get("oneinch");
  if (oneInchRoute) {
    executionRoutes.push(toPolicyRoute(oneInchRoute, ethereumAvailability));
  } else {
    executionRoutes.push({
      routeId: "1inch.ethereum",
      label: "1inch on Ethereum",
      routeKind: "execution",
      chain: "ethereum",
      verificationTier: "public_verified",
      availability: ethereumAvailability,
      notes: "Verified Ethereum execution surface remains derived from xstocks deployments and atomic-swap support."
    });
  }

  const spreadRoute = routeById.get("spread_finance");
  if (spreadRoute) {
    executionRoutes.push(toPolicyRoute(spreadRoute, inkAvailability));
  } else {
    executionRoutes.push({
      routeId: "spread.ink",
      label: "Spread Finance on Ink",
      routeKind: "execution",
      chain: "ink",
      verificationTier: "mentor_reported",
      availability: inkAvailability,
      notes: "Mentor-confirmed Ink rail stays fail-closed until directly verified."
    });
  }

  return {
    stateVersion: options.stateVersion ?? XSTOCKS_BOUNDARY_ROUTE_STATE_VERSION,
    asOf: options.asOf ?? new Date().toISOString(),
    routes: [...executionRoutes, ...(options.additionalRoutes ?? [])]
  };
}

export function composePolicyBoundaryStateFromFetchedAssets(
  fetchedAssets: readonly XStocksFetchedBoundaryAsset[],
  options: ComposeXStocksPolicyBoundaryStateOptions = {}
): XStocksPolicyBoundaryStatePayload {
  const asOf = options.asOf ?? new Date().toISOString();

  return {
    liveXStocksState: buildPolicyLiveXStocksStatePayload(fetchedAssets, {
      asOf,
      ...(options.liveStateVersion === undefined ? {} : { stateVersion: options.liveStateVersion })
    }),
    liveRouteState: buildPolicyRouteStateFromFetchedAssets(fetchedAssets, {
      asOf,
      ...(options.routeStateVersion === undefined ? {} : { stateVersion: options.routeStateVersion }),
      ...(options.additionalRoutes === undefined ? {} : { additionalRoutes: options.additionalRoutes })
    })
  };
}

export function createXStocksBoundaryRepository(
  config: XStocksBoundaryRepositoryConfig = {}
): XStocksBoundaryRepository {
  const clientConfig: {
    baseUrl?: string;
    headers?: HeadersInit;
    fetch?: NonNullable<XStocksPublicClientConfig["fetch"]>;
  } = {};

  if (config.baseUrl !== undefined) {
    clientConfig.baseUrl = config.baseUrl;
  }

  if (config.headers !== undefined) {
    clientConfig.headers = config.headers;
  }

  const fetchImpl = config.fetch ?? config.fetchImpl;
  if (fetchImpl !== undefined) {
    clientConfig.fetch = fetchImpl;
  }

  const client =
    config.client ??
    createXStocksPublicClient(clientConfig);
  const now = config.now ?? (() => new Date().toISOString());
  const additionalRoutes = config.additionalRoutes ?? [];
  const backedQuoteConfig: BackedQuoteRequestConfig = {
    ...(config.backedBaseUrl === undefined
      ? {}
      : { baseUrl: config.backedBaseUrl }),
    ...(fetchImpl === undefined ? {} : { fetchImpl }),
  };

  return {
    async fetchAssetSnapshot(symbol: string, options: FetchXStocksBoundaryAssetOptions = {}) {
      return fetchXStocksBoundaryAsset(client, symbol, options, backedQuoteConfig);
    },
    async fetchRequiredAssets(symbols: readonly string[], options: FetchXStocksBoundaryAssetOptions = {}) {
      return fetchXStocksBoundaryAssets(
        client,
        symbols,
        options,
        backedQuoteConfig,
      );
    },
    async loadBoundaryState(input: LoadXStocksBoundaryStateInput): Promise<XStocksPolicyBoundaryStatePayload> {
      const asOf = input.asOf ?? now();
      const requiredAssets = resolveRequiredAssets(input);
      const fetchedAssets = await fetchXStocksBoundaryAssets(client, requiredAssets, {
        fetchedAt: asOf
      }, backedQuoteConfig);

      return composePolicyBoundaryStateFromFetchedAssets(fetchedAssets, {
        asOf,
        additionalRoutes: [...additionalRoutes, ...(input.additionalRoutes ?? [])]
      });
    }
  };
}
