# xStocks Venue-Routed Mainnet Execution Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Close the next real execution lane by replacing the current CoW-only manual execution posture with a truthful venue-routed mainnet execution path that:
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

1. `apps/api/src/rebalance-service.js` is explicitly hardcoded to the manual `CoW` lane with `OPERATOR_MANUAL_EXECUTION_ADAPTER_ID = "cow_swap"`.
2. `packages/xstocks/src/adapters/oneinch.ts` now exposes a real Fusion quote client with a live proof script under `apps/api/scripts/oneinch-fusion-proof.js`.
3. The repo has live proof that 1inch Fusion quotes `NVDAx`, `AAPLx`, `MSFTx`, `METAx`, `AMZNx`, `GOOGLx`, `TSLAx`, `SPYx`, `AVGOx`, and `ORCLx` at `$20+`, while `AMDx` remained blocked.
4. The repo has live proof that `CoW` directly quotes only a narrower xStocks subset, so the promoted basket cannot close on the current CoW-only lane.
5. No repo-owned 1inch sign/submit/receipt path exists yet for execution requests.

## Current Local Implementation Audit

### Shipped

1. manual `CoW` execution request staging, approval, submission, and settlement tracking,
2. 1inch Fusion quote adapter and live quote proof,
3. route truth surfaces that already name both `CoW` and `1inch`.

### Partial

1. route truth exists, but execution-request state is not venue-routed,
2. mainnet proof exists for `CoW` only up to quote boundary on the current basket,
3. one real 1inch execution proof is missing.

### Spec-only Or Unproven

1. a repo-owned venue-routed execution request contract,
2. a repo-owned 1inch signature/submission boundary,
3. a truthful fallback contract between `1inch` and `CoW`,
4. one small real mainnet 1inch-backed execution proof.

## Completion Reconciliation

1. completion relative to spec = unstarted as a venue-routed lane.
2. completion relative to repeated thread asks = partial; venue availability is now clearer, but execution is still not wired.
3. completion relative to prior implementation claims = `CoW` execution is real for its narrow subset, but that no longer closes the basket/product ask.
4. verified implementation and proof status = 1inch quoteability proven, 1inch execution unproven, CoW manual execution proven only for the narrow direct CoW surface.
5. canonical frontend functioning status = not yet applicable because the backend venue-routed lane does not exist.

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

When this lane is materially closed:
1. an execution request can stage legs with exact selected venues,
2. the system can prepare quotes and signature payloads for 1inch and CoW without lying about interchangeability,
3. the system can submit through the selected venue after explicit signer approval,
4. a small real mainnet execution proof exists for the new path or the exact blocker is documented.

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
2. 1inch is integrated beyond quote-only truth,
3. one small real mainnet proof exists or one exact blocker remains,
4. blocked symbols still report exact blockers rather than disappearing.

## Rollback / Recovery

1. Preserve the existing manual CoW lane as the fallback implementation boundary while the venue-routed path lands.
2. If 1inch integration introduces ambiguity, fail closed to route staging without submission.
3. Revert route-selection logic rather than emitting mixed or false route truth.

## Decision Log

- 2026-04-01: 1inch quoteability changes the execution strategy enough to justify a dedicated sub-lane.
- 2026-04-01: This lane keeps explicit signer approval and does not authorize autonomous execution.
- 2026-04-01: CoW remains part of route truth, but not the only route.

## Progress Log

- 2026-04-01T23:05:00+02:00: Created `XSL-014A` as the dedicated owner spec for venue-routed mainnet execution after 1inch quoteability proof made the existing CoW-only execution lane stale.
