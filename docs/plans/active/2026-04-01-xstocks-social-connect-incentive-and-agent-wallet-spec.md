# xStocks Social Connect, Incentive, And Agent Wallet Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Spec one execution-grade workstream that adds:
1. Twitter / X OAuth to xstocks,
2. a dashboard-level `Connect X` surface,
3. a connect incentive such as `$5` credited to the account, agent, or portfolio,
4. and a wallet path that can be created for the agent or user to reduce onboarding friction.

## Non-goals

This workstream does not:
1. make X login the only way into xstocks,
2. fake live autonomous execution,
3. make the agent an unbounded custodian,
4. auto-follow, auto-DM, or auto-trade users on connect,
5. ship a full CRM or marketing automation suite in v1,
6. bypass legal, consent, or anti-abuse controls.

## Product Outcome Contract

When this workstream is done enough for MVP:
1. a user can connect their X account from the dashboard or activation-adjacent flow,
2. xstocks can persist the user’s X identity and consent state cleanly,
3. the product can grant one bounded onboarding credit such as `$5`,
4. the user can receive or create a wallet as part of onboarding,
5. and the agent can operate with a wallet context that is explicit, scoped, and fail-closed.

## User-Journey Contract

The desired journey is:
1. user completes onboarding or lands in the preview dashboard,
2. user sees `Connect X` as an optional but high-value next step,
3. user authorizes X/Twitter OAuth,
4. user sees what xstocks captured, what follow-up is allowed, and what credit they received,
5. user gets an embedded wallet or wallet connection path without extra setup pain,
6. user can move toward deposit and activation from the same flow,
7. agent assistance can use the wallet context only within explicit product permissions.

Interaction budget target:
1. one X connect action,
2. one consent screen,
3. zero manual wallet setup if embedded-wallet creation is used,
4. no hidden follow-up permissions.

## Symptom Contract

Observed problem:
1. xstocks has qualification, preview, recommendation, and activation-readiness truth,
2. but it still lacks a real identity, retention, and follow-up surface,
3. and onboarding still depends too heavily on the user reaching deposit intent without a stronger account-capture step.

Likely culprit:
1. the repo has no user-auth/session lane and no CRM or identity substrate.

Non-obvious alternatives:
1. wallet-first identity capture could be sufficient without social OAuth,
2. email-only capture could be simpler than X,
3. connect incentives could create abuse pressure that outweighs conversion gains.

Falsifiers:
1. if wallet-first onboarding converts well enough without identity loss, X connect matters less,
2. if the X app approval/scopes materially block the desired follow-up behavior, the lane must narrow,
3. if incentive abuse controls are weak, the `$5` credit should not ship.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. turn xstocks from a mostly anonymous preview app into an identity-aware onboarding and activation product without creating fake automation or unbounded custody.

User UX:
1. easier onboarding,
2. one-click identity capture,
3. optional but clear `Connect X`,
4. fewer wallet setup steps,
5. cleaner path from preview to deposit.

Sustainability:
1. higher retained lead capture,
2. lower drop-off before deposit intent,
3. bounded incentive spend,
4. reusable identity surface for future follow-up and CRM.

Safety:
1. explicit consent,
2. no silent social actions,
3. no hidden wallet custody,
4. no autonomous trading claim,
5. abuse-resistant incentive logic.

Maintainability:
1. one canonical user identity model,
2. one canonical social-connection model,
3. one canonical incentive ledger,
4. one wallet-creation boundary,
5. no frontend-only auth logic.

## Current Live Truth

As of 2026-04-01, current repo truth is:
1. `apps/web` has no user auth dependencies such as NextAuth, Clerk, or Supabase in [apps/web/package.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/package.json).
2. `apps/api` is manifest-driven and runtime-store-backed, but it does not yet expose a user/session/auth surface in [apps/api/src/services/api-service.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/services/api-service.js) and [apps/api/src/repositories/runtime-store.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/api/src/repositories/runtime-store.js).
3. `packages/policy` already contains real qualification and agent-qualification logic in [packages/policy/src/qualification.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/qualification.js).
4. `packages/shared` already defines an `agentQualification` contract in [packages/shared/src/contracts/qualification.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/qualification.ts).
5. The current wallet substrate is still a scaffold centered on `privy_embedded` with `liveExecution: false` in [packages/policy/src/smart-account.js](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/policy/src/smart-account.js).
6. The current execution boundary remains `operator_manual` in [packages/shared/src/contracts/execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/contracts/execution.ts).
7. No repo-owned user table, consent ledger, reward ledger, or social identity repository exists yet.

