import { notFound } from "next/navigation";

import { DetailScreen } from "@/components/detail-screen";
import { TerminalShell } from "@/components/terminal-shell";
import { getDetailScreenDataAsync, getPromotedManifest } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ manifestSlug: string }>;
}) {
  const { manifestSlug } = await params;
  const manifest = getPromotedManifest(manifestSlug);

  if (!manifest) {
    notFound();
  }

  const { props, chrome } = await getDetailScreenDataAsync(manifestSlug);

  return (
    <TerminalShell {...chrome}>
      <DetailScreen {...props} />
    </TerminalShell>
  );
}
