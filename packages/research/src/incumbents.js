import path from "node:path";

import { buildPromotedManifestId } from "../../shared/dist/contracts/research.js";

import {
  BASKET_ACTIVATION_TEMPLATE_ID,
  CHAIN,
  CONTRACT_VERSION,
  COW_SWAP_ROUTE_ID,
  COW_SWAP_ROUTE_LABEL,
  DATASET_VERSION,
  DEFAULT_BRIDGE_PROVIDER,
  DEFAULT_FUNDING_ASSET_SYMBOL,
  DEFAULT_FUNDING_PROVIDER,
  DEFAULT_TOP_UP_ASSET,
  DIRECTIONAL_ACTIVATION_TEMPLATE_ID,
  EULER_DIRECTIONAL_ROUTE_ID,
  EULER_DIRECTIONAL_ROUTE_LABEL,
  EVALUATOR_VERSION,
  FLOWDESK_ROUTE_ID,
  FLOWDESK_ROUTE_LABEL,
  FLOWDESK_VAULT_VENUE_ID,
  OBJECTIVES,
  SLOT_REGISTRY_VERSION,
  YIELD_BUFFER_ASSET_SYMBOL,
} from "./constants.js";
import { fileExists, readJson, writeJson } from "./fs.js";
import {
  assertPromotedBasketSummaryMatchesIncumbent,
  deriveBasketSummaryArtifacts,
  toSnakeKeys,
} from "./explanations.js";
import {
  promotedManifestRoot,
  repoRoot,
  slotRegistryPath,
  toRepoRelative,
} from "./paths.js";
import { readRunSummary } from "./results-ledger.js";
import {
  assertPromotedIncumbent,
  assertPromotedSlotRegistry,
  normalizePromotedIncumbentManifestRef,
  normalizePromotedSlotRegistryEntryManifestRef,
  parseActivationManifest,
  parseCanonicalPromotedManifestDocument,
} from "./shared-contracts.js";
import {
  getStrategySlot,
  incumbentPathForSlot,
  listPublicStrategySlots,
  promotedManifestDirForSlot,
  publicSlotFor,
} from "./slots.js";
import { deriveCowExecutionSurfaceForManifest } from "./cow-execution-truth.js";

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function stableJson(value) {
  return JSON.stringify(value);
}

function deriveBasketExecutionSurfaceForAllocations(frontendBadges, targetAllocations) {
  return deriveCowExecutionSurfaceForManifest(
    {
      mode: "basket",
      targetAllocations: targetAllocations.map((allocation) => ({
        sleeve: allocation.sleeve,
        assetSymbol: allocation.asset_symbol,
      })),
    },
    frontendBadges,
  );
}

function stripRegistryGenerationTimestamp(registry) {
  const {
    generatedAtUtc,
    generated_at_utc,
    ...rest
  } = registry;
  return rest;
}

function normalizeToWeightBpsRows(entries, getPct, project) {
  const rows = entries.map((entry, index) => ({
    index,
    rawWeightBps: Number(getPct(entry)) * 100,
    projected: project(entry),
  }));
  const totalWeightBps = Math.round(
    rows.reduce((sum, row) => sum + row.rawWeightBps, 0),
  );
  const floorWeights = rows.map((row) => Math.floor(row.rawWeightBps));
  const adjustments = new Array(rows.length).fill(0);
  let delta = totalWeightBps - floorWeights.reduce((sum, weight) => sum + weight, 0);
  const rankedRows = [...rows].sort((left, right) => {
    const leftFraction = left.rawWeightBps - Math.floor(left.rawWeightBps);
    const rightFraction = right.rawWeightBps - Math.floor(right.rawWeightBps);
    return rightFraction - leftFraction || left.index - right.index;
  });

  while (delta > 0) {
    const ranked = rankedRows[(totalWeightBps - delta) % rankedRows.length];
    adjustments[ranked.index] += 1;
    delta -= 1;
  }

  while (delta < 0) {
    const ranked = [...rankedRows].reverse()[(-delta - 1) % rankedRows.length];
    adjustments[ranked.index] -= 1;
    delta += 1;
  }

  return rows.map((row) => ({
    ...row.projected,
    weight_bps: floorWeights[row.index] + adjustments[row.index],
  }));
}

function directionalViewToStance(view) {
  if (
    view === "conviction_long" ||
    view === "conviction_short" ||
    view === "hedged_view"
  ) {
    return view;
  }

  throw new Error(`Directional manifest requires an actionable stance. Received ${view}.`);
}

