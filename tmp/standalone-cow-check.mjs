import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createLiveStateRepository } from "../apps/api/src/repositories/live-state-repository.js";
import { createCowSwapApiClient } from "../packages/xstocks/dist/index.js";

const symbols = [
  "NVDAx",
  "MSFTx",
  "AAPLx",
  "METAx",
  "AMZNx",
  "GOOGLx",
  "TSLAx",
  "AMDx",
  "AVGOx",
  "ORCLx",
  "SPYx",
];
const ladder = [15, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const owner = "0x2222222222222222222222222222222222222222";

const repo = createLiveStateRepository({});
const cow = createCowSwapApiClient({});

function pickEthereumDeployment(snapshot) {
  const deployments = snapshot?.asset?.deployments ?? [];
  return (
    deployments.find(
      (item) => String(item.network).toLowerCase() === "ethereum",
    ) ?? null
  );
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(
    /^CoW quote request failed with status (?<status>\d+):\s*(?<body>.*)$/su,
  );
  const body = match?.groups?.body?.trim() || null;
  let parsed = null;

  if (body) {
    try {
      parsed = JSON.parse(body);
    } catch {}
  }

  return {
    statusCode: match?.groups?.status ? Number(match.groups.status) : null,
    errorType: parsed?.errorType ?? null,
    description: parsed?.description ?? null,
    rawBody: body,
    message,
  };
}

async function quoteOne(symbol, usd) {
  const snapshot = await repo.fetchAssetSnapshot(symbol);
  const eth = pickEthereumDeployment(snapshot);
  const wrapper = eth?.wrapperAddress ?? eth?.address ?? null;
  const usdc = eth?.stablecoins?.find((item) => item.symbol === "USDC") ?? null;

  if (!wrapper || !usdc?.address) {
    return {
      symbol,
      usd,
      ok: false,
      error: { message: "missing_ethereum_route_metadata" },
    };
  }

  const sellAmountBeforeFee = String(Math.round(usd * 10 ** usdc.decimals));

  try {
    const quote = await cow.requestQuote({
      sellToken: usdc.address,
      buyToken: wrapper,
      from: owner,
      receiver: owner,
      owner,
      kind: "sell",
      sellAmountBeforeFee,
    });

    return {
      symbol,
      usd,
      ok: true,
      quoteId: quote?.id ?? quote?.quote?.id ?? null,
      buyAmount: quote?.quote?.buyAmount ?? null,
      sellAmount: quote?.quote?.sellAmount ?? null,
      feeAmount: quote?.quote?.feeAmount ?? null,
      validTo: quote?.quote?.validTo ?? null,
    };
  } catch (error) {
    return { symbol, usd, ok: false, error: summarizeError(error) };
  }
}

const results = [];

for (const usd of ladder) {
  const batch = await Promise.all(symbols.map((symbol) => quoteOne(symbol, usd)));
  results.push(...batch);
}

const bySymbol = Object.fromEntries(
  symbols.map((symbol) => [
    symbol,
    ladder.map((usd) =>
      results.find((item) => item.symbol === symbol && item.usd === usd),
    ),
  ]),
);

const summary = {
  generatedAt: new Date().toISOString(),
  owner,
  ladder,
  symbols,
  results,
  bySymbol,
  workingSymbols: symbols.filter((symbol) =>
    bySymbol[symbol].some((item) => item?.ok),
  ),
  workingAtEveryRung: symbols.filter((symbol) =>
    bySymbol[symbol].every((item) => item?.ok),
  ),
  neverWorked: symbols.filter((symbol) =>
    bySymbol[symbol].every((item) => !item?.ok),
  ),
};

const out = resolve(
  process.cwd(),
  "tmp/proof/standalone-cow",
  `standalone-usdc-xstocks-${Date.now()}.json`,
);
writeFileSync(out, JSON.stringify(summary, null, 2));
process.stdout.write(`${out}\n`);
process.stdout.write(
  `${JSON.stringify(
    {
      workingSymbols: summary.workingSymbols,
      workingAtEveryRung: summary.workingAtEveryRung,
      neverWorked: summary.neverWorked,
    },
    null,
    2,
  )}\n`,
);
