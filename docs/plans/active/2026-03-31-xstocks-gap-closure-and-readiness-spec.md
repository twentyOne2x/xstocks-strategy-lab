# xStocks Gap Closure And Readiness Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Close the remaining gaps between the now-verified non-frontend stack and one truthful, demo-ready xStocks product surface by:
1. finishing the canonical `apps/web` rewrite against the xStocks design and onboarding briefs,
2. proving the browser-clickable journey against API-backed data rather than mock-only comfort,
3. keeping directional explicitly preview-only and fail-closed,
4. turning the repo from "many green package tests on dirty main" into one reconciled closeout program with clear next moves,
5. and defining the exact ordered steps required before the whole app can be used coherently end to end.

## Non-goals

This closeout spec does not:
1. replace the product control plane or the workstream specs as the source of product intent,
2. authorize public-production claims,
3. claim live xStocks-on-Euler execution,
4. reopen already-green non-frontend workstreams without new proof of breakage,
5. invent a standalone market-intelligence backend if the product can close the demo gap first without it.

## Current Live Truth

As of 2026-03-31, local repo truth is:
1. `packages/shared`, `packages/xstocks`, `packages/euler`, `packages/research`, `packages/policy`, `apps/api`, and `apps/worker` all pass `npm run check`.
2. Root `npm run prisma:generate` passes.
3. Root `npm run prisma:validate` fails only when `DATABASE_URL` is absent and passes when a Postgres URL is supplied.
4. Research, worker, policy, and API all keep directional fail-closed and preview-only.
5. `apps/web` exists and is being rewritten in a clean Claude lane, but canonical browser proof does not yet exist.
6. Market-intelligence language and payload fields exist in shared contracts and frontend adapters, but no separately verified signal-engine producer exists in non-frontend repo truth.
7. Portfolio recommendation, promoted-manifest, and rebalance semantics exist in research, shared contracts, policy, and API, but the canonical frontend still has not proven those surfaces end to end.
8. The canonical landing, onboarding, and preview surfaces still risk reading as a black box because the explanation boundary from promoted research output to user-facing interpretation is not yet closed.
9. The repo is still a large dirty worktree on `main`, so release hygiene is not yet acceptable.

## Current Local Implementation Audit

### Shipped

1. Shared contracts and normalization helpers under `packages/shared`.
2. xStocks live-state and execution-boundary adapters under `packages/xstocks`.
3. Morpho and Euler directional-preview helpers under `packages/euler`.
4. Research bundle, promoted manifests, slot registry, results ledger, and evaluator coverage under `packages/research`.
5. Manifest-driven recommendation and execution-boundary logic under `packages/policy`.
6. Manifest-driven read/write endpoints under `apps/api`.
7. Worker-level promoted-boundary verification under `apps/worker`.

### Partial

1. `apps/web` contains a substantial product shell, but the canonical xStocks-native pass is still in flight and not yet browser-proven.
2. Market-intelligence payload semantics exist, but the lane is still mostly represented through manifests, contracts, and frontend mock/adaptation logic rather than a separately verified producer.
3. Portfolio construction exists as basket and directional evaluator logic plus recommendation shaping, but not as a separately proven product lane with browser-level closure.
4. Root Prisma posture is operationally partial because validation depends on env wiring that is not guaranteed by default.

### Spec-only Or Unproven

1. Canonical browser-clickable proof for the no-wallet qualification flow into preview dashboard and deposit CTA.
2. Integrated `apps/web` -> `apps/api` proof pack with screenshots and console-clean browser evidence.
3. Release-shape hygiene on a bounded branch or landed slices.
4. Operator-ready observability or deployment proof.
5. A standalone market-intelligence producer lane beyond contracts and placeholder/frontend consumption.

## Symptom Contract

Observed problem:
1. non-frontend implementation moved faster than the canonical frontend and operational closeout,
2. multiple threads claimed partial completion, but no single current-state doc reconciled those claims against repo truth,
3. the repo now risks overcalling progress because package checks are green while the user-facing surface is still in flight.

Likely culprit:
1. workstream decomposition was correct, but the remaining closure work crossed thread boundaries and one research thread was contaminated with API work.

Non-obvious alternatives:
1. the current frontend rewrite could land cleanly enough that no separate closeout doc was needed,
2. the market-intelligence and portfolio lanes could be intentionally deferred for demo closure, making the remaining scope smaller than it appears.

Falsifiers:
1. if the canonical browser flow is proven cleanly and all remaining gaps collapse to branch hygiene only, this closeout doc can retire quickly,
2. if the frontend rewrite reveals contract drift that forces backend changes, the current closeout sequencing is too optimistic.

## Product Outcome Contract

When this closeout program is complete enough to count as demo-ready:
1. a user can complete qualification without wallet connection,
2. land directly in a preview-first dashboard seeded by a promoted manifest and recommendation,
3. inspect a center-first workspace, bottom blotter, and right-side context rail backed by truthful API payloads,
4. see explicit preview, funded, blocked, verified, and activation states,
5. deposit to activate on Ethereum without directional ever pretending to be live,
6. and move through the app without falling off into mock-only, disconnected, or contradictory states.

## User-Journey Contract

