# Issues

Last updated: 2026-04-01

## Active

### XSL-001 Product Control Plane

- Type: program
- Status: active
- Context: The repo has scaffold docs and a public GitHub presence, but it does not yet have a repo-local execution-grade control plane tying together market intelligence, portfolio construction, frontend, and live rails.
- Suspected cause: Planning has been spread across chat context plus lightweight repo docs, which is enough for ideation but not enough for coordinated execution.
- Fix intent: Create one umbrella control-plane spec plus execution-grade sub-specs for the major workstreams.
- Acceptance criteria:
  1. Umbrella control-plane spec exists in `docs/plans/active/`.
  2. Workstream sub-specs exist for strategy-lab operating model, intelligence, portfolio/rebalancing, frontend, and execution/funding.
  3. The root README links into the planning surface.
  4. The plan set states exact verified rails, product boundaries, and fallback rules.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)

### XSL-002 Market Intelligence Blackbox

- Type: product/data
- Status: active
- Context: The product direction now includes market intelligence as a standalone signal product that should feed portfolio construction through a blackbox signal artifact rather than directly determining trades.
- Suspected cause: The conversation has many signal ideas (`MSTRx`, large holders, Twitter, Nansen, whale tracking) but no frozen contract for how those inputs become one machine-readable signal object.
- Fix intent: Define the market intelligence product, provider mix, signal schema, output semantics, and acceptance bar.
- Acceptance criteria:
  1. Signal engine spec exists.
  2. The spec defines the signal artifact and producer/consumer boundary.
  3. The spec defines hero assets and minimum viable input providers.
  4. The spec defines proof artifacts for a demo-quality intelligence lane.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-market-intelligence-signal-engine-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-market-intelligence-signal-engine-spec.md)

### XSL-003 Portfolio Construction And Rebalancing

- Type: product/runtime
- Status: active
- Context: The portfolio engine needs a separate contract from market intelligence so the signal can remain blackbox while portfolio mapping and rebalance rules remain legible and testable.
- Suspected cause: The current repo docs describe Autopilot and Directional Vault at a high level but do not yet define target-weight translation, incumbent/challenger rules, or rebalance gating.
- Fix intent: Specify allocation mapping, theme baskets, sleeves, challenger/incumbent logic, and rebalance triggers.
- Acceptance criteria:
  1. Portfolio and rebalance spec exists.
  2. The spec defines allocation sleeves and target outputs.
  3. The spec defines rebalance thresholds and anti-thrashing rules.
  4. The spec defines fallback behavior when xStocks live rails are incomplete.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)

### XSL-004 Terminal Frontend Experience

- Type: frontend
- Status: active
- Context: The frontend must bridge trading-app UX and onchain UX, use xStocks styling, support themes/public strategies, and include a bottom blotter for positions/history/activity.
- Suspected cause: Existing frontend docs capture tone and layout direction, but they are not yet execution-grade and do not fully encode the product surface Claude should build from.
- Fix intent: Freeze the terminal-style frontend contract, user journeys, module boundaries, and proof bar.
- Acceptance criteria:
  1. Frontend execution-grade spec exists.
  2. The spec covers home, workspace, detail, activation, and bottom blotter behavior.
  3. The spec encodes theme-led discovery, public strategies, and route/vault transparency.
  4. The spec is suitable as a direct Claude handoff.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)

### XSL-005 Execution, Funding, And Live Rails

- Type: integration
- Status: active
- Context: The product now depends on a specific set of execution, lending, and funding rails: Cow Swap, 1inch, Morpho, Privy, LI.FI, and a mentor-reported Spread Finance path on Ink.
- Suspected cause: The current repo docs mention these rails, but there is no execution-grade definition of how they fit together or what is MVP versus secondary.
- Fix intent: Specify venue adapters, funding provider roles, live-proof hierarchy, and fallback rules.
- Acceptance criteria:
  1. Execution/funding spec exists.
  2. The spec defines primary, secondary, and unverified rails.
  3. The spec defines the funding stack and wallet-activation sequence.
  4. The spec defines proof artifacts for live or dry-run demo closure.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)

### XSL-006 Strategy Lab Operating Model

