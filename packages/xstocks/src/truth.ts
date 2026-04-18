import type { RailTruthState } from "@xstocks-strategy-lab/shared/contracts/common";

import type {
  XStocksAsset,
  XStocksDeployment,
  XStocksExecutionRoute,
  XStocksNetwork,
  XStocksSystemStatus
} from "./types.js";

export const ROUTE_TRUTH = {
  LIVE: "live",
  PREVIEW: "preview",
  BLOCKED: "blocked",
  MENTOR_CONFIRMED: "mentor_confirmed",
  UNVERIFIED: "unverified"
} as const;

export type RouteTruth = RailTruthState;

export const XSTOCKS_RAIL_PROOF_SOURCE = {
  VERIFIED_PUBLIC: "verified_public",
  MENTOR_REPORTED: "mentor_reported",
  UNVERIFIED: "unverified"
} as const;

export type XStocksRailProofSource =
  (typeof XSTOCKS_RAIL_PROOF_SOURCE)[keyof typeof XSTOCKS_RAIL_PROOF_SOURCE];

export const XSTOCKS_EXECUTION_RAIL = {
  COW_SWAP: "cow_swap",
  ONEINCH: "oneinch",
  SPREAD_FINANCE: "spread_finance"
} as const;

export type XStocksExecutionRailId =
  (typeof XSTOCKS_EXECUTION_RAIL)[keyof typeof XSTOCKS_EXECUTION_RAIL];

export const ROUTE_TRUTH_READINESS: Record<RouteTruth, number> = {
  live: 5,
  mentor_confirmed: 4,
  preview: 3,
  unverified: 2,
  blocked: 1
};

export const ROUTE_TRUTH_CONSERVATISM: Record<RouteTruth, number> = {
  live: 1,
  preview: 2,
  mentor_confirmed: 3,
  unverified: 4,
  blocked: 5
};

export function normalizeRouteTruth(value: string | RouteTruth | null | undefined, fallback: RouteTruth = ROUTE_TRUTH.UNVERIFIED): RouteTruth {
  if (!value) {
    return fallback;
  }

  if (value in ROUTE_TRUTH_READINESS) {
    return value as RouteTruth;
  }

  return fallback;
}

export function isLiveRouteTruth(truth: RouteTruth): boolean {
  return truth === ROUTE_TRUTH.LIVE;
}

export function canActivateRouteTruth(truth: RouteTruth): boolean {
  return truth === ROUTE_TRUTH.LIVE;
}

export function pickMostReadyTruth(truths: readonly RouteTruth[], fallback: RouteTruth = ROUTE_TRUTH.BLOCKED): RouteTruth {
  let bestTruth = fallback;
  let bestScore =
    ROUTE_TRUTH_READINESS[fallback] ??
    ROUTE_TRUTH_READINESS[ROUTE_TRUTH.BLOCKED] ??
    0;

  for (const truth of truths) {
    const score = ROUTE_TRUTH_READINESS[truth] ?? ROUTE_TRUTH_READINESS[fallback] ?? 0;

    if (score > bestScore) {
      bestTruth = truth;
      bestScore = score;
    }
  }

  return bestTruth;
}

export function pickMostConservativeTruth(
  truths: readonly RouteTruth[],
  fallback: RouteTruth = ROUTE_TRUTH.BLOCKED
): RouteTruth {
  let strictestTruth = fallback;
  let strictestScore =
    ROUTE_TRUTH_CONSERVATISM[fallback] ??
    ROUTE_TRUTH_CONSERVATISM[ROUTE_TRUTH.BLOCKED] ??
    0;

  for (const truth of truths) {
    const score = ROUTE_TRUTH_CONSERVATISM[truth] ?? ROUTE_TRUTH_CONSERVATISM[fallback] ?? 0;

    if (score > strictestScore) {
      strictestTruth = truth;
      strictestScore = score;
    }
  }

  return strictestTruth;
}

function deploymentSupportsAtomicSwaps(deployment: XStocksDeployment): boolean {
  return deployment.supportsAtomicSwaps || deployment.stablecoins.some((stablecoin) => stablecoin.supportsAtomicSwaps);
}

function stablecoinSymbols(deployment: XStocksDeployment | null): readonly string[] {
  if (!deployment) {
    return [];
  }

  return deployment.stablecoins.map((stablecoin) => stablecoin.symbol);
}

