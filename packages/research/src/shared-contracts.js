import { CHAIN } from "./constants.js";

import {
  activationManifestFrontendSchema,
  activationManifestSchema,
  activationManifestValidationSchema,
  activationTemplateSchema,
  promotedActivationManifestSchema,
  promotedActivationTemplateSchema,
  promotedActivationTemplateWalletRequirementsSchema,
} from "../../shared/dist/contracts/activation.js";
import {
  activationManifestRefSchema,
  chainSchema,
  contractVersionSchema,
  executionEligibilitySchema,
  nonEmptyStringSchema,
  routeRequirementSchema,
  routeTruthLabelRowSchema,
  routeTruthLabelSchema,
  signalRefSchema,
  strategyModeSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "../../shared/dist/contracts/common.js";
import {
  strategySlotSchema,
  targetAllocationSchema,
  targetDirectionalExpressionSchema,
} from "../../shared/dist/contracts/portfolio.js";
import {
  normalizeCurrentManifestRefArtifact as sharedNormalizeCurrentManifestRefArtifact,
  normalizePromotedIncumbentArtifactManifestRef as sharedNormalizePromotedIncumbentArtifactManifestRef,
  normalizePromotedSlotRegistryArtifact,
  normalizePromotedSlotRegistryEntryManifestRef as sharedNormalizePromotedSlotRegistryEntryManifestRef,
  parsePromotedIncumbentArtifact,
  parsePromotedSlotRegistryArtifact,
  researchResultRowSchema,
} from "../../shared/dist/contracts/research.js";

function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

function assertAliasEqual(primary, alias, label) {
  if (primary !== alias) {
    throw new Error(`${label} must stay aligned across canonical aliases.`);
  }
}

function stableJson(value) {
  return JSON.stringify(value);
}

function camelToSnakeKey(key) {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function toSnakeKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => toSnakeKeys(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [camelToSnakeKey(key), toSnakeKeys(entryValue)]),
  );
}

function normalizeRequiredString(value, label) {
  return nonEmptyStringSchema.parse(value);
}

function normalizeNullableStringField(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return nonEmptyStringSchema.parse(value);
}

function normalizeRequiredFiniteNumber(value, label) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return normalized;
}

function normalizeNullableFiniteNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw new Error("Nullable numeric research result row fields must be finite numbers.");
  }

  return normalized;
}

function normalizeBoolean(value, label) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${label} must be a boolean.`);
}

function normalizeResearchChainId(value) {
  if (value === undefined || value === null || value === "") {
    return CHAIN;
  }

  if (value === "1" || value === CHAIN) {
    return CHAIN;
  }

  return nonEmptyStringSchema.parse(value);
}

function parseStringArray(values, label, { required = false } = {}) {
  if (!Array.isArray(values)) {
    throw new Error(`${label} must be an array.`);
  }

  if (required && values.length === 0) {
    throw new Error(`${label} must be a non-empty array.`);
  }

  for (const value of values) {
    nonEmptyStringSchema.parse(value);
  }

  return values;
}

function parseNullableString(value) {
  if (value === null) {
    return value;
  }

  return nonEmptyStringSchema.parse(value);
}

function parseReplayPoint(value, label) {
  const point = assertRecord(value, label);
  normalizeRequiredString(point.label, `${label}.label`);
  normalizeRequiredFiniteNumber(point.value, `${label}.value`);

  if (point.value < 0) {
    throw new Error(`${label}.value must be non-negative.`);
  }

  if (point.date !== undefined) {
    normalizeRequiredString(point.date, `${label}.date`);
  }

  return point;
}

function parseReplaySurface(value, label) {
  const replay = assertRecord(value, label);
  normalizeRequiredFiniteNumber(replay.startingCapital, `${label}.startingCapital`);
  normalizeRequiredFiniteNumber(replay.endingCapital, `${label}.endingCapital`);
  normalizeRequiredFiniteNumber(replay.netReturnPct, `${label}.netReturnPct`);
  normalizeRequiredFiniteNumber(replay.maxDrawdownPct, `${label}.maxDrawdownPct`);
  normalizeRequiredFiniteNumber(replay.turnoverPct, `${label}.turnoverPct`);
  normalizeRequiredFiniteNumber(replay.winRatePct, `${label}.winRatePct`);

  if (replay.startingCapital <= 0) {
    throw new Error(`${label}.startingCapital must be positive.`);
  }

  if (replay.endingCapital < 0) {
    throw new Error(`${label}.endingCapital must be non-negative.`);
  }

  if (replay.turnoverPct < 0) {
    throw new Error(`${label}.turnoverPct must be non-negative.`);
  }

  if (replay.winRatePct < 0 || replay.winRatePct > 100) {
    throw new Error(`${label}.winRatePct must stay between 0 and 100.`);
  }

  if (!Array.isArray(replay.points) || replay.points.length < 2) {
    throw new Error(`${label}.points must contain at least two replay points.`);
  }

  replay.points.forEach((point, index) =>
    parseReplayPoint(point, `${label}.points[${index}]`),
  );

  return replay;
}

function parseMarketIntelligenceDriver(value, label) {
  const driver = assertRecord(value, label);
  normalizeRequiredString(driver.label, `${label}.label`);
  normalizeRequiredString(driver.value, `${label}.value`);
  normalizeRequiredString(driver.note, `${label}.note`);

  if (!["positive", "neutral", "warning"].includes(driver.tone)) {
    throw new Error(`${label}.tone must be positive, neutral, or warning.`);
  }

  return driver;
}

function parseMarketIntelligenceSurface(value, label) {
  const surface = assertRecord(value, label);
  normalizeRequiredString(surface.currentView, `${label}.currentView`);
  normalizeRequiredString(surface.horizon, `${label}.horizon`);
  parseStringArray(surface.whatChanged, `${label}.whatChanged`, { required: true });

  if (!Array.isArray(surface.drivers) || surface.drivers.length === 0) {
    throw new Error(`${label}.drivers must be a non-empty array.`);
  }

  surface.drivers.forEach((driver, index) =>
    parseMarketIntelligenceDriver(driver, `${label}.drivers[${index}]`),
  );

  return surface;
}

function parseRuntimeRequiredRoutes(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array.`);
  }

  return value.map((route, index) => {
    const parsedRoute = assertRecord(route, `${label}[${index}]`);
    return {
      routeId: normalizeRequiredString(parsedRoute.routeId, `${label}[${index}].routeId`),
      label: normalizeRequiredString(parsedRoute.label, `${label}[${index}].label`),
      routeKind: normalizeRequiredString(parsedRoute.routeKind, `${label}[${index}].routeKind`),
      requiredFor: normalizeRequiredString(
        parsedRoute.requiredFor,
        `${label}[${index}].requiredFor`,
      ),
    };
  });
}