- Type: research/runtime
- Status: active
- Context: The product now explicitly wants to adapt the `karpathy/autoresearch` workflow contract, but the repo did not yet have one authoritative spec freezing the harness, hot surfaces, manual, results ledger, incumbent/challenger loop, and activation-manifest boundary.
- Suspected cause: Earlier docs described `Autopilot` and `Directional Vault` behavior, but the actual research and promotion contract remained spread across chat context.
- Fix intent: Specify the Strategy Lab operating model as a real workstream with a frozen evaluator, split hot policy surfaces, parseable results, promotion rules, and a clean frontend/activation boundary.
- Acceptance criteria:
  1. Strategy Lab operating-model spec exists.
  2. The spec freezes the prepare/train/program/results mapping in repo terms.
  3. The spec defines the results ledger, activation manifest, and incumbent/challenger loop.
  4. The control plane and dependent specs reference the new workstream instead of implying it indirectly.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)

### XSL-007 Manifest-To-Execution API Boundary

- Type: backend/integration
- Status: completed
- Context: `apps/api` and `packages/policy` are still scaffold-only, but the frontend handoff now depends on stable backend contracts for promoted-manifest recommendation fetch, manifest preflight, activation save, activity read, route truth labels, and smart-account-aware execution-plan derivation.
- Suspected cause: the repo froze the planning surface first, so the manifest-to-execution boundary and persistence layer have not been implemented yet.
- Fix intent: Build the first truthful API/policy boundary from promoted `activation_manifest` inputs only, persist activations plus activity coherently, expose route/vault truth labels, and keep provider-specific execution behind late-bound interfaces without faking live Euler xStocks execution.
- Acceptance criteria:
  1. `apps/api` serves stable endpoints for recommendation fetch, manifest preflight, activation save, and activity read.
  2. `packages/policy` derives an `execution_plan` from promoted manifest data, live xStocks state, live route/vault state, user notional, and wallet/smart-account state.
  3. Route and vault truth labels fail closed for `mentor_confirmed` and `unverified` rails.
  4. Activation and activity records persist coherently without accepting raw strategy candidates.
  5. Smart-account provider scaffolding exists without overbuilding provider-specific funding or execution logic.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-api-activation-boundary-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-03-31-xstocks-api-activation-boundary-implementation.md)
- Executor prompt:
  - Implement this lane only in `apps/api/**` and `packages/policy/**`.
  - Do not accept raw strategy candidates or arbitrary manifest payloads from clients; resolve only promoted manifests by id or slot.
  - Keep execution truthful: verified Ethereum execution rails and Morpho may surface as live when available, but unverified Euler or mentor-reported rails must never surface as live.
  - Add tests covering preflight blocking, preview/readiness transitions, activation persistence, and activity coherence.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification
- Visual/screenshot verification: not applicable for this API and policy-only lane because no served human surface changed.

### XSL-008 xStocks And Rails Adapter Implementation

- Type: backend/integration
- Status: active
- Context: `packages/xstocks` and `packages/euler` are still README-only scaffolds, but downstream frontend and API work now needs deterministic xStocks live-state adapters, route-truth helpers, Morpho rail scaffolding, and Euler directional preview primitives.
- Suspected cause: The repo froze the control-plane and rail specs before any implementation artifacts existed for the adapter layer.
- Fix intent: Implement typed adapter surfaces for official xStocks public endpoints, normalize the live-state strip, and add truthful Morpho/Euler rail helpers without overclaiming live xStocks-on-Euler support.
- Acceptance criteria:
  1. `packages/xstocks` exposes typed adapters for assets, price-data, multiplier, multiplier history, proof-of-reserves, and system status.
  2. `packages/xstocks` exposes route-truth enums/helpers and one normalized state strip payload builder.
  3. `packages/euler` exposes Morpho `SPYx/AUSD` and Flowdesk vault scaffolding plus Euler directional preview primitives.
  4. The adapter layer is frontend-agnostic, deterministic, and explicit about live truth versus stubbed or unverified truth.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-and-euler-adapter-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-and-euler-adapter-implementation.md)
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual or screenshot verification not applicable for this package-only backend lane

### XSL-009 Gap Closure And Readiness

- Type: program/integration
- Status: active
- Context: The non-frontend stack is now locally green across shared contracts, runtime adapters, research, worker, policy, and API, but the repo still lacks one current-state closeout control doc tying those verified lanes to the canonical frontend rewrite, integrated browser proof, and release hygiene.
- Suspected cause: The product was decomposed correctly into workstreams, but the remaining closure work is spread across multiple threads and one contaminated research lane, so thread claims and actual repo proof no longer line up cleanly without a dedicated reconciliation spec.
- Fix intent: Create one execution-grade gap-closure control doc that freezes current verified truth, defines the exact step-by-step end-to-end closure sequence, keeps directional preview-only, and states what must happen in order before the whole app can be used coherently from onboarding through preview and activation readiness.
- Acceptance criteria:
  1. A closeout control-plane spec exists and explicitly reconciles spec requirements, thread claims, current code, and proof status.
  2. The spec includes an ordered step-by-step executor runbook for getting the app coherent end to end.
  3. The canonical frontend lane is verified against API-backed data with browser-clickable proof rather than endpoint-only checks.
  4. Remaining partial lanes are classified explicitly as close-now, defer, or open-a-clean-follow-up-thread.
  5. Release hygiene and landing posture are tracked explicitly instead of being implied by green package tests.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)

