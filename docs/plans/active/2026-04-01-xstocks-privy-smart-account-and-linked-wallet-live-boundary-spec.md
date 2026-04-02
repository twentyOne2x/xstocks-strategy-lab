# xStocks Privy Smart-Account And Linked-Wallet Live Boundary Spec

Date: 2026-04-01
Last updated: 2026-04-02
Owner: Codex
Status: active
Canonical issue: `XSL-005`
Supporting proof lane: `XSL-014`

## Goal

Upgrade the existing Privy smart-account boundary from posture-only ambiguity into execution-grade implementation planning that:
1. makes Privy smart accounts the canonical account-ownership, destination, and policy surface for future automation,
2. freezes one exact target branch and rejects the alternatives explicitly,
3. defines the exact code/runtime changes required across `packages/policy`, `apps/api`, and `apps/web`,
4. separates the current manual signer surface from the future smart-account-first automation posture,
5. defers AA-native venue signing on CoW or 1inch until a later explicit proof lane,
6. and leaves one exact hosted proof bar only before the repo may claim smart-account-first execution posture.

## Non-goals

This planning pass does not:
1. implement runtime behavior,
2. open a new owner lane outside `XSL-005`,
3. duplicate the hosted-proof owner work already tracked in `XSL-014`,
4. force every current manual order to sign from the smart account now,
5. assume CoW or 1inch are already smart-account-native execution rails,
6. own final CRE autonomy policy or provider-triggered auto-submit rules,
7. or treat a UI-only smart-wallet indicator as execution closure.

## Existing-Spec Inventory

| Artifact | Current relevance | Decision | Why duplication is not justified |
| --- | --- | --- | --- |
| [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md) | canonical execution/funding owner lane | reuse | `XSL-005` already owns the rail, funding, and Privy boundary; this sub-spec should stay under it |
| [2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-privy-smart-account-and-linked-wallet-live-boundary-spec.md) | existing narrow smart-account boundary doc | update | this is already the right supporting surface; it needed execution-grade implementation planning, not replacement |
| [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md) | downstream hosted execution proof lane | reuse | proof ownership stays in `XSL-014`; this doc now defines the smart-account-first runtime contract that `XSL-014` must prove |
| [docs/ISSUES.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/ISSUES.md) | canonical issue ownership map | update only as needed | the issue map already points this gap at `XSL-005`; only plan-link alignment is needed |

## Thread-Recurrence Audit

1. The same underlying problem has now appeared in three places: the original `XSL-005` owner spec, the earlier posture-only smart-account boundary doc, and the `XSL-014` hosted-proof continuation notes.
2. Prior work proved current linked-wallet hosted progress, but it did not freeze the future execution-account model that would make smart accounts the real execution surface.
3. The active thread is still one bounded workstream inside `XSL-005`, so a backlog-wide priority matrix is not needed.

## User Vision Freeze

When this work closes:
1. manual or user-approved execution remains wallet-first, using a linked wallet or embedded-wallet signer when that is the truthful current venue path,
2. automation and future CRE-triggered execution require a Privy smart account as the canonical account-ownership surface,
3. the smart account becomes the canonical execution destination and policy container before AA-native venue signing is claimed,
4. AA-native venue signing on CoW or 1inch remains explicitly deferred until separately proven,
5. and the repo has one exact hosted proof bar for smart-account-first execution posture rather than multiple competing interpretations.

## Current Runtime Truth