function parseRuntimeWalletRequirements(value, label) {
  const walletRequirements = assertRecord(value, label);

  if (typeof walletRequirements.requiresWallet !== "boolean") {
    throw new Error(`${label}.requiresWallet must be a boolean.`);
  }
  if (typeof walletRequirements.requiresSmartAccount !== "boolean") {
    throw new Error(`${label}.requiresSmartAccount must be a boolean.`);
  }
  if (
    typeof walletRequirements.minFundingUsd !== "number" ||
    !Number.isFinite(walletRequirements.minFundingUsd) ||
    walletRequirements.minFundingUsd < 0
  ) {
    throw new Error(`${label}.minFundingUsd must be a non-negative number.`);
  }

  return {
    requiresWallet: walletRequirements.requiresWallet,
    requiresSmartAccount: walletRequirements.requiresSmartAccount,
    minFundingUsd: walletRequirements.minFundingUsd,
    preferredFundingProvider: normalizeRequiredString(
      walletRequirements.preferredFundingProvider,
      `${label}.preferredFundingProvider`,
    ),
    preferredBridgeProvider: normalizeRequiredString(
      walletRequirements.preferredBridgeProvider,
      `${label}.preferredBridgeProvider`,
    ),
    topUpAsset: normalizeRequiredString(walletRequirements.topUpAsset, `${label}.topUpAsset`),
  };
}

function parseRuntimeSignalRefs(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array.`);
  }

  return value.map((signalRef, index) =>
    signalRefSchema.parse(assertRecord(signalRef, `${label}[${index}]`)),
  );
}

function projectComparableSharedRouteRequirement(runtimeRoute) {
  let routeKind = runtimeRoute.routeKind;

  if (routeKind === "yield_vault") {
    routeKind = "vault";
  } else if (routeKind === "directional_market") {
    routeKind = "execution";
  }

  return routeRequirementSchema.parse({
    route_id: runtimeRoute.routeId,
    route_kind: routeKind,
    required_for: runtimeRoute.requiredFor,
    label: runtimeRoute.label,
  });
}

function parseRuntimeRouteTruthLabels(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array.`);
  }

  return value.map((routeTruthLabel, index) => {
    const parsedRouteTruthLabel = assertRecord(
      routeTruthLabel,
      `${label}[${index}]`,
    );
    const projectedRouteTruthLabel = routeTruthLabelRowSchema.parse({
      route_id: parsedRouteTruthLabel.routeId,
      label: parsedRouteTruthLabel.label,
      route_kind: parsedRouteTruthLabel.routeKind,
      chain: parsedRouteTruthLabel.chain,
      verification_tier: parsedRouteTruthLabel.verificationTier,
      truth_label: parsedRouteTruthLabel.truthLabel,
      availability: parsedRouteTruthLabel.availability,
      required_for: parsedRouteTruthLabel.requiredFor,
      reason: parsedRouteTruthLabel.reason,
    });

    return {
      routeId: projectedRouteTruthLabel.route_id,
      label: projectedRouteTruthLabel.label,
      routeKind: projectedRouteTruthLabel.route_kind,
      chain: projectedRouteTruthLabel.chain,
      verificationTier: projectedRouteTruthLabel.verification_tier,
      truthLabel: projectedRouteTruthLabel.truth_label,
      availability: projectedRouteTruthLabel.availability,
      requiredFor: projectedRouteTruthLabel.required_for,
      reason: projectedRouteTruthLabel.reason,
    };
  });
}

function projectSharedRouteValidationAlias(routeValidation) {
  return {
    execution_eligibility: routeValidation.executionEligibility,
    surface_truth: routeValidation.surfaceTruth,
    route_truth_labels: routeValidation.routeTruthLabels.map((routeTruthLabel) => ({
      route_id: routeTruthLabel.routeId,
      label: routeTruthLabel.label,
      route_kind: routeTruthLabel.routeKind,
      chain: routeTruthLabel.chain,
      verification_tier: routeTruthLabel.verificationTier,
      truth_label: routeTruthLabel.truthLabel,
      availability: routeTruthLabel.availability,
      required_for: routeTruthLabel.requiredFor,
      reason: routeTruthLabel.reason,
    })),
    proof_notes: routeValidation.proofNotes,
    validation_badges: routeValidation.validationBadges,
  };
}

