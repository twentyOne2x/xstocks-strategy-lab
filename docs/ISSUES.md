# Issues

Last updated: 2026-04-02

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
- Continuation note:
  - Date: 2026-04-01
  - Scope freeze: align only the current Ethereum basket lane truth in `packages/policy/**`, `apps/api/**`, and `apps/web/**`; do not reopen CRE, Mesh implementation, or downstream hosted execution-closure claims.
  - Verified starting truth: local policy and the current live default-basket catalog now treat the CoW basket as linked-wallet-first with `requiresSmartAccount=false` and `minFundingUsd=0`, while the truthful public deposit story remains narrower than a generic hosted on-ramp.
  - Live host update on 2026-04-01: Railway serves `/api/public-agent-handoff`, `/health`, and `/api/catalog` with the default basket wallet metadata aligned to current readiness truth (`requiresSmartAccount=false`, `minFundingUsd=0`) even though full hosted execution closure remains open.
  - Acceptance addendum: close this lane only by making promoted-manifest exports, readiness output, saved activation truth, and public wording all describe the current basket as linked-wallet-first, smart-wallet-optional, and Mesh-absent, while keeping full hosted execution closure explicitly open.
- Executor prompt:
  - Canonicalize basket-lane wallet requirements at the policy layer so exported promoted-manifest metadata no longer contradicts readiness truth.
  - Tighten API and frontend wording so deposit surfaces state “no fixed minimum in policy / user-chosen notional” and avoid smart-wallet-required or live CRE claims.
  - Verify with the requested local tests plus live Railway health/catalog probes, and keep the residual hosted execution gap explicitly owned by `XSL-014`.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification
- Post-proof reconciliation note:
  - `curl -sS https://api-production-e70b.up.railway.app/health` now responds cleanly, and `curl --max-time 15 -sS 'https://api-production-e70b.up.railway.app/api/catalog?limit=2'` returns the default basket with `walletRequirements.requiresSmartAccount=false` and `walletRequirements.minFundingUsd=0`.
  - `curl -sS https://equityterminal.app/skill.md` now serves the current public-safe copy: late wallet connect, no public CRE claim, and wallet-funded self-serve deposit truth only.
  - Strict no-KYC/no-KYB on-ramp still does not exist. Wallet-funded USDC deposit remains the only truthful self-serve path; `privy_card` and `privy_exchange` remain optional hosted convenience rails that may require regulated verification.
  - Full hosted execution closure remains partial and stays owned by `XSL-014`.

### XSL-005A Strict Self-Serve Deposit Truth Alignment

- Type: integration/copy/policy
- Status: completed
- Canonical owner lane: `XSL-005`
- Date opened: 2026-04-01
- Context: The current basket-lane funding surfaces still describe Privy funding too generically on policy, activation, and public helper surfaces. That leaves room to read card or exchange funding as the default self-serve path even though the strict product truth is narrower: self-serve means no new KYC/KYB and the canonical deposit path is an external-wallet, same-chain transfer into the revealed destination.
- Suspected cause: The repo froze provider choices before it froze the exact user-facing classification of each funding surface, so `privy_card`, `privy_exchange`, `privy_wallet`, and `manual_transfer` were all exposed without one explicit no-KYC/no-KYB default.
- Fix intent: Align policy, activation copy, public skill text, and active specs so the canonical self-serve deposit path is wallet-funded only; `privy_card` and `privy_exchange` remain optional hosted convenience rails that may require regulated on-ramp verification; Mesh remains explicit absent/deferred.
- Acceptance criteria:
  1. `packages/policy/**` classifies `privy_wallet` and `manual_transfer` as the clean wallet-funded self-serve path for the current basket lane.
  2. `packages/policy/**` no longer treats `privy_card` or `privy_exchange` as the canonical self-serve default.
  3. `apps/web/src/components/activation-screen.tsx` and `apps/web/public/skill.md` describe self-serve deposit as external wallet transfer / manual same-chain transfer only, while keeping card and exchange rails optional and verification-dependent.
  4. The active execution/funding and terminal frontend specs say the same thing and keep Mesh explicit absent/deferred.
  5. Verification includes `node --test packages/policy/test/policy.test.js`, `pnpm --filter @xstocks-strategy-lab/web build`, and grep or route checks showing the updated wording on activation/public surfaces.
- Complexity: medium
- Plan: [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
- Executor prompt:
  - Touch `packages/policy/**`, `apps/web/**`, `apps/web/public/skill.md`, and the active docs only as needed to freeze the no-KYC/no-KYB deposit truth.
  - Keep `privy_wallet` plus `manual_transfer` as the clean self-serve wallet-funded path.
  - Reclassify `privy_card` and `privy_exchange` as optional hosted convenience rails that may require regulated on-ramp verification.
  - Keep Mesh explicit absent/deferred and do not implement or widen into `XSL-011B`.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] surface wording checks
- Resolution note:
  - `packages/policy/src/execution-plan.js` now makes wallet-funded transfer the canonical self-serve path by recommending `privy_wallet` and `manual_transfer` while leaving `privy_card` and `privy_exchange` available only as optional hosted convenience rails with regulated-verification language.
  - `apps/web/src/components/activation-screen.tsx` and `apps/web/public/skill.md` now say strict self-serve deposit is external wallet transfer / manual same-chain transfer only, keep the user-chosen notional truth, and keep Mesh explicit absent.
  - `docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md` and `docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md` now freeze the same classification for the active product specs.
  - Verification passed with `node --test packages/policy/test/policy.test.js`, `pnpm --filter @xstocks-strategy-lab/web build`, and grep checks on the activation/public wording surfaces.

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

### XSL-006A Deployed Recurring Autoresearch Scheduler Host

- Type: runtime/deployment
- Status: completed
- Canonical owner lane: `XSL-006`
- Date opened: 2026-04-01
- Context: This closure slice is now proven on the live repo-owned host. Railway cron service `autoresearch-worker` in project `xstocks-strategy-lab-preview` / environment `production` owns recurring autoresearch, the live proof surface persists run id `autoresearch_20260401T170541978z_bd9d4900`, and current runtime truth is `truthBoundary=railway_cron_service` with `recurringAutonomousProven=true`. GitHub Actions and Vercel remain non-owning surfaces for this lane.
- Suspected cause: The lane was originally open because the repo shipped the worker CLI and local cadence model before a deployed repo-owned scheduler host and receipt path existed.
- Fix intent: Close the lane by proving one narrow repo-owned recurring host, capturing host-level receipts, and keeping the ownership boundary explicit instead of widening into GitHub Actions or Vercel.
- Acceptance criteria:
  1. Repo-owned recurring host is proven with exact host/service, cadence, last run, next run, and runtime/log evidence.
  2. The chosen surface is classified explicitly as Railway cron service `autoresearch-worker`, and GitHub Actions plus Vercel are confirmed non-owning surfaces.
  3. `apps/api` exposes only the narrow runtime-proof surface needed for later audits.
  4. Current repo truth is `truthBoundary=railway_cron_service` with `recurringAutonomousProven=true`; `worker_runtime_only` is no longer current truth.
  5. Closure stays bounded to runtime proof rather than reopening broader automation ownership.
