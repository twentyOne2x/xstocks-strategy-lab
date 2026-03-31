# Architecture

Date: 2026-03-31

## Goal

Define the initial repo architecture for `xStocks Strategy Lab` so implementation can start with one coherent monorepo instead of a loose set of services.

## Core Principles

1. xStocks are the product core.
2. Euler is the central directional engine.
3. research and evaluation stay offchain.
4. the frontend stays no-wallet-first.
5. the repo should support one honest fallback live path if exact xStocks-on-Euler market availability is still unverified.

## Runtime Split

### Frontend

`apps/web`

Responsibilities:
1. starter-basket onboarding,
2. long/short mode entry,
3. comparison and detail screens,
4. wallet connect and activation,
5. activity and paused-state surfaces.

Target host:
1. Vercel

### API

`apps/api`

Responsibilities:
1. aggregate xStocks live state,
2. expose recommendation and preview payloads,
3. store strategy and position state,
4. persist activation records,
5. expose activity and receipt data.

Target host:
1. Railway

### Worker

`apps/worker`

Responsibilities:
1. run research/evaluation jobs,
2. refresh cached replay and comparison artifacts,
3. materialize directional preview artifacts,
4. persist results for incumbent vs challenger comparison.

Target host:
1. Railway

## Package Boundaries

### `packages/shared`

Owns:
1. shared types,
2. zod/json schemas,
3. reusable enums and state dictionaries.

### `packages/xstocks`

Owns:
1. official public xStocks API clients,
2. normalization of assets, price-data, multiplier, proof-of-reserves, and status,
3. live-state caching utilities.

### `packages/research`

Owns:
1. frozen evaluation harness,
2. hot experimental surface for candidate generation,
3. results log and leaderboard output,
4. replay and comparison artifacts.

### `packages/euler`

Owns:
1. market-availability lookup,
2. directional preview math and summary formatting,
3. live borrow/position integration helpers,
4. EVC-aligned transaction prep when implemented.

### `packages/policy`

Owns:
1. strategy definitions,
2. activation-policy schemas,
3. smart-account activation metadata,
4. allowed-actions formatting for frontend review.

## Data Flow

### Basket mode

1. frontend requests starter-basket comparison,
2. API reads cached live xStocks state,
3. worker/research package produces ranked basket candidates,
4. API returns recommendation, replay, and guardrail context,
5. frontend renders recommendation and activation flow.

### Directional mode

1. frontend requests long/short preview,
2. API loads xStocks live state and Euler market inputs,
3. research/euler packages produce preview artifacts,
4. API returns health-factor and liquidation-distance summary,
5. frontend renders directional detail and activation review.

## Initial Database Model

Use one Postgres database.

Initial tables:
1. `sessions`
2. `starter_baskets`
3. `research_runs`
4. `candidate_results`
5. `recommendations`
6. `directional_previews`
7. `activations`
8. `activity_events`

## What Not To Build Yet

1. custom lending contracts,
2. multi-chain routing logic,
3. a second frontend app,
4. free-form chat as the primary interface,
5. heavyweight orchestration before the core UX exists.
