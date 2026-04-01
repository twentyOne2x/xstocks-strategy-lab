---
name: xstocks-activation-truth
description: Verify repo-owned activation truth for a selected promoted manifest using the canonical API surfaces, then hand off to execution proof only when the lane is truly ready.
---

# xstocks Activation Truth

Use this skill after qualification chooses a promoted manifest or slot and the user wants to know whether the lane is still preview-only, activation-ready, or blocked.

## Canonical Surfaces

Use the repo-owned API surface, not prompt text, as the authority:

```bash
node apps/api/src/index.js
curl http://localhost:3001/health
curl "http://localhost:3001/api/catalog"
curl "http://localhost:3001/api/workspace?slotId=<slotId>&userNotionalUsd=10"
curl "http://localhost:3001/api/activation-preview?slotId=<slotId>&userNotionalUsd=10"
```

For authenticated follow-through, the next surfaces are:

- `POST /api/activations`
- `GET /api/activity`
- `GET /api/executions`
- `POST /api/executions`

Do not use those authenticated surfaces unless you have a real internal user or operator context.

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
- If route labels are `unknown`, `missing`, or `unavailable`, stop.
- If the lane is directional and the API still says preview-only, keep it preview-only.
- Do not expose private hosts, auth material, wallet secrets, or treasury details.

## Handoff To Execution Proof

Only after the lane is `activation_ready` and a real authenticated user context exists should you continue to [xstocks-operator-execution-proof](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md).

## Exact Current Blocker For Public-Only Agents

Public-only agents can now read the public-safe boundary through `GET /api/public-agent-handoff`, but authenticated activation, activity, and execution surfaces are still intentionally internal.
