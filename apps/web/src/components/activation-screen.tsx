"use client";

import {
  getIdentityToken,
  useActiveWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  ApiActivationView,
  ApiExecutionLeg,
  ApiExecutionPlan,
  ApiExecutionRequest,
} from "@/lib/api-client";
import {
  DEFAULT_MANUAL_NOTIONAL_USD,
  fetchActivationPreview,
  fetchExecutions,
} from "@/lib/api-client";
import type { ActivationScreenProps, ExecutionArtifacts } from "@/lib/contracts";
import {
  EXECUTION_REFRESH_EVENT,
  getExecutionSignatureInputs,
  runManualExecutionFlow,
} from "@/lib/manual-execution";
import {
  getManifestExplanationBundle,
  getPrimaryPortfolioComponents,
  isDirectionalPreviewOnly,
} from "@/lib/portfolio-ui";
import { buildManifestContractBundle } from "@/lib/shared-contract-adapter";

import { WalletConnectButton, useWalletState } from "@/components/wallet-connect-button";
import { ExecutionArtifactLinks } from "@/components/execution-artifact-links";
import { XStocksFunnelStageTracker } from "@/components/xstocks-funnel-stage-tracker";

type StatusTone = "neutral" | "positive" | "warning";

function buildTxExplorerUrls(
  chain: string,
  txHash: string | null,
): ExecutionArtifacts["explorerUrls"] {
  if (!txHash || chain.toLowerCase() !== "ethereum") {
    return null;
  }

  return {
    etherscanTx: `https://etherscan.io/tx/${txHash}`,
    eigenPhiTx: `https://eigenphi.io/mev/eigentx/${txHash}`,
  };
}

function buildLegExecutionArtifacts(
  chain: string,
  leg: ApiExecutionLeg,
): ExecutionArtifacts | null {
  const txHash = leg.receipt?.txHash ?? leg.venueStatus?.settlementTxHash ?? null;
  const venueOrderId =
    leg.venueStatus?.venueOrderId ?? leg.approval?.venueOrderId ?? null;

  if (!txHash && !venueOrderId) {
    return null;
  }

  return {
    txHash,
    venueOrderId,
    chain,
    explorerUrls: buildTxExplorerUrls(chain, txHash),
  };
}

