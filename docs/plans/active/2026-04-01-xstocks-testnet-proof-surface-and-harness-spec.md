# xStocks Testnet Proof Surface And Harness Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Create one cheap, repeatable, repo-owned testnet proving ground for xStocks-related product wiring by:
1. inventorying which chains, venues, and proof surfaces are actually usable on testnet,
2. freezing one faucet-funded wallet path,
3. proving authenticated owner binding, signatures, submission boundaries, receipts, and provider-triggered review wherever testnet support truly exists,
4. and keeping testnet protocol-wiring proof explicitly separate from mainnet xStocks issuer, liquidity, and real-money execution truth.

## Non-goals

This workstream does not:
1. treat testnet success as proof of mainnet xStocks tradability or liquidity,
2. imply that Backed issuer surfaces, xStocks issuance, or secondary-market liquidity exist on testnet unless directly proven,
3. replace the existing mainnet proof lanes in `XSL-005`, `XSL-011B`, `XSL-014`, or `XSL-016`,
4. widen into frontend redesign, on-ramp work, or public-surface copy work unless a tiny proof-helper surface is truly required,
5. authorize autonomous execution or hidden custody on any network.

## User-Stated Desired Outcome

The user wants a new vertical for "testnet everything" and can source ETH from an Ink Sepolia faucet.

That translates into one execution-grade lane that answers:
1. what can be proven cheaply on testnet,
2. what exact chain should be used,
3. what still must stay mainnet-only,
4. and what repeatable commands or proof artifacts should exist so testnet runs are not ad hoc.

## Current Live Truth

1. Mainnet proof lanes now distinguish auth and state-transition truth from venue-liquidity truth.
2. `XSL-011B` is materially proven on production: the deployed provider-review ingress accepts signed events and opens `awaiting_operator` only, but it remains review-only.
3. Current mainnet CoW truth is narrow: only a small subset of Ethereum xStocks quote directly, so CoW does not currently close the promoted basket.
4. Current mainnet 1inch Fusion truth is stronger: `NVDAx`, `AAPLx`, `MSFTx`, `METAx`, `AMZNx`, `GOOGLx`, `TSLAx`, `SPYx`, `AVGOx`, and `ORCLx` quote at `$20+`; `AMDx` remained blocked in the tested band.
5. The repo already owns proof-script patterns in `apps/api/scripts/**` for live venue probing and authenticated execution-boundary capture, but no dedicated testnet harness exists.
6. The repo already owns authenticated owner binding, provider-triggered review ingress, and runtime-store receipt persistence on the backend.
7. The user can source testnet gas on Ink Sepolia, but the repo does not yet know whether Ink Sepolia is the canonical chain for any meaningful xStocks, venue, or provider proof beyond funding and generic wallet state.
8. No existing owner doc freezes what testnet can close and what testnet must never be allowed to overclaim.

## Current Local Implementation Audit

### Shipped

1. Mainnet proof runners for CoW and 1inch under `apps/api/scripts/**`.
2. Real backend auth and owner-binding logic in `apps/api/**`.
3. Real review-only provider ingress with accepted and rejected receipts.
4. Shared and policy contracts for execution, rebalance, and runtime truth.

### Partial

1. Chain references to Ink and xChange exist in the execution/funding planning surface, but they are not yet an execution-grade testnet runbook.
2. The codebase can already produce proof bundles, but no canonical testnet artifact contract exists.
3. Hermes and internal proof surfaces can exercise auth and readiness, but not yet through a dedicated testnet lane.

### Spec-only Or Unproven

1. Which exact chain should own testnet proof: Ink Sepolia, Ethereum Sepolia, or another supported testnet.
2. Whether 1inch, CoW, or both expose meaningful testnet execution surfaces for the relevant assets.
3. Whether any real xStocks or acceptable synthetic test assets exist on the chosen testnet chain.
4. One faucet-funded wallet proof bundle.
5. One repeatable testnet submission or exact unsupported-surface artifact.

## Completion Reconciliation