function parseRuntimeRouteValidation(value) {
  const routeValidation = assertRecord(value, "Promoted manifest routeValidation");
  const normalizedRouteValidation = {
    executionEligibility: executionEligibilitySchema.parse(
      routeValidation.executionEligibility,
    ),
    surfaceTruth: routeTruthLabelSchema.parse(routeValidation.surfaceTruth),
    routeTruthLabels: parseRuntimeRouteTruthLabels(
      routeValidation.routeTruthLabels,
      "routeValidation.routeTruthLabels",
    ),
    proofNotes: parseStringArray(routeValidation.proofNotes, "routeValidation.proofNotes", {
      required: true,
    }),
    validationBadges: parseStringArray(
      routeValidation.validationBadges,
      "routeValidation.validationBadges",
      { required: true },
    ),
  };

  parseRouteValidation(projectSharedRouteValidationAlias(normalizedRouteValidation));
  return normalizedRouteValidation;
}

function parseExecutionBoundary(value) {
  const boundary = assertRecord(value, "Promoted manifest executionBoundary");
  if (boundary.promoted !== true) {
    throw new Error("Promoted manifest executionBoundary.promoted must be true.");
  }

  const source = assertRecord(boundary.source, "Promoted manifest executionBoundary source");
  if (source.type !== "research_promoted_manifest") {
    throw new Error("Promoted manifest executionBoundary source type must be research_promoted_manifest.");
  }
  nonEmptyStringSchema.parse(source.manifestId);
  strategySlotIdSchema.parse(source.slotId);
  return {
    promoted: true,
    source,
    requiredAssets: parseStringArray(boundary.requiredAssets, "executionBoundary.requiredAssets", {
      required: true,
    }),
    requiredRoutes: parseRuntimeRequiredRoutes(
      boundary.requiredRoutes,
      "executionBoundary.requiredRoutes",
    ),
    walletRequirements: parseRuntimeWalletRequirements(
      boundary.walletRequirements,
      "executionBoundary.walletRequirements",
    ),
    signalRefs: parseRuntimeSignalRefs(boundary.signalRefs, "executionBoundary.signalRefs"),
  };
}

function parseRouteValidation(value) {
  const routeValidation = assertRecord(value, "Promoted manifest route_validation");
  executionEligibilitySchema.parse(routeValidation.execution_eligibility);
  routeTruthLabelSchema.parse(routeValidation.surface_truth);

  if (
    !Array.isArray(routeValidation.route_truth_labels) ||
    routeValidation.route_truth_labels.length === 0
  ) {
    throw new Error("route_validation.route_truth_labels must be a non-empty array.");
  }
  for (const routeTruthLabel of routeValidation.route_truth_labels) {
    routeTruthLabelRowSchema.parse(routeTruthLabel);
  }

  parseStringArray(routeValidation.proof_notes, "route_validation.proof_notes", {
    required: true,
  });
  parseStringArray(
    routeValidation.validation_badges,
    "route_validation.validation_badges",
    { required: true },
  );

  return routeValidation;
}

function parseNullableRuntimeString(value, label) {
  if (value === null) {
    return null;
  }

  return normalizeRequiredString(value, label);
}

