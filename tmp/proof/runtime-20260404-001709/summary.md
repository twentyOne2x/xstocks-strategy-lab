# 2026-04-04 Runtime Host Reconciliation

- `GET https://24-7.markets/api/runtime/autoresearch?limit=1` proves `truthBoundary=railway_cron_service` and `recurringAutonomousProven=true`.
- The live runtime surface exposes Railway host `autoresearch-worker` in project `xstocks-strategy-lab-preview` with cron `5 17 * * *`.
- Local Railway CLI access is still blocked on this machine: OAuth refresh returns `invalid_grant`, and the current shared-env `RAILWAY_API_TOKEN` is not accepted by the CLI.

Artifacts:
- `runtime-api-limit1.json`
- `runtime-api-limit1.headers.txt`
- `runtime-proof-compare.json`
- `railway-whoami.txt`
- `railway-config-summary.json`
