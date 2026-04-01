# xStocks Provider-To-Execution Handoff Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Extend the current provider-review proof so that a valid provider or operator-triggered rebalance can hand off into the completed `XSL-014A` venue-routed execution substrate, first under explicit operator action and later under a separately proven automation flag.

## Non-goals

This workstream does not:
1. reopen venue-routing design already completed under `XSL-014A`,
2. remove the existing review-only safety boundary before the handoff is proven,
3. bypass signer approval,
4. introduce a second orchestration stack separate from the canonical execution request path.

## Current Live Truth

1. `XSL-011B` proves signed provider ingress and opens `awaiting_operator` only.
2. `XSL-014A` completed the venue-routed manual execution substrate, including shared execution-request and leg contracts plus signer-owned `cow_swap` and `oneinch_fusion` paths.
3. `apps/api/src/services/api-service.js` intentionally stops the provider path at `awaiting_operator`.
4. The repo does not yet own a shared handoff contract from provider review into execution-request staging.

## Dependency Freeze

1. Do not reopen `XSL-014A` venue design from this lane.
2. The first closure target is explicit operator handoff into the existing execution-request path.
3. Hosted or session-backed signer proof remains a later residual after this handoff and the canonical control surface land.

## Current Local Implementation Audit

### Shipped

1. accepted and rejected provider receipts,
2. exact dedupe, replay, and auth protections,
3. rebalance orchestration state through `awaiting_operator`,
4. completed venue-routed manual execution substrate ready to receive a caller above it.

### Partial

1. provider intake proof exists,
2. but no downstream execution join exists yet.

### Residual Only

1. one shared handoff from `awaiting_operator` into the canonical execution request path,
2. one explicit operator-triggered `execute_all` action that consumes provider review state,
3. one later automation flag that reuses that same path without creating a shadow executor.

## Closure Order Position

This is the first remaining control-plane lane because the substrate already exists and the frontend control surface should sit on a real handoff contract rather than a mock continuation.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse as the intake proof owner.
2. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: mandatory completed dependency.
   - Decision: freeze and reuse.
3. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
   - Current relevance: very high.
   - Decision: keep sequence aligned to the umbrella.

## Workstream Outcome Contract

When this lane is materially closed:
1. provider-triggered review records can feed the same execution staging path as manual operator events,
2. the operator can explicitly execute all from that state,
3. later automation, if enabled, uses the same exact route, signer, and receipt path.

## State-And-Truth Contract

1. provider ingress remains review-only until the handoff exists,
2. first closure target = operator-triggered handoff from `awaiting_operator` into execution staging,
3. second closure target = optional automation flag using the same path,
4. no separate "CRE executor" may appear alongside the canonical execution request path.

## Execution Plan

1. Define a handoff contract from rebalance orchestration state into the completed venue-routed execution request.
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
4. one hosted or local proof showing accepted provider review can stage the same completed execution path

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
- 2026-04-02: this lane now starts from the completed `XSL-014A` substrate and must not reopen venue design.

## Progress Log

- 2026-04-01T23:14:00+02:00: Created `XSL-018B` as the owner spec for provider-review-to-execution handoff after the signed ingress lane proved only the intake boundary.
- 2026-04-02T11:05:00+02:00: Reconciled current truth so this lane now starts from the completed `XSL-014A` substrate instead of a stale CoW-only assumption.
