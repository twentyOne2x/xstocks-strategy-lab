# xStocks Rebalance Automation And Execution Orchestration Spec

Date: 2026-03-31
Owner: Codex
Status: active
Canonical issue: `XSL-011`

## Goal

Keep one truthful umbrella for rebalance automation by:
1. preserving the completed manual CoW and scheduled-review baselines,
2. keeping `XSL-011B` as the review-only CRE/provider-triggered intake lane,
3. opening one separate autonomous executor spec above the landed staging and venue-readiness dependencies,
4. preventing duplicate generic automation specs,
5. and making the claim boundary from `manual review proven` to `provider-triggered review proven` to `policy-bounded autonomous execution proven` explicit.

## Non-goals

This umbrella does not:
1. reopen frontend parity or execution-rail ownership,
2. relabel manual CoW execution as autonomous,
3. reopen `XSL-011C`, which already names the completed manual proof bundle,
4. claim autonomous submission from CRE before the new proof bar exists,
5. hide current blocker taxonomy behind vague automation language,
6. authorize a shadow executor outside the canonical execution-request path.

## Existing-Spec Inventory

| Artifact | Current role | Decision |
| --- | --- | --- |
| [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md) | canonical umbrella | update and keep canonical |
| [2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md) | completed manual and scheduled baseline | reuse |
| [2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-first-manual-cow-rebalance-proof-bundle.md) | completed manual proof bundle | reuse |
| [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | active CRE executor spec | update and keep as the only active provider-trigger lane |
| [2026-04-02-xstocks-policy-bounded-autonomous-cre-provider-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-policy-bounded-autonomous-cre-provider-execution-spec.md) | active autonomous executor spec | create new alongside because no existing doc owns the final autonomous decision boundary |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | smoke owner | support from this umbrella |

## Current / Live Truth

1. The repo already owns a truthful manual/operator CoW rebalance lane.
2. The repo already owns a scheduled worker review shell that can open or queue manual review only.
3. A local phase-1 `provider_triggered` implementation now exists in `packages/shared`, `packages/policy`, and `apps/api`: signed-event validation, dedupe/replay protection, receipt persistence, and review-only `awaiting_operator` opening are implemented.
4. `XSL-018B` has landed the provider-staging substrate in shared contracts plus `apps/api/src/rebalance-service.js`, but canonical API exposure on `origin/main` still needs reconciliation before that staging truth can be treated as fully closed.
5. `XSL-014B` completed the truthful venue-routed readiness baseline for the promoted default basket at `$20` gross on `1inch.ethereum`.
6. Repo truth is still not allowed to claim live autonomous CRE/provider execution because the automation signer model remains a dependency and no hosted autonomous proof bundle exists yet.

## Current Local Implementation Audit

| Lane | Shipped | Partial | Missing |
| --- | --- | --- | --- |
| manual CoW | rebalance state, quote, approval, submission, settlement bookkeeping | hosted proof still bounded by venue quoteability | none for the local baseline |
| scheduled review | worker evaluation and review-only path | prod-facing visibility refinement | autonomous submission is intentionally absent |
| provider-triggered review | request schema, ETH-JWT validation, dedupe, replay protection, receipt persistence, review-only route | deployed host/config proof and real accepted-event evidence | deployed proof bundle only |
| autonomous provider execution | staging substrate, venue-readiness baseline, future contract enums | canonical API staging exposure, automation signer branch, hosted proof | actual autonomous execution and rollback proof |

## Product Outcome Contract

When this umbrella closes for the current tranche:
1. the repo can say exactly what manual review already does,
2. the repo can say exactly what scheduled review already does,
3. the repo can say exactly what CRE still cannot do until `XSL-011B` closes,
4. and no one needs a second automation spec to understand the current provider-trigger lane.

## State-And-Truth Contract

| Lane | Current truth | Allowed claim |
| --- | --- | --- |
| manual review and execution | proven | operator-manual CoW review and execution path exists |
| scheduled review shell | proven | worker may open or queue manual review only |
| CRE phase 1 | local implementation complete, deployed proof open | validated provider events may open review only after deployed proof exists |
| autonomous provider execution | spec opened, proof absent | forbidden claim until `XSL-011D` dependencies and hosted proof close |

Truth rules:
1. `XSL-011A` and `XSL-011C` remain completed baselines.
2. `XSL-011B` remains the provider-review intake owner.
3. `XSL-011D` is the only allowed owner for policy-bounded autonomous CRE/provider execution planning.
4. No provider-triggered path may claim autonomous execution until `XSL-011D` hosted proof requirements are satisfied.

## Proof / Measurement Contract

| Lane | Required proof | Current status |
| --- | --- | --- |
| manual CoW baseline | tests plus proof bundle | closed |
| scheduled review shell | tests plus truthful review-only state transitions | closed |
| CRE provider-triggered review | deployed signed provider event opens `awaiting_operator` and persists receipt | local complete, deployed proof open |
| autonomous provider execution | dedicated spec, dependency closure, and hosted proof bundle | spec opened, proof not started |

## Acceptance Criteria

1. `XSL-011` remains the only umbrella owner for rebalance automation.
2. `XSL-011A` and `XSL-011C` stay completed and are not reopened as active work.
3. `XSL-011B` remains the review-only CRE/provider-triggered lane.
4. `XSL-011D` exists as the only autonomous CRE/provider-execution owner spec.
5. No repo-tracked artifact claims live autonomous CRE/provider execution beyond the proof contract in `XSL-011D`.
6. Agent surfaces describe autonomous CRE as unproven until that proof exists.

## Blocker Taxonomy

1. `missing_deployed_provider_host`
2. `missing_deployed_receiver_route`
3. `missing_deployed_signer_allowlist`
4. `missing_deployed_workflow_allowlist`
5. `missing_provider_proof`

## Rollback / Recovery Contract

1. If provider-trigger work regresses, keep the umbrella claim at the completed manual and scheduled baselines.
2. If a future provider-trigger implementation leaks past review-only, revert it or fail closed immediately.
3. Do not roll back the manual baseline to accommodate CRE experimentation.

## Exact Test / Verification Commands

1. `node --test packages/shared/test/rebalance.test.js`
2. `node --test packages/shared/test/rebalance-provider.test.js`
3. `node --test packages/policy/test/rebalance-policy.test.js`
4. `node --test packages/policy/test/policy.test.js`
5. `node --test apps/worker/src/__tests__/rebalance-orchestrator.test.js`
6. `node --test apps/api/test/rebalance-service.test.js`
7. `node --test apps/api/test/api.test.js`
8. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this umbrella: the truthful baseline is already stronger than older docs claimed; the open work is the ongoing CRE lane only.
2. Completion relative to the live-gap list: this umbrella owns gap 3 indirectly through `XSL-011B`.
3. Completion relative to prior claims: older planning that treated all rebalance automation as generic or uniformly missing is no longer accurate.

## Agent-Testability Contract

1. Public `skill.md` may mention CRE only as target-state and must not imply live provider-triggered review.
2. Internal agent surfaces may verify manual review truth and later CRE receipts, but those checks stay internal.
3. The detailed smoke matrix belongs to `XSL-016B`; this umbrella owns only the truth levels that those smokes must respect.