## Current Local Implementation Audit

### Shipped

1. Qualification and recommendation logic.
2. Agent-qualification contract shape.
3. Activation and execution-request contracts.
4. Smart-account provider scaffolding with `privy_embedded` as the preferred funding direction.

### Partial

1. Wallet-readiness and activation logic exist, but only as preview/readiness scaffolding.
2. A future embedded-wallet path is implied by the Privy scaffold, but not implemented.
3. Dashboard and activation surfaces exist in the frontend, but there is no auth-owned `Connect X` lane.

### Spec-only or unproven

1. X/Twitter OAuth.
2. user identity persistence,
3. session management,
4. consent capture for follow-up,
5. incentive credit issuance,
6. abuse control for social connect rewards,
7. agent wallet issuance or delegation semantics,
8. dashboard CTA and follow-up UX tied to a real identity backend.

### Completion reconciliation

1. completion relative to current execution/funding specs = partial.
2. completion relative to repeated thread asks = not started for this lane.
3. completion relative to prior implementation claims = no prior lane claimed complete.
4. verified implementation and proof status = social identity and incentive lane absent.
5. canonical frontend functioning status = no auth-connected product lane exists yet.

## Codebase Fit And Iteration-Speed Contract

codebase fit = extend existing plus extract one new identity module.

existing logic to reuse:
1. manifest-driven qualification and recommendation in `packages/policy`,
2. runtime-store persistence posture in `apps/api`,
3. smart-account scaffold in `packages/policy/src/smart-account.js`,
4. existing activation and execution contracts in `packages/shared`.

new entrypoints required = yes.

Why:
1. X OAuth requires dedicated callback and token-handling endpoints,
2. user identity and consent cannot live only in the frontend,
3. incentive issuance needs a canonical backend ledger,
4. wallet issuance needs a real service boundary rather than UI-only flags.

structural refactor assessment = same-tranche beneficial.

iteration-speed hotspots assessed:
1. avoid putting OAuth logic into `apps/web` adapters,
2. avoid hiding durable identity logic in one API route file,
3. keep reward logic separate from execution orchestration.

build/deploy fan-out assessment:
1. frontend should only consume session and connect status,
2. provider SDKs for OAuth or embedded-wallet creation should stay backend-owned unless the wallet provider requires browser participation,
3. any provider-specific client code should stay narrowly scoped to the onboarding/activation surface.

intended file/package boundaries:
1. `packages/shared/**`
   - contracts for user identity, social connection, consent, and connect reward status.
2. `packages/policy/**`
   - decision logic for whether a user is eligible for a connect reward or an agent wallet.
3. `apps/api/**`
   - OAuth start/callback/session endpoints, persistence, reward issuance, and wallet bootstrap orchestration.
4. `apps/web/**`
   - later, dashboard CTA and presentation only.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: high.
   - Decision: update indirectly, do not replace.
   - Why: it already owns funding stack and Privy direction, but not identity, social connect, or incentives.
2. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: medium.
   - Decision: extend later once this lane is implemented.
   - Why: it tracks current closeout, but does not own a new identity workstream.
3. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: medium.
   - Decision: update later for CTA placement.
   - Why: frontend should consume this lane after backend truth exists.
4. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: high.
   - Decision: new spec alongside.
   - Why: this is a new workstream crossing identity, onboarding, wallet, and retention.

New alongside is justified because no current spec truthfully owns:
1. social identity,
2. explicit consented follow-up,
3. connect incentives,
4. or agent-wallet onboarding.

## Thread-Synthesis Conclusion

This is one coherent workstream, not a whole new umbrella program.

The lane breaks into four tightly related implementation slices:
1. X/Twitter connect,
2. consented follow-up identity,
3. bounded connect incentive,
4. embedded or agent-friendly wallet creation.

## Spec'd-But-Unimplemented Table

