"use client";

import { getIdentityToken, usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { postExecutionAction, fetchActivationPreview } from "@/lib/api-client";
import { adaptExecutionPreview, adaptRebalanceOrchestration } from "@/lib/api-adapter";
import type {
  ExecutionPreviewView,
  PromotedManifest,
  RebalanceOrchestrationView,
} from "@/lib/contracts";
import {
  buildRebalanceControlSnapshot,
  humanizeRebalanceState,
} from "@/lib/rebalance-control";

export function RebalanceControlPanel({
  manifest,
}: {
  manifest: PromotedManifest;
}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [executionPreview, setExecutionPreview] = useState<ExecutionPreviewView | null>(
    manifest.preview?.executionPreview ?? null,
  );
  const [orchestration, setOrchestration] = useState<RebalanceOrchestrationView | null>(
    manifest.preview?.rebalanceOrchestration ?? null,
  );
  const [latestActivationId, setLatestActivationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "neutral" | "positive" | "warning";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

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
      const auth = await loadAuth();
      const preview = await fetchActivationPreview(manifest.slot_id, 10, auth);

      if (!preview || cancelled) {
        if (!cancelled) {
          setStatusMessage((current) =>
            current ?? {
              tone: "warning",
              message:
                "Activation preview API is unavailable, so execute-all truth stays fail-closed on this surface.",
            },
          );
        }
        return;
      }

      setExecutionPreview(adaptExecutionPreview(preview.executionPlan));
      setOrchestration(adaptRebalanceOrchestration(preview.rebalanceOrchestration));
      setLatestActivationId(preview.latestActivation?.activationId ?? null);
    }

    void refreshPreviewTruth();

    return () => {
      cancelled = true;
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
      ? "Connect wallet with Privy before execute_all can stage an authenticated execution request."
      : null;
  const executeAllBlocker = snapshot.executeAllBlocker ?? authBlocker;
  const executeAllEnabled = snapshot.executeAllEnabled && authBlocker === null;
  const combinedBlockers = [...new Set([executeAllBlocker, ...snapshot.blockers].filter(Boolean))];

  const executeAllLabel =
    orchestration?.executionRequestState && orchestration.executionRequestId
      ? `Execution staged · ${humanizeRebalanceState(orchestration.executionRequestState)}`
      : executeAllEnabled
        ? "Execute all"
        : "Execute all unavailable";

  function handleExecuteAll() {
    if (!latestActivationId || !orchestration || !authenticated) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const [accessToken, identityToken] = await Promise.all([
          getAccessToken().catch(() => null),
          getIdentityToken().catch(() => null),
        ]);

        setStatusMessage({
          tone: "neutral",
          message: "Staging the backend execution request from the current rebalance review.",
        });

        const result = await postExecutionAction({
          action: "execute_all",
          activationId: latestActivationId,
          rebalanceId: orchestration.rebalanceId,
        }, {
          accessToken,
          identityToken,
        });

        if (!result.data) {
          setStatusMessage({
            tone: "warning",
            message:
              result.error ??
              "Execute all failed closed before a backend execution request could be staged.",
          });
          return;
        }

        setStatusMessage({
          tone: "positive",
          message:
            result.data.executionRequest.linkage?.providerReceiptId
              ? `Execution request ${result.data.executionRequest.executionRequestId} staged with provider linkage ${result.data.executionRequest.linkage.providerReceiptId}.`
              : `Execution request ${result.data.executionRequest.executionRequestId} staged from the current rebalance review.`,
        });

        const preview = await fetchActivationPreview(manifest.slot_id, 10, {
          accessToken,
          identityToken,
        });

        if (!preview) {
          return;
        }

        setExecutionPreview(adaptExecutionPreview(preview.executionPlan));
        setOrchestration(adaptRebalanceOrchestration(preview.rebalanceOrchestration));
        setLatestActivationId(preview.latestActivation?.activationId ?? null);
      })();
    });
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
              : "No persisted rebalance review"}
          </strong>
        </div>
      </div>

      <div className="panel-list">
        <span className="section-kicker">What changed</span>
        <ul>
          {manifest.market_intelligence.whatChanged.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
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
          {isPending ? "Staging execution..." : executeAllLabel}
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
