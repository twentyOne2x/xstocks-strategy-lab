import { useNavigate } from "react-router-dom";
import { useWorkflowStore } from "../../store/workflowStore";
import { useExecutionStore } from "../../store/executionStore";
import { WalletPanel } from "../Wallet/WalletPanel";

export function Toolbar() {
  const navigate = useNavigate();
  const { workflow, saveStatus, toggleActive } = useWorkflowStore();
  const { isRunning, runWorkflow, toggleHistory, showHistory } = useExecutionStore();

  async function handleRun() {
    if (!workflow || isRunning) return;
    await runWorkflow(workflow.id);
  }

  const saveLabel =
    saveStatus === "saving" ? "Saving…" :
    saveStatus === "saved"  ? "Saved"   :
    saveStatus === "error"  ? "Error"   : "";

  const saveLabelColor =
    saveStatus === "saving" ? "text-gray-500" :
    saveStatus === "saved"  ? "text-green-400" :
    saveStatus === "error"  ? "text-red-400"   : "";

  return (
    <header className="h-11 flex-shrink-0 bg-surface-0 border-b border-border-default flex items-center px-4 gap-3">
      <button onClick={() => navigate("/app")} className="text-gray-500 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-accent font-semibold text-sm tracking-tight">Workflow</span>
      <span className="text-border-strong">|</span>
      <span className="text-sm text-gray-300 truncate max-w-[200px]">{workflow?.name ?? "Untitled"}</span>

      <div className="flex-1" />

      {saveLabel && <span className={`text-xs ${saveLabelColor} transition-colors`}>{saveLabel}</span>}

      <WalletPanel />

      <button
        onClick={toggleActive}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
          workflow?.isActive
            ? "bg-green-900/40 border-green-600 text-green-400"
            : "border-border-default text-gray-400 hover:text-white"
        }`}
        title={workflow?.isActive ? "Workflow is active — polling triggers every 30s" : "Activate to enable automatic trigger polling"}
      >
        <div className={`w-2 h-2 rounded-full ${workflow?.isActive ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
        {workflow?.isActive ? "Active" : "Inactive"}
      </button>

      <button
        onClick={toggleHistory}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
          showHistory
            ? "bg-surface-2 border-border-strong text-white"
            : "border-border-default text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </button>

      <button
        onClick={handleRun}
        disabled={isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isRunning ? (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        )}
        {isRunning ? "Running…" : "Run"}
      </button>
    </header>
  );
}
