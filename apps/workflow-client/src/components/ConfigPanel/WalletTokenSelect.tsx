import { useState, useRef, useEffect } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits, erc20Abi } from "viem";

// Well-known ERC-20 tokens on Ethereum mainnet
const KNOWN_TOKENS: { symbol: string; name: string; address: `0x${string}`; decimals: number; logo?: string }[] = [
  { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
  { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
  { symbol: "AAVE", name: "Aave", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18 },
  { symbol: "stETH", name: "Lido Staked Ether", address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", decimals: 18 },
];

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  rawBalance: bigint;
  decimals: number;
  address: `0x${string}` | "native";
}

interface Props {
  value: string;
  displayName: string;
  onSelect: (token: { symbol: string; name: string } | null) => void;
}

export function WalletTokenSelect({ value, displayName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();

  // Fetch native ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({ address });

  // Batch-fetch all ERC-20 balances in one multicall
  const { data: erc20Results, isLoading: erc20Loading } = useReadContracts({
    contracts: address
      ? KNOWN_TOKENS.map((t) => ({
          address: t.address,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address] as const,
        }))
      : [],
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Build token list with balances
  const tokens: TokenBalance[] = [];

  // ETH first
  if (ethBalance) {
    tokens.push({
      symbol: "ETH",
      name: "Ether",
      balance: Number(ethBalance.formatted).toFixed(6),
      rawBalance: ethBalance.value,
      decimals: 18,
      address: "native",
    });
  }

  // ERC-20s
  if (erc20Results) {
    for (let i = 0; i < KNOWN_TOKENS.length; i++) {
      const result = erc20Results[i];
      if (result?.status === "success" && result.result != null) {
        const raw = result.result as bigint;
        if (raw > 0n) {
          const t = KNOWN_TOKENS[i];
          tokens.push({
            symbol: t.symbol,
            name: t.name,
            balance: Number(formatUnits(raw, t.decimals)).toFixed(6),
            rawBalance: raw,
            decimals: t.decimals,
            address: t.address,
          });
        }
      }
    }
  }

  const selected = value && displayName;

  if (!isConnected || !address) {
    return (
      <div className="px-3 py-2 bg-surface-2 border border-border-default rounded-lg text-xs text-gray-500">
        Connect your wallet in the toolbar to select tokens
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border-default rounded-lg">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-medium text-accent">{value}</span>
            <span className="text-xs text-gray-400 truncate">{displayName}</span>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-gray-500 hover:text-white text-xs flex-shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-left px-3 py-1.5 bg-surface-2 border border-border-default rounded-lg text-sm text-gray-400 hover:border-accent transition-colors"
        >
          Select a token...
        </button>
      )}

      {open && !selected && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto bg-surface-1 border border-border-default rounded-lg shadow-xl">
          {tokens.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-500 text-center">
              {ethLoading || erc20Loading ? "Loading balances..." : "No tokens found in wallet"}
            </div>
          ) : (
            tokens.map((t) => (
              <button
                key={t.symbol}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect({ symbol: t.symbol, name: t.name });
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors border-b border-border-subtle last:border-b-0 flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-bold text-gray-300 flex-shrink-0">
                  {t.symbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white">{t.symbol}</span>
                    <span className="text-[10px] text-gray-500">{t.name}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">{t.balance}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
