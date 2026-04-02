import { api } from "../api/client";
import { useWorkflowStore } from "../store/workflowStore";

export function useWorkflow() {
  const { loadWorkflow, saveWorkflow, saveStatus } = useWorkflowStore();
  return { loadWorkflow, saveWorkflow, saveStatus };
}
