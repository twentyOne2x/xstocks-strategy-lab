import type { HandlerResult } from "./_base.js";

const publicRpcs: Record<string, string> = {
  ethereum: "https://ethereum-rpc.publicnode.com",
  polygon: "https://polygon-bor-rpc.publicnode.com",
  arbitrum: "https://arbitrum-one-rpc.publicnode.com",
};

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const chain = String(config.chain ?? "ethereum");
  const rpcUrl = publicRpcs[chain];

  if (!rpcUrl) {
    return { output: { chain, error: `Unknown chain: ${chain}` } };
  }

  try {
    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    });
    const data = await resp.json();
    const payload = typeof data === "object" && data !== null ? (data as { result?: unknown }) : null;
    const result = typeof payload?.result === "string" ? payload.result : null;
    const blockNumber = result ? parseInt(result, 16) : Number.NaN;

    if (!Number.isFinite(blockNumber)) {
      return { output: { chain, error: "Invalid blockNumber response" } };
    }

    return {
      output: { chain, blockNumber, timestamp: new Date().toISOString() },
    };
  } catch (err) {
    return { output: { chain, error: String(err) } };
  }
}
