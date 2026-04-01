import { ADAPTER_IMPLEMENTATION_STATE, RAIL_PROOF_SOURCE, ROUTE_TRUTH } from "../truth.js";
import type { DirectionalRouteContext, EulerDirectionalRouteSnapshot } from "../types.js";

const DEFAULT_EULER_DIRECTIONAL_ROUTE: EulerDirectionalRouteSnapshot = {
  adapterId: "euler_directional",
  label: "Euler Directional",
  venue: "euler",
  platform: "Euler",
  chain: "Ethereum",
  truth: ROUTE_TRUTH.UNVERIFIED,
  proofSource: RAIL_PROOF_SOURCE.UNVERIFIED,
  implementationState: ADAPTER_IMPLEMENTATION_STATE.SCAFFOLDED,
  marketKey: null,
  marketAddress: null,
  collateralSymbol: null,
  debtSymbol: null,
  notes: ["Euler stays central in product framing, but exact live xStocks-on-Euler support is not verified here."]
};

export function createEulerDirectionalRouteSnapshot(
  overrides: Partial<EulerDirectionalRouteSnapshot> = {}
): EulerDirectionalRouteSnapshot {
  return {
    ...DEFAULT_EULER_DIRECTIONAL_ROUTE,
    ...overrides,
    notes: overrides.notes ?? DEFAULT_EULER_DIRECTIONAL_ROUTE.notes
  };
}

export function toEulerDirectionalRouteContext(
  snapshot: EulerDirectionalRouteSnapshot = DEFAULT_EULER_DIRECTIONAL_ROUTE
): DirectionalRouteContext {
  return {
    adapterId: snapshot.adapterId,
    label: snapshot.label,
    venue: snapshot.venue,
    platform: snapshot.platform,
    chain: snapshot.chain,
    kind: "directional_market",
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