function createBasketTargetAllocations(evaluation) {
  const targetAllocations = evaluation.candidate.plan.targetWeights.map((entry) => ({
    sleeve: "core_xstocks",
    assetSymbol: entry.symbol,
    targetWeightPct: Number((entry.weight * 100).toFixed(4)),
  }));

  if (evaluation.candidate.plan.cashWeight > 0) {
    targetAllocations.push({
      sleeve: "yield_buffer",
      assetSymbol: YIELD_BUFFER_ASSET_SYMBOL,
      targetWeightPct: Number((evaluation.candidate.plan.cashWeight * 100).toFixed(4)),
      venueId: FLOWDESK_VAULT_VENUE_ID,
    });
  }

  return targetAllocations;
}

function buildBasketActivationTemplate(slot, evaluation) {
  return {
    mode: "basket",
    templateId: BASKET_ACTIVATION_TEMPLATE_ID,
    fundingAssetSymbol: DEFAULT_FUNDING_ASSET_SYMBOL,
    starterBasketId: slot.starterBasketId,
    targetAllocations: createBasketTargetAllocations(evaluation),
  };
}

function buildDirectionalActivationTemplate(slot, evaluation) {
  return {
    mode: "directional",
    templateId: DIRECTIONAL_ACTIVATION_TEMPLATE_ID,
    fundingAssetSymbol: DEFAULT_FUNDING_ASSET_SYMBOL,
    assetSymbol: slot.assetSymbol,
    targetDirectionalExpression: evaluation.candidate.expression,
  };
}

function buildSignalRefs(manifestId, incumbent) {
  if (incumbent.mode === "directional") {
    return [
      {
        signalId: `manifest:${manifestId}`,
        scopeType: "asset",
        scopeKey: incumbent.activationTemplate.assetSymbol,
      },
    ];
  }

  return [
    {
      signalId: `manifest:${manifestId}`,
      scopeType: "basket",
      scopeKey: incumbent.activationTemplate.starterBasketId ?? incumbent.slotId,
    },
  ];
}

function buildCanonicalTargetAllocations(incumbent) {
  if (incumbent.mode !== "basket") {
    return [];
  }

  return normalizeToWeightBpsRows(
    incumbent.activationTemplate.targetAllocations,
    (allocation) => allocation.targetWeightPct,
    (allocation) => ({
      sleeve: allocation.sleeve,
      asset_symbol: allocation.assetSymbol,
      basket_id: allocation.basketId,
      venue_id:
        allocation.venueId ??
        (allocation.sleeve === "yield_buffer" ? FLOWDESK_VAULT_VENUE_ID : undefined),
    }),
  );
}

function buildCanonicalTargetDirectionalExpressions(incumbent) {
  if (incumbent.mode !== "directional") {
    return [];
  }

  return [
    {
      asset_symbol: incumbent.activationTemplate.assetSymbol,
      stance: directionalViewToStance(
        incumbent.activationTemplate.targetDirectionalExpression.view,
      ),
      notional_share_bps: Math.round(
        incumbent.activationTemplate.targetDirectionalExpression.grossExposurePct * 100,
      ),
    },
  ];
}

function buildSharedRequiredRoutes(incumbent, targetAllocations) {
  if (incumbent.mode === "directional") {
    return [
      {
        route_id: EULER_DIRECTIONAL_ROUTE_ID,
        route_kind: "execution",
        required_for: "directional",
        label: EULER_DIRECTIONAL_ROUTE_LABEL,
      },
    ];
  }

  const requiredRoutes = [
    {
      route_id: COW_SWAP_ROUTE_ID,
      route_kind: "execution",
      required_for: "core_xstocks",
      label: COW_SWAP_ROUTE_LABEL,
    },
  ];

  if (targetAllocations.some((allocation) => allocation.sleeve === "yield_buffer")) {
    requiredRoutes.push({
      route_id: FLOWDESK_ROUTE_ID,
      route_kind: "vault",
      required_for: "yield_buffer",
      label: FLOWDESK_ROUTE_LABEL,
    });
  }

  return requiredRoutes;
}

function buildRequiredAssets(incumbent, targetAllocations) {
  if (incumbent.mode === "directional") {
    return uniqueStrings([
      incumbent.activationTemplate.assetSymbol,
      incumbent.research.borrowAssetSymbol,
    ]);
  }

  return uniqueStrings(targetAllocations.map((allocation) => allocation.asset_symbol));
}

