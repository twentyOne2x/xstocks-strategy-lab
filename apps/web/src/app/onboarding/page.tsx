import { Suspense } from "react";

import { OnboardingTerminalExperience } from "@/components/onboarding-terminal-experience";
import { getOnboardingQuestionFlowDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const data = await getOnboardingQuestionFlowDataAsync();

  return (
    <Suspense>
      <OnboardingTerminalExperience {...data} />
    </Suspense>
  );
}
