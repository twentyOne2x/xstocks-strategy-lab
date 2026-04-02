import type { HandlerResult } from "./_base.js";
export async function execute(config: Record<string, unknown>, _inputs: Record<string, unknown>): Promise<HandlerResult> {
  await delay(400);
  return { output: { tweetId: "9876543210", content: config.content ?? "", postedAt: new Date().toISOString(), url: "https://x.com/mock/status/9876543210" } };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
