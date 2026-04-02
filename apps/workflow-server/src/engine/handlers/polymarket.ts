import type { HandlerResult } from "./_base.js";

export async function execute(
  config: Record<string, unknown>,
  _inputs: Record<string, unknown>
): Promise<HandlerResult> {
  const marketId = String(config.marketId ?? "");
  const question = String(config.marketQuestion ?? "Unknown market");
  const outcome = String(config.outcome ?? "Yes");
  const threshold = Number(config.threshold ?? 50);
  const direction = String(config.direction ?? "above");
  const slug = String(config.slug ?? "");

  if (!marketId) {
    return { output: { error: "No marketId configured", triggered: false } };
  }

  const url = `https://gamma-api.polymarket.com/markets?id=${encodeURIComponent(marketId)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    return { output: { error: `Gamma API returned ${resp.status}`, triggered: false } };
  }

  const markets = (await resp.json()) as Array<{
    id: string;
    question: string;
    slug: string;
    outcomes: string;
    outcomePrices: string;
  }>;

  if (markets.length === 0) {
    return { output: { error: `Market ${marketId} not found`, triggered: false } };
  }

  const market = markets[0];
  const outcomes: string[] = JSON.parse(market.outcomes || "[]");
  const prices: string[] = JSON.parse(market.outcomePrices || "[]");

  const outcomeIndex = outcomes.indexOf(outcome);
  if (outcomeIndex === -1) {
    return { output: { error: `Outcome "${outcome}" not found in [${outcomes.join(", ")}]`, triggered: false } };
  }

  const currentPrice = parseFloat(prices[outcomeIndex]) * 100; // 0-1 → percentage
  const triggered = direction === "above"
    ? currentPrice > threshold
    : currentPrice < threshold;

  return {
    output: {
      question: market.question,
      outcome,
      currentPrice: Math.round(currentPrice * 10) / 10,
      threshold,
      direction,
      triggered,
      marketUrl: `https://polymarket.com/event/${market.slug}`,
    },
  };
}