1. completion relative to spec = planning-only.
2. completion relative to repeated thread asks = partial, because the user now has a dedicated owner lane but no canonical chain decision, funded testnet proof, or supported-surface matrix yet.
3. completion relative to prior implementation claims = there were no earlier repo-tracked implementation claims for this lane; testnet existed only as an implied fallback idea.
4. verified implementation and proof status = no dedicated testnet harness, runbook command, or proof bundle exists yet.
5. canonical frontend functioning status = not applicable; this lane is currently proof/runtime-owned rather than a canonical frontend surface.

## Why This Vertical Is Needed

Right now the repo is forced into an expensive or ambiguous choice:
1. test only on mainnet and pay for every proof iteration,
2. or reason informally about testnet without one owner lane.

That is not good enough anymore because:
1. mainnet venue truth is now nuanced rather than binary,
2. CRE/review ingress and wallet/auth flows can be derisked separately from venue liquidity,
3. and the project needs one explicit place where "testnet everything" is translated into a truthful scope rather than wishful shorthand.

## State-And-Truth Contract

Testnet proof is valuable only if it is classified correctly.

### Testnet can prove

1. faucet-funded wallet availability on the chosen testnet chain,
2. authenticated owner binding and session flow,
3. quote-request construction and signing payload shape on supported venues,
4. submission and receipt plumbing where a real testnet venue exists,
5. provider-triggered review ingress and runtime-state transitions where chain identity is part of the request truth,
6. operator or Hermes runbook ergonomics for cheap repeated testing.

### Testnet cannot prove

1. mainnet xStocks liquidity,
2. mainnet issuer or redemption truth,
3. real-money execution viability,
4. production provider provenance,
5. secondary-market availability of a mainnet xStock merely because a synthetic or test token exists.

### Required proof labels

Every artifact produced by this lane must be labeled as exactly one of:
1. `protocol_wiring_proof`,
2. `testnet_live_proof`,
3. `synthetic_test_asset_proof`,
4. `unsupported_surface_proof`,
5. `mainnet_only_residual`.

## Workstream Outcome Contract

When this lane is meaningfully closed enough to use:
1. the repo can say which testnet chain is canonical for cheap proof work,
2. the repo can fund a wallet on that chain from a faucet and capture the artifact,
3. the repo can rerun auth and execution-boundary proofs without spending mainnet funds wherever testnet support truly exists,
4. the repo can say exactly where testnet stops being representative,
5. and no one has to infer testnet truth from scattered chat messages or shell history.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: this remains the canonical mainnet rail and funding truth surface.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: reuse and keep separate.
   - Why: authenticated mainnet proof and testnet proof must not collapse into one claim set.
3. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: high.
   - Decision: reuse.
   - Why: provider-triggered review ingress can be derisked with cheap repeated probe traffic even if final provider provenance remains a production concern.
4. [2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-hermes-operator-and-agent-skill-spec.md)
   - Current relevance: medium.
   - Decision: reuse later.
   - Why: Hermes can consume this lane's cheaper proof surface once the testnet runbook exists.

Create new alongside:
1. a dedicated testnet owner lane is justified because none of the existing specs owns chain selection, faucet funding, testnet capability inventory, proof labeling, and the boundary between testnet and mainnet closure.

## Thread-Recurrence Audit

1. The user raised a new explicit vertical for "testnet everything" after multiple mainnet-only proof lanes had already diverged into:
   - mainnet auth and owner-binding truth,
   - venue-liquidity truth,
   - provider-review truth.
2. The repeated underlying problem is cost and ambiguity:
   - mainnet is too expensive or too final for every proof iteration,
   - but testnet has not been owned rigorously enough to say what it can actually prove.
3. A full priority matrix is not needed inside this lane because the problem is still one coherent workstream:
   - choose the canonical chain,
   - classify venue and asset support,
   - freeze one proof harness contract.

## Capability Inventory Contract

The first executor on this lane must not start by assuming Ink Sepolia is the right execution chain.

The lane must first inventory:
1. whether Privy-authenticated wallet flows can be exercised meaningfully on Ink Sepolia,
2. whether 1inch exposes any real supported testnet surface for the chosen asset class and chain,
3. whether CoW exposes any real supported testnet surface for the chosen chain,
4. whether xStocks or acceptable synthetic test assets exist on the chosen chain,
5. whether provider-triggered review events should carry `chain=ink_sepolia`, another supported testnet chain, or remain chain-agnostic for review-only proof,
6. whether Backed quote surfaces matter on testnet at all, or remain mainnet/reference-only,
7. which RPC, explorer, faucet, and operator inputs are required for repeated runs.

