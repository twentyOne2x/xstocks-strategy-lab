"use client";

import {
  useActiveWallet,
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
  buildDefaultRebalanceEventDraft,
  buildRebalanceControlSnapshot,
  buildRebalanceRecommendations,
  coerceRebalanceEventDraft,
  humanizeRebalanceState,
  type RebalanceEventDraft,
} from "@/lib/rebalance-control";

import { usePrivyRuntime } from "@/components/privy-provider";
import { useWalletState } from "@/components/wallet-connect-button";

const EVENT_STORAGE_PREFIX = "xstocks:right-rail-event:";

function formatStoredEventTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Local stub only";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function parseListInput(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function listToInput(values: string[]) {
  return values.join(", ");
}

function controlToneClass(mode: "review_only" | "stage_only" | "blocked") {
  if (mode === "stage_only") {
    return "ready";
  }

  if (mode === "review_only") {
    return "steady";
  }

  return "warning";
}

export function RebalanceControlPanel({
  manifest,
}: {
  manifest: PromotedManifest;
}) {
  const { ready, authenticated, getAccessToken, getIdentityToken } =
    usePrivyRuntime();
  const { wallets } = useWallets();
  const { wallet: activeWallet } = useActiveWallet();
  const activeConnectedWallet =
    activeWallet && "getEthereumProvider" in activeWallet
      ? (activeWallet as (typeof wallets)[number])
      : null;
  const walletState = useWalletState();
  const eventStorageKey = `${EVENT_STORAGE_PREFIX}${manifest.slot_id}`;
  const defaultEventSeed = buildDefaultRebalanceEventDraft(manifest);
  const defaultEventSource = defaultEventSeed.source;
  const defaultEventSummary = defaultEventSeed.summary;
  const defaultEventConfidence = defaultEventSeed.confidence;
  const defaultEventAffectedSleeves = defaultEventSeed.affectedSleeves.join("|");
  const defaultEventAffectedSymbols = defaultEventSeed.affectedSymbols.join("|");
  const defaultEventPortfolioImplication = defaultEventSeed.portfolioImplication;
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
  const [currentEvent, setCurrentEvent] = useState<RebalanceEventDraft>(() =>
    buildDefaultRebalanceEventDraft(manifest),
  );
  const [eventEditor, setEventEditor] = useState<RebalanceEventDraft>(() =>
    buildDefaultRebalanceEventDraft(manifest),
  );
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const fallback: RebalanceEventDraft = {
      source: defaultEventSource,
      summary: defaultEventSummary,
      confidence: defaultEventConfidence,
      affectedSleeves: defaultEventAffectedSleeves
        .split("|")
        .filter(Boolean),
      affectedSymbols: defaultEventAffectedSymbols
        .split("|")
        .filter(Boolean),
      portfolioImplication: defaultEventPortfolioImplication,
      persistence: "local_stub",
      updatedAt: null,
    };

    if (typeof window === "undefined") {
      setCurrentEvent(fallback);
      setEventEditor(fallback);
      return;
    }

    try {
      const stored = window.localStorage.getItem(eventStorageKey);
      const nextEvent = stored
        ? coerceRebalanceEventDraft(JSON.parse(stored), fallback)
        : fallback;

      setCurrentEvent(nextEvent);
      setEventEditor(nextEvent);
    } catch {
      setCurrentEvent(fallback);
      setEventEditor(fallback);
    }
  }, [
    defaultEventAffectedSleeves,
    defaultEventAffectedSymbols,
    defaultEventConfidence,
    defaultEventPortfolioImplication,
    defaultEventSource,
    defaultEventSummary,
    eventStorageKey,
  ]);

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
        walletState.connected
          ? {
              connected: true,
              walletAddress: walletState.walletAddress,
              embeddedWallet: {
                status: walletState.embeddedWallet.status,
                address: walletState.embeddedWallet.address,
                providerId: "privy",
              },
              smartAccount: {
                status: walletState.smartAccount.status,
                address: walletState.smartAccount.address,
                providerId: "privy",
              },
            }
          : undefined,
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
  }, [
    authenticated,
    getAccessToken,
    getIdentityToken,
    manifest.slot_id,
    walletState.connected,
    walletState.walletAddress,
    walletState.embeddedWallet.address,
    walletState.embeddedWallet.status,
    walletState.smartAccount.address,
    walletState.smartAccount.status,
  ]);

  const snapshot = buildRebalanceControlSnapshot({
    manifest,
    orchestration,
    executionPreview,
    latestActivationId,
    authenticated,
    ready,
    executionRequest,
  });
  const recommendations = buildRebalanceRecommendations({
    manifest,
    event: currentEvent,
    snapshot,
  });
  const combinedBlockers = [...new Set(snapshot.blockers.filter(Boolean))];
  const exactWeights =
    manifest.explanationBundle?.targetWeights.map(
      (item) => `${item.symbol} ${item.targetWeightPct.toFixed(1)}%`,
    ) ??
    manifest.allocations
      .filter((allocation) => allocation.sleeve === "core xstocks")
      .map((allocation) => `${allocation.symbol} ${allocation.targetWeight}`);
  const signatureInputs = getExecutionSignatureInputs(executionRequest);
  const doAllControl = snapshot.doAllControl;

  useEffect(() => {
    setExpandedRecommendations((current) => {
      const availableIds = new Set(recommendations.map((item) => item.id));
      const stillOpen = current.filter((item) => availableIds.has(item));

      if (stillOpen.length > 0) {
        return stillOpen;
      }

      return recommendations[0] ? [recommendations[0].id] : [];
    });
  }, [recommendations]);

  function persistCurrentEvent(nextEvent: RebalanceEventDraft) {
    setCurrentEvent(nextEvent);
    setEventEditor(nextEvent);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(eventStorageKey, JSON.stringify(nextEvent));
    }

    setStatusMessage({
      tone: "neutral",
      message:
        "Manual event stub saved locally to this browser only. No persistent event-intent API is wired in this pass.",
    });
  }

  function handleSaveEvent() {
    const nextEvent = coerceRebalanceEventDraft(
      {
        ...eventEditor,
        updatedAt: new Date().toISOString(),
      },
      buildDefaultRebalanceEventDraft(manifest),
    );

    persistCurrentEvent(nextEvent);
    setIsEditingEvent(false);
  }

  function handleResetEvent() {
    const nextEvent = buildDefaultRebalanceEventDraft(manifest);

    setCurrentEvent(nextEvent);
    setEventEditor(nextEvent);
    setIsEditingEvent(false);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(eventStorageKey);
    }

    setStatusMessage({
      tone: "neutral",
      message:
        "Right-rail event stub reset to the current manifest intelligence view. Persistence remains local-only.",
    });
  }

  function toggleRecommendation(recommendationId: string) {
    setExpandedRecommendations((current) =>
      current.includes(recommendationId)
        ? current.filter((item) => item !== recommendationId)
        : [...current, recommendationId],
    );
  }

  async function handleExecuteAll() {
    if (!orchestration || !authenticated || !doAllControl.enabled) {
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

      <article className="event-surface-card">
        <div className="event-surface-head">
          <div>
            <span className="section-kicker">Current event</span>
            <h3>{currentEvent.summary}</h3>
          </div>
          <div className="event-chip-row">
            <span className="token-pill">{currentEvent.source}</span>
            <span
              className={`inline-pill inline-pill-${controlToneClass(doAllControl.mode)}`}
            >
              {doAllControl.badgeLabel}
            </span>
          </div>
        </div>

        <p className="panel-note">
          {currentEvent.updatedAt
            ? `Saved locally on ${formatStoredEventTimestamp(currentEvent.updatedAt)}.`
            : "Local stub only. No persistent event-intent API is wired in this pass."}
        </p>

        <div className="info-stack">
          <div>
            <span>Source</span>
            <strong>{currentEvent.source}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{currentEvent.confidence}</strong>
          </div>
          <div>
            <span>Portfolio implication</span>
            <strong>{currentEvent.portfolioImplication}</strong>
          </div>
          <div>
            <span>Current action mode</span>
            <strong>{doAllControl.badgeLabel}</strong>
          </div>
        </div>

        <div className="event-meta-grid">
          <div>
            <span className="section-kicker">Affected sleeves</span>
            <div className="event-chip-row">
              {currentEvent.affectedSleeves.map((sleeve) => (
                <span className="token-pill" key={sleeve}>
                  {sleeve}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="section-kicker">Affected symbols</span>
            <div className="event-chip-row">
              {currentEvent.affectedSymbols.map((symbol) => (
                <span className="token-pill" key={symbol}>
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="action-stack action-stack-inline">
          <button
            className="button button-secondary"
            onClick={() => {
              setEventEditor(currentEvent);
              setIsEditingEvent((current) => !current);
            }}
            type="button"
          >
            {isEditingEvent ? "Close event editor" : "Edit event stub"}
          </button>
          <button
            className="button button-secondary"
            onClick={handleResetEvent}
            type="button"
          >
            Reset stub
          </button>
        </div>

        {isEditingEvent ? (
          <div className="event-editor">
            <label className="event-editor-field">
              <span>Source</span>
              <input
                className="event-editor-input"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    source: event.target.value,
                  }))
                }
                type="text"
                value={eventEditor.source}
              />
            </label>
            <label className="event-editor-field">
              <span>Summary</span>
              <textarea
                className="event-editor-textarea"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                rows={3}
                value={eventEditor.summary}
              />
            </label>
            <label className="event-editor-field">
              <span>Confidence</span>
              <input
                className="event-editor-input"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    confidence: event.target.value,
                  }))
                }
                type="text"
                value={eventEditor.confidence}
              />
            </label>
            <label className="event-editor-field">
              <span>Affected sleeves</span>
              <input
                className="event-editor-input"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    affectedSleeves: parseListInput(event.target.value),
                  }))
                }
                type="text"
                value={listToInput(eventEditor.affectedSleeves)}
              />
            </label>
            <label className="event-editor-field">
              <span>Affected symbols</span>
              <input
                className="event-editor-input"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    affectedSymbols: parseListInput(event.target.value),
                  }))
                }
                type="text"
                value={listToInput(eventEditor.affectedSymbols)}
              />
            </label>
            <label className="event-editor-field">
              <span>Portfolio implication</span>
              <textarea
                className="event-editor-textarea"
                onChange={(event) =>
                  setEventEditor((current) => ({
                    ...current,
                    portfolioImplication: event.target.value,
                  }))
                }
                rows={3}
                value={eventEditor.portfolioImplication}
              />
            </label>

            <div className="action-stack action-stack-inline">
              <button
                className="button button-primary"
                onClick={handleSaveEvent}
                type="button"
              >
                Save local event
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setEventEditor(currentEvent);
                  setIsEditingEvent(false);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <section className="panel-list">
        <div className="event-surface-head">
          <div>
            <span className="section-kicker">Recommended actions</span>
            <p className="panel-note">
              Derived from the current event stub and the truthful backend posture on
              this slot.
            </p>
          </div>
        </div>

        <div className="recommendation-grid">
          {recommendations.map((recommendation) => {
            const expanded = expandedRecommendations.includes(recommendation.id);

            return (
              <article
                className={`recommendation-card recommendation-card-${recommendation.tone}`}
                key={recommendation.id}
              >
                <button
                  aria-expanded={expanded}
                  className="recommendation-chip"
                  onClick={() => toggleRecommendation(recommendation.id)}
                  type="button"
                >
                  <span>{recommendation.label}</span>
                  <span>{expanded ? "Hide rationale" : "Show rationale"}</span>
                </button>

                {expanded ? (
                  <div className="recommendation-detail">
                    <p>{recommendation.rationale}</p>
                    <p className="panel-note">{recommendation.portfolioEffect}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <article className="recommendation-control-card">
        <div className="event-surface-head">
          <div>
            <span className="section-kicker">Grouped action</span>
            <h3>Do all recommendations</h3>
          </div>
          <span
            className={`inline-pill inline-pill-${controlToneClass(doAllControl.mode)}`}
          >
            {doAllControl.badgeLabel}
          </span>
        </div>

        <p className="panel-note">{doAllControl.detail}</p>

        <div className="action-stack">
          <button
            className="button button-primary"
            disabled={!doAllControl.enabled || isPending}
            onClick={handleExecuteAll}
            type="button"
          >
            {isPending ? "Running do_all..." : "Do all recommendations"}
          </button>
          <Link className="button button-secondary" href={`/workspace/detail/${manifest.slug}`}>
            Open detail
          </Link>
          <Link className="button button-secondary" href={`/activate/${manifest.slug}`}>
            Open activation
          </Link>
        </div>
      </article>

      <div className="info-stack">
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
        <div>
          <span>Latest activation</span>
          <strong>{latestActivationId ?? "Will persist on demand"}</strong>
        </div>
        <div>
          <span>Latest execution request</span>
          <strong>{executionRequest?.executionRequestId ?? "No execution request loaded"}</strong>
        </div>
      </div>

      <div className="panel-list">
        <span className="section-kicker">Portfolio implications and target weights</span>
        <ul>
          {exactWeights.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="panel-list">
        <span className="section-kicker">Signature boundary</span>
        <ul>
          <li>
            {executionRequest?.fundingAssetSymbol ?? "USDC"} funding asset at $
            {latestRequestedNotionalUsd.toFixed(2)} requested notional.
          </li>
          <li>
            Manual signer{" "}
            {executionRequest?.manualSignerAddress ??
              walletState.manualSignerAddress ??
              "not ready"}{" "}
            remains the required EIP-712 signer.
          </li>
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

      {snapshot.liveBoundary ? (
        <div className="info-stack">
          <div>
            <span>Current live boundary</span>
            <strong>{snapshot.liveBoundary}</strong>
          </div>
        </div>
      ) : null}

      {signatureInputs.length > 0 ? (
        <div className="panel-list">
          <span className="section-kicker">Queued signature payloads</span>
          <ul>
            {signatureInputs.slice(0, 3).map((input) => (
              <li key={input.legId}>
                {input.assetSymbol} · {input.primaryType ?? "typed data"} ·{" "}
                {input.orderHash ?? "pending order hash"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.warnings.length > 0 ? (
        <div className="panel-list">
          <span className="section-kicker">Warnings</span>
          <ul>
            {snapshot.warnings.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {statusMessage ? (
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
      ) : null}
    </section>
  );
}
