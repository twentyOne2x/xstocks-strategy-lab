import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createLiveStateRepository } from "../src/repositories/live-state-repository.js";
import {
  COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH,
  PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS,
} from "../../../packages/research/src/cow-execution-truth.js";
import universeSnapshot from "../../../packages/research/data/research-bundle-v1/universe_snapshot.json" with { type: "json" };
import starterBaskets from "../../../packages/research/data/research-bundle-v1/starter_baskets.json" with { type: "json" };
import promotedManifest from "../../../packages/research/manifests/promoted/onboarding.default_basket/current.json" with { type: "json" };
import { createCowSwapApiClient } from "../../../packages/xstocks/dist/index.js";

const owner = "0x2222222222222222222222222222222222222222";
const testedUsdLadder = COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH.testedUsdLadder;
const repoOwnedUniverseSymbols = [...(universeSnapshot.assets ?? [])]
  .filter((asset) => asset?.status === "active")
  .map((asset) => asset.symbol)
  .sort((left, right) => left.localeCompare(right));

const PRODUCT_USABLE_COW_ONLY_BASKET_REASON = `Only ${
  COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH.quoteableSymbols.length
} xStocks currently quote directly on CoW, below the research minimum holdings_count=${PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS}.`;

const repo = createLiveStateRepository({});
const cow = createCowSwapApiClient({
  requestTimeoutMs: 5_000,
});

