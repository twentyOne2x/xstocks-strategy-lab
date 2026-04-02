import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Canvas } from "../components/Canvas/Canvas";
import { ConfigPanel } from "../components/ConfigPanel/ConfigPanel";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { ExecutionPanel } from "../components/ExecutionPanel/ExecutionPanel";
import { useWorkflowStore } from "../store/workflowStore";
import { useExecutionStore } from "../store/executionStore";
import { useAutoSave } from "../hooks/useAutoSave";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadWorkflow, selectedNodeId } = useWorkflowStore();
  const { loadExecutions, showHistory } = useExecutionStore();

  useAutoSave();

  useEffect(() => {
    if (!id) { navigate("/app"); return; }
    loadWorkflow(id).catch(() => navigate("/app"));
    loadExecutions(id);
  }, [id]);

  return (
    <div className="w-screen h-screen bg-canvas-bg overflow-hidden flex flex-col">
      <Toolbar />
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Canvas />
          </div>
          {selectedNodeId && <ConfigPanel />}
        </div>
        {showHistory && <ExecutionPanel />}
      </div>
    </div>
  );
}
