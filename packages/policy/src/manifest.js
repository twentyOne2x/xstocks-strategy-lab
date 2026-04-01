import {
  activationManifestRefSchema,
  activationManifestSchema,
  CONTRACT_VERSION,
  directionalExpressionSchema,
  executionEligibilitySchema,
  promotedBasketExplanationBundleSchema,
  promotedBasketTuningSummarySchema,
  routeRequirementSchema,
  routeTruthLabelRowSchema,
  routeTruthLabelSchema,
  signalRefSchema,
  portfolioExplanationBundleSchema,
  targetAllocationSchema,
  targetDirectionalExpressionSchema,
} from "./shared-contracts.js";
import { deriveCowExecutionSurfaceForManifest } from "../../research/src/cow-execution-truth.js";
import { deriveCanonicalWalletRequirements } from "./wallet-requirements.js";

const DEFAULT_TOP_UP_ASSET = "USDC";
const DEFAULT_FUNDING_PROVIDER = "privy";
const DEFAULT_BRIDGE_PROVIDER = "lifi";
const DEFAULT_YIELD_BUFFER_ASSET = "AUSD";
const FLOWDESK_VAULT_VENUE_ID = "flowdesk_ausd_rwa_strategy";

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function roundPct(value) {
  return Number((Number(value) * 100).toFixed(4));
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeBadgeLabels(badges = []) {
  return badges
    .map((badge) => {
      if (typeof badge === "string") {
        return badge;
      }

      if (badge && typeof badge === "object" && typeof badge.label === "string") {
        return badge.label;
      }

      return null;
    })
    .filter((badge) => typeof badge === "string" && badge.length > 0);
}

function normalizeStringArray(values, label, { required = false } = {}) {
  invariant(Array.isArray(values), `${label} must be an array.`);
  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim() : null))
    .filter(Boolean);
  if (required) {
    invariant(normalized.length > 0, `${label} must be a non-empty array.`);
  }
  return normalized;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLegacyResearchManifest(rawManifest) {
  invariant(rawManifest && typeof rawManifest === "object", "raw_manifest is required.");
  invariant(
    typeof rawManifest.manifest_id === "string" && rawManifest.manifest_id.length > 0,
    "raw_manifest.manifest_id is required.",
  );
  invariant(
    typeof rawManifest.slot_id === "string" && rawManifest.slot_id.length > 0,
    "raw_manifest.slot_id is required.",
  );
  invariant(
    rawManifest.mode === "basket",
    "Legacy research manifest fallback only supports promoted basket manifests.",
  );
  invariant(
    rawManifest.activation_template &&
      typeof rawManifest.activation_template === "object",
    "raw_manifest.activation_template is required.",
  );
  invariant(
    Array.isArray(rawManifest.activation_template.target_weights),
    "Legacy research manifest fallback requires activation_template.target_weights.",
  );

  return rawManifest;
}

function buildFallbackSignalRefs(manifest, signalIds = []) {
  const normalizedSignalIds = uniqueStrings(signalIds);
  const scopeType = manifest.mode === "directional" ? "asset" : "basket";
  const scopeKey =
    manifest.mode === "directional"
      ? manifest.activationTemplate.assetSymbol
      : manifest.activationTemplate.starterBasketId ?? manifest.slotId;

  const candidateSignalIds =
    normalizedSignalIds.length > 0
      ? normalizedSignalIds
      : [`manifest:${manifest.manifestId}`];

  return candidateSignalIds.map((signalId) =>
    signalRefSchema.parse({
      signalId,
      scopeType,
      scopeKey,
    }),
  );
}

function buildLegacyBasketTargetAllocations(rawManifest) {
  const targetAllocations = rawManifest.activation_template.target_weights.map(
    (entry) => ({
      sleeve: "core_xstocks",
      assetSymbol: entry.symbol,
      targetWeightPct: roundPct(entry.weight),
    }),
  );
  const cashWeightPct = roundPct(rawManifest.activation_template.cash_weight ?? 0);

  if (cashWeightPct > 0) {
    targetAllocations.push({
      sleeve: "yield_buffer",
      assetSymbol: DEFAULT_YIELD_BUFFER_ASSET,
      venueId: FLOWDESK_VAULT_VENUE_ID,
      targetWeightPct: cashWeightPct,
    });
  }

  return targetAllocations;
}

