import { useNavigate } from "react-router-dom";
import type { WorkflowSummary } from "../../api/client";

interface Props {
  workflow: WorkflowSummary;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function WorkflowCard({ workflow, onDelete, onDuplicate, onRename }: Props) {
  const navigate = useNavigate();

  function handleRename() {
    const name = prompt("Rename workflow:", workflow.name);
    if (name && name.trim() && name !== workflow.name) {
      onRename(workflow.id, name.trim());
    }
  }

  const updatedAt = new Date(workflow.updatedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="bg-surface-1 border border-border-default rounded-xl p-4 flex flex-col gap-3 hover:border-border-strong transition-colors group">
      {/* Status dot */}
      <div className="flex items-start justify-between">
        <div
          className={`w-2 h-2 rounded-full mt-1 ${workflow.isActive ? "bg-green-400" : "bg-surface-3"}`}
          title={workflow.isActive ? "Active" : "Inactive"}
        />
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleRename} className="p-1 text-gray-500 hover:text-white transition-colors" title="Rename">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <button onClick={() => onDuplicate(workflow.id)} className="p-1 text-gray-500 hover:text-white transition-colors" title="Duplicate">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={() => onDelete(workflow.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white truncate">{workflow.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">Updated {updatedAt}</p>
      </div>

      <button
        onClick={() => navigate(`/app/workflow/${workflow.id}`)}
        className="mt-auto w-full py-1.5 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent hover:text-white transition-colors"
      >
        Open
      </button>
    </div>
  );
}
