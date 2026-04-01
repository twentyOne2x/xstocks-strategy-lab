# xStocks Portfolio Interpretability And Autoresearch Explanation Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Close the black-box gap by making the xStocks product explain:
1. what each promoted portfolio is,
2. why it was suggested,
3. how it is constructed,
4. how it changes over time,
5. how the replay or chart should be interpreted,
6. and how autoresearch results should be read and used to tune the basket-first Strategy Lab loop.

This workstream exists so the product can deliver the user's intended outcome:
1. full portfolio construction,
2. nice visualisations,
3. real interpretability as to why this is suggested,
4. and a research loop that can be understood and tuned rather than treated as magic.

## Non-goals

This workstream does not:
1. expose failed challengers or raw lab churn on the default user path,
2. turn the product into a generic quant terminal,
3. promise performance from replay visuals,
4. require live directional execution,
5. require a new standalone research service if existing research, API, and frontend surfaces can carry the explanation contract truthfully.

## Current Live Truth

1. The autoresearch loop is now locally proven end to end: bundle validation, basket baseline seeding, directional preview seeding, promoted-manifest generation, and worker validation all pass.
2. The tunable basket surface is still intentionally narrow in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/hot/basket-policy.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/hot/basket-policy.js): starter basket choice, baseline signal weighting, concentration cap, cash weight, and rebalance threshold.
3. The canonical results ledger in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/runs/results.tsv](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/runs/results.tsv) and run summaries in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/runs/summaries](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/runs/summaries) already contain parseable metrics, candidate plans, reason codes, and benchmark comparisons.
4. Promoted manifests in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/manifests/promoted](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/manifests/promoted) carry title, subtitle, summary, risk label, badges, route truth, and target allocations, but they do not yet carry a full explanation bundle for user interpretation.
5. The frontend now shows summary, thesis-like copy, why-recommended bullets, replay, route truth, next rebalance, and positions, but it still reads too much like internal manifest/operator language rather than plain-language portfolio explanation.
6. The current landing and onboarding entry copy is too vague. Terms like `wallet strategy`, `strategy lane`, and `promoted winners` do not clearly introduce xStocks, tokenized equities, or the portfolio object.
7. The current API adapter in [/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts) duplicates `summary` into `thesis`, which proves there is no first-class explanation contract yet.
8. The current product can expose research truth ingredients, but it cannot yet make a first-time user understand the portfolio fast enough.

## Current Local Implementation Audit

### Shipped

1. Research results ledger, run summaries, incumbent records, promoted manifests, and slot registry.
2. Basket-first portfolio outputs with target weights, cash sleeve, rebalance threshold, and reason codes.
3. Qualification flow that computes a profile and recommended mode.
4. Frontend routes for landing, onboarding, comparison, detail, activity, and activation.
5. API-backed manifest, workspace, activity, and activation-preview reads.

### Partial

1. Preview dashboard explanation blocks exist, but they are too thin and too internal.
2. Comparison and detail routes expose route truth and allocations, but not enough plain-language explanation.
3. The bottom blotter shows positions and lifecycle state, but not enough interpretation of why a row or sleeve exists.
4. Run summaries contain operator-usable information, but there is no explicit operator tuning rubric.

### Spec-only Or Unproven

1. A stable research-to-frontend explanation boundary.
2. Per-holding rationale and sleeve-role explanations on the canonical user path.
3. A chart-interpretation contract that clearly says what replay means and what it does not mean.
4. A clear `best for someone who...` explanation surface for each promoted portfolio.
5. An operator workflow that turns autoresearch outputs into deliberate tuning decisions instead of raw metric watching.

## Symptom Contract

Observed problem:
1. the product can render portfolio data,
2. but the user still cannot quickly tell what the portfolio does, why it was suggested, or how to interpret it,
3. and the operator can rerun autoresearch but still lacks a clean explanation/tuning surface.

## Likely Culprits

