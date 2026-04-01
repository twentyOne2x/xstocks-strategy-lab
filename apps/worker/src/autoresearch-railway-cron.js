import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRuntimeStore } from "../../api/src/repositories/runtime-store.js";
import {
  AUTORESEARCH_TRIGGER_SOURCE,
  DEFAULT_AUTORESEARCH_CADENCE_HOURS,
  createAutoresearchRuntime,
} from "./autoresearch-runtime.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

export const AUTORESEARCH_DEPLOYED_TRUTH_BOUNDARY = "railway_cron_service";
export const AUTORESEARCH_RAILWAY_HOST_KIND = "cron_service";
export const DEFAULT_AUTORESEARCH_PROOF_API_URL =
  "http://api.railway.internal:8080/api/internal/autoresearch/receipts";

function normalizePositiveNumber(value, fallback) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
}

function buildRailwaySchedulerHost(env = process.env) {
  const host = {
    provider: "railway",
    hostKind: AUTORESEARCH_RAILWAY_HOST_KIND,
    projectId: env.RAILWAY_PROJECT_ID ?? null,
    projectName: env.RAILWAY_PROJECT_NAME ?? null,
    environmentId: env.RAILWAY_ENVIRONMENT_ID ?? null,
    environmentName: env.RAILWAY_ENVIRONMENT_NAME ?? null,
    serviceId: env.RAILWAY_SERVICE_ID ?? null,
    serviceName: env.RAILWAY_SERVICE_NAME ?? null,
    cronSchedule: env.AUTORESEARCH_CRON_SCHEDULE ?? null,
  };

  return Object.values(host).every(Boolean) ? host : null;
}

function buildRailwaySchedulerReceipt({
  env = process.env,
  receiptCapturedAt,
  schedulerHost,
}) {
  if (!schedulerHost) {
    return null;
  }

  const receipt = {
    ...schedulerHost,
    receiptCapturedAt,
    deploymentId: env.RAILWAY_DEPLOYMENT_ID ?? null,
    snapshotId: env.RAILWAY_SNAPSHOT_ID ?? null,
    publicDomain: env.RAILWAY_PUBLIC_DOMAIN ?? null,
    privateDomain: env.RAILWAY_PRIVATE_DOMAIN ?? null,
    gitCommitSha: env.RAILWAY_GIT_COMMIT_SHA ?? null,
    gitBranch: env.RAILWAY_GIT_BRANCH ?? null,
  };

  return receipt.deploymentId && receipt.snapshotId ? receipt : null;
}

function getDeployedAutoresearchNotes({ schedulerHost }) {
  return [
    "Repo-owned worker runtime exists for regular basket autoresearch refresh.",
    `Recurring autoresearch is now hosted by Railway ${schedulerHost.hostKind} ${schedulerHost.serviceName} in ${schedulerHost.environmentName}.`,
    `Railway scheduler cadence is ${schedulerHost.cronSchedule}.`,
    "Promoted manifests remain the only public explanation boundary.",
  ];
}

function attachPayload(error, payload) {
  error.payload = payload;
  return error;
}

export function buildRailwayAutoresearchReceipt({
  runtimeState,
  run,
  env = process.env,
  receiptCapturedAt = new Date().toISOString(),
}) {
  const schedulerHost = buildRailwaySchedulerHost(env);

  if (!schedulerHost) {
    throw new Error(
      "Railway scheduler host metadata is incomplete. Missing one or more Railway host environment variables.",
    );
  }

  const schedulerReceipt = buildRailwaySchedulerReceipt({
    env,
    receiptCapturedAt,
    schedulerHost,
  });

  if (!schedulerReceipt) {
    throw new Error(
      "Railway scheduler receipt is incomplete. Missing RAILWAY_DEPLOYMENT_ID or RAILWAY_SNAPSHOT_ID.",
    );
  }

  return {
    runtime: {
      runtimeId: runtimeState.runtimeId,
      runtimeOwner: runtimeState.runtimeOwner,
      cadenceHours: run.cadenceHours,
      status: run.status === "failed" ? "failed" : "idle",
      truthBoundary: AUTORESEARCH_DEPLOYED_TRUTH_BOUNDARY,
      repoOwnedRuntime: true,
      recurringAutonomousProven: true,
      supportedTriggerSources: runtimeState.supportedTriggerSources,
      notes: getDeployedAutoresearchNotes({ schedulerHost }),
      lastRequestedAt: run.startedAt,
      lastStartedAt: run.startedAt,
      lastCompletedAt: run.completedAt,
      lastRunId: run.runId,
      lastTriggerSource: run.triggerSource,
      nextDueAt: runtimeState.nextDueAt,
      lastPromotionCount: run.promotionCount,
      lastPromotedManifestIds: run.promotedManifestIds,
      schedulerHost,
      proofUpdatedAt: schedulerReceipt.receiptCapturedAt,
    },
    run: {
      ...run,
      truthBoundary: AUTORESEARCH_DEPLOYED_TRUTH_BOUNDARY,
      recurringAutonomousProven: true,
      schedulerReceipt,
    },
  };
}