- Complexity: medium
- Plan: [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md)
- Resolution note: Chosen scheduler surface is Railway cron service `autoresearch-worker` in project `xstocks-strategy-lab-preview` / environment `production`. The live API proof surface now shows the first scheduled host receipt at run id `autoresearch_20260401T170541978z_bd9d4900`, started `2026-04-01T17:05:41.978Z`, completed `2026-04-01T17:05:42.918Z`, proof captured `2026-04-01T17:05:42.921Z`, deployment `38862730-0d6a-42f7-8246-b639ea48a9c3`, snapshot `116ecc2e-ca12-4a9f-b6c8-ec3898419779`, and cron schedule `5 17 * * *`. The next host tick is deterministically derived from the live cron schedule as `2026-04-02 17:05 UTC`, and repo truth is now `railway_cron_service` rather than `worker_runtime_only`.
- Revalidation note: Re-audited from current live access at `2026-04-01T17:15:27Z`. `railway whoami` still succeeds, GitHub Actions ownership remains absent, the workspace still has no local Vercel link or `vercel` CLI, `GET /api/runtime/autoresearch?limit=1` still returns the `autoresearch-worker` Railway cron receipt, and `railway ssh -s api cat /app/apps/api/data/runtime-store.json` persists the same runtime and receipt metadata live.
- Executor prompt:
  - Audit Railway, GitHub Actions, and Vercel ownership for the autoresearch recurring lane using current live access.
  - If no recurring host already exists, implement the narrowest truthful scheduler path in `apps/worker` plus deployment/runtime config only.
  - Touch `apps/api` only if one tiny receipt or runtime-proof surface is needed so later verification does not require SSH.
  - Capture real deployed receipts before changing repo truth, and fail closed at the first exact deploy blocker if the host still cannot be established.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification not applicable because this lane is worker/deploy/runtime only

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
- Reconciliation state: partial
- Context: The closeout control doc now exists, non-frontend checks/build/Prisma are green, and key hosted routes plus the Railway API are live, but the repo still lacks one canonical browser proof pack and the served frontend still overstates some live and automation truth relative to the current API/runtime boundary.
- Suspected cause: Implementation landed across frontend, auth, reporting, and agent lanes faster than the final host-versus-repo reconciliation pass, so old planning assumptions and current production proof drifted apart.
- Fix intent: Keep one canonical closeout owner that reconciles route truth, browser proof, hosted drift, and final residual backlog ordering without reopening already-proven backend lanes.
- Acceptance criteria:
  1. A closeout control-plane spec exists and explicitly reconciles spec requirements, thread claims, current code, and proof status.
  2. The spec includes an ordered step-by-step executor runbook for getting the app coherent end to end.
  3. The canonical frontend lane is verified against API-backed data with browser-clickable proof rather than endpoint-only checks.
  4. Remaining partial lanes are classified explicitly as close-now, defer, or open-a-clean-follow-up-thread.
  5. Release hygiene and landing posture are tracked explicitly instead of being implied by green package tests.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
- Latest reconciliation note:
  - `git diff --check` passed, but the repo now contains the active implementation tranche and proof artifacts, so release hygiene is still pending landing rather than fully closed.
  - `pnpm --dir packages/shared check`, `packages/xstocks`, `packages/euler`, `packages/research`, `packages/policy`, `apps/api`, `apps/worker`, and `apps/web` all passed; `pnpm --dir apps/web build`, `pnpm run prisma:generate`, and `DATABASE_URL=... pnpm run prisma:validate` also passed.
  - Hosted `/`, `/onboarding`, `/workspace/comparison`, `/activate/ai-infra-autopilot`, `/ops/xstocks`, and Railway `/health` plus `/api/public-agent-handoff` all respond.
  - Hosted `https://equityterminal.app/skill.md` and the default-basket Railway catalog wallet metadata now match the current public-safe linked-wallet-first truth on key public-safe points.
  - Remaining closeout blockers are exact: no browser screenshot or console proof pack, hosted UI still contains `Chainlink CRE` or `Status live` copy that out-runs the production API, and hosted ops/reporting tokens are still missing.

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
- Continuation note:
  - Date: 2026-04-01
  - Scope freeze: close the next focused XSL-010 tranche only in `apps/web/**` and `packages/policy/src/qualification-catalog.js`; add universal skip/not-sure UX where product-safe, strengthen promoted-manifest explanation on onboarding/gate/comparison/detail/activation, and do not reopen landing redesign, execution logic, CRE, runtime work, or `XSL-011B`.
  - Verified local truth: the questionnaire now exposes one consistent skip/not-sure action on every current question; policy keeps deterministic fail-closed defaults; certainty skip resolves to the exploring path while explicit `default_requested` remains the stronger safe-default request.
  - Verification: `pnpm --filter @xstocks-strategy-lab/web build`, `node --test packages/policy/test/policy.test.js`, and `pnpm --filter @xstocks-strategy-lab/web test` passed on 2026-04-01. Browser screenshots were captured under `/tmp/xsl-010-browser` for onboarding entry, onboarding gate, onboarding workspace, comparison, and detail.
  - Remaining blocker for full `XSL-010` closure: this tranche does not yet close the landing-hook rewrite or the operator-facing autoresearch tuning rubric/proof path defined in the owner spec.
- Executor prompt:
  - Keep skip/not-sure truthful and product-safe, keep qualification deterministic and fail closed, and only add explainability blocks that improve the promoted-manifest-only path without turning the landing page into a portfolio workspace.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification

### XSL-010A API-Backed Replay And Market Intelligence Surface

- Type: backend/frontend/integration
- Status: completed
- Canonical owner lane: `XSL-010`
- Date opened: 2026-04-01
- Context: The onboarding post-questionnaire gate and workspace surfaces already render replay stats, allocation rows, and market-intelligence cards, but the current web adapter still synthesizes several of those values locally from validation score and hard-coded copy instead of reading one truthful backend surface.
- Suspected cause: the promoted manifest generation path in `packages/research` and normalization path in `packages/policy` never carried replay snapshots, replay curves, or explicit market-intelligence signal objects forward into the API contract, so `apps/web/src/lib/api-adapter.ts` and `apps/web/src/lib/data-source.ts` filled the gap with formulas, templates, and canned strings.
- Fix intent: Make promoted manifests carry real replay performance data, replay points, and market-intelligence signals derived from the research evaluation output, pass them through the API, and have onboarding/workspace render that backend truth instead of local mock fallbacks.
- Acceptance criteria:
  1. `packages/research/**` promoted manifests carry a replay surface with real starting capital, ending capital, net return, max drawdown, turnover, win rate, and replay points derived from the research evaluation output.
  2. `packages/research/**` and `packages/policy/**` carry a market-intelligence surface with real current-view, horizon, what-changed, and driver rows derived from promoted research output rather than local frontend stubs.
  3. `apps/api` manifest responses for catalog, workspace, activation-preview, and activity pass those replay and market-intelligence fields through in `buildManifestView()`.
  4. `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api-adapter.ts`, and `apps/web/src/lib/data-source.ts` consume the new API fields and stop synthesizing replay stats, replay curve templates, turnover, driver rows, what-changed, current-view, and horizon locally for API-backed manifests.
  5. Allocation rows shown on onboarding/workspace remain driven by manifest target allocations plus live-state enrichment, with no local mock allocation fallback when API data is present.
  6. Verification includes focused research or policy contract checks, targeted API tests, and targeted web tests proving the server-derived replay and intelligence values round-trip into the frontend contract.
