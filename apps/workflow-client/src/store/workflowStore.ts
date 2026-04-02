import { create } from "zustand";
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  XYPosition,
} from "@xyflow/react";
import { registry } from "@xstocks/workflow-shared";
import type { NodeRole } from "@xstocks/workflow-shared";
import { api, type FullWorkflow, type WorkflowNodeData, type WorkflowEdgeData } from "../api/client";
import { useToastStore } from "../components/Toast/Toast";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface WorkflowStore {
  workflow: FullWorkflow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  saveStatus: SaveStatus;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (definitionId: string, role: NodeRole, position?: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  assignDefinition: (nodeId: string, definitionId: string) => void;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  toggleActive: () => Promise<void>;
}

function domainNodesToFlow(domainNodes: WorkflowNodeData[]): Node[] {
  return domainNodes.map((n) => {
    const def = registry[n.definitionId];
    return {
      id: n.id,
      type: n.role,
      position: n.position,
      data: {
        definitionId: n.definitionId,
        role: n.role,
        label: def?.name ?? n.definitionId,
        icon: def?.icon ?? "⚙️",
        color: def?.color ?? "#444",
        config: n.config,
      },
    };
  });
}

function flowNodesToDomain(nodes: Node[]): WorkflowNodeData[] {
  return nodes.map((n) => ({
    id: n.id,
    definitionId: (n.data.definitionId as string) ?? "empty",
    role: (n.data.role as NodeRole) ?? "action",
    position: n.position,
    config: (n.data.config as Record<string, unknown>) ?? {},
  }));
}

function flowEdgesToDomain(edges: Edge[]): WorkflowEdgeData[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  saveStatus: "idle",

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes), isDirty: true })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges), isDirty: true })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge({ ...connection, type: "custom", animated: true }, state.edges),
      isDirty: true,
    })),

  addNode: (definitionId, role, position) => {
    const def = registry[definitionId];
    const nodes = get().nodes;
    const lowestY = nodes.reduce((max, n) => Math.max(max, n.position.y), 0);
    const pos = position ?? { x: 300, y: lowestY + 160 };
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: role,
      position: pos,
      data: {
        definitionId,
        role,
        label: def?.name ?? definitionId,
        icon: def?.icon ?? "⚙️",
        color: def?.color ?? "#444",
        config: {},
      },
    };
    set((state) => ({ nodes: [...state.nodes, newNode], isDirty: true }));
  },

  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
      ),
      isDirty: true,
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  assignDefinition: (nodeId, definitionId) => {
    const def = registry[definitionId];
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, definitionId, label: def?.name ?? definitionId, icon: def?.icon ?? "⚙️", color: def?.color ?? "#444" } }
          : n
      ),
      isDirty: true,
    }));
  },

  loadWorkflow: async (id) => {
    const data = await api.workflows.get(id);
    const nodes = domainNodesToFlow(data.nodes);
    const edges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: "custom",
      animated: true,
    }));
    set({ workflow: data, nodes, edges, isDirty: false, saveStatus: "idle" });
  },

  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return;
    set({ saveStatus: "saving" });
    try {
      const updated = await api.workflows.update(workflow.id, {
        nodes: flowNodesToDomain(nodes),
        edges: flowEdgesToDomain(edges),
      });
      set({ workflow: updated, isDirty: false, saveStatus: "saved" });
      useToastStore.getState().addToast("Workflow saved", "success");
      setTimeout(() => set((s) => (s.saveStatus === "saved" ? { saveStatus: "idle" } : {})), 2000);
    } catch {
      set({ saveStatus: "error" });
      useToastStore.getState().addToast("Failed to save", "error");
    }
  },

  toggleActive: async () => {
    const { workflow } = get();
    if (!workflow) return;
    const newActive = !workflow.isActive;
    try {
      const updated = await api.workflows.update(workflow.id, { isActive: newActive });
      set({ workflow: updated });
      useToastStore.getState().addToast(
        newActive ? "Workflow activated — polling started" : "Workflow deactivated",
        newActive ? "success" : "info"
      );
    } catch {
      useToastStore.getState().addToast("Failed to toggle workflow", "error");
    }
  },
}));
