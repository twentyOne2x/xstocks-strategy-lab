# xStocks Provider-To-Execution Handoff Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Extend the current provider-review proof so that a valid provider or operator-triggered rebalance can hand off into the completed `XSL-014A` execution contract, first under explicit operator action and later under a separately proven automation flag.

## Non-goals

This workstream does not:
1. reopen the completed `XSL-014A` substrate,
2. bypass signer approval,
3. introduce a second orchestration stack separate from the canonical execution request path,
4. claim full `CRE` end-to-end execution before signer-backed submission proof exists.

## User-Stated Desired Outcome

The user wants `CRE` to stop being review-only and eventually handle the rest through the same `1inch + CoW` execution path.

## Current Live Truth

1. `XSL-011B` proves signed provider ingress and still opens `awaiting_operator` only.
2. `XSL-014A` is complete as the repo-owned venue-routed execution substrate up to the live session or signer boundary.
3. The exact missing backend lane is now the caller or handoff from provider review into that completed execution contract.
4. Full `CRE` end-to-end execution remains unproven until this lane can create or advance execution requests and a real signer-backed submission proof exists.

## Current Local Implementation Audit

### Shipped

1. accepted and rejected provider receipts,
2. exact dedupe, replay, and auth protections,
3. rebalance orchestration state through `awaiting_operator`,
4. completed venue-routed execution request and leg contract under `XSL-014A`.

### Partial

1. the review-state machine exists,
2. the execution substrate exists,
3. but no backend caller joins them.

### Spec-only Or Unproven

1. one shared handoff from `awaiting_operator` into the canonical execution request,
2. one explicit operator-triggered `Execute all` path consuming provider-triggered review state,
3. one later automation flag reusing the same path without creating a shadow executor.

## Completion Reconciliation

1. completion relative to spec = unstarted as a caller lane.
2. completion relative to repeated thread asks = still open; review ingress was proven, but the user still cannot move provider review into execution.
3. completion relative to prior implementation claims = stale framing that backend venue work was the blocker is now false; the missing blocker is this handoff lane.
4. verified implementation and proof status = review ingress proven, execution contract complete, no provider-staging caller yet.
5. canonical frontend functioning status = not owned here, but still blocked on this lane for truthful `CRE` follow-through.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns signed provider delivery and review ingress.
2. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as frozen dependency.
   - Why: this lane must call the completed execution contract rather than replace it.
3. [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md)
   - Current relevance: high.
   - Decision: reuse as frozen active summary.
   - Why: it now documents that `XSL-014A` is completed rather than still open.

## XSL-014A Dependency Contract

This lane must reuse the completed `XSL-014A` contract exactly:
1. create or advance `ExecutionRequest` and `ExecutionRequestLeg`,
2. persist lineage from provider event -> rebalance record -> execution request -> per-leg artifacts,
3. stage provider-owned requests with `runtimeOwner = "operator_manual"` until later proof changes that truth,
4. mark provider-owned caller intent with `triggerSource = "provider_staging"` rather than inventing a separate provider executor,
5. leave `Execute all` and later signer-backed submission to the same canonical request path.

## Workstream Outcome Contract

When this lane is materially closed:
1. provider-triggered review records can feed the same execution staging path as manual operator events,
2. the operator can explicitly execute all from that state,
3. later automation, if separately enabled and proven, uses the same exact route, signer, and receipt path.

## State-And-Truth Contract

1. provider ingress remains review-only until the handoff produces a canonical execution request.
2. first closure target = operator-triggered handoff from `awaiting_operator` into execution staging.
3. second closure target = optional later automation flag using the same path and still bounded by separate proof.
4. no separate `CRE executor` may appear alongside the canonical execution request path.

## Execution Plan

1. define the handoff contract from rebalance orchestration state into the completed `XSL-014A` execution request shape,
2. add an explicit operator-triggered `execute_all` action that can consume provider-triggered review state,
3. persist the handoff artifact and lineage across:
   - provider event,
   - rebalance record,
   - execution request,
   - per-leg execution artifacts,
4. only after that is proven, add a bounded automation flag or policy gate that reuses the same path.

## Proof Artifacts

Required artifacts:
1. one accepted provider-review artifact,
2. one provider-review-to-execution-request artifact using the canonical contract,
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
2. it can create or advance the canonical execution request path,
3. operator `Execute all` works from that state,
4. any automation claim remains separately labeled and proven,
5. full `CRE` end-to-end closure is still withheld until signer-backed submission proof exists.

## Rollback / Recovery

1. keep the existing accepted review ingress intact if the handoff layer is not ready,
2. disable automatic handoff while retaining explicit operator review if execution proof regresses,
3. remove any caller branch that forks away from the canonical execution request contract.

## Decision Log

- 2026-04-01: `XSL-018B` is now the immediate next backend lane after `XSL-014A` completion.
- 2026-04-01: provider-triggered review stays the intake boundary; execution handoff becomes a separate caller lane.
- 2026-04-01: automation must reuse the same execution path as manual `Execute all`.
