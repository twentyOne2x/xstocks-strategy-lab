import { useState, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { api, type WalletStatus } from "../../api/client";
import { useToastStore } from "../Toast/Toast";

export function WalletPanel() {
  const [serverWallet, setServerWallet] = useState<WalletStatus | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [fundAmount, setFundAmount] = useState("0.01");

  const { address: userAddress, isConnected } = useAccount();
  const addToast = useToastStore((s) => s.addToast);

  const { data: txHash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const fetchWalletStatus = useCallback(async () => {
    try {
      const status = await api.wallet.status();
      setServerWallet(status);
    } catch {
      // Server might not have the route yet
    }
  }, []);

  useEffect(() => {
    fetchWalletStatus();
    const interval = setInterval(fetchWalletStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchWalletStatus]);

  useEffect(() => {
    if (isConfirmed) {
      addToast("Funds sent to server wallet!", "success");
      fetchWalletStatus();
    }
  }, [isConfirmed, addToast, fetchWalletStatus]);

  function handleFund() {
    if (!serverWallet?.address || !isConnected) return;
    sendTransaction({
      to: serverWallet.address as `0x${string}`,
      value: parseEther(fundAmount),
    });
  }

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
          serverWallet?.configured && !serverWallet.dryRun
            ? "bg-blue-900/30 border-blue-600 text-blue-400"
            : "border-border-default text-gray-400 hover:text-white"
        }`}
        title={serverWallet?.configured ? `Server wallet: ${serverWallet.address}` : "Wallet not configured"}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {serverWallet?.dryRun ? "Dry Run" : serverWallet?.configured ? shortAddr(serverWallet.address!) : "No Wallet"}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-1 border border-border-default rounded-xl shadow-2xl z-50 p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Wallet</h3>
            <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Server Wallet Section */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Server Wallet</div>
            {serverWallet?.configured ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Address</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(serverWallet.address!);
                      addToast("Address copied", "info");
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                  >
                    {shortAddr(serverWallet.address!)}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Balance</span>
                  <span className="text-xs text-white font-mono">
                    {Number(serverWallet.balance ?? 0).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Chain</span>
                  <span className="text-xs text-white">{serverWallet.chain.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Mode</span>
                  <span className={`text-xs font-medium ${
                    serverWallet.dryRun ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {serverWallet.networkMode}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-surface-2 rounded-lg p-3">
                Not configured. Set <code className="text-yellow-400">WALLET_PRIVATE_KEY</code> in your server .env file.
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border-default my-3" />

          {/* User Wallet Section */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Wallet</div>
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div>
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        className="w-full px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Connect Wallet
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button onClick={openAccountModal} className="text-xs text-blue-400 hover:text-blue-300 font-mono">
                            {account.displayName}
                          </button>
                          <button onClick={openChainModal} className="text-xs text-gray-400 hover:text-white">
                            {chain.name}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Balance</span>
                          <span className="text-xs text-white font-mono">{account.displayBalance}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Fund Server Wallet */}
          {isConnected && serverWallet?.configured && (
            <>
              <div className="border-t border-border-default my-3" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fund Server Wallet</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    step="0.001"
                    min="0"
                    className="flex-1 bg-surface-2 border border-border-default rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-accent"
                    placeholder="0.01"
                  />
                  <button
                    onClick={handleFund}
                    disabled={isConfirming || !fundAmount || Number(fundAmount) <= 0}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {isConfirming ? "Sending..." : "Send"}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  Send testnet ETH from your wallet to the server wallet
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
