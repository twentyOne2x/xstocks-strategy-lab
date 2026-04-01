# xStocks Portfolio Interpretability And Autoresearch Explanation Spec

Date: 2026-03-31
Owner: Codex
Status: active
Canonical issue: `XSL-010`

## Goal

Close the black-box gap by making the canonical xStocks frontend explain:
1. what the promoted portfolio is,
2. why it fits the user after qualification,
3. how it changes over time,
4. how to read the replay or chart,
5. and what part of the explanation belongs to promoted research truth versus operator-only autoresearch detail.

## Non-goals

This workstream does not:
1. expose failed challengers or raw lab churn on the default user path,
2. redefine the frontend deployment owner,
3. replace the recurring-runtime owner lane,
4. create a separate monolith for post-qualification UX outside the explainability owner,
5. promise performance from charts or replay visuals.

## Existing-Spec Inventory

| Artifact | Current role | Decision |
| --- | --- | --- |
| [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | canonical explainability owner | update and keep canonical |
| [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | frontend shell owner | coordinate; do not duplicate |
| [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | promoted-manifest and runtime owner | reuse |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | smoke-path owner | support from this spec |

## Current / Live Truth

1. Qualification already emits an `explanationSurface`, and promoted manifests already carry `explanationBundle`.
2. [portfolio-ui.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/portfolio-ui.ts), [api-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts), and promoted manifest generation already contain real explanation logic locally.
3. The current local app can show summary, holdings, route truth, replay, and next-rebalance information, so the explanation problem is not total absence.
4. The remaining gap is stronger post-qualification guidance and better production rendering: the canonical frontend is still lighter than intended after qualification, and landing/onboarding copy still undersells the portfolio object.
5. Explanation must remain promoted-manifest-only on the user path. Raw `results.tsv`, failed challengers, and operator tuning detail stay off the default public path.

## Current Local Implementation Audit

| Surface | Shipped | Partial | Missing |
| --- | --- | --- | --- |
| Post-qualification analysis | qualification output with explanation surface | stronger interstitial and `why this fits you` gate | canonical browser proof |
| In-app explanation | summary, holdings, route truth, replay, next-rebalance context | clearer sleeve-role explanation and chart interpretation note | stronger production parity |
| Operator interpretability | run summaries, reason codes, incumbent/challenger artifacts | explicit tuning rubric | polished operator-facing read path |

## Product Outcome Contract

When this lane closes:
1. qualification hands the user into one clear post-qualification explanation step,
2. the canonical frontend answers `what this portfolio does`, `why this fits you`, `how it changes`, `why these holdings are here`, and `how to read this replay`,
3. the explanation remains derived from promoted artifacts only,
4. operator-only autoresearch interpretation remains available without leaking raw lab churn into public UX.

## State-And-Truth Contract

| Explanation layer | Allowed source | Public or internal |
| --- | --- | --- |
| landing and onboarding hook | promoted portfolio language and public product truth | public |
| post-qualification interstitial | qualification output plus promoted manifest | public |
| comparison, detail, activation explanation | promoted manifest plus truthful API-backed route and readiness state | public |
| operator tuning interpretation | results ledger, run summary, incumbent/challenger comparison | internal |

Truth rules:
1. User-facing explanation must derive from promoted manifests, qualification outputs, and truthful API-backed state only.
2. If a field cannot be supported by promoted artifacts, omit it instead of inventing it.
3. Directional remains preview-only and must inherit that boundary in every explanation.
4. Replay visuals must say what they represent and what they do not promise.

## Proof / Measurement Contract

| Required proof | What must be visible | Current status |
| --- | --- | --- |
| post-qualification analysis | clear interstitial after onboarding with recommendation context | partial |
| `why this fits you` gate | explicit match explanation on canonical frontend | partial |
| in-app portfolio explanation | promoted portfolio rationale on comparison, detail, and activation routes | partial |
| promoted-manifest-only boundary | no raw lab churn on public path | locally true, needs canonical browser proof |
| canonical browser proof | screenshots or browser verification on production routes | open |

## Acceptance Criteria

1. The post-qualification interstitial is explicit and browser-proven on the canonical frontend.
2. Every promoted portfolio route exposes plain-language explanation blocks for fit, construction, rebalance behavior, and replay interpretation.
3. `Why this fits you` is visible after qualification and before activation.
4. The user path remains promoted-manifest-only.
5. Operator tuning interpretation is explicit enough to support deliberate basket-policy changes without exposing raw lab churn publicly.

## Blocker Taxonomy

1. `thin_post_qualification_interstitial`
2. `missing_why_this_fits_gate`
3. `light_prod_explanation`
4. `chart_interpretation_too_weak`
5. `operator_tuning_rubric_implicit`

## Rollback / Recovery Contract

1. If a new explanation field cannot be supported by promoted artifacts, remove it rather than inventing a narrative layer.
2. If the canonical frontend cannot yet render the full explanation set, keep the lane partial and preserve the promoted-manifest boundary.
3. If public explanation drifts ahead of runtime truth, downgrade the copy to the narrower proven boundary.

## Exact Test / Verification Commands

1. `node scripts/qualify.mjs --fixture broad-cautious`
2. `node apps/api/src/index.js`
3. `curl "http://localhost:3001/api/workspace?slotId=onboarding.default_basket&userNotionalUsd=25"`
4. `curl "http://localhost:3001/api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=25"`
5. `pnpm --filter @xstocks-strategy-lab/web build`
6. browser proof on `https://equityterminal.app/onboarding`, `/workspace/comparison`, `/workspace/detail/<manifestSlug>`, and `/activate/<manifestSlug>`

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this spec: open; explanation logic exists locally, but the canonical production experience is still lighter than intended.
2. Completion relative to the live-gap list: this spec now owns gap 6 and gap 7.
3. Completion relative to prior claims: older docs understated the local explanation surface; the real remaining gap is canonical browser-visible strength, not whether explanation logic exists at all.

## Agent-Testability Contract

1. Public-safe agent coverage for this lane belongs on `/onboarding`, `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, and the public `skill.md` description of what the app can explain.
2. Internal agent coverage may use [xstocks-qualification](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md) and promoted-manifest inspection, but it must stay within promoted truth on the public path.
3. Operator-only tuning interpretation belongs to internal runbooks and must not leak into public `skill.md`.
