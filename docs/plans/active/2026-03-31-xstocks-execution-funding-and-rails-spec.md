# xStocks Execution, Funding, And Live Rails Spec

Date: 2026-03-31
Owner: Codex
Status: active
Canonical issue: `XSL-005`

## Goal

Freeze the truthful execution, funding, and deposit-rail boundary for xStocks so the repo can say exactly:
1. what works locally,
2. what works on the deployed Railway and Vercel hosts,
3. whether the current Ethereum CoW lane is linked-wallet-first or smart-account-required,
4. what proof is still missing before `live execution works` can be claimed,
5. and whether Mesh exists, is deferred, or is explicitly absent.

## Non-goals

This workstream does not:
1. duplicate the authenticated execution proof lane in `XSL-014`,
2. replace the narrow Privy boundary sub-spec,
3. reopen CRE as a second execution umbrella,
4. claim Mesh before a repo-owned UI and backend contract exist,
5. treat partial quoteability as full production execution closure.

## Existing-Spec Inventory

| Artifact | Current role | Decision |
| --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | canonical owner for execution, funding, and deposit rails | update and keep canonical |
| [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md) | supporting LI.FI funding and deposit lane for one-USDC-to-portfolio intent | create alongside under `XSL-005`; do not move to `XSL-014` |
| [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) | supporting Enso atomic bundle lane for one-USDC-to-portfolio intent | create alongside under `XSL-005`; do not move to `XSL-014` |
| [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md) | downstream proof lane for real authenticated hosted execution | reuse; do not absorb |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | narrow Privy posture sub-lane | reuse; keep adjacent, not separate owner |
| [2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-rebalance-cow-manual-and-chainlink-boundary.md) | completed manual CoW baseline | reuse as historical proof |
| [2026-04-01-xstocks-public-safe-agent-handoff-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-public-safe-agent-handoff-boundary.md) | public-safe preview boundary | reuse for public execution-stop conditions |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | agent smoke coverage | support this owner lane; do not duplicate agent rules here |

## Current / Live Truth

1. On 2026-04-01 `https://equityterminal.app` serves the canonical frontend on Vercel, but same-host `https://equityterminal.app/api/*` returns `404`.
2. On 2026-04-01 `https://api-production-e70b.up.railway.app` serves `/health` and `/api/catalog`, proving the deployed API host is Railway, not Vercel.
3. The local repo contains `GET /api/public-agent-handoff` and `/api/runtime/autoresearch`, but the deployed Railway host returns `{"error":"Route not found."}` for both, so deployed parity is stale.
4. The current hosted execution lane is stronger than the old gap wording but still open: a real authenticated activation save and execution-request creation happened on 2026-04-01, and one basket leg reached the live quote or approval boundary, but the basket does not yet have a full all-leg quote, signed submission, and settlement proof.
5. Current catalog metadata still says `requiresSmartAccount=true` and `minFundingUsd=1000` for the promoted basket lane, while [readiness-policy.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/readiness-policy.js) and the latest hosted activation truth behave as linked-wallet-first with `requiresSmartAccount=false` and `minFundingUsd=0`.
6. The current truthful posture is therefore: the live lane can advance without a smart account, but public and manifest surfaces are not yet fully aligned to that truth.
7. Local Privy code is real in [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx), [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx), and [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js). The remaining gap is proof and canonical posture, not mere scaffolding.
8. The product already names Privy wallet or funding options and manual transfer paths in policy output, but Mesh does not exist as a repo-owned UI or backend contract.
9. No truthful public Mesh claim is currently allowed.

## Current Local Implementation Audit

| Area | Shipped | Partial | Missing or stale |
| --- | --- | --- | --- |
| CoW execution | execution requests, quote/approval/submission bookkeeping, manual proof bundle | hosted all-leg quoteability, route-correct leg diagnostics | full user-approved hosted settlement proof |
| Privy auth and wallet | real frontend provider, real auth verification, linked-wallet proof | canonical public posture, smart-account proof branch | smart-account-required live proof |
| Funding rails | policy-level funding requirement and wallet-state shaping, `preferredBridgeProvider = "lifi"` in promoted manifests and policy defaults | deployed UI parity, explicit LI.FI deposit-boundary language, exact public deposit copy | LI.FI deposit planner or artifact contract, Mesh integration |
| Production host ownership | Railway API and Vercel frontend split is observable | route reachability and docs are not yet aligned | same-host public execution helper parity |

## 2026-04-02 LI.FI Deposit Addendum

1. Current repo truth already treats LI.FI as the preferred bridge or funding provider in manifests, policy defaults, and worker snapshots, but not as the current proven promoted-basket execution venue.
2. Current promoted default-basket truth remains `1inch.ethereum` for the six actionable `core_xstocks` legs and `flowdesk.ausd-rwa-strategy` for the `yield_buffer` sleeve.
3. `XSL-014A` route design is completed and frozen. A LI.FI basket ask is therefore valid only as a new downstream funding or deposit lane under `XSL-005`, not as a reopened venue-routing owner.
4. Supporting spec [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md) now owns the exact LI.FI deposit claim, approval model, leg map, artifact contract, and coexistence boundary with current `1inch.ethereum` and CoW truth.
5. Supporting spec [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md) now owns the Enso atomic bundle interpretation of the same one-USDC-to-portfolio ask.
6. Enso is the first external provider truth in this repo pass that can legitimately target the atomic ask, because the official Enso docs show one-transaction bundle workflows that split one input across several downstream positions.
7. Until stronger repo proof exists, no surface may claim either LI.FI or Enso is already live for the promoted multi-asset xStocks basket, and no surface may blur their different approval models into one generic `router` statement.

