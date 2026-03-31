# xStocks Strategy Lab Product Control Plane

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Define one execution-grade umbrella control plane for `xStocks Strategy Lab` that keeps:
1. xStocks as the core asset universe and live truth source,
2. Euler central for directional strategies,
3. market intelligence as a standalone blackbox signal product,
4. portfolio construction and rebalancing as a separate decision layer,
5. the frontend as a bridge between trading-terminal UX and onchain controls,
6. live proof tied to publicly verified execution, lending, and funding rails.

## Non-goals

This control plane does not:
1. replace workstream execution detail with one monolithic document,
2. claim any live xStocks-on-Euler market path that has not been publicly verified,
3. authorize multi-venue best execution across every possible router,
4. turn the product into a generic crypto social-trading terminal,
5. require day-one live execution for every product mode.

## Product Outcome Contract

When this program is done enough to be demoable:
1. a user can enter through a no-wallet-first terminal-like frontend,
2. discover an xStocks theme, public strategy, or hero intelligence lane,
3. see blackbox market-intelligence output translated into a portfolio or directional recommendation,
4. inspect route, vault, multiplier, proof-of-reserves, and activity context,
5. connect a wallet only at activation or funding time,
6. see market intelligence as a dedicated side-panel product surface inside the terminal,
7. see a truthful live or dry-run proof path on verified rails.

## User-Journey Contract

The canonical user journey is:
1. land on a theme-led home terminal,
2. choose a theme, strategy, or hero asset such as `MSTRx`,
3. inspect replay, intelligence side panel, and route/vault context,
4. review the recommended portfolio or directional expression,
5. fund or connect only when ready,
6. activate the strategy,
7. monitor positions, history, and lifecycle events from the same workspace.

Interaction budget target:
1. no wallet required before value is visible,
2. no more than 5 major user-visible screen states before activation,
3. funding and route details appear only when relevant,
4. every blocked state must expose one clear next action.

## Symptom Contract

Observed problem:
1. product direction existed in detail across the thread,
2. but the repo had only lightweight docs and no execution-grade control plane.

Likely culprit:
1. planning lagged behind product evolution.

Non-obvious alternatives:
1. the product was still too unstable to spec cleanly,
2. one smaller bounded spec might have been sufficient.

Falsifiers:
1. if the current repo docs already supported clean implementation without ambiguity, this umbrella would be unnecessary,
2. if the work truly belonged to one workstream, decomposition would be overkill.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. fastest truthful path to a demoable xStocks-first product with explicit live-rail truth.

User UX:
1. no-wallet-first journey,
2. visible route/vault/truth context,
3. no hidden dependency on chat context.

Sustainability:
1. one monorepo,
2. one DB,
3. one funding stack,
4. bounded provider sprawl.

Safety:
1. fail closed on unverified rails,
2. no overclaiming live support,
3. clear live/preview/blocked truth labels.

Maintainability:
1. explicit workstream boundaries,
2. shared schemas,
3. no product forks by venue or mode.

## Current Live Truth

As of 2026-03-31, the repo should treat these as current live truth:
1. xChange is publicly described as live on Ethereum and Ink.
2. On Ethereum, xChange is publicly described as available on aggregators such as Cow Swap and 1inch.
3. Morpho publicly exposes an `SPYx/AUSD` lending path and the linked Flowdesk AUSD RWA Strategy vault is live.
4. The exact live xStocks-on-Euler market path remains unverified from public sources.
5. Spread Finance on Ink is currently mentor-reported rather than independently verified in public proof captured by this repo.

## Current Local Implementation Audit

### Repo truth

Shipped:
1. public GitHub repo exists,
2. monorepo scaffold exists,
3. root architecture and roadmap docs exist,
4. frontend style direction exists,
5. execution-plan doc exists.

Partial:
1. repo-level planning intent exists,
2. live-rail notes exist in prose,
3. frontend direction exists but is not yet tied to implementation-ready payloads.

Spec-only:
1. market intelligence engine,
2. portfolio construction and rebalance engine,
3. execution/funding adapter contracts,
4. wallet and smart-account flow,
5. all UI implementations.

Not present:
1. DB schema,
2. shared domain schemas,
3. xStocks adapter code,
4. Morpho/Euler adapter code,
5. frontend app code,
6. research runner,
7. live proof harness.

### Codebase-fit decision

The clean posture is:
1. extend the existing monorepo scaffold,
2. add a repo-local planning surface instead of creating duplicate planning elsewhere,
3. decompose into one umbrella spec plus four workstream specs,
4. keep existing lightweight docs as orientation docs rather than overloading them into executor docs.

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend existing surfaces for root docs and package boundaries,
2. new planning surface justified.

