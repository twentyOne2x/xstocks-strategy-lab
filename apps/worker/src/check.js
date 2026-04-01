import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  listPublicStrategySlots,
  loadIncumbentForSlot,
  readResultsLedger,
  readRunSummary,
  validateContracts,
} from "../../../packages/research/src/index.js";
import { adaptResearchPromotedManifest } from "../../../packages/policy/src/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);

function readJson(relativePathOrAbsolutePath) {
  const filePath = relativePathOrAbsolutePath.startsWith("/")
    ? relativePathOrAbsolutePath
    : resolve(REPO_ROOT, relativePathOrAbsolutePath);

  return JSON.parse(readFileSync(filePath, "utf8"));
}

function validatePromotedBoundarySurface() {
  const registry = readJson(SLOT_REGISTRY_PATH);
  const validatedSlots = [];

  for (const [slotId, slotEntry] of Object.entries(registry.slots ?? {})) {
    const currentManifest = adaptResearchPromotedManifest(
      readJson(slotEntry.currentManifestPath),
    );
    const versionedManifest = adaptResearchPromotedManifest(
      readJson(slotEntry.versionedManifestPath),
    );

    if (currentManifest.slotId !== slotId) {
      throw new Error(
        `Current promoted manifest slot mismatch for ${slotId}: received ${currentManifest.slotId}.`,
      );
    }

    if (currentManifest.manifestId !== slotEntry.currentManifestRef.manifestId) {
      throw new Error(
        `Current promoted manifest mismatch for ${slotId}: registry points to ${slotEntry.currentManifestRef.manifestId} but file contains ${currentManifest.manifestId}.`,
      );
    }

    if (versionedManifest.strategyVersion !== slotEntry.currentManifestRef.strategyVersion) {
      throw new Error(
        `Versioned manifest mismatch for ${slotId}: expected ${slotEntry.currentManifestRef.strategyVersion} but received ${versionedManifest.strategyVersion}.`,
      );
    }

    validatedSlots.push({
      slotId,
      manifestId: currentManifest.manifestId,
      strategyVersion: currentManifest.strategyVersion,
    });
  }

  return {
    status: "ok",
    authority: registry.authority,
    validatedSlots,
  };
}

function validateResearchRunIntegrity() {
  const rows = readResultsLedger();
  const runIdCollisions = new Map();

  for (const row of rows) {
    const collisions = runIdCollisions.get(row.runId) ?? [];
    collisions.push({
      slotId: row.slotId,
      candidateRef: row.candidateRef,
      status: row.status,
      completedAtUtc: row.completedAtUtc,
    });
    runIdCollisions.set(row.runId, collisions);
  }

  const duplicateRunIds = [...runIdCollisions.entries()]
    .filter(([, collisions]) => collisions.length > 1)
    .map(([runId, collisions]) => ({
      runId,
      collisions,
    }));

  if (duplicateRunIds.length > 0) {
    throw new Error(
      `Duplicate runId entries detected in research ledger: ${JSON.stringify(duplicateRunIds, null, 2)}`,
    );
  }

  const validatedIncumbents = listPublicStrategySlots().map((slot) => {
    const incumbent = loadIncumbentForSlot(slot.slotId);

    if (!incumbent) {
      throw new Error(`Missing promoted incumbent for ${slot.slotId}.`);
    }

    const summary = readRunSummary(incumbent.runId);

    if (!summary) {
      throw new Error(`Missing run summary for promoted incumbent ${slot.slotId} at ${incumbent.runId}.`);
    }

    if (summary.slotId !== incumbent.slotId) {
      throw new Error(
        `Promoted incumbent summary slot mismatch for ${slot.slotId}: received ${summary.slotId}.`,
      );
    }

    if (summary.candidateRef !== incumbent.research.candidateRef) {
      throw new Error(
        `Promoted incumbent summary candidate mismatch for ${slot.slotId}: expected ${incumbent.research.candidateRef} but received ${summary.candidateRef}.`,
      );
    }

    return {
      slotId: slot.slotId,
      incumbentRunId: incumbent.runId,
      candidateRef: incumbent.research.candidateRef,
    };
  });

  return {
    status: "ok",
    ledgerRows: rows.length,
    validatedIncumbents,
  };
}

export function runWorkerChecks() {
  const report = {
    research_contracts: validateContracts(),
    research_run_integrity: validateResearchRunIntegrity(),
    promoted_boundary: validatePromotedBoundarySurface(),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runWorkerChecks();
}