Required outcome of the inventory phase:
1. one canonical testnet chain,
2. one unsupported matrix for every rejected chain or venue,
3. one exact reason for each unsupported combination.

## Execution Plan

### Phase 1: Chain and venue audit

1. Inventory Ink Sepolia, Ethereum Sepolia, and any other repo-relevant testnet candidates.
2. Determine whether 1inch, CoW, or both have meaningful testnet support for the assets or synthetic substitutes needed.
3. Classify each chain or venue combination as:
   - `supported_for_live_testnet_proof`,
   - `supported_for_synthetic_proof_only`,
   - `unsupported`.

### Phase 2: Faucet-funded wallet and auth proof

1. Freeze one test wallet path.
2. Capture faucet funding on the canonical testnet chain.
3. Prove authenticated owner binding and wallet ownership against the backend.
4. Persist one proof bundle with the funded address, chain id, tx hash or faucet artifact, and authenticated boundary result.

### Phase 3: Testnet execution-boundary proof

1. If a real supported testnet venue and asset combination exists, capture:
   - quote,
   - approval or signature boundary,
   - submission attempt,
   - receipt or exact blocker.
2. If only a synthetic or protocol-wiring surface exists, capture:
   - request construction,
   - signature collection,
   - submission boundary,
   - receipt persistence,
   - and label it `synthetic_test_asset_proof`.
3. If no meaningful testnet execution surface exists, capture one explicit unsupported matrix and stop rather than faking proof.

### Phase 4: Provider-triggered review proof in testnet context

1. Reuse the existing review-only ingress.
2. Decide whether chain identity should be asserted as Ink Sepolia or a different testnet in the provider event.
3. Capture either:
   - one accepted testnet-context review event,
   - or one exact reason the provider path remains effectively mainnet-agnostic or unsupported on testnet.

### Phase 5: Repeatable runbook and artifact pack

1. Add one repo-owned proof runner or runbook for repeated testnet runs.
2. Persist proof bundles under `tmp/proof/testnet-<timestamp>/`.
3. Ensure the artifact pack includes:
   - inventory results,
   - faucet evidence,
   - auth evidence,
   - execution-boundary evidence,
   - provider-review evidence,
   - unsupported matrices,
   - and one concise summary.

## Proof Artifacts

Required artifacts for closure:
1. one chain and venue inventory table,
2. one canonical testnet-chain decision record,
3. one funded-wallet artifact from a faucet-supported chain,
4. one authenticated owner-binding artifact,
5. one testnet execution-boundary proof or unsupported matrix,
6. one provider-review proof artifact or exact chain-context blocker,
7. one summary file stating what testnet now proves and what remains mainnet-only.

## Verification Contract

This lane is not closed by code changes alone.

Minimum required verification after implementation:
1. `pnpm --filter @xstocks-strategy-lab/xstocks test`
2. `node --test apps/api/test/api.test.js`
3. one repo-owned testnet proof CLI or runbook command for the inventory phase,
4. one repo-owned testnet proof CLI or runbook command for funded auth proof,
5. one repo-owned testnet proof CLI or runbook command for execution-boundary proof,
6. one repo-owned testnet proof CLI or runbook command for provider-review proof if chain context matters.

The implementation tranche for this lane must introduce exact commands instead of leaving them implicit.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Candidate chains classified | 0 | all repo-relevant testnet candidates classified | inventory matrix |
| Venue support truth | ambiguous | per-chain 1inch / CoW support classified | supported/unsupported matrix |
| Faucet-funded wallet proof | none | one canonical funded wallet artifact | tx hash or faucet artifact |
| Authenticated owner proof | none | one authenticated owner-binding artifact on canonical testnet | proof bundle |
| Testnet execution-boundary proof | none | one truthful live or synthetic proof, or one exact unsupported matrix | proof bundle |
| Provider-review testnet-context proof | none | one accepted/rejected chain-context artifact or an exact irrelevance decision | proof bundle |

## Exit Criteria

