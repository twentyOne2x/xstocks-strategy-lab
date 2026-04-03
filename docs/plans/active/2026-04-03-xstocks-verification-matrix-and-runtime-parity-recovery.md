# xStocks Verification Matrix And Runtime Parity Recovery

Date: 2026-04-03
Owner: `XSL-009`
Status: active

## Goal

Recover one truthful green baseline after the final closure-wave merge by:
1. fixing the current root verification regressions,
2. restoring repo-truth alignment between docs and the actual workspace matrix,
3. and rechecking the canonical public host surfaces so local-green and public-host truth are not collapsed together.

## Non-goals

This recovery tranche does not:
1. reopen `XSL-006` runtime logic,
2. reopen hosted buy readiness unless the old symptom truly regresses,
3. change the canonical public buy-route decision away from hosted `1inch`,
4. invent a new workflow product lane,
5. or excuse failing workspace packages by silently removing them from the root matrix.

## User-Stated Desired Outcome

1. `test everything so i know stuff works`
2. `spec out the gaps with spec of spec then go fix it`

## Existing-Spec Inventory

1. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-final-closure-wave/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: high.
   - Decision: update indirectly through `XSL-009` issue truth, but do not reuse as the executor doc.
   - Why: it is the broader closeout program doc and now overstates green non-frontend status; it does not own the exact red root-matrix recovery runbook.
2. [2026-04-03-xstocks-final-closure-wave-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-final-closure-wave/docs/plans/active/2026-04-03-xstocks-final-closure-wave-control-plane.md)
   - Current relevance: high.
   - Decision: update indirectly after execution; do not reuse as the executor doc.
   - Why: it owns product-gap closure truth, not the repo-wide verification recovery sequence discovered after the merge.
3. [2026-04-03-xstocks-repo-truth-sync-and-cleanup-closeout.md](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-final-closure-wave/docs/plans/active/2026-04-03-xstocks-repo-truth-sync-and-cleanup-closeout.md)
   - Current relevance: medium.
   - Decision: reuse as adjacent truth-sync evidence only.
   - Why: it covers cleanup and wording sync, but not the full failing matrix or workflow package build posture.

Create new alongside:
1. this recovery spec is justified because no existing active doc truthfully owns all three of:
   - the red root verification matrix,
   - the worker scheduled-review regression,
   - and the public-host parity recheck after the closure-wave merge.

## Current Live Truth

