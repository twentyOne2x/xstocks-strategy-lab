# xStocks Event-Triggered Rebalance Control Surface Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Add the canonical frontend control surface for event-driven rebalance by:
1. turning the right-side panel into a real event/rebalance surface,
2. allowing the operator to stub or capture a news event now,
3. showing the resulting portfolio implication and execution readiness,
4. and exposing one top-level `Execute all` action that stages or triggers the truthful backend execution lane.

## Non-goals

This workstream does not:
1. invent a second hidden execution path,
2. claim automation before the backend execution lane is proven,
3. redesign the whole terminal,
4. collapse research explanation and rebalance control into one undifferentiated panel.

## User-Stated Desired Outcome

The user wants a news event stub in the right-side panel now and a top-level `Execute all` style button that can trigger rebalance on mainnet.

## Current Live Truth

1. The frontend spec already reserves the right rail for market intelligence, route state, wallet state, venue provenance, and action controls.
2. The canonical app does not yet implement a real event-triggered rebalance control surface in that right rail.
3. The backend can already persist activity, activation, and rebalance state, but not from a user-owned event-trigger surface in the canonical app.
4. The current provider-triggered path reaches `awaiting_operator`, but there is no top-level frontend control that can progress that state into execution.

## Current Local Implementation Audit

### Shipped

1. canonical routes for onboarding, workspace, detail, and activation,
2. manifest-driven explanation and route-state surfaces,
3. API-backed orchestration state including `awaiting_operator`.

### Partial

1. the right rail concept exists in spec and visual language, but not as a real rebalance control surface,
2. some mock data already mentions route truth, but not a real operator action path.

### Spec-only Or Unproven

1. one event stub composer,
2. one top-level `Execute all` action wired to real backend state,
3. one browser-proof pack for the event -> rebalance -> execution staging journey.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: extend.
   - Why: the right rail is already canonically owned there.
2. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
   - Current relevance: very high.
   - Decision: reuse as umbrella.
   - Why: this file owns the program-level sequencing and proof posture.

## Workstream Outcome Contract

When this lane is materially closed:
1. the operator can create a rebalance-driving event from the right rail,
2. the UI shows what changed and the portfolio implication,
3. the UI shows whether execution is ready, blocked, or still review-only,
4. the top-level `Execute all` action reflects real backend state rather than mock affordance.

## State-And-Truth Contract

1. event creation or stubbing must produce a persisted review intent, not just local UI state.
2. `Execute all` must degrade honestly:
   - hidden or disabled if no execution plan exists,
   - staging-only if the provider handoff or hosted/session-backed proof is partial,
   - executable only when the backend says the plan is ready.
3. the right rail must show:
   - event summary,
   - confidence,
   - what changed,
   - portfolio implication,
   - route/readiness status,
   - action controls.

## Execution Plan

1. Audit the canonical workspace/detail/activation surfaces and choose the exact host surface for the right-rail rebalance panel.
2. Add one event stub path that records:
   - event source,
   - summary,
   - confidence,
   - affected sleeves or symbols,
   - operator intent.
3. Add one backend API path if needed to persist event-triggered rebalance intents.
4. Add one top-level `Execute all` control that consumes truthful backend execution readiness.
5. Keep the control surface honest when execution is still blocked or review-only.

## Proof Artifacts

Required artifacts:
1. desktop and mobile browser screenshots of the right rail event flow,
2. one persisted event-intent artifact,
3. one UI-to-API proof showing the `Execute all` control maps to backend state,
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
3. the top-level `Execute all` action reflects truthful backend readiness,
4. browser proof exists on the canonical app path.

## Rollback / Recovery

1. If the backend execution lane is not ready, keep the right rail as review-only and do not expose a false execute-all path.
2. Remove event-stub UI if it cannot persist repo-owned state.

## Decision Log

- 2026-04-01: the right rail becomes the canonical rebalance control surface because the frontend spec already reserved it for intelligence plus actions.
- 2026-04-01: `Execute all` must be driven by backend truth, not a mock affordance.

## Progress Log

- 2026-04-01T23:10:00+02:00: Created `XSL-018A` as the owner spec for the right-rail event stub and top-level execute-all control surface.
