# xStocks Terminal Frontend Experience Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Define the execution-grade frontend contract for a terminal-like xStocks product that:
1. bridges trading-app UX and onchain UX,
2. stays visually aligned with xStocks,
3. supports themes, public strategies, and intelligence-led discovery,
4. includes a bottom blotter for positions, history, and activity.

## Non-goals

This workstream does not:
1. define backend schemas in place of the shared-contract workstream,
2. copy Spread Finance or broker UIs literally,
3. build a generic social-trading feed,
4. lead with chat as the primary interface,
5. hide onchain controls under generic broker language.

## Product Outcome Contract

The frontend should feel like:
1. a curated strategy terminal for tokenized equities,
2. a place where views, themes, and public strategies are discoverable quickly,
3. a place where wallet state, route state, vault context, and activation controls are explicit,
4. a product that power users can scan quickly without losing first-run clarity,
5. a terminal where `Market Intelligence` appears as a dedicated side panel rather than generic metadata.

## User-Journey Contract

The canonical user journey is:
1. land on a home terminal,
2. pick a theme, hero asset, or public strategy,
3. inspect comparison and replay,
4. inspect the market-intelligence side panel plus route and vault context,
5. connect and fund only when ready,
6. activate the strategy,
7. monitor bottom-blotter positions and history.

Interaction budget target:
1. 5 major screens or fewer before activation,
2. 0 wallet interactions before the value is clear,
3. 1 wallet connection step,
4. 1 funding step when needed,
5. bottom blotter available from the main workspace.

## Symptom Contract

Observed problem:
1. the frontend direction was strong in chat,
2. but the repo only had lightweight style notes and no execution-grade UI contract.

Likely culprit:
1. no executor-grade frontend spec tied to the product architecture.

Non-obvious alternatives:
1. the lightweight docs might have been enough,
2. the frontend might intentionally still be exploratory.

Falsifiers:
1. if Claude could implement the product cleanly from existing root docs alone, this spec was unnecessary.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. a frontend strong enough to sell and orient the product without narrative rescue.

User UX:
1. theme-led discovery,
2. clear route and vault transparency,
3. visible positions/history/activity.

Sustainability:
1. one frontend shell,
2. reusable modules and payloads,
3. no separate marketing-versus-terminal split.

Safety:
1. explicit live versus preview states,
2. no deceptive CTA language,
3. reversible controls.

Maintainability:
1. one design language,
2. clear screen boundaries,
3. stable payload contracts.

## Current Live Truth

1. The repo already has `docs/FRONTEND_STYLE.md` and `docs/DIAGRAMS.md`.
2. The user wants the frontend to be more creative, not a standard dashboard.
3. The user wants it to bridge centralized trading-app expectations and onchain transparency.
4. The user explicitly wants a bottom rail for positions and past trading.
5. The user likes themes, public-strategy patterns, and Spread-style terminal confidence.

## Current Local Implementation Audit

Shipped:
1. style-reference contract,
2. diagrams,
3. root README summary.

Partial:
1. home/comparison/detail flow is implied in prose,
2. bottom blotter is now referenced in docs.

Unshipped:
1. actual screen specs by module,
2. frontend data dependencies,
3. CTA language map,
4. component ownership,
5. visual proof artifacts.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. new frontend implementation surface justified in `apps/web`.

Existing logic to reuse:
1. frontend style reference,
2. diagrams,
3. product-mode naming,
4. rail and route language from root docs.

New entrypoints required:
1. no new frontend app beyond `apps/web`.

Structural refactor assessment:
1. not applicable yet because no frontend code exists,
2. screen boundaries in this doc are the intended split seams.

Build/deploy fan-out assessment:
1. frontend should consume API payloads rather than pulling provider logic client-side.

## Existing-Spec Inventory

1. [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md)
   - Current relevance: very high.
   - Decision: reuse and elevate through this execution-grade spec.
2. [docs/DIAGRAMS.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/DIAGRAMS.md)
   - Current relevance: high.
   - Decision: reuse.
3. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: update via this sub-spec.

## Thread-Recurrence Audit

The repeated frontend asks collapse into:
1. use xStocks visual language,
2. make it more creative,
3. bridge trading apps and onchain UX,
4. support themes and public-strategy discovery,
5. include positions/history at the bottom,
6. keep no-wallet-first onboarding.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| Home terminal | theme-led first screen | prose only | actual UI | frontend |
| Comparison workspace | replay + winner explanation | prose only | actual UI | frontend |
| Detail screen | route/vault context | prose only | actual UI | frontend |
| Bottom blotter | positions/history/activity | prose only | actual UI and data wiring | frontend/backend |

## Screen Contract

### 1. Home terminal

Must show:
1. hero product value,
2. themes and public strategies,
3. live xStocks state strip,
4. one hero intelligence lane,
5. one clear entry into basket mode and directional mode.

### 2. Comparison workspace

Must show:
1. `$1,000 replay`,
2. recommendation comparison,
3. why one strategy or view won,
4. current stance and confidence,
5. lower blotter preview.

### 3. Detail screen

Must show:
1. full recommendation detail,
2. route and venue context,
3. Morpho or Euler context where relevant,
4. multiplier and PoR context,
5. activation CTA.

