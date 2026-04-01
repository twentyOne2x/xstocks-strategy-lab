# xStocks First Real Volume Control Plane

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Turn the current xstocks repo from a demo-leaning, partially proven product into the first truthful volume path by:
1. upgrading `/` into a real homepage instead of an intermediary onboarding card,
2. closing the first authenticated `connect -> fund -> sign -> submit -> track` path,
3. adding operator and partner-visible tracking for the funnel and real execution events,
4. and making Hermes a usable remote agent for guided qualification and controlled live testing.

## Non-goals

This control plane does not:
1. authorize fake, wash, circular, or fabricated volume,
2. claim autonomous execution is live,
3. reopen 1inch, Bridge, CRE, or issuer lanes for this milestone,
4. force public `skill.md` before the repo-owned skill and Hermes runbook are proven,
5. replace existing control-plane or workstream specs that already truthfully own adjacent lanes.

## Current Live Truth

As of 2026-04-01, current repo and hosted truth is:
1. frontend is hosted on Vercel from `apps/web` via [.vercel/project.json](/Users/user/PycharmProjects/xstocks-strategy-lab/.vercel/project.json).
2. backend is configured for Railway via [railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/railway.json).
3. the live domain `https://equityterminal.app/` now reflects the latest Equity Terminal landing and icon.
4. the current landing is still too small and intermediary-feeling relative to the user’s desired homepage, and several served surfaces still overclaim live or automation truth relative to the production API.
5. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) now uses real Privy hooks and emits `wallet_connected`, but the served activation state is not yet fully reconciled to the production API.
6. the backend now has real Privy JWT or JWKS verification plus the CoW quote or submission boundary, and the repo carries one hosted linked-wallet quote-boundary proof bundle, but no signed submission proof exists yet.
7. the repo now has a canonical funnel ledger, `/api/reporting/xstocks`, `/api/funnel-events/xstocks`, and `/ops/xstocks`, but hosted reporting tokens are still missing and the dashboard remains operator-internal.
8. the repo now has the public `skill.md`, `GET /api/public-agent-handoff`, the internal agent skill chain, and operator smoke runbooks; hosted `skill.md` now matches the repo-owned public-safe copy on key public-safe points, but no Hermes remote proof pack exists yet.

## Current Local Implementation Audit

### Shipped

1. landing/favicon deploy closure on Vercel.
2. qualification, recommendation, activation-readiness, and CoW execution contracts.
3. Railway and Vercel deployment wiring.
4. real Privy frontend connect code and backend auth verification.
5. public-safe handoff, reporting routes, funnel-event persistence, and the ops dashboard route.
6. repo-owned internal agent skills plus concise smoke or proof runbooks.

### Partial

1. homepage quality and explanatory depth.
2. served frontend truth alignment to the production activation and automation boundary.
3. backend CoW authenticated proof.
4. hosted reporting-token configuration.
5. Hermes remote smoke and funded-proof capture.

### Spec-only or unproven

1. first real user-approved CoW execution proof.
2. hosted partner-visible reporting access beyond operator-token-gated proof.
3. Hermes-operated testing with wallet/treasury proof artifacts.
4. browser-proof closure for the served homepage and activation path.

## 2026-04-01 Final Reconciliation Update

This section supersedes stale planning-tranche assumptions in the tables below.

Owner-lane snapshot:
1. `XSL-009`: partial. Checks and route existence are proven, but browser proof and served-truth alignment are still open.
2. `XSL-014`: partial. Real Privy connect and backend auth exist, and a hosted linked-wallet quote-boundary proof bundle exists, but the current promoted basket is structurally incompatible with present CoW venue truth for five core legs in the tested band, so signed submission remains unproven.
3. `XSL-015`: partial. Reporting and funnel routes exist, but hosted tokens are missing and `funding_required` remains lower-bound.
4. `XSL-016`: partial. Internal skill and runbook surfaces exist, but Hermes remote smoke and funded-proof capture are still missing.
5. `XSL-016A`: closed. The public-safe handoff bridge exists.
6. `XSL-016B`: partial. Local docs align, hosted `skill.md` parity is now closed on key public-safe points, and the remaining blocker is default-port local smoke contamination from a pre-existing `localhost:3001` process on this machine.

