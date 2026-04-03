# xStocks Shared 1inch Submission Funding And Custody Closure

Date: 2026-04-03
Owner: `XSL-014C` under `XSL-014`, consumed by `XSL-011B` and `XSL-018B`
Status: active

## Goal

Audit the shared `1inch` submission boundary after the invalid-bytes fix and record the exact next blocker without debugging the same substrate twice in separate lanes.

## Audited Truth

1. The shared invalid-bytes bug is already fixed on `origin/main`.
2. A fresh hosted/session-backed rerun in this pass wrote:
   - [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/summary.json)
   - [approval-payloads.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/approval-payloads.json)
   - [signature-inputs.json](/Users/user/PycharmProjects/xstocks-strategy-lab/tmp/proof/oneinch-fusion-2026-04-03T14-22-58.811Z/signature-inputs.json)
3. That rerun reached:
   - activation saved,
   - execution request created,
   - six actionable `1inch` quotes,
   - per-leg approval payloads,
   - signer-bound EIP-712 signature inputs.
4. The rerun did not reach venue submission. The exact blocker remained:
   - `code=missing_user_signature`
   - `stage=awaiting_signature`
   - signer-owned `1inch Fusion` EIP-712 signatures still required for six quoted core legs.
5. No repo-owned artifact in this worktree proves `ORDER_SAVER_ERROR / NotEnoughBalanceOrAllowance`.

## Closure Decision

1. Funding/custody is not the strongest current repo-owned blocker.
2. The strongest current repo-owned blocker is still missing signer approval.
3. This lane must not be reopened under CRE, hosted buy, or a new executor until a real rerun advances past signer approval.

## Allowed Next Move

1. Obtain the six required signer-owned `1inch` signatures on the canonical hosted/session-backed path.
2. Rerun submission once.
3. Stop at the first exact external blocker after that rerun.

## Not Allowed

1. Do not restate a local-only `ORDER_SAVER_ERROR` note as canonical repo truth.
2. Do not open a second funding/custody diagnosis lane under a different issue id.
3. Do not claim submission, venue order ids, tx hashes, or settlement until the proof bundle records them.
