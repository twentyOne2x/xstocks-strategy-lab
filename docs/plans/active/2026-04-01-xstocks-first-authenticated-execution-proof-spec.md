# xStocks First Authenticated Execution Proof Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Close the first truthful activation lane from homepage through user-approved CoW execution on Ethereum by:
1. upgrading `/` into a real homepage,
2. replacing stubbed Privy connect with real frontend truth,
3. verifying authenticated Privy sessions on the backend,
4. requiring a real EIP-712 user signature for CoW submission,
5. and adding enough operator visibility that the lane can be called deployable only when the proof exists.

## Non-goals

This workstream does not:
1. reopen 1inch, Bridge, CRE, or issuer lanes,
2. fake funded or activation-ready states,
3. count endpoint-only checks as live execution proof,
4. authorize autonomous execution or hidden custody,
5. treat a tiny intermediary landing card as acceptable homepage closure.

## Current Live Truth

1. `https://equityterminal.app/` is live and reflects the latest deploy.
2. the current landing is cleaner than before, but still too small and too much like an onboarding entry card.
3. [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx) mounts Privy when `NEXT_PUBLIC_PRIVY_APP_ID` exists.
4. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) now calls real Privy hooks and tracks the authenticated `wallet_connected` funnel stage.
5. the served activation and terminal surfaces are still not fully truth-aligned: production API responses stay preview-only or manual at the current boundary while several served components still imply `Chainlink CRE` or `Status live`.
6. [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) already has CoW quote, approval, signed submission, venue-status, and receipt logic.
7. [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js) now performs Privy JWT or JWKS verification, linked-account parsing, and authenticated owner binding.
8. `/ops/xstocks` and `/api/reporting/xstocks` now exist as partial operator visibility surfaces, but hosted token configuration is still missing and no signed execution proof is visible there yet.

## Current Local Implementation Audit

### Shipped

1. live landing deploy and Equity Terminal icon.
2. frontend onboarding and activation routes.
3. real Privy frontend connect code.
4. backend Privy auth verification and authenticated owner binding.
5. CoW adapter and API submission boundary.
6. smart-account and funding readiness contracts.

### Partial

1. homepage quality.
2. served activation truth alignment.
3. production visibility for the activation lane.

### Spec-only or unproven

1. real EIP-712 user signature in the live flow.
2. first live user-approved CoW proof.
3. production alerting/visibility sufficient to call the lane prod-worthy.
4. browser screenshot proof for the hosted homepage and activation surfaces.
5. served-copy parity with the production activation truth boundary.

## Completion Reconciliation

1. completion relative to spec = partial.
2. completion relative to repeated thread asks = partial.
3. completion relative to prior implementation claims = no longer missing frontend connect or backend auth, but still overclaimed if interpreted as an end-to-end live execution closure.
4. verified implementation and proof status = hosted landing deploy is real; frontend connect is real; backend auth verification is real; the repo now carries one hosted linked-wallet activation plus partial CoW quote-boundary proof bundle; no real signed submission proof exists yet.
5. canonical frontend functioning status = partial and not yet truthful enough for production closure because the served UI still outruns the current production API on live or automation copy.

## 2026-04-01 Final Reconciliation Update

This section supersedes stale planning-tranche assumptions elsewhere in this doc.

Exact proofs reached:
1. `pnpm --dir apps/web check`, `pnpm --dir apps/api check`, `pnpm --dir packages/policy check`, `pnpm --dir packages/shared check`, and `pnpm --dir packages/xstocks check` all passed.
2. the repo now carries a hosted proof bundle under [tmp/proof/2026-04-01T17-25-58.460Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T17-25-58.460Z), while rerunning `node apps/api/scripts/privy-cow-proof.js` in a shell without `XSTOCKS_PRIVY_ACCESS_TOKEN` still fails closed before it can reproduce that hosted run.
3. Production `GET /api/public-agent-handoff` returns `stay_public_preview`, `surfaceTruth: preview`, `executionState: wallet_required`, and `executionEligibility: preview_only`.
4. A clean local API instance on `PORT=3011` confirms rebalance orchestration stays `preview_only`, `runtimeOwner: operator_manual`, and `providerTriggeredProven: false`.
5. Hosted quote-boundary proof plus the bounded live quote sweep show no all-leg executable floor through `25`, `50`, `100`, `250`, or `500` USD gross; the current promoted basket is structurally incompatible with present CoW venue truth across five core legs in the tested band.

Still open:
1. no truthful signed-submission path exists for the current promoted basket because five core legs remain structurally blocked on present CoW venue truth across the tested `25` to `500` USD gross band,
2. served frontend copy parity with the current production activation and automation truth,
3. browser-proof closure for the hosted homepage and activation journey,
4. hosted operator visibility configuration beyond token-missing fail-closed screens.

