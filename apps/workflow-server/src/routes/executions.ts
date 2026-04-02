import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workflows, executions } from "../db/schema.js";
import { executeWorkflow } from "../engine/executor.js";

export const executionsRouter = Router();

// GET /workflows/:id/executions
executionsRouter.get("/workflows/:id/executions", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const offset = (page - 1) * limit;
    const rows = await db
      .select()
      .from(executions)
      .where(eq(executions.workflowId, req.params.id))
      .limit(limit)
      .offset(offset);
    res.json(rows.map((r) => ({ ...r, steps: JSON.parse(r.steps) })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /executions/:id
executionsRouter.get("/executions/:id", async (req, res) => {
  try {
    const rows = await db.select().from(executions).where(eq(executions.id, req.params.id));
    const row = rows[0];
    if (!row) { res.status(404).json({ error: "Execution not found" }); return; }
    res.json({ ...row, steps: JSON.parse(row.steps) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /workflows/:id/run
executionsRouter.post("/workflows/:id/run", async (req, res) => {
  try {
    const wfRows = await db.select().from(workflows).where(eq(workflows.id, req.params.id));
    const workflow = wfRows[0];
    if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

    const nodes = JSON.parse(workflow.nodes) as Array<{ id: string }>;
    const now = new Date().toISOString();
    const steps = nodes.map((n) => ({ nodeId: n.id, status: "pending", startedAt: undefined, completedAt: undefined, input: undefined, output: undefined, error: undefined }));

    const execution = {
      id: crypto.randomUUID(),
      workflowId: workflow.id,
      status: "running" as const,
      triggeredAt: now,
      completedAt: null as string | null,
      steps: JSON.stringify(steps),
    };
    await db.insert(executions).values(execution);

    // Return immediately
    res.status(201).json({ ...execution, steps });

    // Run async (don't await)
    executeWorkflow(execution.id, workflow.id).catch((err) => {
      console.error("Execution error:", err);
      db.update(executions)
        .set({ status: "failed", completedAt: new Date().toISOString() })
        .where(eq(executions.id, execution.id))
        .catch(console.error);
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