The canonical user journey that must be browser-proven is:
1. enter onboarding,
2. answer qualification questions,
3. receive a recommended preview lane,
4. inspect workspace, blotter, and intelligence context from the same shell,
5. review activation readiness and deposit CTA,
6. remain clearly in preview unless a truthful funded-and-ready state exists.

Interaction bar:
1. no wallet-first gate,
2. no detached "quiz complete" screen,
3. no generic SaaS dashboard flattening,
4. no directional live language.

## End-To-End Coherence Contract

The app counts as coherent and usable end to end for this milestone only when all of the following are true:
1. onboarding produces a structured qualification result and recommended mode without backend or contract errors,
2. the recommendation opens the canonical preview dashboard directly,
3. the workspace, blotter, activity, and activation-preview surfaces all render from truthful API-backed data for the selected manifest,
4. preview, funded, blocked, verified, and activation-ready states are explicit and not contradictory across screens,
5. the user can move between onboarding, preview, activity, and activation readiness without losing the chosen manifest or recommendation context,
6. directional remains visible as preview-only in every surface where it appears,
7. no critical served route in the canonical journey depends on silent mock fallback for its primary truth.

## State-And-Truth Contract

1. A green non-frontend suite means "locally verified backend/runtime truth," not "user-ready product."
2. A user-facing lane counts as functioning only when the canonical `apps/web` surface proves the intended route in a browser against API-backed payloads.
3. Directional remains `preview-only` until public live-rail proof exists and the served product keeps that truth visible.
4. Market intelligence is not "implemented" merely because contracts or mock/frontend adapters reference it; either a producer boundary exists or the lane is explicitly deferred.
5. Portfolio construction counts as partially implemented today because research and policy prove recommendation logic, but the canonical frontend has not yet proven the corresponding user surface.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: very high.
   - Decision: reuse as-is.
   - Why: this remains the enduring product-truth umbrella, not the volatile closeout tracker.
2. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: reuse as the frontend executor doc.
   - Why: the remaining gap is implementation and proof, not a missing frontend vision.
3. [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)
   - Current relevance: high.
   - Decision: reuse and leave active.
   - Why: the non-frontend research lane is largely proven, but one optional directional follow-up may still reopen it.
4. [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md)
   - Current relevance: very high.
   - Decision: reuse as the explanation-gap executor doc.
   - Why: the remaining blocker is not only browser rendering but also whether the product and research results are understandable enough to use.
5. [2026-03-31-xstocks-and-euler-adapter-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-and-euler-adapter-implementation.md)
   - Current relevance: medium.
   - Decision: reuse as historical implementation evidence.
   - Why: the adapters now exist and pass checks, so the remaining gap is not another adapter spec.
6. [2026-03-31-xstocks-api-activation-boundary-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-03-31-xstocks-api-activation-boundary-implementation.md)
   - Current relevance: high.
   - Decision: reuse as completed backend proof.
   - Why: API and policy are already locally verified; this doc should not be reopened unless browser/API integration falsifies it.

Create new alongside:
1. this closeout spec is justified because none of the existing docs owns thread-claim reconciliation, current verified status, browser-proof requirements, and release hygiene in one place.

## Thread-Synthesis Conclusion

The current thread and adjacent local lanes collapse into six real closeout workstreams:
1. canonical frontend rewrite,
2. portfolio explainability and research-interpretability closure,
3. integrated browser proof,
4. release stabilization,
5. optional directional-preview follow-up,
6. explicit defer-or-implement decision for standalone market intelligence.

The non-frontend substrate is no longer the main blocker.
The blocker is the gap between local backend truth and canonical user-visible understanding plus proof.

## Priority Matrix

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Canonical frontend closeout | 8 asks | very high | high | in progress | `XSL-004`, this spec | clean Claude pass underway | non-frontend dependencies ready, frontend proof absent | no | let Claude finish, then judge against xStocks brief with browser evidence |
| 2 | Portfolio explainability and research interpretability | 7 asks | very high | high | partial | `XSL-010`, `XSL-003`, `XSL-004`, `XSL-006` | undercalled as "just polish" | research artifacts exist; explanation boundary and browser proof do not | no | treat black-box removal as a real closure lane, not optional polish |
| 3 | Integrated browser and API verification | 5 asks | very high | high | unstarted | `XSL-009`, `XSL-004`, `XSL-007`, `XSL-010` | backend thought to be "basically done" | API and policy checks green; no served proof | no | run dev stack, browser walkthrough, screenshot and console proof pack |
| 4 | Release stabilization and landing hygiene | 4 asks | high | medium | incomplete | `XSL-009` | not yet claimed complete | repo still dirty on `main` | not applicable | create one bounded landing wave after frontend acceptance |
| 5 | Directional preview follow-up | 4 asks | medium | medium | partial | `XSL-006` | mixed because one research thread was contaminated | preview-only tests green; no separate follow-up proof yet | no | keep preview-only; open a clean research thread only if still needed after frontend |
| 6 | Market-intelligence producer boundary | 3 asks | medium | low | partial / spec-only | `XSL-002`, this spec | conceptually implied | only contracts, manifest fields, and frontend/mock references exist | no | explicitly defer for demo closure or open a dedicated backend lane later |
| 7 | Portfolio-construction product closure | 3 asks | medium | medium | partial | `XSL-003`, `XSL-006`, `XSL-007`, `XSL-010` | partially claimed through research and policy | evaluators and recommendations exist; no browser-proven product lane | no | accept manifest-driven recommendation boundary for demo; defer dedicated refactor until after browser proof |

