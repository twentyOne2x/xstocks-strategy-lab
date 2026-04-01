"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
import { getAssetHref, getCleanRationale, getVenueDisplay } from "@/lib/holdings-display";

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

  return (
    <div className="onboarding-flow">
      <div className="onboarding-progress">
        <div className="onboarding-progress-meta">
          <span className="section-kicker">
            {displayStep} of {primaryQuestions.length}
          </span>
          {onFastPath && answeredPrimaryCount <= 1 && (
            <button className="ob-skip-btn" onClick={onFastPath} type="button">
              Skip — pick for me
            </button>
          )}
        </div>
        <div className="progress-track">
          <span style={{ width: `${(answeredPrimaryCount / primaryQuestions.length) * 100}%` }} />
        </div>
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
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Post-questionnaire workspace
   ──────────────────────────────────────────────────────── */

const tourSteps = [
  { id: "welcome", label: "Portfolio summary", caption: "Your matched portfolio with simulated replay performance", anchor: "pq-summary" },
  { id: "holdings", label: "Holdings", caption: "The specific assets, weights, and venues in your portfolio", anchor: "pq-holdings" },
  { id: "intelligence", label: "Market signals", caption: "What is driving the portfolio right now and recent changes", anchor: "pq-rail" },
  { id: "activity", label: "Activity", caption: "Simulated positions and events — real after you deposit", anchor: "pq-activity-section" },
  { id: "activate", label: "Deposit", caption: "Fund your wallet to activate — $10 minimum, pause anytime", anchor: "pq-deposit-cta" },
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
  const [phase, setPhase] = useState<"analysis" | "gate" | "workspace">("analysis");
  const [tourStep, setTourStep] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(false);

  const bundle = getRecommendationExplanationBundle(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);

  if (phase === "analysis") {
    return (
      <AnalysisTransition
        recommendation={recommendation}
        manifest={manifest}
        onComplete={() => setPhase("gate")}
      />
    );
  }

  if (phase === "gate") {
    return (
      <RecommendationGate
        recommendation={recommendation}
        manifest={manifest}
        bundle={bundle}
        directionalPreviewOnly={directionalPreviewOnly}
        onEnterWorkspace={() => setPhase("workspace")}
        onReset={onReset}
        previewStatus={previewStatus}
      />
    );
  }

  return (
    <SimulatedWorkspace
      manifest={manifest}
      blotter={blotter}
      directionalPreviewOnly={directionalPreviewOnly}
      recommendation={recommendation}
      onReset={onReset}
      tourStep={tourStep}
      tourDismissed={tourDismissed}
      onTourNext={() => {
        if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
        else setTourDismissed(true);
      }}
      onTourDismiss={() => setTourDismissed(true)}
      previewStatus={previewStatus}
    />
  );
}

/* ── Analysis Transition — profile-aware staged progress ── */

function AnalysisTransition({
  recommendation,
  manifest,
  onComplete,
}: {
  recommendation: StrategyRecommendation;
  manifest: PromotedManifest;
  onComplete: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useRef(false);

  // Profile inputs that drove the match — shown alongside progress
  const profileInputs = [
    { label: "Risk", value: recommendation.risk_band },
    { label: "Stance", value: recommendation.stance.replaceAll("_", " ") },
    { label: "Activity", value: recommendation.activity_level },
    { label: "Rebalance", value: recommendation.rebalance_cadence.replaceAll("_", " ") },
  ];

  const steps = [
    { label: "Analyzing profile", detail: `${recommendation.risk_band} risk · ${recommendation.stance.replaceAll("_", " ")}` },
    { label: "Comparing candidates", detail: `${manifest.allocations.length} holdings · ${manifest.frontend.risk_label} risk` },
    { label: "Checking risk fit", detail: `Max drawdown ${formatPercent(manifest.replay.maxDrawdownPct)}` },
    { label: "Building match", detail: recommendation.title },
    { label: "Preparing preview", detail: `${formatPercent(manifest.replay.netReturnPct)} simulated return` },
  ];

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion.current) { onComplete(); return; }

    const durations = [700, 800, 700, 600, 500];
    let step = 0;
    function advance() {
      step++;
      if (step >= steps.length) { timerRef.current = setTimeout(onComplete, 400); return; }
      setActiveStep(step);
      timerRef.current = setTimeout(advance, durations[step]);
    }
    timerRef.current = setTimeout(advance, durations[0]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = steps[activeStep];
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <div className="analysis-screen">
      <div className="analysis-inner">
        <span className="landing-kicker">Evaluating fit</span>
        <h1 className="analysis-title">{current.label}</h1>
        <p className="analysis-detail">{current.detail}</p>

        <div className="analysis-progress-track">
          <div className="analysis-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Profile inputs card — shows what drove the match */}
        <div className="analysis-profile-card">
          <span className="section-kicker">Your profile</span>
          <div className="analysis-profile-grid">
            {profileInputs.map((input) => (
              <div className="analysis-profile-item" key={input.label}>
                <span>{input.label}</span>
                <strong>{input.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-steps">
          {steps.map((s, i) => (
            <div className={`analysis-step ${i < activeStep ? "analysis-step-done" : ""} ${i === activeStep ? "analysis-step-active" : ""}`} key={s.label}>
              <span className="analysis-step-dot" />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Recommendation Gate — with "Why this fits" section ── */

function RecommendationGate({
  recommendation,
  manifest,
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
  previewStatus?: { tone: "loading" | "error"; message: string; onRetry?: () => void; } | null;
}) {
  const spotlight = getWorkspaceSpotlightData(manifest);
  const values = spotlight.points.map((p) => p.value);
  const path = buildChartPath(values);

  return (
    <div className="pq-gate">
      <div className="pq-gate-inner">
        <span className="landing-kicker">Your portfolio is ready</span>
        <h1 className="pq-gate-title">{recommendation.title}</h1>

        {/* Mini replay chart */}
        <div className="pq-gate-chart" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gateLine" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#1FD59A" />
                <stop offset="100%" stopColor="#5FCEF0" />
              </linearGradient>
            </defs>
            <path className="workspace-chart-fill" d={`${path} L 100 100 L 0 100 Z`} />
            <path className="workspace-chart-line" d={path} style={{ stroke: "url(#gateLine)" }} />
          </svg>
        </div>

        {/* Stat chips */}
        <div className="pq-gate-stats">
          <div className="pq-gate-stat">
            <span>30-day return</span>
            <strong>{formatPercent(manifest.replay.netReturnPct)}</strong>
          </div>
          <div className="pq-gate-stat">
            <span>Max drawdown</span>
            <strong>{formatPercent(manifest.replay.maxDrawdownPct)}</strong>
          </div>
          <div className="pq-gate-stat">
            <span>Holdings</span>
            <strong>{manifest.allocations.length}</strong>
          </div>
          <div className="pq-gate-stat">
            <span>Risk</span>
            <strong>{manifest.frontend.risk_label}</strong>
          </div>
        </div>

        {/* Why this fits you — profile-to-portfolio mapping */}
        <div className="pq-gate-fit">
          <span className="section-kicker">Why this fits you</span>
          <div className="pq-gate-fit-grid">
            <div className="pq-gate-fit-item">
              <span>You chose</span>
              <strong>{recommendation.risk_band} risk</strong>
            </div>
            <div className="pq-gate-fit-item">
              <span>Portfolio is</span>
              <strong>{manifest.frontend.risk_label} risk · {manifest.allocations.length} names</strong>
            </div>
            <div className="pq-gate-fit-item">
              <span>Rebalance</span>
              <strong>{recommendation.rebalance_cadence.replaceAll("_", " ")}</strong>
            </div>
            <div className="pq-gate-fit-item">
              <span>Stance</span>
              <strong>{recommendation.stance.replaceAll("_", " ")}</strong>
            </div>
          </div>
        </div>

        {/* Policy chips */}
        <div className="pq-gate-chips">
          {recommendation.behavior_chips.slice(0, 4).map((chip) => (
            <span className="token-pill" key={chip}>{chip}</span>
          ))}
        </div>

        <div className="pq-gate-cta">
          <button className="button button-primary button-xl" onClick={onEnterWorkspace} type="button">
            See my portfolio
          </button>
          <button className="button button-ghost" onClick={onReset} type="button">
            Change answers
          </button>
        </div>

        <p className="pq-gate-note">
          {directionalPreviewOnly ? "Preview only. Self-custody." : "Simulation — no money moves until you deposit."}
        </p>
        {previewStatus ? <p className="pq-gate-note">{previewStatus.message}</p> : null}
      </div>
    </div>
  );
}

/* ── Simulated Workspace — with performance surface + improved tour ── */

function SimulatedWorkspace({
  manifest,
  blotter,
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
  directionalPreviewOnly: boolean;
  recommendation: StrategyRecommendation;
  onReset: () => void;
  tourStep: number;
  tourDismissed: boolean;
  onTourNext: () => void;
  onTourDismiss: () => void;
  previewStatus?: { tone: "loading" | "error"; message: string; onRetry?: () => void; } | null;
}) {
  const spotlight = getWorkspaceSpotlightData(manifest, blotter);
  const values = spotlight.points.map((p) => p.value);
  const path = buildChartPath(values);
  const mi = manifest.market_intelligence;
  const positions = blotter?.positions ?? [];
  const activity = blotter?.activity ?? [];
  const currentTour = tourDismissed ? null : tourSteps[tourStep];
  const highlightId = currentTour?.anchor ?? null;

  return (
    <div className={`pq-workspace ${currentTour ? "pq-workspace-touring" : ""}`}>
      {/* ── Preview bar with big deposit CTA ── */}
      <div className="pq-preview-bar">
        <div className="pq-preview-bar-left">
          <span className="preview-chip">Simulation</span>
          <span>Preview — no money has moved</span>
        </div>
        <div className="pq-preview-bar-actions">
          <Link className="button button-primary button-lg" href={`/activate/${manifest.slug}`} id="pq-deposit-cta">
            {directionalPreviewOnly ? "Review preview" : "Deposit $10+"}
          </Link>
          <button className="button button-ghost button-sm" onClick={onReset} type="button">
            Change answers
          </button>
        </div>
      </div>

      {/* ── Component-anchored tour with captions ── */}
      {currentTour && (
        <div className="pq-tour-bar">
          <div className="pq-tour-bar-inner">
            <div className="pq-tour-progress">
              {tourSteps.map((_, i) => (
                <span className={`pq-tour-dot ${i === tourStep ? "pq-tour-dot-active" : ""} ${i < tourStep ? "pq-tour-dot-done" : ""}`} key={i} />
              ))}
            </div>
            <div className="pq-tour-text">
              <span className="pq-tour-label">{currentTour.label}</span>
              <span className="pq-tour-caption">{currentTour.caption}</span>
            </div>
            <div className="pq-tour-actions">
              <button className="button button-primary button-sm" onClick={onTourNext} type="button">
                {tourStep < tourSteps.length - 1 ? "Next" : "Done"}
              </button>
              {tourStep < tourSteps.length - 1 && (
                <button className="button button-ghost button-sm" onClick={onTourDismiss} type="button">Skip</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Portfolio summary with performance surface ── */}
      <div className="pq-grid">
        <div className="pq-main">
          <section className={`pq-summary ${highlightId === "pq-summary" ? "pq-highlight" : ""}`} id="pq-summary">
            <div className="pq-summary-head">
              <div>
                <span className="section-kicker">Your portfolio</span>
                <h2>{recommendation.title}</h2>
              </div>
              <Link className="button button-primary button-lg" href={`/activate/${manifest.slug}`}>
                {directionalPreviewOnly ? "Preview" : "Deposit $10+"}
              </Link>
            </div>

            {/* Performance surface */}
            <div className="pq-perf-surface">
              <div className="pq-perf-value">
                <span className="section-kicker">Simulated value</span>
                <strong className="pq-perf-amount">{formatCurrency(manifest.replay.endingCapital)}</strong>
                <span className="pq-perf-change pq-perf-change-positive">
                  {formatPercent(manifest.replay.netReturnPct)}
                </span>
              </div>
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
              <div className="pq-perf-meta">
                <span>30-day simulated replay from {formatCurrency(manifest.replay.startingCapital)}</span>
                <span>Max drawdown: {formatPercent(manifest.replay.maxDrawdownPct)}</span>
              </div>
            </div>

            <div className="pq-summary-strip">
              <div><span>Holdings</span><strong>{manifest.allocations.length}</strong></div>
              <div><span>Risk</span><strong>{manifest.frontend.risk_label}</strong></div>
              <div><span>Rebalance</span><strong>Scheduled</strong></div>
              <div><span>Min deposit</span><strong>$10</strong></div>
            </div>
          </section>

          {/* How it works — concise */}
          <section className="panel-card pq-how">
            <div className="pq-how-row">
              <div><span className="section-kicker">Rebalance</span><strong>Automated via Chainlink CRE</strong></div>
              <div><span className="section-kicker">Custody</span><strong>Self-custody via Privy</strong></div>
              <div><span className="section-kicker">Execution</span><strong>CoW Protocol</strong></div>
            </div>
          </section>
        </div>

        {/* ── Right rail: market signals ── */}
        <aside className={`pq-rail ${highlightId === "pq-rail" ? "pq-highlight" : ""}`} id="pq-rail">
          <section className="pq-rail-card">
            <span className="section-kicker">Market signals</span>
            <h3>{mi.currentView}</h3>
            <span className="pq-mi-updated">Horizon: {mi.horizon}</span>
          </section>

          <section className="pq-rail-card">
            <span className="section-kicker">Drivers</span>
            <div className="pq-drivers">
              {mi.drivers.map((driver) => (
                <div className="pq-driver" key={driver.label}>
                  <span className={`pq-driver-dot pq-driver-dot-${driver.tone}`} />
                  <strong>{driver.label}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="pq-rail-card">
            <span className="section-kicker">Recent changes</span>
            <ul className="pq-changes-list">
              {mi.whatChanged.slice(0, 2).map((c) => (
                <li key={c}>{c.length > 60 ? c.slice(0, 57) + "..." : c}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* ── Holdings — full-width ── */}
      <section className={`pq-fw-section ${highlightId === "pq-holdings" ? "pq-highlight" : ""}`} id="pq-holdings">
        <div className="pq-fw-inner">
          <span className="section-kicker">Holdings · {manifest.allocations.length} assets</span>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Asset</th><th>Weight</th><th>Role</th><th>Venue</th></tr></thead>
              <tbody>
                {manifest.allocations.map((row) => {
                  const assetHref = getAssetHref(row.symbol);
                  const venue = getVenueDisplay(row.venue);
                  return (
                    <tr key={`${row.symbol}-${row.sleeve}`}>
                      <td>{assetHref ? <a className="table-link" href={assetHref} target="_blank" rel="noopener noreferrer">{row.symbol}</a> : <strong>{row.symbol}</strong>}</td>
                      <td>{row.targetWeight}</td>
                      <td>{getCleanRationale(row.rationale, row.sleeve)}</td>
                      <td>{venue.href ? <a className="table-link" href={venue.href} target="_blank" rel="noopener noreferrer">{venue.label}</a> : venue.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Activity — full-width ── */}
      <section className={`pq-fw-section pq-fw-section-alt ${highlightId === "pq-activity-section" ? "pq-highlight" : ""}`} id="pq-activity-section">
        <div className="pq-fw-inner">
          <div className="pq-activity-header">
            <span className="section-kicker">Preview activity</span>
            <span className="preview-chip">Simulation</span>
          </div>
          <div className="pq-activity-grid">
            <div className="pq-activity-col">
              <span className="section-kicker">Positions</span>
              {positions.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead><tr><th>Symbol</th><th>Exposure</th><th>State</th></tr></thead>
                    <tbody>
                      {positions.slice(0, 6).map((row) => (
                        <tr key={row.id}>
                          <td>{row.symbol}</td>
                          <td>{row.exposureUsd}</td>
                          <td><span className={`status-pill status-pill-${row.state}`}>{row.state}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="panel-note">Positions appear after deposit.</p>}
            </div>
            <div className="pq-activity-col">
              <span className="section-kicker">Events</span>
              {activity.length > 0 ? (
                <div className="pq-events">
                  {activity.slice(0, 4).map((event) => (
                    <div className="pq-event" key={event.id}>
                      <div className="pq-event-meta">
                        <span className="pq-event-time">{event.time}</span>
                        <span className={`status-pill status-pill-${event.state}`}>{event.state.replaceAll("_", " ")}</span>
                      </div>
                      <strong>{event.title}</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="panel-note">Activity appears after deposit.</p>}
            </div>
          </div>
        </div>
      </section>

      {previewStatus ? <p className="panel-note" style={{ padding: "16px", textAlign: "center" }}>{previewStatus.message}</p> : null}
    </div>
  );
}
