# xStocks Agent Smoke Matrix

Last reviewed: 2026-04-01

Use this runbook to smoke the public-safe and internal authenticated agent paths without relying on thread context.

## Exact Smoke Matrix

| Stage | Public-safe surface | Internal surface | Pass condition | Exact stop condition |
| --- | --- | --- | --- | --- |
| Qualification | `/onboarding` or `POST /api/qualify` | `node scripts/qualify.mjs` or `POST /api/qualify` | one promoted `selection`, `manifestRef`, and `activationTruth` are returned | qualification result is `blocked` |
| Explanation | `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, or `GET /api/workspace` | `explanationSurface`, `GET /api/catalog`, `GET /api/workspace` | holdings, route labels, funding requirements, and recommended manifest truth are present | route truth is missing, unavailable, or only mock or fallback state |
| Preview | `/activate/[manifestSlug]` or `GET /api/activation-preview` | `GET /api/activation-preview` | preview returns `surfaceTruth`, `executionState`, `executionEligibility`, blockers, and warnings | directional preview-only, route truth unavailable, or preview payload is not API-backed |
| Activation readiness | `GET /api/public-agent-handoff` | compare `GET /api/public-agent-handoff` with `GET /api/activation-preview` | helper says `ready_for_authenticated_activation` and activation preview is `ready` plus `executable` | helper says `stay_public_preview` or `blocked` |
| Execution boundary | helper only names the authenticated boundary | `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, `POST /api/executions` | a real authenticated user context exists and activation save can start | any public-only attempt to save activation, read activity, or create execution |
| Deposit boundary | public surface may explain deposit gap only | `activationTruth.depositRequired` and `GET /api/activation-preview` state | deposit boundary is closed only when execution state is `ready` and eligibility is `executable` | execution state is `wallet_required`, `funding_required`, `smart_account_required`, or `smart_account_pending` |

## Exact Public-Safe Smoke Path

Run these against the hosted public surface:

```bash
curl -sS https://equityterminal.app/skill.md
curl -I -s https://equityterminal.app/onboarding
curl -I -s https://equityterminal.app/workspace/comparison
curl -I -s https://equityterminal.app/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1
```

Interpretation:

1. `skill.md` must stay inside the current public-safe set: `/onboarding`, `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, `/activate/[manifestSlug]`, `POST /api/qualify`, `GET /api/workspace`, `GET /api/activation-preview`, and `GET /api/public-agent-handoff`.
2. The hosted routes must return a live success or redirect response rather than a missing-route failure.
3. Public smoke stops at the authenticated boundary. It does not call `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, or `POST /api/executions`.

## Exact Internal Smoke Path

Run these from the repo workspace:

```bash
pnpm --dir packages/shared build
node scripts/qualify.mjs --fixture broad-cautious
node apps/api/src/index.js
curl -sS "http://localhost:3001/api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=1000"
curl -sS "http://localhost:3001/api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=1000"
```

If `node apps/api/src/index.js` fails on a missing `packages/shared/dist/**` module, rebuild `packages/shared` first and then restart the API. The current workspace requires that build step before the API can boot cleanly.

If `localhost:3001` is already occupied or does not serve `GET /api/public-agent-handoff`, restart the repo API on a clean port and use that base URL for the smoke curls.

Interpretation:

1. The `broad-cautious` fixture should qualify into `onboarding.default_basket`.
2. `GET /api/activation-preview` is the internal authority for preview, blockers, warnings, and activation readiness.
3. `GET /api/public-agent-handoff` must match that preview truth at the public boundary without exposing private details.
4. If the handoff helper says `stay_public_preview` or `blocked`, stop there.
5. Only if activation preview is `ready` plus `executable` and a real authenticated user context exists may the operator continue to the authenticated execution lane.

## Exact Authenticated Lane

Use placeholders only in repo-tracked docs:

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

Stop conditions:

1. no authenticated user context
2. backend Privy verification is not configured with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL`
3. no user-approved wallet or signature step
4. deposit boundary still open
5. any blocker returned by activation or execution truth

## Remaining Unsupported Path

One direct public one-surface path is still unsupported by design. Public-safe agents may qualify, explain, preview, and classify the boundary, but they still may not save activation, read private activity, create execution requests, or claim CRE or recurring-runtime proof from this lane.
