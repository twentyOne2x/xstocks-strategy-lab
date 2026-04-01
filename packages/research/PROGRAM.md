# Strategy Lab PROGRAM

## Objective

Run one fixed, basket-first Strategy Lab loop that compares exactly one challenger at a time against one incumbent on one pinned xStocks research bundle.

## Ownership and scope

`packages/research` owns:
1. the pinned research bundle,
2. the frozen evaluator semantics,
3. the hot basket policy surface,
4. the results ledger,
5. the incumbent records,
6. the promoted activation manifests and slot registry.

`packages/research` does not own:
1. wallet-specific execution plans,
2. live API fetching during a historical run,
3. frontend rendering decisions beyond promoted-manifest fields.

## Frozen harness

The frozen harness is defined by:
1. dataset version: `research-bundle-v2`,
2. evaluator version: `strategy_lab_evaluator_v1`,
3. objective IDs:
   - basket: `basket_excess_calmar_after_cost_v1`
   - directional: `directional_calmar_after_cost_v1`
4. live truth source ID: `xstocks_public_api_v1`,
5. default chain: `ethereum`,
6. pinned validation set: `validation.monthly.2025_full_year_stress_v2`,
7. primary validation window: `2025_full_year_stress_v2`,
8. comparison validation window: `2025_h1_reference_v1`.

The harness may not change:
1. the dataset version,
2. the chain or universe semantics,
3. score formulas,
4. cost assumptions,
5. slot inventory,
6. activation-manifest schema.

## Editable surfaces

Only these files are editable inside a basket experiment:
1. `packages/research/src/hot/basket-policy.js`

Directional work is frozen but intentionally deferred:
1. `packages/research/src/evaluate.js`
   - `evaluateDirectional()` exists as a reserved fixed entrypoint and currently returns a structured not-ready response.

## Explicit basket knobs

The basket hot surface may tune only these operator-legible knobs:
1. `selection_universe`
   - `starter_only` or `core_universe`
2. `holdings_count`
3. `starter_bias_pct`
   - only meaningful in `core_universe`
4. `signal_power`
5. `cash_weight`
6. `max_weight_pct`
7. `rebalance_threshold_bps`
   - authoritative under the current path-dependent evaluator; it changes turnover, costs, and score

Every basket candidate should be recoverable from one explicit `policyProfile` object with:
1. `parameters.breadth.topN`
2. `parameters.weighting.exponent`
3. `parameters.capPolicy.maxWeightPct`
4. `parameters.cashSleeve.targetWeightPct`
5. `parameters.rebalance.thresholdBps`
6. `parameters.starterAnchoring.selectionUniverse`
7. `parameters.starterAnchoring.starterBiasPct`

Still fixed:
1. slot anchor basket identity,
2. ranking signal (`baseline_signal_score`),
3. benchmark binding,
4. minimum weight floor (`0`),
5. evaluator, dataset, and validation semantics.

## Baseline-first rule

Every slot must establish a baseline before any challenger is considered.

The basket baseline discipline is:
1. seed the slot with the pinned starter basket,
2. evaluate it on the frozen bundle,
3. append one result row,
4. write one incumbent record,
5. generate one promoted activation manifest.

## Benchmark command

Run the initial basket substrate with:

```bash
node apps/worker/src/seed-basket-baselines.js
node apps/worker/src/generate-promoted-manifests.js
```

Audit the explicit basket surface with:

```bash
node apps/worker/src/audit-basket-surface.js
```

Run the disciplined basket challenger wave with:

```bash
node apps/worker/src/run-basket-research-wave.js
```

Force a fresh rerun against the append-only ledger with:

```bash
node apps/worker/src/run-basket-research-wave.js --rerun-existing
```

Validate the public boundary with:

```bash
node apps/worker/src/check.js
```

## Parseable output

Every run must produce:
1. one TSV row in `packages/research/runs/results.tsv`,
2. one JSON summary in `packages/research/runs/summaries/<run_id>.json`,
3. one incumbent record per promoted slot,
4. one promoted activation manifest per promoted slot.

Runs are not valid if they only emit free-form logs.

## Results log

The canonical ledger is:
1. `packages/research/runs/results.tsv`

Ledger rules:
1. append-only,
2. one row per run,
3. no hidden multi-candidate sweeps,
4. basket and directional rows never mix promotion state,
5. comparisons stay scoped to mode, slot, dataset, evaluator, and objective.

## Incumbent versus challenger loop

The ratchet is:
1. establish or load the current incumbent,
2. generate exactly one challenger by editing only the hot surface,
3. run the fixed evaluator on the same pinned bundle,
4. append one result row,
5. promote only if `guardrail_pass` is true and `primary_score` clears the incumbent by the promotion epsilon,
6. regenerate the promoted activation manifest only from the promoted incumbent.

## Keep / revert rule

Keep a challenger only if:
1. it is parseable,
2. it passes every hard invalidation rule,
3. it scores strictly above the incumbent outside the tie band.

Otherwise:
1. discard it,
2. leave the incumbent untouched,
3. do not surface it in slot registry or activation manifests.

## Forbidden mistakes

Never:
1. edit the frozen harness during a candidate run,
2. fetch live historical data during evaluation,
3. hide multiple candidates inside one run,
4. let raw challengers cross into UI or activation,
5. change dataset or evaluator semantics mid-tournament,
6. mix basket and directional promotion state,
7. overclaim directional readiness before the Euler lane exists.
