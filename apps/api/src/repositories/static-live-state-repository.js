import { assertPromotedActivationManifest } from "../../../../packages/policy/src/index.js";

const DEFAULT_STATE_VERSION = "local-qualification-harness.v1";

function routeTruthToAvailability(routeTruth) {
  switch (routeTruth) {
    case "live":
      return "available";
    case "preview":
    case "mentor_confirmed":
    case "unverified":
      return "preview_only";
    case "blocked":
    default:
      return "missing";
  }
}

function defaultRouteNotes(requiredRoute, manifest) {
  if (requiredRoute.routeKind === "directional_market") {
    return "Local harness keeps directional preview-only unless independent live proof exists.";
  }

  return `Local harness assumes ${requiredRoute.label ?? requiredRoute.routeId} is available for ${manifest.slotId}.`;
}

function defaultVerificationTier(requiredRoute) {
  return requiredRoute.routeKind === "directional_market"
    ? "unverified"
    : "public_verified";
}

function defaultAvailability(requiredRoute) {
  return requiredRoute.routeKind === "directional_market"
    ? "preview_only"
    : "available";
}

export function createStaticLiveStateRepository({
  asOf = "2026-04-01T12:00:00.000Z",
} = {}) {
  return {
    async loadBoundaryState({ manifest: manifestInput }) {
      const manifest = assertPromotedActivationManifest(manifestInput);
      const routeValidationIndex = new Map(
        (manifest.routeValidation?.routeTruthLabels ?? []).map((routeTruth) => [
          routeTruth.routeId,
          routeTruth,
        ]),
      );

      return {
        liveXStocksState: {
          stateVersion: `${DEFAULT_STATE_VERSION}.xstocks`,
          asOf,
          assets: manifest.requiredAssets.map((assetSymbol) => ({
            assetSymbol,
            chain: manifest.chain,
            status: "active",
            priceUsd: assetSymbol === "AUSD" ? 1 : 100,
          })),
        },
        liveRouteState: {
          stateVersion: `${DEFAULT_STATE_VERSION}.routes`,
          asOf,
          routes: manifest.requiredRoutes.map((requiredRoute) => {
            const routeTruth = routeValidationIndex.get(requiredRoute.routeId);

            return {
              routeId: requiredRoute.routeId,
              label: requiredRoute.label ?? requiredRoute.routeId,
              routeKind: requiredRoute.routeKind,
              chain: manifest.chain,
              verificationTier:
                routeTruth?.verificationTier ??
                defaultVerificationTier(requiredRoute),
              availability:
                routeTruth?.availability ??
                (routeTruth
                  ? routeTruthToAvailability(routeTruth.truthState)
                  : defaultAvailability(requiredRoute)),
              notes:
                routeTruth?.reason ?? defaultRouteNotes(requiredRoute, manifest),
            };
          }),
        },
      };
    },
  };
}