- Complexity: medium
- Executor prompt:
  - Touch `packages/research/**`, `packages/policy/**`, `apps/api/**`, `apps/web/**`, and the issue or plan artifacts needed for this slice.
  - Keep the source of truth in the promoted manifest and API: derive replay and intelligence from promoted research output, route validation, and wallet requirements rather than duplicating heuristics in the browser.
  - Do not widen this slice into landing redesign, activation copy churn, execution-path changes, or new research generation logic.
  - Add focused tests that prove promoted manifests, catalog/workspace manifests, and the frontend adapter expose the same replay and intelligence truth.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification
- Plan: [2026-04-01-xstocks-api-backed-replay-and-market-intelligence-surface.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-api-backed-replay-and-market-intelligence-surface.md)
- Resolution note:
  - `packages/research/src/evaluate.js` and `packages/research/src/incumbents.js` now derive a real `replay` surface plus `marketIntelligence` surface from research evaluation output, and the regenerated onboarding promoted manifests now differ by portfolio instead of sharing canned replay stats. Current ending-capital examples are `1212.52` for `onboarding.default_basket`, `1237.93` for `onboarding.alt_basket_1`, and `1218.44` for `onboarding.alt_basket_2`.
  - `packages/policy/**` now validates and preserves replay points, turnover, win rate, and market-intelligence drivers or narratives, while `apps/api/src/services/api-service.js` passes those fields through in `buildManifestView()` for catalog and workspace consumers.
  - `apps/web/src/lib/api-adapter.ts` now reads API replay metrics, replay points, turnover, and market-intelligence text directly, and `apps/web/src/lib/data-source.ts` now builds charts from `manifest.replay.points` instead of slug-based replay templates.
  - Verification passed with `node --test packages/research/src/__tests__/promoted-manifests.test.js`, `node --test packages/policy/test/policy.test.js`, `node --test apps/api/test/api.test.js`, `pnpm --filter @xstocks-strategy-lab/web test`, `pnpm --dir apps/web build`, and `pnpm --dir apps/web exec tsc --noEmit` after the build populated `.next/types`. The web build still emits the pre-existing non-blocking `@privy-io/react-auth` optional-module warning and existing unused-import warnings in `apps/web/src/components/onboarding-terminal-experience.tsx`.
- Visual verification note:
  - Browser or screenshot proof was not captured in this turn, so the data-surface closure is backed by manifest, API, adapter, test, build, and typecheck verification rather than UI screenshots.

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

### XSL-011A Truthful CoW Manual Rebalance Boundary

- Type: runtime/integration
- Status: completed
- Canonical owner lane: `XSL-011`
- Date opened: 2026-04-01
- Context: Audit confirmed the repo already owns the truthful backend rebalance runtime in `packages/policy`, `apps/worker`, and `apps/api`: promoted-manifest drift derives one rebalance orchestration snapshot, scheduled worker review only queues manual review, and the CoW lane stages quote, approval, submission, and receipt bookkeeping without claiming autonomous execution. The stale gap was in owner-lane documentation and proof reporting, not in the core runtime path.
- Suspected cause: the owner-lane issue text lagged behind the shipped backend/runtime implementation and incorrectly described the manual CoW path, scheduled review shell, and provider-trigger boundary as missing.
- Fix intent: Freeze the truthful boundary by documenting the exact rebalance state machine, proving the existing manual/operator CoW path and scheduled review loop through tracked tests, and stopping the Chainlink/CRE lane at the explicit fail-closed provider boundary because no real Chainlink proof exists in repo truth.
- Acceptance criteria:
  1. The repo can derive one truthful rebalance orchestration result from promoted-manifest drift plus live/readiness truth.
  2. A manual/operator CoW rebalance request can be staged, approved, submitted, and confirmed through repo-owned contracts without implying autonomous execution.
  3. A regular worker review loop, if present, only queues or recommends review and never bypasses operator approval.
  4. The Chainlink-oriented trigger surface is explicitly classified and fail-closed when repo proof is absent.
  5. The final verification states exactly what is local-only, what is live/manual, and what remains unproven.
- Complexity: medium
- Plan: [2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md)
- Executor prompt: Audit the rebalance path from promoted manifest drift to operator action, verify the existing manual/operator CoW path and scheduled review loop through tracked tests, and keep the Chainlink/CRE lane fail closed unless repo-owned provider proof exists.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification not applicable because no human-facing surface is being changed
- Verification note:
  - Policy truth is owned in `packages/policy/src/rebalance-orchestration.js`: supported trigger sources remain `operator_manual` and `scheduled_cron`; provider-triggered rebalance stays blocked with explicit Chainlink-oriented fail-closed blockers.
  - Worker truth is owned in `apps/worker/src/rebalance-orchestrator.js`: scheduled review can evaluate or queue a manual window, but transitions remain explicit and bounded to manual state changes.
  - Manual/live CoW truth is owned in `apps/api/src/services/api-service.js`: execution requests stay `operator_manual`, the user must approve/sign before submission, and receipt/venue status are persisted as audit truth.
  - `node --test packages/policy/test/policy.test.js` passed with 21/21 tests.
  - `node --test apps/worker/src/__tests__/rebalance-orchestrator.test.js` passed with 4/4 tests.
  - `node --test --test-name-pattern "workspace and activity surfaces expose a recommended rebalance when the slot baseline trails the promoted manifest|authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet|execution quote, approval, submission, and receipt actions persist live CoW truth|execution quote failures persist exact CoW request diagnostics instead of a generic blocker|execution records a failed CoW venue state when the venue invalidates the order" apps/api/test/api.test.js` passed for 5 targeted API rebalance/CoW tests.
  - `node --test --test-name-pattern "workspace and activity surfaces expose scheduled worker-owned review without claiming autonomous execution" apps/api/test/api.test.js` passed for the scheduled manual-review API surface.
  - Real Chainlink Automation / CRE proof does not exist in repo truth. Exact blocker: no repo-owned provider adapter, no signed-event validation path, and no provider proof artifact showing a live Chainlink-triggered rebalance.

### XSL-011B CRE / Provider-Triggered Rebalance Review Ingress

