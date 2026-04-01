"use client";

import { getIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";

import { trackXStocksFunnelStage } from "@/lib/funnel-tracking";

export function WalletConnectButton() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const trackedWalletRef = useRef<string | null>(null);

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
  }, [authenticated, getAccessToken, user]);

  if (!ready) {
    return (
      <button className="button button-primary" type="button" disabled style={{ width: "100%", opacity: 0.5 }}>
        Loading...
      </button>
    );
  }

  if (authenticated && user) {
    const walletAddress = user.wallet?.address;
    const shortAddress = walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : null;
    const displayId = shortAddress ?? user.email?.address ?? "Connected";

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="status-pill status-pill-active">Connected</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-soft)", fontFamily: "var(--font-mono)" }}>
            {displayId}
          </span>
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
  const { ready, authenticated, user } = usePrivy();
  const walletAddress = authenticated ? user?.wallet?.address ?? null : null;

  return {
    ready,
    connected: authenticated,
    walletAddress,
  };
}
