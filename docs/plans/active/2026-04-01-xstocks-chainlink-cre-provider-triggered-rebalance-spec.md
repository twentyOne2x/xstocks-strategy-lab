# xStocks Chainlink CRE Provider-Triggered Rebalance Review Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Objective

Ship `XSL-011B` only: the first real provider-triggered rebalance review ingress that authenticates signed events, persists accepted and rejected receipts, recomputes current rebalance truth, and opens `awaiting_operator` only.

## Non-goals

1. Do not touch `apps/web`.
2. Do not create autonomous CoW orders, signatures, submissions, or settlement handling.
3. Do not widen into a generic workflow engine, scheduler host, or worker-owned execution lane.
4. Do not claim CRE/Chainlink execution proof beyond a review-only ingress plus one deployed signed-event artifact.

## User-Stated Desired Outcome

1. Ship the first real CRE/provider-triggered rebalance review lane.
2. Authenticate and persist provider events.
3. Open `awaiting_operator` only.
4. Keep downstream execution on the existing manual/user-approved CoW path.

## Constraints

1. Prefer `packages/shared/**`, `packages/policy/**`, and `apps/api/**`.
2. Use `apps/worker/**` only if a local replay helper is truly useful.
3. Keep the provider path review-only and fail closed everywhere else.
4. Verification must include the exact local test commands the user named plus one deployed signed-event probe.

## Implementation Plan

1. Add shared request and receipt contracts for provider-triggered rebalance review events.
2. Add API-side ETH-JWT parsing and validation with signer allowlist, digest binding, dedupe, and replay checks.
3. Add one internal ingress route in `apps/api` for provider rebalance review events.
4. Persist every processed provider delivery as an accepted or rejected receipt with explicit reason codes.
5. Recompute current rebalance truth from promoted manifest, live state, and stored runtime context; open `awaiting_operator` only for valid review-only events.
6. Add focused shared, policy, and API tests plus a small local probe fixture path.
7. Send one deployed signed proof event to the receiver and record the exact blocker if deploy-time configuration still prevents closure.

## Verification Plan

1. `node --test packages/shared/test/rebalance.test.js`
2. `node --test packages/policy/test/rebalance-policy.test.js`
3. `node --test apps/api/test/rebalance-service.test.js`
4. Deployed signed-event probe against the API receiver

Expected artifacts:
1. green local tests for shared, policy, and API rebalance/provider paths,
2. persisted provider receipt examples for accepted and rejected flows,
3. one deployed proof receipt or one exact deploy blocker.

## Rollback / Recovery

1. Remove the new ingress route and receipt store fields.
2. Revert provider-triggered truth to fail-closed only.
3. Keep the existing manual CoW execution path untouched.

## Decision Log

- 2026-04-01: Keep the provider lane review-only and reuse the existing manual CoW execution boundary unchanged.
- 2026-04-01: Persist rejected receipts as first-class audit artifacts rather than relying on API errors alone.
- 2026-04-01: Recompute rebalance truth from repo-owned manifest/live/runtime state instead of trusting provider payload decisions.

## Progress Log

