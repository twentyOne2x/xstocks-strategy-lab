import {
  createEulerDirectionalRouteSnapshot,
  toEulerDirectionalRouteContext
} from "../adapters/euler.js";
import {
  buildMorphoLiveProofOverlay,
  createFlowdeskAusdVaultSnapshot,
  createMorphoSpyxAusdMarketSnapshot,
  toFlowdeskAusdVaultContext,
  toMorphoSpyxAusdRouteContext
} from "../adapters/morpho.js";
import { buildDirectionalPreviewPayload } from "../payloads/directional-preview.js";
import {
  ADAPTER_IMPLEMENTATION_STATE,
  RAIL_PROOF_SOURCE,
  ROUTE_TRUTH
} from "../truth.js";
import type {
  DirectionalChain,
  DirectionalPreviewInput,
  DirectionalPreviewPayload,
  DirectionalRouteContext,
  DirectionalVaultContext,
  EulerDirectionalRouteSnapshot,
  FlowdeskAusdVaultSnapshot,
  MorphoSpyxAusdMarketSnapshot
} from "../types.js";
import type { RailProofSource, RouteTruth } from "../truth.js";

export const CANONICAL_DIRECTIONAL_FIXTURE_TIMESTAMP = "2026-03-31T12:00:00.000Z";

export type DirectionalFixtureChain = Lowercase<DirectionalChain>;
export type DirectionalRouteVerificationTier = "public_verified" | "mentor_reported" | "unverified";
export type DirectionalRouteAvailability = "available" | "preview_only" | "unavailable" | "unknown";

export interface DirectionalRouteStateFixture {
  readonly route_id: string;
  readonly label: string;
  readonly route_kind: "vault";
  readonly chain: DirectionalFixtureChain;
  readonly verification_tier: DirectionalRouteVerificationTier;
  readonly availability: DirectionalRouteAvailability;
  readonly notes: string;
}

export const CANONICAL_MORPHO_SPYX_AUSD_MARKET: MorphoSpyxAusdMarketSnapshot =
  createMorphoSpyxAusdMarketSnapshot({
    implementationState: ADAPTER_IMPLEMENTATION_STATE.IMPLEMENTED,
    marketAddress: "0xmorphospyxausd",
    maxLtvBps: 8600,
    liquidationThresholdBps: 9000,
    supplyApyBps: 320,
    borrowApyBps: 540,
    utilizationBps: 6400,
    liquidityUsd: 25000000,
    notes: [
      "Publicly verified Morpho SPYx/AUSD market used for live-proof overlays.",
      "Use this market as the canonical verified lending context until direct xStocks-on-Euler proof is captured."
    ]
  });

export const CANONICAL_FLOWDESK_AUSD_VAULT: FlowdeskAusdVaultSnapshot =
  createFlowdeskAusdVaultSnapshot({
    implementationState: ADAPTER_IMPLEMENTATION_STATE.IMPLEMENTED,
    vaultAddress: "0xflowdeskausd",
    apyBps: 470,
    tvlUsd: 18000000,
    notes: [
      "Verified Flowdesk AUSD vault context for yield-buffer sleeves.",
      "Keep this explicit in payloads when Euler remains preview-only."
    ]
  });

export const CANONICAL_EULER_DIRECTIONAL_ROUTE: EulerDirectionalRouteSnapshot =
  createEulerDirectionalRouteSnapshot({
    collateralSymbol: "MSTRx",
    debtSymbol: "AUSD",
    notes: [
      "Euler remains central for directional UX, but direct live xStocks-on-Euler execution is still unverified.",
      "Do not promote this route above preview until public proof is captured."
    ]
  });

export const CANONICAL_MORPHO_ROUTE_CONTEXT: DirectionalRouteContext =
  toMorphoSpyxAusdRouteContext(CANONICAL_MORPHO_SPYX_AUSD_MARKET);

export const CANONICAL_FLOWDESK_VAULT_CONTEXT: DirectionalVaultContext =
  toFlowdeskAusdVaultContext(CANONICAL_FLOWDESK_AUSD_VAULT);

export const CANONICAL_EULER_ROUTE_CONTEXT: DirectionalRouteContext =
  toEulerDirectionalRouteContext(CANONICAL_EULER_DIRECTIONAL_ROUTE);

