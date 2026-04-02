import type { NodeDefinition } from "@xstocks/workflow-shared";

interface Props {
  def: NodeDefinition;
}

export function ItemCard({ def }: Props) {
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("application/workflow-node", JSON.stringify({ definitionId: def.id, role: def.role }));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-2 border border-border-default hover:border-border-strong cursor-grab active:cursor-grabbing transition-colors select-none"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: def.color + "22" }}
      >
        {def.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-white truncate">{def.name}</div>
        <div className="text-xs text-gray-500 truncate">{def.description}</div>
      </div>
      <div
        className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
        style={
          def.category === "on-chain"
            ? { backgroundColor: "#10B98122", color: "#10B981" }
            : { backgroundColor: "#8B5CF622", color: "#8B5CF6" }
        }
      >
        {def.category}
      </div>
    </div>
  );
}