- 2026-04-01T19:40:00+02:00: Opened `XSL-011B` as the narrow provider-triggered review ingress tranche and froze scope to shared, policy, and API only.
- 2026-04-01T21:21:03+02:00: Configured production audience plus signer allowlist, redeployed Railway `api`, and captured accepted receipt `provider_receipt_c3a08c54-28ba-4fbe-91ee-13d729cefb0f` from a signed review-only probe. The live rebalance state opened `awaiting_operator` only and did not create, quote, sign, submit, or settle any CoW order.
- 2026-04-01T21:25:00+02:00: Removed the seeded proof-only activations and synthetic `awaiting_operator` rebalance record from the live runtime store after the accepted-path proof completed, leaving the accepted receipt as the audit artifact.
- 2026-04-02T04:22:49Z: Re-audited the deployed Railway `api` service from a clean `origin/main` worktree. Production still exposes only the synthetic signer allowlist entry `0x5555555555555555555555555555555555555555` / `kid=deployed-proof-key-20260401`, and the active runtime store now has zero activations, rebalances, and provider receipts for `onboarding.default_basket`. Stopped before sending any new live provider event and captured the blocker audit at `tmp/proof/xsl-011b-2026-04-02-blocker-audit/`.
- 2026-04-02T05:13:17Z: Added `.railwayignore` to exclude `tmp/` from Railway snapshots, refreshed the live receiver onto the current-main `CHAINLINK_CRE_*` auth path, bootstrapped repo-owned hot-treasury baseline activation `act_hot_treasury_provider_baseline_20260402`, and captured accepted receipt `provider_evt_rcpt_3727bf90-eae4-4a35-886a-8adc834c67a0` from `POST /api/internal/rebalances/provider-triggered-review`. The live runtime bound the correct slot/manifest/chain and opened `awaiting_operator` only with zero execution requests and zero execution-related activity events. Proof bundle: `tmp/proof/xsl-011b-live-2026-04-02T04-40-24Z/`.

## 2026-04-02 Final Reconciliation Update

This section supersedes stale implementation-plan assumptions elsewhere in this doc.

Exact proofs reached:
1. the deployed receiver at `POST /api/internal/rebalances/provider-triggered-review` now validates Chainlink-CRE `ETH_PERSONAL_SIGN` tokens, signer allowlist entries, workflow allowlist entries, request digests, duplicate deliveries, replayed `jti` values, and replayed dedupe keys before any state transition,
2. local verification is green across shared, policy, and API ingress coverage,
3. after the stale-signer/empty-runtime re-audit, Railway current-main receiver config was refreshed to use repo-owned hot signer `0xa4165fa28eeb20a87ac3f85ad36155542665ad24` plus workflow allowlist `xsl011b-provider-review-hot-20260402`,
4. the live runtime now contains baseline activation `act_hot_treasury_provider_baseline_20260402` for `onboarding.default_basket` with `manifestId=onboarding.default_basket:basket-baseline-v1`, `status=ready`, `surfaceTruth=live`, and funded hot-treasury wallet `0x188c00f138cda59cdabcc3eac1144837742281dd`,
5. the live receiver accepted signed review-only event `providerEventId=evt_20260402T051313301Z` and persisted accepted receipt `provider_evt_rcpt_3727bf90-eae4-4a35-886a-8adc834c67a0`,
6. the accepted live proof bound `slotId=onboarding.default_basket`, `targetManifestId=onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`, `baselineManifestId=onboarding.default_basket:basket-baseline-v1`, and `chain=ethereum` correctly, then opened `awaiting_operator` only with `triggerSource=provider_triggered` and `automationTruth.providerTriggeredProven=true`,
7. runtime proof after acceptance retained `activationCount=1`, `rebalanceCount=1`, `receiptCount=1`, `executionRequestCount=0`, `executionRelatedActivityEventCount=0`, `executionRequestId=null`, and `executionTriggerSource=null`, so no provider path created, quoted, signed, submitted, or confirmed a CoW order.

Exact residual caveat:
1. the accepted-path proof now uses a repo-owned hot provider signer configured on Railway, not an externally operated Chainlink or CRE signer,
2. the accepted-path proof uses a repo-owned hot-treasury historical baseline bootstrapped by the deployed backend into the live runtime store, not a user-authenticated activation saved through the standard activation flow,
3. downstream execution remains manual and user-approved only; there is still no autonomous execution proof or claim.

Exact remaining closeout work:
1. decide whether the repo-owned hot signer plus deployed hot-treasury bootstrap satisfies the canonical `XSL-011B` closure bar; if not, replace it with an externally operated provider signer and a normal authenticated activation baseline,
2. keep downstream execution on the existing manual, user-approved CoW boundary.
