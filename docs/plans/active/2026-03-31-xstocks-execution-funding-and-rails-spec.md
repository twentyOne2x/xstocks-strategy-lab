# xStocks Execution, Funding, And Live Rails Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Define the execution, lending, and funding rails for `xStocks Strategy Lab`, including:
1. execution venues,
2. lending and yield rails,
3. wallet and funding providers,
4. live-proof hierarchy and fallback rules.

## Non-goals

This workstream does not:
1. build full multi-venue best execution in MVP,
2. require every product mode to be live on day one,
3. treat all providers as interchangeable,
4. turn funding into the hero product story,
5. overclaim unverified xStocks-on-Euler live support.

## Product Outcome Contract

When this workstream is complete enough for MVP:
1. the product has one clear primary execution rail,
2. one clear primary lending/yield rail,
3. one clear funding stack,
4. one clear hierarchy for public-proof, mentor-reported, and unverified rails.

## User-Journey Contract

The user should be able to:
1. inspect a strategy without wallet connection,
2. choose to connect and fund only at activation time,
3. know which route, vault, and venue the product is using,
4. see whether the action is live, preview-only, or blocked.

Interaction budget target:
1. zero funding steps before activation intent,
2. one wallet creation or connection step,
3. one funding step if needed,
4. route and rail truth visible before final confirmation.

## Symptom Contract

Observed problem:
1. many possible rails were discussed,
2. but the repo had no authoritative hierarchy for primary, secondary, and unverified rails.

Likely culprit:
1. venue and provider choice had not been frozen into one stack.

Non-obvious alternatives:
1. funding may not be needed in MVP,
2. execution may remain preview-only.

Falsifiers:
1. if sponsor or public proof collapses the choice space to one stack, this spec shrinks,
2. if live proof is removed from scope, the rail hierarchy matters less.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. one truthful rail hierarchy that supports a credible proof path.

User UX:
1. wallet and funding happen late,
2. route and venue choice is clear,
3. live versus preview is explicit.

Sustainability:
1. minimal provider count,
2. no premature multi-venue sprawl.

Safety:
1. unverified rails fail closed,
2. no overclaiming Euler live support.

Maintainability:
1. adapter boundaries,
2. one primary and one secondary execution venue,
3. one funding stack.

## Current Live Truth

1. Public xStocks messaging supports xChange on Ethereum and Ink.
2. Public xStocks messaging names Cow Swap and 1inch as Ethereum execution surfaces.
3. Morpho has a live `SPYx/AUSD` market and the Flowdesk AUSD RWA Strategy vault is live.
4. Euler is real infrastructure for directional strategies, but the exact live xStocks-on-Euler path remains unverified from public proof captured here.
5. Privy is the strongest current fit for wallet creation and destination reveal, but strict self-serve deposit truth is still wallet-funded only: external wallet transfer or manual same-chain transfer into the revealed destination.
6. LI.FI is the strongest current fit for bridge/swap after funding.
7. `privy_card` and `privy_exchange` are optional hosted convenience rails and may require regulated on-ramp verification; they are not the canonical self-serve default.
8. Mesh remains explicit absent/deferred until a real repo-owned UI and backend contract exist for it.
9. Spread Finance on Ink remains mentor-reported until captured with direct proof.

## Current Local Implementation Audit

Shipped:
1. lightweight docs that mention Cow Swap, 1inch, Morpho, and Spread Finance.

Partial:
1. execution architecture notes,
2. funding-provider discussion in thread context.

Unshipped:
1. route abstraction,
2. funding abstraction,
3. wallet and smart-account integration,
4. live/dry-run proof harness,
5. rail-specific UI surfaces.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend planned execution and policy package boundaries,
2. keep provider integrations behind backend modules.

Existing logic to reuse:
1. route hierarchy already present in root docs,
2. planned smart-account and API boundaries,
3. frontend route/vault transparency contract.

