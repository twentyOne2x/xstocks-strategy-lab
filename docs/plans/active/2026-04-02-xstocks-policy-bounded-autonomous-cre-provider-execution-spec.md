# xStocks Policy-Bounded Autonomous CRE / Provider-Triggered Execution Spec

Date: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-011D` under `XSL-011`

## Tracking Note

The user requested this as `XSL-011C`, but `XSL-011C` already names the completed manual CoW proof bundle in this repo. This autonomous tranche is therefore tracked as `XSL-011D` to preserve historical issue continuity instead of silently reusing or renumbering a completed lane.

## Goal

Define exactly when provider-triggered CRE may advance from review or staging into autonomous execution by:
1. reusing the canonical execution-request path already landed beneath `XSL-018B` and `XSL-014B`,
2. treating the merged `XSL-005` automation signer posture as a dependency gate rather than an already-proven assumption,
3. limiting autonomy to the currently proven venue, asset, and notional surface,
4. and freezing the exact hosted proof bundle required before the repo may claim live autonomous CRE/provider-triggered execution.

## Non-goals

This spec does not:
1. implement runtime behavior in this pass,
2. reopen `XSL-011B` review-ingress design or provider-authenticity rules,
3. reopen `XSL-014B` venue-readiness work or widen the venue set,
4. treat a linked-wallet user signature as autonomous execution,
5. create a second execution state machine, hidden executor, cron-owned shadow path, or direct provider-to-venue shortcut,
6. claim smart-account-first automation is already proven live.

## User-Stated Desired Outcome

Define exactly when provider-triggered CRE may advance from review or staging into autonomous execution, reuse the canonical execution request path, and make smart-account-first automation a dependency instead of an assumption already proven.

## Thread-Synthesis Conclusion

This is one bounded workstream. A priority matrix is not needed for this thread because the ask is a single docs-only spec pass above already-decomposed `XSL-011B`, `XSL-018B`, `XSL-014B`, and `XSL-005` dependencies.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why |
| --- | --- | --- | --- |
| [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md) | canonical `XSL-011` umbrella | update and keep canonical | it owns the rebalance-automation truth boundary |
| [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | mandatory provider-ingress baseline | reuse | it owns authenticated provider review ingress and review-only receipt truth |
| [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md) | mandatory staging dependency | reuse as landed substrate baseline | it owns the provider-review-to-execution handoff concept and points at the landed staging contracts even though doc/runtime reconciliation is still needed |
| [2026-04-02-xstocks-default-basket-venue-routed-readiness.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-02-xstocks-default-basket-venue-routed-readiness.md) | mandatory venue and asset baseline | reuse as completed proof baseline | it proves the current promoted basket can reach `awaiting_approval` on `1inch.ethereum` at `$20` gross for the six core xStocks legs |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | mandatory automation signer dependency | reuse | it owns the smart-account versus linked-wallet posture that this lane must depend on |
| [2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md) | completed historical baseline | reuse as historical context only | it proves manual rebalance truth and keeps `XSL-011C` occupied |

Why a new spec is justified:
1. `XSL-011B` ends at `awaiting_operator`,
2. `XSL-018B` owns staging reuse but not autonomous advancement policy,
3. `XSL-014B` owns venue readiness but not provider-triggered autonomy,
4. `XSL-005` owns signer posture but not the autonomous CRE decision boundary.

## Current Live Truth

1. [packages/policy/src/rebalance-orchestration.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/rebalance-orchestration.js) still hard-codes `autonomousExecutionProven: false` and only treats `providerTriggeredProven` as a review-opening truth flag.
2. [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) accepts authenticated provider events and opens `awaiting_operator` only; it does not currently expose `execute_all` or `policy_bounded_automation` through the canonical execution action allowlist on `origin/main`.
3. [packages/shared/src/contracts/execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts) and [apps/api/src/rebalance-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/rebalance-service.js) already contain the landed staging substrate for `execute_all`, `provider_staging`, and future `policy_bounded_automation` runtime values.
4. `XSL-014B` completed the truthful venue-readiness baseline for the promoted default basket at `requestedNotionalUsd = 20`, `executionRouteId = "1inch.ethereum"`, six actionable core xStocks legs at `awaiting_approval`, and one deferred `AUSD` yield-buffer leg.
5. `XSL-005` currently proves linked-wallet-first hosted readiness truth for the live lane. No hosted proof yet shows a smart-account or delegated automation signer can autonomously sign or submit the same request.
6. No hosted proof bundle currently exists for autonomous CRE/provider-triggered execution. The strongest truthful current claim remains `review or staging exists; autonomous execution does not`.

## Symptom Contract

This is not a symptom-led debugging lane. The blocker is already structurally proven:
1. provider review proof stops at `awaiting_operator`,
2. the canonical execution path is only partially wired for provider staging on `origin/main`,
3. venue readiness exists only for the current `$20` `1inch.ethereum` core basket surface,
4. and the automation signer model is still a dependency owned by `XSL-005`.

## Completion Reconciliation

1. Completion relative to `XSL-011B` = complete for review-only provider ingress, not for autonomous execution.
2. Completion relative to `XSL-018B` = landed contract and staging substrate exists in shared contracts, rebalance-service, and tests, but canonical API exposure on `origin/main` still needs reconciliation; treat this as a dependency baseline, not autonomous closure.
3. Completion relative to `XSL-014B` = completed and proof-backed for venue-routed readiness at `$20` gross on `1inch.ethereum` for `NVDAx`, `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, and `GOOGLx`, with `AUSD` still deferred/manual.
4. Completion relative to merged `XSL-005` posture = current linked-wallet-first truth is strong enough to prove that smart-account-first automation may not be assumed; the actual autonomous signer branch remains open.
5. Verified implementation and proof status for autonomous CRE/provider execution = not started. No hosted autonomous quote, submission, or receipt proof exists.

