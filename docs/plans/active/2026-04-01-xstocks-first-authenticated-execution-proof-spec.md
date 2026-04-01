# xStocks First Authenticated Execution Proof Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Close the remaining hosted/session-backed signer-proof lane on top of the already-real authenticated activation stack by:
1. keeping real frontend Privy connect and backend owner binding as fixed prerequisites,
2. treating completed `XSL-014A` venue routing as the execution substrate,
3. separating backend Privy verification config from live user-session proof input,
4. carrying one hosted signer-backed proof to the furthest truthful boundary or exact blocker,
5. keeping operator visibility truthful about where the run stopped.

## Non-goals

This workstream does not:
1. reopen `XSL-014A` venue design or relitigate `1inch` versus `CoW`,
2. reopen `XSL-018B` provider handoff or `XSL-018A` control-surface work,
3. reopen homepage or browser-proof cleanup already owned elsewhere,
4. authorize autonomous execution or hidden custody,
5. count configured secrets or local green as live hosted signer proof.

## Current Live Truth

1. `https://equityterminal.app/` is live and serves the current product shell.
2. [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx) mounts Privy when `NEXT_PUBLIC_PRIVY_APP_ID` exists, and [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) now uses real Privy hooks.
3. [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js) performs Privy JWT or JWKS verification, linked-account parsing, and authenticated owner binding.
4. `XSL-014A` completed the venue-routed manual execution substrate: the shared contract and `apps/api` now carry `cow_swap` and `oneinch_fusion` through the same signer-owned execution path.
5. Hosted operator visibility remains partial because `/api/reporting/xstocks` and `/ops/xstocks` still depend on hosted token configuration.
6. The exact current blocker for a new hosted signer proof is fresh verified user-session input. The existing proof runners fail closed when `XSTOCKS_PRIVY_ACCESS_TOKEN` is missing or expired.
7. The completed substrate and current CoW sweep together show that the promoted basket still cannot claim full-basket signed submission through present CoW venue truth. That is current route truth, not missing venue design.

## Residual Proof Split

### Backend Privy verification config: completed precondition

1. `apps/api` already verifies Privy tokens and binds the authenticated owner.
2. Runtime config means the proving backend has `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL` available.
3. This answers "can the backend validate a real session?".
4. This is not the remaining open design lane.

### Live user-session proof input: remaining residual

1. A fresh verified user session or access token from a real hosted or authenticated context is still required before activation save, quote, approval, or submission proof can run.
2. This answers "is live signer-backed proof material available right now?".
3. Missing, expired, or absent session material must stop the proof even if backend verification config is correct.
4. This is the exact remaining residual under `XSL-014` after `XSL-014A`.

## Current Local Implementation Audit

### Shipped

1. live landing plus activation routes,
2. real frontend Privy connect,
3. backend Privy verification and authenticated owner binding,
4. completed venue-routed execution substrate across `cow_swap` and `oneinch_fusion`,
5. operator-safe runbooks and proof scripts.

### Partial

1. hosted operator visibility beyond token-gated surfaces,
2. one fresh hosted signer-backed proof run on the completed substrate.

### Residual Only

1. fresh verified user-session input,
2. one hosted signer-backed proof bundle or exact blocker,
3. one operator-visible summary of the exact stop state.

## Current Exact Boundary

1. hosted linked-wallet activation and CoW quote-boundary proof exists under [tmp/proof/2026-04-01T17-25-58.460Z](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T17-25-58.460Z).
2. the completed `XSL-014A` 1inch proof runner emitted an exact blocker bundle under [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-01T21-55-55.559Z/summary.json) because the Privy access token was expired.
3. no all-leg CoW executable floor exists through `25`, `50`, `100`, `250`, or `500` USD gross, and no CoW-only replacement basket exists under the current direct quote universe.
4. these facts narrow the remaining lane to hosted/session-backed signer proof input on top of the completed substrate.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: mandatory completed dependency.
   - Decision: freeze and reuse.
2. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: high.
   - Decision: reuse for execution-rail and funding-truth context.
3. [xstocks-operator-execution-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md)
   - Current relevance: very high.
   - Decision: keep it aligned to the same config-versus-session split.
4. [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md)
   - Current relevance: separate residual.
   - Decision: do not widen this proof lane into provider handoff.

## Proof Contract

To close this lane, the proof report must state separately:
1. backend verification config status: configured or exact missing input,
2. live user-session input status: fresh, expired, absent, or exact other blocker,
3. venue actually selected by the completed substrate (`oneinch_fusion`, `cow_swap`, or exact blocked route),
4. furthest truthful state reached: `activation_ready`, `quoted`, `awaiting_user_approval`, `submitted`, `confirmed`, or `failed`,
5. exact blocker, or `orderUid` / `txHash` if submission or receipt exists.

## Verification Commands

Minimum verification surface:
1. `pnpm --dir apps/web check`
2. `pnpm --dir apps/api check`
3. `pnpm --dir packages/policy check`
4. `pnpm --dir packages/shared check`
5. `pnpm --dir packages/xstocks check`
6. `node --check apps/api/scripts/privy-cow-proof.js`
7. `node --check apps/api/scripts/oneinch-fusion-proof.js`
8. one hosted proof run with fresh verified user-session input against the current proving backend

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - package and app checks plus any proof-script dry run without live hosted session input.
2. deployed-host verified
   - hosted linked-wallet activation save, execution-request creation, and quote-boundary proof bundles on the current promoted basket lane.
3. production-host verified
   - backend verification config is real, a fresh hosted session reaches the completed substrate, and one signer-backed proof stops at the furthest truthful state.
4. still unproven
   - anything missing either the configured backend precondition or the fresh live-session proof input.

## Exit Criteria

This workstream is complete enough only when:
1. backend verification config is explicit and real,
2. one fresh hosted session reaches the completed substrate,
3. one hosted/session-backed signer proof bundle exists or the last remaining blocker is exact and external,
4. the report does not reopen venue design or blur config versus live-session input,
5. operator visibility states the proof boundary truthfully.

## Decision Log

- 2026-04-01: backend Privy verification and authenticated owner binding are real and should remain fixed prerequisites.
- 2026-04-01: `XSL-014A` completed the venue-routed manual execution substrate, so the remaining proof lane is input collection plus hosted verification, not route design.
- 2026-04-02: this doc now explicitly separates backend verification config from live user-session proof input.

## Progress Log

- 2026-04-01: captured hosted linked-wallet activation plus CoW quote-boundary proof under `tmp/proof/2026-04-01T17-25-58.460Z`.
- 2026-04-01: captured the completed `XSL-014A` blocker bundle under `tmp/proof/oneinch-fusion-2026-04-01T21-55-55.559Z`.
- 2026-04-02T11:15:00+02:00: Reconciled the active proof owner to the post-`XSL-014A` state and narrowed the residual to hosted/session-backed signer proof only.