As of 2026-04-03 on `codex/xsl-009-verification-recovery` after the recovery fixes:
1. `pnpm lint` passes.
2. `pnpm test` passes.
3. `pnpm build` passes.
4. `pnpm check` passes.
5. `pnpm --filter @xstocks/worker test` passes.
6. `pnpm --filter @xstocks/workflow-client build` passes.
7. `pnpm --filter @xstocks/workflow-server build` passes.
8. `node --test apps/api/test/api.test.js` passes.
9. `node --test apps/api/test/provider-rebalance-api.test.js` passes.
10. `pnpm --filter @xstocks/api test` passes.
11. `pnpm --filter @xstocks/api build` passes.
12. `pnpm --filter @xstocks-strategy-lab/shared build` passes.
13. `pnpm --filter @xstocks-strategy-lab/web test` passes.
14. `pnpm --filter @xstocks-strategy-lab/web build` passes.
15. `cd apps/web && pnpm exec vitest run src/lib/manual-execution.test.ts src/lib/api-client.test.ts` passes.
16. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:validate` passes.
17. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:generate` passes.
18. `git diff --check` passes.
19. Public-host truth is still stale:
   - [https://24-7.markets/onboarding](https://24-7.markets/onboarding) returns `200`,
   - [https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1) returns `404`,
   - [https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1) returns `404`,
   - [https://24-7.markets/api/runtime/autoresearch?limit=1](https://24-7.markets/api/runtime/autoresearch?limit=1) still reports `truthBoundary=worker_runtime_only`, `recurringAutonomousProven=false`, and `schedulerHost=null`,
   - and the onboarding HTML still contains stale manifest slugs such as `ai-infra-autopilot`.

## Current Local Implementation Audit

### Shipped

1. API, shared contracts, web manual-execution path, and the hosted `1inch` public-default route are locally green.
2. The worker rebalance runtime code path still exists and the issue tracker already treats it as a truthful manual-review shell.
3. The workflow packages still exist in the workspace and are included in the root `turbo` build scope.

### Partial

1. Worker scheduled-review coverage is partial because the current harness no longer matches the promoted-basket execution-route truth.
2. Workflow package build posture is partial because package-local configs and dependency expectations drifted away from the current workspace baseline.
3. Production deployment parity is partial because the live site is still serving pre-recovery runtime and route behavior.

### Spec-only Or Unproven

1. Any claim that the repo root matrix is fully green.
2. Any claim that the current public detail or activate deep-link routes are now live on `24-7.markets`.
3. Any claim that `XSL-006A` deploy parity is closed on the public host.

## Symptom Contract

Observed symptom:
1. the merged repo is not actually green end to end,
2. the issue and closeout docs still contain overclaimed “green non-frontend stack” language,
3. and the live public host still serves stale runtime or route parity.

Current suspected cause:
1. worker regression: the test harness still models the older execution-route baseline and now fails against the promoted manifest’s `1inch.ethereum` route requirement.
   - Status: likely and close to proven.
2. workflow-client build failure: React and type packages are skewed against the current workspace React 19 posture.
   - Status: likely.
3. workflow-server build failure: the package extends a missing root TS base config and falls through into stale compiler and dependency posture.
   - Status: proven.
4. prod parity gap: the public host has not yet picked up the merged closure-wave state or is pinned to an older deploy.
   - Status: proven.

## Likely Culprits / Ranked Hypotheses

1. Worker harness drift is the immediate root cause of the `@xstocks/worker` test failure.
2. Missing or stale shared TypeScript baseline is the immediate root cause of the `@xstocks/workflow-server` compile failure.
3. React 18 vs React 19 type skew is the immediate root cause of the `@xstocks/workflow-client` JSX compile failure.
4. Production deploy lag or stale host configuration is the current cause of the `404` deep-link and stale autoresearch runtime surface.

## Non-Obvious Alternatives

1. The worker failure could indicate a real runtime regression rather than only a stale test harness; if so, the runtime should stay `blocked` and the older docs were wrong.
2. The workflow packages could have been intentionally left stale and should be removed from the root matrix rather than repaired; this is disallowed unless repo-tracked truth explicitly changes the root contract.
3. The live host could be reading the right code but the wrong runtime store or wrong deployment target.

## Falsifiers

1. If adding current route truth to the worker harness still leaves the tests failing, the runtime logic is actually regressed and must be fixed rather than the tests.
2. If `workflow-client` still fails after aligning React and type versions, the issue is not only version skew.
3. If `workflow-server` still fails after adding a correct root TS base config and required dependencies, source-level code drift remains.
4. If the public host stays stale after the repo is green and a deploy is confirmed, the remaining issue is not just deploy lag.

## Goal-Vs-Repo-Truth Diff

1. Goal: one truthful repo-wide green baseline plus public-host recheck.
2. Repo truth: only the API, web, and shared slices are green; root verification and public-host parity are still failing.

## Completion Percent And Remaining Delta

1. Completion relative to this recovery spec = 85%.
2. Completion relative to the repeated thread ask = 85%.
3. Completion relative to prior closure-wave claims = now locally corrected, but still externally blocked by deploy parity.
4. Remaining delta:
   - ship the recovered repo state onto the actual public deploy targets,
   - or regain the missing deploy access needed to do so from this environment,
   - then rerun the public-host parity checks.

## Closure, Endpoint, And Deployment Truth

1. Local code truth and public-host truth remain separate until both are reverified.
2. A green local root matrix does not close `XSL-006A` deploy parity by itself.
3. The canonical public routes for this recovery are:
   - onboarding route,
   - canonical detail deep-link,
   - canonical activate deep-link,
   - autoresearch runtime API surface.

## Product Outcome Contract

When this recovery tranche is complete:
1. the root workspace verification matrix passes without hiding packages,
2. the worker review lane still remains manual-only and fail-closed,
3. the workflow packages compile under the current workspace posture,
4. and the repo can state exactly whether the live host has or has not caught up.

## User-Journey Contract

The user-visible contract that must be rechecked after local fixes is:
1. onboarding returns `200`,
2. canonical detail route returns the intended shell instead of a framework `404`,
3. canonical activate route returns the intended shell instead of a framework `404`,
4. autoresearch runtime API reflects the merged repo truth if deploy parity has actually landed.

## Backend Work Required

1. Fix the worker rebalance regression in `apps/worker/**` and any narrow policy surface it truthfully depends on.
2. Fix the workflow-server build posture in `apps/workflow-server/**` and any minimal root TS config or dependency wiring it truthfully needs.

## Frontend Work Required

1. Fix the workflow-client build posture in `apps/workflow-client/**`.
2. Recheck the canonical public onboarding, detail, and activate routes after the local matrix is green.

## Outside-The-Box Fix Paths

1. If the worker runtime is actually correct and the docs are wrong, freeze the worker state as `blocked` and update the owner docs rather than force old expectations back in.
2. If the workflow packages are proven legacy or out-of-scope, move them behind an explicit repo-tracked exclusion from the root matrix rather than leaving silent breakage.
3. If the public host remains stale after local green and a confirmed deploy, add a tiny repo-owned parity probe that records the exact stale deployment signature.

## Constraints / Non-Negotiables

1. Do not reopen `XSL-006` runtime logic.
2. Do not widen into buy-route redesign.
3. Do not remove failing packages from the root workspace contract unless repo-tracked truth is explicitly changed.
4. Do not turn manual rebalance review into autonomous execution.
5. Keep public-host claims binary and proof-backed.

## Workstream Map

1. Repo truth and spec sync
   - Update `XSL-009` and keep the repo as system of record.
2. Worker regression recovery
   - Reconcile current manifest route truth with the rebalance test harness and runtime logic.
3. Workflow package build recovery
   - Restore compile posture for `workflow-client` and `workflow-server`.
4. Final verification and parity recheck
   - Rerun root and targeted commands.
   - Recheck the public host.

## Step-By-Step Plan

1. Freeze the audited failure surface in `docs/ISSUES.md` and this plan.
2. Prove whether the worker lane is wrong or the test harness is stale.
3. Fix the worker regression in the narrowest truthful way.
4. Restore `workflow-client` compile posture.
5. Restore `workflow-server` compile posture.
6. Rerun:
   - `pnpm test`
   - `pnpm build`
   - `pnpm lint`
   - `pnpm check`
   - targeted worker, workflow, API, shared, and web checks as needed
   - `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:validate`
   - `git diff --check`
7. Recheck the public host routes and runtime API.
8. Sync the final repo-truth wording to the actual result.

## Verification Plan

Minimum required commands:
1. `pnpm test`
2. `pnpm build`
3. `pnpm lint`
4. `pnpm check`
5. `pnpm --filter @xstocks/worker test`
6. `pnpm --filter @xstocks/workflow-client build`
7. `pnpm --filter @xstocks/workflow-server build`
8. `node --test apps/api/test/api.test.js`
9. `node --test apps/api/test/provider-rebalance-api.test.js`
10. `pnpm --filter @xstocks/api test`
11. `pnpm --filter @xstocks/api build`
12. `pnpm --filter @xstocks-strategy-lab/shared build`
13. `pnpm --filter @xstocks-strategy-lab/web test`
14. `pnpm --filter @xstocks-strategy-lab/web build`
15. `cd apps/web && pnpm exec vitest run src/lib/manual-execution.test.ts src/lib/api-client.test.ts`
16. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:validate`
17. `git diff --check`

Public-host parity checks:
1. `curl https://24-7.markets/onboarding`
2. `curl https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`
3. `curl https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`
4. `curl https://24-7.markets/api/runtime/autoresearch?limit=1`

Expected proof artifacts:
1. command logs in the thread,
2. optional follow-up bundle under `tmp/proof/2026-04-03-verification-recovery/` if live-host evidence needs to be persisted again.

## Rollback / Recovery

1. If a proposed worker fix changes runtime truth rather than repairing the stale harness, stop and update the spec plus issue wording before proceeding.
2. If workflow package recovery requires large source refactors, stop after the smallest coherent compile-restoring slice and record the exact remaining blocker.
3. If public-host parity remains stale after local green, leave the code green and record deploy parity as the remaining blocker rather than widening unrelated code.

## Decision Log

1. 2026-04-03: keep ownership under `XSL-009`; do not open a new owner lane.
2. 2026-04-03: create a dedicated recovery sub-spec because the existing closeout docs do not truthfully own the red root-matrix runbook.
3. 2026-04-03: root-matrix health is a real closure requirement; partial package-green is not enough.

## Progress Log

1. 2026-04-03: audited merged `origin/main` and reproduced failures in `pnpm test`, `pnpm build`, and `pnpm check`.
2. 2026-04-03: confirmed the worker tests now fail because the harness only exposes `cow_swap.ethereum`, while the promoted default basket now requires `1inch.ethereum`.
3. 2026-04-03: confirmed `workflow-client` fails as a React/type posture problem and `workflow-server` fails because it extends a missing `../../tsconfig.base.json` and then falls into stale dependency/compiler drift.
4. 2026-04-03: confirmed the public host still serves stale runtime and route parity.
5. 2026-04-03: fixed the worker regression by aligning the static live-state harness with the promoted default basket's `1inch.ethereum` route requirement; `pnpm --filter @xstocks/worker test` now passes.
6. 2026-04-03: restored `workflow-server` compile posture by adding the missing root `tsconfig.base.json`, declaring `better-sqlite3`, and tightening unsafe JSON parsing; `pnpm --filter @xstocks/workflow-server build` now passes.
7. 2026-04-03: restored `workflow-client` compile posture by localizing Vite type inclusion and aligning the package with the workspace React 19 posture; `pnpm --filter @xstocks/workflow-client build` now passes.
8. 2026-04-03: reran `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check`, Prisma validation or generation with explicit `DATABASE_URL`, and `git diff --check`; all now pass locally.
9. 2026-04-03: rechecked the public host after local recovery; onboarding still returns `200` with stale manifest slugs, detail and activate still return `404`, and the runtime API still reports `worker_runtime_only`.
10. 2026-04-03: deployment closure is blocked from this environment because there is no `.vercel` project link, `vercel` CLI is unavailable, and `railway whoami` fails with `invalid_grant`.
