# xStocks Onchain Closure Proof Standard Upgrade

Date: 2026-04-03
Owner: Codex
Status: active
Canonical issue: `XSL-005D`

## Goal

Upgrade the repo’s execution-grade completion semantics so no execution lane can be called `done`, `implemented`, `works`, `live`, or `closed` until a real onchain transaction lands for that lane, and any frontend-facing execution lane also requires canonical frontend proof of that landed path.

## Non-goals

This standards lane does not:
1. claim any current execution lane is newly closed,
2. force non-executing research, review-only, or scheduler lanes to require onchain artifacts,
3. invent a new execution owner outside `XSL-005`,
4. blur LI.FI, Enso, hosted `1inch`, shared `1inch`, and CoW into one generic execution claim,
5. or replace exact blocker reporting with false closure language.

## User-Stated Desired Outcome

1. Something is only `done` when a transaction landed onchain.
2. If the lane is meant to be frontend-facing, the ideal proof bar is both:
   - through the API/backend path,
   - and through the frontend path that real users would use.
3. Partial states like `awaiting_signature`, approval payload capture, or bundle payload generation must not come back described like completed implementation.
4. The repo should stop reporting partial proof as if the product already works end to end.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why |
| --- | --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | canonical execution owner | update and keep canonical | this is the right home for the upgraded execution-completion bar |
| [2026-04-03-xstocks-final-closure-wave-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-final-closure-wave-control-plane.md) | current closeout control doc | update | it still discusses material completion for execution-adjacent lanes and must inherit the stricter bar |
| [2026-04-03-xstocks-remaining-live-proof-and-operator-access-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-remaining-live-proof-and-operator-access-closure.md) | current remaining-gap control doc | update | it still treats signature-fed submission as the old closure edge for execution lanes |
| [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md) | current repo truth index | update | current summaries and continuation notes must stop sounding like pre-onchain states are done |

Create new alongside:
1. this doc is justified because the user asked to upgrade the standards layer itself, not only one lane-specific closure note,
2. and the repo needs one explicit owner for the replacement semantics before updating individual lanes.

## Current Repo Truth Audit

1. The repo already distinguishes activation, quote, approval, submission, and receipt boundaries in multiple execution specs.
2. That distinction is not yet strict enough at the claim layer. Current language can still make these sound too close to completion:
   - hosted `1inch` reaching `awaiting_signature`,
   - Enso proving approval endpoint correctness or partial single-leg bundle quoteability,
   - route or frontend parity being discussed near execution closure.
3. The strongest current hosted `1inch` proof is still pre-onchain:
   - six live quotes,
   - signer packet and typed-data inputs,
   - blocker `missing_user_signature`,
   - no landed tx.
4. The strongest current Enso proof is still pre-onchain:
   - approval endpoint bug fixed,
   - some single-leg bundle generation works,
   - promoted basket still fails upstream,
   - no landed tx.
5. LI.FI remains spec-only for the promoted basket and has no landed-tx proof.

## Goal-Vs-Repo-Truth Diff

1. Desired end state:
   - execution lanes are only called done when onchain settlement truth exists,
   - frontend-facing execution lanes only close when the same landed path is proven through the canonical frontend,
   - partial proof is described precisely instead of optimistically.
2. Current repo truth:
   - the underlying proof taxonomy exists,
   - but the completion vocabulary still leaves room for overclaiming partial states.
3. Honestly complete for this standards lane means:
   - the canonical execution owner spec reserves completion language for landed onchain proof,
   - the closeout/control docs inherit that rule,
   - and the current lane summaries are reclassified under the stricter bar.

## Completion Semantics Contract

### Reserved closure language

For execution lanes, the following words are reserved for landed onchain proof:
1. `done`
2. `implemented`
3. `works`
4. `live`
5. `closed`
6. `public default works`

### Allowed pre-onchain labels

Use these instead when truth stops earlier:
1. `spec-only`
2. `repo-implemented only`
3. `local-only`
4. `activation-ready`
5. `quote-ready`
6. `approval-payload proven`
7. `awaiting user signature`
8. `bundle payload proven`
9. `venue-submission-ready`
10. `venue-submitted, not landed`
11. `exact blocker captured`

### Claim bar by lane type

| Lane type | Minimum bar for `done` / `implemented` / `works` / `live` |
| --- | --- |
| Backend/API execution lane | at least one real landed tx hash or equivalent onchain receipt tied to that lane |
| Frontend-facing execution lane | backend/API landed-tx proof plus canonical frontend/browser-actuated proof of that landed path |
| Public-default frontend execution lane | deployed canonical frontend proof, deployed backend proof, and a real landed tx through that user path |

### Disallowed shortcuts

These do not count as done execution by themselves:
1. activation save,
2. execution-request creation,
3. quote readiness,
4. approval transaction payload generation,
5. awaiting-signature state,
6. bundle transaction payload generation,
7. venue acceptance without landed chain proof,
8. frontend route parity without a landed execution path.

## Current Lane Reclassification Contract

1. Hosted `1inch`
   - truthful status: `quote-ready / awaiting user signature`
   - not truthful: `implemented`, `done`, `works`, or `live execution works`
   - closure still requires landed onchain proof.
2. Enso
   - truthful status: `partial implementation with exact upstream blocker`
   - not truthful: `implemented`, `done`, `works`, or `live`
   - closure still requires landed onchain proof on the promoted basket.
3. LI.FI
   - truthful status: `spec-only`
   - not truthful: any atomic-basket implementation claim.
4. Portfolio-buy frontend
   - truthful status: `route and copy truth can be closed separately`
   - not truthful: frontend execution complete unless the canonical frontend path reaches a landed tx.

## Files To Update

1. [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md)
2. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
3. [2026-04-03-xstocks-final-closure-wave-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-final-closure-wave-control-plane.md)
4. [2026-04-03-xstocks-remaining-live-proof-and-operator-access-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-remaining-live-proof-and-operator-access-closure.md)

## Verification Plan

1. Manually verify that the canonical execution owner spec now reserves completion language for landed onchain proof.
2. Manually verify that the closeout/control docs inherit the same rule.
3. Manually verify that hosted `1inch`, Enso, and LI.FI are reclassified under the stricter bar.
4. Run:
   - `git diff --check`

## Exit Criteria

1. The repo’s canonical execution owner spec says pre-onchain execution states are not done.
2. Frontend-facing execution closure explicitly requires canonical frontend/browser proof of a landed path.
3. Current owner docs and issue summaries no longer describe hosted `1inch`, Enso, or LI.FI as done before landed onchain proof.

## Progress Log

- 2026-04-03: Opened `XSL-005D` to tighten execution closure semantics around landed onchain proof and frontend-actuated proof for frontend-facing lanes.
