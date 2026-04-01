import type { RailTruthState } from "@xstocks-strategy-lab/shared/contracts/common";

export const ROUTE_TRUTH = {
  LIVE: "live",
  PREVIEW: "preview",
  BLOCKED: "blocked",
  MENTOR_CONFIRMED: "mentor_confirmed",
  UNVERIFIED: "unverified"
} as const;

export type RouteTruth = RailTruthState;

export const RAIL_PROOF_SOURCE = {
  VERIFIED_PUBLIC: "verified_public",
  MENTOR_REPORTED: "mentor_reported",
  UNVERIFIED: "unverified"
} as const;

export type RailProofSource = (typeof RAIL_PROOF_SOURCE)[keyof typeof RAIL_PROOF_SOURCE];

export const ADAPTER_IMPLEMENTATION_STATE = {
  IMPLEMENTED: "implemented",
  SCAFFOLDED: "scaffolded"
} as const;

export type AdapterImplementationState =
  (typeof ADAPTER_IMPLEMENTATION_STATE)[keyof typeof ADAPTER_IMPLEMENTATION_STATE];

const ROUTE_TRUTH_READINESS: Record<RouteTruth, number> = {
  live: 5,
  mentor_confirmed: 4,
  preview: 3,
  unverified: 2,
  blocked: 1
};

export function canActivateRouteTruth(truth: RouteTruth): boolean {
  return truth === ROUTE_TRUTH.LIVE;
}

export function pickMostReadyTruth(truths: readonly RouteTruth[], fallback: RouteTruth = ROUTE_TRUTH.BLOCKED): RouteTruth {
  let bestTruth = fallback;
  let bestScore = ROUTE_TRUTH_READINESS[fallback] ?? ROUTE_TRUTH_READINESS[ROUTE_TRUTH.BLOCKED];

  for (const truth of truths) {
    const score = ROUTE_TRUTH_READINESS[truth] ?? ROUTE_TRUTH_READINESS[fallback] ?? 0;

    if (score > bestScore) {
      bestTruth = truth;
      bestScore = score;
    }
  }

  return bestTruth;
}
