# xStocks Agent Testability And Skill Surface Spec

Date: 2026-04-01
Owner: Codex
Status: active
Owner issue: [XSL-016B Public And Private Agent Smoke Matrix Closure](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md)

## Objective

Close `XSL-016B` by freezing one exact public-safe smoke path and one exact internal authenticated smoke path across:
1. qualification,
2. explanation,
3. preview,
4. activation readiness,
5. execution boundary,
6. deposit boundary.

## Non-goals

1. add new execution, auth, or custody rails,
2. expose private hosts, wallet secrets, auth tokens, treasury details, or hidden custody internals,
3. claim CRE or recurring-runtime public proof without repo-owned proof routes,
4. blur public-safe preview with authenticated activation or execution ownership,
5. rewrite unrelated frontend surfaces outside the requested agent docs unless a tiny live helper is truly missing.

## User-Stated Desired Outcome

Make the public/private split exact and runnable, ensure the public `skill.md` references only live public-safe surfaces, ensure internal skills and runbooks cover the authenticated lanes, remove dead helper references, keep CRE and recurring-runtime checks internal-only unless proof routes now exist, and leave one concise smoke runbook that the next operator can use without thread context.

## Constraints And Non-Negotiables

1. Prefer `apps/web/public/skill.md`, `skills/**`, and `docs/runbooks/**`.
2. Touch `apps/api/**` only if a tiny public-safe helper is still missing and truly required.
3. No secrets, no hidden hosts, and no overclaiming.
4. Treat hosted route existence, local qualification output, and local activation-preview truth as separate proof layers.
5. Keep the exact remaining unsupported path explicit if the lane still cannot be fully public-to-execution.

## Current Repo Truth

1. The public skill surface exists at `apps/web/public/skill.md`.
2. The public-safe handoff helper exists at `GET /api/public-agent-handoff`.
3. Qualification is repo-owned today through `node scripts/qualify.mjs` and `POST /api/qualify`.
4. Explanation and preview truth are repo-owned today through `/workspace/comparison`, `/workspace/detail/[manifestSlug]`, `/activate/[manifestSlug]`, `GET /api/workspace`, and `GET /api/activation-preview`.
5. Activation save, activity reads, and execution reads or writes remain authenticated internal surfaces.
6. No repo-owned public proof route currently closes CRE or recurring-runtime claims for this agent lane; recurring autoresearch remains internal-only for the smoke matrix even though repo-owned internal runtime proof now exists with `truthBoundary=railway_cron_service` and `recurringAutonomousProven=true`.
7. The owner plan, smoke matrix, and internal runbook language now exist locally, the hosted `skill.md` now matches the repo-owned public-safe copy on key public-safe points, and the exact fixed-port local smoke command remains contaminated by a pre-existing `localhost:3001` process on this machine.

## Step-By-Step Plan

1. Audit the public skill, internal skills, runbooks, and current API truth for the six smoke stages.
2. Create the missing `XSL-016B` owner artifact in `docs/ISSUES.md` and this owner plan.
3. Freeze one canonical smoke matrix that maps each stage to public-safe surfaces, internal authenticated surfaces, and exact stop conditions.
4. Update `apps/web/public/skill.md` so it names only live public-safe routes and helpers.
5. Update `skills/**` and `docs/runbooks/**` so they use the same matrix terms and exact authenticated boundaries.
6. Remove or replace any dead helper references discovered during the audit.
7. Add one concise smoke runbook that a new operator can execute without thread context.
8. Run the requested hosted-route checks, qualification CLI smoke, and local activation-preview smoke.
9. Record the exact remaining unsupported path if a direct public one-surface flow still cannot exist.

## Verification Plan

Commands:

```bash
curl -sS https://equityterminal.app/skill.md
curl -I -s https://equityterminal.app/onboarding
curl -I -s https://equityterminal.app/workspace/comparison
curl -I -s https://equityterminal.app/activate/ai-infra-autopilot
node scripts/qualify.mjs --fixture broad-cautious
node apps/api/src/index.js
curl -sS "http://localhost:3001/api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=1000"
```

