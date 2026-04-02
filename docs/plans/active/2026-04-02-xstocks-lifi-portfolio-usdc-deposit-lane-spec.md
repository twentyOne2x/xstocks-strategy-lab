# xStocks LI.FI Portfolio USDC Deposit Lane Spec

Date: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-005A` under `XSL-005`
Canonical owner lane: `XSL-005`
Related proof lane: `XSL-014` remains the current `1inch.ethereum` signer-proof family only

## Goal

Freeze the requested LI.FI-based portfolio-deposit lane without implementing it by:
1. preserving the exact user vision that a person starts with `USDC` and deposits into all assets of the promoted or default xStocks portfolio,
2. deciding whether the repo can truthfully claim one atomic basket transaction today,
3. freezing the strongest truthful product claim, approval model, leg map, artifact contract, and proof plan if that atomic claim is not yet proven,
4. and keeping this work as a funding or deposit extension under `XSL-005` instead of reopening completed `XSL-014A` route design.

## Non-goals

This pass does not:
1. implement LI.FI integration,
2. reopen `XSL-014A` venue-routing design,
3. claim single-signature or single-click whole-basket execution unless exact proof exists,
4. collapse LI.FI, 1inch, CoW, and bridge or funding truth into one vague `router` claim,
5. widen into CRE, `XSL-006A`, or right-rail UI implementation,
6. or silently reframe the user request into one-token-at-a-time trading.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why duplication is or is not justified |
| --- | --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | canonical owner for execution, funding, and deposit rails | update | `XSL-005` already owns LI.FI as bridge or funding truth, so this lane should stay under it |
| [2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-venue-routed-mainnet-execution-spec.md) | frozen owner pointer for completed `XSL-014A` route design | reuse as-is | the user explicitly said not to reopen generic route-design work |
| [2026-04-02-xstocks-default-basket-venue-routed-readiness.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-02-xstocks-default-basket-venue-routed-readiness.md) | completed proof that the promoted `c5` basket is venue-routed through `1inch.ethereum` for six core legs | reuse | this is the baseline coexistence truth, not the owner for LI.FI deposit planning |
| [2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-oneinch-hosted-session-backed-signer-proof.md) | active signer-proof residual for `1inch.ethereum` | reuse | LI.FI deposit work must not hijack the current 1inch signer-proof lane |
| [2026-04-01-xstocks-provider-to-execution-handoff-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-provider-to-execution-handoff-spec.md) | separate provider intake to execution-request join | reuse | LI.FI deposit planning is a different downstream funding lane, not provider ingress |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | smart-account and signer-boundary support spec under `XSL-005` | reuse | the approval and signer truth still depends on the same wallet-first manual posture |
| [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md) | canonical owner and executor map | update | this lane needs a distinct `XSL-005A` entry under the same owner |
| [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md) | new supporting spec for LI.FI deposit truth | create alongside | the ask is new, but it is a downstream funding or deposit lane under `XSL-005`, not a new top-level owner or an `XSL-014` sub-lane |

## User Vision Freeze

1. The user wants one flow where someone starts with `USDC` and deposits into all assets of the promoted or default portfolio.
2. The user wants this for the promoted or default portfolio use case, not one token at a time.
3. The user expects one atomic transaction only if that claim can be made truthful.
4. The user explicitly does not want the request reframed into a different product.
5. Until stronger proof exists, the approval caveat must stay exact:
   `You will sign each trade with your connected wallet. Nothing executes without your approval.`

## Current Live Truth

1. Repo truth already sets LI.FI as the preferred bridge or funding provider in [manifest.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/manifest.js), current promoted manifests, and worker snapshots, but not as the current promoted-basket execution venue.
2. The current promoted default basket at [current.json](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/research/manifests/promoted/onboarding.default_basket/current.json) uses `USDC` as the funding asset, routes `core_xstocks` through `1inch.ethereum`, and routes `yield_buffer` through `flowdesk.ausd-rwa-strategy`.
3. `XSL-014B` already proved the six actionable `core_xstocks` legs for the promoted `c5` basket through the `awaiting_approval` boundary on `1inch.ethereum`, while the `AUSD` yield-buffer sleeve remains intentionally deferred or manual in that proof.
4. Current shared execution truth is explicitly per-leg and signer-owned: [execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts) persists `quote`, `approval`, `venueStatus`, `receipt`, and `trade` on each leg, and current venue signing mode remains `wallet_signer_manual_only`.
5. `XSL-014A` is completed and frozen and must not be reopened as generic route-design work.
6. LI.FI route execution is officially modeled as approval-aware routes or steps rather than a repo-proven xStocks whole-basket venue today. See [LI.FI route execution docs](https://docs.li.fi/agents/workflows/route-execution) and [LI.FI approvals docs](https://docs.li.fi/agents/workflows/approvals).
7. LI.FI Composer can offer a one-transaction deposit only when the destination is a supported tokenized protocol position and the integration is added to Composer. See [Composer overview](https://docs.li.fi/composer/overview/) and [Composer integration guide](https://docs.li.fi/composer/for-protocols/integration-guide). The current promoted xStocks basket is direct multi-asset holdings, not one supported tokenized position.
8. LI.FI Intents supports multiple outputs, but the official swap docs say outputs are filled sequentially and may execute out of order, which is not the same as one atomic basket deposit. See [LI.FI Intents multi-output swap docs](https://docs.li.fi/lifi-intents/for-developers/swap).
9. Therefore the requested `one atomic transaction from USDC into the whole promoted basket` claim is not proven on current product shape or current repo truth.

## Current Local Implementation Audit

| Area | Shipped | Partial | Missing or stale |
| --- | --- | --- | --- |
| Manifest and policy truth | `preferredBridgeProvider = "lifi"`, funding asset `USDC`, current promoted basket weights, route truth for `1inch.ethereum` and Flowdesk | LI.FI is only expressed as bridge or funding preference, not as a basket-deposit artifact contract | no LI.FI-specific portfolio-deposit route, step, or approval schema |
| Shared execution substrate | request and leg contracts persist `quote`, `approval`, `venueStatus`, `receipt`, `trade`, and linkage per leg | current schema is generic enough to extend for a new deposit lane | no LI.FI route or step payload shape and no request-level portfolio-deposit aggregate contract |
| API runtime | 1inch and CoW venue-routed quote, approval, submission, and receipt handling already exist | funding copy and bridge provider truth already mention LI.FI | no LI.FI SDK or client, no USDC split planner for all basket legs, no LI.FI proof harness |
| Tests and proof | policy and worker tests already assert `preferredBridgeProvider` and `bridgeProvider` as `lifi`; 1inch proof artifacts exist for the promoted basket | LI.FI only appears in funding defaults, not in route execution tests | no LI.FI route audit, no approval-address audit, no atomic portfolio-deposit proof |

## Product Outcome Contract

The exact truthful product claim for this lane is:

`Start with USDC and prepare a LI.FI-powered deposit plan for the promoted default portfolio. We will split your USDC across the target weights and stage each required routed trade or deposit leg. You will sign each trade with your connected wallet. Nothing executes without your approval.`

Claim boundary:
1. This does mean one starting asset, one portfolio split, and one coordinated deposit flow for the promoted default basket.
2. This does not mean LI.FI replaces the current proven `1inch.ethereum` execution venue for the core xStocks proof lane.
3. This does not mean the repo may truthfully claim one magical single-signature or single-click whole-basket execution today.
4. The atomic one-transaction variant is allowed only after the exact promoted basket is backed by a proven single-position or custom basket-deposit contract path.

## User-Journey Contract

1. The user qualifies into the promoted default basket and lands on the activation flow with `USDC` as the starting asset.
2. The activation surface shows the exact portfolio split and the technical leg map needed to reach every target asset or sleeve.
3. The user enters a `USDC` notional once.
4. The system derives one portfolio-deposit plan from that one `USDC` input.
5. The system stages each required LI.FI route or deposit leg, including route provider, expected input or output amounts, and approval requirements.
6. The user approves any required allowance transactions and signs each routed trade or deposit transaction that is actually required.
7. The system tracks every leg through `quote_ready`, `awaiting_approval`, `submitted`, `confirmed`, or exact blocker state.
8. The product only says the portfolio deposit completed when every required leg has a real receipt or an exact unresolved blocker is surfaced.

## State-And-Truth Contract

### LI.FI role classification

| LI.FI role | Current truthful status | Claim allowed now |
| --- | --- | --- |
| Bridge or funding pre-step | already in repo truth | yes |
| Same-chain multi-route swap planner for one-USDC portfolio deposit | valid future extension under `XSL-005A` | yes, as planned but not yet implemented |
| True execution-venue replacement for the current promoted basket | not proven | no |
| Atomic one-transaction whole-basket xStocks deposit | not proven on current product shape | no |

### Promoted default basket target map

| Portfolio target | Weight pct | Current route truth | LI.FI deposit-lane requirement |
| --- | ---: | --- | --- |
| `NVDAx` | `18.0000` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> NVDAx` route leg |
| `MSFTx` | `16.4382` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> MSFTx` route leg |
| `AAPLx` | `15.7461` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> AAPLx` route leg |
| `METAx` | `15.4000` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> METAx` route leg |
| `AMZNx` | `14.8809` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> AMZNx` route leg |
| `GOOGLx` | `14.5348` | `1inch.ethereum` proof to `awaiting_approval` exists | same-chain `USDC -> GOOGLx` route leg |
| `AUSD` / `flowdesk.ausd-rwa-strategy` | `5.0000` | yield-buffer sleeve remains separate from the current signer-owned 1inch core proof | same-chain `USDC -> AUSD` route plus truthful Flowdesk deposit leg unless a different direct sleeve settlement path is proven |

