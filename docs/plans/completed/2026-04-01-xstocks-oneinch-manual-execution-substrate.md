# xStocks 1inch Manual Execution Substrate

Date: 2026-04-01
Owner: Codex
Status: completed
Canonical issue: `XSL-014A` under `XSL-014`

## Outcome

Completed as a backend substrate tranche. The repo now owns a venue-routed manual execution contract that keeps CoW as the default existing path and adds 1inch Fusion as a signer-owned path for quote, approval payload creation, signed submission attempt, and venue-status or receipt persistence. Closure stops at the furthest truthful proof boundary available in the current environment.

## Objective

Add 1inch manual execution as phase 1 of a reusable venue-routed execution substrate by:
1. freezing the owner lane under `XSL-014`,
2. reusing the narrowest existing execution-request contract instead of creating a parallel state machine,
3. wiring 1inch Fusion into the backend manual quote, approval, submission, and receipt path,
4. preserving explicit signer approval,
5. and stopping at the exact mainnet proof blocker if real authenticated signer material is not available.

## Non-goals

This tranche does not:
1. touch `apps/web/**`,
2. redesign the frontend activation flow,
3. add CRE, Chainlink, provider-triggered automation, or on-ramp work,
4. claim autonomous or hidden-custody execution,
5. replace CoW as the current default manual execution lane.

## User-Stated Desired Outcome

Own a repo-local 1inch manual execution lane for xStocks, keep it user-approved and signer-owned, carry the backend to the furthest truthful mainnet boundary possible, and leave behind the canonical execution contract that later work such as `XSL-018B` can call for operator-manual execution, top-level `Execute all`, provider staging handoff, and later policy-bounded automation.

## Constraints And Non-Negotiables

1. Scope stays in `apps/api/**`, `packages/xstocks/**`, `packages/shared/**`, `packages/policy/**`, and docs.
2. `apps/web/**` remains untouched.
3. Every path remains signer-owned and user-approved.
4. 1inch behavior is implemented from official 1inch docs and SDK surfaces only.
5. Proof claims fail closed at the first exact blocker instead of widening scope.

## Strongest Truthful Claim

The strongest truthful 1inch execution claim from this tranche is:

`apps/api` can create a venue-routed authenticated execution request, route an xStocks leg to `1inch.ethereum`, persist a live 1inch Fusion quote plus signer-owned EIP-712 approval payload, accept a user-produced signature for relayer submission, and persist venue-status / receipt truth or the exact blocker without introducing autonomous execution.

The strongest truthful mainnet proof from the current environment is weaker than live submission:

the repo-owned proof harness now writes a blocker bundle at [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/tmp/proof/oneinch-fusion-2026-04-01T21-16-45.343Z/summary.json), and the exact blocker is `XSTOCKS_PRIVY_ACCESS_TOKEN is required for the 1inch Fusion proof runner.` No authenticated activation, quote, signature, or submission can be truthfully claimed from this machine beyond that point.

## Canonical Execution Contract

The reusable phase-1 substrate remains the existing shared execution request and leg contract in [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/packages/shared/src/contracts/execution.ts).

Exact request contract:

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

Exact leg contract:

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

The phase-1 extensibility points are explicit:
1. `runtimeOwner` now allows `operator_manual` and later `policy_bounded_automation`.
2. `triggerSource` now allows `operator_manual`, later top-level `execute_all`, later `provider_staging`, and later `policy_bounded_automation`.
3. `leg.requiredRouteId` and `leg.adapterId` choose the venue path without changing the state machine.
4. `leg.quote`, `leg.approval.orderToSign`, `leg.venueStatus`, and `leg.receipt` carry venue-specific payloads while the request or leg lifecycle stays shared.

