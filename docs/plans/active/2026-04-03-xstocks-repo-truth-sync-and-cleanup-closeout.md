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
3. The default local API proof surface no longer auto-rehydrates the historical Railway cron receipt from [apps/api/data/autoresearch-runtime-proof.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/data/autoresearch-runtime-proof.json); operators must now opt in with `AUTORESEARCH_PROOF_PATH` or `XSTOCKS_AUTORESEARCH_PROOF_PATH`.
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

1. `XSL-006A` is no longer allowed to remain only in thread memory or a side branch, and stale local optimism is no longer allowed to outrun the public runtime API by default.
2. README, `docs/ISSUES.md`, and these 2026-04-03 closeout docs must track:
   - shared `1inch` strongest authenticated blocker = `missing_user_signature`,
   - shared `1inch` current local rerun blocker = expired Privy auth,
   - public default buy route = hosted `1inch`,
   - `LI.FI` and `Enso` remain separate truths,
   - right rail is visible in the onboarding preview shell and on the canonical detail route,
   - public runtime parity is closed while `worker_runtime_only` remains the truthful fail-closed state,
   - Enso now has a proof runner, but its current exact blocker is missing `ENSO_API_KEY`.

## Remaining Check

1. The repo-truth portion of this slice is now closed again after the default runtime path was aligned with live fail-closed truth.
2. Future changes to runtime claims must reopen the owning runtime-proof lane, not this cleanup residual.
