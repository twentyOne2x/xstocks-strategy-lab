# xStocks Event-Triggered Rebalance Control Plane

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Turn the current fragmented review and execution stack into one truthful operator-usable control plane by:
1. reusing the completed `XSL-014A` venue-routed manual execution substrate,
2. handing accepted provider review into that substrate,
3. exposing a canonical right-rail event and rebalance surface plus one top-level `Execute all` control,
4. and carrying hosted/session-backed signer proof only after those joins exist.

## Non-goals

This control plane does not:
1. reopen `XSL-014A` venue design or relitigate `1inch` versus `CoW` routing,
2. authorize hidden custody or silent autonomous trading,
3. pretend `CoW`-only basket proof closes the current product ask,
4. treat testnet or quote-only proof as mainnet control-plane closure,
5. blur provider intake, execution staging, and hosted signer proof into one claim.

## Current Live Truth

1. `XSL-011B` is materially proven for signed provider review ingress and opens `awaiting_operator` only.
2. `XSL-014A` is completed: the shared execution request contract and `apps/api` now carry `cow_swap` and `oneinch_fusion` through the same signer-owned manual execution substrate.
3. The exact remaining `XSL-014` blocker is not venue routing. It is hosted/session-backed signer proof input: backend Privy verification can be configured, but a fresh verified user session is still required before live signer-backed submission proof can continue.
4. The canonical frontend still has no real right-rail event-triggered rebalance surface or truthful top-level `Execute all` control.
5. Accepted provider review still dead-ends at `awaiting_operator`; no repo-owned handoff into execution staging exists yet.

## Completed Dependency Freeze

1. Treat `XSL-014A` as frozen completed work. The canonical resolution doc is [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md).
2. Do not reopen venue-routing design work from this umbrella lane.
3. Any remaining `XSL-014` residual is hosted/session-backed signer proof against the completed substrate, not a new routing program.

## Current Local Implementation Audit

### Shipped

1. signed provider review ingress with durable receipts,
2. venue-routed manual execution substrate across `cow_swap` and `oneinch_fusion`,
3. shared execution request and leg contracts that preserve route truth, approval payloads, submissions, venue status, and receipts,
4. frontend planning surfaces that already reserve the right rail for intelligence plus action state.

### Partial

1. provider review can reach `awaiting_operator`, but not the canonical execution path,
2. the canonical frontend can explain route and readiness state, but cannot yet persist a real rebalance control surface,
3. hosted/session-backed signer proof remains open even though backend auth verification and venue routing are already real.

## Residual Closure Order

1. `XSL-018B`: hand accepted provider review into the completed `XSL-014A` execution path.
2. `XSL-018A`: expose the canonical right-rail event-triggered rebalance surface plus one truthful top-level `Execute all` control on top of that path.
3. hosted/session-backed signer proof: capture one fresh verified user session input and stop at the furthest truthful hosted signer boundary on the completed substrate.

This is the only residual closure order for the post-`XSL-014A` control-plane lane.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse as the intake proof owner.
2. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
   - Current relevance: very high.
   - Decision: resume first.
3. [2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md)
   - Current relevance: very high.
   - Decision: resume second.
4. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: high.
   - Decision: narrow to hosted/session-backed signer proof on the completed substrate.
5. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: mandatory completed dependency.
   - Decision: freeze; do not reopen.

## Product Outcome Contract

When this program is materially closed:
1. accepted provider review or operator-created event state can stage the same execution path,
2. the operator can explicitly trigger `Execute all` from the canonical app,
3. the completed venue-routed substrate can carry one hosted/session-backed signer proof to the furthest truthful boundary,
4. any later automation claim reuses the same exact path instead of inventing a second executor.

## State-And-Truth Contract

1. provider ingress remains separate from execution until the handoff contract exists,
2. `Execute all` remains an explicit operator action until separate automation proof exists,
3. every execution leg must persist target asset, target notional, selected venue, quote artifact, approval or signature artifact, submission artifact, and receipt or exact blocker,
4. `1inch` and `CoW` remain exact route truth, not interchangeable labels,
5. hosted/session-backed signer proof must state backend verification config and live user-session input separately.

## Proof Artifacts

Required program-level artifacts:
1. one provider-review-to-execution handoff artifact,
2. one browser proof pack for the right-rail event flow plus top-level `Execute all` control,
3. one hosted/session-backed signer proof bundle or exact blocker,
4. one summary that separates completed substrate truth from the remaining live-proof input.

## Exit Criteria

This control plane is materially closed only when:
1. `XSL-018B` can move accepted provider review into the canonical execution path,
2. `XSL-018A` exposes a truthful right-rail event and `Execute all` surface,
3. one hosted/session-backed signer proof exists on the completed substrate or the last remaining blocker is exact and external,
4. no reopened venue-design work appears under `XSL-014A`.

## Rollback / Recovery

1. Keep `XSL-011B` review ingress intact if the handoff layer is not ready.
2. Keep the frontend review-only if execution staging or hosted signer proof is not ready.
3. Revert any change that hides exact route or signer blockers behind generic status copy.

## Decision Log

- 2026-04-01: `XSL-014A` completed the venue-routed manual execution substrate and should not remain a residual design item.
- 2026-04-02: the only residual control-plane order is `XSL-018B`, `XSL-018A`, then hosted/session-backed signer proof.
- 2026-04-02: hosted signer proof must explicitly separate backend verification config from live user-session input.

## Progress Log

- 2026-04-01T22:55:00+02:00: Created the umbrella lane after the user asked for right-side event stubbing, top-level execute-all, and later CRE reuse.
- 2026-04-02T11:00:00+02:00: Reconciled the umbrella to post-`XSL-014A` truth, froze venue routing as completed, and reduced the residual order to one exact sequence.
