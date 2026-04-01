# xStocks Strategy Lab Autoresearch Operating Model Spec

Date: 2026-03-31
Owner: Codex
Status: active
Canonical issue: `XSL-006`

## Goal

Freeze the Strategy Lab operating model around:
1. promoted-manifest-only user surfaces,
2. the local worker runtime that already exists,
3. the exact deployed recurring-runtime proof needed to retire `worker_runtime_only`,
4. and the boundary between operator autoresearch receipts and public post-qualification explanation.

## Non-goals

This workstream does not:
1. reopen the xStocks adapter baseline as a new gap lane,
2. let public UX consume raw experiment logs,
3. treat candidate cron config as deployed recurring proof,
4. absorb the dedicated explainability or CRE owner lanes,
5. flip `recurringAutonomousProven` without host-level receipts.

## Existing-Spec Inventory

| Artifact | Current role | Decision |
| --- | --- | --- |
| [2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-strategy-lab-autoresearch-operating-model-spec.md) | canonical operating-model owner | update and keep canonical |
| [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md) | deployed recurring sub-lane | reuse under `XSL-006A` |
| [2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-03-31-xstocks-portfolio-interpretability-and-autoresearch-explanation-spec.md) | explanation owner | coordinate; do not duplicate |
| [2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-agent-testability-and-skill-surface-spec.md) | smoke owner | support from this spec |

## Current / Live Truth

1. The research harness, promoted manifests, run summaries, and worker runtime already exist locally.
2. Local worktree also contains candidate Railway recurring-runtime files in [apps/worker/railway.json](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/railway.json) and [autoresearch-railway-cron.js](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/worker/src/autoresearch-railway-cron.js), but those files are not yet proven live on the deployed host.
3. On 2026-04-01 the deployed Railway runtime store already contains `autoresearchRuntime`, `truthBoundary: "worker_runtime_only"`, and `recurringAutonomousProven: false`.
4. On 2026-04-01 the deployed Railway host does not expose `/api/runtime/autoresearch`, and the deployed service does not yet prove a recurring scheduler host or recurring receipt path.
5. The current truthful statement is therefore: Strategy Lab is real locally and promoted-manifest-driven, but deployed recurring cadence is not yet proven.

## Current Local Implementation Audit

| Area | Shipped | Partial | Missing |
| --- | --- | --- | --- |
| research artifacts | results ledger, summaries, promoted manifests, incumbents, explanation bundles | none | none |
| runtime state | local runtime store, worker runtime model | deployed read surface and recurring host proof | live recurring scheduler |
| frontend-facing boundary | promoted manifests and qualification outputs | richer post-qualification exposure | direct deployed runtime receipts |

## Product Outcome Contract

When this lane closes:
1. Strategy Lab remains a promoted-manifest-only user path,
2. the repo can prove whether recurrence is local-only or deployed,
3. `worker_runtime_only` disappears only after a real scheduler host and receipts exist,
4. post-qualification screens inherit only promoted outputs, not raw runtime internals.

## State-And-Truth Contract

| Artifact | Owner | Claim allowed today |
| --- | --- | --- |
| results ledger and run summaries | local repo | `local autoresearch proven` |
| promoted manifests | local repo plus deployed API consumers | `current promoted portfolio truth` |
| `autoresearchRuntime` in runtime store | Railway runtime store | `current runtime boundary` |
| recurring scheduler host receipts | deployed host plus public or operator read surface | `deployed recurring runtime proven` |

Truth rules:
1. `worker_runtime_only` remains authoritative until the deployed host identity, cadence, and receipts are proven.
2. Public explanation may consume only promoted-manifest outputs, not raw runtime receipts.
3. The operating model stays real even when recurrence is not yet deployed; the open gap is recurring runtime, not the existence of Strategy Lab itself.

## Proof / Measurement Contract

To retire `worker_runtime_only`, the repo must prove:
1. the exact scheduler host,
2. the exact cadence,
3. the last-run receipt,
4. deterministic next-run evidence,
5. and a repo-readable proof surface that does not require silent SSH-only truth forever.

Current status:
1. local runtime proven,
2. deployed recurring cadence not yet proven,
3. proof surface for recurring receipts not yet live.

## Acceptance Criteria

1. The operating model clearly separates local runtime truth from deployed recurring-runtime truth.
2. The exact scheduler host requirement for `XSL-006A` is explicit.
3. `worker_runtime_only` and `recurringAutonomousProven=false` remain in force until the host-level proof exists.
4. Promoted-manifest-only user surfaces remain the public boundary.
5. Agent surfaces know which runtime checks are internal-only.

## Blocker Taxonomy

1. `missing_scheduler_host`
2. `missing_runtime_receipts`
3. `missing_public_or_operator_read_surface`
4. `stale_deployed_snapshot`
5. `post_qualification_runtime_visibility_partial`

## Rollback / Recovery Contract

1. If a recurring host is deployed but receipts are unreliable, revert the claim to `worker_runtime_only`.
2. If the runtime proof surface requires private SSH forever, keep the lane open until a repo-readable path exists.
3. If post-qualification UX starts depending on raw runtime state, move that detail back behind promoted-manifest summaries.

## Exact Test / Verification Commands

1. `node --test apps/worker/src/__tests__/autoresearch-runtime.test.js`
2. `node --test apps/worker/src/__tests__/autoresearch-railway-cron.test.js`
3. `curl -sS 'https://api-production-e70b.up.railway.app/api/runtime/autoresearch?limit=1'`
4. `railway status`
5. `railway ssh -s api cat /app/apps/api/data/runtime-store.json`
6. any `XSL-006A` deploy proof commands from [2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-01-xstocks-autoresearch-recurring-runtime-proof.md)

## Completion Relative To Spec / Thread Asks / Prior Claims

1. Completion relative to this spec: local operating model is materially implemented; deployed recurring-runtime closure remains open.
2. Completion relative to the live-gap list: this spec now owns gap 5.
3. Completion relative to prior claims: older docs that treated Strategy Lab as mostly conceptual are no longer accurate; the real missing piece is deployed recurrence with receipts.

## Agent-Testability Contract

1. Public-safe agent coverage for this lane ends at promoted manifests and explanation surfaces.
2. Internal agent coverage may inspect runtime receipts and scheduler proof through `XSL-006A`, but that remains an internal-only path until a safe read surface exists.
3. No public agent surface may imply recurring deployed autoresearch while `worker_runtime_only` remains the persisted truth.
