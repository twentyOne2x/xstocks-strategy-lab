# xStocks Remaining Live-Proof And Operator Access Closure

Date: 2026-04-03
Owner: `XSL-014C`, `XSL-005B`, and `XSL-006A` under `XSL-014`, `XSL-005`, and `XSL-006`
Status: active
Canonical issues: `XSL-014C`, `XSL-005B`, `XSL-005C`, `XSL-006A`

## Goal

Close the remaining blockers the user is explicitly still asking about:
1. advance shared `1inch` past `missing_user_signature`,
2. prove Enso live on the real promoted basket or freeze it as non-live with exact reasons,
3. reconcile the stale Railway recurring-runtime proof story with the current live `worker_runtime_only` API truth,
4. and restore or bypass the blocked Railway CLI enough to operate the runtime lane without thread folklore.

## Non-goals

This tranche does not:
1. switch the canonical public buy route away from hosted `1inch` before live proof exists,
2. reopen frontend prod parity, LI.FI scope, or solved `XSL-006` runtime logic,
3. invent a new execution executor or a second `1inch` owner lane,
4. blur `LI.FI`, `Enso`, hosted `1inch`, and shared `1inch` into one generic router claim,
5. or claim a deployed recurring scheduler host until fresh live receipts exist again.

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
2. The strongest current shared `1inch` proof stops at:
   - activation saved,
   - execution request created,
   - six actionable quotes,
   - approval payloads written,
   - signature inputs written,
   - blocker `missing_user_signature`.
3. The same proof runner already accepts externally supplied signatures through `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON`, so the next move is not a new backend path; it is one signer handoff plus one rerun.
4. Enso is no longer merely a docs idea:
   - shared bundle quote contracts exist in [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts),
   - API quote logic exists in [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js),
   - client wiring exists in [enso-execution-client.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/enso-execution-client.js),
   - web/manual execution handling exists in [manual-execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/manual-execution.ts),
   - and API tests already cover quoted Enso bundle creation.