- Type: runtime/integration/api
- Status: active
- Reconciliation state: accepted-path proven / real provider signer pending
- Canonical owner lane: `XSL-011`
- Date opened: 2026-04-01
- Context: `XSL-011A` froze the truthful manual CoW boundary and the fail-closed provider-triggered gap. The next narrow lane is to add one real provider-triggered review ingress in `apps/api` that can authenticate signed provider events, persist both accepted and rejected receipts, recompute rebalance truth from current repo state, and open `awaiting_operator` only. The repo still must not allow provider events to quote, create, sign, submit, or confirm CoW execution autonomously.
- Suspected cause: the codebase already had rebalance state contracts and a truthful manual CoW execution path, but no authenticated provider-event schema, no ETH-JWT validation path, no dedupe/replay ledger for provider deliveries, and no repo-owned proof artifact for a live signed provider review event.
- Fix intent: ship the first real CRE/provider-triggered rebalance review lane only, with ETH-JWT validation, signer allowlist checks, digest binding, dedupe/replay protection, durable receipt persistence, and a deployed API ingress proof that stops at operator review.
- Acceptance criteria:
  1. A provider-event request schema and persisted receipt schema exist under `packages/shared/**` and are consumed by `apps/api`.
  2. `apps/api` exposes one deployed ingress route for signed provider-triggered rebalance review events.
  3. The route validates ETH-JWT signature, signer allowlist membership, request-digest binding, duplicate delivery, and replay attempts before any rebalance state change.
  4. Accepted and rejected provider receipts persist durably with exact acceptance or rejection reasons.
  5. Valid review-only events recompute current runtime truth and may open `awaiting_operator`, but never create or submit CoW execution.
  6. Local tests cover shared boundary truth, policy review gating, and API/provider-ingress behavior.
  7. One deployed signed-event proof is captured, or one exact deploy blocker is recorded if the proof still cannot be completed.
- Complexity: medium
- Plan: [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
- Executor prompt:
  - Implement `XSL-011B` only in `packages/shared/**`, `packages/policy/**`, and `apps/api/**`, using `apps/worker/**` only if a local replay helper is truly needed.
  - Add signed provider-event request and receipt contracts, a repo-owned ETH-JWT validation path, and durable receipt persistence for both accepted and rejected events.
  - Keep the provider lane review-only: valid events may open `awaiting_operator`, but must not create, quote, sign, submit, or confirm CoW orders.
  - Recompute rebalance truth from current promoted manifest, live state, and stored activation/runtime context rather than trusting provider payloads alone.
  - Capture one deployed proof event against the API receiver before calling the lane closed, or stop with one exact blocker if deployed proof is still impossible.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] deployed proof captured
- Verification note:
  - Shared request and receipt contracts, API-side ETH-JWT validation, signer allowlist checks, request-digest binding, dedupe or replay protection, durable provider receipt persistence, and the deployed ingress route now exist in repo truth under `packages/shared/**`, `packages/policy/**`, and `apps/api/**`.
  - `node --test packages/shared/test/rebalance.test.js`, `node --test packages/policy/test/rebalance-policy.test.js`, `node --test apps/api/test/rebalance-service.test.js`, and `node --test apps/api/test/provider-rebalance-api.test.js` all passed after the ingress implementation landed.
  - Production now has `XSTOCKS_PROVIDER_REBALANCE_JWT_AUDIENCE=xstocks-provider-rebalance-review` plus a signer allowlist entry, and the live receiver accepted a signed review-only probe with receipt `provider_receipt_c3a08c54-28ba-4fbe-91ee-13d729cefb0f`.
  - The accepted live probe persisted `decision=accepted`, `statusCode=202`, `reasonCodes=[accepted_review_only]`, `triggerSource=provider_triggered`, `baselineManifestId=onboarding.default_basket:basket-baseline-v1`, `targetManifestId=onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`, and opened `awaiting_operator` only.
  - The accepted-path proof used a temporary proof signer and a seeded baseline activation context so the live receiver had a real rebalance delta to evaluate. The seeded proof-only activations and synthetic live rebalance record were removed from production runtime state immediately after proof capture; the accepted receipt remains as the audit artifact.
  - Exact remaining cleanup: replace the temporary proof signer allowlist entry with the real provider signer and capture the same accepted path against a real provider-owned activation baseline when that signer exists.

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
- Reconciliation state: partial
- Context: the control-plane spec exists and the downstream implementation now includes real Privy connect code, backend Privy verification, a hosted linked-wallet quote-boundary proof bundle, public-safe handoff, funnel/reporting routes, an ops dashboard route, and internal agent/runbook surfaces, but first real-volume closure is still blocked by served-truth drift, no signed submission proof, missing hosted reporting tokens, and missing Hermes remote proof.
- Suspected cause: the workstreams shipped in the right order locally, but production-host proof and final document reconciliation lagged the implementation.
- Fix intent: keep one umbrella owner that states exactly what is already shipped, what is only locally or deployed-host verified, and what still blocks truthful first-volume closure.
- Acceptance criteria:
  1. A new control-plane spec exists in `docs/plans/active/`.
  2. The spec reconciles current frontend, backend, deploy, and ops truth instead of reusing older optimistic thread language.
  3. The spec maps existing workstreams that should be reused and new workstreams that must be created alongside them.
  4. The spec defines an explicit thread map for what to resume versus what to create next.
  5. The spec states that real volume must mean truthful user-approved or treasury-approved test execution rather than fabricated or wash activity.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-first-real-volume-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-real-volume-control-plane.md)
- Latest reconciliation note:
  - Local truth now includes real Privy frontend hooks, backend JWT or JWKS verification, canonical funnel-event persistence, `/api/reporting/xstocks`, `/api/funnel-events/xstocks`, `/ops/xstocks`, `GET /api/public-agent-handoff`, and the repo-owned internal agent skill chain plus smoke runbooks.
  - Production-host truth remains partial: the Railway API exposes the public handoff and reporting routes, `/api/reporting/xstocks` still fails closed for missing operator token, `https://equityterminal.app/ops/xstocks` still renders the access gate, and hosted `skill.md` now matches the repo-owned public-safe copy on key public claims.
  - Ordered open blockers remain: `XSL-009` served-truth plus browser-proof closure, `XSL-014` structural CoW incompatibility for the current promoted basket plus still-unproven signed submission, `XSL-015` hosted reporting-token configuration and remaining lower-bound funnel fields, and `XSL-016` Hermes remote smoke plus authenticated/funded proof closure.

### XSL-014 First Authenticated Execution Proof And Production Closure

