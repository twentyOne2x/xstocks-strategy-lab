# xStocks Remaining Live-Proof And Operator Access Closure

Date: 2026-04-03
Owner: `XSL-014C`, `XSL-005B`, and `XSL-006A` under `XSL-014`, `XSL-005`, and `XSL-006`
Status: active
Canonical issues: `XSL-014C`, `XSL-005B`, `XSL-005C`, `XSL-006A`

## 2026-04-04 Runtime Update

1. `XSL-006A` host-truth reconciliation is now closed on live proof, not on fallback repo narrative. `GET https://24-7.markets/api/runtime/autoresearch?limit=1` now returns `truthBoundary=railway_cron_service`, `recurringAutonomousProven=true`, `schedulerHost.serviceName=autoresearch-worker`, and a current scheduler receipt with deployment `38862730-0d6a-42f7-8246-b639ea48a9c3`, snapshot `116ecc2e-ca12-4a9f-b6c8-ec3898419779`, and private domain `autoresearch-worker.railway.internal`.
2. The April 4 proof bundle is captured in [runtime-20260404-001709](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/runtime-20260404-001709).
3. The remaining runtime-adjacent blocker is Railway operator re-auth on this machine. `railway whoami` still fails with OAuth refresh `invalid_grant`, and no usable local `RAILWAY_*` env vars or token fields were available to bypass that directly.
4. Read Workstream B below as historical closure context plus operator-access follow-up, not as the current live public-runtime truth.

## Goal

Close the remaining blockers the user is explicitly still asking about:
1. advance shared `1inch` past the current auth and signer-owned submission boundary,
2. prove Enso live on the real promoted basket or freeze it as non-live with exact reasons,
3. keep the now-proven Railway recurring-runtime host and the repo-owned default fail-closed local runtime story reconciled,
4. and restore or bypass the blocked Railway CLI enough to operate the runtime lane without thread folklore.
5. Execution lanes under this umbrella are only done when a real onchain transaction lands; blocker capture is progress, not execution closure.

## Non-goals

This tranche does not:
1. switch the canonical public buy route away from hosted `1inch` before live proof exists,
2. reopen frontend prod parity, LI.FI scope, or solved `XSL-006` runtime logic,
3. invent a new execution executor or a second `1inch` owner lane,
4. blur `LI.FI`, `Enso`, hosted `1inch`, and shared `1inch` into one generic router claim,
5. or invent a new scheduler host while the current public Railway host remains proven and the only remaining runtime gap is operator access on this machine.

## User Vision Freeze

