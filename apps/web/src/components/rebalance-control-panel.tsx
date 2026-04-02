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
  ApiExecutionRequest,
} from "@/lib/api-client";
import {
  DEFAULT_MANUAL_NOTIONAL_USD,
  fetchActivationPreview,
  fetchExecutions,
} from "@/lib/api-client";
import { adaptExecutionPreview, adaptRebalanceOrchestration } from "@/lib/api-adapter";
import type {
  ExecutionPreviewView,
  PromotedManifest,
  RebalanceOrchestrationView,
} from "@/lib/contracts";
import {
  EXECUTION_REFRESH_EVENT,
  getExecutionSignatureInputs,
  runManualExecutionFlow,
} from "@/lib/manual-execution";
import {
  buildRebalanceControlSnapshot,
  humanizeRebalanceState,
} from "@/lib/rebalance-control";

import { useWalletState } from "@/components/wallet-connect-button";

export function RebalanceControlPanel({
  manifest,
}: {
  manifest: PromotedManifest;
}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { wallet: activeWallet } = useActiveWallet();
  const activeConnectedWallet =
    activeWallet && "getEthereumProvider" in activeWallet
      ? (activeWallet as (typeof wallets)[number])
      : null;
  const walletState = useWalletState();
  const [executionPreview, setExecutionPreview] = useState<ExecutionPreviewView | null>(
    manifest.preview?.executionPreview ?? null,
  );
  const [orchestration, setOrchestration] = useState<RebalanceOrchestrationView | null>(
    manifest.preview?.rebalanceOrchestration ?? null,
  );
  const [latestActivationId, setLatestActivationId] = useState<string | null>(null);
  const [latestActivation, setLatestActivation] = useState<ApiActivationView | null>(null);
  const [latestRequestedNotionalUsd, setLatestRequestedNotionalUsd] = useState(
    DEFAULT_MANUAL_NOTIONAL_USD,
  );
  const [executionRequest, setExecutionRequest] = useState<ApiExecutionRequest | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<{
    tone: "neutral" | "positive" | "warning";
    message: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

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

    async function refreshPreviewTruth() {
      if (!authenticated) {
        if (!cancelled) {
          setLatestActivationId(null);
          setLatestActivation(null);
          setExecutionRequest(null);
        }
        return;
      }

      const auth = await loadAuth();
      const preview = await fetchActivationPreview(
        manifest.slot_id,
        DEFAULT_MANUAL_NOTIONAL_USD,
        auth,
      );

      if (preview && !cancelled) {
        setExecutionPreview(adaptExecutionPreview(preview.executionPlan));
        setOrchestration(adaptRebalanceOrchestration(preview.rebalanceOrchestration));
        setLatestActivationId(preview.latestActivation?.activationId ?? null);
        setLatestActivation(preview.latestActivation ?? null);
        setLatestRequestedNotionalUsd(
          preview.latestActivation?.requestedNotionalUsd ??
            DEFAULT_MANUAL_NOTIONAL_USD,
        );
      }

      const executions = await fetchExecutions(
        {
          slotId: manifest.slot_id,
          limit: 10,
        },
        auth,
      );

      if (!cancelled) {
        setExecutionRequest(executions?.items[0] ?? null);
      }
    }

    void refreshPreviewTruth();

    function handleRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ slotId?: string }>;

      if (customEvent.detail?.slotId && customEvent.detail.slotId !== manifest.slot_id) {
        return;
      }

      void refreshPreviewTruth();
    }

    window.addEventListener(EXECUTION_REFRESH_EVENT, handleRefresh as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(
        EXECUTION_REFRESH_EVENT,
        handleRefresh as EventListener,
      );
    };
  }, [authenticated, getAccessToken, manifest.slot_id]);

  const snapshot = buildRebalanceControlSnapshot({
    manifest,
    orchestration,
    executionPreview,
    latestActivationId,
  });
  const authBlocker = !ready
    ? "Wallet auth is still loading on this surface."
    : !authenticated
      ? "Connect wallet with Privy before execute_all can cross the authenticated signer boundary."
      : null;
  const executeAllBlocker = snapshot.executeAllBlocker ?? authBlocker;
  const executeAllEnabled = snapshot.executeAllEnabled && authBlocker === null;
  const combinedBlockers = [...new Set([executeAllBlocker, ...snapshot.blockers].filter(Boolean))];
  const exactWeights =
    manifest.explanationBundle?.targetWeights.map((item) => `${item.symbol} ${item.targetWeightPct.toFixed(1)}%`) ??
    manifest.allocations
      .filter((allocation) => allocation.sleeve === "core xstocks")
      .map((allocation) => `${allocation.symbol} ${allocation.targetWeight}`);
  const signatureInputs = getExecutionSignatureInputs(executionRequest);

  const executeAllLabel =
    executionRequest?.state && executionRequest.triggerSource === "provider_staging"
      ? `Continue execute_all · ${humanizeRebalanceState(executionRequest.state)}`
      : executeAllEnabled
        ? "Execute all and sign"
        : "Execute all unavailable";

  async function handleExecuteAll() {
    if (!orchestration || !authenticated) {
      return;
    }

    setIsPending(true);

    try {
      const [accessToken, identityToken] = await Promise.all([
        getAccessToken().catch(() => null),
        getIdentityToken().catch(() => null),
      ]);

      const result = await runManualExecutionFlow({
        manifest,
        requestedNotionalUsd: latestRequestedNotionalUsd,
        initiationAction: "execute_all",
        latestActivation,
        existingExecutionRequest: executionRequest,
        rebalanceId: orchestration.rebalanceId,
        auth: {
          accessToken,
          identityToken,
        },
        wallets,
        activeWallet: activeConnectedWallet,
        walletState: {
          connected: walletState.connected,
          walletAddress: walletState.walletAddress,
          embeddedWallet: walletState.embeddedWallet,
          smartAccount: walletState.smartAccount,
        },
        onStatus: (status) => {
          setStatusMessage({
            tone: status.tone,
            message: status.message,
          });
        },
        onExecutionRequest: setExecutionRequest,
      });

      if (result.blocker) {
        setStatusMessage({
          tone: "warning",
          message: result.blocker,
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rail-card">
      <div className="panel-heading panel-heading-tight">
        <span className="section-kicker">Event and rebalance</span>
        <p>{snapshot.eventSummary}</p>
      </div>

      <div className="info-stack">
        <div>
          <span>Confidence</span>
          <strong>{snapshot.confidenceLabel}</strong>
        </div>
        <div>
          <span>Portfolio implication</span>
          <strong>{snapshot.portfolioImplication}</strong>
        </div>
        <div>
          <span>Readiness</span>
          <strong>{snapshot.readinessLabel}</strong>
        </div>
        <div>
          <span>Execution review</span>
          <strong>
            {orchestration
              ? `${humanizeRebalanceState(orchestration.state)}${orchestration.executionRequestState ? ` · ${humanizeRebalanceState(orchestration.executionRequestState)}` : ""}`
              : executionRequest
                ? `${humanizeRebalanceState(executionRequest.state)} · ${executionRequest.adapterId}`
                : "No persisted rebalance review"}
          </strong>
        </div>
      </div>

      <div className="panel-list">
        <span className="section-kicker">Exact target weights</span>
        <ul>
          {exactWeights.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="panel-list">
        <span className="section-kicker">Signature boundary</span>
        <ul>
          <li>{executionRequest?.fundingAssetSymbol ?? "USDC"} funding asset at ${latestRequestedNotionalUsd.toFixed(2)} requested notional.</li>
          <li>Manual signer {executionRequest?.manualSignerAddress ?? walletState.manualSignerAddress ?? "not ready"} remains the required EIP-712 signer.</li>
          <li>Backend submission only follows returned wallet-first 1inch signatures.</li>
        </ul>
      </div>

      <div className="panel-list">
        <span className="section-kicker">Readiness and blockers</span>
        {combinedBlockers.length > 0 ? (
          <ul>
            {combinedBlockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="panel-note">No blocking condition is currently loaded on this surface.</p>
        )}
      </div>

      {snapshot.liveBoundary && (
        <div className="info-stack">
          <div>
            <span>Current live boundary</span>
            <strong>{snapshot.liveBoundary}</strong>
          </div>
        </div>
      )}

      {signatureInputs.length > 0 && (
        <div className="panel-list">
          <span className="section-kicker">Queued signature payloads</span>
          <ul>
            {signatureInputs.slice(0, 3).map((input) => (
              <li key={input.legId}>
                {input.assetSymbol} · {input.primaryType ?? "typed data"} · {input.orderHash ?? "pending order hash"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot.warnings.length > 0 && (
        <div className="panel-list">
          <span className="section-kicker">Warnings</span>
          <ul>
            {snapshot.warnings.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-stack">
        {executeAllBlocker && (
          <p className="panel-note">{executeAllBlocker}</p>
        )}
        <button
          className="button button-primary"
          disabled={!executeAllEnabled || isPending}
          onClick={handleExecuteAll}
          type="button"
        >
          {isPending ? "Running execute_all..." : executeAllLabel}
        </button>
        <Link className="button button-secondary" href={`/workspace/detail/${manifest.slug}`}>
          Open detail
        </Link>
        <Link className="button button-secondary" href={`/activate/${manifest.slug}`}>
          Open activation
        </Link>
      </div>

      <div className="info-stack">
        <div>
          <span>Latest activation</span>
          <strong>{latestActivationId ?? "No saved activation loaded"}</strong>
        </div>
        <div>
          <span>Latest execution request</span>
          <strong>{executionRequest?.executionRequestId ?? "No execution request loaded"}</strong>
        </div>
        <div>
          <span>Primary venue</span>
          <strong>{manifest.market_intelligence.routeState.primaryVenue}</strong>
        </div>
      </div>

      {statusMessage && (
        <p
          className="panel-note"
          style={{
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
    </section>
  );
}