| Item | What should exist | What repo proves now | Missing | Gap type |
| --- | --- | --- | --- | --- |
| X connect | User can connect X from dashboard | nothing | OAuth flow, session, persistence | backend/frontend |
| Social profile | Canonical stored X identity | nothing | user/social models and repository | backend/data |
| Consent | Explicit follow-up consent and scope | nothing | contract, UI, persistence | backend/frontend |
| Connect reward | `$5` onboarding credit or equivalent | nothing | reward ledger, abuse controls, issuance logic | backend/policy |
| Agent wallet | Wallet to ease onboarding | scaffold-only Privy direction | creation/bootstrap flow and ownership model | backend/integration |
| Dashboard CTA | `Connect X` on dashboard | no auth CTA truth | placement and connected-state UI | frontend |

## Product-Surface Contract

### Dashboard placement

`Connect X` belongs on the dashboard only when:
1. the user has a recommendation or preview context,
2. the user is not yet connected with X,
3. and the product can immediately explain the benefit:
   - save profile,
   - unlock onboarding credit,
   - enable follow-up and product updates,
   - speed up activation.

It should not appear as:
1. the first blocking step before qualification,
2. a generic login wall,
3. or a hidden settings-only feature.

### CTA shape

Preferred CTA copy:
1. `Connect X`
2. supporting line: `Save your profile, unlock your onboarding credit, and continue with a wallet ready for activation.`

Connected state:
1. show connected X identity,
2. show reward status,
3. show wallet status,
4. show whether follow-up consent is enabled.

## Identity And Consent Contract

Required stored fields:
1. internal user id,
2. X user id,
3. username,
4. display name,
5. avatar URL,
6. token metadata and refresh posture,
7. granted scopes,
8. connect timestamp,
9. consent flags:
   - product follow-up,
   - marketing follow-up,
   - social action permissions if ever added later.

Mandatory rule:
1. OAuth consent is not enough for follow-up marketing consent.

V1 recommended scopes:
1. `users.read`
2. `offline.access`

Later-only scopes:
1. `follows.write`
2. `dm.read`
3. `dm.write`

Do not request follow or DM scopes in v1 unless the product genuinely uses them on day one.

## Incentive Contract

The user vision here is:
1. on connect, give `$5` to the account or agent or portfolio.

Canonical v1 interpretation:
1. treat the `$5` as an onboarding credit,
2. not as unrestricted withdrawable cash,
3. and not as silent portfolio funding before the user understands what happened.

Recommended v1 form:
1. `activation credit USD 5.00`
2. tied to the connected user identity,
3. visible on dashboard and activation surfaces,
4. applicable toward first activation or funding gap,
5. one-time only per verified eligible identity.

Disallowed v1 forms:
1. instantly transferable cash reward,
2. reward issued before abuse checks,
3. reward issued to a free-floating agent identity with no user ownership link.

Abuse-control minimums:
1. one credit per verified X user id,
2. one credit per wallet or account cluster,
3. cooldown and replay protection,
4. manual review or blocklist path,
5. reward ledger with issued, reserved, applied, reversed states.

## Agent Wallet Contract

The user vision here is:
1. give a wallet to the agent to ease onboarding.

Canonical v1 interpretation:
1. give the user an embedded wallet or smart-account path at connect time,
2. allow the agent to operate against that wallet context only through explicit bounded permissions,
3. do not create an autonomous free-custody agent wallet that the user cannot inspect or control.

Recommended model:
1. `user-owned embedded wallet`
2. optional `agent session authority` or `agent-scoped wallet context`
3. permissions limited to:
   - qualification,
   - preview generation,
   - activation preparation,
   - deposit guidance,
   - later operator-manual execution preparation if that lane exists.

The wallet should support:
1. creation without separate seed-phrase UX if embedded wallet is used,
2. explicit ownership mapping to the user record,
3. later smart-account upgrade path,
4. pause / revoke / disconnect controls.

The wallet should not support in v1:
1. autonomous live trading,
2. hidden spending authority,
3. irreversible social-triggered execution,
4. agent-only ownership with no user recovery path.

## Data And Persistence Contract

New data surfaces required:
1. user identity record,
2. social connection record,
3. consent record,
4. connect reward ledger,
5. wallet bootstrap record,
6. audit trail for connect, reward issuance, reward application, and revocation.

The current JSON runtime store is not a durable long-term home for this lane.
This workstream should prefer a real database-backed persistence surface before shipping beyond local proof.