export function ActivationScreen({ manifest }: ActivationScreenProps) {
  const contracts = buildManifestContractBundle(manifest);
  const bundle = getManifestExplanationBundle(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);
  const primaryComponents = getPrimaryPortfolioComponents(manifest, 3);
  const wallet = useWalletState();
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { wallet: activeWallet } = useActiveWallet();
  const activeConnectedWallet =
    activeWallet && "getEthereumProvider" in activeWallet
      ? (activeWallet as (typeof wallets)[number])
      : null;
  const [requestedNotionalUsd, setRequestedNotionalUsd] = useState(
    DEFAULT_MANUAL_NOTIONAL_USD,
  );
  const [executionPlan, setExecutionPlan] = useState<ApiExecutionPlan | null>(null);
  const [latestActivation, setLatestActivation] = useState<ApiActivationView | null>(
    null,
  );
  const [executionRequest, setExecutionRequest] = useState<ApiExecutionRequest | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<{
    tone: StatusTone;
    message: string;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const targetWeights =
    manifest.explanationBundle?.targetWeights.map((item) => ({
      symbol: item.symbol,
      assetName: item.assetName,
      targetWeightPct: item.targetWeightPct,
    })) ??
    manifest.allocations
      .filter((allocation) => allocation.sleeve === "core xstocks")
      .map((allocation) => ({
        symbol: allocation.symbol,
        assetName: allocation.symbol,
        targetWeightPct: Number(
          allocation.targetWeight.replace("%", "").trim(),
        ),
      }));
  const signatureInputs = getExecutionSignatureInputs(executionRequest);
  const exactBlocker =
    statusMessage?.tone === "warning"
      ? statusMessage.message
      : executionRequest?.blockers[0] ??
        executionRequest?.legs.find((leg) => leg.blockers.length > 0)?.blockers[0] ??
        executionPlan?.blockers[0] ??
        null;
  const manualBoundary =
    executionRequest?.venueSigningMode === "wallet_signer_manual_only" ||
    wallet.venueSigningMode === "wallet_signer_manual_only"
      ? "Current live route stays wallet-first: the connected Privy wallet must return each 1inch Fusion EIP-712 signature before backend submission can be recorded."
      : "Venue signing truth is not loaded on this surface.";
  const executionLabel = executionRequest
    ? `${executionRequest.state.replaceAll("_", " ")} · ${executionRequest.adapterId}`
    : executionPlan
      ? `${executionPlan.executionState.replaceAll("_", " ")} · ${executionPlan.executionEligibility.replaceAll("_", " ")}`
      : "Preview only";
  const formatAddress = (value: string | null) =>
    value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not ready";
  const formatUsd = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      if (!authenticated) {
        return {
          accessToken: null,
          identityToken: null,
        };
      }

      const [accessToken, identityToken] = await Promise.all([
        getAccessToken().catch(() => null),
        getIdentityToken().catch(() => null),
      ]);

      return {
        accessToken,
        identityToken,
      };
    }

    async function refreshExecutionState() {
      if (!authenticated) {
        if (!cancelled) {
          setExecutionPlan(null);
          setLatestActivation(null);
          setExecutionRequest(null);
        }
        return;
      }

      const auth = await loadAuth();
      const preview = await fetchActivationPreview(
        manifest.slot_id,
        requestedNotionalUsd,
        auth,
      );

      if (!cancelled) {
        setExecutionPlan(preview?.executionPlan ?? null);
        setLatestActivation(preview?.latestActivation ?? null);
      }

      const executions = await fetchExecutions(
        {
          slotId: manifest.slot_id,
          limit: 10,
        },
        auth,
      );

      if (cancelled) {
        return;
      }

      const matchingExecution =
        executions?.items.find(
          (item) =>
            item.activationId === preview?.latestActivation?.activationId ||
            item.executionRequestId === executionRequest?.executionRequestId,
        ) ??
        executions?.items[0] ??
        null;

      setExecutionRequest(matchingExecution);
    }

    void refreshExecutionState();

    function handleRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ slotId?: string }>;

      if (customEvent.detail?.slotId && customEvent.detail.slotId !== manifest.slot_id) {
        return;
      }

      void refreshExecutionState();
    }

    window.addEventListener(EXECUTION_REFRESH_EVENT, handleRefresh as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(
        EXECUTION_REFRESH_EVENT,
        handleRefresh as EventListener,
      );
    };
  }, [
    authenticated,
    executionRequest?.executionRequestId,
    getAccessToken,
    manifest.slot_id,
    requestedNotionalUsd,
  ]);

  async function handleRunManualFlow() {
    if (!ready || !authenticated) {
      setStatusMessage({
        tone: "warning",
        message: "Connect wallet with Privy before the manual execution flow can start.",
      });
      return;
    }

    setIsRunning(true);

    try {
      const [accessToken, identityToken] = await Promise.all([
        getAccessToken().catch(() => null),
        getIdentityToken().catch(() => null),
      ]);

      const result = await runManualExecutionFlow({
        manifest,
        requestedNotionalUsd,
        initiationAction: "create",
        latestActivation,
        existingExecutionRequest: executionRequest,
        auth: {
          accessToken,
          identityToken,
        },
        wallets,
        activeWallet: activeConnectedWallet,
        walletState: {
          connected: wallet.connected,
          walletAddress: wallet.walletAddress,
          embeddedWallet: wallet.embeddedWallet,
          smartAccount: wallet.smartAccount,
        },
        onStatus: (status) => {
          setStatusMessage({
            tone: status.tone,
            message: status.message,
          });
        },
        onActivation: setLatestActivation,
        onExecutionRequest: setExecutionRequest,
      });

      if (result.blocker) {
        setStatusMessage({
          tone: "warning",
          message: result.blocker,
        });
      }
    } finally {
      setIsRunning(false);
    }
  }

  const funnelState: "disconnected" | "connected" | "funding_required" =
    !wallet.connected ? "disconnected" : "funding_required";

  if (directionalPreviewOnly) {
    return (
      <div className="screen-stack">
        <XStocksFunnelStageTracker
          stage="activation_viewed"
          manifestId={manifest.manifest_id}
          slotId={manifest.slot_id}
        />
        <article className="activation-primary-card">
          <div className="panel-heading">
            <span className="section-kicker">Directional preview</span>
            <h2>{manifest.frontend.title}</h2>
          </div>
          <p>{bundle.whatThisPortfolioDoes}</p>
          <div className="preview-callout">
            <span className="preview-chip">Preview only</span>
            <p>This directional position stays in preview. You keep full custody.</p>
          </div>
          <Link className="button button-secondary" href={`/workspace/detail/${manifest.slug}`}>
            View portfolio detail
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <XStocksFunnelStageTracker
        stage="activation_viewed"
        manifestId={manifest.manifest_id}
        slotId={manifest.slot_id}
      />
      <article className="activation-primary-card">
        <div className="panel-heading">
          <span className="section-kicker">Activate your portfolio</span>
          <h2>{manifest.frontend.title}</h2>
        </div>

        <p>{bundle.whatThisPortfolioDoes}</p>

        <div className="info-stack">
          <ActivationStep
            step={1}
            title="Connect wallet"
            description="Sign in with email or connect an existing wallet. Current manual execution stays wallet-first."
            status={funnelState === "disconnected" ? "next" : "complete"}
          >
            <WalletConnectButton />
            {!wallet.enabled && (
              <p className="panel-note" style={{ marginTop: 10 }}>
                Wallet connection is disabled in this environment until
                `NEXT_PUBLIC_PRIVY_APP_ID` is configured.
              </p>
            )}
          </ActivationStep>

          <ActivationStep
            step={2}
            title={`Set ${contracts.activationPayload.fundingAssetSymbol} notional`}
            description="This flow treats $100 USDC as the first-class manual buy path. The current repo-owned proof uses your requested notional as the funding truth carried into activation and venue routing."
            status={wallet.connected ? "next" : "locked"}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.84rem",
                color: "var(--text-soft)",
              }}
            >
              <span>Requested notional</span>
              <input
                type="number"
                min="1"
                step="1"
                value={requestedNotionalUsd}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setRequestedNotionalUsd(
                    Number.isFinite(nextValue) && nextValue > 0
                      ? nextValue
                      : DEFAULT_MANUAL_NOTIONAL_USD,
                  );
                }}
                style={{
                  width: 120,
                  minHeight: 36,
                  borderRadius: "var(--radius-row)",
                  border: "1px solid var(--border)",
                  background: "rgba(9, 12, 23, 0.9)",
                  color: "var(--text-main)",
                  padding: "0 12px",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <span>{contracts.activationPayload.fundingAssetSymbol}</span>
            </label>
            <p className="panel-note" style={{ marginTop: 10 }}>
              Manual routing target: {formatUsd(requestedNotionalUsd)} into the promoted
              basket weights below.
            </p>
          </ActivationStep>

          <ActivationStep
            step={3}
            title="Sign and submit the live 1inch route"
            description="The connected manual signer receives one real EIP-712 order per actionable core leg. Backend submission only occurs after those signatures return."
            status={
              executionRequest?.state === "submitted" || executionRequest?.state === "confirmed"
                ? "complete"
                : wallet.connected
                  ? "next"
                  : "locked"
            }
          >
            <button
              className="button button-primary"
              disabled={!wallet.connected || isRunning}
              type="button"
              onClick={handleRunManualFlow}
            >
              {isRunning
                ? "Running manual buy..."
                : executionRequest
                  ? "Continue wallet-first signing"
                  : `Activate ${formatUsd(requestedNotionalUsd)} buy`}
            </button>
            {exactBlocker && (
              <p className="panel-note" style={{ marginTop: 10, color: "var(--warning)" }}>
                {exactBlocker}
              </p>
            )}
          </ActivationStep>
        </div>

        <div className="panel-grid panel-grid-two" style={{ marginTop: 16 }}>
          <article className="panel-card panel-card-subtle">
            <span className="section-kicker">Execution truth</span>
            <div className="info-stack">
              <div>
                <span>Funding asset</span>
                <strong>{contracts.activationPayload.fundingAssetSymbol}</strong>
              </div>
              <div>
                <span>Requested notional</span>
                <strong>{formatUsd(requestedNotionalUsd)}</strong>
              </div>
              <div>
                <span>Execution state</span>
                <strong>{executionLabel}</strong>
              </div>
              <div>
                <span>Latest activation</span>
                <strong>{latestActivation?.activationId ?? "No saved activation yet"}</strong>
              </div>
              <p className="panel-note">{manualBoundary}</p>
            </div>
          </article>

          <article className="panel-card panel-card-subtle">
            <span className="section-kicker">Wallet boundary</span>
            <div className="info-stack">
              <div>
                <span>Embedded wallet</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  {formatAddress(
                    executionPlan?.smartAccount.bootstrap.embeddedWalletAddress ??
                      wallet.embeddedWallet.address,
                  )}
                </strong>
              </div>
              <div>
                <span>Manual signer</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  {formatAddress(
                    executionRequest?.manualSignerAddress ??
                      executionPlan?.smartAccount.bridgeState.manualSignerAddress ??
                      wallet.manualSignerAddress,
                  )}
                </strong>
              </div>
              <div>
                <span>Policy account</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  {formatAddress(
                    executionRequest?.policyAccountAddress ??
                      executionPlan?.smartAccount.bridgeState.policyAccountAddress ??
                      wallet.policyAccountAddress,
                  )}
                </strong>
              </div>
              <div>
                <span>Execution destination</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  {formatAddress(
                    executionRequest?.executionDestinationAddress ??
                      executionPlan?.smartAccount.bridgeState.executionDestinationAddress ??
                      wallet.executionDestinationAddress,
                  )}
                </strong>
              </div>
              <div>
                <span>Automation readiness</span>
                <strong>
                  {(
                    executionPlan?.automationExecution.readiness ??
                    wallet.automationReadiness
                  ).replaceAll("_", " ")}
                </strong>
              </div>
              <div>
                <span>Venue signing</span>
                <strong>
                  {executionRequest?.venueSigningMode ??
                    executionPlan?.smartAccount.venueSigningMode ??
                    wallet.venueSigningMode}
                </strong>
              </div>
              <div>
                <span>Current blocker</span>
                <strong>
                  {wallet.automationBlocker ??
                    executionPlan?.automationExecution.blockers[0] ??
                    "None"}
                </strong>
              </div>
              <p className="panel-note">
                Current bridge rule: manual signing stays wallet-first, `policyAccountAddress`
                resolves only when the Privy smart wallet is actually linked, and
                `executionDestinationAddress` stays on the current signer surface until
                that smart-wallet link exists. AA-native CoW or 1inch signing remains
                deferred.
              </p>
            </div>
          </article>
        </div>

        <div className="panel-grid panel-grid-two" style={{ marginTop: 16 }}>
          <article className="panel-card panel-card-subtle">
            <span className="section-kicker">Exact target weights</span>
            <div className="allocation-stack">
              {targetWeights.map((weight) => {
                const targetNotionalUsd =
                  (requestedNotionalUsd * weight.targetWeightPct) / 100;

                return (
                  <div className="allocation-row" key={weight.symbol}>
                    <div>
                      <strong>{weight.symbol}</strong>
                      <p>{weight.assetName}</p>
                    </div>
                    <span>
                      {weight.targetWeightPct.toFixed(1)}% · {formatUsd(targetNotionalUsd)}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel-card panel-card-subtle">
            <span className="section-kicker">Holdings rationale</span>
            <div className="allocation-stack">
              {primaryComponents.map((component) => (
                <div className="allocation-row" key={component.componentId}>
                  <div>
                    <strong>{component.title}</strong>
                    <p>{component.rationale}</p>
                  </div>
                  <span>{component.exposureLabel}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {executionRequest && (
          <div className="panel-grid panel-grid-two" style={{ marginTop: 16 }}>
            <article className="panel-card panel-card-subtle">
              <span className="section-kicker">Per-leg signature inputs</span>
              {signatureInputs.length > 0 ? (
                <div className="allocation-stack">
                  {signatureInputs.map((input) => (
                    <div className="allocation-row" key={input.legId}>
                      <div>
                        <strong>{input.assetSymbol}</strong>
                        <p>
                          signer {formatAddress(input.signerAddress)} · quote{" "}
                          {input.quoteId ?? "missing"} · order {input.orderHash ?? "pending"}
                        </p>
                        <p className="panel-note">
                          primaryType {input.primaryType ?? "unknown"} · domain{" "}
                          {input.domainName ?? "unnamed"}
                        </p>
                      </div>
                      <span>
                        {getLegStateLabel(executionRequest, input.legId)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-note">
                  No live EIP-712 signature payloads have been captured yet on this
                  activation.
                </p>
              )}
            </article>

            <article className="panel-card panel-card-subtle">
              <span className="section-kicker">Submission and receipt truth</span>
              <div className="allocation-stack">
                {executionRequest.legs
                  .filter((leg) => leg.sleeve === "core_xstocks")
                  .map((leg) => {
                    const artifacts = buildLegExecutionArtifacts(
                      executionRequest.chain,
                      leg,
                    );

                    return (
                      <div className="allocation-row" key={leg.legId}>
                        <div>
                          <strong>{leg.assetSymbol ?? leg.sleeve}</strong>
                          <p>
                            {artifacts?.venueOrderId
                              ? "Recorded venue order id is available."
                              : "No venue order id recorded yet."}
                          </p>
                          <p className="panel-note">
                            {artifacts?.txHash
                              ? "Settlement receipt is recorded for this leg."
                              : leg.venueStatus?.status
                                ? `Venue status ${leg.venueStatus.status}`
                                : "Awaiting a recorded settlement receipt."}
                          </p>
                          <ExecutionArtifactLinks artifacts={artifacts} />
                        </div>
                        <span>{leg.state.replaceAll("_", " ")}</span>
                      </div>
                    );
                  })}
              </div>
            </article>
          </div>
        )}

        <div className="info-stack" style={{ marginTop: 16 }}>
          <div>
            <span>Route</span>
            <strong>{manifest.live_state.routeSummary}</strong>
          </div>
          <div>
            <span>Deposit asset</span>
            <strong>
              {contracts.activationPayload.fundingAssetSymbol} · {formatUsd(requestedNotionalUsd)}
            </strong>
          </div>
          <div>
            <span>Reversible</span>
            <strong>
              {manifest.activation_template.reversible
                ? "Yes — pause or exit anytime"
                : "Review required to exit"}
            </strong>
          </div>
          <div>
            <span>What changes next</span>
            <strong>{bundle.whatWouldTriggerNextRebalance}</strong>
          </div>
        </div>

        {statusMessage && (
          <p
            className="panel-note"
            style={{
              marginTop: 16,
              color:
                statusMessage.tone === "positive"
                  ? "var(--positive)"
                  : statusMessage.tone === "warning"
                    ? "var(--warning)"
                    : "var(--text-soft)",
            }}
          >
            {statusMessage.message}
          </p>
        )}
      </article>
    </div>
  );
}

function getLegStateLabel(
  executionRequest: ApiExecutionRequest,
  legId: string,
): string {
  const leg = executionRequest.legs.find((item) => item.legId === legId);
  return leg ? leg.state.replaceAll("_", " ") : "pending";
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
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-row)",
        border: `1px solid ${
          status === "complete"
            ? "rgba(31, 213, 154, 0.3)"
            : status === "next"
              ? "rgba(31, 213, 154, 0.4)"
              : "var(--border)"
        }`,
        background:
          status === "complete"
            ? "rgba(31, 213, 154, 0.06)"
            : status === "next"
              ? "rgba(31, 213, 154, 0.04)"
              : "transparent",
        opacity: status === "locked" ? 0.5 : 1,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color:
              status === "complete"
                ? "var(--positive)"
                : status === "next"
                  ? "var(--accent)"
                  : "var(--text-muted)",
          }}
        >
          {status === "complete" ? "✓" : step}
        </span>
        <strong style={{ fontSize: "0.95rem" }}>{title}</strong>
      </div>
      <p className="panel-note">{description}</p>
      {children && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}