function resolveRouteTruth({
  deployment,
  systemStatus,
  liveWhenAtomic,
  fallbackWhenPresent
}: {
  readonly deployment: XStocksDeployment | null;
  readonly systemStatus: XStocksSystemStatus;
  readonly liveWhenAtomic: RouteTruth;
  readonly fallbackWhenPresent: RouteTruth;
}): { truth: RouteTruth; blockers: readonly string[] } {
  if (!deployment) {
    return {
      truth: ROUTE_TRUTH.BLOCKED,
      blockers: ["missing_network_deployment"]
    };
  }

  if (systemStatus.isMarketTradingHalted || systemStatus.isAtomicTradingHalted) {
    return {
      truth: ROUTE_TRUTH.BLOCKED,
      blockers: ["trading_halted"]
    };
  }

  if (deploymentSupportsAtomicSwaps(deployment)) {
    return {
      truth: liveWhenAtomic,
      blockers: []
    };
  }

  return {
    truth: fallbackWhenPresent,
    blockers: ["atomic_swaps_not_supported"]
  };
}

function findDeployment(asset: XStocksAsset, network: XStocksNetwork): XStocksDeployment | null {
  return asset.deployments.find((deployment) => deployment.network === network) ?? null;
}

export function buildExecutionRoutes(
  asset: XStocksAsset,
  systemStatus: XStocksSystemStatus
): readonly XStocksExecutionRoute[] {
  const ethereumDeployment = findDeployment(asset, "Ethereum");
  const inkDeployment = findDeployment(asset, "Ink");

  const ethereumTruth = resolveRouteTruth({
    deployment: ethereumDeployment,
    systemStatus,
    liveWhenAtomic: ROUTE_TRUTH.LIVE,
    fallbackWhenPresent: ROUTE_TRUTH.PREVIEW
  });

  const inkTruth = resolveRouteTruth({
    deployment: inkDeployment,
    systemStatus,
    liveWhenAtomic: ROUTE_TRUTH.MENTOR_CONFIRMED,
    fallbackWhenPresent: ROUTE_TRUTH.PREVIEW
  });

  return [
    {
      id: XSTOCKS_EXECUTION_RAIL.COW_SWAP,
      label: "Cow Swap",
      chain: "Ethereum",
      truth: ethereumTruth.truth,
      proofSource: XSTOCKS_RAIL_PROOF_SOURCE.VERIFIED_PUBLIC,
      deploymentAddress: ethereumDeployment?.address ?? null,
      wrapperAddress: ethereumDeployment?.wrapperAddress ?? null,
      stablecoinSymbols: stablecoinSymbols(ethereumDeployment),
      supportsAtomicSwaps: ethereumDeployment ? deploymentSupportsAtomicSwaps(ethereumDeployment) : false,
      blockers: ethereumTruth.blockers,
      notes: ["Verified Ethereum execution surface for xStocks xChange."]
    },
    {
      id: XSTOCKS_EXECUTION_RAIL.ONEINCH,
      label: "1inch",
      chain: "Ethereum",
      truth: ethereumTruth.truth,
      proofSource: XSTOCKS_RAIL_PROOF_SOURCE.VERIFIED_PUBLIC,
      deploymentAddress: ethereumDeployment?.address ?? null,
      wrapperAddress: ethereumDeployment?.wrapperAddress ?? null,
      stablecoinSymbols: stablecoinSymbols(ethereumDeployment),
      supportsAtomicSwaps: ethereumDeployment ? deploymentSupportsAtomicSwaps(ethereumDeployment) : false,
      blockers: ethereumTruth.blockers,
      notes: ["Verified Ethereum execution surface for xStocks xChange."]
    },
    {
      id: XSTOCKS_EXECUTION_RAIL.SPREAD_FINANCE,
      label: "Spread Finance",
      chain: "Ink",
      truth: inkTruth.truth,
      proofSource: XSTOCKS_RAIL_PROOF_SOURCE.MENTOR_REPORTED,
      deploymentAddress: inkDeployment?.address ?? null,
      wrapperAddress: inkDeployment?.wrapperAddress ?? null,
      stablecoinSymbols: stablecoinSymbols(inkDeployment),
      supportsAtomicSwaps: inkDeployment ? deploymentSupportsAtomicSwaps(inkDeployment) : false,
      blockers: inkTruth.blockers,
      notes: ["Mentor-reported Ink execution surface. Do not surface as live without direct proof."]
    }
  ] as const;
}

export function deriveExecutionRouteTruth(routes: readonly XStocksExecutionRoute[]): RouteTruth {
  return pickMostReadyTruth(routes.map((route) => route.truth), ROUTE_TRUTH.BLOCKED);
}
