# xStocks Event-Triggered Rebalance Control Plane

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Turn the current review-only rebalance stack into a truthful operator-usable control plane by:
1. letting the operator create or stub a news or event-driven rebalance from the canonical frontend right rail,
2. reusing the completed `XSL-014A` venue-routed execution contract instead of inventing a second execution state machine,
3. sequencing the next backend and frontend caller lanes so they can hand off into that same contract,
4. and carrying the remaining hosted or session-backed signer proof to the furthest truthful boundary without overclaiming autonomous execution.

## Non-goals

This control plane does not:
1. reopen `XSL-014A` venue quoteability or adapter completion work,
2. treat testnet success as proof of mainnet execution,
3. authorize hidden custody or silent autonomous trading,
4. replace the existing `XSL-011B` signed review ingress,
5. claim full `CRE` end-to-end execution before provider staging can create execution requests and a real signer-backed submission proof exists.

## User-Stated Desired Outcome

The user wants:
1. a news event that can be stubbed from the right-side panel now,
2. a manual on-demand rebalance on mainnet,
3. a top-level `Execute all` style action,
4. and a later state where `CRE` can reuse the same execution path through `1inch + CoW`.

## Current Live Truth

1. `XSL-011B` is materially proven for signed provider review ingress and still stops at `awaiting_operator`.
2. `XSL-014A` is complete as a repo-owned venue-routed execution substrate up to the live session or signer boundary; the canonical closeout doc is [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md).
3. The remaining blocker is not `1inch` quoteability. The remaining blockers are the missing caller or handoff into the completed execution contract and the missing hosted or session-backed signer proof.
4. The canonical frontend spec still reserves the right rail for intelligence, route state, wallet state, venue provenance, and action controls, but the repo does not yet implement a real rebalance control surface there.
5. No provider-staging caller currently creates or advances an execution request into the completed `XSL-014A` contract.
6. Full `CRE` end-to-end execution remains unproven until provider staging can create execution requests and one real signer-backed submission proof exists.

## Current Local Implementation Audit

### Shipped

1. signed provider review ingress with durable receipts,
2. completed `XSL-014A` venue-routed execution contract and substrate,
3. canonical shared `ExecutionRequest` and `ExecutionRequestLeg` surfaces with explicit `runtimeOwner` and `triggerSource`,
4. planning surface for a right-rail intelligence and action panel.

### Partial

1. the control-plane nouns now exist, but there is still no caller above the completed execution substrate,
2. provider-triggered rebalance truth reaches `awaiting_operator`, but no repo-owned handoff into execution exists,
3. the canonical frontend can show route state, but not yet a real event-triggered rebalance control surface.

### Spec-only Or Unproven

1. one provider-staging caller that creates or advances execution requests,
2. one truthful top-level `Execute all` control from the canonical frontend,
3. one hosted or session-backed signer proof with a live user session and real submission artifact or exact blocker,
4. one full `CRE` end-to-end proof reusing the same path.

## Completion Reconciliation

1. completion relative to spec = partial; the control plane exists as an umbrella, but the next callers and live proof lane are still open.
2. completion relative to repeated thread asks = advanced materially because `XSL-014A` is now complete, but the user still cannot do `provider or event -> execute all -> signer-backed submission`.
3. completion relative to prior implementation claims = stale framing that said venue routing was still open is now false; venue substrate work is done and should stay frozen.
4. verified implementation and proof status = review ingress proven, `XSL-014A` substrate complete, no provider-staging caller yet, no right-rail control surface yet, no real signer-backed submission proof yet.
5. canonical frontend functioning status = no real control surface yet for event-triggered rebalance or top-level `Execute all`.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns signed provider review ingress and should not be rewritten.
2. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as frozen dependency.
   - Why: it is the completed canonical execution contract and should not be reopened.
3. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: update.
   - Why: the remaining proof blocker is now live session and signer input separation, not backend venue substrate work.
4. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: high.
   - Decision: reuse.
   - Why: the right rail remains canonical frontend ownership.
5. [2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md)
   - Current relevance: medium.
   - Decision: reuse in parallel only.
   - Why: it can support cheaper wiring proof, but it is not part of the ordered residual backlog for this control plane.

Create or update alongside:
1. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
2. [2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md)

## Thread-Recurrence Audit

Canonical repeated problems in the current thread:
1. `CoW` alone was assumed to be enough, then proven not enough for the promoted basket.
2. `1inch` was introduced, then `XSL-014A` closed the substrate up to the live session or signer boundary.
3. `CRE` ingress was proven review-only, and the user came back because review-only is not enough.
4. the user keeps asking for one real control surface and one real caller path rather than separate backend proof notes.

