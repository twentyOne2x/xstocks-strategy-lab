import { createHash } from "node:crypto";

import {
  EXECUTION_ELIGIBILITY,
  EXECUTION_STATE,
  FUNDING_READINESS,
  ROUTE_TRUTH_LABEL,
  SMART_ACCOUNT_READINESS,
  VERIFICATION_TIER,
  normalizeUsd,
  normalizeWalletState,
} from "./contracts.js";
import {
  assertPromotedActivationManifest,
  createActivationManifestRef,
} from "./manifest.js";
import { deriveReadinessWalletRequirements } from "./readiness-policy.js";
import { createSmartAccountProviderScaffold } from "./smart-account.js";

function createIndex(items, key) {
  return new Map((items ?? []).map((item) => [item[key], item]));
}

const ROUTE_TRUTH_CONSERVATISM = Object.freeze({
  [ROUTE_TRUTH_LABEL.LIVE]: 1,
  [ROUTE_TRUTH_LABEL.PREVIEW]: 2,
  [ROUTE_TRUTH_LABEL.MENTOR_CONFIRMED]: 3,
  [ROUTE_TRUTH_LABEL.UNVERIFIED]: 4,
  [ROUTE_TRUTH_LABEL.BLOCKED]: 5,
});

function pickMoreConservativeTruth(leftTruth, rightTruth) {
  const leftScore = ROUTE_TRUTH_CONSERVATISM[leftTruth] ?? 0;
  const rightScore = ROUTE_TRUTH_CONSERVATISM[rightTruth] ?? 0;

  return leftScore >= rightScore ? leftTruth : rightTruth;
}

function applyRouteValidationConstraint(routeTruthLabel, manifestRouteTruthLabel) {
  if (!manifestRouteTruthLabel) {
    return routeTruthLabel;
  }

  const constrainedTruth = pickMoreConservativeTruth(
    routeTruthLabel.truthState,
    manifestRouteTruthLabel.truthState,
  );
  const constrained = constrainedTruth !== routeTruthLabel.truthState;

  return {
    ...routeTruthLabel,
    label: constrained ? manifestRouteTruthLabel.label : routeTruthLabel.label,
    routeKind: constrained
      ? manifestRouteTruthLabel.routeKind
      : routeTruthLabel.routeKind,
    verificationTier: constrained
      ? manifestRouteTruthLabel.verificationTier
      : routeTruthLabel.verificationTier,
    availability: constrained
      ? manifestRouteTruthLabel.availability
      : routeTruthLabel.availability,
    requiredFor: manifestRouteTruthLabel.requiredFor ?? routeTruthLabel.requiredFor,
    reason: constrained ? manifestRouteTruthLabel.reason : routeTruthLabel.reason,
    truthState: constrainedTruth,
  };
}

function deriveAssetChecks(manifest, liveXStocksState) {
  const assetIndex = createIndex(liveXStocksState?.assets ?? [], "assetSymbol");

  return manifest.requiredAssets.map((assetSymbol) => {
    const liveAsset = assetIndex.get(assetSymbol);

    if (!liveAsset) {
      return {
        assetSymbol,
        truthState: ROUTE_TRUTH_LABEL.BLOCKED,
        status: "missing",
        reason: "Asset is not present in live xStocks state.",
      };
    }

    if (liveAsset.status !== "active") {
      return {
        assetSymbol,
        truthState: ROUTE_TRUTH_LABEL.BLOCKED,
        status: liveAsset.status,
        reason: "Asset is not currently active for execution.",
      };
    }

    return {
      assetSymbol,
      truthState: ROUTE_TRUTH_LABEL.LIVE,
      status: liveAsset.status,
      reason: "Asset is active in live xStocks state.",
      chain: liveAsset.chain,
      priceUsd: liveAsset.priceUsd,
    };
  });
}

