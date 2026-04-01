import { XSTOCKS_API_BASE_URL } from "../constants.js";
import {
  XStocksApiError,
  buildXStocksUrl,
  type XStocksFetch,
} from "../http.js";
import type {
  XStocksRegisteredWalletList,
  XStocksTradePage,
  XStocksXChangeQuote,
  XStocksXChangeQuoteRequest,
} from "../types.js";

export interface XStocksClientApiClientConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetch?: XStocksFetch;
  readonly headers?: HeadersInit;
}

export interface ListXStocksTradesParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly outTxHash?: string;
  readonly inTxHash?: string;
  readonly includeTradeStatuses?: boolean;
}

export interface XStocksClientApiClient {
  readonly baseUrl: string;
  listRegisteredWallets(): Promise<XStocksRegisteredWalletList>;
  requestXChangeQuote(
    input: XStocksXChangeQuoteRequest,
  ): Promise<XStocksXChangeQuote>;
  getXChangeQuote(id: string): Promise<XStocksXChangeQuote>;
  listTrades(params?: ListXStocksTradesParams): Promise<XStocksTradePage>;
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

async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function createXStocksClientApiClient(
  config: XStocksClientApiClientConfig,
): XStocksClientApiClient {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error("An xStocks API key is required for authenticated client calls.");
  }

  const fetchImpl = resolveFetch(config.fetch);
  const baseUrl = config.baseUrl ?? XSTOCKS_API_BASE_URL;
  const baseHeaders = config.headers;

  async function request<T>(
    path: string,
    {
      method = "GET",
      query = {},
      body,
    }: {
      readonly method?: "GET" | "POST";
      readonly query?: Record<string, string | number | boolean | null | undefined>;
      readonly body?: unknown;
    } = {},
  ): Promise<T> {
    const url = buildXStocksUrl(path, query, baseUrl);
    const response = await fetchImpl(url, {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        ...baseHeaders,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      throw new XStocksApiError(response.status, url.toString(), await response.text());
    }

    return readJsonResponse<T>(response);
  }

  return {
    baseUrl,
    listRegisteredWallets() {
      return request<XStocksRegisteredWalletList>("/client/registered-wallets");
    },
    requestXChangeQuote(input) {
      return request<XStocksXChangeQuote>("/trades/xchange/rfq", {
        method: "POST",
        body: input,
      });
    },
    getXChangeQuote(id) {
      return request<XStocksXChangeQuote>(
        `/trades/xchange/quote/${encodeURIComponent(id)}`,
      );
    },
    listTrades(params = {}) {
      return request<XStocksTradePage>("/trades", {
        query: {
          ...(params.page === undefined ? {} : { page: params.page }),
          ...(params.pageSize === undefined ? {} : { pageSize: params.pageSize }),
          ...(params.fromDate === undefined ? {} : { fromDate: params.fromDate }),
          ...(params.toDate === undefined ? {} : { toDate: params.toDate }),
          ...(params.outTxHash === undefined ? {} : { outTxHash: params.outTxHash }),
          ...(params.inTxHash === undefined ? {} : { inTxHash: params.inTxHash }),
          ...(params.includeTradeStatuses === undefined
            ? {}
            : { includeTradeStatuses: params.includeTradeStatuses }),
        },
      });
    },
  };
}
