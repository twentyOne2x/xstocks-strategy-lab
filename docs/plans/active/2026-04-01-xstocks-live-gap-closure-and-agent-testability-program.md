# xStocks Live Gap Closure And Agent-Testability Program

Date: 2026-04-01
Owner: Codex
Status: active
Canonical issue: `XSL-009`

## Goal

Turn the current live-gap list into one execution-grade control program that:
1. maps each live gap to one canonical owner lane,
2. reuses existing owner specs instead of opening duplicate monoliths,
3. keeps `XSL-011B` as the only active CRE implementation lane,
4. makes every relevant closure lane testable through agent surfaces and `apps/web/public/skill.md` where appropriate,
5. and defines the exact next implementation order after the planning tranche lands.

## Non-goals

This program does not:
1. reopen `xStocks` adapter ownership as a new gap lane when it already exists as the live baseline dependency,
2. replace the existing `XSL-014` authenticated-execution proof lane,
3. create a second generic automation umbrella beside `XSL-011` and `XSL-011B`,
4. claim production closure from local-only proof,
5. treat public `skill.md` and internal operator skills as the same trust surface.

## Existing-Spec Inventory

| Artifact | Current role | Decision in this program |
| --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | top-level execution, funding, and deposit-rail owner | update; keep as canonical owner for CoW, Privy boundary, and Mesh truth |
| [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | frontend owner | update; make repo-vs-prod parity and deployment ownership explicit |
| [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | explainability owner | update; keep post-qualification and in-app explanation in one lane |
| [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | autoresearch operating owner | update; fold in deployed recurring-runtime truth and `worker_runtime_only` retirement rules |
| [2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-rebalance-automation-and-execution-orchestration-spec.md) | rebalance automation umbrella | update; keep `XSL-011B` as the only active provider-triggered lane |
| [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | CRE executor spec | update; do not duplicate |
| [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md) | `XSL-006A` executor doc | reuse; keep as the narrow deployed-runtime sub-lane |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | Privy posture sub-lane | reuse; keep as a supporting sub-spec under `XSL-005` and `XSL-014` rather than opening another owner |
| [2026-04-01-xstocks-public-safe-agent-handoff-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-public-safe-agent-handoff-boundary.md) | completed public-safe boundary | reuse as completed baseline |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | missing owner for public/private agent smoke coverage | create new under `XSL-016` |
| [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md) | canonical issue registry | update with one gap-to-owner mapping table and one new `XSL-016B` lane |

## Current / Live Truth

1. On 2026-04-01 the canonical frontend host `https://equityterminal.app` serves `/`, `/onboarding`, `/workspace/comparison`, `/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`, `/activity`, and `/skill.md`, but `/ops/xstocks` returns `404`.
2. On 2026-04-01 same-host `https://equityterminal.app/api/*` also returns `404`, so the canonical frontend is not serving the repo API surface directly.
3. On 2026-04-01 the Railway API host `https://api-production-e70b.up.railway.app` serves `/health` and `/api/catalog`, but deployed parity lags local: `/api/public-agent-handoff` and `/api/runtime/autoresearch` both return `{"error":"Route not found."}`.
4. The live frontend landing copy is ahead of local repo copy in [home-terminal.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/home-terminal.tsx): production says `Tokenized equities. Your wallet. Your rules.` while local still says `Tokenized equity portfolios you actually control.` and uses a different CTA.
5. Local Privy code is real in [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx), [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx), and [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js).
6. The current production-authenticated CoW lane has crossed the real activation-save and execution-create boundary, but it has not yet crossed a full all-leg quote, user-signature, and settlement proof boundary.
7. Manifest metadata for the basket lane still implies `requiresSmartAccount=true` and `minFundingUsd=1000`, while effective readiness and real hosted proof currently behave as linked-wallet-first with `requiresSmartAccount=false` and `minFundingUsd=0`.
8. Local autoresearch runtime and receipts exist, and the deployed runtime store now records `truthBoundary=worker_runtime_only` plus `recurringAutonomousProven=false`; however no deployed recurring scheduler host or public runtime proof route is live.
9. Promoted manifests, qualification output, API payloads, and frontend rendering already contain more explanation truth than older docs claim, but the canonical production experience is still lighter than intended after qualification.
10. Mesh does not exist as a repo-owned deposit rail today.
11. `provider_triggered` and Chainlink CRE remain modeled but fail closed; `XSL-011B` is the active implementation lane and should not be replaced by another generic automation spec.
12. Public and internal agent surfaces both exist, but the canonical deployed public path is incomplete because `skill.md` names a handoff helper that is not yet reachable on the live hosts.

## Current Local Implementation Audit

| Lane | Shipped locally | Partial locally | Missing or stale locally |
| --- | --- | --- | --- |
| Execution / funding | CoW execution request flow, Privy auth, readiness policy, manual funding language | manifest-vs-readiness alignment, smart-account posture clarity | Mesh adapter, full production quote/sign/settlement proof |
| Frontend | landing, onboarding, comparison, detail, activation, activity, ops routes; public `skill.md` | deploy parity, same-host API posture, copy parity | production `ops/xstocks`, explicit deployed handoff helper |
| Autoresearch runtime | research harness, promoted manifests, runtime store, candidate Railway cron files | deployed cadence path and receipt surface | live scheduler host |
| Explainability | `explanationBundle`, qualification explanation surface, portfolio UI rendering | post-qualification interstitial, why-this-fits gate, stronger production rendering | canonical browser-proof pack |
| CRE | shared trigger enums, fail-closed policy, rebalance state machine | executor spec and blocker taxonomy already frozen | provider adapter, signed-event validation, deployed host, proof pack |
| Agent testability | public `skill.md`, internal skills, operator runbook | canonical live smoke path across public and internal surfaces | deployed public handoff reachability, unified smoke pack |

## Workstream Decomposition

| Gap or dependency | Canonical owner lane | Controlling spec | Supporting lanes |
| --- | --- | --- | --- |
| CoWswap execution: repo yes, prod not fully closed | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | `XSL-014`, `XSL-011A`, `XSL-011C`, `XSL-016B` |
| Privy smart accounts: partial or stale, not canonically proven live | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | Privy boundary sub-spec, `XSL-014`, `XSL-016B` |
| Chainlink CRE ongoing implementation | `XSL-011B` | [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md) | `XSL-011`, `XSL-016B` internal-only coverage |
| xStocks usage is live baseline dependency, not a gap lane | `XSL-008` baseline only | [2026-03-31-xstocks-and-euler-adapter-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-and-euler-adapter-implementation.md) | this program doc tracks dependency use, not a new closure lane |
| Autoresearch runtime: repo yes, deployed recurring no | `XSL-006` with `XSL-006A` | [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | `2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md`, `XSL-016B` internal coverage |
| Post-qualification autoresearch screen: partial | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | `XSL-004`, `XSL-016B` |
| Autoresearch explainability in app: partial and lighter than intended on prod | `XSL-010` | [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | `XSL-004`, `XSL-006`, `XSL-016B` |
| Deposits via Mesh: no | `XSL-005` | [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | `XSL-016B` for public/private deposit-boundary smoke |
| All frontend deployed on prod: no | `XSL-004` | [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | `XSL-010`, `XSL-016B` |
| Agent and `skill.md` testability coverage | `XSL-016B` under `XSL-016` | [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | `XSL-016`, `XSL-016A`, every owner lane above |

## Product Outcome Contract

When this program closes:
1. each live gap has one canonical owner and one exact acceptance bar,
2. the canonical frontend host and canonical API host tell the same truthful story,
3. the current production execution boundary is no longer described with stale smart-account or funding assumptions,
4. deployed recurring autoresearch is either proven with receipts or still explicitly `worker_runtime_only`,
5. explainability is visible after qualification and on the canonical frontend,
6. Mesh is either still explicitly absent or proven through a real UI/backend contract,
7. CRE remains one bounded review-only implementation lane until its proof contract closes,
8. and every relevant lane has a public-safe or internal-only agent smoke path.

## State-And-Truth Contract

| Truth layer | Canonical owner | Claim allowed |
| --- | --- | --- |
| local repo implementation | file audit plus tests | `implemented locally` |
| deployed frontend on Vercel | `https://equityterminal.app` route proof | `deployed frontend` |
| deployed API on Railway | `https://api-production-e70b.up.railway.app` route proof plus runtime store | `deployed backend` |
| runtime store, execution requests, and receipts | persisted Railway runtime state | `hosted runtime boundary proven` |
| public `skill.md` | public-safe preview and stop conditions only | `public agent start` |
| internal skills and runbooks | authenticated verification and operator proof | `internal agent verification` |

Truth rules:
1. No lane may call itself `production closed` if the canonical deployed host still lacks the route or state that the doc depends on.
2. `skill.md` may only claim surfaces that are live and reachable from the canonical public host.
3. Manifest metadata may not outrank effective runtime proof when the deployed readiness engine and persisted activation state disagree.
4. `worker_runtime_only` remains authoritative until a recurring scheduler host and receipts exist.
5. `provider_triggered` remains fail closed until `XSL-011B` proves review-open transitions on a deployed host.

## Proof / Measurement Contract

| Lane | Minimum proof to close | Current status on 2026-04-01 |
| --- | --- | --- |
| Execution / funding | authenticated activation save, all-leg quoteability or exact blocker, user-approved submission boundary, canonical smart-account posture, explicit Mesh truth | partial |
| Frontend parity | route matrix on Vercel, landing/onboarding/workspace/activation parity, `ops/xstocks` live, API-origin truth aligned | partial |
| Autoresearch runtime | deployed scheduler host identity, cadence, last-run receipt, next-run evidence, runtime proof surface | open |
| Explainability | browser-proofed post-qualification interstitial, why-this-fits gate, detail explanation, replay interpretation note | partial |
| CRE | deployed signed provider event opens `awaiting_operator` and nothing more | open |
| Agent testability | public and internal smoke matrix for qualification, explanation, preview, readiness, deposit boundary, and execution boundary | partial |

## Acceptance Criteria

1. Every gap in the 2026-04-01 live-gap list maps to one canonical owner lane in repo-tracked docs.
2. The requested owner specs are updated instead of spawning duplicate monoliths.
3. `XSL-011B` remains the only active CRE/provider-triggered implementation lane.
4. `XSL-008` is explicitly treated as the baseline dependency for live xStocks usage, not reopened as a new gap lane.
5. The new agent-testability owner spec defines public versus internal smoke coverage for every relevant lane.
6. The execution owner spec names the exact production boundary for CoW, Privy, and Mesh claims.
7. The frontend owner spec names the exact repo-vs-prod parity gaps and deployment owners.
8. The autoresearch owner spec names the exact receipts needed to retire `worker_runtime_only`.
9. `docs/ISSUES.md` includes one canonical gap-to-owner mapping plus the new `XSL-016B` lane.

## Blocker Taxonomy

1. `stale_vercel_vs_railway_split`
2. `public_handoff_route_not_deployed`
3. `manifest_vs_runtime_truth_drift`
4. `smart_account_posture_unresolved`
5. `all_leg_quoteability_unproven`
6. `missing_mesh_contract`
7. `missing_scheduler_host`
8. `missing_autoresearch_receipts`
9. `post_qualification_interstitial_partial`
10. `light_prod_explanation`
11. `missing_cre_provider_adapter`
12. `missing_agent_smoke_pack`

## Rollback / Recovery Contract

1. If one owner lane proves to be based on stale live assumptions, revert only that lane’s acceptance bar and keep the program mapping intact.
2. If deployed route parity regresses, keep the lane open and downgrade the claim level instead of editing around the host mismatch.
3. If a public agent surface is discovered to overclaim, narrow `skill.md` first and keep deeper verification internal.
4. If runtime receipts disappear or are stale, restore `worker_runtime_only` or `providerTriggeredProven=false` rather than preserving optimistic language.

## Exact Test / Verification Commands

1. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`
2. `curl -I -s https://equityterminal.app`
3. `curl -I -s https://equityterminal.app/onboarding`
4. `curl -I -s https://equityterminal.app/workspace/comparison`
5. `curl -I -s https://equityterminal.app/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`
6. `curl -I -s https://equityterminal.app/activity`
7. `curl -I -s https://equityterminal.app/ops/xstocks`
8. `curl -sS https://api-production-e70b.up.railway.app/health`
9. `curl -sS 'https://api-production-e70b.up.railway.app/api/catalog?limit=4'`
10. `curl -sS 'https://api-production-e70b.up.railway.app/api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=25'`
11. `curl -sS 'https://api-production-e70b.up.railway.app/api/runtime/autoresearch?limit=1'`
12. `railway status`
13. `railway ssh -s api cat /app/apps/api/data/runtime-store.json`

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this program spec: planning tranche closes when the owner mapping and acceptance bars are committed; implementation remains open.
2. Completion relative to the current thread asks: this file plus the owner-spec rewrites and `docs/ISSUES.md` update satisfy the planning request.
3. Completion relative to prior claims: the program now reconciles older optimistic claims with 2026-04-01 live-host truth, especially around frontend parity, public handoff reachability, smart-account posture, and recurring runtime.

## Agent-Testability Contract

1. Public-safe agent coverage belongs on `skill.md`, `/onboarding`, `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, and public readiness surfaces only when those routes are live and reachable.
2. Internal agent coverage belongs on repo-owned skills, authenticated API routes, and runbooks for activation save, execution proof, runtime receipts, and CRE verification.
3. `XSL-016B` is the canonical owner of the public/private split and smoke matrix; the other owner specs define what must be testable, not how the agent surfaces are organized.

## Exact Next Implementation Order

1. `XSL-004` plus `XSL-016B`
   - Make the canonical public host truthful first: land `ops/xstocks`, fix public handoff reachability, and align public `skill.md` with live API origin.
2. `XSL-005`
   - Resolve manifest-vs-runtime execution truth, freeze linked-wallet versus smart-account posture, and close the current all-leg CoW quoteability boundary.
3. `XSL-010`
   - Upgrade the post-qualification interstitial, why-this-fits gate, and in-app explanation on the canonical frontend using promoted-manifest-only truth.
4. `XSL-006A` under `XSL-006`
   - Deploy the recurring autoresearch host and receipt surface so the runtime lane can stop reporting `worker_runtime_only`.
5. `XSL-011B`
   - Build the first CRE provider-triggered review path only after the execution boundary and runtime ownership are stable.
6. Cross-lane `XSL-016B` stabilization
   - After each lane lands, add or refresh its public or internal smoke path instead of saving agent coverage for a final cleanup pass.