function pickEthereumDeployment(snapshot) {
  const deployments = snapshot?.asset?.deployments ?? [];
  return (
    deployments.find(
      (deployment) => String(deployment.network).toLowerCase() === "ethereum",
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

function deriveBlockerClass(errorSummary) {
  if (errorSummary?.errorType === "NoLiquidity") {
    return "cow_no_liquidity";
  }

  if (errorSummary?.errorType === "InternalServerError") {
    return "cow_internal_server_error";
  }

  if (Number.isInteger(errorSummary?.statusCode)) {
    return `cow_quote_http_${errorSummary.statusCode}`;
  }

  return "cow_quote_error";
}

function derivePrimaryBlockerClass(blockerClasses) {
  if (blockerClasses.includes("cow_no_liquidity")) {
    return "cow_no_liquidity";
  }

  return blockerClasses.at(-1) ?? null;
}

async function quoteOne(symbol, snapshot, usd) {
  const ethereumDeployment = pickEthereumDeployment(snapshot);
  const wrapperAddress =
    ethereumDeployment?.wrapperAddress ?? ethereumDeployment?.address ?? null;
  const usdc =
    ethereumDeployment?.stablecoins?.find((stablecoin) => stablecoin.symbol === "USDC") ??
    null;

  if (!wrapperAddress || !usdc?.address) {
    return {
      symbol,
      usd,
      ok: false,
      error: {
        message: "missing_ethereum_route_metadata",
      },
      blockerClass: "missing_ethereum_route_metadata",
    };
  }

  const sellAmountBeforeFee = String(Math.round(usd * 10 ** usdc.decimals));

  try {
    const quote = await cow.requestQuote({
      sellToken: usdc.address,
      buyToken: wrapperAddress,
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
    const errorSummary = summarizeError(error);
    return {
      symbol,
      usd,
      ok: false,
      error: errorSummary,
      blockerClass: deriveBlockerClass(errorSummary),
    };
  }
}

function summarizeSymbol(symbol, rows) {
  const quoteableAtUsd = rows.filter((row) => row.ok).map((row) => row.usd);
  const failures = rows.filter((row) => !row.ok);
  const blockerClasses = [...new Set(failures.map((row) => row.blockerClass))];
  const venueResponses = [...new Set(
    failures.map(
      (row) =>
        `${row.error?.statusCode ?? "na"}:${row.error?.errorType ?? row.error?.message ?? "unknown"}`,
    ),
  )];

  return {
    symbol,
    quotedAtUsd: quoteableAtUsd,
    quotesAtEveryRung: quoteableAtUsd.length === testedUsdLadder.length,
    neverQuotes: quoteableAtUsd.length === 0,
    blockerClass:
      quoteableAtUsd.length > 0
        ? null
        : derivePrimaryBlockerClass(blockerClasses) ?? failures[0]?.blockerClass ?? null,
    blockerClasses,
    exactVenueResponses: venueResponses,
  };
}

async function main() {
  const results = [];
  const assetSnapshotBySymbol = new Map(
    await Promise.all(
      repoOwnedUniverseSymbols.map(async (symbol) => [
        symbol,
        await repo.fetchAssetSnapshot(symbol),
      ]),
    ),
  );

  for (const usd of testedUsdLadder) {
    const rows = await Promise.all(
      repoOwnedUniverseSymbols.map((symbol) =>
        quoteOne(symbol, assetSnapshotBySymbol.get(symbol), usd),
      ),
    );
    results.push(...rows);
  }

  const bySymbol = Object.fromEntries(
    repoOwnedUniverseSymbols.map((symbol) => [
      symbol,
      testedUsdLadder.map((usd) =>
        results.find((row) => row.symbol === symbol && row.usd === usd),
      ),
    ]),
  );

  const symbolMatrix = repoOwnedUniverseSymbols.map((symbol) =>
    summarizeSymbol(symbol, bySymbol[symbol]),
  );
  const quoteableSymbols = symbolMatrix
    .filter((symbol) => !symbol.neverQuotes)
    .map((symbol) => symbol.symbol);
  const neverQuoteableSymbols = symbolMatrix
    .filter((symbol) => symbol.neverQuotes)
    .map((symbol) => ({
      symbol: symbol.symbol,
      blockerClass: symbol.blockerClass,
      blockerClasses: symbol.blockerClasses,
      exactVenueResponses: symbol.exactVenueResponses,
    }));

  const starterBasketCoverage = Object.fromEntries(
    (starterBaskets.baskets ?? []).map((basket) => {
      const members = basket.members ?? [];
      const quoteableMembers = members.filter((symbol) => quoteableSymbols.includes(symbol));
      const blockedMembers = members.filter((symbol) => !quoteableSymbols.includes(symbol));

      return [
        basket.basket_id,
        {
          kind: basket.kind,
          members,
          quoteableMembers,
          blockedMembers,
          fullyExecutable: blockedMembers.length === 0,
        },
      ];
    }),
  );

  const currentPromotedCoreSymbols = (promotedManifest.target_allocations ?? [])
    .filter((allocation) => allocation.sleeve === "core_xstocks")
    .map((allocation) => allocation.asset_symbol);
  const currentPromotedBlockedSymbols = currentPromotedCoreSymbols.filter(
    (symbol) => !quoteableSymbols.includes(symbol),
  );

  const proposedCowOnlyBasket =
    quoteableSymbols.length >= PRODUCT_USABLE_COW_MIN_CORE_HOLDINGS
      ? {
          status: "viable",
          coreSymbols: quoteableSymbols,
          reason:
            "The direct-quoteable CoW universe clears the minimum holdings count for a product-usable basket.",
        }
      : {
          status: "not_viable",
          coreSymbols: quoteableSymbols,
          reason: `${PRODUCT_USABLE_COW_ONLY_BASKET_REASON} The only fully intact repo basket is benchmark-only sp500_core/SPYx, so no product-usable CoW-only onboarding basket exists right now.`,
        };

  const summary = {
    generatedAt: new Date().toISOString(),
    owner,
    truthReference: {
      routeId: COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH.routeId,
      quoteAssetSymbol: COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH.quoteAssetSymbol,
      testedUsdLadder,
    },
    repoOwnedUniverseSymbols,
    quoteableSymbols,
    neverQuoteableSymbols,
    symbolMatrix,
    starterBasketCoverage,
    currentPromotedBasket: {
      manifestId: promotedManifest.manifestId,
      coreSymbols: currentPromotedCoreSymbols,
      blockedCoreSymbols: currentPromotedBlockedSymbols,
      executionReady: currentPromotedBlockedSymbols.length === 0,
      reason:
        currentPromotedBlockedSymbols.length === 0
          ? "Every required core leg currently quotes on CoW."
          : `The current promoted basket is not execution-ready because required core legs ${currentPromotedBlockedSymbols.join(", ")} never quote directly on CoW in the tested ladder.`,
    },
    proposedCowOnlyBasket,
    results,
    bySymbol,
  };

  const outputDirectory = resolve(process.cwd(), "tmp/proof/standalone-cow");
  mkdirSync(outputDirectory, { recursive: true });
  const outputPath = resolve(
    outputDirectory,
    `cow-executable-universe-${Date.now()}.json`,
  );

  writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  process.stdout.write(`${outputPath}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        quoteableSymbols,
        neverQuoteableSymbols,
        currentPromotedBasket: summary.currentPromotedBasket,
        proposedCowOnlyBasket,
      },
      null,
      2,
    )}\n`,
  );
}

await main();
