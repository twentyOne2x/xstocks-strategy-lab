import { useEffect, useRef } from "react";
import { useWorkflowStore } from "../store/workflowStore";

export function useAutoSave() {
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const workflow = useWorkflowStore((s) => s.workflow);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || !workflow) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveWorkflow();
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, workflow, saveWorkflow]);
}
