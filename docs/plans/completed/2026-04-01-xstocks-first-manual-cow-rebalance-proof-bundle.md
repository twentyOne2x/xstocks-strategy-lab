# xStocks First Manual CoW Rebalance Proof Bundle

Date: 2026-04-01
Owner: Codex
Status: completed
Canonical issue: `XSL-011C` under `XSL-011`

## Outcome

Completed as a bounded live-proof tranche. The repo now has one truthful proof bundle showing a promoted-manifest drift path into operator review, authenticated activation creation, execution-request staging, and a real CoW quote attempt on the existing Ethereum rail. The run stopped fail closed before submission because the second core leg, `MSFTx`, returned `NoLiquidity` from CoW at the smallest safe `$25` gross ticket.

## Objective

Produce the first truthful proof bundle for a manual/operator xstocks rebalance run on the existing CoW rail by:
1. seeding one historical activation baseline,
2. opening one scheduled-to-manual rebalance candidate,
3. creating one authenticated activation and execution request,
4. attempting live CoW quotes in sequence,
5. and stopping at the first exact blocker without claiming autonomous or Chainlink-triggered execution.

## Non-goals

This tranche does not:
1. claim autonomous execution,
2. claim Chainlink, CRE, or provider-triggered proof,
3. fabricate a signature or a live submission,
4. widen into frontend or product-marketing work,
5. or bypass operator or user approval.

## User-Stated Desired Outcome

Capture one repo-owned proof bundle for the existing manual/operator rebalance lane, identify the smallest truthful candidate path, record the exact boundary reached on CoW, and prove the exact blocker if the run still stops short of submission or settlement.

## Constraints And Non-Negotiables

1. Keep scope in `apps/api`, `apps/worker` only as needed for proof/runtime orchestration, `packages/policy`, and `packages/shared`.
2. Do not reopen Chainlink/CRE implementation work.
3. Do not claim live proof beyond the exact boundary reached.
4. Keep everything fail closed and operator-approved or user-approved.
5. Preserve the existing CoW rail as the only execution venue used here.

## Proof Contract

### Local-only surfaces

Local-only in this tranche:
1. the repo-owned JWKS/auth harness used because no live Privy env was present in the shell,
2. the seeded historical activation baseline,
3. the runtime-store snapshot written under the proof artifact directory.

### Live surfaces

Live in this tranche:
1. the xStocks boundary load used to derive the current promoted manifest readiness,
2. the API-side activation and execution-request path,
3. the CoW quote attempt that returned real venue quote data for `NVDAx`,
4. and the CoW venue failure returned for `MSFTx`.

### Production proof still missing

Production proof for this lane still requires:
1. a live Privy-backed user session instead of the repo-owned JWKS harness,
2. a real user-approved EIP-712 signature,
3. a successful CoW submission,
4. and a confirmed onchain receipt.

## Commands Run

1. `node --input-type=module -e 'import("./apps/worker/src/manual-rebalance-proof.js").then(() => console.log("manual-rebalance-proof:ok"))'`
2. `node --input-type=module -e 'import {runManualRebalanceProof} from "./apps/worker/src/manual-rebalance-proof.js"; for (const n of [25,26,30,40,50,75,100,250,500,1000]) { const dir=\`./tmp/proof-probe-\${n}\`; try { const s = await runManualRebalanceProof({ requestedNotionalUsd:n, artifactDir:dir }); console.log(JSON.stringify({n, blocker:s.blocker, boundaries:s.boundaries, quoteIds:s.liveProof.quoteIds}, null, 2)); } catch (error) { console.log(JSON.stringify({n, fatal:error.message}, null, 2)); } }'`
3. `node --input-type=module -e 'import {runManualRebalanceProof} from "./apps/worker/src/manual-rebalance-proof.js"; for (const n of [25,30,50,100,250,500,1000]) { const dir=\`./tmp/proof-probe-\${n}\`; try { const s = await runManualRebalanceProof({ requestedNotionalUsd:n, artifactDir:dir }); console.log(JSON.stringify({n, blocker:s.blocker, boundaries:s.boundaries, executionRequestState:s.executionPrerequisites?.quoteability?.latestExecutionRequestState ?? null, quoteIds:s.liveProof.quoteIds}, null, 2)); } catch (error) { console.log(JSON.stringify({n, fatal:error.message}, null, 2)); } }'`
4. `node apps/worker/src/manual-rebalance-proof.js --notional 25 --artifact-dir ./tmp/proof/manual-rebalance-live-25`
5. `find ./tmp/proof/manual-rebalance-live-25 -maxdepth 1 -type f | sort`
6. `node --test apps/worker/src/__tests__/rebalance-orchestrator.test.js`
7. `node --test --test-name-pattern "workspace and activity surfaces expose a recommended rebalance when the slot baseline trails the promoted manifest|workspace and activity surfaces expose scheduled worker-owned review without claiming autonomous execution|authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet|execution quote, approval, submission, and receipt actions persist live CoW truth|execution quote failures persist exact CoW request diagnostics instead of a generic blocker|execution submission fails closed when no user signature is supplied" apps/api/test/api.test.js`
8. `node --test packages/policy/test/policy.test.js`