1. `packages/policy` currently hard-overrides the wallet-first Ethereum basket execution lane to `requiresSmartAccount=false` and `minFundingUsd=0` in [wallet-requirements.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/wallet-requirements.js), covering the current linked-wallet execution routes on `cow_swap.ethereum` and `1inch.ethereum`, so the effective manual readiness model is linked-wallet-first even when manifest metadata says otherwise.
2. [smart-account.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/smart-account.js) already prefers the smart-account address as the destination address when the smart account is ready, but for the current manual lane it returns `readiness: "not_required"` and keeps bootstrap optional.
3. [execution-plan.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/execution-plan.js) treats `SMART_ACCOUNT_NOT_REQUIRED` as a fully complete preparation step, so the current manual execution plan can become `ready` without any smart-account bootstrap.
4. [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) resolves the settlement address by preferring a ready smart account, but resolves the execution signer by falling back to the embedded wallet or linked wallet only. The current manual venue request therefore uses two different account surfaces when a smart account exists.
5. The current API execution request builder stores `receiver: settlementAddress` and `owner: signerAddress`, so smart-account settlement and EOA ownership diverge structurally.
6. `apps/api` already verifies linked smart-wallet addresses from Privy identity claims in [privy-auth.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/privy-auth.js) and [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js), but the runtime does not yet separate manual signing posture from automation account posture.
7. [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx) now mounts `SmartWalletsProvider` and exposes app-config plus linked smart-wallet state, but current hosted proof still over-refreshes Privy identity on load and needs a narrow dedupe/backoff guard.
8. [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) already proves the live bridge truth on the current real user: linked wallet, embedded wallet, smart wallet, manual signer, policy account, execution destination, and `automationReadiness=ready`.
9. [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx) and [rebalance-control-panel.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/rebalance-control-panel.tsx) still need one narrow repair so preview surfaces derive from live wallet truth when present and saved activation truth when live wallet state is absent.
10. Hosted proof in [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md) currently proves the truthful linked-wallet manual branch only: activation save, execution create, and live venue quote truth without a smart wallet.

## Current Local Implementation Audit

| Area | Shipped | Partial | Missing or stale |
| --- | --- | --- | --- |
| `packages/policy` | readiness derivation, funding-path shaping, smart-account inspection, tests | destination prefers smart account if present | canonical execution-account model is still linked-wallet-first for current manual basket venues |
| `apps/api` | authenticated owner binding, smart-wallet address verification, execution request persistence, venue quote/approval/submission scaffolding | settlement already prefers smart account | signer ownership, approval scheme, and stored execution account still fall back to EOA |
| `apps/web` | real Privy auth/connect, `SmartWalletsProvider`, wallet banner bridge truth, local activation/right-rail post-enable proof | live preview surfaces still need authenticated refresh to replace public fallback copy | hosted deploy still serves the pre-fix crash path and repeated Privy refresh loop |
| hosted proof | authenticated linked-wallet hosted boundary | per-leg quote truth only | no hosted smart-account bootstrap, no hosted manual-versus-automation posture proof, no hosted bridge-state proof |

## 2026-04-02 Live Repro Addendum

1. After Privy smart wallets were enabled for app `equityterminal` (`cmnfzikzk02ey0ckyx8m14qv2`) on Ethereum mainnet, a full logout/login on `2026-04-02` proved the same real Privy user now resolves all three account layers:
   - linked external wallet = `0xa28ded32f0bde74c42739b5b3fdc79bca0c571b2` (`wallet_client_type="backpack"`, `connector_type="injected"`)
   - embedded wallet = `0xc3a79c8551bd33e3a17539df6db85a5989e22e3a` (`wallet_client_type="privy"`, `connector_type="embedded"`)
   - linked smart wallet = `0x00c6bf8ba9244eb50089410007f778868cc1ce39` (`type="smart_wallet"`, `smart_wallet_type="safe"`)
2. The local activation save snapshot for that same refreshed user proves the repo-owned bridge contract now closes truthfully:
   - `manualSignerAddress = 0xc3a79c8551bd33e3a17539df6db85a5989e22e3a`
   - `policyAccountAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`
   - `executionDestinationAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`
   - `automationExecution.readiness = ready`
3. The remaining failures after enablement are surface/runtime bugs, not linkage existence:
   - hosted route repeatedly 429s `https://auth.privy.io/api/v1/users/me`
   - hosted route crashes with `TypeError: Cannot read properties of undefined (reading 'manualSignerAddress')`
   - local activation preview still returns null `bridgeState` and `automationReadiness="wallet_required"` even when the live wallet banner and saved activation snapshot both prove the smart-account bridge is ready
