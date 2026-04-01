import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { createRuntimeStore } from "../../../../apps/api/src/repositories/runtime-store.js";
import {
  AUTORESEARCH_RUNTIME_ID,
  AUTORESEARCH_RUNTIME_OWNER,
  AUTORESEARCH_TRUTH_BOUNDARY,
  createAutoresearchRuntime,
} from "../autoresearch-runtime.js";

function createPromotedRecord(slotId, manifestId, mode = "basket") {
  return {
    slotId,
    mode,
    manifest: {
      manifestId,
    },
  };
}

async function createHarness() {
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-autoresearch-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const runtimeStore = createRuntimeStore({
    storePath,
    now: () => "2026-04-01T09:00:00.000Z",
  });
  let manifestReadCount = 0;
  const beforeRecords = [
    createPromotedRecord(
      "advanced.default_directional",
      "advanced.default_directional:directional-preview-v1:promoted",
      "directional",
    ),
    createPromotedRecord(
      "onboarding.alt_basket_1",
      "onboarding.alt_basket_1:baseline-v1:promoted",
    ),
    createPromotedRecord(
      "onboarding.alt_basket_2",
      "onboarding.alt_basket_2:baseline-v1:promoted",
    ),
    createPromotedRecord(
      "onboarding.default_basket",
      "onboarding.default_basket:baseline-v1:promoted",
    ),
  ];
  const afterRecords = [
    createPromotedRecord(
      "advanced.default_directional",
      "advanced.default_directional:directional-preview-v1:promoted",
      "directional",
    ),
    createPromotedRecord(
      "onboarding.alt_basket_1",
      "onboarding.alt_basket_1:baseline-v1:promoted",
    ),
    createPromotedRecord(
      "onboarding.alt_basket_2",
      "onboarding.alt_basket_2:baseline-v1:promoted",
    ),
    createPromotedRecord(
      "onboarding.default_basket",
      "onboarding.default_basket:starter-trim-v2:promoted",
    ),
  ];
  const manifestRepository = {
    async listPromotedRecords() {
      manifestReadCount += 1;
      return manifestReadCount === 1 ? beforeRecords : afterRecords;
    },
  };
  const runtime = createAutoresearchRuntime({
    runtimeStore,
    manifestRepository,
    now: () => "2026-04-01T09:00:00.000Z",
    runBasketResearchWave: () => ({
      status: "ok",
      slotReports: [
        {
          slotId: "onboarding.default_basket",
          executedChallengerCount: 4,
          promotedChallengerCount: 1,
          endingIncumbent: {
            incumbentId: "incumbent_1",
            runId: "run_1",
            strategyVersion: "starter-trim-v2",
            score: 1.42,
            promotedAt: "2026-04-01T09:00:00.000Z",
          },
          bestChallenger: {
            candidateRef: "candidate_1",
            status: "keep",
            deltaScore: 0.18,
            strategyVersion: "starter-trim-v2",
          },
          operatorSummary: {
            headline: "Starter trim won.",
          },
        },
      ],
      manifestReport: {
        promotedSlots: [
          {
            slotId: "onboarding.default_basket",
            manifestId: "onboarding.default_basket:starter-trim-v2:promoted",
          },
        ],
      },
    }),
    runWorkerChecks: () => ({
      research_contracts: { status: "ok" },
      research_run_integrity: { status: "ok" },
      promoted_boundary: { status: "ok" },
    }),
  });

  return {
    runtimeStore,
    runtime,
  };
}

test("autoresearch runtime records persisted cadence state and promotions", async () => {
  const harness = await createHarness();
  const report = await harness.runtime.runRegularAutoresearch({
    cadenceHours: 24,
    note: "daily refresh",
  });
  const runtimeState = await harness.runtimeStore.getAutoresearchRuntime();
  const [run] = await harness.runtimeStore.listAutoresearchRuns({ limit: 1 });

  assert.equal(report.status, "ok");
  assert.equal(report.runtimeId, AUTORESEARCH_RUNTIME_ID);
  assert.equal(report.runtimeOwner, AUTORESEARCH_RUNTIME_OWNER);
  assert.equal(report.truthBoundary, AUTORESEARCH_TRUTH_BOUNDARY);
  assert.equal(report.recurringAutonomousProven, false);
  assert.equal(report.promotionCount, 1);
  assert.deepEqual(report.promotedManifestIds, [
    "onboarding.default_basket:starter-trim-v2:promoted",
  ]);
  assert.equal(report.runtimePath.packageScript, "pnpm --filter @xstocks/worker autoresearch:run");

  assert.equal(runtimeState.runtimeId, AUTORESEARCH_RUNTIME_ID);
  assert.equal(runtimeState.status, "idle");
  assert.equal(runtimeState.recurringAutonomousProven, false);
  assert.equal(runtimeState.lastPromotionCount, 1);
  assert.equal(runtimeState.lastTriggerSource, "manual_cli");
  assert.equal(
    runtimeState.nextDueAt,
    "2026-04-02T09:00:00.000Z",
  );

  assert.equal(run.status, "succeeded");
  assert.equal(run.triggerSource, "manual_cli");
  assert.equal(run.cadenceHours, 24);
  assert.equal(run.waveExecuted, true);
  assert.equal(run.promotionCount, 1);
  assert.equal(run.checks.promotedBoundaryOk, true);
  assert.equal(run.note, "daily refresh");
});