### XSL-010 Portfolio Explainability And Autoresearch Interpretability

- Type: product/frontend/research
- Status: active
- Context: The repo now has a proven autoresearch loop, promoted manifests, API-backed frontend routes, and a qualification flow, but the product still feels too black-box. Landing and onboarding copy do not clearly introduce xStocks portfolios, the preview/detail surfaces do not yet explain the portfolio in plain language strongly enough, and operators still lack an explicit tuning rubric for interpreting autoresearch outputs beyond raw metrics.
- Suspected cause: The current workstream set defined portfolio construction, frontend shells, and Strategy Lab promotion separately, but no single spec owned the explanation boundary from promoted research output to user-facing interpretation and operator tuning.
- Fix intent: Create one execution-grade interpretability spec that defines the xStocks-first hook, the portfolio explanation surfaces, the promoted explanation-field contract, the replay/visualisation interpretation rules, and the operator tuning loop derived from autoresearch outputs.
- Acceptance criteria:
  1. A dedicated interpretability spec exists in `docs/plans/active/`.
  2. The spec defines what the user must be able to understand on landing, onboarding, preview, detail, and comparison routes.
  3. The spec defines what promoted research artifacts must expose for explanation and what remains operator-only.
  4. The spec defines how autoresearch results should be interpreted and used to tune the basket loop.
  5. The closeout control doc treats explainability as a real closure requirement rather than a vague polish item.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md)

### XSL-011 Rebalance Automation And Execution Orchestration

- Type: runtime/integration
- Status: active
- Context: The repo now proves research, portfolio recommendation, promoted manifests, API reads, and preview/readiness surfaces, but it still does not prove how live rebalancing and execution automation would actually happen. There is no current repo proof for a live scheduler, workflow, keeper, Chainlink CRE, CCIP, or onchain rebalance executor.
- Suspected cause: rails, rebalance semantics, and automation were discussed together, but no single workstream owned trigger source, orchestration, operator override, and provider-truth proof.
- Fix intent: Create one execution-grade automation/orchestration spec that freezes trigger-source ownership, scheduler/workflow boundaries, smart-account execution staging, provider-truth classification, and proof artifacts for any live automation claim.
- Acceptance criteria:
  1. A dedicated automation/orchestration spec exists in `docs/plans/active/`.
  2. The spec defines what currently exists in repo truth versus what is still unproven.
  3. The spec defines trigger sources, operator override, and scheduler ownership explicitly.
  4. The spec defines how Chainlink/cron/workflow claims must be classified and proven.
  5. The umbrella control plane links this workstream explicitly instead of hiding it under generic rails language.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md)

### XSL-012 Social Connect, Incentive, And Agent Wallet

- Type: product/identity/integration
- Status: active
- Context: xstocks now has qualification, recommendation, preview, activation-readiness, and wallet-direction scaffolding, but it still lacks a real identity-capture and retention lane. The desired next step is to add Twitter / X OAuth on the dashboard, offer a bounded `$5` connect incentive, and create a wallet path that reduces onboarding friction for the user and the agent context.
- Suspected cause: current repo work focused on manifests, research, preview UX, and execution-readiness, while user/session identity, consent, rewards, and wallet bootstrap remained outside the first implementation tranche.
- Fix intent: create one execution-grade workstream for X connect, explicit follow-up consent, one-time onboarding credit, and user-owned agent-friendly wallet bootstrap.
- Acceptance criteria:
  1. A dedicated social-connect spec exists in `docs/plans/active/`.
  2. The spec defines the X connect flow, consent boundary, reward model, and wallet bootstrap model.
  3. The spec defines explicit backend ownership for identity, reward, and wallet truth.
  4. The spec defines dashboard placement and proof artifacts.
  5. The spec keeps the agent wallet bounded and user-owned rather than autonomous or free-custody.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md)

### XSL-013 First Real Volume Control Plane

