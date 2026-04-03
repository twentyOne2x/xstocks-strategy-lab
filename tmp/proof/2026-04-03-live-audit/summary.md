# 2026-04-03 Live Audit Summary

Date: 2026-04-03
Host: `https://24-7.markets`

## Public route audit

1. Homepage / onboarding entry is live:
   - [onboarding-desktop.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/onboarding-desktop.png)
2. The rebalance right rail is visibly rendered in the public onboarding preview shell and remains fail-closed:
   - [detail-desktop.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-desktop.png)
   - [detail-mobile.png](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-mobile.png)
3. Direct detail-route fetches still returned the Next.js 404 shell at audit time:
   - [detail-canonical.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-canonical.headers)
   - [detail-legacy.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/detail-legacy.headers)

## API audit

1. Anonymous execution reads still fail closed:
   - [api-executions-anon.headers](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/api-executions-anon.headers)
   - [api-executions-anon.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/api-executions-anon.json)
2. Public autoresearch runtime still served stale deployed truth at audit time:
   - [api-runtime-autoresearch.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/2026-04-03-live-audit/api-runtime-autoresearch.json)
   - returned `truthBoundary = worker_runtime_only`
   - returned `recurringAutonomousProven = false`

## Current interpretation

1. The onboarding preview shell is the strongest current public proof for the right rail.
2. The public deep-link detail route still needs deploy-parity recheck after the web API-origin fix lands.
3. The public API still needs the `XSL-006A` cleanup deploy before it can reflect the seeded Railway cron proof.
