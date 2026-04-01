# Execution Plan

Date: 2026-03-31

## Goal

Define:
1. what progress must happen single-threaded on the critical path,
2. what progress can happen safely in parallel,
3. what should not start until the shared contracts are frozen.

This doc is for execution, not ideation.

## Executive Decision

For this repo, the correct posture is:
1. **single-thread first** for contracts and critical-path architecture,
2. **parallel second** for implementation slices once those contracts are frozen,
3. keep Euler central in product framing,
4. use the strongest publicly verified live rails for demo proof,
5. keep Autopilot as the shared substrate and fallback live proof path,
6. treat `Strategy Lab` as its own workstream instead of burying it inside portfolio or frontend work.

## Why Some Work Must Stay Single-Threaded

At this stage, the repo is still mostly scaffold and docs.

That means the following are dangerous to split too early:
1. package boundaries,
2. shared schemas,
3. DB model,
4. Strategy Lab artifact shapes,
5. frontend payload contracts,
6. live-state adapter shapes,
7. activation object shape,
8. naming and product-mode semantics.

If those drift, parallel work creates churn instead of speed.

## Current Repo Truth

Shipped:
1. public repo exists,
2. monorepo scaffold exists,
3. product, architecture, diagrams, and roadmap docs exist,
4. execution-grade control plane and five workstream specs now exist.

Not shipped:
1. no app code,
2. no DB schema,
3. no xStocks adapter code,
4. no Euler adapter code,
5. no frontend implementation,
6. no wallet or smart-account flow,
7. no research harness yet,
8. no promoted strategy manifests yet.

Verified external rails:
1. xChange is live on Ethereum and Ink,
2. Cow Swap and 1inch are verified Ethereum execution surfaces for xChange,
3. SPYx collateral against AUSD on Morpho is the strongest verified xStocks lending path right now.

Mentor-reported but not yet independently confirmed rail:
1. Ink via Spread Finance as a Cow Swap-powered xChange terminal.

## Single-Thread Critical Path

These should be done by one owner in sequence.

### 1. Monorepo foundation

Freeze:
1. package manager,
2. app/package boundaries,
3. base TypeScript / lint / format setup,
4. env structure,
5. deployment assumptions for Vercel + Railway.

Why single-thread:
1. every other lane depends on these decisions.

### 2. Shared domain schema

Freeze the minimum shared schemas for:
1. onboarding answers,
2. user profile,
3. starter basket,
4. xStocks state strip,
5. signal artifact,
6. strategy slot,
7. basket recommendation,
8. directional preview,
9. activation manifest,
10. activation payload,
11. activity event,
12. research result row.

Why single-thread:
1. frontend, API, worker, and DB all depend on these exact shapes.

### 3. Strategy Lab operating contract

Freeze:
1. research-bundle manifest shape,
2. hot policy boundaries:
   - basket policy
   - directional policy
3. results ledger schema,
4. activation-manifest schema,
5. slot inventory,
6. benchmark and promotion rules.

Why single-thread:
1. this is the actual research and promotion contract for the whole product,
2. frontend, portfolio, and activation all depend on promoted-manifest semantics.

### 4. Database schema

Create the initial Postgres / Prisma model for:
1. guest sessions,
2. users,
3. profiles,
4. starter baskets,
5. research runs,
6. candidate results,
7. recommendations,
8. directional previews,
9. smart accounts,
10. activations,
11. activity events.

Why single-thread:
1. this is the state contract for the whole app.

### 5. xStocks live-state contract

Freeze:
1. exact endpoints used,
2. normalized types,
3. cache behavior,
4. frontend-facing state strip shape.

Why single-thread:
1. both product modes need the same xStocks truth.

### 6. Product-mode and slot contract

Freeze the exact meaning of:
1. `Starter basket / Autopilot`
2. `Long / short with Euler`
3. `I’m not sure yet`
4. default strategy slots:
   - `onboarding.default_basket`
   - `onboarding.alt_basket_1`
   - `onboarding.alt_basket_2`
   - `advanced.default_directional`

And freeze:
1. the onboarding question set,
2. the output profile object,
3. which mode gets selected by default,
4. which slots appear on the frontend by default.

Why single-thread:
1. frontend, research, and activation all depend on this.

## Parallel Work That Becomes Safe After Contracts Freeze

These can run in parallel once the six critical-path items above are stable.

### Track A: Frontend shell

Owner:
1. Claude Code or a frontend-focused thread

Scope:
1. home screen,
2. onboarding questions,
3. strategy-mode selector,
4. comparison screen,
5. detail screen,
6. activation screen,
7. activity screen,
8. methodology badges and promoted-manifest rendering.

Blocked by:
1. shared schemas,
2. onboarding payload contract,
3. state strip payload contract,
4. activation-manifest contract,
5. frontend style contract:
   - [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md)

### Track B: xStocks adapter implementation

Owner:
1. API/backend thread

Scope:
1. assets,
2. price-data,
3. multiplier,
4. multiplier history,
5. proof-of-reserves,
6. system status,
7. normalized payloads for frontend and research.

Blocked by:
1. shared schema decisions.

### Track C: Strategy Lab harness + basket baseline

Owner:
1. backend/worker thread

