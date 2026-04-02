import { Router } from "express";
import {
  getWalletAddress,
  getWalletBalance,
  getChainInfo,
  isDryRun,
  getNetworkMode,
} from "../engine/wallet.js";

export const walletRouter = Router();

// GET /api/wallet — server wallet status
walletRouter.get("/", async (_req, res) => {
  try {
    const address = getWalletAddress();
    const chainInfo = getChainInfo();
    const dryRun = isDryRun();

    if (!address) {
      res.json({
        configured: false,
        address: null,
        balance: null,
        chain: chainInfo,
        networkMode: getNetworkMode(),
        dryRun,
        note: "No wallet configured. Set WALLET_PRIVATE_KEY env var.",
      });
      return;
    }

    const balanceInfo = await getWalletBalance();
    res.json({
      configured: true,
      address,
      balance: balanceInfo?.balance ?? "0",
      chain: chainInfo,
      networkMode: getNetworkMode(),
      dryRun,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