Technical leg count:
1. The truthful technical plan is at least seven legs and likely eight technical steps today:
   six core xStocks swap legs, one `USDC -> AUSD` leg, and one Flowdesk deposit leg.
2. If implementation cannot include the yield-buffer sleeve, the product may not call the result `all assets of the portfolio`.

### Truthful approval model

1. The default truthful approval model for this request is per-leg user approval.
2. A LI.FI route-based implementation may require one ERC-20 approval transaction per distinct `approvalAddress` or spender plus one user-signed main transaction per routed leg.
3. If later proof shows all same-chain legs reuse one spender and one allowance, the claim may strengthen only to `one allowance approval plus multiple route submissions`.
4. The claim may strengthen to `one approval plus one routed deposit transaction` only after the exact promoted basket is proven through a Composer-compatible or custom basket-deposit contract path.
5. Until then the approval caveat must remain exact:
   `You will sign each trade with your connected wallet. Nothing executes without your approval.`

### Exact product copy contract

Allowed copy:
1. `Deposit USDC into this portfolio`
2. `We'll split your USDC across the portfolio targets and prepare each routed trade for your approval.`
3. `You will sign each trade with your connected wallet. Nothing executes without your approval.`

Disallowed copy:
1. `Buy the whole basket in one click`
2. `Single-signature basket deposit`
3. `Atomic whole-portfolio execution`
4. `LI.FI executes the entire basket for you`

