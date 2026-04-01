# xStocks Public Agent Start

Last reviewed: 2026-04-01

This is the public-safe getting-started surface for xstocks-side agents.

It names only live public-safe routes and helpers. It must stop before authenticated activation, activity, or execution. It does not expose private operator hosts, wallet secrets, treasury details, auth material, or hidden custody internals.

This page complements the repo-owned operator surface. It does not replace it.

## Exact Public-Safe Smoke Path

1. Start at `/onboarding` to qualify the user into the promoted basket or directional lane.
2. Use `/workspace/comparison` or `/workspace/detail/[manifestSlug]` for explanation, holdings, route labels, and funding requirements.
3. Use `/activate/[manifestSlug]` for preview and deposit-gap context.
4. Use `GET /api/public-agent-handoff` only to classify the boundary as `stay_public_preview`, `ready_for_authenticated_activation`, or `blocked`.
5. Stop there. If the helper returns `ready_for_authenticated_activation`, hand off into the internal authenticated surface.

## Exact Public-Safe Matrix

- qualification: `/onboarding` or `POST /api/qualify`
- explanation: `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, or `GET /api/workspace`
- preview: `/activate/[manifestSlug]` or `GET /api/activation-preview`
- activation readiness: `GET /api/public-agent-handoff`
- execution boundary: public agents stop at the helper boundary and must not call authenticated activation, activity, or execution endpoints
- deposit boundary: the public surface may explain funding gap, wallet readiness, and route readiness, but it may not save activation or move the user past the authenticated boundary

## What This Public Surface Can Do

- guide no-wallet-first discovery
- help the user qualify into a promoted xStocks lane
- explain holdings, route labels, funding requirements, and deposit gap before any authenticated activation step
- explain that strict self-serve deposit means external wallet transfer / manual same-chain transfer only
- explain that wallet connection, funding, and signing remain user-approved steps
- report whether the public boundary is still preview-only, blocked, or ready for authenticated handoff
- fail closed instead of implying live execution when the lane is still preview-only or blocked

## Current Public Truth

- xStocks-first and Ethereum-first remain the default public posture
- the public start path is `/onboarding` -> `/workspace/comparison` or `/workspace/detail/[manifestSlug]` -> `/activate/[manifestSlug]`
- the current Ethereum basket lane is linked-wallet-first; a smart wallet is optional and not required by the current public readiness path
- wallet connection and USDC funding remain user-approved steps, and the current basket lane does not expose a fixed platform minimum in policy
- strict self-serve deposit truth is external wallet transfer / manual same-chain transfer into the revealed same-chain destination only; `privy_wallet` and `manual_transfer` are the clean wallet-funded path
- `privy_card` and `privy_exchange` are optional hosted convenience rails after wallet connection and may require regulated on-ramp verification; they are not the canonical self-serve default
- Mesh is not a live repo-owned deposit rail today and remains explicitly absent here
- `POST /api/qualify`, `GET /api/workspace`, and `GET /api/activation-preview` are public-safe APIs for qualification, explanation, and preview truth
- `GET /api/public-agent-handoff` is the explicit public-safe handoff helper
- wallet connection happens late and remains user-approved
- user signatures are still required for execution
- direct public follow-through into activation save, activity reads, or execution still does not exist safely
- CRE and recurring-runtime proof are not public-surface claims here

## Public-Safe APIs

- `POST /api/qualify`: qualify the user into a promoted xStocks lane
- `GET /api/workspace`: inspect public workspace truth and route labels for the selected lane
- `GET /api/activation-preview`: read the public readiness preview for the selected lane
- `GET /api/public-agent-handoff`: read the explicit public-to-internal handoff boundary

## Public-Safe Handoff Helper

Use this helper when you need one explicit bridge between public preview and the authenticated internal lane:

```text
GET /api/public-agent-handoff?slotId=<slotId>&userNotionalUsd=<usd>
GET /api/public-agent-handoff?manifestId=<manifestId>&userNotionalUsd=<usd>
```

Optional public-safe wallet readiness inputs:

```text
&walletConnected=true&walletAddress=<0x...>&fundedNotionalUsd=<usd>
```

This helper returns only:

- the public-safe readiness snapshot for the selected promoted lane
- whether to `stay_public_preview`, `ready_for_authenticated_activation`, or stop `blocked`
- the exact authenticated surfaces that begin after the public boundary

It does not save activation, read private activity, create executions, expose private hosts, or reveal hidden custody details.

## Public And Private Boundary

This public surface may explain:

- onboarding and qualification
- explanation, preview, funding requirements, and deposit gap
- the late wallet-connect and user-signature model
- why a lane is preview-only, live, or blocked if that status is visible on the served surface

This public surface may not expose or imply:

- private operator or Hermes host details
- raw auth tokens or operator-only API access
- wallet secrets, seed phrases, or raw key export
- treasury balances, treasury operators, or treasury approval flows
- hidden custody or autonomous execution
- CRE or recurring-runtime proof routes that are not publicly shipped

## Stop Conditions

- If the lane is still preview-only, say so plainly and stop there.
- If the handoff helper says `stay_public_preview`, keep the lane public-only and stop before activation save.
- If the handoff helper says `ready_for_authenticated_activation`, stop the public surface there and hand off into the authenticated internal activation path.
- If the lane is `wallet_required`, `funding_required`, `smart_account_required`, or `smart_account_pending`, keep it on public preview and treat the deposit boundary as not crossed.
- If the only evidence is mock, fallback, or ambiguous UI state, do not claim live readiness.
- If route truth or funding truth is missing, fail closed.
- If the user has not approved wallet, funding, or signing steps, do not imply activation.
- If you need activation save, activity read, or execution proof, hand off to the repo-owned internal operator surface.
