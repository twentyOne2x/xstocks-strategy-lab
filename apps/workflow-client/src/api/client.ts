const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  workflows: {
    list: () => request<WorkflowSummary[]>("/workflows"),
    get: (id: string) => request<FullWorkflow>(`/workflows/${id}`),
    create: (name: string) => request<FullWorkflow>("/workflows", { method: "POST", body: JSON.stringify({ name }) }),
    update: (id: string, data: Partial<UpdateWorkflowBody>) =>
      request<FullWorkflow>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/workflows/${id}`, { method: "DELETE" }),
    duplicate: (id: string) => request<FullWorkflow>(`/workflows/${id}/duplicate`, { method: "POST" }),
    run: (id: string) => request<unknown>(`/workflows/${id}/run`, { method: "POST" }),
  },
  wallet: {
    status: () => request<WalletStatus>("/wallet"),
  },
};

export interface WalletStatus {
  configured: boolean;
  address: string | null;
  balance: string | null;
  chain: { chainId: number; name: string; networkMode: string };
  networkMode: string;
  dryRun: boolean;
  note?: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  isActive: boolean;
}

export interface FullWorkflow extends WorkflowSummary {
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  createdAt: string;
}

export interface WorkflowNodeData {
  id: string;
  definitionId: string;
  role: "trigger" | "action";
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface UpdateWorkflowBody {
  name: string;
  description: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  isActive: boolean;
}
