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

## 2026-04-01 Final Reconciliation Update

This section supersedes stale implementation-plan assumptions elsewhere in this doc.

Exact proofs reached:
1. the deployed receiver at `POST /api/internal/rebalances/provider-events` now validates ES256K JWTs, signer allowlist entries, request digests, duplicate deliveries, replayed `jti` values, and replayed digests before any state transition,
2. local verification is green across shared, policy, and API ingress coverage,
3. production first rejected the signed probe truthfully while auth config was absent,
4. after production audience plus allowlist config were set and Railway redeployed, the live receiver accepted a signed review-only event and persisted accepted receipt `provider_receipt_c3a08c54-28ba-4fbe-91ee-13d729cefb0f`,
5. the accepted live proof opened `awaiting_operator` only with `triggerSource=provider_triggered`, `baselineManifestId=onboarding.default_basket:basket-baseline-v1`, and `targetManifestId=onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted`,
6. no provider path created, quoted, signed, submitted, or confirmed a CoW order.

Exact residual caveat:
1. the accepted-path proof currently relies on a temporary proof signer allowlist entry rather than a real external Chainlink or CRE signer,
2. the accepted-path proof required a seeded baseline activation runtime context so the receiver had a real rebalance delta to evaluate,
3. those proof-only activations and the synthetic live rebalance record were removed from production runtime state immediately after proof capture, but the accepted receipt remains in the live runtime store as the audit artifact.

Exact remaining closeout work:
1. replace the temporary proof signer allowlist entry with the real provider signer,
2. rerun the accepted-path proof against a real provider-owned activation baseline rather than a seeded proof activation,
3. keep downstream execution on the existing manual, user-approved CoW boundary.
