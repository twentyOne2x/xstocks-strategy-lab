# xStocks API-Backed Replay And Market Intelligence Surface

Outcome: completed on 2026-04-01 with replay metrics, replay curves, and market-intelligence surfaces flowing from promoted research manifests through the API into the onboarding and workspace adapters.

Date: 2026-04-01
Owner: Codex
Status: completed
Owner issue: [XSL-010A API-Backed Replay And Market Intelligence Surface](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md)

## Objective

Expose one truthful replay and market-intelligence surface from promoted manifests through `apps/api` so the onboarding gate and workspace in `apps/web` render research-derived replay stats, replay curves, allocation context, and signal cards instead of local mock or score-only fallbacks.

## Non-goals

1. Rewriting landing-page copy or the broader XSL-010 interpretability spec.
2. Changing portfolio construction, manifest promotion, or live execution policy.
3. Widening this slice into browser-proof capture, hosted deployment, or auth/runtime work.

## User-Stated Desired Outcome

The frontend at `apps/web/` should use real backend data from `apps/api/` for:
1. replay return and drawdown stats,
2. replay start and end capital values,
3. allocation weights,
4. risk label,
5. market-intelligence drivers, what-changed, current-view, and horizon text,
so onboarding and workspace stop showing local mock fallbacks.

## Constraints And Non-Negotiables

1. The backend must remain the source of truth for API-backed manifests.
2. Existing user-owned worktree edits must not be reverted.
3. Allocation rows still need live-state enrichment for PoR and price context.
4. Directional manifests must fail closed if the promoted research output does not support the same replay/intelligence structure.

## Plan

1. Extend promoted manifest generation and normalization so basket manifests carry replay stats, replay points, and market-intelligence signal objects derived from research evaluation output.
2. Extend the API manifest contract and `apps/api/src/services/api-service.js` to pass those objects through.
3. Update `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api-adapter.ts`, and `apps/web/src/lib/data-source.ts` so API-backed manifests use the new replay and signal fields directly and keep only live-state enrichment client-side.
4. Update mock fallback data only as needed to stay type-correct after the replay-curve change.
5. Add or update focused tests in research or policy, `apps/api/test/api.test.js`, and `apps/web/src/**/*.test.ts`.

## Verification Plan

1. `node --test packages/research/src/__tests__/promoted-manifests.test.js`
2. `node --test packages/policy/test/policy.test.js`
3. `node --test apps/api/test/api.test.js`
4. `pnpm --filter @xstocks-strategy-lab/web test`
5. `pnpm --dir apps/web build`
6. `pnpm --dir apps/web exec tsc --noEmit`

Expected artifacts:
1. Promoted-manifest assertions proving replay and market-intelligence fields exist and match research truth.
2. API test assertions proving manifest responses expose the same replay and signal values.
3. Web test assertions proving adapter output and replay-chart inputs use API-supplied values.
4. A production build and typecheck proving the web surface accepts the extended contract.

## Rollback And Recovery

1. If the API contract extension proves incompatible, revert only the new manifest replay/intelligence fields and keep existing explanation/tuning payloads intact.
2. If a promoted manifest lacks required research data, return safe null or derived fallback values from the backend rather than restoring frontend-local canned data.

## Decision Log

1. This slice is owned as `XSL-010A` under the interpretability lane because the changed fields are user-facing explanation surfaces, even though the implementation spans both `apps/api` and `apps/web`.
2. The replay and market-intelligence contract will be derived on the server so catalog/workspace/activity remain consistent.

## Progress Log

1. 2026-04-01: Logged the lane, confirmed the current adapter still synthesizes replay and market-intelligence values locally, and expanded the fix to include promoted-manifest generation plus web adapter consumption so the data survives the full stack.
2. 2026-04-01: Added replay and market-intelligence schemas to the research and policy contracts, derived research-backed replay metrics and point series in the promoted-manifest generation path, and regenerated onboarding promoted manifests with distinct replay outputs per basket.
3. 2026-04-01: Extended the API manifest view contract to pass `replay` and `marketIntelligence` through directly and updated the web API client, adapter, and workspace data source to consume those values instead of score formulas and slug-based replay templates.
4. 2026-04-01: Verification passed with `node --test packages/research/src/__tests__/promoted-manifests.test.js`, `node --test packages/policy/test/policy.test.js`, `node --test apps/api/test/api.test.js`, `pnpm --filter @xstocks-strategy-lab/web test`, `pnpm --dir apps/web build`, and `pnpm --dir apps/web exec tsc --noEmit`. The `tsc` step required running the build first because `apps/web/tsconfig.json` includes `.next/types/**/*.ts`.

## Outcome Summary

1. Promoted onboarding basket manifests now ship real replay metrics, turnover, win rate, and replay points rather than frontend-local formulas.
2. The onboarding baskets now differ with actual replay results: `onboarding.default_basket` ending capital `1212.52`, `onboarding.alt_basket_1` `1237.93`, and `onboarding.alt_basket_2` `1218.44`.
3. API-backed frontend manifests now use backend-provided replay curves and market-intelligence narratives directly, while live-state enrichment remains limited to price and PoR context.

## Residual Notes

1. Visual browser-proof capture was not part of this slice, so closure is based on contract tests, web tests, build, and typecheck rather than screenshots.
2. `pnpm --dir apps/web build` still surfaces the pre-existing non-blocking `@privy-io/react-auth` optional-module warning and existing unused-import warnings in `apps/web/src/components/onboarding-terminal-experience.tsx`.
