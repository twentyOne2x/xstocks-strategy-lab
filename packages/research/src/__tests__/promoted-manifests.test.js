import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { adaptResearchPromotedManifest } from "../../../policy/src/index.js";
import { promotedActivationManifestSchema } from "../../../shared/dist/contracts/activation.js";
import {
  normalizePromotedIncumbentArtifactManifestRef,
  normalizePromotedSlotRegistryArtifact,
  normalizePromotedSlotRegistryEntryManifestRef,
  parsePromotedIncumbentArtifact,
} from "../../../shared/dist/contracts/research.js";
import { slotRegistrySchema } from "../../../shared/dist/contracts/research.js";
import { readJson } from "../fs.js";
import {
  COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH,
  deriveCowOnlyBasketCandidateAssessment,
  getCowQuoteabilityAssessmentForManifest,
} from "../cow-execution-truth.js";
import {
  loadIncumbentForSlot,
  projectSharedPromotedManifest,
  projectSharedSlotRegistry,
  readCurrentPromotedManifestDocumentBySlot,
  readPromotedSlotRegistry,
  readRunSummary,
  readVersionedPromotedManifestDocumentBySlot,
  repoRoot,
  validatePromotedBoundary,
  writeSlotRegistry,
} from "../index.js";

const FORBIDDEN_PROMOTED_FIELDS = [
  "candidateRef",
  "candidate_ref",
  "basketPlan",
  "basket_plan",
  "research",
  "resultRow",
  "result_row",
];

const FORBIDDEN_EXPLANATION_TOKENS = [
  "\"candidateRef\"",
  "\"candidate_ref\"",
  "\"resultRow\"",
  "\"result_row\"",
  "\"runId\"",
  "\"completedAtUtc\"",
  "\"challenger_running\"",
  "\"invalidators\"",
];

function assertRuntimeCompleteness(manifest) {
  assert.deepEqual(manifest.requiredAssets, manifest.executionBoundary.requiredAssets);
  assert.deepEqual(manifest.requiredRoutes, manifest.executionBoundary.requiredRoutes);
  assert.deepEqual(manifest.walletRequirements, manifest.executionBoundary.walletRequirements);
  assert.deepEqual(manifest.signalRefs, manifest.executionBoundary.signalRefs);
  assert.deepEqual(manifest.routeValidation.validationBadges, manifest.frontend.badges);
  assert.deepEqual(
    manifest.routeValidation.routeTruthLabels.map((routeTruthLabel) => routeTruthLabel.routeId),
    manifest.requiredRoutes.map((route) => route.routeId),
  );
  assert.deepEqual(
    manifest.signalRefs.map((signalRef) => signalRef.signalId),
    manifest.signal_refs,
  );
}

function assertSanitizedExplanationSurface(manifest) {
  const serialized = JSON.stringify({
    explanationBundle: manifest.explanationBundle,
    tuningSummary: manifest.tuningSummary,
  });

  for (const forbiddenToken of FORBIDDEN_EXPLANATION_TOKENS) {
    assert.equal(serialized.includes(forbiddenToken), false);
  }
}

function allocationWeightPct(allocation) {
  if (typeof allocation.targetWeightPct === "number") {
    return allocation.targetWeightPct;
  }

  if (typeof allocation.target_weight_pct === "number") {
    return allocation.target_weight_pct;
  }

  if (typeof allocation.weight_bps === "number") {
    return allocation.weight_bps / 100;
  }

  return NaN;
}

test("promoted manifests validate against canonical/shared projections and match policy runtime normalization", () => {
  const registry = readPromotedSlotRegistry();

  for (const slotId of Object.keys(registry.slots)) {
    const manifest = readCurrentPromotedManifestDocumentBySlot(slotId);
    const versionedManifest = readVersionedPromotedManifestDocumentBySlot(
      slotId,
      manifest.strategyVersion,
    );

    promotedActivationManifestSchema.parse(projectSharedPromotedManifest(manifest));
    assert.equal(versionedManifest.manifestId, manifest.manifestId);
    assertRuntimeCompleteness(manifest);
    const adaptedManifest = adaptResearchPromotedManifest(manifest);
    assert.deepEqual(adaptedManifest.requiredAssets, manifest.executionBoundary.requiredAssets);
    assert.deepEqual(adaptedManifest.requiredRoutes, manifest.executionBoundary.requiredRoutes);
    assert.deepEqual(adaptedManifest.signalRefs, manifest.executionBoundary.signalRefs);
    if (manifest.mode === "basket") {
      assert.deepEqual(adaptedManifest.walletRequirements, {
        ...manifest.executionBoundary.walletRequirements,
        requiresSmartAccount: false,
        minFundingUsd: 0,
      });
    } else {
      assert.deepEqual(
        adaptedManifest.walletRequirements,
        manifest.executionBoundary.walletRequirements,
      );
    }
  }
});