New entrypoints required:
1. no extra service justified.

Structural refactor assessment:
1. not justified yet beyond clear adapter boundaries.

Build/deploy fan-out assessment:
1. keep provider SDKs out of the frontend unless strictly needed for wallet UX.

## Existing-Spec Inventory

1. [README.md](/Users/user/PycharmProjects/xstocks-strategy-lab/README.md)
   - Current relevance: high.
   - Decision: update via this sub-spec and later README link refresh.
2. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: update via this sub-spec.
3. [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)
   - Current relevance: high.
   - Decision: inherit the activation-manifest boundary from it rather than redefining research promotion here.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| Venue hierarchy | primary and secondary execution rails | prose only | adapter contract and UI | integration/frontend |
| Funding stack | Privy + LI.FI flow | prose only | integration and UI | integration/frontend |
| Activation boundary | manifest-to-preflight contract | prose only | schema and route checks | integration/backend |
| Truth labels | live/preview/blocked states | prose only | state wiring | frontend/backend |
| Spread confirmation | secondary Ink rail truth | mentor report only | public or onsite artifact | external proof |

## Rail Hierarchy

### Publicly verified primary execution rails

1. `Cow Swap` on Ethereum
2. `1inch` on Ethereum

### Publicly verified primary lending and yield rails

1. `SPYx/AUSD` on Morpho
2. `Flowdesk AUSD RWA Strategy` vault on Morpho as the yield-buffer sleeve

### Publicly described but still unverified in this repo

1. exact live xStocks-on-Euler market path

### Mentor-reported secondary rail

1. `Spread Finance` on Ink as a Cow-backed xChange terminal

## Execution Adapter Contract

MVP adapter posture:
1. one primary execution adapter,
2. one secondary adapter,
3. no best-execution bundling across many venues.

Recommended mapping:
1. primary: `Cow Swap`
2. secondary: `1inch`

Deferred:
1. `0x`
2. `Matcha`
3. `Bebop`
4. broad multi-router aggregation

## Funding Contract

Recommended funding stack:
1. `Privy` for embedded wallet creation, wallet connection, and destination reveal
2. canonical strict self-serve deposit path: external wallet transfer / manual same-chain transfer into the revealed destination (`privy_wallet` plus `manual_transfer`)
3. `LI.FI` for bridge/swap after funding if assets land on the wrong chain/token

Optional hosted convenience rails:
1. `privy_card`
2. `privy_exchange`

Hosted convenience-rail rule:
1. treat them as optional only,
2. never describe them as the canonical self-serve path,
3. state that regulated on-ramp verification may be required.

Optional later:
1. `Mesh` for pay-from-exchange/wallet checkout cases only after a real repo-owned contract exists; for now it stays absent/deferred

Funding flow:
1. browse without wallet,
2. connect or create wallet at activation,
3. reveal the same-chain destination address,
4. fund via external wallet transfer or manual same-chain transfer as the canonical self-serve path,
5. optionally use `privy_card` or `privy_exchange` only when the user explicitly wants a hosted convenience rail and any regulated verification succeeds,
6. route into needed chain/token via LI.FI if required,
7. activate strategy.

## Live-Proof Rules

### Truth labels

The product must label actions as:
1. `live`
2. `preview`
3. `blocked`
4. `mentor-confirmed`

### MVP live-proof preference

1. use Cow Swap or 1inch for Ethereum execution proof,
2. use Morpho for lending and yield-sleeve proof,
3. keep Euler central in the product and directional experience,
4. do not fake exact Euler live xStocks proof if it is still unverified.

### Fallback rule

If exact xStocks-on-Euler live support is still not proven:
1. keep Euler directional previews and abstractions central,
2. use Morpho and Ethereum execution rails for truthful live proof,
3. keep xStocks product logic first-class.

## Activation Boundary Contract

Execution must begin from:
1. a promoted `activation_manifest`,
2. current live xStocks state,
3. current live route or vault state,
4. user notional and wallet or smart-account state.

