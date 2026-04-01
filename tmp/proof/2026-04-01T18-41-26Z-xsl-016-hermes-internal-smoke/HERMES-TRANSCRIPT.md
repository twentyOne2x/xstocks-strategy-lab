# XSL-016 Hermes Internal Smoke Transcript

Date: 2026-04-01
Workspace: `/Users/user/PycharmProjects/xstocks-strategy-lab`
Proof bundle: `/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-01T18-41-26Z-xsl-016-hermes-internal-smoke`

## Exact Smoke Path

1. `pnpm --dir packages/shared build`
2. `node scripts/qualify.mjs --fixture broad-cautious`
3. `node scripts/verify-qualification-fixtures.mjs --output-dir tmp/proof/2026-04-01T18-41-26Z-xsl-016-hermes-internal-smoke/qualification-fixtures`
4. `PORT=3011 node apps/api/src/index.js`
5. `GET /api/catalog`
6. `GET /api/workspace?slotId=onboarding.default_basket&userNotionalUsd=25`
7. `GET /api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=25`
8. `GET /api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=25`
9. `GET /api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=25&walletConnected=true&walletAddress=0x1111111111111111111111111111111111111111&fundedNotionalUsd=25`
10. `GET /api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=25&walletConnected=true&walletAddress=0x1111111111111111111111111111111111111111&fundedNotionalUsd=25`
11. `POST /api/activations` without auth
12. `GET /api/activity` without auth
13. `GET /api/executions` without auth

## Exact Results

- Qualification result: `onboarding.default_basket`, mode `basket`, manifest `onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`, recommendation `rec_onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`.
- Qualification activation truth: `executionState=funding_required`, `activationReady=false`, `depositRequired=true`.
- Public-safe preview without wallet: `surfaceTruth=preview`, `executionState=wallet_required`, `executionEligibility=preview_only`.
- Public-safe handoff without wallet: `state=stay_public_preview`.
- Activation preview with wallet-connected plus funded readiness inputs at `$25`: `surfaceTruth=live`, `executionState=ready`, `executionEligibility=executable`.
- Public-safe handoff with wallet-connected plus funded readiness inputs at `$25`: `state=ready_for_authenticated_activation`.
- Manifest wallet requirements from current local catalog: `requiresWallet=true`, `requiresSmartAccount=false`, `minFundingUsd=0`, `preferredFundingProvider=privy`, `topUpAsset=USDC`.

## Exact Boundaries

- Qualification boundary: repo-owned and passing.
- Public-safe handoff boundary: repo-owned and passing.
- Activation-preview truth boundary: repo-owned and passing.
- Deposit boundary status:
  `open` without wallet readiness.
  `closed for preview classification` once wallet-connected and funded readiness inputs are supplied at `$25`, because preview reaches `ready` plus `executable`.
- Authenticated boundary status: blocked in this environment before activation save starts.
- Execution boundary status: blocked in this environment before execution request creation starts.

## Exact Blocker

The strongest truthful blocker from the current environment is:

`Privy auth verification requires PRIVY_APP_ID, PRIVY_APP_SECRET, and PRIVY_JWKS_URL.`

That blocker was returned by:

- `POST /api/activations`
- `GET /api/activity`
- `GET /api/executions`

## Missing Inputs To Continue

1. Backend Privy verification config: `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_JWKS_URL`.
2. A real authenticated user access token linked to the wallet that will own the activation.
3. A real operator-approved wallet context for the funded lane.
4. Hermes remote host or entrypoint details if this same run is to be repeated on Hermes instead of the local workspace.

## Reusable Artifacts

- `summary.json`
- `environment-redacted.txt`
- `qualification-broad-cautious.json`
- `qualification-fixtures/summary.json`
- `http/activation-preview-no-wallet.json`
- `http/public-agent-handoff-no-wallet.json`
- `http/activation-preview-ready.json`
- `http/public-agent-handoff-ready.json`
- `http/activation-create-no-auth.json`
- `http/activity-no-auth.json`
- `http/executions-no-auth.json`
