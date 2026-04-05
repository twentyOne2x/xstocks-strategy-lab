# Activation Preparing Lag Fix Proof

Date: 2026-04-05
Worktree: `/Users/user/PycharmProjects/xstocks-strategy-lab-codex-activation-preparing-lag-20260405`
Branch: `codex/activation-preparing-lag-20260405`

## What changed

1. `runManualExecutionFlow` now stops immediately after `POST /api/activations` if the saved activation is not `ready`.
2. The first blocker now comes from the activation save response `executionPlan.blockers[0]` when available.
3. The onboarding cleanup no longer rewrites the backend readiness blocker into `Portfolio activation is still being prepared. Try again in a moment.`

## Verification

1. `pnpm --filter @xstocks-strategy-lab/web test`
   - Result: passed
   - Signal: `10` test files, `50` tests passed
2. `cd apps/web && pnpm exec vitest run src/lib/manual-execution.test.ts`
   - Result: passed
   - Signal: `3` tests passed, including the new non-ready activation fail-fast regression
3. `pnpm --filter @xstocks-strategy-lab/web build`
   - Result: passed
   - Note: existing warnings remain in `src/components/onboarding-terminal-experience.tsx` for unused imports
4. `git diff --check`
   - Result: passed

## Strongest truthful claim

The canonical `Buy portfolio` flow no longer burns time creating a doomed execution request after an activation save already proves the snapshot is non-ready; it now stops on the first known activation blocker and surfaces that blocker truthfully.
