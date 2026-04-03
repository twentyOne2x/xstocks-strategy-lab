# 2026-04-03 Prod Parity Redeploy

## Deployment

1. Vercel project: `xstocks-strategy-lab-web-preview`
2. Production deployment id: `dpl_4w35481YsNzPnkMSCMqAjD4CzxMc`
3. Production deployment URL: [https://xstocks-strategy-lab-web-preview-n3xub9946.vercel.app](https://xstocks-strategy-lab-web-preview-n3xub9946.vercel.app)
4. Canonical alias: [https://24-7.markets](https://24-7.markets)
5. Inspect proof: [vercel-inspect.txt](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/vercel-inspect.txt)

## Public Route Proof

1. [https://24-7.markets/onboarding](https://24-7.markets/onboarding) returns `200` and no longer serves retired showcase slugs.
2. [https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1) returns `200`.
3. [https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1](https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1) returns `200`.
4. Header proof:
   - [activate.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/activate.headers)
   - [detail.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.headers)
5. HTML proof:
   - [activate.html](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/activate.html)
   - [detail.html](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail.html)
6. Positive marker extracts:
   - [activate-positive-markers.txt](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/activate-positive-markers.txt)
   - [detail-positive-markers.txt](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/detail-positive-markers.txt)
7. Retired onboarding slug hits file is empty:
   - [onboarding-legacy-slug-hits.txt](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/onboarding-legacy-slug-hits.txt)

## Root Cause And Fix

1. The first redeploy removed stale onboarding HTML but left canonical deep-link routes returning `404`.
2. The exact cause was server-side `AbortSignal.timeout(5000)` in [apps/web/src/lib/api-client.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-client.ts). On prod, same-host `workspace` and `activation-preview` API requests could take about 10 seconds, so SSR route loaders aborted and fell into `notFound()`.
3. The fix raises only the server-side timeout to `15000ms` and keeps the client timeout at `5000ms`.

## Runtime API Truth

1. [https://24-7.markets/api/runtime/autoresearch?limit=1](https://24-7.markets/api/runtime/autoresearch?limit=1) still returns:
   - `truthBoundary = worker_runtime_only`
   - `recurringAutonomousProven = false`
   - `schedulerHost = null`
2. This is current repo truth, not a stale deploy symptom.
3. Runtime proof capture:
   - [runtime-autoresearch.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-prod-parity-redeploy/runtime-autoresearch.json)
