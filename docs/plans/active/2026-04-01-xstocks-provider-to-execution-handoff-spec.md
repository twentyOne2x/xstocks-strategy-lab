# xStocks Provider-To-Execution Handoff Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Extend the current provider-review proof so that a valid provider or operator-triggered rebalance can hand off into the same completed venue-routed execution control plane, first under explicit operator action and later under a separately proven automation flag.

## Non-goals

This workstream does not:
1. remove the existing review-only safety boundary before the execution lane is proven,
2. bypass signer approval,
3. introduce a second orchestration stack separate from the canonical execution request path.

## User-Stated Desired Outcome

The user wants `CRE` to stop being just review-only and eventually handle the rest through `1inch + Cow Swap`.

## Current Live Truth

1. `XSL-011B` proves signed provider ingress and opens `awaiting_operator` only.
2. `apps/api/src/services/api-service.js` intentionally stops the provider path at `awaiting_operator`.
3. The repo does not yet own a handoff contract from provider review into execution request staging.
4. The manual execution lane is now venue-routed and completed, so the remaining gap is provider handoff and hosted proof above it.

## Current Local Implementation Audit

### Shipped

1. accepted and rejected provider receipts,
2. exact dedupe/replay/auth protections,
3. rebalance orchestration state through `awaiting_operator`.

### Partial

1. the state machine for review exists,
2. but there is no downstream execution handoff contract.

### Spec-only Or Unproven

1. one shared handoff from `awaiting_operator` into a venue-routed execution request,
2. one explicit `Execute all` operator path consuming provider-triggered review state,
3. one later automation flag that can run the same path without creating a shadow executor.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns review ingress and should remain the proof source for signed provider delivery.
2. [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: provider handoff must not invent a separate execution engine.

## Workstream Outcome Contract

When this lane is materially closed:
1. provider-triggered review records can feed the same execution staging path as manual operator events,
2. the operator can explicitly execute all from that state,
3. later automation, if enabled, uses the same exact route, signer, and receipt path.

## State-And-Truth Contract

1. provider ingress remains review-only until the venue-routed execution lane is proven.
2. first closure target = operator-triggered handoff from `awaiting_operator` into execution staging.
3. second closure target = optional automation flag using the same path.
4. no separate "CRE executor" may appear alongside the canonical execution request path.

## Execution Plan

1. Define a handoff contract from rebalance orchestration state into the venue-routed execution request.
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
4. one summary separating manual and automated proof levels.

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

- 2026-04-01: provider-triggered review stays the intake boundary; execution handoff becomes a separate sub-lane.
- 2026-04-01: automation must reuse the same execution path as manual `Execute all`.

## Progress Log

- 2026-04-01T23:14:00+02:00: Created `XSL-018B` as the owner spec for provider-review-to-execution handoff after the signed ingress lane proved only the intake boundary.
