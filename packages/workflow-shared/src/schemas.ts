import { z } from "zod";

export const ConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "toggle", "select", "textarea"]),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  definitionId: z.string(),
  role: z.enum(["trigger", "action"]),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.unknown()),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean(),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema).optional(),
  edges: z.array(WorkflowEdgeSchema).optional(),
  isActive: z.boolean().optional(),
});

export const ExecutionStepSchema = z.object({
  nodeId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export const ExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(["running", "completed", "failed"]),
  triggeredAt: z.string(),
  completedAt: z.string().optional(),
  steps: z.array(ExecutionStepSchema),
});
