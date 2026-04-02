import type { HandlerResult } from "./_base.js";
import { fetchUsdPrice } from "../priceCache.js";

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const token = String(config.token ?? "ETH").toUpperCase();
  const targetPrice = Number(config.price ?? 0);
  const direction = String(config.direction ?? "above");

  const currentPrice = await fetchUsdPrice(token);
  if (currentPrice === null) {
    return { output: { token, error: `Could not fetch price for ${token}`, triggered: false } };
  }

  const triggered = direction === "above"
    ? currentPrice > targetPrice
    : currentPrice < targetPrice;

  return {
    output: { token, currentPrice, targetPrice, direction, triggered },
  };
}
