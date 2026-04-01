---
name: xstocks-qualification
description: Guide discovery-first xstocks qualification through the canonical local API or CLI. Use when an agent needs to help a user understand, qualify, and truthfully inspect activation readiness without depending on apps/web.
---

# xstocks Qualification

Use this skill when you need a repo-local, agent-safe xstocks qualification result for guided discovery and onboarding.

The product direction is:

- discovery first,
- guided qualification before any deposit or activation step,
- self-custody stays central,
- the agent is an optional helper, not the portfolio owner.

## Inputs

The agent-safe surface now accepts either:

1. raw questionnaire answers keyed by `q_*` ids, or
2. the shared onboarding answers shape if you already have it.

Use `node scripts/qualify.mjs --list-questions` to inspect the canonical questionnaire ids and option ids.

Start there when the user is still exploring. Ask or collect answers, then pass them to the backend surface. Do not restate or recreate the qualification rules in prompt text.

## Preferred local path

Run the CLI directly:

```bash
node scripts/qualify.mjs --fixture broad-cautious
node scripts/qualify.mjs --input /absolute/path/to/payload.json
```

The CLI defaults to a deterministic local static boundary-state harness. Add `--live` only if you intentionally want live xstocks route/asset state.

To verify all local fixtures end to end and write proof artifacts:

```bash
node scripts/verify-qualification-fixtures.mjs
```

## API path

If you need HTTP instead of local invocation:

```bash
node apps/api/src/index.js
curl -X POST http://localhost:3001/api/qualify \
  -H 'Content-Type: application/json' \
  -d '{"answers":{"q_goal_preference":"theme_tilt","q_theme_preference":"tech_ai","q_expression_preference":"tilted","q_risk_level":"medium","q_drawdown_sensitivity":"medium","q_rebalance_preference":"scheduled","q_directional_appetite":"adaptive","q_automation_comfort":"medium","q_certainty":"high"}}'
```

## How to read the result

Use these fields as the canonical surface:

- `normalizedAnswers`: validated, canonical shared onboarding answers
- `userProfile`: derived shared user profile
- `selection.slotId` and `selection.mode`: chosen qualification lane
- `manifestRef` and `recommendation.recommendationId`: selected promoted manifest truth
- `explanationSurface`: explanation bundle actually used for the recommendation
- `activationTruth`: deposit gap, execution state, readiness, blockers, and warnings

Treat the output as guidance for a self-custody user path. The agent can help explain the lane, the recommendation, and the next step, but should not present itself as taking ownership of the portfolio.

Describe deposit and activation truthfully:

- `funding_required` means the user is still in guided onboarding and has not yet met the funding requirement.
- `activationReady` must be read from `activationTruth`; do not imply live activation if it is `false`.
- use the backend result as the authority for readiness, blockers, and warnings.

## Directional rule

Treat `activationTruth.directionalPreviewOnly === true` as a hard product constraint. In current repo truth, the advanced directional lane remains preview-only unless live route proof changes.
