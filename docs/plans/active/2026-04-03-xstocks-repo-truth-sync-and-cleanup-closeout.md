# xStocks Repo Truth Sync And Cleanup Closeout

Date: 2026-04-03
Owner: `XSL-006A` residual plus repo truth sync
Status: active

## Goal

Remove branch-only truth drift and sync the canonical repo docs to the audited blocker, route, and proof state from this closure wave.

## Audited Truth

1. The original `XSL-006A` cleanup branch was still branch-only at audit start:
   - branch `codex/xsl-006a-repro-cleanup`
   - commit `01ae74ac2386a94c2e2b127de27cc00d0fa92cbd`
2. This pass cherry-picked the equivalent cleanup onto the clean closure-wave branch as commit `66fbeba7`.
3. The local API proof surface now rehydrates the canonical Railway cron receipt from [apps/api/data/autoresearch-runtime-proof.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/data/autoresearch-runtime-proof.json).
4. The public host still returned stale runtime truth at audit time:
   - [api-runtime-autoresearch.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/api-runtime-autoresearch.json)
5. Repo truth also lagged on:
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
   - right rail is visible in the onboarding preview shell, while deep-link detail-route parity still needs deploy proof.

## Remaining Check

1. Push and merge the cleanup and truth-sync commits.
2. Recheck the public autoresearch route after deploy.
3. If the live runtime surface flips to the seeded Railway receipt truth, close the deploy-parity residual in `XSL-006A`.
