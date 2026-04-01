# xStocks Market Intelligence Signal Engine Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Design `Market Intelligence` as a standalone product that:
1. monitors xStocks-relevant market data and signal providers,
2. produces one blackbox `signal_artifact`,
3. feeds Strategy Lab, portfolio construction, and directional recommendation without directly executing trades,
4. can also be rendered as a dedicated side-panel product surface inside the portfolio terminal.

## Non-goals

This workstream does not:
1. expose raw model internals to end users,
2. own target portfolio weights,
3. own rebalance decisions,
4. replace xStocks as the primary truth layer,
5. require every supported asset to have identical signal depth on day one.

## Product Outcome Contract

The finished intelligence layer should let the product say:
1. here is the current view on `MSTRx`, `SPYx`, `NVDAx`, or a theme,
2. here is how confident the engine is,
3. here is the horizon and urgency,
4. here is the resulting portfolio or directional implication,
5. without forcing the user to inspect raw data-source reasoning,
6. while remaining independently legible as its own product and data contract.

## User-Journey Contract

The user should be able to:
1. open a hero intelligence lane,
2. see the current view,
3. inspect a concise explanation such as `large holders accumulating`, `BTC treasury signal strengthening`, or `risk regime turned defensive`,
4. move from that view into an allocation or strategy expression.

Interaction budget target:
1. one hero view should be understandable on one screen,
2. no wallet required,
3. the user should reach `Express this view` in two primary actions or fewer.

## Symptom Contract

Observed problem:
1. many intelligence ideas existed,
2. but there was no frozen contract turning them into one reusable signal object.

Likely culprit:
1. intelligence and portfolio layers were being discussed as one blurred system.

Non-obvious alternatives:
1. intelligence might only be explanatory UI,
2. the signal might need to be transparent rather than blackbox.

Falsifiers:
1. if portfolio construction can consume raw provider feeds directly, this layer is too large,
2. if users require full feature transparency, the blackbox contract is wrong.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. one reusable blackbox signal artifact.

User UX:
1. concise stance, confidence, and reasons,
2. no raw provider dump on the primary path.

Sustainability:
1. small provider set,
2. one signal schema,
3. no provider-specific frontend forks.

Safety:
1. no direct trade authority,
2. stale or weak signals degrade safely.

Maintainability:
1. provider adapters stay behind one artifact,
2. downstream systems consume one contract,
3. the intelligence product can evolve independently of the portfolio engine as long as the signal contract remains stable.

## Current Live Truth

1. xStocks official public APIs provide live tokenized-equity state, not deep public historical backtest data.
2. `MSTRx` is listed on xStocks and is a strong intelligence hero asset because of its link to Bitcoin treasury behavior.
3. Nansen is suitable as an enrichment layer for holder concentration, labeled wallets, and smart-money context.
4. Twitter/social inputs are useful but should not become the sole product story.
5. Market intelligence is currently only a product idea in this repo; no implementation exists yet.

## Current Local Implementation Audit

Shipped:
1. repo docs reference intelligence-adjacent ideas such as theme discovery and public strategies.

Partial:
1. the README and frontend docs imply recommendation flows,
2. the repo mentions a research runner package boundary.

Unshipped:
1. signal ingestion,
2. signal scoring,
3. signal artifact schema,
4. hero intelligence pages,
5. provider adapters beyond conceptual notes.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. new surface justified as shared research/backend logic,
2. frontend should consume artifacts rather than compute signals.

Existing logic to reuse:
1. planned `packages/research`,
2. xStocks adapter boundary,
3. theme and strategy vocabulary.

New entrypoints required:
1. no new worker type beyond the planned worker.

Structural refactor assessment:
1. not justified yet beyond clean package boundaries.

Build/deploy fan-out assessment:
1. provider logic should stay out of the frontend bundle.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: update via this sub-spec.
   - Why: umbrella defines boundary, this doc defines execution detail.
2. [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md)
   - Current relevance: medium.
   - Decision: reuse as display guidance only.
   - Why: it does not define signal semantics.
