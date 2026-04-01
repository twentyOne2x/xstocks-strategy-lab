---
name: xstocks-agent-start
description: Internal entrypoint for xstocks operators and repo-owned agents. Use when starting from the public skill and needing the shortest truthful handoff through qualification, activation truth, and execution proof.
---

# xstocks Agent Start

Use this skill when you need one small internal start surface for xstocks or an operator.

Canonical smoke runbook:
[xstocks-agent-smoke-matrix](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-agent-smoke-matrix.md)

## Public Boundary First

Freeze public-safe claims from [apps/web/public/skill.md](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/public/skill.md) before doing anything deeper.

The public surface may orient a user through:

- `/onboarding`
- `/workspace/comparison`
- `/workspace/detail/[manifestSlug]`
- `/activate/[manifestSlug]`
- `GET /api/public-agent-handoff`

The public surface must stop before:

- private operator or Hermes hosts
- authenticated operator-only API access
- wallet secrets or seed phrases
- treasury details or approval owners
- any hidden-custody or autonomous-execution claim
- any CRE or recurring-runtime proof claim that does not have a public proof route

## Shortest Internal Flow

1. If the user is still exploring, stay on the public surface and then use [xstocks-qualification](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md).
2. If qualification selects a promoted manifest and the user wants to continue, use [xstocks-activation-truth](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md).
3. If activation truth is confirmed and a proof artifact is needed, use [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md).

## Exact Stage Ownership

- qualification: `/onboarding` on the public surface, or `node scripts/qualify.mjs` and `POST /api/qualify` internally
- explanation: `/workspace/comparison` or `/workspace/detail/[manifestSlug]` publicly, or `explanationSurface` plus `GET /api/workspace` internally
- preview: `/activate/[manifestSlug]` publicly, or `GET /api/activation-preview` internally
- activation readiness: `GET /api/public-agent-handoff` for the public-safe boundary, then `GET /api/activation-preview` for internal truth
- execution boundary: `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, and `POST /api/executions` are internal authenticated surfaces only
- deposit boundary: if `activationTruth.depositRequired` is true or execution state is `wallet_required`, `funding_required`, `smart_account_required`, or `smart_account_pending`, stop before activation save

## Current Repo Truth

- qualification is repo-owned today through `node scripts/qualify.mjs` and `POST /api/qualify`
- the public-safe handoff helper now exists at `GET /api/public-agent-handoff`
- the helper can return `stay_public_preview`, `ready_for_authenticated_activation`, or `blocked` without exposing private infrastructure
- activation truth is repo-owned through the API surface, not through prompt text
- saved activation, activity reads, and execution proof require internal authenticated context
- the public surface and the internal proof surface are intentionally separate
- the concise operator smoke contract now lives in `docs/runbooks/xstocks-agent-smoke-matrix.md`

## Fail-Closed Rules

- Do not use frontend fallback or mock-only state as execution proof.
- Do not claim autonomous execution or hidden custody.
- Do not claim CRE or recurring-runtime proof from this lane unless a repo-owned proof route now exposes it.
- Do not expose private hosts, auth material, wallet secrets, or treasury details.
- If you only have the public surface and no internal authenticated context, stop at preview and state that blocker plainly.

## Exact Current Blocker For One-Surface Start

A public-safe handoff bridge now exists, but a direct one-surface public-to-execution path still cannot exist safely. `POST /api/activations`, `GET /api/activity`, `GET /api/executions`, and `POST /api/executions` remain authenticated surfaces bound to verified user ownership and user-approved wallet or signature steps.
