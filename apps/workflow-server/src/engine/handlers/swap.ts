import type { HandlerResult } from "./_base.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchUsdPrice } from "../priceCache.js";
import { isDryRun, writeContract, getChainInfo } from "../wallet.js";
import { parseUnits } from "viem";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface XStock {
  symbol: string;
  underlyingSymbol: string;
  name: string;
  deployment: string;
}

let tokens: XStock[] = [];
try {
  const tokensPath = join(__dirname, "../../../data/xStocks.json");
  tokens = JSON.parse(readFileSync(tokensPath, "utf-8"));
} catch {}

// Uniswap V3 SwapRouter02 on Base Sepolia
const SWAP_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
const WETH_BASE_SEPOLIA = "0x4200000000000000000000000000000000000006";

// Minimal Uniswap SwapRouter02 ABI for exactInputSingle
const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export async function execute(
  config: Record<string, unknown>,
  _inputs: Record<string, unknown>
): Promise<HandlerResult> {
  const fromSymbol = String(config.fromToken ?? "");
  const toSymbol = String(config.toToken ?? "");
  const amount = Number(config.amount ?? 0);
  const slippage = Number(config.slippage ?? 0.5);

  if (!fromSymbol || !toSymbol) {
    return { output: { error: "Both fromToken and toToken are required", status: "failed" } };
  }
  if (fromSymbol.toUpperCase() === toSymbol.toUpperCase()) {
    return { output: { error: "Cannot swap a token for itself", status: "failed" } };
  }
  if (amount <= 0) {
    return { output: { error: "Amount must be greater than 0", status: "failed" } };
  }

  // Fetch USD prices for quote calculation
  const [fromPrice, toPrice] = await Promise.all([
    fetchUsdPrice(fromSymbol),
    fetchUsdPrice(toSymbol),
  ]);

  const fromToken = tokens.find((t) => t.symbol === fromSymbol);
  const toToken = tokens.find((t) => t.symbol === toSymbol);

  if (fromPrice === null || toPrice === null) {
    return {
      output: {
        fromToken: fromSymbol, toToken: toSymbol, amountIn: amount,
        amountOut: null, fromPrice, toPrice,
        error: `Could not fetch price for ${fromPrice === null ? fromSymbol : toSymbol}`,
        status: "quote-failed", dryRun: true,
      },
    };
  }

  const rawAmountOut = (amount * fromPrice) / toPrice;
  const amountOut = rawAmountOut * (1 - slippage / 100);

  const quoteOutput = {
    fromToken: fromSymbol, toToken: toSymbol,
    fromAddress: fromToken?.deployment ?? null,
    toAddress: toToken?.deployment ?? null,
    amountIn: amount,
    amountOut: Math.round(amountOut * 1e6) / 1e6,
    fromPrice, toPrice, slippage,
    exchangeRate: Math.round((fromPrice / toPrice) * 1e6) / 1e6,
  };

  // Dry-run: return quote only
  if (isDryRun()) {
    return {
      output: {
        ...quoteOutput,
        status: "quoted", dryRun: true, txHash: null,
        chain: getChainInfo().name,
      },
    };
  }

  // Live swap via Uniswap V3 on Base Sepolia
  // For testnet we need token contract addresses. If we have deployment addresses, use those.
  // Otherwise fall back to WETH as a placeholder.
  const tokenInAddress = fromToken?.deployment ?? WETH_BASE_SEPOLIA;
  const tokenOutAddress = toToken?.deployment ?? WETH_BASE_SEPOLIA;

  if (tokenInAddress === tokenOutAddress) {
    return {
      output: {
        ...quoteOutput,
        status: "quoted", dryRun: true, txHash: null,
        chain: getChainInfo().name,
        note: "No on-chain token addresses available for these tokens. Returning quote only.",
      },
    };
  }

  try {
    const amountInWei = parseUnits(String(amount), 18);
    const minAmountOut = parseUnits(String(Math.floor(amountOut * 1e6) / 1e6), 18);

    const { hash, receipt } = await writeContract({
      address: SWAP_ROUTER,
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: tokenInAddress as `0x${string}`,
          tokenOut: tokenOutAddress as `0x${string}`,
          fee: 3000, // 0.3% pool
          recipient: "0x0000000000000000000000000000000000000000", // will be replaced by wallet address
          amountIn: amountInWei,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      value: tokenInAddress === WETH_BASE_SEPOLIA ? amountInWei : undefined,
    });

    return {
      output: {
        ...quoteOutput,
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
        status: receipt.status === "success" ? "swapped" : "reverted",
        dryRun: false,
        chain: getChainInfo().name,
      },
    };
  } catch (err) {
    return {
      output: {
        ...quoteOutput,
        txHash: null,
        error: String(err),
        status: "swap-failed",
        dryRun: false,
        chain: getChainInfo().name,
      },
    };
  }
}
