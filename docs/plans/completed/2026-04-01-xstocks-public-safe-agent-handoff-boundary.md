# Outcome: completed on 2026-04-01 with a real public-safe readiness and handoff bridge added, while authenticated activation, activity, and execution remain intentionally internal.

# xStocks Public-Safe Agent Handoff Boundary

Date: 2026-04-01
Owner: Codex
Status: completed
Owner issue: [XSL-016A Public-Safe Agent Handoff Boundary](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md)

## Objective

Close the remaining gap between the public `apps/web/public/skill.md` surface and the internal authenticated activation/activity/execution path by freezing one truthful public-safe handoff boundary.

## Non-goals

1. redesign the frontend,
2. expose secrets, private hosts, treasury details, or hidden custody internals,
3. widen execution rails or wallet-provider behavior,
4. create a public endpoint that saves activations, reads private activity, or writes executions without authenticated ownership.

## User-Stated Desired Outcome

Build the first public-safe xstocks agent handoff boundary after the landed public and internal agent-start surfaces, and say clearly whether a real safe bridge exists.

## Constraints And Non-Negotiables

1. Keep scope centered on `apps/web/public/skill.md`.
2. Touch `apps/api/**` only if one narrow public-safe helper/readiness endpoint is truly needed.
3. Touch `docs/runbooks/**` or `skills/**` only if the handoff path must be clarified.
4. Keep public/private boundaries explicit and fail closed.
5. Do not expose wallet secrets, treasury details, or private hosts.

## Current Repo Truth

1. The public skill surface is landed at `apps/web/public/skill.md`.
2. The internal repo-owned handoff surface is landed across `skills/xstocks-agent-start/SKILL.md`, `skills/xstocks-qualification/SKILL.md`, `skills/xstocks-activation-truth/SKILL.md`, and `docs/runbooks/xstocks-operator-execution-proof.md`.
3. `GET /api/workspace` and `GET /api/activation-preview` already expose public-safe preview and readiness data without requiring authentication.
4. `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, and `POST /api/executions` remain authenticated surfaces owned by verified internal user context.
5. The missing piece was one explicit public-safe bridge contract between those two sides.

## Step-By-Step Plan

1. Audit the public skill, internal handoff docs, and current unauthenticated versus authenticated API boundaries.
2. Decide whether the existing public preview APIs are sufficient or whether a dedicated public-safe handoff helper is justified.
3. If justified, implement the narrowest helper surface possible in `apps/api` and make it explicit that it does not cross the authenticated boundary.
4. Update the public skill and affected internal docs so the boundary and blocker taxonomy are unambiguous.
5. Run targeted verification and report whether a real bridge now exists.

## Verification Plan

Commands:

```bash
pnpm --filter @xstocks/api check
pnpm --filter @xstocks-strategy-lab/web build
git diff --check
```

Expected artifacts:

1. one explicit public-safe handoff contract or a clearly documented no-bridge boundary,
2. proof that authenticated activation save still fails closed without auth,
3. proof that authenticated activation save still works with verified auth,
4. final statement of whether a real bridge now exists and what exact blocker remains for direct public follow-through.

## Rollback / Recovery

1. Revert only the public handoff helper and docs touched by this slice.
2. Preserve unrelated dirty worktree changes.
3. If the helper endpoint proves too broad, remove it and keep the boundary explicit in docs only.

## Decision Log

1. Reuse the `XSL-016` owner lane rather than creating a separate top-level owner.
2. Treat a public-safe readiness-only bridge as acceptable only if it does not cross the authenticated ownership boundary.
3. Prefer one explicit helper contract over forcing external agents to infer the boundary from broader API payloads, because the helper can stay narrower than `GET /api/workspace` or `GET /api/activation-preview`.
4. Keep the helper public-safe by accepting only the same public promoted-manifest and optional wallet-readiness inputs as preview reads, while omitting owner-specific activity or execution data from the response.

## Progress Log

- 2026-04-01: Audited the public skill, internal skills, runbook, and current API auth/readiness surfaces.
- 2026-04-01: Confirmed that public preview data already exists through `GET /api/workspace` and `GET /api/activation-preview`, while activation save, activity, and execution remain authenticated.
- 2026-04-01: Implemented `GET /api/public-agent-handoff` as the dedicated public-safe boundary contract and aligned the public/internal docs to the same handoff taxonomy.
- 2026-04-01: Verified with `pnpm --filter @xstocks/api check`, `pnpm --filter @xstocks-strategy-lab/web build`, and `git diff --check`.

## Outcome

1. A real public-safe bridge now exists at `GET /api/public-agent-handoff`.
2. The bridge returns only readiness preview plus explicit handoff state: `stay_public_preview`, `ready_for_authenticated_activation`, or `blocked`.
3. The bridge does not bypass authenticated ownership checks and does not expose private hosts, auth material, wallet secrets, treasury details, or hidden custody internals.
4. The exact remaining blocker for a direct public one-surface path is unchanged by design: activation save, activity reads, and execution writes remain authenticated and user-approved internal surfaces.