function buildLegacyExecutionBoundary(manifest) {
  const requiredRoutes =
    manifest.mode === "directional"
      ? [
          {
            routeId: "euler.ethereum.directional",
            label: "Euler Directional",
            routeKind: "directional_market",
            requiredFor: "directional",
          },
        ]
      : [
          {
            routeId: "cow_swap.ethereum",
            label: "Cow Swap on Ethereum",
            routeKind: "execution",
            requiredFor: "core_xstocks",
          },
          ...((manifest.activationTemplate.targetAllocations ?? []).some(
            (allocation) => allocation.sleeve === "yield_buffer",
          )
            ? [
                {
                  routeId: "flowdesk.ausd-rwa-strategy",
                  label: "Flowdesk AUSD RWA Strategy",
                  routeKind: "yield_vault",
                  requiredFor: "yield_buffer",
                },
              ]
            : []),
        ];
  const requiredAssets =
    manifest.mode === "directional"
      ? uniqueStrings([manifest.activationTemplate.assetSymbol, DEFAULT_YIELD_BUFFER_ASSET])
      : uniqueStrings(
          (manifest.activationTemplate.targetAllocations ?? []).map(
            (allocation) => allocation.assetSymbol,
          ),
        );

  return {
    promoted: true,
    source: {
      type: "legacy_research_manifest",
      manifestId: manifest.manifestId,
      slotId: manifest.slotId,
    },
    requiredAssets,
    requiredRoutes,
    walletRequirements: deriveCanonicalWalletRequirements(
      {
        ...manifest,
        requiredRoutes,
      },
      {
        requiresWallet: true,
        requiresSmartAccount: true,
        minFundingUsd: manifest.mode === "directional" ? 1500 : 1000,
        preferredFundingProvider: DEFAULT_FUNDING_PROVIDER,
        preferredBridgeProvider: DEFAULT_BRIDGE_PROVIDER,
        topUpAsset: DEFAULT_TOP_UP_ASSET,
      },
    ),
    signalRefs: buildFallbackSignalRefs(manifest),
  };
}

function normalizeBoundaryRoute(route) {
  invariant(route && typeof route === "object", "required route entries must be objects.");
  const routeId = firstDefined(route.routeId, route.route_id);
  const routeKind = firstDefined(route.routeKind, route.route_kind);
  const requiredFor = firstDefined(route.requiredFor, route.required_for);

  invariant(typeof routeId === "string" && routeId.length > 0, "requiredRoute.routeId is required.");
  invariant(
    typeof routeKind === "string" && routeKind.length > 0,
    "requiredRoute.routeKind is required.",
  );

  return {
    routeId,
    label: route.label ?? routeId,
    routeKind,
    requiredFor: requiredFor ?? "activation",
  };
}

function normalizeCanonicalRouteRequirement(route) {
  const parsedRoute = routeRequirementSchema.parse({
    route_id: firstDefined(route?.route_id, route?.routeId),
    route_kind: firstDefined(route?.route_kind, route?.routeKind),
    required_for: firstDefined(route?.required_for, route?.requiredFor),
    label: route?.label,
  });

  return {
    routeId: parsedRoute.route_id,
    label: parsedRoute.label ?? parsedRoute.route_id,
    routeKind: parsedRoute.route_kind,
    requiredFor: parsedRoute.required_for ?? "activation",
  };
}

function normalizeBoundaryWalletRequirements(walletRequirements, { required = true } = {}) {
  if (!walletRequirements || typeof walletRequirements !== "object") {
    invariant(!required, "activationManifest.walletRequirements is required.");
    return {
      requiresWallet: true,
      requiresSmartAccount: true,
      minFundingUsd: 0,
      preferredFundingProvider: DEFAULT_FUNDING_PROVIDER,
      preferredBridgeProvider: DEFAULT_BRIDGE_PROVIDER,
      topUpAsset: DEFAULT_TOP_UP_ASSET,
    };
  }

  return {
    requiresWallet: normalizeBoolean(
      firstDefined(
        walletRequirements.requiresWallet,
        walletRequirements.requires_wallet,
      ),
      true,
    ),
    requiresSmartAccount: normalizeBoolean(
      firstDefined(
        walletRequirements.requiresSmartAccount,
        walletRequirements.requires_smart_account,
      ),
      true,
    ),
    minFundingUsd: normalizeNumber(
      firstDefined(
        walletRequirements.minFundingUsd,
        walletRequirements.min_funding_usd,
      ),
      0,
    ),
    preferredFundingProvider:
      firstDefined(
        walletRequirements.preferredFundingProvider,
        walletRequirements.preferred_funding_provider,
      ) ?? DEFAULT_FUNDING_PROVIDER,
    preferredBridgeProvider:
      firstDefined(
        walletRequirements.preferredBridgeProvider,
        walletRequirements.preferred_bridge_provider,
      ) ?? DEFAULT_BRIDGE_PROVIDER,
    topUpAsset:
      firstDefined(walletRequirements.topUpAsset, walletRequirements.top_up_asset) ??
      DEFAULT_TOP_UP_ASSET,
  };
}

