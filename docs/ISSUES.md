# Issues

Last updated: 2026-04-03

## 2026-04-01 Live Gap Canonical Owners

| Current gap or dependency | Canonical owner lane | Controlling spec | Notes |
| --- | --- | --- | --- |
| CoWswap execution: repo yes, prod not fully closed | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | `XSL-014` remains the downstream hosted proof lane |
| Privy smart accounts: partial or stale, not canonically proven live | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | reuse the existing Privy boundary sub-spec; do not open another owner lane |
| Chainlink CRE ongoing implementation | `XSL-011B` | [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | keep as the only active CRE lane |
| xStocks usage live baseline dependency, not a gap lane | `XSL-008` baseline only | [2026-03-31-xstocks-and-euler-adapter-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-and-euler-adapter-implementation.md) | tracked as dependency, not a new closure lane |
| Autoresearch runtime: repo proof seed rehydrated locally, public API deploy parity still pending | `XSL-006` with `XSL-006A` | [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | `XSL-006A` is now a merge/deploy parity residual, not a runtime-logic reopen |
| Post-qualification autoresearch screen: partial | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | controlled on the canonical frontend via `XSL-004` |
| Autoresearch explainability in app: partial or light on prod | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | coordinated with `XSL-004` and `XSL-006` |
| Deposits via Mesh: no | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | explicit absence or proof only |
| LI.FI portfolio deposit from one `USDC` into the promoted default basket: spec only, atomic claim not proven | `XSL-005` with `XSL-005A` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | supporting LI.FI deposit lane stays under funding or deposit ownership; do not move to `XSL-014` |
| Enso portfolio multi-deposit from one `USDC` into the promoted default basket: spec only, atomic bundle not yet repo-proven | `XSL-005` with `XSL-005B` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | supporting Enso atomic-bundle lane stays under funding or deposit ownership; do not move to `XSL-014` |
| Portfolio buy public-default route: hosted `1inch`; Enso implementation candidate still awaits live proof | `XSL-005` with `XSL-005C` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | `Buy portfolio` stays public, but route truth must remain explicit |
| Frontend prod parity: onboarding shell live, direct detail-route parity still open | `XSL-004` | [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | includes route, copy, and deployment parity |
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
  - [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md)
  - [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md)
  - [2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md)
- Continuation note:
  - Date: 2026-04-02
  - Scope freeze: repair only the post-enable surface/runtime regressions in `apps/api/**` and `apps/web/**`. Do not widen into AA-native CoW or 1inch signing, do not reopen CRE autonomy policy, and do not start CRE runtime from this lane.
  - Verified starting truth on current `origin/main`: the same real Privy user now resolves all three account layers after a full logout/login against the updated app config:
    - linked external wallet = `0xa28ded32f0bde74c42739b5b3fdc79bca0c571b2`
    - embedded wallet = `0xc3a79c8551bd33e3a17539df6db85a5989e22e3a`
    - smart wallet = `0x00c6bf8ba9244eb50089410007f778868cc1ce39`
  - Proven bridge-state truth from the local save snapshot after enablement:
    - `manualSignerAddress = 0xc3a79c8551bd33e3a17539df6db85a5989e22e3a`
    - `policyAccountAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`
    - `executionDestinationAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`
    - `automationExecution.readiness = ready`
  - Exact remaining blocker class after enablement: surface/runtime mismatch, not smart-wallet existence.
    - Hosted route repeatedly 429s `https://auth.privy.io/api/v1/users/me` and crashes with `TypeError: Cannot read properties of undefined (reading 'manualSignerAddress')`.
    - Local activation preview still derives null bridge state and reports `wallet required` even when the live wallet banner and saved activation snapshot both prove the smart-account bridge is ready.
  - Current result after the local repair pass on `2026-04-02`:
    - local activation route now renders the live bridge truth coherently for the real Privy session, including `policyAccountAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`, `automationReadiness = ready`, and no stale smart-account bootstrap blocker;
    - the local right-rail account card now reuses the same preview truth instead of the old public fallback copy;
    - the exact hosted `https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1` route now matches the same real-session bridge truth, does not reproduce the old `manualSignerAddress` crash, and showed only one `https://auth.privy.io/api/v1/users/me` resource hit in the verified browser load.
    - a separate pre-existing hosted `ai-infra-autopilot` tab in the same Brave session still showed the generic client-side exception shell with five `users/me` resource hits, but that is outside this narrow `XSL-005` activation-slice proof.
  - Fix intent for this tranche: guard hosted nested bridge reads, add the minimum Privy identity refresh dedupe/backoff needed to stop over-hitting `/users/me`, and make preview surfaces derive bridge truth from live wallet state when present or the saved activation/execution snapshot when live wallet state is absent.
  - Acceptance addendum:
    1. Hosted activation no longer crashes when preview payloads omit nested smart-account fields.
    2. Local and hosted preview surfaces agree with the proven bridge state whenever live wallet state is available.
    3. Saved activation/execution snapshots backfill bridge truth when live wallet state is absent.
    4. Privy identity-token refresh stops spamming `/users/me` on initial surface load and fails closed under backoff instead of cascading into a crash.
    5. Manual execution remains wallet-first and truthful for the current venue-routed lane.
    6. No surface claims AA-native CoW or 1inch signing.
- Executor prompt:
  - Implement the first smart-account runtime bridge under `XSL-005` only.
  - Keep current manual execution wallet-first, but require smart-account readiness for automation posture.
  - Persist and surface `manualSignerAddress`, `policyAccountAddress`, and `executionDestinationAddress` across policy, API, and web.
  - Do not make CoW or 1inch sign from the smart account in this pass.
  - Verify with `pnpm --filter @xstocks-strategy-lab/policy test`, `node --test apps/api/test/api.test.js`, `pnpm --filter @xstocks-strategy-lab/web build`, and `git diff --check`.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification

### XSL-005A LI.FI Portfolio USDC Deposit Lane

- Type: funding/deposit/spec
- Status: active
- Canonical owner lane: `XSL-005`
- Date opened: 2026-04-02
- Context: repo truth already prefers LI.FI as the bridge or funding provider in manifests and policy defaults, but the current proven promoted-basket execution lane is still `1inch.ethereum` and `XSL-014A` route design is already frozen. The new ask is therefore only valid as a downstream funding or deposit lane: start from one `USDC` input, split across the promoted default basket weights, route into all portfolio assets, and stay honest about the exact approval model.
- Suspected cause: current repo truth carries LI.FI only as funding or bridge preference and current basket execution proof only as per-leg signer-owned `1inch.ethereum` truth, so there is no execution-grade deposit spec saying whether LI.FI is a bridge pre-step, same-chain leg planner, partial rail, or truly atomic basket deposit path.
- Fix intent: create one execution-grade supporting spec under `XSL-005` that freezes the exact LI.FI product claim, role classification, promoted-basket leg map, truthful approval model, per-leg artifact contract, coexistence boundary with 1inch and CoW truth, and the exact copy surfaces must use until stronger proof exists.
- Acceptance criteria:
  1. The repo explicitly keeps this lane under `XSL-005` and does not open it as a new `XSL-014` route-design sub-lane.
  2. The exact truthful LI.FI portfolio-deposit claim is frozen for the promoted default basket.
  3. The spec answers whether LI.FI is bridge or funding only, same-chain deposit planner, execution-venue replacement, or partial rail.
  4. The exact portfolio targets and technical legs for the promoted default basket are frozen, including the yield-buffer sleeve.
  5. The truthful approval model and exact required user-facing caveat are frozen.
  6. The exact per-leg artifacts to persist are frozen.
  7. The coexistence boundary with the current 1inch and CoW truth is explicit and non-vague.
- Complexity: medium
- Plan: [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md)
- Executor prompt:
  - Work only after this spec is approved.
  - Keep ownership under `XSL-005`.
  - Touch only `packages/shared/**`, `packages/policy/**`, `apps/api/**`, the proof harness, and the narrow docs needed for `XSL-005A`.
  - Do not reopen `XSL-014A`, do not widen into `apps/web/**`, and do not claim an atomic whole-basket LI.FI deposit unless one exact proof run on the promoted basket closes that claim.
  - Preserve the exact approval caveat unless stronger proof exists:
    `You will sign each trade with your connected wallet. Nothing executes without your approval.`
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
  - [ ] tests run
  - [ ] visual/screenshot verification not applicable in this spec-only pass

### XSL-005B Enso Portfolio USDC Multi-Deposit Lane

- Type: funding/deposit/spec
- Status: active
- Canonical owner lane: `XSL-005`
- Date opened: 2026-04-02
- Context: the same user intent now also names Enso as a candidate substrate for one-transaction multi-deposit from `USDC` into all assets of the promoted default portfolio. Current repo truth still proves only the explicit `1inch.ethereum` core-xStocks lane, but official Enso docs do show one-transaction bundle workflows that split one input across several downstream positions.
- Suspected cause: current repo truth lacks any Enso integration or artifact contract, so there is no execution-grade spec freezing whether Enso can be the truthful atomic bundle lane for the promoted default basket and what exact approval model that would require.
- Fix intent: create one execution-grade supporting spec under `XSL-005` that freezes the exact Enso atomic-bundle claim, exact target map, default EOA approval model, bundle artifact contract, and coexistence boundary with the current 1inch and CoW truth.
- Acceptance criteria:
  1. The repo explicitly keeps this lane under `XSL-005` and does not open it as a new `XSL-014` route-design sub-lane.
  2. The exact Enso atomic-bundle claim is frozen separately from the current live-repo claim.
  3. The exact promoted-basket targets are frozen, including the yield-buffer sleeve.
  4. The exact default approval model and copy are frozen.
  5. The request-level bundle artifacts and action-level verification artifacts are frozen.
  6. The coexistence boundary with the current 1inch and CoW truth is explicit and non-vague.
- Complexity: medium
- Plan: [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md)
- Executor prompt:
  - Work only after this spec is approved.
  - Keep ownership under `XSL-005`.
  - Touch only `packages/shared/**`, `packages/policy/**`, `apps/api/**`, the Enso proof harness, and the narrow docs needed for `XSL-005B`.
  - Do not reopen `XSL-014A`, do not widen into `apps/web/**`, and do not claim the Enso lane is live until one exact promoted-basket proof run closes the atomic bundle claim.
  - Preserve the exact default approval copy unless the `delegate` smart-wallet path is separately proven:
    `You will approve the starting USDC and sign the bundle transaction with your connected wallet. Nothing executes without your approval.`
- Checklist:
  - [x] report captured
  - [x] context added
  - [ ] fix applied
- [ ] tests run
- [ ] visual/screenshot verification not applicable in this spec-only pass

### XSL-005C Portfolio Buy Surface Closure

- Type: execution/frontend
- Status: active
- Canonical owner lane: `XSL-005`
- Date opened: 2026-04-02
- Context: the repo now has two different truths for similar user intent:
  the already-proven hosted `1inch` approval boundary and an Enso implementation candidate with local verification only. The public `Buy portfolio` path cannot stay ambiguous between them.
- Suspected cause: the 2026-04-02 implementation tranche flipped the default authenticated buy path to Enso before there was live wallet/onchain proof, while the stronger public proof still lived on hosted `1inch`.
- Fix intent: keep the `Buy portfolio` surface, restore hosted `1inch` as the canonical public-default create path until Enso is live-proven, preserve Enso only as an explicit or pre-existing execution-request path, and keep `LI.FI` separate as spec-only truth.
- Acceptance criteria:
  1. The active buy CTA still says `Buy portfolio` on the real buy surfaces.
  2. The default authenticated portfolio buy path creates `executionRouteId = 1inch.ethereum`.
  3. Enso remains available only when explicitly requested or when an Enso execution request already exists.
  4. The shipped public approval model matches the active route: wallet-first hosted `1inch`, user-approved, no hidden automation.
  5. `LI.FI` and `Enso` remain separate from the shared hosted `1inch` truth in docs and copy.
  6. Browser proof exists for the public onboarding journey and the issue text does not overclaim Enso or direct detail-route parity.
- Complexity: high
- Plan links:
  - [2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md)
  - [2026-04-03-xstocks-portfolio-buy-and-deposit-closure.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-portfolio-buy-and-deposit-closure.md)
- Executor prompt:
  - Keep ownership under `XSL-005`.
  - Touch only the narrow web and doc surfaces needed to keep the public-default route truthful.
  - Do not imply that `LI.FI` is the active one-transaction basket lane.
  - Do not imply Enso is live just because local checks pass.
  - Keep approval copy honest for the active public route.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification
- Resolution note:
  - The public CTA remains `Buy portfolio`, but the default authenticated create path has been restored to hosted `1inch` via `executionRouteId = "1inch.ethereum"`.
  - Enso is still supported as an explicit or pre-existing execution-request path, but it is no longer the public default until live proof exists.
  - Public copy now matches the active approval model: wallet-first hosted `1inch`, per-trade user approval, no hidden autonomous execution.

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
- Context: the repo now has a canonical Railway cron proof seed and local API/runtime rehydration tests for recurring autoresearch, but the public host still served stale `worker_runtime_only` truth at the start of this pass.
- Suspected cause: the cleanup and proof-seed rehydration slice existed only on a branch, so deployed parity lagged the strongest repo-owned runtime truth.
- Fix intent: merge the cleanup slice, keep runtime logic closed, and recheck deploy parity rather than reopening scheduler-host implementation.
- Acceptance criteria:
  1. The repo carries the canonical Railway cron proof seed and local runtime surface rehydrates it.
  2. The branch-only cleanup slice is merged or explicitly superseded.
  3. Public deploy parity is rechecked after the merge.
  4. If the public host still lags, one exact deploy-parity blocker is recorded instead of reopening runtime logic.
- Complexity: medium
- Plan links:
  - [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md)
  - [2026-04-03-xstocks-repo-truth-sync-and-cleanup-closeout.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-repo-truth-sync-and-cleanup-closeout.md)
- Executor prompt:
  - Do not reopen runtime logic.
  - Merge or supersede the branch-only cleanup slice.
  - Recheck the public runtime surface after deploy and stop at one exact parity blocker if it still lags.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification not applicable because this lane is worker/deploy/runtime only
- Resolution note:
  - This pass cherry-picked the branch-only cleanup into local commit `66fbeba7` and verified the runtime surface locally through `node --test apps/api/test/api.test.js`, `node --test apps/api/test/provider-rebalance-api.test.js`, and `pnpm --filter @xstocks/api test`.
  - The public host still returned stale runtime truth at audit time, so the remaining residual is merge/deploy parity rather than scheduler-host logic.

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
- Context: The closeout control docs now exist, and the local root matrix has been recovered on 2026-04-03, but public deploy parity is still not closed. Fresh repo-wide verification on the recovery branch now shows `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm check` all passing again, while the public host still serves stale `XSL-006A` runtime truth plus `404` detail and activate routes.
- Suspected cause: the final closure-wave pass corrected public buy-route and repo-truth wording, but it did not re-run the full root matrix before merge, so three different classes of residual were left behind:
  1. a stale worker test harness that no longer matches the promoted-basket route truth,
  2. stale workflow-package workspace config and dependency posture,
  3. production deploy parity still lagging behind merged repo truth and this environment does not currently have usable deploy credentials or tooling to close that last gap directly.
- Fix intent: Recover one truthful green baseline by updating the canonical `XSL-009` owner lane, fixing the worker and workflow regressions, rerunning the full root verification matrix, and rechecking the canonical public routes and runtime surface after the code path is green again.
- Acceptance criteria:
  1. The repo has one execution-grade recovery spec linked from this owner lane that freezes the exact red verification surface and deploy-parity gap.
  2. `pnpm test`, `pnpm build`, `pnpm lint`, and `pnpm check` all pass on the merged recovery branch without narrowing the root workspace scope.
  3. `pnpm --filter @xstocks/worker test`, `pnpm --filter @xstocks/workflow-client build`, and `pnpm --filter @xstocks/workflow-server build` all pass under current repo truth.
  4. The worker rebalance lane remains truthful: scheduled review stays manual-only, no autonomous execution is implied, and the recovery does not reopen `XSL-006` runtime logic.
  5. The repo records exact post-fix public-host truth for `https://24-7.markets/onboarding`, the canonical detail route, the canonical activate route, and `GET /api/runtime/autoresearch?limit=1`.
  6. Release hygiene and landing posture are tracked explicitly instead of being implied by partial green package tests.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
  - [2026-04-03-xstocks-final-closure-wave-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-final-closure-wave-control-plane.md)
  - [2026-04-03-xstocks-verification-matrix-and-runtime-parity-recovery.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-03-xstocks-verification-matrix-and-runtime-parity-recovery.md)
- Continuation note:
  - Date: 2026-04-03
  - The closure-wave control-plane doc now exists and reconciles the current blocker map, route decision, right-rail proof split, and repo-truth sync requirements.
  - The residual gap for `XSL-009` is no longer “missing closeout control doc”; it is landing the final verified slices and deploy rechecks without reintroducing thread drift.
- Continuation note:
  - Date: 2026-04-03 verification recovery
  - User-stated desired outcome:
    1. `test everything so i know stuff works`
    2. `spec out the gaps with spec of spec then go fix it`
  - Verified starting truth on merged `origin/main`:
    1. `pnpm lint` passes.
    2. `pnpm test` and `pnpm check` fail because `apps/worker/src/__tests__/rebalance-orchestrator.test.js` now resolves `blocked` where the existing owner docs still expected `scheduled` or `rebalance_recommended`.
    3. `pnpm build` fails because `@xstocks/workflow-client` and `@xstocks/workflow-server` do not currently compile in the shared workspace.
    4. `pnpm prisma:validate` still needs explicit `DATABASE_URL` env, but the schema itself validates when the documented Postgres URL is supplied.
    5. Live host recheck still shows `https://24-7.markets/onboarding` returning `200`, while the canonical detail and activate routes return `404`, and `GET /api/runtime/autoresearch?limit=1` still reports `truthBoundary=worker_runtime_only`, `recurringAutonomousProven=false`, and `schedulerHost=null`.
  - Fix intent for this tranche:
    1. update the repo-tracked spec and issue truth to reflect the real red surface,
    2. repair the worker scheduled-review regression without widening the runtime claim,
    3. repair workflow package build posture so the root workspace can build truthfully,
    4. rerun the full matrix and record exact public-host parity after the fixes.
  - Executor prompt:
    - Keep ownership under `XSL-009`; do not open a new owner lane.
    - Fix the worker regression in the narrowest truthful way, preserving the current public `1inch` route truth while keeping rebalance review manual-only.
    - Fix workflow package build posture without hiding them from the root matrix.
    - Rerun root and targeted verification plus live host smoke checks, then sync the docs to the exact resulting state.
- Recovery checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [ ] visual/screenshot verification
- Recovery resolution note:
  - 2026-04-03: local repo truth is green again. `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check`, `pnpm --filter @xstocks/worker test`, `pnpm --filter @xstocks/workflow-client build`, `pnpm --filter @xstocks/workflow-server build`, `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:validate`, `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:generate`, and `git diff --check` all pass on `codex/xsl-009-verification-recovery`.
  - 2026-04-03: live-host parity is still not closed. `https://24-7.markets/onboarding` returns `200` but still serves stale onboarding content with old manifest slugs; the canonical detail and activate routes still return `404`; and `GET https://24-7.markets/api/runtime/autoresearch?limit=1` still returns `truthBoundary=worker_runtime_only`, `recurringAutonomousProven=false`, and `schedulerHost=null`.
  - 2026-04-03: the recovery slice is merged on `origin/main` as `c1436e79b8aaf20c41c7442e9ec58e7bea41a6f8` via PR `#7`, and an immediate post-merge host recheck still shows the same stale runtime and `404` route posture.
  - 2026-04-03: the remaining blocker is deployment access, not repo code. This workspace has no `.vercel` link, `vercel` CLI is not installed, and `railway whoami` fails with `invalid_grant`, so this pass cannot truthfully claim public deploy closure from the current environment.

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
  - Date: 2026-04-02
  - Scope freeze: investigate only the stale autoresearch/showcase freshness bug as a narrow `XSL-010` sub-lane coordinated with `XSL-004` and `XSL-006`. Do not open a duplicate owner lane and do not widen this pass into deployment-host closure beyond identifying an exact blocker if one exists.
  - Proven starting truth on updated `origin/main`: the frontend repeatedly surfaces the same showcased portfolio identity because several public routes still anchor to the legacy slug `ai-infra-autopilot`, onboarding still seeds recommendation cards from static mock data, the web adapter rewrites live promoted slots back onto fixed legacy slugs, and recommendation fallback still collapses unresolved matches to the first mock card. The repeated surface is not a literal wallet-address repeat.
  - Proven distinction to preserve during the fix:
    1. `apps/api` catalog ordering is already deterministic by `surface` then `slot.position`, so `always first item` is not the primary bug.
    2. The live promoted default slot in [slot-registry.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl010-fresh/packages/research/manifests/slot-registry.json) no longer matches the legacy showcased identity, so the bug is a frontend freshness and identity-mapping collapse.
    3. Silent mock/default fallback currently masks stale or missing catalog truth on some public surfaces.
  - Fix intent for this tranche: make home, onboarding, comparison, detail, and activation surfaces select the showcased portfolio from truthful live catalog or live slot truth instead of fixed mock slugs; remove the fallback-to-first-card collapse; and fail closed where live catalog truth is required instead of silently reusing stale mock defaults.
  - Acceptance addendum:
    1. The repo can prove whether the repeated surface was the same slot, same manifest slug, same catalog order, or same wallet address.
    2. At least two distinct showcased portfolios can be surfaced locally from live slot/profile truth without collapsing to the same default card.
    3. The strongest final claim states exactly whether the fix changes slot selection, manifest identity, or both.
    4. Browser proof includes home, onboarding, comparison, and at least two detail/activation surfaces.
  - Closeout note:
    1. The repeated showcase was the same stale frontend manifest identity, not the same wallet address.
    2. Live questionnaire fixtures now resolve four distinct slot outcomes, and public routes follow live catalog/slot truth instead of collapsing onto the old showcased slug.
    3. The activation-route `useWallets` warning was a real composition bug when `NEXT_PUBLIC_PRIVY_APP_ID` was unset locally: the app intentionally skipped the Privy provider but still rendered Privy hook consumers. The fix moved those reads behind an app-owned runtime context so unconfigured environments render a truthful disabled wallet state without invoking hooks outside provider boundaries.
  - Executor prompt:
    - Trace the exact fallback path from onboarding and public route defaults to the repeated showcased result.
    - Replace hard-coded showcase identity with live catalog-backed selection only where the cause is proven.
    - Keep API/catalog failures fail-closed on canonical freshness paths instead of silently reusing stale mock defaults.
    - Add regression coverage proving profile or live promoted truth can surface distinct portfolios.
- Continuation note:
  - Date: 2026-04-02
  - Scope freeze: fix only the stale local qualification-slot and replay-curve truth gap across `XSL-010`, `XSL-004`, and `XSL-006`. Do not widen into execution, smart-account, or CRE work.
  - Proven starting truth on updated `origin/main`: the local questionnaire logic still collapses several materially different answer profiles onto the same onboarding slot, `apps/api` does not serialize `manifest.replay` or `manifest.marketIntelligence` into API-backed manifest views, and the web replay renderer only trusts `replay.points` before falling back to a template. Together those gaps make API-backed manifests appear flat or 0% even when research already has real replay metrics.
  - Fix intent for this tranche: map the named profile bands onto distinct promoted slots truthfully, carry a populated manifest replay curve from research/policy/API to the web contract, and prefer manifest-backed replay curves over synthetic templates whenever a truthful curve exists.
  - Acceptance addendum:
    1. At least three qualification profiles resolve to different promoted manifest slugs without reusing the same slot by accident.
    2. API-backed basket manifests expose real replay metrics and a manifest-backed replay curve instead of collapsing to default 0% values.
    3. Web replay surfaces prefer manifest-backed replay curves and only synthesize a line when no curve exists.
  - Executor prompt:
    - Keep slot-resolution changes scoped to local questionnaire/profile mapping and mirrored policy fixture coverage.
    - Use only research-derived replay metrics to backfill replay curves; do not imply live holdings performance.
    - Add regression coverage for slot-to-manifest differentiation and replay-curve preference.
  - Closeout note:
    1. The questionnaire compiler and local web adapter now split the named profile bands across all four promoted slots instead of collapsing broad/simple and high-risk thematic cases back onto stale defaults.
    2. Research, policy normalization, API serialization, and web rendering now preserve manifest-backed replay curves, so API-backed manifests no longer default to flat 0% replay when truthful replay metrics already exist.
    3. `pnpm --filter @xstocks-strategy-lab/web test`, policy qualification fixtures, API qualification fixtures, and API route tests passed in the clean worktree.
    4. `pnpm --filter @xstocks-strategy-lab/web build` now passes on refreshed `origin/main`; only existing warnings remain from the optional Privy Farcaster mini-app dependency resolution path and pre-existing unused-variable lint warnings outside this lane.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification

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
  - After rebasing onto the current `origin/main`, verification again passed with `pnpm --filter @xstocks-strategy-lab/xstocks test`, `node --test apps/api/test/api.test.js`, and `git diff --check`, and the latest hosted proof rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-07-22.272Z/summary.json), [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-07-22.272Z/approval-payloads.json), and [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl014-proof/tmp/proof/oneinch-fusion-2026-04-02T00-07-22.272Z/signature-inputs.json).
  - The first exact remaining external blocker is now signer-owned approval: the rerun stopped with `code=missing_user_signature`, `stage=awaiting_signature`, and `message="Signer-owned 1inch Fusion EIP-712 signatures are still required for 6 quoted core legs before backend submission can be recorded."` No signed submission, venue order id, venue-status update beyond `quote_ready`, or receipt truth exists yet.
  - A fresh 2026-04-03 rerun wrote [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/summary.json), [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/approval-payloads.json), and [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/signature-inputs.json) after refreshing the Privy session.
  - That rerun still stopped at the same signer-owned approval boundary, and this pass did not find a repo-owned artifact proving the later `ORDER_SAVER_ERROR / NotEnoughBalanceOrAllowance` claim.

### XSL-014D Structured Execution Explorer Links And Blotter Truth

- Type: frontend/backend contract
- Status: active
- Canonical owner lane: `XSL-014`
- Date opened: 2026-04-02
- Context: `XSL-014C` already restored truthful signer-owned 1inch execution storage on the clean tip, including per-leg order ids, venue status, and receipt hashes when they exist. The remaining product gap is that the activation and bottom-blotter surfaces still collapse those identifiers back into plain text or inferred copy, and the blotter currently leans on the latest execution request more aggressively than the backend can prove as current holdings truth.
- Suspected cause: execution artifacts are persisted on execution requests and activity-event payloads, but the API activity surface omits structured execution fields, the frontend contracts do not carry explorer metadata, and the UI appends raw hashes into prose instead of rendering explicit fail-closed references.
- Fix intent: extend the minimum shared/API/frontend contract path so execution-derived history and lifecycle rows can carry `txHash`, `venueOrderId`, `chain`, and derived explorer URLs, render real Ethereum explorer links on activation and blotter surfaces, and tighten positions/history/activity truth without fabricating holdings performance or PnL.
- Acceptance criteria:
  1. Activity/history rows exposed to the web app can carry structured execution artifacts: `txHash`, `venueOrderId`, `chain`, and derived explorer URLs where the backend can truthfully derive them.
  2. Ethereum transaction artifacts derive and expose Etherscan and EigenPhi transaction URLs only when a valid tx hash exists.
  3. The activation screen and bottom blotter render explicit explorer links for execution truth without falling back to invented links or fake ids when artifacts are missing.
  4. Positions/history/activity surfaces stop overstating live holdings or performance; unknown PnL or holdings performance remains unclaimed.
  5. Verification passes for `pnpm --filter @xstocks-strategy-lab/web test`, `pnpm --filter @xstocks-strategy-lab/web build`, `node --test apps/api/test/api.test.js`, and `git diff --check`, plus screenshot proof of the rendered explorer links.
- Complexity: medium
- Plan: [2026-04-02-xstocks-execution-explorer-links-and-blotter-truth.md](/Users/user/PycharmProjects/_worktrees/xstocks-xsl-014d-20260402/docs/plans/active/2026-04-02-xstocks-execution-explorer-links-and-blotter-truth.md)
- Executor prompt:
  - Work in `apps/api/**`, `apps/web/**`, and the narrow contract files needed to carry structured execution artifacts end to end.
  - Replace plain-text execution references with structured fields and rendered links on activation and blotter surfaces.
  - Derive only Ethereum transaction explorer URLs for this slice: Etherscan and EigenPhi.
  - Keep fail-closed behavior when `txHash` or `venueOrderId` is absent.
  - Do not fabricate PnL, holdings performance, autonomous execution, smart-account-native venue signing, or CRE runtime claims.
- Checklist:
  - [x] report captured
  - [x] context added
  - [x] fix applied
  - [x] tests run
  - [x] visual/screenshot verification
- Verification note:
  - Structured execution artifacts now survive the API activity-surface contract as additive row fields: `txHash`, `venueOrderId`, `chain`, and derived explorer URLs when an Ethereum tx hash is present.
  - The web activation execution-truth surface now renders explicit recorded artifacts with fail-closed fallback copy when no venue order id or settlement receipt has been recorded yet.
  - The bottom blotter history/activity surfaces now render structured artifact chips and explorer links instead of appending raw hashes into prose, and positions continue to leave PnL/performance unclaimed.
  - Verification passed with `pnpm --filter @xstocks-strategy-lab/web test`, `pnpm --filter @xstocks-strategy-lab/web build`, `node --test apps/api/test/api.test.js`, and `git diff --check`.
- Resolution note:
  - Exact truthful claim after this slice: when repo-owned execution truth has recorded a `venueOrderId` and/or `txHash`, the activation and bottom-blotter surfaces now expose those artifacts structurally and render real Etherscan/EigenPhi links for Ethereum transaction hashes only; when the backend has not recorded those artifacts, the UI stays explicit and fail-closed instead of fabricating order, receipt, holdings-performance, or PnL claims.

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
