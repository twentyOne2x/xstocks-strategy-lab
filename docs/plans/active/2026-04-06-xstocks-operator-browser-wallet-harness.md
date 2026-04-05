# xStocks Operator Browser Wallet Harness

Date: 2026-04-06
Owner: `XSL-016`
Status: active
Canonical issue: `XSL-016`

## Objective

Create one repo-owned operator browser harness that makes authenticated frontend and wallet-gated testing repeatable instead of ad hoc.

## Non-goals

1. Do not claim any execution lane is done without a landed onchain transaction.
2. Do not store wallet passwords, seed phrases, or raw session tokens in the repo.
3. Do not require the user’s personal browsing profile as the only test surface.
4. Do not invent a second public execution route.

## Current Truth

1. The repo already has API proof runners, public/private smoke runbooks, and authenticated execution boundaries.
2. The machine already exposes a CDP endpoint on `127.0.0.1:9224`, but it currently points at a headless Brave automation profile rather than a clean wallet-UI-capable operator browser.
3. Shared env now carries a dedicated isolated-profile wallet secret command and profile path for the repo-owned harness.
4. The repo now owns one canonical command that can self-launch a dedicated Brave profile, inspect the canonical frontend route, bootstrap Brave Wallet on a clean profile, and stop at the first truthful browser/wallet blocker.
5. The current strongest isolated-browser frontier is the wallet approval boundary itself: after wallet bootstrap and provider injection, the dedicated profile currently stops at `The user rejected the request.`

## Plan

1. Add one shared-env helper for operator/browser scripts.
2. Add one launch helper for a dedicated non-headless Brave operator profile with remote debugging enabled.
3. Add one repo-owned browser harness that:
   - connects to a configured Brave CDP endpoint,
   - audits browser capability,
   - opens the canonical onboarding or activate routes,
   - bootstraps Brave Wallet on a clean dedicated profile when a secret source is configured,
   - drives the canonical wallet handoff flow,
   - unlocks the Brave wallet panel when a secret source is configured,
   - and writes proof artifacts under `tmp/proof/**`.
4. Update the `XSL-016` issue and operator runbooks so the dedicated browser profile becomes the canonical environment.
5. Run the strongest local verification matrix and one live browser-harness proof.

## Verification Plan

1. `pnpm install --frozen-lockfile`
2. `pnpm proof:browser:status`
3. `pnpm proof:browser:frontend`
4. `pnpm lint`
5. `pnpm test`
6. `pnpm build`
7. `pnpm check`
8. `git diff --check`

## Exit Criteria

1. The repo owns one dedicated operator browser command surface.
2. Wallet-password handling can come from shared env or a secret command, not repo files.
3. The harness fails closed on the exact missing setup when the browser or wallet environment is not usable.
4. Proof artifacts capture browser capability, route state, wallet bootstrap state, wallet-panel state when present, and the exact blocker or boundary reached.
