import type { RouteChain, RouteVerificationTier } from "@xstocks-strategy-lab/shared/contracts/common";

import { buildMorphoLiveProofOverlay, toFlowdeskAusdVaultContext, toMorphoSpyxAusdRouteContext } from "../adapters/morpho.js";
import { toEulerDirectionalRouteContext } from "../adapters/euler.js";
import {
  CANONICAL_EULER_DIRECTIONAL_ROUTE,
  CANONICAL_FLOWDESK_AUSD_VAULT,
  CANONICAL_MORPHO_SPYX_AUSD_MARKET
} from "../fixtures/directional-preview.js";
import { RAIL_PROOF_SOURCE, ROUTE_TRUTH } from "../truth.js";
import type {
  DirectionalLiveProofOverlay,
  DirectionalRouteContext,
  DirectionalVaultContext,
  EulerDirectionalRouteSnapshot,
  FlowdeskAusdVaultSnapshot,
  MorphoSpyxAusdMarketSnapshot
} from "../types.js";

export type DirectionalPolicyRouteAvailability = "available" | "preview_only" | "unavailable" | "unknown" | "missing";
export type DirectionalPolicyRouteKind = "lending_market" | "yield_vault" | "directional_market";

export interface DirectionalPolicyRouteEntry {
  readonly routeId: string;
  readonly label: string;
  readonly routeKind: DirectionalPolicyRouteKind;
  readonly chain: RouteChain;
  readonly verificationTier: RouteVerificationTier;
  readonly availability: DirectionalPolicyRouteAvailability;
  readonly notes: string;
}

export interface DirectionalBoundaryContextBundle {
  readonly morphoRouteContext: DirectionalRouteContext;
  readonly flowdeskVaultContext: DirectionalVaultContext;
  readonly eulerRouteContext: DirectionalRouteContext;
  readonly liveProofOverlay: DirectionalLiveProofOverlay;
}

function toVerificationTier(proofSource: DirectionalRouteContext["proofSource"]): RouteVerificationTier {
  if (proofSource === RAIL_PROOF_SOURCE.VERIFIED_PUBLIC) {
    return "public_verified";
  }

  if (proofSource === RAIL_PROOF_SOURCE.MENTOR_REPORTED) {
    return "mentor_reported";
  }

  return "unverified";
}

function toAvailability(truth: DirectionalRouteContext["truth"]): DirectionalPolicyRouteAvailability {
  if (truth === ROUTE_TRUTH.LIVE || truth === ROUTE_TRUTH.MENTOR_CONFIRMED) {
    return "available";
  }

  if (truth === ROUTE_TRUTH.PREVIEW) {
    return "preview_only";
  }

  if (truth === ROUTE_TRUTH.BLOCKED) {
    return "unavailable";
  }

  return "preview_only";
}

function toRouteChain(chain: DirectionalRouteContext["chain"] | DirectionalVaultContext["chain"]): RouteChain {
  return chain.toLowerCase() as RouteChain;
}

export function buildDirectionalBoundaryContextBundle(
  options: {
    readonly morphoMarket?: MorphoSpyxAusdMarketSnapshot;
    readonly flowdeskVault?: FlowdeskAusdVaultSnapshot;
    readonly eulerRoute?: EulerDirectionalRouteSnapshot;
  } = {}
): DirectionalBoundaryContextBundle {
  const morphoMarket = options.morphoMarket ?? CANONICAL_MORPHO_SPYX_AUSD_MARKET;
  const flowdeskVault = options.flowdeskVault ?? CANONICAL_FLOWDESK_AUSD_VAULT;
  const eulerRoute = options.eulerRoute ?? CANONICAL_EULER_DIRECTIONAL_ROUTE;

  return {
    morphoRouteContext: toMorphoSpyxAusdRouteContext(morphoMarket),
    flowdeskVaultContext: toFlowdeskAusdVaultContext(flowdeskVault),
    eulerRouteContext: toEulerDirectionalRouteContext(eulerRoute),
    liveProofOverlay: buildMorphoLiveProofOverlay(morphoMarket, flowdeskVault)
  };
}

export function buildDirectionalPolicyRouteEntries(
  options: {
    readonly morphoMarket?: MorphoSpyxAusdMarketSnapshot;
    readonly flowdeskVault?: FlowdeskAusdVaultSnapshot;
    readonly eulerRoute?: EulerDirectionalRouteSnapshot;
  } = {}
): readonly DirectionalPolicyRouteEntry[] {
  const contexts = buildDirectionalBoundaryContextBundle(options);

  return [
    {
      routeId: `morpho.${contexts.morphoRouteContext.marketKey}`,
      label: contexts.morphoRouteContext.label,
      routeKind: "lending_market",
      chain: toRouteChain(contexts.morphoRouteContext.chain),
      verificationTier: toVerificationTier(contexts.morphoRouteContext.proofSource),
      availability: toAvailability(contexts.morphoRouteContext.truth),
      notes: contexts.morphoRouteContext.notes.join(" ")
    },
    {
      routeId: `flowdesk.${contexts.flowdeskVaultContext.vaultKey}`,
      label: contexts.flowdeskVaultContext.label,
      routeKind: "yield_vault",
      chain: toRouteChain(contexts.flowdeskVaultContext.chain),
      verificationTier: toVerificationTier(contexts.flowdeskVaultContext.proofSource),
      availability: toAvailability(contexts.flowdeskVaultContext.truth),
      notes: contexts.flowdeskVaultContext.notes.join(" ")
    },
    {
      routeId: "euler.ethereum.directional",
      label: contexts.eulerRouteContext.label,
      routeKind: "directional_market",
      chain: toRouteChain(contexts.eulerRouteContext.chain),
      verificationTier: toVerificationTier(contexts.eulerRouteContext.proofSource),
      availability: toAvailability(contexts.eulerRouteContext.truth),
      notes: contexts.eulerRouteContext.notes.join(" ")
    }
  ];
}

export const CANONICAL_DIRECTIONAL_BOUNDARY_CONTEXT_BUNDLE =
  buildDirectionalBoundaryContextBundle();

export const CANONICAL_DIRECTIONAL_POLICY_ROUTE_ENTRIES =
  buildDirectionalPolicyRouteEntries();