## Completion Reconciliation

### Frontend lane

1. completion relative to spec = partial.
2. completion relative to repeated thread asks = partial.
3. completion relative to prior implementation claims = overclaimed if judged today.
4. verified implementation and proof status = frontend rewrite is underway, but no canonical browser proof exists yet.
5. canonical frontend functioning status = not yet verified.
6. exact remaining gap = user-facing proof, not backend contract work.

### Strategy Lab plus manifest boundary lane

1. completion relative to spec = mostly complete for the current demo boundary.
2. completion relative to repeated thread asks = mostly complete.
3. completion relative to prior implementation claims = largely accurate for non-frontend scope.
4. verified implementation and proof status = research, worker, policy, API, shared, xstocks, and euler checks all pass locally.
5. canonical frontend functioning status = not yet verified because manifest-driven surfaces are not yet browser-proven.
6. exact remaining gap = canonical frontend consumption and optional directional follow-up.

### Market-intelligence lane

1. completion relative to spec = partial.
2. completion relative to repeated thread asks = partial.
3. completion relative to prior implementation claims = easy to overstate if contracts are mistaken for a producer engine.
4. verified implementation and proof status = schema presence and manifest/front-end references only.
5. canonical frontend functioning status = not yet verified.
6. exact remaining gap = either explicit deferral for this milestone or a real producer boundary and proof path.

### Portfolio-construction lane

1. completion relative to spec = partial.
2. completion relative to repeated thread asks = mostly satisfied on the backend side.
3. completion relative to prior implementation claims = accurate only if constrained to recommendation and rebalance logic, not full user-facing closure.
4. verified implementation and proof status = evaluators, manifests, recommendation payloads, and rebalance semantics are locally proven.
5. canonical frontend functioning status = not yet verified.
6. exact remaining gap = browser-proven preview and activity surfaces.

## Critical Assumptions And Invalidators

### Assumptions

1. The current Claude frontend pass can stay inside `apps/web` without requiring backend contract changes.
2. The locally passing non-frontend checks are representative of current repo truth and not stale artifacts.
3. The current product milestone does not require a standalone market-intelligence backend before demo closure.
4. Directional can remain preview-only without blocking basket-first demo closure.

### Invalidators

1. Frontend consumption reveals contract drift and forces changes in `packages/shared`, `packages/policy`, or `apps/api`.
2. Browser verification shows the canonical flow still depends on mock-only data for critical states.
3. Prisma or env handling blocks integrated local startup in a way not covered by current checks.
4. The user decides that standalone market intelligence is part of the immediate milestone rather than a deferable lane.

## Measurement Contract

| Metric | Current baseline | Target for closeout | Proof |
| --- | --- | --- | --- |
| Non-frontend suite health | 7 of 7 owned suites green | keep 7 of 7 green | local `npm run check` outputs |
| Prisma posture | generate green; validate only with env | generate green; validate green with documented env path | root Prisma commands |
| Canonical browser proof | 0 proof packs | 1 full proof pack for onboarding -> preview -> activation preview | screenshots, console-clean browser run |
| API-backed product proof | 0 browser-backed proofs | workspace, blotter, activity, and activation preview all use real API payloads | browser evidence plus API responses |
| Directional truth posture | preview-only in backend tests | preview-only in backend and canonical UI | test output plus browser copy/state |
| Release hygiene | dirty `main` | one bounded stabilization wave with explicit diff scope | branch/diff evidence and green checks |

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Non-frontend contract and runtime integrity | 40 | 40 | `npm run check` passed in `packages/shared`, `packages/xstocks`, `packages/euler`, `packages/research`, `packages/policy`, `apps/api`, `apps/worker` |
| Prisma and env posture | 10 | 5 | `npm run prisma:generate` passed; `npm run prisma:validate` passed only when `DATABASE_URL` was supplied |
| Canonical frontend/browser proof | 25 | 0 | no browser proof yet |
| Integrated user journey proof | 15 | 0 | no API-backed served walkthrough yet |
| Release stabilization posture | 10 | 0 | dirty `main`, no bounded landing wave yet |
| Total | 100 | 45 | closeout not achieved |

## Owners And Decision-Rights Contract

1. `apps/web` closeout belongs to the canonical frontend lane and should not be diluted by more parallel frontend threads.
2. Non-frontend truth remains owned by the existing package and app boundaries; reopening those lanes requires new failing proof, not anxiety.
3. The user owns the decision to:
   - accept the frontend pass,
   - defer standalone market intelligence,
   - or open a dedicated directional follow-up lane.
4. No one should call the repo demo-ready or production-ready until this spec's browser-proof and stabilization requirements are satisfied.

## Migration / Coexistence / Deprecation Contract

