# xStocks Policy-Bounded Automatic Execution Gate

Date: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-018C` under `XSL-018`

## Goal

Freeze the narrow post-`XSL-018B` automation owner so the repo can say exactly what
"as much automation as possible" means without claiming live autonomy before the
runtime proves it.

This slice exists to define:
1. which rebalance and execution trigger classes stay review-only,
2. which class may ever become auto-executable,
3. the exact policy gate between a staged execution request and an automatic one,
4. the signer model required for any automatic path,
5. the first-phase size, asset, venue, and risk caps,
6. and the hard-stop plus rollback boundaries.

## Non-goals

This workstream does not:
1. implement autonomous execution in `apps/api`, `apps/worker`, or `packages/policy`,
2. widen provider-triggered review into provider-triggered autonomous trading,
3. authorize hidden custody, browser-session signing, or silent background submission,
4. reopen the broad scheduler-orchestration ownership already frozen under `XSL-011`,
5. imply that current quote proof is the same as confirmed automatic execution proof.

## User-Stated Desired Outcome

The user wants the repo to freeze the next narrow automation slice after `XSL-018B`
so the control plane can later automate only what is truly policy-bounded, while
keeping current runtime truth explicitly manual-first.

## Current Live Truth

1. `packages/shared/src/rebalance.js` and `packages/policy/src/rebalance-orchestration.js`
   still publish `operatorManualRequired=true` and
   `autonomousExecutionProven=false`.
2. Current rebalance trigger classes are `operator_manual`, `scheduled_cron`,
   `policy_event`, and `provider_triggered`.
3. Current execution request contracts already reserve the future
   `runtimeOwner="policy_bounded_automation"` and
   `triggerSource="policy_bounded_automation"`, while also reserving
   `triggerSource="execute_all"` and `triggerSource="provider_staging"`.
4. Current provider truth stops at review ingress and `awaiting_operator`; the repo
   does not yet own a live autonomous provider-execution path.
5. Current manual execution truth is venue-routed but signer-owned. It does not
   prove background signing or background submission.
6. Current venue proof is asymmetric:
   - `cow_swap.ethereum` directly quotes only `NVDAx`, `TSLAx`, and `SPYx` in the
     proven direct ladder.
   - `oneinch.ethereum` has broader quote proof, but quote proof alone is not enough
     to make a leg auto-executable.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md)
   - Current relevance: very high.
   - Decision: inherit without reopening.
   - Why: `XSL-011` remains the broad automation umbrella; this new slice only freezes
     the narrow post-`XSL-018B` execution gate.
2. [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: automatic execution may never bypass the same venue-routed execution
     substrate.
3. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
   - Current relevance: very high.
   - Decision: extend after closure, not during it.
   - Why: `XSL-018B` owns provider handoff into staging; this slice decides what
     still remains manual after that handoff.
4. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as the contract floor.
   - Why: it already froze the exact execution contract names this lane must use.

## Workstream Outcome Contract

When this slice is materially closed:
1. the repo can say exactly which triggers stay review-only,
2. the repo can say exactly which trigger may ever auto-submit,
3. the staged-to-auto transition is defined with exact contract names,
4. the signer requirements and policy caps are explicit,
5. and any future autonomous claim is bounded to one narrow phase-1 path rather than
   a vague "CRE does the rest" story.

## Trigger Classification

### Rebalance trigger classes

| Rebalance trigger class | Posture | Future automatic submission allowed? | Rule |
| --- | --- | --- | --- |
| `operator_manual` | manual-only | no | Human-originated review and execution stay manual by definition. |
| `scheduled_cron` | repo-owned staging now | yes | This is the only rebalance trigger class that may cross into `policy_bounded_automation`, and only after every gate below passes. |
| `policy_event` | review-only | no | Policy drift and research output may recommend or pre-stage, but they may not auto-submit trades. |
| `provider_triggered` | review-only | no | Signed provider events may open review and later `provider_staging`, but they stay manual in this slice. |

### Execution request trigger sources

| Execution request trigger source | Posture | Rule |
| --- | --- | --- |
| `operator_manual` | manual-only | Existing signer-owned request path. |
| `execute_all` | manual-only | Explicit human top-level action only. |
| `provider_staging` | review-only | Reserved for `XSL-018B` staging from accepted provider review; it does not authorize auto-submit. |
| `policy_bounded_automation` | reserved future auto path | Only valid after the exact policy gate below passes. |

## Exact Policy Gate Between Staged And Automatic Execution

The staged-to-auto boundary is the exact moment the system would set:
1. `executionRequest.runtimeOwner = "policy_bounded_automation"`, and
2. `executionRequest.triggerSource = "policy_bounded_automation"`.

That transition is permitted only when all of the following are true:
1. the originating rebalance trigger class is `scheduled_cron`,
2. the current rebalance record is still `state = "scheduled"`,
3. `operatorPaused !== true`, and there is no outstanding manual `execute_all`
   action already in progress for the same slot,
4. `executionEligibility = "executable"` and `surfaceTruth = "live"`,
5. every required asset check and route truth label is `live` / public verified;
   no `preview`, `mentor_confirmed`, `unverified`, or `blocked` leg is present,
6. the live baseline and target manifest share the same slot, same asset universe,
   and same required route set; any asset add, asset removal, or route change keeps
   the request review-only,
7. `driftBps >= thresholdBps` and `driftBps <= thresholdBps * 2`,
8. `signalFresh = true`, `confidencePassed = true`, and
   `turnoverWithinBudget = true`,
9. no funding step, wallet connect step, bridge step, or smart-account creation step
   is still required,
10. a valid automation signer grant exists for the exact owner address,
    settlement address, chain, venue, and notional limits,
11. the request stays within every size, venue, asset, and risk cap in the next
    section,
12. every quote is still live at submission time and within the allowed quote-age
    and price-impact ceilings.

If any condition fails, the request must remain staged or review-only and must not
flip into `policy_bounded_automation`.

## Signer Model Requirements

Any future automatic execution path must satisfy all of these signer requirements:
1. no browser session token, ephemeral Privy access token, or ad hoc operator login
   may count as automatic signing authority,
2. the signer authority must be a dedicated automation grant or policy signer that is
   explicitly scoped to:
   - one verified `ownerAddress`,
   - one `settlementAddress`,
   - one chain,
   - one venue allowlist,
   - one asset allowlist,
   - exact request and per-leg notional caps,
   - an expiry timestamp,
   - and a revocation path,
3. the repo must never hold an unrestricted user private key,
4. provider receipts, cron ticks, or policy events alone may not mint new signing
   authority,
5. every automated submission must persist the grant id or equivalent signer-policy
   reference alongside the execution request, leg, venue status, and receipt,
6. if a venue requires per-order signing, that signing must still come from the
   bounded automation signer or bounded smart-account policy, not from a hidden
   backend custody path.

## Size, Asset, Venue, And Risk Limits

Phase-1 autonomous execution is intentionally narrower than manual execution.

### Chain and strategy mode

1. `chain = ethereum` only.
2. `mode = "basket"` only.
3. No directional, borrow/lend, bridge, or AUSD yield-buffer rebalance leg may be
   auto-submitted in phase 1.

### Venue limits

1. Phase-1 autonomous execution is single-venue per request.
2. Mixed `1inch + CoW` requests remain staged/manual.
3. Current phase-1 venue allowlist:
   - `cow_swap.ethereum`: allowed.
   - `oneinch.ethereum`: review-only until the repo captures confirmed symbol-level
     sign/submit/receipt proof on the exact venue and explicitly widens this spec.

### Asset limits

1. Asset universe must match the latest live baseline exactly.
2. Current phase-1 effective autonomous allowlist under `cow_swap.ethereum` is:
   - `NVDAx`
   - `TSLAx`
   - `SPYx`
3. `AUSD` is excluded from phase-1 autonomous execution.
4. Any new symbol or new venue-symbol pair requires an explicit allowlist update in
   docs plus a repo-owned proof artifact before it can cross into
   `policy_bounded_automation`.

### Size and risk caps

1. `requestedNotionalUsd <= min(500, latestActivation.requestedNotionalUsd * 0.05)`.
2. `targetNotionalUsd` per leg `<= min(250, latestActivation.requestedNotionalUsd * 0.025)`.
3. At most one autonomous execution request may be submitted per slot in a rolling
   24-hour window.
4. Any single-leg absolute weight change above `300` bps stays review-only.
5. Any manifest-family change, asset-add/remove change, or venue-map change stays
   review-only even if the size caps would pass.
6. Quote age at submission must be `<= 60` seconds.
7. Reported price impact must be `<= 1.0%` for every submitted leg.

## Hard Stops

Automatic execution must fail closed and stop immediately when any of these happens:
1. the source is not `scheduled_cron`,
2. the rebalance is no longer in `scheduled`,
3. the operator pauses the slot,
4. `executionEligibility` stops being `executable` or `surfaceTruth` stops being
   `live`,
5. any route or asset falls out of the allowlist,
6. any funding, wallet, or smart-account prerequisite becomes non-ready,
7. the automation signer grant is missing, expired, revoked, or bound to different
   owner or settlement addresses,
8. any request or leg exceeds the policy caps,
9. any quote expires, exceeds the price-impact ceiling, or no longer matches the
   persisted route selection,
10. a newer promoted manifest or provider event changes the target while the request
    is still staged,
11. any submitted leg returns `failed`, `manual_followup_required`, partial fill, or
    venue invalidation.

## Rollback Boundaries

1. Before the first venue submission, the system may cancel the staged request and
   return the slot to review without market side effects.
2. After the first venue submission, the system must stop all remaining autonomous
   actions and hand control back to manual follow-up.
3. No automatic unwind, hedge, retry, route switch, or manifest recompute is allowed
   after any leg has been submitted.
4. Any post-submission retry requires explicit operator action through the same
   manual `execute_all` path.
5. Provider-triggered review may still inform the next manual decision, but it may
   not act as an automatic rollback authority.

## Proof Artifacts

Before any future "automatic execution" claim is truthful, the repo must produce:
1. one runtime artifact showing a scheduled review crossing into
   `runtimeOwner="policy_bounded_automation"` only after every gate passes,
2. one signer-grant artifact showing the bounded authorization fields,
3. one confirmed small mainnet autonomous execution inside the phase-1 caps,
4. one hard-stop artifact proving that a cap breach or pause blocks submission,
5. one manual-follow-up artifact proving that post-submission rollback stays manual.

## Exit Criteria

This lane is materially closed only when:
1. the trigger-class split is implemented exactly as frozen here,
2. current runtime truth still states autonomous execution is unproven until the new
   proof artifacts exist,
3. the repo can show one bounded automatic path and one explicit manual fallback,
4. provider and policy events still remain review-only in phase 1.

## Decision Log

- 2026-04-02: Keep `scheduled_cron` as the only future auto-submit candidate because
  it is repo-owned, deterministic, and auditable.
- 2026-04-02: Keep `provider_triggered` and `policy_event` review-only in this slice
  even after staging exists.
- 2026-04-02: Start the future autonomous path with one single-venue, same-universe,
  maintenance-rebalance posture rather than mixed-venue or thesis-shift execution.
- 2026-04-02: Treat quote-only proof as insufficient for autonomous execution.

## Progress Log

- 2026-04-02T00:32:39+02:00: Created the narrow post-`XSL-018B` automation owner
  slice to freeze the trigger matrix, signer requirements, phase-1 caps, hard stops,
  and rollback boundary without implementing autonomous execution in runtime.
