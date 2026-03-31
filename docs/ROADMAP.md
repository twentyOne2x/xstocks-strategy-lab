# Build Roadmap

Date: 2026-03-31

## Immediate Goal

Get to one truthful, demoable product path as fast as possible while keeping Euler central and aligning to the strongest publicly verified live rails.

## Build Order

### Wave 1: repo and schemas

1. define shared strategy, recommendation, replay, and directional-preview schemas,
2. define starter baskets,
3. define screen payload contracts for the frontend.

### Wave 2: xStocks live state

1. wire official xStocks public API adapters,
2. normalize assets, price-data, multiplier, proof-of-reserves, and status,
3. expose a single frontend-friendly state strip payload.

### Wave 3: Autopilot foundation

1. build starter-basket onboarding,
2. build comparison and detail screens,
3. build `$1,000 replay`,
4. build recommendation artifacts,
5. make the shell feel like a theme-led trading terminal with explicit onchain controls.

### Wave 4: Euler directional mode

1. build long/short mode entry,
2. build directional preview payloads,
3. surface health factor and liquidation distance,
4. keep xStocks multiplier and route state visible in the same screen,
5. make the live-proof path compatible with the currently verified `SPYx/AUSD` Morpho market.

### Wave 5: activation and live proof

1. connect wallet,
2. create or attach smart account,
3. save activation records,
4. wire one truthful execution or dry-run path using currently verified rails,
5. record activity and receipt state.

## Demo Rule

Preferred hero path:
1. xStocks + Euler directional mode

Preferred live rails:
1. Ethereum xChange through Cow Swap or 1inch
2. SPYx/AUSD on Morpho for truthful lending proof

Mentor-reported secondary rail:
1. Ink via Spread Finance as a Cow Swap-powered xChange terminal

Fallback live path:
1. xStocks Autopilot basket mode

That fallback is acceptable only if:
1. exact xStocks-on-Euler market availability is still not verified in time,
2. the repo still keeps Euler visible as the central long/short mode,
3. the demo still uses publicly verified execution or lending rails instead of speculative ones.

## Execution Split

See:
1. [docs/EXECUTION_PLAN.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/EXECUTION_PLAN.md)
2. [docs/plans/active/README.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/README.md)

Use it to decide:
1. what must stay single-threaded on the critical path,
2. what can split safely in parallel,
3. when Claude should take over the frontend lane,
4. how the frontend should bridge trading-app UX and onchain UX rather than picking one side.
