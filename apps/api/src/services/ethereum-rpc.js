const DEFAULT_ETHEREUM_RPC_URL = "https://ethereum-rpc.publicnode.com";

function resolveFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for Ethereum RPC.");
  }

  return fetch;
}

function parseHexInteger(value) {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    return null;
  }

  return Number.parseInt(value.slice(2), 16);
}

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{40})$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

export function createEthereumRpcClient({
  rpcUrl = process.env.ETHEREUM_RPC_URL ?? DEFAULT_ETHEREUM_RPC_URL,
  fetchImpl,
}) {
  const fetchFn = resolveFetch(fetchImpl);

  return {
    rpcUrl,
    async getTransactionReceipt(txHash) {
      const response = await fetchFn(rpcUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ethereum RPC request failed with status ${response.status}.`,
        );
      }

      const payload = await response.json();

      if (payload.error) {
        throw new Error(
          payload.error.message ?? "Ethereum RPC returned an unknown error.",
        );
      }

      if (!payload.result) {
        return null;
      }

      const result = payload.result;
      return {
        rawReceipt: result,
        blockNumber: parseHexInteger(result.blockNumber),
        transactionIndex: parseHexInteger(result.transactionIndex),
        status:
          result.status === "0x1"
            ? "confirmed"
            : result.status === "0x0"
              ? "reverted"
              : "pending",
      };
    },

    async getErc20Decimals(tokenAddress) {
      const normalizedTokenAddress = normalizeEthereumAddress(tokenAddress);

      if (!normalizedTokenAddress) {
        return null;
      }

      const response = await fetchFn(rpcUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: normalizedTokenAddress,
              data: "0x313ce567",
            },
            "latest",
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ethereum RPC decimals request failed with status ${response.status}.`,
        );
      }

      const payload = await response.json();

      if (payload.error) {
        throw new Error(
          payload.error.message ??
            "Ethereum RPC returned an unknown decimals error.",
        );
      }

      return parseHexInteger(payload.result);
    },
  };
}
