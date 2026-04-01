# xStocks Venue-Routed Mainnet Execution Spec

Date: 2026-04-01
Owner: Codex
Status: completed

Canonical issue: `XSL-014A` under `XSL-014`
Canonical resolution: [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)

## Completion Freeze

`XSL-014A` is completed and frozen. This file remains only as the owner-spec pointer that active control-plane docs still reference.

Do not reopen venue design work from this file.

## Outcome

1. the shared execution request and leg contract now carry `cow_swap` and `oneinch_fusion` through the same signer-owned manual execution path,
2. `apps/api` stages exact per-leg route truth, quote artifacts, approval payloads, signed submission attempts, venue status, and receipt or blocker persistence,
3. the strongest truthful proof boundary is documented in the completed substrate closeout and stops at the exact authenticated-session blocker captured there,
4. the remaining `XSL-014` work is hosted/session-backed signer proof input against the completed substrate, not new route design.

## Exact Remaining Boundary

1. backend venue routing is complete,
2. backend Privy verification config is a separate prerequisite from live user-session proof input,
3. live hosted signer proof still requires a fresh verified user session token,
4. later control-plane joins belong to `XSL-018B` and `XSL-018A`.

## Follow-On Owners

1. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md) owns the hosted/session-backed signer-proof residual.
2. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md) owns provider handoff into the completed substrate.
3. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md) owns the remaining control-plane order.

## Do Not Reopen

1. `1inch` versus `CoW` route design,
2. shared execution-contract design,
3. claims that the manual execution path is still CoW-only,
4. frontend scope,
5. provider automation design.

## Decision Log

- 2026-04-01: 1inch quoteability changed the execution strategy enough to justify this owner spec.
- 2026-04-01: the lane kept explicit signer approval and did not authorize autonomous execution.
- 2026-04-02: froze the owner spec as completed after the substrate closeout landed and moved all residual work to hosted signer proof plus `XSL-018` follow-ons.

## Progress Log

- 2026-04-01T23:05:00+02:00: Created `XSL-014A` as the dedicated owner spec for venue-routed mainnet execution after 1inch quoteability proof made the earlier CoW-only assumption stale.
- 2026-04-02T11:10:00+02:00: Marked `XSL-014A` as completed reference in the active docs and removed it from the residual control-plane sequence.
