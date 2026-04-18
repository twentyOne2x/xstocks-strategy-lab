import {
  type Address,
  FusionSDK,
  type HttpProviderConnector,
  type PresetEnum,
  type QuoteParams,
  NetworkEnum,
} from "@1inch/fusion-sdk"

import type { XStocksFetch } from "../http.js"
import type {
  OneInchFusionOrderStatus,
  OneInchFusionOrderSubmission,
  OneInchFusionOrderSubmissionResult,
  OneInchFusionPrepareOrderRequest,
  OneInchFusionPreparedOrder,
  OneInchFusionQuoteRequest,
  OneInchFusionQuoteResponse,
} from "../types.js"

export const DEFAULT_ONEINCH_FUSION_API_BASE_URL = "https://api.1inch.com/fusion"
export const DEFAULT_ONEINCH_FUSION_REQUEST_TIMEOUT_MS = 20_000
export const DEFAULT_ONEINCH_FUSION_NETWORK_ID = NetworkEnum.ETHEREUM

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
  prepareOrder(
    input: OneInchFusionPrepareOrderRequest,
  ): Promise<OneInchFusionPreparedOrder>
  submitOrder(
    input: OneInchFusionOrderSubmission,
  ): Promise<OneInchFusionOrderSubmissionResult>
  getOrderStatus(orderHash: string): Promise<OneInchFusionOrderStatus | null>
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

function normalizeJsonValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      normalizeJsonValue(nestedValue),
    ]),
  )
}

function toJsonRecord(value: unknown): Record<string, unknown> {
  const normalized = normalizeJsonValue(value)

  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) {
    throw new Error("1inch Fusion returned a non-object payload where an object was required.")
  }

  return normalized as Record<string, unknown>
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

function assertPrepareOrderShape(
  input: OneInchFusionPrepareOrderRequest,
): asserts input is OneInchFusionPrepareOrderRequest {
  assertQuoteShape(input)

  if (!input.walletAddress) {
    throw new Error("1inch Fusion order preparation requires walletAddress.")
  }
}

function normalizeOrderHash(value: string): string {
  const normalized = String(value ?? "").trim()

  if (!/^0x[a-fA-F0-9]{64}$/u.test(normalized)) {
    throw new Error("1inch Fusion order hash must be a 0x-prefixed 32-byte hex string.")
  }

  return normalized.toLowerCase()
}

async function readResponseBody(response: Response): Promise<string> {
  return await response.text()
}

