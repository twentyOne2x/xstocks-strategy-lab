# xStocks Strategy Lab Autoresearch Operating Model Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Define the execution-grade `Strategy Lab` operating model that adapts the workflow contract from `karpathy/autoresearch` to this xStocks product by freezing:
1. one read-only research harness,
2. one narrow hot experimental surface per mode,
3. one human-written operating manual,
4. one parseable results ledger,
5. one incumbent-versus-challenger promotion loop,
6. one activation-manifest boundary that the frontend and execution layers consume.

Clarification:
1. this repo does not vendor or run `karpathy/autoresearch` as-is,
2. this repo adapts the workflow pattern only,
3. the current xStocks Strategy Lab implementation is a local Node/JSON evaluation and promotion loop in `packages/research` plus `apps/worker`,
4. the upstream single-NVIDIA-GPU training requirement does not apply to this repo unless a future workstream explicitly chooses to adopt that upstream training code.

## Non-goals

This workstream does not:
1. turn the product into a generic quant platform,
2. expose failed challengers or raw experiment history on the default frontend path,
3. replace xStocks public APIs as the live truth source,
4. claim that public xStocks APIs alone are a complete historical research feed,
5. require live Euler xStocks execution proof before the research contract is valid.

## Product Outcome Contract

When this workstream is complete enough for MVP:
1. `Strategy Lab` has a truthful internal operating model rather than vague “AI research” language,
2. basket mode and directional mode each have a clearly defined incumbent,
3. the frontend consumes only promoted winners through stable activation manifests,
4. the repo can point to one fixed evaluator and one append-only experiment ledger,
5. the user-facing product can say `validated strategy` without pretending the raw lab is user-facing.

## User-Journey Contract

The canonical user-facing journey implied by this operating model is:
1. the user enters through themes, public strategies, or a hero asset,
2. the frontend shows the currently promoted incumbent for the relevant slot,
3. the user sees replay, risk, and methodology badges derived from the promoted manifest,
4. activation happens from that promoted manifest only,
5. failed challengers and internal lab noise never leak onto the default path.

The canonical operator journey is:
1. freeze the harness and manual,
2. establish a baseline incumbent,
3. generate one challenger at a time by editing only the hot surface,
4. run the fixed evaluator on the pinned bundle,
5. append parseable results,
6. promote only clear winners.

## Symptom Contract

Observed problem:
1. the repo already had intelligence, portfolio, frontend, and rail specs,
2. but it still lacked the actual `Strategy Lab` operating contract tying those layers together.

Likely culprit:
1. earlier docs described product behavior without freezing how strategy research, promotion, and activation actually work.

Non-obvious alternatives:
1. the product could have remained a simple recommendation engine with no formal ratchet,
2. the repo could have treated research as plain backtesting plus manual judgment.

Falsifiers:
1. if the current specs already froze a single harness, hot surface, results log, and promotion rule, this new doc would be redundant,
2. if the product no longer wants any incumbent-versus-challenger logic, this workstream is too large.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. a credible `autoresearch-style` strategy lab built on top of xStocks and Euler product truth.

User UX:
1. the user sees only promoted defaults and stable manifests,
2. the terminal stays simple even though the lab behind it is sophisticated.

Sustainability:
1. one shared research harness,
2. one results ledger,
3. separate hot files by mode instead of one tangled global strategy file.

Safety:
1. the evaluator owns costs, halts, multiplier windows, and liquidation rules,
2. the hot surface cannot move the goalposts.

Maintainability:
1. experiment knobs stay in one declared place,
2. frontend and activation consume manifests rather than lab internals,
3. basket and directional tournaments stay separate.

## Honest Classification Contract

Internal classification:
1. `Strategy Lab` is an autoresearch-style operating model built on top of a backtesting and replay harness.

Why this is fair:
1. the repo is not merely running many backtests,
2. it is freezing the ruler, the dataset, the operating manual, and the keep-or-revert loop.

