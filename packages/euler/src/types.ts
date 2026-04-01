import type { AdapterImplementationState, RailProofSource, RouteTruth } from "./truth.js";

export const DIRECTIONAL_SIDE = {
  LONG: "long",
  SHORT: "short"
} as const;

export type DirectionalSide = (typeof DIRECTIONAL_SIDE)[keyof typeof DIRECTIONAL_SIDE];

export const DIRECTIONAL_CHAIN = {
  ETHEREUM: "Ethereum",
  INK: "Ink"
} as const;

export type DirectionalChain = (typeof DIRECTIONAL_CHAIN)[keyof typeof DIRECTIONAL_CHAIN];

export interface DirectionalRouteContext {
  readonly adapterId: string;
  readonly label: string;
  readonly venue: "euler" | "morpho";
  readonly platform: "Euler" | "Morpho";
  readonly chain: DirectionalChain;
  readonly kind: "directional_market" | "lending_market";
  readonly truth: RouteTruth;
  readonly proofSource: RailProofSource;
  readonly implementationState: AdapterImplementationState;
  readonly marketKey: string | null;
  readonly marketAddress: string | null;
  readonly collateralSymbol: string | null;
  readonly debtSymbol: string | null;
  readonly notes: readonly string[];
}

export interface DirectionalVaultContext {
  readonly adapterId: string;
  readonly label: string;
  readonly venue: "flowdesk";
  readonly platform: "Morpho";
  readonly chain: DirectionalChain;
  readonly kind: "yield_vault";
  readonly truth: RouteTruth;
  readonly proofSource: RailProofSource;
  readonly implementationState: AdapterImplementationState;
  readonly vaultKey: string;
  readonly vaultAddress: string | null;
  readonly depositSymbol: string;
  readonly rewardSymbol: string | null;
  readonly notes: readonly string[];
}

export interface MorphoSpyxAusdMarketSnapshot {
  readonly adapterId: "morpho_spyx_ausd";
  readonly label: "Morpho SPYx/AUSD";
  readonly venue: "morpho";
  readonly platform: "Morpho";
  readonly chain: "Ethereum";
  readonly truth: RouteTruth;
  readonly proofSource: RailProofSource;
  readonly implementationState: AdapterImplementationState;
  readonly marketKey: "spyx-ausd";
  readonly marketAddress: string | null;
  readonly collateralSymbol: "SPYx";
  readonly debtSymbol: "AUSD";
  readonly maxLtvBps: number | null;
  readonly liquidationThresholdBps: number | null;
  readonly supplyApyBps: number | null;
  readonly borrowApyBps: number | null;
  readonly utilizationBps: number | null;
  readonly liquidityUsd: number | null;
  readonly notes: readonly string[];
}

export interface FlowdeskAusdVaultSnapshot {
  readonly adapterId: "flowdesk_ausd_rwa_strategy";
  readonly label: "Flowdesk AUSD RWA Strategy";
  readonly venue: "flowdesk";
  readonly platform: "Morpho";
  readonly chain: "Ethereum";
  readonly truth: RouteTruth;
  readonly proofSource: RailProofSource;
  readonly implementationState: AdapterImplementationState;
  readonly vaultKey: "ausd-rwa-strategy";
  readonly vaultAddress: string | null;
  readonly depositSymbol: "AUSD";
  readonly rewardSymbol: "AUSD";
  readonly apyBps: number | null;
  readonly tvlUsd: number | null;
  readonly notes: readonly string[];
}

export interface EulerDirectionalRouteSnapshot {
  readonly adapterId: "euler_directional";
  readonly label: "Euler Directional";
  readonly venue: "euler";
  readonly platform: "Euler";
  readonly chain: "Ethereum";
  readonly truth: RouteTruth;
  readonly proofSource: RailProofSource;
  readonly implementationState: AdapterImplementationState;
  readonly marketKey: string | null;
  readonly marketAddress: string | null;
  readonly collateralSymbol: string | null;
  readonly debtSymbol: string | null;
  readonly notes: readonly string[];
}

export interface HealthFactorInput {
  readonly collateralUsd: number;
  readonly debtUsd: number;
  readonly liquidationThresholdBps: number;
  readonly targetHealthFactor?: number;
  readonly truth?: RouteTruth;
}

export interface HealthFactorSummary {
  readonly value: number | null;
  readonly target: number;
  readonly deltaToTarget: number | null;
  readonly liquidationMargin: number | null;
  readonly status: "no_debt" | "below_liquidation" | "critical" | "tight" | "buffered" | "healthy";
  readonly truth: RouteTruth;
  readonly canActivate: boolean;
}

export interface LiquidationDistanceInput {
  readonly side: DirectionalSide;
  readonly currentPriceUsd: number;
  readonly liquidationPriceUsd?: number | null;
  readonly positionSizeUnits?: number | null;
  readonly collateralUsd?: number;
  readonly debtUsd?: number;
  readonly liquidationThresholdBps?: number;
}

export interface LiquidationDistanceSummary {
  readonly side: DirectionalSide;
  readonly currentPriceUsd: number;
  readonly liquidationPriceUsd: number | null;
  readonly distanceUsd: number | null;
  readonly distancePct: number | null;
  readonly moveToLiquidation: "down" | "up" | "unknown";
  readonly status: "unavailable" | "breached" | "danger" | "watch" | "safe";
}

export interface DirectionalLiveProofOverlay {
  readonly truth: RouteTruth;
  readonly routeContext: DirectionalRouteContext | null;
  readonly vaultContext: DirectionalVaultContext | null;
  readonly note: string;
}

export interface DirectionalPreviewInput {
  readonly symbol: string;
  readonly side: DirectionalSide;
  readonly currentPriceUsd: number;
  readonly collateralUsd: number;
  readonly debtUsd: number;
  readonly liquidationThresholdBps: number;
  readonly liquidationPriceUsd?: number | null;
  readonly positionSizeUnits?: number | null;
  readonly targetHealthFactor?: number;
  readonly grossExposureUsd?: number | null;
  readonly leverageMultiple?: number | null;
  readonly routeContext: DirectionalRouteContext;
  readonly vaultContext?: DirectionalVaultContext | null;
  readonly liveProofOverlay?: DirectionalLiveProofOverlay | null;
  readonly notes?: readonly string[];
}

export interface DirectionalPreviewPayload {
  readonly symbol: string;
  readonly side: DirectionalSide;
  readonly truth: RouteTruth;
  readonly activationAllowed: boolean;
  readonly currentPriceUsd: number;
  readonly collateralUsd: number;
  readonly debtUsd: number;
  readonly grossExposureUsd: number;
  readonly leverageMultiple: number | null;
  readonly healthFactor: HealthFactorSummary;
  readonly liquidationDistance: LiquidationDistanceSummary;
  readonly routeContext: DirectionalRouteContext;
  readonly vaultContext: DirectionalVaultContext | null;
  readonly liveProofOverlay: DirectionalLiveProofOverlay | null;
  readonly notes: readonly string[];
}