function deriveRouteTruthLabels(manifest, liveRouteState) {
  const routeIndex = createIndex(liveRouteState?.routes ?? [], "routeId");
  const manifestRouteTruthIndex = createIndex(
    manifest.routeValidation?.routeTruthLabels ?? [],
    "routeId",
  );

  return manifest.requiredRoutes.map((requiredRoute) => {
    const liveRoute = routeIndex.get(requiredRoute.routeId);

    if (!liveRoute) {
      return applyRouteValidationConstraint(
        {
          routeId: requiredRoute.routeId,
          label: requiredRoute.label ?? requiredRoute.routeId,
          routeKind: requiredRoute.routeKind ?? "unknown",
          verificationTier: VERIFICATION_TIER.UNVERIFIED,
          truthState: ROUTE_TRUTH_LABEL.BLOCKED,
          availability: "missing",
          requiredFor: requiredRoute.requiredFor ?? "activation",
          reason: "Route is not present in live route state.",
        },
        manifestRouteTruthIndex.get(requiredRoute.routeId),
      );
    }

    let truthLabel = ROUTE_TRUTH_LABEL.BLOCKED;
    let reason = liveRoute.notes ?? "Route is not available for activation.";

    if (
      liveRoute.availability !== "available" &&
      liveRoute.availability !== "preview_only"
    ) {
      return applyRouteValidationConstraint(
        {
          routeId: liveRoute.routeId,
          label: liveRoute.label,
          routeKind: liveRoute.routeKind,
          chain: liveRoute.chain,
          verificationTier: liveRoute.verificationTier,
          truthState: ROUTE_TRUTH_LABEL.BLOCKED,
          availability: liveRoute.availability,
          requiredFor: requiredRoute.requiredFor ?? "activation",
          reason,
        },
        manifestRouteTruthIndex.get(requiredRoute.routeId),
      );
    }

    if (liveRoute.verificationTier === VERIFICATION_TIER.PUBLIC_VERIFIED) {
      if (liveRoute.availability === "available") {
        truthLabel = ROUTE_TRUTH_LABEL.LIVE;
        reason = "Publicly verified rail is available.";
      } else if (liveRoute.availability === "preview_only") {
        truthLabel = ROUTE_TRUTH_LABEL.PREVIEW;
        reason = "Publicly verified rail is wired for preview only.";
      } else {
        truthLabel = ROUTE_TRUTH_LABEL.BLOCKED;
        reason = "Publicly verified rail is not currently available.";
      }
    } else if (liveRoute.verificationTier === VERIFICATION_TIER.MENTOR_REPORTED) {
      truthLabel =
        liveRoute.availability === "available"
          ? ROUTE_TRUTH_LABEL.MENTOR_CONFIRMED
          : ROUTE_TRUTH_LABEL.BLOCKED;
      reason =
        liveRoute.availability === "available"
          ? "Mentor-confirmed rails fail closed until directly verified."
          : "Mentor-confirmed rail is not currently available.";
    } else {
      truthLabel = ROUTE_TRUTH_LABEL.UNVERIFIED;
      reason = "Unverified rails fail closed.";
    }

    return applyRouteValidationConstraint(
      {
        routeId: liveRoute.routeId,
        label: liveRoute.label,
        routeKind: liveRoute.routeKind,
        chain: liveRoute.chain,
        verificationTier: liveRoute.verificationTier,
        truthState: truthLabel,
        availability: liveRoute.availability,
        requiredFor: requiredRoute.requiredFor ?? "activation",
        reason,
      },
      manifestRouteTruthIndex.get(requiredRoute.routeId),
    );
  });
}

function createFundingSurface({
  methodId,
  kind,
  status,
  destinationAddress,
  assetSymbol,
  notes,
}) {
  return {
    methodId,
    providerId: "privy",
    kind,
    status,
    destinationAddress,
    assetSymbol,
    notes,
  };
}