Why this is not pure branding:
1. the hot surface is narrow,
2. the evaluator is frozen,
3. every challenger is measured against the incumbent on the same pinned bundle.

External naming rule:
1. use `Strategy Lab` or `Autopilot` in product copy,
2. keep `autoresearch` as an internal operating-model term only.

## Current Live Truth

1. xStocks public APIs give the repo live truth for assets, current price, multipliers, multiplier history, proof of reserves, and status.
2. Official public xStocks APIs do not currently prove a serious public historical price feed on their own.
3. A pinned historical research dataset is therefore mandatory for reproducible evaluation.
4. Euler remains central for directional expression, but exact live xStocks-on-Euler proof is still unverified from public sources captured here.
5. Ethereum mainnet remains the default chain for the product and for the research harness.

## Current Local Implementation Audit

Shipped:
1. repo-level product/control-plane specs,
2. root docs for architecture, roadmap, diagrams, and execution plan,
3. package boundaries implying `packages/research`, `packages/policy`, `packages/xstocks`, and `packages/euler`.

Partial:
1. `Autopilot` and `Directional Vault` already exist as product concepts,
2. current docs imply replay, recommendations, and incumbent/challenger semantics,
3. frontend docs imply validation badges and strategy comparison.

Spec-only:
1. research harness,
2. hot policy surfaces,
3. operating manual,
4. results ledger,
5. activation manifests,
6. slot registry,
7. promotion loop.

Not present:
1. pinned research bundle,
2. evaluator code,
3. strategy slots,
4. shadow-live proof stage,
5. any kept incumbent artifact.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend `packages/research` as the owner of the harness, hot surfaces, ledger, and manifests,
2. keep activation/execution-specific derivation in `packages/policy` and the backend rather than inside the research harness.

Existing logic to reuse:
1. xStocks live-state adapter boundary,
2. portfolio and directional terminology,
3. starter baskets and theme-first onboarding,
4. existing control-plane split between intelligence, portfolio, frontend, and rails.

New entrypoints required:
1. yes, a dedicated research operating-model spec is justified because no existing doc owns the prepare/train/program/results contract.

Structural refactor assessment:
1. split hot surfaces by mode now,
2. keep one shared frozen harness,
3. do not create multiple independent research workers with different rules.

Build/deploy fan-out assessment:
1. research bundle preparation and replay should stay in the worker/backend lane,
2. no frontend build should depend on the full research harness.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: very high.
   - Decision: update alongside this new sub-spec.
   - Why: the control plane needs to recognize the research operating model as its own workstream.
2. [2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)
   - Current relevance: high.
   - Decision: update.
   - Why: portfolio recommendations need to inherit slot, manifest, and incumbent semantics from this doc.
3. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: high.
   - Decision: update.
   - Why: the frontend must consume only promoted manifests rather than raw lab output.
4. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: medium.
   - Decision: update.
   - Why: activation must start from a manifest, not from research internals.
5. [README.md](/Users/user/PycharmProjects/xstocks-strategy-lab/README.md)
   - Current relevance: medium.
   - Decision: update lightly.
   - Why: the repo overview should acknowledge the operating model and link to it.

This doc is justified because none of the existing specs owns the frozen-harness / hot-surface / ledger / promotion loop contract directly.

## Thread-Recurrence Audit

The repeated asks that collapse into this workstream are:
1. how `karpathy/autoresearch` maps onto the product,
2. what is the hot experimental surface,
3. what is frozen in the evaluator,
4. what `program.md` becomes,
5. whether this is really autoresearch or just backtesting,
6. how incumbents and challengers promote,
7. what the results ledger is,
8. how the lab connects to frontend and activation,
9. what the smallest credible implementation is.

