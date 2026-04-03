# xStocks Repo Truth Sync And Cleanup Closeout

Date: 2026-04-03
Owner: `XSL-006A` residual plus repo truth sync
Status: completed

## Goal

Remove branch-only truth drift and sync the canonical repo docs to the audited blocker, route, and proof state from this closure wave.

## Audited Truth

1. The original `XSL-006A` cleanup branch was still branch-only at audit start:
   - branch `codex/xsl-006a-repro-cleanup`
   - commit `01ae74ac2386a94c2e2b127de27cc00d0fa92cbd`
2. This pass cherry-picked the equivalent cleanup onto the clean closure-wave branch as commit `66fbeba7`.
3. The local API proof surface now rehydrates the canonical Railway cron receipt from [apps/api/data/autoresearch-runtime-proof.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/data/autoresearch-runtime-proof.json).
4. The public host now matches the repo-owned runtime truth after the deploy recheck:
   - [runtime-autoresearch.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/runtime-autoresearch.json)
5. The canonical public web routes are now live on deployment `dpl_4w35481YsNzPnkMSCMqAjD4CzxMc`:
   - [activate.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/activate.headers)
   - [detail.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.headers)
6. Repo truth also lagged on:
   - shared `1inch` blocker wording,
   - Enso/public-default route wording,
   - right-rail public-route wording,
   - public homepage claims around `Chainlink CRE`.

## Closure Decision

1. `XSL-006A` is no longer allowed to remain only in thread memory or a side branch.
2. README, `docs/ISSUES.md`, and these 2026-04-03 closeout docs must track:
   - shared `1inch` blocker = `missing_user_signature`,
   - public default buy route = hosted `1inch`,
   - `LI.FI` and `Enso` remain separate truths,
   - right rail is visible in the onboarding preview shell and on the canonical detail route,
   - public runtime parity is closed while `worker_runtime_only` remains the truthful fail-closed state.

## Remaining Check

1. No further cleanup or truth-sync work remains in this closeout slice.
2. Future changes to runtime claims must reopen the owning runtime-proof lane, not this cleanup residual.
