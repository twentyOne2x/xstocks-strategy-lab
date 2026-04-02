import type { HandlerResult } from "./_base.js";

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  return {
    output: {
      message: config.message ?? "",
      timestamp: new Date().toISOString(),
    },
  };
}