function deriveFundingPath(
  manifest,
  normalizedWalletState,
  requestedNotionalUsd,
  smartAccountInspection,
) {
  const walletRequirements = deriveReadinessWalletRequirements(manifest);
  const requiredNotionalUsd = Math.max(
    requestedNotionalUsd,
    normalizeUsd(walletRequirements.minFundingUsd, 0),
  );
  const fundingGapUsd = Math.max(
    0,
    Number(
      (requiredNotionalUsd - normalizedWalletState.fundedNotionalUsd).toFixed(2),
    ),
  );
  const destinationAddress =
    smartAccountInspection.bootstrap?.destinationAddress ?? null;
  const destinationKind =
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.READY
      ? "smart_account"
      : "embedded_wallet";
  const readiness =
    destinationAddress === null
      ? FUNDING_READINESS.DESTINATION_REQUIRED
      : fundingGapUsd > 0
        ? FUNDING_READINESS.FUNDING_REQUIRED
        : FUNDING_READINESS.FUNDED;
  const fundingMethodStatus =
    destinationAddress === null
      ? "blocked"
      : fundingGapUsd > 0
        ? "available"
        : "available";
  const recommendedMethodId =
    fundingGapUsd > 0 && destinationAddress ? "privy_card" : null;

  return {
    provider: walletRequirements.preferredFundingProvider ?? "privy",
    minRequiredUsd: requiredNotionalUsd,
    fundedNotionalUsd: normalizedWalletState.fundedNotionalUsd,
    fundingGapUsd,
    topUpAsset: walletRequirements.topUpAsset ?? "USDC",
    destinationAddress,
    destinationKind,
    readiness,
    status: readiness,
    recommendedMethodId,
    surfaces: [
      createFundingSurface({
        methodId: "privy_card",
        kind: "card",
        status:
          readiness === FUNDING_READINESS.FUNDING_REQUIRED
            ? "recommended"
            : fundingMethodStatus,
        destinationAddress,
        assetSymbol: walletRequirements.topUpAsset ?? "USDC",
        notes: [
          "Privy card funding is a mainnet-only funding surface.",
        ],
      }),
      createFundingSurface({
        methodId: "privy_wallet",
        kind: "wallet",
        status: fundingMethodStatus,
        destinationAddress,
        assetSymbol: walletRequirements.topUpAsset ?? "USDC",
        notes: [
          "Use this when the user wants to transfer from an external wallet.",
        ],
      }),
      createFundingSurface({
        methodId: "privy_exchange",
        kind: "exchange",
        status: fundingMethodStatus,
        destinationAddress,
        assetSymbol: walletRequirements.topUpAsset ?? "USDC",
        notes: [
          "Privy exchange funding is expected to land on the current destination address on mainnet.",
        ],
      }),
      {
        methodId: "manual_transfer",
        providerId: "manual",
        kind: "manual_transfer",
        status: destinationAddress === null ? "blocked" : "available",
        destinationAddress,
        assetSymbol: walletRequirements.topUpAsset ?? "USDC",
        notes: [
          "Manual same-chain transfer remains the fail-closed fallback when hosted funding is unavailable.",
        ],
      },
    ],
  };
}

function hashExecutionPlanInput({
  manifest,
  requestedNotionalUsd,
  normalizedWalletState,
}) {
  const hash = createHash("sha1");
  hash.update(
    JSON.stringify({
      manifestId: manifest.manifestId,
      requestedNotionalUsd,
      walletConnected: normalizedWalletState.walletConnected,
      fundedNotionalUsd: normalizedWalletState.fundedNotionalUsd,
      smartAccountStatus: normalizedWalletState.smartAccount.status,
    }),
  );

  return hash.digest("hex").slice(0, 12);
}

