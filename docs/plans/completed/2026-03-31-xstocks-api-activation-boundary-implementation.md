# Outcome: local manifest-to-execution boundary implemented and verified on fixture-backed promoted manifests; live provider credentials and production adapters remain downstream integration work.

# xStocks API Activation Boundary Implementation Plan

Date: 2026-03-31
Owner: Codex
Status: completed

## Objective

Implement the first manifest-to-execution backend slice for `xStocks Strategy Lab` so:
1. the API serves stable recommendation, preflight, activation, and activity contracts,
2. execution starts only from promoted manifests,
3. route and vault truth labels are explicit and fail closed,
4. activations and activity persist coherently,
5. smart-account state is modeled without pretending provider wiring is complete.

## Non-goals

This plan does not:
1. add real frontend work,
2. implement live Euler xStocks execution,
3. add Prisma models or mutate a missing `prisma/` tree,
4. accept raw strategy candidates from clients,
5. overbuild provider SDK integrations before credentials and live adapters exist.

## User-Stated Desired Outcome

Build the manifest-to-execution boundary inside `apps/api/**` and `packages/policy/**`, persist activations and activity, prepare the smart-account and funding path, and stop only when the API can preflight a promoted manifest with stable frontend-facing contracts.

## Constraints / Non-Negotiables

1. Write only inside `apps/api/**` and `packages/policy/**`, plus required issue/plan tracking artifacts.
2. Consume promoted manifests only; do not accept raw strategy candidates.
3. Fail closed on unverified rails.
4. Keep wallet connection late in the flow.
5. No fake live Euler xStocks execution.
6. Preserve the current dirty worktree and do not revert unrelated user changes.

## Step-By-Step Plan

1. Define local backend contracts for:
   - promoted manifests,
   - live xStocks state,
   - live route/vault state,
   - wallet/smart-account state,
   - recommendation payloads,
   - execution preflight payloads,
   - activation and activity records.
2. Implement `packages/policy` derivation logic for:
   - manifest validation,
   - route/vault truth labels,
   - recommendation shaping,
   - execution-plan derivation,
   - smart-account provider scaffolding.
3. Implement `apps/api` runtime pieces for:
   - fixture-backed promoted-manifest and live-state repositories,
   - file-backed activation/activity persistence,
   - HTTP handlers and JSON contracts,
   - endpoint-level validation and fail-closed responses.
4. Seed stable mocked data for:
   - at least one basket manifest using verified rails,
   - at least one directional manifest that truthfully remains preview/blocked because Euler execution is unverified.
5. Add tests for:
   - promoted-manifest-only enforcement,
   - route-truth fail-closed behavior,
   - readiness transitions by wallet/smart-account/funding state,
   - activation/activity persistence coherence.

## Verification Plan

Commands:
1. `node --test /Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/test/*.test.js`
2. `node --test /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/test/*.test.js`
3. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Expected artifacts:
1. one sample recommendation payload from a promoted manifest,
2. one sample manifest-preflight response,
3. persisted activation and activity records under `apps/api`,
4. route truth labels covering `live`, `preview`, `blocked`, `mentor_confirmed`, and `unverified`.

## Rollback / Recovery

1. Remove the new API and policy files if the contract is wrong.
2. Keep persistence isolated to file-backed adapters so Prisma wiring can replace it later without touching route logic.
3. Preserve promoted-manifest fixtures separately from activation/activity data to avoid corrupting the contract surface during iteration.

## Decision Log

1. Use file-backed persistence in `apps/api` because the repo has no Prisma implementation yet and this lane still needs coherent persisted state.
2. Keep all contract logic in `packages/policy` so the later DB/provider swap does not redefine frontend payloads.
3. Use promoted-manifest fixture data now because the research-manifest registry does not exist yet, but enforce the same boundary the future registry will use.
4. Model smart-account integration as an interface/stub contract only until provider credentials and wallet flows exist.

## Progress Log

1. 2026-03-31: Read the execution/funding, portfolio/rebalance, Strategy Lab, and execution-plan specs.
2. 2026-03-31: Audited the repo and confirmed `apps/api` plus `packages/policy` are empty scaffolds with no Prisma tree yet.
3. 2026-03-31: Chose a file-backed API/policy implementation as the minimal truthful path that preserves the promoted-manifest boundary and can later swap to Prisma/providers.
4. 2026-03-31: Implemented policy derivation, route/vault truth labeling, smart-account scaffolding, fixture-backed promoted manifest resolution, and file-backed activation/activity persistence.
5. 2026-03-31: Verified with package syntax checks, policy tests, API tests, and `git diff --check`.
