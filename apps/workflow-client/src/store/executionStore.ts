import { create } from "zustand";
import { api } from "../api/client";
import { useToastStore } from "../components/Toast/Toast";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface ExecutionStep {
  nodeId: string;
  status: StepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  triggeredAt: string;
  completedAt?: string;
  steps: ExecutionStep[];
}

interface ExecutionStore {
  currentExecution: Execution | null;
  executions: Execution[];
  isRunning: boolean;
  showHistory: boolean;
  stepStatuses: Record<string, StepStatus>;

  runWorkflow: (workflowId: string) => Promise<void>;
  loadExecutions: (workflowId: string) => Promise<void>;
  toggleHistory: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  currentExecution: null,
  executions: [],
  isRunning: false,
  showHistory: false,
  stepStatuses: {},

  toggleHistory: () => set((s) => ({ showHistory: !s.showHistory })),

  loadExecutions: async (workflowId) => {
    try {
      const rows = await fetch(`/api/workflows/${workflowId}/executions`).then((r) => r.json()) as Execution[];
      set({ executions: rows });
    } catch {
      // ignore
    }
  },

  runWorkflow: async (workflowId) => {
    if (get().isRunning) return;
    set({ isRunning: true, stepStatuses: {}, currentExecution: null });

    try {
      const execution = await api.workflows.run(workflowId) as Execution;
      set({ currentExecution: execution });

      // Poll until done
      const pollInterval = setInterval(async () => {
        try {
          const updated = await fetch(`/api/executions/${execution.id}`).then((r) => r.json()) as Execution;
          const statuses: Record<string, StepStatus> = {};
          for (const step of updated.steps) statuses[step.nodeId] = step.status;
          set({ currentExecution: updated, stepStatuses: statuses });

          if (updated.status === "completed" || updated.status === "failed") {
            clearInterval(pollInterval);
            set({ isRunning: false });
            if (updated.status === "completed") {
              useToastStore.getState().addToast("Workflow executed successfully", "success");
            } else {
              useToastStore.getState().addToast("Execution failed", "error");
            }
            // Refresh history
            get().loadExecutions(workflowId);
          }
        } catch {
          clearInterval(pollInterval);
          set({ isRunning: false });
        }
      }, 600);
    } catch {
      set({ isRunning: false });
    }
  },
}));
