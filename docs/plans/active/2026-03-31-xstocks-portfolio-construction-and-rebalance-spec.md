# xStocks Portfolio Construction And Rebalance Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Design the portfolio-construction and rebalance layer that:
1. consumes blackbox signal artifacts,
2. consumes promoted Strategy Lab incumbents and activation manifests,
3. produces target basket or directional expressions,
4. handles sleeve selection and target changes,
5. decides when a rebalance is worth acting on.

## Non-goals

This workstream does not:
1. own raw intelligence ingestion,
2. expose raw intelligence internals,
3. guarantee live trade execution,
4. become a general-purpose portfolio optimizer across every DeFi protocol,
5. require shorting or leverage in every mode.

## Product Outcome Contract

The finished portfolio layer should let the product say:
1. here is the target portfolio or directional expression,
2. here is why it changed,
3. here is whether the engine recommends holding, increasing, trimming, hedging, or parking in `AUSD`,
4. here is whether the change is strong enough to rebalance now,
5. here is which promoted manifest this recommendation came from.

## User-Journey Contract

The user should be able to:
1. start from a theme, strategy, or hero asset,
2. receive one clear recommendation,
3. compare current and proposed state,
4. understand whether the engine is recommending no action, partial action, or full action,
5. see any resulting positions and history in the bottom blotter.

Interaction budget target:
1. current versus proposed state visible on one screen,
2. rebalance outcome readable without raw logs,
3. no wallet required for previewing recommendations.

## Symptom Contract

Observed problem:
1. intelligence output, target portfolio, and rebalance action were not separated cleanly.

Likely culprit:
1. recommendation and execution semantics were still blended in discussion.

Non-obvious alternatives:
1. the product might only need recommendations,
2. manual portfolio construction might be enough.

Falsifiers:
1. if rebalancing is removed from product scope, this layer shrinks materially,
2. if the signal artifact already fully determines weights, this spec is too broad.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. one safe portfolio recommendation and rebalance contract.

User UX:
1. clear current-versus-target view,
2. visible sleeves,
3. understandable rebalance states.

Sustainability:
1. few sleeves,
2. one recommendation schema,
3. no hero-asset-specific one-offs.

Safety:
1. rebalance gates,
2. anti-thrashing rules,
3. no action from stale signals.

Maintainability:
1. separate signal, portfolio, and execution layers,
2. shared contracts for guest and wallet-linked users.

## Current Live Truth

1. The repo currently has no portfolio schema, no rebalance schema, and no DB model.
2. The product already implies three sleeves:
   - xStocks basket exposure,
   - Euler directional exposure,
   - idle or cash sleeve such as `AUSD` in the Flowdesk Morpho vault.
3. The user has explicitly approved a guest-session-to-wallet-linked-user-profile identity model on Railway Postgres.
4. The user wants guided-question onboarding, not chart-first onboarding.

## Current Local Implementation Audit

Shipped:
1. Autopilot and Directional Vault are named product modes.

Partial:
1. docs imply starter baskets, replay, and directional previews.

Unshipped:
1. target-weight schema,
2. sleeve schema,
3. rebalance policy,
4. activation-manifest linkage,
5. incumbent/challenger logic,
6. positions/history schema,
7. guest-to-user state promotion logic.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend planned `packages/policy` and shared-schema boundaries.

Existing logic to reuse:
1. starter baskets,
2. directional preview concepts,
3. bottom blotter requirement.

New entrypoints required:
1. no new standalone service justified.

Structural refactor assessment:
1. required now only as schema discipline.

Build/deploy fan-out assessment:
1. keep target-weight and rebalance logic out of the frontend bundle.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: update via this sub-spec.
2. [docs/EXECUTION_PLAN.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/EXECUTION_PLAN.md)
   - Current relevance: medium.
   - Decision: reuse for sequencing, not semantics.
3. [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)
   - Current relevance: very high.
   - Decision: inherit from it rather than redefining the research ratchet here.

## Thread-Recurrence Audit

