# xStocks 1inch Manual Execution Substrate

Date: 2026-04-01
Owner: Codex
Status: completed
Canonical issue: `XSL-014A` under `XSL-014`

## Outcome

`XSL-014A` is complete as a repo-owned venue-routed execution substrate up to the live session or signer boundary.

The repo now owns one canonical execution request and leg contract that:
1. preserves the existing `CoW` path,
2. adds `1inch Fusion` as a signer-owned venue path,
3. persists per-leg venue truth rather than basket-level marketing labels only,
4. and stops at the first exact authenticated-session or signer blocker instead of overclaiming live submission.

## Strongest Truthful Claim

The strongest truthful claim closed by this tranche is:

`apps/api` can create a venue-routed authenticated execution request, route an xStocks leg to `1inch.ethereum`, persist a live 1inch Fusion quote plus signer-owned approval payload, accept a user-produced signature for relayer submission, and persist venue-status or receipt truth without introducing autonomous execution.

The strongest truthful live-proof claim is weaker than real submission:
1. the proof harness writes a blocker bundle when no authenticated session input is present,
2. the exact blocker is the missing live operator session token, not missing backend 1inch or Privy runtime wiring,
3. so `XSL-014A` closes the substrate and contract lane, but not the hosted or session-backed signer proof lane.

## Canonical Execution Contract

The reusable contract remains the shared execution request and leg surface in [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts).

Exact request shape:

```ts
ExecutionRequest {
  version
  executionRequestId
  owner
  activationId
  manifestId
  slotId
  chain
  mode
  runtimeOwner
  triggerSource
  adapterId
  activationManifestRef
  requestedNotionalUsd
  fundingAssetSymbol
  settlementAddress
  state
  blockers[]
  warnings[]
  legs[]
  createdAt
  updatedAt
}
```

Exact leg shape:

```ts
ExecutionRequestLeg {
  legId
  sequence
  sleeve
  assetSymbol?
  venueId?
  adapterId
  requiredRouteId
  targetWeightPct
  targetNotionalUsd
  paymentAssetSymbol
  paymentTokenAddress
  paymentTokenDecimals?
  receivingTokenAddress
  receivingTokenDecimals?
  settlementAddress
  state
  blockers[]
  warnings[]
  quote
  approval
  venueStatus
  receipt
  trade
}
```

Execution-grade extensibility points now frozen for downstream callers:
1. `runtimeOwner` already supports `operator_manual` and leaves room for later `policy_bounded_automation`.
2. `triggerSource` is the caller boundary for later `execute_all` and `provider_staging`; later lanes must reuse it rather than inventing a second state machine.
3. `leg.requiredRouteId`, `leg.adapterId`, `leg.quote`, `leg.approval`, `leg.venueStatus`, and `leg.receipt` are the exact per-leg route and proof surfaces.
4. `1inch` is no longer quote-only planning language; it is part of the canonical persisted execution contract.

## Operator Proof Input Contract

`XSTOCKS_PRIVY_ACCESS_TOKEN` is not backend app config.

It is a live operator proof input:
1. it is a current Privy user-session access token captured from a real authenticated session,
2. it is passed to proof runners such as the venue-routed authenticated execution harness,
3. it expires and must be treated as time-bounded session material,
4. it must not be described as a static infra secret or startup requirement for the deployed app.

Optional adjacent proof inputs:
1. `XSTOCKS_PRIVY_IDENTITY_TOKEN` may accompany the access token when linked-account parity is needed,
2. user-produced signatures remain separate proof artifacts and are not runtime config.

Separate backend verification config still exists and is not interchangeable with the operator proof input:
1. `PRIVY_APP_ID` or `NEXT_PUBLIC_PRIVY_APP_ID`
2. `PRIVY_APP_SECRET`
3. `PRIVY_JWKS_URL`
4. optional `PRIVY_API_BASE_URL`

## Verification And Proof Artifacts

Verified commands from the closeout lane:
1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. `node --check apps/api/scripts/oneinch-fusion-proof.js`
4. `node apps/api/scripts/oneinch-fusion-proof.js`

Canonical proof artifact:
1. [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T21-16-45.343Z/summary.json)

Exact blocker from the authenticated proof boundary:
1. `code = "missing_environment_input"`
2. `stage = "environment_or_authentication"`
3. `message = "XSTOCKS_PRIVY_ACCESS_TOKEN is required for the 1inch Fusion proof runner."`

## Remaining Work Moved Out Of `XSL-014A`

The remaining delta is no longer adapter or quoteability work.

It now belongs to downstream consumer lanes:
1. `XSL-018B` must create or advance execution requests from provider staging into this canonical contract.
2. `XSL-018A` must expose the right-rail event control plus explicit `Execute all` action on top of this same contract.
3. `XSL-014` must capture one hosted or session-backed signer proof with a real current session token and real signature or exact blocker.
4. full `CRE` end-to-end execution remains unproven until both the caller or handoff lane and the signer-backed proof lane are closed.

## Decision Log

- 2026-04-01: Reuse the shared execution request and leg state machine instead of creating a 1inch-specific executor.
- 2026-04-01: Freeze explicit per-leg venue routing as canonical contract truth.
- 2026-04-01: Stop `XSL-014A` at the live session or signer boundary and move remaining work to caller and proof lanes rather than reopening venue work.
