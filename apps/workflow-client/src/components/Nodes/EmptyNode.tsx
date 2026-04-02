import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "../../store/workflowStore";

export function EmptyNode({ id, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const color = "#10B981";

  return (
    <div
      onClick={() => selectNode(id)}
      style={{ borderColor: selected ? color : "#252525" }}
      className="relative w-52 rounded-xl bg-surface-2 border-2 border-dashed cursor-pointer transition-all"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-surface-3 !border-2"
        style={{ borderColor: color }}
      />

      <div className="px-3 py-4 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: color + "22", color }}
        >
          +
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Add Step</div>
          <div className="text-sm font-medium text-gray-400">Choose action</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-surface-3 !border-2"
        style={{ borderColor: color }}
      />
    </div>
  );
}