Existing logic to reuse:
1. root README,
2. architecture,
3. roadmap,
4. execution plan,
5. frontend style reference.

New entrypoints required:
1. yes, `docs/ISSUES.md` and `docs/plans/active/` because no repo-local execution-grade planning surface existed.

Structural refactor assessment:
1. required now for planning,
2. code refactors remain beneficial later until implementation exists.

Iteration-speed hotspots assessed:
1. no code hotspots yet,
2. current bottleneck was planning spread across chat and root docs.

Build/deploy fan-out assessment:
1. no code fan-out yet,
2. plan fan-out was too broad until this control plane existed.

## Existing-Spec Inventory

1. [README.md](/Users/user/PycharmProjects/xstocks-strategy-lab/README.md)
   - Current relevance: high as product overview.
   - Decision: reuse as-is and update links.
   - Why: it is a landing doc, not an executor spec.
2. [docs/EXECUTION_PLAN.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/EXECUTION_PLAN.md)
   - Current relevance: high for sequencing.
   - Decision: reuse as-is.
   - Why: it is a tactical split doc, not a full control plane.
3. [docs/ROADMAP.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ROADMAP.md)
   - Current relevance: medium.
   - Decision: reuse as-is.
   - Why: it is a lightweight roadmap and still useful.
4. [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md)
   - Current relevance: high.
   - Decision: update indirectly through the frontend sub-spec rather than replace.
   - Why: style reference and execution-grade frontend spec are different documents.
5. [docs/DIAGRAMS.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/DIAGRAMS.md)
   - Current relevance: medium.
   - Decision: reuse as-is.
   - Why: diagrams are supporting artifacts, not control docs.

No prior execution-grade planning surface exists inside this repo, so new docs are justified rather than duplicative.

## Thread-Recurrence Audit

This repo is newly created and the visible thread is acting as the primary backlog surface.

Thread-priority matrix is needed because the conversation already contains several repeated and adjacent asks.

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Mapping | Verified status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shared contracts and DB substrate | high | high | high | unshipped | `XSL-001` | none | freeze schemas and DB first |
| 2 | Terminal frontend | high | high | high | spec-only | `XSL-004` | none | handoff to Claude after schema freeze |
| 3 | Market intelligence blackbox | high | high | medium | spec-only | `XSL-002` | none | freeze signal artifact and hero lanes |
| 4 | Portfolio construction and rebalance | high | high | medium | spec-only | `XSL-003` | none | freeze mapping and rebalance policy |
| 5 | Execution, funding, live rails | high | medium | medium | partial truth only | `XSL-005` | partial public proof | implement after contracts |

## Spec'd-But-Unimplemented Table

| Workstream | Governing doc | What should exist | What repo proves now | What is still missing | Gap type |
| --- | --- | --- | --- | --- | --- |
| Control plane | this doc | authoritative umbrella spec | now present after this patch | implementation closure | proof/state |
| Intelligence | `XSL-002` | signal artifact and product lane | prose only | code, UI, examples | backend/frontend |
| Portfolio | `XSL-003` | recommendation and rebalance layer | prose only | schemas, logic, blotter data | backend/frontend |
| Frontend | `XSL-004` | terminal shell | design direction only | actual UI | frontend |
| Rails | `XSL-005` | venue/funding/live-proof stack | prose truth only | adapters, proof harness, UI | integration |

## Workstream Map