function normalizeCanonicalTargetAllocation(targetAllocation) {
  const parsed = targetAllocationSchema.parse({
    sleeve: targetAllocation?.sleeve,
    asset_symbol: firstDefined(targetAllocation?.asset_symbol, targetAllocation?.assetSymbol),
    basket_id: firstDefined(targetAllocation?.basket_id, targetAllocation?.basketId),
    venue_id: firstDefined(targetAllocation?.venue_id, targetAllocation?.venueId),
    weight_bps: firstDefined(
      targetAllocation?.weight_bps,
      targetAllocation?.weightBps,
      targetAllocation?.targetWeightPct === undefined
        ? undefined
        : Math.round(Number(targetAllocation.targetWeightPct) * 100),
    ),
  });

  return {
    sleeve: parsed.sleeve,
    assetSymbol: parsed.asset_symbol,
    basketId: parsed.basket_id,
    venueId: parsed.venue_id,
    targetWeightPct: Number((parsed.weight_bps / 100).toFixed(4)),
  };
}

function normalizeTargetAllocations(manifest, rawManifest) {
  if (Array.isArray(rawManifest?.targetAllocations)) {
    return rawManifest.targetAllocations.map(normalizeCanonicalTargetAllocation);
  }

  const canonicalTargetAllocations = firstDefined(
    rawManifest?.target_allocations,
    rawManifest?.activation_template?.target_allocations,
  );

  if (Array.isArray(canonicalTargetAllocations)) {
    return canonicalTargetAllocations.map(normalizeCanonicalTargetAllocation);
  }

  return manifest.mode === "basket"
    ? (manifest.activationTemplate.targetAllocations ?? [])
    : [];
}

function normalizeCanonicalTargetDirectionalExpression(targetDirectionalExpression) {
  return targetDirectionalExpressionSchema.parse({
    asset_symbol: firstDefined(
      targetDirectionalExpression?.asset_symbol,
      targetDirectionalExpression?.assetSymbol,
    ),
    stance: firstDefined(
      targetDirectionalExpression?.stance,
      targetDirectionalExpression?.view,
    ),
    notional_share_bps: firstDefined(
      targetDirectionalExpression?.notional_share_bps,
      targetDirectionalExpression?.notionalShareBps,
      targetDirectionalExpression?.grossExposurePct === undefined
        ? undefined
        : Math.round(Number(targetDirectionalExpression.grossExposurePct) * 100),
    ),
  });
}

function normalizeTargetDirectionalExpressions(manifest, rawManifest) {
  if (Array.isArray(rawManifest?.targetDirectionalExpressions)) {
    return rawManifest.targetDirectionalExpressions.map(
      normalizeCanonicalTargetDirectionalExpression,
    );
  }

  const canonicalTargetDirectionalExpressions = firstDefined(
    rawManifest?.target_directional_expressions,
    rawManifest?.activation_template?.target_directional_expressions,
  );

  if (Array.isArray(canonicalTargetDirectionalExpressions)) {
    return canonicalTargetDirectionalExpressions.map(
      normalizeCanonicalTargetDirectionalExpression,
    );
  }

  if (manifest.mode !== "directional") {
    return [];
  }

  return [
    normalizeCanonicalTargetDirectionalExpression({
      asset_symbol: manifest.activationTemplate.targetDirectionalExpression.assetSymbol,
      stance: manifest.activationTemplate.targetDirectionalExpression.view,
      notional_share_bps: Math.round(
        Number(manifest.activationTemplate.targetDirectionalExpression.grossExposurePct) *
          100,
      ),
    }),
  ];
}

function buildDirectionalExpressionFromCanonical(targetDirectionalExpressions) {
  const primaryExpression = targetDirectionalExpressions[0];

  if (!primaryExpression) {
    return null;
  }

  const grossExposurePct = Number((primaryExpression.notional_share_bps / 100).toFixed(4));
  let netExposurePct = grossExposurePct;

  if (primaryExpression.stance === "conviction_short") {
    netExposurePct = Number((-grossExposurePct).toFixed(4));
  } else if (primaryExpression.stance === "hedged_view") {
    netExposurePct = 0;
  }

  return directionalExpressionSchema.parse({
    view: primaryExpression.stance,
    assetSymbol: primaryExpression.asset_symbol,
    grossExposurePct,
    netExposurePct,
    targetLtvPct: null,
  });
}

