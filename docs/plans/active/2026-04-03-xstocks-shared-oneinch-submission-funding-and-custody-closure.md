# xStocks Shared 1inch Submission Funding And Custody Closure

Date: 2026-04-03
Owner: `XSL-014C` under `XSL-014`, consumed by `XSL-011B` and `XSL-018B`
Status: active

## Goal

Audit the shared `1inch` submission boundary after the invalid-bytes fix and record the exact next blocker without debugging the same substrate twice in separate lanes.

## Audited Truth

1. The shared invalid-bytes bug is already fixed on `origin/main`.
2. The strongest authenticated hosted/session-backed rerun still wrote:
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/summary.json)
   - [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/approval-payloads.json)
   - [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/signature-inputs.json)
   - [signer-packet.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T23-13-29.688Z/signer-packet.json)
3. That authenticated rerun reached:
   - activation saved,
   - execution request created,
   - six actionable `1inch` quotes,
   - per-leg approval payloads,
   - signer-bound EIP-712 signature inputs.
4. That authenticated rerun did not reach venue submission. The exact blocker remained:
   - `code=missing_user_signature`
   - `stage=awaiting_signature`
   - signer-owned `1inch Fusion` EIP-712 signatures still required for six quoted core legs.
5. An earlier same-day rerun briefly stopped at:
   - `code=proof_request_failed`
   - `stage=environment_or_authentication`
   - `message="Privy access token is expired."`
6. That auth-expired regression is now superseded: the latest rerun verified fresh access-token auth, recreated fresh `activationId` plus `executionRequestId`, and returned to the same signer-owned boundary.
7. The proof runner now supports both `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON` and `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH`, and it writes a richer signer packet once the quote path is reached.
8. No repo-owned artifact in this worktree proves `ORDER_SAVER_ERROR / NotEnoughBalanceOrAllowance`.

## Closure Decision

1. Funding/custody is still not the strongest current repo-owned blocker.
2. The last authenticated proof boundary is still missing signer approval, and the immediate operator blocker on this machine is no longer auth expiry; it remains signer-owned approval for the six quoted core legs.
3. The next integration surface is the proof-runner signature injection path that already exists in `apps/api/scripts/oneinch-fusion-proof.js` via `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON` or `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH`.
4. This lane must not be reopened under CRE, hosted buy, or a new funding/custody diagnosis until one signer-fed rerun advances past the signer boundary.

## Allowed Next Move

1. Consume the captured signer packet and `signature-inputs.json` from the latest authenticated rerun.
2. Supply the six signer-owned `1inch` EIP-712 signatures through `XSTOCKS_ONEINCH_ORDER_SIGNATURES_JSON` or `XSTOCKS_ONEINCH_ORDER_SIGNATURES_PATH`.
3. Rerun submission once against the canonical hosted/session-backed path.
4. Stop at the first exact external blocker after that rerun.

## Not Allowed

1. Do not restate a local-only `ORDER_SAVER_ERROR` note as canonical repo truth.
2. Do not open a second funding/custody diagnosis lane under a different issue id.
3. Do not claim submission, venue order ids, tx hashes, or settlement until the proof bundle records them.