This program decomposes into:
1. [Market Intelligence Signal Engine](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-market-intelligence-signal-engine-spec.md)
2. [Portfolio Construction And Rebalance](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)
3. [Terminal Frontend Experience](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
4. [Execution, Funding, And Rails](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)

## Shared State And Truth Model

### Core product objects

1. `theme`
2. `public_strategy`
3. `signal_artifact`
4. `portfolio_recommendation`
5. `directional_preview`
6. `activation_payload`
7. `position_row`
8. `activity_event`

### Source-of-truth split

1. xStocks official public APIs own live asset, price, multiplier, PoR, and status truth.
2. Market intelligence owns blackbox signal generation.
3. Portfolio construction owns target weights or target directional expression.
4. Execution rails own route-specific live action truth.
5. The frontend owns presentation, not source truth.
6. The intelligence side panel is the canonical embedded surface for the market-intelligence product inside the terminal.

## Shared Quantitative Targets

The first shipped product proof should satisfy:
1. one coherent no-wallet-first frontend journey,
2. at least three named themes or public strategies,
3. at least one hero intelligence lane with machine-readable signal output,
4. at least one basket recommendation flow,
5. at least one directional preview flow,
6. at least one truthful live or dry-run rail proof,
7. one bottom blotter showing positions and past actions.

## State-And-Truth Contract

Canonical shared states:
1. `explore`
2. `view_ready`
3. `activation_ready`
4. `active`
5. `paused`
6. `blocked`
7. `preview_only`

Shared source-of-truth split:
1. xStocks public APIs for asset state,
2. signal artifacts for market view,
3. recommendation objects for target state,
4. activation and activity records for live state.

Fail-closed rule:
1. blocked, unverified, or stale rails must never surface as active-ready.

## Served-Surface Authority Contract

Canonical intended user-hit surface:
1. future `apps/web` frontend on Vercel.

Current status:
1. no served surface exists yet,
2. no user-facing readiness claim may exceed `planning-only`.

## Hosted / Deployed / Production Boundary

1. local-only: current state for the entire program
2. deployed-host verified: none yet
3. production-host verified: none yet
4. still unproven: every user-facing and live-rail claim

## Program Sequencing

### Tranche 1

1. create DB schema and shared contracts,
2. freeze signal artifact schema,
3. freeze portfolio recommendation schema,
4. freeze activation and blotter schemas.

### Tranche 2

1. build xStocks adapter layer,
2. build market-intelligence blackbox scaffold,
3. build terminal frontend shell,
4. build portfolio recommendation outputs.

### Tranche 3

1. build directional preview rail,
2. build funding and activation flow,
3. build live or dry-run proof path,
4. build bottom blotter activity surfaces.

## Derived Next Roadmap Table

| Next item | Why it follows | Blocked on current closure | Start now or later | Extends |
| --- | --- | --- | --- | --- |
| Prisma + DB schema | every lane depends on shared state | no | now | control plane + `XSL-003` |
| Shared payload schemas | frontend and backend both need them | no | now | all sub-specs |
| Claude frontend build | frontend spec is now explicit | yes, on schema freeze | later | `XSL-004` |
| Signal adapter scaffold | hero intelligence needs code | yes, on payloads | later | `XSL-002` |
| Rail proof harness | demo proof depends on it | yes, on activation contracts | later | `XSL-005` |

## Implementation Waves

Wave 1:
1. planning + shared contract freeze,
2. allowed claim: `repo has an execution-grade control plane`.

Wave 2:
1. DB + shared schemas + xStocks normalized state,
2. allowed claim: `backend substrate exists`.

Wave 3:
1. terminal frontend + intelligence and recommendation scaffolds,
2. allowed claim: `product proof exists`.

Wave 4:
1. funding, activation, and truthful live or dry-run proof,
2. allowed claim: `demoable proof path exists`.

## Shared Assumptions

1. Ethereum mainnet remains the default chain.
2. xStocks remains the product core even if some live proof uses adjacent rails.
3. Market intelligence remains a standalone product boundary.
4. The intelligence signal remains blackbox to users but structured to downstream consumers.
5. Claude Code will own most frontend implementation after contracts freeze.

## Shared Invalidators

1. Public proof appears that materially changes the execution, funding, or lending rail hierarchy.
2. The user decides to abandon xStocks-first positioning.
3. The product shifts from terminal-style discovery to a chat-first interface.
4. The intelligence layer is required to expose raw model internals instead of a blackbox signal contract.

## Program-Level Acceptance

The control plane is only satisfied if:
1. every major workstream has an execution-grade sub-spec,
2. no major product area is still defined only by chat context,
3. the repo can point to one current live-rail hierarchy without contradiction,
4. the frontend, intelligence, portfolio, and execution layers have explicit boundaries,
5. the proof bar is honest about what is live, what is dry-run, and what is still conceptual.

## Shared Proof Artifacts

Minimum proof artifacts across the program:
1. schema files or documented payload contracts,
2. screenshots or recordings of the terminal frontend,
3. example signal artifacts and recommendation outputs,
4. evidence of at least one truthful live or dry-run rail path,
5. activity ledger output for positions/history/activity,
6. README and planning links that match the implemented product.

## Final Reporting Contract

At program close, report:
1. canonical workstreams,
2. spec'd items still unimplemented at the start,
3. roadmap items derived during the run,
4. landed slices,
5. checks run,
6. what is local-only,
7. what is deployed-host verified,
8. what is production-host verified,
9. what remains blocked and why.

## Verification Commands

Current repo-verifiable commands:
1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`

Planned implementation-phase commands:
1. `pnpm lint`
2. `pnpm check`
3. `pnpm test`

## Exit Criteria

This control-plane spec can move to completed only when:
1. all four workstream specs have either completed or explicitly superseded status,
2. the repo README and architecture docs match the implemented product,
3. the live-proof story is internally consistent,
4. the product can be demoed without relying on undocumented chat context.