4. Exact current repair scope:
   - add the minimum refresh dedupe/backoff needed around Privy identity-token refresh so repo-owned surfaces stop over-hitting `/users/me`
   - make hosted and local preview surfaces derive bridge truth from live wallet state when present
   - make those same surfaces fall back to the saved activation/execution snapshot when live wallet state is absent
   - keep manual venue signing wallet-first and explicitly defer AA-native CoW / 1inch signing
5. Strongest truthful claim after this repair: on the exact `XSL-005` activation slug, both local and hosted now render the same real Privy smart-wallet bridge truth without crashing or downgrading to `wallet required`: manual signer remains the embedded wallet, the Privy Safe is the canonical `policyAccountAddress` and `executionDestinationAddress`, automation reads `ready`, and venue signing remains `wallet_signer_manual_only`.
6. Verified result after the narrow repair and browser pass:
   - local activation now shows `manualSignerAddress = 0xc3a79c8551bd33e3a17539df6db85a5989e22e3a`, `policyAccountAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`, `executionDestinationAddress = 0x00c6bf8ba9244eb50089410007f778868cc1ce39`, `automationReadiness = ready`, and `Current blocker = None` on the real Privy session;
   - the local right-rail account panel now consumes the same live-or-saved preview truth instead of rendering the stale public fallback labels;
   - the exact hosted route `https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1` now matches that same bridge truth on the real session, no longer reproduces the old `manualSignerAddress` crash, and showed one `https://auth.privy.io/api/v1/users/me` resource hit in the verified browser load;
   - a separate pre-existing hosted `ai-infra-autopilot` tab in the same session still displayed the generic client-side exception shell with five `users/me` resource hits, but that route is outside this exact repair slice.

## Completion Reconciliation

1. Completion relative to the earlier posture-only smart-account spec = partial. It documented the ambiguity, but it did not define the implementation contract that would remove it.
2. Completion relative to repeated thread asks = unresolved. The repo still cannot answer “what exact code path turns smart accounts into the real execution surface?” with one canonical runtime contract.
3. Completion relative to prior implementation claims = linked-wallet hosted progress is real, but any broader smart-account-first posture interpretation would be overclaimed.
4. Verified implementation and proof status = the exact `XSL-005` activation route now proves coherent smart-wallet bridge truth on both local and hosted real-session loads; AA-native venue signing and broader hosted-route stability remain outside this slice.
5. Canonical frontend functioning status = the canonical activation route now functions truthfully for auth/connect plus bridge-state closure on the proven real-session slug.

## Canonical Branch Decision

### Selected branch

`manual = wallet-first`

`automation = smart-account-first`

`AA-native venue signing = later explicit proof lane`

This means:
1. current manual or user-approved execution may continue to use a linked wallet or Privy embedded wallet as the venue signer when that is the truthful current rail,
2. the smart account becomes the canonical account-ownership, destination, and policy surface for automation and future CRE-driven execution,
3. CoW or 1inch smart-account-native venue signing is not assumed, not claimed, and not required for this spec to close,
4. `XSL-005` owns the account architecture and the smart-account-first posture, while the future AA-native venue-signing closure stays in a later proof lane.

### Why this branch is the canonical target

1. It matches current runtime truth instead of pretending current manual venue proof already signs from a smart account.
2. It gives automation one canonical account surface now, which is the actual architectural gap the repo still lacks.
3. It removes ambiguity by separating three distinct questions:
   - current manual signing surface,
   - smart-account-first account architecture,
   - future venue-native AA signing.
4. It keeps `XSL-005` scoped to wallet/account architecture, manual-versus-automation posture, and hosted proof for smart-account-first posture without swallowing CRE autonomy policy or venue-native signing closure.

### Exact bridge state