## API Contract

Minimum new API surfaces:
1. `POST /api/auth/x/start`
2. `GET /api/auth/x/callback`
3. `GET /api/me`
4. `POST /api/me/connect-reward/claim` or server-issued equivalent
5. `POST /api/me/wallet/bootstrap`
6. `GET /api/me/dashboard-state`

Each surface must fail closed when:
1. provider credentials are missing,
2. required scopes are absent,
3. the reward was already claimed,
4. wallet bootstrap already exists,
5. or the identity cannot be trusted.

## Frontend Contract

Frontend should consume, not invent:
1. X connection state,
2. reward state,
3. wallet bootstrap state,
4. consent state.

Canonical v1 surfaces:
1. dashboard right rail or main workspace CTA,
2. activation surface,
3. account/settings surface once that exists.

Do not gate the whole app on X connect.

## Security And Compliance Contract

Mandatory truths:
1. no auto-follow, auto-like, auto-DM, or auto-post in v1,
2. no overclaim that connecting X means funds are live,
3. no hidden custody,
4. no reward issuance without replay protection,
5. no marketing follow-up without explicit consent capture,
6. no silent sharing of user X data into agent actions beyond product permissions.

## Implementation Waves

### Wave 1: canonical backend and contract substrate

1. Add shared contracts for user, social identity, consent, reward, and wallet bootstrap.
2. Add repo-backed persistence surface for those records.
3. Add policy helpers for reward eligibility and wallet bootstrap eligibility.

Exit claim:
1. xstocks can represent this lane truthfully in contracts and storage.

### Wave 2: X connect and session flow

1. Add X OAuth start and callback.
2. Add session surface and `/api/me`.
3. Persist social identity and scopes.

Exit claim:
1. xstocks can connect a user’s X identity and store it truthfully.

### Wave 3: connect reward

1. Add one-time `$5` activation-credit issuance logic.
2. Add reward ledger and abuse checks.
3. Expose reward state in dashboard-state payload.

Exit claim:
1. xstocks can grant a bounded onboarding credit on connect.

### Wave 4: wallet bootstrap and agent context

1. Add embedded-wallet or smart-account bootstrap path.
2. Bind it to the connected user.
3. Expose bounded agent wallet context and revocation truth.

Exit claim:
1. xstocks can connect identity and provide a wallet-ready activation path.

### Wave 5: frontend consumption and proof

1. Add `Connect X` CTA on dashboard.
2. Show reward and wallet-ready state.
3. Browser-verify connect -> reward -> wallet-ready -> deposit CTA path.

Exit claim:
1. the canonical product path uses this lane coherently.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Social connection success | 0 | at least 1 local proof user can connect X | local auth proof |
| Reward issuance correctness | 0 | one successful issue, one blocked replay | tests plus ledger proof |
| Wallet bootstrap readiness | scaffold only | 1 successful wallet bootstrap proof | API plus provider proof |
| Frontend CTA coherence | none | dashboard shows correct connected/reward/wallet states | browser screenshots |
| Abuse resistance | none | duplicate claim blocked | tests |

## Verification And Proof Contract

Required verification:
1. backend tests for OAuth callback validation, replay rejection, reward issuance, and wallet bootstrap,
2. end-to-end local run showing connect -> persisted user -> reward state -> wallet state,
3. browser screenshots for disconnected dashboard, connected dashboard, rewarded dashboard, wallet-ready activation state,
4. explicit env and provider prerequisites,
5. proof that directional remains preview-only and unchanged by this lane.

## Exit Criteria

This workstream can count as complete enough for MVP only when:
1. a user can connect X from xstocks,
2. xstocks stores identity and consent truthfully,
3. a one-time `$5` onboarding credit can be issued safely,
4. a wallet-ready onboarding path exists,
5. the agent wallet context is bounded and user-owned,
6. dashboard and activation surfaces show the lane coherently,
7. and the lane has local and browser proof.

## Derived Next Roadmap

After this workstream:
1. email or CRM follow-up can be added on top of explicit consent,
2. richer account state can feed activation nudges and lifecycle messaging,
3. social graph or audience enrichment can stay optional,
4. X follow or DM actions should remain a separate later spec, not creep into v1.