## Current Local Implementation Audit

### Shipped

1. provider-event schema, auth, dedupe, replay protection, and accepted or rejected receipt persistence,
2. rebalance orchestration that can open `awaiting_operator` only for provider-triggered review,
3. canonical execution-request and per-leg contracts that already model `execute_all`, `provider_staging`, and future `policy_bounded_automation`,
4. venue-routed 1inch proof for the six core xStocks legs at `$20` gross through `awaiting_approval`.

### Partial

1. provider-staging helpers exist in [apps/api/src/rebalance-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/rebalance-service.js) and related tests,
2. but [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) still exposes only `create`, `quote_leg`, `record_submission`, and `poll_receipt` on the canonical execution route,
3. smart-account or delegated automation signer proof does not yet exist on the hosted path.

### Spec-only or missing

1. the policy gate that decides when accepted provider review may advance autonomously,
2. the canonical API exposure for `execute_all` and any later `policy_bounded_automation` advancement,
3. hosted autonomous proof with real provider signer, real automation signer, and linked runtime artifacts,
4. rollback and operator-visibility proof for autonomous failures.

## Codebase-Fit And Iteration-Speed Contract

1. `codebase fit = extend existing surface`
2. `existing logic to reuse = provider receiver in apps/api/src/services/api-service.js, execution contracts in packages/shared/src/contracts/execution.ts, staging helpers in apps/api/src/rebalance-service.js, and readiness derivation in packages/policy/src/rebalance-orchestration.js`
3. `new entrypoints required = no new public or shadow execution entrypoint is justified; autonomy must reuse POST /api/executions and the existing provider receiver`
4. `structural refactor assessment = same-tranche beneficial`
5. `iteration-speed hotspots assessed = apps/api/src/services/api-service.js is a large mixed-concern service file, and the split between it and apps/api/src/rebalance-service.js is already creating doc/runtime drift around execute_all`
6. `build/deploy fan-out assessment = keep the lane inside packages/shared, packages/policy, and apps/api; do not widen into apps/web or apps/worker unless a later hosted runner proof truly requires it`
7. `intended file/package boundaries = shared contracts and linkage ids in packages/shared, policy gating in packages/policy, route handling and orchestration in apps/api, no duplicated executor logic in worker or separate scripts`

## Product Outcome Contract

When this workstream is materially closed:
1. a real provider-triggered CRE event can move from accepted review into autonomous execution only on the bounded, currently proven surface,
2. the repo still uses one execution request and per-leg truth model for manual, staged, and autonomous paths,
3. operator visibility shows the exact autonomous stage reached or the exact hard-stop reason,
4. the repo can state one truthful claim level for autonomous CRE/provider execution without borrowing proof from manual or staging-only lanes.

Outcome axes:
1. `user UX = one truthful execution progression with exact venue, signer, and stop reason instead of ambiguous "automation" language`
2. `sustainability = no second executor, one bounded slot and notional surface, and no open-ended retry loops`
3. `safety = fail closed on missing signer proof, disallowed venue or asset, notional cap breach, quote failure, or stale provider receipt`
4. `maintainability = one execution state machine, shared contracts, and no duplicate provider-to-venue shortcuts`

## User-Journey Contract