## Priority Matrix

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Provider-to-execution handoff | very high | very high | high | unstarted | `XSL-018B` | not yet claimed | review ingress proven; completed execution contract exists; no caller joins them yet | not applicable | create the provider-staging caller into the canonical request contract |
| 2 | Event-triggered rebalance control surface | high | very high | medium | unstarted | `XSL-018A` | not yet claimed | backend substrate exists, but no canonical right-rail caller exists | no | expose event stub plus `Execute all` on top of the same contract |
| 3 | Hosted or session-backed signer proof | high | very high | medium | partial | `XSL-014` | partially claimed elsewhere | backend Privy verification config is real; no real signer-backed submission proof yet | no | run one live proof with current session input and real signature or exact blocker |

## Product Outcome Contract

When this program is materially closed:
1. the operator can record a market or news event and see its portfolio implication in the right rail,
2. accepted provider review can create or advance the same execution request path,
3. the operator can explicitly start a rebalance from the canonical app,
4. the system can execute through truthful per-leg venue routing using the completed `XSL-014A` contract,
5. and later automation, if separately proven, reuses that same path instead of inventing a second one.

## User-Journey Contract

1. an event or provider review appears in the same control plane,
2. the operator reviews what changed and the resulting portfolio delta,
3. the system stages one canonical execution request,
4. the operator sees exact venue, quote, and readiness truth per leg,
5. the operator hits `Execute all`,
6. a live user session and signer carry the request to the furthest truthful submission boundary,
7. signatures, submissions, receipts, and failures persist visibly.

## State-And-Truth Contract

1. provider review ingress remains a separate intake boundary from execution.
2. every caller above the execution substrate must reuse the same `ExecutionRequest` and `ExecutionRequestLeg` contract frozen by `XSL-014A`.
3. `Execute all` is an explicit operator action until later automation is separately proven.
4. every execution leg must persist:
   - selected venue,
   - quote artifact,
   - approval or signature artifact,
   - submission artifact,
   - receipt or exact blocker.
5. no automation claim may outrun the explicit proof level of the underlying caller and signer lane.

## Workstream Map And Sequencing

### Frozen dependency

1. `XSL-014A` completed venue-routed execution substrate

### Active lanes

1. `XSL-018B` Provider-To-Execution Handoff
2. `XSL-018A` Event-Triggered Rebalance Control Surface
3. `XSL-014` Hosted Or Session-Backed Signer Proof

### Priority order

1. land `XSL-018B` first because the immediate missing backend lane is the provider-staging caller into the completed execution contract,
2. land `XSL-018A` second so the canonical frontend can drive that same contract without overclaiming automation,
3. land the remaining hosted or session-backed signer proof third, because full end-to-end closure still requires a real user session and real signer-backed submission artifact or exact blocker.

Supporting parallel lane:
1. `XSL-017` may continue as a cheaper proof-support surface, but it is not part of the ordered residual backlog for this control plane.

## Proof Artifacts

Required program-level artifacts:
1. one provider-review-to-execution request artifact using the canonical `XSL-014A` contract,
2. one browser proof pack for the right-rail event flow and top-level `Execute all` control,
3. one live session-backed signer proof bundle or exact blocker,
4. one summary that states manual proof level separately from later automation proof level.

## Exit Criteria

This control plane is materially closed only when:
1. accepted provider review can create or advance the canonical execution request path,
2. the canonical frontend exposes a real event-triggered rebalance control surface on top of that same path,
3. one truthful hosted or session-backed signer proof exists or the exact remaining blocker is captured,
4. full `CRE` end-to-end execution remains explicitly unproven until both the handoff and signer-proof conditions are satisfied.

## Rollback / Recovery

1. keep `XSL-011B` review ingress intact even if the execution handoff fails,
2. allow the frontend control surface to degrade to review-only or staging-only if the backend caller is not ready,
3. remove any caller logic that hides exact blockers or introduces a second execution state machine.

## Decision Log

- 2026-04-01: `XSL-014A` is now frozen as completed dependency truth rather than the next open blocker.
- 2026-04-01: `XSL-018B` becomes the immediate next backend lane.
- 2026-04-01: `XSL-018A` depends on the completed execution contract and must not overclaim automation.
- 2026-04-01: full `CRE` end-to-end execution remains unproven until provider staging can create execution requests and one real signer-backed submission proof exists.
