import type { HandlerResult } from "./_base.js";
export async function execute(config: Record<string, unknown>, _inputs: Record<string, unknown>): Promise<HandlerResult> {
  await delay(100);
  return { output: { interval: config.interval ?? 1, unit: config.unit ?? "hours", triggeredAt: new Date().toISOString() } };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