1. A real allowlisted provider event is accepted and persists one provider receipt.
2. The current promoted slot opens `awaiting_operator` through the already-proven `XSL-011B` review path.
3. The same canonical execution-request path stages one linked execution request with `triggerSource = "provider_staging"`.
4. A policy gate evaluates venue, asset, notional, signer, and quoteability prerequisites.
5. Only if every gate passes may the same execution request advance under `policy_bounded_automation`.
6. If any gate fails, the lane must stay at `awaiting_operator`, transition to `blocked`, or require `manual_followup_required`; no hidden partial autonomous path is allowed.

## State-And-Truth Contract

### Canonical execution path

1. The only allowed autonomous execution write path is the canonical `POST /api/executions` surface or an internal call that persists the exact same `ExecutionRequest` and `ExecutionRequestLeg` contract.
2. `action = "execute_all"` from a provider-backed `awaiting_operator` rebalance is the allowed staging verb for creating `triggerSource = "provider_staging"`.
3. Any later autonomous advancement must mutate that same execution request and preserve the same `rebalanceId`, `providerReceiptId`, `activationId`, per-leg ids, and final venue or receipt artifacts.
4. Disallowed:
   - any separate `/api/internal/autonomous-executions` executor,
   - direct provider payload to venue submission,
   - a worker-only shadow state machine,
   - or any route that bypasses the canonical execution-request contract.

### Allowed trigger classes

| Trigger class | Source | Allowed effect | Disallowed effect |
| --- | --- | --- | --- |
| `provider_triggered` | external CRE/provider event with allowlisted signer | open `awaiting_operator` and persist accepted receipt | quote, sign, submit, or settle directly |
| `execute_all` | canonical execution-route staging action from provider-backed review | create one linked execution request with `triggerSource = "provider_staging"` | bypass receipt or rebalance linkage |
| `provider_staging` | internal persisted execution-request provenance | represent a staged request created from accepted provider review | claim autonomous execution by itself |
| `policy_bounded_automation` | internal advancement trigger on an already-staged execution request | quote, sign, submit, and poll only within this spec's gates | widen venue, assets, caps, or signer model beyond this spec |
| `operator_manual` | operator fallback or override | pause, retry manually, or complete follow-up | relabel manual intervention as autonomous proof |

### Signer model

1. Provider-event authenticity signer
   - must be a real allowlisted CRE/provider signer for the accepted event,
   - proves trigger authenticity only,
   - never counts as the execution signer.
2. Staging/session proof
   - until `XSL-005` closes the automation signer branch, provider staging still depends on the current authenticated ownership proof used by `XSL-018B`,
   - staged provider review does not count as autonomous execution.
3. Execution signer
   - autonomous execution may use only the canonical automation signer branch chosen and merged under `XSL-005`,
   - if `XSL-005` chooses smart-account-first automation, a real hosted smart account or delegated smart-account signer must exist and must be the order-signing authority,
   - if `XSL-005` does not close a smart-account-first branch, this lane stays blocked until a separately merged automation signer model is proven on the hosted path.
4. Disallowed signer evidence
   - temporary proof signers,
   - linked-wallet user signatures,
   - or operator-pasted signatures do not count as autonomous execution proof.

### Venue allowlist

1. `1inch.ethereum` only.
2. `oneinch_fusion` is the only allowed autonomous quote and submission mechanism in the first tranche.
3. `cow_swap.ethereum` remains a manual or user-approved baseline only and is not in the autonomous provider-execution allowlist.
4. Any venue expansion requires a separate spec and proof tranche.

### Asset allowlist

