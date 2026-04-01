# xStocks Rebalance Automation And Execution Orchestration Spec

Date: 2026-03-31
Owner: Codex
Status: active

## Goal

Define the execution-grade automation and orchestration lane that decides:
1. what actually triggers a rebalance,
2. what runs offchain versus onchain,
3. whether automation is operator-triggered, cron-triggered, or provider-triggered,
4. how smart-account execution is staged and confirmed,
5. what role, if any, Chainlink Automation, CRE, CCIP, or similar providers truthfully play,
6. and what proof must exist before the repo can claim live automated portfolio management rather than preview/readiness only.

This workstream exists because the product needs to understand itself honestly:
1. how good the autoresearch loop is,
2. how good the portfolio construction output is,
3. and how or whether rebalancing and execution automation actually happens.

## Non-goals

This workstream does not:
1. assume Chainlink Automation, CRE, or CCIP are already part of the live product when repo proof does not exist,
2. turn the MVP into a full autonomous multi-chain execution network,
3. bypass the promoted-manifest and policy boundary,
4. overclaim live onchain automation for directional strategies,
5. replace the research, portfolio, or rails specs.

## Current Live Truth

1. The repo has rebalance semantics, rebalance thresholds, rebalance UI, and activation-preview concepts.
2. The repo does not currently prove a live rebalance scheduler, cron worker, workflow engine, keeper integration, or onchain executor.
3. The only worker entrypoints under [/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src) are:
   1. `seed-basket-baselines.js`
   2. `seed-directional-preview.js`
   3. `generate-promoted-manifests.js`
   4. `check.js`
4. `apps/api` is currently a request/response API. It has no scheduler or background execution owner in repo truth.
5. The frontend exposes rebalance windows, rebalance triggers, readiness labels, and execution ladders, but those are still preview/readiness surfaces unless live execution proof exists.
6. Public xStocks and current repo truth do not yet prove a concrete Chainlink-branded automation path for rebalancing.
7. Current local proof is enough for basket-first preview/demo closure, but not enough to claim automated live portfolio rebalancing.

## Current Local Implementation Audit

### Shipped

1. Promoted-manifest and policy boundary for basket and directional preview.
2. Rebalance thresholds in research slot definitions and promoted incumbents.
3. Activation-preview payloads and smart-account readiness surfaces.
4. Rebalance and lifecycle user-facing preview surfaces in `apps/web`.

### Partial

1. Execution ladder and required-state surfaces exist in preview.
2. Route truth and fallback conditions exist.
3. Smart-account readiness exists as a UI and policy concept, not as a fully proven live automation owner.

### Spec-only Or Unproven

1. Real rebalance trigger source ownership.
2. Scheduler or workflow ownership.
3. Onchain execution path and confirmation loop.
4. Pause, retry, and fail-closed automation controls.
5. Chainlink Automation, CRE, or CCIP integration truth.
6. Proof of what is automatic versus operator-triggered.

## Symptom Contract

Observed problem:
1. the product talks about rebalancing and execution readiness,
2. but the repo does not yet prove how live automated rebalancing would actually happen.

## Likely Culprits

1. The current milestone prioritized truthful preview and promoted-manifest boundaries before automation.
2. Rails and automation were discussed together, but they are not the same workstream.
3. No execution-grade automation owner doc previously existed.

## Non-obvious Alternatives

1. The product may only need operator-triggered execution for longer than expected.
2. A simple offchain scheduler plus smart-account execution may be enough without Chainlink.
3. Chainlink may belong only to proof or cross-chain coordination later, not to MVP rebalance triggering.

## Falsifiers / What Would Disprove This Theory

1. If repo or provider proof already exists for a working Chainlink-driven rebalance loop, this spec is too heavy.
2. If operator-triggered rebalancing is the intended product even long-term, the automation lane shrinks materially.
3. If the product decides to stay preview-first indefinitely, live orchestration stops being a current-gap lane.

## Product Outcome Contract

When this workstream is complete enough for truthful live-automation claims:
1. the product can state exactly what triggers a rebalance,
2. exactly what component decides whether to act,
3. exactly what component stages and signs execution,
4. exactly what is automatic versus operator-triggered,
5. exactly how pause, retry, and blocked states work,
6. and exactly what proof supports any Chainlink, cron, workflow, or onchain-executor claim.

## User-Journey Contract

The canonical user-visible outcome for this lane is:
1. the user sees when the portfolio is only previewing rebalances,
2. the user sees when a rebalance is merely recommended,
3. the user sees when a rebalance is scheduled or awaiting operator confirmation,
4. the user sees when a rebalance has been executed,
5. and the user never mistakes preview/readiness language for live automation.

The canonical operator journey is:
1. read promoted rebalance intent and policy truth,
2. inspect live route, funding, and account readiness,
3. confirm or reject the execution path,
4. observe scheduler/provider state,
5. inspect execution outcome and failure handling,
6. pause or override automation if required.

## Primary Outcome And Four-Axis Contract

Primary outcome:
1. one truthful automation/orchestration contract for rebalancing and execution.

