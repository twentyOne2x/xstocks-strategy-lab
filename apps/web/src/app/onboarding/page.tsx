import { Suspense } from "react";

import { OnboardingTerminalExperience } from "@/components/onboarding-terminal-experience";
import { getOnboardingQuestionFlowData } from "@/lib/data-source";

export default function OnboardingPage() {
  const data = getOnboardingQuestionFlowData();

  return (
    <Suspense>
      <OnboardingTerminalExperience {...data} />
    </Suspense>
  );
}