function buildWalletRequirementPair(incumbent) {
  const minFundingUsd = incumbent.mode === "directional" ? 1500 : 1000;

  return {
    shared: {
      requires_wallet: true,
      requires_smart_account: true,
      min_funding_usd: minFundingUsd,
      preferred_funding_provider: DEFAULT_FUNDING_PROVIDER,
      preferred_bridge_provider: DEFAULT_BRIDGE_PROVIDER,
      top_up_asset: DEFAULT_TOP_UP_ASSET,
    },
    runtime: {
      requiresWallet: true,
      requiresSmartAccount: true,
      minFundingUsd,
      preferredFundingProvider: DEFAULT_FUNDING_PROVIDER,
      preferredBridgeProvider: DEFAULT_BRIDGE_PROVIDER,
      topUpAsset: DEFAULT_TOP_UP_ASSET,
    },
  };
}

function buildExecutionBoundaryRoutes(incumbent, targetAllocations) {
  if (incumbent.mode === "directional") {
    return [
      {
        routeId: EULER_DIRECTIONAL_ROUTE_ID,
        label: EULER_DIRECTIONAL_ROUTE_LABEL,
        routeKind: "directional_market",
        requiredFor: "directional",
      },
    ];
  }

  const routes = [
    {
      routeId: COW_SWAP_ROUTE_ID,
      label: COW_SWAP_ROUTE_LABEL,
      routeKind: "execution",
      requiredFor: "core_xstocks",
    },
  ];

  if (targetAllocations.some((allocation) => allocation.sleeve === "yield_buffer")) {
    routes.push({
      routeId: FLOWDESK_ROUTE_ID,
      label: FLOWDESK_ROUTE_LABEL,
      routeKind: "yield_vault",
      requiredFor: "yield_buffer",
    });
  }

  return routes;
}

function buildPermissions(incumbent) {
  if (incumbent.mode === "directional") {
    return {
      allow_pause: false,
      allow_turn_off: false,
    };
  }

  return {
    allow_pause: true,
    allow_turn_off: true,
  };
}

function buildRouteValidation(incumbent, sharedRequiredRoutes) {
  if (incumbent.mode === "directional") {
    return {
      execution_eligibility: "preview_only",
      surface_truth: "preview",
      route_truth_labels: sharedRequiredRoutes.map((route) => ({
        route_id: route.route_id,
        label: route.label,
        route_kind: route.route_kind,
        chain: CHAIN,
        verification_tier: "unverified",
        truth_label: "preview",
        availability: "preview_only",
        required_for: route.required_for ?? "directional",
        reason:
          "Directional lane stays preview-only until exact live Euler xStocks proof exists.",
      })),
      proof_notes: [
        "Preview only: exact live xStocks-on-Euler route proof remains unverified.",
        "Directional activation stays fail-closed until a verified live rail replaces this preview incumbent.",
      ],
      validation_badges: incumbent.frontend.badges,
    };
  }

  const targetAllocations = buildCanonicalTargetAllocations(incumbent);
  const executionSurface = deriveBasketExecutionSurfaceForAllocations(
    incumbent.frontend.badges,
    targetAllocations,
  );
  const routeTruthLabels = [
    {
      route_id: COW_SWAP_ROUTE_ID,
      label: COW_SWAP_ROUTE_LABEL,
      route_kind: "execution",
      chain: CHAIN,
      verification_tier: "public_verified",
      truth_label: executionSurface.cowRouteTruthState,
      availability: executionSurface.cowRouteAvailability,
      required_for: "core_xstocks",
      reason: executionSurface.cowRouteReason,
    },
  ];

  if (sharedRequiredRoutes.some((route) => route.route_id === FLOWDESK_ROUTE_ID)) {
    routeTruthLabels.push({
      route_id: FLOWDESK_ROUTE_ID,
      label: FLOWDESK_ROUTE_LABEL,
      route_kind: "vault",
      chain: CHAIN,
      verification_tier: "public_verified",
      truth_label: "live",
      availability: "available",
      required_for: "yield_buffer",
      reason: "AUSD yield-buffer vault is verified for live basket activations.",
    });
  }

  return {
    execution_eligibility: executionSurface.executionEligibility,
    surface_truth: executionSurface.surfaceTruth,
    route_truth_labels: routeTruthLabels,
    proof_notes: executionSurface.proofNotes,
    validation_badges: executionSurface.frontendBadges,
  };
}

function buildRuntimeRouteValidation(routeValidation) {
  return {
    executionEligibility: routeValidation.execution_eligibility,
    surfaceTruth: routeValidation.surface_truth,
    routeTruthLabels: routeValidation.route_truth_labels.map((routeTruthLabel) => ({
      routeId: routeTruthLabel.route_id,
      label: routeTruthLabel.label,
      routeKind: routeTruthLabel.route_kind,
      chain: routeTruthLabel.chain,
      verificationTier: routeTruthLabel.verification_tier,
      truthLabel: routeTruthLabel.truth_label,
      availability: routeTruthLabel.availability,
      requiredFor: routeTruthLabel.required_for,
      reason: routeTruthLabel.reason,
    })),
    proofNotes: routeValidation.proof_notes,
    validationBadges: routeValidation.validation_badges,
  };
}

