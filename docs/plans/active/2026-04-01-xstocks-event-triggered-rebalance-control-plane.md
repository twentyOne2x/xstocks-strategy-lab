# xStocks Event-Triggered Rebalance Control Plane

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Turn the current review-only rebalance stack into a truthful operator-usable control plane by:
1. letting the operator create or stub a news/event-driven rebalance from the canonical frontend right-side panel,
2. surfacing one explicit top-level `Execute all` control for on-demand mainnet execution,
3. routing each executable leg through the truthful venue path (`1inch` primary where proven, `CoW` where still directly executable),
4. and sequencing the later CRE/provider path so it can hand off into the same execution control plane instead of stopping forever at `awaiting_operator`.

## Non-goals

This control plane does not:
1. treat testnet success as proof of mainnet execution,
2. authorize hidden custody or silent autonomous trading,
3. pretend `CoW` alone closes the current promoted basket,
4. replace the existing `XSL-011B` signed review ingress,
5. collapse pricing truth, venue-liquidity truth, and execution-proof truth into one claim.

## User-Stated Desired Outcome

The user wants:
1. a news event that can be stubbed from the right-side panel now,
2. a manual on-demand rebalance on mainnet,
3. a top-level `Execute all` style action,
4. and a later state where CRE can handle the rest through `1inch + Cow Swap`.

## Current Live Truth

1. `XSL-011B` is materially proven for review ingress: production accepts a signed provider event and opens `awaiting_operator` only.
2. `XSL-014A` is completed and frozen: the manual execution lane is venue-routed and no longer CoW-only.
3. `packages/xstocks/src/adapters/oneinch.ts` and `apps/api/scripts/oneinch-fusion-proof.js` now prove 1inch Fusion quoteability for most core xStocks names on Ethereum, but only at the quote layer.
4. `CoW` still quotes only a narrow direct xStocks subset on Ethereum, so the current promoted basket is not fully executable through the existing `CoW` lane.
5. The canonical frontend spec already reserves the right rail for market intelligence, route state, wallet state, venue provenance, and action controls, but the repo does not yet implement a real rebalance control surface there.
6. The repo has a completed venue-routed execution contract; the remaining gap is moving provider review from `awaiting_operator` into that substrate and proving the hosted/session-backed signer flow above it.

## Current Local Implementation Audit

### Shipped

1. signed provider review ingress with durable receipts,
2. manual `CoW` execution request staging and settlement tracking,
3. 1inch Fusion quote adapter plus live quote proof,
4. frontend planning surface for a right-side intelligence and action rail.

### Partial

1. route truth now names both `CoW` and `1inch`, but the remaining open work is the provider handoff and hosted/session-backed proof above the completed substrate,
2. the canonical frontend can show route state, but not yet a real event-triggered rebalance control panel,
3. provider-triggered rebalance truth reaches `awaiting_operator`, but no repo-owned handoff into the completed execution substrate exists.

### Spec-only Or Unproven

1. one truthful `Execute all` control from the canonical frontend,
2. one truthful provider-review-to-execution handoff,
3. one hosted/session-backed signer proof bundle,
4. one reusable automation posture that can later execute without reintroducing hidden autonomy.

## Completion Reconciliation

1. completion relative to spec = not started as a unified program; the required lanes exist only as fragments.
2. completion relative to repeated thread asks = partial and over-fragmented; review ingress, venue proof, and frontend action intent have all moved separately, but the user still cannot do `news event -> execute all -> mainnet rebalance`.
3. completion relative to prior implementation claims = `CRE` review ingress is real, but any interpretation that it already closes execution is false.
4. verified implementation and proof status = review ingress proven, `XSL-014A` completed, `1inch` quoteability proven, and no hosted/session-backed signer proof yet.
5. canonical frontend functioning status = no real control surface yet for event-triggered rebalance or top-level execute-all action.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns signed provider review ingress and should not be rewritten.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: extend with the hosted/session-backed signer proof sub-lane.
   - Why: execution proof remains the core lane, but the venue substrate is already frozen and the residual proof now sits above it.
3. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: high.
   - Decision: reuse.
   - Why: the right-side panel and top controls remain canonical frontend responsibilities.
4. [2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md)
   - Current relevance: medium.
   - Decision: reuse in parallel.
   - Why: cheaper proof iterations matter, but testnet must stay separate from mainnet closure.

Create new alongside:
1. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
2. [2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md)
3. hosted/session-backed signer proof

## Thread-Recurrence Audit

