/**
 * Resolves {{nodeId.outputKey}} expressions in config values.
 * Supports dot-path traversal (e.g. {{nodeId.payload.name}}).
 * Preserves original types for single-expression values.
 */
export function resolveExpressions(
  config: Record<string, unknown>,
  nodeOutputs: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  const pattern = /\{\{([^.}]+)\.([^}]+)\}\}/g;

  for (const [key, value] of Object.entries(config)) {
    if (typeof value !== "string") {
      resolved[key] = value;
      continue;
    }

    // Check if the entire value is a single expression (for type preservation)
    const singleMatch = value.match(/^\{\{([^.}]+)\.([^}]+)\}\}$/);
    if (singleMatch) {
      const [, nodeId, path] = singleMatch;
      const result = resolvePath(nodeOutputs[nodeId], path);
      resolved[key] = result ?? "";
      continue;
    }

    // Multiple expressions or mixed text — always returns string
    resolved[key] = value.replace(pattern, (_, nodeId: string, path: string) => {
      const result = resolvePath(nodeOutputs[nodeId], path);
      return result != null ? String(result) : "";
    });
  }

  return resolved;
}

function resolvePath(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split(".").reduce<unknown>((curr, segment) => {
    if (curr == null || typeof curr !== "object") return undefined;
    return (curr as Record<string, unknown>)[segment];
  }, obj);
}