Ordered residual backlog from this control plane:
1. fix served UI truth and capture browser proof,
2. keep `XSL-014` partial only until basket or venue truth changes, because the current promoted basket is structurally incompatible with present CoW venue truth for five core legs in the tested `25` to `500` USD gross band,
3. configure hosted reporting tokens and reverify `/ops/xstocks` plus `/api/reporting/xstocks`,
4. run the Hermes remote smoke plus real user-token-backed authenticated/funded proof path.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: reuse as the broad product umbrella.
   - Why: it still owns the enduring workstream map.
2. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: high but incomplete for the current ask.
   - Decision: update indirectly and partially supersede for current execution priority.
   - Why: it closes demo/browser truth, but not partner reporting or Hermes-operated live testing.
3. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: homepage redesign and frontend truth are still frontend-owned, not a new frontend spec problem.
4. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: live rails and wallet/funding direction already live there; current gap is proof and closure.
5. [2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md)
   - Current relevance: medium.
   - Decision: reuse later, do not block on it now.
   - Why: identity capture and incentives may matter later, but the current next blockers are real homepage quality, authenticated execution proof, reporting, and Hermes.

Create new alongside:
1. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
2. [2026-04-01-xstocks-partner-tracking-and-reporting-dashboard-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-partner-tracking-and-reporting-dashboard-spec.md)
3. [2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md)

## Thread-Recurrence Audit

Repeated asks in the active thread collapse into five canonical workstreams:
1. landing/homepage quality and brand hierarchy,
2. truthful frontend Privy and activation state,
3. backend auth plus first signed CoW proof,
4. operator and partner-visible tracking,
5. Hermes-operated testing and skill usability.

Recurring pattern:
1. frontend threads repeatedly improved wording and shell structure, but the user returned because the entry surface still felt too small or too product-intermediate.
2. backend threads materially improved CoW and smart-account contracts, but the same unresolved blocker returned because no real authenticated user/session/signature exists yet.
3. deploy verification is complete enough that deploy is no longer the blocker.

Different framings count:
1. homepage/landing complaints: 4 distinct framings.
2. Privy/connect truth complaints: 3 distinct framings.
3. backend execution-proof complaints: 3 distinct framings.
4. reporting/partner visibility ask: 1 new framing.
5. Hermes/skill/operator ask: 1 new framing.

Prior claimed-closure count:
1. landing deploy closure was claimed and is now actually proven.
2. frontend landing quality was claimed improved multiple times but remains only partial relative to the current ask.
3. backend rails were claimed materially stronger and that is true, but only at the contract/runtime layer rather than authenticated end-to-end proof.

User-stated intended outcome by workstream:
1. homepage should be big, full-width, explanatory, and feel like a real homepage.
2. real volume should be possible and truthful.
3. xstocks should get a dashboard/reporting surface.
4. Hermes should be usable as a controllable operator agent with a skill surface that works well.

## Priority Matrix

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Homepage redesign and frontend activation truth | very high | very high | high | partial | `XSL-004`, `XSL-014`, this control doc | repeatedly “better but not enough” | landing deploy is live, Privy connect is still stubbed | partial | resume the active frontend thread and split homepage redesign from activation truth if needed |
| 2 | First authenticated execution proof | very high | very high | medium | partial | `XSL-005`, `XSL-014` | backend rails claimed materially stronger | CoW code exists, no authenticated session/signature proof | no | resume `audit smart-account rails (019d489d-6117-7783-98af-2327aa876b6f)` only after frontend truth lands |
| 3 | Partner tracking and xstocks reporting | medium | high | low | unstarted | `XSL-015` | not yet claimed | no event ledger or dashboard exists | no | create a new dashboard/reporting thread |
| 4 | Hermes operator harness and skill surface | medium | high | low | unstarted | `XSL-016` | not yet claimed | repo skill exists, Hermes path and proof contract absent | not applicable | create a new Hermes/skill thread |
| 5 | Social connect / incentive / agent wallet | medium | medium | low | spec-only | `XSL-012` | active but not current blocker | no auth or reward lane yet | no | defer until after first truthful volume path works |

## Product Outcome Contract

When this control plane is complete enough for the first real volume milestone:
1. `/` feels like a real homepage that clearly explains the product before the app begins,
2. a user can reach the activation surface with a real Privy connection and truthful state,
3. one real user-approved or treasury-approved test execution can reach the furthest truthful CoW boundary,
4. operators and xstocks can inspect the resulting funnel and execution events in a real reporting surface,
5. Hermes can be used as a controlled remote agent to reproduce qualification and live-test flows from a documented skill/runbook.

