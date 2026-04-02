const DEFAULT_LIFI_API_BASE_URL = "https://li.quest/v1";
const DEFAULT_LIFI_REQUEST_TIMEOUT_MS = 10_000;

function resolveFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for LI.FI.");
  }

  return fetch;
}

async function readResponseBody(response) {
  return await response.text();
}

export function createLifiExecutionClient({
  apiKey,
  baseUrl = DEFAULT_LIFI_API_BASE_URL,
  requestTimeoutMs = DEFAULT_LIFI_REQUEST_TIMEOUT_MS,
  fetchImpl,
}) {
  const fetchFn = resolveFetch(fetchImpl);
  const normalizedBaseUrl = baseUrl.replace(/\/+$/u, "");

  async function requestJson(url, errorLabel) {
    const controller = new AbortController();
    const timeoutId =
      requestTimeoutMs > 0
        ? setTimeout(() => controller.abort(), requestTimeoutMs)
        : null;

    try {
      const response = await fetchFn(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          ...(apiKey ? { "x-lifi-api-key": apiKey } : {}),
        },
      });
      const rawBody = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          `${errorLabel} failed with status ${response.status}: ${rawBody}`,
        );
      }

      return rawBody.trim().length > 0 ? JSON.parse(rawBody) : {};
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`LI.FI request timed out after ${requestTimeoutMs}ms.`);
      }

      throw error;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  return {
    baseUrl: normalizedBaseUrl,
    async requestQuote({
      fromChainId = 1,
      toChainId = 1,
      fromTokenAddress,
      toTokenAddress,
      fromAmount,
      fromAddress,
      toAddress,
      slippage = 0.003,
      integrator = "24-7",
    }) {
      if (
        !fromTokenAddress ||
        !toTokenAddress ||
        !fromAmount ||
        !fromAddress ||
        !toAddress
      ) {
        throw new Error(
          "LI.FI quote requests require fromTokenAddress, toTokenAddress, fromAmount, fromAddress, and toAddress.",
        );
      }

      const url = new URL(`${normalizedBaseUrl}/quote`);
      url.searchParams.set("fromChain", String(fromChainId));
      url.searchParams.set("toChain", String(toChainId));
      url.searchParams.set("fromToken", fromTokenAddress);
      url.searchParams.set("toToken", toTokenAddress);
      url.searchParams.set("fromAmount", String(fromAmount));
      url.searchParams.set("fromAddress", fromAddress);
      url.searchParams.set("toAddress", toAddress);
      url.searchParams.set("slippage", String(slippage));

      if (integrator) {
        url.searchParams.set("integrator", integrator);
      }

      return await requestJson(
        url.toString(),
        "LI.FI quote request",
      );
    },
  };
}
