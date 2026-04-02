import { redirect } from "next/navigation";

import { getComparisonWorkspaceDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function DetailIndexPage() {
  const { chrome } = await getComparisonWorkspaceDataAsync();
  redirect(`/workspace/detail/${chrome.selectedManifest.slug}`);
}
