"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  BlotterData,
  OnboardingProfile,
  OnboardingQuestion,
  PromotedManifest,
  PublicStrategyCardData,
  QualificationFlowResult,
  StrategyRecommendation,
} from "@/lib/contracts";
import {
  getRecommendationExplanationBundle,
  isDirectionalPreviewOnly,
} from "@/lib/portfolio-ui";
import { formatCurrency, formatPercent, getWorkspaceSpotlightData } from "@/lib/data-source";
import { getManifestExplanationBundle } from "@/lib/portfolio-ui";

export function OnboardingQuestionFlow({
  answers,
  onAnswer,
  onBack,
  onReset,
  onFastPath,
  questions,
  recommendation,
  allAnswered,
  recommendedManifest,
  blotter,
  previewStatus,
}: {
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  onBack: () => void;
  onReset: () => void;
  onFastPath?: () => void;
  questions: OnboardingQuestion[];
  profile: OnboardingProfile;
  recommendation: StrategyRecommendation;
  allAnswered: boolean;
  recommendedManifest: PromotedManifest;
  recommendedStrategy: PublicStrategyCardData;
  qualification: QualificationFlowResult;
  blotter?: BlotterData;
  previewStatus?: {
    tone: "loading" | "error";
    message: string;
    onRetry?: () => void;
  } | null;
}) {
  const primaryQuestions = questions.filter((q) => !q.conditional);
  const answeredPrimaryCount = primaryQuestions.filter((q) => answers[q.id] !== undefined).length;

  if (allAnswered) {
    return <PostQuestionnaireWorkspace
      recommendation={recommendation}
      manifest={recommendedManifest}
      blotter={blotter}
      onReset={onReset}
      previewStatus={previewStatus}
    />;
  }

  const currentPrimary = primaryQuestions.find((q) => answers[q.id] === undefined);
  if (!currentPrimary) return null;

  const previousPrimaryIndex = primaryQuestions.indexOf(currentPrimary) - 1;
  const previousPrimary = previousPrimaryIndex >= 0 ? primaryQuestions[previousPrimaryIndex] : null;
  const previousAnswer = previousPrimary ? answers[previousPrimary.id] : undefined;

  const pendingConditional = previousPrimary ? questions.find(
    (q) =>
      q.conditional &&
      q.triggeredByQuestionId === previousPrimary.id &&
      q.triggeredByOptionIds?.includes(previousAnswer ?? "") &&
      answers[q.id] === undefined,
  ) : null;

  const questionToShow = pendingConditional ?? currentPrimary;
  const isPrimary = !questionToShow.conditional;
  const displayStep = isPrimary ? answeredPrimaryCount + 1 : answeredPrimaryCount;

  const selectedChips: string[] = [];
  for (const q of questions) {
    const ans = answers[q.id];
    if (ans) {
      const opt = q.options.find((o) => o.id === ans);
      if (opt) selectedChips.push(opt.label);
    }
  }

  return (
    <div className="onboarding-flow">
      <div className="onboarding-progress">
        <div className="onboarding-progress-meta">
          <span className="section-kicker">
            {displayStep} of {primaryQuestions.length}
          </span>
          {answeredPrimaryCount >= 3 && (
            <span className="section-kicker">{recommendation.title}</span>
          )}
        </div>
        <div className="progress-track">
          <span style={{ width: `${(answeredPrimaryCount / primaryQuestions.length) * 100}%` }} />
        </div>
        {selectedChips.length > 0 && (
          <div className="onboarding-chip-row">
            {selectedChips.map((chip) => (
              <span className="onboarding-chip onboarding-chip-selected" key={chip}>{chip}</span>
            ))}
          </div>
        )}
      </div>

      <div className="onboarding-flow-question">
        <h2>{questionToShow.prompt}</h2>
        <p>{questionToShow.helper}</p>
        <div className="onboarding-option-grid">
          {questionToShow.options.map((option) => (
            <button
              className="onboarding-option"
              key={option.id}
              onClick={() => onAnswer(questionToShow.id, option.id)}
              type="button"
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-back-row">
        <button className="button button-ghost" onClick={onBack} type="button">Back</button>
        <button className="button button-ghost" onClick={onReset} type="button">Start over</button>
        {onFastPath && answeredPrimaryCount <= 1 && (
          <button className="button button-ghost" onClick={onFastPath} type="button">
            Skip — pick for me
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Post-questionnaire workspace
   Full simulated product view with guided tour
   ──────────────────────────────────────────────────────── */

const tourSteps = [
  {
    id: "welcome",
    title: "This is your portfolio preview",
    body: "Based on your answers, we matched you to a portfolio. Everything you see here is a simulation — no money has moved, and nothing executes until you say so.",
  },
  {
    id: "holdings",
    title: "Your holdings",
    body: "These are the assets in your portfolio, with their target weights. The portfolio is built from tokenized equities that trade on Ethereum.",
  },
  {
    id: "intelligence",
    title: "Market intelligence",
    body: "This panel shows what is driving the portfolio right now — market conditions, confidence level, and recent changes that affect your holdings.",
  },
  {
    id: "activity",
    title: "Preview activity",
    body: "This section shows simulated transactions and position changes. Once you deposit, these become real. Until then, it is preview data only.",
  },
  {
    id: "activate",
    title: "When you are ready",
    body: "Connect your wallet, deposit USDC, and the portfolio activates. You approve every rebalance before it runs. Pause or turn off at any time.",
  },
];

function buildChartPath(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function PostQuestionnaireWorkspace({
  recommendation,
  manifest,
  blotter,
  onReset,
  previewStatus,
}: {
  recommendation: StrategyRecommendation;
  manifest: PromotedManifest;
  blotter?: BlotterData;
  onReset: () => void;
  previewStatus?: {
    tone: "loading" | "error";
    message: string;
    onRetry?: () => void;
  } | null;
}) {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(false);

  const bundle = getRecommendationExplanationBundle(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);

  if (!showWorkspace) {
    return (
      <RecommendationGate
        recommendation={recommendation}
        manifest={manifest}
        bundle={bundle}
        directionalPreviewOnly={directionalPreviewOnly}
        onEnterWorkspace={() => setShowWorkspace(true)}
        onReset={onReset}
        previewStatus={previewStatus}
      />
    );
  }

  return (
    <SimulatedWorkspace
      manifest={manifest}
      blotter={blotter}
      bundle={bundle}
      directionalPreviewOnly={directionalPreviewOnly}
      recommendation={recommendation}
      onReset={onReset}
      tourStep={tourStep}
      tourDismissed={tourDismissed}
      onTourNext={() => {
        if (tourStep < tourSteps.length - 1) {
          setTourStep(tourStep + 1);
        } else {
          setTourDismissed(true);
        }
      }}
      onTourDismiss={() => setTourDismissed(true)}
      previewStatus={previewStatus}
    />
  );
}

/* ── Gate screen: recommendation summary + CTA to enter workspace ── */

function RecommendationGate({
  recommendation,
  manifest,
  bundle,
  directionalPreviewOnly,
  onEnterWorkspace,
  onReset,
  previewStatus,
}: {
  recommendation: StrategyRecommendation;
  manifest: PromotedManifest;
  bundle: { whatThisPortfolioDoes: string };
  directionalPreviewOnly: boolean;
  onEnterWorkspace: () => void;
  onReset: () => void;
  previewStatus?: {
    tone: "loading" | "error";
    message: string;
    onRetry?: () => void;
  } | null;
}) {
  const topHoldings = manifest.allocations.slice(0, 4);

  return (
    <div className="pq-gate">
      <div className="pq-gate-inner">
        <span className="landing-kicker">Your recommended portfolio</span>
        <h1 className="pq-gate-title">{recommendation.title}</h1>
        <p className="pq-gate-sub">{bundle.whatThisPortfolioDoes}</p>

        <ul className="why-recommended">
          {recommendation.why_recommended.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>

        {topHoldings.length > 0 && (
          <div className="pq-gate-holdings">
            {topHoldings.map((alloc) => (
              <div className="pq-gate-holding" key={alloc.symbol}>
                <strong>{alloc.symbol}</strong>
                <span>{alloc.targetWeight}</span>
              </div>
            ))}
            {manifest.allocations.length > 4 && (
              <span className="pq-gate-more">
                + {manifest.allocations.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="pq-gate-cta">
          <button
            className="button button-primary button-lg"
            onClick={onEnterWorkspace}
            type="button"
          >
            See my portfolio
          </button>
          <button
            className="button button-ghost"
            onClick={onReset}
            type="button"
          >
            Change answers
          </button>
        </div>

        <p className="pq-gate-note">
          {directionalPreviewOnly
            ? "Preview only. You keep full custody."
            : "This opens a simulated portfolio view. No money moves until you deposit."}
        </p>

        {previewStatus ? (
          <p className="pq-gate-note">{previewStatus.message}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ── Full simulated workspace with tour ── */

function SimulatedWorkspace({
  manifest,
  blotter,
  bundle,
  directionalPreviewOnly,
  recommendation,
  onReset,
  tourStep,
  tourDismissed,
  onTourNext,
  onTourDismiss,
  previewStatus,
}: {
  manifest: PromotedManifest;
  blotter?: BlotterData;
  bundle: { whatThisPortfolioDoes: string };
  directionalPreviewOnly: boolean;
  recommendation: StrategyRecommendation;
  onReset: () => void;
  tourStep: number;
  tourDismissed: boolean;
  onTourNext: () => void;
  onTourDismiss: () => void;
  previewStatus?: {
    tone: "loading" | "error";
    message: string;
    onRetry?: () => void;
  } | null;
}) {
  const explanationBundle = getManifestExplanationBundle(manifest);
  const spotlight = getWorkspaceSpotlightData(manifest, blotter);
  const values = spotlight.points.map((p) => p.value);
  const path = buildChartPath(values);
  const mi = manifest.market_intelligence;
  const positions = blotter?.positions ?? [];
  const activity = blotter?.activity ?? [];
  const currentTour = tourDismissed ? null : tourSteps[tourStep];

  return (
    <div className="pq-workspace">
      {/* ── Preview banner ── */}
      <div className="pq-preview-bar">
        <div className="pq-preview-bar-left">
          <span className="preview-chip">Simulation</span>
          <span>
            This is a preview of your portfolio. No money has moved.
          </span>
        </div>
        <div className="pq-preview-bar-actions">
          <Link
            className="button button-primary button-sm"
            href={`/activate/${manifest.slug}`}
          >
            {directionalPreviewOnly ? "Review preview" : "Deposit to activate"}
          </Link>
          <button
            className="button button-ghost button-sm"
            onClick={onReset}
            type="button"
          >
            Change answers
          </button>
        </div>
      </div>

      {/* ── Tour overlay ── */}
      {currentTour && (
        <div className="pq-tour-overlay">
          <div className="pq-tour-card">
            <div className="pq-tour-progress">
              {tourSteps.map((_, i) => (
                <span
                  className={`pq-tour-dot ${i === tourStep ? "pq-tour-dot-active" : ""} ${i < tourStep ? "pq-tour-dot-done" : ""}`}
                  key={i}
                />
              ))}
            </div>
            <h3>{currentTour.title}</h3>
            <p>{currentTour.body}</p>
            <div className="pq-tour-actions">
              <button
                className="button button-primary button-sm"
                onClick={onTourNext}
                type="button"
              >
                {tourStep < tourSteps.length - 1 ? "Next" : "Got it"}
              </button>
              {tourStep < tourSteps.length - 1 && (
                <button
                  className="button button-ghost button-sm"
                  onClick={onTourDismiss}
                  type="button"
                >
                  Skip tour
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main grid: workspace + right rail ── */}
      <div className="pq-grid">
        <div className="pq-main">
          {/* Portfolio summary */}
          <section className="pq-summary" data-tour="welcome">
            <div className="pq-summary-head">
              <div>
                <span className="section-kicker">Your portfolio</span>
                <h2>{recommendation.title}</h2>
                <p>{bundle.whatThisPortfolioDoes}</p>
              </div>
              <div className="pq-summary-metrics">
                <div>
                  <span>Replay return</span>
                  <strong>{formatPercent(manifest.replay.netReturnPct)}</strong>
                </div>
                <div>
                  <span>Max drawdown</span>
                  <strong>{formatPercent(manifest.replay.maxDrawdownPct)}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{mi.confidence}</strong>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="pq-chart-shell" aria-hidden="true">
              <svg className="workspace-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pqLine" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#1FD59A" />
                    <stop offset="100%" stopColor="#5FCEF0" />
                  </linearGradient>
                </defs>
                <path className="workspace-chart-fill" d={`${path} L 100 100 L 0 100 Z`} />
                <path className="workspace-chart-line" d={path} style={{ stroke: "url(#pqLine)" }} />
              </svg>
            </div>

            <div className="pq-chart-legend">
              <span className="section-kicker">Simulated $1k replay</span>
              <span>
                ${formatCurrency(manifest.replay.startingCapital)} &rarr; {formatCurrency(manifest.replay.endingCapital)}
              </span>
            </div>
          </section>

          {/* Holdings table */}
          <section className="panel-card" data-tour="holdings">
            <span className="section-kicker">Holdings</span>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Weight</th>
                    <th>Role</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.allocations.map((row) => (
                    <tr key={`${row.symbol}-${row.sleeve}`}>
                      <td>{row.symbol}</td>
                      <td>{row.targetWeight}</td>
                      <td>{row.rationale || row.sleeve}</td>
                      <td>{row.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* How it works */}
          <section className="panel-card">
            <span className="section-kicker">How this portfolio works</span>
            <div className="info-stack">
              <div>
                <span>What changes</span>
                <strong>{explanationBundle.howItChanges}</strong>
              </div>
              <div>
                <span>What triggers a refresh</span>
                <strong>{explanationBundle.whatWouldTriggerNextRebalance}</strong>
              </div>
              <div>
                <span>Rebalancing</span>
                <strong>Requires your approval before any trade executes</strong>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right rail: market intelligence ── */}
        <aside className="pq-rail" data-tour="intelligence">
          <section className="pq-rail-card">
            <span className="section-kicker">Market intelligence</span>
            <h3>{mi.currentView}</h3>

            <div className="pq-mi-metrics">
              <div>
                <span>Confidence</span>
                <strong>{mi.confidence}</strong>
              </div>
              <div>
                <span>Horizon</span>
                <strong>{mi.horizon}</strong>
              </div>
            </div>

            <p className="panel-note">{mi.implication}</p>
          </section>

          <section className="pq-rail-card">
            <span className="section-kicker">What changed</span>
            <ul className="pq-changes-list">
              {mi.whatChanged.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </section>

          <section className="pq-rail-card">
            <span className="section-kicker">Market drivers</span>
            <div className="pq-drivers">
              {mi.drivers.map((driver) => (
                <div className="pq-driver" key={driver.label}>
                  <span className={`pq-driver-dot pq-driver-dot-${driver.tone}`} />
                  <div>
                    <strong>{driver.label}</strong>
                    <span>{driver.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pq-rail-card" data-tour="activate">
            <span className="section-kicker">Next step</span>
            <p className="panel-note">
              {directionalPreviewOnly
                ? "This directional position stays in preview. You keep full custody."
                : "When you are ready, connect your wallet and deposit USDC. You approve every rebalance."}
            </p>
            <Link
              className="button button-primary"
              href={`/activate/${manifest.slug}`}
              style={{ width: "100%" }}
            >
              {directionalPreviewOnly ? "Review preview" : "Deposit to activate"}
            </Link>
            <Link
              className="button button-ghost"
              href={`/workspace/detail/${manifest.slug}`}
              style={{ width: "100%" }}
            >
              View full detail
            </Link>
          </section>
        </aside>
      </div>

      {/* ── Bottom: preview activity ── */}
      <section className="pq-activity" data-tour="activity">
        <div className="pq-activity-header">
          <div>
            <span className="section-kicker">Preview activity</span>
            <p className="panel-note">
              Simulated positions and events. These become real after you deposit.
            </p>
          </div>
          <span className="preview-chip">Simulation</span>
        </div>

        <div className="pq-activity-grid">
          {/* Positions */}
          <div className="pq-activity-col">
            <span className="section-kicker">Positions</span>
            {positions.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Exposure</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.slice(0, 6).map((row) => (
                      <tr key={row.id}>
                        <td>{row.symbol}</td>
                        <td>{row.exposureUsd}</td>
                        <td>
                          <span className={`status-pill status-pill-${row.state}`}>
                            {row.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="panel-note">Positions appear after deposit.</p>
            )}
          </div>

          {/* Recent events */}
          <div className="pq-activity-col">
            <span className="section-kicker">Recent events</span>
            {activity.length > 0 ? (
              <div className="pq-events">
                {activity.slice(0, 4).map((event) => (
                  <div className="pq-event" key={event.id}>
                    <div className="pq-event-meta">
                      <span className="pq-event-time">{event.time}</span>
                      <span className={`status-pill status-pill-${event.state}`}>
                        {event.state.replaceAll("_", " ")}
                      </span>
                    </div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="panel-note">Activity appears after deposit.</p>
            )}
          </div>
        </div>
      </section>

      {previewStatus ? (
        <p className="panel-note" style={{ padding: "0 16px", textAlign: "center" }}>
          {previewStatus.message}
        </p>
      ) : null}
    </div>
  );
}