1. Keep manifest-driven backend surfaces as the canonical boundary.
2. Move `apps/web` off critical mock/local shaping where equivalent API-backed reads already exist.
3. Keep directional preview-only language and behavior in both backend and frontend.
4. Do not resurrect contaminated threads as executor lanes; treat them as historical context only.
5. Once browser proof exists, retire any remaining generic or pre-brief frontend states that survived from the earlier Codex pass.

## Engineering-Direction Contract

### Repo-local direction

1. Keep package-owned boundaries narrow; do not re-centralize runtime logic in `apps/api` or `apps/web`.
2. Prefer small, suite-backed landing waves over one giant final merge from dirty `main`.
3. Treat browser-clickable proof as mandatory for user-facing completion.
4. Fix local env ergonomics for Prisma so root validation is not dependent on tribal knowledge.

### Not a cross-repo direction

1. This closeout program is local to `xstocks-strategy-lab`.
2. No new repo-wide platform standard is justified beyond preserving:
   - narrow package ownership,
   - fail-closed route truth,
   - and proof-backed completion semantics.

## Workstream Closure Plan

### Wave 1: canonical frontend acceptance

Deliver:
1. one xStocks-native `apps/web` pass aligned to the saved design briefs,
2. xStocks-first landing and onboarding hook that clearly names the product object,
3. preview-first onboarding into dashboard,
4. explicit preview/live/funded/blocked language,
5. no generic SaaS/dashboard regressions.

Exit criteria:
1. `apps/web` builds and checks cleanly,
2. the canonical frontend pass is accepted against the brief,
3. landing/onboarding copy is no longer vague or internally jargony,
4. no backend contract changes are required.

### Wave 2: portfolio explainability and research-interpretability closure

Deliver:
1. plain-language explanation of what the portfolio does,
2. why it fits the user,
3. how it changes,
4. why the major holdings or sleeves are present,
5. a chart or replay interpretation note,
6. an operator-readable interpretation path for promoted autoresearch outputs.

Exit criteria:
1. the canonical user path no longer feels black-box,
2. the home, onboarding, preview, comparison, and detail routes explain the portfolio clearly,
3. autoresearch results can be read and used to tune the basket loop intentionally.

### Wave 3: integrated browser proof

Deliver:
1. local app stack running,
2. browser walkthrough of onboarding -> preview dashboard -> activation preview,
3. screenshots and console status,
4. explicit proof that API-backed data powers the canonical path.

Exit criteria:
1. no critical browser errors,
2. the canonical journey is clickable end to end,
3. directional remains visibly preview-only,
4. explanation surfaces are visible and intelligible in screenshots.

### Wave 4: stabilization and landing

Deliver:
1. one bounded diff wave or integration branch,
2. explicit retained-mock audit for `apps/web`,
3. green checks for touched surfaces,
4. updated proof pointers if needed.

Exit criteria:
1. repo state is understandable,
2. the accepted slice is not stranded on dirty `main`,
3. remaining work is either landed or explicitly deferred.

### Wave 5: optional follow-ups only if still needed

Candidates:
1. clean research thread for directional evaluator refinement,
2. standalone market-intelligence producer lane,
3. dedicated portfolio-construction package split.

Rule:
1. none of these reopen the closeout path unless browser proof reveals they are immediate blockers.

## Step-By-Step Executor Runbook

This is the ordered closeout sequence. Do not skip ahead just because package checks are green.

### Step 1: finish the canonical frontend rewrite

Objective:
1. complete the `apps/web` pass so the UI actually matches the xStocks design brief and onboarding brief.

Do:
1. let the clean Claude executor finish `apps/web`,
2. review changed files against the saved briefs,
3. reject any generic SaaS or generic crypto-terminal regressions,
4. confirm the shell remains preview-first and center-first.

Must be true before moving on:
1. onboarding is qualification-driven,
2. preview dashboard is the direct post-onboarding state,
3. directional is still preview-only,
4. right rail and blotter are present and operational,
5. landing and onboarding clearly introduce xStocks portfolios rather than vague internal jargon.

If this step fails:
1. keep work inside `apps/web`,
2. send one correction pass to the same clean frontend lane,
3. do not open additional frontend threads.

### Step 2: close the black-box gap before treating browser proof as enough

Objective:
1. ensure the canonical routes explain the portfolio clearly rather than merely loading successfully.

Audit:
1. landing hook and CTA language,
2. onboarding entry language,
3. preview dashboard explanation blocks,
4. detail-route holdings or sleeve rationale,
5. replay/chart interpretation note,
6. comparison explanation of why the selected portfolio won.

Must be true before moving on:
1. the user-facing object is clearly an xStocks portfolio,
2. the app explains why the recommendation fits the user,
3. the app explains what changes the portfolio,
4. the app explains how to interpret the replay,
5. the product no longer reads like a black box.

If this step fails:
1. keep the fix inside `apps/web` unless a real explanation-field contract gap is proven,
2. treat this as a real blocker, not optional polish,
3. reopen research or shared contracts only if the promoted artifact boundary truly cannot express the needed explanation truth.

### Step 3: prove frontend contract alignment locally

Objective:
1. make sure the frontend compiles and its local checks are green before browser work starts.

