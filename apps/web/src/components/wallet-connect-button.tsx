"use client";

import { useEffect, useRef } from "react";

import type {
  PrivyConnectedWalletLike,
  PrivyLinkedAccountLike,
} from "@/components/privy-provider";
import { usePrivyRuntime } from "@/components/privy-provider";
import { trackXStocksFunnelStage } from "@/lib/funnel-tracking";

function getLinkedAccounts(user: unknown): PrivyLinkedAccountLike[] {
  if (!user || typeof user !== "object") {
    return [];
  }

  const linkedAccounts =
    (user as { linkedAccounts?: unknown[] }).linkedAccounts ??
    (user as { linked_accounts?: unknown[] }).linked_accounts ??
    [];

  return Array.isArray(linkedAccounts)
    ? (linkedAccounts as PrivyLinkedAccountLike[])
    : [];
}

function findEmbeddedWalletAddress(
  wallets: PrivyConnectedWalletLike[],
  linkedAccounts: PrivyLinkedAccountLike[],
) {
  const connectedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy" && wallet.address,
  );

  if (connectedWallet?.address) {
    return connectedWallet.address;
  }

  const linkedWallet = linkedAccounts.find(
    (account) =>
      account.type === "wallet" &&
      (account.walletClientType === "privy" ||
        account.wallet_client_type === "privy") &&
      (account.chainType === "ethereum" ||
        account.chain_type === "ethereum" ||
        account.chainType === undefined),
  );

  return linkedWallet?.address ?? null;
}

function findSmartAccountAddress(linkedAccounts: PrivyLinkedAccountLike[]) {
  return (
    linkedAccounts.find(
      (account) => account.type === "smart_wallet" && account.address,
    )?.address ?? null
  );
}

function shortAddress(value: string | null) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not ready";
}

export function WalletConnectButton() {
  const { enabled, ready, authenticated, user, login, logout, getAccessToken, getIdentityToken } =
    usePrivyRuntime();
  const trackedWalletRef = useRef<string | null>(null);
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
            Manual signer: {shortAddress(walletState.manualSignerAddress)} · smart account: {shortAddress(walletState.policyAccountAddress)}
          </div>
          <div className="panel-note">
            Automation: {walletState.automationReadiness.replaceAll("_", " ")} · venue signing: wallet signer manual only
          </div>
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
  const { enabled, ready, authenticated, user, wallets } = usePrivyRuntime();
  const linkedAccounts = authenticated ? getLinkedAccounts(user) : [];
  const walletAddress = authenticated ? user?.wallet?.address ?? null : null;
  const embeddedWalletAddress = authenticated
    ? findEmbeddedWalletAddress(wallets, linkedAccounts)
    : null;
  const smartAccountAddress = authenticated
    ? findSmartAccountAddress(linkedAccounts)
    : null;
  const manualSignerAddress = embeddedWalletAddress ?? walletAddress ?? null;
  const automationReadiness = !authenticated
    ? "wallet_required"
    : smartAccountAddress
      ? "ready"
      : "smart_account_required";

  return {
    enabled,
    ready,
    connected: authenticated,
    walletAddress,
    embeddedWallet: {
      status: embeddedWalletAddress ? "ready" : "not_created",
      address: embeddedWalletAddress,
    },
    smartAccount: {
      status: smartAccountAddress ? "ready" : "not_started",
      address: smartAccountAddress,
    },
    manualSignerAddress,
    policyAccountAddress: smartAccountAddress,
    executionDestinationAddress: smartAccountAddress ?? manualSignerAddress,
    automationReadiness,
    manualSigningMode: "wallet_first",
    automationAccountMode: "smart_account_required",
    venueSigningMode: "wallet_signer_manual_only",
  };
}
