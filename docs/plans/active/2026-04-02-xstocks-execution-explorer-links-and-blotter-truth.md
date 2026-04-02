# XSL-014D Execution Explorer Links And Blotter Truth

## Objective

Advance the post-`XSL-014C` slice by carrying structured execution artifacts from API/runtime truth into the web activation and bottom-blotter surfaces, with real Ethereum explorer links and tighter holdings/history/activity claims.

## User-Stated Desired Outcome

- Replace plain-text tx/order references with structured execution artifact fields.
- Surface real explorer links in activation and bottom-blotter surfaces.
- Improve positions/history/activity truth without inventing claims the backend cannot prove.

## Non-Goals

- Autonomous execution.
- Smart-account-native venue signing.
- CRE runtime or provider-triggered execution.
- Fabricated PnL, holdings performance, or implied live custody beyond stored execution truth.

## Constraints And Non-Negotiables

- Fail closed when `txHash` or `venueOrderId` is missing.
- Only derive explorer URLs that are truly derivable from stored data.
- Ethereum-only explorer derivation in this slice: Etherscan tx and EigenPhi tx.
- Fix the minimum backend contract gap only if the backend is dropping already-known execution fields before the frontend adapter.

## Plan

1. Add a narrow execution-artifact shape to API/frontend row contracts for history and lifecycle rows.
2. Patch the API activity-surface builders so stored execution payload fields survive into structured row data, including derived Ethereum explorer URLs when `txHash` is valid.
3. Update the web adapter to consume structured artifacts instead of reconstructing hash text inside copy.
4. Tighten blotter positions/history/activity truth so positions remain preview/activation-derived unless a stronger execution claim exists, while leaving PnL unclaimed.
5. Render explicit explorer/order references in the activation screen and bottom blotter, fail closing when artifacts are absent.
6. Run required tests/build/diff checks and capture UI screenshots showing explorer links.

## Verification Plan

- `pnpm --filter @xstocks-strategy-lab/web test`
- `pnpm --filter @xstocks-strategy-lab/web build`
- `node --test apps/api/test/api.test.js`
- `git diff --check`
- Screenshot proof from the rendered web UI showing explorer links on:
  - activation execution truth
  - bottom blotter history/activity

## Rollback / Recovery

- Revert the contract and rendering changes in this slice only.
- Preserve any stored execution payload truth; do not mutate runtime data formats beyond additive fields.

## Decision Log

- 2026-04-02: Treat this as a new `XSL-014D` sub-lane under canonical owner `XSL-014` instead of widening `XSL-014C`, because the remaining work is UI/contract truth presentation rather than signer-proof restoration.
- 2026-04-02: Use additive structured fields on row contracts rather than encoding explorer links into free-form summaries.

## Progress Log

- 2026-04-02: Clean worktree created from updated `origin/main` on branch `codex/xsl-014d-explorer-artifacts`.
- 2026-04-02: Confirmed the backend already persists `txHash` and `venueOrderId` on execution-linked activity events, but `activitySurface.history` and `activitySurface.lifecycle` currently drop them before the web adapter.
- 2026-04-02: Added additive execution-artifact row fields on the API activity surface and web contracts, including derived Ethereum Etherscan/EigenPhi URLs and fail-closed null behavior when `txHash` is absent.
- 2026-04-02: Updated activation and bottom-blotter rendering to use structured artifact chips/links instead of embedding raw ids in prose, while leaving PnL and holdings performance unclaimed.
- 2026-04-02: Verification passed with `pnpm --filter @xstocks-strategy-lab/web test`, `pnpm --filter @xstocks-strategy-lab/web build`, `node --test apps/api/test/api.test.js`, and `git diff --check`.
