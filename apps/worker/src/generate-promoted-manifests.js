import { fileURLToPath } from "node:url";

import {
  buildActivationManifest,
  buildSlotRegistry,
  listPublicStrategySlots,
  loadIncumbentForSlot,
  toRepoRelative,
  writeActivationManifest,
  writeSlotRegistry,
} from "../../../packages/research/src/index.js";
import { seedDirectionalPreview } from "./seed-directional-preview.js";

function requestedSlotIds() {
  const slotFlagIndex = process.argv.indexOf("--slot");
  if (slotFlagIndex === -1) {
    return listPublicStrategySlots().map((slot) => slot.slotId);
  }

  const slotId = process.argv[slotFlagIndex + 1];
  if (!slotId) {
    throw new Error("Expected a slot ID after --slot");
  }

  return [slotId];
}

function ensureIncumbentForSlot(slot) {
  let incumbent = loadIncumbentForSlot(slot.slotId);
  if (!incumbent && slot.mode === "directional") {
    seedDirectionalPreview({ emitReport: false });
    incumbent = loadIncumbentForSlot(slot.slotId);
  }

  if (!incumbent) {
    throw new Error(`No promoted incumbent found for ${slot.slotId}. Seed the lane first.`);
  }

  return incumbent;
}

export function generatePromotedManifests(slotIds = requestedSlotIds(), options = {}) {
  const emitReport = options.emitReport ?? true;
  const requestedSet = new Set(slotIds);
  const manifestEntries = listPublicStrategySlots().map((slot) => {
    const incumbent = ensureIncumbentForSlot(slot);
    const manifest = buildActivationManifest(incumbent);
    const paths = writeActivationManifest(manifest);

    return {
      slot,
      manifest,
      paths,
    };
  });

  const registry = buildSlotRegistry(manifestEntries);
  const registryPath = writeSlotRegistry(registry);
  const report = {
    status: "ok",
    promotedSlots: manifestEntries
      .filter(({ manifest }) => requestedSet.has(manifest.slotId))
      .map(({ manifest, paths }) => ({
        slotId: manifest.slotId,
        manifestId: manifest.manifestId,
        currentManifestPath: toRepoRelative(paths.currentPath),
        tuningHeadline: manifest.tuningSummary?.headline ?? null,
    })),
    slotRegistryPath: toRepoRelative(registryPath),
  };

  if (emitReport) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  generatePromotedManifests();
}