3. [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)
   - Current relevance: high.
   - Decision: inherit the promotion boundary from it.
   - Why: signal artifacts may influence Strategy Lab and portfolio logic, but they do not bypass manifest promotion.

## Thread-Recurrence Audit

The repeated intelligence asks collapse into four canonical requirements:
1. intelligence should be a standalone product,
2. its outcome should be a blackbox signal,
3. that signal should feed portfolio construction and rebalancing,
4. `MSTRx` and large-holder/onchain tracking are the clearest hero examples.

This workstream also owns the requirement that intelligence be:
1. independently spec'd as a standalone product,
2. surfaced inside the portfolio terminal as a dedicated side panel rather than buried in generic metadata.

No separate priority matrix is needed inside this sub-spec because the umbrella already carries it.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| Signal schema | one blackbox artifact | prose only | actual schema/types | backend |
| Hero lane | `MSTRx` intelligence lane | none | UI and payloads | frontend/backend |
| Provider mix | xStocks + enrichment + social | conceptual notes only | adapters and scoring rules | backend |
| Consumer handoff | signal feeds portfolio layer | none | contract wiring | backend |

## Signal Product Contract

### Blackbox boundary

The intelligence system is blackbox:
1. to users,
2. to the frontend presentation layer,
3. but not to the portfolio engine.

The portfolio engine must receive a structured artifact.

### Required signal artifact

Minimum fields:
1. `signal_id`
2. `generated_at`
3. `expires_at`
4. `scope_type`
   - `asset`
   - `theme`
   - `basket`
5. `scope_key`
   - example: `MSTRx`
6. `stance`
   - `strong_positive`
   - `positive`
   - `neutral`
   - `negative`
   - `strong_negative`
7. `confidence`
8. `horizon`
   - `tactical`
   - `swing`
   - `strategic`
9. `risk_regime`
   - `risk_on`
   - `balanced`
   - `risk_off`
10. `rebalance_urgency`
    - `none`
    - `monitor`
    - `consider`
    - `act`
11. `allocator_hint`
    - `increase`
    - `trim`
    - `hold`
    - `hedge`
    - `park_in_ausd`
12. `top_reasons`
    - short human-readable reason list
13. `provider_summary`
    - machine-readable coarse source counts or tags

## Provider Mix

### Core providers

1. xStocks public APIs
   - use for asset universe, live state, multiplier, PoR, and route status
2. onchain intelligence provider
   - Nansen is the clearest current candidate
3. curated market/social signal provider
   - Twitter/X or equivalent monitored accounts
4. optional internal rule layer
   - theme classification and event bucketing

### Provider roles

1. xStocks does not produce the blackbox signal alone.
2. Nansen enriches holder, entity, and wallet-flow context.
3. Social/news inputs enrich narrative and event timing.
4. The signal engine combines them into one artifact.
5. Downstream consumers may use the signal artifact, but only promoted strategy manifests cross the frontend and activation boundary.

## Hero Intelligence Lanes

### `MSTRx`

This is the clearest hero lane.

Signal story:
1. BTC treasury accumulation or treasury-linked onchain context,
2. holder and smart-money changes,
3. narrative intensity,
4. market regime.

Outcome:
1. an `MSTRx` stance with confidence and urgency,
2. a direct portfolio implication.

### `SPYx`

Use for:
1. broad market regime,
2. defensive versus growth rotation,
3. baseline comparison.

### `NVDAx`

Use for:
1. AI-infra theme,
2. concentrated theme sentiment and holder shifts.

## Theme Intelligence

The signal engine must also support theme scope.

Initial themes:
1. `Mag 7`
2. `AI Infra`
3. `US Tech Leaders`
4. `S&P Core`

Each theme should resolve to:
1. one theme-level stance,
2. one confidence score,
3. one allocator hint.

## Frontend-Visible Artifacts

The frontend should show:
1. current stance,
2. confidence,
3. horizon,
4. top reasons,
5. what changed since last signal,
6. resulting portfolio implication.

The frontend should not show:
1. raw feature weights,
2. raw prompt logs,
3. all watched accounts,
4. low-level provider internals.

