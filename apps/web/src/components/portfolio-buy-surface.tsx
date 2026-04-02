"use client";

import Link from "next/link";

import { WalletConnectButton, useWalletState } from "@/components/wallet-connect-button";

export function PortfolioBuySurface({
  activationHref,
  directionalPreviewOnly,
  manifestTitle,
}: {
  activationHref: string;
  directionalPreviewOnly: boolean;
  manifestTitle: string;
}) {
  const walletState = useWalletState();
  const callToActionLabel = directionalPreviewOnly
    ? "View directional preview"
    : "BUY PORTFOLIO";
  const walletStatusLabel = walletState.connected
    ? "Connected"
    : walletState.enabled
      ? "Connect to buy"
      : "Unavailable";
  const helperText = directionalPreviewOnly
    ? "Directional lanes stay preview-only on this surface. The existing activation route remains secondary/internal."
    : walletState.connected
      ? "This detail page is the primary visible buy surface. The existing activation route stays internal and reuses the current wallet-first manual execution flow."
      : "Connect wallet here, then continue through the existing internal activation route. No new execution runtime is introduced in this slice.";

  return (
    <section className="workspace-buy-surface">
      <div className="workspace-buy-head">
        <div>
          <span className="section-kicker">Primary buy surface</span>
          <h3>{directionalPreviewOnly ? manifestTitle : "BUY PORTFOLIO"}</h3>
        </div>
        <div className="workspace-state-pill">
          <span>Wallet status</span>
          <strong>{walletStatusLabel}</strong>
        </div>
      </div>

      <p className="panel-note">{helperText}</p>

      <div className="workspace-buy-controls">
        <WalletConnectButton />
      </div>

      <div className="action-stack action-stack-inline">
        <Link className="button button-primary" href={activationHref}>
          {callToActionLabel}
        </Link>
        <span className="token-pill">
          {directionalPreviewOnly
            ? "Preview only"
            : walletState.connected
              ? "Activation stays internal"
              : "Wallet connect lives here"}
        </span>
      </div>
    </section>
  );
}
