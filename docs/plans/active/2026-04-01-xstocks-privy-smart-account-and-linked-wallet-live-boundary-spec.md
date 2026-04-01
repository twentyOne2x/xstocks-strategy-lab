# xStocks Privy Smart-Account And Linked-Wallet Live Boundary Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Close the remaining Privy live-boundary gap for xStocks by:
1. deciding the canonical production posture for the current Ethereum CoW lane,
2. proving whether the lane is linked-wallet-first, smart-wallet-required, or dual-mode with one canonical public branch,
3. removing stale `smart_account_required` and `minRequiredUsd: 1000` implications wherever they no longer match deployed truth,
4. and making the chosen boundary testable through agent surfaces and `skill.md`.

## Non-goals

This workstream does not:
1. reopen landing-page redesign or general frontend polish,
2. reopen Chainlink CRE implementation,
3. add new execution venues,
4. claim full signed CoW settlement if quoteability still blocks the basket,
5. force the product to require a smart wallet if the truthful live lane does not.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: very high.
   - Decision: reuse as the stack-selection baseline.
   - Why: it already owns the Privy, CoW, funding, and smart-account baseline but not the exact live proof boundary.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: keep as the umbrella owner and create this sub-spec alongside it.
   - Why: the authenticated execution proof lane is now too broad to also own the detailed linked-wallet versus smart-wallet truth contract without duplication.
3. [apps/web/public/skill.md](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/public/skill.md)
   - Current relevance: high.
   - Decision: update later if the canonical public posture changes.
   - Why: the public agent-start surface must not imply a smart-wallet requirement that the real live lane no longer needs, or omit one that truly exists.
4. [docs/runbooks/xstocks-operator-execution-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md)
   - Current relevance: high.
   - Decision: update later through implementation.
   - Why: the internal proof path must explicitly verify the chosen Privy boundary.

## Current Live Truth

1. The earlier stale Railway preview contract that returned `smart_account_required`, `not_created`, and `minRequiredUsd: 1000` is no longer the latest deployed backend truth after the verified Railway redeploy.
2. Latest hosted proof in [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md) shows a real Privy-authenticated production session with linked wallet `0xa28ded32f0bde74c42739b5b3fdc79bca0c571b2`, no smart wallet linked, successful activation save, successful execution create, and real per-leg CoW venue responses.
3. No hosted proof artifact currently shows a real Privy smart-wallet bootstrap or a production execution path that depends on a smart wallet.
4. Public and repo-facing language is still mixed: some older surfaces and historic probes imply `smart_account_required`, while current policy/tests say the current CoW lane can be live without a smart wallet.

## Current Local Implementation Audit

### Shipped

1. backend Privy access-token verification and authenticated owner binding.
2. execution-plan derivation that can mark the current CoW lane `smartAccount.readiness = "not_required"`.
3. policy tests proving a `$25` authenticated CoW basket lane becomes live without a smart wallet.
4. hosted proof showing the linked-wallet path reaches the real quote boundary.

### Partial

1. frontend and public-surface alignment to the current Privy boundary.
2. explicit smart-wallet bootstrap proof path.
3. operator and agent runbooks that make the canonical branch obvious.

### Spec-only or unproven

1. a production-proven smart-wallet-required execution branch,
2. a canonical product decision on whether smart wallet is required, optional, or deferred for the current CoW lane,
3. agent-safe public/internal verification surfaces that distinguish linked-wallet truth from smart-wallet truth cleanly.

## Symptom Contract

Observed problem:
1. users and operators still see contradictory smart-account signals across repo history, backend probes, and public surfaces.
2. older production probes showed `smart_account_required`, while current local policy/tests and latest hosted proof show the live quote boundary is reachable without a smart wallet.
3. the repo lacks one canonical answer to “is a Privy smart wallet actually required for the current xStocks CoW lane?”

## Likely Culprits / Ranked Hypotheses

1. Most likely: the product and deploy posture moved from mandatory smart-wallet gating toward linked-wallet-first execution, but not every surface or plan was realigned.
2. Likely: the stale `smart_account_required` contract reflected an older backend deploy and remained sticky in thread memory after Railway was updated.
3. Possible: a smart-wallet-required branch is still intended for a later lane, but current docs/copy blur that future posture into the current one.

