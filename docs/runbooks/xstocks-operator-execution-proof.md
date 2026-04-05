# xStocks Operator Execution Proof

Last reviewed: 2026-04-02

Use this runbook after:

1. qualification picked a promoted manifest or slot, and
2. activation truth says the lane is ready to continue.

This runbook is internal and authenticated. It begins only after the public-safe handoff boundary has been crossed truthfully. Do not record private hosts, wallet secrets, auth tokens, treasury details, or hidden custody internals here.

Canonical smoke runbook:
[xstocks-agent-smoke-matrix](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-agent-smoke-matrix.md)

## Two Separate Preconditions

### Backend verification config

1. Confirm the proving backend is configured with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL`.
2. This proves the backend can verify a real Privy session and bind authenticated ownership.
3. This does not prove that a live user session currently exists.

### Live user-session proof input

1. Obtain a fresh verified user access token from a real authenticated context before attempting activation save or execution proof.
2. Treat missing or expired session input as an exact blocker even when backend verification config is correct.
3. Never paste raw tokens or session material into docs, proof summaries, or chat.

## Shortest Truthful Flow

1. Start the repo-owned API surface if needed.
2. Confirm backend verification config.
3. Confirm `GET /api/activation-preview` is `ready` and `executable`, and that `GET /api/public-agent-handoff` says `ready_for_authenticated_activation`.
4. Confirm fresh live user-session proof input exists.
5. Save the activation from that authenticated user context.
6. Read back activity or execution state from the canonical API.
7. Create or inspect the execution request only from that authenticated context and record the actual `adapterId` selected by the completed substrate.
8. Stop at the first truthful boundary and report it exactly.

## Canonical Local Commands

```bash
pnpm --dir packages/shared build
node apps/api/src/index.js
curl http://localhost:3001/health
curl "http://localhost:3001/api/activation-preview?slotId=<slotId>&userNotionalUsd=10"
curl "http://localhost:3001/api/public-agent-handoff?slotId=<slotId>&userNotionalUsd=10"
```

## Dedicated Operator Browser Environment

Use a dedicated non-headless Brave profile for wallet-gated frontend proof. Do not depend on a random personal browser session, and do not rely on the current headless automation browser if wallet UI or unlock steps matter.

Recommended setup:

```bash
pnpm proof:browser:status
pnpm proof:browser:frontend
```

Recommended shared-env inputs:

1. `XSTOCKS_BRAVE_WALLET_PASSWORD` or `XSTOCKS_BRAVE_WALLET_PASSWORD_COMMAND`
2. optionally `XSTOCKS_BRAVE_USER_DATA_DIR`
3. optionally `XSTOCKS_BRAVE_CDP_URL` if you deliberately attach to a pre-launched dedicated browser

The harness writes proof bundles under `tmp/proof/operator-browser-harness-*/` and fails closed on the exact missing setup or first live blocker reached. On a clean dedicated profile, it now bootstraps Brave Wallet automatically when a password secret source is configured. The current strongest browser proof reaches a real injected provider on the canonical activate route and now stops at the wallet approval boundary itself (`The user rejected the request.`) instead of the old missing-provider boundary.

`pnpm browser:launch:xstocks` remains optional for manual attach/debug flows, but it is no longer the primary required step for the repo-owned proof path.

If `node apps/api/src/index.js` fails on a missing `packages/shared/dist/**` module, rebuild `packages/shared` first and then restart the API.

If `localhost:3001` is already occupied or does not serve `GET /api/public-agent-handoff`, restart the repo API on a clean port and use that base URL instead of trusting a stale local server.

Authenticated activation and execution examples should use placeholders only:

```bash
curl -X POST http://localhost:3001/api/activations \
  -H 'Authorization: Bearer <fresh_user_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{...}'

curl "http://localhost:3001/api/activity?activationId=<activationId>" \
  -H 'Authorization: Bearer <fresh_user_access_token>'

curl -X POST http://localhost:3001/api/executions \
  -H 'Authorization: Bearer <fresh_user_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

## What To Capture

Capture these fields in the proof summary:

1. backend verification config status,
2. live user-session input status,
3. `manifestId` or `slotId`,
4. qualification result,
5. `activationId` if one was created,
6. `surfaceTruth`, `executionState`, and `executionEligibility`,
7. selected `adapterId` or exact blocked route,
8. whether the lane stopped at preview, ready, quoted, awaiting approval, submitted, confirmed, or failed,
9. the exact blocker if it stopped short.

If safe to disclose, you may also include execution-request ids or receipt ids. Do not include raw auth headers or private wallet material.

## Hard Stop Conditions

Stop before activation save if any of these remain true:

1. `executionState` is `wallet_required`,
2. `executionState` is `funding_required`,
3. `executionState` is `smart_account_required`,
4. `executionState` is `smart_account_pending`,
5. `executionEligibility` is not `executable`,
6. the public handoff helper does not say `ready_for_authenticated_activation`,
7. backend verification config is missing any of `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, or `PRIVY_JWKS_URL`,
8. no real authenticated user context exists,
9. the user session input is missing or expired.

## Required Truth Boundary

Stop at the first exact truthful state:

1. `preview_only`
2. `activation_ready`
3. `quoted`
4. `awaiting_user_approval`
5. `submitted`
6. `confirmed`
7. `failed`

Do not skip intermediate states and do not convert a blocked or preview-only lane into a success narrative.

## Exact Blocker For A Fully Smooth Start

The public `skill.md` and `GET /api/public-agent-handoff` can now start discovery, readiness, and boundary reporting, but a fully smooth single-surface start still does not exist. Activation save, activity reads, and execution proof still depend on:

1. configured backend verification,
2. fresh live user-session input,
3. internal authenticated API access,
4. operator-controlled wallet or signer context.
