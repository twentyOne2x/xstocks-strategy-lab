# 2026-04-05 Canonical Frontend Close Attempt

## Scope

- Live authenticated Brave session on `24-7.markets`
- Canonical public hosted `1inch` buy route
- Trusted CDP mouse events instead of DOM `.click()` so the wallet handoff counts as a real user gesture

## Strongest Truth

1. The canonical frontend path is real and functional through the wallet handoff:
   - onboarding recommendation page
   - `SEE MY PORTFOLIO`
   - `SKIP` tour overlay
   - `START DEPOSIT`
   - `Continue with a wallet`
   - `Brave Wallet`
2. That trusted-click path opened the real Brave wallet panel at `chrome://wallet-panel.top-chrome/crypto/unlock`.
3. The current frontend blocker is external wallet state, not a broken app surface:
   - wallet panel text: `Unlock wallet`
   - wallet panel text: `Enter password to unlock wallet`
4. No landed onchain transaction exists yet, so the hosted `1inch` lane is still not done under `XSL-005D`.

## Key Artifacts

- [trusted-click-brave-attempt-2.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/trusted-click-brave-attempt-2.json)
- [trusted-click-brave-attempt-2.png](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/trusted-click-brave-attempt-2.png)
- [wallet-panel-unlock-state.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/wallet-panel-unlock-state.json)
- [wallet-panel-unlock-state.png](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/wallet-panel-unlock-state.png)
- [after-start-deposit.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/after-start-deposit.json)
- [after-continue-wallet.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/after-continue-wallet.json)
- [after-brave-wallet-click.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-enso-frontend-close-20260405/tmp/proof/2026-04-05-frontend-close-live/after-brave-wallet-click.json)

## Notes

- Earlier DOM-triggered `.click()` attempts were weaker because wallet connectors can reject non-trusted gestures.
- The trusted CDP mouse-event run is the canonical proof for this frontend boundary.