export const CANONICAL_LIVE_PROOF_OVERLAY = buildMorphoLiveProofOverlay(
  CANONICAL_MORPHO_SPYX_AUSD_MARKET,
  CANONICAL_FLOWDESK_AUSD_VAULT
);

export const CANONICAL_DIRECTIONAL_PREVIEW_INPUT: DirectionalPreviewInput = {
  symbol: "MSTRx",
  side: "long",
  currentPriceUsd: 1921.7,
  collateralUsd: 12500,
  debtUsd: 5000,
  liquidationThresholdBps: 8600,
  liquidationPriceUsd: 1450,
  positionSizeUnits: 9.1,
  targetHealthFactor: 1.35,
  routeContext: CANONICAL_EULER_ROUTE_CONTEXT,
  vaultContext: CANONICAL_FLOWDESK_VAULT_CONTEXT,
  liveProofOverlay: CANONICAL_LIVE_PROOF_OVERLAY,
  notes: [
    "Preview payload stays conservative until direct xStocks-on-Euler execution is verified.",
    "Morpho SPYx/AUSD and Flowdesk provide the current live-proof context."
  ]
};

export const CANONICAL_DIRECTIONAL_PREVIEW_PAYLOAD: DirectionalPreviewPayload =
  buildDirectionalPreviewPayload(CANONICAL_DIRECTIONAL_PREVIEW_INPUT);

function toFixtureChain(chain: DirectionalChain): DirectionalFixtureChain {
  return chain.toLowerCase() as DirectionalFixtureChain;
}

function toVerificationTier(proofSource: RailProofSource): DirectionalRouteVerificationTier {
  if (proofSource === RAIL_PROOF_SOURCE.VERIFIED_PUBLIC) {
    return "public_verified";
  }

  if (proofSource === RAIL_PROOF_SOURCE.MENTOR_REPORTED) {
    return "mentor_reported";
  }

  return "unverified";
}

function toAvailability(truth: RouteTruth): DirectionalRouteAvailability {
  if (truth === ROUTE_TRUTH.LIVE || truth === ROUTE_TRUTH.MENTOR_CONFIRMED) {
    return "available";
  }

  if (truth === ROUTE_TRUTH.PREVIEW) {
    return "preview_only";
  }

  if (truth === ROUTE_TRUTH.BLOCKED) {
    return "unavailable";
  }

  return "unknown";
}

export function buildDirectionalRouteStateFixtures(
  options: {
    readonly morphoMarket?: MorphoSpyxAusdMarketSnapshot;
    readonly flowdeskVault?: FlowdeskAusdVaultSnapshot;
    readonly eulerRoute?: EulerDirectionalRouteSnapshot;
  } = {}
): readonly DirectionalRouteStateFixture[] {
  const morphoMarket = options.morphoMarket ?? CANONICAL_MORPHO_SPYX_AUSD_MARKET;
  const flowdeskVault = options.flowdeskVault ?? CANONICAL_FLOWDESK_AUSD_VAULT;
  const eulerRoute = options.eulerRoute ?? CANONICAL_EULER_DIRECTIONAL_ROUTE;

  return [
    {
      route_id: `morpho.${morphoMarket.marketKey}`,
      label: morphoMarket.label,
      route_kind: "vault",
      chain: toFixtureChain(morphoMarket.chain),
      verification_tier: toVerificationTier(morphoMarket.proofSource),
      availability: toAvailability(morphoMarket.truth),
      notes: morphoMarket.notes.join(" ")
    },
    {
      route_id: `flowdesk.${flowdeskVault.vaultKey}`,
      label: flowdeskVault.label,
      route_kind: "vault",
      chain: toFixtureChain(flowdeskVault.chain),
      verification_tier: toVerificationTier(flowdeskVault.proofSource),
      availability: toAvailability(flowdeskVault.truth),
      notes: flowdeskVault.notes.join(" ")
    },
    {
      route_id: "euler.ethereum.directional",
      label: eulerRoute.label,
      route_kind: "vault",
      chain: toFixtureChain(eulerRoute.chain),
      verification_tier: toVerificationTier(eulerRoute.proofSource),
      availability: toAvailability(eulerRoute.truth),
      notes: eulerRoute.notes.join(" ")
    }
  ];
}

export const CANONICAL_DIRECTIONAL_ROUTE_FIXTURES = buildDirectionalRouteStateFixtures();