function parseBasketExplanationBundle(value, label) {
  const bundle = assertRecord(value, label);

  normalizeRequiredString(bundle.truthMode, `${label}.truthMode`);
  normalizeRequiredString(bundle.incumbentState, `${label}.incumbentState`);

  if (!Array.isArray(bundle.reasonCodes) || bundle.reasonCodes.length === 0) {
    throw new Error(`${label}.reasonCodes must be a non-empty array.`);
  }
  for (const [index, reasonCode] of bundle.reasonCodes.entries()) {
    const row = assertRecord(reasonCode, `${label}.reasonCodes[${index}]`);
    normalizeRequiredString(row.code, `${label}.reasonCodes[${index}].code`);
    normalizeRequiredString(row.kind, `${label}.reasonCodes[${index}].kind`);
    parseNullableRuntimeString(
      row.value ?? null,
      `${label}.reasonCodes[${index}].value`,
    );
    normalizeRequiredString(row.label, `${label}.reasonCodes[${index}].label`);
  }

  if (!Array.isArray(bundle.targetWeights) || bundle.targetWeights.length === 0) {
    throw new Error(`${label}.targetWeights must be a non-empty array.`);
  }
  for (const [index, targetWeight] of bundle.targetWeights.entries()) {
    const row = assertRecord(targetWeight, `${label}.targetWeights[${index}]`);
    normalizeRequiredFiniteNumber(row.rank, `${label}.targetWeights[${index}].rank`);
    normalizeRequiredString(row.symbol, `${label}.targetWeights[${index}].symbol`);
    normalizeRequiredString(row.assetName, `${label}.targetWeights[${index}].assetName`);
    normalizeRequiredFiniteNumber(
      row.targetWeightPct,
      `${label}.targetWeights[${index}].targetWeightPct`,
    );
  }

  normalizeRequiredFiniteNumber(bundle.cashWeightPct, `${label}.cashWeightPct`);
  normalizeRequiredFiniteNumber(
    bundle.rebalanceThresholdBps,
    `${label}.rebalanceThresholdBps`,
  );
  normalizeRequiredFiniteNumber(
    bundle.rebalanceThresholdPct,
    `${label}.rebalanceThresholdPct`,
  );

  const benchmarkDelta = assertRecord(bundle.benchmarkDelta, `${label}.benchmarkDelta`);
  parseNullableString(benchmarkDelta.benchmarkId);
  normalizeRequiredFiniteNumber(
    benchmarkDelta.returnAnnPct,
    `${label}.benchmarkDelta.returnAnnPct`,
  );
  normalizeRequiredFiniteNumber(
    benchmarkDelta.benchmarkReturnAnnPct,
    `${label}.benchmarkDelta.benchmarkReturnAnnPct`,
  );
  normalizeRequiredFiniteNumber(
    benchmarkDelta.afterCostReturnAnnPct,
    `${label}.benchmarkDelta.afterCostReturnAnnPct`,
  );
  normalizeRequiredFiniteNumber(
    benchmarkDelta.benchmarkAfterCostReturnAnnPct,
    `${label}.benchmarkDelta.benchmarkAfterCostReturnAnnPct`,
  );
  normalizeRequiredFiniteNumber(
    benchmarkDelta.excessReturnAfterCostPct,
    `${label}.benchmarkDelta.excessReturnAfterCostPct`,
  );
  normalizeRequiredFiniteNumber(benchmarkDelta.score, `${label}.benchmarkDelta.score`);
  normalizeNullableFiniteNumber(benchmarkDelta.deltaVsIncumbent);

  const portfolioMetrics = assertRecord(bundle.portfolioMetrics, `${label}.portfolioMetrics`);
  normalizeRequiredFiniteNumber(
    portfolioMetrics.constituentCount,
    `${label}.portfolioMetrics.constituentCount`,
  );
  normalizeNullableFiniteNumber(portfolioMetrics.concentrationPct);
  normalizeNullableFiniteNumber(portfolioMetrics.concentrationCapPct);
  normalizeNullableFiniteNumber(portfolioMetrics.turnoverAnnPct);
  normalizeNullableFiniteNumber(portfolioMetrics.costsTotalBps);

  const summaries = assertRecord(bundle.summaries, `${label}.summaries`);
  normalizeRequiredString(summaries.construction, `${label}.summaries.construction`);
  normalizeRequiredString(summaries.benchmark, `${label}.summaries.benchmark`);
  normalizeRequiredString(summaries.rebalance, `${label}.summaries.rebalance`);

  return bundle;
}

function parseBasketTuningSummary(value, label) {
  const summary = assertRecord(value, label);
  normalizeRequiredString(summary.headline, `${label}.headline`);

  if (!Array.isArray(summary.currentKnobs) || summary.currentKnobs.length === 0) {
    throw new Error(`${label}.currentKnobs must be a non-empty array.`);
  }
  for (const [index, knob] of summary.currentKnobs.entries()) {
    const row = assertRecord(knob, `${label}.currentKnobs[${index}]`);
    normalizeRequiredString(row.knobId, `${label}.currentKnobs[${index}].knobId`);
    normalizeRequiredString(row.label, `${label}.currentKnobs[${index}].label`);
    parseNullableRuntimeString(
      row.currentValue ?? null,
      `${label}.currentKnobs[${index}].currentValue`,
    );
    normalizeRequiredString(
      row.tuningImpact,
      `${label}.currentKnobs[${index}].tuningImpact`,
    );
  }

  parseStringArray(summary.watchpoints, `${label}.watchpoints`, { required: true });
  return summary;
}

export function parseStrategySlot(value) {
  return strategySlotSchema.parse(value);
}

export const RESEARCH_RESULT_ARTIFACT_HEADERS = [
  "run_id",
  "completed_at_utc",
  "stage",
  "mode",
  "slot_id",
  "objective_id",
  "status",
  "candidate_ref",
  "incumbent_run_id",
  "manual_version",
  "evaluator_version",
  "research_dataset_id",
  "validation_set_id",
  "universe_id",
  "chain_id",
  "live_truth_source_id",
  "primary_score",
  "incumbent_score",
  "delta_score",
  "guardrail_pass",
  "return_ann_pct",
  "max_drawdown_pct",
  "turnover_ann_pct",
  "costs_total_bps",
  "description",
  "benchmark_id",
  "constituent_count_avg",
  "weight_max_pct",
  "gross_exposure_avg_pct",
  "net_exposure_avg_pct",
  "leverage_avg",
  "borrow_cost_bps",
  "euler_market_set_id",
  "euler_health_min",
];