Canonical repeated problems in the current thread:
1. `CoW` was assumed to be enough, then proven not enough for the promoted basket.
2. `1inch` was introduced and now materially changes venue truth.
3. `CRE` was initially blocked on ingress, then proven review-only, and the user came back because review-only is not enough.
4. The user keeps asking for a real operator control surface rather than a docs-only or API-only proof.

## Priority Matrix

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Provider-to-execution handoff | high | high | medium | unstarted | `XSL-018B` | over-assumed by user intent, not by repo truth | review ingress proven only | no | reuse `awaiting_operator`, then hand off into the completed execution substrate |
| 2 | Event-triggered rebalance control surface | high | very high | medium | unstarted | `XSL-018A` | not yet claimed | no repo-owned UI control surface yet | no | add right-rail event stub + `Execute all` shell |
| 3 | Hosted/session-backed signer proof | high | very high | medium | partial | `XSL-014` | not yet claimed | backend venue-routed substrate completed; fresh live session proof still missing | not applicable | collect a real authenticated user session and finish the hosted proof bundle |

## Product Outcome Contract

When this program is materially closed:
1. the operator can record a market/news event and see its portfolio implication in the right rail,
2. the operator can explicitly start a mainnet rebalance from the canonical app,
3. the system can execute the rebalance through truthful per-leg venue routing,
4. provider-triggered reviews can enter the same control plane rather than dying at `awaiting_operator`,
5. and later automation can reuse the same execution path instead of inventing a second hidden one.

## User-Journey Contract

1. an event or operator thesis appears in the right-side panel,
2. the operator reviews what changed and the resulting portfolio delta,
3. the operator triggers rebalance review,
4. the operator sees a staged venue-routed execution plan,
5. the operator hits `Execute all`,
6. each leg routes through its truthful venue path,
7. signatures, submissions, receipts, and failures persist visibly,
8. and a later provider-triggered event can reuse the same path with the same exact controls.

## State-And-Truth Contract

1. `provider-triggered` review ingress remains real and separate from execution.
2. `Execute all` is an explicit operator action until automation is separately proven.
3. every execution leg must persist:
   - target asset,
   - target notional,
   - selected venue,
   - quote artifact,
   - approval/signature artifact,
   - submission artifact,
   - receipt or exact blocker.
4. `1inch` and `CoW` must be recorded as exact route truth, not as interchangeable marketing text.
5. no automation claim may outrun the explicit proof level of the underlying venue-routed execution lane.

## Workstream Map And Sequencing

### Sub-specs

1. `XSL-018B` Provider-To-Execution Handoff
2. `XSL-018A` Event-Triggered Rebalance Control Surface
3. `XSL-014` Hosted/Session-Backed Signer Proof

### Ordered sequence

1. land `XSL-018B` first because the provider review dead-end is still open,
2. land `XSL-018A` second because the control surface can only light up above the completed execution substrate,
3. land the hosted/session-backed signer proof third so the completed substrate has a fresh live session proof bundle,
4. do not reopen `XSL-014A`; the venue layer is frozen.

## Proof Artifacts

Required program-level artifacts:
1. one browser proof pack for the right rail event flow and top-level `Execute all` control,
2. one provider-review-to-execution handoff artifact or exact blocker,
3. one hosted/session-backed signer proof bundle or exact blocker,
4. one summary that states manual proof level separately from later automation proof level.

## Exit Criteria

This control plane is materially closed only when:
1. the canonical frontend exposes a real event-triggered rebalance control surface,
2. provider review can hand off into the same execution control plane,
3. one truthful hosted/session-backed signer proof exists,
4. any later automation claim remains bounded to the same proven route and signer truth.

## Rollback / Recovery

1. Keep `XSL-011B` review ingress intact even if the execution handoff fails.
2. Allow the frontend control surface to degrade to review-only if the hosted/session-backed proof is not yet ready.
3. Do not reopen `XSL-014A`; the venue-routing logic is frozen.

## Decision Log

- 2026-04-01: `CRE` review ingress is no longer the main blocker; provider handoff and hosted proof are.
- 2026-04-01: `XSL-014A` is frozen as completed, so no venue-design work should re-open here.
- 2026-04-01: `Execute all` must mean explicit operator execution first, then optional automation later.

## Progress Log

- 2026-04-01T22:55:00+02:00: Created the control-plane umbrella after the user explicitly asked for right-side event stubbing, top-level execute-all, and later CRE reuse through the completed execution substrate.
