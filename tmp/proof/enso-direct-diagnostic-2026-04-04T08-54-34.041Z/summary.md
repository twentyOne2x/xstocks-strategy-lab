# 2026-04-04 Enso Direct Quoteability Diagnostic

## Scope

- bypass Privy entirely,
- reuse the saved promoted-basket `execution-create.json` artifact,
- call the live Enso `wallet/approve` and `shortcuts/bundle` endpoints directly,
- test each core promoted-basket leg at its exact notional,
- test receiver sensitivity against signer vs settlement address,
- sweep the failing core names through `$200` to `$1000`,
- and record the current package-owned `AUSD` bridge truth.

## Result

1. `wallet/approve` succeeds for `USDC`.
2. `NVDAx` and `AMZNx` quote directly at the real promoted-basket notionals.
3. `MSFTx`, `AAPLx`, `METAx`, and `GOOGLx` fail direct Enso routing at the exact promoted-basket notionals.
4. Receiver choice does not change those failures.
5. The same four failing names still fail direct Enso routing when swept through `$1000`.
6. The exact six-leg core bundle still fails directly.
7. `AUSD` remains intentionally non-executable on the Ethereum boundary bridge snapshot: `supportsAtomicSwaps=true`, `address=null`, `wrapperAddress=null`.

## Exact blocker

- [summary.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/summary.json)
- `code=direct_quoteability_matrix`
- failing core legs: `MSFTx`, `AAPLx`, `METAx`, `GOOGLx`

## Supporting artifacts

- [approval.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/approval.json)
- [direct-core-cases.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/direct-core-cases.json)
- [direct-sweep-cases.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/direct-sweep-cases.json)
- [core-6leg-settlement.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/core-6leg-settlement.json)
- [core-6leg-signer.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/core-6leg-signer.json)
- [ausd-bridge-snapshot.json](/Users/user/PycharmProjects/xstocks-strategy-lab-codex-orchestrator/tmp/proof/enso-direct-diagnostic-2026-04-04T08-54-34.041Z/ausd-bridge-snapshot.json)
