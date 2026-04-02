import type { HandlerResult } from "./_base.js";

const POSITIVE = ["good", "great", "excellent", "amazing", "love", "happy", "positive", "bullish", "gain", "up", "rise", "profit", "win", "success", "strong"];
const NEGATIVE = ["bad", "terrible", "awful", "hate", "sad", "negative", "bearish", "loss", "down", "fall", "crash", "fail", "weak", "dump", "fear"];

export async function execute(
  config: Record<string, unknown>,
  _inputs: Record<string, unknown>
): Promise<HandlerResult> {
  await new Promise((r) => setTimeout(r, 400));

  const text = String(config.text ?? "");

  const lower = text.toLowerCase();
  const hasPositive = POSITIVE.some((w) => lower.includes(w));
  const score = hasPositive ? 0.9 : 0.4;
  const label = hasPositive ? "positive" : "negative";

  return {
    output: {
      score: Math.round(score * 1000) / 1000,
      label,
      referencedAsset: text.match(/\b[A-Z]{2,6}\b/)?.[0] ?? "unknown",
    },
  };
}
