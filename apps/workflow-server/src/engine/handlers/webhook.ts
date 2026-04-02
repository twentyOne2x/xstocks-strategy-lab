import type { HandlerResult } from "./_base.js";
export async function execute(config: Record<string, unknown>, _inputs: Record<string, unknown>): Promise<HandlerResult> {
  await delay(100);
  return { output: { path: config.path ?? "/webhook", payload: { event: "mock", data: {} }, receivedAt: new Date().toISOString() } };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
