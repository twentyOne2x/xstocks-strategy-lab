# xStocks Venue-Routed Mainnet Execution Spec

Date: 2026-04-01
Owner: Codex
Status: completed

## Outcome

`XSL-014A` is complete and now frozen as the canonical venue-routed execution dependency for later caller and proof lanes.

The closeout artifact is [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md).

## Goal

Freeze the completed `XSL-014A` execution contract so later work reuses it instead of reopening venue discovery, quoteability, or adapter-completion work.

## Non-goals

This frozen spec does not:
1. reopen `1inch` quoteability or adapter work,
2. claim hosted or session-backed signer proof is already closed,
3. claim provider-triggered or `CRE` end-to-end execution is already closed,
4. widen into frontend implementation or runtime behavior changes.

## Current Live Truth

1. the repo now owns a venue-routed execution request and leg contract that persists exact per-leg route truth across `CoW` and `1inch Fusion`,
2. the remaining blocker is not `1inch` quoteability; it is the missing caller and handoff layer plus the missing real signer-backed submission proof,
3. `XSTOCKS_PRIVY_ACCESS_TOKEN` is a live proof-runner session input, not app-level Privy config,
4. provider staging and canonical frontend callers still do not create or advance execution requests against this contract,
5. full `CRE` end-to-end execution remains unproven until provider staging can create execution requests and a real signer-backed submission proof exists.

## Completion Reconciliation

1. completion relative to spec = complete as a backend substrate tranche.
2. completion relative to repeated thread asks = complete for the venue-routed execution contract, but not for downstream caller or proof lanes.
3. completion relative to prior implementation claims = stale framing that `XSL-014A` was still open is now false.
4. verified implementation and proof status = venue-routed request contract complete; 1inch quote, approval payload, signed-submission attempt surface, and venue-status persistence exist; live session-backed signer proof remains separate.
5. canonical frontend functioning status = not owned by this lane.

## Canonical Dependency Contract

All downstream lanes must reuse the contract frozen by [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md):
1. `ExecutionRequest`
2. `ExecutionRequestLeg`
3. `runtimeOwner`
4. `triggerSource`
5. `leg.requiredRouteId`
6. `leg.adapterId`
7. `leg.quote`
8. `leg.approval`
9. `leg.venueStatus`
10. `leg.receipt`

Consumer-lane contract rules:
1. `XSL-018B` must create or advance requests using the same contract, typically with `triggerSource = "provider_staging"` and `runtimeOwner = "operator_manual"` until later proof changes that truth.
2. `XSL-018A` must expose `Execute all` on top of the same contract, typically with `triggerSource = "execute_all"` and explicit operator action.
3. `XSL-014` owns the remaining live session and signer proof; it must not reopen substrate or adapter completion work.

## Operator Proof Input Contract

`XSTOCKS_PRIVY_ACCESS_TOKEN` is the exact live operator proof input for the remaining signer-backed proof boundary:
1. it is a current Privy user-session access token,
2. it is supplied to proof runners and expires as session material,
3. it is not the same thing as backend Privy verification config,
4. it must not be documented as a static infra secret.

Separate backend verification config remains:
1. `PRIVY_APP_ID` or `NEXT_PUBLIC_PRIVY_APP_ID`
2. `PRIVY_APP_SECRET`
3. `PRIVY_JWKS_URL`
4. optional `PRIVY_API_BASE_URL`

## Remaining Work Moved Out Of This Lane

1. `XSL-018B` owns the immediate next backend lane: provider review must create or advance execution requests into this completed contract.
2. `XSL-018A` owns the canonical right-rail event and `Execute all` control surface on top of this same contract.
3. `XSL-014` owns the hosted or session-backed signer proof lane and the exact separation between backend verification config and live proof input.
4. no automation claim should be made until those downstream lanes are proven on top of this contract.

## Proof Artifacts

Canonical closeout and blocker artifacts:
1. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
2. [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T21-16-45.343Z/summary.json)

## Exit Criteria

`XSL-014A` exit criteria are already met:
1. execution requests are venue-routed rather than `CoW`-only,
2. `1inch` is integrated beyond quote-only truth,
3. the lane stops at one exact authenticated proof blocker instead of overclaiming submission,
4. downstream caller and proof work is explicitly moved out rather than silently implied.

## Decision Log

- 2026-04-01: Freeze `XSL-014A` as completed after the substrate closeout.
- 2026-04-01: Treat caller or handoff work plus live signer proof as the remaining blockers, not venue quoteability.
