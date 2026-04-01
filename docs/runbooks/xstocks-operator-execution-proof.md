# xStocks Operator Execution Proof

Last reviewed: 2026-04-01

Use this runbook after:

1. qualification picked a promoted manifest or slot, and
2. activation truth says the lane is ready to continue.

This runbook is internal and authenticated. It begins only after the public-safe handoff boundary has been crossed truthfully. Do not record private hosts, wallet secrets, auth tokens, treasury details, or hidden custody internals here.

Canonical smoke runbook:
[xstocks-agent-smoke-matrix](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-agent-smoke-matrix.md)

## Shortest Truthful Flow

1. Start the repo-owned API surface if needed.
2. Confirm backend Privy verification is configured with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL` before attempting authenticated activation.
3. Confirm `GET /api/activation-preview` is `ready` and `executable`, and that `GET /api/public-agent-handoff` says `ready_for_authenticated_activation`.
4. Save the activation from a real authenticated user context.
5. Read back activity or execution state from the canonical API.
6. Create or inspect the execution request only from that authenticated context.
7. Stop at the first truthful boundary and report it exactly.

## Canonical Local Commands

```bash
pnpm --dir packages/shared build
node apps/api/src/index.js
curl http://localhost:3001/health
curl "http://localhost:3001/api/activation-preview?slotId=<slotId>&userNotionalUsd=10"
curl "http://localhost:3001/api/public-agent-handoff?slotId=<slotId>&userNotionalUsd=10"
```

If `node apps/api/src/index.js` fails on a missing `packages/shared/dist/**` module, rebuild `packages/shared` first and then restart the API.

If `localhost:3001` is already occupied or does not serve `GET /api/public-agent-handoff`, restart the repo API on a clean port and use that base URL instead of trusting a stale local server.

Authenticated activation and execution examples should use placeholders only:

```bash
curl -X POST http://localhost:3001/api/activations \
  -H 'Authorization: Bearer <user_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{...}'

curl "http://localhost:3001/api/activity?activationId=<activationId>" \
  -H 'Authorization: Bearer <user_access_token>'

curl -X POST http://localhost:3001/api/executions \
  -H 'Authorization: Bearer <user_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

## What To Capture

Capture these fields in the proof summary:

1. `manifestId` or `slotId`
2. qualification result
3. `activationId` if one was created
4. `surfaceTruth`, `executionState`, and `executionEligibility`
5. whether the lane stopped at preview, ready, quoted, awaiting approval, submitted, confirmed, or failed
6. the exact blocker if it stopped short

If safe to disclose, you may also include execution-request ids or receipt ids. Do not include raw auth headers or private wallet material.

## Hard Stop Conditions

Stop before activation save if any of these remain true:

1. `executionState` is `wallet_required`
2. `executionState` is `funding_required`
3. `executionState` is `smart_account_required`
4. `executionState` is `smart_account_pending`
5. `executionEligibility` is not `executable`
6. the public handoff helper does not say `ready_for_authenticated_activation`
7. backend Privy verification is not configured with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL`
8. no real authenticated user context exists

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

The public `skill.md` and `GET /api/public-agent-handoff` can now start discovery, readiness, and boundary reporting, but a fully smooth single-surface start still does not exist. Activation save, activity reads, and execution proof still depend on internal authenticated API access and operator-controlled wallet context.