User UX:
1. clear difference between preview, recommended, scheduled, executing, blocked, and completed.

Sustainability:
1. one automation owner lane,
2. one trigger hierarchy,
3. no fake provider-name sprawl.

Safety:
1. fail-closed automation,
2. explicit operator override,
3. no autonomous execution when funding, route, or proof state is insufficient.

Maintainability:
1. scheduler/orchestrator kept out of the frontend,
2. provider-specific automation kept behind clear boundaries,
3. research, policy, runtime, and orchestration remain separate.

## State-And-Truth Contract

Canonical rebalance automation states must distinguish:
1. `preview_only`
2. `rebalance_recommended`
3. `rebalance_deferred`
4. `scheduled`
5. `awaiting_operator`
6. `executing`
7. `rebalanced`
8. `blocked`
9. `paused`
10. `failed`

Truth rules:
1. research may recommend or shape a rebalance, but research does not execute it,
2. portfolio/policy may decide whether a rebalance is warranted, but policy does not own the scheduler,
3. the scheduler/orchestrator may queue or trigger execution, but must not invent portfolio intent,
4. execution may only begin from promoted manifest plus current live readiness truth,
5. any provider label such as `Chainlink`, `CRE`, `CCIP`, `cron`, or `workflow` must match the actual implementation and proof path.

## Existing-Spec Inventory

1. [2026-03-31-xstocks-execution-funding-and-rails-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-execution-funding-and-rails-spec.md)
   - Current relevance: very high.
   - Decision: update indirectly and extend via this new sub-spec.
   - Why: it owns rails and funding hierarchy, but not scheduler/orchestration ownership or automation proof.
2. [2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-construction-and-rebalance-spec.md)
   - Current relevance: very high.
   - Decision: reuse and inherit.
   - Why: it owns rebalance decision semantics, not execution orchestration.
3. [2026-03-31-xstocks-gap-closure-and-readiness-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-gap-closure-and-readiness-spec.md)
   - Current relevance: high.
   - Decision: leave focused on current demo closure.
   - Why: automation truth is the next major lane after current preview-first closure, not a hidden requirement inside the same control doc.
4. [2026-03-31-xstocks-product-control-plane.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-product-control-plane.md)
   - Current relevance: very high.
   - Decision: update alongside this spec.
   - Why: the umbrella should acknowledge automation/orchestration as a separate workstream.

Create new alongside:
1. this spec is justified because no existing doc truthfully owns trigger source, scheduler ownership, provider truth, operator override, and proof of automatic versus manual execution.

## Thread-Recurrence Audit

The repeated asks now collapse into one automation/orchestration workstream:
1. how rebalance automation actually happens,
2. whether Chainlink CRE / CCIP / keeper-style automation is real,
3. what cron or workflow owns scheduling,
4. what happens onchain versus offchain,
5. what proof would make those claims real.

## Spec'd-But-Unimplemented Table

| Governing doc / lane | What should exist | What repo proves now | What is still missing | Gap type |
| --- | --- | --- | --- | --- |
| `XSL-005` rails | truthful execution/funding hierarchy | venue and funding hierarchy spec exists; preview route truth exists | scheduler and automation owner | integration/runtime |
| portfolio rebalance lane | rebalance recommendation semantics | thresholds and rebalance preview semantics exist | live trigger and execution owner | runtime |
| smart-account lane | signed/staged execution | readiness and preview ladder exist | real execution orchestrator and proof | integration/runtime |
| provider truth | Chainlink/cron/workflow claims | none proven in repo | provider decision and proof artifacts | external/runtime |

## Codebase Fit And Iteration-Speed Contract

Codebase fit:
1. extend existing surfaces in `apps/worker`, `packages/policy`, `apps/api`, and shared contracts; no new repo or frontend-owned automation surface is justified.

Existing logic to reuse:
1. promoted-manifest and policy boundary,
2. readiness and activation-preview logic,
3. route truth and fallback conditions,
4. current worker package as the natural home for batch/scheduler orchestration shells.

New entrypoints required:
1. yes, a new scheduler/orchestration shell inside `apps/worker` is justified because no current worker entrypoint owns recurring rebalance evaluation or execution staging.
2. no standalone automation service is justified yet until the worker-owned path proves too weak.

Structural refactor assessment:
1. same-tranche beneficial.
2. keep provider-specific automation behind adapter/service boundaries rather than embedding it in API route handlers.

Iteration-speed hotspots assessed:
1. no current automation code hotspot exists because the lane is mostly unimplemented,
2. avoid turning `apps/api/src/server.js` or `services/api-service.js` into a scheduler host.

Build/deploy fan-out assessment:
1. keep automation orchestration out of `apps/web`,
2. keep provider SDKs and workflow engines out of the request/response API if possible,
3. prefer worker-owned orchestration plus thin API visibility.

## Automation Architecture Contract

The automation lane must separate these responsibilities:
1. `research`
   - decides promoted incumbent and rebalance thresholds
2. `policy`
   - decides current recommended rebalance state from promoted manifest plus live truth