- Type: program
- Status: active
- Context: the landing/favicon deploy is live on Vercel, the backend rails and CoW contracts are materially stronger, and Railway/Vercel split is now explicit, but the product still lacks the ordered control plane from homepage truth to authenticated execution proof, partner-visible reporting, and Hermes-operated live testing.
- Suspected cause: current planning stops at browser/demo closure and does not yet own the combined gap between real homepage quality, Privy truth, authenticated CoW proof, reporting, and remote-agent execution testing.
- Fix intent: create one execution-grade control-plane spec for the first truthful volume path, including the exact sequencing across frontend closure, authenticated execution proof, partner reporting, and Hermes-operated testing.
- Acceptance criteria:
  1. A new control-plane spec exists in `docs/plans/active/`.
  2. The spec reconciles current frontend, backend, deploy, and ops truth instead of reusing older optimistic thread language.
  3. The spec maps existing workstreams that should be reused and new workstreams that must be created alongside them.
  4. The spec defines an explicit thread map for what to resume versus what to create next.
  5. The spec states that real volume must mean truthful user-approved or treasury-approved test execution rather than fabricated or wash activity.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-first-real-volume-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-real-volume-control-plane.md)

### XSL-014 First Authenticated Execution Proof And Production Closure

- Type: frontend/backend/integration
- Status: active
- Context: the current live site serves the new Equity Terminal landing and icon, but the frontend still lacks real Privy connect truth, `apps/api` still lacks Privy auth verification, and the repo still lacks one real authenticated user-approved CoW submission proof plus operator visibility.
- Suspected cause: frontend closure and backend rail work progressed in separate threads, leaving the exact `connect -> fund -> sign -> submit -> track` proof boundary unfinished.
- Fix intent: create one execution-grade workstream that closes the first truthful activation lane from real homepage through authenticated Privy session, user-approved CoW execution, and operator-visible production proof.
- Acceptance criteria:
  1. Homepage quality is upgraded from intermediary card to real homepage without regressing brand hierarchy or honesty.
  2. Frontend Privy connect is real and activation state is truthful.
  3. Backend verifies Privy auth using configured secret/JWKS inputs.
  4. One real small user-approved CoW execution reaches the furthest truthful boundary possible, with exact blocker stated if it still cannot complete.
  5. Operator visibility and alerting for this lane are present enough that the product can be called deployable only when that proof exists.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
- Continuation note:
  - Date: 2026-04-01
  - Scope freeze: continue only in `apps/api/**`, `packages/shared/**`, `packages/policy/**`, `packages/xstocks/**`, and `apps/worker/**` only if runtime truth strictly requires it. Do not touch `apps/web`, do not reopen homepage/frontend/auth lanes unless quoteability work proves a remaining auth/readiness mismatch, and do not reopen 1inch, Bridge, CRE, Chainlink, issuer, or Hermes lanes.
  - Verified starting truth from the latest handoff: backend Privy auth verification is real, authenticated owner binding is real, readiness for the current Ethereum basket CoW lane was aligned away from the stale manifest `minFundingUsd: 1000` plus mandatory smart-account default, activation can reach `ready`, execution request creation works, and live CoW quote attempts reach the external venue boundary.
  - Newly verified continuation finding: the current execution leg builder selects the generic Ethereum `deployment.address` as the CoW buy token, but the xStocks execution-route surface also exposes a `wrapperAddress`. Live probing for the promoted basket shows NVDAx fails with `NoLiquidity` at the current `$4.50` leg when using `deployment.address`, while the corresponding `wrapperAddress` quotes successfully at the same ticket size. This lane must resolve route-token selection and exact quote diagnostics before declaring the `$25` basket structurally unquoteable.
  - Acceptance addendum: treat the current basket as structurally unquoteable only if the promoted basket still cannot reach the next truthful user-approved execution boundary after route-correct token selection and fail-closed per-leg venue diagnostics.
- Executor prompt:
  - Trace the exact CoW quote-construction path from promoted basket split to per-leg quote payloads and failure mapping.
  - Fix only the narrow backend truth mismatch needed to align CoW token selection and basket quote diagnostics with live venue behavior.
  - Keep the one small mainnet proof capped at `$25` gross and user-approved only.
  - Stop at the first exact external blocker if a real signed submission still cannot happen.
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] visual/screenshot verification not applicable unless a hosted auth/readiness mismatch is rediscovered

### XSL-015 Partner Tracking And xStocks Reporting Dashboard

