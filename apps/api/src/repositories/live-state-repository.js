import { buildDirectionalPolicyRouteEntries } from "../../../../packages/euler/dist/index.js";
import { createXStocksBoundaryRepository } from "../../../../packages/xstocks/dist/index.js";

const DIRECTIONAL_ADDITIONAL_ROUTES = buildDirectionalPolicyRouteEntries();

export function createLiveStateRepository({
  baseUrl = "https://api.xstocks.fi/api/v2",
  backedBaseUrl = "https://api.backed.fi/api/v1",
  fetchImpl,
}) {
  // Keep the API wrapper thin: package-owned runtime surfaces own manifest-scoped
  // live-state composition, including AUSD bridging and directional overlay routes.
  const boundaryRepository = createXStocksBoundaryRepository({
    baseUrl,
    backedBaseUrl,
    fetchImpl,
    additionalRoutes: DIRECTIONAL_ADDITIONAL_ROUTES,
  });

  return {
    async loadBoundaryState(input) {
      return boundaryRepository.loadBoundaryState(input);
    },
    async fetchRequiredAssets(requiredAssets, options) {
      return boundaryRepository.fetchRequiredAssets(requiredAssets, options);
    },
    async fetchAssetSnapshot(symbol, options) {
      return boundaryRepository.fetchAssetSnapshot(symbol, options);
    },
  };
}