function readPromotedRunSummary(incumbent) {
  const summary = readRunSummary(incumbent.runId);
  if (!summary) {
    throw new Error(`Missing promoted run summary for ${incumbent.slotId} at ${incumbent.runId}.`);
  }

  return summary;
}

function buildBasketExplanationSurface(incumbent) {
  const summary = readPromotedRunSummary(incumbent);
  assertPromotedBasketSummaryMatchesIncumbent(incumbent, summary);
  const { explanationBundle, tuningSummary } = deriveBasketSummaryArtifacts(summary);

  return {
    explanationBundle,
    explanation_bundle: toSnakeKeys(explanationBundle),
    tuningSummary,
    tuning_summary: toSnakeKeys(tuningSummary),
  };
}

export function createPromotedIncumbent({ slot, evaluation, previousIncumbentId = null }) {
  if (slot.mode !== "basket") {
    throw new Error(`createPromotedIncumbent only supports basket slots. Received ${slot.mode}.`);
  }

  const resultRow = evaluation.resultRow;
  const targetAllocations = createBasketTargetAllocations(evaluation);
  const strategyVersion = evaluation.candidate?.strategyVersion ?? slot.strategyVersion;
  const executionSurface = deriveBasketExecutionSurfaceForAllocations(
    ["validated_strategy", "promoted_manifest", "basket_live_ready"],
    targetAllocations,
  );

  return {
    version: CONTRACT_VERSION,
    incumbentId: `${slot.slotId}:${strategyVersion}`,
    slotId: slot.slotId,
    mode: "basket",
    chain: slot.chain,
    strategyVersion,
    status: "promoted",
    promotedAt: evaluation.completedAtUtc,
    previousIncumbentId,
    runId: evaluation.runId,
    frontend: {
      title: slot.title,
      subtitle: slot.subtitle,
      riskLabel: slot.riskLabel,
      summary: slot.summary,
      badges: executionSurface.frontendBadges,
    },
    validation: {
      datasetVersion: DATASET_VERSION,
      evaluatorVersion: EVALUATOR_VERSION,
      objectiveId: OBJECTIVES.basket,
      score: resultRow.primaryScore,
      deltaVsIncumbent: resultRow.deltaScore,
      promotedAt: evaluation.completedAtUtc,
    },
    activationTemplate: buildBasketActivationTemplate(slot, evaluation),
    fallback: {
      previousIncumbentId,
      disableConditions: slot.disableConditions,
    },
    research: {
      candidateRef: evaluation.candidateRef,
      basketId: evaluation.candidate.basketId,
      starterBasketId: slot.starterBasketId,
      benchmarkId: resultRow.benchmarkId,
      targetAllocations,
      rebalanceThresholdBps: evaluation.candidate.plan.rebalanceThresholdBps,
      reasonCodes: evaluation.candidate.plan.reasonCodes,
    },
  };
}

export function createDirectionalPreviewIncumbent({ slot, evaluation }) {
  if (slot.mode !== "directional") {
    throw new Error(
      `createDirectionalPreviewIncumbent only supports directional slots. Received ${slot.mode}.`,
    );
  }

  const resultRow = evaluation.resultRow;

  return {
    version: CONTRACT_VERSION,
    incumbentId: `${slot.slotId}:${slot.strategyVersion}`,
    slotId: slot.slotId,
    mode: "directional",
    chain: slot.chain,
    strategyVersion: slot.strategyVersion,
    status: "promoted_preview",
    promotedAt: evaluation.completedAtUtc,
    previousIncumbentId: null,
    runId: evaluation.runId,
    frontend: {
      title: slot.title,
      subtitle: slot.subtitle,
      riskLabel: slot.riskLabel,
      summary: slot.summary,
      badges: ["promoted_manifest", "preview_only", "route_unverified"],
    },
    validation: {
      datasetVersion: DATASET_VERSION,
      evaluatorVersion: EVALUATOR_VERSION,
      objectiveId: OBJECTIVES.directional,
      score: resultRow.primaryScore,
      deltaVsIncumbent: resultRow.deltaScore,
      promotedAt: evaluation.completedAtUtc,
    },
    activationTemplate: buildDirectionalActivationTemplate(slot, evaluation),
    fallback: {
      previousIncumbentId: null,
      disableConditions: slot.disableConditions,
    },
    research: {
      candidateRef: evaluation.candidateRef,
      venueId: evaluation.candidate.venueId,
      assetSymbol: slot.assetSymbol,
      borrowAssetSymbol: slot.borrowAssetSymbol,
      truthState: evaluation.candidate.preview.truthState,
      healthFactor: evaluation.candidate.preview.healthFactor,
      liquidationDistancePct: evaluation.candidate.preview.liquidationDistancePct,
      targetDirectionalExpression: evaluation.candidate.expression,
      previewOnly: true,
    },
  };
}

