# Equity Terminal Agent Skill

Last reviewed: 2026-04-01

This is the public agent-facing guide for Equity Terminal.

It explains the product and capability model without exposing operator hosts, wallet secrets, treasury details, or private runbooks.

This page is public product truth. It complements the repo-owned Hermes/operator skill and does not replace it.

## What this agent can do

- discover promoted xStocks portfolios and default starting modes
- qualify whether a portfolio is ready for the next activation step or should stay in preview
- preview holdings, route, and funding requirements before execution
- guide the user to connect a wallet
- guide the user to fund with USDC on Ethereum
- guide a user-approved execution flow on the approved rail

## How the product works

1. Discover a portfolio.
2. Qualify it or choose the default portfolio.
3. Preview holdings, route, and activation requirements.
4. Connect a wallet.
5. Fund with USDC on Ethereum mainnet.
6. Sign and execute through the approved rail when the lane is live and ready.

Nothing should execute without explicit user approval.

## Built on top of

- `xStocks` for tokenized equity assets and portfolio or route state
- `Privy` for wallet connection and the current embedded-wallet or smart-wallet direction
- `CoW Protocol` for Ethereum quote and order routing on the promoted execution path
- `Chainlink` as the intended automation rail for later phases

## Control and safety model

- self-custody first
- policy-bound execution
- no raw key exposure through this public surface
- no hidden custody

In practical terms:

- the user connects and approves from their own wallet context
- qualification and route checks happen before execution
- private keys, seed phrases, and raw wallet secrets are not part of this skill surface
- private operator and treasury workflows stay off the public route

## Agent wallet model

Current public posture:

- discovery, qualification, and preview are the primary public agent surfaces
- wallet connection, funding, and execution remain user-approved steps
- this page does not claim raw wallet-serving or autonomous wallet control

Intended model:

- agent wallet access should be capability-based, not secret-based
- an agent should operate against bounded permissions, not raw key export

## Current boundaries

- Equity Terminal is xStocks-first and Ethereum-first for the current activation path
- live execution is not claimed as autonomous
- user signature is still required for execution
- capability-based wallet serving is still an intended model unless a stronger public proof exists
- Chainlink automation is a target-state integration, not a claim of live autonomous CRE execution
- private Hermes runbooks, host details, treasury details, and wallet internals are intentionally omitted here

If a portfolio, route, or funding state is not ready, the truthful behavior is to stay in preview and fail closed rather than imply execution readiness.