## 1inch / LI.FI Coexistence Contract

| Dimension | Current 1inch lane truth | Proposed LI.FI lane truth | What improves | What remains manual or unclaimable |
| --- | --- | --- | --- | --- |
| Owner | `XSL-014` signer-proof family on top of frozen `XSL-014A` substrate | supporting deposit lane under `XSL-005A` | ownership stays non-duplicative | LI.FI does not hijack `XSL-014` |
| Current role | proven core-xStocks venue route to `awaiting_approval` | preferred bridge or funding provider, plus planned basket-deposit coordinator | one `USDC` starting asset and one split plan | LI.FI is not yet the proven core execution venue |
| Approval model | per-leg signer-owned EIP-712 approval on `1inch.ethereum` | per-leg route approvals unless stronger proof exists | one portfolio-level split plan can sit above current leg execution truth | no single-signature basket claim |
| Yield buffer | `AUSD` sleeve intentionally deferred or manual in current 1inch proof | must be modeled explicitly as part of the whole-portfolio deposit request | closes the missing `all assets` planning gap | cannot call the flow whole-portfolio if the sleeve is omitted |
| Atomicity | not claimed | not claimed on current truth | future atomic path can be specified as a proof gate | current product may not claim one transaction for the whole basket |
| CoW relationship | existing alternative execution venue truth still exists elsewhere in repo | unaffected | no vague router language | LI.FI does not collapse CoW and 1inch into one claim |

