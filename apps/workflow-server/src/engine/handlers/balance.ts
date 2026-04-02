import type { HandlerResult } from "./_base.js";
import { getAddressBalance, getChainInfo, getPublicClient } from "../wallet.js";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

// Fallback public RPCs for chains that aren't the configured wallet chain
const fallbackRpcs: Record<string, { rpc: string; chain: any }> = {
  ethereum: { rpc: "https://ethereum-rpc.publicnode.com", chain: mainnet },
  polygon: { rpc: "https://polygon-bor-rpc.publicnode.com", chain: mainnet },
  arbitrum: { rpc: "https://arbitrum-one-rpc.publicnode.com", chain: mainnet },
};

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const address = String(config.address ?? "");
  const token = String(config.token ?? "ETH");
  const threshold = Number(config.threshold ?? 0);
  const chain = String(config.chain ?? "");

  if (!address) {
    return { output: { error: "No address provided", triggered: false } };
  }

  try {
    let balance: number;
    const walletChain = getChainInfo();

    // If a specific chain is requested and it doesn't match wallet chain, use a fallback RPC
    if (chain && fallbackRpcs[chain]) {
      const fb = fallbackRpcs[chain];
      const client = createPublicClient({ chain: fb.chain, transport: http(fb.rpc) });
      const balanceWei = await client.getBalance({ address: address as `0x${string}` });
      balance = Number(formatEther(balanceWei));
    } else {
      // Use the configured wallet chain's public client
      const result = await getAddressBalance(address);
      balance = Number(result.balance);
    }

    const triggered = balance >= threshold;

    return {
      output: {
        address,
        balance: Math.round(balance * 1e6) / 1e6,
        token,
        threshold,
        triggered,
        chain: chain || walletChain.name,
      },
    };
  } catch (err) {
    return { output: { address, error: String(err), triggered: false } };
  }
}