If the smart account is introduced first as the canonical destination and policy account before smart-account-native signing is proven, the bridge state is:
1. `manualSignerAddress` remains the verified linked-wallet or embedded-wallet signer used for current manual or user-approved venue actions,
2. `policyAccountAddress` is the verified Privy smart-account address and becomes the canonical account surface for automation, policy, and future autonomous ownership,
3. `executionDestinationAddress` points to the smart account on venue paths where a separate destination or receiver is already supported and explicitly proven,
4. if a venue path does not yet have a separately proven destination model, settlement remains on the manual signer and the smart account is still recorded as the canonical policy account only,
5. `venueSigningMode` stays `wallet_signer_manual_only` until a later AA-native venue-signing lane proves otherwise,
6. automation stays fail-closed without a verified smart account even while current manual signing remains allowed.

### Explicitly rejected branches

`everything_signs_from_the_smart_account_now`
1. rejected because current repo truth and hosted proof do not yet prove CoW or 1inch as smart-account-native signing rails,
2. rejected because it would overclaim venue capability and collapse the boundary between current manual proof and future AA-native proof,
3. rejected because the user explicitly asked not to force the spec into universal smart-account signing now.

`wallet-first_for_manual_and_automation`
1. rejected because it leaves automation without a canonical account-ownership surface,
2. rejected because it preserves the current ambiguity instead of upgrading the architecture,
3. rejected because it gives `XSL-005` no truthful smart-account-first posture to prove.

`smart-account-first_with_cre_autonomy_policy_in_scope`
1. rejected because final CRE autonomy policy and provider-triggered auto-submit rules belong to the future CRE lane, not this spec,
2. rejected because it would make `XSL-005` own autonomy decisions the user explicitly kept out of scope.

## Canonical Runtime Contract

| Surface | Canonical target |
| --- | --- |
| manual signer surface | verified linked wallet or Privy embedded wallet |
| automation ownership surface | verified Privy smart-account address |
| canonical policy container | verified Privy smart-account address |
| execution destination | verified Privy smart-account address where the current venue path already supports and proves a separate receiver; otherwise record the smart account as policy account only |
| automation readiness | `smart_account_required` |
| manual execution readiness | may remain wallet-first |
| current venue signing mode | `wallet_signer_manual_only` |
| AA-native venue signing | deferred to later proof lane |

Truth rules:
1. Manual readiness and automation readiness must be modeled separately.
2. `smart_account_required` applies to automation and future CRE-owned execution posture, not automatically to every current manual order.
3. The smart account is the canonical account-ownership and policy surface even before AA-native venue signing is proven.
4. Funding minimum remains a separate policy decision from smart-account requirement. Do not reuse `requiresSmartAccount=false` as a shortcut for `minFundingUsd=0`.
5. No runtime surface may imply that CoW or 1inch already sign natively from the smart account unless a later proof lane closes that claim explicitly.

## Exact Runtime / Code Changes

## `packages/policy`

1. In [wallet-requirements.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/wallet-requirements.js), stop overloading one `requiresSmartAccount` flag to answer both manual and automation posture. Keep the current wallet-first manual allowance where truthful, but add a distinct automation-account requirement contract.
2. Extend the policy contract to carry separate posture fields, for example:
   - `manualSigningMode: "wallet_first"`
   - `automationAccountMode: "smart_account_required"`
   - `venueSigningMode: "wallet_signer_manual_only"`
3. In [smart-account.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/smart-account.js), keep `NOT_REQUIRED` only for the current manual signing lane if that remains truthful, but add a separate automation readiness result that cannot become ready without a verified smart account.
4. Add a distinct bridge-state result for “smart account exists as policy and destination account, but venue signing is still wallet-first” so the architecture is explicit and not mistaken for AA-native signing.
5. In [execution-plan.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/execution-plan.js), split the current single readiness surface into:
   - `manualExecution`
   - `automationExecution`
   - `accountArchitecture`
   - `bridgeState`
6. Keep current manual execution capable of reaching `ready` with a linked wallet or embedded wallet when that is truthful, but make automation remain preview-only or blocked until the smart account is ready and verified.
7. Change the funding-path and destination contract so policy can name both:
   - the current manual funding or signing surface,
   - the canonical smart-account destination or policy account.
8. Add a first-class execution-account architecture object so downstream code stops inferring ownership from one mixed wallet state.
9. Add or update policy tests to prove:
   - manual execution may stay wallet-first,
   - automation remains smart-account-required,
   - bridge-state output is explicit,
   - venue-signing mode stays non-AA-native until separately changed.

