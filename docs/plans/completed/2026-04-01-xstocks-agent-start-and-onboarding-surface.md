# xStocks Agent Start And Onboarding Surface

Outcome: completed on 2026-04-01 with the onboarding surface landed and the remaining blocker limited to the intentional public-to-internal authentication boundary.

Date: 2026-04-01
Owner: Codex
Status: completed
Owner issue: [XSL-016 Hermes Operator Control And Agent Skill Surface](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md)

## Objective

Create the shortest truthful start path for:
1. an external xstocks-side agent starting from the public `apps/web/public/skill.md`,
2. a repo-owned agent or operator moving from qualification to activation truth to execution proof.

## Non-goals

1. redesign the consumer product,
2. expose private hosts, wallet secrets, treasury details, auth material, or hidden custody internals,
3. claim autonomous or secret-based execution,
4. add backend endpoints unless a truly tiny onboarding helper is strictly required.

## User-Stated Desired Outcome

Make it fast for xstocks or an operator to get started from the public `skill.md` and the deeper repo-owned agent/operator surfaces, while keeping public and private boundaries explicit and truthful.

## Constraints And Non-Negotiables

1. Keep scope centered on `apps/web/public/skill.md`, `skills/**`, and `docs/runbooks/**`.
2. Preserve the current xStocks-first, Ethereum-first, fail-closed posture.
3. Keep the public skill safe for external reading.
4. Keep internal docs precise enough that an operator can move from qualification to activation truth to execution proof without guessing.

## Current Repo Truth

1. `apps/web/public/skill.md` exists and is the only explicit public skill surface today.
2. `skills/xstocks-qualification/SKILL.md` exists and is the real repo-owned qualification surface.
3. `apps/web` exposes `/onboarding`, `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, and `/activate/[manifestSlug]`.
4. `apps/api` exposes repo-owned qualification, catalog, workspace, activation preview, activation save, activity, and execution routes.
5. Public discovery can start without private infrastructure, but activation save, activity reads, and execution proof still require internal authenticated context.

## Step-By-Step Plan

1. Audit the public skill, the existing qualification skill, and the real app/API routes so the start surface matches current implementation rather than stale expectations.
2. Tighten the public skill around exact routes, exact current capabilities, and exact stop conditions.
3. Add the smallest missing internal entry surfaces:
   1. one internal agent-start skill,
   2. one internal activation-truth skill,
   3. one short runbook for execution proof and blocker reporting.
4. Update the existing qualification skill so it hands off cleanly instead of pretending to cover the full operator path alone.
5. Run repo checks and record whether any blocker remains for a fully smooth public-to-private start.

## Verification Plan

Commands:

```bash
pnpm lint
pnpm test
pnpm build
node scripts/qualify.mjs --fixture broad-cautious
```

Expected artifacts:

1. the public skill tells an external agent exactly where to start and when to stop,
2. the internal skill chain tells an operator exactly how to move from qualification to activation truth to execution proof,
3. the docs state the exact blocker if the public and internal flows still cannot unify into one surface,
4. repo checks either pass or produce a concrete blocker.

## Rollback / Recovery

1. Revert only the onboarding-surface doc files changed in this slice.
2. Leave unrelated dirty worktree changes untouched.
3. If the new internal surface proves too broad, collapse to one entry skill plus the execution-proof runbook while keeping the public skill truthful.

## Decision Log

1. Use the existing `XSL-016` Hermes/operator owner lane instead of creating a duplicate issue.
2. Treat `skills/xstocks-qualification/SKILL.md` as the canonical internal qualification surface and add the missing steps around it.
3. Keep the public start surface separate from the internal proof surface; do not fake a public-safe handoff that the repo does not yet provide.

## Progress Log

- 2026-04-01: Audited the public `skill.md`, existing qualification skill, frontend routes, and backend API routes.
- 2026-04-01: Confirmed that qualification is repo-owned today, while the start surface between public orientation and deeper operator proof is still too implicit.
- 2026-04-01: Updated the public skill, added the internal agent-start and activation-truth surfaces, and added the execution-proof runbook.
- 2026-04-01: Verification results: `node scripts/qualify.mjs --fixture broad-cautious` passed; `pnpm lint`, `pnpm build`, and `pnpm test` passed; existing warnings remain in the web build and lint surfaces but did not block the landing slice.

## Exact Blocker Taxonomy

1. `public_preview_only`: the public skill can orient and qualify, but it cannot perform internal authenticated follow-through.
2. `activation_truth_missing`: the selected lane has not been proven through the canonical repo-owned activation-truth surface.
3. `execution_proof_missing`: activation truth exists, but no authenticated execution-proof artifact or blocker report has been captured yet.
