import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createResearchManifestRepository } from "../../api/src/repositories/research-manifest-repository.js";
import { createRuntimeStore } from "../../api/src/repositories/runtime-store.js";
import { runWorkerChecks } from "./check.js";
import { runBasketResearchWave } from "./run-basket-research-wave.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

export const AUTORESEARCH_RUNTIME_ID = "strategy_lab_regular_autoresearch_v1";
export const AUTORESEARCH_RUNTIME_OWNER = "worker_strategy_lab";
export const AUTORESEARCH_TRIGGER_SOURCE = Object.freeze({
  MANUAL_CLI: "manual_cli",
  SCHEDULED_CRON: "scheduled_cron",
});
export const AUTORESEARCH_TRUTH_BOUNDARY = "worker_runtime_only";
export const DEFAULT_AUTORESEARCH_CADENCE_HOURS = 24;

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter(Boolean).map((value) => String(value)))];
}

function pickBooleanReportStatus(reportSection) {
  return reportSection?.status === "ok";
}

function normalizeTriggerSource(triggerSource) {
  return Object.values(AUTORESEARCH_TRIGGER_SOURCE).includes(triggerSource)
    ? triggerSource
    : AUTORESEARCH_TRIGGER_SOURCE.MANUAL_CLI;
}

function createDefaultConfig() {
  return {
    repoRoot: REPO_ROOT,
    slotRegistryPath: resolve(
      REPO_ROOT,
      "packages/research/manifests/slot-registry.json",
    ),
    storePath: resolve(REPO_ROOT, "apps/api/data/runtime-store.json"),
  };
}

function getFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return undefined;
  }

  return argv[flagIndex + 1];
}

function hasFlag(argv, flagName) {
  return argv.includes(flagName);
}

function normalizeCadenceHours(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? normalized
    : DEFAULT_AUTORESEARCH_CADENCE_HOURS;
}

function summarizeSlotWaveReport(slotReport) {
  return {
    slotId: slotReport.slotId,
    executedChallengerCount: slotReport.executedChallengerCount,
    promotedChallengerCount: slotReport.promotedChallengerCount,
    endingIncumbent: slotReport.endingIncumbent,
    bestChallenger: slotReport.bestChallenger
      ? {
          candidateRef: slotReport.bestChallenger.candidateRef,
          status: slotReport.bestChallenger.status,
          deltaScore: slotReport.bestChallenger.deltaScore,
          strategyVersion: slotReport.bestChallenger.strategyVersion,
        }
      : null,
    operatorSummary: slotReport.operatorSummary,
  };
}

function manifestIdsBySlot(records) {
  return Object.fromEntries(
    records.map((record) => [record.slotId, record.manifest.manifestId]),
  );
}

function diffPromotedManifests(beforeBySlot, afterBySlot) {
  const changedSlots = Object.keys(afterBySlot).filter(
    (slotId) => beforeBySlot[slotId] !== afterBySlot[slotId],
  );

  return {
    changedSlots,
    promotionCount: changedSlots.length,
    previousManifestIds: uniqueStrings(Object.values(beforeBySlot)),
    nextManifestIds: uniqueStrings(Object.values(afterBySlot)),
    promotedManifestIds: changedSlots.map((slotId) => afterBySlot[slotId]),
  };
}

async function listPromotedRecords(manifestRepository) {
  const records = await manifestRepository.listPromotedRecords();
  return [...records].sort((left, right) => left.slotId.localeCompare(right.slotId));
}

export function parseAutoresearchRuntimeArgs(argv = process.argv.slice(2)) {
  const slotId = getFlagValue(argv, "--slot");
  const triggerSource = normalizeTriggerSource(
    getFlagValue(argv, "--trigger") ??
      AUTORESEARCH_TRIGGER_SOURCE.MANUAL_CLI,
  );

  return {
    slotIds: slotId ? [slotId] : undefined,
    cadenceHours: normalizeCadenceHours(getFlagValue(argv, "--cadence-hours")),
    triggerSource,
    note: getFlagValue(argv, "--note") ?? null,
    skipExisting: hasFlag(argv, "--skip-existing"),
  };
}