## Proof Artifacts

Request-level artifacts that must persist:
1. one deposit-plan id or adjacent execution-request id,
2. `activationId`, `manifestId`, `slotId`, `requestedNotionalUsd`, and funding asset `USDC`,
3. the exact portfolio split snapshot used for the run,
4. `manualSignerAddress`, `policyAccountAddress`, and `executionDestinationAddress`,
5. aggregate deposit-plan status and exact blocker summary.

Per-leg artifacts that must persist:
1. `legId`, `sequence`, `sleeve`, `assetSymbol` or `venueId`, and `requiredRouteId`,
2. LI.FI `routeId`, `stepId`, or equivalent quote identifiers,
3. full route or quote snapshot, including tool or provider, expected input or output amounts, `approvalAddress`, and `transactionRequest`,
4. approval payload artifact, including token, spender, amount, and prepared approval transaction if one is required,
5. user-approval artifact: approval tx hash or approval timestamp plus main transaction signature or submission payload,
6. submission artifact: transaction hash, venue order id if any, and raw submission response,
7. receipt or settlement artifact: receipt status, confirmed or reverted timestamps, raw receipt, and explorer links,
8. blocker artifact: exact route, approval, submission, or settlement failure with raw status preserved.

Persistence rule:
1. If this lane reuses the existing execution leg contract, LI.FI artifacts must extend `quote`, `approval`, `venueStatus`, `receipt`, and `trade` truthfully.
2. If LI.FI needs a multi-step deposit object above current execution legs, add a dedicated request-level `depositPlan` wrapper plus per-step artifact children instead of overloading `oneinch_fusion`.

## Verification / Proof Plan

Implementation proof phases:
1. Add the minimal shared contract for LI.FI route or step artifacts and the request-level deposit-plan wrapper if needed.
2. Add policy tests proving the exact `USDC` split and the truthful approval-copy gate.
3. Add API integration tests proving one deposit-plan request fans out into every required promoted-basket leg, including the yield-buffer sleeve.
4. Add a LI.FI proof runner that captures route responses, distinct `approvalAddress` values, user-approval requirements, submissions, and receipts or exact blockers.
5. Only close an atomic claim if one exact main transaction hash on the exact promoted basket produces every required target output; otherwise close only the sequential per-leg claim.

Minimum verification commands for the implementation lane:
1. `pnpm --filter @xstocks/policy test`
2. `pnpm --filter @xstocks-strategy-lab/shared build`
3. `node --test apps/api/test/api.test.js`
4. `node apps/api/scripts/lifi-portfolio-deposit-proof.js`
5. `git diff --check`

Proof gates:
1. `atomic whole-basket claim = blocked` unless one exact promoted-basket proof produces one main transaction hash and all required outputs.
2. `whole-portfolio claim = blocked` unless the yield-buffer sleeve is included truthfully.
3. `single approval claim = blocked` unless the proof bundle shows one shared spender or one exact approved batch path.

## Acceptance Criteria

1. The repo records this as `XSL-005A` under `XSL-005`, not as a new `XSL-014` sub-lane.
2. The exact truthful product claim for a LI.FI portfolio deposit flow is frozen and stays honest about current approval behavior.
3. The repo explicitly classifies LI.FI here as bridge or funding truth today and a planned same-chain deposit coordinator, not a proven execution-venue replacement.
4. The promoted default basket leg map is explicit for all six core xStocks names and the yield-buffer sleeve.
5. The truthful approval model is explicit and keeps the exact required approval caveat unless stronger proof exists.
6. The per-leg artifact contract is explicit about quote or route ids, approval payloads, user approvals, submission hashes, receipts, and blockers.
7. The coexistence boundary with current 1inch and CoW truth is explicit and non-duplicative.
8. Atomic one-transaction basket language remains blocked until the exact promoted basket proves it.
9. The next implementation lane is bounded to shared contracts, policy, API, proof harness, and the narrow docs needed for `XSL-005A`.
