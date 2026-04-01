import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE,
  CANONICAL_DIRECTIONAL_POLICY_ROUTE_ENTRIES,
  CANONICAL_DIRECTIONAL_PREVIEW_INPUT,
  CANONICAL_DIRECTIONAL_PREVIEW_PAYLOAD,
  ROUTE_TRUTH,
  buildDirectionalBoundaryContextBundle,
  buildDirectionalPolicyRouteEntries,
  buildDirectionalPreviewPayload,
  summarizeHealthFactor,
  summarizeLiquidationDistance
} from "../dist/index.js";

test("summarizeHealthFactor keeps activation conservative when the route is unverified", () => {
  const summary = summarizeHealthFactor({
    collateralUsd: 12500,
    debtUsd: 5000,
    liquidationThresholdBps: 8600,
    targetHealthFactor: 1.35,
    truth: ROUTE_TRUTH.UNVERIFIED
  });

  assert.equal(summary.value, 2.15);
  assert.equal(summary.deltaToTarget, 0.7999999999999998);
  assert.equal(summary.liquidationMargin, 1.15);
  assert.equal(summary.status, "healthy");
  assert.equal(summary.canActivate, false);
});

test("summarizeLiquidationDistance flags long and short liquidation proximity correctly", () => {
  const longSummary = summarizeLiquidationDistance({
    side: "long",
    currentPriceUsd: 1921.7,
    liquidationPriceUsd: 1450
  });
  const shortSummary = summarizeLiquidationDistance({
    side: "short",
    currentPriceUsd: 1921.7,
    liquidationPriceUsd: 2010
  });

  assert.equal(longSummary.status, "safe");
  assert.equal(longSummary.moveToLiquidation, "down");
  assert.equal(shortSummary.status, "danger");
  assert.equal(shortSummary.moveToLiquidation, "up");
});

test("buildDirectionalPreviewPayload keeps Euler preview-only while exposing live Morpho and Flowdesk proof", () => {
  const payload = buildDirectionalPreviewPayload(CANONICAL_DIRECTIONAL_PREVIEW_INPUT);

  assert.deepEqual(payload, CANONICAL_DIRECTIONAL_PREVIEW_PAYLOAD);
  assert.equal(payload.truth, ROUTE_TRUTH.UNVERIFIED);
  assert.equal(payload.activationAllowed, false);
  assert.equal(payload.healthFactor.status, "healthy");
  assert.equal(payload.liveProofOverlay?.truth, ROUTE_TRUTH.LIVE);
  assert.equal(payload.liveProofOverlay?.routeContext.adapterId, "morpho_spyx_ausd");
  assert.equal(payload.liveProofOverlay?.vaultContext?.adapterId, "flowdesk_ausd_rwa_strategy");
  assert.match(
    payload.liveProofOverlay?.note ?? "",
    /Euler market proof remains incomplete/
  );
});

test("directional runtime exports expose the canonical Morpho, Flowdesk, and Euler context posture", () => {
  const contexts = buildDirectionalBoundaryContextBundle();
  const routes = buildDirectionalPolicyRouteEntries();

  assert.deepEqual(contexts, CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE);
  assert.deepEqual(routes, CANONICAL_DIRECTIONAL_POLICY_ROUTE_ENTRIES);
  assert.equal(contexts.morphoRouteContext.truth, ROUTE_TRUTH.LIVE);
  assert.equal(contexts.flowdeskVaultContext.truth, ROUTE_TRUTH.LIVE);
  assert.equal(contexts.eulerRouteContext.truth, ROUTE_TRUTH.UNVERIFIED);
  assert.equal(contexts.liveProofOverlay.truth, ROUTE_TRUTH.LIVE);
  assert.equal(routes[0].routeKind, "lending_market");
  assert.equal(routes[1].routeKind, "yield_vault");
  assert.equal(routes[2].routeKind, "directional_market");
  assert.equal(routes[2].availability, "preview_only");
});