- Type: frontend/backend/integration
- Status: active
- Reconciliation state: partial / quote-boundary proven / structurally blocked basket
- Context: the live site serves the current Equity Terminal shell, the frontend now has real Privy connect code, `apps/api` now has real Privy auth verification, and the repo now carries one hosted linked-wallet activation plus partial CoW quote-boundary proof bundle, but there is still no signed submission, hosted activation and detail surfaces still overclaim some live or automation truth, and operator visibility remains only partially configured.
- Suspected cause: frontend, backend auth, and live-proof slices all landed, but the final authenticated runtime inputs and served-copy reconciliation did not.
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
  - Resolved continuation finding: the earlier route-token mismatch is no longer current truth. Production probing now confirms the live basket lane is wrapper-correct for CoW routing, and `NVDAx` quotes successfully at the promoted basket's current leg size when the verified Ethereum `wrapperAddress` is used.
  - Hosted proof update: production probing against Railway now confirms the current live basket lane is wrapper-correct for CoW routing. A real authenticated linked-wallet run at `$25` saved activation `act_88d4997e-aa80-42a3-8580-8af877fcb3e7`, created execution request `execreq_1196c5af-f577-4428-a355-4e67b793b7da`, and captured runtime-store plus execution-request artifacts under `tmp/proof/2026-04-01T17-25-58.460Z/`.
  - Hosted quoteability truth: the promoted basket is not all-leg quoteable at the minimal proof notional. `NVDAx` reached `awaiting_approval`, `MSFTx`, `METAx`, and `AMZNx` returned exact `NoLiquidity` blockers, `AAPLx` and `GOOGLx` returned exact `InternalServerError` blockers, and the `AUSD` yield-buffer leg remained deferred by design.
  - Submission boundary truth: no autonomous or hidden submission occurred. The truthful stop point is `basket_not_all_leg_quoteable`, so this run did not reach signed submission, `orderUid`, or receipt.
  - Remaining repo drift: the blocker is no longer route-token selection for live venue behavior, and the previously reported local readiness-test drift is now reconciled. The remaining unresolved boundary is external venue quoteability, not linked-wallet or smart-account readiness semantics.
  - Quote-sweep update on 2026-04-01: reusing `apps/api/scripts/privy-cow-proof.js` in quote-only sweep mode with the current promoted basket and live venue APIs under `tmp/proof/2026-04-01T18-54-21.188Z/` did not find an all-leg executable floor at `25, 50, 100, 250, 500` USD gross. `NVDAx` remained quoteable at every rung, while `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, and `GOOGLx` remained blocked at every rung; low-rung venue responses mixed `InternalServerError` and `NoLiquidity`, but by `100`, `250`, and `500` USD gross all five persistently blocked core assets converged to exact `blockerClass=cow_no_liquidity` with venue `errorType=NoLiquidity`.
  - Guard decision: no new policy or API floor guard was added in this tranche. The sweep did not discover a lower-bound executable floor to encode; it showed current structural CoW incompatibility for five promoted core legs across the tested band, so the truthful fail-closed boundary remains the live quote stage rather than a newly hardcoded minimum.
  - Standalone-universe update on 2026-04-01: direct USDC -> xStock CoW quotes across the full repo-owned Ethereum xStocks universe now confirm only `NVDAx`, `TSLAx`, and `SPYx` quote across the tested `15, 25, 50, 100, 250, 500, 1000, 2500, 5000` USD ladder. `AAPLx`, `AMDx`, `AMZNx`, `AVGOx`, `GOOGLx`, `METAx`, `MSFTx`, and `ORCLx` never quote directly and settle to exact blocker class `cow_no_liquidity`.
  - CoW-only basket posture: no product-usable CoW-only onboarding basket exists right now. The direct quoteable universe is only three xStocks, below the research minimum `holdings_count=4`, and the only fully intact repo basket is the benchmark-only `sp500_core` / `SPYx` lane.
  - Acceptance addendum: treat the current basket as structurally incompatible with present CoW venue truth only if the promoted basket still cannot reach the next truthful user-approved execution boundary after bounded quote-only probing with exact per-leg venue diagnostics.
- Executor prompt:
  - Trace the exact CoW quote-construction path from promoted basket split to per-leg quote payloads and failure mapping.
  - Fix only the narrow backend truth mismatch needed to align CoW token selection and basket quote diagnostics with live venue behavior.
  - Keep the one small mainnet proof capped at `$25` gross and user-approved only.
  - Stop at the first exact external blocker if a real signed submission still cannot happen.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification not applicable unless a hosted auth/readiness mismatch is rediscovered
- Verification note:
  - [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) now calls real Privy hooks (`login`, `logout`, `getAccessToken`) and emits the `wallet_connected` funnel stage.
  - [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js) now verifies Privy JWT or JWKS inputs, linked accounts, and authenticated owner binding.
  - `pnpm --dir apps/web check`, `pnpm --dir apps/api check`, `pnpm --dir packages/policy check`, `pnpm --dir packages/shared check`, and `pnpm --dir packages/xstocks check` all passed during the reconciliation audit.
  - Exact auth-proof command `node apps/api/scripts/privy-cow-proof.js` now succeeds against hosted production when a real Privy access token is present and writes the authenticated proof bundle under [tmp/proof/2026-04-01T17-25-58.460Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T17-25-58.460Z).
  - Current targeted repo tests for this lane are green: `node --test apps/api/test/api.test.js` and `node --test packages/policy/test/policy.test.js` now both pass against the current linked-wallet-first, smart-wallet-not-required basket truth.
  - Quote-failure normalization is narrower and more exact: failed CoW quote legs now persist structured `errorStatusCode`, `errorType`, `errorDescription`, `errorBody`, and a truthful `blockerClass` such as `cow_no_liquidity` or `cow_internal_server_error` inside `venueStatus.rawStatus`.
  - Production API truth is now split: authenticated `POST /api/activations` and `POST /api/executions` are production-proven for the current linked-wallet lane, while public handoff and automation/rebalance surfaces still remain preview or operator-manual.
  - Direct CoW spot checks on 2026-04-01 confirm that the opaque basket blockers are venue-side rather than repo-side: the saved hosted proof remains the canonical production claim, and current public `/quote` probes still return raw `InternalServerError` shells with empty descriptions for the affected 500-class legs.
  - Quote-only floor search now has a repo-local live-venue proof bundle under [tmp/proof/2026-04-01T18-54-21.188Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T18-54-21.188Z): `node --check apps/api/scripts/privy-cow-proof.js` passed, the runner was reused in `quote_sweep` mode with no submission path, and the bounded ladder `25,50,100,250,500` still produced no all-leg quoteable rung.
  - The latest sweep tightens the mixed-blocker story rather than overflattening it: `25` USD returned `cow_internal_server_error` for all five persistently blocked core legs, `50` USD mixed `cow_internal_server_error` and `cow_no_liquidity`, and `100`, `250`, plus `500` USD all returned `cow_no_liquidity` / `NoLiquidity` for the same five assets.
  - The repo-owned standalone universe artifact now tightens the current boundary further: `NVDAx`, `TSLAx`, and `SPYx` are the only direct CoW-quoteable xStocks on Ethereum in the tested ladder, while `AAPLx`, `AMDx`, `AMZNx`, `AVGOx`, `GOOGLx`, `METAx`, `MSFTx`, and `ORCLx` never quote directly and persist as `cow_no_liquidity`.
  - No truthful CoW-only replacement onboarding basket exists yet. A direct-quoteable three-name set is below the research minimum `holdings_count=4`, and the only fully intact repo basket is benchmark-only `sp500_core` / `SPYx`, so current onboarding baskets stay recommendation-only until basket composition or venue truth changes.
  - Current exact claim level: the promoted basket is structurally incompatible with present CoW venue truth in the tested `25` to `500` USD gross band for five core legs (`MSFTx`, `AAPLx`, `METAx`, `AMZNx`, `GOOGLx`), so accepted linked-wallet proof stops at quote boundary rather than signed submission.
  - Hosted UI truth still drifts above the API: multiple served components still render `Chainlink CRE` or `Status live` copy even though the production API remains preview-only or fail-closed for provider-triggered automation.

### XSL-015 Partner Tracking And xStocks Reporting Dashboard

- Type: product/data
- Status: active
- Reconciliation state: partial
- Context: xstocks now has a canonical funnel-event ledger, `/api/reporting/xstocks`, `/api/funnel-events/xstocks`, and an operator-first `/ops/xstocks` dashboard route, but the hosted dashboard remains token-gated or unconfigured, `funding_required` is still lower-bound, and partner self-serve auth still does not exist in-repo.
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
- Final reconciliation note:
  - [ops/xstocks/page.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/app/ops/xstocks/page.tsx) now exists and serves an operator-safe dashboard gate on the hosted web app.
  - Production backend verification shows `GET https://api-production-e70b.up.railway.app/api/reporting/xstocks` fails closed with `Operator reporting token is not configured on this backend.`
  - Production web verification shows `https://equityterminal.app/ops/xstocks` loads the operator gate and currently instructs the operator to configure `XSTOCKS_OPS_DASHBOARD_TOKEN` or `XSTOCKS_REPORTING_TOKEN` first.
  - This keeps the lane partial rather than closed: the reporting contracts and routes are real, but hosted configuration and the remaining lower-bound funnel field still block truthful external review.

