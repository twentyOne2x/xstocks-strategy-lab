# xStocks Final Closure Wave Control Plane

Date: 2026-04-03
Owner: Codex
Status: active
Canonical issues: `XSL-006A`, `XSL-005A`, `XSL-005B`, `XSL-005C`, `XSL-014C`, `XSL-018A`, `XSL-011B`, `XSL-018B`

## Goal

Close the remaining product gaps without reopening solved runtime lanes, inventing new execution owners, or flattening vendor-specific truth into one vague router claim.

## Audited Start State

1. `origin/main` already contains the shared `1inch` invalid-bytes fix in [packages/xstocks/src/adapters/oneinch.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/xstocks/src/adapters/oneinch.ts).
2. The branch-only `XSL-006A` cleanup commit `01ae74ac2386a94c2e2b127de27cc00d0fa92cbd` was not on `origin/main`; this pass cherry-picked the equivalent cleanup as local commit `66fbeba7`.
3. The freshest repo-owned shared `1inch` proof still stops at signer-owned approval, not custody:
   - activation saved,
   - execution request created,
   - six actionable quotes,
   - approval payloads and signature inputs captured,
   - blocker `missing_user_signature`.
4. No repo-owned artifact in this checkout proves `ORDER_SAVER_ERROR / NotEnoughBalanceOrAllowance`.
5. Hosted buy readiness is not the first blocker anymore. The public hosted `1inch` path already reaches `awaiting_approval` when the authenticated route is exercised.
6. `Enso` code exists, but live wallet/onchain proof does not. The public default buy route cannot switch to Enso truthfully in this pass.
7. The rebalance right rail is visible in the public onboarding preview shell, but direct detail-route fetches on `24-7.markets` still return the Next.js 404 shell before this pass is deployed and rechecked.

## Workstream Outcomes In This Pass

1. Shared `1inch`
   - Re-ran the hosted/session-backed proof with a refreshed Privy session.
   - Confirmed the exact current blocker remains signer-owned `1inch Fusion` signatures.
   - Refused to restate the unproven funding/custody claim as repo truth.
2. Portfolio buy and deposit family
   - Kept `LI.FI` as spec-only.
   - Kept `Enso` as implementation candidate awaiting live proof.
   - Restored hosted `1inch` as the canonical public-default buy route in the web flow.
3. Right rail
   - Proved the panel is visible in the live onboarding preview shell with fail-closed controls.
   - Closed direct detail-route parity on prod after fixing the server-side API timeout path and redeploying Vercel.
4. Repo truth sync
   - Landed the `XSL-006A` cleanup slice onto this branch.
   - Synced the closeout docs, issue tracker, and README to the audited blocker and route truth.

## Canonical Public Routes After This Pass

1. Buy route: hosted `1inch` remains the canonical public-default path. The public entry stays [https://24-7.markets/onboarding](https://24-7.markets/onboarding), and the authenticated activation surface remains [https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1).
2. Right rail: the canonical public route is now [https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1), with the onboarding preview shell at [https://24-7.markets/onboarding](https://24-7.markets/onboarding) as the top-of-funnel companion surface. Both are live on Vercel deployment `dpl_4w35481YsNzPnkMSCMqAjD4CzxMc`.

## Proof Bundles

1. Shared `1inch` rerun:
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/summary.json)
2. Public-route audit:
   - [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/summary.md)
   - [detail-desktop.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-desktop.png)
   - [detail-mobile.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-mobile.png)
   - [onboarding-desktop.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/onboarding-desktop.png)
3. Prod parity redeploy:
   - [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/summary.md)
   - [activate.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/activate.headers)
   - [detail.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.headers)

## Exit Criteria

This closure wave is materially complete only when:
1. the public-default buy route, shared `1inch` blocker, and right-rail surface are all stated conservatively and specifically,
2. `XSL-006A` repo truth no longer depends on a branch-only cleanup,
3. any remaining blocker is one exact external requirement rather than thread drift or route ambiguity.
