# xStocks Partner Tracking And Reporting Dashboard Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Create one execution-grade workstream for a truthful dashboard that xstocks can use to inspect:
1. user funnel progression,
2. wallet/connect state,
3. funding and activation progression,
4. submitted and confirmed execution volume,
5. and current blockers preventing more real usage.

## Non-goals

This workstream does not:
1. build a full analytics warehouse before the first dashboard exists,
2. expose raw secrets, raw session tokens, or private user content to xstocks,
3. count visits, quotes, or preview clicks as execution volume,
4. inflate numbers through fabricated, duplicated, or wash activity,
5. replace operator logs or alerts for runtime debugging.

## Current Live Truth

1. the repo has no user/session/auth model today.
2. the repo has no event ledger for onboarding, funding, connect, or execution state transitions.
3. the repo has no partner-facing dashboard route or report export.
4. `apps/api` persists runtime execution state but not a canonical funnel/partner reporting history.
5. `apps/web` has no dashboard route specifically for xstocks partner reporting.

## Current Local Implementation Audit

### Shipped

1. activity and execution state contracts exist.
2. runtime execution requests and activity events already exist in the API layer.
3. hosted web and backend surfaces exist for future dashboard consumption.

### Partial

1. activity/state persistence for single-lane execution.
2. runtime-store posture for lightweight dev truth.

### Spec-only or unproven

1. canonical partner event ledger,
2. user funnel metrics,
3. partner dashboard UI,
4. partner-safe export surface,
5. privacy boundary for identity and wallet data.

## Completion Reconciliation

1. completion relative to spec = not started.
2. completion relative to repeated thread asks = newly requested and unimplemented.
3. completion relative to prior implementation claims = no prior implementation claim should be interpreted as dashboard closure.
4. verified implementation and proof status = execution/activity primitives exist, but no reporting layer exists.
5. canonical frontend functioning status = no partner-visible dashboard route exists.

## Codebase Fit And Iteration-Speed Contract

codebase fit = extend existing plus extract shared event/reporting modules.

existing logic to reuse:
1. [apps/api/src/repositories/runtime-store.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/repositories/runtime-store.js)
2. [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js)
3. [packages/shared/src/contracts/activity.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/activity.ts)
4. current activity/execution request state already stored by the API lane

new entrypoints required = yes.

Why:
1. a partner dashboard or export surface does not exist today,
2. event aggregation and reporting should not live as ad hoc reads from runtime-store alone.

structural refactor assessment = same-tranche beneficial.

iteration-speed hotspots assessed:
1. [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) should not become the only home for durable reporting logic.
2. runtime-store may remain for first slice, but reporting aggregation should move into a dedicated service or repository module.
3. frontend dashboard should be a dedicated route/module rather than mixed into current onboarding/activity pages.

build/deploy fan-out assessment:
1. most logic should stay backend-owned, with the dashboard consuming one narrow API/export surface.
2. reporting work should not broaden the homepage or activation deploy path.

intended file/package boundaries:
1. `packages/shared/**` for event and reporting contracts,
2. `apps/api/**` for event persistence and reporting reads/exports,
3. `apps/web/**` for the partner-visible dashboard surface only.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: medium.
   - Decision: extend later, do not reuse as executor doc.
   - Why: it mentions observability as a gap but does not own reporting.
2. [2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md)
   - Current relevance: medium.
   - Decision: reuse later for identity-fed funnel metrics.
   - Why: it may become the identity source, but reporting ownership is distinct.
3. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: coordinate closely.
   - Why: dashboard truth depends on the same state machine.

## Symptom Contract

Observed problem:
1. xstocks needs externally legible proof of usage and progress,
2. but the repo currently has no partner-visible reporting surface,
3. so even truthful internal progress remains hard to hand off or discuss.

Likely culprit:
1. execution and UX were prioritized ahead of event/reporting ownership.

Non-obvious alternatives:
1. a CSV/export-only first slice might be enough before a full dashboard,
2. operator-only reporting might be enough for the first live proof,
3. partner reporting may need to stay delayed until identity/session truth exists.

Falsifiers:
1. if runtime-store and activity events are already enough to build the first dashboard, no heavier data system is required,
2. if partner-safe reporting cannot be done without durable user identity, the first slice must narrow to operator reporting only.

## Product Outcome Contract

When this workstream is done enough for the first partner handoff:
1. xstocks can see the current funnel and execution posture,
2. metrics distinguish browsing, onboarding, connection, funding, submission, and confirmed execution,
3. real volume is clearly separated from pre-execution interest,
4. blockers are visible rather than buried in thread context.

## User-Journey Contract

Internal and partner stakeholders should be able to:
1. open one reporting surface,
2. inspect current counts by funnel stage,
3. inspect recent real execution events,
4. inspect volume totals and status,
5. understand what is blocking more volume.

## State-And-Truth Contract

Minimum canonical event ladder:
1. `landing_viewed`
2. `onboarding_started`
3. `qualification_completed`
4. `portfolio_recommended`
5. `activation_viewed`
6. `wallet_connected`
7. `funding_required`
8. `quote_ready`
9. `awaiting_approval`
10. `submitted`
11. `confirmed`
12. `failed`

Partner-visible numeric contracts:
1. `users` and `wallets` are distinct.
2. `submitted_volume_usd` means user-approved or treasury-approved submitted notional.
3. `confirmed_volume_usd` means confirmed settlement only.
4. preview, quote, or connect counts never appear as execution volume.

## Critical Assumptions And Invalidators

### Assumptions