Scope:
1. fixed evaluation harness,
2. pinned research-bundle loader,
3. `PROGRAM.md`,
4. `results.tsv`,
5. basket baseline and first incumbent,
6. basket activation-manifest generator.

Blocked by:
1. shared schemas,
2. DB model,
3. Strategy Lab operating contract,
4. xStocks normalized live-state shape.

### Track D: Market intelligence signal engine

Owner:
1. backend/research thread

Scope:
1. hero lane selection,
2. signal-artifact schema implementation,
3. provider adapter stubs,
4. `MSTRx` intelligence lane,
5. side-panel payloads.

Blocked by:
1. shared schemas,
2. xStocks state shape,
3. slot and recommendation contracts.

### Track E: Euler directional preview + directional baseline

Owner:
1. backend/research thread

Scope:
1. directional preview payload,
2. long/short scenario object,
3. health factor summary,
4. liquidation distance summary,
5. directional baseline and first incumbent,
6. market-availability probe,
7. truthful live-proof overlay for Morpho `SPYx/AUSD` if Euler market proof is still incomplete.

Blocked by:
1. mode contract,
2. shared schemas,
3. Strategy Lab operating contract,
4. xStocks state shape.

### Track F: Smart-account / activation spike

Owner:
1. backend / wallet integration thread

Scope:
1. wallet connect integration assumptions,
2. smart-account provider choice,
3. activation payload persistence,
4. manifest-to-execution-plan derivation,
5. minimal activity event model.

Blocked by:
1. DB schema,
2. activation schema,
3. product-mode contract,
4. activation-manifest contract.

### Track G: Secondary rail confirmation

Owner:
1. protocol/integration thread

Scope:
1. confirm Spread Finance on Ink,
2. confirm whether its xStocks execution path is Cow-backed xChange,
3. collect one artifact we can cite in demo notes or README,
4. decide whether it stays secondary or becomes a live demo rail.

Blocked by:
1. direct onsite confirmation or public artifacts.

## Parallel Work That Should Wait

Do not start these until core product proof exists:
1. live execution path,
2. direct xChange integration,
3. advanced automation orchestration,
4. heavy observability,
5. analytics warehouse,
6. multi-chain support,
7. custom lending abstractions,
8. multi-venue bundling across 0x, Matcha, Bebop, and others.

## Recommended Execution Order

### Single-thread tranche

Do this first:
1. initialize app tooling,
2. add Prisma + Railway Postgres schema,
3. create shared types and zod schemas,
4. freeze Strategy Lab operating artifacts:
   - bundle manifest
   - results row
   - activation manifest
   - slot ids
5. implement xStocks normalized state types,
6. freeze onboarding question flow and payloads.

### First parallel tranche

After that, split into:
1. frontend shell,
2. xStocks adapters,
3. Strategy Lab harness + basket baseline,
4. market intelligence signal engine,
5. Euler directional preview.

### Second parallel tranche

Then split into:
1. activation flow,
2. activity timeline,
3. replay data plumbing,
4. directional incumbent,
5. market-availability proof checks.

## Owner Map

If one person:
1. stay mostly single-threaded through the first tranche,
2. use Claude only after payload and manifest contracts are frozen.

If two threads:
1. thread 1: contracts + backend substrate + Strategy Lab baseline,
2. thread 2: frontend shell after schemas and manifest contracts freeze.

If three threads:
1. thread 1: contracts + DB + xStocks adapter,
2. thread 2: frontend shell,
3. thread 3: Strategy Lab harness + basket baseline.

If four threads:
1. thread 1: contracts + DB + xStocks adapter,
2. thread 2: frontend shell,
3. thread 3: Strategy Lab harness + basket baseline,
4. thread 4: market intelligence + Euler directional preview.

If five threads:
1. thread 1: contracts + DB + xStocks adapter,
2. thread 2: frontend shell,
3. thread 3: Strategy Lab harness + basket baseline,
4. thread 4: market intelligence signal engine,
5. thread 5: Euler directional preview + rail proof.

## What Claude Code Should Own

Claude is a good fit for:
1. frontend shell,
2. onboarding screens,
3. comparison/detail screens,
4. activation/activity UI polish,
5. methodology badges and manifest-driven render states.

Claude should not own first:
1. DB schema design,
2. normalized domain contracts,
3. live xStocks adapter semantics,
4. Euler market-truth assumptions.

## Acceptance Criteria

This execution split is only good if:
1. no parallel track has to guess core payload shapes,
2. frontend and backend are not redefining the same objects twice,
3. promoted manifests are the only research artifacts crossing into frontend and activation,
4. the first live product proof can use verified Cow Swap / 1inch or Morpho rails without pretending unverified Euler live support,
5. the first live product proof can still fall back to Autopilot if Euler market proof stalls,
6. Euler remains central in framing even if some live work falls back.

## Immediate Next Moves

Right now, the next single-thread moves should be:
1. add Prisma and define the DB schema,
2. add shared schemas in `packages/shared`,
3. define the onboarding answers and profile object,
4. define the xStocks state strip payload,
5. define the directional preview payload.

After that, parallelize:
1. frontend shell via Claude,
2. xStocks adapters,
3. research harness,
4. Euler preview probe,
5. verified rail probe for Cow Swap / 1inch and Morpho `SPYx/AUSD`,
6. secondary rail probe for Ink / Spread Finance.
