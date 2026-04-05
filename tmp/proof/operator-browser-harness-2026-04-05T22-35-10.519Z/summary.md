# xStocks Operator Browser Harness

Date: 2026-04-05T22:35:40.931Z
Mode: `frontend-buy`

## Browser

1. Browser: `Brave (launched by Playwright)`
2. User agent: `launchPersistentContext`
3. Wallet UI capable: `true`
4. Shared env sources loaded: `/Users/user/.config/attn/shared.env`
5. Wallet password source: `XSTOCKS_BRAVE_WALLET_PASSWORD_COMMAND`

## Steps

1. Launched dedicated Brave operator profile from `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`.
2. Loaded canonical onboarding route `https://24-7.markets/onboarding`.
3. Loaded canonical activate route `https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1`.
4. Opened dedicated wallet route `chrome://wallet/crypto/onboarding/welcome`.
5. Started Brave wallet onboarding in the dedicated profile.
6. Accepted Brave wallet terms in the dedicated profile.
7. Accepted the default supported-network selection.
8. Created a dedicated Brave wallet password in the isolated profile.
9. Bootstrapped a dedicated Brave wallet profile and confirmed provider injection on the canonical route.
10. Clicked `connect_wallet` via /connect wallet/i.
11. Did not find a clickable `see_my_portfolio` button on the current surface.
12. Did not find a clickable `skip` button on the current surface.
13. Did not find a clickable `start_deposit` button on the current surface.
14. Clicked `continue_with_wallet` via /continue with a wallet/i.
15. Clicked `brave_wallet` via /brave wallet/i.
16. Direct eth_requestAccounts probe returned `rejected`.

## Blocker

The user rejected the request.
