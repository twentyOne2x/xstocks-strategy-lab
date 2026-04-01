# xStocks Public Agent Start

Last reviewed: 2026-04-01

This is the public getting-started surface for xstocks-side agents.

It explains how to start, what can be claimed publicly, and where the public surface must stop. It does not expose private operator hosts, wallet secrets, treasury details, auth material, or hidden custody internals.

This page complements the repo-owned operator surface. It does not replace it.

## Fastest Truthful Public Start

1. Start at `/onboarding` to qualify the user into the promoted basket or directional lane.
2. Use `/workspace/comparison` or `/workspace/detail/[manifestSlug]` to inspect holdings, route labels, funding requirements, and preview truth.
3. Move to `/activate/[manifestSlug]` only after the user explicitly wants to continue.
4. Keep the lane in preview if route truth, funding state, wallet state, or execution readiness is missing or ambiguous.

## What This Public Surface Can Do

- explain the two current public entry modes: basket portfolios and directional preview
- guide no-wallet-first discovery
- help the user qualify into a promoted xStocks lane
- explain holdings, route labels, and funding requirements before any deposit
- explain that wallet connection, funding, and signing remain user-approved steps
- fail closed instead of implying live execution when the lane is still preview-only

## Current Public Truth

- xStocks-first and Ethereum-first remain the default public posture
- the public start path is onboarding -> comparison/detail -> activate
- wallet connection happens late and remains user-approved
- user signatures are still required for execution
- CoW Protocol and 1inch are the current verified Ethereum execution surfaces described in repo truth
- Morpho `SPYx/AUSD` is the current truthful lending-proof path described in repo truth
- exact live xStocks-on-Euler execution is not claimed here
- Chainlink automation is still target-state only, not a live autonomy claim

## Public And Private Boundary

This public surface may explain:

- onboarding and qualification
- preview holdings, routes, and funding requirements
- the late wallet-connect and user-signature model
- why a lane is preview-only, live, or blocked if that status is visible on the served surface

This public surface may not expose or imply:

- private operator or Hermes host details
- raw auth tokens or operator-only API access
- wallet secrets, seed phrases, or raw key export
- treasury balances, treasury operators, or treasury approval flows
- hidden custody or autonomous execution

## Stop Conditions

- If the lane is still preview-only, say so plainly and stop there.
- If the only evidence is mock, fallback, or ambiguous UI state, do not claim live readiness.
- If route truth or funding truth is missing, fail closed.
- If the user has not approved wallet, funding, or signing steps, do not imply activation.
- If you need activation save, activity read, or execution proof, hand off to the repo-owned internal operator surface.