This is clearly one canonical workstream rather than scattered notes.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| Frozen harness | pinned bundle builder + evaluator | concept only | code, manifest, fixtures | backend |
| Hot policy surfaces | basket and directional editable files | concept only | code and contract tests | backend |
| Operating manual | one human-owned program doc | none | file and process | backend/process |
| Results ledger | append-only TSV + parseable footers | none | schema and writer | backend |
| Activation manifests | one promoted artifact per slot | none | schema, storage, registry | backend/frontend |
| Promotion loop | incumbent/challenger ratchet | prose fragments only | comparator and rules | backend |

## Autoresearch Artifact Map

Conceptual mapping from `karpathy/autoresearch`:
1. `prepare.py` -> `packages/research/src/prepare-xstocks.ts`
2. `evaluate.py` -> `packages/research/src/evaluate.ts`
3. `train.py` -> split hot surfaces:
   - `packages/research/src/hot/basket-policy.ts`
   - `packages/research/src/hot/euler-policy.ts`
4. `program.md` -> `packages/research/PROGRAM.md`
5. `results.tsv` -> `packages/research/runs/results.tsv`
6. validation shard -> `packages/research/data/research-bundle-vN/validation-manifest.json`
7. kept artifact -> `packages/research/manifests/<slot-id>/<version>.json`

Language-level note:
1. the repo is free to implement these artifacts in TypeScript rather than Python,
2. but the operating contract should preserve the original prepare/train/program/results semantics.

## Frozen Harness Contract

### Harness ownership

The frozen harness owns:
1. xStocks universe snapshot on Ethereum mainnet,
2. pinned historical research dataset version,
3. multiplier and corporate-action normalization,
4. starter-basket catalog and hero-slot definitions,
5. allowed Euler market map and risk ceilings,
6. execution-cost model,
7. validation windows,
8. score computation,
9. parseable output schema.

### Harness inputs

The harness may consume:
1. official xStocks public APIs for live truth fixtures and symbol canonicalization,
2. pinned historical price and scenario data,
3. pinned Euler borrow/liquidity/risk fixtures,
4. pinned route and slippage assumptions.

The harness must not:
1. fetch new historical data during a run,
2. let the challenger alter validation windows,
3. let the challenger redefine chain, universe, or multiplier semantics.

### Bundle contents

The minimum pinned research bundle should contain:
1. `manifest.json`
2. `universe_snapshot.json`
3. `starter_baskets.json`
4. `prices.parquet` or equivalent
5. `multipliers.json`
6. `halts_and_status.json`
7. `euler_market_map.json`
8. `execution_cost_model.json`
9. `validation_windows.json`

## Hot Experimental Surface Contract

### Shared decision

Use:
1. one shared frozen harness,
2. two split hot policy files by mode.

Do not use:
1. one giant shared mutable file with `if mode == ...` everywhere,
2. many scattered strategy knobs across env vars, frontend config, DB rows, and YAML.

### Basket hot surface

`packages/research/src/hot/basket-policy.ts` may change:
1. basket name eligibility inside the frozen universe,
2. ranking logic,
3. weighting curve,
4. rebalance threshold,
5. concentration controls inside frozen ceilings,
6. cash/yield-buffer preference inside frozen sleeve rules,
7. deterministic explanation tags.

It must output a parseable `BasketPlan` with:
1. `target_weights`
2. `cash_weight`
3. `rebalance_threshold_bps`
4. `reason_codes`

### Directional hot surface

`packages/research/src/hot/euler-policy.ts` may change:
1. long and short candidate ranking,
2. exposure sizing,
3. gross and net targets inside frozen caps,
4. allowed collateral allocation across the frozen market map,
5. health-buffer target above the frozen minimum,
6. entry, exit, and unwind rules,
7. deterministic explanation tags.

It must output a parseable `EulerPlan` with:
1. `target_longs`
2. `target_shorts`
3. `target_gross`
4. `target_net`
5. `collateral_allocations`
6. `health_buffer_target`
7. `rebalance_threshold_bps`
8. `reason_codes`

### Explicit hot-surface prohibitions

