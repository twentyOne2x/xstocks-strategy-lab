# xStocks Canonical Buy Activation Preparing Lag Fix

Date: 2026-04-05
Owner: `XSL-005C` under `XSL-005`
Status: active
Canonical issue: `XSL-005C`

## Objective

Fix the canonical `Buy portfolio` flow so it stops quickly and truthfully when the activation snapshot is already known to be non-ready, instead of burning time on a doomed execution-request create/reload cycle and then surfacing the generic message `Portfolio activation is still being prepared. Try again in a moment.`

## Non-goals

1. Do not switch the public route away from hosted `1inch`.
2. Do not claim the lane is execution-complete or onchain-live.
3. Do not widen into Enso, LI.FI, or unrelated wallet-connect redesign.
4. Do not reopen the wallet-unlock boundary already proven on the live Brave flow.

## User-Stated Desired Outcome

The canonical buy path should not sit forever behind `The Portfolio activation is still being prepared. Try again in a moment..`

## Current Truth

1. The exact frontend rewrite lives in [onboarding-question-flow.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/../../apps/web/src/components/onboarding-question-flow.tsx).
2. The backend-origin blocker is [The saved activation snapshot is not in a ready/executable state.](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/../../apps/api/src/services/api-service.js).
3. `POST /api/activations` already returns richer activation-plan truth than the frontend currently uses.
4. The current flow can save a non-ready activation, continue into execution-request creation, and only later show the generic blocker.

## Constraints

1. Keep the fix narrow: `apps/web/**`, tests, and the canonical issue/docs only.
2. Prefer surfacing exact backend truth over inventing new frontend timing heuristics.
3. If a non-ready activation is already known, do not create a doomed execution request.
4. Preserve existing hosted `1inch` behavior when the activation is truly ready.

## Plan

1. Extend the activation-save client helper so the frontend can read the returned execution-plan blockers.
2. Add a fail-fast guard after activation save in the manual execution flow.
3. Surface the activation-plan blocker directly when the saved activation is non-ready.
4. Tighten the onboarding status cleanup so known activation blockers are not flattened into the generic “still being prepared” copy.
5. Add or update focused tests for:
   - non-ready activation save -> no execution create
   - exact blocker propagation
   - existing ready path unchanged
6. Run the narrow verification set and `git diff --check`.

## Verification Plan

Required commands:
1. `pnpm --filter @xstocks-strategy-lab/web test`
2. `cd apps/web && pnpm exec vitest run src/lib/manual-execution.test.ts`
3. `git diff --check`

Expected proof:
1. Manual-execution tests prove fail-fast behavior for non-ready activation saves.
2. The generic preparing message is no longer the only surfaced blocker for known activation non-readiness.

## Rollback

1. Revert the manual-execution fail-fast guard and activation-save response handling.
2. Re-run the focused web tests to confirm the old path returns.

## Decision Log

- 2026-04-05: Treat this as a continuation of `XSL-005C`, not a new owner lane.
- 2026-04-05: Fix the wasted flow first by failing fast on known non-ready activation snapshots rather than adding more retry time.

## Progress Log

- 2026-04-05: Logged the regression under `XSL-005C` and audited the current frontend/backend source path.
- 2026-04-05: Implemented the fail-fast activation guard, preserved the first execution-plan blocker from `POST /api/activations`, removed the misleading “still being prepared” fallback for known readiness blockers, and verified with focused web tests plus a production build.