- Type: product/data
- Status: active
- Context: xstocks needs a truthful dashboard showing user funnel state, wallet connection state, activation progress, and real execution volume, but the repo currently has no user/session model, no partner-facing reporting surface, and no durable funnel/event ledger.
- Suspected cause: current implementation focused on qualification, recommendation, and execution truth before analytics/reporting ownership was frozen.
- Fix intent: create one execution-grade dashboard/reporting workstream for operator and xstocks-visible tracking, including event contracts, state transitions, partner-safe metrics, and proof/export surfaces.
- Acceptance criteria:
  1. A dedicated dashboard spec exists in `docs/plans/active/`.
  2. The spec defines the canonical funnel and execution event ledger.
  3. The spec defines internal versus partner-visible metrics and privacy rules.
  4. The spec defines the first dashboard/API/export proof surface.
  5. The spec ties reported volume to truthful submitted/confirmed execution state instead of fabricated or ambiguous counts.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-partner-tracking-and-reporting-dashboard-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-partner-tracking-and-reporting-dashboard-spec.md)
- Executor prompt:
  - Implement the first truthful reporting slice in `xstocks-strategy-lab` only.
  - Limit code changes to `apps/api/**` and `packages/shared/**`, and touch `apps/web/**` only if an operator-safe route truly cannot live in the API alone.
  - Define the canonical reporting ladder explicitly, but fail closed for any pre-activation stage the repo does not durably capture yet.
  - Derive reported volume only from repo-owned submitted or confirmed execution truth, never from preview, connect, quote, or recommendation activity.
  - Keep distinct users and wallets separate in the reporting contract, hide wallet addresses by default, and surface the exact blockers preventing full funnel truth.
  - Add tests proving route/export output and a reconciliation that ties reported submitted and confirmed USD volume back to the stored execution requests.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual or screenshot verification not applicable for this API-only reporting lane
- Verification note:
  - First truthful slice shipped as the operator-token-gated route `/api/reporting/xstocks`, backed by repo-owned activation and execution state only.
  - Reported submitted and confirmed USD volume now reconciles directly to stored execution legs; preview, connect-only, and quote-only activity remains excluded.
  - Remaining blocker: the repo still has no canonical pre-activation funnel ledger or partner self-serve auth model, so landing/onboarding/qualification/recommendation/activation-view metrics remain unavailable and wallet-connected counts stay lower-bound.
- Follow-on tranche:
  - Build the repo-owned canonical xstocks funnel/event ledger in `packages/shared`, `apps/api`, and the narrowest truthful `apps/web` emission hooks only.
  - Add canonical capture for `landing_viewed`, `onboarding_started`, `qualification_completed`, `portfolio_recommended`, `activation_viewed`, and `wallet_connected`.
  - Keep anonymous funnel subjects distinct from authenticated users and wallet addresses; do not infer identity continuity the repo cannot prove.
  - Move reporting from missing or lower-bound coverage to canonical coverage wherever the ledger provides first-party truth, and leave `funding_required` explicitly lower-bound unless repo proof improves.
- Latest verification note:
  - Canonical funnel events now persist in `runtime-store` and feed `/api/reporting/xstocks`.
  - `landing_viewed`, `onboarding_started`, `qualification_completed`, `portfolio_recommended`, `activation_viewed`, and `wallet_connected` now report from the ledger rather than from missing coverage or activation-save inference.
  - Remaining blocker: `funding_required` is still lower-bound from saved activation snapshots because the repo still lacks a canonical pre-save funding-state event.

### XSL-016 Hermes Operator Control And Agent Skill Surface

- Type: ops/product
- Status: active
- Context: the user now wants to drive xstocks testing through a controllable operator-managed Hermes host, fund an OWS Ethereum wallet or treasury for real testing, and make the agent skill surface work well, but the repo currently only has one repo-local qualification skill and no Hermes-owned runbook or proof contract.
- Suspected cause: earlier xstocks planning centered on human web flows and backend rails, leaving remote-agent control, treasury-funded testing boundaries, and skill ergonomics outside the first tranche.
- Fix intent: create one execution-grade workstream for Hermes-operated xstocks testing, including the repo-owned skill surface, remote-agent runbook, wallet/treasury boundaries, and proof rules for real agent-assisted execution testing.
- Acceptance criteria:
  1. A dedicated Hermes/agent-skill spec exists in `docs/plans/active/`.
  2. The spec defines the immediate repo-owned agent surface versus any later public `skill.md` surface.
  3. The spec defines safe wallet/treasury funding and live-test boundaries.
  4. The spec defines how Hermes should prove qualification, activation truth, and execution progress without overclaiming autonomy.
  5. The spec defines proof artifacts for a successful Hermes-operated test run.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md)