The hot surfaces must not:
1. call live APIs,
2. change dataset versions,
3. change score formulas,
4. emit wallet-specific execution instructions,
5. alter route truth labels,
6. change starter-slot inventory.

## Operating Manual Contract

`packages/research/PROGRAM.md` must contain these sections:
1. `Objective`
2. `Ownership and scope`
3. `Frozen harness`
4. `Editable surfaces`
5. `Baseline-first rule`
6. `Benchmark command`
7. `Parseable output`
8. `Results log`
9. `Incumbent versus challenger loop`
10. `Keep / revert rule`
11. `Forbidden mistakes`

The manual must state:
1. only edit one hot file per experiment,
2. never edit the frozen harness during a run,
3. always run the baseline first,
4. append one parseable result row,
5. revert every equal-or-worse challenger,
6. keep xStocks as the asset universe and Ethereum mainnet as the default chain.

## Fixed Evaluator Contract

### Evaluator entrypoints

The harness must expose exactly two fixed evaluators:
1. `evaluateBasket(candidate)`
2. `evaluateDirectional(candidate)`

### Comparison rule

There is one `primary_score` per mode and per objective version.
1. basket candidates compete only with basket incumbents,
2. directional candidates compete only with directional incumbents,
3. no cross-mode promotion is allowed.

### Basket evaluator

The basket evaluator must:
1. replay long-only xStocks basket decisions on pinned validation windows,
2. apply multiplier-aware total-return logic,
3. charge fixed costs and turnover drag,
4. compare against the incumbent and the frozen benchmark basket,
5. emit diagnostics including return, drawdown, turnover, concentration, and cost drag.

Default basket objective identifier:
1. `basket_excess_calmar_after_cost_v1`

### Directional evaluator

The directional evaluator must:
1. replay directional intent on the frozen Euler market map,
2. apply borrow, carry, slippage, gas, and liquidity assumptions,
3. track health-buffer and liquidation path risk,
4. compare against the directional incumbent and a flat-cash or neutral benchmark,
5. emit diagnostics including gross/net exposure, borrow cost, health minimum, and liquidation count.

Default directional objective identifier:
1. `directional_calmar_after_cost_v1`

### Hard invalidation rules

Common invalidators:
1. any asset outside the pinned Ethereum xStocks universe,
2. any lookahead,
3. any unparseable or late action,
4. any attempted trade during a halt or multiplier freeze window,
5. any use of live data in the historical score loop.

Basket-specific invalidators:
1. negative weights,
2. gross exposure outside the allowed long-only band,
3. concentration above frozen ceilings,
4. turnover above the frozen cap.

Directional-specific invalidators:
1. asset or market missing from the frozen Euler map,
2. gross or net exposure above frozen caps,
3. target LTV above the allowed fraction of max LTV,
4. post-trade health below the minimum buffer,
5. any liquidation event,
6. insufficient-liquidity or route-construction failure.

## Results Ledger Contract

### Canonical ledger

The canonical experiment ledger is:
1. `packages/research/runs/results.tsv`

It must be:
1. append-only,
2. machine-readable,
3. one row per run,
4. scoped so that incumbents and challengers are compared only inside the same mode, slot, dataset, evaluator, and objective version.

### Minimum schema

Minimum required fields:
1. `run_id`
2. `completed_at_utc`
3. `stage`
4. `mode`
5. `slot_id`
6. `objective_id`
7. `status`
8. `candidate_ref`
9. `incumbent_run_id`
10. `manual_version`
11. `evaluator_version`
12. `research_dataset_id`
13. `validation_set_id`
14. `universe_id`
15. `chain_id`
16. `live_truth_source_id`
17. `primary_score`
18. `incumbent_score`
19. `delta_score`
20. `guardrail_pass`
21. `return_ann_pct`
22. `max_drawdown_pct`
23. `turnover_ann_pct`
24. `costs_total_bps`
25. `description`

Basket-mode additions:
1. `benchmark_id`
2. `constituent_count_avg`
3. `weight_max_pct`

