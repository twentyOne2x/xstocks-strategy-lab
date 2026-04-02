import { redirect } from "next/navigation";

import { getComparisonWorkspaceDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function ActivateIndexPage() {
  const { chrome } = await getComparisonWorkspaceDataAsync();
  redirect(`/activate/${chrome.selectedManifest.slug}`);
}