### XSL-016 Hermes Operator Control And Agent Skill Surface

- Type: ops/product
- Status: active
- Reconciliation state: partial
- Context: the repo now includes the internal skill chain (`xstocks-qualification`, `xstocks-agent-start`, `xstocks-activation-truth`), the public `skill.md`, the public-safe handoff helper, and operator smoke or proof runbooks, but Hermes remote smoke, treasury or wallet-funded proof capture, and a remote transcript or blocker bundle are still unproven.
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
- Latest reconciliation note:
  - Local repo-owned agent surfaces now include [xstocks-agent-start](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-agent-start/SKILL.md), [xstocks-activation-truth](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md), [xstocks-agent-smoke-matrix](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-agent-smoke-matrix.md), and [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md).
  - `node scripts/qualify.mjs --fixture broad-cautious` and `node scripts/verify-qualification-fixtures.mjs` pass locally, so the repo-owned skill chain is no longer qualification-only.
  - Hosted `https://equityterminal.app/skill.md` now matches the repo-owned public-safe surface on the key public-safe claims, so public-skill parity is no longer a Hermes blocker.
  - Remaining blockers are exact: no Hermes remote transcript or smoke bundle, no approved funded wallet or treasury proof bundle, and no real user-token-backed authenticated/funded proof artifact to hand off to Hermes beyond the current partial quote-boundary bundle.

### XSL-016A Public-Safe Agent Handoff Boundary

- Type: ops/product/api
- Status: completed
- Canonical owner lane: `XSL-016`
- Date opened: 2026-04-01
- Context: the public `apps/web/public/skill.md` surface and the internal repo-owned activation/execution skill chain were both landed, but external agents still had to infer the public-to-internal boundary from a mix of static markdown and broader API payloads. The missing piece was one explicit public-safe handoff contract stating whether to stay in public preview, stop blocked, or hand off into authenticated activation.
- Suspected cause: existing public preview routes and APIs already exposed truthful readiness data, but no dedicated boundary contract made the handoff explicit without also exposing owner-specific activity or execution surfaces.
- Fix intent: add the narrowest public-safe readiness and handoff helper possible, then align the public skill and internal handoff docs to the same boundary language.
- Acceptance criteria:
  1. The exact public-safe boundary is explicit and tied to repo-owned routes or API contracts.
  2. No secrets, private hosts, treasury details, or hidden custody internals are exposed.
  3. The public-safe bridge is limited to readiness and handoff truth and does not bypass authenticated activation or execution ownership checks.
  4. The final verification states whether a real bridge now exists and what exact blocker remains for direct public follow-through.
- Complexity: medium
- Plan: [2026-04-01-xstocks-public-safe-agent-handoff-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-public-safe-agent-handoff-boundary.md)
- Executor prompt:
  - Audit the public skill, internal handoff docs, and current unauthenticated versus authenticated API boundaries.
  - Add `apps/api/**` only if one narrow public-safe helper/readiness endpoint is actually justified.
  - Keep the bridge public-safe and explicit about where authenticated activation, activity, and execution still begin.
  - Run the smallest truthful verification set for the touched public and API surfaces, then report whether the bridge now exists.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification not applicable because this slice changed a static public markdown surface plus API and skill/runbook contracts, not an interactive rendered UI flow
