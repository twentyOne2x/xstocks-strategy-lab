# Authenticated Brave Browser Attempt

Date: 2026-04-04
Repo: /Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator

Backend proof results:
- Shared 1inch direct proof: `/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/oneinch-fusion-2026-04-03T22-26-02.460Z/summary.json`
  - exact state: `awaiting_approval`
  - exact blocker: `missing_user_signature` for 6 quoted core legs
- Enso direct proof: `/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-portfolio-2026-04-03T22-25-02.099Z/summary.json`
  - exact state: `blocked`
  - exact blocker: upstream Enso bundle `500 Internal server error` plus existing `AUSD` Ethereum/USDC metadata gap

Frontend/browser results from the real authenticated Brave session:
- Canonical activate route in live Brave is still a not-found shell, not an execution surface.
- Live onboarding route is the real actionable frontend surface.
- Privy on onboarding exposes `caid`, but no page-local `privy:access_token` or `privy:refresh_token`.
- The wallet connect flow can be driven to the real provider chooser.
- `Backpack` falls back to a QR/scan flow.
- `Brave Wallet` opens a real browser wallet panel at `chrome://wallet-panel.top-chrome/crypto/unlock`.
- Exact frontend-side blocker is now explicit: the Brave wallet is locked and requires the wallet password to continue.
- Additional direct provider finding: `window.ethereum` exists and reports a Brave/MetaMask-compatible injected provider on chain `0x1`, but `selectedAddress` remains `null` until the wallet is unlocked/approved.

Exact current closure blockers after using the authenticated Brave browser:
1. Frontend/canonical route blocker: `/activate/...` still renders `View not found` in the real browser.
2. Hosted/shared 1inch blocker: missing user signatures after six live quotes.
3. Frontend wallet blocker: Brave Wallet unlock password is required before account selection/signing can continue.
4. Enso blocker: upstream bundle quote/execution returns `500` and `AUSD` metadata is incomplete for this lane.

Retry update:
- A second direct `eth_requestAccounts` call was attempted against the same live onboarding tab after the Brave wallet panel disappeared.
- Exact result: the browser returned `4001` / `The user rejected the request.`
- The injected provider still reports chain `0x1`, but `selectedAddress` remains `null` after the rejection.