export async function postAutoresearchReceipt({
  receipt,
  url = process.env.AUTORESEARCH_PROOF_API_URL ??
    DEFAULT_AUTORESEARCH_PROOF_API_URL,
  token = process.env.AUTORESEARCH_PROOF_TOKEN ?? null,
  fetchImpl = fetch,
}) {
  if (!url) {
    return null;
  }

  if (!token) {
    throw new Error(
      "AUTORESEARCH_PROOF_TOKEN is required when AUTORESEARCH_PROOF_API_URL is configured.",
    );
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Autoresearch-Proof-Token": token,
    },
    body: JSON.stringify(receipt),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Autoresearch receipt persistence failed with ${response.status}: ${payload?.error ?? response.statusText}.`,
    );
  }

  return payload?.data ?? null;
}

export async function runRailwayCronAutoresearch({
  env = process.env,
  fetchImpl = fetch,
  now = () => new Date().toISOString(),
} = {}) {
  const runtimeStore = createRuntimeStore({
    storePath: resolve(REPO_ROOT, "apps/api/data/runtime-store.json"),
    now,
  });
  const runtime = createAutoresearchRuntime({
    runtimeStore,
    now,
  });
  const cadenceHours = normalizePositiveNumber(
    env.AUTORESEARCH_CADENCE_HOURS,
    DEFAULT_AUTORESEARCH_CADENCE_HOURS,
  );
  const note = env.AUTORESEARCH_RUN_NOTE ?? "railway cron service";
  let runError = null;

  try {
    await runtime.runRegularAutoresearch({
      cadenceHours,
      triggerSource: AUTORESEARCH_TRIGGER_SOURCE.SCHEDULED_CRON,
      note,
      skipExisting: true,
    });
  } catch (error) {
    runError = error;
  }

  const runtimeState = await runtimeStore.getAutoresearchRuntime();
  const [run] = await runtimeStore.listAutoresearchRuns({ limit: 1 });

  if (!run) {
    throw new Error(
      "Autoresearch runtime did not persist a run receipt to the worker store.",
    );
  }

  const receipt = buildRailwayAutoresearchReceipt({
    runtimeState,
    run,
    env,
    receiptCapturedAt: now(),
  });
  let persistedReceipt = null;

  try {
    persistedReceipt = await postAutoresearchReceipt({
      receipt,
      fetchImpl,
      url:
        env.AUTORESEARCH_PROOF_API_URL ??
        DEFAULT_AUTORESEARCH_PROOF_API_URL,
      token: env.AUTORESEARCH_PROOF_TOKEN ?? null,
    });
  } catch (error) {
    const payload = {
      status: "failed",
      error: error.message,
      runtime: receipt.runtime,
      run: receipt.run,
      proofPosted: false,
    };
    throw attachPayload(error, payload);
  }

  if (runError) {
    throw attachPayload(runError, {
      status: "failed",
      error: runError.message,
      runtime: receipt.runtime,
      run: receipt.run,
      proofPosted: true,
      persistedReceipt,
    });
  }

  return {
    status: "ok",
    runtime: receipt.runtime,
    run: receipt.run,
    proofPosted: Boolean(persistedReceipt),
    persistedReceipt,
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const report = await runRailwayCronAutoresearch();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(
        error?.payload ?? {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
  }
}