## Product Surface Contract

`Market Intelligence` must exist in two forms simultaneously:
1. as a standalone product/workstream with its own signal engine, proof artifacts, and evolution path,
2. as a dedicated side-panel module inside the portfolio terminal.

### Side-panel requirements

Inside the portfolio terminal, the intelligence panel should:
1. live on the right side by default,
2. show the current view, confidence, horizon, and what changed,
3. explain the portfolio implication,
4. remain visible while the user inspects allocations, replay, and positions.

It should not:
1. be collapsed into a generic info tooltip,
2. be buried below the fold as secondary metadata,
3. require navigating to a separate page just to see the current signal outcome.

### Standalone-product requirements

As a standalone product, `Market Intelligence` should still make sense if:
1. no portfolio activation exists yet,
2. the user only wants the signal and view product,
3. the product later gains its own navigation entry, API surface, or commercial packaging.

## State-And-Truth Contract

Canonical user-visible states:
1. `signal_ready`
2. `signal_stale`
3. `signal_weak`
4. `signal_unavailable`

Source of truth:
1. latest persisted `signal_artifact`.

Fail-closed rule:
1. stale or unavailable signals must not imply action urgency.

## Served-Surface Authority Contract

Canonical intended surface:
1. future intelligence screens in `apps/web`.

Current status:
1. no served UI exists yet,
2. user-facing readiness remains incomplete.

## Visual-Fit Contract

Visual-fit status:
1. in scope but not yet proven.

Reference:
1. xStocks styling and the repo frontend style contract.

## Frontend Copy And Language Contract

Surface class:
1. human-facing.

Preferred copy:
1. `view`
2. `confidence`
3. `what changed`
4. `express this view`

Banned default-path jargon:
1. `artifact`
2. `allocator_hint`
3. raw provider field names.

## Assumptions

1. `MSTRx` remains a hero asset.
2. Users value opinionated output more than raw dashboards.
3. A blackbox signal can still be trusted if reasons are concise and stable.
4. Nansen-style enrichment is optional at implementation time but part of the desired architecture.

## Invalidators

1. The product shifts away from intelligence-led UX.
2. Users explicitly require transparent feature-level reasoning instead of a blackbox signal.
3. No viable intelligence providers can be integrated in time for the MVP.

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked | Start now or later |
| --- | --- | --- | --- |
| Freeze `signal_artifact` schema | everything else depends on it | no | now |
| Build `MSTRx` hero lane | clearest demo story | yes, on schema | later |
| Add holder enrichment provider | strengthens hero lane | yes, on schema | later |
| Add social/news adapter | improves signal quality | no | later |

## Implementation Waves

Wave 1:
1. schema and mock artifacts.

Wave 2:
1. provider adapter scaffold and persisted signals.

Wave 3:
1. frontend hero lane and portfolio handoff.

## Hosted / Deployed / Production Boundary

1. local-only: current planning and future mocks
2. deployed-host verified: none yet
3. production-host verified: none yet
4. still unproven: all user-facing signal claims

## Proof Artifacts

1. example `signal_artifact.json` for `MSTRx`,
2. example theme-level signal artifact,
3. screenshot or video of the intelligence lane in the frontend,
4. one documented input-provider map,
5. one example of signal-to-allocation handoff.

## Verification Commands

Current repo-verifiable command:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase checks:
1. schema validation test for `signal_artifact`
2. snapshot tests for hero-signal payloads

## Final Reporting Contract

At lane close, report:
1. provider set used,
2. signal schema version,
3. hero assets shipped,
4. payload examples,
5. local-only versus served-surface proof,
6. remaining signal-quality gaps.

## Exit Criteria

This workstream is complete only when:
1. the signal artifact is frozen,
2. at least one hero intelligence lane is implemented or mocked with truthful provider context,
3. the frontend can display a blackbox signal cleanly,
4. the portfolio engine can consume the artifact without custom one-off logic.

## Assistant-Added Caveats

The blackbox contract is good product design, but it still requires a machine-readable signal schema. `Blackbox` should mean opaque to the user, not opaque to the rest of the system.
