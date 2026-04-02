import { useCallback, useEffect, useRef } from "react";
import { ReactFlow, Background, MiniMap, Controls, BackgroundVariant, useReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "../Nodes/nodeTypes";
import { CustomEdge } from "./CustomEdge";
import { useWorkflowStore } from "../../store/workflowStore";
import type { NodeRole } from "@xstocks/workflow-shared";

const edgeTypes = { custom: CustomEdge };

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, selectNode } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/workflow-node");
      if (!raw) return;
      const { definitionId, role } = JSON.parse(raw) as { definitionId: string; role: NodeRole };
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(definitionId, role, position);
    },
    [screenToFlowPosition, addNode]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        useWorkflowStore.getState().saveWorkflow();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "custom", animated: true }}
        edgesReconnectable
        deleteKeyCode={["Backspace", "Delete"]}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={() => selectNode(null)}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        colorMode="dark"
        className="bg-canvas-bg"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a1a" />
        <MiniMap
          nodeColor={(n) => (n.data?.role === "trigger" ? "#E8652C" : "#444")}
          maskColor="#0a0a0acc"
          className="!bg-surface-1 !border-border-default !rounded-lg"
        />
        <Controls className="!bg-surface-2 !border-border-default !rounded-lg" />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
