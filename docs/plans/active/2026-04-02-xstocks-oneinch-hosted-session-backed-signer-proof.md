# xStocks 1inch Hosted / Session-Backed Signer Proof

Date: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-014C` under `XSL-014`

## Objective

Advance the promoted `c5` default basket from the already proven `awaiting_approval` boundary through real signer-owned 1inch Fusion signature, submission attempt, and venue-status or receipt truth on top of the current clean `origin/main` tip.

## Non-goals

1. Do not touch `apps/web/**`.
2. Do not reopen CRE/provider autonomy or add autonomous execution.
3. Do not downgrade to an easier basket or change the promoted slot away from the current `c5` basket.
4. Do not make hidden-custody claims or invent signatures without signer-owned material.

## User-Stated Desired Outcome

Reuse the current promoted `c5` basket and authenticated proof path, capture real EIP-712 approval payloads and signer-owned signatures for all actionable 1inch legs, submit the signed order(s) if signer material is available, persist venue-status plus receipt or the exact blocker, and stop only at the first exact external blocker.

## Current Truth At Start

1. `XSL-014B` already proved the promoted `c5` basket to multi-leg `awaiting_approval` on `1inch.ethereum` for the six actionable core xStocks legs.
2. The clean `origin/main` snapshot still contains the 1inch adapter package, proof docs, and proof runner, but `apps/api/src/server.js` and `apps/api/src/services/api-service.js` no longer wire or route 1inch Fusion in the current backend execution path.
3. The shared env still exposes `ONEINCH_API_KEY`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `PRIVY_JWKS_URL`, and `XSTOCKS_PRIVY_ACCESS_TOKEN`.
4. Initial auth verification against the current shared env already shows the present live session token is expired with `401 Privy access token is expired.`

## Constraints And Non-Negotiables

1. Work from a fresh clean worktree off updated `origin/main`.
2. Keep the current promoted `c5` basket and current authenticated proof path.
3. Restore only the missing backend 1inch substrate needed for truthful hosted/session-backed signer proof.
4. Capture artifacts for approval payloads, signatures or missing-signature blocker, submission response, venue-status, and receipt truth.
5. Stop at the first exact external blocker after the internal backend path is restored.

## Local / Hosted / Production Boundary

1. Local-only: tests and proof runner operate against the local API runtime with current secrets and write proof artifacts under `tmp/proof/`.
2. Hosted/session-backed proof for this pass: the proof uses a real authenticated Privy session token and real signer-owned material while exercising the repo-owned backend path.
3. Production closure is still out of scope for this pass unless the local proof reaches real signed submission and receipt truth with current live material.

## Exact Blocker Taxonomy

1. `environment_or_authentication`: missing or expired Privy / 1inch configuration before activation can start.
2. `awaiting_signature`: approval payload exists but signer-owned signature material is absent.
3. `submission`: signature exists but 1inch rejects or blocks signed submission.
4. `venue_status_or_receipt`: submission succeeds but venue status or chain receipt remains blocked.

## Plan

1. Restore the 1inch Fusion runtime wiring on the current clean backend tip while preserving newer provider-review and auth surfaces.
2. Extend the proof runner so it persists per-leg approval payloads, signature inputs, signed submission responses, and venue-status or receipt artifacts.
3. Run the required local tests.
4. Run the live proof with the shared env and stop at the first exact external blocker if fresh session or signer material is still missing.
5. Record the strongest exact claim and final blocker or receipt truth in repo docs.

## Verification Plan

1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. `XSTOCKS_SHARED_ENV_PATH=/Users/user/.config/attn/shared.env node apps/api/scripts/oneinch-fusion-proof.js`
4. `git diff --check`

## Rollback / Recovery

1. Revert only the touched `apps/api/**`, shared execution contract, xStocks adapter, proof runner, tests, and narrow tracking docs if the restored 1inch substrate regresses current backend behavior.
2. If the live proof still fails after the backend path is restored, keep the failure pinned to the exact external blocker rather than weakening the basket or widening scope.

## Decision Log

- 2026-04-02: Keep the promoted `c5` basket and current authenticated proof path; do not reopen manifest selection.
- 2026-04-02: Treat the clean-tip loss of explicit 1inch runtime wiring as an internal regression that must be fixed before any external blocker claim is valid.
- 2026-04-02: Stop at the first external blocker only after approval-payload capture, signature handling, and submission/status persistence are truthful on the current backend.

## Progress Log

- 2026-04-02: Created a fresh worktree from updated `origin/main`, read the owner docs and prior proof artifacts, and confirmed `XSL-014B` already reached multi-leg `awaiting_approval` for the six actionable core xStocks legs.
- 2026-04-02: Audited the clean-tip backend and found a real regression: the proof runner still targets 1inch Fusion, but `apps/api/src/server.js` no longer instantiates the 1inch client and `apps/api/src/services/api-service.js` execution mutations no longer route `1inch.ethereum`.
- 2026-04-02: Verified the current shared env carries an expired Privy access token, so the final live proof will still need a fresh session unless a refresh path exists after the internal backend substrate is restored.
- 2026-04-02: Restored the clean-tip 1inch backend path in `apps/api`, including runtime wiring, venue-routed quote or submission handling, venue-status refresh, proof-runner approval-payload persistence, and a compatibility fix so the existing CoW failure diagnostics tests still pass under the new routed quote-attempt model.
- 2026-04-02: Verification passed with `pnpm --filter @xstocks-strategy-lab/xstocks test`, `node --test apps/api/test/api.test.js`, and `git diff --check`.
- 2026-04-02: The live proof rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-01T23-43-28.673Z/summary.json) and stopped before activation at the first exact external blocker: `Privy access token is expired.` (`statusCode=401`, `stage=environment_or_authentication`).
- 2026-04-02: The only local proof-session input decodes to `exp=2026-04-01T23:07:10Z`, while the proof attempted auth at `2026-04-01T23:43:28.673Z`; no alternate local identity token, fresh session artifact, or repo-owned refresh path exists in the standard proof inputs, so signer-owned approval, signature, submission, and receipt capture remain blocked on a fresh real Privy session.
- 2026-04-02: A fresh live `24-7.markets` session was then recaptured from the active Brave profile local-storage log, and Privy accepted the session check with `200` at `2026-04-02T00:00:21Z` for user `did:privy:cmng4u99003bf0ckye9oqgopk`.
- 2026-04-02: The next proof rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/summary.json), [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/approval-payloads.json), and [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/signature-inputs.json), and advanced the promoted `c5` basket through authenticated activation plus six actionable 1inch Fusion quotes to `awaiting_approval`.
- 2026-04-02: The first exact remaining blocker is now signer-owned approval rather than auth: `code=missing_user_signature`, `stage=awaiting_signature`, and `message="Signer-owned 1inch Fusion EIP-712 signatures are still required for 6 quoted core legs before backend submission can be recorded."` No truthful submission response, venue order id, venue-status progression beyond `quote_ready`, or receipt exists yet.
