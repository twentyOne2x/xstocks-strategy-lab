# xStocks Enso Portfolio USDC Multi-Deposit Lane Spec

Date: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-005B` under `XSL-005`
Canonical owner lane: `XSL-005`
Related proof lane: current `XSL-014` remains the explicit `1inch.ethereum` signer-proof family and is not reopened by this spec

## Goal

Freeze the Enso-based atomic portfolio-deposit interpretation of the same user request by:
1. preserving the exact user vision that a person starts with `USDC` and deposits into all assets of the promoted or default xStocks portfolio,
2. validating whether the official Enso product surface can truthfully support the requested one-transaction portfolio multi-deposit shape,
3. freezing the exact atomic claim, approval model, bundle design, artifact contract, and coexistence boundary if that external capability is real,
4. and keeping this work under `XSL-005` as a funding or deposit lane instead of reopening completed `XSL-014A` route design.

## Non-goals

This pass does not:
1. implement Enso integration,
2. reopen `XSL-014A` venue-routing design,
3. claim the Enso path is live in this repo today,
4. claim a no-approval smart-wallet path unless the exact `delegate` branch is separately proven,
5. widen into `apps/web/**`, CRE, `XSL-006A`, or right-rail UI work,
6. or collapse Enso, LI.FI, 1inch, and CoW into one generic routing claim.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why duplication is or is not justified |
| --- | --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | canonical owner for execution, funding, and deposit rails | update | `XSL-005` already owns funding and deposit truth, so Enso stays under it |
| [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md) | sibling supporting spec for the same one-USDC-to-portfolio ask under LI.FI | reuse and compare | this Enso spec is justified because the vendor-truth and approval model are materially different: atomic bundle versus sequential per-leg routes |
| [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md) | frozen owner pointer for completed `XSL-014A` route design | reuse as-is | this spec must not reopen generic execution-venue design |
| [2026-04-02-xstocks-default-basket-venue-routed-readiness.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-02-xstocks-default-basket-venue-routed-readiness.md) | completed proof that the promoted `c5` basket is venue-routed through `1inch.ethereum` for six core legs | reuse | this remains the current proven baseline that Enso must coexist with |
| [2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md) | active current signer-proof residual for 1inch | reuse | Enso atomic deposit work is a different lane above the current explicit 1inch proof |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | smart-account and signer-boundary support spec under `XSL-005` | reuse | the Enso `delegate` path would depend on the same smart-account truth, but it is not the default claim for this spec |
| [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md) | canonical owner and executor map | update | this lane needs a distinct `XSL-005B` issue under the same owner |
| [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) | new supporting spec for Enso atomic deposit truth | create alongside | the atomic bundle posture is materially different enough from LI.FI and 1inch to justify a separate supporting spec under the same owner |

## User Vision Freeze

1. The user wants one flow where someone starts with `USDC` and deposits into all assets of the promoted or default portfolio.
2. The user wants the portfolio flow, not one token at a time.
3. The user specifically expects Enso to be able to do this as a one-transaction multi-deposit.
4. The user does not want the request softened into a different product.
5. Approval truth must stay explicit and user-owned.

## Current Live Truth

1. Current repo truth still makes `1inch.ethereum` the proven promoted-basket execution route for the six actionable `core_xstocks` legs, while the `AUSD` yield-buffer sleeve remains separate from that signer-owned claim.
2. The current promoted default basket at [current.json](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/manifests/promoted/onboarding.default_basket/current.json) still targets six core xStocks plus one `AUSD` yield-buffer sleeve.
3. Enso’s docs explicitly state that the `bundle` API executes multi-action workflows atomically and returns executable transaction calldata. See [Bundling Actions](https://docs.enso.build/pages/build/get-started/bundling-actions) and [Shortcuts Library](https://docs.enso.build/pages/build/examples/shortcuts).
4. Enso’s official examples explicitly show one-transaction multi-position entry, splitting one input across several downstream positions. See [Shortcuts Library](https://docs.enso.build/pages/build/examples/shortcuts).
5. Enso’s official examples also show one-input multi-output flows using `split`, including a `USDC -> AUSD + USDC` LP zap in a single bundle. See [Shortcuts Library](https://docs.enso.build/pages/build/examples/shortcuts).
6. Enso’s routing-strategies docs say EOA `router` mode requires approving the Enso router contract for input tokens and then signing the route or bundle transaction, while smart-wallet `delegate` mode does not require prior approvals. See [Routing Strategies](https://docs.enso.build/pages/build/reference/routing-strategies), [FAQ](https://docs.enso.build/pages/build/reference/faq), and [Approve Enso contract](https://docs.enso.build/api-reference/defi-shortcuts/approve-enso-contract).
7. This means Enso is the first provider truth in this repo pass that can legitimately target the atomic ask. It does not mean the repo may already claim the Enso lane is live.
8. Current repo truth does not yet contain any Enso SDK, Enso bundle contract, Enso proof harness, or Enso-specific artifact schema.

## Current Local Implementation Audit

| Area | Shipped | Partial | Missing or stale |
| --- | --- | --- | --- |
| Manifest and policy truth | promoted basket weights, `USDC` funding asset, current 1inch and Flowdesk route truth | current basket already defines the exact target map an Enso bundle would need to hit | no Enso-specific route or bundle representation in manifests or policy |
| Shared execution substrate | request and leg contracts persist detailed quote, approval, venue-status, and receipt truth | existing contract surface can host a request-level wrapper plus per-action artifacts | no Enso `bundle`, `split`, `route`, or `deposit` artifact schema |
| API runtime | explicit 1inch and CoW venue paths exist | wallet and signer truth are already explicit enough to support an EOA-first Enso design | no Enso client, no bundle planner, no output-verification logic for a one-transaction multi-deposit |
| Tests and proof | current policy and API tests already prove the promoted basket split and current execution baseline | none of those tests cover Enso-specific bundle behavior | no Enso proof runner, no EOA approval plus bundle proof, no delegate smart-wallet proof |

## Product Outcome Contract

Current repo live claim:
1. none beyond planning. The repo does not yet integrate Enso.

Target truthful product claim if this lane closes:

`Start with USDC and prepare an Enso bundle that splits your input across every promoted portfolio target and executes the portfolio multi-deposit in one transaction. You will approve the starting USDC and sign the bundle transaction with your connected wallet. Nothing executes without your approval.`

Claim boundary:
1. This is the first spec in this repo pass that can legitimately target the user’s atomic ask.
2. This does not mean the repo may claim the Enso lane is live before the exact promoted basket is proven end to end.
3. This does not mean the smart-wallet `delegate` path is the default claim; current truthful default remains the wallet-first EOA `router` posture unless the delegate branch is separately proven.

## User-Journey Contract

1. The user qualifies into the promoted default basket and chooses a `USDC` deposit amount once.
2. The system derives one atomic Enso bundle plan for every required portfolio target, including the yield-buffer sleeve.
3. The surface shows the exact target split, bundle posture, and approval model before any transaction is sent.
4. Under the default EOA `router` posture, the user approves the starting `USDC` for Enso and then signs one bundle transaction.
5. The bundle executes the split, routes, and downstream deposit actions in one transaction.
6. The system verifies the outputs for every target asset or sleeve before calling the deposit complete.
7. If any action in the bundle cannot be resolved or would revert, the system fails closed before submission and preserves the exact blocker.

## State-And-Truth Contract

### Enso role classification

| Enso role | Current truthful status | Claim allowed now |
| --- | --- | --- |
| Atomic bundle orchestration layer for one-USDC multi-deposit | externally validated by official docs, not yet repo-proven | yes, as the intended Enso design |
| Current live promoted-basket execution venue in this repo | not proven | no |
| Smart-wallet `delegate` no-approval path | externally documented, not yet repo-proven for the Privy branch | no as default claim |

### Promoted default basket target map

| Portfolio target | Weight pct | Current repo baseline | Enso bundle requirement |
| --- | ---: | --- | --- |
| `NVDAx` | `18.0000` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `NVDAx` |
| `MSFTx` | `16.4382` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `MSFTx` |
| `AAPLx` | `15.7461` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `AAPLx` |
| `METAx` | `15.4000` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `METAx` |
| `AMZNx` | `14.8809` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `AMZNx` |
| `GOOGLx` | `14.5348` | `1inch.ethereum` core proof exists | one bundle output or downstream action must produce `GOOGLx` |
| `AUSD` / `flowdesk.ausd-rwa-strategy` | `5.0000` | separate yield-buffer sleeve | one bundle output or downstream action must acquire `AUSD` and then settle the Flowdesk sleeve truthfully |

### Exact bundle posture

1. The Enso `bundle` API, not the simple `route` API, owns this lane because the current ask is one input spread across several outputs or positions.
2. The truthful bundle design must include either:
   one direct `split` from `USDC` into final xStocks plus `AUSD` outputs, followed by a Flowdesk deposit action for the `AUSD` output,
   or one weighted split of `USDC` plus chained `route` and `deposit` actions using `useOutputOfCallAt`.
3. The technical target is still the same whole portfolio:
   six core xStocks outputs plus the yield-buffer sleeve.
4. If implementation cannot include the yield-buffer sleeve in the same bundle, the product may not call the result `all assets of the portfolio`.

### Truthful approval model

1. The default truthful approval model for this Enso lane is:
   one approval for the starting `USDC` plus one bundle transaction signature.
2. The exact default copy is:
   `You will approve the starting USDC and sign the bundle transaction with your connected wallet. Nothing executes without your approval.`
3. The stronger `delegate` copy is blocked until smart-wallet proof exists:
   `You will sign the bundle transaction with your connected wallet. Nothing executes without your approval.`
4. No surface may imply hidden custody, silent execution, or background multi-transaction fan-out if the actual path is one approval plus one bundle transaction.

### Exact product copy contract

Allowed copy:
1. `Deposit USDC into this portfolio in one transaction`
2. `We'll build one Enso bundle across the portfolio targets before you approve and sign it.`
3. `You will approve the starting USDC and sign the bundle transaction with your connected wallet. Nothing executes without your approval.`

Disallowed copy:
1. `Already live`
2. `No approval needed`
3. `Enso replaces 1inch everywhere in the app`
4. `Autonomous basket execution`

## 1inch / Enso Coexistence Contract

| Dimension | Current 1inch lane truth | Proposed Enso lane truth | What improves | What remains manual or unclaimable |
| --- | --- | --- | --- | --- |
| Owner | `XSL-014` signer-proof family above frozen `XSL-014A` substrate | supporting atomic bundle lane under `XSL-005B` | no duplicate owners | Enso does not reopen `XSL-014A` |
| Current role | explicit per-leg execution venue for six core xStocks | one-transaction portfolio-deposit orchestrator | the atomic user ask can be targeted directly | current repo still cannot claim Enso is live |
| Approval model | per-leg signer-owned approvals | one `USDC` approval plus one bundle tx in default EOA posture | fewer user actions if implementation proves out | `delegate` no-approval path stays unclaimed by default |
| Atomicity | not claimed | vendor docs support the shape | matches the user’s atomic ask | repo proof is still required before any live claim |
| Yield buffer | separate from current 1inch core claim | must be included inside the same bundle or the product cannot call it whole-portfolio | closes the missing whole-portfolio contract | cannot silently omit the sleeve |
| Underlying venue truth | explicit `1inch.ethereum` and current CoW truth remain separately named | Enso abstracts the internal action plan behind the bundle | product can sell the deposit workflow instead of explicit per-leg venue routing | do not collapse Enso, 1inch, and CoW into one claim |

## Proof Artifacts

Request-level artifacts that must persist:
1. one bundle-plan id or adjacent execution-request id,
2. `activationId`, `manifestId`, `slotId`, `requestedNotionalUsd`, and funding asset `USDC`,
3. full bundle action array, including action order and protocol slugs,
4. chosen `routingStrategy`,
5. approval-data artifact for the starting `USDC` when `router` is used,
6. bundle transaction payload, gas estimate, and `tx.to`,
7. one main transaction hash for the bundle submission,
8. post-trade output verification for every target asset or sleeve.

Action-level artifacts that must persist:
1. action index and action type such as `split`, `route`, or `deposit`,
2. expected input or output amounts,
3. `useOutputOfCallAt` references where one action feeds the next,
4. target token or position addresses and primary protocol addresses,
5. simulation result or exact revert reason,
6. per-action output validation, even though the bundle submits as one main transaction.

Persistence rule:
1. This lane needs a request-level atomic-bundle artifact surface above the current explicit per-leg venue contract.
2. Do not pretend Enso is just another `oneinch_fusion` leg.
3. The final data model may still fan out into portfolio-target children for reporting, but the main truth surface is one bundle plus verified outputs.

## Verification / Proof Plan

Implementation proof phases:
1. Add a minimal shared bundle artifact contract for Enso plans, approvals, actions, and output verification.
2. Add policy tests proving the promoted basket split still resolves to the same seven targets and that the atomic copy gate is honest.
3. Add API integration tests proving one `USDC` bundle plan can represent every required target or sleeve in one request.
4. Add an Enso proof runner that captures:
   approval data for `USDC`,
   bundle calldata and gas,
   one signed bundle submission,
   and output verification for every target or sleeve.
5. Only close the `one transaction` claim if one main transaction hash on the exact promoted basket yields every required target output or sleeve settlement.
6. Keep the `delegate` no-approval branch as a separate later proof item under the smart-account boundary.

Minimum verification commands for the implementation lane:
1. `pnpm --filter @xstocks/policy test`
2. `pnpm --filter @xstocks-strategy-lab/shared build`
3. `node --test apps/api/test/api.test.js`
4. `node apps/api/scripts/enso-portfolio-multideposit-proof.js`
5. `git diff --check`

Proof gates:
1. `one transaction claim = blocked` unless one exact main transaction hash settles the whole promoted basket.
2. `whole portfolio claim = blocked` unless the yield-buffer sleeve is included truthfully.
3. `delegate no-approval claim = blocked` unless the smart-wallet branch is proven separately.

## Acceptance Criteria

1. The repo records this as `XSL-005B` under `XSL-005`, not as a new `XSL-014` sub-lane.
2. The spec freezes the exact Enso atomic-bundle product claim and its current repo-live boundary.
3. The spec freezes the exact promoted default basket targets and the requirement to include the yield-buffer sleeve.
4. The spec freezes the exact default approval model and exact user-facing copy for the Enso lane.
5. The spec defines the request-level bundle artifacts and action-level verification artifacts that must persist.
6. The coexistence boundary with current 1inch and CoW truth is explicit and non-vague.
7. The next implementation lane is bounded to shared contracts, policy, API, proof harness, and the narrow docs needed for `XSL-005B`.

## Continuation Note

1. The repo now includes the canonical proof harness at [enso-portfolio-multideposit-proof.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/scripts/enso-portfolio-multideposit-proof.js), so this lane is no longer blocked on missing runner code.
2. The old env blocker is now closed, and the first live rerun [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-portfolio-2026-04-03T21-02-14.442Z/summary.json) exposed a repo bug: the Enso approval client still called dead endpoint `/api/v1/shortcuts/approve`.
3. That approval-path bug is now fixed in repo code. The latest promoted-basket rerun [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/enso-portfolio-2026-04-03T21-05-06.597Z/summary.json) proves the next exact blocker is upstream route availability plus basket composition, not missing env.
4. Direct upstream isolation in [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-enso-live-proof-refresh/summary.md) shows `NVDAx` and `AMZNx` quote individually, while `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx` each fail with `Swap not found for a required underlying of defi route...`; wrapper-address retries for those failing names also fail.
5. `AUSD` still lacks the Ethereum execution/payment metadata required for this lane, so the exact promoted basket remains unproven and this lane must not replace hosted `1inch` as the public-default route.
