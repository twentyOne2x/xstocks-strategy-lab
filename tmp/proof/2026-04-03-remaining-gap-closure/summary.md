# 2026-04-03 Remaining Gap Closure

- Execution worktree: `/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps`
- Base: `origin/main` at `2a822e828e6ff8c792c82d186fb53c4e86430f76`
- Scope:
  - retire stale runtime-proof auto-rehydration from the default API path,
  - add the Enso promoted-basket proof runner,
  - improve the shared `1inch` signer handoff path,
  - sync active closeout docs to the exact current blockers.

## Exact Current Blockers

- Shared `1inch`: [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T16-59-39.353Z/summary.json)
  - current rerun blocker: `code=proof_request_failed`
  - stage: `environment_or_authentication`
  - message: `Privy access token is expired.`
  - strongest authenticated boundary remains the earlier six-leg `missing_user_signature` proof at [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/summary.json)
- Enso: [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-portfolio-2026-04-03T16-59-28.918Z/summary.json)
  - current blocker: `code=missing_environment_input`
  - stage: `environment`
  - message: `ENSO_API_KEY is required for the Enso proof runner.`
- Runtime host: [runtime-autoresearch-24-7.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-remaining-gap-closure/runtime-autoresearch-24-7.json)
  - live truth: `worker_runtime_only`
  - `recurringAutonomousProven=false`
  - `schedulerHost=null`
  - CLI blocker remains in [cli-status.txt](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-remaining-gap-closure/cli-status.txt): Railway auth fails with `invalid_grant`

## Verification

- `node --test apps/api/test/api.test.js`
- `pnpm --filter @xstocks/api test`
- `pnpm --filter @xstocks/api build`
- `pnpm --filter @xstocks-strategy-lab/xstocks test`
- `git diff --check`

All passed.

## Repo Truth Changes

- [server.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/server.js) now keeps the default runtime path fail-closed unless `AUTORESEARCH_PROOF_PATH` or `XSTOCKS_AUTORESEARCH_PROOF_PATH` is explicitly set.
- [api.test.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/test/api.test.js) now proves the default API boot does not silently load the historical Railway proof seed.
- [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js) now supports `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH` and writes a richer signer packet when quote data is available.
- [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js) is the new canonical Enso proof runner.