## `apps/api`

1. In [api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js), stop collapsing manual signer posture and smart-account posture into one inferred execution account. Introduce separate helpers for:
   - `manualSignerSurface`
   - `policyAccountSurface`
   - `bridgeState`
2. Keep current manual execution-request creation capable of using a wallet or embedded-wallet signer where truthful, but persist the smart account separately as the canonical policy and automation account when it exists.
3. Record explicit fields on activation and execution requests for:
   - `manualSignerAddress`
   - `policyAccountAddress`
   - `executionDestinationAddress`
   - `venueSigningMode`
   - `automationAccountMode`
4. Tighten authenticated wallet-state validation so smart-account verification is required for automation-capable posture, even when current manual signer flow remains acceptable.
5. Maintain compatibility with both Privy native smart-wallet records and linked SIWE-backed smart-account records when normalizing auth context.
6. Keep current manual CoW and 1inch submission logic in the wallet-signer lane until AA-native signing is separately proven. Do not rewrite current submission handlers to assume `eip1271`.
7. Add bridge-state persistence for the current manual lane:
   - if the venue path supports a proven separate receiver, store the smart account as `executionDestinationAddress`,
   - otherwise store the smart account as `policyAccountAddress` only and keep settlement on the manual signer.
8. Add lifecycle/activity events for:
   - `embedded_wallet_ready`
   - `smart_account_ready`
   - `smart_account_verified`
   - `automation_account_ready`
   - `manual_signer_wallet_first`
9. Add or update API tests to prove:
   - current manual execution remains wallet-first,
   - automation posture remains blocked without a smart account,
   - bridge-state fields are explicit and truthful,
   - no API surface claims AA-native venue signing prematurely.

## `apps/web`

1. In [privy-provider.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/privy-provider.tsx), mount the Privy smart-wallet provider inside the base provider and configure the embedded-wallet creation posture intentionally. Do not leave smart-wallet support as an implicit dashboard-only assumption.
2. Replace [wallet-connect-button.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/wallet-connect-button.tsx) and its `useWalletState` helper with a hook that surfaces:
   - auth readiness,
   - external wallet linkage,
   - embedded-wallet readiness and address,
   - smart-wallet readiness and address,
   - bootstrap actions,
   - current manual signer posture,
   - current automation account posture.
3. Add a browser bootstrap sequence that:
   - ensures the embedded wallet exists,
   - creates or detects the smart wallet on Ethereum,
   - links the smart-account address back to the authenticated Privy user if backend verification requires it,
   - then passes the verified wallet-state contract to the backend.
4. Update [activation-screen.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/activation-screen.tsx) so the step machine is no longer one mixed funnel. It must render three distinct surfaces:
   - current manual signing surface,
   - smart-account-first account architecture,
   - future AA-native venue-signing lane as deferred.
5. Update [smart-account-panel.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/smart-account-panel.tsx) and [api-adapter.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/api-adapter.ts) to render:
   - manual signer address,
   - policy account address,
   - execution destination if supported on the current venue path,
   - automation readiness,
   - deferred AA-native signing status.
6. Keep current manual approval UI honest: it may still use wallet-first signing where truthful. Add copy and state labels that explicitly say smart-account-native signing is not yet the canonical current manual path.
7. Add browser-visible proof surfaces that show:
   - the smart-account address,
   - the current manual signer address,
   - the policy account or destination address,
   - the current venue-signing mode,
   - the exact blocker if automation posture is not yet ready.
8. Add or update frontend tests and route-proof notes to prove the canonical activation route distinguishes manual wallet-first execution from automation smart-account-first posture.

## Exact Hosted Proof Contract

