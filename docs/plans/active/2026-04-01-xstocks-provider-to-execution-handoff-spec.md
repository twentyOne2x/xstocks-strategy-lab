# xStocks Provider-To-Execution Handoff Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Extend the current provider-review proof so that a valid provider or operator-triggered rebalance can hand off into the completed shared execution substrate, first under explicit operator action and later under a separately proven automation flag.

## Non-goals

This workstream does not:
1. remove the existing review-only safety boundary before the handoff is proven,
2. bypass signer approval,
3. introduce a second orchestration stack separate from the canonical execution request path,
4. reimplement `XSL-014A` venue routing or backend Privy verification.

## User-Stated Desired Outcome

The user wants `CRE` or provider-triggered review to stop dying at `awaiting_operator` and feed the same execution path the operator will later use for `Execute all`.

## Current Live Truth

1. `XSL-011B` proves signed provider ingress and opens `awaiting_operator` only.
2. `XSL-014A` now proves the shared backend execution substrate already exists for manual execution requests and per-leg venue artifacts.
3. `apps/api/src/services/api-service.js` still intentionally stops the provider path at `awaiting_operator`.
4. No repo-owned handoff contract exists yet from provider review into shared execution request staging.
5. Hosted/session-backed signer proof remains a separate residual under `XSL-014`; this lane should not redefine it.

## Current Local Implementation Audit

### Shipped

1. accepted and rejected provider receipts,
2. exact dedupe, replay, and auth protections,
3. rebalance orchestration state through `awaiting_operator`,
4. reusable `executionRequest` / `executionRequestLeg` substrate for downstream staging.

### Partial

1. the review-state machine exists,
2. but there is no downstream handoff contract.

### Spec-only Or Unproven

1. one shared handoff from `awaiting_operator` into the existing execution request path,
2. one explicit operator-triggered `execute_all` action consuming provider review state,
3. one later automation flag that uses the same path without creating a shadow executor.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns review ingress and should remain the proof source for signed provider delivery.
2. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as completed dependency.
   - Why: provider handoff must not invent a separate execution engine.
3. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: high.
   - Decision: coordinate, do not absorb.
   - Why: hosted/session-backed signer proof remains a downstream dependency, not ownership of this handoff lane.

## Workstream Outcome Contract

When this lane is materially closed:
1. provider-triggered review records can feed the same execution staging path as manual operator events,
2. the operator can explicitly execute all from that state,
3. later automation, if enabled, uses the same exact route, signer, and receipt path.

## Dependency Contract

### Reuse

1. accepted provider review state and receipts from `XSL-011B`,
2. shared execution substrate from completed `XSL-014A`,
3. hosted/session-backed signer proof readiness from `XSL-014`.

### Do not own

1. backend Privy verification config,
2. live Privy access-token or identity-token collection,
3. venue-specific signer input capture beyond consuming the shared execution path.

## State-And-Truth Contract

1. provider ingress remains review-only until the handoff is proven.
2. first closure target = operator-triggered handoff from `awaiting_operator` into shared execution staging.
3. second closure target = optional automation flag using the same path.
4. no separate "CRE executor" may appear alongside the canonical execution request path.

## Execution Plan

1. Define a handoff contract from rebalance orchestration state into the shared execution request.
2. Add an explicit operator-triggered `execute_all` action that can consume provider-triggered review state.
3. Persist the handoff artifact and link receipts across:
   - provider event,
   - rebalance record,
   - execution request,
   - per-leg execution artifacts.
4. Only after that is proven, add a bounded automation flag or policy gate that can run the same path.

## Proof Artifacts

Required artifacts:
1. one accepted provider-review artifact,
2. one provider-review-to-execution handoff artifact,
3. one operator-triggered `execute_all` artifact from provider review state,
4. one summary separating handoff truth from later hosted/session-backed signer proof truth.

## Verification Contract

Minimum required verification:
1. `node --test packages/policy/test/rebalance-policy.test.js`
2. `node --test apps/api/test/rebalance-service.test.js`
3. `node --test apps/api/test/provider-rebalance-api.test.js`
4. one hosted or local proof showing accepted provider review can stage the same execution path

## Exit Criteria

This lane is materially closed only when:
1. accepted provider review no longer dead-ends at `awaiting_operator`,
2. it can hand off into the canonical execution request path,
3. operator `Execute all` works from that state,
4. any automation claim remains separately labeled and proven.

## Rollback / Recovery

1. Keep the existing accepted review ingress intact if the handoff layer is not ready.
2. Disable automatic handoff while retaining explicit operator review if execution proof regresses.

## Decision Log

- 2026-04-01: provider-triggered review stays the intake boundary; handoff into shared execution is now the first residual control-plane lane after `XSL-014A`.
- 2026-04-01: automation must reuse the same execution path as manual `Execute all`.
- 2026-04-01: this lane depends on, but does not own, backend Privy verification config or live session-backed proof input collection.

## Progress Log

- 2026-04-01: Reconciled `XSL-018B` after `XSL-014A` completion and moved it to the top of the residual control-plane backlog.