1. No first-class explanation contract exists between promoted research outputs and the frontend.
2. The frontend is overusing internal nouns such as `strategy lane`, `slot`, `promoted winner`, and `route truth` without translating them into user language.
3. Promoted manifests carry enough validation truth for safety, but not enough explanation truth for understanding.
4. The current tuning loop is metric-legible but not narrative-legible.

## Non-obvious Alternatives

1. The black-box feeling could mostly be a frontend copy and information-hierarchy issue rather than a missing research artifact issue.
2. The current research artifacts might already be sufficient if the frontend derives clearer explanations from existing fields and run summaries.
3. The app might need only one explanation layer for basket mode now, with directional left intentionally thinner until live proof exists.

## Falsifiers / What Would Disprove This Theory

1. If a browser-proven frontend pass can make the portfolio understandable using only current promoted manifest fields, the missing explanation contract is smaller than it appears.
2. If operators can already tune the basket surface cleanly from current run summaries without adding any derived report, the tuning gap is smaller than it appears.
3. If users still find the product opaque after explanation fields are added and rendered, the real culprit is visual hierarchy or journey design rather than research interpretability.

## Product Outcome Contract

When this workstream is complete enough for demo closure:
1. the landing page clearly introduces xStocks portfolios and tokenized equities,
2. onboarding clearly explains that qualification matches the user to a portfolio preview before deposit,
3. the preview dashboard clearly answers:
   1. what this portfolio does,
   2. why it fits this user,
   3. how it changes,
   4. what would trigger the next rebalance,
   5. how to read the replay,
4. the detail screen clearly answers why the major holdings and sleeves are present,
5. the comparison view clearly answers why one promoted portfolio won and why the others did not,
6. and the operator can interpret autoresearch results well enough to decide whether and how to tune the basket policy.

## User-Journey Contract

The canonical user-facing explanation journey is:
1. land on a home page that clearly names xStocks portfolios as the object,
2. start qualification from a CTA that names the action clearly,
3. complete onboarding without wallet connection,
4. land directly in a preview dashboard that explains the recommended portfolio in plain language,
5. inspect the detail route to understand holdings, sleeves, route truth, and portfolio construction,
6. inspect the blotter to see positions, lifecycle, and next rebalance in context,
7. inspect activation to understand what deposit changes and what remains preview-only.

The canonical operator journey is:
1. run the full autoresearch loop,
2. inspect the promoted incumbent summary and run summary,
3. interpret score, concentration, turnover, cash sleeve, and reason codes together,
4. decide whether to tune the hot basket policy,
5. rerun the loop and compare incumbent versus challenger truthfully.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. one portfolio explanation and autoresearch-interpretation contract strong enough to remove the product's black-box feel.

User UX:
1. the user understands the portfolio object in the first 5 seconds,
2. the user can explain why it was suggested,
3. the user can explain what changes it,
4. the replay is readable without being mistaken for a promise.

Sustainability:
1. explanation truth is derived from promoted artifacts rather than hand-written drift across many screens,
2. tuning remains basket-policy-first instead of turning into endless custom narratives.

Safety:
1. explanation surfaces never widen live claims beyond the underlying manifest truth,
2. directional remains preview-only and blocked,
3. replay and validation language stay explicitly non-promissory.

Maintainability:
1. explanation logic stays attached to existing research, API, and frontend boundaries,
2. no duplicate narrative systems exist in `apps/web`,
3. operator tuning remains tied to parseable artifacts, not chat memory.

## State-And-Truth Contract

1. User-facing explanation may only be derived from promoted incumbents, qualification outputs, and truthful API-backed route/asset state.
2. Failed challengers and raw lab churn may not appear on the default user path.
3. Replay explanations must explicitly describe validated or promoted behavior, not forecasted returns.
4. Directional explanation must inherit `preview_only` and blocked truth everywhere.
5. If an explanation field is not supported by promoted artifacts or derivation logic, the frontend must omit it rather than invent it.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: update indirectly and extend via this new sub-spec.
   - Why: it owns allocation and rebalance semantics, but not the full user-facing explainability and operator-interpretability contract.
2. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: update indirectly and extend via this new sub-spec.
   - Why: it owns screens and shells, but not the research-to-frontend explanation boundary.
3. [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md)
   - Current relevance: very high.
   - Decision: reuse as-is and inherit.
   - Why: it owns the fixed harness and promotion loop, but not how operators read or the frontend renders those results.
4. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: very high.
   - Decision: update alongside this spec.
   - Why: explainability is now part of end-to-end closure and browser proof.

Create new alongside:
1. this spec is justified because none of the existing docs truthfully owns the black-box gap across landing/onboarding copy, portfolio explanation, promoted-manifest explanation fields, and operator tuning interpretation.

## Thread-Recurrence Audit

The repeated asks in the active xStocks thread collapse into five explanation problems:
1. landing and onboarding CTAs do not clearly name the object or action,
2. the preview/dashboard experience still feels black-box,
3. the user cannot easily tell what the portfolio does or why it is best for them,
4. autoresearch results are parseable but not yet promoted into a clear interpretation and tuning surface,
5. current visualisations are present but not yet explanatory enough.

These are one workstream, not five separate aesthetic complaints.

## Spec'd-But-Unimplemented Table

| Governing doc / lane | What should exist | What repo proves now | What is missing | Gap type |
| --- | --- | --- | --- | --- |
| `XSL-004` frontend | xStocks-first landing and onboarding hook | landing + onboarding routes exist | clear xStocks portfolio intro and clear CTA language | frontend |
| `XSL-003` portfolio | portfolio explanation contract | allocations, sleeves, rebalance semantics exist | `what this does`, `why this fits you`, `how it changes` surfaces | frontend/product |
| `XSL-006` Strategy Lab | operator-readable tuning loop | results ledger and summaries exist | explicit tuning rubric and comparison surface | research/process |
| `XSL-009` closeout | browser-proven understanding | screenshots/builds now exist | screenshots and pass criteria proving interpretability, not just load state | proof/frontend |
| promoted manifest boundary | explanation fields derived from promoted incumbents | title, subtitle, summary, validation, allocations exist | holding-role rationale, benchmark delta summary, chart interpretation, best-for-user explanation | backend/frontend |

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend existing surfaces across `packages/research`, `apps/api`, and `apps/web`; no new service is justified.

Existing logic to reuse:
1. run summaries and reason codes in `packages/research/runs/summaries`,
2. promoted manifest generation in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/incumbents.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/incumbents.js),
3. qualification and recommendation shaping in [/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/shared-contract-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/shared-contract-adapter.ts),
4. API adaptation in [/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts).

New entrypoints required:
1. no new worker, cron, or service is justified,
2. one explanation builder module or helper layer is justified inside existing research/API/frontend boundaries.

Structural refactor assessment:
1. same-tranche beneficial.
2. explanation logic should not stay mixed forever inside:
   1. [/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/shared-contract-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/shared-contract-adapter.ts) at 1060 lines,
   2. [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/incumbents.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/incumbents.js) at 924 lines.

Iteration-speed hotspots assessed:
1. `shared-contract-adapter.ts`: split later after closure if explanation rules keep growing.
2. `incumbents.js`: split later if manifest explanation fields expand materially.
3. `evaluate.js`: keep intact for now because the evaluator is frozen and already proven.

Build/deploy fan-out assessment:
1. explanation derivation should stay server-side or manifest-driven where possible,
2. do not make `apps/web` invent portfolio explanation from raw route or asset payloads alone,
3. keep client-only explanation logic thin.

## Research Interpretability Contract

Every promoted basket slot must expose enough explanation truth to answer:
1. what starter basket or lane it comes from,
2. how names were weighted,
3. what cash or yield sleeve it keeps,
4. what concentration ceiling shaped the weights,
5. what rebalance threshold matters,
6. how it differs from the benchmark,
7. why it remains the promoted incumbent.