export function writeIncumbent(incumbent) {
  const normalizedIncumbent = assertPromotedIncumbent(incumbent);
  const filePath = incumbentPathForSlot(normalizedIncumbent.slotId);
  writeJson(filePath, normalizedIncumbent);
  return filePath;
}

export function loadIncumbentForSlot(slotId) {
  const filePath = incumbentPathForSlot(slotId);
  return fileExists(filePath) ? assertPromotedIncumbent(readJson(filePath)) : null;
}

export function buildActivationManifest(incumbent) {
  const normalizedIncumbent = assertPromotedIncumbent(incumbent);
  const manifestId = buildPromotedManifestId(
    normalizedIncumbent.slotId,
    normalizedIncumbent.strategyVersion,
  );
  const signalRefs = buildSignalRefs(manifestId, normalizedIncumbent);
  const signalRefIds = signalRefs.map((signalRef) => signalRef.signalId);
  const targetAllocations = buildCanonicalTargetAllocations(normalizedIncumbent);
  const targetDirectionalExpressions =
    buildCanonicalTargetDirectionalExpressions(normalizedIncumbent);
  const requiredRoutes = buildSharedRequiredRoutes(
    normalizedIncumbent,
    targetAllocations,
  );
  const requiredAssets = buildRequiredAssets(normalizedIncumbent, targetAllocations);
  const walletRequirements = buildWalletRequirementPair(normalizedIncumbent);
  const routeValidation = buildRouteValidation(normalizedIncumbent, requiredRoutes);
  const frontendBadges =
    normalizedIncumbent.mode === "basket"
      ? deriveBasketExecutionSurfaceForAllocations(
          normalizedIncumbent.frontend.badges,
          targetAllocations,
        ).frontendBadges
      : normalizedIncumbent.frontend.badges;
  const runtimeRequiredRoutes = buildExecutionBoundaryRoutes(
    normalizedIncumbent,
    targetAllocations,
  );
  const executionBoundary = {
    promoted: true,
    source: {
      type: "research_promoted_manifest",
      manifestId,
      slotId: normalizedIncumbent.slotId,
    },
    requiredAssets,
    requiredRoutes: runtimeRequiredRoutes,
    walletRequirements: walletRequirements.runtime,
    signalRefs,
  };
  const basketExplanationSurface =
    normalizedIncumbent.mode === "basket"
      ? buildBasketExplanationSurface(normalizedIncumbent)
      : {};

  return parseCanonicalPromotedManifestDocument({
    version: CONTRACT_VERSION,
    manifestId,
    manifest_id: manifestId,
    slotId: normalizedIncumbent.slotId,
    slot_id: normalizedIncumbent.slotId,
    mode: normalizedIncumbent.mode,
    chain: CHAIN,
    strategyVersion: normalizedIncumbent.strategyVersion,
    strategy_version: normalizedIncumbent.strategyVersion,
    promoted: true,
    frontend: {
      title: normalizedIncumbent.frontend.title,
      subtitle: normalizedIncumbent.frontend.subtitle,
      riskLabel: normalizedIncumbent.frontend.riskLabel,
      risk_label: normalizedIncumbent.frontend.riskLabel,
      summary: normalizedIncumbent.frontend.summary,
      badges: frontendBadges,
    },
    validation: {
      datasetVersion: normalizedIncumbent.validation.datasetVersion,
      dataset_version: normalizedIncumbent.validation.datasetVersion,
      evaluatorVersion: normalizedIncumbent.validation.evaluatorVersion,
      evaluator_version: normalizedIncumbent.validation.evaluatorVersion,
      objectiveId: normalizedIncumbent.validation.objectiveId,
      objective_id: normalizedIncumbent.validation.objectiveId,
      score: normalizedIncumbent.validation.score,
      deltaVsIncumbent: normalizedIncumbent.validation.deltaVsIncumbent,
      delta_vs_incumbent: normalizedIncumbent.validation.deltaVsIncumbent,
      promotedAt: normalizedIncumbent.validation.promotedAt,
      promoted_at: normalizedIncumbent.validation.promotedAt,
    },
    signal_refs: signalRefIds,
    signalRefs,
    target_allocations: targetAllocations,
    target_directional_expressions: targetDirectionalExpressions,
    requiredAssets,
    requiredRoutes: runtimeRequiredRoutes,
    required_routes: requiredRoutes,
    walletRequirements: walletRequirements.runtime,
    wallet_requirements: walletRequirements.shared,
    activationTemplate: normalizedIncumbent.activationTemplate,
    activation_template: {
      template_id: normalizedIncumbent.activationTemplate.templateId,
      preview_available: true,
      required_assets: requiredAssets,
      required_routes: requiredRoutes,
      target_allocations: targetAllocations,
      target_directional_expressions: targetDirectionalExpressions,
      wallet_requirements: walletRequirements.shared,
      permissions: buildPermissions(normalizedIncumbent),
    },
    fallback: {
      previousIncumbentId: normalizedIncumbent.fallback.previousIncumbentId,
      previous_incumbent_id: normalizedIncumbent.fallback.previousIncumbentId,
      disableConditions: normalizedIncumbent.fallback.disableConditions,
      disable_conditions: normalizedIncumbent.fallback.disableConditions,
    },
    executionBoundary,
    routeValidation: buildRuntimeRouteValidation(routeValidation),
    route_validation: routeValidation,
    ...basketExplanationSurface,
  });
}

