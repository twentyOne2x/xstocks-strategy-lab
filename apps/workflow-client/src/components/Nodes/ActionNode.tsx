import { Handle, Position, type NodeProps } from "@xyflow/react";
import { registry } from "@xstocks/workflow-shared";
import { useWorkflowStore } from "../../store/workflowStore";
import { useExecutionStore } from "../../store/executionStore";
import { NodeStatusBadge } from "./NodeStatusBadge";
import { IOPills } from "./IOPills";
import { ConfigSummary } from "./ConfigSummary";

export function ActionNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const stepStatus = useExecutionStore((s) => s.stepStatuses[id]);
  const color = (data.color as string) ?? "#444444";
  const icon = (data.icon as string) ?? "⚙️";
  const label = (data.label as string) ?? "Action";
  const def = registry[data.definitionId as string];

  const isRunning = stepStatus === "running";

  return (
    <div
      onClick={() => selectNode(id)}
      style={{ borderColor: isRunning ? "#E8652C" : selected ? color : "#252525" }}
      className="relative w-52 rounded-xl bg-surface-2 border-2 cursor-pointer transition-all hover:border-opacity-80 shadow-lg"
    >
      <NodeStatusBadge status={stepStatus} />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-surface-3 !border-2" style={{ borderColor: color }} />
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: color }} />
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: color + "22" }}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Action</div>
          <div className="text-sm font-medium text-white truncate">{label}</div>
        </div>
      </div>
      <ConfigSummary definitionId={data.definitionId as string} config={(data.config as Record<string, unknown>) ?? {}} />
      <IOPills outputs={def?.outputs} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-surface-3 !border-2" style={{ borderColor: color }} />
    </div>
  );
}
