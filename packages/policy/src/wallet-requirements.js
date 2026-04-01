import { normalizeUsd } from "./contracts.js";

function getExecutionRoutes(manifest) {
  return (manifest?.requiredRoutes ?? []).filter(
    (route) => route.routeKind === "execution",
  );
}

export function usesCowEthereumBasketExecutionLane(manifest) {
  const executionRoutes = getExecutionRoutes(manifest);

  return (
    manifest?.mode === "basket" &&
    manifest?.chain === "ethereum" &&
    executionRoutes.length > 0 &&
    executionRoutes.every((route) => route.routeId === "cow_swap.ethereum")
  );
}

export function usesLinkedWalletEthereumBasketExecutionLane(manifest) {
  const executionRoutes = getExecutionRoutes(manifest);

  return (
    manifest?.mode === "basket" &&
    manifest?.chain === "ethereum" &&
    executionRoutes.length > 0 &&
    executionRoutes.every((route) =>
      ["cow_swap.ethereum", "1inch.ethereum"].includes(route.routeId),
    )
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

  if (!usesLinkedWalletEthereumBasketExecutionLane(manifest)) {
    return normalizedWalletRequirements;
  }

  return {
    ...normalizedWalletRequirements,
    requiresSmartAccount: false,
    minFundingUsd: 0,
  };
}