test("slot registry current-manifest refs resolve to the promoted documents", () => {
  const registry = readPromotedSlotRegistry();
  const projectedRegistry = projectSharedSlotRegistry(registry);
  const sharedNormalizedRegistry = normalizePromotedSlotRegistryArtifact(registry);

  slotRegistrySchema.parse(projectedRegistry);
  assert.deepEqual(sharedNormalizedRegistry, projectedRegistry);
  assert.equal(projectedRegistry.registry_version, registry.registryVersion);

  for (const [slotId, slotEntry] of Object.entries(registry.slots)) {
    const currentManifest = readCurrentPromotedManifestDocumentBySlot(slotId);
    const versionedManifest = readVersionedPromotedManifestDocumentBySlot(
      slotId,
      slotEntry.currentManifestRef.strategyVersion,
    );
    const rawManifest = readJson(path.resolve(repoRoot, slotEntry.currentManifestPath));
    const sharedNormalizedManifestRef =
      normalizePromotedSlotRegistryEntryManifestRef(slotEntry);

    assert.equal(rawManifest.manifestId, slotEntry.currentManifestRef.manifestId);
    assert.equal(currentManifest.manifestId, slotEntry.currentManifestRef.manifestId);
    assert.equal(versionedManifest.manifestId, slotEntry.currentManifestRef.manifestId);
    assert.equal(sharedNormalizedManifestRef.manifest_id, currentManifest.manifestId);
    assert.equal(sharedNormalizedManifestRef.strategy_version, currentManifest.strategyVersion);
    assert.equal(
      projectedRegistry.slots[slotId].current_manifest_id,
      slotEntry.currentManifestRef.manifestId,
    );
  }
});

test("promoted incumbents still parse through shared helpers", () => {
  const registry = readPromotedSlotRegistry();

  for (const [slotId, slotEntry] of Object.entries(registry.slots)) {
    const incumbent = loadIncumbentForSlot(slotId);
    const sharedParsedIncumbent = parsePromotedIncumbentArtifact(incumbent);
    const sharedIncumbentManifestRef =
      normalizePromotedIncumbentArtifactManifestRef(sharedParsedIncumbent);
    const sharedRegistryManifestRef =
      normalizePromotedSlotRegistryEntryManifestRef(slotEntry);

    assert.equal(sharedParsedIncumbent.slotId, slotId);
    assert.deepEqual(sharedIncumbentManifestRef, sharedRegistryManifestRef);
  }
});

