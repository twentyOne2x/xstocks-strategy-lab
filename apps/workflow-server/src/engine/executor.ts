import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workflows, executions } from "../db/schema.js";
import type { WorkflowNode, WorkflowEdge, ExecutionStep } from "@xstocks/workflow-shared";
import { resolveExpressions } from "./resolveExpressions.js";

// Dynamically import a handler by definitionId
async function getHandler(definitionId: string) {
  try {
    const mod = await import(`./handlers/${definitionId}.js`);
    return mod as { execute: (config: Record<string, unknown>, inputs: Record<string, unknown>) => Promise<{ output: Record<string, unknown> }> };
  } catch {
    return null;
  }
}

// Kahn's algorithm topological sort
function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const result: WorkflowNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighborId of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(neighborId) ?? 1) - 1;
      inDegree.set(neighborId, deg);
      if (deg === 0) {
        const neighbor = nodes.find((n) => n.id === neighborId);
        if (neighbor) queue.push(neighbor);
      }
    }
  }

  // Append any remaining nodes (cycles / disconnected)
  for (const node of nodes) {
    if (!result.find((n) => n.id === node.id)) result.push(node);
  }

  return result;
}

export async function executeWorkflow(executionId: string, workflowId: string): Promise<void> {
  // Load workflow
  const wfRows = await db.select().from(workflows).where(eq(workflows.id, workflowId));
  const wf = wfRows[0];
  if (!wf) throw new Error("Workflow not found");

  const nodes = JSON.parse(wf.nodes) as WorkflowNode[];
  const edges = JSON.parse(wf.edges) as WorkflowEdge[];
  const sorted = topoSort(nodes, edges);

  const stepMap = new Map<string, ExecutionStep>(
    sorted.map((n) => [n.id, { nodeId: n.id, status: "pending", startedAt: undefined, completedAt: undefined, input: undefined, output: undefined, error: undefined }])
  );

  async function persistSteps() {
    await db.update(executions)
      .set({ steps: JSON.stringify(Array.from(stepMap.values())) })
      .where(eq(executions.id, executionId));
  }

  const previousOutputs: Record<string, unknown> = {};
  const nodeOutputs: Record<string, Record<string, unknown>> = {};

  for (const node of sorted) {
    const step = stepMap.get(node.id)!;
    step.status = "running";
    step.startedAt = new Date().toISOString();
    step.input = previousOutputs;
    await persistSteps();

    try {
      const handler = await getHandler(node.definitionId);
      const resolvedConfig = resolveExpressions(node.config ?? {}, nodeOutputs);
      let output: Record<string, unknown>;
      if (handler) {
        const result = await handler.execute(resolvedConfig, previousOutputs);
        output = result.output;
      } else {
        output = { skipped: true, reason: `No handler for ${node.definitionId}` };
      }
      step.status = "completed";
      step.output = output;
      step.completedAt = new Date().toISOString();
      nodeOutputs[node.id] = output;
      Object.assign(previousOutputs, output);
    } catch (err) {
      step.status = "failed";
      step.error = String(err);
      step.completedAt = new Date().toISOString();
      // Mark remaining steps as skipped
      for (const remaining of sorted) {
        const rs = stepMap.get(remaining.id)!;
        if (rs.status === "pending") rs.status = "skipped";
      }
      await persistSteps();
      await db.update(executions)
        .set({ status: "failed", completedAt: new Date().toISOString(), steps: JSON.stringify(Array.from(stepMap.values())) })
        .where(eq(executions.id, executionId));
      return;
    }

    await persistSteps();
  }

  await db.update(executions)
    .set({ status: "completed", completedAt: new Date().toISOString(), steps: JSON.stringify(Array.from(stepMap.values())) })
    .where(eq(executions.id, executionId));
}
