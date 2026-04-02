import type { Node, Edge } from "@xyflow/react";
import type { IOField } from "@xstocks/workflow-shared";
import { registry } from "@xstocks/workflow-shared";

export interface UpstreamNodeInfo {
  nodeId: string;
  nodeName: string;
  nodeIcon: string;
  outputs: IOField[];
}

export function getUpstreamNodes(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): UpstreamNodeInfo[] {
  // BFS backward through edges
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find direct parents
  for (const edge of edges) {
    if (edge.target === nodeId) queue.push(edge.source);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const edge of edges) {
      if (edge.target === id && !visited.has(edge.source)) {
        queue.push(edge.source);
      }
    }
  }

  const result: UpstreamNodeInfo[] = [];
  for (const id of visited) {
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;
    const defId = node.data.definitionId as string;
    const def = registry[defId];
    if (!def?.outputs?.length) continue;
    result.push({
      nodeId: id,
      nodeName: (node.data.label as string) ?? defId,
      nodeIcon: (node.data.icon as string) ?? "⚙️",
      outputs: def.outputs,
    });
  }

  return result;
}
