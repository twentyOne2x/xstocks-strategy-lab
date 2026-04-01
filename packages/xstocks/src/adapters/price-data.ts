import { XSTOCKS_PUBLIC_PATHS } from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { normalizePriceData } from "../normalize.js";
import type { XStocksPriceData, XStocksPriceDataRaw } from "../types.js";

export async function getXStocksPriceData(client: XStocksPublicClient, symbol: string): Promise<XStocksPriceData> {
  const response = await client.get<XStocksPriceDataRaw>(XSTOCKS_PUBLIC_PATHS.priceData(symbol));
  return normalizePriceData(response, symbol);
}