Run:
1. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run check`
2. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run build`

Must be true before moving on:
1. both commands pass,
2. there are no newly required backend edits,
3. no obvious contract drift forces changes outside `apps/web`.

If this step fails:
1. classify the failure as frontend-only or contract-drift,
2. fix frontend-only issues in `apps/web`,
3. only reopen backend lanes if the failure proves the current contracts are wrong.

### Step 4: remove critical mock dependency from the canonical path

Objective:
1. ensure the primary journey uses truthful API-backed reads instead of local mock comfort.

Audit:
1. onboarding recommendation source,
2. workspace source,
3. blotter source,
4. activity source,
5. activation-preview source.

Must be true before moving on:
1. the canonical path reads from `apps/api` for primary recommendation and preview truth,
2. any remaining mock data is non-critical, clearly local-only, or explicitly documented,
3. no primary screen silently falls back to fake truth when the API is available.

If this step fails:
1. fix the specific adapter or data-source seam in `apps/web`,
2. document retained mock usage in the proof pack,
3. do not call the app coherent end to end until critical mocks are removed.

### Step 5: start the local stack and verify served routes

Objective:
1. run the actual app surfaces together instead of inferring behavior from package tests.

Do:
1. start the required local services for `apps/api` and `apps/web`,
2. ensure Prisma/env setup is sufficient for the local path being tested,
3. load the canonical served frontend in a browser.

Must be true before moving on:
1. the main route loads,
2. the API-backed preview path loads,
3. no blocking startup errors remain.

If this step fails:
1. capture the exact failing service or env gap,
2. fix local startup blockers before any screenshot or UX judgment,
3. treat startup blockers as closeout blockers, not side notes.

### Step 6: run the canonical browser journey end to end

Objective:
1. prove the app can actually be used coherently from onboarding through preview and activation readiness.

Required journey:
1. complete onboarding,
2. land directly in preview dashboard,
3. inspect workspace,
4. inspect bottom blotter tabs,
5. inspect activity/lifecycle route,
6. inspect activation preview,
7. confirm directional remains preview-only if selected or visible.

Must be true before moving on:
1. the journey is clickable without broken transitions,
2. recommendation context survives across screens,
3. preview/live/funded/blocked language is consistent,
4. no critical console errors appear.

If this step fails:
1. fix the broken user-facing path first,
2. do not move to release hygiene while the canonical journey still breaks,
3. if the failure points to backend truth, reopen only the exact failing lane.

### Step 7: capture proof and reconcile remaining gaps

Objective:
1. convert the served walkthrough into durable proof instead of memory.

Produce:
1. screenshots,
2. console-status notes,
3. commands run,
4. retained-mock audit,
5. explicit directional preview-only note.

Then classify remaining gaps as exactly one of:
1. required before demo closure,
2. safe to defer after demo closure,
3. requires a clean follow-up thread.

Must be true before moving on:
1. proof artifacts exist under the closeout proof path,
2. remaining gaps are named explicitly,
3. no hidden "we'll fix later" blockers remain on the canonical journey.

### Step 8: stabilize and land the accepted slice

Objective:
1. stop treating a dirty `main` worktree as if it were acceptable closure.

Do:
1. isolate the accepted slice,
2. run the touched checks again,
3. keep the landing wave bounded,
4. leave deferred work explicitly tracked instead of mixed into the landing wave.

Must be true for this step to pass:
1. the accepted slice is understandable,
2. the closeout proof still matches the landed code,
3. remaining work is separated into follow-ups instead of staying entangled.

### Step 9: only then decide on optional reopeners

Optional reopeners:
1. standalone market-intelligence producer lane,
2. clean directional research follow-up,
3. portfolio-construction refactor.

Rule:
1. none of these are part of end-to-end closure unless the browser proof shows they are active blockers.

## Canonical Click Path And Screen Assertions

This is the required browser-clickable proof path for end-to-end closure.

### Required path A: basket-first canonical journey

1. Load `/`.
   Must be visible:
   1. terminal shell loads without fatal errors,
   2. one entry into qualification is visible,
   3. one workspace or promoted-lane entry is visible,
   4. the bottom blotter is attached to the shell.
   Must also be true:
   1. the page clearly introduces xStocks portfolios or tokenized equities,
   2. the primary CTA clearly names the object or action.
2. Click `Qualify` in the top nav or enter `/onboarding`.
   Must be visible:
   1. entry card introducing xStocks portfolio qualification,
   2. no wallet prompt,
   3. one primary `Start qualification` action or equivalent.
3. Click `Start`.
4. Complete the onboarding sequence in this order:
   1. `What should this strategy optimize for first?`
   2. if `A clear equity lane` was chosen, complete `Which lane should the basket lean into?`
   3. `How much expression do you want?`
   4. `How much swing should this wallet take?`
   5. optional refinement if shown: `In a rough stretch, how protective should this setup feel?`
   6. `How often should the strategy refresh itself?`
   7. `When the market tone turns, how should this strategy behave?`
   8. `How comfortable are you with the strategy adjusting on its own once funded?`
   9. `How decided are you right now?`
   Must be true during onboarding:
   1. progress advances by primary question count,
   2. `Back` and `Start over` remain available,
   3. no chart or detached wallet gate interrupts the flow.