function deriveEligibility({
  manifest,
  assetChecks,
  routeTruthLabels,
  fundingPath,
  smartAccountInspection,
  normalizedWalletState,
}) {
  const blockingAssetChecks = assetChecks.filter(
    (assetCheck) => assetCheck.truthState === ROUTE_TRUTH_LABEL.BLOCKED,
  );
  const blockedRoutes = routeTruthLabels.filter(
    (route) => route.truthState === ROUTE_TRUTH_LABEL.BLOCKED,
  );
  const previewOnlyRoutes = routeTruthLabels.filter((route) =>
    [
      ROUTE_TRUTH_LABEL.PREVIEW,
      ROUTE_TRUTH_LABEL.MENTOR_CONFIRMED,
      ROUTE_TRUTH_LABEL.UNVERIFIED,
    ].includes(
      route.truthState,
    ),
  );

  if (blockingAssetChecks.length > 0 || blockedRoutes.length > 0) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.BLOCKED,
      execution_state: EXECUTION_STATE.BLOCKED,
      execution_eligibility: EXECUTION_ELIGIBILITY.BLOCKED,
    };
  }

  if (
    manifest.routeValidation?.executionEligibility === EXECUTION_ELIGIBILITY.BLOCKED
  ) {
    return {
      surface_truth: manifest.routeValidation.surfaceTruth,
      execution_state: EXECUTION_STATE.BLOCKED,
      execution_eligibility: EXECUTION_ELIGIBILITY.BLOCKED,
    };
  }

  if (
    manifest.routeValidation?.executionEligibility ===
    EXECUTION_ELIGIBILITY.PREVIEW_ONLY
  ) {
    return {
      surface_truth: manifest.routeValidation.surfaceTruth,
      execution_state: EXECUTION_STATE.BLOCKED,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  if (previewOnlyRoutes.length > 0) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.PREVIEW,
      execution_state: EXECUTION_STATE.BLOCKED,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  if (!normalizedWalletState.walletConnected) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.PREVIEW,
      execution_state: EXECUTION_STATE.WALLET_REQUIRED,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  if (fundingPath.readiness === FUNDING_READINESS.FUNDING_REQUIRED) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.PREVIEW,
      execution_state: EXECUTION_STATE.FUNDING_REQUIRED,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  if (
    smartAccountInspection.readiness ===
    SMART_ACCOUNT_READINESS.SMART_ACCOUNT_REQUIRED
  ) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.PREVIEW,
      execution_state: EXECUTION_STATE.SMART_ACCOUNT_REQUIRED,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  if (
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING
  ) {
    return {
      surface_truth: ROUTE_TRUTH_LABEL.PREVIEW,
      execution_state: EXECUTION_STATE.SMART_ACCOUNT_PENDING,
      execution_eligibility: EXECUTION_ELIGIBILITY.PREVIEW_ONLY,
    };
  }

  return {
    surface_truth: ROUTE_TRUTH_LABEL.LIVE,
    execution_state: EXECUTION_STATE.READY,
    execution_eligibility: EXECUTION_ELIGIBILITY.EXECUTABLE,
  };
}

function buildSteps({
  manifest,
  execution_state,
  fundingPath,
  normalizedWalletState,
  smartAccountInspection,
}) {
  const smartAccountStepComplete =
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.READY ||
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.NOT_REQUIRED;
  const steps = [
    {
      stepId: "review_promoted_manifest",
      title: "Review promoted manifest",
      status: "complete",
      detail: `Execution stays bound to promoted manifest ${manifest.manifestId}.`,
    },
    {
      stepId: "connect_wallet",
      title: "Connect wallet late in flow",
      status: normalizedWalletState.walletConnected ? "complete" : "pending",
      detail: "Wallet connection is only required at activation time.",
    },
    {
      stepId: "fund_wallet",
      title: "Fund wallet",
      status:
        fundingPath.readiness === FUNDING_READINESS.FUNDING_REQUIRED
          ? normalizedWalletState.walletConnected
            ? "pending"
            : "blocked"
          : "complete",
      detail:
        fundingPath.readiness === FUNDING_READINESS.FUNDING_REQUIRED
          ? `Fund ${fundingPath.topUpAsset} into ${fundingPath.destinationKind} ${fundingPath.destinationAddress ?? "destination"} using one of the Privy-compatible funding surfaces.`
          : "Wallet funding meets the current notional requirement.",
    },
    {
      stepId: "prepare_smart_account",
      title: "Bootstrap smart account",
      status:
        smartAccountStepComplete
          ? "complete"
          : normalizedWalletState.walletConnected
            ? "pending"
            : "blocked",
      detail:
        smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.NOT_REQUIRED
          ? "Privy smart wallet remains optional for the current user-approved CoW execution lane."
          : smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.READY
          ? "Privy smart wallet destination is ready for user-approved execution."
          : "Create the embedded wallet first, then bootstrap the Privy smart wallet on Ethereum.",
    },
    {
      stepId: "request_cow_quote",
      title: "Request CoW quote",
      status: execution_state === EXECUTION_STATE.READY ? "pending" : "blocked",
      detail:
        execution_state === EXECUTION_STATE.READY
          ? "All required rails, funding, and smart-account checks are satisfied for CoW quote preparation."
          : "CoW quoting remains preview-only until every required rail and wallet check passes.",
    },
    {
      stepId: "approve_cow_order",
      title: "Approve CoW order",
      status: execution_state === EXECUTION_STATE.READY ? "pending" : "blocked",
      detail:
        execution_state === EXECUTION_STATE.READY
          ? "The user must sign and approve the CoW order before submission."
          : "Order approval remains blocked until the quote and readiness checks are satisfied.",
    },
  ];

  return steps;
}

function buildAllowedActions({ execution_state, surface_truth, permissions }) {
  const actions = ["review_manifest", "read_route_truth"];

  if (surface_truth !== ROUTE_TRUTH_LABEL.LIVE) {
    actions.push("review_preview");
  }

  if (execution_state === EXECUTION_STATE.WALLET_REQUIRED) {
    actions.push("connect_wallet");
  }

  if (execution_state === EXECUTION_STATE.FUNDING_REQUIRED) {
    actions.push("prompt_funding");
  }

  if (
    execution_state === EXECUTION_STATE.SMART_ACCOUNT_REQUIRED ||
    execution_state === EXECUTION_STATE.SMART_ACCOUNT_PENDING
  ) {
    actions.push("bootstrap_smart_account");
  }

  if (execution_state === EXECUTION_STATE.READY) {
    actions.push("request_cow_quote");
    actions.push("approve_cow_order");

    if (permissions?.allowPause) {
      actions.push("pause_after_activation");
    }

    if (permissions?.allowTurnOff) {
      actions.push("turn_off_strategy");
    }
  }

  return actions;
}

function collectMessages(
  assetChecks,
  routeTruthLabels,
  fundingPath,
  smartAccountInspection,
) {
  const blockers = [];
  const warnings = [];

  for (const assetCheck of assetChecks) {
    if (assetCheck.truthState === ROUTE_TRUTH_LABEL.BLOCKED) {
      blockers.push(`${assetCheck.assetSymbol}: ${assetCheck.reason}`);
    }
  }

  for (const routeTruth of routeTruthLabels) {
    if (routeTruth.truthState === ROUTE_TRUTH_LABEL.BLOCKED) {
      blockers.push(`${routeTruth.label}: ${routeTruth.reason}`);
      continue;
    }

    if (
      routeTruth.truthState === ROUTE_TRUTH_LABEL.PREVIEW ||
      routeTruth.truthState === ROUTE_TRUTH_LABEL.MENTOR_CONFIRMED ||
      routeTruth.truthState === ROUTE_TRUTH_LABEL.UNVERIFIED
    ) {
      warnings.push(`${routeTruth.label}: ${routeTruth.reason}`);
    }
  }

  if (fundingPath.readiness === FUNDING_READINESS.DESTINATION_REQUIRED) {
    blockers.push("Funding destination is not ready yet.");
  } else if (fundingPath.readiness === FUNDING_READINESS.FUNDING_REQUIRED) {
    blockers.push(
      `Fund ${fundingPath.topUpAsset} with at least ${fundingPath.fundingGapUsd} additional USD-equivalent before execution can become live.`,
    );
  }

  if (
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.SMART_ACCOUNT_REQUIRED
  ) {
    blockers.push("Privy smart wallet bootstrap is still required.");
  } else if (
    smartAccountInspection.readiness === SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING
  ) {
    warnings.push("Privy smart wallet bootstrap is still pending.");
  }

  return { blockers, warnings };
}

export function deriveExecutionPlan({
  activation_manifest,
  live_xstocks_state,
  live_route_state,
  user_notional_usd,
  wallet_state,
  smartAccountProvider = createSmartAccountProviderScaffold(),
}) {
  const manifest = assertPromotedActivationManifest(activation_manifest);
  const normalizedWalletState = normalizeWalletState(wallet_state);
  const requestedNotionalUsd = normalizeUsd(user_notional_usd, 0);
  const assetChecks = deriveAssetChecks(manifest, live_xstocks_state);
  const routeTruthLabels = deriveRouteTruthLabels(manifest, live_route_state);
  const smartAccountInspection = smartAccountProvider.inspectWalletState({
    activationManifest: manifest,
    walletState: normalizedWalletState,
  });
  const fundingPath = deriveFundingPath(
    manifest,
    normalizedWalletState,
    requestedNotionalUsd,
    smartAccountInspection,
  );
  const eligibility = deriveEligibility({
    manifest,
    assetChecks,
    routeTruthLabels,
    fundingPath,
    smartAccountInspection,
    normalizedWalletState,
  });
  const { blockers, warnings } = collectMessages(
    assetChecks,
    routeTruthLabels,
    fundingPath,
    smartAccountInspection,
  );
  const executionPlanId = `exec_${hashExecutionPlanInput({
    manifest,
    requestedNotionalUsd,
    normalizedWalletState,
  })}`;

  return {
    executionPlanId,
    generatedAt: new Date().toISOString(),
    activationManifestRef: createActivationManifestRef(manifest),
    surfaceTruth: eligibility.surface_truth,
    executionState: eligibility.execution_state,
    executionEligibility: eligibility.execution_eligibility,
    requestedNotionalUsd,
    walletConnectionLate: true,
    routeTruthLabels,
    assetChecks,
    fundingPath,
    smartAccount: {
      ...smartAccountInspection,
      reviewArtifact: smartAccountProvider.buildReviewArtifact(manifest),
    },
    steps: buildSteps({
      manifest,
      execution_state: eligibility.execution_state,
      fundingPath,
      normalizedWalletState,
      smartAccountInspection,
    }),
    allowedActions: buildAllowedActions({
      ...eligibility,
      permissions: manifest.permissions,
    }),
    blockers,
    warnings,
    liveStateSummary: {
      xstocksStateVersion: live_xstocks_state?.stateVersion ?? null,
      routeStateVersion: live_route_state?.stateVersion ?? null,
    },
  };
}