function normalizePermissions(manifest, rawManifest) {
  const permissions = firstDefined(
    rawManifest?.permissions,
    rawManifest?.activation_template?.permissions,
  );

  if (!permissions || typeof permissions !== "object") {
    return manifest.mode === "directional"
      ? {
          allowPause: false,
          allowTurnOff: false,
        }
      : {
          allowPause: true,
          allowTurnOff: true,
        };
  }

  return {
    allowPause: normalizeBoolean(
      firstDefined(permissions.allowPause, permissions.allow_pause),
      manifest.mode !== "directional",
    ),
    allowTurnOff: normalizeBoolean(
      firstDefined(permissions.allowTurnOff, permissions.allow_turn_off),
      manifest.mode !== "directional",
    ),
  };
}

function normalizeRouteValidation(rawManifest) {
  const routeValidation = firstDefined(
    rawManifest?.routeValidation,
    rawManifest?.route_validation,
  );

  if (!routeValidation) {
    return null;
  }

  const rawRouteTruthLabels = firstDefined(
    routeValidation.routeTruthLabels,
    routeValidation.route_truth_labels,
    [],
  );
  invariant(
    Array.isArray(rawRouteTruthLabels),
    "routeValidation.routeTruthLabels must be an array.",
  );

  const normalizedRouteTruthLabels = rawRouteTruthLabels.map((routeTruthLabel) => {
    const parsed = routeTruthLabelRowSchema.parse({
      route_id: firstDefined(routeTruthLabel?.route_id, routeTruthLabel?.routeId),
      label: routeTruthLabel?.label,
      route_kind: firstDefined(routeTruthLabel?.route_kind, routeTruthLabel?.routeKind),
      chain: routeTruthLabel?.chain,
      verification_tier: firstDefined(
        routeTruthLabel?.verification_tier,
        routeTruthLabel?.verificationTier,
      ),
      truth_label: firstDefined(
        routeTruthLabel?.truth_label,
        routeTruthLabel?.truthState,
        routeTruthLabel?.truthLabel,
      ),
      availability: routeTruthLabel?.availability,
      required_for: firstDefined(
        routeTruthLabel?.required_for,
        routeTruthLabel?.requiredFor,
      ),
      reason: routeTruthLabel?.reason,
    });

    return {
      routeId: parsed.route_id,
      label: parsed.label,
      routeKind: parsed.route_kind,
      chain: parsed.chain,
      verificationTier: parsed.verification_tier,
      truthState: parsed.truth_label,
      availability: parsed.availability,
      requiredFor: parsed.required_for,
      reason: parsed.reason,
    };
  });

  return {
    executionEligibility: executionEligibilitySchema.parse(
      firstDefined(
        routeValidation.executionEligibility,
        routeValidation.execution_eligibility,
      ),
    ),
    surfaceTruth: routeTruthLabelSchema.parse(
      firstDefined(routeValidation.surfaceTruth, routeValidation.surface_truth),
    ),
    routeTruthLabels: normalizedRouteTruthLabels,
    proofNotes: normalizeStringArray(
      firstDefined(routeValidation.proofNotes, routeValidation.proof_notes, []),
      "routeValidation.proofNotes",
    ),
    validationBadges: normalizeBadgeLabels(
      firstDefined(
        routeValidation.validationBadges,
        routeValidation.validation_badges,
        [],
      ),
    ),
  };
}

