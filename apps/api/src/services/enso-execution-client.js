const DEFAULT_ENSO_API_BASE_URL = "https://api.enso.build/api/v1";
const DEFAULT_ENSO_REQUEST_TIMEOUT_MS = 10_000;

function resolveFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for Enso.");
  }

  return fetch;
}

async function readResponseBody(response) {
  return await response.text();
}

export function createEnsoExecutionClient({
  apiKey,
  baseUrl = DEFAULT_ENSO_API_BASE_URL,
  requestTimeoutMs = DEFAULT_ENSO_REQUEST_TIMEOUT_MS,
  fetchImpl,
}) {
  if (!apiKey) {
    throw new Error("Enso client requires an API key.");
  }

  const fetchFn = resolveFetch(fetchImpl);
  const normalizedBaseUrl = baseUrl.replace(/\/+$/u, "");

  async function requestJson(url, init, errorLabel) {
    const controller = new AbortController();
    const timeoutId =
      requestTimeoutMs > 0
        ? setTimeout(() => controller.abort(), requestTimeoutMs)
        : null;

    try {
      const response = await fetchFn(url, {
        ...init,
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          ...(init.headers ?? {}),
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
        throw new Error(`Enso request timed out after ${requestTimeoutMs}ms.`);
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
    async requestBundle({
      actions,
      chainId = 1,
      fromAddress,
      receiver = fromAddress,
      routingStrategy = "router",
      spender = fromAddress,
      referralCode = "24-7",
    }) {
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new Error("Enso bundle requests require at least one action.");
      }

      if (!fromAddress) {
        throw new Error("Enso bundle requests require fromAddress.");
      }

      const url = new URL(`${normalizedBaseUrl}/shortcuts/bundle`);
      url.searchParams.set("chainId", String(chainId));
      url.searchParams.set("fromAddress", fromAddress);
      url.searchParams.set("routingStrategy", routingStrategy);

      if (receiver) {
        url.searchParams.set("receiver", receiver);
      }

      if (spender) {
        url.searchParams.set("spender", spender);
      }

      if (referralCode) {
        url.searchParams.set("referralCode", referralCode);
      }

      return await requestJson(
        url.toString(),
        {
          method: "POST",
          body: JSON.stringify(actions),
        },
        "Enso bundle request",
      );
    },

    async requestApproval({
      amount,
      chainId = 1,
      fromAddress,
      tokenAddress,
    }) {
      if (!amount || !fromAddress || !tokenAddress) {
        throw new Error(
          "Enso approval requests require amount, fromAddress, and tokenAddress.",
        );
      }

      const url = new URL(`${normalizedBaseUrl}/shortcuts/approve`);
      url.searchParams.set("amount", String(amount));
      url.searchParams.set("chainId", String(chainId));
      url.searchParams.set("fromAddress", fromAddress);
      url.searchParams.set("tokenAddress", tokenAddress);

      return await requestJson(
        url.toString(),
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        },
        "Enso approval request",
      );
    },
  };
}
