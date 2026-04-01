import { XSTOCKS_PUBLIC_PATHS } from "../constants.js";
import type { XStocksPublicClient } from "../http.js";
import { normalizeProofOfReserves } from "../normalize.js";
import type { XStocksProofOfReserves, XStocksProofOfReservesRaw } from "../types.js";

export async function getXStocksProofOfReserves(
  client: XStocksPublicClient,
  symbol: string
): Promise<XStocksProofOfReserves> {
  const response = await client.get<XStocksProofOfReservesRaw | null>(XSTOCKS_PUBLIC_PATHS.proofOfReserves(symbol));
  return normalizeProofOfReserves(response, symbol);
}
