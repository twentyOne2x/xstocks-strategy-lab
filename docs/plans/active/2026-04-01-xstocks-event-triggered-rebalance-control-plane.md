# xStocks Event-Triggered Rebalance Control Plane

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Turn the current review-only rebalance stack into a truthful operator-usable control plane by:
1. reusing the completed `XSL-014A` venue-routed execution substrate instead of reopening backend route work,
2. handing accepted provider review into that same execution request contract,
3. surfacing one explicit top-level `Execute all` control on the canonical frontend,
4. and closing the remaining hosted/session-backed signer proof gap without conflating it with backend Privy configuration.

## Non-goals

This control plane does not:
1. reopen `XSL-014A` as if venue routing were still missing,
2. authorize hidden custody or silent autonomous trading,
3. treat testnet success as proof of mainnet execution,
4. replace the existing `XSL-011B` signed review ingress,
5. collapse backend auth configuration and live session-backed proof inputs into one requirement.

## User-Stated Desired Outcome

The user wants:
1. a news or provider-driven rebalance event that can enter one canonical control plane,
2. a truthful operator-usable `Execute all` path,
3. the same backend execution contract reused for later CRE or provider-triggered work,
4. and one ordered residual backlog only after `XSL-014A` completion.

## Current Live Truth

1. `XSL-011B` is materially proven for review ingress: production accepts a signed provider event and opens `awaiting_operator` only.
2. `XSL-014A` is now complete as a backend substrate under [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md).
3. The reusable backend contract now remains `executionRequest` plus `executionRequestLeg`, with explicit `runtimeOwner`, `triggerSource`, `requiredRouteId`, quote artifacts, approval payloads, venue status, and receipt slots.
4. `XSL-018B` is still unimplemented: accepted provider review stops at `awaiting_operator` instead of creating or advancing the shared execution request path.
5. `XSL-018A` is still unimplemented: the canonical frontend has no real right-rail rebalance control surface or truthful `Execute all` action.
6. `XSL-014` remains open for hosted/session-backed signer proof and served-truth closure, not for backend Privy verification config or venue-routing substrate work.

## Current Local Implementation Audit

### Shipped

1. signed provider review ingress with durable receipts,
2. completed venue-routed backend execution substrate with CoW default plus 1inch Fusion support,
3. backend Privy JWT or JWKS verification and authenticated owner binding,
4. completed closeout artifact for `XSL-014A`.

### Partial

1. authenticated proof exists only up to the strongest boundary the current environment could reach,
2. served activation and automation copy still outruns some production API truth,
3. the control plane exists only as fragmented backend and issue-level contracts, not one usable operator surface.

### Spec-only Or Unproven

1. one shared provider-review-to-execution handoff,
2. one canonical right-rail control surface plus truthful top-level `Execute all`,
3. one hosted/session-backed signer proof using the already-configured backend auth surface,
4. any later automation posture above that same path.

## Completion Reconciliation

1. completion relative to spec = partial; the backend substrate is now complete, but the program is still missing handoff, UI control, and hosted/session-backed proof closure.
2. completion relative to repeated thread asks = still incomplete; the user still cannot do `accepted provider review or event -> Execute all -> hosted/session-backed proof` through one truthful path.
3. completion relative to prior implementation claims = earlier drafts correctly identified the need for a control-plane owner, but they over-prioritized backend venue-routing work that is now complete under `XSL-014A`.
4. verified implementation and proof status = review ingress proven, backend venue-routed substrate proven, backend Privy verification proven, provider handoff unproven, control surface unproven, hosted/session-backed signer proof still blocked on live session inputs.
5. canonical frontend functioning status = no real rebalance control surface yet for event-triggered rebalance or top-level execute-all action.

## Existing-Spec Inventory

1. [2026-04-01-xstocks-oneinch-manual-execution-substrate.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/completed/2026-04-01-xstocks-oneinch-manual-execution-substrate.md)
   - Current relevance: very high.
   - Decision: reuse as completed substrate.
   - Why: it is now the canonical backend truth for venue-routed manual execution and should not stay in the active backlog.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: update.
   - Why: it now owns the residual hosted/session-backed signer proof gap rather than backend venue-routing.
