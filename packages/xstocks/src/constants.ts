export const XSTOCKS_API_BASE_URL = "https://api.xstocks.fi/api/v2";
export const BACKED_API_BASE_URL = "https://api.backed.fi/api/v1";
export const XSTOCKS_DEFAULT_NETWORK = "Ethereum";
export const XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE = 0;
export const XSTOCKS_DEFAULT_MULTIPLIER_HISTORY_PAGE_SIZE = 5;

export const XSTOCKS_PUBLIC_PATHS = {
  assets: "/public/assets",
  asset: (symbol: string) => `/public/assets/${encodeURIComponent(symbol)}`,
  priceData: (symbol: string) => `/public/assets/${encodeURIComponent(symbol)}/price-data`,
  multiplier: (symbol: string) => `/public/assets/${encodeURIComponent(symbol)}/multiplier`,
  multiplierHistory: (symbol: string) => `/public/assets/${encodeURIComponent(symbol)}/multiplier/history`,
  proofOfReserves: (symbol: string) => `/public/proof-of-reserves/${encodeURIComponent(symbol)}`,
  systemStatus: (symbol: string) => `/public/system/status/${encodeURIComponent(symbol)}`
} as const;

export const BACKED_PUBLIC_PATHS = {
  assetQuote: (symbol: string) => `/quotes/assets/${encodeURIComponent(symbol)}`
} as const;
