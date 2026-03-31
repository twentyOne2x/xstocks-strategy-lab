# Build Roadmap

Date: 2026-03-31

## Immediate Goal

Get to one truthful, demoable product path as fast as possible while keeping Euler central.

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
4. build recommendation artifacts.

### Wave 4: Euler directional mode

1. build long/short mode entry,
2. build directional preview payloads,
3. surface health factor and liquidation distance,
4. keep xStocks multiplier and route state visible in the same screen.

### Wave 5: activation and live proof

1. connect wallet,
2. create or attach smart account,
3. save activation records,
4. wire one truthful execution or dry-run path,
5. record activity and receipt state.

## Demo Rule

Preferred hero path:
1. xStocks + Euler directional mode

Fallback live path:
1. xStocks Autopilot basket mode

That fallback is acceptable only if:
1. exact xStocks-on-Euler market availability is still not verified in time,
2. the repo still keeps Euler visible as the central long/short mode.