function createRequestExecutor({
  fetchImpl,
  authKey,
  baseHeaders,
  requestTimeoutMs,
}: {
  readonly fetchImpl: XStocksFetch
  readonly authKey: string
  readonly baseHeaders?: HeadersInit | undefined
  readonly requestTimeoutMs: number
}) {
  return async function requestJson<T>(
    url: string,
    init: RequestInit,
    errorLabel: string,
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId =
      requestTimeoutMs > 0
        ? setTimeout(() => controller.abort(), requestTimeoutMs)
        : null

    try {
      const response = await fetchImpl(url, {
        ...init,
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${authKey}`,
          ...(init.body === undefined ? {} : { "content-type": "application/json" }),
          ...baseHeaders,
          ...(init.headers ?? {}),
        },
      })

      if (response.status === 404) {
        return null as T
      }

      const rawBody = await readResponseBody(response)

      if (!response.ok) {
        throw new Error(
          `${errorLabel} failed with status ${response.status}: ${rawBody}`,
        )
      }

      if (rawBody.trim().length === 0) {
        return {} as T
      }

      return JSON.parse(rawBody) as T
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(
          `1inch Fusion request timed out after ${requestTimeoutMs}ms for ${url}`,
        )
      }

      throw error
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }
}

function createHttpProvider(
  requestJson: <T>(url: string, init: RequestInit, errorLabel: string) => Promise<T>,
): HttpProviderConnector {
  return {
    async get<T>(url: string) {
      return await requestJson<T>(
        url,
        {
          method: "GET",
        },
        "1inch Fusion quote request",
      )
    },
    async post<T>(url: string, data: unknown) {
      return await requestJson<T>(
        url,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        url.includes("/order/submit")
          ? "1inch Fusion order submission"
          : "1inch Fusion request",
      )
    },
  }
}

function toStoredQuoteResponse(
  input: OneInchFusionQuoteRequest,
  quote: Awaited<ReturnType<FusionSDK["getQuote"]>>,
): OneInchFusionQuoteResponse {
  if (!quote.quoteId) {
    throw new Error("1inch Fusion quote did not include a quoteId.")
  }

  return {
    quoteId: quote.quoteId,
    fromTokenAddress: input.fromTokenAddress,
    toTokenAddress: input.toTokenAddress,
    fromTokenAmount: quote.fromTokenAmount.toString(),
    toTokenAmount: quote.toTokenAmount,
    settlementAddress: String(quote.settlementAddress),
    recommendedPreset: String(quote.recommendedPreset),
    whitelist: quote.whitelist.map((value) => String(value)),
  }
}

function buildSubmitUrl(baseUrl: string, networkId: number): string {
  return `${baseUrl.replace(/\/+$/u, "")}/relayer/v2.0/${networkId}/order/submit`
}

function buildStatusUrl(
  baseUrl: string,
  networkId: number,
  orderHash: string,
): string {
  return `${baseUrl.replace(/\/+$/u, "")}/orders/v2.0/${networkId}/order/status/${orderHash}`
}

export function createOneInchFusionApiClient(
  config: OneInchFusionApiClientConfig,
): OneInchFusionApiClient {
  if (!config.authKey || config.authKey.trim().length === 0) {
    throw new Error("A 1inch API key is required for Fusion requests.")
  }

  const fetchImpl = resolveFetch(config.fetch)
  const baseUrl = config.baseUrl ?? DEFAULT_ONEINCH_FUSION_API_BASE_URL
  const networkId = config.networkId ?? DEFAULT_ONEINCH_FUSION_NETWORK_ID
  const requestTimeoutMs =
    config.requestTimeoutMs ?? DEFAULT_ONEINCH_FUSION_REQUEST_TIMEOUT_MS
  const requestJson = createRequestExecutor({
    fetchImpl,
    authKey: config.authKey,
    ...(config.headers ? { baseHeaders: config.headers } : {}),
    requestTimeoutMs,
  })
  const sdk = new FusionSDK({
    url: baseUrl,
    network: networkId as NetworkEnum,
    authKey: config.authKey,
    httpProvider: createHttpProvider(requestJson),
  })

  return {
    baseUrl,
    networkId,
    async requestQuote(input) {
      assertQuoteShape(input)
      const quote = await sdk.getQuote(input as QuoteParams)
      return toStoredQuoteResponse(input, quote)
    },
    async prepareOrder(input) {
      assertPrepareOrderShape(input)
      const quote = await sdk.getQuote(input as QuoteParams)
      const storedQuote = toStoredQuoteResponse(input, quote)
      const fusionOrderParams = {
        network: networkId as NetworkEnum,
        ...(input.preset || storedQuote.recommendedPreset
          ? {
              preset: (input.preset ?? storedQuote.recommendedPreset) as PresetEnum,
            }
          : {}),
        ...(input.receiver
          ? { receiver: input.receiver as unknown as Address }
          : {}),
      }
      const order = quote.createFusionOrder({
        ...fusionOrderParams,
      })
      const orderHash = normalizeOrderHash(order.getOrderHash(networkId))

      return {
        quote: storedQuote,
        quoteId: storedQuote.quoteId,
        orderHash,
        order: toJsonRecord(order.build()),
        extension: String(order.extension),
        typedData: toJsonRecord(order.getTypedData(networkId)),
        signerAddress: input.walletAddress.toLowerCase(),
        receiver: (input.receiver ?? input.walletAddress).toLowerCase(),
      }
    },
    async submitOrder(input) {
      const providedOrderHash =
        typeof input.orderHash === "string" ? normalizeOrderHash(input.orderHash) : null
      const response = await requestJson<Record<string, unknown>>(
        buildSubmitUrl(baseUrl, networkId),
        {
          method: "POST",
          body: JSON.stringify({
            order: input.order,
            signature: input.signature,
            quoteId: input.quoteId,
            extension: input.extension,
          }),
        },
        "1inch Fusion order submission",
      )

      return {
        orderHash:
          typeof response?.orderHash === "string"
            ? normalizeOrderHash(response.orderHash)
            : providedOrderHash ??
              (() => {
                throw new Error(
                  "1inch Fusion order submission did not return an orderHash.",
                )
              })(),
        raw: response ?? null,
      }
    },
    async getOrderStatus(orderHash) {
      const normalizedOrderHash = normalizeOrderHash(orderHash)
      const response = await requestJson<Record<string, unknown> | null>(
        buildStatusUrl(baseUrl, networkId, normalizedOrderHash),
        {
          method: "GET",
        },
        "1inch Fusion order status request",
      )

      if (!response) {
        return null
      }

      const fills = Array.isArray(response.fills)
        ? response.fills
            .filter((fill) => fill && typeof fill === "object")
            .map((fill) => ({
              txHash: String((fill as { txHash?: string }).txHash ?? ""),
              filledMakerAmount: String(
                (fill as { filledMakerAmount?: string }).filledMakerAmount ?? "",
              ),
              filledAuctionTakerAmount: String(
                (fill as { filledAuctionTakerAmount?: string })
                  .filledAuctionTakerAmount ?? "",
              ),
              takerFeeAmount: (() => {
                const takerFeeAmount = (fill as { takerFeeAmount?: string | null })
                  .takerFeeAmount
                return typeof takerFeeAmount === "string" ? takerFeeAmount : null
              })(),
            }))
        : []

      return {
        orderHash: normalizedOrderHash,
        status: String(response.status ?? "pending"),
        cancelTxHash:
          typeof response.cancelTx === "string" ? response.cancelTx : null,
        settlementTxHash:
          fills.find((fill) => /^0x[a-fA-F0-9]{64}$/u.test(fill.txHash))?.txHash ??
          null,
        fills,
        raw: response,
      }
    },
  }
}