## Product Outcome Contract

When this lane closes:
1. the repo has one canonical current execution branch for the Ethereum basket lane,
2. public, API, and runtime surfaces agree on whether the lane is linked-wallet-first, smart-account-optional, or smart-account-required,
3. `live execution works` has one exact proof bar and one lower claim bar for partial hosted proof,
4. deposit and funding rails say exactly what exists now and what is deferred,
5. Mesh is either still explicitly absent or proven through a real UI/backend contract before any public claim.

## State-And-Truth Contract

| Layer | Source of truth | Current claim allowed |
| --- | --- | --- |
| Manifest metadata | promoted manifest and catalog payload | `declared requirement` only |
| Effective readiness | activation preview and derived execution plan | `current runtime requirement` |
| Saved activation snapshot | persisted activation on Railway runtime store | `hosted activation boundary proven` |
| Execution request and venue response | persisted execution request plus CoW response | `quote or approval boundary proven` |
| Signed submission and settlement | order UID, tx hash, receipt, or settled state | `live execution works` |

Truth rules:
1. Effective readiness outranks stale manifest metadata when the deployed readiness engine and persisted runtime state disagree.
2. `linked wallet live` may be claimed only if hosted proof reaches the next truthful boundary without a smart wallet.
3. `smart wallet live` may be claimed only if a hosted proof bundle shows the smart-wallet branch is actually required or actually used.
4. `live execution works` requires more than activation save or one quoted leg; it requires the full execution proof contract below.
5. Mesh may not be named as a deposit rail in public product language until the UI and backend contract are both real.

## Proof / Measurement Contract

| Claim level | Required proof | Current status |
| --- | --- | --- |
| `linked-wallet activation ready` | hosted activation save and execution create without smart wallet | proven |
| `hosted CoW quote boundary` | real venue response for the promoted execution request | partially proven |
| `live execution works` | hosted activation save, all-leg quoteability or explicit resolved blockers, user approval, order submission, and receipt or settlement proof | not yet proven |
| `smart wallet required or live` | hosted smart-wallet bootstrap plus execution proof on that branch | not proven |
| `Mesh live` | deployed UI choice, backend contract, runtime receipt, and public copy proof | not implemented |

Exact proof needed before the repo may say `live execution works`:
1. one authenticated hosted activation save on the canonical production host,
2. one hosted execution request on that activation,
3. truthful per-leg venue diagnostics with no hidden `smart_account_required` fallback,
4. one user-approved submission that produces an order UID or transaction hash,
5. one downstream receipt or exact external blocker at the venue or chain boundary.

## Acceptance Criteria

1. The canonical execution branch for the current Ethereum basket lane is explicit and matches deployed truth.
2. Manifest metadata, activation preview, and hosted runtime proof no longer disagree silently about smart-account or funding requirements.
3. The strongest claim the repo makes about CoW execution matches the furthest hosted proof actually reached.
4. The current linked-wallet versus smart-account boundary is explicit in product, docs, and agent surfaces.
5. Funding and deposit copy matches repo-owned rails only.
6. Mesh is classified explicitly as absent, deferred, or live with proof.
7. Agent surfaces can verify the public deposit boundary and the internal execution boundary without mixing them.

## Blocker Taxonomy

1. `manifest_vs_readiness_drift`
2. `public_vs_deployed_api_origin_gap`
3. `partial_hosted_quoteability_only`
4. `smart_account_posture_unresolved`
5. `missing_mesh_contract`
6. `missing_public_handoff_parity`

## Rollback / Recovery Contract

1. If hosted proof regresses, downgrade public claims to the lower proven boundary immediately.
2. If manifest metadata remains stale while runtime truth changes, remove the stale user-facing implication instead of preserving both.
3. If the smart-account branch remains unproven, keep it optional or future-facing and do not require it in public copy.
4. If deposit-rail work stalls, keep Mesh explicitly absent rather than vague.

## Exact Test / Verification Commands

1. `node --test packages/policy/test/policy.test.js`
2. `node --test apps/api/test/api.test.js`
3. `curl -I -s https://equityterminal.app`
4. `curl -sS https://api-production-e70b.up.railway.app/health`
5. `curl -sS 'https://api-production-e70b.up.railway.app/api/catalog?limit=4'`
6. `curl -sS 'https://api-production-e70b.up.railway.app/api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=25'`
7. `railway ssh -s api cat /app/apps/api/data/runtime-store.json`
8. authenticated production probe covering `POST /api/activations`, `POST /api/executions`, and the next truthful execution boundary

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this spec: open; local and partial hosted proof exist, but the canonical hosted execution claim is not closed.
2. Completion relative to the current live-gap list: this spec now owns gap 1, gap 2, and gap 8.
3. Completion relative to prior claims: the earlier `repo yes, prod no` summary is now refined to `production partially proven through activation and execution-create, but not yet closed enough for a full live-execution claim`.

## Agent-Testability Contract

1. Public `skill.md` may explain CoW, funding requirements, and the absence of Mesh, but it must stop before authenticated activation or execution writes.
2. Internal agent coverage for this lane belongs to [xstocks-activation-truth](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md) and [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md).
3. No public or internal agent surface may claim smart-account live proof or Mesh live proof until the required hosted evidence exists.