function normalizeExecutionBoundaryFromSource(manifest, rawManifest) {
  const providedBoundary = firstDefined(
    rawManifest?.executionBoundary,
    rawManifest?.execution_boundary,
  );

  if (providedBoundary && typeof providedBoundary === "object") {
    const requiredAssets = uniqueStrings(
      firstDefined(providedBoundary.requiredAssets, providedBoundary.required_assets, []),
    );
    const requiredRoutes = (
      firstDefined(providedBoundary.requiredRoutes, providedBoundary.required_routes, []) ??
      []
    ).map(normalizeBoundaryRoute);
    const signalRefs = (
      firstDefined(providedBoundary.signalRefs, providedBoundary.signal_refs, []) ?? []
    ).map((signalRef) => signalRefSchema.parse(signalRef));

    invariant(
      requiredRoutes.length > 0,
      "activationManifest.executionBoundary.requiredRoutes must be a non-empty array.",
    );
    invariant(
      signalRefs.length > 0,
      "activationManifest.executionBoundary.signalRefs must be a non-empty array.",
    );
    invariant(
      requiredAssets.length > 0,
      "activationManifest.executionBoundary.requiredAssets must be a non-empty array.",
    );

    return {
      promoted: true,
      source:
        providedBoundary.source ?? {
          type: "research_promoted_manifest",
          manifestId: manifest.manifestId,
          slotId: manifest.slotId,
        },
      requiredAssets,
      requiredRoutes,
      walletRequirements: deriveCanonicalWalletRequirements(
        {
          ...manifest,
          requiredRoutes,
        },
        normalizeBoundaryWalletRequirements(
          firstDefined(
            providedBoundary.walletRequirements,
            providedBoundary.wallet_requirements,
          ),
        ),
      ),
      signalRefs,
    };
  }

  const canonicalRequiredRoutes = firstDefined(
    rawManifest?.required_routes,
    rawManifest?.activation_template?.required_routes,
  );
  const canonicalWalletRequirements = firstDefined(
    rawManifest?.wallet_requirements,
    rawManifest?.activation_template?.wallet_requirements,
  );
  const canonicalRequiredAssets = firstDefined(
    rawManifest?.required_assets,
    rawManifest?.activation_template?.required_assets,
  );

  if (
    Array.isArray(canonicalRequiredRoutes) ||
    canonicalWalletRequirements ||
    Array.isArray(canonicalRequiredAssets)
  ) {
    const requiredAssets = uniqueStrings(
      Array.isArray(canonicalRequiredAssets)
        ? canonicalRequiredAssets
        : manifest.mode === "directional"
          ? [manifest.activationTemplate.assetSymbol]
          : (manifest.activationTemplate.targetAllocations ?? []).map(
              (allocation) => allocation.assetSymbol,
            ),
    );
    const requiredRoutes = (canonicalRequiredRoutes ?? []).map(
      normalizeCanonicalRouteRequirement,
    );
    invariant(
      requiredRoutes.length > 0,
      "Canonical research manifests without executionBoundary must still expose required_routes.",
    );
    invariant(
      requiredAssets.length > 0,
      "Canonical research manifests without executionBoundary must still expose required_assets.",
    );

    return {
      promoted: true,
      source: {
        type: "research_promoted_manifest",
        manifestId: manifest.manifestId,
        slotId: manifest.slotId,
      },
      requiredAssets,
      requiredRoutes,
      walletRequirements: deriveCanonicalWalletRequirements(
        {
          ...manifest,
          requiredRoutes,
        },
        normalizeBoundaryWalletRequirements(canonicalWalletRequirements),
      ),
      signalRefs: buildFallbackSignalRefs(
        manifest,
        firstDefined(rawManifest?.signal_refs, []),
      ),
    };
  }

  throw new Error(
    "Canonical promoted manifests must provide executionBoundary or the upstream activation_template boundary fields.",
  );
}

function normalizeExplanationBundle(manifest, rawManifest) {
  const explicitBundle =
    manifest?.explanationBundle ??
    rawManifest?.explanationBundle ??
    rawManifest?.explanation_bundle;

  if (
    !explicitBundle ||
    typeof explicitBundle !== "object" ||
    typeof explicitBundle.whatThisPortfolioDoes !== "string"
  ) {
    return null;
  }

  try {
    return portfolioExplanationBundleSchema.parse(explicitBundle);
  } catch {
    return null;
  }
}

function normalizeRawExplanationBundle(rawManifest) {
  return (
    rawManifest?.rawExplanationBundle ??
    rawManifest?.explanationBundle ??
    rawManifest?.explanation_bundle ??
    null
  );
}

function normalizeResearchExplanationBundleValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (
    typeof value.truthMode === "string" &&
    Array.isArray(value.reasonCodes) &&
    Array.isArray(value.targetWeights)
  ) {
    return promotedBasketExplanationBundleSchema.parse(value);
  }

  if (
    typeof value.truth_mode !== "string" ||
    !Array.isArray(value.reason_codes) ||
    !Array.isArray(value.target_weights)
  ) {
    return null;
  }

  return promotedBasketExplanationBundleSchema.parse({
    truthMode: value.truth_mode,
    incumbentState: value.incumbent_state,
    reasonCodes: value.reason_codes.map((reasonCode) => ({
      code: reasonCode.code,
      kind: reasonCode.kind,
      value: reasonCode.value ?? null,
      label: reasonCode.label,
    })),
    targetWeights: value.target_weights.map((targetWeight) => ({
      rank: targetWeight.rank,
      symbol: targetWeight.symbol,
      assetName: targetWeight.asset_name,
      targetWeightPct: targetWeight.target_weight_pct,
    })),
    cashWeightPct: value.cash_weight_pct,
    rebalanceThresholdBps: value.rebalance_threshold_bps,
    rebalanceThresholdPct: value.rebalance_threshold_pct,
    benchmarkDelta: {
      benchmarkId: value.benchmark_delta?.benchmark_id ?? null,
      returnAnnPct: value.benchmark_delta?.return_ann_pct,
      benchmarkReturnAnnPct: value.benchmark_delta?.benchmark_return_ann_pct,
      afterCostReturnAnnPct: value.benchmark_delta?.after_cost_return_ann_pct,
      benchmarkAfterCostReturnAnnPct:
        value.benchmark_delta?.benchmark_after_cost_return_ann_pct,
      excessReturnAfterCostPct:
        value.benchmark_delta?.excess_return_after_cost_pct,
      score: value.benchmark_delta?.score,
      deltaVsIncumbent: value.benchmark_delta?.delta_vs_incumbent ?? null,
    },
    portfolioMetrics: {
      constituentCount: value.portfolio_metrics?.constituent_count,
      concentrationPct: value.portfolio_metrics?.concentration_pct ?? null,
      concentrationCapPct: value.portfolio_metrics?.concentration_cap_pct ?? null,
      turnoverAnnPct: value.portfolio_metrics?.turnover_ann_pct ?? null,
      costsTotalBps: value.portfolio_metrics?.costs_total_bps ?? null,
    },
    summaries: {
      construction: value.summaries?.construction,
      benchmark: value.summaries?.benchmark,
      rebalance: value.summaries?.rebalance,
    },
  });
}

