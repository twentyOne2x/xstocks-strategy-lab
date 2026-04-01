"use client";

import Link from "next/link";

import type { ActivationScreenProps } from "@/lib/contracts";
import {
  getManifestExplanationBundle,
  isDirectionalPreviewOnly,
} from "@/lib/portfolio-ui";
import { buildManifestContractBundle } from "@/lib/shared-contract-adapter";

import { WalletConnectButton, useWalletState } from "@/components/wallet-connect-button";

export function ActivationScreen({ manifest }: ActivationScreenProps) {
  const contracts = buildManifestContractBundle(manifest);
  const bundle = getManifestExplanationBundle(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);
  const wallet = useWalletState();

  // Derive funnel state from real wallet connection
  const funnelState: "disconnected" | "connected" | "funding_required" = !wallet.connected
    ? "disconnected"
    : "funding_required"; // No on-chain balance check available on frontend — stop here honestly

  return (
    <div className="screen-stack">
      <article className="activation-primary-card">
        <div className="panel-heading">
          <span className="section-kicker">
            {directionalPreviewOnly ? "Directional preview" : "Activate your portfolio"}
          </span>
          <h2>{manifest.frontend.title}</h2>
        </div>

        <p>{bundle.whatThisPortfolioDoes}</p>

        {directionalPreviewOnly ? (
          <div className="preview-callout">
            <span className="preview-chip">Preview only</span>
            <p>This directional position stays in preview. You keep full custody.</p>
          </div>
        ) : (
          <div className="info-stack">
            <ActivationStep
              step={1}
              title="Connect wallet"
              description="Sign in with email or connect an existing wallet. Your keys, your assets."
              status={funnelState === "disconnected" ? "next" : "complete"}
            >
              <WalletConnectButton />
            </ActivationStep>

            <ActivationStep
              step={2}
              title={`Fund with ${contracts.activationPayload.fundingAssetSymbol}`}
              description={`Minimum $${contracts.activationPayload.fundingAmountUsd.toLocaleString("en-US")} via card, exchange, or wallet transfer.`}
              status={funnelState === "funding_required" ? "next" : "locked"}
            >
              {funnelState === "funding_required" && (
                <p className="panel-note">
                  Funding is the next step. On-chain balance verification is not available in this preview.
                </p>
              )}
            </ActivationStep>

            <ActivationStep
              step={3}
              title="Activate portfolio"
              description="Review the exact holdings and approve the transaction. Nothing executes without your confirmation."
              status="locked"
            />
          </div>
        )}

        <div className="info-stack" style={{ marginTop: 16 }}>
          <div>
            <span>Route</span>
            <strong>{manifest.live_state.routeSummary}</strong>
          </div>
          <div>
            <span>Deposit asset</span>
            <strong>{contracts.activationPayload.fundingAssetSymbol} · ${contracts.activationPayload.fundingAmountUsd.toLocaleString("en-US")}</strong>
          </div>
          <div>
            <span>Reversible</span>
            <strong>{manifest.activation_template.reversible ? "Yes — pause or exit anytime" : "Review required to exit"}</strong>
          </div>
          {wallet.connected && wallet.walletAddress && (
            <div>
              <span>Your wallet</span>
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
              </strong>
            </div>
          )}
        </div>

        {directionalPreviewOnly && (
          <Link className="button button-secondary" href={`/workspace/detail/${manifest.slug}`}>
            View portfolio detail
          </Link>
        )}
      </article>
    </div>
  );
}

function ActivationStep({
  step,
  title,
  description,
  status,
  children,
}: {
  step: number;
  title: string;
  description: string;
  status: "complete" | "next" | "locked";
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "var(--radius-row)",
      border: `1px solid ${
        status === "complete" ? "rgba(31, 213, 154, 0.3)"
        : status === "next" ? "rgba(31, 213, 154, 0.4)"
        : "var(--border)"
      }`,
      background:
        status === "complete" ? "rgba(31, 213, 154, 0.06)"
        : status === "next" ? "rgba(31, 213, 154, 0.04)"
        : "transparent",
      opacity: status === "locked" ? 0.5 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: status === "complete" ? "var(--positive)" : status === "next" ? "var(--accent)" : "var(--text-muted)",
        }}>
          {status === "complete" ? "✓" : step}
        </span>
        <strong style={{ fontSize: "0.95rem" }}>{title}</strong>
      </div>
      <p className="panel-note">{description}</p>
      {children && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}
