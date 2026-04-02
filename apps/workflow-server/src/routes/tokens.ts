import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface XStock {
  id: string;
  name: string;
  symbol: string;
  underlyingSymbol: string;
  logo: string;
  deployment: string;
  isTradingHalted: boolean;
}

const tokensPath = join(__dirname, "../../data/xStocks.json");
const tokens: XStock[] = JSON.parse(readFileSync(tokensPath, "utf-8"));

export const tokensRouter = Router();

// GET /tokens?q=search_term&limit=20
tokensRouter.get("/", (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 50);

  let results = tokens.filter((t) => !t.isTradingHalted);

  if (q) {
    results = results.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.underlyingSymbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
    );
  }

  res.json(
    results.slice(0, limit).map((t) => ({
      symbol: t.symbol,
      name: t.name,
      underlyingSymbol: t.underlyingSymbol,
      logo: t.logo,
      deployment: t.deployment,
    }))
  );
});
