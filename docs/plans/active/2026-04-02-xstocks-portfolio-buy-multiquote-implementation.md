# xStocks Portfolio Buy Enso Bundle Implementation

Date: 2026-04-02
Owner: `XSL-005C` under `XSL-005`
Status: active

## Objective

Replace the live `Buy with 1inch` portfolio-buy handoff with a repo-owned `Buy portfolio` flow that starts from one `USDC` input, requests one Enso bundle for the promoted default portfolio, and executes it with truthful wallet approvals.

## Non-goals

1. Do not reopen `XSL-014A` or restate the venue-routing owner lane as generic route design work.
2. Do not widen into CRE, right-rail redesign, Mesh, or unrelated auth/runtime repair.
3. Do not imply that LI.FI is the active one-transaction basket-buy lane.
4. Do not write the user-provided vendor API keys to tracked files.
5. Do not claim downstream Flowdesk sleeve settlement unless the returned Enso bundle actually includes it.

## User-Stated Desired Outcome

1. Change the visible frontend copy from `Buy with 1inch` to `Buy portfolio`.
2. Start from one `USDC` amount.
3. Route the whole promoted portfolio through Enso.
4. Keep the UX to one portfolio transaction after approval.

## Constraints And Non-Negotiables

1. Preserve the current truthful approval boundary.
2. Keep LI.FI spec-only and separate from the active Enso implementation truth.
3. Persist request and leg artifacts for the Enso bundle honestly.
4. Cover all promoted target portfolio tokens, including `AUSD`.
5. Keep the current frontend and API paths repo-owned and testable.

## Implementation Plan

1. Extend the canonical execution issue and owner docs for this implementation lane.
2. Keep API config for Enso client env-only with explicit timeouts.
3. Implement a request-level Enso bundle adapter in `apps/api`:
   - build all actionable target token legs from one `USDC` input,
   - request one Enso bundle quote for the target allocation set,
   - persist the returned bundle and approval artifacts on the execution request and legs,
   - fail closed if Enso does not return a usable portfolio bundle.
4. Keep tx-based approval and tx-based quote payloads stored truthfully for the Enso bundle lane.
5. Update the authenticated web buy flow:
   - stop hard-pinning the create action to `1inch.ethereum`,
   - replace `Buy with 1inch` copy with `Buy portfolio`,
   - surface Enso bundle preparation in status text,
   - execute Enso with one approval plus one bundle transaction,
   - persist tx hashes back to the API through the existing receipt-poll path.
6. Stop silently reusing stale blocked activations or stale non-Enso execution requests on the buy surfaces.
7. Update targeted UI copy and artifact surfaces so the approval model remains explicit.
8. Add targeted tests for backend bundle quoting and frontend execution behavior.

## Verification Plan

1. `pnpm --filter @xstocks-strategy-lab/shared build`
2. `pnpm --filter @xstocks-strategy-lab/shared test`
3. `pnpm --filter @xstocks/api test`
4. `pnpm --filter @xstocks-strategy-lab/web test`
5. `pnpm --filter @xstocks-strategy-lab/web build`
6. `git diff --check`

Expected artifacts:
1. execution request captures one Enso bundle quote and approval contract,
2. Enso quote payloads parse under shared contracts,
3. frontend buy surfaces render `Buy portfolio`,
4. the Enso execution flow passes unit coverage.

## Rollback Or Recovery

1. Keep the old 1inch-only path isolated behind git history until the Enso lane is verified.
2. If bundle execution handling proves unstable, keep the `Buy portfolio` copy change only if the runtime still fails closed and surfaces exact blockers.
3. If Enso bundle quotes are unusable for the promoted basket, fail closed and keep the existing truthful execution boundary.

## Decision Log

1. This lane remains under `XSL-005`, not `XSL-014`, because it is a downstream buy or deposit implementation built on top of already-owned execution and funding truth.
2. Enso is the active implementation substrate because the user cares about one portfolio transaction more than per-leg route provenance.
3. `AUSD` acquisition is included in scope so the buy flow covers the full promoted token map, but downstream Flowdesk settlement is not claimed without a returned route that proves it.
4. Vendor keys are env-only even though the user provided them in-thread.

## Progress Log

1. 2026-04-02: audited the current repo truth and confirmed the live buy path is still 1inch-pinned in both frontend copy and manual execution creation.
2. 2026-04-02: confirmed the backend already has tx-receipt polling and tx-shaped approval storage that can be extended for Enso bundle execution.
3. 2026-04-02: opened `XSL-005C` as the implementation lane for the portfolio buy surface refactor.
4. 2026-04-02: narrowed the active implementation from LI.FI+Enso multiquote to Enso-first after verifying that LI.FI does not truthfully provide the one-transaction xStocks basket-buy UX for this ask.
5. 2026-04-02: implemented the Enso-first bundle lane in the API and web manual-execution flow, including `Buy portfolio` copy, `quote_portfolio` request staging, Enso bundle execution, and stale-activation reuse guards.
6. 2026-04-02: repaired legacy execution regressions uncovered during verification, including `venue_router` quote compatibility, provider-triggered `execute_all` linkage serialization, and current provider-review test harness drift.
7. 2026-04-02: verification passed for `pnpm --filter @xstocks-strategy-lab/shared build`, `pnpm --filter @xstocks/api build`, `pnpm --filter @xstocks/api test`, `pnpm --filter @xstocks-strategy-lab/web build`, `pnpm exec vitest run src/lib/manual-execution.test.ts`, and `git diff --check`.