5. Enso is still not live-proven because no repo-owned proof runner or onchain proof bundle exists yet.
6. The live public buy route remains hosted `1inch` on:
   - [https://24-7.markets/onboarding](https://24-7.markets/onboarding)
   - [https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1)
7. The runtime lane is currently split across three truths:
   - checked-in Railway cron code and config still exist in [autoresearch-railway-cron.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src/autoresearch-railway-cron.js) and [railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/railway.json),
   - a checked-in proof seed still claims `truthBoundary=railway_cron_service` in [autoresearch-runtime-proof.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/data/autoresearch-runtime-proof.json),
   - but the live public API currently returns `truthBoundary=worker_runtime_only`, `recurringAutonomousProven=false`, and `schedulerHost=null`.
8. The operator CLI matrix is now:
   - `gh`: healthy,
   - `vercel`: healthy,
   - `railway`: blocked with `invalid_grant` on `railway whoami`.

## Thread-Priority Matrix

| Rank | Workstream | Recurrence in this thread | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shared `1inch` post-signature advance | 4 | very high | high | partial | `XSL-014C`, [2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-shared-oneinch-submission-funding-and-custody-closure.md) | repeatedly described as the next real blocker | backend path and proof runner are implemented; proof stops before submission | yes, hosted `1inch` is the canonical route | collect signer signatures and rerun once |
| 2 | Recurring runtime host and Railway access reconciliation | 4 | very high | medium | overclaimed historically, fail-closed live | `XSL-006A`, [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | cleanup was claimed complete | code and proof-seed exist, but live host proof is not currently reverified and Railway CLI is blocked | public runtime API is truthful but still `worker_runtime_only` | restore or bypass Railway access, then re-audit `autoresearch-worker` |
| 3 | Enso live proof or truthful demotion | 3 | high | medium | partial implementation, proof-missing | `XSL-005B`, `XSL-005C`, [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) | implementation candidate only | shared contracts, API path, and web handling exist; no proof runner or live bundle proof | no, canonical public route is still hosted `1inch` | add proof runner and run one exact promoted-basket proof |

## Goal-Vs-Repo-Truth Diff

1. Goal:
   - the active hosted `1inch` lane should advance beyond missing signatures and expose the first exact post-signature blocker or first real venue submission artifact,
   - Enso should either become live-proven on the exact promoted basket or stay explicitly non-live,
   - and the runtime lane should stop carrying a stale “Railway cron already proven” story when the live API still says `worker_runtime_only`.
2. Current repo truth:
   - hosted `1inch` is the live public route but still needs signer-owned signatures,
   - Enso has partial code but no proof runner and no live proof,
   - runtime API truth is honest and fail-closed, but the repo still contains a stale historical Railway host proof artifact and doc.
3. Honestly complete means:
   - shared `1inch`: one signature-fed rerun reaches venue submission or one exact new blocker,
   - Enso: one exact promoted-basket proof either produces the whole-basket bundle truth or an exact blocker,
   - runtime: the repo either re-proves the existing Railway host with fresh evidence or explicitly retires the stale host proof and keeps `worker_runtime_only`.

## Completion Percent And Remaining Delta

| Workstream | Implementation | Proof | Prod / operator | Remaining delta |
| --- | ---: | ---: | ---: | --- |
| Shared `1inch` signer advance | 95% | 70% | 70% | collect signatures, rerun, classify first post-signature blocker, and capture venue artifacts if any |
| Enso bundle lane | 60% | 10% | 0% | add proof runner, prove all seven targets including `AUSD`, capture approval plus bundle artifacts, and decide live vs non-live |
| Recurring runtime host | 70% | 20% | 0% | restore or bypass Railway access, verify whether `autoresearch-worker` still exists, then re-prove or retire the stale host claim |

## Closure, Endpoint, And Deployment Truth

| Workstream | Earliest honest closure condition | Relevant surface | Local status | Deployed-host status | Production status | Proof command or artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Shared `1inch` | one rerun with real signatures reaches submission or exact new blocker | [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js), `POST /api/executions` | ready to accept external signatures | hosted/session-backed path already quotes six legs | public route is live but still pre-signature | [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/summary.json) |
| Enso | one exact promoted-basket run captures approval, bundle tx payload, and all required outputs or exact blocker | `quote_portfolio` in [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js), new proof runner | partial implementation only | env-backed live status unknown and unproven | not on canonical public route | current test coverage in [api.test.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/test/api.test.js) |
| Recurring runtime host | fresh live receipt or explicit retirement of stale host proof | [https://24-7.markets/api/runtime/autoresearch?limit=1](https://24-7.markets/api/runtime/autoresearch?limit=1), [autoresearch-railway-cron.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src/autoresearch-railway-cron.js), [railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/railway.json) | host code and tests exist | live host inventory currently inaccessible from CLI | public runtime remains fail-closed and truthful | `railway whoami`, runtime API output, and the stale proof seed in [autoresearch-runtime-proof.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/data/autoresearch-runtime-proof.json) |

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
2. Runtime host and Railway access reconciliation
   - highest truth-drift risk because stale proof and blocked operator access coexist.
3. Enso proof or demotion
   - valuable, but not on the canonical public route until real proof exists.

## Workstream A: Shared `1inch` Signer Advance

### Backend Work Required

1. Reuse [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js); do not build a second substrate.
2. Add one narrow operator-quality input improvement only if needed:
   - support a signatures file path such as `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH`,
   - or document the exact `jq -c` transform for `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON`.
3. Generate a signer packet from:
   - `approval-payloads.json`
   - `signature-inputs.json`
4. Collect one signature per quoted leg and rerun the proof once.
5. After rerun, classify the first exact external blocker as one of:
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

## Workstream B: Recurring Runtime Host And Railway Access Reconciliation

### Backend Work Required

1. Reopen `XSL-006A` as an active host-proof reconciliation lane.
2. Supersede the stale 2026-04-01 closure record so it stops acting like current truth.
3. Add explicit runtime provenance fields if needed so public/API truth can distinguish:
   - `live_host_receipt`
   - `static_repo_seed`
   - `none`
4. Keep public runtime truth fail-closed unless provenance is a fresh live host receipt.
5. Restore or bypass Railway operator access enough to answer:
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
2. If the `autoresearch-worker` service no longer exists or cannot be reverified quickly, retire the static proof seed from canonical truth and keep `worker_runtime_only` rather than preserving a zombie proof story.
3. Only if Railway ownership is truly unrecoverable, evaluate a new recurring host such as GitHub Actions or another scheduler surface under a separate explicit owner decision after the stale Railway story is retired.

### Verification And Proof

Required commands:
1. `railway whoami`
2. `railway status`
3. `curl -sS 'https://24-7.markets/api/runtime/autoresearch?limit=1'`
4. `node --test apps/worker/src/__tests__/autoresearch-runtime.test.js`
5. `node --test apps/worker/src/__tests__/autoresearch-railway-cron.test.js`
6. `node --test apps/api/test/api.test.js`

Expected proof artifacts:
1. service inventory capture proving whether `autoresearch-worker` exists,
2. fresh receipt capture if the host is revived,
3. or a retirement note plus runtime provenance downgrade if it is not.

## Workstream C: Enso Live Proof Or Truth Freeze

### Backend Work Required

1. Stop calling Enso “spec-only” in issue text because shared contracts, API wiring, and web handling already exist.
2. Add [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js) as the canonical proof runner.
3. Reuse the current `quote_portfolio` and `enso_bundle` path; do not invent a second Enso adapter.
4. Capture:
   - approval transaction for `USDC`,
   - bundle transaction payload,
   - gas estimate,
   - route and bundle arrays,
   - expected per-target outputs,
   - and post-run blocker or tx hash.
5. Fail closed unless the same run includes all seven targets, including the `AUSD` sleeve.

### Frontend Work Required

1. None until live proof exists.
2. Keep hosted `1inch` as the canonical public-default route while Enso is being proved.
3. If Enso later proves live, add browser proof on a candidate surface before any default-route change.

### Outside-The-Box Fix Paths

1. If Enso can quote only the six core xStocks and not the `AUSD` sleeve, freeze it as a `core_xstocks_only` internal experiment and do not market it as whole-portfolio.
2. If Enso quoteability is good but live signing is operationally safer off the canonical route, prove it through an operator-only or hidden candidate flow first.
3. If Enso repeatedly fails on the exact promoted basket, keep the current implementation for internal experiments and explicitly demote the public claim to “implementation candidate only.”

### Verification And Proof

Required commands:
1. `pnpm --filter @xstocks-strategy-lab/shared build`
2. `node --test apps/api/test/api.test.js`
3. `node apps/api/scripts/enso-portfolio-multideposit-proof.js`
4. `git diff --check`

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
3. the runtime lane either has fresh live scheduler receipts again or the stale Railway host proof has been retired from canonical truth,
4. and the repo truth plus operator CLI story match the actual state of the machine and deployed hosts.
