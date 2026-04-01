import { ADAPTER_IMPLEMENTATION_STATE, RAIL_PROOF_SOURCE, ROUTE_TRUTH, pickMostReadyTruth } from "../truth.js";
import type {
  DirectionalLiveProofOverlay,
  DirectionalRouteContext,
  DirectionalVaultContext,
  FlowdeskAusdVaultSnapshot,
  MorphoSpyxAusdMarketSnapshot
} from "../types.js";

const DEFAULT_MORPHO_SPYX_AUSD_MARKET: MorphoSpyxAusdMarketSnapshot = {
  adapterId: "morpho_spyx_ausd",
  label: "Morpho SPYx/AUSD",
  venue: "morpho",
  platform: "Morpho",
  chain: "Ethereum",
  truth: ROUTE_TRUTH.LIVE,
  proofSource: RAIL_PROOF_SOURCE.VERIFIED_PUBLIC,
  implementationState: ADAPTER_IMPLEMENTATION_STATE.SCAFFOLDED,
  marketKey: "spyx-ausd",
  marketAddress: null,
  collateralSymbol: "SPYx",
  debtSymbol: "AUSD",
  maxLtvBps: null,
  liquidationThresholdBps: null,
  supplyApyBps: null,
  borrowApyBps: null,
  utilizationBps: null,
  liquidityUsd: null,
  notes: ["Current verified xStocks lending proof path for downstream live-proof overlays."]
};

const DEFAULT_FLOWDESK_AUSD_VAULT: FlowdeskAusdVaultSnapshot = {
  adapterId: "flowdesk_ausd_rwa_strategy",
  label: "Flowdesk AUSD RWA Strategy",
  venue: "flowdesk",
  platform: "Morpho",
  chain: "Ethereum",
  truth: ROUTE_TRUTH.LIVE,
  proofSource: RAIL_PROOF_SOURCE.VERIFIED_PUBLIC,
  implementationState: ADAPTER_IMPLEMENTATION_STATE.SCAFFOLDED,
  vaultKey: "ausd-rwa-strategy",
  vaultAddress: null,
  depositSymbol: "AUSD",
  rewardSymbol: "AUSD",
  apyBps: null,
  tvlUsd: null,
  notes: ["Verified Flowdesk vault sleeve for AUSD parking or yield-buffer context."]
};

export function createMorphoSpyxAusdMarketSnapshot(
  overrides: Partial<MorphoSpyxAusdMarketSnapshot> = {}
): MorphoSpyxAusdMarketSnapshot {
  return {
    ...DEFAULT_MORPHO_SPYX_AUSD_MARKET,
    ...overrides,
    notes: overrides.notes ?? DEFAULT_MORPHO_SPYX_AUSD_MARKET.notes
  };
}

export function createFlowdeskAusdVaultSnapshot(
  overrides: Partial<FlowdeskAusdVaultSnapshot> = {}
): FlowdeskAusdVaultSnapshot {
  return {
    ...DEFAULT_FLOWDESK_AUSD_VAULT,
    ...overrides,
    notes: overrides.notes ?? DEFAULT_FLOWDESK_AUSD_VAULT.notes
  };
}

export function toMorphoSpyxAusdRouteContext(
  snapshot: MorphoSpyxAusdMarketSnapshot = DEFAULT_MORPHO_SPYX_AUSD_MARKET
): DirectionalRouteContext {
  return {
    adapterId: snapshot.adapterId,
    label: snapshot.label,
    venue: snapshot.venue,
    platform: snapshot.platform,
    chain: snapshot.chain,
    kind: "lending_market",
    truth: snapshot.truth,
    proofSource: snapshot.proofSource,
    implementationState: snapshot.implementationState,
    marketKey: snapshot.marketKey,
    marketAddress: snapshot.marketAddress,
    collateralSymbol: snapshot.collateralSymbol,
    debtSymbol: snapshot.debtSymbol,
    notes: snapshot.notes
  };
}

export function toFlowdeskAusdVaultContext(
  snapshot: FlowdeskAusdVaultSnapshot = DEFAULT_FLOWDESK_AUSD_VAULT
): DirectionalVaultContext {
  return {
    adapterId: snapshot.adapterId,
    label: snapshot.label,
    venue: snapshot.venue,
    platform: snapshot.platform,
    chain: snapshot.chain,
    kind: "yield_vault",
    truth: snapshot.truth,
    proofSource: snapshot.proofSource,
    implementationState: snapshot.implementationState,
    vaultKey: snapshot.vaultKey,
    vaultAddress: snapshot.vaultAddress,
    depositSymbol: snapshot.depositSymbol,
    rewardSymbol: snapshot.rewardSymbol,
    notes: snapshot.notes
  };
}

export function buildMorphoLiveProofOverlay(
  marketSnapshot: MorphoSpyxAusdMarketSnapshot = DEFAULT_MORPHO_SPYX_AUSD_MARKET,
  vaultSnapshot: FlowdeskAusdVaultSnapshot = DEFAULT_FLOWDESK_AUSD_VAULT
): DirectionalLiveProofOverlay {
  const routeContext = toMorphoSpyxAusdRouteContext(marketSnapshot);
  const vaultContext = toFlowdeskAusdVaultContext(vaultSnapshot);

  return {
    truth: pickMostReadyTruth([routeContext.truth, vaultContext.truth]),
    routeContext,
    vaultContext,
    note: "Verified live-proof overlay uses Morpho SPYx/AUSD and the Flowdesk AUSD vault while Euler market proof remains incomplete."
  };
}