5. Confirm the flow lands directly in the preview dashboard inside the terminal shell.
   Must be visible:
   1. recommended strategy hero,
   2. behavior chips,
   3. center workspace chart,
   4. right rail,
   5. bottom blotter,
   6. plain-language explanation of what the portfolio does and why it fits.
6. On the same preview shell, confirm the portfolio workspace is above the blotter.
   Must be visible:
   1. one `Portfolio workspace` chart card,
   2. one promoted replay line,
   3. one `Preview / demo` label,
   4. one `Deposit to activate on Ethereum` action or equivalent activation CTA,
   5. one chart interpretation note or equivalent replay explanation.
7. In the bottom blotter, keep `Positions` selected first.
   Must be visible:
   1. tabs for `Positions`, `History`, `Next rebalancing`, and `Activity / Lifecycle`,
   2. row-first positions table,
   3. route column,
   4. next rebalance column,
   5. updated timestamp column.
8. Click `History`.
   Must be visible:
   1. settled, pending, or blocked status pills,
   2. venue and amount columns.
9. Click `Next rebalancing`.
   Must be visible:
   1. rebalance window,
   2. trigger,
   3. route,
   4. impact,
   5. rebalance state.
10. Click `Activity / Lifecycle`.
    Must be visible:
    1. lifecycle state pills,
    2. next-action copy,
    3. preview or paused state where applicable.
11. Open the detail route for the recommended manifest.
   Must be visible:
   1. target sleeves table,
   2. PoR column,
   3. route and vault context block,
   4. promoted-manifest contract block,
   5. methodology and venue provenance block,
   6. one holding or sleeve rationale block.
12. Open the activation route for the recommended manifest.
    Must be visible:
    1. `Deposit and activation preview`,
    2. required state,
    3. manifest slot,
    4. deposit asset,
    5. reversible state,
    6. execution ladder,
    7. route summary,
    8. funding options,
    9. rails,
    10. smart-account panel.

### Required path B: directional truth path

This path does not need live activation. It exists to prove truthful preview-only behavior.

1. Load `/workspace/detail/mstr-conviction-long` or reach the directional lane through onboarding answers that opt into a sharper path.
2. Confirm the directional lane still renders in preview truth.
   Must be visible:
   1. preview or demo labeling,
   2. directional manifest slot or title,
   3. route and vault context,
   4. no language implying live directional execution.
3. Open `/activate/mstr-conviction-long`.
   Must be visible:
   1. funding-required or preview-only style state,
   2. smart-account shell state,
   3. execution ladder and fallback rules,
   4. no claim that Euler directional execution is live.

## Screenshot Proof Matrix

The closeout proof pack must include these screenshots at minimum.

1. `01-home-terminal.png`
   Route:
   1. `/`
   Click source:
   1. direct load
   Must show:
   1. canonical home route,
   2. top nav,
   3. one qualification entry point,
   4. bottom blotter attached to the shell.
   Expected visible text:
   1. `xStocks portfolios` or equivalent xStocks-first kicker
   2. `Find my xStocks portfolio` or equivalent clear qualification CTA
   3. one line clearly describing qualification -> preview -> deposit
2. `02-onboarding-entry.png`
   Route:
   1. `/onboarding`
   Click source:
   1. `Start qualification` from home or top-nav `Qualify`
   Must show:
   1. xStocks portfolio qualification entry,
   2. no-wallet-first entry copy,
   3. `Start qualification` CTA or equivalent.
   Expected visible text:
   1. `Find your xStocks portfolio` or equivalent
   2. one line explaining qualification, preview, and no-wallet-first behavior
3. `03-onboarding-question.png`
   Route:
   1. `/onboarding`
   Click source:
   1. `Start`
   Must show:
   1. one real onboarding question,
   2. progress indicator,
   3. answer cards,
   4. `Back` and `Start over`.
   Expected visible text:
   1. one of the real onboarding prompts from the qualification flow
   2. `Back`
   3. `Start over`
4. `04-preview-dashboard.png`
   Route:
   1. `/onboarding` after answering all primary questions
   Click source:
   1. complete the qualification flow
   Must show:
   1. recommended strategy hero,
   2. center portfolio workspace,
   3. right rail,
   4. bottom blotter visible on the same screen,
   5. explanation of what the portfolio does and why it fits.
   Expected visible text:
   1. `Recommended strategy`
   2. `Portfolio workspace`
   3. `Blotter`
   4. `What this portfolio does` or equivalent
   5. `Why this fits you` or equivalent
5. `05-bottom-blotter-positions.png`
   Route:
   1. same shell as `04-preview-dashboard.png`
   Click source:
   1. keep `Positions` tab active
   Must show:
   1. `Positions` tab active,
   2. position rows,
   3. route, next rebalance, and updated columns.
   Expected visible text:
   1. `Positions`
   2. `Route`
   3. `Next rebalance`
   4. `Updated`
6. `06-bottom-blotter-history.png`
   Route:
   1. same shell as `04-preview-dashboard.png`
   Click source:
   1. click `History`
   Must show:
   1. `History` tab active,
   2. settled or pending status pills,
   3. venue and amount.
   Expected visible text:
   1. `History`
   2. `Venue`
   3. `Amount`