export function createAutoresearchRuntime(overrides = {}) {
  const config = {
    ...createDefaultConfig(),
    ...overrides,
  };
  const manifestRepository =
    overrides.manifestRepository ??
    createResearchManifestRepository({
      repoRoot: config.repoRoot,
      slotRegistryPath: config.slotRegistryPath,
    });
  const runtimeStore =
    overrides.runtimeStore ??
    createRuntimeStore({
      storePath: config.storePath,
      now: overrides.now,
    });
  const now = overrides.now ?? (() => new Date().toISOString());
  const runWave = overrides.runBasketResearchWave ?? runBasketResearchWave;
  const runChecks = overrides.runWorkerChecks ?? runWorkerChecks;

  return {
    async runRegularAutoresearch({
      slotIds,
      cadenceHours = DEFAULT_AUTORESEARCH_CADENCE_HOURS,
      triggerSource = AUTORESEARCH_TRIGGER_SOURCE.MANUAL_CLI,
      note = null,
      skipExisting = true,
    } = {}) {
      const startedAt = now();
      const runId = `autoresearch_${startedAt
        .replaceAll("-", "")
        .replaceAll(":", "")
        .replaceAll(".", "")
        .replaceAll("Z", "z")}_${randomUUID().slice(0, 8)}`;
      const normalizedTriggerSource = normalizeTriggerSource(triggerSource);
      const normalizedCadenceHours = normalizeCadenceHours(cadenceHours);
      const previousRecords = await listPromotedRecords(manifestRepository);
      const previousManifestIdsBySlot = manifestIdsBySlot(previousRecords);
      const selectedSlotIds =
        slotIds && slotIds.length > 0
          ? uniqueStrings(slotIds)
          : previousRecords
              .filter((record) => record.mode === "basket")
              .map((record) => record.slotId);

      await runtimeStore.beginAutoresearchRun({
        run: {
          runId,
          runtimeId: AUTORESEARCH_RUNTIME_ID,
          runtimeOwner: AUTORESEARCH_RUNTIME_OWNER,
          triggerSource: normalizedTriggerSource,
          cadenceHours: normalizedCadenceHours,
          status: "running",
          truthBoundary: AUTORESEARCH_TRUTH_BOUNDARY,
          recurringAutonomousProven: false,
          startedAt,
          slotIds: selectedSlotIds,
          baselineSeeded: true,
          waveExecuted: false,
          previousManifestIds: uniqueStrings(Object.values(previousManifestIdsBySlot)),
          note,
        },
      });

      try {
        const waveReport = runWave({
          slotIds: selectedSlotIds,
          emitReport: false,
          skipExisting,
        });
        const checkReport = runChecks();
        const nextRecords = await listPromotedRecords(manifestRepository);
        const nextManifestIdsBySlot = manifestIdsBySlot(nextRecords);
        const manifestDiff = diffPromotedManifests(
          previousManifestIdsBySlot,
          nextManifestIdsBySlot,
        );
        const completedAt = now();
        const summarizedSlots = (waveReport.slotReports ?? []).map(
          summarizeSlotWaveReport,
        );
        const normalizedRun = await runtimeStore.completeAutoresearchRun({
          run: {
            runId,
            runtimeId: AUTORESEARCH_RUNTIME_ID,
            runtimeOwner: AUTORESEARCH_RUNTIME_OWNER,
            triggerSource: normalizedTriggerSource,
            cadenceHours: normalizedCadenceHours,
            status: "succeeded",
            truthBoundary: AUTORESEARCH_TRUTH_BOUNDARY,
            recurringAutonomousProven: false,
            startedAt,
            completedAt,
            slotIds: selectedSlotIds,
            baselineSeeded: true,
            waveExecuted: true,
            previousManifestIds: manifestDiff.previousManifestIds,
            nextManifestIds: manifestDiff.nextManifestIds,
            promotedManifestIds: manifestDiff.promotedManifestIds,
            promotionCount: manifestDiff.promotionCount,
            checks: {
              researchContractsOk: pickBooleanReportStatus(
                checkReport.research_contracts,
              ),
              researchRunIntegrityOk: pickBooleanReportStatus(
                checkReport.research_run_integrity,
              ),
              promotedBoundaryOk: pickBooleanReportStatus(
                checkReport.promoted_boundary,
              ),
            },
            note,
          },
        });

        return {
          status: "ok",
          runId,
          runtimeId: AUTORESEARCH_RUNTIME_ID,
          runtimeOwner: AUTORESEARCH_RUNTIME_OWNER,
          truthBoundary: AUTORESEARCH_TRUTH_BOUNDARY,
          recurringAutonomousProven: false,
          triggerSource: normalizedTriggerSource,
          cadenceHours: normalizedCadenceHours,
          startedAt,
          completedAt,
          slotIds: selectedSlotIds,
          runtimePath: {
            packageScript: "pnpm --filter @xstocks/worker autoresearch:run",
            cliEntrypoint: "apps/worker/src/autoresearch-runtime.js",
            runtimeStorePath: "apps/api/data/runtime-store.json",
            researchWaveEntrypoint: "apps/worker/src/run-basket-research-wave.js",
          },
          baselineSeeded: true,
          waveExecuted: true,
          promotionCount: manifestDiff.promotionCount,
          promotedManifestIds: manifestDiff.promotedManifestIds,
          changedSlots: manifestDiff.changedSlots,
          previousManifestIds: manifestDiff.previousManifestIds,
          nextManifestIds: manifestDiff.nextManifestIds,
          slotReports: summarizedSlots,
          manifestReport: waveReport.manifestReport,
          checks: normalizedRun.checks,
          notes: [
            "This repo now owns a regular autoresearch worker runtime with persisted cadence state.",
            "Recurring autonomous execution is still unproven until an external scheduler host is independently verified.",
            "Promoted manifests remain the only canonical explanation source for product surfaces.",
          ],
        };
      } catch (error) {
        const completedAt = now();
        await runtimeStore.completeAutoresearchRun({
          run: {
            runId,
            runtimeId: AUTORESEARCH_RUNTIME_ID,
            runtimeOwner: AUTORESEARCH_RUNTIME_OWNER,
            triggerSource: normalizedTriggerSource,
            cadenceHours: normalizedCadenceHours,
            status: "failed",
            truthBoundary: AUTORESEARCH_TRUTH_BOUNDARY,
            recurringAutonomousProven: false,
            startedAt,
            completedAt,
            slotIds: selectedSlotIds,
            baselineSeeded: true,
            waveExecuted: false,
            previousManifestIds: uniqueStrings(Object.values(previousManifestIdsBySlot)),
            promotedManifestIds: [],
            promotionCount: 0,
            note,
            errorMessage: error.message,
          },
        });
        throw error;
      }
    },
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const runtime = createAutoresearchRuntime();
  const report = await runtime.runRegularAutoresearch(
    parseAutoresearchRuntimeArgs(),
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
