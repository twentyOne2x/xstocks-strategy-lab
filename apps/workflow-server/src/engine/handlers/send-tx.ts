import type { HandlerResult } from "./_base.js";
import { isDryRun, sendTransaction, getChainInfo } from "../wallet.js";

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const to = String(config.to ?? "");
  const value = String(config.value ?? "0");
  const data = config.data ? String(config.data) : undefined;

  if (!to) {
    return { output: { error: "No recipient address provided", status: "failed" } };
  }

  if (isDryRun()) {
    const chain = getChainInfo();
    return {
      output: {
        to,
        value,
        data: data ?? null,
        txHash: null,
        blockNumber: null,
        status: "dry-run",
        dryRun: true,
        chain: chain.name,
        note: "Transaction not sent — dry-run mode. Set NETWORK_MODE=testnet and WALLET_PRIVATE_KEY to send real transactions.",
      },
    };
  }

  try {
    const { hash, receipt } = await sendTransaction({ to, value, data });
    return {
      output: {
        to,
        value,
        data: data ?? null,
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
        status: receipt.status === "success" ? "confirmed" : "reverted",
        dryRun: false,
        chain: getChainInfo().name,
      },
    };
  } catch (err) {
    return {
      output: {
        to,
        value,
        error: String(err),
        status: "failed",
        dryRun: false,
        chain: getChainInfo().name,
      },
    };
  }
}
