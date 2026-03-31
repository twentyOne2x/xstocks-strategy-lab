# Issues

Last updated: 2026-03-31

## Active

### XSL-001 Product Control Plane

- Type: program
- Status: active
- Context: The repo has scaffold docs and a public GitHub presence, but it does not yet have a repo-local execution-grade control plane tying together market intelligence, portfolio construction, frontend, and live rails.
- Suspected cause: Planning has been spread across chat context plus lightweight repo docs, which is enough for ideation but not enough for coordinated execution.
- Fix intent: Create one umbrella control-plane spec plus execution-grade sub-specs for the major workstreams.
- Acceptance criteria:
  1. Umbrella control-plane spec exists in `docs/plans/active/`.
  2. Workstream sub-specs exist for intelligence, portfolio/rebalancing, frontend, and execution/funding.
  3. The root README links into the planning surface.
  4. The plan set states exact verified rails, product boundaries, and fallback rules.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)

### XSL-002 Market Intelligence Blackbox

- Type: product/data
- Status: active
- Context: The product direction now includes market intelligence as a standalone signal product that should feed portfolio construction through a blackbox signal artifact rather than directly determining trades.
- Suspected cause: The conversation has many signal ideas (`MSTRx`, large holders, Twitter, Nansen, whale tracking) but no frozen contract for how those inputs become one machine-readable signal object.
- Fix intent: Define the market intelligence product, provider mix, signal schema, output semantics, and acceptance bar.
- Acceptance criteria:
  1. Signal engine spec exists.
  2. The spec defines the signal artifact and producer/consumer boundary.
  3. The spec defines hero assets and minimum viable input providers.
  4. The spec defines proof artifacts for a demo-quality intelligence lane.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-market-intelligence-signal-engine-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-market-intelligence-signal-engine-spec.md)

### XSL-003 Portfolio Construction And Rebalancing

- Type: product/runtime
- Status: active
- Context: The portfolio engine needs a separate contract from market intelligence so the signal can remain blackbox while portfolio mapping and rebalance rules remain legible and testable.
- Suspected cause: The current repo docs describe Autopilot and Directional Vault at a high level but do not yet define target-weight translation, incumbent/challenger rules, or rebalance gating.
- Fix intent: Specify allocation mapping, theme baskets, sleeves, challenger/incumbent logic, and rebalance triggers.
- Acceptance criteria:
  1. Portfolio and rebalance spec exists.
  2. The spec defines allocation sleeves and target outputs.
  3. The spec defines rebalance thresholds and anti-thrashing rules.
  4. The spec defines fallback behavior when xStocks live rails are incomplete.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)

### XSL-004 Terminal Frontend Experience

- Type: frontend
- Status: active
- Context: The frontend must bridge trading-app UX and onchain UX, use xStocks styling, support themes/public strategies, and include a bottom blotter for positions/history/activity.
- Suspected cause: Existing frontend docs capture tone and layout direction, but they are not yet execution-grade and do not fully encode the product surface Claude should build from.
- Fix intent: Freeze the terminal-style frontend contract, user journeys, module boundaries, and proof bar.
- Acceptance criteria:
  1. Frontend execution-grade spec exists.
  2. The spec covers home, workspace, detail, activation, and bottom blotter behavior.
  3. The spec encodes theme-led discovery, public strategies, and route/vault transparency.
  4. The spec is suitable as a direct Claude handoff.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)

### XSL-005 Execution, Funding, And Live Rails

- Type: integration
- Status: active
- Context: The product now depends on a specific set of execution, lending, and funding rails: Cow Swap, 1inch, Morpho, Privy, LI.FI, and a mentor-reported Spread Finance path on Ink.
- Suspected cause: The current repo docs mention these rails, but there is no execution-grade definition of how they fit together or what is MVP versus secondary.
- Fix intent: Specify venue adapters, funding provider roles, live-proof hierarchy, and fallback rules.
- Acceptance criteria:
  1. Execution/funding spec exists.
  2. The spec defines primary, secondary, and unverified rails.
  3. The spec defines the funding stack and wallet-activation sequence.
  4. The spec defines proof artifacts for live or dry-run demo closure.
- Complexity: high
- Plan links:
  - [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