This vertical counts as meaningfully closed only when all of the following are true:
1. the repo names one canonical testnet chain and explains why,
2. the repo can fund and prove one wallet on that chain from a faucet,
3. the repo can rerun an authenticated owner-binding proof on that chain,
4. the repo can either perform one truthful testnet execution-boundary run or prove exactly why no meaningful testnet execution surface exists,
5. the repo can state whether provider-review ingress meaningfully benefits from a testnet-context proof,
6. the repo labels every testnet artifact so no one mistakes it for mainnet closure,
7. the residual mainnet-only blockers are listed explicitly.

## Codebase Fit And Iteration-Speed Contract

codebase fit = extend existing proof-script and runtime-store surfaces, not create a second disconnected harness stack.

existing surfaces to reuse:
1. `apps/api/scripts/**` proof-runner pattern,
2. `apps/api/**` auth and runtime-store persistence surfaces,
3. `packages/xstocks/**` venue adapter surfaces,
4. `packages/policy/**` boundary and route truth surfaces.

hotspots to avoid widening unnecessarily:
1. `apps/api/src/services/api-service.js`
   - keep testnet proof logic out of the giant service unless a tiny shared helper is unavoidable.
2. `apps/web/**`
   - do not touch the frontend unless a tiny proof-only helper is truly required.

build/deploy fan-out rule:
1. prefer script/runbook additions over changing served production surfaces,
2. keep testnet support classification separate from mainnet deploy claims.

## Critical Assumptions And Invalidators

### Assumptions

1. the user can source faucet ETH on Ink Sepolia,
2. at least one repo-relevant venue or synthetic proof surface exists on some testnet chain,
3. testnet proof is valuable primarily for wiring, auth, signatures, and cheap repetition,
4. the repo can add one bounded proof script or runbook without redesigning the core product.

### Invalidators

1. no meaningful venue or synthetic proof surface exists on any relevant testnet chain,
2. Privy or provider review truth cannot be exercised meaningfully on the chosen testnet chain,
3. chain support differs so much across Privy, venue, and provider surfaces that one canonical testnet path cannot exist,
4. the only meaningful proofs remain mainnet-only, in which case this lane should shrink to a testnet unsupported matrix instead of pretending to be a full harness.

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - inventory scripts, proof helpers, and unsupported-surface classification.
2. testnet-host verified
   - faucet-funded wallet, authenticated owner binding, execution-boundary proof on a real supported testnet venue or an exactly labeled synthetic substitute, and any relevant provider-review proof.
3. production-host verified
   - unchanged from the existing mainnet lanes; no amount of testnet success closes production-host claims by itself.
4. still mainnet-only
   - xStocks issuer truth, mainnet venue liquidity, real-money execution, and the final external-provider provenance story.

## Rollback / Recovery

1. Remove any new testnet proof script, runbook, or config surface that introduces confusion without adding truthful proof value.
2. Revert any chain-specific testnet assumptions in docs if the inventory falsifies them.
3. Keep all mainnet owner lanes (`XSL-005`, `XSL-011B`, `XSL-014`, `XSL-016`) unchanged by default; this lane must not mutate their claim level accidentally.

## Decision Log

- 2026-04-01: Testnet is a new vertical, not a rewrite of existing mainnet proof lanes.
- 2026-04-01: The first implementation phase must be an inventory, not a chain guess based on faucet availability alone.
- 2026-04-01: Testnet success must never be allowed to overclaim mainnet xStocks issuer or venue-liquidity truth.

## Progress Log

- 2026-04-01T22:05:00+02:00: Opened `XSL-017` as a dedicated testnet proof lane in `docs/ISSUES.md` and created the first owner spec.
- 2026-04-01T22:40:00+02:00: Upgraded `XSL-017` to the execution-grade standard with completion reconciliation, measurement contract, codebase-fit contract, rollback/recovery, and decision/progress logging.

## First Executor Runbook

The first implementation pass for this lane should:
1. inventory candidate chains and venues before adding any new product code,
2. freeze one canonical testnet chain,
3. add one testnet proof runner in the existing `apps/api/scripts/**` pattern,
4. capture one faucet-funded auth proof,
5. capture one execution-boundary proof or unsupported matrix,
6. capture one provider-review proof or exact reason that chain context is irrelevant,
7. write the artifact summary before claiming the lane moved.
