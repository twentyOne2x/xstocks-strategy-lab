"use client";

import Link from "next/link";

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

export function OnboardingQuestionFlow({
  answers,
  onAnswer,
  onBack,
  onReset,
  questions,
  recommendation,
  allAnswered,
  recommendedManifest,
  previewStatus,
}: {
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  onBack: () => void;
  onReset: () => void;
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
    return <RecommendationResult
      recommendation={recommendation}
      manifest={recommendedManifest}
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
      </div>
    </div>
  );
}

function RecommendationResult({
  recommendation,
  manifest,
  onReset,
  previewStatus,
}: {
  recommendation: StrategyRecommendation;
  manifest: PromotedManifest;
  onReset: () => void;
  previewStatus?: {
    tone: "loading" | "error";
    message: string;
    onRetry?: () => void;
  } | null;
}) {
  const bundle = getRecommendationExplanationBundle(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);
  const topHoldings = manifest.allocations.slice(0, 5);

  return (
    <div className="onboarding-entry">
      <div className="onboarding-entry-card" style={{ maxWidth: 560, gap: 20, textAlign: "left" }}>
        <span className="section-kicker">Your portfolio</span>
        <h1 style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)" }}>{recommendation.title}</h1>
        <p>{bundle.whatThisPortfolioDoes}</p>

        <ul className="why-recommended">
          {recommendation.why_recommended.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>

        {topHoldings.length > 0 && (
          <div className="allocation-stack">
            {topHoldings.map((alloc) => (
              <div className="allocation-row" key={alloc.symbol}>
                <strong>{alloc.symbol}</strong>
                <span>{alloc.targetWeight}</span>
              </div>
            ))}
            {manifest.allocations.length > 5 && (
              <p className="panel-note">+ {manifest.allocations.length - 5} more holdings</p>
            )}
          </div>
        )}

        <div className="action-stack action-stack-inline">
          <Link className="button button-primary" href={`/workspace/detail/${manifest.slug}`}>
            See full portfolio
          </Link>
          {!directionalPreviewOnly && (
            <Link className="button button-secondary" href={`/activate/${manifest.slug}`}>
              {recommendation.deposit_cta.primary_label}
            </Link>
          )}
          <button className="button button-ghost" onClick={onReset} type="button">
            Change answers
          </button>
        </div>

        <p className="panel-note">
          {directionalPreviewOnly
            ? "Preview only. You keep full custody."
            : "You keep your assets. Preview everything before you deposit."}
        </p>

        {previewStatus ? (
          <p className="panel-note">{previewStatus.message}</p>
        ) : null}
      </div>
    </div>
  );
}
