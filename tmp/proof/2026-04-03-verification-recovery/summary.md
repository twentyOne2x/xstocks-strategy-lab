# 2026-04-03 Verification Recovery

## Local repo matrix

- `pnpm lint`: pass
- `pnpm test`: pass
- `pnpm build`: pass
- `pnpm check`: pass
- `pnpm --filter @xstocks/worker test`: pass
- `pnpm --filter @xstocks/workflow-client build`: pass
- `pnpm --filter @xstocks/workflow-server build`: pass
- `node --test apps/api/test/api.test.js`: pass
- `node --test apps/api/test/provider-rebalance-api.test.js`: pass
- `pnpm --filter @xstocks/api test`: pass
- `pnpm --filter @xstocks/api build`: pass
- `pnpm --filter @xstocks-strategy-lab/shared build`: pass
- `pnpm --filter @xstocks-strategy-lab/web test`: pass
- `pnpm --filter @xstocks-strategy-lab/web build`: pass
- `cd apps/web && pnpm exec vitest run src/lib/manual-execution.test.ts src/lib/api-client.test.ts`: pass
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:validate`: pass
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xstocks_strategy_lab' pnpm prisma:generate`: pass
- `git diff --check`: pass

## Public host recheck

- `GET https://24-7.markets/onboarding`: `200`
- `GET https://24-7.markets/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`: `404`
- `GET https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`: `404`
- `GET https://24-7.markets/api/runtime/autoresearch?limit=1`: still returns `truthBoundary=worker_runtime_only`, `recurringAutonomousProven=false`, `schedulerHost=null`
- `GET https://24-7.markets/onboarding`: HTML still includes stale manifest slugs such as `ai-infra-autopilot`

## Remaining blocker

- Repo code is locally green.
- Recovery slice merged to `origin/main` as `c1436e79b8aaf20c41c7442e9ec58e7bea41a6f8` via PR `#7`.
- Immediate post-merge public checks still returned the same `404` activate/detail responses and stale runtime payload.
- Public deploy parity is still stale.
- Exact tooling blocker in this environment:
  - no `.vercel` project link present in the repo worktree,
  - `vercel` CLI not installed,
  - `railway whoami` fails with `invalid_grant`.