For 1inch specifically, the venue-specific quote and approval payload now persist:
1. `quote.kind = "oneinch_fusion"`
2. `quote.quoteId`
3. `quote.orderHash`
4. `quote.fromTokenAddress` / `quote.toTokenAddress`
5. `quote.fromTokenAmount` / `quote.toTokenAmount`
6. `quote.settlementAddress`
7. `quote.recommendedPreset`
8. `quote.signerAddress`
9. `quote.receiver`
10. `approval.approvalTarget = "oneinch_fusion_order"`
11. `approval.orderToSign = { quoteId, orderHash, order, extension, typedData }`

This is the exact execution request / leg contract that later work such as `XSL-018B` can call without inventing a second execution state machine.

## Implementation Surface

### Venue adapter and contract work

1. Added [oneinch.ts](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/packages/xstocks/src/adapters/oneinch.ts) plus 1inch Fusion types in [types.ts](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/packages/xstocks/src/types.ts).
2. Extended [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/packages/shared/src/contracts/execution.ts) with `oneinch_fusion` quote storage and generalized request ownership/source enums.
3. Exported the new adapter from [index.ts](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/packages/xstocks/src/index.ts).

### Backend substrate wiring

1. [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/src/services/api-service.js) now resolves the manual execution venue explicitly, builds 1inch quotes, persists signer-owned approval payloads, records signed submissions, refreshes 1inch venue status, and keeps CoW as the default path.
2. [runtime-store.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/src/repositories/runtime-store.js) now normalizes stored `oneinch_fusion` quotes.
3. [server.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/src/server.js) now wires an authenticated 1inch client when `ONEINCH_API_KEY` is present.
4. [contracts.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/src/contracts.js) now documents `executionRouteId` on the execution write surface.

### Proof and verification surfaces

1. Added [oneinch-fusion-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/scripts/oneinch-fusion-proof.js) to drive the authenticated manual 1inch path and emit proof artifacts.
2. Added 1inch execution-path tests to [api.test.js](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/apps/api/test/api.test.js).

## Verification

Commands run:
1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. `node --check apps/api/scripts/oneinch-fusion-proof.js`
4. `node apps/api/scripts/oneinch-fusion-proof.js`

Results:
1. xStocks package tests passed.
2. API tests passed.
3. Proof runner syntax check passed.
4. The proof runner emitted a blocker artifact rather than crashing and stopped at the exact authenticated-environment boundary.

## Exact Proof Artifact And Blocker

Artifact:
1. [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-014a/tmp/proof/oneinch-fusion-2026-04-01T21-16-45.343Z/summary.json)

Exact blocker:
1. `code = "missing_environment_input"`
2. `stage = "environment_or_authentication"`
3. `message = "XSTOCKS_PRIVY_ACCESS_TOKEN is required for the 1inch Fusion proof runner."`

This means the remaining proof failure in the current environment is not a fabricated venue claim, not a quote-only fallback, and not a submission bug inside the new substrate. The blocker is the absence of the authenticated Privy access token needed to start the signer-owned proof path at all.

## Remaining Delta From Operator-Manual To Automated Execution

The exact remaining delta from the current operator-manual substrate to later automation is:
1. add a caller above this substrate that can batch or sequence multiple legs for top-level `Execute all` while reusing the same `ExecutionRequest` and `ExecutionRequestLeg` contracts,
2. add a provider or CRE staging caller that can create or advance an execution request with `triggerSource = "provider_staging"` without bypassing human approval,
3. add a policy-bounded automation owner that can advance from staged approval to submission only within explicit policy limits and with a separately proven signer/authorization model,
4. add a real signer/session collection surface that can obtain the EIP-712 signature from a user or approved operator in hosted conditions,
5. prove live submission plus receipt on mainnet with authenticated environment material before any automated-execution claim is made.

## Decision Log

- 2026-04-01: Reuse the existing shared execution request and leg state machine instead of creating a second 1inch-specific contract.
- 2026-04-01: Keep CoW as the default current manual path and make venue routing explicit per request or leg.
- 2026-04-01: Add only the narrow contract generalization needed for future callers: explicit `runtimeOwner` and `triggerSource` enums.
- 2026-04-01: Keep signer approval explicit and stop at the first exact authenticated proof blocker instead of widening into frontend or provider work.