export function parseResearchResultRow(value) {
  const row = assertRecord(value, "Research result row");
  const normalized = {
    version: row.version ?? "1",
    runId: row.runId ?? row.run_id,
    completedAtUtc: row.completedAtUtc ?? row.completed_at_utc,
    stage: row.stage,
    mode: row.mode,
    slotId: row.slotId ?? row.slot_id,
    objectiveId: row.objectiveId ?? row.objective_id,
    status: row.status,
    candidateRef: row.candidateRef ?? row.candidate_ref,
    incumbentRunId: row.incumbentRunId ?? row.incumbent_run_id,
    manualVersion: row.manualVersion ?? row.manual_version,
    evaluatorVersion: row.evaluatorVersion ?? row.evaluator_version,
    researchDatasetId: row.researchDatasetId ?? row.research_dataset_id,
    validationSetId: row.validationSetId ?? row.validation_set_id,
    universeId: row.universeId ?? row.universe_id,
    chainId: row.chainId ?? row.chain_id,
    liveTruthSourceId: row.liveTruthSourceId ?? row.live_truth_source_id,
    primaryScore: row.primaryScore ?? row.primary_score,
    incumbentScore: row.incumbentScore ?? row.incumbent_score,
    deltaScore: row.deltaScore ?? row.delta_score,
    guardrailPass: row.guardrailPass ?? row.guardrail_pass,
    returnAnnPct: row.returnAnnPct ?? row.return_ann_pct,
    maxDrawdownPct: row.maxDrawdownPct ?? row.max_drawdown_pct,
    turnoverAnnPct: row.turnoverAnnPct ?? row.turnover_ann_pct,
    costsTotalBps: row.costsTotalBps ?? row.costs_total_bps,
    description: row.description,
    benchmarkId: row.benchmarkId ?? row.benchmark_id,
    constituentCountAvg: row.constituentCountAvg ?? row.constituent_count_avg,
    weightMaxPct: row.weightMaxPct ?? row.weight_max_pct,
    grossExposureAvgPct: row.grossExposureAvgPct ?? row.gross_exposure_avg_pct,
    netExposureAvgPct: row.netExposureAvgPct ?? row.net_exposure_avg_pct,
    leverageAvg: row.leverageAvg ?? row.leverage_avg,
    borrowCostBps: row.borrowCostBps ?? row.borrow_cost_bps,
    eulerMarketSetId: row.eulerMarketSetId ?? row.euler_market_set_id,
    eulerHealthMin: row.eulerHealthMin ?? row.euler_health_min,
  };

  contractVersionSchema.parse(normalized.version);
  normalizeRequiredString(normalized.runId, "runId");
  timestampSchema.parse(normalized.completedAtUtc);
  normalizeRequiredString(normalized.stage, "stage");
  strategyModeSchema.parse(normalized.mode);
  strategySlotIdSchema.parse(normalized.slotId);
  normalizeRequiredString(normalized.objectiveId, "objectiveId");
  normalizeRequiredString(normalized.status, "status");
  normalizeRequiredString(normalized.candidateRef, "candidateRef");
  normalizeRequiredString(normalized.manualVersion, "manualVersion");
  normalizeRequiredString(normalized.evaluatorVersion, "evaluatorVersion");
  normalizeRequiredString(normalized.researchDatasetId, "researchDatasetId");
  normalizeRequiredString(normalized.validationSetId, "validationSetId");
  normalizeRequiredString(normalized.universeId, "universeId");
  normalizeRequiredString(normalized.chainId, "chainId");
  normalizeRequiredString(normalized.liveTruthSourceId, "liveTruthSourceId");
  normalizeRequiredFiniteNumber(normalized.primaryScore, "primaryScore");
  normalizeBoolean(normalized.guardrailPass, "guardrailPass");
  normalizeRequiredFiniteNumber(normalized.returnAnnPct, "returnAnnPct");
  normalizeRequiredFiniteNumber(normalized.maxDrawdownPct, "maxDrawdownPct");
  normalizeRequiredFiniteNumber(normalized.turnoverAnnPct, "turnoverAnnPct");
  normalizeRequiredFiniteNumber(normalized.costsTotalBps, "costsTotalBps");
  normalizeRequiredString(normalized.description, "description");

  return {
    version: normalized.version,
    runId: normalizeRequiredString(normalized.runId, "runId"),
    completedAtUtc: normalized.completedAtUtc,
    stage: normalizeRequiredString(normalized.stage, "stage"),
    mode: normalized.mode,
    slotId: normalized.slotId,
    objectiveId: normalizeRequiredString(normalized.objectiveId, "objectiveId"),
    status: normalizeRequiredString(normalized.status, "status"),
    candidateRef: normalizeRequiredString(normalized.candidateRef, "candidateRef"),
    incumbentRunId: normalizeNullableStringField(normalized.incumbentRunId),
    manualVersion: normalizeRequiredString(normalized.manualVersion, "manualVersion"),
    evaluatorVersion: normalizeRequiredString(
      normalized.evaluatorVersion,
      "evaluatorVersion",
    ),
    researchDatasetId: normalizeRequiredString(
      normalized.researchDatasetId,
      "researchDatasetId",
    ),
    validationSetId: normalizeRequiredString(
      normalized.validationSetId,
      "validationSetId",
    ),
    universeId: normalizeRequiredString(normalized.universeId, "universeId"),
    chainId: normalizeResearchChainId(normalized.chainId),
    liveTruthSourceId: normalizeRequiredString(
      normalized.liveTruthSourceId,
      "liveTruthSourceId",
    ),
    primaryScore: normalizeRequiredFiniteNumber(normalized.primaryScore, "primaryScore"),
    incumbentScore: normalizeNullableFiniteNumber(normalized.incumbentScore),
    deltaScore: normalizeNullableFiniteNumber(normalized.deltaScore),
    guardrailPass: normalizeBoolean(normalized.guardrailPass, "guardrailPass"),
    returnAnnPct: normalizeRequiredFiniteNumber(normalized.returnAnnPct, "returnAnnPct"),
    maxDrawdownPct: normalizeRequiredFiniteNumber(
      normalized.maxDrawdownPct,
      "maxDrawdownPct",
    ),
    turnoverAnnPct: normalizeRequiredFiniteNumber(
      normalized.turnoverAnnPct,
      "turnoverAnnPct",
    ),
    costsTotalBps: normalizeRequiredFiniteNumber(
      normalized.costsTotalBps,
      "costsTotalBps",
    ),
    description: normalizeRequiredString(normalized.description, "description"),
    benchmarkId: normalizeNullableStringField(normalized.benchmarkId),
    constituentCountAvg: normalizeNullableFiniteNumber(normalized.constituentCountAvg),
    weightMaxPct: normalizeNullableFiniteNumber(normalized.weightMaxPct),
    grossExposureAvgPct: normalizeNullableFiniteNumber(normalized.grossExposureAvgPct),
    netExposureAvgPct: normalizeNullableFiniteNumber(normalized.netExposureAvgPct),
    leverageAvg: normalizeNullableFiniteNumber(normalized.leverageAvg),
    borrowCostBps: normalizeNullableFiniteNumber(normalized.borrowCostBps),
    eulerMarketSetId: normalizeNullableStringField(normalized.eulerMarketSetId),
    eulerHealthMin: normalizeNullableFiniteNumber(normalized.eulerHealthMin),
  };
}

function blankableResearchResultArtifactValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return value;
}

export function normalizeResearchResultArtifact(value) {
  const row = parseResearchResultRow(value);
  const artifact = {
    run_id: row.runId,
    completed_at_utc: row.completedAtUtc,
    stage: row.stage,
    mode: row.mode,
    slot_id: row.slotId,
    objective_id: row.objectiveId,
    status: row.status,
    candidate_ref: row.candidateRef,
    incumbent_run_id: blankableResearchResultArtifactValue(row.incumbentRunId),
    manual_version: row.manualVersion,
    evaluator_version: row.evaluatorVersion,
    research_dataset_id: row.researchDatasetId,
    validation_set_id: row.validationSetId,
    universe_id: row.universeId,
    chain_id: row.chainId === CHAIN || row.chainId === "1" ? "1" : row.chainId,
    live_truth_source_id: row.liveTruthSourceId,
    primary_score: row.primaryScore,
    incumbent_score: blankableResearchResultArtifactValue(row.incumbentScore),
    delta_score: blankableResearchResultArtifactValue(row.deltaScore),
    guardrail_pass: row.guardrailPass,
    return_ann_pct: row.returnAnnPct,
    max_drawdown_pct: row.maxDrawdownPct,
    turnover_ann_pct: row.turnoverAnnPct,
    costs_total_bps: row.costsTotalBps,
    description: row.description,
    benchmark_id: blankableResearchResultArtifactValue(row.benchmarkId),
    constituent_count_avg: blankableResearchResultArtifactValue(row.constituentCountAvg),
    weight_max_pct: blankableResearchResultArtifactValue(row.weightMaxPct),
    gross_exposure_avg_pct: blankableResearchResultArtifactValue(row.grossExposureAvgPct),
    net_exposure_avg_pct: blankableResearchResultArtifactValue(row.netExposureAvgPct),
    leverage_avg: blankableResearchResultArtifactValue(row.leverageAvg),
    borrow_cost_bps: blankableResearchResultArtifactValue(row.borrowCostBps),
    euler_market_set_id: blankableResearchResultArtifactValue(row.eulerMarketSetId),
    euler_health_min: blankableResearchResultArtifactValue(row.eulerHealthMin),
  };

  const parsedSharedRow = researchResultRowSchema.safeParse(artifact);
  return parsedSharedRow.success ? parsedSharedRow.data : artifact;
}

export function parseCanonicalResearchResultArtifact(value) {
  return normalizeResearchResultArtifact(value);
}

export function parseActivationManifest(value) {
  return activationManifestSchema.parse(value);
}

export function parseActivationManifestRef(value) {
  return activationManifestRefSchema.parse(value);
}

export function normalizeCurrentManifestRef(value, context) {
  return sharedNormalizeCurrentManifestRefArtifact(value, context);
}

export function normalizePromotedSlotRegistryEntryManifestRef(value) {
  return sharedNormalizePromotedSlotRegistryEntryManifestRef(value);
}

export function normalizePromotedIncumbentManifestRef(value) {
  return sharedNormalizePromotedIncumbentArtifactManifestRef(value);
}

export function projectSharedPromotedManifest(document) {
  const fallback = assertRecord(document.fallback, "Promoted manifest fallback");
  const frontend = assertRecord(document.frontend, "Promoted manifest frontend");
  const validation = assertRecord(document.validation, "Promoted manifest validation");

  return {
    manifest_id: document.manifest_id ?? document.manifestId,
    slot_id: document.slot_id ?? document.slotId,
    mode: document.mode,
    chain: document.chain,
    strategy_version: document.strategy_version ?? document.strategyVersion,
    promoted: true,
    frontend: {
      title: frontend.title,
      subtitle: frontend.subtitle,
      risk_label: frontend.risk_label ?? frontend.riskLabel,
      summary: frontend.summary,
      badges: frontend.badges,
    },
    validation: {
      dataset_version: validation.dataset_version ?? validation.datasetVersion,
      evaluator_version: validation.evaluator_version ?? validation.evaluatorVersion,
      objective_id: validation.objective_id ?? validation.objectiveId,
      score: validation.score,
      delta_vs_incumbent:
        validation.delta_vs_incumbent ?? validation.deltaVsIncumbent ?? null,
      promoted_at: validation.promoted_at ?? validation.promotedAt,
    },
    signal_refs: document.signal_refs,
    activation_template: document.activation_template,
    fallback: {
      previous_incumbent_id:
        fallback.previous_incumbent_id ?? fallback.previousIncumbentId ?? null,
      disable_conditions:
        fallback.disable_conditions ?? fallback.disableConditions ?? [],
    },
  };
}

