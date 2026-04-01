import {
  SMART_ACCOUNT_BOOTSTRAP_STATE,
  SMART_ACCOUNT_READINESS,
  normalizeWalletState,
} from "./contracts.js";
import { assertPromotedActivationManifest } from "./manifest.js";
import { deriveReadinessWalletRequirements } from "./readiness-policy.js";

function deriveBootstrapState({ requiresSmartAccount, normalizedWalletState }) {
  if (!normalizedWalletState.walletConnected) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.WALLET_REQUIRED;
  }

  if (
    normalizedWalletState.embeddedWallet.status === "pending" ||
    normalizedWalletState.embeddedWallet.status === "creating"
  ) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.EMBEDDED_WALLET_PENDING;
  }

  if (!requiresSmartAccount) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.READY;
  }

  if (
    normalizedWalletState.smartAccount.status === "pending" ||
    normalizedWalletState.smartAccount.status === "creating"
  ) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_PENDING;
  }

  if (
    normalizedWalletState.smartAccount.status === "ready" &&
    normalizedWalletState.smartAccount.address
  ) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.READY;
  }

  return SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_REQUIRED;
}

export function createSmartAccountProviderScaffold({
  providerId = "privy",
  providerName = "Privy smart wallet",
  supportedChains = ["ethereum"],
  implementation = "privy_smart_wallet",
} = {}) {
  return {
    providerId,
    providerName,
    supportedChains,
    capabilities: {
      createEmbeddedWallet: true,
      createSmartAccount: true,
      scopedPermissions: true,
      userApprovedExecutionOnly: true,
      autonomousExecution: false,
      fundingMethods: ["card", "wallet", "exchange"],
    },
    inspectWalletState({ activationManifest, walletState }) {
      const manifest = assertPromotedActivationManifest(activationManifest);
      const normalizedWalletState = normalizeWalletState(walletState);
      const readinessWalletRequirements =
        deriveReadinessWalletRequirements(manifest);
      const requiresSmartAccount =
        readinessWalletRequirements.requiresSmartAccount !== false;
      const bootstrapState = deriveBootstrapState({
        requiresSmartAccount,
        normalizedWalletState,
      });
      const signerAddress =
        normalizedWalletState.embeddedWallet.address ??
        normalizedWalletState.walletAddress;
      const destinationAddress =
        bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.READY &&
        normalizedWalletState.smartAccount.address
          ? normalizedWalletState.smartAccount.address
          : signerAddress ?? null;

      if (!requiresSmartAccount) {
        return {
          readiness: SMART_ACCOUNT_READINESS.NOT_REQUIRED,
          providerId,
          status: "not_required",
          address: destinationAddress,
          bootstrap: {
            state: SMART_ACCOUNT_BOOTSTRAP_STATE.READY,
            chain: manifest.chain,
            implementation,
            signerAddress,
            embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
            smartAccountAddress: normalizedWalletState.smartAccount.address,
            destinationAddress,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              "This manifest does not require a smart account before execution review.",
            ],
          },
        };
      }

      if (!normalizedWalletState.walletConnected) {
        return {
          readiness: SMART_ACCOUNT_READINESS.WALLET_REQUIRED,
          providerId,
          status: "wallet_required",
          address: null,
          bootstrap: {
            state: SMART_ACCOUNT_BOOTSTRAP_STATE.WALLET_REQUIRED,
            chain: manifest.chain,
            implementation,
            signerAddress: null,
            embeddedWalletAddress: null,
            smartAccountAddress: null,
            destinationAddress: null,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              "Authenticate or connect a wallet before creating the Privy smart wallet.",
            ],
          },
        };
      }

      if (
        bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.EMBEDDED_WALLET_PENDING
      ) {
        return {
          readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING,
          providerId,
          status: "embedded_wallet_pending",
          address: normalizedWalletState.embeddedWallet.address,
          bootstrap: {
            state: bootstrapState,
            chain: manifest.chain,
            implementation,
            signerAddress,
            embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
            smartAccountAddress: null,
            destinationAddress: normalizedWalletState.embeddedWallet.address,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              "Privy embedded wallet creation is still pending.",
            ],
          },
        };
      }

      if (bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.READY) {
        return {
          readiness: SMART_ACCOUNT_READINESS.READY,
          providerId,
          status: "ready",
          address: normalizedWalletState.smartAccount.address,
          bootstrap: {
            state: bootstrapState,
            chain: manifest.chain,
            implementation,
            signerAddress,
            embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
            smartAccountAddress: normalizedWalletState.smartAccount.address,
            destinationAddress,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              `Privy smart wallet is ready for promoted manifest ${manifest.manifestId}.`,
            ],
          },
        };
      }

      if (
        bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_PENDING
      ) {
        return {
          readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING,
          providerId,
          status: "smart_account_pending",
          address: normalizedWalletState.smartAccount.address,
          bootstrap: {
            state: bootstrapState,
            chain: manifest.chain,
            implementation,
            signerAddress,
            embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
            smartAccountAddress: normalizedWalletState.smartAccount.address,
            destinationAddress,
            approvalMode: "user_approved_only",
            paymasterReady: false,
            notes: [
              "Privy smart wallet bootstrap has started but is not ready yet.",
            ],
          },
        };
      }

      return {
        readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_REQUIRED,
        providerId,
        status: "smart_account_required",
        address: normalizedWalletState.smartAccount.address,
        bootstrap: {
          state: SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_REQUIRED,
          chain: manifest.chain,
          implementation,
          signerAddress,
          embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
          smartAccountAddress: normalizedWalletState.smartAccount.address,
          destinationAddress,
          approvalMode: "user_approved_only",
          paymasterReady: false,
          notes: [
            "Create the Privy smart wallet before the CoW execution lane can become live.",
          ],
        },
      };
    },
    buildReviewArtifact(activationManifest) {
      const manifest = assertPromotedActivationManifest(activationManifest);
      const readinessWalletRequirements =
        deriveReadinessWalletRequirements(manifest);
      const permissions = manifest.permissions ?? {
        allowPause: true,
        allowTurnOff: true,
      };
      const allowedPermissions = ["activate_promoted_manifest_only"];

      if (permissions.allowPause) {
        allowedPermissions.push("pause_strategy");
      }

      if (permissions.allowTurnOff) {
        allowedPermissions.push("turn_off_strategy");
      }

      return {
        providerId,
        providerName,
        supportedChains,
        permissions: allowedPermissions,
        approvalMode: "user_approved_only",
        bootstrapBoundary:
          "Privy bootstrap is modeled as embedded wallet first, then smart wallet on Ethereum.",
        fundingBoundary:
          "Funding remains provider-agnostic and should target the current signer or smart-wallet destination address through Privy-supported methods.",
        walletConnectionLate: true,
        notes: [
          `Smart-account review is scoped to promoted manifest ${manifest.manifestId}.`,
          readinessWalletRequirements.requiresSmartAccount
            ? "Privy smart wallet bootstrap remains required before execution can become live."
            : "Privy smart wallet bootstrap remains optional for the current CoW execution lane.",
          readinessWalletRequirements.minFundingUsd > 0
            ? `Minimum funding readiness remains ${readinessWalletRequirements.minFundingUsd} USD for this manifest.`
            : "Funding readiness follows the user-requested notional for the current CoW execution lane.",
          "Operator and user approvals stay explicit; no autonomous execution is implied.",
        ],
      };
    },
  };
}