## Codebase Fit And Iteration-Speed Contract

codebase fit = extend existing plus extract one shared auth surface.

existing logic to reuse:
1. [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx)
2. [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx)
3. [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js)
4. [packages/shared/src/contracts/execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts)
5. [packages/policy/src/smart-account.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/smart-account.js)

new entrypoints required = yes.

Why:
1. backend auth verification should not be bolted directly into the existing giant API service without a dedicated verification surface,
2. dashboard/alert visibility for execution truth may need a narrow new surface rather than ad hoc logging.

structural refactor assessment = same-tranche beneficial.

iteration-speed hotspots assessed:
1. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) should be split from fake state into a real provider-bound component now.
2. [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) is a hotspot and should gain an auth helper/module rather than absorbing all new logic inline.
3. [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx) can stay intact for this tranche if state derivation remains readable.

build/deploy fan-out assessment:
1. homepage and activation work stays in `apps/web` and should not drag backend/provider logic client-side.
2. Privy verification and execution ownership should stay in `apps/api` and shared contracts so Vercel deploy fan-out stays narrow.
3. Railway and Vercel proof should be tracked separately; local green cannot substitute for hosted proof.

intended file/package boundaries:
1. `apps/web/**` for homepage and activation UX truth,
2. `apps/api/**` for auth verification and execution ownership,
3. `packages/shared/**` and `packages/policy/**` for durable execution/auth state contracts,
4. `packages/xstocks/**` only if CoW adapter boundaries need small supporting changes.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: reuse and update through execution.
   - Why: homepage and activation UX still belong to the frontend lane.
2. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: CoW and Privy remain the chosen stack.
3. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: high.
   - Decision: narrow and supersede for this lane.
   - Why: that doc closes demo/browser truth broadly; this doc owns authenticated execution proof specifically.

## Symptom Contract

Observed problem:
1. hosted landing quality is still underpowered,
2. Privy looks present in code but is not real in the click path,
3. backend CoW rails look strong in code but still do not prove real authenticated execution,
4. and the lane still lacks the ops proof required for a truthful prod claim.

Likely culprit:
1. frontend and backend closure were split across separate threads and stopped at the last partial boundary.

Non-obvious alternatives:
1. the homepage problem could be independent from execution proof and should stay in a separate thread,
2. partner reporting might need to land before real execution proof is worth doing,
3. Hermes testing might reveal that frontend truth is good enough and auth is the only real blocker.

Falsifiers:
1. if a real Privy session and signed CoW order can be proven immediately after frontend connect lands, the remaining gap collapses mostly to visibility,
2. if frontend balance/funding truth cannot be derived without backend changes, frontend-only closure was too optimistic,
3. if operator visibility already exists through Railway/Vercel and repo-hosted dashboards, the ops gap shrinks.

## Product Outcome Contract

When this workstream is done enough for first truthful production closure:
1. `/` reads like a real homepage,
2. activation shows real connected-state truth,
3. the backend knows which authenticated user owns the execution request,
4. CoW submission requires a real user signature,
5. status and failures remain visible until confirmed or blocked.

## User-Journey Contract

1. user lands on homepage,
2. understands the product before onboarding begins,
3. qualifies into a portfolio,
4. reaches activation,
5. connects a wallet or embedded wallet through Privy,
6. sees whether funding is still required,
7. reviews the CoW order,
8. signs explicitly,
9. and sees submission plus confirmation state tracked honestly.

## State-And-Truth Contract

Frontend state machine must be:
1. `disconnected`
2. `connected`
3. `funding_required`
4. `ready_to_activate` only when backed by a real signal

Backend execution truth must be:
1. `requested`
2. `quote_ready`
3. `awaiting_approval`
4. `submitted`
5. `confirmed`
6. `failed`

Disallowed:
1. fake `connected`,
2. fake `funded`,
3. fake `ready_to_activate`,
4. fake execution success,
5. prod-worthy claims without visibility.

## Critical Assumptions And Invalidators

### Assumptions

1. the current chosen wallet stack remains Privy.
2. the current chosen live execution rail remains CoW.
3. a small real treasury-funded or user-funded test can be approved for proof.
4. Railway and Vercel remain the current deploy targets.

### Invalidators

1. Privy backend verification requires infra or secrets not actually available at runtime.
2. CoW live submission still cannot proceed after frontend connect because funding or signer ownership is missing.
3. homepage redesign grows into a larger brand/product rethink.
4. observability needs a separate service before any truthful prod closure claim can be made.

## Proof Artifacts

Required artifacts:
1. desktop and mobile homepage screenshots.
2. activation screenshots before and after wallet connect.
3. build/test outputs for `apps/web`, `apps/api`, and the affected packages.
4. one authenticated session verification proof.
5. one live CoW order proof bundle:
   - quote id,
   - order uid if submitted,
   - tx hash if available,
   - exact blocker if not.