function normalizeResearchExplanationBundle(manifest, rawManifest) {
  if (manifest?.researchExplanationBundle) {
    return promotedBasketExplanationBundleSchema.parse(
      manifest.researchExplanationBundle,
    );
  }

  if (rawManifest?.researchExplanationBundle) {
    return promotedBasketExplanationBundleSchema.parse(
      rawManifest.researchExplanationBundle,
    );
  }

  return normalizeResearchExplanationBundleValue(
    rawManifest?.explanationBundle ?? rawManifest?.explanation_bundle ?? null,
  );
}

function normalizeResearchTuningSummaryValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (typeof value.headline === "string" && Array.isArray(value.currentKnobs)) {
    return promotedBasketTuningSummarySchema.parse(value);
  }

  if (typeof value.headline !== "string" || !Array.isArray(value.current_knobs)) {
    return null;
  }

  return promotedBasketTuningSummarySchema.parse({
    headline: value.headline,
    currentKnobs: value.current_knobs.map((knob) => ({
      knobId: knob.knob_id,
      label: knob.label,
      currentValue: knob.current_value ?? null,
      tuningImpact: knob.tuning_impact,
    })),
    watchpoints: value.watchpoints,
  });
}

function normalizeResearchTuningSummary(manifest, rawManifest) {
  if (manifest?.researchTuningSummary) {
    return promotedBasketTuningSummarySchema.parse(manifest.researchTuningSummary);
  }

  if (rawManifest?.researchTuningSummary) {
    return promotedBasketTuningSummarySchema.parse(
      rawManifest.researchTuningSummary,
    );
  }

  return normalizeResearchTuningSummaryValue(
    rawManifest?.tuningSummary ?? rawManifest?.tuning_summary ?? null,
  );
}

function stripNonCanonicalExplanationBundle(rawManifest) {
  if (!rawManifest || typeof rawManifest !== "object") {
    return rawManifest;
  }

  const explicitBundle =
    rawManifest.explanationBundle ?? rawManifest.explanation_bundle;

  if (!explicitBundle) {
    return rawManifest;
  }

  try {
    portfolioExplanationBundleSchema.parse(explicitBundle);
    return rawManifest;
  } catch {
    return {
      ...rawManifest,
      explanationBundle: undefined,
      explanation_bundle: undefined,
    };
  }
}

