## 2026-04-03 legacy showcase route cleanup

- Branch: `codex/remove-ai-infra-autopilot-paths`
- Scope: remove retired showcase slug aliases from repo-tracked web routes, fallback fixtures, tests, and active docs.

### Verification

- `rg -n "ai-infra-autopilot|mag7-cash-balance|spy-core-shield|mstr-conviction-long" . -S -g '!node_modules/**' -g '!tmp/proof/**'`
  - result: no matches
- `pnpm --filter @xstocks-strategy-lab/web test`
  - result: pass, 47 tests
- `cd apps/web && pnpm exec vitest run src/lib/promoted-manifest-identity.test.ts src/lib/data-source.test.ts src/lib/shared-contract-adapter.test.ts src/components/portfolio-buy-surface.test.tsx`
  - result: pass, 20 tests
- `PRODUCTIVITY_DISPATCHER_THREAD_ID=local pnpm --filter @xstocks-strategy-lab/web build`
  - result: pass
- `git diff --check`
  - result: pass

### Live host note

- `https://24-7.markets/onboarding` still serializes the retired showcase slugs in the served HTML at capture time.
- Evidence files:
  - `onboarding-live.html`
  - `onboarding-live-slug-hits.txt`