1. Slot allowlist = `onboarding.default_basket` only.
2. Asset allowlist = `NVDAx`, `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, `GOOGLx`.
3. `AUSD` remains a deferred or manual yield-buffer leg and may not be advanced autonomously in this tranche.
4. Any manifest, slot, or asset expansion requires a new proof baseline at least as strong as `XSL-014B`.

### Notional caps

1. Maximum gross requested notional per autonomous run = `$20.00`.
2. Maximum cumulative autonomous notional per slot per day = `$20.00`.
3. Maximum concurrent autonomous runs per slot = `1`.
4. Maximum execution requests created from one accepted provider receipt = `1`.
5. The provider payload may not override or upscale the cap; any request above the cap hard-stops to manual review.

### Readiness and quoteability prerequisites

Autonomous advancement is allowed only when all of the following are true:
1. one accepted provider receipt exists for the current slot and promoted target manifest, with no duplicate or replay error,
2. the current rebalance is `awaiting_operator` and is not `paused`, `executing`, or already bound to another in-flight execution request,
3. the latest activation for the same slot remains `surfaceTruth = "live"`, `executionState = "ready"`, and `executionEligibility = "executable"`,
4. the execution request was created through the canonical provider-staging path and links back to the accepted provider receipt and rebalance id,
5. the promoted target remains `onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted` or a direct successor re-proven under an `XSL-014B`-strength closure,
6. every actionable core leg on the allowlist can quote on `1inch.ethereum` in the same execution attempt with no `blocked`, `failed`, or `deferred` state,
7. the chosen `XSL-005` automation signer branch is present and hosted-proven for the same request,
8. no blocker remains that still says a user signature or manual approval is required.

## Rollback And Hard-Stop Contract

1. If provider authenticity, manifest linkage, or replay checks fail, stop at the `XSL-011B` ingress boundary and persist a rejected receipt.
2. If staging fails to create one linked execution request on the canonical path, stay at `awaiting_operator` and require manual follow-up.
3. If any venue, asset, slot, signer, or notional gate fails, transition the rebalance to `blocked` and do not auto-retry.
4. If any actionable leg fails to quote or requires human approval, stop the autonomous lane immediately and require operator review; no partial autonomous submission is allowed in the first tranche.
5. If submission starts but a leg reports failed or incomplete receipt truth, persist the exact blocker, transition the execution request to `manual_followup_required` or `failed`, and disable further autonomous advancement for that slot until operator intervention.
6. Operational rollback for this tranche must be one-step and fail-closed: turn off the autonomous feature flag or route gate and fall back to the already-proven `XSL-011B` review plus operator-manual execution path.
7. The first hosted autonomous failure on the canonical path must downgrade the repo claim back to `review or staging only` until the failure is audited and a fresh proof bundle exists.

## Critical Assumptions And Invalidators

### Assumptions

1. `1inch.ethereum` remains the only truthful autonomous venue in the first tranche.
2. The promoted default basket remains the autonomous slot baseline.
3. `XSL-005` will explicitly close an automation signer branch before this lane claims live autonomy.
4. The canonical execution-request contract remains the single state machine for manual, staged, and autonomous execution.

### Invalidators

1. If venue truth moves away from `1inch.ethereum`, this spec must be reopened before any autonomous claim.
2. If the promoted basket changes its core asset set or notional baseline, the allowlist and cap sections become stale.
3. If `XSL-005` proves that the current hosted lane still needs human linked-wallet signatures, autonomous execution remains blocked.
4. If canonical API wiring still cannot expose `execute_all` or equivalent provider staging on the production path, the autonomous lane may not start.

## Measurement Contract

Required proof categories:
1. local proof
   - shared-contract, policy, rebalance-service, and provider-route tests cover trigger classes, fail-closed gates, and rollback behavior,
2. hosted staging proof
   - one real accepted provider event creates one linked execution request on the canonical host and canonical path,
3. hosted autonomous proof
   - the same request advances under `policy_bounded_automation` without human signature on the current bounded surface,
4. operator-visibility proof
   - the hosted read surface or operator report shows the same receipt, rebalance, execution request, venue ids, and final state.

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current provenance | Close only when |
| --- | --- | --- | --- |
| `XSL-011B` review ingress | 20 | hosted review-only proof exists | accepted provider receipt and `awaiting_operator` remain truthful |
| `XSL-018B` provider staging reuse | 20 | landed contracts, helpers, and tests; canonical API wiring still needs reconciliation | hosted canonical `execute_all` or exact equivalent creates one linked execution request |
| `XSL-014B` venue and asset readiness | 20 | completed hosted `$20` `1inch.ethereum` proof exists | same allowlist remains truthful on autonomous path |
| `XSL-005` automation signer posture | 20 | linked-wallet-first readiness only; autonomous signer branch open | hosted automation signer proof exists for the same bounded path |
| autonomous submit and receipt truth | 20 | no proof | hosted autonomous run records quote, submission, and receipt or exact external blocker under `policy_bounded_automation` |

## Economic-Budget Contract

1. The first autonomous tranche keeps maximum gross loss exposure bounded to `$20.00` per day on one slot.
2. Manual review remains the default cheaper fallback whenever autonomy loses a proof gate.
3. No automatic retry loop, averaging, or repeated provider-trigger batch is allowed in the first tranche.
4. The product may not trade larger notional or more slots autonomously until a new cap-raise proof bundle exists.

## Owners And Decision-Rights Contract

1. `XSL-011` remains the canonical automation-truth owner.
2. `XSL-011B` owns provider ingress authenticity, accepted and rejected receipts, and review-only opening.
3. `XSL-018B` owns reuse of the provider-to-execution staging path and linkage semantics.
4. `XSL-014B` owns the current venue, asset, and notional baseline for the first autonomous tranche.
5. `XSL-005` owns the automation signer posture and must close that dependency before live autonomy claims are allowed.
6. `packages/shared`, `packages/policy`, and `apps/api` own the runtime implementation for this lane; `apps/web` is not the owner of autonomous truth.

## Migration / Coexistence / Deprecation Contract

1. Keep the already-proven manual and review-only paths live while this lane is unproven.
2. Do not deprecate `XSL-011A`, the completed manual `XSL-011C` proof bundle, or the review-only `XSL-011B` ingress to make room for autonomy.
3. Keep autonomous execution behind an explicit flag or equivalent gate until the hosted proof contract is complete.
4. Any later expansion beyond the first slot, first venue, or first cap must open a new tranche instead of silently widening this one.

## Data / Privacy / Retention Contract

1. Provider JWTs, signer secrets, and Privy secrets must never be committed or stored in proof bundles.
2. Provider receipt ids, rebalance ids, execution request ids, quote ids, order hashes, venue order ids, and tx hashes are required retained audit artifacts for this lane.
3. Smart-account and linked-wallet addresses may appear in internal proof artifacts, but public-facing summaries should mask them by default.
4. Every autonomous attempt must preserve the full linkage chain:
   - provider receipt,
   - rebalance record,
   - execution request,
   - per-leg venue state,
   - receipt or exact blocker.

## Exact Hosted Proof Required Before Claim

The repo may not claim `autonomous CRE/provider-triggered execution works` until one hosted proof bundle contains all of the following:
1. one accepted provider event from a real allowlisted provider signer on the canonical deployed API host,
2. one linked rebalance record for that same receipt reaching `awaiting_operator`,
3. one canonical execution-request creation from that same rebalance using `action = "execute_all"` or the exact repo-confirmed equivalent, with `triggerSource = "provider_staging"`,
4. one autonomous advancement of that same request under `runtimeOwner = "policy_bounded_automation"` on the same host without a human linked-wallet signature,
5. all six allowlisted core legs on `1inch.ethereum` either:
   - record venue submission ids plus tx hashes and later receipt states,
   - or stop on one exact external blocker after quotes and before submission, while preserving the same request and leg linkage,
6. the proof summary records:
   - provider receipt id,
   - rebalance id,
   - execution request id,
   - trigger source,
   - runtime owner,
   - signer model,
   - signer address or account type,
   - requested notional,
   - venue,
   - per-leg quote ids and order hashes,
   - final receipt or blocker state,
7. one hosted read surface or operator report shows the same ids and final state without relying on manual log scraping.

What does not count:
1. local-only tests,
2. testnet runs,
3. temporary proof signers,
4. manual operator clicks that provide a human signature,
5. a review-only receipt with no staged or autonomous execution artifact.

## Verification Contract

Future implementation verification for this lane must include:
1. `node --test packages/shared/test/rebalance-provider.test.js`
2. `node --test packages/policy/test/rebalance-policy.test.js`
3. `node --test apps/api/test/rebalance-service.test.js`
4. `node --test apps/api/test/provider-rebalance-api.test.js`
5. one hosted provider-ingress proof on the canonical API host
6. one hosted autonomous execution proof bundle matching the section above
7. `git diff --check`

## Exit Criteria

This lane is materially closed only when:
1. the canonical execution path, not a shadow executor, advances provider-backed review into autonomous execution,
2. the bounded signer, venue, asset, and notional policy in this spec is enforced,
3. the hosted proof bundle proves the exact autonomous claim level being made,
4. rollback and operator-visibility proof exists for the same path.

## Decision Log

- 2026-04-02: preserve the completed historical `XSL-011C` proof bundle and open this autonomous tranche as `XSL-011D` instead of reusing the old issue id.
- 2026-04-02: keep the first autonomous tranche pinned to the exact `XSL-014B` `$20` `1inch.ethereum` core-basket proof surface.
- 2026-04-02: treat smart-account-first automation as a dependency gate owned by `XSL-005`, not a fact already proven by current hosted execution.
- 2026-04-02: record the current `api-service` versus `rebalance-service` drift directly in the spec instead of inheriting the stronger `XSL-018B` claim language without reconciliation.

## Progress Log

- 2026-04-02T00:00:00+02:00: Audited the required issue docs, active specs, completed proof doc, `packages/policy/src/rebalance-orchestration.js`, `apps/api/src/services/api-service.js`, `apps/api/src/rebalance-service.js`, and the landed `$20` 1inch proof artifact.
- 2026-04-02T00:00:00+02:00: Opened this docs-only execution-grade spec for policy-bounded autonomous CRE/provider execution without changing runtime behavior.