function buildNormalizedPromotedManifest(
  manifest,
  rawManifest,
  {
    executionBoundary,
    legacyFallback = false,
  },
) {
  const targetAllocations = normalizeTargetAllocations(manifest, rawManifest);
  const targetDirectionalExpressions = normalizeTargetDirectionalExpressions(
    manifest,
    rawManifest,
  );
  const explanationBundle = normalizeExplanationBundle(manifest, rawManifest);
  const rawExplanationBundle = normalizeRawExplanationBundle(rawManifest);
  const researchExplanationBundle = normalizeResearchExplanationBundle(
    manifest,
    rawManifest,
  );
  const researchTuningSummary = normalizeResearchTuningSummary(
    manifest,
    rawManifest,
  );
  const routeValidation = normalizeRouteValidation(rawManifest);
  const permissions = normalizePermissions(manifest, rawManifest);
  const targetDirectionalExpression =
    manifest.mode === "directional"
      ? manifest.activationTemplate.targetDirectionalExpression ??
        buildDirectionalExpressionFromCanonical(targetDirectionalExpressions)
      : null;
  const {
    explanationBundle: _manifestExplanationBundle,
    rawExplanationBundle: _manifestRawExplanationBundle,
    tuningSummary: _manifestTuningSummary,
    researchExplanationBundle: _manifestResearchExplanationBundle,
    researchTuningSummary: _manifestResearchTuningSummary,
    ...normalizedManifest
  } = manifest;
  const cowExecutionSurface = deriveCowExecutionSurfaceForManifest(
    {
      ...normalizedManifest,
      targetAllocations,
    },
    normalizedManifest.frontend?.badges ?? [],
  );
  const constrainedRouteValidation =
    manifest.mode === "basket" && routeValidation
      ? {
          ...routeValidation,
          executionEligibility: cowExecutionSurface.executionEligibility,
          surfaceTruth: cowExecutionSurface.surfaceTruth,
          routeTruthLabels: routeValidation.routeTruthLabels.map((routeTruthLabel) =>
            routeTruthLabel.routeId === "cow_swap.ethereum"
              ? {
                  ...routeTruthLabel,
                  truthState: cowExecutionSurface.cowRouteTruthState,
                  availability: cowExecutionSurface.cowRouteAvailability,
                  reason: cowExecutionSurface.cowRouteReason,
                }
              : routeTruthLabel,
          ),
          proofNotes: cowExecutionSurface.proofNotes,
          validationBadges: cowExecutionSurface.frontendBadges,
        }
      : routeValidation;

  return {
    ...normalizedManifest,
    promoted: true,
    frontend: {
      ...normalizedManifest.frontend,
      badges: cowExecutionSurface.frontendBadges,
    },
    executionBoundary,
    requiredAssets: executionBoundary.requiredAssets,
    requiredRoutes: executionBoundary.requiredRoutes,
    walletRequirements: executionBoundary.walletRequirements,
    signalRefs: executionBoundary.signalRefs,
    targetAllocations,
    targetDirectionalExpressions,
    targetDirectionalExpression,
    routeValidation: constrainedRouteValidation,
    permissions,
    ...(explanationBundle ? { explanationBundle } : {}),
    ...(rawExplanationBundle ? { rawExplanationBundle } : {}),
    ...(researchExplanationBundle ? { researchExplanationBundle } : {}),
    ...(researchTuningSummary ? { researchTuningSummary } : {}),
    legacyFallback,
  };
}

export function adaptResearchPromotedManifest(rawManifest) {
  if (rawManifest?.manifestId) {
    const activationManifest = activationManifestSchema.parse(
      stripNonCanonicalExplanationBundle(rawManifest),
    );
    const executionBoundary = normalizeExecutionBoundaryFromSource(
      activationManifest,
      rawManifest,
    );

    return buildNormalizedPromotedManifest(activationManifest, rawManifest, {
      executionBoundary,
      legacyFallback: false,
    });
  }

  const normalizedRawManifest = normalizeLegacyResearchManifest(rawManifest);
  const targetAllocations = buildLegacyBasketTargetAllocations(normalizedRawManifest);
  const frontendBadges = normalizeBadgeLabels(normalizedRawManifest.frontend?.badges);
  const activationManifest = activationManifestSchema.parse({
    version: CONTRACT_VERSION,
    manifestId: normalizedRawManifest.manifest_id,
    slotId: normalizedRawManifest.slot_id,
    mode: normalizedRawManifest.mode,
    chain: normalizedRawManifest.chain,
    strategyVersion: normalizedRawManifest.strategy_version,
    frontend: {
      title: normalizedRawManifest.frontend.title,
      subtitle: normalizedRawManifest.frontend.subtitle,
      riskLabel: normalizedRawManifest.frontend.risk_label,
      summary: normalizedRawManifest.frontend.summary,
      badges: frontendBadges,
    },
    validation: {
      datasetVersion: normalizedRawManifest.validation.dataset_version,
      evaluatorVersion: normalizedRawManifest.validation.evaluator_version,
      objectiveId: normalizedRawManifest.validation.objective_id,
      score: normalizedRawManifest.validation.score,
      deltaVsIncumbent: normalizedRawManifest.validation.delta_vs_incumbent,
      promotedAt: normalizedRawManifest.validation.promoted_at,
    },
    activationTemplate: {
      mode: "basket",
      templateId: normalizedRawManifest.activation_template.template_id,
      fundingAssetSymbol: DEFAULT_TOP_UP_ASSET,
      starterBasketId:
        normalizedRawManifest.activation_template.basket_id ??
        normalizedRawManifest.slot_id,
      targetAllocations,
    },
    fallback: {
      previousIncumbentId: normalizedRawManifest.fallback.previous_incumbent_id,
      disableConditions: normalizedRawManifest.fallback.disable_conditions,
    },
  });

  return buildNormalizedPromotedManifest(activationManifest, activationManifest, {
    executionBoundary: buildLegacyExecutionBoundary(activationManifest),
    legacyFallback: true,
  });
}

