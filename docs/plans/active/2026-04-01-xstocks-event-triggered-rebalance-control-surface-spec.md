# xStocks Event-Triggered Rebalance Control Surface Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Add the canonical frontend control surface for event-driven rebalance by:
1. turning the right-side panel into a real event or review-driven rebalance surface,
2. allowing the operator to stub or inspect a rebalance-driving event now,
3. showing the resulting portfolio implication and execution readiness from backend truth,
4. and exposing one top-level `Execute all` action that consumes the shared execution path.

## Non-goals

This workstream does not:
1. invent a second hidden execution path,
2. claim automation before the backend handoff and signer proof lanes are proven,
3. redesign the whole terminal,
4. own backend Privy verification config or raw session-token collection.

## User-Stated Desired Outcome

The user wants a right-rail event or review surface now and a top-level `Execute all` button that can trigger the truthful backend execution path.

## Current Live Truth

1. The frontend spec already reserves the right rail for market intelligence, route state, wallet state, venue provenance, and action controls.
2. The canonical app does not yet implement a real event-triggered rebalance control surface in that right rail.
3. `XSL-014A` now proves the backend execution substrate exists, so the UI no longer needs to wait on backend route-contract invention.
4. `XSL-018B` is still missing, so provider review cannot yet progress into the shared execution path.
5. `XSL-014` still owns hosted/session-backed signer proof and served-truth closure; this UI lane should surface readiness, not redefine that proof contract.

## Current Local Implementation Audit

### Shipped

1. canonical routes for onboarding, workspace, detail, and activation,
2. manifest-driven explanation and route-state surfaces,
3. API-backed orchestration state including `awaiting_operator`,
4. completed backend execution substrate for downstream execution staging.

### Partial

1. the right rail concept exists in spec and visual language, but not as a real rebalance control surface,
2. some mock data already mentions route truth, but not a real operator action path.

### Spec-only Or Unproven

1. one event or review stub surface,
2. one top-level `Execute all` action wired to real backend state,
3. one browser-proof pack for the review or event -> rebalance -> execution staging journey.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: extend.
   - Why: the right rail is already canonically owned there.
2. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
   - Current relevance: very high.
   - Decision: reuse as umbrella.
   - Why: that file owns the program-level sequencing and proof posture.
3. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
   - Current relevance: very high.
   - Decision: coordinate.
   - Why: the control surface must consume the real handoff state instead of inventing frontend-only staging.

## Workstream Outcome Contract

When this lane is materially closed:
1. the operator can create or inspect a rebalance-driving event or provider review from the right rail,
2. the UI shows what changed and the portfolio implication,
3. the UI shows whether execution is ready, blocked, or still review-only,
4. the top-level `Execute all` action reflects real backend state rather than mock affordance.

## Dependency Contract

### Backend dependencies

1. shared execution substrate from completed `XSL-014A`,
2. provider handoff from `XSL-018B`,
3. hosted/session-backed signer proof readiness from `XSL-014`.

### Do not own

1. backend Privy verification config,
2. raw access-token or identity-token collection,
3. venue-specific signature env handling.

## State-And-Truth Contract

1. event creation or review surfacing must produce or read persisted repo-owned state, not just local UI state.
2. `Execute all` must degrade honestly:
   - hidden or disabled if no execution plan exists,
   - staging-only if the backend handoff exists but signer proof is still blocked,
   - executable only when the backend says the plan is ready.
3. the right rail must show:
   - event or review summary,
   - confidence,
   - what changed,
   - portfolio implication,
   - route or readiness status,
   - action controls.

## Execution Plan

1. Audit the canonical workspace, detail, or activation surfaces and choose the exact host surface for the right-rail rebalance panel.
2. Add one event or review surface that records or reads:
   - event source,
   - summary,
   - confidence,
   - affected sleeves or symbols,
   - operator intent.
3. Add one backend API path only if the current surfaces cannot persist or read event-triggered rebalance state truthfully.
4. Add one top-level `Execute all` control that consumes truthful backend execution readiness.
5. Keep the control surface honest when execution is still blocked or review-only.

## Proof Artifacts

Required artifacts:
1. desktop and mobile browser screenshots of the right rail event or review flow,
2. one persisted event-intent or review-state artifact,
3. one UI-to-API proof showing the `Execute all` control maps to backend state,
4. one summary stating exactly what is still manual, blocked, or waiting on hosted/session-backed signer proof.

## Verification Contract

Minimum required verification:
1. `pnpm --filter @xstocks-strategy-lab/web build`
2. `pnpm --filter @xstocks-strategy-lab/web test`
3. browser verification on the canonical workspace or activation surface

## Exit Criteria

This lane is materially closed only when:
1. the right rail is a real event-triggered rebalance surface,
2. the event or review flow persists or reflects repo-owned state,
3. the top-level `Execute all` action reflects truthful backend readiness,
4. browser proof exists on the canonical app path.

## Rollback / Recovery

1. If the backend handoff lane is not ready, keep the right rail as review-only and do not expose a false execute-all path.
2. Remove event-stub UI if it cannot persist repo-owned state.

## Decision Log

- 2026-04-01: the right rail remains the canonical rebalance control surface because the frontend spec already reserved it for intelligence plus actions.
- 2026-04-01: `Execute all` must be driven by backend truth, not a mock affordance.
- 2026-04-01: this UI lane consumes signer-proof readiness but does not own backend Privy config or live session-token capture.

## Progress Log

- 2026-04-01: Reconciled `XSL-018A` after `XSL-014A` completion and moved it behind `XSL-018B` in the residual control-plane order.