function versionedManifestPath(slotId, strategyVersion) {
  return path.join(promotedManifestDirForSlot(slotId), `${strategyVersion}.json`);
}

function currentManifestPath(slotId) {
  return path.join(promotedManifestDirForSlot(slotId), "current.json");
}

export function writeActivationManifest(manifest) {
  const normalizedManifest = parseCanonicalPromotedManifestDocument(manifest);
  const versionedPath = versionedManifestPath(
    normalizedManifest.slotId,
    normalizedManifest.strategyVersion,
  );
  const currentPath = currentManifestPath(normalizedManifest.slotId);

  writeJson(versionedPath, normalizedManifest);
  writeJson(currentPath, normalizedManifest);

  return {
    versionedPath,
    currentPath,
  };
}

export function buildSlotRegistry(manifestEntries) {
  const generatedAtUtc = new Date().toISOString();
  const promotedManifestRootPath = toRepoRelative(promotedManifestRoot);
  const slots = Object.fromEntries(
    manifestEntries.map(({ manifest, paths }) => [
      manifest.slotId,
      {
        version: CONTRACT_VERSION,
        slot: publicSlotFor(manifest.slotId),
        mode: manifest.mode,
        currentManifestRef: {
          manifestId: manifest.manifestId,
          slotId: manifest.slotId,
          mode: manifest.mode,
          strategyVersion: manifest.strategyVersion,
        },
        currentManifestPath: toRepoRelative(paths.currentPath),
        current_manifest_id: manifest.manifestId,
        current_manifest_path: toRepoRelative(paths.currentPath),
        versionedManifestPath: toRepoRelative(paths.versionedPath),
        versioned_manifest_path: toRepoRelative(paths.versionedPath),
        strategyVersion: manifest.strategyVersion,
        strategy_version: manifest.strategyVersion,
        promotedAt: manifest.validation.promotedAt,
        promoted_at: manifest.validation.promotedAt,
      },
    ]),
  );

  return assertPromotedSlotRegistry({
    version: CONTRACT_VERSION,
    registryVersion: SLOT_REGISTRY_VERSION,
    registry_version: SLOT_REGISTRY_VERSION,
    authority: "promoted_manifests_only",
    generatedAtUtc,
    generated_at_utc: generatedAtUtc,
    promotedManifestRoot: promotedManifestRootPath,
    promoted_manifest_root: promotedManifestRootPath,
    slots,
  });
}

export function writeSlotRegistry(registry) {
  const normalizedRegistry = assertPromotedSlotRegistry(registry);
  if (fileExists(slotRegistryPath)) {
    const existingRegistry = assertPromotedSlotRegistry(readJson(slotRegistryPath));
    if (
      stableJson(stripRegistryGenerationTimestamp(existingRegistry)) ===
      stableJson(stripRegistryGenerationTimestamp(normalizedRegistry))
    ) {
      return slotRegistryPath;
    }
  }

  writeJson(slotRegistryPath, normalizedRegistry);
  return slotRegistryPath;
}

export function readPromotedSlotRegistry() {
  if (!fileExists(slotRegistryPath)) {
    throw new Error("Promoted slot registry is missing.");
  }

  return assertPromotedSlotRegistry(readJson(slotRegistryPath));
}