## Exact Result

### Candidate path

1. Baseline activation manifest: `onboarding.default_basket:basket-baseline-v1:promoted`
2. Target promoted manifest: `onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`
3. Scheduled rebalance state: `scheduled`
4. Manual review state: `awaiting_operator`
5. Current activation id: `act_fbe91daa-ae11-4fe8-859d-702b5a2ef926`
6. Execution request id: `execreq_818f19cf-2014-4836-bd3e-cac0ac0a493b`

### Execution prerequisites proved

1. Activation baseline existed and was `ready` / `executable`.
2. Rebalance drift existed and the worker review path opened `scheduled`, then `awaiting_operator`.
3. Auth ownership boundary was real but local-only: the proof used the repo-owned `local_jwks_harness` because no live Privy env was present.
4. The current activation remained `ready`, `surfaceTruth: live`, and `executionEligibility: executable`.
5. Quoteability was partial, not complete: the execution request reached one quoted `awaiting_approval` leg, one blocked leg, four remaining pending legs, and one deferred leg.

### Boundaries reached

1. Review opened: yes
2. Execution request created: yes
3. Quote ready: yes
4. Awaiting approval: yes, for `act_fbe91daa-ae11-4fe8-859d-702b5a2ef926:leg:1`
5. Signed submission: no
6. Receipt / settlement: no

### Live identifiers

1. Quote id: `1126519095`
2. Awaiting-approval leg: `act_fbe91daa-ae11-4fe8-859d-702b5a2ef926:leg:1`
3. Order uid: none
4. Tx hash: none
5. Receipt: none

### Exact blocker

1. Blocker code: `blocked_execution_leg`
2. Leg id: `act_fbe91daa-ae11-4fe8-859d-702b5a2ef926:leg:2`
3. Asset: `MSFTx`
4. CoW failure: `404 {"errorType":"NoLiquidity","description":"no route found"}`
5. Quote payload context:
   - `buyToken=0x63ad27614231767c8c489745b9145272de50d09b`
   - `sellToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
   - `sellAmountBeforeFee=4110000`
   - `targetNotionalUsd=4.11`
   - `receiver=0x2222222222222222222222222222222222222222`

## Artifact Bundle

Artifact directory: `tmp/proof/manual-rebalance-live-25`

Files captured:
1. `activation-current.json`
2. `activity-candidate.json`
3. `baseline-activation.json`
4. `candidate-manifests.json`
5. `env-audit.json`
6. `execution-prerequisites.json`
7. `execution-request-created.json`
8. `execution-request-latest.json`
9. `quote-attempts.json`
10. `rebalance-awaiting-operator.json`
11. `rebalance-scheduled.json`
12. `runtime-store.json`
13. `submission-response.json`
14. `summary.json`
15. `summary.md`
16. `workspace-candidate.json`

## Verification Results

1. `node --test apps/worker/src/__tests__/rebalance-orchestrator.test.js` passed with 4/4 tests.
2. `node --test --test-name-pattern "workspace and activity surfaces expose a recommended rebalance when the slot baseline trails the promoted manifest|workspace and activity surfaces expose scheduled worker-owned review without claiming autonomous execution|authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet|execution quote, approval, submission, and receipt actions persist live CoW truth|execution quote failures persist exact CoW request diagnostics instead of a generic blocker|execution submission fails closed when no user signature is supplied" apps/api/test/api.test.js` passed with 6 targeted tests.
3. `node --test packages/policy/test/policy.test.js` passed with 21/21 tests.

## Decision Log

- 2026-04-01: Use the smallest candidate notional that still reaches a real CoW boundary instead of defaulting to a larger ticket.
- 2026-04-01: Keep the proof bounded to live quote and approval staging because no live user signature or live Privy env was available.
- 2026-04-01: Treat partial quoteability as truthful proof only when the exact blocked leg and venue response are preserved in the artifact bundle.

## Progress Log

- 2026-04-01T16:20:00+00:00: Initial proof-runner import failed because it referenced a non-exported policy helper; the runner was corrected to derive prerequisites locally.
- 2026-04-01T16:30:00+00:00: Initial auth probes failed closed because the local token clock could drift into the future; the runner clock was corrected to start from current wall time minus one minute.
- 2026-04-01T16:35:00+00:00: Notional sweep showed the first truthful boundary already appears at `$25`, and higher notionals up to `$1000` still blocked first on `MSFTx`.
- 2026-04-01T16:44:00+00:00: Final proof run at `$25` captured one live CoW quote and one exact `MSFTx` no-liquidity blocker under `tmp/proof/manual-rebalance-live-25`.