The repo may claim `smart-account-first execution posture` only when one hosted proof bundle contains all of the following on the canonical served app and backend:
1. a real authenticated Privy session on the canonical host,
2. browser proof that the embedded wallet is ready,
3. browser proof that the Ethereum smart account is ready, linked, and visibly identified by address,
4. authenticated activation proof where the backend returns separate manual and automation posture fields rather than one mixed wallet state,
5. authenticated execution-plan or execution-create proof where:
   - current manual signer posture remains wallet-first,
   - smart account is recorded as the canonical policy account,
   - execution destination is smart-account-first only where the current venue path explicitly supports it,
   - venue-signing mode remains non-AA-native,
6. hosted proof that automation posture is fail-closed without the smart account and becomes ready only once the smart account is verified,
7. hosted UI or API proof that no surface claims CoW or 1inch already sign natively from the smart account,
8. one exact bridge-state artifact showing how the current manual signer and the smart-account policy or destination account coexist on the current lane.

Anything less than that exact bundle is not enough for a smart-account-first execution posture claim.

## Acceptance Criteria

1. `XSL-005` keeps ownership of the smart-account execution boundary and this doc is the updated supporting spec instead of a duplicate lane.
2. One canonical branch is frozen as `manual = wallet-first`, `automation = smart-account-first`, `AA-native venue signing = later explicit proof lane`.
3. The other two branches are rejected explicitly with technical reasons grounded in current repo truth.
4. The plan names the exact file/surface changes needed in `packages/policy`, `apps/api`, and `apps/web`.
5. The plan removes the current signer/settlement ambiguity by defining an explicit bridge state and separate manual-versus-automation account contracts.
6. The plan leaves one exact hosted proof bar only before the repo may claim smart-account-first execution posture.
7. The plan is truthful about current runtime status: linked-wallet hosted proof exists today, smart-account-first account architecture does not yet.

## Verification Commands

For this planning pass:
1. `git diff --check`

For the later implementation lane:
1. `node --test packages/policy/test/policy.test.js`
2. `node --test apps/api/test/api.test.js`
3. `pnpm --dir apps/web check`
4. canonical browser proof for the smart-account bootstrap and bridge-state route
5. one authenticated hosted reprobe covering activation save, execution create, manual-versus-automation posture, and bridge-state truth

## Rollback / Recovery Contract

1. Until the implementation lands, keep all current repo and public claims at the already proven linked-wallet hosted boundary and do not imply smart-account-first execution.
2. If implementation later lands partially, fail closed back to preview or linked-wallet historical proof rather than silently preserving mixed smart-account settlement and EOA execution ownership.
3. If Privy identity output differs between native smart-wallet records and linked SIWE-backed records, normalize both in backend auth before reintroducing any hosted claim.

## Decision Log

1. 2026-04-02: kept this file under `XSL-005` and removed the old implicit framing that treated `XSL-014` as the owner of the smart-account decision.
2. 2026-04-02: selected `manual = wallet-first`, `automation = smart-account-first`, `AA-native venue signing = later explicit proof lane` as the canonical target branch.
3. 2026-04-02: rejected universal smart-account signing now because the user explicitly kept current manual signer truth and AA-native venue-signing closure out of scope.
4. 2026-04-02: rejected wallet-first automation because it leaves future automation without a canonical smart-account ownership surface.
5. 2026-04-02: narrowed the hosted proof gap to the frontend bootstrap path: linked-wallet logins still need embedded-wallet auto-creation before Privy can link the smart account, so this continuation should change bootstrap/runtime truth only and keep manual venue signing untouched.

## Progress Log

1. 2026-04-02: audited current runtime truth across `packages/policy`, `apps/api`, and `apps/web`.
2. 2026-04-02: confirmed the current state split that must be made explicit rather than flattened: wallet-first manual signing, optional smart-account destination, missing automation account posture, and frontend proof that stops at auth/connect only.
3. 2026-04-02: upgraded the smart-account boundary from posture-only wording to execution-grade implementation planning with one exact hosted proof contract and one explicit bridge-state model.
4. 2026-04-02: on the clean worktree from updated `origin/main`, confirmed the hosted bootstrap blocker is narrower than the earlier plan wording implied: `SmartWalletsProvider` is already mounted, but linked-wallet logins still do not close embedded-wallet bootstrap or expose smart-account closure truthfully enough for browser proof.
