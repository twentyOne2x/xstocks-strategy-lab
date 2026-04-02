"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type {
  OnboardingQuestion,
  PublicStrategyCardData,
  TerminalChromeProps,
} from "@/lib/contracts";
import {
  getTerminalChrome,
  getTerminalChromeAsync,
} from "@/lib/data-source";
import {
  buildOnboardingProfile,
  buildQualificationFlowResult,
  buildStrategyRecommendation,
  buildStrategyRecommendationForMode,
  recommendStrategyFromAnswers,
} from "@/lib/shared-contract-adapter";
import {
  recordXStocksQualification,
  type XStocksQualificationReadData,
} from "@/lib/funnel-tracking";

import { OnboardingQuestionFlow } from "@/components/onboarding-question-flow";
import { BrandLockup } from "@/components/home-terminal";
import { XStocksFunnelStageTracker } from "@/components/xstocks-funnel-stage-tracker";
import Link from "next/link";

function AppHeader() {
  return (
    <header className="landing-header" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div className="landing-header-inner">
        <Link className="landing-header-brand" href="/">
          <BrandLockup size="sm" />
        </Link>
        <nav className="landing-header-nav">
          <Link className="landing-header-link" href="/">Home</Link>
          <Link className="landing-header-cta" href="/onboarding">
            Find my portfolio
          </Link>
        </nav>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand-block">
          <BrandLockup size="md" />
          <span className="landing-footer-powered">Powered by xStocks</span>
        </div>
        <div className="landing-footer-col">
          <strong>Infrastructure</strong>
          <a href="https://xstocks.fi" target="_blank" rel="noopener noreferrer">xStocks</a>
          <a href="https://privy.io" target="_blank" rel="noopener noreferrer">Privy</a>
          <a href="https://cow.fi" target="_blank" rel="noopener noreferrer">CoW Protocol</a>
          <a href="https://chain.link" target="_blank" rel="noopener noreferrer">Chainlink CRE</a>
        </div>
        <div className="landing-footer-col">
          <strong>Open Source</strong>
          <a href="https://github.com/twentyOne2x/xstocks-strategy-lab" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

function isKnownStrategySlotId(
  slotId: string | null | undefined,
): slotId is
  | "onboarding.default_basket"
  | "onboarding.alt_basket_1"
  | "onboarding.alt_basket_2"
  | "advanced.default_directional" {
  return (
    slotId === "onboarding.default_basket" ||
    slotId === "onboarding.alt_basket_1" ||
    slotId === "onboarding.alt_basket_2" ||
    slotId === "advanced.default_directional"
  );
}

export function OnboardingTerminalExperience({
  questions,
  recommendedStrategies,
  portfolioId,
}: {
  questions: OnboardingQuestion[];
  recommendedStrategies: PublicStrategyCardData[];
  portfolioId?: string;
  }) {
    const searchParams = useSearchParams();
    const hasPortfolioId = !!portfolioId || (searchParams?.has("p") ?? false);
    const fastDefaults: Record<string, string> = {
      q_goal_preference: "broad_exposure",
      q_expression_preference: "simple",
      q_risk_level: "medium",
      q_rebalance_preference: "scheduled",
      q_directional_appetite: "long_only",
      q_automation_comfort: "medium",
      q_certainty: "low",
    };
    const [answers, setAnswers] = useState<Record<string, string>>(() => hasPortfolioId ? fastDefaults : {});
    const [started, setStarted] = useState(() => hasPortfolioId || (searchParams?.has("preset") ?? false));
  const [apiChrome, setApiChrome] = useState<TerminalChromeProps | null>(null);
  const [apiQualification, setApiQualification] = useState<XStocksQualificationReadData | null>(null);
  const [apiPreviewError, setApiPreviewError] = useState<string | null>(null);
  const [apiPreviewLoading, setApiPreviewLoading] = useState(false);
  const [previewReloadKey] = useState(0);
  const qualificationTrackedRef = useRef<string | null>(null);

  const profile = buildOnboardingProfile(answers);
  const localRecommendation = buildStrategyRecommendation(profile);
  const localRecommendedStrategy = recommendStrategyFromAnswers({
    answers,
    questions,
    recommendedStrategies,
  });
  const apiQualifiedSlotId = apiQualification?.qualification?.selection?.slotId;
  const effectiveSlotId = isKnownStrategySlotId(apiQualifiedSlotId)
    ? apiQualifiedSlotId
    : localRecommendedStrategy.slotId;
  const recommendation = isKnownStrategySlotId(apiQualifiedSlotId)
    ? buildStrategyRecommendationForMode(profile, apiQualifiedSlotId)
    : localRecommendation;
  const fallbackChrome =
    getTerminalChrome("onboarding", effectiveSlotId) satisfies TerminalChromeProps;
  const recommendedManifest = apiChrome?.selectedManifest ?? fallbackChrome.selectedManifest;
  const recommendedStrategy =
    recommendedStrategies.find(
      (strategy) => strategy.slotId === recommendedManifest.slot_id,
    ) ?? localRecommendedStrategy;

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
      setApiQualification(null);
      setApiChrome(null);
      setApiPreviewError(null);
      setApiPreviewLoading(false);
      return () => {
        active = false;
      };
    }

    setApiChrome(null);
    setApiPreviewLoading(true);
    setApiPreviewError(null);

    getTerminalChromeAsync("onboarding", effectiveSlotId, {
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
  }, [allPrimaryAnswered, effectiveSlotId, previewReloadKey]);

  useEffect(() => {
    if (!allPrimaryAnswered) {
      return;
    }

    const answersSignature = JSON.stringify(answers);

    if (qualificationTrackedRef.current === answersSignature) {
      return;
    }

    qualificationTrackedRef.current = answersSignature;
    void recordXStocksQualification({
      questionAnswers: answers,
    })
      .then((result) => {
        if (qualificationTrackedRef.current !== answersSignature) {
          return;
        }
        setApiQualification(result);
      })
      .catch(() => {
        if (qualificationTrackedRef.current !== answersSignature) {
          return;
        }
        qualificationTrackedRef.current = null;
        setApiQualification(null);
      });
  }, [allPrimaryAnswered, answers]);

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
    qualificationTrackedRef.current = null;
    setApiQualification(null);
    setAnswers({});
    setStarted(false);
  }

  function handleFastPath() {
    // Set all primary questions to safe defaults that resolve to the starter portfolio
    const defaults: Record<string, string> = {
      q_goal_preference: "broad_exposure",
      q_expression_preference: "simple",
      q_risk_level: "medium",
      q_rebalance_preference: "scheduled",
      q_directional_appetite: "long_only",
      q_automation_comfort: "medium",
      q_certainty: "low",
    };
    setAnswers(defaults);
    setStarted(true);
  }

  // Entry screen — bigger, more visual
  if (!started) {
    return (
      <div className="onboarding-entry">
        <div className="onboarding-entry-card">
          <h1>Build your portfolio.</h1>
          <p>7 questions. Under a minute. Preview everything before you fund.</p>
          <div className="ob-entry-cta-row">
            <button className="button button-primary button-xl" onClick={() => setStarted(true)} type="button">
              Answer 7 questions
            </button>
            <button className="button button-ghost button-lg" onClick={handleFastPath} type="button">
              Pick for me
            </button>
          </div>
          <div className="ob-entry-infra">
            <span>xStocks</span>
            <span>Privy</span>
            <span>CoW</span>
            <span>1inch</span>
            <span>Chainlink</span>
          </div>
        </div>
      </div>
    );
  }

  // Question flow (full screen, no terminal shell)
  if (!allPrimaryAnswered) {
    return (
      <>
        <XStocksFunnelStageTracker stage="onboarding_started" />
        <OnboardingQuestionFlow
          answers={answers}
          onAnswer={handleAnswer}
          onBack={handleBack}
          onReset={handleReset}
          onFastPath={handleFastPath}
          questions={questions}
          profile={profile}
          recommendation={recommendation}
          allAnswered={false}
          recommendedManifest={recommendedManifest}
          recommendedStrategy={recommendedStrategy}
          qualification={qualification}
        />
      </>
    );
  }

  return (
    <>
      <XStocksFunnelStageTracker stage="onboarding_started" />
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
          apiPreviewLoading && !apiChrome && !apiPreviewError
            ? {
                tone: "loading" as const,
                message: "Loading live data...",
              }
            : null
        }
      />
    </>
  );
}