## User-Journey Contract

The milestone journey is:
1. user lands on a real homepage,
2. clicks through to onboarding,
3. receives a portfolio recommendation,
4. reaches activation,
5. connects with Privy,
6. funds when ready,
7. signs a CoW order,
8. sees status tracked honestly,
9. and has that journey reflected in operator and partner-visible reporting.

## State-And-Truth Contract

1. `volume` counts only when it is tied to truthful submitted or confirmed execution events.
2. test volume may use an explicitly funded OWS Ethereum wallet or treasury wallet, but it must remain real, attributable, and non-deceptive.
3. no fabricated, mirrored, circular, or wash activity counts as partner proof.
4. frontend `connected`, `funding_required`, and `ready_to_activate` states must be driven by real signals, not placeholders.
5. a green deploy or green package check does not count as authenticated execution proof.
6. Hermes is an operator-controlled agent helper, not an autonomous trader.

## Workstream Map And Sequencing

### Existing workstreams to reuse

1. `XSL-004` frontend experience for homepage and user-facing surface quality.
2. `XSL-005` execution/funding/rails for CoW and wallet/funding stack truth.
3. `XSL-009` gap closure for browser/API proof posture.

### New workstreams created by this control plane

1. [First Authenticated Execution Proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
2. [Partner Tracking And xStocks Reporting Dashboard](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-partner-tracking-and-reporting-dashboard-spec.md)
3. [Hermes Operator Control And Agent Skill Surface](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md)

### Ordered sequence

1. fix homepage quality and frontend activation truth,
2. prove authenticated backend execution,
3. add dashboard/reporting so the proof is externally legible,
4. harden Hermes and the agent skill so the lane is reproducible from the operator side.

## Spec'd-But-Unimplemented Table

| Governing doc | What should exist | What the repo currently proves | What is still missing | Gap type |
| --- | --- | --- | --- | --- |
| `XSL-004`, `XSL-014` | real homepage plus truthful frontend connect/activation state | hosted landing is live, but still intermediary-feeling; Privy button remains stubbed | homepage redesign, real Privy connect, truthful state machine | frontend |
| `XSL-005`, `XSL-014` | authenticated CoW execution lane | CoW quote/submission boundaries exist in code | Privy auth verification, real session ownership, real signed proof | backend logic / data-proof state |
| `XSL-015` | partner-visible dashboard/reporting | no canonical partner surface exists | event ledger, metrics contract, dashboard/export | backend / frontend / data-proof state |
| `XSL-016` | Hermes-usable repo-owned skill and runbook | local qualification skill exists | Hermes runbook, remote proof contract, treasury boundary | ops / data-proof state |

## Derived-Next-Roadmap Table

| Item | Why it follows | Blocked on current closure? | Start now or later? | Extends / supersedes |
| --- | --- | --- | --- | --- |
| Social connect / incentive lane | becomes more valuable once real execution exists | yes | later | extends `XSL-012` |
| Public `skill.md` surface | only justified after the repo-owned Hermes path works | yes | later | extends `XSL-016` |
| Broader partner analytics/warehouse | only useful after the first reporting/dashboard slice exists | yes | later | extends `XSL-015` |
| More execution venues | only useful after CoW proof exists | yes | later | extends `XSL-005` |

## Maintainability And Monolith Audit Contract

Hotspots slowing current closure:
1. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx)
   - Classification: split now.
   - Reason: current stubbed logic needs to become a real provider-bound component rather than a fake UI toggle.
2. [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx)
   - Classification: split later.
   - Reason: it is concentrated, but the immediate problem is state truth rather than file size alone.
3. [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js)
   - Classification: same-tranche beneficial.
   - Reason: auth verification and execution orchestration are converging here, so a dedicated auth module may be needed to keep review and tests targeted.
4. dirty mixed-scope main worktree
   - Classification: split now.
   - Reason: landing work, backend proof, reporting, and Hermes should not land as one giant CPM.

## Implementation-Wave Contract

Wave 1:
1. homepage redesign and frontend activation truth.
2. validation bar = `apps/web` checks plus browser proof and hosted verification.
3. allowed post-wave claim = homepage is real and frontend connect truth is materially closer, but no authenticated backend execution claim yet.