Minimum promoted explanation inputs:
1. `candidate.plan.reasonCodes`,
2. target weights,
3. cash weight,
4. rebalance threshold,
5. score,
6. return, drawdown, turnover, and cost metrics,
7. benchmark comparison,
8. slot title, summary, and risk label.

Operator-only explanation outputs should include:
1. portfolio-construction summary,
2. benchmark-delta summary,
3. concentration and turnover summary,
4. keep-versus-tune recommendation,
5. what exactly changed when a challenger is promoted.

## User-Facing Explanation Contract

The user-facing app must expose, in plain language, these explanation blocks for every promoted basket portfolio:
1. `What this portfolio does`
2. `Why this fits you`
3. `How it changes`
4. `What would trigger the next rebalance`
5. `How to read this replay`
6. `Why these holdings are here`
7. `Best for someone who...`

Required translation rules:
1. name xStocks and tokenized equities explicitly on the landing and onboarding entry,
2. use `portfolio` or `xStocks portfolio` where the user-facing object is a portfolio,
3. do not use `strategy lane`, `wallet strategy`, `promoted winner`, or `slot` as the primary user-facing nouns,
4. explain route truth, validation, and proof in support language, not as the main product object.

## Visualisation Contract

The product must not rely on one unlabeled curve and one weight table.

Required explanation visualisations:
1. a portfolio-construction view showing target weights and sleeve roles,
2. a replay or behavior chart with a visible interpretation note,
3. rebalance markers or next-rebalance trigger summary,
4. a comparison view showing why the current promoted portfolio won,
5. a holdings or sleeve explainer that ties major names to roles.

Visualisation rules:
1. visualisations must support interpretation, not decoration,
2. the chart must say what it represents and what it does not promise,
3. the portfolio must not appear as a black-box line plus unexplained rows.

## Autoresearch Tuning Contract

Yes, autoresearch should be tuned, but tuning must stay honest.

What tuning means today:
1. edit the hot basket policy in [/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/hot/basket-policy.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/src/hot/basket-policy.js),
2. rerun the fixed loop,
3. compare candidate versus incumbent on the same bundle and evaluator,
4. promote only clear winners.

What tuning must consider, not just raw score:
1. concentration,
2. turnover and costs,
3. cash sleeve size,
4. benchmark delta,
5. explanation coherence,
6. whether the resulting portfolio is still legible enough to explain.

The tuning loop must remain:
1. score-led and guardrail-led for promotion truth,
2. but explanation-aware for operator decision quality.

## Critical Assumptions And Invalidators

### Assumptions

1. Existing research artifacts are rich enough to support a better explanation layer without reopening the frozen evaluator.
2. Most of the current black-box feeling can be fixed by adding an explanation contract and rendering it better in `apps/web`.
3. Basket mode is the main explanation target for this milestone.

### Invalidators

1. The current promoted artifact boundary cannot represent the needed explanation fields without shared-contract changes.
2. The frontend still feels opaque even after explanation blocks and visualisations are added.
3. Operator tuning still feels blind even after run-summary interpretation rules are added.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Landing clarity | vague hero and CTA language | first screen clearly names xStocks portfolios, qualification, preview, deposit | browser screenshots |
| Onboarding clarity | `strategy lane` wording and weak entry card | onboarding entry clearly explains what happens next | browser screenshots |
| Portfolio explanation coverage | partial and thin | every promoted basket route exposes all 7 explanation blocks | route walkthrough |
| Holding rationale coverage | none | top holdings or sleeves have visible role/rationale on detail path | detail screenshots |
| Replay interpretation coverage | chart visible, interpretation weak | replay/chart includes explicit interpretation note | preview/detail screenshots |
| Operator tuning legibility | metrics and reason codes only | one explicit tuning rubric or reportable interpretation path exists | autoresearch handoff proof |

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Landing and onboarding hook clarity | 20 | 4 | current `apps/web` copy is present but weak |
| Portfolio explanation on canonical user path | 25 | 8 | preview/detail/comparison have partial explanation blocks |
| Research artifact interpretability | 20 | 15 | run summaries and reason codes exist and are parseable |
| Operator tuning readiness | 15 | 8 | hot surface and rerun loop exist, but rubric is implicit |
| Browser-proofed explanation quality | 20 | 0 | no proof pack yet focused on explanation quality |
| Total | 100 | 35 | major interpretability gap remains |

