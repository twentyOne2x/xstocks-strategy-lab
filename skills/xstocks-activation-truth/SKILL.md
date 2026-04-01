---
name: xstocks-activation-truth
description: Verify repo-owned activation truth for a selected promoted manifest using the canonical API surfaces, then hand off to execution proof only when the lane is truly ready.
---

# xstocks Activation Truth

Use this skill after qualification chooses a promoted manifest or slot and the user wants to know whether the lane is still preview-only, activation-ready, or blocked.

Canonical smoke runbook:
[xstocks-agent-smoke-matrix](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-agent-smoke-matrix.md)

## Canonical Surfaces

Use the repo-owned API surface, not prompt text, as the authority:

```bash
pnpm --dir packages/shared build
node apps/api/src/index.js
curl http://localhost:3001/health
curl "http://localhost:3001/api/catalog"
curl "http://localhost:3001/api/workspace?slotId=<slotId>&userNotionalUsd=10"
curl "http://localhost:3001/api/activation-preview?slotId=<slotId>&userNotionalUsd=10"
curl "http://localhost:3001/api/public-agent-handoff?slotId=<slotId>&userNotionalUsd=10"
```

If API startup fails on a missing `packages/shared/dist/**` import, rebuild `packages/shared` first and retry. The current repo-owned local path depends on that generated output.

For authenticated follow-through, the next surfaces are:

- `POST /api/activations`
- `GET /api/activity`
- `GET /api/executions`
- `POST /api/executions`

Do not use those authenticated surfaces unless you have a real internal user or operator context.
The local backend also needs Privy verification configured with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL` before those surfaces can run truthfully.

## What Counts As Activation Truth

Use these fields as the canonical readiness boundary:

- selected `manifestId` or `slotId`
- `surfaceTruth`
- `executionState`
- `executionEligibility`
- `routeTruthLabels`
- `blockers`
- `warnings`
- wallet and funding requirements

For the smoke matrix, activation truth owns:

- preview truth from `GET /api/activation-preview`
- public-ready versus public-preview classification from `GET /api/public-agent-handoff`
- the exact blocker when wallet, funding, smart-account, or route truth prevents activation

## Decision Output

Return one of these states:

- `preview_only`
- `activation_ready`
- `blocked`

Include:

1. the selected manifest or slot
2. the exact route-truth summary
3. the next user action
4. the blocker if the lane cannot advance

## Fail-Closed Rules

- If the evidence comes from frontend fallback or local mock state instead of the API response, keep the lane `preview_only`.
- If `executionEligibility` is not `executable`, do not mark the lane `activation_ready`.
- If the public handoff helper does not return `ready_for_authenticated_activation`, do not treat the authenticated boundary as crossed.
- If route labels are `unknown`, `missing`, or `unavailable`, stop.
- If the lane is directional and the API still says preview-only, keep it preview-only.
- If `executionState` is `wallet_required`, `funding_required`, `smart_account_required`, or `smart_account_pending`, the deposit boundary is still open and activation save must not be implied.
- If the backend returns `Privy auth verification requires PRIVY_APP_ID, PRIVY_APP_SECRET, and PRIVY_JWKS_URL.`, stop at the authenticated boundary and report that exact blocker.
- Do not expose private hosts, auth material, wallet secrets, or treasury details.

## Handoff To Execution Proof

Only after the lane is `activation_ready` and a real authenticated user context exists should you continue to [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md).

## Exact Current Blocker For Public-Only Agents

Public-only agents can now read the public-safe boundary through `GET /api/public-agent-handoff`, but authenticated activation, activity, and execution surfaces are still intentionally internal.
