# xStocks Event-Triggered Rebalance Control Surface Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Add the canonical frontend control surface for event-driven rebalance by:
1. turning the right-side panel into a real event and rebalance surface,
2. allowing the operator to stub or capture a news event now,
3. showing the resulting portfolio implication and execution readiness,
4. exposing one top-level `Execute all` action that stages or advances the completed `XSL-014A` execution contract without overclaiming automation.

## Non-goals

This workstream does not:
1. invent a second hidden execution path,
2. claim automation before the backend caller and signer lanes are proven,
3. redesign the whole terminal,
4. collapse research explanation and rebalance control into one undifferentiated panel,
5. reopen the completed `XSL-014A` substrate.

## User-Stated Desired Outcome

The user wants a news-event stub in the right-side panel now and a top-level `Execute all` style button that can trigger rebalance on mainnet.

## Current Live Truth

1. the frontend spec already reserves the right rail for market intelligence, route state, wallet state, venue provenance, and action controls,
2. `XSL-014A` is complete as the canonical execution contract, so the remaining frontend blocker is not venue routing,
3. `XSL-018B` is still the immediate next backend lane because no provider-staging caller yet creates or advances execution requests,
4. the canonical app does not yet implement a real event-triggered rebalance control surface in that right rail,
5. no top-level frontend control currently advances real backend execution state.

## Current Local Implementation Audit

### Shipped

1. canonical routes for onboarding, workspace, detail, and activation,
2. manifest-driven explanation and route-state surfaces,
3. API-backed orchestration state including `awaiting_operator`,
4. completed `XSL-014A` execution contract ready for callers above it.

### Partial

1. the right-rail concept exists in spec and visual language, but not as a real rebalance control surface,
2. some mock data already mentions route truth, but not a real operator action path.

### Spec-only Or Unproven

1. one event stub composer,
2. one top-level `Execute all` action wired to the canonical execution contract,
3. one browser-proof pack for the event -> rebalance -> execution staging journey.

## Completion Reconciliation

1. completion relative to spec = unstarted.
2. completion relative to repeated thread asks = still open; the user still cannot use the right rail to stage or trigger real execution.
3. completion relative to prior implementation claims = stale framing that backend venue routing was the blocker is now false; the missing blocker is the UI caller and truthful state presentation.
4. verified implementation and proof status = right-rail concept only; no repo-owned event-control surface yet.
5. canonical frontend functioning status = no real event-triggered rebalance surface yet.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: extend.
   - Why: the right rail is already canonically owned there.
2. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
   - Current relevance: very high.
   - Decision: reuse as umbrella.
   - Why: this file owns the program-level sequencing and proof posture.
3. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as frozen dependency.
   - Why: `Execute all` must target the completed execution contract rather than a UI-local state machine.

## XSL-014A Dependency Contract

This control surface must depend explicitly on the completed execution contract:
1. `Execute all` stages or advances `ExecutionRequest` rather than inventing a frontend-only executor,
2. operator-driven UI calls use `runtimeOwner = "operator_manual"` and the same per-leg route, quote, approval, venue-status, and receipt surfaces already frozen by `XSL-014A`,
3. the UI may label the intent as `execute_all`, but it must not imply autonomous execution or a separate state machine,
4. if the backend caller lane is not ready, the UI must degrade to review-only or staging-only truth.

## Workstream Outcome Contract

When this lane is materially closed:
1. the operator can create a rebalance-driving event from the right rail,
2. the UI shows what changed and the portfolio implication,
3. the UI shows whether execution is ready, blocked, or still review-only,
4. the top-level `Execute all` action reflects real backend state rather than mock affordance.

## State-And-Truth Contract

1. event creation or stubbing must produce a persisted review intent, not just local UI state,
2. `Execute all` must degrade honestly:
   - hidden or disabled if no canonical execution request exists,
   - staging-only if the backend caller lane is partial,
   - executable only when the backend says the plan is ready,
3. the right rail must show:
   - event summary,
   - confidence,
   - what changed,
   - portfolio implication,
   - route and readiness status,
   - action controls,
4. no UI copy may imply autonomous execution before that proof exists.

## Execution Plan

1. audit the canonical workspace, detail, and activation surfaces and choose the exact host surface for the right-rail rebalance panel,
2. add one event-stub path that records:
   - event source,
   - summary,
   - confidence,
   - affected sleeves or symbols,
   - operator intent,
3. add one backend API path if needed to persist event-triggered rebalance intents,
4. add one top-level `Execute all` control that consumes truthful backend execution readiness from the canonical contract,
5. keep the control surface honest when execution is still blocked, review-only, or awaiting signer proof.

## Proof Artifacts

Required artifacts:
1. desktop and mobile browser screenshots of the right-rail event flow,
2. one persisted event-intent artifact,
3. one UI-to-API proof showing the `Execute all` control maps to the canonical execution request state,
4. one summary stating exactly what is still manual or blocked.

## Verification Contract

Minimum required verification:
1. `pnpm --filter @xstocks-strategy-lab/web build`
2. `pnpm --filter @xstocks-strategy-lab/web test`
3. browser verification on the canonical workspace or activation surface

## Exit Criteria

This lane is materially closed only when:
1. the right rail is a real event-triggered rebalance surface,
2. the event flow persists repo-owned state,
3. the top-level `Execute all` action reflects truthful backend readiness from the canonical execution contract,
4. browser proof exists on the canonical app path,
5. no automation claim outruns the current backend caller and signer proof level.

## Rollback / Recovery

1. if the backend caller lane is not ready, keep the right rail as review-only and do not expose a false execute-all path,
2. remove event-stub UI if it cannot persist repo-owned state,
3. revert any UI branch that tries to bypass the canonical execution contract.

## Decision Log

- 2026-04-01: `XSL-018A` depends on the completed `XSL-014A` contract rather than reopening venue work.
- 2026-04-01: `Execute all` must be driven by backend truth, not a mock affordance.
- 2026-04-01: this lane remains second behind `XSL-018B` in the ordered control-plane backlog.
