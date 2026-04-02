# Issues

Last updated: 2026-04-02

## 2026-04-01 Live Gap Canonical Owners

| Current gap or dependency | Canonical owner lane | Controlling spec | Notes |
| --- | --- | --- | --- |
| CoWswap execution: repo yes, prod not fully closed | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | `XSL-014` remains the downstream hosted proof lane |
| Privy smart accounts: partial or stale, not canonically proven live | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | reuse the existing Privy boundary sub-spec; do not open another owner lane |
| Chainlink CRE ongoing implementation | `XSL-011B` | [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | keep as the only active CRE lane |
| xStocks usage live baseline dependency, not a gap lane | `XSL-008` baseline only | [2026-03-31-xstocks-and-euler-adapter-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-and-euler-adapter-implementation.md) | tracked as dependency, not a new closure lane |
| Autoresearch runtime: repo yes, deployed recurring no | `XSL-006` with `XSL-006A` | [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | `XSL-006A` remains the narrow runtime-host sub-lane |
| Post-qualification autoresearch screen: partial | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | controlled on the canonical frontend via `XSL-004` |
| Autoresearch explainability in app: partial or light on prod | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | coordinated with `XSL-004` and `XSL-006` |
| Deposits via Mesh: no | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | explicit absence or proof only |
| All frontend deployed on prod: no | `XSL-004` | [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | includes route, copy, and deployment parity |
| Agent and `skill.md` testability coverage | `XSL-016B` | [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | public/private smoke ownership |

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
  - [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md)
- Continuation note:
  - Date: 2026-04-02
  - Scope freeze: implement only the first smart-account runtime bridge in `packages/policy/**`, `apps/api/**`, and `apps/web/**`. Do not attempt AA-native CoW or 1inch signing, do not reopen CRE autonomy policy, and do not broaden this tranche into hosted proof closure.
  - Verified starting truth on current `origin/main`: manual/user-approved execution still becomes `ready` from a linked wallet or embedded wallet, settlement already prefers the smart-account address when available, execution signer ownership still falls back to the wallet-first path, and frontend Privy state stops at auth/connect rather than surfacing smart-account bootstrap closure.
  - Fix intent for this tranche: make the smart account the canonical account-ownership and execution-destination surface for automation while preserving wallet-first manual execution, fail closing automation when the smart account is not ready, and persisting explicit bridge-state fields instead of inferring them indirectly.
  - Acceptance addendum:
    1. Policy emits explicit bridge-state fields: `manualSignerAddress`, `policyAccountAddress`, and `executionDestinationAddress`.
    2. Manual execution remains wallet-first and truthful for the current venue-routed lane.
    3. Automation readiness fails closed unless the smart account is ready.
    4. API persistence and response surfaces expose the bridge-state model without claiming smart-account-native venue signing.
    5. Frontend Privy state surfaces embedded-wallet and smart-account bootstrap truthfully enough to drive the bridge-state contract.
- Executor prompt:
  - Implement the first smart-account runtime bridge under `XSL-005` only.
  - Keep current manual execution wallet-first, but require smart-account readiness for automation posture.
  - Persist and surface `manualSignerAddress`, `policyAccountAddress`, and `executionDestinationAddress` across policy, API, and web.
  - Do not make CoW or 1inch sign from the smart account in this pass.
  - Verify with `pnpm --filter @xstocks-strategy-lab/policy test`, `node --test apps/api/test/api.test.js`, `pnpm --filter @xstocks-strategy-lab/web build`, and `git diff --check`.
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] visual/screenshot verification

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
- Status: active
- Canonical owner lane: `XSL-006`
- Date opened: 2026-04-01
- Context: The repo already owns the local worker runtime and now also persists `autoresearchRuntime` on the deployed Railway runtime store, but live truth on 2026-04-01 still says `truthBoundary: "worker_runtime_only"` and `recurringAutonomousProven: false`. The linked Railway project still exposes only the `api` service in `production`, local worktree has candidate worker cron files in `apps/worker`, and the deployed host still lacks a public runtime-proof route and a proven recurring scheduler receipt path.
- Suspected cause: local worker runtime and candidate Railway cron config landed before a deployed recurring host plus receipt surface were fully wired and deployed, so repo truth advanced locally faster than deployed-runtime proof.
- Fix intent: establish or prove the narrowest repo-owned recurring host, capture host identity plus cadence and receipts, and keep `worker_runtime_only` active unless those receipts are real.
- Acceptance criteria:
  1. Either an existing recurring host is proven with exact host, cadence, last run, next run, and runtime evidence, or a new narrow repo-owned scheduler host is deployed.
  2. The chosen host is classified explicitly among Railway worker/service, Railway cron/job, GitHub Actions, and Vercel cron.
  3. `apps/api` gains at most one tiny runtime-proof surface if needed so future verification does not require SSH-only truth.
  4. `recurringAutonomousProven` remains `false` and `worker_runtime_only` remains active unless host-level proof and receipts exist.
  5. If closure still fails, one exact infrastructure blocker is recorded.
- Complexity: medium
- Plan: [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md)
- Executor prompt:
  - Audit Railway, GitHub Actions, and Vercel ownership for the autoresearch recurring lane using current live access.
  - If no recurring host already exists, implement the narrowest truthful scheduler path in `apps/worker` plus deployment/runtime config only.
  - Touch `apps/api` only if one tiny receipt or runtime-proof surface is needed so later verification does not require SSH.
  - Capture real deployed receipts before changing repo truth, and fail closed at the first exact deploy blocker if the host still cannot be established.
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] visual/screenshot verification not applicable because this lane is worker/deploy/runtime only

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
- Context: The repo now truthfully proves more of this lane than the original owner entry said: manual/operator CoW rebalance staging and settlement bookkeeping exist, scheduled worker review exists as a review-only shell, and the current `provider_triggered` / Chainlink CRE surface exists only as a fail-closed classification boundary. What is still missing is the first real provider-triggered lane: there is still no repo-owned provider adapter, signed-event validation path, deployed provider host, or proof artifact that would let the repo claim live CRE-triggered rebalance review.
- Suspected cause: the original owner lane mixed three different questions into one bucket: what already ships in the manual and scheduled runtime, what remains fail-closed by design, and what exact work is required to turn the first CRE path into a provable backend/runtime lane.
- Fix intent: Keep `XSL-011` as the umbrella control lane, preserve the completed truthful manual boundary under `XSL-011A`, and open one new executor-grade sub-lane under `XSL-011B` that defines the phase-1 CRE/provider-triggered review path, signed-event authenticity model, deployed receiver, and proof contract.
- Acceptance criteria:
  1. The `XSL-011` umbrella spec reflects current repo truth instead of the older generic-unproven framing.
  2. `XSL-011A` remains the completed truthful baseline for manual CoW execution and scheduled review.
  3. `XSL-011B` exists and explicitly answers whether phase 1 CRE is review-only or execution-capable, what event authenticity model is required, what deployed receiver is required, and what proof changes repo truth from fail-closed to proven.
  4. No repo-tracked artifact claims live CRE automation beyond what the proof contract actually supports.
  5. Exact blocker taxonomy remains explicit until the phase-1 proof pack exists.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md)
  - [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
  - [2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md)

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

### XSL-011C First Manual CoW Rebalance Proof Bundle

- Type: runtime/integration
- Status: completed
- Canonical owner lane: `XSL-011`
- Date opened: 2026-04-01
- Context: `XSL-011A` froze the truthful manual/operator CoW and scheduled-review boundary, but the repo still lacked one proof bundle showing a real promoted-manifest drift path through manual review, execution-request creation, and a live CoW quote attempt on the existing rail without claiming autonomous execution or Chainlink-triggered automation.
- Suspected cause: the runtime path existed and the tests were local, but no repo-owned proof harness stitched together historical activation seeding, scheduled review, authenticated activation creation, and live CoW quote attempts into one artifact bundle.
- Fix intent: capture the first truthful proof bundle for a manual/operator rebalance candidate on the existing CoW rail, stop at the first exact blocker, and state explicitly whether quote, approval, submission, and receipt boundaries were actually reached.
- Acceptance criteria:
  1. One truthful candidate path exists from a historical activation baseline to `scheduled` and then `awaiting_operator`.
  2. The proof bundle records exact execution prerequisites: baseline, rebalance state, quoteability observations, and auth/ownership boundary.
  3. The proof run uses the real xStocks live boundary and the real CoW quote rail.
  4. The proof stops fail closed at the first exact blocker if submission or settlement cannot happen.
  5. No repo artifact claims autonomous execution, Chainlink, or CRE proof.
- Complexity: medium
- Plan: [2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md)
- Executor prompt: Produce the smallest truthful manual/operator xstocks rebalance proof bundle on the existing CoW rail, capture the exact boundary reached, and stop at the first exact blocker without widening into Chainlink/CRE or frontend work.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification not applicable because the proof is runtime/API-only
- Verification note:
  - `node apps/worker/src/manual-rebalance-proof.js --notional 25 --artifact-dir ./tmp/proof/manual-rebalance-live-25` produced the first repo-owned manual rebalance proof bundle.
  - The proof seeded baseline manifest `onboarding.default_basket:basket-baseline-v1:promoted`, detected promoted-manifest drift to `onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`, recorded `scheduled`, and then opened `awaiting_operator`.
  - A real authenticated activation was created through the API boundary with status `ready`, `surfaceTruth: live`, `executionState: ready`, and `executionEligibility: executable`.
  - The proof reached live CoW quoting and user-approval staging for `NVDAx` with quote id `1126519095`, then stopped fail closed on `MSFTx` with `NoLiquidity` before any signed submission or settlement existed.
  - Exact blocker: `blocked_execution_leg` on `act_fbe91daa-ae11-4fe8-859d-702b5a2ef926:leg:2`, `MSFTx`, `buyToken=0x63ad27614231767c8c489745b9145272de50d09b`, `sellAmountBeforeFee=4110000`, `targetNotionalUsd=4.11`, CoW response `404 {"errorType":"NoLiquidity","description":"no route found"}`.
  - Proof artifacts were written under `tmp/proof/manual-rebalance-live-25/`, including `summary.json`, `summary.md`, `execution-prerequisites.json`, `quote-attempts.json`, `execution-request-created.json`, `execution-request-latest.json`, `rebalance-scheduled.json`, `rebalance-awaiting-operator.json`, and `runtime-store.json`.
  - No order UID, transaction hash, or confirmed receipt exists for this proof bundle because the run stopped before signed submission.

### XSL-011B Chainlink CRE Provider-Triggered Rebalance

- Type: runtime/integration
- Status: active
- Canonical owner lane: `XSL-011`
- Date opened: 2026-04-01
- Context: The current repo already proves the manual/operator CoW path and the scheduled review shell, but `provider_triggered` remains fail-closed. The first real CRE lane still lacks every execution-grade runtime piece that would make the trigger truthful: no provider-event schema, no signed-event validation helper, no dedupe or replay ledger, no deployed receiver route, and no proof artifact showing that a deployed CRE event can open a rebalance review on the correct slot, manifest, and chain.
- Suspected cause: the repo introduced `provider_triggered` as a classification surface before any repo-owned provider adapter or authenticity model existed, and the current dual rebalance-policy surfaces were never reconciled into one implementation plan for provider-triggered review.
- Fix intent: implement the first real Chainlink CRE/provider-triggered rebalance lane as a review-only backend/runtime path that authenticates and persists provider events, opens `awaiting_operator`, and hands off into the existing manual/operator and user-approved CoW execution path without autonomous submission.
- Acceptance criteria:
  1. Phase 1 is explicitly review-only and the implementation enforces that boundary.
  2. Every accepted provider event is authenticated with the required ETH-JWT model and scoped to one slot, one manifest, and one chain.
  3. Every accepted provider event is deduped, replay-protected, and persisted with an audit receipt.
  4. The deployed `apps/api` receiver recomputes local runtime truth before opening review and fails closed on mismatch.
  5. The only allowed success transition from a provider event is opening `awaiting_operator`.
  6. The existing manual/operator and user-approved CoW path remains the only submission path.
  7. The deployed proof pack exists and supports only the claim level actually proven.
  8. If any required proof is missing, `providerTriggeredProven` remains `false` and the lane stays fail-closed.
- Complexity: high
- Plan: [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
- Executor prompt:
  - Implement this lane only in `packages/shared/**`, `packages/policy/**`, `apps/api/**`, and `apps/worker/**` only if a local replay helper is needed.
  - Do not touch `apps/web`.
  - Build the provider-event contract, ETH-JWT validation path, dedupe/replay protection, receipt persistence, and review-only rebalance handoff.
  - Use the deployed `apps/api` service as the phase-1 receiver unless implementation proves that is impossible.
  - Do not let any provider-triggered path autonomously create or submit a CoW order.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification not applicable because this lane is backend/runtime only
- Verification note:
  - Local implementation now exists for the phase-1 review-only CRE lane in `packages/shared`, `packages/policy`, and `apps/api`: signed provider-event validation, dedupe/replay protection, receipt persistence, and `awaiting_operator` handoff are implemented and covered by repo tests.
  - Deployed proof is still missing, so repo truth may not yet claim `CRE-triggered rebalance review is live`; the remaining blocker set is deployed host/config proof plus one real accepted-event proof bundle.

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
  - [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md)
- Continuation note:
  - Date: 2026-04-01
  - Scope freeze: continue only in `apps/api/**`, `packages/shared/**`, `packages/policy/**`, `packages/xstocks/**`, and `apps/worker/**` only if runtime truth strictly requires it. Do not touch `apps/web`, do not reopen homepage/frontend/auth lanes unless quoteability work proves a remaining auth/readiness mismatch, and do not reopen 1inch, Bridge, CRE, Chainlink, issuer, or Hermes lanes.
  - Verified starting truth from the latest handoff: backend Privy auth verification is real, authenticated owner binding is real, readiness for the current Ethereum basket CoW lane was aligned away from the stale manifest `minFundingUsd: 1000` plus mandatory smart-account default, activation can reach `ready`, execution request creation works, and live CoW quote attempts reach the external venue boundary.
  - Newly verified continuation finding: the current execution leg builder selects the generic Ethereum `deployment.address` as the CoW buy token, but the xStocks execution-route surface also exposes a `wrapperAddress`. Live probing for the promoted basket shows NVDAx fails with `NoLiquidity` at the current `$4.50` leg when using `deployment.address`, while the corresponding `wrapperAddress` quotes successfully at the same ticket size. This lane must resolve route-token selection and exact quote diagnostics before declaring the `$25` basket structurally unquoteable.
  - Production deploy-gap update: Railway production now serves deployment `bca58ba0-421a-4548-b60b-05bc8adf6dbf` from the clean `origin/main` backend snapshot (`896774a65d5525318d08f74df11a3ee8c842b9f9`), exposes `/api/executions`, and fails anonymous activation/execution calls closed with `401 Privy access token is required.` after `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL` were restored on the linked `api` service.
  - Hosted proof update: a real Privy-backed production session on `equityterminal.app` was exercised with linked wallet `0xa28ded32f0bde74c42739b5b3fdc79bca0c571b2`. Authenticated production activation save succeeded (`act_801dca8d-3343-4d71-a5b8-d74184f4b587`), execution create succeeded (`execreq_4772b5e4-906a-4110-8602-8ecf0e199e24`), NVDAx reached `awaiting_approval` with CoW `quoteId=1126515204`, and the hosted execution then stopped truthfully at basket quoteability: MSFTx/AAPLx/METAx returned CoW `500 InternalServerError`, AMZNx/GOOGLx returned `404 NoLiquidity`, no user signature was supplied, and no `orderUid` or `txHash` exists.
  - Smart-account planning split: the repo now needs one dedicated sub-spec to close the remaining Privy live-boundary confusion. Current repo and hosted proof both show the current CoW lane can reach the truthful hosted boundary with a verified linked wallet and no smart wallet, while older preview contracts and some public surfaces still imply `smart_account_required`. The next lane must decide the canonical public posture, prove the chosen branch end to end, and make that branch testable through agent surfaces and `skill.md`.
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

### XSL-014B Venue-Routed Activation Readiness And Full-Basket Proof

- Type: backend/integration/policy
- Status: completed
- Canonical owner lane: `XSL-014`
- Date opened: 2026-04-02
- Context: the current promoted `onboarding.default_basket` manifest now points to `basket-starter-h6-p100-c5-cap18-a0-r300-v1`, and the repo already owns venue-routed authenticated execution plus live 1inch quote proof for its required core names. However, the saved activation snapshot still freezes `executionState=blocked` / `executionEligibility=preview_only`, so authenticated 1inch proof stops before multi-leg quote or approval work can begin.
- Suspected cause: activation readiness still derives from a CoW-only manifest truth surface. The promoted manifest still requires `cow_swap.ethereum`, `packages/policy/src/manifest.js` still constrains basket route validation back to CoW execution truth, and `packages/policy/src/execution-plan.js` still applies CoW-only asset quoteability warnings even though `apps/api` can already route authenticated execution to `1inch.ethereum`.
- Fix intent: resolve the readiness mismatch above the landed venue-routed execution substrate, keep the current promoted default basket only if present 1inch truth supports it, and drive an authenticated multi-leg 1inch proof to the furthest truthful boundary without widening into `apps/web/**`, CRE/provider ingress, or unrelated docs cleanup.
- Acceptance criteria:
  1. The repo records exactly why the promoted default basket remains preview-only today.
  2. If the current promoted basket is truthfully executable under venue-routed 1inch truth, the minimum manifest and policy surfaces are updated so saved activations can become `ready` / `executable`.
  3. If the current promoted basket is not truthfully executable, the lane fails closed with the exact blocker and does not relabel the basket as executable.
  4. The authenticated 1inch proof is rerun against the truthful target and captures multi-leg execution readiness, approval payloads, submission boundary, or one exact blocker.
  5. Scope stays in `packages/policy/**`, `packages/research/manifests/**`, `apps/api/**`, and the narrow issue or plan docs only.
- Complexity: medium
- Plan: [2026-04-02-xstocks-default-basket-venue-routed-readiness.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-02-xstocks-default-basket-venue-routed-readiness.md)
- Executor prompt:
  - Audit the current promoted default-basket manifest, policy adaptation, readiness derivation, and 1inch proof artifacts to determine whether current promoted truth can move from CoW-only preview to venue-routed executable.
  - Touch only `packages/policy/**`, `packages/research/manifests/**`, `apps/api/**`, and the narrow tracking docs needed for `XSL-014B`.
  - Keep the current promoted basket if and only if live 1inch quote proof supports every required core leg; otherwise stop fail-closed and keep the basket preview-only.
  - Re-run the authenticated 1inch proof with the truthful target and report the strongest exact claim plus the exact remaining blocker.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] proof artifacts captured
- Resolution note:
  - The promoted `c5` basket now truthfully adapts to `1inch.ethereum`, and saved activations for the promoted default basket can reach `surfaceTruth=live`, `executionState=ready`, and `executionEligibility=executable` when authenticated wallet readiness and requested notional are supplied.
  - Strongest truthful claim: the current promoted `c5` basket is executable now under venue-routed 1inch truth through a multi-leg signer-owned quote and approval boundary for `NVDAx`, `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, and `GOOGLx`.
  - Exact remaining execution boundary: six quoted core legs now stop at `awaiting_approval`, and signer-owned 1inch Fusion EIP-712 signatures are still required before backend submission can be recorded.
  - The `AUSD` yield-buffer leg remains intentionally deferred/manual and is not included in the signer-owned 1inch core execution claim.
- Proof artifact: [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T23-02-30.237Z/summary.json)

### XSL-014C Hosted / Session-Backed 1inch Signer Proof

- Type: backend/integration/proof
- Status: active
- Canonical owner lane: `XSL-014`
- Date opened: 2026-04-02
- Context: `XSL-014B` already proved the promoted `c5` default basket through multi-leg `awaiting_approval` on `1inch.ethereum` for the six actionable core xStocks legs. This residual pass must reuse that exact promoted basket and authenticated proof path to capture real signer-owned EIP-712 approval payloads, submit signed 1inch Fusion orders when signer material is available, and persist venue-status or receipt truth without widening into `apps/web/**` or autonomous execution.
- Suspected cause: the clean `origin/main` snapshot still carries the 1inch proof docs and runner but the current `apps/api` runtime wiring and execution mutation path regressed back to CoW-only handling, so the hosted/session-backed signer lane cannot truthfully advance on the updated clean tip until the landed 1inch substrate is restored on top of current backend truth.
- Fix intent: restore the landed 1inch Fusion backend path on the current clean tip, keep the promoted `c5` basket and signer-owned approval boundary intact, capture real approval and signature payloads for every actionable core leg, submit signed orders if fresh authenticated signer material exists, and otherwise stop at the first exact external blocker.
- Acceptance criteria:
  1. `apps/api` truthfully supports `1inch.ethereum` quote, prepared-order approval payload capture, signed submission, venue-status refresh, and receipt polling on the current clean tip.
  2. The proof runner persists per-leg 1inch approval payloads, signature inputs or signatures, submission responses, and venue-status or receipt artifacts for the actionable `c5` core legs.
  3. Verification passes for:
     `pnpm --filter @xstocks-strategy-lab/xstocks test`,
     `node --test apps/api/test/api.test.js`,
     `XSTOCKS_SHARED_ENV_PATH=/Users/user/.config/attn/shared.env node apps/api/scripts/oneinch-fusion-proof.js`,
     and `git diff --check`.
  4. The final proof either records real signed submission attempt plus venue-status or receipt truth, or fails closed at one exact external blocker after the internal backend path is restored.
- Complexity: medium
- Plan: [2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/docs/plans/active/2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md)
- Executor prompt:
  - Work only in `apps/api/**`, the narrow shared/package files needed to restore the landed 1inch substrate on current tip, and the tracking docs for this sub-lane.
  - Reuse the current promoted `c5` basket and authenticated proof path; do not downgrade to an easier basket and do not widen into `apps/web/**` or CRE autonomy.
  - Capture real EIP-712 approval payloads for all actionable 1inch legs, submit signed orders if fresh signer material is available, persist venue-status or receipt truth, and stop at the first exact external blocker.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] proof artifacts captured
- Verification note:
  - The clean-tip backend 1inch regression was restored in `apps/api`, including 1inch route wiring, venue-routed quote or submission handling, and proof-artifact persistence for approval payloads and signature inputs.
  - Verification passed with `pnpm --filter @xstocks-strategy-lab/xstocks test`, `node --test apps/api/test/api.test.js`, and `git diff --check`.
  - The live proof rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-01T23-43-28.673Z/summary.json) and stopped truthfully before activation with `code=proof_request_failed`, `stage=environment_or_authentication`, `message="Privy access token is expired."`, and `statusCode=401`.
  - The only available local `XSTOCKS_PRIVY_ACCESS_TOKEN` decodes to `exp=2026-04-01T23:07:10Z`; the proof attempted auth at `2026-04-01T23:43:28.673Z`, and no alternate local identity token, fresh session artifact, or repo-owned refresh helper exists in the standard proof inputs.
  - A fresh live `24-7.markets` Privy session was then recaptured from the active Brave profile at `2026-04-02T00:00:21Z`, and Privy accepted the session refresh check with `200` for authenticated user `did:privy:cmng4u99003bf0ckye9oqgopk`.
  - The new hosted proof rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/summary.json), [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/approval-payloads.json), and [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-01-39.349Z/signature-inputs.json), and advanced the promoted `c5` basket through authenticated activation and six real `1inch.ethereum` Fusion quotes to `awaiting_approval`.
  - The first exact remaining external blocker is now signer-owned approval: the rerun stopped with `code=missing_user_signature`, `stage=awaiting_signature`, and `message="Signer-owned 1inch Fusion EIP-712 signatures are still required for 6 quoted core legs before backend submission can be recorded."` No signed submission, venue order id, venue-status update beyond `quote_ready`, or receipt truth exists yet.

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

### XSL-016B Agent Testability And Skill Surface

- Type: ops/product/api
- Status: active
- Canonical owner lane: `XSL-016`
- Date opened: 2026-04-01
- Context: The repo already serves a public `skill.md` and already owns internal qualification and activation-truth skills, but the canonical live agent path is still incomplete. On 2026-04-01 the public skill is live on `equityterminal.app`, while the helper it names, `GET /api/public-agent-handoff`, is not yet reachable on the canonical public or Railway hosts. The repo therefore has real agent surfaces, but not yet one closed public/private smoke matrix across qualification, explanation, preview, activation readiness, deposit boundary, and execution boundary.
- Suspected cause: public and internal agent surfaces were landed incrementally, but no dedicated owner lane froze which checks belong on public `skill.md`, which remain internal-only, and which helper routes must be live before the public path can be called testable.
- Fix intent: create one canonical agent-testability lane that maps each relevant live-gap lane to a public-safe or internal-only smoke path, aligns `skill.md` with live reachable routes, and keeps authenticated activation, execution, CRE, and runtime checks on the correct internal surfaces.
- Acceptance criteria:
  1. One canonical public/private smoke matrix exists for qualification, explanation, preview, activation readiness, execution boundary, and deposit boundary.
  2. Public `skill.md` references only live public-safe routes and helpers.
  3. Internal skills and runbooks own the authenticated or operator-only checks.
  4. CRE and recurring-runtime verification are explicitly internal-only until their proof routes exist.
  5. The final reporting states exactly which gap lanes are public-safe, internal-only, or still unsupported.
- Complexity: high
- Plan links:
  - [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md)
  - [2026-04-01-xstocks-public-safe-agent-handoff-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-public-safe-agent-handoff-boundary.md)
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] visual/screenshot verification not applicable until the smoke paths are implemented and verified

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
