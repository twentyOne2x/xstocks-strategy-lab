import { normalizeUsd } from "./contracts.js";

export function usesCowEthereumBasketExecutionLane(manifest) {
  const executionRoutes = (manifest?.requiredRoutes ?? []).filter(
    (route) => route.routeKind === "execution",
  );

  return (
    manifest?.mode === "basket" &&
    manifest?.chain === "ethereum" &&
    executionRoutes.length > 0 &&
    executionRoutes.every((route) => route.routeId === "cow_swap.ethereum")
  );
}

export function deriveCanonicalWalletRequirements(
  manifest,
  walletRequirements = {},
) {
  const normalizedWalletRequirements = {
    requiresWallet: walletRequirements.requiresWallet !== false,
    requiresSmartAccount: walletRequirements.requiresSmartAccount !== false,
    minFundingUsd: normalizeUsd(walletRequirements.minFundingUsd, 0),
    preferredFundingProvider:
      walletRequirements.preferredFundingProvider ?? "privy",
    preferredBridgeProvider:
      walletRequirements.preferredBridgeProvider ?? "lifi",
    topUpAsset: walletRequirements.topUpAsset ?? "USDC",
  };

  if (!usesCowEthereumBasketExecutionLane(manifest)) {
    return normalizedWalletRequirements;
  }

  return {
    ...normalizedWalletRequirements,
    requiresSmartAccount: false,
    minFundingUsd: 0,
  };
}