The conversation repeatedly returned to:
1. starter baskets and themes,
2. long-only versus directional modes,
3. Morpho as a yield sleeve,
4. how the intelligence engine should feed portfolio construction,
5. what qualifies as a rebalance.

These are all one workstream and should remain in one spec.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| Sleeve model | core/directional/yield sleeves | prose only | schema and code | backend |
| Recommendation object | target allocations and rationale | prose only | schema and payloads | backend |
| Activation-manifest boundary | promoted strategy ref into portfolio layer | prose only | schema and linkage | backend |
| Rebalance engine | thresholds and state transitions | none | logic and tests | backend |
| Blotter data | positions/history/activity | UX requirement only | schema and UI | backend/frontend |

## Portfolio Model

### Sleeves

The portfolio engine should support exactly these sleeves in MVP:
1. `core_xstocks`
   - long-only xStocks basket
2. `directional`
   - Euler-style long/short or directional expression
3. `yield_buffer`
   - idle `AUSD` parked in the Flowdesk Morpho vault

### Starter baskets

Initial named baskets:
1. `Mag 7`
2. `AI Infra`
3. `US Tech Leaders`
4. `S&P Core`

Optional hero single-asset tracks:
1. `MSTRx`
2. `NVDAx`
3. `SPYx`

### Portfolio output object

Minimum fields:
1. `recommendation_id`
2. `slot_id`
3. `portfolio_mode`
   - `basket`
   - `directional`
   - `hybrid`
4. `activation_manifest_ref`
5. `target_allocations`
6. `target_directional_expressions`
7. `cash_or_yield_buffer_target`
8. `explanation_summary`
9. `signal_refs`
10. `rebalance_decision`
11. `validation_badges`

## Strategy-Lab Boundary Contract

The portfolio layer must consume:
1. blackbox `signal_artifact` inputs,
2. promoted `activation_manifest` winners from the Strategy Lab,
3. current user mandate and sleeve constraints.

The portfolio layer must not consume:
1. failed challengers,
2. raw `results.tsv` rows on the default recommendation path,
3. arbitrary unpromoted strategy payloads.

Canonical crossing object:
1. `activation_manifest_ref`

This keeps the portfolio layer tied to promoted winners rather than raw experiment churn.

## Signal-To-Portfolio Mapping

### Basket mapping

Map signal stance to target shift bands:
1. `strong_positive`
   - allow overweight up to a configured high band
2. `positive`
   - allow smaller overweight
3. `neutral`
   - keep baseline
4. `negative`
   - trim
5. `strong_negative`
   - trim aggressively or move to `yield_buffer`

### Directional mapping

Allow the portfolio engine to output:
1. `no directional expression`
2. `conviction long`
3. `conviction short`
4. `hedged view`

Only when:
1. confidence exceeds threshold,
2. rail and route context are available,
3. the user profile or strategy mode allows it.

## Rebalance Policy

### Rebalance decision states

1. `no_action`
2. `monitor`
3. `partial_rebalance`
4. `full_rebalance`

### Required gates

A rebalance should only be recommended if:
1. target delta exceeds threshold,
2. signal is still fresh,
3. confidence exceeds minimum threshold,
4. turnover budget permits the move,
5. route, vault, and multiplier checks pass,
6. the user mandate permits the resulting exposure.

### Anti-thrashing rules

1. no rebalance for minor target drift,
2. no rebalance from a stale signal,
3. no repeated flip-flopping across two adjacent states,
4. no directional re-entry immediately after a forced exit unless confidence improves materially.

## Incumbent Versus Challenger

### Basket mode

1. incumbent is the current promoted basket manifest for the active basket slot,
2. challenger is generated by the Strategy Lab hot basket surface,
3. portfolio construction only sees the challenger after Strategy Lab promotion,
4. rebalance logic compares the current live allocation against the promoted basket manifest.

### Directional mode

1. incumbent is the current promoted directional manifest for the active directional slot,
2. challenger is generated by the Strategy Lab hot directional surface,
3. portfolio construction only sees the challenger after Strategy Lab promotion,
4. rebalance logic compares the current live exposure against the promoted directional manifest.

