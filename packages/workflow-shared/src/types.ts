// --- Node Definition Registry ---
export type NodeCategory = "on-chain" | "off-chain";
export type NodeRole = "trigger" | "action";

export interface IOField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "object";
}

export interface NodeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: NodeCategory;
  role: NodeRole;
  outputs?: IOField[];
  configFields: ConfigField[];
  presets?: ConfigPreset[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "toggle" | "select" | "textarea" | "token-search" | "wallet-token-select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean;
}

export interface ConfigPreset {
  name: string;
  description: string;
  values: Record<string, unknown>;
}

// --- Workflow Data ---
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  definitionId: string;
  role: NodeRole;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// --- Execution Log ---
export interface Execution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  triggeredAt: string;
  completedAt?: string;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
