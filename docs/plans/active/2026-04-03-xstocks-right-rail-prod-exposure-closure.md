# xStocks Right-Rail Prod Exposure Closure

Date: 2026-04-03
Owner: `XSL-018A`
Status: completed

## Goal

State exactly where the rebalance right rail is live today and close the canonical deep-link route only after real prod proof.

## Audited Truth

1. The right rail is implemented on `main` via:
   - [apps/web/src/components/rebalance-control-panel.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/rebalance-control-panel.tsx)
   - [apps/web/src/components/terminal-shell.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/terminal-shell.tsx)
2. Browser and curl proof now show the rail visibly rendered with fail-closed controls on both the public onboarding preview shell and the canonical deep-link detail route:
   - [summary.md](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/summary.md)
   - [detail.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.headers)
   - [detail.html](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.html)
3. The visible top-level action is still fail-closed:
   - disabled `Execute all unavailable`
   - explicit review-only / operator-gated state.
4. Direct detail-route fetches on `24-7.markets` now return `HTTP/2 200` on Vercel deployment `dpl_4w35481YsNzPnkMSCMqAjD4CzxMc`.
5. The exact root cause of the earlier `404` shell was server-side route fetching timing out after 5 seconds while the same-host `workspace` and `activation-preview` API requests were slower on prod. This pass raises only the server-side timeout to 15 seconds and keeps the client timeout at 5 seconds.

## Closure Decision

1. The right rail is publicly visible in the onboarding preview journey and on the canonical deep-link detail route.
2. The canonical public right-rail route is [https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1).
3. This lane can now be described as publicly exposed on prod, but only as a fail-closed, operator-gated rail. It does not imply autonomous execution.

## Remaining Check

1. No additional route-exposure work remains in this lane.
2. Future changes to the rail must keep the visible state fail-closed and aligned to backend truth labels:
   - deferred
   - awaiting review or operator
   - blocked
   - ready