### MVP approval rule

User approval is required for:
1. switching into directional mode,
2. switching out of directional mode,
3. materially changing target sleeves.

The Strategy Lab promotion loop may update the default manifest behind a slot without wallet interaction, but any user-impacting rebalance still follows the rebalance and approval rules in this spec.

## Guest And Wallet State

The portfolio layer must work for:
1. guest sessions before wallet connection,
2. wallet-linked user profiles after connection.

Guest state should store:
1. onboarding answers,
2. selected theme or hero asset,
3. last recommendation,
4. last viewed comparison.

Wallet-linked state should additionally store:
1. smart account reference,
2. activation records,
3. position rows,
4. activity rows.

## State-And-Truth Contract

Canonical user-visible states:
1. `current_portfolio_only`
2. `recommendation_ready`
3. `rebalance_recommended`
4. `rebalance_deferred`
5. `rebalanced`
6. `blocked`

Source of truth:
1. persisted recommendation and activation records.

Fail-closed rule:
1. stale or weak signals cannot trigger `rebalance_recommended`.

## Served-Surface Authority Contract

Canonical intended surface:
1. future comparison/detail/blotter screens in `apps/web`.

Current status:
1. no served portfolio UI exists yet.

## Visual-Fit Contract

Visual-fit status:
1. in scope but owned by the frontend workstream.

Reference:
1. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)

## Frontend Copy And Language Contract

Surface class:
1. mixed human + developer.

This spec owns:
1. semantic states and recommendation objects.

The frontend spec owns:
1. user-facing labels,
2. CTA phrasing,
3. banned jargon on the default path.

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked | Start now or later |
| --- | --- | --- | --- |
| Freeze recommendation schema | shared dependency | no | now |
| Freeze activation-manifest ref schema | recommendation lineage depends on it | no | now |
| Freeze rebalance schema | shared dependency | no | now |
| Add blotter schemas | frontend and activity depend on them | no | now |
| Implement current-versus-target rendering | user journey depends on it | yes, on frontend | later |

## Implementation Waves

Wave 1:
1. schema freeze for sleeves, recommendation, activation-manifest refs, and rebalance states.

Wave 2:
1. mock recommendations and blotter rows.

Wave 3:
1. real mapping and rebalance gating logic.

## Hosted / Deployed / Production Boundary

1. local-only: current planning and future mock flows
2. deployed-host verified: none yet
3. production-host verified: none yet
4. still unproven: all user-facing portfolio and rebalance claims

## Assumptions

1. The user wants guided-question onboarding.
2. The product should stay xStocks-first even if some live proofs rely on adjacent rails.
3. One yield sleeve is enough for MVP.
4. The bottom blotter is a first-class product primitive.
5. Only promoted incumbents should cross from Strategy Lab into the recommendation path.

## Invalidators

1. The user decides to remove portfolio construction and ship intelligence-only.
2. The product abandons the yield sleeve.
3. The product requires portfolio decisions to be fully interpretable from raw model inputs.

## Proof Artifacts

1. one example basket recommendation JSON,
2. one example directional recommendation JSON,
3. one example `activation_manifest_ref` payload,
4. one example `rebalance_decision` payload,
5. one example blotter dataset with positions/history/activity rows,
6. screenshots showing comparison, current state, and proposed state.

## Verification Commands

Current repo-verifiable command:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase checks:
1. schema tests for recommendation and rebalance payloads,
2. unit tests for rebalance threshold logic,
3. regression tests for incumbent/challenger replacement rules.

## Final Reporting Contract

At lane close, report:
1. recommendation schema version,
2. rebalance thresholds,
3. sleeves implemented,
4. guest and wallet-linked state support,
5. local-only versus served-surface proof,
6. remaining blocked rails and why.

## Exit Criteria

This workstream is complete only when:
1. the portfolio schema is frozen,
2. the rebalance schema is frozen,
3. at least one basket path and one directional path are represented truthfully,
4. the bottom blotter can render positions and past actions from structured data,
5. guest and wallet-linked states can both consume the same recommendation contract.
