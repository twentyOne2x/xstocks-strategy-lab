# Frontend Style Reference

Date: 2026-03-31

## Goal

Keep the frontend visually aligned with the current xStocks product language so the app feels like an xStocks-native product rather than a random hackathon dashboard.

This is a **style-reference contract**, not a copy-paste instruction.
It should deliberately bridge:
1. the confidence and density of modern trading apps,
2. the transparency and controllability of onchain apps.

## Source Of Truth

Primary visual reference:
1. [xstocks.fi](https://xstocks.fi/)

Observed current characteristics from the official site on 2026-03-31:
1. light, high-contrast default surfaces,
2. large editorial-style headlines,
3. restrained, enterprise-finance presentation,
4. strong emphasis on stats, product breadth, and market infrastructure,
5. clean card/grid layout rather than playful consumer widgets,
6. simple, serious typography hierarchy,
7. direct copy and high information density above the fold.

Additional product references to borrow structurally, not literally:
1. trading-terminal confidence and scan speed,
2. copy-trading style discoverability for public strategies,
3. thematic ETF-style onboarding through named baskets and themes,
4. onchain app clarity around wallet state, permissions, and route status,
5. centralized-exchange style bottom blotter for positions and trade history.

## Visual Contract

The frontend should feel:
1. institutional,
2. onchain-finance-native,
3. precise,
4. fast to scan,
5. clearly related to xStocks,
6. like a bridge between a trading desk and an onchain control panel.

It should not feel:
1. like a purple SaaS dashboard,
2. like a meme-trading app,
3. like a chatbot wrapped around finance,
4. like attn branding transplanted into a different product,
5. like a cloned broker app with wallet plumbing bolted on,
6. like a generic DeFi terminal with stock tickers dropped in.

## Styling Rules

### Layout

1. use clean sections with strong horizontal rhythm,
2. prefer clear grids and stat rows,
3. avoid cluttered widget mosaics,
4. keep above-the-fold focused on one value proposition plus live xStocks state,
5. use terminal-inspired paneling where it helps scan speed,
6. reserve the right rail or side panel for action, permissions, and route status,
7. reserve a bottom dock or lower workspace for `Positions`, `History`, and `Activity`.

### Typography

1. bold, high-confidence hero headlines,
2. compact supporting copy,
3. serious data labels,
4. no playful or whimsical type direction.

### Color

1. light base by default,
2. dark text with strong contrast,
3. restrained accent usage,
4. avoid rainbow gradients and loud token-color overload,
5. use color mainly to signal mode, emphasis, and status.

### Components

1. cards should feel crisp and productized,
2. tables and comparison views should feel analytical,
3. charts should feel institutional, not retail-hype,
4. paused / blocked / active states should be obvious without feeling alarmist,
5. strategy cards should feel closer to tradable products than blog content,
6. onchain controls should feel explicit and reversible,
7. status strips should expose route, reserve, multiplier, and venue state without turning the screen into raw infra output,
8. the bottom blotter should feel like a product terminal, not a blockchain explorer dump.

## Experience Bridge

The frontend should intentionally combine:
1. **trading app patterns**
   - dense scanability
   - clear watchlist/theme navigation
   - strong replay/comparison views
   - visible product lineup
   - persistent positions and fills ledger
2. **onchain patterns**
   - wallet state
   - route transparency
   - explicit activation and pause controls
   - venue and vault provenance
   - strategy lifecycle events alongside trade history

The goal is not to pick one side. The goal is to make the product feel like:
1. a serious market terminal for tokenized equities,
2. with programmable onchain controls visible at the point of action.

## Product-Specific Style Implications

### Home screen

Should feel like:
1. xStocks product landing page energy,
2. with immediate strategy-mode choices,
3. a curated market terminal for strategies and themes,
4. not like a dense retail chart wall.

### Comparison screen

Should feel like:
1. serious research output,
2. stat- and replay-driven,
3. still branded as an xStocks product rather than a quant notebook,
4. close enough to a trading workstation that power users feel oriented immediately,
5. anchored by a visible lower ledger for what is live, what was changed, and what executed.

### Directional mode

Should feel like:
1. xStocks plus Euler,
2. not generic leverage UI,
3. with risk panels integrated into the same visual system as the rest of the app,
4. with enough venue and vault context that the onchain leg feels native rather than hidden.

### Public strategies and themes

Should feel like:
1. thematic ETF discovery,
2. strategy mirroring without social noise,
3. named products the user can understand before connecting a wallet.

### Bottom blotter

Should contain tabs like:
1. `Positions`
2. `History`
3. `Activity`
4. optionally `Orders` if the execution rail supports it cleanly

It should show:
1. current xStocks exposures,
2. current directional positions,
3. recent strategy activations, pauses, and replacements,
4. fills, vault deposits, borrow events, and failed/blocked actions where relevant.

It should not:
1. dominate the first-run experience,
2. require wallet connection before the rest of the app is understandable,
3. turn into a raw transaction table with no product context.

## What To Borrow vs What Not To Borrow

Borrow:
1. overall visual tone,
2. headline confidence,
3. information hierarchy,
4. clean market-infrastructure presentation,
5. light, serious finance styling,
6. terminal-like scanability,
7. theme-first product discovery,
8. explicit onchain state panels,
9. bottom-ledger orientation from trading platforms.

Do not borrow blindly:
1. official logos or marks beyond legitimate sponsor/product use,
2. exact page composition,
3. exact copy,
4. exact component duplication,
5. dark-mode-by-default crypto terminal tropes,
6. gamified social-trading noise.

## Implementation Guidance

When implementing the frontend:
1. use xStocks as the mandatory visual reference,
2. keep one coherent visual language across basket and long/short modes,
3. if a component looks too generic, simplify and make it feel more like financial infrastructure,
4. if a component looks too playful, tighten it,
5. if a component looks too broker-like, add onchain transparency,
6. if a component looks too onchain-native, add trading-product clarity,
7. keep the bottom blotter readable and useful even when there are only a few rows of real data.

## Acceptance Criteria

This style contract is only satisfied if:
1. a viewer can tell the product is xStocks-adjacent at first glance,
2. the app does not visually drift into generic AI SaaS,
3. the app does not visually drift into generic DeFi leverage UI,
4. the first screen still feels like a product, not a chart dump,
5. a trading-app user can orient within seconds,
6. an onchain user can see exactly what is active, routed, and reversible,
7. a user can inspect current positions and past actions without leaving the main workspace.
