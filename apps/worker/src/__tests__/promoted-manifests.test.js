import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { adaptResearchPromotedManifest } from "../../../../packages/policy/src/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);

async function readJson(relativePathOrAbsolutePath) {
  const filePath = relativePathOrAbsolutePath.startsWith("/")
    ? relativePathOrAbsolutePath
    : resolve(REPO_ROOT, relativePathOrAbsolutePath);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readPromotedSlotRegistry() {
  return readJson(SLOT_REGISTRY_PATH);
}

async function readAdaptedManifest(relativePath) {
  return adaptResearchPromotedManifest(await readJson(relativePath));
}

test("promoted boundary stays registry-only, shared-shaped, and challenger-free", async () => {
  const registry = await readPromotedSlotRegistry();

  assert.equal(registry.authority, "promoted_manifests_only");
  assert.ok(registry.slots["onboarding.default_basket"]);
  assert.ok(registry.slots["onboarding.alt_basket_1"]);
  assert.ok(registry.slots["onboarding.alt_basket_2"]);
  assert.ok(registry.slots["advanced.default_directional"]);

  for (const [, slotEntry] of Object.entries(registry.slots)) {
    const manifest = await readAdaptedManifest(slotEntry.currentManifestPath);
    assert.equal(manifest.promoted, true);
    assert.ok(Array.isArray(manifest.requiredRoutes));
    assert.ok(Array.isArray(manifest.requiredAssets));
  }
});

test("public read surface resolves current and versioned manifests for every registry slot", async () => {
  const registry = await readPromotedSlotRegistry();

  for (const [slotId, slotEntry] of Object.entries(registry.slots)) {
    const currentManifest = await readAdaptedManifest(slotEntry.currentManifestPath);
    const versionedManifest = await readAdaptedManifest(
      slotEntry.versionedManifestPath,
    );

    assert.equal(currentManifest.slotId, slotId);
    assert.equal(currentManifest.manifestId, slotEntry.currentManifestRef.manifestId);
    assert.equal(versionedManifest.manifestId, currentManifest.manifestId);
    assert.equal(versionedManifest.strategyVersion, slotEntry.currentManifestRef.strategyVersion);
  }
});

test("directional promoted manifest stays preview-only and not executable", async () => {
  const registry = await readPromotedSlotRegistry();
  const manifest = await readAdaptedManifest(
    registry.slots["advanced.default_directional"].currentManifestPath,
  );
  const disableConditions = new Set(manifest.fallback.disableConditions);

  assert.equal(manifest.mode, "directional");
  assert.equal(manifest.executionBoundary.promoted, true);
  assert.equal(manifest.activationTemplate.mode, "directional");
  assert.equal(manifest.requiredRoutes[0].routeKind, "directional_market");
  assert.equal(manifest.routeValidation.executionEligibility, "preview_only");
  assert.equal(manifest.routeValidation.surfaceTruth, "preview");
  assert.equal(manifest.frontend.badges.includes("preview_only"), true);
  assert.equal(disableConditions.has("preview_only"), true);
  assert.equal(disableConditions.has("route_unverified"), true);
  assert.equal(disableConditions.has("directional_activation_disabled"), true);
});