## Owners And Decision-Rights Contract

1. `packages/research` owns promoted explanation truth derived from incumbents and summaries.
2. `apps/web` owns how that explanation is rendered and whether the user can understand it quickly.
3. The user owns the product bar for whether the app is still too black-box.
4. No lane may overclaim explanation quality without browser proof.

## Migration / Coexistence / Deprecation Contract

1. Keep current promoted manifests as the canonical runtime boundary while adding explanation richness.
2. Replace vague user-facing copy in landing and onboarding rather than layering new explanation text on top of weak hooks.
3. Keep internal nouns such as `slot` and `candidateRef` operator-facing only unless a truth reason requires surfacing them.
4. Directional may keep a thinner explanation surface while it remains preview-only.

## Derived Next Roadmap

| Item | Why it follows | Blocked on current closure? | Start now or later? | Extends / supersedes |
| --- | --- | --- | --- | --- |
| Landing + onboarding hook rewrite | current first impression is too vague | no | now | extends `XSL-004` |
| Preview/detail explanation blocks | black-box gap is user-visible on canonical path | no | now | extends `XSL-004` and `XSL-003` |
| Promoted explanation field contract | frontend should not keep inventing explanation from weak summaries | no | now | extends `XSL-003` and `XSL-006` |
| Operator tuning rubric | autoresearch is proven enough to deserve deliberate tuning | no | now | extends `XSL-006` |
| Dedicated tuning dashboard | useful, but not required for current closure | yes | later | new alongside if needed |

## Verification And Proof Contract

To close this workstream, the proof pack must include:
1. landing screenshot with improved xStocks-first hook and CTA,
2. onboarding entry screenshot with clear qualification language,
3. preview-dashboard screenshot showing at least:
   1. `What this portfolio does`,
   2. `Why this fits you`,
   3. `How it changes`,
4. detail-route screenshot showing holding or sleeve rationale,
5. comparison screenshot showing why the selected portfolio won,
6. autoresearch proof showing the operator-readable interpretation path for the promoted incumbent.

Verification commands remain the existing research, API, and frontend checks, plus browser proof of the explanation layer.

## Progress Log

### 2026-04-01 Focused Tranche: Universal Skip UX + Canonical Explainability

What changed:
1. Added one consistent skip/not-sure action across the questionnaire and aligned the web catalog with the canonical policy catalog so product-safe questions resolve through explicit `unsure` or `unset` answers instead of ad hoc omission.
2. Kept qualification deterministic and fail closed: `q_certainty=unsure` resolves to the exploring path, while `q_certainty=default_requested` remains the stronger safest-default request; directional eligibility and low-certainty downshifts were left intact.
3. Strengthened the promoted-manifest explanation path on the onboarding gate, onboarding workspace, comparison, detail, activation, and shared spotlight surfaces by surfacing `why this fits`, `how it is built`, holdings rationale, replay interpretation, and `what changes next` blocks.

Proof collected:
1. `pnpm --filter @xstocks-strategy-lab/web build` passed on 2026-04-01.
2. `node --test packages/policy/test/policy.test.js` passed on 2026-04-01, including the new `skip-not-sure` qualification fixture.
3. `pnpm --filter @xstocks-strategy-lab/web test` passed on 2026-04-01.
4. Browser screenshots were captured to `/tmp/xsl-010-browser` for onboarding entry, onboarding gate, onboarding workspace, comparison, and detail.

Residual blocker for full lane closure:
1. The landing-hook rewrite and the operator-facing autoresearch tuning rubric / proof path are still open, so the owner lane should stay active even though this UX tranche is locally closed.
