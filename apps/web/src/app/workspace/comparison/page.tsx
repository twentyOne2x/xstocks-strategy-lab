import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { TerminalShell } from "@/components/terminal-shell";
import { getComparisonWorkspaceDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function ComparisonPage() {
  const { props, chrome } = await getComparisonWorkspaceDataAsync();

  return (
    <TerminalShell {...chrome}>
      <ComparisonWorkspace {...props} />
    </TerminalShell>
  );
}