test("current onboarding basket manifests stay execution-boundary complete but preview-only on current CoW truth", () => {
  const slotIds = [
    "onboarding.default_basket",
    "onboarding.alt_basket_1",
    "onboarding.alt_basket_2",
  ];

  assert.equal(validatePromotedBoundary().status, "ok");
  for (const slotId of slotIds) {
    const manifest = readCurrentPromotedManifestDocumentBySlot(slotId);
    const assessment = getCowQuoteabilityAssessmentForManifest(
      adaptResearchPromotedManifest(manifest),
    );

    assert.equal(manifest.mode, "basket");
    assert.equal(manifest.promoted, true);
    assertRuntimeCompleteness(manifest);
    assert.ok(manifest.signal_refs.length > 0);
    assert.ok(manifest.signalRefs.length > 0);
    assert.ok(manifest.target_allocations.length > 0);
    assert.equal(manifest.target_directional_expressions.length, 0);
    assert.ok(manifest.requiredAssets.includes("AUSD"));
    assert.ok(
      manifest.required_routes.some((route) => route.route_id === "cow_swap.ethereum"),
    );
    assert.ok(
      manifest.required_routes.some(
        (route) => route.route_id === "flowdesk.ausd-rwa-strategy",
      ),
    );
    assert.ok(
      manifest.requiredRoutes.some((route) => route.routeId === "cow_swap.ethereum"),
    );
    assert.ok(
      manifest.requiredRoutes.some(
        (route) => route.routeId === "flowdesk.ausd-rwa-strategy",
      ),
    );
    assert.equal(manifest.walletRequirements.minFundingUsd, 1000);
    assert.equal(manifest.wallet_requirements.min_funding_usd, 1000);
    assert.equal(assessment.allCoreSymbolsQuoteable, false);
    assert.equal(manifest.routeValidation.executionEligibility, "preview_only");
    assert.equal(manifest.routeValidation.surfaceTruth, "preview");
    assert.equal(manifest.route_validation.execution_eligibility, "preview_only");
    assert.equal(manifest.route_validation.surface_truth, "preview");
    assert.ok(manifest.routeValidation.validationBadges.includes("preview_only"));
    assert.equal(manifest.routeValidation.validationBadges.includes("basket_live_ready"), false);
    assert.ok(manifest.executionBoundary.requiredAssets.includes("AUSD"));
  }
});

test("current CoW-only executable universe remains too narrow for a product-usable onboarding basket", () => {
  const candidate = deriveCowOnlyBasketCandidateAssessment();

  assert.deepEqual(COW_ETHEREUM_XSTOCKS_EXECUTION_TRUTH.quoteableSymbols, [
    "NVDAx",
    "TSLAx",
    "SPYx",
  ]);
  assert.equal(candidate.isViable, false);
  assert.match(candidate.reason, /holdings_count=4/i);
});

test("basket manifests expose derived explanation bundles and tuning summaries without raw leakage", () => {
  const registry = readPromotedSlotRegistry();

  for (const [slotId, slotEntry] of Object.entries(registry.slots)) {
    if (slotEntry.mode !== "basket") {
      continue;
    }

    const manifest = readCurrentPromotedManifestDocumentBySlot(slotId);
    assert.ok(manifest.explanationBundle);
    assert.ok(manifest.explanation_bundle);
    assert.ok(manifest.tuningSummary);
    assert.ok(manifest.tuning_summary);
    assert.equal(manifest.explanationBundle.truthMode, "promoted_incumbent_and_run_summary_only");
    assert.equal(typeof manifest.explanationBundle.strategyTaxonomy?.familyId, "string");
    assert.equal(typeof manifest.explanationBundle.strategyTaxonomy?.familyLabel, "string");
    assert.equal(
      manifest.explanationBundle.targetWeights.length,
      manifest.target_allocations.filter((allocation) => allocation.sleeve === "core_xstocks").length,
    );
    assert.equal(manifest.explanationBundle.reasonCodes.length > 0, true);
    assert.equal(typeof manifest.explanationBundle.summaries.operator, "string");
    assert.equal(typeof manifest.tuningSummary.strategyFamily?.familyId, "string");
    assert.equal(typeof manifest.tuningSummary.strategyFamily?.familyLabel, "string");
    assert.equal(manifest.tuningSummary.currentKnobs.length >= 5, true);
    assert.equal(manifest.tuningSummary.watchpoints.length >= 2, true);
    assert.equal(typeof manifest.tuningSummary.incumbentInterpretation, "string");
    assert.equal(typeof manifest.tuningSummary.operatorSummary?.whatThisIs, "string");
    assert.equal(typeof manifest.tuningSummary.operatorSummary?.changedFromBaseline, "string");
    assert.equal(typeof manifest.tuningSummary.operatorSummary?.whyThisIncumbent, "string");
    assert.equal(typeof manifest.tuningSummary.operatorSummary?.whatToWatch, "string");
    assertSanitizedExplanationSurface(manifest);
  }
});

