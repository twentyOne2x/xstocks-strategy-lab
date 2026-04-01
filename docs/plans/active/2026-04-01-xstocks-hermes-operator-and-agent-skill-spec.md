# xStocks Hermes Operator And Agent Skill Spec

Date: 2026-04-01
Owner: Codex
Status: active

## Goal

Create one execution-grade workstream for controlled Hermes-operated xstocks testing by:
1. hardening the repo-owned agent skill surface,
2. defining the Hermes operator runbook,
3. defining wallet and treasury boundaries for real testing,
4. and making the lane reproducible from local Codex through the Hermes host.

## Non-goals

This workstream does not:
1. authorize autonomous trading,
2. make Hermes an unbounded custodian,
3. create fake or wash volume,
4. require a public website-served `skill.md` before the repo-owned skill works,
5. replace the normal human web flow as the main product surface.

## Current Live Truth

1. the user has an operator-managed Hermes host and interactive chat entrypoint available outside the repo.
2. the repo already contains one local skill at [skills/xstocks-qualification/SKILL.md](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md).
3. that skill currently covers qualification and activation readiness only, not Hermes operations or real execution proof.
4. the repo now serves a minimal public `skill.md` surface from `apps/web/public/skill.md`, separate from any private Hermes/operator guidance.
5. no Hermes-specific proof pack, operator runbook, or wallet/treasury contract exists in repo truth.

## Current Local Implementation Audit

### Shipped

1. repo-owned qualification skill.
2. qualification CLI and API surfaces.
3. hosted web and backend surfaces that Hermes could query once properly instructed.

### Partial

1. agent-safe qualification guidance.
2. activation-readiness interpretation.

### Spec-only or unproven

1. Hermes-to-repo runbook,
2. remote-agent proof contract,
3. treasury-funded test boundaries,
4. agent-readable execution handoff,
5. any public agent-facing `skill.md` beyond the current minimal public-safe surface.

## Completion Reconciliation

1. completion relative to spec = not started.
2. completion relative to repeated thread asks = newly requested and unimplemented.
3. completion relative to prior implementation claims = the repo-owned qualification skill exists, but it should not be interpreted as Hermes closure.
4. verified implementation and proof status = local skill exists; Hermes runbook, remote proof, and treasury boundary do not.
5. canonical frontend functioning status = not applicable; this is an operator/agent lane.

## Codebase Fit And Iteration-Speed Contract

codebase fit = extend existing plus one new ops/runbook surface if justified.

existing logic to reuse:
1. [skills/xstocks-qualification/SKILL.md](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md)
2. `scripts/qualify.mjs`
3. `scripts/verify-qualification-fixtures.mjs`
4. `apps/api` qualification and activation-readiness surfaces

new entrypoints required = maybe, but only narrowly.

Why:
1. the first slice should update the existing repo-owned skill and add a runbook doc; any public surface must stay minimal and public-safe,
2. only add a new proof or runbook script if the current CLI/API cannot express the Hermes path cleanly.

structural refactor assessment = beneficial later.

iteration-speed hotspots assessed:
1. current repo-owned skill is compact and should stay the primary seam.
2. Hermes-specific guidance should live beside that skill or in one small runbook, not scatter across multiple docs.
3. public `skill.md` should remain a narrow public summary so this lane does not fork the internal agent surface.

build/deploy fan-out assessment:
1. the first Hermes tranche should avoid forcing new hosted surfaces unless required.
2. keep the skill/runbook repo-owned first so deploy scope stays narrow.

intended file/package boundaries:
1. `skills/**` for the repo-owned skill surface,
2. `scripts/**` only if a dedicated operator proof helper is justified,
3. `docs/plans/active/**` or one adjacent runbook doc for the Hermes operator contract,
4. `apps/api/**` only if a new agent-readable proof/read endpoint is strictly required.

## Existing-Spec Inventory

1. [skills/xstocks-qualification/SKILL.md](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md)
   - Current relevance: very high.
   - Decision: update, do not replace.
   - Why: it is the immediate repo-owned skill surface and should become Hermes-usable.
2. [2026-04-01-xstocks-first-authenticated-execution-proof-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-first-authenticated-execution-proof-spec.md)
   - Current relevance: very high.
   - Decision: coordinate closely.
   - Why: Hermes should prove the same truthful activation lane, not a separate fantasy path.
3. [2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-social-connect-incentive-and-agent-wallet-spec.md)
   - Current relevance: medium.
   - Decision: reuse later if social identity becomes part of the agent flow.
   - Why: current Hermes ask is about controlled testing and skill ergonomics first.

## Symptom Contract

Observed problem:
1. the user wants a controllable local agent on Hermes that can help drive testing,
2. but the repo has no Hermes-specific operator contract,
3. and the current skill does not yet bridge qualification, activation truth, and live execution proof clearly enough for that mode.