1. the first dashboard can be built from app-owned events rather than third-party analytics alone.
2. xstocks mainly needs truthful funnel and volume visibility, not a full BI suite.
3. the first slice can remain read-only and partner-safe.

### Invalidators

1. no durable event source exists for the required metrics.
2. partner-safe reporting needs a privacy/legal review before any external sharing.
3. the execution state machine changes materially before dashboard implementation starts.

## Dashboard Contract

### Core sections

1. funnel summary
2. wallet/connect summary
3. activation and execution status summary
4. recent event stream
5. blockers and warning summary
6. export surface

### Minimum metrics

1. unique landing visitors
2. onboarding starts
3. completed recommendations
4. activation views
5. connected wallets
6. funding-required users
7. quote-ready requests
8. awaiting-approval requests
9. submitted orders
10. confirmed orders
11. submitted volume USD
12. confirmed volume USD

## Proof Artifacts

1. dashboard screenshot.
2. partner-safe JSON or CSV export.
3. reconciliation note showing that reported execution volume matches execution-request truth.
4. one proof sample for a blocker surfacing correctly.

## Verification Commands

1. backend checks for the event/reporting layer.
2. frontend checks for the dashboard route.
3. one fixture or seed script that produces known metrics.
4. one reconciliation script or manual proof showing dashboard totals match underlying events.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Partner reporting surface | 0 | 1 | dashboard or export proof |
| Funnel state coverage | 0 canonical stages | all minimum states captured | event schema proof |
| Execution volume truth | not reportable | submitted and confirmed totals separated | reconciliation proof |
| Blocker visibility | thread-only | dashboard-visible | screenshot/export |

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - event schema, seed fixtures, local dashboard/export proof.
2. deployed-host verified
   - candidate dashboard/export using real deployed-host data.
3. production-host verified
   - live partner-reporting surface using production execution truth.
4. still unproven
   - any metric without reconciliation to underlying execution state.

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Canonical event schema | 25 | 0 | absent |
| Dashboard/export surface | 25 | 0 | absent |
| Volume reconciliation | 30 | 0 | absent |
| Privacy/partner-safe presentation | 20 | 0 | absent |
| Total | 100 | 0 | not started |

## Data, Privacy, And Retention Contract

1. partner-facing surfaces should default to pseudonymous or aggregated views.
2. wallet addresses may be shown only when explicitly approved.
3. raw provider/session tokens must never enter reporting surfaces.
4. exports should distinguish internal-only and partner-shareable fields.

## Owners And Decision-Rights Contract

1. backend/reporting owner decides event schema and export contract.
2. frontend owner decides dashboard presentation.
3. product owner decides which fields are safe to share with xstocks.

## Exit Criteria

This workstream is complete enough when:
1. one canonical event ledger exists,
2. one dashboard or export surface exists,
3. funnel and volume metrics reconcile to execution truth,
4. xstocks can review the result without reading raw thread history.

## Progress Log

### 2026-04-01

Implemented the first truthful reporting slice as an operator-token-gated API route in `apps/api`, backed only by repo-owned activation snapshots plus execution requests.

Delivered:
1. canonical reporting ladder frozen in shared contracts,
2. `/api/reporting/xstocks` with masked wallet output by default,
3. lower-bound activation and wallet metrics from saved activation truth,
4. canonical submitted and confirmed volume derived only from stored execution legs,
5. blocker surfacing for missing pre-activation funnel coverage and missing partner auth.

Still blocked for full dashboard closure:
1. no canonical landing/onboarding/qualification/recommendation/activation-view ledger exists in-repo,
2. no partner self-serve auth model exists in-repo,
3. wallet-connected counts remain lower-bound because connect attempts without activation save are not captured.

### 2026-04-01 canonical ledger tranche

Next execution slice for this lane:
1. add one repo-owned durable funnel/event ledger to `runtime-store` for pre-activation and activation-adjacent truth,
2. define anonymous funnel `subjects` as first-party repo-issued browser-scoped identifiers that are distinct from authenticated users and wallets,
3. capture `landing_viewed`, `onboarding_started`, and `activation_viewed` from narrow `apps/web` hooks only,
4. capture `qualification_completed` and `portfolio_recommended` only after the API re-derives qualification from the submitted onboarding answers,
5. capture `wallet_connected` only after Privy-authenticated request verification proves the linked user and wallet,
6. update `/api/reporting/xstocks` to use the ledger as canonical truth for these stages while leaving `funding_required` explicitly lower-bound until a canonical funding-state ledger exists.

Implemented in this tranche:
1. shared reporting contracts now define the canonical funnel ledger stages, event schema, subject-aware stage counts, and funnel metric surface,
2. `runtime-store` now persists durable `funnelEvents` alongside activations and execution requests,
3. `POST /api/funnel-events/xstocks` now ingests `landing_viewed`, `onboarding_started`, `activation_viewed`, and `wallet_connected` with fail-closed validation,
4. `POST /api/qualify` now records `qualification_completed` and `portfolio_recommended` when a known funnel subject is provided,
5. `apps/web` now emits the narrow landing, onboarding, activation-view, qualification, and wallet-connect signals needed for canonical stage truth,
6. `/api/reporting/xstocks` now reads canonical funnel events for these stages and keeps `funding_required` explicitly lower-bound.

Still intentionally non-canonical after this tranche:
1. `funding_required` still begins at saved activation snapshots because the repo does not yet own a pre-save funding-state ledger,
2. partner self-serve auth still does not exist in-repo, so the reporting surface remains operator-token gated,
3. anonymous subject continuity remains browser-scoped and separate from authenticated user identity unless the repo recorded both in the same subject stream.