Directional-mode additions:
1. `gross_exposure_avg_pct`
2. `net_exposure_avg_pct`
3. `leverage_avg`
4. `borrow_cost_bps`
5. `euler_market_set_id`
6. `euler_health_min`

### Parseable footer

Every run must also emit one final parseable JSON summary to stdout and to a saved artifact so the worker can ingest results without scraping free-form logs.

## Incumbent Versus Challenger Contract

### Incumbent definition

An incumbent is:
1. the current promoted strategy manifest for one slot,
2. under one mode,
3. on one frozen evaluator version and dataset version.

Initial slot inventory for MVP:
1. `onboarding.default_basket`
2. `onboarding.alt_basket_1`
3. `onboarding.alt_basket_2`
4. `advanced.default_directional`

### Challenger definition

A challenger is:
1. one bounded strategy change derived from the incumbent,
2. editing only the hot surface for that mode,
3. evaluated on the exact same pinned bundle.

### Promotion rule

A challenger replaces the incumbent only if:
1. `guardrail_pass` is true,
2. `primary_score` is strictly greater than `incumbent_score`,
3. the delta is outside the tie band or promotion epsilon,
4. all mode-specific hard invalidation rules pass.

### Anti-thrashing rules

1. keep separate incumbents per mode and slot,
2. incumbents survive ties,
3. paired evaluation must use the same dataset, validation set, and evaluator version,
4. any evaluator or dataset change starts a new tournament,
5. discarded challengers never become parents.

### MVP promotion posture

For MVP:
1. basket mode should get the first real ratchet,
2. directional mode should follow the same operating model as a second tournament,
3. both modes may share the same results ledger as long as `mode` and `slot_id` remain explicit.

## Activation Boundary Contract

### Crossing artifact

Exactly one research artifact crosses into frontend and activation:
1. `activation_manifest.json`

The activation manifest must be:
1. immutable,
2. versioned,
3. slot-scoped,
4. wallet-agnostic,
5. derived only from promoted incumbents.

### Required fields

Minimum fields:
1. `manifest_id`
2. `slot_id`
3. `mode`
4. `chain`
5. `strategy_version`
6. `frontend`
   - title
   - subtitle
   - risk_label
   - summary
   - badges
7. `validation`
   - dataset_version
   - evaluator_version
   - objective_id
   - score
   - delta_vs_incumbent
   - promoted_at
8. `activation_template`
9. `fallback`
   - previous_incumbent_id
   - disable_conditions

### Boundary rules

1. the frontend should render only promoted manifests,
2. the frontend should never render failed challengers by default,
3. wallet-specific execution plans are derived later from:
   - `activation_manifest`
   - live xStocks state
   - live rail state
   - user notional
   - user wallet or smart-account state.

## Frontend Exposure Contract

The frontend should expose from the research loop:
1. promoted strategy title and thesis,
2. replay and comparison outputs,
3. risk label,
4. last-promoted or validated badge,
5. current slot and mode.

The frontend should hide:
1. failed challengers,
2. raw results ledger rows on the default path,
3. internal scorer weights,
4. parameter sweeps,
5. `PROGRAM.md`,
6. raw harness fixtures.

Optional power-user drawer:
1. `dataset_version`
2. `evaluator_version`
3. `replaces_manifest_id`

## Fixed-Budget Experiment Contract

### Budget model

Use a combined fixed budget:
1. exactly one challenger per run,
2. one pinned research bundle and validation set,
3. one fixed wall-clock cap,
4. one parseable result row,
5. one optional live-preflight smoke check.

MVP defaults:
1. normal run target: 1 to 2 minutes,
2. hard timeout: 5 minutes,
3. one challenger per run,
4. soft token budget only if an LLM is assisting generation,
5. no multiple-candidate sweep hidden inside one run.

### Hackathon cadence

Minimum credible cadence:
1. one baseline run,
2. five challengers.

Preferred cadence:
1. one baseline,
2. eight to ten challengers across basket and directional lanes.