export function createDirectionalPreviewManifest(overrides = {}) {
  const baseManifest = {
    version: CONTRACT_VERSION,
    manifestId: "advanced.default_directional:euler-preview-v1:promoted",
    slotId: "advanced.default_directional",
    mode: "directional",
    chain: "ethereum",
    strategyVersion: "euler-preview-v1",
    frontend: {
      title: "Directional preview",
      subtitle: "Preview-only directional rail",
      riskLabel: "high",
      summary:
        "Directional activation stays preview-only until exact live Euler xStocks proof exists.",
      badges: ["preview_only", "directional"],
    },
    validation: {
      datasetVersion: "research-bundle-v1",
      evaluatorVersion: "strategy_lab_evaluator_v1",
      objectiveId: "directional_calmar_after_cost_v1",
      score: 1,
      deltaVsIncumbent: 0,
      promotedAt: "2026-03-31T12:51:52.958Z",
    },
    activationTemplate: {
      mode: "directional",
      templateId: "euler_directional_preview_v1",
      fundingAssetSymbol: DEFAULT_TOP_UP_ASSET,
      assetSymbol: "MSTRx",
      targetDirectionalExpression: directionalExpressionSchema.parse({
        view: "conviction_long",
        assetSymbol: "MSTRx",
        grossExposurePct: 80,
        netExposurePct: 80,
        targetLtvPct: 50,
      }),
    },
    fallback: {
      previousIncumbentId: null,
      disableConditions: ["directional_route_unverified"],
    },
    promoted: true,
    executionBoundary: {
      promoted: true,
      source: {
        type: "policy_test_fixture",
        manifestId: "advanced.default_directional:euler-preview-v1:promoted",
        slotId: "advanced.default_directional",
      },
      requiredAssets: ["MSTRx", "AUSD"],
      requiredRoutes: [
        {
          routeId: "euler.ethereum.directional",
          label: "Euler Directional",
          routeKind: "directional_market",
          requiredFor: "directional",
        },
      ],
      walletRequirements: {
        requiresWallet: true,
        requiresSmartAccount: true,
        minFundingUsd: 1500,
        preferredFundingProvider: DEFAULT_FUNDING_PROVIDER,
        preferredBridgeProvider: DEFAULT_BRIDGE_PROVIDER,
        topUpAsset: DEFAULT_TOP_UP_ASSET,
      },
      signalRefs: [
        signalRefSchema.parse({
          signalId: "manifest:advanced.default_directional:euler-preview-v1:promoted",
          scopeType: "asset",
          scopeKey: "MSTRx",
        }),
      ],
    },
    routeValidation: {
      executionEligibility: "preview_only",
      surfaceTruth: "preview",
      routeTruthLabels: [
        {
          routeId: "euler.ethereum.directional",
          label: "Euler Directional",
          routeKind: "execution",
          chain: "ethereum",
          verificationTier: "unverified",
          truthState: "preview",
          availability: "preview_only",
          requiredFor: "directional",
          reason: "Directional lane remains preview-only until exact live proof exists.",
        },
      ],
      proofNotes: [
        "Preview only: exact live xStocks-on-Euler route proof remains unverified.",
      ],
      validationBadges: ["preview_only", "directional"],
    },
    permissions: {
      allowPause: false,
      allowTurnOff: false,
    },
  };

  return assertPromotedActivationManifest({
    ...baseManifest,
    ...overrides,
  });
}

export function assertPromotedActivationManifest(manifest) {
  invariant(
    manifest && typeof manifest === "object",
    "activationManifest is required.",
  );
  invariant(
    manifest.promoted === true,
    "Execution starts only from promoted activation manifests.",
  );
  const parsedManifest = activationManifestSchema.parse(manifest);
  const executionBoundary = normalizeExecutionBoundaryFromSource(parsedManifest, manifest);

  return buildNormalizedPromotedManifest(parsedManifest, manifest, {
    executionBoundary,
    legacyFallback: manifest.legacyFallback === true,
  });
}

export function createActivationManifestRef(manifest) {
  const parsedManifest = assertPromotedActivationManifest(manifest);

  return activationManifestRefSchema.parse({
    manifestId: parsedManifest.manifestId,
    slotId: parsedManifest.slotId,
    mode: parsedManifest.mode,
    strategyVersion: parsedManifest.strategyVersion,
  });
}
