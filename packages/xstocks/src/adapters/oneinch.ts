import type { XStocksFetch } from "../http.js"
import type {
  OneInchFusionQuoteRequest,
  OneInchFusionQuoteResponse,
} from "../types.js"

export const DEFAULT_ONEINCH_FUSION_API_BASE_URL = "https://api.1inch.dev/fusion"
export const DEFAULT_ONEINCH_FUSION_REQUEST_TIMEOUT_MS = 20_000
export const DEFAULT_ONEINCH_FUSION_NETWORK_ID = 1

export interface OneInchFusionApiClientConfig {
  readonly authKey: string
  readonly baseUrl?: string
  readonly networkId?: number
  readonly fetch?: XStocksFetch
  readonly headers?: HeadersInit
  readonly requestTimeoutMs?: number
}

export interface OneInchFusionApiClient {
  readonly baseUrl: string
  readonly networkId: number
  requestQuote(
    input: OneInchFusionQuoteRequest,
  ): Promise<OneInchFusionQuoteResponse>
}

function resolveFetch(fetchImpl?: XStocksFetch): XStocksFetch {
  if (fetchImpl) {
    return fetchImpl
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation was provided for the 1inch Fusion API.")
  }

  return fetch
}

async function readResponseBody(response: Response): Promise<string> {
  return await response.text()
}

function assertQuoteShape(
  input: OneInchFusionQuoteRequest,
): asserts input is OneInchFusionQuoteRequest {
  if (!input.fromTokenAddress || !input.toTokenAddress || !input.amount) {
    throw new Error(
      "1inch Fusion quote requests require fromTokenAddress, toTokenAddress, and amount.",
    )
  }
}

function buildQuoteUrl(
  baseUrl: string,
  networkId: number,
  input: OneInchFusionQuoteRequest,
): string {
  const url = new URL(
    `quoter/v2.0/${networkId}/quote/receive`,
    `${baseUrl.replace(/\/+$/u, "")}/`,
  )

  url.searchParams.set("fromTokenAddress", input.fromTokenAddress)
  url.searchParams.set("toTokenAddress", input.toTokenAddress)
  url.searchParams.set("amount", input.amount)
  url.searchParams.set(
    "walletAddress",
    input.walletAddress ?? "0x0000000000000000000000000000000000000000",
  )

  if (input.enableEstimate !== undefined) {
    url.searchParams.set("enableEstimate", String(input.enableEstimate))
  }

  if (input.source) {
    url.searchParams.set("source", input.source)
  }

  if (input.permit) {
    url.searchParams.set("permit", input.permit)
  }

  if (input.isPermit2 !== undefined) {
    url.searchParams.set("isPermit2", String(input.isPermit2))
  }

  if (input.slippage !== undefined) {
    url.searchParams.set("slippage", String(input.slippage))
  }

  return url.toString()
}

export function createOneInchFusionApiClient(
  config: OneInchFusionApiClientConfig,
): OneInchFusionApiClient {
  if (!config.authKey || config.authKey.trim().length === 0) {
    throw new Error("A 1inch API key is required for Fusion quote requests.")
  }

  const fetchImpl = resolveFetch(config.fetch)
  const baseUrl = config.baseUrl ?? DEFAULT_ONEINCH_FUSION_API_BASE_URL
  const networkId = config.networkId ?? DEFAULT_ONEINCH_FUSION_NETWORK_ID
  const baseHeaders = config.headers
  const requestTimeoutMs =
    config.requestTimeoutMs ?? DEFAULT_ONEINCH_FUSION_REQUEST_TIMEOUT_MS

  return {
    baseUrl,
    networkId,
    async requestQuote(input) {
      assertQuoteShape(input)
      const controller = new AbortController()
      const timeoutId =
        requestTimeoutMs > 0
          ? setTimeout(() => controller.abort(), requestTimeoutMs)
          : null

      try {
        const response = await fetchImpl(
          buildQuoteUrl(baseUrl, networkId, input),
          {
            method: "GET",
            signal: controller.signal,
            headers: {
              accept: "application/json",
              authorization: `Bearer ${config.authKey}`,
              ...baseHeaders,
            },
          },
        )

        if (!response.ok) {
          throw new Error(
            `1inch Fusion quote request failed with status ${response.status}: ${await readResponseBody(response)}`,
          )
        }

        return (await response.json()) as OneInchFusionQuoteResponse
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error(
            `1inch Fusion request timed out after ${requestTimeoutMs}ms for /quoter/v2.0/${networkId}/quote/receive`,
          )
        }

        throw error
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }
      }
    },
  }
}
