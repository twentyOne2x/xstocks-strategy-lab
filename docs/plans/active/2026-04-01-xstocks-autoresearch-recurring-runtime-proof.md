# xStocks Autoresearch Recurring Runtime Proof

Date: 2026-04-01
Owner: Codex
Status: completed
Canonical issue: `XSL-006A` under `XSL-006`

## Objective

Record the closed recurring-runtime truth for xstocks autoresearch: the repo now proves deployed recurrence on Railway cron service `autoresearch-worker`, with `truthBoundary=railway_cron_service`, `recurringAutonomousProven=true`, live receipt `autoresearch_20260401T170541978z_bd9d4900`, and the next run derived from cron schedule `5 17 * * *`.

## Non-goals

This tranche does not:
1. widen into `apps/web`, qualification logic, or explanation-shape work,
2. turn `apps/api` into the hidden scheduler host,
3. claim autonomous recurrence from local-only worker runs,
4. count a stale deploy or a configured-but-unreachable host as proof,
5. flip `recurringAutonomousProven` without host-level receipts.

## User-Stated Desired Outcome

Leave one closure record that proves the repo-owned recurring host, exact receipt, next-run derivation, and ownership boundary without widening the lane into GitHub Actions or Vercel.

## Constraints And Non-Negotiables

1. Scope only `apps/worker`, deployment/runtime config, and `apps/api` only if one tiny runtime-proof surface is needed.
2. Docs should change only for the smallest issue/plan note needed to keep owner truth current.
3. A real repo-owned scheduler host must exist before any deployed recurrence claim is made.
4. `recurringAutonomousProven=true` is allowed only when the host, cadence, and receipts are actually proven.
5. If deploy access or host proof is unavailable, fail closed and record the blocker explicitly.

## Current Verified Truth

1. The chosen scheduler host is Railway cron service `autoresearch-worker` in project `xstocks-strategy-lab-preview` / environment `production`.
2. The live runtime proof surface and persisted runtime store now report `truthBoundary=railway_cron_service` and `recurringAutonomousProven=true`.
3. The first scheduled host receipt is anchored to run id `autoresearch_20260401T170541978z_bd9d4900`, started `2026-04-01T17:05:41.978Z`, completed `2026-04-01T17:05:42.918Z`, and proof-captured `2026-04-01T17:05:42.921Z` on deployment `38862730-0d6a-42f7-8246-b639ea48a9c3` with snapshot `116ecc2e-ca12-4a9f-b6c8-ec3898419779`.
4. The next host tick is deterministically derived from the live cron schedule `5 17 * * *` as `2026-04-02 17:05 UTC`.
5. `railway whoami` still succeeds from this machine, and the revalidation read still returns the same `autoresearch-worker` receipt through both the live proof endpoint and the persisted runtime store.
6. GitHub Actions ownership remains absent: `gh workflow list -R twentyOne2x/xstocks-strategy-lab` and `gh run list -R twentyOne2x/xstocks-strategy-lab` both return empty output.
7. Vercel is not an owning surface for this lane: the workspace still has no `.vercel/**` link and no local `vercel` CLI.

## Historical Opening Snapshot

1. `railway whoami` succeeded from this machine and Railway project `xstocks-strategy-lab-preview` was linked locally.
2. Railway project `80528e32-e909-4b21-8dbd-906b9d54db2e` initially had exactly one service, `api`, in environment `production`.
3. `railway functions list` returned no functions for that project/environment.
4. `origin/main` contained no `.github/**` or `.vercel/**` tree.
5. Live Railway `GET /health` still exposed an older API contract than local and did not include `/api/executions` or `/api/reporting/xstocks`.
6. SSH into the live `api` service showed `/app/apps/api/data/runtime-store.json` existed, but grep found no `autoresearch`, `truthBoundary`, or `recurringAutonomousProven` entries.

## Host-Surface Classification

1. Owning surface: Railway cron service `autoresearch-worker`.
2. Truth boundary: `railway_cron_service`.
3. Non-owning surfaces: GitHub Actions and Vercel.

## Proof Contract

### Local-only

Counts only as local-only:
1. `pnpm --filter @xstocks/worker autoresearch:run`,
2. worker and API tests,
3. checked-in cron config without a deployed host,
4. runtime-store writes on a local filesystem.

### Candidate or deployed-host proof

Counts as candidate or deployed-host proof only if all of the following exist:
1. a real repo-owned scheduler host is deployed,
2. the host cadence is explicitly configured,
3. at least one run receipt exists from that deployed host,
4. logs or host metadata tie the run back to the chosen scheduler surface.

### Production proof for this lane

Production proof requires:
1. exact host identity,
2. exact cadence,
3. last run receipt,
4. next run evidence or deterministic derivation from the live host schedule,
5. runtime/log evidence,
6. and a repo-readable proof surface if one is added for future audits.

### Blocker taxonomy

