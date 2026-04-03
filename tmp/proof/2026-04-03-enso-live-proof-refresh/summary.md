# 2026-04-03 Enso Live Proof Refresh

## Scope

- refresh Privy-backed live auth from the current `24-7.markets` browser session,
- rerun shared `1inch` and Enso proof harnesses with fresh auth,
- verify the live Enso approval endpoint contract against the upstream API,
- and isolate the next exact Enso blocker after the repo-owned approval-path fix.

## Results

1. Fresh browser-backed auth is valid again.
   - Decrypted the current Brave `privy-token` cookie for `24-7.markets`.
   - The bearer token was still valid at rerun time and successfully authenticated both proof runners.
2. Shared `1inch` truth did not regress.
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/oneinch-fusion-2026-04-03T21-02-14.442Z/summary.json)
   - Exact blocker remains `code=missing_user_signature` at `stage=awaiting_signature` for six live quoted core legs.
3. Enso approval-env blocking is closed.
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/enso-portfolio-2026-04-03T21-02-14.442Z/summary.json)
   - The first live rerun exposed a repo bug: the client still called dead endpoint `/api/v1/shortcuts/approve`, which now returns `404`.
4. The repo-owned Enso approval path is now fixed.
   - Live API verification:
     - [enso-core-1leg.headers](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-core-1leg.headers)
     - [enso-core-1leg.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-core-1leg.json)
   - Direct approval endpoint verification:
     - `GET /api/v1/wallet/approve` returns `200` with a real USDC approval tx.
     - the old `/api/v1/shortcuts/approve` endpoint returns `404`.
5. The next exact Enso blocker is upstream route availability, not local auth or the approval path.
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/enso-portfolio-2026-04-03T21-05-06.597Z/summary.json)
   - The full promoted-basket Enso proof now fails on bundle generation with `Enso bundle request failed with status 500`.
6. Isolated direct upstream checks narrow that blocker further.
   - Single-leg deployment-address bundle checks:
     - `NVDAx`: `200`
     - `AMZNx`: `200`
     - `MSFTx`: `404`
     - `AAPLx`: `404`
     - `METAx`: `404`
     - `GOOGLx`: `404`
   - Wrapper-address retries for the failing names also return `404`.
   - Raw failing payloads:
     - [enso-msftx-deployment.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-msftx-deployment.json)
     - [enso-aaplx-deployment.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-aaplx-deployment.json)
     - [enso-metax-deployment.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-metax-deployment.json)
     - [enso-googlx-deployment.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-googlx-deployment.json)
     - [enso-msftx-wrapper.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-msftx-wrapper.json)
     - [enso-aaplx-wrapper.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-aaplx-wrapper.json)
     - [enso-metax-wrapper.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-metax-wrapper.json)
     - [enso-googlx-wrapper.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-close-remaining-gaps/tmp/proof/2026-04-03-enso-live-proof-refresh/enso-googlx-wrapper.json)
   - The upstream failure message is `Swap not found for a required underlying of defi route, please make sure your amountIn is within an acceptable range`.
7. `AUSD` remains independently unproven on the Enso portfolio lane.
   - The live proof still reports missing Ethereum execution metadata and missing `USDC` payment-asset truth for `AUSD`.

## Strongest Current Truth

- hosted `1inch` remains the canonical public default route and still reaches six live quotes with a real signer boundary;
- Enso is implementation-present and its approval endpoint is now repo-correct;
- Enso is still not live-proven for the promoted basket because four promoted core legs are not currently quoteable through Enso at the tested notionals and `AUSD` remains a separate metadata blocker.
