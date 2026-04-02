import { Suspense } from "react";
import { redirect } from "next/navigation";

import { OnboardingTerminalExperience } from "@/components/onboarding-terminal-experience";
import { getOnboardingQuestionFlowDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function OnboardingWithIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) redirect("/onboarding");

  const data = await getOnboardingQuestionFlowDataAsync();

  return (
    <Suspense>
      <OnboardingTerminalExperience {...data} portfolioId={id} />
    </Suspense>
  );
}
