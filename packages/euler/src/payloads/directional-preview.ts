import { canActivateRouteTruth, ROUTE_TRUTH } from "../truth.js";
import type {
  DirectionalPreviewInput,
  DirectionalPreviewPayload,
  DirectionalSide,
  HealthFactorInput,
  HealthFactorSummary,
  LiquidationDistanceInput,
  LiquidationDistanceSummary
} from "../types.js";

function safeDivide(left: number, right: number): number | null {
  if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) {
    return null;
  }

  return left / right;
}

function estimateLiquidationPrice(input: LiquidationDistanceInput): number | null {
  if (input.liquidationPriceUsd !== undefined && input.liquidationPriceUsd !== null) {
    return input.liquidationPriceUsd;
  }

  const positionSizeUnits = input.positionSizeUnits ?? null;
  const liquidationThresholdBps = input.liquidationThresholdBps ?? null;

  if (!positionSizeUnits || !liquidationThresholdBps || positionSizeUnits <= 0 || liquidationThresholdBps <= 0) {
    return null;
  }

  const thresholdFraction = liquidationThresholdBps / 10_000;

  if (input.side === "long" && input.debtUsd !== undefined && input.debtUsd > 0) {
    return input.debtUsd / (positionSizeUnits * thresholdFraction);
  }

  if (input.side === "short" && input.collateralUsd !== undefined && input.collateralUsd > 0) {
    return (input.collateralUsd * thresholdFraction) / positionSizeUnits;
  }

  return null;
}

export function summarizeHealthFactor(input: HealthFactorInput): HealthFactorSummary {
  const target = input.targetHealthFactor ?? 1.35;
  const truth = input.truth ?? ROUTE_TRUTH.PREVIEW;

  if (input.debtUsd <= 0) {
    return {
      value: null,
      target,
      deltaToTarget: null,
      liquidationMargin: null,
      status: "no_debt",
      truth,
      canActivate: canActivateRouteTruth(truth)
    };
  }

  const thresholdFraction = input.liquidationThresholdBps / 10_000;
  const value = safeDivide(input.collateralUsd * thresholdFraction, input.debtUsd);
  const liquidationMargin = value === null ? null : value - 1;
  const deltaToTarget = value === null ? null : value - target;

  let status: HealthFactorSummary["status"] = "healthy";

  if (value === null) {
    status = "critical";
  } else if (value < 1) {
    status = "below_liquidation";
  } else if (value < 1.05) {
    status = "critical";
  } else if (value < 1.2) {
    status = "tight";
  } else if (value < target) {
    status = "buffered";
  }

  return {
    value,
    target,
    deltaToTarget,
    liquidationMargin,
    status,
    truth,
    canActivate: canActivateRouteTruth(truth) && (value === null || value > 1)
  };
}

export function summarizeLiquidationDistance(input: LiquidationDistanceInput): LiquidationDistanceSummary {
  const liquidationPriceUsd = estimateLiquidationPrice(input);

  if (!liquidationPriceUsd || input.currentPriceUsd <= 0) {
    return {
      side: input.side,
      currentPriceUsd: input.currentPriceUsd,
      liquidationPriceUsd: null,
      distanceUsd: null,
      distancePct: null,
      moveToLiquidation: "unknown",
      status: "unavailable"
    };
  }

  const distanceUsd =
    input.side === "long"
      ? input.currentPriceUsd - liquidationPriceUsd
      : liquidationPriceUsd - input.currentPriceUsd;
  const distancePct = safeDivide(distanceUsd, input.currentPriceUsd);

  let status: LiquidationDistanceSummary["status"] = "safe";

  if (distanceUsd <= 0) {
    status = "breached";
  } else if ((distancePct ?? 0) < 0.05) {
    status = "danger";
  } else if ((distancePct ?? 0) < 0.15) {
    status = "watch";
  }

  return {
    side: input.side,
    currentPriceUsd: input.currentPriceUsd,
    liquidationPriceUsd,
    distanceUsd,
    distancePct,
    moveToLiquidation: input.side === "long" ? "down" : "up",
    status
  };
}

function resolveGrossExposureUsd(input: DirectionalPreviewInput): number {
  if (input.grossExposureUsd !== undefined && input.grossExposureUsd !== null) {
    return input.grossExposureUsd;
  }

  return input.collateralUsd + input.debtUsd;
}

function resolveLeverageMultiple(input: DirectionalPreviewInput, grossExposureUsd: number): number | null {
  if (input.leverageMultiple !== undefined && input.leverageMultiple !== null) {
    return input.leverageMultiple;
  }

  return safeDivide(grossExposureUsd, input.collateralUsd);
}

export function buildDirectionalPreviewPayload(input: DirectionalPreviewInput): DirectionalPreviewPayload {
  const grossExposureUsd = resolveGrossExposureUsd(input);
  const leverageMultiple = resolveLeverageMultiple(input, grossExposureUsd);
  const healthFactorInput: HealthFactorInput = {
    collateralUsd: input.collateralUsd,
    debtUsd: input.debtUsd,
    liquidationThresholdBps: input.liquidationThresholdBps,
    ...(input.targetHealthFactor === undefined ? {} : { targetHealthFactor: input.targetHealthFactor }),
    truth: input.routeContext.truth
  };

  const healthFactor = summarizeHealthFactor(healthFactorInput);
  const liquidationDistanceInput: LiquidationDistanceInput = {
    side: input.side,
    currentPriceUsd: input.currentPriceUsd,
    ...(input.liquidationPriceUsd === undefined ? {} : { liquidationPriceUsd: input.liquidationPriceUsd }),
    ...(input.positionSizeUnits === undefined ? {} : { positionSizeUnits: input.positionSizeUnits }),
    collateralUsd: input.collateralUsd,
    debtUsd: input.debtUsd,
    liquidationThresholdBps: input.liquidationThresholdBps
  };

  const liquidationDistance = summarizeLiquidationDistance(liquidationDistanceInput);

  return {
    symbol: input.symbol,
    side: input.side,
    truth: input.routeContext.truth,
    activationAllowed: canActivateRouteTruth(input.routeContext.truth) && healthFactor.canActivate,
    currentPriceUsd: input.currentPriceUsd,
    collateralUsd: input.collateralUsd,
    debtUsd: input.debtUsd,
    grossExposureUsd,
    leverageMultiple,
    healthFactor,
    liquidationDistance,
    routeContext: input.routeContext,
    vaultContext: input.vaultContext ?? null,
    liveProofOverlay: input.liveProofOverlay ?? null,
    notes: input.notes ?? []
  };
}