Execution must not begin from:
1. raw research candidates,
2. failed challengers,
3. experiment output that has not crossed the Strategy Lab promotion boundary.

Canonical derivation rule:
1. `activation_manifest` + live state -> `execution_plan`

## Smart-Account Contract

The smart account should:
1. receive the activation payload,
2. enforce bounded permissions,
3. remain separate from the intelligence engine,
4. remain separate from the research harness,
5. expose pause and turn-off controls.

The smart account should not:
1. hold full intelligence logic,
2. own provider-specific funding logic,
3. be required before the user can explore the product.

## State-And-Truth Contract

Canonical user-visible states:
1. `live`
2. `preview`
3. `blocked`
4. `mentor_confirmed`
5. `unverified`

Source of truth:
1. persisted route configuration plus live checks.

Fail-closed rule:
1. `mentor_confirmed` and `unverified` may not surface as `live`.

## Served-Surface Authority Contract

Canonical intended surface:
1. wallet/funding/activation views in `apps/web`,
2. backend route checks in `apps/api`.

Current status:
1. no served-surface proof exists yet.

## Visual-Fit Contract

Visual-fit status:
1. in scope but subordinate to functional truth.

Reference:
1. xStocks-adjacent frontend style contract.

## Frontend Copy And Language Contract

Surface class:
1. mixed human + developer.

Preferred human labels:
1. `Fund wallet`
2. `Route`
3. `Venue`
4. `Vault`
5. `Live`
6. `Preview`
7. `Blocked`

Banned default-path jargon:
1. raw provider endpoint names,
2. unexplained RFQ jargon.

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked | Start now or later |
| --- | --- | --- | --- |
| Freeze funding provider roles | activation flow depends on it | no | now |
| Freeze primary/secondary venues | execution UI depends on it | no | now |
| Freeze activation-manifest preflight contract | truthful execution depends on it | no | now |
| Implement route labels and proof states | user truth depends on it | yes, on payloads | later |
| Capture Spread proof | changes secondary-rail confidence | yes, on external artifact | later |

## Implementation Waves

Wave 1:
1. adapter hierarchy, truth labels, and activation-manifest preflight contract.

Wave 2:
1. funding and activation UX.

Wave 3:
1. live or dry-run rail proof.

## Hosted / Deployed / Production Boundary

1. local-only: current planning
2. deployed-host verified: authenticated linked-wallet activation save, execution-request creation, per-leg CoW quote sweep across `25`, `50`, `100`, `250`, and `500` USD gross, and runtime-store capture all exist for the current promoted Ethereum basket lane.
3. production-host verified: partial only. One real `$25` hosted linked-wallet proof reaches CoW `awaiting_approval` on `NVDAx`, proving the current live lane can save activation, create execution, and reach the approval boundary for at least one core leg.
4. still unproven: a full promoted-basket signed submission plus receipt, because no all-leg executable floor was observed through `500` USD gross and the remaining core legs are structurally blocked on current CoW venue truth (`MSFTx`, `AAPLx`, `METAx`, `AMZNx`, `GOOGLx`).

## Exact Current CoW Universe

Direct standalone USDC -> xStock CoW quotes across the full repo-owned Ethereum xStocks universe currently split as:
1. quoteable across the tested `15, 25, 50, 100, 250, 500, 1000, 2500, 5000` USD ladder: `NVDAx`, `TSLAx`, `SPYx`
2. never quote directly across that ladder: `AAPLx`, `AMDx`, `AMZNx`, `AVGOx`, `GOOGLx`, `METAx`, `MSFTx`, `ORCLx`
3. exact blocker class for the never-quoteable set in the current standalone scan: `cow_no_liquidity`

