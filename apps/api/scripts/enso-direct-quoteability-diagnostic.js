import { readFileSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createXStocksBoundaryRepository } from "../../../packages/xstocks/dist/index.js";
import { createEnsoExecutionClient } from "../src/services/enso-execution-client.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const DEFAULT_SHARED_ENV_PATH =
  process.env.XSTOCKS_SHARED_ENV_PATH ??
  process.env.ATTN_SHARED_ENV_PATH ??
  resolve(process.env.HOME ?? "~", ".config/attn/shared.env");
const DEFAULT_SWEEP_AMOUNTS_USD = [200, 250, 300, 400, 500, 750, 1000];
const DEFAULT_SWEEP_SYMBOLS = ["MSFTx", "AAPLx", "METAx", "GOOGLx"];

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
  if (DEFAULT_SHARED_ENV_PATH) {
    loadEnvFromFile(DEFAULT_SHARED_ENV_PATH);
  }

  loadEnvFromFile(resolve(REPO_ROOT, ".vercel/.env.production.local"));
  loadEnvFromFile(resolve(REPO_ROOT, "apps/web/.env.local"));
}

function requiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required for the Enso direct diagnostic.`);
  }

  return value.trim();
}

function toAtomicUsdcAmount(notionalUsd) {
  return String(Math.round(Number(notionalUsd) * 1_000_000));
}

function buildRouteAction(leg, amountUsd = leg.targetNotionalUsd) {
  return {
    protocol: "enso",
    action: "route",
    args: {
      tokenIn: leg.paymentTokenAddress,
      tokenOut: leg.receivingTokenAddress,
      amountIn: toAtomicUsdcAmount(amountUsd),
      slippage: "100",
    },
  };
}

function parseEnsoError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/status (\d+):/u);
  const rawPayload = message.includes(": ")
    ? message.slice(message.indexOf(": ") + 2)
    : null;

  let payload = null;

  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = rawPayload;
    }
  }

  return {
    ok: false,
    message,
    statusCode: statusMatch ? Number(statusMatch[1]) : null,
    payload,
  };
}

async function writeArtifact(outputDir, fileName, value) {
  await writeFile(
    resolve(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function loadExecutionCreateFixture() {
  const explicitPath = process.env.XSTOCKS_ENSO_EXECUTION_CREATE_PATH;

  if (explicitPath) {
    return {
      path: explicitPath,
      executionCreate: JSON.parse(readFileSync(explicitPath, "utf8")),
    };
  }

  const proofRoot = resolve(REPO_ROOT, "tmp/proof");
  const candidates = (await readdir(proofRoot, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.startsWith("enso-portfolio-"),
    )
    .map((entry) => ({
      dirName: entry.name,
      executionCreatePath: resolve(proofRoot, entry.name, "execution-create.json"),
    }))
    .filter((entry) => {
      try {
        readFileSync(entry.executionCreatePath, "utf8");
        return true;
      } catch {
        return false;
      }
    })
    .sort((left, right) => right.dirName.localeCompare(left.dirName));

  if (candidates.length === 0) {
    throw new Error(
      "No Enso execution-create artifact was available. Set XSTOCKS_ENSO_EXECUTION_CREATE_PATH explicitly.",
    );
  }

  const selected = candidates[0];
  return {
    path: selected.executionCreatePath,
    executionCreate: JSON.parse(readFileSync(selected.executionCreatePath, "utf8")),
  };
}

async function captureApproval({ client, fromAddress, tokenAddress, amount }) {
  try {
    const response = await client.requestApproval({
      amount,
      chainId: 1,
      fromAddress,
      tokenAddress,
      routingStrategy: "router",
    });

    return {
      ok: true,
      response,
    };
  } catch (error) {
    return parseEnsoError(error);
  }
}

async function captureBundle({
  client,
  label,
  actions,
  fromAddress,
  receiver,
}) {
  try {
    const response = await client.requestBundle({
      actions,
      chainId: 1,
      fromAddress,
      receiver,
      routingStrategy: "router",
    });

    return {
      label,
      ok: true,
      receiver,
      actions,
      response,
    };
  } catch (error) {
    return {
      label,
      receiver,
      actions,
      ...parseEnsoError(error),
    };
  }
}

function summarizeCase(caseResult) {
  if (!caseResult.ok) {
    return {
      label: caseResult.label,
      ok: false,
      receiver: caseResult.receiver ?? null,
      statusCode: caseResult.statusCode,
      message: caseResult.message,
      requestId:
        typeof caseResult.payload?.requestId === "string"
          ? caseResult.payload.requestId
          : null,
    };
  }

  return {
    label: caseResult.label,
    ok: true,
    receiver: caseResult.receiver,
    txTo:
      typeof caseResult.response?.tx?.to === "string"
        ? caseResult.response.tx.to
        : null,
    routeCount: Array.isArray(caseResult.response?.route)
      ? caseResult.response.route.length
      : null,
    bundleCount: Array.isArray(caseResult.response?.bundle)
      ? caseResult.response.bundle.length
      : null,
    outputTokens: Object.keys(caseResult.response?.amountsOut ?? {}),
  };
}

const proofTimestamp = new Date().toISOString().replaceAll(":", "-");
const proofDir = resolve(
  REPO_ROOT,
  "tmp/proof",
  `enso-direct-diagnostic-${proofTimestamp}`,
);

const summary = {
  generatedAt: new Date().toISOString(),
  state: "starting",
  inputArtifactPath: null,
  ensoApiBaseUrl: null,
  signerAddress: null,
  settlementAddress: null,
  coreExactLegs: [],
  approval: null,
  receiverSensitivity: null,
  coreSixLegBundle: null,
  amountSweep: {},
  ausdBridgeSnapshot: null,
  blocker: null,
};

try {
  await mkdir(proofDir, { recursive: true });
  bootstrapEnvironment();

  const { path: inputArtifactPath, executionCreate } =
    await loadExecutionCreateFixture();
  const client = createEnsoExecutionClient({
    apiKey: requiredEnv("ENSO_API_KEY"),
    requestTimeoutMs: 30_000,
  });
  const boundaryRepository = createXStocksBoundaryRepository({});
  const executionRequest = executionCreate.executionRequest;
  const fromAddress = executionRequest.manualSignerAddress;
  const settlementAddress =
    executionRequest.executionDestinationAddress ??
    executionRequest.settlementAddress;
  const coreLegs = executionRequest.legs.filter((leg) => leg.state !== "blocked");

  summary.inputArtifactPath = inputArtifactPath;
  summary.ensoApiBaseUrl = client.baseUrl;
  summary.signerAddress = fromAddress;
  summary.settlementAddress = settlementAddress;
  summary.coreExactLegs = coreLegs.map((leg) => ({
    assetSymbol: leg.assetSymbol,
    amountUsd: leg.targetNotionalUsd,
    paymentTokenAddress: leg.paymentTokenAddress,
    receivingTokenAddress: leg.receivingTokenAddress,
  }));

  const approval = await captureApproval({
    client,
    fromAddress,
    tokenAddress: coreLegs[0]?.paymentTokenAddress,
    amount: toAtomicUsdcAmount(executionRequest.requestedNotionalUsd),
  });
  summary.approval = approval.ok
    ? {
        ok: true,
        txTo: approval.response?.tx?.to ?? null,
      }
    : approval;
  await writeArtifact(proofDir, "approval.json", approval);

  const directCases = [];

  for (const leg of coreLegs) {
    directCases.push(
      await captureBundle({
        client,
        label: `${leg.assetSymbol}:exact:settlement`,
        actions: [buildRouteAction(leg)],
        fromAddress,
        receiver: settlementAddress,
      }),
    );
    directCases.push(
      await captureBundle({
        client,
        label: `${leg.assetSymbol}:exact:signer`,
        actions: [buildRouteAction(leg)],
        fromAddress,
        receiver: fromAddress,
      }),
    );
  }

  const sweepCases = [];

  for (const amountUsd of DEFAULT_SWEEP_AMOUNTS_USD) {
    for (const leg of coreLegs.filter((item) =>
      DEFAULT_SWEEP_SYMBOLS.includes(item.assetSymbol),
    )) {
      sweepCases.push(
        await captureBundle({
          client,
          label: `${leg.assetSymbol}:sweep:${amountUsd}:settlement`,
          actions: [buildRouteAction(leg, amountUsd)],
          fromAddress,
          receiver: settlementAddress,
        }),
      );
    }
  }

  const sixLegSettlement = await captureBundle({
    client,
    label: "core6:exact:settlement",
    actions: coreLegs.map((leg) => buildRouteAction(leg)),
    fromAddress,
    receiver: settlementAddress,
  });
  const sixLegSigner = await captureBundle({
    client,
    label: "core6:exact:signer",
    actions: coreLegs.map((leg) => buildRouteAction(leg)),
    fromAddress,
    receiver: fromAddress,
  });
  const ausdBridgeSnapshot = await boundaryRepository.fetchAssetSnapshot("AUSD");

  summary.receiverSensitivity = Object.fromEntries(
    coreLegs.map((leg) => [
      leg.assetSymbol,
      {
        settlement: summarizeCase(
          directCases.find(
            (item) => item.label === `${leg.assetSymbol}:exact:settlement`,
          ),
        ),
        signer: summarizeCase(
          directCases.find((item) => item.label === `${leg.assetSymbol}:exact:signer`),
        ),
      },
    ]),
  );
  summary.coreSixLegBundle = {
    settlement: summarizeCase(sixLegSettlement),
    signer: summarizeCase(sixLegSigner),
  };
  summary.amountSweep = Object.fromEntries(
    DEFAULT_SWEEP_SYMBOLS.map((symbol) => [
      symbol,
      sweepCases
        .filter((item) => item.label.startsWith(`${symbol}:sweep:`))
        .map((item) => summarizeCase(item)),
    ]),
  );
  summary.ausdBridgeSnapshot = {
    source: ausdBridgeSnapshot.source,
    supportsAtomicSwaps:
      ausdBridgeSnapshot.deployments?.Ethereum?.supportsAtomicSwaps ?? null,
    address: ausdBridgeSnapshot.deployments?.Ethereum?.address ?? null,
    wrapperAddress: ausdBridgeSnapshot.deployments?.Ethereum?.wrapperAddress ?? null,
    stablecoinSymbols:
      ausdBridgeSnapshot.deployments?.Ethereum?.stablecoinSymbols ?? [],
    notes: ausdBridgeSnapshot.notes ?? [],
  };

  const exactFailures = coreLegs
    .map((leg) => ({
      assetSymbol: leg.assetSymbol,
      settlement: summary.receiverSensitivity[leg.assetSymbol].settlement,
      signer: summary.receiverSensitivity[leg.assetSymbol].signer,
    }))
    .filter((item) => !item.settlement.ok && !item.signer.ok)
    .map((item) => item.assetSymbol);

  summary.state = "completed";
  summary.blocker = {
    code: "direct_quoteability_matrix",
    stage: "upstream_enso_probe",
    message:
      exactFailures.length === 0
        ? "All direct core-leg Enso probes succeeded; remaining closure would depend on wallet signing and onchain submission."
        : `The direct Enso probe proves the remaining failing core legs are ${exactFailures.join(", ")}. Receiver choice does not change the failures, and the sweep still fails on those names through $1000.`,
    failingCoreLegs: exactFailures,
  };

  await writeArtifact(proofDir, "execution-create-input.json", executionCreate);
  await writeArtifact(proofDir, "direct-core-cases.json", directCases);
  await writeArtifact(proofDir, "direct-sweep-cases.json", sweepCases);
  await writeArtifact(proofDir, "core-6leg-settlement.json", sixLegSettlement);
  await writeArtifact(proofDir, "core-6leg-signer.json", sixLegSigner);
  await writeArtifact(proofDir, "ausd-bridge-snapshot.json", ausdBridgeSnapshot);
  await writeArtifact(proofDir, "summary.json", summary);
  process.stdout.write(`${JSON.stringify({ proofDir, summary }, null, 2)}\n`);
} catch (error) {
  summary.state = "blocked";
  summary.blocker = {
    code: "diagnostic_failed",
    stage: "diagnostic_startup",
    message: error instanceof Error ? error.message : String(error),
  };
  await mkdir(proofDir, { recursive: true });
  await writeArtifact(proofDir, "summary.json", summary);
  process.stdout.write(`${JSON.stringify({ proofDir, summary }, null, 2)}\n`);
  process.exitCode = 1;
}
