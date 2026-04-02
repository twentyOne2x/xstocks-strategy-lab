import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workflows, executions } from "../db/schema.js";
import type { WorkflowNode } from "@xstocks/workflow-shared";
import { executeWorkflow } from "./executor.js";

const POLL_INTERVAL = 30_000; // 30 seconds
const COOLDOWN = 60_000; // 1 minute between triggers for same workflow

// Trigger types that support polling
const POLLABLE_TRIGGERS = new Set(["polymarket", "price-alert", "balance"]);

// Track last trigger time per workflow to prevent rapid re-triggering
const lastTriggered = new Map<string, number>();

let intervalId: ReturnType<typeof setInterval> | null = null;

async function checkTrigger(
  triggerNode: WorkflowNode
): Promise<{ triggered: boolean; output: Record<string, unknown> } | null> {
  try {
    const mod = await import(`./handlers/${triggerNode.definitionId}.js`);
    const result = await mod.execute(triggerNode.config ?? {}, {});
    return {
      triggered: result.output.triggered === true,
      output: result.output,
    };
  } catch (err) {
    console.error(`[Scheduler] Handler error for ${triggerNode.definitionId}:`, err);
    return null;
  }
}

async function tick() {
  try {
    const activeWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.isActive, true));

    for (const wf of activeWorkflows) {
      const nodes = JSON.parse(wf.nodes) as WorkflowNode[];
      const triggerNode = nodes.find(
        (n) => n.role === "trigger" && POLLABLE_TRIGGERS.has(n.definitionId)
      );

      if (!triggerNode) continue;

      // Cooldown check
      const lastTime = lastTriggered.get(wf.id) ?? 0;
      if (Date.now() - lastTime < COOLDOWN) continue;

      const result = await checkTrigger(triggerNode);
      if (!result || !result.triggered) continue;

      console.log(`[Scheduler] Triggered workflow "${wf.name}" (${wf.id})`);
      lastTriggered.set(wf.id, Date.now());

      // Create execution and run
      const now = new Date().toISOString();
      const steps = nodes.map((n) => ({
        nodeId: n.id,
        status: "pending",
        startedAt: undefined,
        completedAt: undefined,
        input: undefined,
        output: undefined,
        error: undefined,
      }));

      const execution = {
        id: crypto.randomUUID(),
        workflowId: wf.id,
        status: "running" as const,
        triggeredAt: now,
        completedAt: null as string | null,
        steps: JSON.stringify(steps),
      };

      await db.insert(executions).values(execution);

      executeWorkflow(execution.id, wf.id).catch((err) => {
        console.error(`[Scheduler] Execution error for ${wf.id}:`, err);
        db.update(executions)
          .set({ status: "failed", completedAt: new Date().toISOString() })
          .where(eq(executions.id, execution.id))
          .catch(console.error);
      });
    }
  } catch (err) {
    console.error("[Scheduler] Tick error:", err);
  }
}

export function startScheduler() {
  if (intervalId) return;
  console.log(`[Scheduler] Started — polling every ${POLL_INTERVAL / 1000}s`);
  intervalId = setInterval(tick, POLL_INTERVAL);
  // Run first check after a short delay
  setTimeout(tick, 5000);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Scheduler] Stopped");
  }
}
