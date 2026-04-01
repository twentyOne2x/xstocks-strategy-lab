import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTORESEARCH_DEPLOYED_TRUTH_BOUNDARY,
  buildRailwayAutoresearchReceipt,
} from "../autoresearch-railway-cron.js";

test("railway cron receipt flips runtime truth only when host metadata exists", () => {
  const receipt = buildRailwayAutoresearchReceipt({
    runtimeState: {
      runtimeId: "strategy_lab_regular_autoresearch_v1",
      runtimeOwner: "worker_strategy_lab",
      supportedTriggerSources: ["manual_cli", "scheduled_cron"],
      nextDueAt: "2026-04-02T06:05:00.000Z",
    },
    run: {
      runId: "autoresearch_1",
      runtimeId: "strategy_lab_regular_autoresearch_v1",
      runtimeOwner: "worker_strategy_lab",
      triggerSource: "scheduled_cron",
      cadenceHours: 24,
      status: "succeeded",
      truthBoundary: "worker_runtime_only",
      recurringAutonomousProven: false,
      startedAt: "2026-04-01T06:05:00.000Z",
      completedAt: "2026-04-01T06:06:00.000Z",
      slotIds: ["onboarding.default_basket"],
      baselineSeeded: true,
      waveExecuted: true,
      previousManifestIds: ["manifest_a"],
      nextManifestIds: ["manifest_b"],
      promotedManifestIds: ["manifest_b"],
      promotionCount: 1,
      checks: {
        researchContractsOk: true,
        researchRunIntegrityOk: true,
        promotedBoundaryOk: true,
      },
      note: "railway cron service",
      errorMessage: null,
    },
    env: {
      RAILWAY_PROJECT_ID: "project_1",
      RAILWAY_PROJECT_NAME: "xstocks-strategy-lab-preview",
      RAILWAY_ENVIRONMENT_ID: "env_1",
      RAILWAY_ENVIRONMENT_NAME: "production",
      RAILWAY_SERVICE_ID: "svc_1",
      RAILWAY_SERVICE_NAME: "autoresearch-worker",
      RAILWAY_DEPLOYMENT_ID: "dep_1",
      RAILWAY_SNAPSHOT_ID: "snap_1",
      RAILWAY_PUBLIC_DOMAIN: null,
      RAILWAY_PRIVATE_DOMAIN: "autoresearch-worker.railway.internal",
      RAILWAY_GIT_COMMIT_SHA: "abc123",
      RAILWAY_GIT_BRANCH: "main",
      AUTORESEARCH_CRON_SCHEDULE: "5 6 * * *",
    },
    receiptCapturedAt: "2026-04-01T06:06:05.000Z",
  });

  assert.equal(
    receipt.runtime.truthBoundary,
    AUTORESEARCH_DEPLOYED_TRUTH_BOUNDARY,
  );
  assert.equal(receipt.runtime.recurringAutonomousProven, true);
  assert.equal(receipt.runtime.schedulerHost?.serviceName, "autoresearch-worker");
  assert.equal(receipt.run.schedulerReceipt?.deploymentId, "dep_1");
  assert.equal(receipt.run.schedulerReceipt?.cronSchedule, "5 6 * * *");
});
