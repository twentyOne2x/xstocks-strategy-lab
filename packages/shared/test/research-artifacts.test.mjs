import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import * as shared from "../dist/index.js";
import * as researchContracts from "../dist/contracts/research.js";
import { promotedActivationManifestSchema } from "../dist/contracts/activation.js";

function readJson(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  return JSON.parse(fs.readFileSync(fileUrl, "utf8"));
}

test("package root re-exports research artifact helpers", () => {
  shared.strategySlotSchema.parse(shared.ONBOARDING_DEFAULT_BASKET_SLOT);
  shared.strategySlotSchema.parse(shared.ADVANCED_DEFAULT_DIRECTIONAL_SLOT);

  assert.equal(
    shared.parsePromotedSlotRegistryArtifact,
    researchContracts.parsePromotedSlotRegistryArtifact,
  );
  assert.equal(
    shared.parsePromotedIncumbentArtifact,
    researchContracts.parsePromotedIncumbentArtifact,
  );
  assert.equal(
    shared.normalizePromotedSlotRegistryArtifact,
    researchContracts.normalizePromotedSlotRegistryArtifact,
  );
  assert.equal(
    shared.normalizePromotedSlotRegistryEntryManifestRef,
    researchContracts.normalizePromotedSlotRegistryEntryManifestRef,
  );
  assert.equal(
    shared.normalizePromotedIncumbentArtifactManifestRef,
    researchContracts.normalizePromotedIncumbentArtifactManifestRef,
  );
});

test("real promoted slot registry artifact parses and normalizes", () => {
  const registry = readJson("../../research/manifests/slot-registry.json");
  const basketManifest = readJson(
    "../../research/manifests/promoted/onboarding.default_basket/current.json",
  );
  const directionalManifest = readJson(
    "../../research/manifests/promoted/advanced.default_directional/current.json",
  );

  const parsedRegistry = shared.parsePromotedSlotRegistryArtifact(registry);
  const normalizedRegistry = shared.normalizePromotedSlotRegistryArtifact(
    parsedRegistry,
  );
  const directionalManifestRef = shared.normalizePromotedSlotRegistryEntryManifestRef(
    parsedRegistry.slots["advanced.default_directional"],
  );

  const parsedBasketManifest = promotedActivationManifestSchema.parse(basketManifest);
  const parsedDirectionalManifest =
    promotedActivationManifestSchema.parse(directionalManifest);
  shared.slotRegistrySchema.parse(normalizedRegistry);

  assert.equal(
    parsedBasketManifest.explanation_bundle?.truth_mode,
    "promoted_incumbent_and_run_summary_only",
  );
  assert.match(
    parsedBasketManifest.tuning_summary?.headline ?? "",
    /300 bps rebalance trigger/i,
  );
  assert.equal(parsedDirectionalManifest.explanation_bundle, undefined);
  assert.equal(parsedDirectionalManifest.tuning_summary, undefined);

  assert.equal(
    normalizedRegistry.slots["onboarding.default_basket"].current_manifest_id,
    basketManifest.manifest_id,
  );
  assert.equal(
    normalizedRegistry.slots["advanced.default_directional"].current_manifest_id,
    directionalManifest.manifest_id,
  );
  assert.equal(directionalManifestRef.manifest_id, directionalManifest.manifest_id);
  assert.equal(
    directionalManifestRef.strategy_version,
    directionalManifest.strategy_version,
  );
});

test("real promoted incumbent artifacts parse and normalize to current manifest refs", () => {
  const basketIncumbent = readJson(
    "../../research/incumbents/basket/onboarding.default_basket.json",
  );
  const directionalIncumbent = readJson(
    "../../research/incumbents/directional/advanced.default_directional.json",
  );
  const basketManifest = readJson(
    "../../research/manifests/promoted/onboarding.default_basket/current.json",
  );
  const directionalManifest = readJson(
    "../../research/manifests/promoted/advanced.default_directional/current.json",
  );

  const parsedBasketIncumbent = shared.parsePromotedIncumbentArtifact(
    basketIncumbent,
  );
  const parsedDirectionalIncumbent = shared.parsePromotedIncumbentArtifact(
    directionalIncumbent,
  );
  const basketManifestRef = shared.normalizePromotedIncumbentArtifactManifestRef(
    parsedBasketIncumbent,
  );
  const directionalManifestRef =
    shared.normalizePromotedIncumbentArtifactManifestRef(
      parsedDirectionalIncumbent,
    );

  assert.equal(basketManifestRef.manifest_id, basketManifest.manifest_id);
  assert.equal(
    basketManifestRef.strategy_version,
    basketManifest.strategy_version,
  );
  assert.equal(
    basketManifestRef.promoted_at,
    basketManifest.validation.promoted_at,
  );
  assert.equal(
    directionalManifestRef.manifest_id,
    directionalManifest.manifest_id,
  );
  assert.equal(
    directionalManifestRef.strategy_version,
    directionalManifest.strategy_version,
  );
  assert.equal(
    directionalManifestRef.promoted_at,
    directionalManifest.validation.promoted_at,
  );
});
