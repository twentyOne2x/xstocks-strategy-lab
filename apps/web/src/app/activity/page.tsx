import { ActivityWorkspace } from "@/components/activity-workspace";
import { TerminalShell } from "@/components/terminal-shell";
import { getActivityWorkspaceDataAsync } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { props, chrome } = await getActivityWorkspaceDataAsync();

  return (
    <TerminalShell {...chrome}>
      <ActivityWorkspace {...props} />
    </TerminalShell>
  );
}
