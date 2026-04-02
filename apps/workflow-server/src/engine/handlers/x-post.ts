import type { HandlerResult } from "./_base.js";
export async function execute(config: Record<string, unknown>, _inputs: Record<string, unknown>): Promise<HandlerResult> {
  await delay(300);
  return { output: { postId: "1234567890", username: config.username ?? "@user", text: "Mock tweet content", timestamp: new Date().toISOString() } };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
