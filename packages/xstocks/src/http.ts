import { XSTOCKS_API_BASE_URL } from "./constants.js";

export interface XStocksRequestQuery {
  readonly [key: string]: string | number | boolean | null | undefined;
}

export type XStocksFetch = typeof fetch;

export interface XStocksPublicClientConfig {
  readonly baseUrl?: string;
  readonly fetch?: XStocksFetch;
  readonly headers?: HeadersInit;
}

export interface XStocksPublicClient {
  readonly baseUrl: string;
  get<T>(path: string, query?: XStocksRequestQuery): Promise<T>;
}

export class XStocksApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: string;

  constructor(status: number, url: string, body: string) {
    super(`xStocks API request failed with status ${status} for ${url}`);
    this.name = "XStocksApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

function resolveFetch(fetchImpl?: XStocksFetch): XStocksFetch {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation was provided for the xStocks client.");
  }

  return fetch;
}

export function buildXStocksUrl(
  path: string,
  query: XStocksRequestQuery = {},
  baseUrl = XSTOCKS_API_BASE_URL
): URL {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, base);
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null);

  entries.sort(([left], [right]) => left.localeCompare(right));

  for (const [key, value] of entries) {
    url.searchParams.set(key, String(value));
  }

  return url;
}

export function createXStocksPublicClient(config: XStocksPublicClientConfig = {}): XStocksPublicClient {
  const fetchImpl = resolveFetch(config.fetch);
  const baseUrl = config.baseUrl ?? XSTOCKS_API_BASE_URL;
  const baseHeaders = config.headers;

  return {
    baseUrl,
    async get<T>(path: string, query: XStocksRequestQuery = {}): Promise<T> {
      const url = buildXStocksUrl(path, query, baseUrl);
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          ...baseHeaders
        }
      });

      if (!response.ok) {
        throw new XStocksApiError(response.status, url.toString(), await response.text());
      }

      return (await response.json()) as T;
    }
  };
}
