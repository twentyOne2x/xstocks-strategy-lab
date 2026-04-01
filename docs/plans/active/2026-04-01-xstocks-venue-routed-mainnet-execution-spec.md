# xStocks Venue-Routed Mainnet Execution Spec

Date: 2026-04-01
Owner: Codex
Status: completed

## Goal

Freeze the completed venue-routed mainnet execution tranche that replaced the old CoW-only manual execution posture with a truthful venue-routed path that:
1. uses `1inch` where xStocks quoteability is proven,
2. uses `CoW` where direct execution is still proven,
3. stages exact per-leg route truth,
4. and carries one small real mainnet execution to the furthest truthful boundary.

## Non-goals

This workstream does not:
1. add autonomous execution,
2. fake route availability for blocked assets,
3. redesign the frontend beyond minimal execution-surface wiring if strictly needed,
4. replace the review ingress already owned by `XSL-011B`,
5. treat pricing APIs as execution proof.

## User-Stated Desired Outcome

The user wants `1inch + Cow Swap` to make rebalance execution work on mainnet, not just quote in isolation.

## Current Live Truth

1. `apps/api/src/rebalance-service.js` now routes manual execution through the venue-routed substrate instead of staying hardcoded to the manual `CoW` lane.
2. `packages/xstocks/src/adapters/oneinch.ts` now exposes a real Fusion quote client with a live proof script under `apps/api/scripts/oneinch-fusion-proof.js`.
3. The repo has live proof that 1inch Fusion quotes `NVDAx`, `AAPLx`, `MSFTx`, `METAx`, `AMZNx`, `GOOGLx`, `TSLAx`, `SPYx`, `AVGOx`, and `ORCLx` at `$20+`, while `AMDx` remained blocked.
4. The repo has live proof that `CoW` directly quotes only a narrower xStocks subset, so the promoted basket could not close on the old CoW-only lane.
5. The repo-owned venue-routed execution substrate now exists; the remaining proof gap is above it, not inside venue routing.

## Current Local Implementation Audit

### Shipped

1. manual venue-routed execution request staging, approval, submission, and settlement tracking,
2. 1inch Fusion quote adapter and live quote proof,
3. route truth surfaces that already name both `CoW` and `1inch`.

### Partial

1. hosted proof above the execution substrate is still missing,
2. provider handoff and control-surface work are still missing,
3. one real hosted/session-backed signer proof is missing.

### Spec-only Or Unproven

1. a repo-owned hosted/session-backed signer proof bundle,
2. a truthful provider handoff into the completed substrate,
3. a canonical top-level `Execute all` control.

## Completion Reconciliation

1. completion relative to spec = completed as a venue-routed lane.
2. completion relative to repeated thread asks = the venue layer is now frozen; the remaining asks sit above it.
3. completion relative to prior implementation claims = CoW execution was only the precursor; the completed venue-routed substrate now supersedes it.
4. verified implementation and proof status = 1inch quoteability proven, venue-routed execution substrate completed, hosted/session-backed signer proof still unproven.
5. canonical frontend functioning status = not yet applicable because the remaining work is control-plane and session-backed proof above the substrate.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: extend.
   - Why: this is the next executable sub-lane inside authenticated execution proof.
2. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: high.
   - Decision: reuse without widening.
   - Why: provider ingress should feed this lane later, not be rewritten here.
3. [2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-testnet-proof-surface-and-harness-spec.md)
   - Current relevance: medium.
   - Decision: reuse in parallel.
   - Why: testnet can help wiring proof, but not replace mainnet route truth.

## Workstream Outcome Contract

This lane is materially closed and frozen:
1. the repo owns a venue-routed execution request contract,
2. exact per-leg route selection, quote artifacts, signer payloads, submissions, and receipts persist,
3. explicit signer approval remains required,
4. later work can reuse the completed substrate without reopening venue design.

## State-And-Truth Contract

1. route selection must be persisted per leg, not per basket label only.
2. `1inch` is not a backup banner; it must be a first-class execution adapter where proven.
3. `CoW` remains available for the names and legs where direct proof still exists.
4. blocked legs must remain blocked explicitly; no silent dropping or route relabeling.

## Execution Plan

### Phase 1: Shared contract and execution-request shape

1. Add a venue-routed execution request shape in shared or API-owned contracts.
2. Preserve existing rebalance and execution IDs so reporting and activity surfaces do not fork.
3. Make route selection explicit per leg.

### Phase 2: 1inch adapter expansion

1. Extend `packages/xstocks/**` from quote-only toward the truthful next boundary:
   - quote artifact,
   - signature payload or exact signer requirements,
   - submission request,
   - receipt polling or exact blocker.
2. Keep exact proof boundaries explicit if 1inch requires an external signer surface the repo does not yet own.

### Phase 3: Backend venue-routed execution path

1. Refactor `apps/api/src/rebalance-service.js` so the manual execution lane is no longer hardcoded to `CoW`.
2. Select `1inch` or `CoW` per leg according to exact proven route truth.
3. Persist exact artifacts for quote, signature, submission, and receipt per leg.

### Phase 4: Mainnet proof

1. Carry one tiny real mainnet execution through the new lane.
2. If a real signer path is missing, stop with one exact blocker and retain a full proof bundle.

## Proof Artifacts

Required artifacts:
1. one venue-routed execution request example,
2. one per-leg route-selection artifact,
3. one 1inch signature/submission artifact or exact blocker,
4. one small real mainnet execution bundle or exact blocker summary,
5. one summary that states which symbols are currently executable on 1inch, CoW, or neither.

## Verification Contract

Minimum required verification:
1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. `node --check apps/api/scripts/oneinch-fusion-proof.js`
4. one repo-owned mainnet proof command for the venue-routed execution path

## Exit Criteria

This lane is materially closed only when:
1. execution requests are venue-routed rather than CoW-only,
2. the venue layer stays frozen,
3. later work above the substrate reports exact blockers rather than reopening venue design.

## Rollback / Recovery

1. Preserve the existing manual CoW lane as the fallback implementation boundary while the venue-routed path lands.
2. If hosted proof introduces ambiguity, fail closed to staging without submission.
3. Do not reopen venue-selection logic.

## Decision Log

- 2026-04-01: 1inch quoteability changed the execution strategy enough to justify the dedicated sub-lane, and that lane is now completed.
- 2026-04-01: This lane keeps explicit signer approval and does not authorize autonomous execution.
- 2026-04-01: CoW remained part of route truth, but the completed substrate now supersedes the old CoW-only posture.

## Progress Log

- 2026-04-01T23:05:00+02:00: Created `XSL-014A` as the dedicated owner spec for venue-routed mainnet execution after 1inch quoteability proof made the existing CoW-only execution lane stale; this tranche is now frozen as completed.
