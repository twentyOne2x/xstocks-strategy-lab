import { notFound } from "next/navigation";

import { ActivationScreen } from "@/components/activation-screen";
import { TerminalShell } from "@/components/terminal-shell";
import { getActivationScreenDataAsync, getPromotedManifest } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function ActivationPage({
  params,
}: {
  params: Promise<{ manifestSlug: string }>;
}) {
  const { manifestSlug } = await params;
  const manifest = getPromotedManifest(manifestSlug);

  if (!manifest) {
    notFound();
  }

  const { props, chrome } = await getActivationScreenDataAsync(manifestSlug);

  return (
    <TerminalShell {...chrome}>
      <ActivationScreen {...props} />
    </TerminalShell>
  );
}