export function readCurrentManifestBySlot(slotId) {
  const registry = readPromotedSlotRegistry();
  const slotEntry = registry.slots[slotId];
  if (!slotEntry) {
    throw new Error(`Missing current manifest registry entry for ${slotId}`);
  }

  const manifestPath = path.resolve(repoRoot, slotEntry.currentManifestPath);
  return parseActivationManifest(readJson(manifestPath));
}

export function readCurrentPromotedManifestDocumentBySlot(slotId) {
  const registry = readPromotedSlotRegistry();
  const slotEntry = registry.slots[slotId];
  if (!slotEntry) {
    throw new Error(`Missing current manifest registry entry for ${slotId}`);
  }

  const manifestPath = path.resolve(repoRoot, slotEntry.currentManifestPath);
  return parseCanonicalPromotedManifestDocument(readJson(manifestPath));
}

export function readVersionedManifestBySlot(slotId, strategyVersion) {
  getStrategySlot(slotId);
  const manifestPath = versionedManifestPath(slotId, strategyVersion);
  if (!fileExists(manifestPath)) {
    throw new Error(`Missing versioned manifest for ${slotId} at ${strategyVersion}`);
  }

  return parseActivationManifest(readJson(manifestPath));
}

export function readVersionedPromotedManifestDocumentBySlot(slotId, strategyVersion) {
  getStrategySlot(slotId);
  const manifestPath = versionedManifestPath(slotId, strategyVersion);
  if (!fileExists(manifestPath)) {
    throw new Error(`Missing versioned manifest for ${slotId} at ${strategyVersion}`);
  }

  return parseCanonicalPromotedManifestDocument(readJson(manifestPath));
}

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

