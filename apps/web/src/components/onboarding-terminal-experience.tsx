"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  OnboardingQuestion,
  PublicStrategyCardData,
  TerminalChromeProps,
} from "@/lib/contracts";
import {
  getFeaturedManifest,
  getPromotedManifest,
  getTerminalChrome,
  getTerminalChromeAsync,
} from "@/lib/data-source";
import {
  buildOnboardingProfile,
  buildQualificationFlowResult,
  buildStrategyRecommendation,
  recommendStrategyFromAnswers,
} from "@/lib/shared-contract-adapter";

import { OnboardingQuestionFlow } from "@/components/onboarding-question-flow";

export function OnboardingTerminalExperience({
  questions,
  recommendedStrategies,
}: {
  questions: OnboardingQuestion[];
  recommendedStrategies: PublicStrategyCardData[];
  }) {
    const searchParams = useSearchParams();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [started, setStarted] = useState(() => searchParams?.has("preset") ?? false);
  const [apiChrome, setApiChrome] = useState<TerminalChromeProps | null>(null);
  const [apiPreviewError, setApiPreviewError] = useState<string | null>(null);
  const [apiPreviewLoading, setApiPreviewLoading] = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);

  const profile = buildOnboardingProfile(answers);
  const recommendation = buildStrategyRecommendation(profile);

  const recommendedStrategy = recommendStrategyFromAnswers({
    answers,
    questions,
    recommendedStrategies,
  });
  const recommendedManifest =
    getPromotedManifest(recommendedStrategy.manifestSlug) ?? getFeaturedManifest();
  const fallbackChrome = {
    ...getTerminalChrome("onboarding", recommendedManifest.slot_id),
    selectedManifest: recommendedManifest,
  } satisfies TerminalChromeProps;

  const qualification = buildQualificationFlowResult({
    answers,
    questions,
    recommendedStrategy,
    manifest: recommendedManifest,
  });

  // Count answered primary questions to determine if all done
  const primaryQuestions = questions.filter((q) => !q.conditional);
  const answeredPrimary = primaryQuestions.filter((q) => answers[q.id] !== undefined);
  const allPrimaryAnswered = answeredPrimary.length >= primaryQuestions.length;

  useEffect(() => {
    let active = true;

    if (!allPrimaryAnswered) {
      setApiChrome(null);
      setApiPreviewError(null);
      setApiPreviewLoading(false);
      return () => {
        active = false;
      };
    }

    setApiPreviewLoading(true);
    setApiPreviewError(null);

    getTerminalChromeAsync("onboarding", recommendedManifest.slot_id, {
      allowMockFallback: false,
    })
      .then((chrome) => {
        if (!active) return;
        setApiChrome(chrome);
      })
      .catch((error) => {
        if (!active) return;
        setApiChrome(null);
        setApiPreviewError(
          error instanceof Error
            ? error.message
            : "API-backed preview failed to load.",
        );
      })
      .finally(() => {
        if (!active) return;
        setApiPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allPrimaryAnswered, previewReloadKey, recommendedManifest.slot_id]);

  function handleAnswer(questionId: string, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  }

  function handleBack() {
    const questionOrder = questions.map((q) => q.id);
    const answeredIds = questionOrder.filter((id) => answers[id] !== undefined);
    if (answeredIds.length === 0) {
      setStarted(false);
      return;
    }
    const lastId = answeredIds[answeredIds.length - 1];
    setAnswers((current) => {
      const next = { ...current };
      delete next[lastId];
      return next;
    });
  }

  function handleReset() {
    setAnswers({});
    setStarted(false);
  }

  // Entry screen
  if (!started) {
    return (
      <div className="onboarding-entry">
        <div className="onboarding-entry-card">
          <div className="onboarding-entry-kicker">
            <span>Equity Terminal</span>
          </div>
          <h1>A few questions, then your portfolio.</h1>
          <p>We match you to a portfolio of tokenized equities. Preview every holding before you commit anything.</p>
          <button
            className="onboarding-entry-cta"
            onClick={() => setStarted(true)}
            type="button"
          >
            See my portfolio
          </button>
          <div className="onboarding-entry-proof">
            <span>7 questions</span>
            <span className="onboarding-entry-dot" />
            <span>Under 60 seconds</span>
            <span className="onboarding-entry-dot" />
            <span>Preview before deposit</span>
          </div>
        </div>
      </div>
    );
  }

  // Question flow (full screen, no terminal shell)
  if (!allPrimaryAnswered) {
    return (
      <OnboardingQuestionFlow
        answers={answers}
        onAnswer={handleAnswer}
        onBack={handleBack}
        onReset={handleReset}
        questions={questions}
        profile={profile}
        recommendation={recommendation}
        allAnswered={false}
        recommendedManifest={recommendedManifest}
        recommendedStrategy={recommendedStrategy}
        qualification={qualification}
      />
    );
  }

  return (
    <OnboardingQuestionFlow
      answers={answers}
      onAnswer={handleAnswer}
      onBack={handleBack}
      onReset={handleReset}
      questions={questions}
      profile={profile}
      recommendation={recommendation}
      allAnswered={true}
      recommendedManifest={apiChrome?.selectedManifest ?? fallbackChrome.selectedManifest}
      recommendedStrategy={recommendedStrategy}
      qualification={qualification}
      blotter={apiChrome?.blotter ?? fallbackChrome.blotter}
      previewStatus={
        apiPreviewError
          ? {
              tone: "error",
              message: `${apiPreviewError} Showing the local preview for now.`,
              onRetry: () => setPreviewReloadKey((current) => current + 1),
            }
          : apiPreviewLoading || !apiChrome
            ? {
                tone: "loading",
                message: "Loading live holdings and activity in the background.",
              }
            : null
      }
    />
  );
}