Wave 2:
1. backend Privy auth verification plus signed CoW proof.
2. validation bar = affected package/app checks plus one truthful live proof or exact blocker.
3. allowed post-wave claim = first authenticated execution lane exists to the furthest truthful boundary.

Wave 3:
1. partner dashboard/reporting.
2. validation bar = event reconciliation plus dashboard/export proof.
3. allowed post-wave claim = xstocks can inspect funnel and real execution volume truthfully.

Wave 4:
1. Hermes skill and runbook hardening.
2. validation bar = local skill smoke plus Hermes-operated proof run.
3. allowed post-wave claim = the lane is reproducible from the operator side.

Landing rule:
1. because the diff is too mixed for one honest landing, iterative CPM waves are required rather than one giant commit/push/merge.

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - repo checks, local CLI/API skill verification, local browser/dev proof.
2. deployed-host verified
   - Vercel homepage and route verification,
   - Railway candidate or deployed backend route proof,
   - dashboard candidate proof.
3. production-host verified
   - `https://equityterminal.app/` homepage and route proof,
   - live authenticated execution proof on the real production lane,
   - live reporting surface using production truth.
4. still unproven
   - production authenticated execution,
   - production partner dashboard,
   - production Hermes reproducibility.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Homepage quality | live but still intermediary-feeling | real homepage with header, footer, explanation sections, and browser proof | screenshots and live verification |
| Real Privy frontend connect | 0 | 1 working frontend connect flow | browser proof and route verification |
| Backend Privy verification | 0 | 1 verified backend auth boundary | code, tests, and request proof |
| Real signed CoW proof | 0 | 1 truthful user-approved or treasury-approved test execution reaching submission or exact blocker | order UID, tx hash, or exact blocker report |
| Partner dashboard | 0 | 1 dashboard or export surface with funnel and execution truth | screenshot/export proof |
| Hermes reproducibility | 0 | 1 documented successful Hermes-operated run | transcript or proof bundle |

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Hosted homepage and brand closure | 15 | 8 | live deploy is current, but homepage quality gap remains |
| Frontend activation truth | 20 | 5 | Privy provider exists, connect and state truth do not |
| Backend authenticated execution truth | 30 | 12 | CoW contracts exist, auth and signed live proof absent |
| Dashboard/reporting visibility | 20 | 0 | no dashboard exists |
| Hermes-operated reproducibility | 15 | 2 | SSH/chat path exists outside repo, but no repo-owned proof contract exists |
| Total | 100 | 27 | not ready for real-volume closure |

## Owners And Decision-Rights Contract

1. frontend owner decides homepage and activation UX so long as truth and brand constraints remain intact.
2. backend owner decides auth verification, execution boundaries, and fail-closed behavior.
3. reporting owner decides event ledger, dashboard data model, and partner-safe visibility rules.
4. Hermes owner decides operator runbook, repo skill ergonomics, and remote proof path.
5. only the product owner can approve use of treasury-funded live testing.

## Thread Map

### Resume

1. the active frontend landing thread for the homepage redesign, now narrowed to `/` as a real homepage.
2. `audit smart-account rails (019d489d-6117-7783-98af-2327aa876b6f)` after frontend Privy truth lands.

### Create

1. `xstocks partner dashboard and reporting`
2. `xstocks hermes operator and skill`

## Final Reporting Contract

At the end of this control-plane program, the executor must report:
1. which threads were resumed or created,
2. the canonical workstreams and their current status,
3. the spec'd-but-unimplemented items that existed at the start,
4. the derived roadmap items deferred for later,
5. the slices landed and the files/branches they used,
6. any hotspot files split now versus deferred,
7. exact tests/build/deploy checks run,
8. commit hashes and branches used,
9. what is locally green only,
10. what is deployed-host verified,
11. what is production-host verified,
12. what remains blocked and why.

## Exit Criteria

This control plane is complete enough for the first real volume milestone only when:
1. homepage quality is accepted,
2. real Privy frontend truth exists,
3. backend auth verification exists,
4. one truthful live execution proof exists or the exact blocker is irreducibly external,
5. dashboard/reporting exists,
6. Hermes can reproduce the lane from the repo-owned skill/runbook.
