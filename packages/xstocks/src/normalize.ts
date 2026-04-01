import type {
  XStocksAsset,
  XStocksAssetPage,
  XStocksAssetListRaw,
  XStocksAssetRaw,
  XStocksDeployment,
  XStocksDeploymentRaw,
  XStocksMultiplier,
  XStocksMultiplierHistoryEntry,
  XStocksMultiplierHistoryPage,
  XStocksMultiplierHistoryRaw,
  XStocksMultiplierRaw,
  XStocksNetwork,
  XStocksPageInfo,
  XStocksPriceData,
  XStocksPriceDataRaw,
  XStocksProofOfReserves,
  XStocksProofOfReservesHolding,
  XStocksProofOfReservesHoldingRaw,
  XStocksProofOfReservesRaw,
  XStocksStablecoin,
  XStocksStablecoinRaw,
  XStocksSystemStatus,
  XStocksSystemStatusRaw
} from "./types.js";

import { XSTOCKS_NETWORKS } from "./types.js";

const NETWORK_RANK = Object.fromEntries(
  XSTOCKS_NETWORKS.map((network, index) => [network, index])
) as Record<XStocksNetwork, number>;

function sortStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function sortByNetwork(left: XStocksNetwork, right: XStocksNetwork): number {
  return NETWORK_RANK[left] - NETWORK_RANK[right];
}

function sortPageInfo(page: XStocksPageInfo): XStocksPageInfo {
  return {
    currentPage: page.currentPage,
    hasNextPage: page.hasNextPage
  };
}

export function normalizeStablecoin(raw: XStocksStablecoinRaw): XStocksStablecoin {
  return {
    symbol: raw.symbol,
    currency: raw.currency,
    network: raw.network,
    address: raw.address,
    decimals: raw.decimals,
    issuance: raw.issuance,
    redemption: raw.redemption,
    supportsAtomicSwaps: raw.supportsAtomicSwaps,
    solanaTokenProgram: raw.solanaTokenProgram ?? null
  };
}

export function normalizeDeployment(raw: XStocksDeploymentRaw): XStocksDeployment {
  return {
    address: raw.address,
    network: raw.network,
    wrapperAddress: raw.wrapperAddress ?? null,
    supportsAtomicSwaps: raw.supportsAtomicSwaps,
    stablecoins: [...raw.stablecoins]
      .map(normalizeStablecoin)
      .sort((left, right) => {
        const networkOrder = sortByNetwork(left.network, right.network);

        if (networkOrder !== 0) {
          return networkOrder;
        }

        const symbolOrder = sortStrings(left.symbol, right.symbol);

        if (symbolOrder !== 0) {
          return symbolOrder;
        }

        return sortStrings(left.address, right.address);
      })
  };
}

export function normalizeAsset(raw: XStocksAssetRaw): XStocksAsset {
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    isin: raw.isin,
    underlyingSymbol: raw.underlyingSymbol,
    underlyingIsin: raw.underlyingIsin,
    description: raw.description,
    logoUrl: raw.logo || null,
    isTradingHalted: raw.isTradingHalted,
    deployments: [...raw.deployments]
      .map(normalizeDeployment)
      .sort((left, right) => {
        const networkOrder = sortByNetwork(left.network, right.network);

        if (networkOrder !== 0) {
          return networkOrder;
        }

        return sortStrings(left.address, right.address);
      })
  };
}

export function normalizeAssetPage(raw: XStocksAssetListRaw): XStocksAssetPage {
  return {
    page: sortPageInfo(raw.page),
    nodes: [...raw.nodes]
      .map(normalizeAsset)
      .sort((left, right) => sortStrings(left.symbol, right.symbol))
  };
}

export function normalizePriceData(raw: XStocksPriceDataRaw, symbol: string): XStocksPriceData {
  const quoteUsd = raw.quote ?? null;

  return {
    symbol,
    quoteUsd,
    hasQuote: quoteUsd !== null
  };
}

function toIsoFromEpochMilliseconds(epochMilliseconds: number): string | null {
  if (!Number.isFinite(epochMilliseconds) || epochMilliseconds <= 0) {
    return null;
  }

  return new Date(epochMilliseconds).toISOString();
}

export function normalizeMultiplier(
  raw: XStocksMultiplierRaw,
  symbol: string,
  network: XStocksNetwork
): XStocksMultiplier {
  const pendingActivationDateTime = toIsoFromEpochMilliseconds(raw.activationDateTime);
  const pendingMultiplier =
    raw.newMultiplier > 0 && pendingActivationDateTime
      ? {
          value: raw.newMultiplier,
          activationDateTime: pendingActivationDateTime,
          reason: raw.reason
        }
      : null;

  return {
    symbol,
    network,
    currentMultiplier: raw.currentMultiplier,
    pendingMultiplier
  };
}

export function normalizeMultiplierHistoryEntry(
  raw: XStocksMultiplierHistoryEntry,
  symbol: string,
  network: XStocksNetwork
): XStocksMultiplierHistoryEntry {
  return {
    ...raw,
    symbol,
    network,
    delta: raw.multiplier - raw.previousMultiplier
  };
}

export function normalizeMultiplierHistory(
  raw: XStocksMultiplierHistoryRaw,
  symbol: string,
  network: XStocksNetwork
): XStocksMultiplierHistoryPage {
  const nodes = [...raw.nodes]
    .map((entry) => ({
      id: entry.id,
      symbol,
      network,
      reason: entry.reason,
      multiplier: entry.multiplier,
      previousMultiplier: entry.previousMultiplier,
      delta: entry.multiplier - entry.previousMultiplier,
      activationDateTime: entry.activationDateTime
    }))
    .sort((left, right) => right.activationDateTime.localeCompare(left.activationDateTime));

  return {
    page: sortPageInfo(raw.page),
    nodes
  };
}

function normalizeProofHolding(raw: XStocksProofOfReservesHoldingRaw): XStocksProofOfReservesHolding {
  return {
    provider: raw.provider,
    quantity: raw.quantity,
    symbol: raw.symbol
  };
}

function safeRatio(numerator: string | null, denominator: string | null): number | null {
  if (!numerator || !denominator) {
    return null;
  }

  const left = Number(numerator);
  const right = Number(denominator);

  if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) {
    return null;
  }

  return left / right;
}

export function normalizeProofOfReserves(
  raw: XStocksProofOfReservesRaw | null | undefined,
  symbol: string
): XStocksProofOfReserves {
  const timestamp = raw?.timestamp ?? null;
  const sharesHeld = raw?.sharesHeld ?? null;
  const circulatingSupply = raw?.circulatingSupply ?? null;

  return {
    symbol,
    timestamp,
    sharesHeld,
    circulatingSupply,
    proofAvailable: Boolean(timestamp && sharesHeld && circulatingSupply),
    coverageRatio: safeRatio(sharesHeld, circulatingSupply),
    holdings: raw?.holdings.map(normalizeProofHolding) ?? []
  };
}

export function normalizeSystemStatus(
  raw: XStocksSystemStatusRaw | null | undefined,
  symbol: string,
  asset?: Pick<XStocksAsset, "isTradingHalted">
): XStocksSystemStatus {
  const isMarketTradingHalted = raw?.isMarketTradingHalted ?? asset?.isTradingHalted ?? false;
  const isAtomicTradingHalted = raw?.isAtomicTradingHalted ?? asset?.isTradingHalted ?? false;

  return {
    symbol,
    isMarketTradingHalted,
    isAtomicTradingHalted,
    canTradeMarket: !isMarketTradingHalted,
    canTradeAtomic: !isAtomicTradingHalted
  };
}
