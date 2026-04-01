import { XSTOCKS_PUBLIC_PATHS } from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { normalizeAsset, normalizeAssetPage } from "../normalize.js";
import type { XStocksAsset, XStocksAssetListRaw, XStocksAssetPage, XStocksAssetRaw, XStocksNetwork } from "../types.js";

export interface ListXStocksAssetsParams {
  readonly isTradingHalted?: boolean;
  readonly supportsAtomicSwaps?: boolean;
  readonly network?: XStocksNetwork;
  readonly stablecoin?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function listXStocksAssets(
  client: XStocksPublicClient,
  params: ListXStocksAssetsParams = {}
): Promise<XStocksAssetPage> {
  const query = {
    ...(params.isTradingHalted === undefined ? {} : { isTradingHalted: params.isTradingHalted }),
    ...(params.supportsAtomicSwaps === undefined ? {} : { supportsAtomicSwaps: params.supportsAtomicSwaps }),
    ...(params.network === undefined ? {} : { network: params.network }),
    ...(params.stablecoin === undefined ? {} : { stablecoin: params.stablecoin }),
    ...(params.page === undefined ? {} : { page: params.page }),
    ...(params.pageSize === undefined ? {} : { pageSize: params.pageSize })
  };
  const response = await client.get<XStocksAssetListRaw>(XSTOCKS_PUBLIC_PATHS.assets, query);
  return normalizeAssetPage(response);
}

export async function getXStocksAsset(client: XStocksPublicClient, symbol: string): Promise<XStocksAsset> {
  const response = await client.get<XStocksAssetRaw>(XSTOCKS_PUBLIC_PATHS.asset(symbol));
  return normalizeAsset(response);
}