3. [2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-chainlink-cre-provider-triggered-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: it already owns signed provider ingress and should not be rewritten here.
4. [2026-03-31-xstocks-terminal-frontend-experience-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-terminal-frontend-experience-spec.md)
   - Current relevance: very high.
   - Decision: reuse.
   - Why: the right rail and top-level controls remain canonical frontend responsibilities.
5. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: high.
   - Decision: update.
   - Why: it now needs to distinguish backend Privy verification config from live session-backed proof inputs.

## Thread-Recurrence Audit

Canonical repeated problems in the current thread history:
1. provider ingress was proven, but the user returned because review-only is not enough,
2. venue truth moved from CoW-only assumptions to 1inch plus CoW routing, then `XSL-014A` completed the backend substrate,
3. the user still wants one truthful operator control plane rather than isolated proof notes,
4. auth and execution proof were repeatedly described too broadly, and the exact remaining blocker is now live session-backed proof material rather than missing backend auth configuration.

## Priority Matrix

| Rank | Workstream | Recurrence | Value | Readiness | Current state | Issue / plan mapping | Thread-claimed status | Verified implementation / proof status | Verified canonical frontend status | Recommended next move |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Provider-to-execution handoff | very high | very high | high | unstarted | `XSL-018B` | implied by prior control-plane asks, not yet landed | review ingress proven; shared execution substrate proven; handoff missing | no | hand accepted provider review into `executionRequest` without adding a second executor |
| 2 | Event-triggered rebalance control surface | high | very high | medium | unstarted | `XSL-018A` | not yet claimed | no repo-owned UI control surface yet | no | add right-rail event or review surface and truthful `Execute all` affordance that consumes backend readiness |
| 3 | Hosted/session-backed signer proof | high | high | medium | partial | `XSL-014` | repeatedly conflated with auth config | backend Privy verification config is real; live session token, optional identity token, and signer-owned signature input are still missing from clean proof environments | partial | prove the existing substrate with live session-backed proof input or capture the exact blocker |
| 4 | Testnet proof inventory | medium | medium | high | planning-only | `XSL-017` | newly opened | no supported matrix yet | not applicable | inventory chains and venues in parallel without using testnet as a substitute for mainnet proof |

## Privy Boundary Contract

### Backend Privy verification config

This group is deploy or runtime configuration already owned by backend auth verification:
1. `PRIVY_APP_ID` or `NEXT_PUBLIC_PRIVY_APP_ID`
2. `PRIVY_APP_SECRET`
3. `PRIVY_JWKS_URL`
4. optional `PRIVY_API_BASE_URL`

### Live user-session proof inputs

This group is ephemeral proof material that must come from a real hosted or session-backed user run:
1. `XSTOCKS_PRIVY_ACCESS_TOKEN`
2. optional `XSTOCKS_PRIVY_IDENTITY_TOKEN`
3. venue-specific user signature input such as `XSTOCKS_ONEINCH_ORDER_SIGNATURE` or `XSTOCKS_COW_ORDER_SIGNATURE`
4. signer wallet or smart-account address overrides only when linked-account data is insufficient

### Rules

1. Missing backend config means runtime auth verification is not deployed correctly.
2. Missing access token, identity token, or user signature means the deployed backend may still be correct, but the proof run cannot truthfully start or complete.
3. `XSL-018B` and `XSL-018A` consume readiness from this boundary; they do not redefine backend Privy verification.

## Product Outcome Contract

When this program is materially closed:
1. accepted provider review or operator-created event can enter the same control plane,
2. the operator can explicitly start a rebalance from the canonical app,
3. the system can stage and execute through the shared venue-routed backend contract,
4. hosted/session-backed proof input can drive that same path to the furthest truthful boundary,
5. and later automation can reuse the same path instead of inventing a second hidden one.

## User-Journey Contract

1. a provider event or operator thesis appears in the right-side panel,
2. the operator reviews what changed and the resulting portfolio delta,
3. the operator stages or advances the rebalance through the shared execution path,
4. the operator sees exact route, readiness, quote, approval, and blocker truth,
5. the operator hits `Execute all`,
6. hosted or session-backed proof input drives the signer-owned approval boundary,
7. each leg routes through the truthful backend venue path,
8. and later provider-triggered or automated reuse still points to the same contract and proof surfaces.

## State-And-Truth Contract

1. `provider-triggered` review ingress remains real and separate from execution staging until `XSL-018B` lands.
2. `Execute all` is an explicit operator action until automation is separately proven.
3. every execution leg must persist:
   - target asset,
   - target notional,
   - selected venue,
   - quote artifact,
   - approval or signature artifact,
   - submission artifact,
   - receipt or exact blocker.
4. backend auth verification state must remain distinct from live proof input availability.
5. no automation claim may outrun the explicit proof level of the underlying venue-routed execution lane plus hosted/session-backed signer boundary.

## Workstream Map And Sequencing

### Residual workstreams

1. `XSL-018B` Provider-To-Execution Handoff
2. `XSL-018A` Event-Triggered Rebalance Control Surface
3. `XSL-014` Hosted/Session-Backed Signer Proof
4. `XSL-017` Testnet Proof Surface And Harness

### Ordered sequence

1. land `XSL-018B` first because the backend substrate already exists and the next missing contract is provider review into shared execution staging,
2. land `XSL-018A` second so the canonical frontend binds to the real handoff and readiness model instead of inventing mock state,
3. land hosted/session-backed signer proof third under `XSL-014`, using the already-configured backend auth surface plus live proof inputs from a real session,
4. run `XSL-017` in parallel only as a supporting proof lane, not as a substitute for mainnet or hosted closure.

## Proof Artifacts

Required program-level artifacts:
1. one accepted provider-review-to-execution handoff artifact,
2. one browser proof pack for the right rail control surface and truthful `Execute all` affordance,
3. one hosted/session-backed signer proof bundle or exact blocker summary,
4. one summary separating backend auth config truth from live proof-input truth,
5. one summary stating manual proof level separately from later automation proof level.

## Exit Criteria

This control plane is materially closed only when:
1. accepted provider review can hand off into the shared execution request path,
2. the canonical frontend exposes a real rebalance control surface and truthful `Execute all`,
3. one hosted/session-backed signer proof exists for the reused backend substrate or the last blocker is exact and external,
4. any later automation claim remains bounded to the same proven route and signer truth.

## Rollback / Recovery

1. Keep `XSL-011B` review ingress intact even if the handoff layer fails.
2. Allow the frontend control surface to degrade to review-only if execution staging is not yet ready.
3. Do not reopen completed `XSL-014A` substrate work unless fresh proof falsifies the closeout.

## Decision Log

- 2026-04-01: `XSL-014A` is complete and should be reused as substrate rather than treated as the next backlog item.
- 2026-04-01: the correct residual order is `XSL-018B`, then `XSL-018A`, then hosted/session-backed signer proof under `XSL-014`.
- 2026-04-01: backend Privy verification config and live session-backed proof input must remain separate in every downstream spec.

## Progress Log

- 2026-04-01: Reconciled the control-plane umbrella after `XSL-014A` completion and collapsed the residual backlog to one ordered sequence.
