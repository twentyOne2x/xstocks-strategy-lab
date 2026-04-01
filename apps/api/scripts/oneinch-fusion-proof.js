import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createOneInchFusionApiClient,
  createXStocksPublicClient,
  XSTOCKS_PUBLIC_PATHS,
} from "../../../packages/xstocks/dist/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const DEFAULT_SHARED_ENV_PATH =
  process.env.XSTOCKS_SHARED_ENV_PATH ??
  process.env.ATTN_SHARED_ENV_PATH ??
  resolve(process.env.HOME ?? "~", ".config/attn/shared.env");

const DEFAULT_SYMBOLS = [
  "NVDAx",
  "AAPLx",
  "MSFTx",
  "METAx",
  "AMZNx",
  "GOOGLx",
  "TSLAx",
  "SPYx",
  "AMDx",
  "AVGOx",
  "ORCLx",
];
const DEFAULT_NOTIONAL_LADDER_USD = [20, 25, 50, 100];
const DEFAULT_PLACEHOLDER_WALLET =
  "0x1111111111111111111111111111111111111111";
const ETHEREUM_USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

function parseEnvFile(raw) {
  const entries = {};

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value =
      rawValue.length >= 2 &&
      ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'")))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!key || Object.hasOwn(process.env, key)) {
      continue;
    }

    entries[key] = value;
  }

  return entries;
}

function loadEnvFromFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    Object.assign(process.env, parseEnvFile(raw));
    return true;
  } catch {
    return false;
  }
}

function bootstrapEnvironment() {
  loadEnvFromFile(DEFAULT_SHARED_ENV_PATH);
  loadEnvFromFile(resolve(REPO_ROOT, ".vercel/.env.production.local"));
  loadEnvFromFile(resolve(REPO_ROOT, "apps/web/.env.local"));
}

function requiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required for the 1inch Fusion proof runner.`);
  }

  return value.trim();
}

function optionalEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseSymbols(value) {
  if (!value) {
    return DEFAULT_SYMBOLS;
  }

  return [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];
}

function parseNotionalLadder(value) {
  if (!value) {
    return DEFAULT_NOTIONAL_LADDER_USD;
  }

  return [...new Set(
    String(value)
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0),
  )].sort((left, right) => left - right);
}

function usdToUsdcAmount(notionalUsd) {
  return String(Math.round(Number(notionalUsd) * 1_000_000));
}

function summarizeResult(symbolResult) {
  const firstSuccess = symbolResult.attempts.find((attempt) => attempt.ok);

  return {
    symbol: symbolResult.symbol,
    ethereumDeploymentAddress: symbolResult.ethereumDeploymentAddress,
    firstSuccessfulNotionalUsd: firstSuccess?.notionalUsd ?? null,
    firstQuoteId: firstSuccess?.quoteId ?? null,
    successfulAttemptCount: symbolResult.attempts.filter((attempt) => attempt.ok).length,
    failures: symbolResult.attempts
      .filter((attempt) => !attempt.ok)
      .map((attempt) => ({
        notionalUsd: attempt.notionalUsd,
        statusCode: attempt.statusCode,
        code: attempt.code,
        description: attempt.description,
      })),
  };
}

async function main() {
  bootstrapEnvironment();

  const oneInchApiKey = requiredEnv("ONEINCH_API_KEY");
  const walletAddress =
    optionalEnv("XSTOCKS_ONEINCH_WALLET_ADDRESS") ??
    optionalEnv("XSTOCKS_WALLET_ADDRESS") ??
    DEFAULT_PLACEHOLDER_WALLET;
  const symbols = parseSymbols(process.env.XSTOCKS_ONEINCH_SYMBOLS);
  const notionalLadderUsd = parseNotionalLadder(
    process.env.XSTOCKS_ONEINCH_NOTIONAL_LADDER_USD,
  );

  const xstocksClient = createXStocksPublicClient();
  const oneInchClient = createOneInchFusionApiClient({
    authKey: oneInchApiKey,
  });

  const generatedAt = new Date().toISOString();
  const outputDir = resolve(
    REPO_ROOT,
    "tmp/proof",
    `oneinch-fusion-${generatedAt.replaceAll(":", "-")}`,
  );
  await mkdir(outputDir, { recursive: true });

  const results = [];

  for (const symbol of symbols) {
    const asset = await xstocksClient.get(XSTOCKS_PUBLIC_PATHS.asset(symbol));
    const ethereumDeployment =
      asset.deployments.find((deployment) => deployment.network === "Ethereum") ??
      null;

    if (!ethereumDeployment) {
      results.push({
        symbol,
        ethereumDeploymentAddress: null,
        attempts: [],
        error: "missing_ethereum_deployment",
      });
      continue;
    }

    const symbolResult = {
      symbol,
      ethereumDeploymentAddress: ethereumDeployment.address,
      attempts: [],
    };

    for (const notionalUsd of notionalLadderUsd) {
      try {
        const quote = await oneInchClient.requestQuote({
          fromTokenAddress: ETHEREUM_USDC,
          toTokenAddress: ethereumDeployment.address,
          amount: usdToUsdcAmount(notionalUsd),
          walletAddress,
          enableEstimate: true,
          source: "xstocks-strategy-lab",
        });

        symbolResult.attempts.push({
          notionalUsd,
          ok: true,
          quoteId: quote.quoteId,
          toTokenAmount: quote.toTokenAmount,
          recommendedPreset: quote.recommended_preset,
          priceImpactPercent: quote.priceImpactPercent ?? null,
          settlementAddress: quote.settlementAddress,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const match = message.match(
          /^1inch Fusion quote request failed with status (?<status>\d+):\s*(?<body>.*)$/su,
        );

        let parsedBody = null;

        if (match?.groups?.body) {
          try {
            parsedBody = JSON.parse(match.groups.body);
          } catch {
            parsedBody = {
              raw: match.groups.body,
            };
          }
        }

        symbolResult.attempts.push({
          notionalUsd,
          ok: false,
          statusCode: match?.groups?.status ? Number(match.groups.status) : null,
          code: parsedBody?.code ?? null,
          description: parsedBody?.description ?? message,
          message,
        });
      }
    }

    results.push(symbolResult);
  }

  const summary = {
    generatedAt,
    walletAddress,
    notionalLadderUsd,
    symbols,
    successfulSymbols: results
      .filter((result) => result.attempts.some((attempt) => attempt.ok))
      .map((result) => result.symbol),
    failedSymbols: results
      .filter((result) => !result.attempts.some((attempt) => attempt.ok))
      .map((result) => result.symbol),
    signerBoundary:
      "Live 1inch Fusion quotes are proven. Real submission still requires an explicit xStocks user wallet signer/private-key path; this runner does not submit orders.",
    bySymbol: results.map(summarizeResult),
  };

  await writeFile(
    resolve(outputDir, "quotes.json"),
    `${JSON.stringify(results, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    resolve(outputDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ outputDir, summary }, null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
});