## Non-obvious Alternatives

1. The smart-wallet path may still be required for a later execution branch, but not for the current user-approved CoW lane.
2. The linked-wallet proof may be sufficient for MVP, and the remaining issue is only public/testability clarity rather than runtime capability.
3. The real blocker may be quoteability only, with smart-wallet confusion masking that the current lane already advanced past the wallet requirement.

## Falsifiers / What Would Disprove The Current Theory

1. A new production proof showing execution cannot progress past activation without a real Privy smart wallet would falsify the current linked-wallet-first interpretation.
2. A deployed smart-wallet bootstrap flow reaching a distinct execution boundary would prove the smart-wallet branch is not merely deferred scaffolding.
3. A fully aligned public/backend/agent surface already reflecting linked-wallet sufficiency would falsify the need for additional smart-account realignment work.

## Product Outcome Contract

When this workstream is done:
1. xStocks has one canonical answer to whether the current CoW lane requires a smart wallet,
2. public product copy, backend contracts, and proof docs all tell the same story,
3. stale `smart_account_required` implications no longer leak into the current production lane if linked-wallet execution is the truthful branch,
4. or a real smart-wallet-required bootstrap lane exists and is proven if that is the chosen branch.

## User-Journey Contract

For the current execution lane, the user journey must be one of the following and only one may be the canonical public posture:
1. `Privy auth -> linked wallet -> activation save -> execution create -> quote/approval/submission`,
2. `Privy auth -> embedded wallet -> smart-wallet bootstrap -> activation save -> execution create -> quote/approval/submission`.

The product must not imply both as equally current unless both are proven and the default branch is explicit.

## State-And-Truth Contract

### Wallet / Privy State

1. `unauthenticated`
2. `authenticated_no_wallet`
3. `authenticated_linked_wallet`
4. `embedded_wallet_pending`
5. `embedded_wallet_ready`
6. `smart_wallet_pending`
7. `smart_wallet_ready`
8. `smart_wallet_not_required`

### Allowed Claims

1. “Privy connected” only if the backend verifies the access token and binds one canonical user.
2. “Linked wallet ready” only if one verified linked wallet address exists.
3. “Smart wallet ready” only if the smart-wallet address exists and the current lane actually uses it.
4. “Smart wallet optional” only if local policy and hosted proof both show the current execution lane reaches the next truthful boundary without a smart wallet.
5. “Smart wallet required” only if the current deployed execution lane blocks without it.

### Disallowed Claims

1. stale `smart_account_required` on the current public execution lane if linked-wallet proof is canonical,
2. implying smart-wallet live proof from scaffolding alone,
3. implying linked-wallet sufficiency if the deployed lane still truly blocks on smart-wallet bootstrap.

## Measurement / Proof Contract

Required proof categories:

1. Local proof
   - policy and API tests for both `not_required` and `required` branches,
   - exact execution-plan derivation output for the canonical branch.
2. Deployed-host proof
   - production `POST /api/activations` and `POST /api/executions` behavior under authenticated context,
   - explicit activation/execution payload showing the canonical Privy boundary.
3. Browser proof
   - canonical frontend route(s) show the same boundary as the backend,
   - no stale `smart_account_required` or stale minimum-funding state on the chosen branch.
4. Agent proof
   - public `skill.md` can guide the correct public path,
   - internal skill/runbook can reproduce the authenticated verification path.

## Acceptance Score Vs Proof Provenance

| Area | Local tests | Hosted/backend proof | Browser proof | Closure rule |
| --- | --- | --- | --- | --- |
| Linked-wallet sufficiency | required | required | required | close only if all three agree |
| Smart-wallet-required branch | required | required | required | close only if all three agree |
| Public/agent alignment | optional | optional | required | close only when skill/runbook/public wording matches canonical truth |

## Critical Assumptions And Invalidators

### Assumptions

1. Privy remains the authentication and wallet provider for the current execution lane.
2. CoW remains the current live execution rail.
3. The current promoted basket quoteability blocker is separate from the smart-account truth boundary.

### Invalidators

1. Privy provider changes or product direction intentionally requires smart-wallet-only execution.
2. Hosted proof discovers the linked-wallet path can no longer reach authenticated execution create.
3. The frontend canonical activation surface diverges materially from the backend contract.