7. `07-bottom-blotter-rebalancing.png`
   Route:
   1. same shell as `04-preview-dashboard.png`
   Click source:
   1. click `Next rebalancing`
   Must show:
   1. `Next rebalancing` tab active,
   2. trigger, route, impact, and rebalance state.
   Expected visible text:
   1. `Next rebalancing`
   2. `Action`
   3. `Route`
   4. `Impact`
8. `08-detail-proof-route.png`
   Route:
   1. `/workspace/detail/<recommended-manifest-slug>`
   Click source:
   1. `Keep exploring in demo`, `Open detail screen`, or direct nav into detail
   Must show:
   1. target sleeves,
   2. PoR column,
   3. route state,
   4. reserve posture,
   5. proof-of-reserves label,
   6. borrow path,
   7. why the holdings or sleeves are here.
   Expected visible text:
   1. `Target sleeves`
   2. `Route and vault context`
   3. `Proof of reserves`
   4. `Borrow path`
   5. `Why these holdings are here` or equivalent
9. `09-smart-account-and-activation.png`
   Route:
   1. `/activate/<recommended-manifest-slug>`
   Click source:
   1. `Deposit to activate on Ethereum` or equivalent activation CTA
   Must show:
   1. smart-account readiness label and state pill,
   2. account shell,
   3. deposit band,
   4. permissions,
   5. activation CTA state.
   Expected visible text:
   1. `Smart account`
   2. `Account shell`
   3. `Deposit band`
   4. one readiness-state pill such as `activation ready`, `funding required`, or `connect required`
10. `10-execution-ladder.png`
    Route:
    1. `/activate/<recommended-manifest-slug>`
    Click source:
    1. same as screenshot 09; capture lower on the same route if needed
    Must show:
    1. execution ladder items,
    2. primary venue,
    3. backup venue,
    4. funding options,
    5. fallback rules,
    6. rails.
    Expected visible text:
    1. `Execution ladder`
    2. `Deposit and route summary`
    3. `Funding options`
    4. `Promoted fallback`
11. `11-directional-preview-only.png`
    Route:
    1. `/activate/mstr-conviction-long` or `/workspace/detail/mstr-conviction-long`
    Click source:
    1. direct load or directional lane selection
    Must show:
    1. directional route,
    2. preview-only truth,
    3. no live directional claim,
    4. fallback or funding-required state.
    Expected visible text:
    1. `Preview only` or another explicit preview label
    2. `Directional shell` or directional route context
    3. `funding required`, `preview`, or equivalent non-live state

## Screen Pass / Fail Matrix

Use this matrix during browser verification. A screen fails if any required visible state is missing or contradictory.

### Home screen

Pass only if:
1. the main shell loads,
2. `Start qualification` is visible,
3. the shell still shows the bottom blotter,
4. the page does not read like a generic dashboard.

Fail if:
1. the qualification entry is missing,
2. the blotter is detached or absent,
3. the right rail or center workspace is broken,
4. the screen defaults to wallet-first behavior,
5. the hero or CTA language is so vague that the product object is still unclear.

### Onboarding entry and question flow

Pass only if:
1. `Set your strategy lane` appears before any wallet step,
2. question flow advances correctly,
3. conditional theme and drawdown questions behave in-line,
4. the flow ends in the preview dashboard, not a dead-end completion page.

Fail if:
1. onboarding opens a detached thank-you state,
2. the question order is broken,
3. the progress bar is inconsistent with primary-question count,
4. answer selection loses state or breaks routing,
5. the entry copy still reads like internal jargon instead of explaining the portfolio preview flow.

### Preview dashboard shell

Pass only if:
1. the recommended strategy hero is present,
2. the center chart stays visually dominant,
3. the right rail shows intelligence and smart-account context,
4. the blotter is visible on the same shell,
5. preview/demo labeling is explicit.

Fail if:
1. the preview shell looks like a generic equal-weight card dashboard,
2. the recommended strategy context disappears,
3. the bottom blotter is not attached,
4. preview/live wording is contradictory,
5. the page still does not explain what the portfolio does or why it fits.

### Bottom blotter

Pass only if:
1. all four tabs exist,
2. each tab reveals the expected row-first operational data,
3. statuses and timestamps scan quickly.

Fail if:
1. tabs are missing,
2. positions/history/rebalancing/activity are decorative only,
3. status pills or route columns disappear,
4. the blotter content contradicts the selected manifest.

### Detail route

Pass only if:
1. target sleeves render,
2. PoR and reserve truth are visible,
3. route and vault context are visible,
4. promoted-manifest contract context is visible.

Fail if:
1. detail loses the selected manifest,
2. route truth is missing,
3. proof or reserve posture is hidden,
4. the route claims live truth that the backend does not support,
5. the user still cannot tell why the major holdings or sleeves are present.

### Activation route

Pass only if:
1. required state is explicit,
2. smart-account readiness is explicit,
3. funding options, route summary, and execution ladder are visible,
4. fallback rules are visible,
5. directional remains preview-only where relevant.

