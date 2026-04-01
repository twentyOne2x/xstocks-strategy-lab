import {
  AUTOMATION_ACCOUNT_MODE,
  MANUAL_SIGNING_MODE,
  VENUE_SIGNING_MODE,
  normalizeUsd,
} from "./contracts.js";

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

export function supportsSeparateExecutionDestination(manifest) {
  const executionRoutes = getExecutionRoutes(manifest);

  return (
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
    manualSigningMode:
      walletRequirements.manualSigningMode ?? MANUAL_SIGNING_MODE.WALLET_FIRST,
    automationAccountMode:
      walletRequirements.automationAccountMode ??
      AUTOMATION_ACCOUNT_MODE.SMART_ACCOUNT_REQUIRED,
    venueSigningMode:
      walletRequirements.venueSigningMode ??
      VENUE_SIGNING_MODE.WALLET_SIGNER_MANUAL_ONLY,
    supportsSeparateExecutionDestination: Boolean(
      walletRequirements.supportsSeparateExecutionDestination ??
        supportsSeparateExecutionDestination(manifest),
    ),
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
