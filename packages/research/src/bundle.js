import path from "node:path";

import {
  CHAIN,
  CHAIN_ID,
  DATASET_VERSION,
  EVALUATOR_VERSION,
  LIVE_TRUTH_SOURCE_ID,
  MANUAL_VERSION,
  OBJECTIVES,
  RESEARCH_DATASET_ID,
  UNIVERSE_ID,
  VALIDATION_SET_ID,
} from "./constants.js";
import { readJson } from "./fs.js";
import { bundleDir, bundleManifestPath } from "./paths.js";

const REQUIRED_ARTIFACTS = [
  "universe_snapshot",
  "starter_baskets",
  "prices",
  "multipliers",
  "halts_and_status",
  "euler_market_map",
  "execution_cost_model",
  "validation_windows",
];

export function loadResearchBundle() {
  const manifest = readJson(bundleManifestPath);
  const artifacts = Object.fromEntries(
    manifest.artifacts.map((artifact) => [
      artifact.artifact_id,
      readJson(path.join(bundleDir, artifact.path)),
    ]),
  );

  return {
    manifest,
    universeSnapshot: artifacts.universe_snapshot,
    starterBaskets: artifacts.starter_baskets,
    prices: artifacts.prices,
    multipliers: artifacts.multipliers,
    haltsAndStatus: artifacts.halts_and_status,
    eulerMarketMap: artifacts.euler_market_map,
    executionCostModel: artifacts.execution_cost_model,
    validationWindows: artifacts.validation_windows,
  };
}

export function validateResearchBundle(bundle = loadResearchBundle()) {
  const artifactIds = new Set(bundle.manifest.artifacts.map((artifact) => artifact.artifact_id));
  for (const requiredArtifact of REQUIRED_ARTIFACTS) {
    if (!artifactIds.has(requiredArtifact)) {
      throw new Error(`Missing required research artifact: ${requiredArtifact}`);
    }
  }

  if (bundle.manifest.research_dataset_id !== RESEARCH_DATASET_ID) {
    throw new Error(`Unexpected research_dataset_id: ${bundle.manifest.research_dataset_id}`);
  }

  if (bundle.manifest.dataset_version !== DATASET_VERSION) {
    throw new Error(`Unexpected dataset_version: ${bundle.manifest.dataset_version}`);
  }

  if (bundle.manifest.chain !== CHAIN || bundle.manifest.chain_id !== CHAIN_ID) {
    throw new Error("Frozen chain semantics drifted.");
  }

  if (bundle.manifest.live_truth_source_id !== LIVE_TRUTH_SOURCE_ID) {
    throw new Error("Unexpected live truth source.");
  }

  if (bundle.manifest.manual_version !== MANUAL_VERSION) {
    throw new Error("Unexpected manual version.");
  }

  if (bundle.manifest.evaluator_version !== EVALUATOR_VERSION) {
    throw new Error("Unexpected evaluator version.");
  }

  if (bundle.manifest.objective_ids.basket !== OBJECTIVES.basket) {
    throw new Error("Unexpected basket objective ID.");
  }

  if (bundle.manifest.objective_ids.directional !== OBJECTIVES.directional) {
    throw new Error("Unexpected directional objective ID.");
  }

  if (bundle.manifest.universe_id !== UNIVERSE_ID) {
    throw new Error("Unexpected universe ID.");
  }

  if (bundle.validationWindows.validation_set_id !== VALIDATION_SET_ID) {
    throw new Error("Unexpected validation set ID.");
  }

  const validationWindows = bundle.validationWindows.windows ?? [];
  const primaryWindowId = bundle.validationWindows.primary_window_id ?? validationWindows[0]?.window_id;
  const primaryWindow = validationWindows.find((window) => window.window_id === primaryWindowId);

  if (!primaryWindow) {
    throw new Error(`Missing primary validation window: ${primaryWindowId}`);
  }

  return {
    status: "ok",
    research_dataset_id: bundle.manifest.research_dataset_id,
    dataset_version: bundle.manifest.dataset_version,
    artifact_count: bundle.manifest.artifacts.length,
    primary_window_id: primaryWindowId,
  };
}

export function getStarterBasket(bundle, basketId) {
  const basket = bundle.starterBaskets.baskets.find((entry) => entry.basket_id === basketId);
  if (!basket) {
    throw new Error(`Unknown starter basket: ${basketId}`);
  }

  return basket;
}

export function getUniverseAsset(bundle, symbol) {
  const asset = bundle.universeSnapshot.assets.find((entry) => entry.symbol === symbol);
  if (!asset) {
    throw new Error(`Unknown universe symbol: ${symbol}`);
  }

  return asset;
}