export function validatePromotedBoundary() {
  const slotIds = listPublicStrategySlots().map((slot) => slot.slotId);
  const registry = readPromotedSlotRegistry();

  for (const slotId of slotIds) {
    const slotEntry = registry.slots[slotId];
    if (!slotEntry) {
      throw new Error(`Missing promoted slot registry entry for ${slotId}`);
    }
    const incumbent = loadIncumbentForSlot(slotId);
    if (!incumbent) {
      throw new Error(`Missing promoted incumbent for ${slotId}`);
    }
    const normalizedRegistryManifestRef =
      normalizePromotedSlotRegistryEntryManifestRef(slotEntry);
    const normalizedIncumbentManifestRef =
      normalizePromotedIncumbentManifestRef(incumbent);

    if (
      stableJson(normalizedRegistryManifestRef) !==
      stableJson(normalizedIncumbentManifestRef)
    ) {
      throw new Error(`Registry/incumbent manifest ref drift detected for ${slotId}`);
    }

    const rawManifest = readJson(path.resolve(repoRoot, slotEntry.currentManifestPath));
    for (const field of FORBIDDEN_PROMOTED_FIELDS) {
      if (field in rawManifest) {
        throw new Error(`Raw research internals leaked into promoted manifest for ${slotId}`);
      }
    }

    const currentManifestDocument = parseCanonicalPromotedManifestDocument(rawManifest);
    const currentManifest = parseActivationManifest(rawManifest);
    if (currentManifest.manifestId !== normalizedRegistryManifestRef.manifest_id) {
      throw new Error(`Current manifest ref drift detected for ${slotId}`);
    }

    if (currentManifest.strategyVersion !== normalizedRegistryManifestRef.strategy_version) {
      throw new Error(`Current manifest strategy version drift detected for ${slotId}`);
    }

    if (currentManifest.chain !== normalizedRegistryManifestRef.chain) {
      throw new Error(`Current manifest chain drift detected for ${slotId}`);
    }

    if (
      currentManifestDocument.validation.promoted_at !==
      normalizedRegistryManifestRef.promoted_at
    ) {
      throw new Error(`Current manifest promoted_at drift detected for ${slotId}`);
    }

    const versionedManifest = readVersionedPromotedManifestDocumentBySlot(
      slotId,
      currentManifest.strategyVersion,
    );
    if (versionedManifest.manifestId !== currentManifestDocument.manifestId) {
      throw new Error(`Versioned manifest drift detected for ${slotId}`);
    }

    if (
      stableJson(currentManifestDocument.requiredAssets) !==
      stableJson(currentManifestDocument.executionBoundary.requiredAssets)
    ) {
      throw new Error(`Runtime requiredAssets drift detected for ${slotId}`);
    }

    if (
      stableJson(currentManifestDocument.requiredRoutes) !==
      stableJson(currentManifestDocument.executionBoundary.requiredRoutes)
    ) {
      throw new Error(`Runtime requiredRoutes drift detected for ${slotId}`);
    }

    if (
      stableJson(currentManifestDocument.walletRequirements) !==
      stableJson(currentManifestDocument.executionBoundary.walletRequirements)
    ) {
      throw new Error(`Runtime walletRequirements drift detected for ${slotId}`);
    }

    if (
      stableJson(currentManifestDocument.signalRefs) !==
      stableJson(currentManifestDocument.executionBoundary.signalRefs)
    ) {
      throw new Error(`Runtime signalRefs drift detected for ${slotId}`);
    }

    if (
      stableJson(
        currentManifestDocument.routeValidation.routeTruthLabels.map((routeTruthLabel) =>
          routeTruthLabel.routeId,
        ),
      ) !==
      stableJson(currentManifestDocument.requiredRoutes.map((route) => route.routeId))
    ) {
      throw new Error(`Route validation coverage drift detected for ${slotId}`);
    }

    if (slotId === "advanced.default_directional") {
      const disableConditions = new Set(currentManifest.fallback.disableConditions);
      for (const requiredCondition of [
        "preview_only",
        "route_unverified",
        "directional_activation_disabled",
      ]) {
        if (!disableConditions.has(requiredCondition)) {
          throw new Error(`Directional manifest must fail closed with ${requiredCondition}`);
        }
      }

      if (!currentManifest.frontend.badges.includes("preview_only")) {
        throw new Error("Directional manifest must stay preview-only in the promoted boundary.");
      }

      if (!currentManifestDocument.route_validation.validation_badges.includes("preview_only")) {
        throw new Error("Directional route validation must stay preview-only.");
      }

      if (currentManifestDocument.route_validation.execution_eligibility !== "preview_only") {
        throw new Error("Directional manifest must remain preview-only for execution.");
      }

      if (currentManifestDocument.routeValidation.surfaceTruth !== "preview") {
        throw new Error("Directional runtime routeValidation must stay preview-only.");
      }

      if (currentManifestDocument.requiredRoutes[0]?.routeKind !== "directional_market") {
        throw new Error("Directional manifest must expose the directional runtime route.");
      }

      if (currentManifest.frontend.badges.some((badge) => badge.includes("live"))) {
        throw new Error("Directional manifest must not claim fake live readiness.");
      }
    } else {
      const expectedBasketExecutionSurface = deriveBasketExecutionSurfaceForAllocations(
        currentManifest.frontend.badges,
        currentManifestDocument.target_allocations,
      );
      const expectedExplanationSurface = buildBasketExplanationSurface(incumbent);
      const serializedExplanationSurface = stableJson({
        explanationBundle: currentManifestDocument.explanationBundle,
        tuningSummary: currentManifestDocument.tuningSummary,
      });

      if (
        stableJson(currentManifestDocument.explanationBundle) !==
        stableJson(expectedExplanationSurface.explanationBundle)
      ) {
        throw new Error(`${slotId} basket explanation bundle drift detected.`);
      }

      if (
        stableJson(currentManifestDocument.explanation_bundle) !==
        stableJson(expectedExplanationSurface.explanation_bundle)
      ) {
        throw new Error(`${slotId} basket explanation_bundle alias drift detected.`);
      }

      if (
        stableJson(currentManifestDocument.tuningSummary) !==
        stableJson(expectedExplanationSurface.tuningSummary)
      ) {
        throw new Error(`${slotId} basket tuning summary drift detected.`);
      }

      if (
        stableJson(currentManifestDocument.tuning_summary) !==
        stableJson(expectedExplanationSurface.tuning_summary)
      ) {
        throw new Error(`${slotId} basket tuning_summary alias drift detected.`);
      }

      for (const forbiddenToken of FORBIDDEN_EXPLANATION_TOKENS) {
        if (serializedExplanationSurface.includes(forbiddenToken)) {
          throw new Error(`${slotId} basket explanation surface leaked raw run internals.`);
        }
      }

      if (
        currentManifestDocument.route_validation.execution_eligibility !==
        expectedBasketExecutionSurface.executionEligibility
      ) {
        throw new Error(
          `${slotId} basket manifest execution eligibility drift detected.`,
        );
      }

      if (
        currentManifestDocument.routeValidation.surfaceTruth !==
        expectedBasketExecutionSurface.surfaceTruth
      ) {
        throw new Error(`${slotId} basket manifest surface truth drift detected.`);
      }

      if (
        stableJson(currentManifest.frontend.badges) !==
        stableJson(expectedBasketExecutionSurface.frontendBadges)
      ) {
        throw new Error(`${slotId} basket manifest frontend badge drift detected.`);
      }
    }
  }

  return {
    status: "ok",
    slotCount: slotIds.length,
    slotRegistryPath: toRepoRelative(slotRegistryPath),
  };
}