6. one operator visibility proof surface for the execution.

## Verification Commands

Minimum verification surface:
1. `pnpm --dir apps/web check`
2. `pnpm --dir apps/api check`
3. `pnpm --dir packages/policy check`
4. `pnpm --dir packages/shared check`
5. `pnpm --dir packages/xstocks check`
6. browser route proof for `/`, `/onboarding`, and `/activate/ai-infra-autopilot`
7. one real authenticated execution probe against the current hosted or candidate backend

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Homepage quality | live but too intermediary | accepted large-form homepage | screenshots plus live verification |
| Frontend Privy connect | stubbed | real click path | browser proof |
| Backend Privy verification | absent | verified | tests and request proof |
| Signed CoW execution | absent | one truthful submission or exact blocker | proof bundle |
| Operator visibility | absent/unproven | enough for truthful prod claim | dashboard/log/alert proof |

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - package/app checks and local browser proof.
2. deployed-host verified
   - candidate or preview proof of homepage, activation, auth, and execution boundaries.
3. production-host verified
   - live homepage quality, live frontend connect, live backend auth, and one real production-lane CoW proof.
4. still unproven
   - anything lacking hosted proof artifacts.

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Homepage quality | 15 | 6 | hosted deploy exists, design still underpowered |
| Frontend connect truth | 20 | 4 | provider exists, connect flow not real |
| Backend auth truth | 20 | 0 | no Privy verification found |
| CoW signed execution proof | 30 | 12 | code boundary exists, no real signed proof |
| Ops visibility | 15 | 0 | no verified alert/dashboard proof |
| Total | 100 | 22 | not production-closure ready |

## Economic-Budget Contract

1. live testing should use the smallest meaningful notional.
2. each treasury-funded or user-funded proof must be explicitly approved and logged.
3. repeated churn just to inflate execution count is disallowed.
4. if no budget is approved, stop at the last truthful non-funded boundary.

## Data, Privacy, And Retention Contract

1. Privy auth artifacts must be treated as sensitive.
2. wallet addresses and partner-visible user metrics should default to pseudonymous presentation unless a stronger sharing agreement exists.
3. logs and dashboard surfaces must not leak secrets or raw provider tokens.

## Owners And Decision-Rights Contract

1. frontend owner: homepage and activation UX.
2. backend owner: auth verification, execution ownership, CoW submission.
3. ops owner: alerts, logs, dashboard visibility.
4. product owner: approval of real funded test volume.

## Exit Criteria

This workstream is complete enough only when:
1. homepage quality is accepted,
2. frontend connect is real,
3. backend auth is real,
4. one truthful signed CoW proof exists or the last remaining blocker is exact and external,
5. operator visibility is present enough to support a truthful prod claim.

## Continuation Update

Date: 2026-04-01

### Scope Freeze

1. continue only in `apps/api`, `packages/shared`, `packages/policy`, `packages/xstocks`, and `apps/worker` only if runtime truth strictly requires it.
2. do not touch `apps/web`.
3. do not reopen homepage/frontend work, auth verification, or any 1inch, Bridge, CRE, Chainlink, issuer, or Hermes lanes unless quoteability work proves a direct remaining mismatch in this lane.

### Current Verified Starting Point

1. backend Privy auth verification exists and is real.
2. authenticated owner binding exists and is real.
3. readiness for the current Ethereum basket CoW lane was aligned away from the stale promoted-manifest `minFundingUsd: 1000` and mandatory smart-account default.
4. activation can now reach `ready`.
5. execution request creation works.
6. live CoW quote attempts reach the real external venue boundary.
7. no real user-approved signed CoW submission, `orderUid`, or `txHash` exists yet.

### Resolved Routing Finding

1. the current execution leg builder uses the generic Ethereum `deployment.address` as the CoW buy token.
2. the xStocks execution-route surface also exposes `wrapperAddress` for the verified Ethereum rail.
3. live probing against CoW now shows NVDAx at the promoted basket's current `$4.50` leg fails with `NoLiquidity` when quoted against `deployment.address`, while the corresponding `wrapperAddress` returns a live quote at the same size.
4. that mismatch blocked earlier classification until route-correct token selection was applied and every actionable leg was rechecked; production-host probing now confirms wrapper-correct selection is in place, so it is no longer the current blocker for this lane.

### Immediate Execution Contract

1. patch the backend to select the route-correct CoW buy token surface and persist exact quote diagnostics fail-closed.
2. rerun the authenticated proof with the existing Privy session if still available on this machine.
3. push only to the furthest truthful boundary reached after that rerun.
4. submit only if auth, ownership, funding, quoteability, and explicit user signature all truly hold.