## Migration / Coexistence / Deprecation Contract

1. Keep both linked-wallet and smart-wallet code branches only while the canonical public posture is being finalized.
2. Once the canonical branch is proven, stale public wording and stale backend preview assumptions for the non-canonical branch must be removed from user-facing surfaces.
3. Smart-wallet scaffolding may remain in code if it is explicitly classified as future, optional, or non-canonical for the current lane.

## Data / Privacy / Retention Contract

1. Privy access tokens, refresh tokens, and secrets must never be committed.
2. Linked-wallet and smart-wallet addresses may appear in proof artifacts only when masked by default unless the operator-runbook explicitly requires the real address.
3. Execution-request IDs, quote IDs, order UIDs, and tx hashes may be stored in proof notes and runtime records because they are part of the truthful execution boundary.

## Owners And Decision-Rights Contract

1. `apps/api` and `packages/policy` own the runtime truth and eligibility decision.
2. `apps/web` owns only the reflection of the canonical boundary, not the underlying rule.
3. `apps/web/public/skill.md` and internal runbooks own agent-testability wording after runtime truth is decided.
4. `XSL-014` remains the umbrella owner lane; this sub-spec owns the narrowed Privy boundary.

## Agent-Testability Contract

Public agent path must verify:
1. `/skill.md` explains the current public Privy boundary truthfully,
2. `/onboarding` and `/activate/[manifestSlug]` do not imply the wrong wallet requirement.

Internal agent path must verify:
1. authenticated Privy session binding,
2. whether a linked wallet alone reaches activation save and execution create,
3. whether any smart-wallet bootstrap step is truly mandatory for the current lane,
4. exact blocker if the smart-wallet branch is still unproven.

Required internal surfaces:
1. [skills/xstocks-activation-truth/SKILL.md](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-activation-truth/SKILL.md)
2. [docs/runbooks/xstocks-operator-execution-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/runbooks/xstocks-operator-execution-proof.md)

## Verification Commands

1. `pnpm --dir packages/policy check`
2. `pnpm --dir apps/api check`
3. `node --test --test-name-pattern "verified CoW basket rails become live at the requested notional without a smart wallet" packages/policy/test/policy.test.js`
4. `node --test --test-name-pattern "authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet|execution quote, approval, submission, and receipt actions persist live CoW truth" apps/api/test/api.test.js`
5. authenticated production probe covering activation save, execution create, and the next truthful hosted boundary
6. browser proof for `/skill.md` and the canonical activation route

## Acceptance Criteria

1. One canonical answer exists for the current CoW lane: `linked_wallet_sufficient`, `smart_wallet_required`, or `dual_mode_with_explicit_default`.
2. The canonical answer is backed by local tests and at least one hosted proof artifact.
3. Public and internal agent surfaces reflect the same canonical answer.
4. If the canonical answer is `linked_wallet_sufficient`, stale `smart_account_required` and stale funding-minimum implications are removed from the current public execution story.
5. If the canonical answer is `smart_wallet_required`, a real bootstrap path with proof artifacts exists and the repo no longer relies on linked-wallet-only claims for the current lane.

## Rollback / Recovery Contract

1. If hosted proof contradicts the chosen branch, revert public/product wording to the last proven branch immediately.
2. Keep non-canonical code branches fail-closed until they have their own proof artifact.
3. Do not retire smart-wallet scaffolding until the chosen branch is stable across local, deployed-host, and browser proof.

## Decision Log

1. 2026-04-01: kept `XSL-014` as the umbrella owner instead of creating a duplicate issue lane.
2. 2026-04-01: created a dedicated sub-spec because the smart-account question is now a distinct execution-boundary problem, not just a footnote inside broader CoW proof work.
3. 2026-04-01: treated agent-testability as a first-class requirement because public `skill.md` and internal runbooks must stop propagating stale wallet-requirement assumptions.

## Progress Log

1. 2026-04-01: audited current repo truth and latest hosted proof; local policy/tests and hosted proof both point to linked-wallet sufficiency for the current live quote boundary, while stale historical surfaces still imply smart-wallet gating.
2. 2026-04-01: split this live-boundary problem into its own execution-grade sub-spec under `XSL-014`.