### 4. Activation and funding screen

Must show:
1. wallet and smart-account state,
2. funding options,
3. route and rail summary,
4. strategy permissions and reversibility,
5. final activation CTA.

### 5. Activity workspace

Must show:
1. positions,
2. history,
3. lifecycle events,
4. paused and blocked states,
5. current live strategy state.

## Terminal Module Contract

### Left rail

Should contain:
1. themes,
2. hero assets,
3. public strategies,
4. watchlist or recent selections.

### Main workspace

Should contain:
1. replay,
2. comparison,
3. intelligence summary,
4. recommendation detail.

### Right rail

Should contain:
1. market-intelligence side panel,
2. route state,
3. wallet and smart-account state,
4. vault and venue provenance,
5. action controls.

### Market-intelligence side panel

The right-side intelligence panel should show:
1. current view,
2. confidence,
3. horizon,
4. what changed,
5. resulting portfolio implication.

It should behave like:
1. a carved-out standalone product surface embedded in the terminal,
2. not a tiny info box,
3. not a hidden drawer that only appears after activation.

### Bottom blotter

Tabs:
1. `Positions`
2. `History`
3. `Activity`
4. optional `Orders`

Rows may include:
1. xStocks spot positions,
2. directional positions,
3. Morpho vault deposits,
4. borrow events,
5. fills,
6. activation, pause, and replacement events.

## CTA Language Contract

Preferred language:
1. `Follow strategy`
2. `See the view`
3. `Connect wallet`
4. `Fund wallet`
5. `Activate strategy`
6. `Pause strategy`
7. `Turn off strategy`

Avoid:
1. `Arm`
2. `Disarm`
3. `Fire`
4. `Deploy policy`

## State-And-Truth Contract

Canonical user-visible states:
1. `explore`
2. `view_ready`
3. `connect_required`
4. `funding_required`
5. `activation_ready`
6. `active`
7. `paused`
8. `blocked`

Source of truth:
1. API payloads and persisted activation/activity records.

Fail-closed rule:
1. blocked and unverified rails must not share copy with live-ready states.

## Served-Surface Authority Contract

Canonical served surface:
1. `apps/web` on Vercel.

Current status:
1. no served frontend exists yet,
2. all frontend readiness claims remain planning-only.

## Visual-Fit Contract

Visual-fit status:
1. in scope and scored.

Reference surface:
1. [xstocks.fi](https://xstocks.fi/)
2. [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md)

Proof artifacts:
1. screenshots,
2. browser-clickable proof on the served surface.

## Frontend Copy And Language Contract

Surface class:
1. human-facing.

Approved default-path language:
1. themes,
2. views,
3. strategies,
4. positions,
5. history,
6. route and vault context.

Banned default-path jargon:
1. `artifact`
2. `allocator_hint`
3. `policy payload`
4. raw endpoint names.

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked | Start now or later |
| --- | --- | --- | --- |
| Freeze screen payload contracts | Claude needs them | no | now |
| Build home terminal | first user-hit surface | yes, on schemas | later |
| Build bottom blotter | terminal credibility depends on it | yes, on schemas | later |
| Add mobile responsive pass | acceptance requires it | yes, on base UI | later |

## Implementation Waves

Wave 1:
1. route scaffold and base design system.

Wave 2:
1. home terminal, comparison workspace, detail view.

Wave 3:
1. activation/funding and bottom blotter.

Wave 4:
1. responsive and polish pass with browser proof.

## Hosted / Deployed / Production Boundary

1. local-only: current planning
2. deployed-host verified: none yet
3. production-host verified: none yet
4. still unproven: all frontend readiness claims until served-surface proof exists

## Data Dependencies

The frontend depends on:
1. xStocks state strip payload,
2. market-intelligence signal artifact,
3. portfolio recommendation payload,
4. directional preview payload,
5. activation and funding payload,
6. blotter payload for positions/history/activity.

## Assumptions

1. Claude Code will build the frontend.
2. The product should feel closer to a terminal than a marketing site once inside the app.
3. First-run clarity still matters more than maximum information density.
4. The bottom blotter is required, not optional.

## Invalidators

1. The user pivots to chat-first.
2. The product removes public strategies and themes.
3. The product removes onchain route transparency.

## Proof Artifacts

1. desktop home-terminal screenshot,
2. comparison-workspace screenshot,
3. detail-screen screenshot,
4. activation/funding screenshot,
5. bottom-blotter screenshot,
6. mobile responsive screenshots for at least home and detail.

## Verification Commands

Current repo-verifiable command:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase checks:
1. `pnpm lint`
2. `pnpm check`
3. browser verification of the core route set

## Final Reporting Contract

At lane close, report:
1. routes and screens shipped,
2. CTA language decisions,
3. visual-fit proof,
4. browser-clickable proof on the served surface,
5. responsive coverage,
6. remaining styling or data gaps.

## Exit Criteria

This workstream is complete only when:
1. the five-screen product path exists,
2. the bottom blotter is present and useful,
3. the app clearly feels xStocks-adjacent,
4. the app clearly exposes onchain controls and route/vault context,
5. the frontend is strong enough to hand to judges without narrative rescue.
