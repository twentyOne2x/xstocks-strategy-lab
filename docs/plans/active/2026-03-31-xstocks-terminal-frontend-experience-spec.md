# xStocks Terminal Frontend Experience Spec

Date: 2026-03-31
Owner: Codex
Status: active
Canonical issue: `XSL-004`

## Goal

Close the canonical frontend parity gap by making the repo, the deployed Vercel host, and the supporting Railway API host tell the same story across:
1. landing copy,
2. onboarding and post-qualification entry,
3. comparison, detail, and activation surfaces,
4. deposit and readiness messaging,
5. and public agent entry on `skill.md`.

## Non-goals

This workstream does not:
1. redefine execution rails or CRE behavior,
2. turn frontend parity into a backend-only issue,
3. reopen the entire design language when the main problem is deploy truth,
4. claim prod closure from local route existence alone,
5. absorb the explainability lane instead of coordinating with it.

## Existing-Spec Inventory

| Artifact | Current role | Decision |
| --- | --- | --- |
| [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md) | canonical frontend owner | update and keep canonical |
| [docs/FRONTEND_STYLE.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/FRONTEND_STYLE.md) | visual direction | reuse |
| [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | explanation owner | coordinate; do not duplicate |
| [2026-04-01-xstocks-public-safe-agent-handoff-boundary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-public-safe-agent-handoff-boundary.md) | public-safe handoff baseline | reuse |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | agent smoke owner | support from this spec |

## Current / Live Truth

1. On 2026-04-01 `https://equityterminal.app/` returns `200` and serves a Vercel-hosted landing page.
2. That live landing page is not in copy parity with local [home-terminal.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/home-terminal.tsx): production says `Tokenized equities. Your wallet. Your rules.` with CTA `Open Terminal`, while local still says `Tokenized equity portfolios you actually control.` with CTA `Find my portfolio`.
3. `https://equityterminal.app/onboarding`, `/workspace/comparison`, `/activate/ai-infra-autopilot`, `/activity`, and `/skill.md` all return `200` on 2026-04-01.
4. `https://equityterminal.app/ops/xstocks` returns `404` on 2026-04-01 even though the local route exists.
5. Same-host `https://equityterminal.app/api/*` returns `404`, so frontend parity cannot assume the repo API is available on the same origin.
6. The Railway API host `https://api-production-e70b.up.railway.app` is live separately, which means production truth depends on explicit frontend-to-backend origin handling.

## Current Local Implementation Audit

| Surface | Local repo truth | Deployed truth on 2026-04-01 | Gap |
| --- | --- | --- | --- |
| Landing | local route and component exist | deployed copy differs | landing copy parity |
| Onboarding | route exists | route loads | needs browser proof of post-qualification handoff |
| Comparison and detail | routes and data adapters exist | comparison route loads | needs canonical prod data and explanation parity proof |
| Activation | route exists | route loads | deposit and readiness messaging still depends on execution parity |
| Activity | route exists | route loads | operator or ops surface still split |
| Ops | route exists locally | `404` live | deployment gap |
| Public `skill.md` | file exists locally | file is live | helper route it references is not live on the public host |

## Product Outcome Contract

When this lane closes:
1. the canonical Vercel host serves the intended routes and copy,
2. production and local routes no longer disagree about what exists,
3. the frontend names the real backend origin explicitly where needed,
4. landing, onboarding, workspace, activation, activity, ops, and public `skill.md` surfaces are all verified on the canonical host,
5. frontend parity no longer depends on private thread memory.

## State-And-Truth Contract

| Surface | Deployment owner | Proof owner | Claim allowed |
| --- | --- | --- | --- |
| `apps/web` UI routes | Vercel | route and browser proof on `equityterminal.app` | `frontend deployed` |
| API-backed data | Railway `apps/api` | HTTP proof on `api-production-e70b.up.railway.app` | `backend deployed` |
| public `skill.md` | Vercel | public file plus reachable helper links | `public agent start deployed` |
| internal ops route | Vercel or explicit internal host | route proof on canonical owner host | `ops surface deployed` |

Truth rules:
1. Local route existence does not count as production parity.
2. If the canonical host returns `404`, the surface is not production-ready.
3. If the frontend depends on a backend route, the canonical origin for that route must be explicit and reachable.
4. `skill.md` may not reference same-origin helpers that are absent on the canonical host.

## Proof / Measurement Contract

| Surface | Required proof | Current status |
| --- | --- | --- |
| Landing copy parity | browser and HTTP proof that local and prod copy match | open |
| Onboarding parity | browser proof of canonical onboarding and post-qualification transition | partial |
| Comparison and recommendation parity | route load plus canonical explanation blocks on prod | partial |
| Activation and deposit parity | route load plus truthful funding and readiness copy | partial |
| Activity parity | route load plus canonical data source proof | partial |
| Ops surface | `200` on canonical host | open |
| Public `skill.md` parity | live file plus live helper reachability | open |

## Acceptance Criteria

1. `equityterminal.app` serves the same intended route set the repo claims to own.
2. Landing copy and CTA match the repo-tracked canonical implementation.
3. Onboarding and post-qualification surfaces are browser-proven on the canonical host.
4. Comparison, detail, activation, and activity surfaces are browser-proven against the canonical deployed backend origin.
5. `ops/xstocks` is either live on the canonical host or explicitly rehomed and documented.
6. Public `skill.md` links only to reachable public surfaces.
7. The spec states the exact frontend deployment owner and the exact proof commands needed to verify it.

## Blocker Taxonomy

1. `landing_copy_drift`
2. `same_host_api_gap`
3. `ops_route_not_deployed`
4. `post_qualification_parity_unproven`
5. `activation_and_deposit_copy_drift`
6. `public_skill_handoff_gap`

## Rollback / Recovery Contract

1. If a route regresses on Vercel, downgrade the production claim immediately and keep the repo route local-only until redeployed.
2. If same-host API assumptions are wrong, point the frontend explicitly at the Railway API host rather than letting silent fallback or stale docs stand in.
3. If `ops/xstocks` is intentionally not public, remove the implication from this owner lane and move the route to the correct internal owner.

## Exact Test / Verification Commands

1. `pnpm --filter @xstocks-strategy-lab/web build`
2. `git -C /Users/user/PycharmProjects/xstocks-strategy-lab diff --check`
3. `curl -I -s https://equityterminal.app/`
4. `curl -I -s https://equityterminal.app/onboarding`
5. `curl -I -s https://equityterminal.app/workspace/comparison`
6. `curl -I -s https://equityterminal.app/activate/ai-infra-autopilot`
7. `curl -I -s https://equityterminal.app/activity`
8. `curl -I -s https://equityterminal.app/ops/xstocks`
9. `curl -I -s https://equityterminal.app/skill.md`
10. browser proof on the canonical host for landing, onboarding, comparison, detail, activation, activity, and ops

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this spec: open; the route shell exists locally, but deployed parity is incomplete.
2. Completion relative to the current live-gap list: this spec now owns gap 9 directly and supports gaps 6 and 7 through the canonical frontend surface.
3. Completion relative to prior claims: older docs that said no frontend existed are no longer authoritative; the remaining problem is production parity, not total absence.

## Agent-Testability Contract

1. Public-safe agent entry for qualification, explanation, preview, and readiness depends on this spec keeping `/skill.md`, `/onboarding`, `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, and `/activate/[manifestSlug]` truthful on the canonical host.
2. This spec does not own internal authenticated agent flows, but it must not ship a public surface that points to unreachable helpers or hidden routes.
3. The detailed public/private smoke matrix belongs to `XSL-016B`; this spec owns the frontend half of that contract.