### Hosted Proof Result

1. production-host probing against `https://api-production-e70b.up.railway.app` confirms the current live basket lane is wrapper-correct for CoW token selection: `NVDAx` reaches `awaiting_approval` at the promoted basket's minimal `$25` proof notional.
2. the authenticated linked-wallet proof saved activation `act_88d4997e-aa80-42a3-8580-8af877fcb3e7` and created execution request `execreq_1196c5af-f577-4428-a355-4e67b793b7da`.
3. the current promoted basket is still not all-leg quoteable at `$25`: `1/6` core legs reached `awaiting_approval`, `5/6` core legs failed with exact venue blockers, and the `AUSD` yield-buffer leg remained deferred by design.
4. exact core-leg venue blockers from the hosted run are `MSFTx: 404 NoLiquidity`, `METAx: 404 NoLiquidity`, `AMZNx: 404 NoLiquidity`, `AAPLx: 500 InternalServerError`, and `GOOGLx: 500 InternalServerError`.
5. because the basket is not all-leg quoteable, the truthful stop point remains before signed submission. No `orderUid`, receipt, or `txHash` exists, and no autonomous submission was attempted.
6. proof artifacts, including activation save, execution create, quoteability, approval boundary, submission boundary, receipt/blocker, runtime-store, and execution-request captures, live under [tmp/proof/2026-04-01T17-25-58.460Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T17-25-58.460Z).
7. the strongest truthful production claim for this lane is: hosted linked-wallet activation and partial CoW quote boundary are proven at `$25`, but the promoted basket is not all-leg quoteable, so full user-approved submission remains unproven and correctly blocked at the external venue boundary.
8. the remaining repo-local failures are no longer a blocker for this lane: the targeted API and policy verification suites now pass against the current linked-wallet-first, smart-account-not-required basket truth.
9. failed CoW quote legs now persist structured venue diagnostics in `venueStatus.rawStatus`, including `errorStatusCode`, `errorType`, `errorDescription`, `errorBody`, and a truthful `blockerClass`, so future proof bundles do not collapse venue-returned `NoLiquidity` and `InternalServerError` responses into one opaque string-only class.
10. direct public CoW quote probes on 2026-04-01 still return `500 InternalServerError` with an empty description for the affected 500-class legs, so there is no repo-local basis to reclassify those blockers beyond the venue-returned `InternalServerError` shell without a new upstream venue change.

### Quote-Only Sweep Result

1. reusing [privy-cow-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/privy-cow-proof.js) in `quote_sweep` mode against the current promoted basket produced a repo-local live-venue proof bundle under [tmp/proof/2026-04-01T18-54-21.188Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T18-54-21.188Z).
2. the bounded ladder was exactly `25`, `50`, `100`, `250`, and `500` USD gross, and no signing or submission path was enabled during the sweep.
3. no all-leg quoteable rung was observed, so `minimumExecutableGrossNotionalUsd = null` within the tested band.
4. `NVDAx` remained `awaiting_approval` at every rung, which means the basket failure is not caused by dust-sized notionals alone.
5. `MSFTx`, `AAPLx`, `METAx`, `AMZNx`, and `GOOGLx` were blocked at every rung. The low rungs surfaced a mix of venue-returned `InternalServerError` and `NoLiquidity`, but by `100`, `250`, and `500` USD gross all five persistently blocked core assets converged to exact `blockerClass=cow_no_liquidity` with venue `errorType=NoLiquidity`.
6. because the same five core assets remain unquoteable after the sweep reaches materially larger per-leg notionals, the current promoted basket is structurally incompatible with present CoW venue truth in the tested `25` to `500` USD gross band rather than merely dust-sized at the minimal proof rung.
7. a direct standalone USDC -> xStock scan against the full repo-owned Ethereum xStocks universe tightened the exact venue boundary further: only `NVDAx`, `TSLAx`, and `SPYx` quote across the tested `15, 25, 50, 100, 250, 500, 1000, 2500, 5000` USD ladder, while `AAPLx`, `AMDx`, `AMZNx`, `AVGOx`, `GOOGLx`, `METAx`, `MSFTx`, and `ORCLx` never quote directly and settle to exact `blockerClass=cow_no_liquidity`.
8. no product-usable CoW-only onboarding basket exists under that universe truth. The direct quoteable set is only three xStocks, below the research minimum `holdings_count=4`, and the only fully intact repo basket is benchmark-only `sp500_core` / `SPYx`.
9. no new policy or API floor guard was added from this result. The sweep did not discover a lower-bound executable floor to encode; it discovered current structural incompatibility for five core legs, so the truthful fail-closed boundary remains the live quote step rather than a newly hardcoded minimum.
