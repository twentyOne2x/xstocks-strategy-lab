# xStocks Default-Basket Venue-Routed Readiness

Date: 2026-04-02
Owner: Codex
Status: completed
Canonical issue: `XSL-014B` under `XSL-014`

## Objective

Resolve the activation-readiness mismatch above the landed venue-routed execution substrate so the saved activation snapshot for the promoted default basket is executable only where current 1inch venue truth actually supports it, then carry the truthful target to a multi-leg 1inch proof boundary.

## Non-goals

1. Do not touch `apps/web/**`.
2. Do not reopen CRE/provider ingress work.
3. Do not do unrelated docs cleanup.
4. Do not relabel any basket as executable without current proof-backed venue truth.

## User-Stated Desired Outcome

Audit why the current promoted `onboarding.default_basket` manifest remains `preview_only`, determine whether it can truthfully become executable under venue-routed 1inch truth, update the minimum manifest and policy truth if yes, rerun the authenticated proof to a multi-leg 1inch boundary, and otherwise fail closed with the exact blocker.

## Constraints And Non-Negotiables

1. Work from a fresh clean worktree off updated `origin/main`.
2. Keep the current promoted basket unless present truth requires an exact different executable basket.
3. Treat 1inch quote proof as venue truth only where the repo already has authenticated or current proof artifacts.
4. Keep saved activation snapshots truthful; they must not claim `ready` or `executable` unless the promoted manifest and policy surface can really support execution.
5. The final claim must distinguish core xStocks legs from the intentionally deferred `AUSD` yield-buffer follow-up.

## Plan

1. Audit the promoted default-basket manifest, slot registry, policy adaptation, execution-plan derivation, and current 1inch proof artifacts.
2. Decide whether the current promoted basket is executable under venue-routed 1inch truth or whether a narrower exact basket is required.
3. Update the minimum manifest and policy surfaces needed to make activation readiness match truthful venue-routed execution.
4. Extend the 1inch proof runner to capture a multi-leg basket boundary instead of a single-leg spot check.
5. Run the requested verification commands, collect proof artifacts, and close `XSL-014B` with exact claim language.

## Verification Plan

1. `pnpm --filter @xstocks-strategy-lab/policy test`
2. `pnpm --filter @xstocks-strategy-lab/xstocks test`
3. `node --test /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/test/api.test.js`
4. `XSTOCKS_SHARED_ENV_PATH=/Users/user/.config/attn/shared.env node /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js`
5. `git diff --check`

## Rollback / Recovery

1. Revert only the touched manifest, policy, API proof-runner, and issue-plan files if venue-routed readiness cannot be made truthful.
2. If the authenticated proof regresses, keep `onboarding.default_basket` preview-only and record the exact blocker rather than forcing executable state.

## Decision Log

- 2026-04-02: Start from the current promoted `c5` default basket and prove whether present 1inch truth supports it before considering any slot-registry swap.

## Progress Log

- 2026-04-02: Established a clean worktree from updated `origin/main`, audited `XSL-014`, loaded the current promoted manifest, and confirmed the present blocker is a CoW-only readiness surface above a venue-routed 1inch execution substrate.
- 2026-04-02: Updated the promoted `c5` manifest plus policy readiness derivation so venue-routed `1inch.ethereum` truth can surface as `ready` / `executable` without silently reverting the slot to the older `c2` basket.
- 2026-04-02: Extended the authenticated 1inch proof runner to carry the full promoted basket to a multi-leg boundary and fixed the 1inch Fusion adapter so string receivers are converted to SDK `Address` objects during order preparation.

## Outcome

1. Current promoted `c5` basket is executable now, with proof.

## Resolution

- Saved activation snapshots for the promoted `onboarding.default_basket` now truthfully become `live` / `ready` / `executable` when authenticated wallet readiness is present.
- The strongest exact execution claim is limited to the six core xStocks legs proven on `1inch.ethereum`: `NVDAx`, `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, and `GOOGLx`.
- The `AUSD` yield-buffer leg remains intentionally deferred/manual and is not relabeled as a signer-owned 1inch execution leg.
- The post-rebase authenticated proof reached `awaiting_approval` for all six actionable core legs, which proves full-basket venue-routed readiness through the signer-owned approval boundary.
- Exact next blocker: signer-owned 1inch Fusion EIP-712 signatures are still required before backend submission can be recorded for those six quoted legs.

## Verification Results

1. `pnpm --filter @xstocks-strategy-lab/policy test`
   Result: no matching workspace package; the repo package name is `@xstocks/policy`.
2. `pnpm --filter @xstocks/policy test`
   Result: passed.
3. `pnpm --filter @xstocks-strategy-lab/xstocks test`
   Result: passed.
4. `node --test /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/test/api.test.js`
   Result: passed.
5. `XSTOCKS_SHARED_ENV_PATH=/Users/user/.config/attn/shared.env node /Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/oneinch-fusion-proof.js`
   Result: successful post-rebase proof captured the multi-leg approval boundary; exact artifact below.
6. `git diff --check`
   Result: passed.

## Proof Artifact

- `/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T23-02-30.237Z/summary.json`
