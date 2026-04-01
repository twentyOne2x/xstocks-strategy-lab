# xStocks And Euler Adapter Implementation

Date: 2026-03-31
Owner: Codex
Status: active

## Objective

Implement the first backend-facing adapter layer for `xStocks Strategy Lab` so downstream API and frontend lanes can consume:
1. normalized xStocks live state,
2. truthful route-truth labels,
3. Morpho lending and vault rail scaffolding,
4. Euler directional preview primitives.

## Non-goals

This lane does not:
1. implement frontend rendering,
2. implement direct execution or wallet funding flows,
3. claim verified live xStocks-on-Euler execution support,
4. modify shared schemas, Prisma, or app packages.

## User-Stated Desired Outcome

The xStocks and rails adapter owner should:
1. implement normalized xStocks live-state adapters,
2. implement directional or rail scaffolding for Euler and Morpho,
3. produce clean frontend/backend-friendly payload helpers.

## Constraints And Non-Negotiables

1. Only edit `packages/xstocks/**` and `packages/euler/**` plus repo-local issue/plan tracking.
2. Do not edit `packages/shared/**` except to import.
3. Do not edit `prisma/**`, `apps/web/**`, `apps/api/**`, `packages/research/**`, or `packages/policy/**`.
4. Keep the adapters deterministic and typed.
5. Use only current publicly verified rails for anything labeled live.
6. Do not overclaim live xStocks-on-Euler support.
7. Avoid frontend-specific code.

## Implementation Plan

1. Freeze the xStocks public API contract from the official xStocks v2 docs and use those endpoints as the adapter boundary.
2. Scaffold `packages/xstocks` with:
   - endpoint constants and fetch helpers,
   - typed raw DTOs,
   - normalized domain models,
   - route-truth enums/helpers,
   - a normalized state strip payload builder.
3. Scaffold `packages/euler` with:
   - Morpho `SPYx/AUSD` market and Flowdesk AUSD vault adapter shapes,
   - truthful rail-truth defaults,
   - Euler directional preview primitives for health factor, liquidation distance, and route/vault context.
4. Expose package-level entrypoints that downstream lanes can import without frontend coupling.
5. Run repo checks that are currently available and record any missing-tooling blockers explicitly.

## Verification Plan

1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`
2. `pnpm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/xstocks exec tsc --noEmit`
3. `pnpm --dir /Users/user/PycharmProjects/xstocks-strategy-lab/packages/euler exec tsc --noEmit`

Expected artifacts:
1. typed package entrypoints under `packages/xstocks/src` and `packages/euler/src`,
2. one normalized xStocks state strip helper,
3. Euler/Morpho helper exports that separate `live`, `preview`, `blocked`, `mentor_confirmed`, and `unverified`.

## Rollback / Recovery

1. Revert package-local scaffolding if the import surfaces prove inconsistent with the control-plane docs.
2. Keep live-truth labels conservative if any endpoint or rail contract is ambiguous.

## Decision Log

1. 2026-03-31: Use the official xStocks API v2 public endpoints from `docs.xstocks.fi/apis/openapi` as the authoritative adapter boundary.
2. 2026-03-31: Treat Morpho `SPYx/AUSD` and Flowdesk AUSD vault as the only live lending or yield rails in this implementation lane.
3. 2026-03-31: Keep Euler central in abstractions and preview math while marking direct xStocks-on-Euler support as unverified unless supplied by caller context.

## Progress Log

1. 2026-03-31: Logged the implementation lane and froze the official xStocks endpoint contract before code changes.
2. 2026-03-31: Implemented typed xStocks adapters, normalized state strip helpers, Morpho and Flowdesk rail scaffolds, and Euler directional preview helpers.
3. 2026-03-31: Verified `git diff --check` plus package-local `tsc --noEmit` for `packages/xstocks` and `packages/euler`.
