# xStocks Portfolio Buy And Deposit Closure

Date: 2026-04-03
Owner: `XSL-005A`, `XSL-005B`, and `XSL-005C` under `XSL-005`
Status: active

## Goal

Freeze the canonical public buy-route decision without collapsing `LI.FI`, `Enso`, hosted `1inch`, and shared `1inch` truth into one vague “portfolio router” claim.

## Audited Truth

1. `LI.FI` remains spec-only under [2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-lifi-portfolio-usdc-deposit-lane-spec.md).
2. `Enso` remains an implementation candidate under:
   - [2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-enso-portfolio-usdc-multideposit-lane-spec.md)
   - [2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md](/Users/user/PycharmProjects/xstocks-strategy-lab/docs/plans/active/2026-04-02-xstocks-portfolio-buy-multiquote-implementation.md)
3. No repo-owned live wallet/onchain proof in this pass advanced the Enso lane to a canonical public claim.
4. This pass restored hosted `1inch` as the default public buy-route create path in the web flow.
5. The public CTA still says `Buy portfolio`, but the truthful approval model now matches the active route:
   - wallet-first hosted `1inch`,
   - signer approval per trade,
   - no hidden autonomous execution.

## Closure Decision

1. Canonical public buy route after this pass: hosted `1inch`.
2. `Enso` remains available only as an implementation/proof candidate, not the public default.
3. `LI.FI` remains spec-only and must not be marketed as the active atomic basket-buy path.

## Repo Changes In This Pass

1. [apps/web/src/lib/manual-execution.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/manual-execution.ts)
   - default create path restored to `executionRouteId: "1inch.ethereum"`
   - explicit Enso override preserved for non-default/internal use.
2. [apps/web/src/lib/manual-execution.test.ts](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/lib/manual-execution.test.ts)
   - added coverage that hosted `1inch` stays the default public route
   - retained Enso path coverage for explicit/existing Enso requests.
3. [apps/web/src/components/onboarding-question-flow.tsx](/Users/user/PycharmProjects/xstocks-strategy-lab/apps/web/src/components/onboarding-question-flow.tsx)
   - user-facing buy copy and approval copy aligned to hosted `1inch` truth.

## Remaining Check

1. If Enso later gets real browser plus wallet/onchain proof on the promoted default basket, reopen only the route-decision portion of `XSL-005C`.
2. Until then, keep hosted `1inch` as the public default and Enso as implementation-candidate truth.
