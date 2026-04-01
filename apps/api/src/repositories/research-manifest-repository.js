import { resolve } from "node:path";

import { parsePromotedSlotRegistryArtifact } from "../../../../packages/shared/dist/contracts/research.js";
import { adaptResearchPromotedManifest } from "../../../../packages/policy/src/index.js";

import { readJsonFile } from "../json.js";

function assertSlotRegistry(registry) {
  return parsePromotedSlotRegistryArtifact(registry);
}

function assertSlotEntry(slotId, slotEntry) {
  if (!slotEntry || typeof slotEntry !== "object") {
    throw new Error(`Strategy Lab slot registry entry is missing for ${slotId}.`);
  }

  if (typeof slotEntry.currentManifestPath !== "string" || slotEntry.currentManifestPath.length === 0) {
    throw new Error(`Strategy Lab slot registry entry ${slotId} is missing currentManifestPath.`);
  }

  if (
    !slotEntry.currentManifestRef ||
    typeof slotEntry.currentManifestRef.manifestId !== "string" ||
    slotEntry.currentManifestRef.manifestId.length === 0
  ) {
    throw new Error(`Strategy Lab slot registry entry ${slotId} is missing currentManifestRef.manifestId.`);
  }

  return slotEntry;
}

export function createResearchManifestRepository({
  repoRoot,
  slotRegistryPath,
}) {
  async function loadSlotRegistry() {
    return assertSlotRegistry(await readJsonFile(slotRegistryPath));
  }

  async function readPromotedManifestFromSlot(slotId, slotEntry) {
    const normalizedSlotEntry = assertSlotEntry(slotId, slotEntry);
    const rawManifest = await readJsonFile(
      resolve(repoRoot, normalizedSlotEntry.currentManifestPath),
    );
    if (typeof rawManifest?.manifestId !== "string" || rawManifest.manifestId.length === 0) {
      throw new Error(
        `Promoted manifest for slot ${slotId} must be a canonical research manifest with manifestId.`,
      );
    }
    const manifest = adaptResearchPromotedManifest(rawManifest);

    if (manifest.manifestId !== normalizedSlotEntry.currentManifestRef.manifestId) {
      throw new Error(
        `Promoted manifest mismatch for slot ${slotId}: registry points to ${normalizedSlotEntry.currentManifestRef.manifestId} but file contains ${manifest.manifestId}.`,
      );
    }

    return manifest;
  }

  async function readPromotedRecordFromSlot(slotId, slotEntry) {
    const manifest = await readPromotedManifestFromSlot(slotId, slotEntry);

    return {
      slotId,
      slot: slotEntry.slot,
      mode: slotEntry.mode,
      currentManifestRef: slotEntry.currentManifestRef,
      currentManifestPath: slotEntry.currentManifestPath,
      versionedManifestPath: slotEntry.versionedManifestPath,
      strategyVersion: slotEntry.strategyVersion,
      promotedAt: slotEntry.promotedAt,
      manifest,
    };
  }

  return {
    async readSlotRegistry() {
      return loadSlotRegistry();
    },
    async getPromotedRecordById(manifestId) {
      const registry = await loadSlotRegistry();

      for (const [slotId, slotEntry] of Object.entries(registry.slots)) {
        if (slotEntry.currentManifestRef?.manifestId !== manifestId) {
          continue;
        }

        return readPromotedRecordFromSlot(slotId, slotEntry);
      }

      return null;
    },
    async getPromotedRecordBySlot(slotId) {
      const registry = await loadSlotRegistry();
      const slotEntry = registry.slots[slotId];

      if (!slotEntry) {
        return null;
      }

      return readPromotedRecordFromSlot(slotId, slotEntry);
    },
    async listPromotedRecords() {
      const registry = await loadSlotRegistry();
      return Promise.all(
        Object.entries(registry.slots).map(([slotId, slotEntry]) =>
          readPromotedRecordFromSlot(slotId, slotEntry),
        ),
      );
    },
    async getPromotedManifestById(manifestId) {
      return (await this.getPromotedRecordById(manifestId))?.manifest ?? null;
    },
    async getPromotedManifestBySlot(slotId) {
      return (await this.getPromotedRecordBySlot(slotId))?.manifest ?? null;
    },
    async listPromotedManifests() {
      const records = await this.listPromotedRecords();
      return records.map((record) => record.manifest);
    },
  };
}