If the lane still cannot close, classify the blocker as one of:
1. `missing_scheduler_host`
2. `missing_service_inventory_access`
3. `missing_scheduler_config_surface`
4. `missing_receipt_persistence_path`
5. `missing_host_log_or_run_receipt`
6. `missing_deploy_permission`

## Closure Sequence Used

1. Recorded the canonical issue and froze the opening deploy truth.
2. Audited Railway, GitHub Actions, and Vercel ownership for an existing recurring host.
3. Implemented the narrowest truthful scheduler path in `apps/worker` and deployment/runtime config only after confirming no repo-owned recurring host already existed.
4. Added one narrow API proof surface so later audits would not require SSH-only access.
5. Provisioned and deployed Railway cron service `autoresearch-worker`.
6. Captured the first scheduled host receipt and flipped runtime truth only after live host evidence existed.

## Verification Plan

Commands:
1. `node --test apps/worker/src/__tests__/autoresearch-runtime.test.js`
2. targeted `node --test apps/api/test/api.test.js` coverage for the new proof surface if `apps/api` changes
3. `curl -sS https://api-production-e70b.up.railway.app/health | jq .`
4. Railway CLI and/or GraphQL queries proving service inventory, deployment ids, and host logs
5. proof-surface read after deploy if a new API endpoint is added

Expected artifacts:
1. exact selected scheduler surface,
2. service or workflow identity,
3. cadence configuration,
4. last run evidence,
5. next run evidence or deterministic derivation from the live host schedule,
6. exact blocker if the lane still cannot close.

## Rollback And Recovery

1. Revert only the worker cron/proof-surface changes from this tranche.
2. Remove the new scheduler service or schedule if it cannot be proven truthfully.
3. Keep `worker_runtime_only` and `recurringAutonomousProven=false` if any receipt or host-level proof is missing.

## Decision Log

- 2026-04-01: Fresh live access disproved the stale blocker note about Railway auth; this machine now has working Railway and GitHub access.
- 2026-04-01: Existing recurring-host proof is absent today because Railway has only the `api` service, no functions, and GitHub Actions is not configured.
- 2026-04-01: Railway cron worker is the preferred first implementation path because it stays closest to the existing deployed backend and existing `apps/worker` runtime.
- 2026-04-01: Railway cron service `autoresearch-worker` is the chosen scheduler surface. GitHub Actions remains absent and Vercel cron was not introduced.

## Progress Log

- 2026-04-01T18:30:00+02:00: Confirmed the repo still reports `worker_runtime_only` and `recurringAutonomousProven=false` in worker and API runtime state.
- 2026-04-01T18:35:00+02:00: Verified live Railway access, queried the project inventory, and confirmed the project currently owns exactly one deployed service: `api`.
- 2026-04-01T18:40:00+02:00: Verified GitHub Actions ownership is absent: no workflows, no workflow runs, and no `.github/**` tree on `origin/main`.
- 2026-04-01T18:45:00+02:00: SSH audit of the live Railway `api` service found no persisted autoresearch runtime or run receipts in `/app/apps/api/data/runtime-store.json`.
- 2026-04-01T18:47:05+02:00: Deployed the updated API proof surface to Railway deployment `83536f43-704d-42e0-a0ee-834d25395f90`; live `/health` now exposes `/api/runtime/autoresearch` and `/api/internal/autoresearch/receipts`.
- 2026-04-01T18:50:10+02:00: Created and deployed Railway service `autoresearch-worker` from `apps/worker/railway.json`. The first attempt failed because the worker build command did not prebuild `packages/shared`, `packages/xstocks`, and `packages/euler`, which the worker imports from `dist/`.
- 2026-04-01T18:55:59+02:00: Redeployed the worker with the narrowed dependency-build fix and set the live daily cron slot to `5 17 * * *` so the first scheduled execution could be proven within the current session while keeping a 24-hour cadence.
- 2026-04-01T19:05:41+02:00: Railway cron service `autoresearch-worker` executed the first scheduled run on deployment `38862730-0d6a-42f7-8246-b639ea48a9c3`.
- 2026-04-01T19:05:42+02:00: Live proof surface flipped to `truthBoundary=railway_cron_service` and `recurringAutonomousProven=true` with run id `autoresearch_20260401T170541978z_bd9d4900`, one promoted manifest update, and persisted scheduler receipt metadata including snapshot `116ecc2e-ca12-4a9f-b6c8-ec3898419779` and private domain `autoresearch-worker.railway.internal`.
- 2026-04-01T19:06:14+02:00: Verified live proof via `GET /api/runtime/autoresearch`; next host tick is deterministically derived from the deployed cron schedule `5 17 * * *` as `2026-04-02 17:05 UTC`.
- 2026-04-01T19:15:27+02:00: Re-audited from current live access. `railway whoami` still succeeds, `railway status` remains linked to `api`, `gh workflow list` and `gh run list` remain empty, the workspace still has no `.vercel/**` link and no `vercel` CLI, and both the live proof endpoint plus live `runtime-store.json` still report the same `autoresearch-worker` Railway cron receipt.