3. `orchestrator`
   - decides whether to queue, defer, or request operator action
4. `execution adapter`
   - stages and submits onchain or smart-account actions
5. `frontend`
   - renders truth and current state

Disallowed:
1. the frontend directly deciding or simulating live automation truth,
2. research directly triggering execution,
3. API routes quietly acting as cron/scheduler workers.

## Trigger Source Contract

Every live rebalance must have one explicit trigger source:
1. `operator_manual`
2. `scheduled_cron`
3. `policy_event`
4. `provider_triggered`

For each trigger source, the system must define:
1. who initiated it,
2. what conditions were checked,
3. whether operator confirmation was required,
4. what proof artifact exists.

MVP preference order:
1. `operator_manual`
2. `scheduled_cron`
3. provider-triggered automation only after proof exists

## Provider Truth Contract

Current rule:
1. do not assume Chainlink is the automation owner until repo or external proof is captured.

Provider classes to evaluate explicitly:
1. plain worker cron / workflow
2. operator-triggered only
3. smart-account-native automation
4. Chainlink Automation / keepers
5. Chainlink CRE / CCIP where relevant

The lane must classify each as:
1. `implemented`
2. `prototype`
3. `externally plausible but unproven`
4. `not in current design`

## Smart-Account Execution Contract

The execution path must define:
1. how a smart account is provisioned,
2. what permissions are required,
3. what payload is signed or staged,
4. how execution success or failure is recorded,
5. how pause and resume work.

Automation may not bypass:
1. funding readiness,
2. route truth,
3. promoted-manifest identity,
4. fail-closed conditions.

## Operator Override Contract

The system must expose:
1. `pause`
2. `resume`
3. `defer`
4. `force_manual_review`

The operator override path must always win over autonomous scheduling.

## Proof Artifact Contract

Before any live automation claim is acceptable, the lane must produce:
1. one architecture diagram or equivalent contract artifact,
2. one trigger-source matrix,
3. one sample rebalance event lifecycle from recommended -> queued -> executed or blocked,
4. one screenshot or log artifact proving current automation owner,
5. one provider truth table explicitly stating what is and is not real,
6. one failure-handling artifact for pause/retry/blocked state.

## Measurement Contract

| Metric | Current baseline | Target | Proof |
| --- | --- | --- | --- |
| Trigger-source clarity | none | every rebalance source labeled explicitly | docs + runtime payloads |
| Automation owner clarity | none | one clear orchestrator owner | code + spec |
| Provider truth clarity | none | Chainlink/cron/workflow claims classified honestly | provider matrix |
| Manual vs automatic distinction | preview-only | user-visible explicit state split | browser proof |
| Failure handling | implied only | pause/retry/blocked rules surfaced | logs/screenshots/tests |

## Acceptance Score Vs Proof Provenance

| Area | Weight | Current score | Provenance |
| --- | --- | --- | --- |
| Rebalance decision semantics | 25 | 18 | thresholds and preview semantics exist |
| Scheduler/orchestrator truth | 20 | 0 | no owner in repo truth |
| Smart-account execution proof | 20 | 4 | readiness exists, live executor does not |
| Provider truth classification | 15 | 0 | no proven Chainlink/cron lane |
| User-visible automation truth | 20 | 6 | preview/readiness states exist, live automation does not |
| Total | 100 | 28 | automation lane largely unproven |

## Owners And Decision-Rights Contract

1. `packages/research` owns rebalance recommendation inputs, not execution.
2. `packages/policy` owns decision semantics and preflight truth.
3. `apps/worker` should own scheduling/orchestration unless proof later justifies a different surface.
4. `apps/api` may expose automation state, but should not become the hidden scheduler.
5. The user decides whether operator-triggered execution is acceptable for the product phase, but the repo must state that decision explicitly.

## Migration / Coexistence / Deprecation Contract

1. Keep preview-only rebalance surfaces as-is until live orchestration is proven.
2. Do not relabel preview or recommended states as automated execution.
3. If a later provider such as Chainlink is adopted, keep the earlier operator/cron path documented until the new proof is complete.

## Derived Next Roadmap

| Item | Why it follows | Blocked on current closure? | Start now or later? | Extends / supersedes |
| --- | --- | --- | --- | --- |
| Automation truth audit | need to know whether Chainlink/cron/operator is real | no | now | extends `XSL-005` |
| Shared automation state contract | user-visible automation truth depends on it | no | now | extends `XSL-005` and portfolio spec |
| Worker-owned scheduler/orchestrator shell | no current owner exists | yes, on audit outcome | later | new within `apps/worker` |
| Smart-account execution proof lane | execution claims need proof | yes | later | extends rails + API/policy |
| Chainlink-specific integration lane | only if truth audit selects it | yes | later | new alongside if justified |

## Verification And Proof Contract

To close this workstream, the executor must prove:
1. what component owns rebalance scheduling,
2. what states are automatic versus operator-triggered,
3. what proof exists for any provider claim,
4. what exactly happens from rebalance recommendation to execution outcome,
5. and what remains preview-only.
