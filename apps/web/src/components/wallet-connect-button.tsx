"use client";

import { useEffect, useRef } from "react";

import { usePrivyRuntime } from "@/components/privy-provider";
import { deriveWalletState, shortAddress } from "@/components/wallet-state";
import { trackXStocksFunnelStage } from "@/lib/funnel-tracking";

export function WalletConnectButton() {
  const {
    enabled,
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
    getIdentityToken,
    createEmbeddedWallet,
  } =
    usePrivyRuntime();
  const trackedWalletRef = useRef<string | null>(null);
  const embeddedWalletBootstrapAttemptedRef = useRef(false);
  const walletState = useWalletState();

  useEffect(() => {
    if (!authenticated) {
      trackedWalletRef.current = null;
      return;
    }

    const walletAddress = user?.wallet?.address ?? null;

    if (!walletAddress || trackedWalletRef.current === walletAddress) {
      return;
    }

    void (async () => {
      try {
        const [accessToken, identityToken] = await Promise.all([
          getAccessToken(),
          getIdentityToken(),
        ]);

        await trackXStocksFunnelStage({
          stage: "wallet_connected",
          accessToken,
          identityToken,
        });
        trackedWalletRef.current = walletAddress;
      } catch {
        trackedWalletRef.current = null;
      }
    })();
  }, [authenticated, getAccessToken, getIdentityToken, user]);

  useEffect(() => {
    if (!authenticated) {
      embeddedWalletBootstrapAttemptedRef.current = false;
      return;
    }

    if (!walletState.needsEmbeddedWalletBootstrap) {
      return;
    }

    if (embeddedWalletBootstrapAttemptedRef.current) {
      return;
    }

    embeddedWalletBootstrapAttemptedRef.current = true;
    void createEmbeddedWallet();
  }, [
    authenticated,
    createEmbeddedWallet,
    walletState.needsEmbeddedWalletBootstrap,
  ]);

  if (!enabled) {
    return (
      <button className="button button-primary" type="button" disabled style={{ width: "100%", opacity: 0.5 }}>
        Wallet connect unavailable
      </button>
    );
  }

  if (!ready) {
    return (
      <button className="button button-primary" type="button" disabled style={{ width: "100%", opacity: 0.5 }}>
        Loading...
      </button>
    );
  }

  if (authenticated && user) {
    const walletAddress = user.wallet?.address ?? null;
    const displayId = walletAddress
      ? shortAddress(walletAddress)
      : user.email?.address ?? "Connected";

    return (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, width: "100%" }}>
        <div className="info-stack" style={{ gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="status-pill status-pill-active">Connected</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-soft)", fontFamily: "var(--font-mono)" }}>
              {displayId}
            </span>
          </div>
          <div className="panel-note">
            Manual signer: {shortAddress(walletState.manualSignerAddress)} · policy account: {shortAddress(walletState.policyAccountAddress)}
          </div>
          <div className="panel-note">
            Automation: {walletState.automationReadiness.replaceAll("_", " ")} · destination: {shortAddress(walletState.executionDestinationAddress)}
          </div>
          {walletState.automationBlocker && (
            <div className="panel-note">{walletState.automationBlocker}</div>
          )}
        </div>
        <button
          className="button button-ghost"
          type="button"
          onClick={logout}
          style={{ minHeight: 32, padding: "0 10px", fontSize: "0.78rem" }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="button button-primary"
      type="button"
      onClick={login}
      style={{ width: "100%" }}
    >
      Connect wallet
    </button>
  );
}

/** Hook to read wallet state from other components */
export function useWalletState() {
  const { enabled, ready, authenticated, user, wallets, appConfig } =
    usePrivyRuntime();
  return deriveWalletState({
    enabled,
    ready,
    authenticated,
    user,
    wallets,
    appConfig,
  });
}
