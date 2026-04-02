// Shared price cache to avoid CoinGecko rate limits across handlers
const cache = new Map<string, { price: number; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export function getCachedPrice(geckoId: string): number | null {
  const entry = cache.get(geckoId);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.price;
  return null;
}

export function setCachedPrice(geckoId: string, price: number) {
  cache.set(geckoId, { price, ts: Date.now() });
}

// Crypto symbol → CoinGecko ID
export const cryptoGeckoIds: Record<string, string> = {
  ETH: "ethereum", BTC: "bitcoin", USDC: "usd-coin", USDT: "tether",
  SOL: "solana", AVAX: "avalanche-2", MATIC: "matic-network",
  LINK: "chainlink", UNI: "uniswap", AAVE: "aave",
  DOT: "polkadot", ADA: "cardano", XRP: "ripple", DOGE: "dogecoin",
  DAI: "dai", WETH: "weth", WBTC: "wrapped-bitcoin",
};

// xStocks CoinGecko map (lazy-loaded once)
let xstockMap: Record<string, string> | null = null;
let fetching = false;

export async function getXStockMap(): Promise<Record<string, string>> {
  if (xstockMap) return xstockMap;
  if (fetching) {
    await new Promise((r) => setTimeout(r, 2000));
    return xstockMap ?? {};
  }
  fetching = true;
  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=xstocks-ecosystem&per_page=250"
    );
    if (!resp.ok) { fetching = false; return {}; }
    const coins = await resp.json() as Array<{ id: string; symbol: string; current_price: number | null }>;
    const map: Record<string, string> = {};
    for (const coin of coins) {
      map[coin.symbol.toUpperCase()] = coin.id;
      if (coin.current_price != null) setCachedPrice(coin.id, coin.current_price);
    }
    xstockMap = map;
    return map;
  } catch {
    fetching = false;
    return {};
  }
}

export async function resolveGeckoId(symbol: string): Promise<string | null> {
  const upper = symbol.toUpperCase();
  if (cryptoGeckoIds[upper]) return cryptoGeckoIds[upper];
  const xmap = await getXStockMap();
  if (xmap[upper]) return xmap[upper];
  if (xmap[upper + "X"]) return xmap[upper + "X"];
  return null;
}

export async function fetchUsdPrice(symbol: string): Promise<number | null> {
  const geckoId = await resolveGeckoId(symbol);
  if (!geckoId) return null;
  const cached = getCachedPrice(geckoId);
  if (cached !== null) return cached;
  try {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const price = data[geckoId]?.usd ?? null;
    if (price !== null) setCachedPrice(geckoId, price);
    return price;
  } catch {
    return null;
  }
}
