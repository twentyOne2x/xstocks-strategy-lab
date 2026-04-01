import {
  XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE,
  XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE_SIZE,
  XSTOCKS_PUBLIC_PATHS
} from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { normalizeMultiplier, normalizeMultiplierHistory } from "../normalize.js";
import type {
  XStocksMultiplier,
  XStocksMultiplierHistoryPage,
  XStocksMultiplierHistoryRaw,
  XStocksMultiplierRaw,
  XStocksNetwork
} from "../types.js";

export interface GetXStocksMultiplierHistoryParams {
  readonly network: XStocksNetwork;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getXStocksMultiplier(
  client: XStocksPublicClient,
  symbol: string,
  network: XStocksNetwork
): Promise<XStocksMultiplier> {
  const response = await client.get<XStocksMultiplierRaw>(XSTOCKS_PUBLIC_PATHS.multiplier(symbol), {
    network
  });

  return normalizeMultiplier(response, symbol, network);
}

export async function getXStocksMultiplierHistory(
  client: XStocksPublicClient,
  symbol: string,
  params: GetXStocksMultiplierHistoryParams
): Promise<XStocksMultiplierHistoryPage> {
  const response = await client.get<XStocksMultiplierHistoryRaw>(XSTOCKS_PUBLIC_PATHS.multiplierHistory(symbol), {
    network: params.network,
    page: params.page ?? XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE,
    pageSize: params.pageSize ?? XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE_SIZE
  });

  return normalizeMultiplierHistory(response, symbol, params.network);
}