Expected artifacts:

1. one exact public-safe smoke path,
2. one exact internal authenticated smoke path,
3. a public skill that references only live public-safe surfaces,
4. internal skills and runbooks that describe the same authenticated truth,
5. one explicit remaining unsupported path if any still exists.

## Rollback / Recovery

1. Revert only the docs and skill surfaces touched by this slice.
2. Leave unrelated dirty worktree changes untouched.
3. If the smoke matrix cannot be expressed truthfully without widening scope, stop at the current truthful boundary and record the blocker instead of inventing a new helper.

## Decision Log

1. Reuse the existing `XSL-016` owner lane and add `XSL-016B` as the smoke-matrix closure slice.
2. Prefer docs and runbook reconciliation over API changes because the public-safe helper already exists.
3. Treat `GET /api/public-agent-handoff` as the public activation-readiness boundary, not as an activation or execution surface.
4. Keep CRE out of the public smoke matrix entirely, and keep recurring-runtime out of the public smoke matrix even though internal runtime proof now exists, because this lane is public-safe first rather than an operator-runtime audit surface.

## Progress Log

- 2026-04-01: Audited the requested public skill, internal skills, runbook, and the existing `XSL-016` owner artifacts.
- 2026-04-01: Confirmed that the requested owner plan file was missing and that `docs/ISSUES.md` had no `XSL-016B` entry yet.
- 2026-04-01: Confirmed that the public-safe helper already exists, so this slice should stay docs-first unless verification exposes a truly missing helper.
- 2026-04-01: Confirmed the local skills and runbooks now align to one six-stage smoke matrix and that hosted `/onboarding`, `/workspace/comparison`, and `/activate/ai-infra-autopilot` all respond.
- 2026-04-01: Recorded the remaining proof blocker exactly: default-port local smoke on `localhost:3001` is contaminated by a pre-existing stale API process.

## 2026-04-01 Final Reconciliation Update

This section supersedes stale planning-tranche assumptions elsewhere in this doc.

Exact proofs reached:
1. local `apps/web/public/skill.md`, `skills/**`, and `docs/runbooks/**` now describe the same six-stage matrix,
2. `node scripts/qualify.mjs --fixture broad-cautious` still qualifies into `onboarding.default_basket`,
3. a clean local API instance on `PORT=3011` serves `GET /api/public-agent-handoff` with `state=stay_public_preview`, `surfaceTruth=preview`, and `executionState=wallet_required`,
4. hosted `/onboarding`, `/workspace/comparison`, and `/activate/ai-infra-autopilot` all return `200`,
5. hosted `https://equityterminal.app/skill.md` now serves the current public-safe copy and no longer carries the earlier Railway host reference or public CRE claim.

Exact blockers keeping this lane open:
1. the exact fixed-port local smoke command from the owner spec currently hits a pre-existing process on `localhost:3001`, so the default-port command is not a trustworthy current-repo proof on this machine.
- 2026-04-01: Updated the public skill, internal skills, and runbooks to the same six-stage smoke matrix and added `docs/runbooks/xstocks-agent-smoke-matrix.md` as the concise operator runbook.
- 2026-04-01: Verified hosted route reachability at `https://equityterminal.app/onboarding`, `https://equityterminal.app/workspace/comparison`, and `https://equityterminal.app/activate/ai-infra-autopilot`, and verified local qualification truth with `node scripts/qualify.mjs --fixture broad-cautious`.
- 2026-04-01: Verified the current workspace API on an isolated ephemeral port because `localhost:3001` was already occupied by a stale process; the current workspace instance served `GET /api/public-agent-handoff` and `GET /api/activation-preview` correctly.
- 2026-04-01: Post-proof reconciliation removed the hosted public-skill blocker; the remaining exact blocker is the stale local process on `localhost:3001` that contaminates the default-port smoke command on this machine.