test("default basket explanation bundle exposes the promoted tuning truth operators need", () => {
  const manifest = readCurrentPromotedManifestDocumentBySlot("onboarding.default_basket");
  const incumbent = loadIncumbentForSlot("onboarding.default_basket");
  const summary = readRunSummary(incumbent.runId);
  const targetAllocations = manifest.targetAllocations ?? manifest.target_allocations;
  const coreAllocations = targetAllocations.filter(
    (allocation) => allocation.sleeve === "core_xstocks",
  );
  const cashWeightPct = targetAllocations
    .filter((allocation) => allocation.sleeve === "yield_buffer")
    .reduce((sum, allocation) => sum + allocationWeightPct(allocation), 0);
  const maxCoreWeightPct = Math.max(
    ...coreAllocations.map((allocation) => allocationWeightPct(allocation)),
    0,
  );

  assert.equal(manifest.explanationBundle.cashWeightPct, cashWeightPct);
  assert.equal(
    manifest.explanationBundle.rebalanceThresholdBps,
    incumbent.research.rebalanceThresholdBps,
  );
  assert.equal(manifest.explanationBundle.portfolioMetrics.constituentCount, coreAllocations.length);
  assert.equal(manifest.explanationBundle.portfolioMetrics.concentrationPct, maxCoreWeightPct);
  assert.equal(
    manifest.explanationBundle.portfolioMetrics.turnoverAnnPct,
    summary.metrics.turnoverAnnPct,
  );
  assert.equal(
    manifest.explanationBundle.portfolioMetrics.costsTotalBps,
    summary.metrics.costsTotalBps,
  );
  assert.equal(
    manifest.explanationBundle.portfolioMetrics.rebalanceSimulation.modelId,
    "path_dependent_rebalance_after_cost_v1",
  );
  assert.equal(
    manifest.explanationBundle.portfolioMetrics.rebalanceSimulation.thresholdBps,
    incumbent.research.rebalanceThresholdBps,
  );
  assert.equal(
    manifest.explanationBundle.portfolioMetrics.legacyStaticWeight.modelId,
    "static_weight_proxy_v1",
  );
  assert.ok(manifest.explanationBundle.benchmarkDelta.excessReturnAfterCostPct > 0);
  assert.match(manifest.explanationBundle.summaries.operator, /Change from slot baseline:/);
  assert.match(
    manifest.explanationBundle.summaries.realityCheck,
    /Authoritative scoring now uses/i,
  );
  assert.equal(
    manifest.tuningSummary.currentKnobs.some(
      (knob) =>
        knob.knobId === "candidate_family" &&
        knob.currentValue === manifest.tuningSummary.strategyFamily.familyLabel,
    ),
    true,
  );
  assert.equal(
    manifest.tuningSummary.currentKnobs.some(
      (knob) => knob.knobId === "cash_weight" && knob.currentValue === `${cashWeightPct}%`,
    ),
    true,
  );
  assert.equal(
    manifest.tuningSummary.currentKnobs.some((knob) => knob.knobId === "selection_universe"),
    true,
  );
  assert.match(
    manifest.tuningSummary.operatorSummary.changedFromBaseline,
    /Selection universe|Breadth|Cash sleeve|No parameter changes/,
  );
  assert.match(manifest.tuningSummary.operatorSummary.whatThisIs, /AUSD|xStocks/);
  assert.match(
    manifest.tuningSummary.operatorSummary.whatToWatch,
    /authoritative|legacy|turnover|largest sleeve|Benchmark edge/i,
  );
  assert.match(manifest.tuningSummary.incumbentInterpretation, /Core Focus \+ Low Cash|Core Low Cash Anchored|Core Focus|Slot Baseline|Starter/);
  assert.match(manifest.tuningSummary.incumbentInterpretation, /After costs it/i);
});