export function parseCanonicalPromotedManifestDocument(value) {
  const document = assertRecord(value, "Promoted manifest document");
  contractVersionSchema.parse(document.version);
  nonEmptyStringSchema.parse(document.manifestId);
  nonEmptyStringSchema.parse(document.manifest_id);
  strategySlotIdSchema.parse(document.slotId);
  strategySlotIdSchema.parse(document.slot_id);
  strategyModeSchema.parse(document.mode);
  chainSchema.parse(document.chain);
  nonEmptyStringSchema.parse(document.strategyVersion);
  nonEmptyStringSchema.parse(document.strategy_version);
  if (document.promoted !== true) {
    throw new Error("Promoted manifest document must set promoted=true.");
  }

  const frontend = assertRecord(document.frontend, "Promoted manifest frontend");
  nonEmptyStringSchema.parse(frontend.title);
  nonEmptyStringSchema.parse(frontend.subtitle);
  nonEmptyStringSchema.parse(frontend.riskLabel);
  nonEmptyStringSchema.parse(frontend.risk_label);
  nonEmptyStringSchema.parse(frontend.summary);
  parseStringArray(frontend.badges, "frontend.badges", { required: true });

  const validation = assertRecord(document.validation, "Promoted manifest validation");
  nonEmptyStringSchema.parse(validation.datasetVersion);
  nonEmptyStringSchema.parse(validation.dataset_version);
  nonEmptyStringSchema.parse(validation.evaluatorVersion);
  nonEmptyStringSchema.parse(validation.evaluator_version);
  nonEmptyStringSchema.parse(validation.objectiveId);
  nonEmptyStringSchema.parse(validation.objective_id);
  if (typeof validation.score !== "number" || !Number.isFinite(validation.score)) {
    throw new Error("validation.score must be a finite number.");
  }
  if (
    validation.deltaVsIncumbent !== null &&
    (typeof validation.deltaVsIncumbent !== "number" ||
      !Number.isFinite(validation.deltaVsIncumbent))
  ) {
    throw new Error("validation.deltaVsIncumbent must be a finite number or null.");
  }
  if (
    validation.delta_vs_incumbent !== null &&
    (typeof validation.delta_vs_incumbent !== "number" ||
      !Number.isFinite(validation.delta_vs_incumbent))
  ) {
    throw new Error("validation.delta_vs_incumbent must be a finite number or null.");
  }
  timestampSchema.parse(validation.promotedAt);
  timestampSchema.parse(validation.promoted_at);

  parseStringArray(document.signal_refs, "signal_refs", { required: true });

  if (!Array.isArray(document.target_allocations)) {
    throw new Error("target_allocations must be an array.");
  }
  for (const allocation of document.target_allocations) {
    targetAllocationSchema.parse(allocation);
  }

  if (!Array.isArray(document.target_directional_expressions)) {
    throw new Error("target_directional_expressions must be an array.");
  }
  for (const expression of document.target_directional_expressions) {
    targetDirectionalExpressionSchema.parse(expression);
  }

  if (!Array.isArray(document.required_routes) || document.required_routes.length === 0) {
    throw new Error("required_routes must be a non-empty array.");
  }
  for (const route of document.required_routes) {
    routeRequirementSchema.parse(route);
  }

  const requiredAssets = parseStringArray(document.requiredAssets, "requiredAssets", {
    required: true,
  });
  const requiredRoutes = parseRuntimeRequiredRoutes(document.requiredRoutes, "requiredRoutes");
  const walletRequirements = parseRuntimeWalletRequirements(
    document.walletRequirements,
    "walletRequirements",
  );
  const signalRefs = parseRuntimeSignalRefs(document.signalRefs, "signalRefs");

  promotedActivationTemplateWalletRequirementsSchema.parse(document.wallet_requirements);
  activationTemplateSchema.parse(document.activationTemplate);
  promotedActivationTemplateSchema.parse(document.activation_template);

  const fallback = assertRecord(document.fallback, "Promoted manifest fallback");
  parseNullableString(fallback.previousIncumbentId);
  parseNullableString(fallback.previous_incumbent_id);
  parseStringArray(fallback.disableConditions, "fallback.disableConditions");
  parseStringArray(fallback.disable_conditions, "fallback.disable_conditions");

  const executionBoundary = parseExecutionBoundary(document.executionBoundary);
  const routeValidation = parseRouteValidation(document.route_validation);
  const runtimeRouteValidation = parseRuntimeRouteValidation(document.routeValidation);
  const explanationBundle =
    document.mode === "basket"
      ? parseBasketExplanationBundle(document.explanationBundle, "explanationBundle")
      : null;
  const tuningSummary =
    document.mode === "basket"
      ? parseBasketTuningSummary(document.tuningSummary, "tuningSummary")
      : null;
  const replay =
    document.mode === "basket" ? parseReplaySurface(document.replay, "replay") : null;
  const marketIntelligence =
    document.mode === "basket"
      ? parseMarketIntelligenceSurface(
          document.marketIntelligence ?? document.market_intelligence,
          document.marketIntelligence ? "marketIntelligence" : "market_intelligence",
        )
      : null;
  parseActivationManifest(document);
  promotedActivationManifestSchema.parse(projectSharedPromotedManifest(document));
  activationManifestFrontendSchema.parse(document.frontend);
  activationManifestValidationSchema.parse(document.validation);

  assertAliasEqual(document.manifestId, document.manifest_id, "manifestId");
  assertAliasEqual(document.slotId, document.slot_id, "slotId");
  assertAliasEqual(document.strategyVersion, document.strategy_version, "strategyVersion");
  assertAliasEqual(document.frontend.riskLabel, document.frontend.risk_label, "frontend risk label");
  assertAliasEqual(
    document.validation.datasetVersion,
    document.validation.dataset_version,
    "validation dataset version",
  );
  assertAliasEqual(
    document.validation.evaluatorVersion,
    document.validation.evaluator_version,
    "validation evaluator version",
  );
  assertAliasEqual(
    document.validation.objectiveId,
    document.validation.objective_id,
    "validation objective id",
  );
  assertAliasEqual(
    document.validation.deltaVsIncumbent,
    document.validation.delta_vs_incumbent,
    "validation delta vs incumbent",
  );
  assertAliasEqual(
    document.validation.promotedAt,
    document.validation.promoted_at,
    "validation promoted at",
  );
  assertAliasEqual(
    document.fallback.previousIncumbentId,
    document.fallback.previous_incumbent_id,
    "fallback previous incumbent id",
  );
  assertAliasEqual(
    stableJson(document.fallback.disableConditions),
    stableJson(document.fallback.disable_conditions),
    "fallback disable conditions",
  );
  assertAliasEqual(
    stableJson(document.target_allocations),
    stableJson(document.activation_template.target_allocations),
    "target allocations",
  );
  assertAliasEqual(
    stableJson(document.target_directional_expressions),
    stableJson(document.activation_template.target_directional_expressions),
    "target directional expressions",
  );
  assertAliasEqual(
    stableJson(document.required_routes),
    stableJson(document.activation_template.required_routes),
    "required routes",
  );
  assertAliasEqual(
    stableJson(document.wallet_requirements),
    stableJson(document.activation_template.wallet_requirements),
    "wallet requirements",
  );
  assertAliasEqual(
    stableJson(requiredAssets),
    stableJson(document.activation_template.required_assets),
    "required assets",
  );
  assertAliasEqual(
    stableJson(requiredAssets),
    stableJson(executionBoundary.requiredAssets),
    "requiredAssets",
  );
  assertAliasEqual(
    stableJson(requiredRoutes),
    stableJson(executionBoundary.requiredRoutes),
    "requiredRoutes",
  );
  assertAliasEqual(
    stableJson(requiredRoutes.map(projectComparableSharedRouteRequirement)),
    stableJson(document.required_routes),
    "required routes runtime projection",
  );
  assertAliasEqual(
    stableJson({
      requires_wallet: walletRequirements.requiresWallet,
      requires_smart_account: walletRequirements.requiresSmartAccount,
      min_funding_usd: walletRequirements.minFundingUsd,
      preferred_funding_provider: walletRequirements.preferredFundingProvider,
      preferred_bridge_provider: walletRequirements.preferredBridgeProvider,
      top_up_asset: walletRequirements.topUpAsset,
    }),
    stableJson(document.wallet_requirements),
    "walletRequirements runtime projection",
  );
  assertAliasEqual(
    stableJson(walletRequirements),
    stableJson(executionBoundary.walletRequirements),
    "walletRequirements",
  );

  const boundarySignalIds = executionBoundary.signalRefs.map((signalRef) => signalRef.signalId);
  if (stableJson(boundarySignalIds) !== stableJson(document.signal_refs)) {
    throw new Error("signal_refs must stay aligned with executionBoundary.signalRefs.");
  }
  assertAliasEqual(stableJson(signalRefs), stableJson(executionBoundary.signalRefs), "signalRefs");
  if (stableJson(signalRefs.map((signalRef) => signalRef.signalId)) !== stableJson(document.signal_refs)) {
    throw new Error("signalRefs must stay aligned with signal_refs.");
  }
  assertAliasEqual(
    stableJson(projectSharedRouteValidationAlias(runtimeRouteValidation)),
    stableJson(routeValidation),
    "routeValidation",
  );
  assertAliasEqual(
    stableJson(runtimeRouteValidation.validationBadges),
    stableJson(document.frontend.badges),
    "routeValidation validation badges",
  );

  if (document.mode === "basket") {
    if (!replay) {
      throw new Error("Basket promoted manifests must include replay.");
    }
    if (!marketIntelligence || !document.market_intelligence) {
      throw new Error("Basket promoted manifests must include marketIntelligence and market_intelligence.");
    }
    assertAliasEqual(
      stableJson(toSnakeKeys(marketIntelligence)),
      stableJson(document.market_intelligence),
      "marketIntelligence",
    );
    assertAliasEqual(
      stableJson(toSnakeKeys(explanationBundle)),
      stableJson(document.explanation_bundle),
      "explanationBundle",
    );
    assertAliasEqual(
      stableJson(toSnakeKeys(tuningSummary)),
      stableJson(document.tuning_summary),
      "tuningSummary",
    );
  }

  const requiredRouteIds = requiredRoutes.map((route) => route.routeId);
  const routeValidationRouteIds = runtimeRouteValidation.routeTruthLabels.map(
    (routeTruthLabel) => routeTruthLabel.routeId,
  );
  if (stableJson(requiredRouteIds) !== stableJson(routeValidationRouteIds)) {
    throw new Error("routeValidation.routeTruthLabels must cover every required route.");
  }

  return document;
}

export function projectSharedSlotRegistry(value) {
  return normalizePromotedSlotRegistryArtifact(value);
}

export function assertPromotedSlotRegistry(value) {
  return parsePromotedSlotRegistryArtifact(value);
}

export function assertPromotedIncumbent(value) {
  return parsePromotedIncumbentArtifact(value);
}