Resulting basket posture:
1. the current promoted basket remains structurally incompatible with present CoW venue truth because it still requires five never-quoteable core legs,
2. no product-usable CoW-only onboarding basket exists yet because the direct quoteable universe is only three xStocks, below the research minimum `holdings_count=4`,
3. the only fully intact repo basket under current CoW truth is the benchmark-only `sp500_core` / `SPYx` lane, so current onboarding baskets stay recommendation-only.

## Assumptions

1. Ethereum mainnet stays the default chain.
2. Users should not be forced to connect a wallet before the value is clear.
3. One yield sleeve is enough for MVP.
4. One primary execution venue plus one secondary venue is enough for MVP.

## Invalidators

1. Public proof appears that another venue is materially more sponsor-aligned or reliable.
2. Privy or LI.FI proves unusable for the target deployment path.
3. Euler live xStocks proof becomes available and changes the best truthful live path.

## Proof Artifacts

1. provider matrix by responsibility,
2. one screenshot or screen recording of funding flow,
3. one screenshot or evidence artifact of Morpho vault/yield sleeve,
4. one sample manifest-to-execution-plan preflight payload,
5. one route-context screenshot for execution,
6. one demo note or README artifact describing what is live versus preview.

## Verification Commands

Current repo-verifiable command:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase checks:
1. environment-variable presence checks for providers,
2. route-surface smoke checks,
3. activation-flow integration check.

## Final Reporting Contract

At lane close, report:
1. primary and secondary rails,
2. funding providers actually integrated,
3. live versus preview labels used,
4. proof artifacts captured,
5. what remains mentor-reported or unverified,
6. what is local-only versus served-surface verified.

## Exit Criteria

This workstream is complete only when:
1. the funding stack is frozen,
2. the execution stack is frozen,
3. the product can truthfully state what is live, preview, and mentor-reported,
4. the frontend can expose route, vault, and funding context without ambiguity.

## Decision Log

1. 2026-04-01: canonical basket-lane wallet requirements must follow effective readiness truth for current user-facing surfaces, and the live default-basket catalog now matches that linked-wallet-first export.
2. 2026-04-01: public wording must describe the current basket as linked-wallet-first and smart-wallet-optional without converting that into a full hosted-execution-closure claim.
3. 2026-04-01: Mesh remains explicit absent/deferred truth until a real repo-owned UI and backend contract exist.
4. 2026-04-01: strict self-serve deposit means no new KYC/KYB step introduced by this app; the canonical path is external wallet transfer / manual same-chain transfer only.
5. 2026-04-01: `privy_card` and `privy_exchange` stay available only as optional hosted convenience rails and may require regulated on-ramp verification.

## Progress Log

1. 2026-04-01: verified that Railway serves `/api/public-agent-handoff`, `/health`, and `/api/catalog`, and that the live default-basket catalog now exports linked-wallet-first wallet metadata with `requiresSmartAccount=false` and `minFundingUsd=0`.
2. 2026-04-01: aligned the repo-owned wording so wallet-funded transfer is the canonical self-serve deposit truth, `privy_card` and `privy_exchange` are convenience rails only, and Mesh stays explicit absent/deferred.
3. 2026-04-01: captured a real hosted authenticated proof run for the promoted basket at `$25`; activation save and execution-request creation succeeded, `NVDAx` reached `awaiting_approval`, and the remaining core legs failed with exact CoW venue blockers instead of route-construction ambiguity.
4. 2026-04-01: post-proof reconciliation confirms the remaining execution/funding gap is no longer catalog-wallet-metadata drift; it is the still-partial hosted execution boundary owned by `XSL-014`, plus the exact self-serve deposit truth that wallet-funded USDC transfer remains the only truthful no-KYC/no-KYB path.
5. 2026-04-01: direct standalone CoW universe scanning across all repo-owned Ethereum xStocks now confirms only `NVDAx`, `TSLAx`, and `SPYx` quote directly; no product-usable CoW-only onboarding basket exists under current venue truth, so onboarding execution stays preview-only.
