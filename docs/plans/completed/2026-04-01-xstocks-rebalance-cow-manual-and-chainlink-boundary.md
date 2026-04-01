# xStocks Rebalance CoW Manual And Chainlink Boundary

Date: 2026-04-01
Owner: Codex
Status: completed
Canonical issue: `XSL-011A` under `XSL-011`

## Outcome

Completed as an audit-and-boundary-freeze tranche. The repo already owned the truthful manual CoW rebalance path, scheduled worker review shell, and fail-closed provider-trigger boundary. This tranche closed the loop by correcting the owner-lane issue/plan artifacts and by recording exact local proof plus the precise missing Chainlink/CRE blockers.

## Objective

Freeze and verify the truthful runtime boundary from promoted-manifest drift to operator-approved rebalance action by:
1. defining the exact rebalance state machine,
2. proving the manual/operator CoW execution lane,
3. proving whether a regular worker review loop exists in repo truth,
4. and stopping the Chainlink-oriented trigger surface at the exact fail-closed boundary because real provider proof is absent.

## Non-goals

This tranche does not:
1. claim autonomous execution,
2. claim live Chainlink Automation, CRE, or CCIP ownership without proof,
3. add new frontend product surfaces,
4. bypass operator or user approval,
5. or broaden into 1inch, bridge, issuer, or Hermes work.

## User-Stated Desired Outcome

Own only the truthful rebalance and Chainlink-oriented orchestration boundary, get regular/manual rebalance truth working on CoW first, keep everything fail closed and operator-approved, and state exactly what real Chainlink/CRE proof exists or what blocker remains.

## Constraints And Non-Negotiables

1. Scope only `apps/api`, `apps/worker` only if needed, `packages/policy`, `packages/shared`, and `packages/xstocks` only if the manual CoW lane genuinely needs it.
2. `apps/web` must remain untouched unless operator-safe support is unavoidable.
3. CoW is the real execution rail.
4. Provider-triggered automation currently fails closed.
5. Chainlink / CRE is not allowed to be described as live unless repo proof exists.
6. Every path must remain fail closed and operator-approved or user-approved.

## Proof Contract

### Local-only proof

Counts as local-only in this tranche:
1. shared rebalance state and transition contracts,
2. policy derivation from promoted-manifest drift to orchestration state,
3. worker-owned scheduled review logic that can only queue or recommend review,
4. API-side manual CoW execution-request staging and settlement bookkeeping,
5. unit tests proving the above paths.

### Candidate or deployed-host proof

Not in scope for closure here unless already available without extra frontend or deployment work.

### Production proof

Production proof for this lane would require:
1. a real deployed operator/manual CoW rebalance run,
2. a recorded approval and submission artifact,
3. a real settlement confirmation,
4. and a provider-owned proof artifact if Chainlink/CRE is claimed.

### Blocker taxonomy

If the lane cannot close beyond local proof, classify the blocker as one of:
1. `missing_deployed_manual_execution_host`
2. `missing_live_operator_run`
3. `missing_provider_adapter`
4. `missing_provider_proof`
5. `missing_signed_event_validation`
6. `missing_settlement_artifact`

## Step-By-Step Plan

1. Audit the current rebalance path from promoted-manifest drift to operator action and reconcile it with the existing specs.
2. Verify the shared rebalance state machine, triggers, runtime owners, and provider-truth boundaries in the existing policy package.
3. Verify the API-side manual CoW execution service that stages operator review, quote capture, signed submission, and settlement confirmation.
4. Verify the worker-side scheduled review loop only queues or recommends manual review and never claims autonomous execution.
5. Run targeted tests and update issue + plan artifacts with exact proof and blockers.

## Verification Plan

Commands:
1. `node --test packages/policy/test/policy.test.js`
2. `node --test apps/worker/src/__tests__/rebalance-orchestrator.test.js`
3. `node --test --test-name-pattern "workspace and activity surfaces expose scheduled worker-owned review without claiming autonomous execution" apps/api/test/api.test.js`
4. `node --test --test-name-pattern "workspace and activity surfaces expose a recommended rebalance when the slot baseline trails the promoted manifest|authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet|execution quote, approval, submission, and receipt actions persist live CoW truth|execution quote failures persist exact CoW request diagnostics instead of a generic blocker|execution records a failed CoW venue state when the venue invalidates the order" apps/api/test/api.test.js`

Expected artifacts:
1. policy tests prove drift-to-orchestration derivation, scheduled review truth, and fail-closed provider-trigger handling,
2. worker tests prove scheduled review never becomes autonomous execution,
3. API tests prove manual CoW request staging, approval, submission, receipt bookkeeping, and scheduled manual-review hydration,
4. issue/plan artifacts state the exact live/manual boundary and the exact missing Chainlink proof.

## Rollback And Recovery

1. Revert only the issue/plan truth updates from this tranche.
2. Keep the existing backend/runtime rebalance implementation intact.
3. If later repo truth changes, reopen the owner lane with new proof rather than widening this completed audit slice retroactively.

## Decision Log

- 2026-04-01: Use `XSL-011` as the canonical owner lane instead of creating a separate automation storyline.
- 2026-04-01: Manual/operator CoW execution is the only truthful live execution owner in repo truth.
- 2026-04-01: Worker-owned scheduled review exists in repo truth, but it only recommends or queues review.
- 2026-04-01: Chainlink-oriented triggers must stay classification-only unless repo proof exists.
- 2026-04-01: No new runtime code is required for this tranche because the tracked implementation already satisfies the local manual/live boundary.

## Progress Log

- 2026-04-01T18:00:00+02:00: Initial owner-lane assumption was that the backend/runtime implementation surface was missing.
- 2026-04-01T18:20:00+02:00: Audit of `packages/policy/src/rebalance-orchestration.js`, `apps/worker/src/rebalance-orchestrator.js`, and `apps/api/src/services/api-service.js` showed the manual CoW lane, scheduled review shell, and fail-closed provider boundary already exist in repo truth.
- 2026-04-01T18:30:00+02:00: Verified local proof with tracked tests in policy, worker, and API.
- 2026-04-01T18:35:00+02:00: Closed the tranche at the exact Chainlink-oriented boundary: no provider adapter, no signed-event validation, and no Chainlink/CRE proof artifact exist in the repo.