1. The user wants the remaining blockers actually fixed, not softened into “good enough.”
2. The user wants CLI reality stated plainly, including which operator tools are healthy and which are not.
3. The user wants outside-the-box fix paths available if the default path stalls.
4. The user does not want stale proof docs or stale issue text left behind in the repo.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why duplication is or is not justified |
| --- | --- | --- | --- |
| [2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md) | current owner doc for the shared `1inch` blocker | update indirectly | it already owns the lane-specific blocker, so this new doc should orchestrate rather than clone it |
| [2026-04-03-xstocks-portfolio-buy-and-deposit-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-portfolio-buy-and-deposit-closure.md) | current control doc for hosted `1inch` vs Enso public-route truth | update indirectly | it owns the route decision, but not the remaining proof-work and operator sequencing across Enso plus runtime |
| [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) | canonical Enso workstream spec | update indirectly | it freezes the intended Enso claim, but it predates the current partial implementation audit and does not own the closure sequencing against the current repo |
| [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md) | historical Railway-host proof record | supersede for active execution | it currently overclaims a proven recurring host and cannot remain the executor doc until fresh live access re-verifies it |
| [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | canonical operating-model owner | reuse and coordinate | it still owns the user-facing runtime truth boundary, but not this operator-access and stale-proof reconciliation runbook |
| [2026-04-03-xstocks-verification-matrix-and-runtime-parity-recovery.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-verification-matrix-and-runtime-parity-recovery.md) | completed recovery doc for repo-wide green plus Vercel parity | reuse as completed antecedent | it closed web-route parity and local matrix health, but it did not close these three remaining product/runtime blockers |

Create new alongside:
1. this umbrella is justified because no existing active doc owns all three still-open workstreams together:
   - shared `1inch` post-signature advancement,
   - Enso live-proof or demotion,
   - and stale Railway host proof plus blocked Railway CLI reconciliation.

## Current Repo Truth

1. Shared `1inch` is already restored on `origin/main`, and the canonical proof runner is [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js).
2. The strongest authenticated shared `1inch` proof is now [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/summary.json), plus [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/approval-payloads.json), [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/signature-inputs.json), and [signer-packet.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/signer-packet.json).
3. That latest authenticated rerun reached:
   - activation saved,
   - execution request created,
   - six actionable quotes,
   - approval payloads written,
   - signature inputs written,
   - blocker `missing_user_signature`.
4. The earlier same-day auth-expired rerun is now superseded; the next move is no longer auth refresh, it is signer injection into the already-generated packet.
5. The same proof runner now accepts externally supplied signatures through both `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON` and `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH`, and it writes a signer packet once the quote path is reached, so the next move is still not a new backend path.
6. Enso is no longer merely a docs idea:
   - shared bundle quote contracts exist in [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts),
   - API quote logic exists in [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js),
   - client wiring exists in [enso-execution-client.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/enso-execution-client.js),
   - web/manual execution handling exists in [manual-execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/manual-execution.ts),
   - API tests already cover quoted Enso bundle creation,
   - and the repo now includes [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js) as the canonical proof runner.
7. The old Enso env blocker and dead approval-endpoint bug are now closed. The strongest env-backed proof is [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-portfolio-2026-04-03T22-33-23.502Z/summary.json), which reaches `quote_portfolio` and records the current exact blocker instead of failing on local config.
8. The repo now also carries a Privy-free direct Enso substrate diagnostic at [enso-direct-quoteability-diagnostic.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-direct-quoteability-diagnostic.js). The latest direct proof [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/summary.json) proves:
   - `wallet/approve` still returns a real `USDC` approval transaction,
   - `NVDAx` and `AMZNx` quote directly at the real promoted-basket notionals,
   - `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx` still fail direct Enso routing at the exact notionals,
   - receiver choice does not change those failures,
   - and those four failing names still fail direct Enso routing when swept up through `$1000` each.
9. The same direct diagnostic also re-proves the current `AUSD` package truth: the boundary repository intentionally surfaces `AUSD` as a bridge helper with `supportsAtomicSwaps=true` but `address=null` and `wrapperAddress=null`, so the Enso promoted-basket lane still lacks executable Ethereum token metadata for the yield-buffer sleeve.
10. The live public buy route remains hosted `1inch` on:
   - [https://24-7.markets/onboarding](https://24-7.markets/onboarding)
   - [https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1)
11. The runtime lane is now split across two truthful surfaces:
   - checked-in Railway cron code and config still exist in [autoresearch-railway-cron.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src/autoresearch-railway-cron.js) and [railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/railway.json),
   - [server.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/server.js) still keeps local default boot fail-closed unless `AUTORESEARCH_PROOF_PATH` or `XSTOCKS_AUTORESEARCH_PROOF_PATH` is explicitly set,
   - and the live public API now returns `truthBoundary=railway_cron_service`, `recurringAutonomousProven=true`, and `schedulerHost.serviceName=autoresearch-worker`, with proof captured in [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/runtime-20260404-001709/summary.md).
12. The operator CLI matrix is now:
   - `gh`: healthy,
   - `vercel`: healthy,
   - `railway`: blocked with `invalid_grant` on `railway whoami`.

## Thread-Priority Matrix

| Rank | Workstream | Recurrence in this thread | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shared `1inch` post-signature advance | 4 | very high | high | partial | `XSL-014C`, [2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md) | repeatedly described as the next real blocker | backend path and proof runner are implemented; fresh authenticated proof again stops at missing signer-owned Fusion signatures for six live quoted core legs | yes, hosted `1inch` is the canonical route | collect real signer signatures and rerun once |
| 2 | Railway operator access reconciliation | 4 | very high | medium | public host proven, local operator CLI blocked | `XSL-006A`, [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | cleanup was claimed complete | code, tests, default local fail-closed behavior, and fresh public Railway proof all exist; only machine-local Railway operator access remains blocked | public runtime API is truthful and live-proven | restore or bypass Railway access without reopening runtime logic |
| 3 | Enso live proof or truthful demotion | 3 | high | medium | partial implementation, proof-started | `XSL-005B`, `XSL-005C`, [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) | implementation candidate only | shared contracts, API path, web handling, proof runner, approval endpoint, and direct substrate diagnostic are now in place; current exact blocker is direct Enso quoteability on `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx`, plus executable `AUSD` metadata | no, canonical public route is still hosted `1inch` | keep hosted `1inch` public-default and either resolve upstream Enso route coverage or freeze Enso as non-canonical |

## Goal-Vs-Repo-Truth Diff

1. Goal:
   - the active hosted `1inch` lane should advance beyond missing signatures and expose the first exact post-signature blocker or first real venue submission artifact,
   - Enso should either become live-proven on the exact promoted basket or stay explicitly non-live,
   - and the runtime lane should keep public Railway-host proof, local fail-closed defaults, and machine operator access reconciled in one truthful story.
2. Current repo truth:
   - hosted `1inch` is the live public route, and the latest fresh-auth proof again reaches the signer boundary and stops at missing user signatures,
   - Enso has partial code plus a proof runner, and the approval endpoint bug is now fixed, but the promoted basket still fails upstream bundle generation because `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx` are still not directly quoteable through Enso even after a direct sweep through `$1000`, while `AUSD` remains metadata-blocked,
   - live runtime API truth is now Railway-backed and proven, while local default boot remains fail-closed and machine-local Railway CLI access is still blocked.
3. Honestly complete means:
   - shared `1inch`: a signature-fed rerun reaches a real landed tx, or else the lane stays open with the next exact blocker captured,
   - Enso: one exact promoted-basket proof either produces a landed onchain bundle path or stays open with an exact blocker,
   - runtime: the repo keeps the April 4 Railway host proof canonical and either restores or deliberately bypasses the blocked Railway CLI on this machine.

## Completion Percent And Remaining Delta

| Workstream | Implementation | Proof | Prod / operator | Remaining delta |
| --- | ---: | ---: | ---: | --- |
| Shared `1inch` signer advance | 95% | 78% | 55% | collect signatures, rerun, capture venue artifacts, and still treat the lane as open until a landed tx exists |
| Enso bundle lane | 84% | 55% | 0% | resolve upstream quoteability for `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx`, resolve `AUSD` metadata, then re-run the promoted basket and still require landed onchain proof before any live claim |
| Railway operator access | 100% | 100% | 15% | restore or bypass Railway access so the already-proven `autoresearch-worker` host can be operated from this machine without thread folklore |

## Closure, Endpoint, And Deployment Truth

| Workstream | Earliest honest closure condition | Relevant surface | Local status | Deployed-host status | Production status | Proof command or artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Shared `1inch` | one rerun with real signatures reaches a landed tx, or else records the next exact blocker without claiming closure | [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js), `POST /api/executions` | ready to accept external signatures | hosted/session-backed path again quoted six legs with fresh auth and stopped only at the signer boundary | public route is live but still pre-signature and not done execution | [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/summary.json) |
| Enso | one exact promoted-basket run reaches a landed onchain bundle path, or else records the exact blocker without claiming closure | `quote_portfolio` in [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js), [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js), [enso-direct-quoteability-diagnostic.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-direct-quoteability-diagnostic.js) | partial implementation with proof harness, direct substrate diagnostic, and fixed approval endpoint | env-backed live status reaches the bundle blocker, and the direct diagnostic narrows it to persistent direct quote failures on `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx`, plus explicit `AUSD` metadata blockers | not on canonical public route and not done execution | [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/summary.json) |
| Railway operator access | direct CLI inventory or a deliberate non-CLI operating path is documented and exercised | [https://24-7.markets/api/runtime/autoresearch?limit=1](https://24-7.markets/api/runtime/autoresearch?limit=1), [autoresearch-railway-cron.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src/autoresearch-railway-cron.js), [railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/railway.json) | local default truth is fail-closed and public runtime proof is already live | Railway CLI remains blocked, but public host proof is current | public runtime is live-proven on Railway cron service | [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/runtime-20260404-001709/summary.md) |

## Delivery Posture

1. Execute in fresh isolated worktrees, not the dirty primary checkout.
2. Use one branch per workstream:
   - `codex/oneinch-signer-advance`
   - `codex/runtime-host-reconcile`
   - `codex/enso-proof-or-freeze`
3. Open each slice as a draft PR until:
   - relevant proof artifacts exist,
   - narrow verification passes,
   - and the issue text is updated to the exact resulting truth.
4. Shared docs files (`README.md`, `docs/ISSUES.md`, shared closeout docs) need one coordinator pass after each workstream lands; do not have multiple workers edit them in parallel.

## Workstream Map And Sequencing

1. Shared `1inch` signer advance
   - highest-value product lane because it is already the canonical public route.
2. Railway operator access reconciliation
   - highest control-plane risk because public host proof is live but the machine-local Railway CLI is still blocked.
3. Enso proof or demotion
   - valuable, but not on the canonical public route until real proof exists.

## Workstream A: Shared `1inch` Signer Advance

### Backend Work Required

1. Reuse [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js); do not build a second substrate.
2. This pass already added the narrow operator-quality input improvement:
   - `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH` now works alongside `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON`.
3. This pass already added signer-packet generation from:
   - `approval-payloads.json`
   - `signature-inputs.json`
4. Refresh the Privy session material, collect one signature per quoted leg, and rerun the proof once.
5. After that rerun, classify the first exact external blocker as one of:
   - `missing_balance`
   - `missing_allowance`
   - `wrong_token_holder`
   - `maker_receiver_mismatch`
   - `order_saver_error_other`

### Frontend Work Required

1. None by default.
2. Only touch frontend if the hosted signer helper cannot actually collect the signatures the backend already knows how to submit.

### Outside-The-Box Fix Paths

1. Use an external signature handoff instead of browser clicking:
   - export the six typed-data inputs,
   - sign them in a wallet or an isolated low-balance proof EOA,
   - re-inject the signatures into the existing proof runner.
2. If shell quoting is the blocker, add file-path input support to the runner instead of inventing a new API endpoint.
3. If post-signature submission exposes balance or allowance drift, add one tiny audit script that prints maker, receiver, funding token, spender, live balance, and live allowance for each leg before rerunning once.

### Verification And Proof

Required commands:
1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. `XSTOCKS_SHARED_ENV_PATH=/Users/user/.config/attn/shared.env node apps/api/scripts/oneinch-fusion-proof.js`
4. `git diff --check`

Expected proof artifacts:
1. updated `approval-payloads.json`
2. signed `signature-inputs.json` or equivalent signature map
3. `submissions.json` if venue submission occurs
4. updated `summary.json` with the first post-signature blocker or venue artifact

## Workstream B: Railway Operator Access Reconciliation

### Backend Work Required

1. Do not reopen runtime logic or public-host truth. `XSL-006A` is already closed on live proof.
2. Keep the stale 2026-04-01 closure record superseded so it stops acting like current truth.
3. This pass already keeps local default runtime truth fail-closed unless an explicit proof-path override is supplied, while the live public runtime already serves a fresh Railway host receipt.
4. Restore or bypass Railway operator access enough to answer:
   - does `autoresearch-worker` still exist,
   - is its cron still configured,
   - can it still post to `/api/internal/autoresearch/receipts`,
   - and if not, is the right action revive or retire.

### Frontend Work Required

1. None unless there is a dedicated runtime-status UI surface that currently overclaims recurrence.

### Outside-The-Box Fix Paths

1. If Railway CLI stays broken, use a non-CLI audit path:
   - Railway dashboard/browser session,
   - Railway GraphQL or API token path,
   - or an operator-exported environment dump sufficient to verify service inventory.
2. If a later live recheck diverges or `autoresearch-worker` disappears, retire the static proof seed and public host claim immediately instead of preserving a zombie proof story.
3. Only if Railway ownership is truly unrecoverable after that recheck, evaluate a new recurring host such as GitHub Actions or another scheduler surface under a separate explicit owner decision.

### Verification And Proof

Required commands:
1. `railway whoami`
2. `railway status`
3. `curl -sS 'https://24-7.markets/api/runtime/autoresearch?limit=1'`
4. `node --test apps/worker/src/__tests__/autoresearch-runtime.test.js`
5. `node --test apps/worker/src/__tests__/autoresearch-railway-cron.test.js`
6. `node --test apps/api/test/api.test.js`

Expected proof artifacts:
1. Railway CLI or non-CLI inventory capture proving whether `autoresearch-worker` can still be directly operated,
2. fresh receipt capture if the host changes or is re-verified through a different operator path,
3. or an operator-access blocker note if the live public host remains proven but local CLI control stays denied.

## Workstream C: Enso Live Proof Or Truth Freeze

### Backend Work Required

1. This pass already stops calling Enso “spec-only” in issue text because shared contracts, API wiring, web handling, and the proof runner now all exist.
2. Reuse [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js) as the canonical proof runner; do not invent a second Enso adapter.
3. Reuse the current `quote_portfolio` and `enso_bundle` path.
4. Capture:
   - approval transaction for `USDC`,
   - bundle transaction payload,
   - gas estimate,
   - route and bundle arrays,
   - expected per-target outputs,
   - and post-run blocker or tx hash.
5. The current exact blocker is no longer missing env. The repo-owned approval path is fixed, and the repo now includes a Privy-free direct diagnostic. The promoted basket still fails because `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx` are not currently directly quoteable through Enso at the tested notionals or at a direct sweep through `$1000`, and `AUSD` still lacks the required Ethereum/USDC metadata.

### Frontend Work Required

1. None until live proof exists.
2. Keep hosted `1inch` as the canonical public-default route while Enso is being proved.
3. If Enso later proves live, add browser proof on a candidate surface before any default-route change.

### Outside-The-Box Fix Paths

1. If Enso can quote only a subset of the promoted core xStocks or still cannot include the `AUSD` sleeve, freeze it as a non-canonical internal experiment and do not market it as whole-portfolio.
2. If Enso quoteability is good but live signing is operationally safer off the canonical route, prove it through an operator-only or hidden candidate flow first.
3. If Enso repeatedly fails on the exact promoted basket, keep the current implementation for internal experiments and explicitly demote the public claim to “implementation candidate only.”

### Verification And Proof

Required commands:
1. `pnpm --filter @xstocks-strategy-lab/shared build`
2. `node --test apps/api/test/api.test.js`
3. `node apps/api/scripts/enso-portfolio-multideposit-proof.js`
4. `node apps/api/scripts/enso-direct-quoteability-diagnostic.js`
5. `git diff --check`

Expected proof artifacts:
1. bundle request payload
2. `USDC` approval transaction payload
3. bundle tx payload plus gas
4. per-target output verification or exact blocker
5. one main transaction hash only if the lane really reaches that boundary

## Program Exit Criteria

This program is honestly closed only when:
1. shared `1inch` has advanced one step beyond `missing_user_signature` or recorded the exact first post-signature blocker,
2. Enso either has one exact live promoted-basket proof or is explicitly frozen as non-live with the exact blocker,
3. the runtime lane keeps the fresh live scheduler receipts canonical and the machine-local Railway operator story explicit,
4. and the repo truth plus operator CLI story match the actual state of the machine and deployed hosts.
