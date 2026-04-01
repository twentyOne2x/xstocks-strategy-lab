import type { XStocksFetch } from "../http.js"
import type {
  CowSwapOrderDraft,
  CowSwapOrderStatus,
  CowSwapOrderSubmission,
  CowSwapQuoteRequest,
  CowSwapQuoteResponse,
} from "../types.js"

export const DEFAULT_COW_SWAP_API_BASE_URL =
  "https://api.cow.fi/mainnet/api/v1"

export interface CowSwapApiClientConfig {
  readonly baseUrl?: string
  readonly fetch?: XStocksFetch
  readonly headers?: HeadersInit
}

export interface CowSwapApiClient {
  readonly baseUrl: string
  requestQuote(input: CowSwapQuoteRequest): Promise<CowSwapQuoteResponse>
  prepareOrderDraft(quote: CowSwapQuoteResponse): CowSwapOrderDraft
  submitOrder(input: CowSwapOrderSubmission): Promise<string>
  getOrder(uid: string): Promise<CowSwapOrderStatus | null>
}

function resolveFetch(fetchImpl?: XStocksFetch): XStocksFetch {
  if (fetchImpl) {
    return fetchImpl
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation was provided for the CoW API.")
  }

  return fetch
}

async function readResponseBody(response: Response): Promise<string> {
  return await response.text()
}

function assertQuoteShape(
  input: CowSwapQuoteRequest,
): asserts input is CowSwapQuoteRequest {
  if (!input.sellToken || !input.buyToken || !input.owner) {
    throw new Error("CoW quote requests require sellToken, buyToken, and owner.")
  }

  if (!input.sellAmountBeforeFee && !input.buyAmountAfterFee) {
    throw new Error(
      "CoW quote requests require sellAmountBeforeFee or buyAmountAfterFee.",
    )
  }
}

function assertUid(uid: string): string {
  const normalized = String(uid ?? "").trim()

  if (!/^0x[a-fA-F0-9]{112}$/u.test(normalized)) {
    throw new Error(
      "CoW order uid must be a 0x-prefixed 56-byte hex string.",
    )
  }

  return normalized
}

function normalizeOrderStatus(
  uid: string,
  payload: Record<string, unknown>,
): CowSwapOrderStatus {
  return {
    uid,
    status:
      typeof payload.status === "string"
        ? payload.status
        : typeof payload.executionStatus === "string"
          ? payload.executionStatus
          : typeof payload.orderStatus === "string"
            ? payload.orderStatus
            : "submitted",
    settlementTxHash:
      typeof payload.settlementTxHash === "string"
        ? payload.settlementTxHash
        : typeof payload.txHash === "string"
          ? payload.txHash
          : null,
    raw: payload,
  }
}

export function createCowSwapApiClient(
  config: CowSwapApiClientConfig = {},
): CowSwapApiClient {
  const fetchImpl = resolveFetch(config.fetch)
  const baseUrl = config.baseUrl ?? DEFAULT_COW_SWAP_API_BASE_URL
  const baseHeaders = config.headers

  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    return await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...baseHeaders,
        ...(init.headers ?? {}),
      },
    })
  }

  return {
    baseUrl,
    async requestQuote(input) {
      assertQuoteShape(input)
      const response = await request("/quote", {
        method: "POST",
        body: JSON.stringify({
          sellToken: input.sellToken,
          buyToken: input.buyToken,
          from: input.owner,
          receiver: input.receiver ?? input.owner,
          kind: input.kind,
          ...(input.sellAmountBeforeFee
            ? { sellAmountBeforeFee: input.sellAmountBeforeFee }
            : {}),
          ...(input.buyAmountAfterFee
            ? { buyAmountAfterFee: input.buyAmountAfterFee }
            : {}),
          ...(input.appData ? { appData: input.appData } : {}),
          ...(input.partiallyFillable === undefined
            ? {}
            : { partiallyFillable: input.partiallyFillable }),
        }),
      })

      if (!response.ok) {
        throw new Error(
          `CoW quote request failed with status ${response.status}: ${await readResponseBody(response)}`,
        )
      }

      return (await response.json()) as CowSwapQuoteResponse
    },
    prepareOrderDraft(quote) {
      return {
        sellToken: quote.quote.sellToken,
        buyToken: quote.quote.buyToken,
        receiver: quote.quote.receiver,
        sellAmount: quote.quote.sellAmount,
        buyAmount: quote.quote.buyAmount,
        validTo: quote.quote.validTo,
        appData: quote.quote.appData,
        feeAmount: quote.quote.feeAmount,
        kind: quote.quote.kind,
        partiallyFillable: quote.quote.partiallyFillable,
        sellTokenBalance: quote.quote.sellTokenBalance,
        buyTokenBalance: quote.quote.buyTokenBalance,
        signingScheme: quote.quote.signingScheme,
        from: quote.from,
      }
    },
    async submitOrder(input) {
      const response = await request("/orders", {
        method: "POST",
        body: JSON.stringify(input),
      })

      const body = await readResponseBody(response)

      if (!response.ok) {
        throw new Error(
          `CoW order submission failed with status ${response.status}: ${body}`,
        )
      }

      return body.trim().replace(/^"|"$/gu, "")
    },
    async getOrder(uid) {
      const normalizedUid = assertUid(uid)
      const response = await request(`/orders/${normalizedUid}`, {
        method: "GET",
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(
          `CoW order lookup failed with status ${response.status}: ${await readResponseBody(response)}`,
        )
      }

      return normalizeOrderStatus(
        normalizedUid,
        (await response.json()) as Record<string, unknown>,
      )
    },
  }
}
