import { XSTOCKS_DEFAULT_NETWORK } from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { getXStocksAsset, listXStocksAssets, type ListXStocksAssetsParams } from "../adapters/assets.js";
import { getXStocksMultiplier, getXStocksMultiplierHistory, type GetXStocksMultiplierHistoryParams } from "../adapters/multiplier.js";
import { getXStocksPriceData } from "../adapters/price-data.js";
import { getXStocksProofOfReserves } from "../adapters/proof-of-reserves.js";
import { getXStocksSystemStatus } from "../adapters/system-status.js";
import { buildExecutionRoutes, deriveExecutionRouteTruth } from "../truth.js";
import type {
  XStocksNetwork,
  XStocksNormalizedLiveState,
  XStocksStateStripCollectionPayload,
  XStocksStateStripPayload
} from "../types.js";

export interface FetchNormalizedXStocksLiveStateOptions {
  readonly network?: XStocksNetwork;
  readonly multiplierHistoryPage?: number;
  readonly multiplierHistoryPageSize?: number;
  readonly fetchedAt?: string;
}

export interface BuildXStocksStateStripCollectionOptions {
  readonly generatedAt?: string;
  readonly network?: XStocksNetwork;
  readonly page?: XStocksStateStripCollectionPayload["page"];
}

export async function fetchNormalizedXStocksLiveState(
  client: XStocksPublicClient,
  symbol: string,
  options: FetchNormalizedXStocksLiveStateOptions = {}
): Promise<XStocksNormalizedLiveState> {
  const network = options.network ?? XSTOCKS_DEFAULT_NETWORK;
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const asset = await getXStocksAsset(client, symbol);
  const multiplierHistoryParams: GetXStocksMultiplierHistoryParams = {
    network,
    ...(options.multiplierHistoryPage === undefined ? {} : { page: options.multiplierHistoryPage }),
    ...(options.multiplierHistoryPageSize === undefined ? {} : { pageSize: options.multiplierHistoryPageSize })
  };

  const [priceData, multiplier, multiplierHistory, proofOfReserves, systemStatus] = await Promise.all([
    getXStocksPriceData(client, symbol),
    getXStocksMultiplier(client, symbol, network),
    getXStocksMultiplierHistory(client, symbol, multiplierHistoryParams),
    getXStocksProofOfReserves(client, symbol),
    getXStocksSystemStatus(client, symbol, asset)
  ]);

  const executionRoutes = buildExecutionRoutes(asset, systemStatus);
  const routeTruth = deriveExecutionRouteTruth(executionRoutes);

  return {
    symbol,
    network,
    fetchedAt,
    asset,
    priceData,
    multiplier,
    multiplierHistory,
    proofOfReserves,
    systemStatus,
    executionRoutes,
    routeTruth
  };
}

export function buildXStocksStateStrip(state: XStocksNormalizedLiveState): XStocksStateStripPayload {
  const networks = state.asset.deployments.map((deployment) => deployment.network);
  const atomicSwapNetworks = state.asset.deployments
    .filter((deployment) => deployment.supportsAtomicSwaps || deployment.stablecoins.some((stablecoin) => stablecoin.supportsAtomicSwaps))
    .map((deployment) => deployment.network);

  return {
    generatedAt: state.fetchedAt,
    symbol: state.symbol,
    network: state.network,
    routeTruth: state.routeTruth,
    asset: {
      id: state.asset.id,
      name: state.asset.name,
      symbol: state.asset.symbol,
      underlyingSymbol: state.asset.underlyingSymbol,
      logoUrl: state.asset.logoUrl,
      networks,
      atomicSwapNetworks
    },
    pricing: {
      quoteUsd: state.priceData.quoteUsd,
      hasQuote: state.priceData.hasQuote,
      currentMultiplier: state.multiplier.currentMultiplier,
      pendingMultiplier: state.multiplier.pendingMultiplier?.value ?? null,
      pendingActivationDateTime: state.multiplier.pendingMultiplier?.activationDateTime ?? null,
      pendingReason: state.multiplier.pendingMultiplier?.reason ?? null
    },
    reserves: {
      proofAvailable: state.proofOfReserves.proofAvailable,
      timestamp: state.proofOfReserves.timestamp,
      sharesHeld: state.proofOfReserves.sharesHeld,
      circulatingSupply: state.proofOfReserves.circulatingSupply,
      coverageRatio: state.proofOfReserves.coverageRatio,
      providerCount: state.proofOfReserves.holdings.length,
      holdings: state.proofOfReserves.holdings
    },
    status: {
      isTradingHalted: state.asset.isTradingHalted,
      isMarketTradingHalted: state.systemStatus.isMarketTradingHalted,
      isAtomicTradingHalted: state.systemStatus.isAtomicTradingHalted,
      canTradeMarket: state.systemStatus.canTradeMarket,
      canTradeAtomic: state.systemStatus.canTradeAtomic
    },
    routes: state.executionRoutes,
    multiplierHistory: state.multiplierHistory.nodes
  };
}

export function buildXStocksStateStripCollection(
  states: readonly XStocksNormalizedLiveState[],
  options: BuildXStocksStateStripCollectionOptions = {}
): XStocksStateStripCollectionPayload {
  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    network: options.network ?? XSTOCKS_DEFAULT_NETWORK,
    page: options.page ?? null,
    nodes: [...states]
      .map(buildXStocksStateStrip)
      .sort((left, right) => left.symbol.localeCompare(right.symbol))
  };
}

export interface FetchXStocksStateStripCollectionOptions extends ListXStocksAssetsParams {
  readonly network?: XStocksNetwork;
  readonly multiplierHistoryPage?: number;
  readonly multiplierHistoryPageSize?: number;
  readonly generatedAt?: string;
}

export async function fetchXStocksStateStripCollection(
  client: XStocksPublicClient,
  options: FetchXStocksStateStripCollectionOptions = {}
): Promise<XStocksStateStripCollectionPayload> {
  const listParams: ListXStocksAssetsParams = {
    ...(options.isTradingHalted === undefined ? {} : { isTradingHalted: options.isTradingHalted }),
    ...(options.supportsAtomicSwaps === undefined ? {} : { supportsAtomicSwaps: options.supportsAtomicSwaps }),
    ...(options.network === undefined ? {} : { network: options.network }),
    ...(options.stablecoin === undefined ? {} : { stablecoin: options.stablecoin }),
    ...(options.page === undefined ? {} : { page: options.page }),
    ...(options.pageSize === undefined ? {} : { pageSize: options.pageSize })
  };

  const assetPage = await listXStocksAssets(client, listParams);
  const states = await Promise.all(
    assetPage.nodes.map((asset) =>
      fetchNormalizedXStocksLiveState(client, asset.symbol, {
        ...(options.network === undefined ? {} : { network: options.network }),
        ...(options.multiplierHistoryPage === undefined ? {} : { multiplierHistoryPage: options.multiplierHistoryPage }),
        ...(options.multiplierHistoryPageSize === undefined
          ? {}
          : { multiplierHistoryPageSize: options.multiplierHistoryPageSize }),
        ...(options.generatedAt === undefined ? {} : { fetchedAt: options.generatedAt })
      })
    )
  );
  const collectionOptions: BuildXStocksStateStripCollectionOptions = {
    page: assetPage.page,
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.network === undefined ? {} : { network: options.network })
  };

  return buildXStocksStateStripCollection(states, collectionOptions);
}
