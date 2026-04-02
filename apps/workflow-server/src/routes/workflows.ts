import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workflows, executions } from "../db/schema.js";
import { CreateWorkflowSchema, UpdateWorkflowSchema } from "@xstocks/workflow-shared";

export const workflowsRouter = Router();

// GET /workflows
workflowsRouter.get("/", async (_req, res) => {
  try {
    const rows = await db.select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      updatedAt: workflows.updatedAt,
      isActive: workflows.isActive,
    }).from(workflows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /workflows
workflowsRouter.post("/", async (req, res) => {
  try {
    const parsed = CreateWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error });
      return;
    }
    const now = new Date().toISOString();
    const workflow = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: null as string | null,
      nodes: JSON.stringify([]),
      edges: JSON.stringify([]),
      isActive: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(workflows).values(workflow);
    res.status(201).json({ ...workflow, nodes: [], edges: [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /workflows/:id
workflowsRouter.get("/:id", async (req, res) => {
  try {
    const rows = await db.select().from(workflows).where(eq(workflows.id, req.params.id));
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.json({ ...row, nodes: JSON.parse(row.nodes), edges: JSON.parse(row.edges) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /workflows/:id
workflowsRouter.put("/:id", async (req, res) => {
  try {
    const parsed = UpdateWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error });
      return;
    }
    const existing = (await db.select().from(workflows).where(eq(workflows.id, req.params.id)))[0];
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.nodes !== undefined) updates.nodes = JSON.stringify(parsed.data.nodes);
    if (parsed.data.edges !== undefined) updates.edges = JSON.stringify(parsed.data.edges);
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

    await db.update(workflows).set(updates).where(eq(workflows.id, req.params.id));
    const updated = (await db.select().from(workflows).where(eq(workflows.id, req.params.id)))[0]!;
    res.json({ ...updated, nodes: JSON.parse(updated.nodes), edges: JSON.parse(updated.edges) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /workflows/:id
workflowsRouter.delete("/:id", async (req, res) => {
  try {
    const existing = (await db.select().from(workflows).where(eq(workflows.id, req.params.id)))[0];
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    await db.delete(executions).where(eq(executions.workflowId, req.params.id));
    await db.delete(workflows).where(eq(workflows.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /workflows/:id/duplicate
workflowsRouter.post("/:id/duplicate", async (req, res) => {
  try {
    const existing = (await db.select().from(workflows).where(eq(workflows.id, req.params.id)))[0];
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    const now = new Date().toISOString();
    const newWorkflow = {
      ...existing,
      id: crypto.randomUUID(),
      name: `${existing.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(workflows).values(newWorkflow);
    res.status(201).json({
      ...newWorkflow,
      nodes: JSON.parse(newWorkflow.nodes),
      edges: JSON.parse(newWorkflow.edges),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
