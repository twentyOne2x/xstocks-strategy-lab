import { notFound } from "next/navigation";

import { DetailScreen } from "@/components/detail-screen";
import { TerminalShell } from "@/components/terminal-shell";
import { getDetailScreenDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ manifestSlug: string }>;
}) {
  const { manifestSlug } = await params;
  let data;

  try {
    data = await getDetailScreenDataAsync(manifestSlug);
  } catch {
    notFound();
  }

  return (
    <TerminalShell {...data.chrome}>
      <DetailScreen {...data.props} />
    </TerminalShell>
  );
}
