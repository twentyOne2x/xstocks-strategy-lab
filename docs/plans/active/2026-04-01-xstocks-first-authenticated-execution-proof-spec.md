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
4. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) is still a stub and does not call real Privy hooks.
5. [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx) still hardcodes `next`/`locked` step state.
6. [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) already has CoW quote, approval, signed submission, venue-status, and receipt logic.
7. no Privy JWT/JWKS verification exists in `apps/api`.
8. there is no proven operator alerting/visibility layer for this activation lane yet.

## Current Local Implementation Audit

### Shipped

1. live landing deploy and Equity Terminal icon.
2. frontend onboarding and activation routes.
3. CoW adapter and API submission boundary.
4. smart-account and funding readiness contracts.

### Partial

1. homepage quality.
2. frontend Privy integration.
3. smart-account/funding state rendering.
4. production visibility for the activation lane.

### Spec-only or unproven

1. backend Privy auth verification.
2. real authenticated user session binding.
3. real EIP-712 user signature in the live flow.
4. first live user-approved CoW proof.
5. production alerting/visibility sufficient to call the lane prod-worthy.

## Completion Reconciliation

1. completion relative to spec = partial.
2. completion relative to repeated thread asks = partial.
3. completion relative to prior implementation claims = overclaimed if interpreted as end-to-end closure; accurate if constrained to backend CoW contract strength only.
4. verified implementation and proof status = hosted landing deploy is real; CoW contract/runtime work is real; frontend connect, backend auth, and live signed proof are not.
5. canonical frontend functioning status = partial and not yet truthful enough for production closure.

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
4. [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md)
   - Current relevance: very high.
   - Decision: create alongside and delegate the detailed Privy boundary.
   - Why: linked-wallet versus smart-wallet truth is now a distinct proof problem inside this broader execution lane.

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

### New Runtime Finding

1. the current execution leg builder uses the generic Ethereum `deployment.address` as the CoW buy token.
2. the xStocks execution-route surface also exposes `wrapperAddress` for the verified Ethereum rail.
3. live probing against CoW now shows NVDAx at the promoted basket's current `$4.50` leg fails with `NoLiquidity` when quoted against `deployment.address`, while the corresponding `wrapperAddress` returns a live quote at the same size.
4. because of that mismatch, the current proof lane cannot truthfully classify the entire `$25` promoted basket as structurally unquoteable until route-correct token selection is applied and every actionable leg is rechecked.

### Immediate Execution Contract

1. patch the backend to select the route-correct CoW buy token surface and persist exact quote diagnostics fail-closed.
2. rerun the authenticated proof with the existing Privy session if still available on this machine.
3. push only to the furthest truthful boundary reached after that rerun.
4. submit only if auth, ownership, funding, quoteability, and explicit user signature all truly hold.

## Production Reprobe Update

Date: 2026-04-01

### Verified Deploy Truth

1. Railway access was restored and the linked production service was confirmed as project `xstocks-strategy-lab-preview`, environment `production`, service `api`.
2. production was redeployed from a clean `origin/main` worktree at commit `896774a65d5525318d08f74df11a3ee8c842b9f9`.
3. the live Railway deployment now serving traffic is `bca58ba0-421a-4548-b60b-05bc8adf6dbf`.
4. production `/health` now exposes `execution_write` and `execution_read`.
5. anonymous `POST /api/activations`, `POST /api/executions`, and `GET /api/executions` now fail closed with `401 Privy access token is required.` instead of the earlier anonymous preview boundary.

### Verified Hosted Proof Boundary

1. Privy backend env was restored on Railway using the existing local `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL`.
2. a real hosted Privy access token from the browser session was verified against the backend auth service for app `cmnfzikzk02ey0ckyx8m14qv2`.
3. the real linked Ethereum wallet for that session is `0xa28ded32f0bde74c42739b5b3fdc79bca0c571b2`, with no smart wallet linked.
4. authenticated production activation save succeeded as `act_801dca8d-3343-4d71-a5b8-d74184f4b587`.
5. authenticated production execution create succeeded as `execreq_4772b5e4-906a-4110-8602-8ecf0e199e24`.
6. authenticated production CoW quote attempts reached live venue truth for every actionable core leg:
   - `NVDAx`: `awaiting_approval`, `quoteId=1126515204`
   - `MSFTx`, `AAPLx`, `METAx`: CoW `500 InternalServerError`
   - `AMZNx`, `GOOGLx`: CoW `404 NoLiquidity`
   - `AUSD`: still deferred/manual
7. no smart wallet or smart account was required to reach this truthful hosted boundary.
8. no user-approved signature was provided, no signed submission happened, and no `orderUid` or `txHash` exists.

### Current Exact Blocker

1. the promoted `$25` Ethereum basket is still not fully quoteable on CoW in hosted production even after the route-correct token fix and real authenticated reprobe.
2. the first truthful hosted boundary is now `authenticated activation -> execution create -> per-leg CoW quote truth`, not deploy/access uncertainty.
