import { Router } from "express";

export const polymarketRouter = Router();

// Proxy for gamma API (no CORS, so we proxy through our backend)
polymarketRouter.get("/markets", async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.q) params.set("_q", String(req.query.q));
    if (req.query.slug) params.set("slug", String(req.query.slug));
    params.set("active", "true");
    params.set("closed", "false");
    params.set("limit", String(req.query.limit ?? "20"));
    params.set("order", "volume24hr");
    params.set("ascending", "false");

    const url = `https://gamma-api.polymarket.com/markets?${params}`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: "Polymarket API error" });
      return;
    }
    const data = await response.json();

    // Return simplified market objects
    const markets = (data as any[]).map((m: any) => ({
      id: m.id,
      question: m.question,
      slug: m.slug,
      image: m.image,
      outcomes: JSON.parse(m.outcomes || "[]"),
      outcomePrices: JSON.parse(m.outcomePrices || "[]"),
      volume: m.volumeNum,
      volume24hr: m.volume24hr,
      endDate: m.endDate,
      conditionId: m.conditionId,
      clobTokenIds: JSON.parse(m.clobTokenIds || "[]"),
    }));
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
