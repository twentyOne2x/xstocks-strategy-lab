# xStocks Venue-Routed Mainnet Execution Spec

Date: 2026-04-01
Owner: Codex
Status: completed

## Outcome

This draft lane is now closed by completed `XSL-014A`. The canonical venue-routed backend truth lives in [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md).

## Post-XSL-014A Reconciliation

1. The repo now owns a shared venue-routed execution substrate; backend route-contract invention is no longer a residual backlog item.
2. The exact reusable contract remains `executionRequest` plus `executionRequestLeg`, with per-leg venue routing, quote storage, approval payloads, venue-status truth, and receipt slots.
3. `XSL-018B` should reuse that substrate for provider-review handoff.
4. `XSL-018A` should bind the canonical UI to that substrate's readiness and artifact truth.
5. The remaining live-proof gap is hosted/session-backed signer proof under `XSL-014`, not backend venue-routing.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: canonical.
   - Decision: supersede this draft.
   - Why: it contains the completed substrate closeout and exact proof blocker.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: update.
   - Why: it now owns the hosted/session-backed signer proof gap that remained after substrate completion.
3. [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
   - Current relevance: very high.
   - Decision: update.
   - Why: control-plane sequencing must stop treating venue routing as the next residual lane.

## Residual Ownership Contract

1. do not reopen this lane as active backlog unless fresh proof falsifies the completed closeout,
2. treat provider handoff as `XSL-018B`,
3. treat control surface closure as `XSL-018A`,
4. treat hosted/session-backed signer proof as `XSL-014`.

## Decision Log

- 2026-04-01: Reconciled this active-path draft after `XSL-014A` completion and converted it from residual backlog to completed dependency.