Likely culprit:
1. the first tranche optimized for human web and backend work rather than operator-controlled remote-agent use.

Non-obvious alternatives:
1. the repo-owned local skill may already be enough and only needs a tighter runbook,
2. a public `skill.md` can remain narrow and public-safe while Hermes carries the deeper operator path,
3. Hermes may be better used only for verification and not for live execution initiation.

Falsifiers:
1. if the current local skill plus a short prompt works cleanly on Hermes, the implementation can stay small,
2. if Hermes cannot safely access the required wallet/test surfaces, the live-test slice must stay local or human-driven.

## Product Outcome Contract

When this workstream is done enough for first use:
1. Hermes can guide qualification and inspect activation truth from repo-owned instructions,
2. Hermes can follow a safe runbook for real or simulated execution testing,
3. wallet and treasury boundaries are explicit,
4. the resulting proof is reproducible instead of thread-fragile.

## User-Journey Contract

Operator journey:
1. connect to Hermes,
2. open the Hermes interactive chat shell,
3. load or reference the repo-owned xstocks skill,
4. qualify or inspect activation readiness,
5. proceed toward live proof only if wallet/treasury prerequisites are satisfied,
6. capture proof or blocker output.

## State-And-Truth Contract

1. Hermes may assist, explain, and execute documented commands.
2. Hermes may not fabricate execution or skip approval.
3. live volume may only come from an explicitly funded OWS Ethereum wallet or approved treasury wallet.
4. each real funded test must identify:
   - wallet source,
   - approval owner,
   - target notional,
   - resulting proof artifact.
5. the repo-owned skill remains the primary operator surface; public `skill.md` is a narrower public summary surface.

## Critical Assumptions And Invalidators

### Assumptions

1. Hermes is reachable and usable as a remote operator surface.
2. the repo-owned skill can be made sufficient for Hermes with bounded updates.
3. a dedicated wallet or treasury can be approved for testing.

### Invalidators

1. Hermes cannot safely access or preserve the required repo/environment context.
2. treasury or wallet approvals are not granted.
3. the public agent surface needs stronger claims than the internal Hermes path can truthfully support.

## Skill Surface Contract

### Phase 1: repo-owned skill

The immediate owned surface is:
1. [skills/xstocks-qualification/SKILL.md](/Users/user/PycharmProjects/xstocks-strategy-lab/skills/xstocks-qualification/SKILL.md)

It should grow to cover:
1. qualification,
2. activation truth,
3. execution handoff boundaries,
4. Hermes-specific invocation notes,
5. proof-artifact expectations.

### Public `skill.md` surface

The repo now serves a minimal public `skill.md` for website-facing agents.

It should:
1. stay truthful and non-sensitive,
2. explain the high-level product and capability model,
3. avoid exposing hostnames, wallet details, treasury flows, or private operator runbooks,
4. remain narrower than the repo-owned Hermes/operator skill until stronger public proof exists.

## Proof Artifacts

1. Hermes transcript or summarized proof log.
2. one successful qualification and activation-truth run.
3. one live-test proof bundle or exact blocker.
4. updated repo-owned skill text.
5. operator runbook doc or command checklist.

## Verification Commands

1. local skill smoke test via the repo CLI/API.
2. Hermes remote smoke test via the documented operator path.
3. any affected package or app checks after skill/runbook changes.

## Data, Privacy, And Retention Contract

1. operator host access details must stay out of the open-source repo.
2. wallet addresses, treasury details, and approval owners should be redacted or generalized in repo-tracked proof unless explicitly intended for publication.
3. remote transcripts should avoid raw secrets and private host details.

## Hosted / Deployed / Production Boundary Contract

1. local-only
   - repo-owned skill updates and local CLI/API proof.
2. deployed-host verified
   - Hermes can reach the required hosted surfaces and reproduce the documented path.
3. production-host verified
   - Hermes can reproduce the real live-test lane against the production surfaces without manual rescue.
4. still unproven
   - anything that only works locally or only in a hand-held operator shell.

## Economic-Budget Contract

1. use the smallest meaningful real notional for live proofs.
2. do not loop trades just to inflate activity.
3. treasury-funded tests must be explicitly approved and logged.
4. if funding is unavailable, stop at the last truthful dry boundary.

## Owners And Decision-Rights Contract

1. agent-surface owner decides repo skill content.
2. Hermes/operator owner decides remote runbook details.
3. product owner approves treasury-funded testing.
4. backend owner approves live execution handoff boundaries.

## Exit Criteria

This workstream is complete enough when:
1. the repo-owned skill is Hermes-usable,
2. the Hermes runbook exists,
3. one remote proof run succeeds or reports the exact blocker,
4. wallet/treasury test boundaries are explicit and respected.
