# xStocks Right-Rail Prod Exposure Closure

Date: 2026-04-03
Owner: `XSL-018A`
Status: active

## Goal

State exactly where the rebalance right rail is live today and what still blocks calling the deep-link route fully closed on prod.

## Audited Truth

1. The right rail is implemented on `main` via:
   - [apps/web/src/components/rebalance-control-panel.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/rebalance-control-panel.tsx)
   - [apps/web/src/components/terminal-shell.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/terminal-shell.tsx)
2. Browser proof from this pass shows the rail visibly rendered with fail-closed controls in the public onboarding preview shell:
   - [detail-desktop.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-desktop.png)
   - [detail-mobile.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-mobile.png)
3. The visible top-level action is still fail-closed:
   - disabled `Execute all unavailable`
   - explicit review-only / operator-gated state.
4. Direct detail-route fetches on `24-7.markets` still return the Next.js 404 shell at audit time:
   - [detail-canonical.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-canonical.headers)
   - [detail-legacy.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-legacy.headers)
5. This pass landed a narrow web fix so server-rendered pages can derive the API base from deployment origin when `NEXT_PUBLIC_API_URL` is unset. Prod route closure still depends on merge/deploy proof.

## Closure Decision

1. The right rail is publicly visible in the onboarding preview journey today.
2. The deep-link detail route is not yet truthfully closed until the deployed build is rechecked after the API-origin fix ships.
3. This lane must not be described as “fully shipped on the canonical detail route” yet.

## Remaining Check

1. Merge and deploy the web API-origin fix.
2. Recheck:
   - [https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1)
   - confirm no repo-tracked public proof still depends on a retired showcase alias.
3. If the deep-link route renders the same fail-closed rail, close `XSL-018A`. Otherwise keep the onboarding preview shell as the strongest public proof.