Overkill for hackathon MVP:
1. more than 25 to 30 total runs,
2. changing evaluator or dataset midstream,
3. minute-level full-universe simulation before the bundle is clean,
4. forcing live proof for every challenger.

## State-And-Truth Contract

Canonical research states:
1. `baseline`
2. `challenger_running`
3. `keep`
4. `discard`
5. `crash`
6. `invalid`
7. `shadow_validated`

Source of truth:
1. pinned research bundle,
2. results ledger,
3. promoted activation manifest registry.

Fail-closed rule:
1. no challenger may become user-visible without a promoted manifest.

## Served-Surface Authority Contract

Canonical authority split:
1. `packages/research` owns the research harness, hot surfaces, ledger, and manifests,
2. `apps/api` and `packages/policy` derive activation-time execution plans,
3. `apps/web` consumes promoted manifests and activity state.

Current status:
1. no served research surface exists yet,
2. all claims remain planning-only.

## Hosted / Deployed / Production Boundary

1. local-only: current state
2. deployed-host verified: none yet
3. production-host verified: none yet
4. still unproven: research harness implementation, slot registry, manifest promotion, and shadow-live validation

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked | Start now or later |
| --- | --- | --- | --- |
| Freeze research bundle manifest | evaluator depends on it | no | now |
| Freeze hot policy file boundaries | experiment discipline depends on it | no | now |
| Freeze `PROGRAM.md` contents | operator loop depends on it | no | now |
| Freeze `results.tsv` schema | backend and frontend badges depend on it | no | now |
| Freeze activation manifest schema | frontend and activation flow depend on it | no | now |
| Implement basket baseline | first true incumbent depends on it | yes, on prior four items | later |
| Implement directional tournament | depends on harness and market map | yes | later |

## Implementation Waves

Wave 1:
1. freeze the harness contract,
2. freeze hot surfaces,
3. freeze manual and ledger schema.

Wave 2:
1. build basket baseline,
2. write results ledger,
3. establish first incumbent.

Wave 3:
1. add directional baseline,
2. enforce mode-specific promotion rules.

Wave 4:
1. generate activation manifests,
2. connect them to frontend and activation flow.

## Assumptions

1. xStocks remains the core asset universe.
2. Ethereum mainnet remains the default chain.
3. Official xStocks public APIs remain the live truth source.
4. A pinned historical research dataset remains acceptable and necessary for evaluation.
5. Euler remains central for directional mode even if truthful live proof uses adjacent rails first.

## Invalidators

1. the product abandons incumbent-versus-challenger promotion entirely,
2. the product requires raw lab internals to be shown by default in the frontend,
3. live proof demands a different chain than the pinned research chain for MVP,
4. the repo decides to merge basket and directional strategy tournaments into one global score.

## Proof Artifacts

1. one sample research bundle manifest,
2. one sample `PROGRAM.md`,
3. one sample `results.tsv` row,
4. one sample basket activation manifest,
5. one sample directional activation manifest,
6. one screenshot or mock showing methodology badges sourced from a promoted manifest.

## Verification Commands

Current repo-verifiable command:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase checks:
1. schema validation for research bundle and activation manifest,
2. regression tests for basket promotion loop,
3. regression tests for directional promotion loop,
4. deterministic replay smoke test for the evaluator.

## Final Reporting Contract

At lane close, report:
1. harness version,
2. dataset version,
3. objective IDs in use,
4. current incumbents by slot,
5. number of kept versus discarded challengers,
6. activation manifests promoted,
7. what is still planning-only versus implemented.

## Exit Criteria

This workstream is complete only when:
1. the frozen harness contract is implemented,
2. hot policy surfaces are implemented and isolated,
3. `PROGRAM.md` exists,
4. `results.tsv` exists and is machine-readable,
5. at least one basket incumbent is promoted through the loop,
6. the frontend and activation layers consume a promoted manifest rather than raw lab output.
