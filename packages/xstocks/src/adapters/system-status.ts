import { XSTOCKS_PUBLIC_PATHS } from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { normalizeSystemStatus } from "../normalize.js";
import type { XStocksAsset, XStocksSystemStatus, XStocksSystemStatusRaw } from "../types.js";

export async function getXStocksSystemStatus(
  client: XStocksPublicClient,
  symbol: string,
  asset?: Pick<XStocksAsset, "isTradingHalted">
): Promise<XStocksSystemStatus> {
  const response = await client.get<XStocksSystemStatusRaw>(XSTOCKS_PUBLIC_PATHS.systemStatus(symbol));
  return normalizeSystemStatus(response, symbol, asset);
}