- Verification note:
  - Added `GET /api/public-agent-handoff` as the explicit public-safe boundary contract. It accepts the same public-safe promoted-manifest and optional wallet-readiness inputs as preview reads, but returns only readiness preview plus handoff-state output: `stay_public_preview`, `ready_for_authenticated_activation`, or `blocked`.
  - The helper exposes only public routes and authenticated endpoint contracts; it does not save activations, read private activity, create executions, or expose private hosts, auth material, wallet secrets, treasury details, or hidden custody internals.
  - Updated `apps/web/public/skill.md`, `skills/xstocks-agent-start/SKILL.md`, `skills/xstocks-activation-truth/SKILL.md`, and `docs/runbooks/xstocks-operator-execution-proof.md` so the public and internal surfaces now describe the same boundary.
  - `pnpm --filter @xstocks/api check` passed with 31/31 API tests green, including the new public handoff coverage and the authenticated activation/execution ownership regressions.
  - `pnpm --filter @xstocks-strategy-lab/web build` passed. Existing build warning remains from `@privy-io/react-auth` optional Farcaster mini-app dependency resolution in `apps/web/src/components/privy-provider.tsx`.
  - `git diff --check` passed.
  - Real bridge result: yes, a public-safe readiness and handoff bridge now exists. Exact remaining blocker for a direct public one-surface flow: `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, and `POST /api/executions` still require verified authenticated user ownership and user-approved wallet or signature steps, so direct public follow-through cannot exist safely.

### XSL-016B Public And Private Agent Smoke Matrix Closure

- Type: ops/product/docs
- Status: active
- Canonical owner lane: `XSL-016`
- Date opened: 2026-04-01
- Reconciliation state: partial
- Context: `XSL-016A` established the public-safe handoff helper, and the repo now has a smoke-matrix owner spec plus aligned local skills and runbooks. The hosted `skill.md` now matches the repo-owned public-safe truth on key points, but the exact fixed-port local runtime smoke command on `localhost:3001` is still contaminated by a pre-existing stale API process on this machine.
- Suspected cause: the public skill, handoff helper, and internal skill chain were landed as truthful slices, but they were not reconciled into one operator-ready matrix or one concise smoke runbook.
- Fix intent: freeze one exact public-safe smoke path and one exact internal authenticated smoke path, update the public and internal docs to the same live contracts, remove dead helper references, and keep CRE plus recurring-runtime checks internal-only unless repo-owned proof routes now exist.
- Acceptance criteria:
  1. The missing smoke-matrix owner spec exists and names the exact public-safe path and exact internal authenticated path.
  2. `apps/web/public/skill.md` references only live public-safe routes or APIs and stops at the authenticated boundary.
  3. `skills/**` and `docs/runbooks/**` describe the same truth for qualification, explanation, preview, activation readiness, execution boundary, and deposit boundary.
  4. One concise operator smoke runbook exists and can be used without thread context.
  5. Any remaining unsupported path is named exactly instead of being implied.
- Complexity: medium
- Plan: [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md)
- Executor prompt:
  - Prefer `apps/web/public/skill.md`, `skills/**`, and `docs/runbooks/**`.
  - Touch `apps/api/**` only if one tiny public-safe helper is truly still missing.
  - Keep activation save, activity reads, execution writes, CRE checks, and recurring-runtime checks internal-only unless the repo now exposes explicit proof routes for them.
  - Verify with the exact hosted `skill.md` and route curls, `node scripts/qualify.mjs --fixture broad-cautious`, and one local activation-preview check.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual or hosted-route verification
- Verification note:
  - Updated `apps/web/public/skill.md`, `skills/xstocks-agent-start/SKILL.md`, `skills/xstocks-qualification/SKILL.md`, `skills/xstocks-activation-truth/SKILL.md`, and `docs/runbooks/xstocks-operator-execution-proof.md` to the same six-stage smoke matrix, and added `docs/runbooks/xstocks-agent-smoke-matrix.md` as the concise operator runbook.
  - `curl -sS https://equityterminal.app/skill.md` now returns the current public-safe copy with no public CRE claim or Railway host reference.
  - `curl -I -s https://equityterminal.app/onboarding`, `curl -I -s https://equityterminal.app/workspace/comparison`, and `curl -I -s https://equityterminal.app/activate/ai-infra-autopilot` all returned `200` on 2026-04-01.
  - `node scripts/qualify.mjs --fixture broad-cautious` returned `selection.slotId=onboarding.default_basket`, `activationTruth.executionState=funding_required`, and `activationTruth.depositRequired=true`.
  - An isolated local API instance from the current workspace served `GET /api/public-agent-handoff` with `state=stay_public_preview`, `surfaceTruth=preview`, and `executionState=wallet_required` for the no-wallet boundary.
  - Exact blocker: the exact default-port local runtime command from the owner spec currently hits a pre-existing `node` process on `localhost:3001`, so default-port local smoke on this machine does not represent the current repo build without first clearing that local runtime conflict.

### XSL-017 Testnet Proof Surface And Harness

- Type: integration/runtime/proof
- Status: active
- Context: Mainnet proof lanes now cleanly separate auth and state-transition truth from venue-liquidity truth, but the repo still has no cheap repeatable testnet lane for wallet funding, authenticated owner binding, signature collection, submission attempts, receipt persistence, and provider-triggered review. The user can source faucet ETH on Ink Sepolia, yet the repo does not currently own one execution-grade testnet inventory or proof harness stating what that does and does not prove.
- Suspected cause: Earlier closure work targeted the real-money/mainnet surfaces first around Privy, CoW, 1inch Fusion, and CRE ingress, while testnet remained only an implicit fallback idea through Ink mentions and local faucet availability.
- Fix intent: Create one execution-grade testnet vertical that inventories supported chains and venues, freezes one faucet-funded testnet proof path, and explicitly separates protocol or wiring proof from mainnet xStocks issuer or liquidity proof.
- Acceptance criteria:
  1. A dedicated testnet proof spec exists in `docs/plans/active/`.
  2. The spec inventories what is and is not meaningfully testable on testnet for Privy auth, 1inch, CoW, provider-triggered review ingress, xStocks asset availability, and any chain-specific funding path such as Ink Sepolia.
  3. The lane defines one canonical faucet-funded wallet path and one repeatable artifact pack for testnet proof runs.
  4. The lane states exactly which claims can close on testnet and which remain mainnet-only.
  5. The lane defines a repo-owned runbook or harness contract for repeated testnet proof runs rather than relying on chat context or ad hoc shell history.
- Complexity: medium
- Plan links:
  - [2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md)
- Executor prompt:
  - Treat testnet as a proving ground for auth, funding, signatures, submission boundaries, receipts, and review-state transitions, not as a shortcut around mainnet issuer or liquidity proof.
  - Start by inventorying supported chains and venues before choosing Ink Sepolia or any other chain as the canonical testnet execution path.
  - Reuse `apps/api/**`, `packages/xstocks/**`, `packages/policy/**`, and the existing proof-script pattern only as far as needed to create one repeatable testnet proof surface.
  - If no real xStocks plus venue combination exists on testnet, fail closed with one exact unsupported matrix and optionally define a narrower protocol-wiring proof surface instead of overclaiming testnet execution.
- Checklist:
  - [ ] report captured
  - [ ] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] proof artifacts captured

### XSL-014A Venue-Routed Mainnet Execution

- Type: runtime/integration/api
- Status: completed
- Canonical owner lane: `XSL-014`
- Context: the repo now owns a venue-routed execution substrate for authenticated basket execution requests. CoW remains the default manual venue, 1inch Fusion is now a signer-owned manual venue, and both venues persist through the same execution request contract rather than parallel proof notes.
- Suspected cause: route truth and proof moved faster than the execution-request contract. The package layer knew about `1inch`, but the execution service still assumed every manual rebalance leg was `CoW`.
- Fix intent: create one execution-grade sub-lane that upgrades mainnet execution from CoW-only to truthful per-leg venue routing with `1inch` primary where proven, `CoW` where directly proven, and exact blocker persistence everywhere else.
- Acceptance criteria:
  1. The repo owns a venue-routed execution request contract rather than a CoW-only execution request.
  2. `apps/api` can stage and persist exact per-leg route selection, quote artifacts, signature artifacts, submissions, and receipts.
  3. `packages/xstocks/**` carries the truthful next boundary for `1inch` beyond quote-only truth.
  4. One small real mainnet proof exists for the venue-routed path, or one exact signer/submission blocker is captured.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md)
- Resolution doc:
  - [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
- Executor prompt:
  - Extend the current execution lane in `apps/api/**`, `packages/xstocks/**`, `packages/shared/**`, and `packages/policy/**` so it no longer hardcodes `CoW` for every manual execution leg.
  - Keep route truth exact per leg and preserve explicit signer approval.
  - Carry one small real mainnet proof to the furthest truthful boundary and stop with one exact blocker if submission still cannot happen.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] proof artifacts captured
- Resolution note:
  - The canonical execution substrate now lives in `packages/shared/src/contracts/execution.ts` and `apps/api/src/services/api-service.js`, and it carries both `cow_swap` and `oneinch_fusion` through the same signer-owned request and leg lifecycle.
  - `apps/api` now persists a 1inch quote, signer-owned EIP-712 approval payload, signed submission attempt, venue status, and receipt or blocker without adding autonomous execution.
  - Strongest truthful closure: the manual venue-routed execution substrate exists through the signer-owned approval and submission boundary, and no autonomous execution was added.
  - Exact blocker artifact: [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T21-55-55.559Z/summary.json)
  - Exact blocker: `Privy access token is expired.` A fresh verified user session is still required before live signer-owned 1inch submission proof can proceed.

### XSL-018 Event-Triggered Rebalance Control Plane

- Type: program/frontend/backend/runtime
- Status: active
- Context: the user now wants the canonical app to own event-driven rebalance end to end: stub a news event in the right-side panel, stage the portfolio implication, hit one top-level `Execute all` control, run the mainnet rebalance, and later let `CRE` or provider-triggered events reuse the same execution path. Current truth is still fragmented: `XSL-011B` proves signed review ingress, `XSL-014A` now proves the backend venue-routed execution substrate through signer-owned 1inch + CoW manual execution, and the canonical frontend still has no real rebalance control surface.
- Suspected cause: the repo proved review ingress and venue quoteability as separate lanes first, but never created the control-plane owner that joins event intake, execution staging, and later automation into one path.
- Fix intent: create one umbrella owner for event-triggered rebalance, with sub-specs for venue-routed mainnet execution, a right-rail control surface plus top-level `Execute all`, and provider-review-to-execution handoff.
- Acceptance criteria:
  1. An umbrella control-plane spec exists and links every required execution-grade sub-spec.
  2. The canonical frontend right rail can create or stub a rebalance-driving event and show resulting portfolio implication plus execution readiness.
  3. The app exposes one truthful top-level `Execute all` control that consumes backend execution readiness rather than mock state.
  4. Accepted provider review can hand off into the same execution request path instead of dying permanently at `awaiting_operator`.
  5. Any later automation claim reuses the same venue-routed execution path and does not create a second hidden executor.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-event-triggered-rebalance-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-plane.md)
  - [2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md)
  - [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
- Executor prompt:
  - Treat this as a decomposed program, not one giant mixed diff.
  - Land the venue-routed backend execution lane first, then the frontend control surface, then the provider-review-to-execution handoff.
  - Keep explicit operator action as the first closure target; only then widen into later automation using the same path.
- Checklist:
  - [ ] report captured
  - [ ] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] proof artifacts captured

### XSL-018A Event-Triggered Rebalance Control Surface

- Type: frontend/backend
- Status: active
- Canonical owner lane: `XSL-018`
- Context: the canonical frontend has no real right-rail event-triggered rebalance surface or top-level `Execute all` control, even though the terminal spec already reserves that space for intelligence plus actions.
- Suspected cause: earlier frontend tranches improved explanation, deposit truth, and onboarding, but did not create a real control surface for rebalance initiation.
- Fix intent: add the canonical right-rail event stub plus one truthful top-level `Execute all` control that maps to backend execution readiness.
- Plan links:
  - [2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-event-triggered-rebalance-control-surface-spec.md)
- Checklist:
  - [ ] report captured
  - [ ] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] proof artifacts captured

### XSL-018B Provider-To-Execution Handoff

- Type: backend/runtime/orchestration
- Status: active
- Canonical owner lane: `XSL-018`
- Context: accepted provider review is real, but it still dead-ends at `awaiting_operator` rather than feeding the canonical execution path now owned by `XSL-014A`.
- Suspected cause: the provider-review lane and the manual execution lane were proven separately and never joined by one handoff contract.
- Fix intent: hand accepted provider review into the same execution request path used by manual operator-triggered `Execute all`, and reserve any later automation for that same path.
- Plan links:
  - [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
- Checklist:
  - [ ] report captured
  - [ ] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] proof artifacts captured

### XSL-018C Policy-Bounded Automatic Execution Gate

- Type: backend/runtime/policy
- Status: active
- Canonical owner lane: `XSL-018`
- Date opened: 2026-04-02
- Context: `XSL-014A` and the manual execution substrate now reserve
  `policy_bounded_automation` as a future execution owner, and `XSL-018B` is the
  next handoff lane from provider review into execution staging. The repo still does
  not freeze what can ever move from staged execution into automatic execution, which
  trigger classes remain review-only, or what signer and risk boundaries would be
  required before any autonomous claim becomes truthful.
- Suspected cause: the shared contracts were widened first so later work would have
  room for `execute_all`, `provider_staging`, and `policy_bounded_automation`, but
  no narrow owner slice yet states the exact policy gate between "staged" and
  "automatic".
- Fix intent: create the narrow post-`XSL-018B` owner slice that keeps provider and
  policy events review-only, allows only one future repo-owned scheduled path to
  become auto-executable, and freezes the signer model, size, asset, venue, and
  risk caps, hard stops, and rollback boundaries without implementing runtime
  autonomy yet.
- Acceptance criteria:
  1. One dedicated owner spec exists for the post-`XSL-018B` automatic-execution
     gate.
  2. The spec defines exact review-only versus auto-executable trigger classes using
     the current rebalance and execution contract names.
  3. The spec defines the exact staged-to-auto policy gate, signer requirements,
     phase-1 size, asset, venue, and risk caps, and hard-stop or rollback rules.
  4. The spec explicitly states that current runtime truth remains
     `autonomousExecutionProven=false` until separate proof lands.
- Complexity: medium
- Plan:
  - [2026-04-02-xstocks-policy-bounded-automatic-execution-gate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-policy-bounded-automatic-execution-gate.md)
- Executor prompt:
  - Update docs only; do not implement autonomous execution in runtime yet.
  - Reuse the existing contract names in `packages/shared/src/contracts/execution.ts`,
    `packages/shared/src/rebalance.js`, `packages/policy/src/rebalance-policy.js`,
    and `packages/policy/src/rebalance-orchestration.js`.
  - Keep `scheduled_cron` as the only future auto-submit candidate unless repo truth
    proves a narrower or broader path later.
  - Keep `provider_triggered`, `policy_event`, `provider_staging`, and manual
    `execute_all` explicitly bounded to review-only or manual-only behavior in this
    slice.
  - Verify with `git diff --check`.
- Checklist:
  - [ ] report captured
  - [ ] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] proof artifacts captured

## 2026-04-01 Final Residual Backlog

1. `XSL-018A`: add the canonical right-rail event-triggered rebalance surface plus one truthful top-level `Execute all` control.
2. `XSL-018B`: hand accepted provider review into the same execution path instead of stopping forever at `awaiting_operator`.
3. `XSL-018C`: freeze the exact post-handoff policy gate between staged execution and future automatic execution, including trigger classes, signer requirements, phase-1 caps, and hard stops.
4. `XSL-017`: inventory which wallet, venue, provider-review, and asset surfaces are actually meaningful on testnet; freeze one faucet-funded proof path; and keep mainnet xStocks issuer or liquidity truth explicitly separate from any testnet success.
5. `XSL-015`: configure hosted `XSTOCKS_REPORTING_TOKEN` and `XSTOCKS_OPS_DASHBOARD_TOKEN`, then reverify `/api/reporting/xstocks` and `/ops/xstocks`; keep `funding_required` explicitly lower-bound until the repo owns a pre-save funding event.
6. `XSL-016`: run the Hermes remote smoke plus authenticated/funded proof path with a real user token, or capture the exact blocker if auth, funding, or operator access still prevents closure.
7. `XSL-009`: capture one browser proof pack for onboarding -> workspace -> activation and remove served `Chainlink CRE` or `Status live` copy that currently outruns the production API truth.
