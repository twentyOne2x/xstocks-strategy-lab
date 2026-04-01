---
name: xstocks-qualification
description: Guide canonical repo-owned xstocks qualification through the local CLI or API, then hand off cleanly to activation truth when a user wants to continue.
---

# xstocks Qualification

Use this skill when you need the canonical repo-owned qualification result before any activation or execution-proof claim.

The product direction is:

- discovery first
- guided qualification before any deposit or activation step
- self-custody stays central
- the agent is an optional helper, not the portfolio owner

## Shortest Truthful Internal Flow

1. If the user is still exploring, keep them on the public path and gather answers from `/onboarding` or the canonical questionnaire ids.
2. Run the local CLI or `POST /api/qualify`.
3. Return one of these qualification outcomes:
   - `preview_only`
   - `activation_truth_check`
   - `blocked`
4. If the user wants to continue beyond qualification, hand off to [xstocks-activation-truth](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md).

## Inputs

The agent-safe surface accepts either:

1. raw questionnaire answers keyed by `q_*` ids, or
2. the shared onboarding answers shape if you already have it.

Use `node scripts/qualify.mjs --list-questions` to inspect the canonical questionnaire ids and option ids.

Do not restate or recreate the qualification rules in prompt text. Use the repo-owned CLI or API result as the authority.

## Preferred Local Path

Run the CLI directly:

```bash
node scripts/qualify.mjs --fixture broad-cautious
node scripts/qualify.mjs --input /absolute/path/to/payload.json
```

The CLI defaults to a deterministic local boundary-state harness. Add `--live` only if you intentionally want live xstocks route and asset state.

To verify all local fixtures end to end and write proof artifacts:

```bash
node scripts/verify-qualification-fixtures.mjs
```

## API Path

If you need HTTP instead of local invocation:

```bash
node apps/api/src/index.js
curl -X POST http://localhost:3001/api/qualify \
  -H 'Content-Type: application/json' \
  -d '{"answers":{"q_goal_preference":"theme_tilt","q_theme_preference":"tech_ai","q_expression_preference":"tilted","q_risk_level":"medium","q_drawdown_sensitivity":"medium","q_rebalance_preference":"scheduled","q_directional_appetite":"adaptive","q_automation_comfort":"medium","q_certainty":"high"}}'
```

## How To Read The Result

Use these fields as the canonical qualification surface:

- `normalizedAnswers`: validated shared onboarding answers
- `userProfile`: derived user profile
- `selection.slotId` and `selection.mode`: the selected qualification lane
- `manifestRef` and `recommendation.recommendationId`: the promoted-manifest truth being recommended
- `explanationSurface`: the explanation bundle used for the recommendation
- `activationTruth`: deposit gap, execution state, readiness, blockers, and warnings

Return one of these operator-facing states:

- `preview_only`: the user is still exploring, the lane is still preview-only, or `activationTruth.activationReady` is false
- `activation_truth_check`: the user wants to continue and qualification did not hard-block the selected lane
- `blocked`: qualification blockers or warnings mean the lane should stop for now

Treat the output as guidance for a self-custody user path. The agent can explain the lane, the recommendation, and the next step, but should not present itself as taking ownership of the portfolio.

## Hard Boundaries

- `funding_required` means the user is still in guided onboarding and has not yet met the funding requirement.
- `activationReady` must be read from `activationTruth`; do not imply live activation if it is false.
- `activation_truth_check` is not execution proof. It only means the next step is activation-truth verification.
- `activationTruth.directionalPreviewOnly === true` is a hard product constraint. The current directional lane stays preview-only unless route proof changes.
- Do not expose private hosts, auth material, wallet secrets, or treasury details in this step.