test("default basket promoted manifest carries replay and market intelligence surfaces", () => {
  const manifest = readCurrentPromotedManifestDocumentBySlot("onboarding.default_basket");
  const incumbent = loadIncumbentForSlot("onboarding.default_basket");
  const summary = readRunSummary(incumbent.runId);
  const expectedEndingCapital = Number(
    (summary.metrics.rebalanceSimulation.netNavFinal * 1000).toFixed(2),
  );

  assert.equal(manifest.replay.startingCapital, 1000);
  assert.equal(manifest.replay.endingCapital, expectedEndingCapital);
  assert.equal(
    manifest.replay.maxDrawdownPct,
    -summary.metrics.rebalanceSimulation.netMaxDrawdownPct,
  );
  assert.equal(manifest.replay.turnoverPct, summary.metrics.turnoverAnnPct);
  assert.ok(manifest.replay.winRatePct > 0);
  assert.ok(manifest.replay.points.length >= 2);
  assert.equal(manifest.replay.points[0].value, 1000);
  assert.equal(
    manifest.marketIntelligence.whatChanged[0],
    summary.tuningSummary.operatorSummary.changedFromBaseline,
  );
  assert.match(manifest.marketIntelligence.currentView, /frozen window/i);
  assert.match(manifest.marketIntelligence.horizon, /Validation window/i);
  assert.equal(
    manifest.marketIntelligence.drivers.some(
      (driver) => driver.label === "Benchmark edge" && driver.tone === "positive",
    ),
    true,
  );
  assert.deepEqual(
    manifest.market_intelligence,
    {
      current_view: manifest.marketIntelligence.currentView,
      horizon: manifest.marketIntelligence.horizon,
      what_changed: manifest.marketIntelligence.whatChanged,
      drivers: manifest.marketIntelligence.drivers,
    },
  );
});

test("directional preview manifest is execution-boundary complete, preview-only, and fail-closed", () => {
  const manifest = readCurrentPromotedManifestDocumentBySlot("advanced.default_directional");
  const disableConditions = new Set(manifest.fallback.disable_conditions);

  assert.equal(manifest.mode, "directional");
  assert.equal(manifest.promoted, true);
  assertRuntimeCompleteness(manifest);
  assert.ok(manifest.signal_refs.length > 0);
  assert.ok(manifest.signalRefs.length > 0);
  assert.equal(manifest.target_allocations.length, 0);
  assert.equal(manifest.target_directional_expressions.length, 1);
  assert.equal(manifest.requiredAssets.includes("AUSD"), true);
  assert.equal(manifest.requiredRoutes.length, 1);
  assert.equal(manifest.requiredRoutes[0].routeKind, "directional_market");
  assert.equal(manifest.required_routes.length, 1);
  assert.equal(manifest.required_routes[0].route_id, "euler.ethereum.directional");
  assert.equal(manifest.walletRequirements.minFundingUsd, 1500);
  assert.equal(manifest.wallet_requirements.min_funding_usd, 1500);
  assert.equal(manifest.routeValidation.executionEligibility, "preview_only");
  assert.equal(manifest.routeValidation.surfaceTruth, "preview");
  assert.equal(manifest.route_validation.execution_eligibility, "preview_only");
  assert.equal(manifest.route_validation.surface_truth, "preview");
  assert.ok(manifest.routeValidation.validationBadges.includes("preview_only"));
  assert.ok(manifest.route_validation.validation_badges.includes("preview_only"));
  assert.equal(disableConditions.has("preview_only"), true);
  assert.equal(disableConditions.has("route_unverified"), true);
  assert.equal(disableConditions.has("directional_activation_disabled"), true);
});

test("promoted manifests remain free of leaked raw research internals", () => {
  const registry = readPromotedSlotRegistry();

  for (const slotEntry of Object.values(registry.slots)) {
    const rawManifest = readJson(path.resolve(repoRoot, slotEntry.currentManifestPath));

    for (const forbiddenField of FORBIDDEN_PROMOTED_FIELDS) {
      assert.equal(forbiddenField in rawManifest, false);
    }
  }
});

test("slot registry write stays byte-stable when regeneration changes only generatedAt timestamps", () => {
  const registryPath = path.resolve(repoRoot, "packages/research/manifests/slot-registry.json");
  const before = fs.readFileSync(registryPath, "utf8");
  const existingRegistry = readPromotedSlotRegistry();
  const equivalentRegistry = {
    ...existingRegistry,
    generatedAtUtc: "2026-03-31T23:59:59.999Z",
    generated_at_utc: "2026-03-31T23:59:59.999Z",
  };

  writeSlotRegistry(equivalentRegistry);

  const after = fs.readFileSync(registryPath, "utf8");
  assert.equal(after, before);
});