Fail if:
1. activation language implies live execution without required readiness,
2. smart-account state is unclear,
3. funding path or rail truth is hidden,
4. directional appears executable.

## Backend Reopen Rules

Do not reopen backend lanes by reflex. Reopen only when the failure proves backend truth is wrong or insufficient.

### Reopen `apps/api` or `packages/policy` only if:

1. a canonical route loads but the API payload is missing required recommendation, activity, or activation fields,
2. preview/live/funded/blocked states disagree with API truth,
3. activation preview route truth or smart-account readiness is incorrect relative to the backend response,
4. directional is surfaced as executable because the API or policy boundary is wrong.

Do not reopen backend for:
1. pure styling problems,
2. layout regressions,
3. missing buttons or copy inside `apps/web`,
4. mock-to-API adapter mistakes that can be fixed locally in `apps/web`.

### Reopen `packages/shared` only if:

1. the frontend and API disagree because the canonical shared contract cannot represent the needed truth,
2. tests prove a real contract mismatch rather than a frontend mapping bug.

### Reopen `packages/xstocks` or `packages/euler` only if:

1. route, reserve, PoR, bridge, or directional-preview truth is wrong at the runtime boundary itself,
2. the browser failure can be traced to wrong normalized live-state or rail-truth output rather than frontend rendering.

### Reopen `packages/research` or `apps/worker` only if:

1. the promoted manifest referenced by the frontend/API is wrong or missing,
2. slot resolution is broken,
3. directional preview-only posture is wrong in the promoted manifests themselves.

Do not reopen research for:
1. missing frontend polish,
2. missing screenshots,
3. generic dissatisfaction with the preview shell.

## Verification And Test Matrix

These are the checks required for closeout, and what each one proves.

### Non-frontend checks already green

1. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared run check`
   Proves:
   1. shared artifact helpers parse and normalize promoted research artifacts.
2. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/xstocks run check`
   Proves:
   1. xStocks live-state normalization works,
   2. route-truth helpers fail closed,
   3. bridge-helper state is explicit.
3. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/euler run check`
   Proves:
   1. directional preview helpers remain conservative,
   2. Euler context stays preview-only.
4. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/research run check`
   Proves:
   1. research bundle validates,
   2. promoted manifests and results ledger are coherent,
   3. directional preview manifest stays fail-closed.
5. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker run check`
   Proves:
   1. public promoted-boundary reads resolve correctly,
   2. directional promoted manifest is still not executable.
6. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy run check`
   Proves:
   1. promoted manifests are required,
   2. route truth stays preview-only until wallet, funding, and smart-account readiness,
   3. directional preflight fails closed.
7. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api run check`
   Proves:
   1. catalog, workspace, recommendation, activation preview, and activity reads are manifest-driven,
   2. raw manifest payloads are rejected,
   3. directional stays preview-only through the API boundary.

### Frontend-local checks still required for closeout

1. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run check`
   Proves:
   1. `eslint` passes,
   2. `vitest` passes,
   3. `src/lib/data-source.test.ts` still proves promoted-manifest alignment and non-promoted detail rejection,
   4. `src/lib/shared-contract-adapter.test.ts` still proves qualification output and activation-contract shaping.
2. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run build`
   Proves:
   1. the served app compiles as a Next.js product surface,
   2. the canonical routes can be built.
3. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab run prisma:generate`
   Proves:
   1. Prisma client generation still works.
4. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab run prisma:validate`
   Proves:
   1. schema validity, separate from env absence.

### Browser proof still required for closeout

1. one served walkthrough of path A,
2. one served walkthrough of path B,
3. one console-clean capture for the canonical routes,
4. one retained-mock audit for the canonical journey.

## Proof, Reserve, Bridge, And Chain Truth Checks

For this milestone, proof truth is satisfied by explicit route, reserve, PoR, and bridge-provider visibility. Do not invent a dedicated Chainlink-branded surface unless the served app actually exposes one.

Required truth checks:
1. the detail route must show a PoR column in target sleeves and a `Proof of reserves` field in route and vault context,
2. the workspace or right rail must show reserve-window and venue truth,
3. the activation route must show funding options, rails, and execution-ladder truth,
4. if cross-chain or bridge behavior is surfaced, the bridge provider must match the policy/runtime truth,
5. if the current frontend build explicitly surfaces Chainlink, CCIP, or another branded proof provider, the screenshot pack must capture that exact label and it must match the underlying route/proof state.

## Verification Commands

Already verified:
1. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared run check`
2. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/xstocks run check`
3. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/euler run check`
4. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/research run check`
5. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker run check`
6. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy run check`
7. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api run check`
8. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab run prisma:generate`
9. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab run prisma:validate`

Still required for closeout:
1. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run check`
2. `npm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/apps/web run build`
3. canonical dev-stack startup for browser proof
4. browser walkthrough and screenshots on the served `apps/web` surface
5. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

## Proof Artifact Contract

Closeout proof should be stored under:
1. `/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-03-31-closeout/`

Minimum contents:
1. frontend screenshots,
2. browser console status summary,
3. commands run,
4. retained-mock audit for `apps/web`,
5. explicit note that directional stayed preview-only.
