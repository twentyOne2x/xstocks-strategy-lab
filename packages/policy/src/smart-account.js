import {
  ACCOUNT_SURFACE_KIND,
  SMART_ACCOUNT_BOOTSTRAP_STATE,
  SMART_ACCOUNT_READINESS,
  normalizeWalletState,
} from "./contracts.js";
import { assertPromotedActivationManifest } from "./manifest.js";
import { deriveReadinessWalletRequirements } from "./readiness-policy.js";

function deriveManualSignerSurface(normalizedWalletState) {
  if (normalizedWalletState.embeddedWallet.address) {
    return {
      address: normalizedWalletState.embeddedWallet.address,
      kind: ACCOUNT_SURFACE_KIND.EMBEDDED_WALLET,
    };
  }

  if (normalizedWalletState.walletAddress) {
    return {
      address: normalizedWalletState.walletAddress,
      kind: ACCOUNT_SURFACE_KIND.LINKED_WALLET,
    };
  }

  return {
    address: null,
    kind: ACCOUNT_SURFACE_KIND.NONE,
  };
}

function deriveAutomationReadiness(normalizedWalletState) {
  if (!normalizedWalletState.walletConnected) {
    return SMART_ACCOUNT_READINESS.WALLET_REQUIRED;
  }

  if (
    normalizedWalletState.embeddedWallet.status === "pending" ||
    normalizedWalletState.embeddedWallet.status === "creating"
  ) {
    return SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING;
  }

  if (
    normalizedWalletState.smartAccount.status === "ready" &&
    normalizedWalletState.smartAccount.address
  ) {
    return SMART_ACCOUNT_READINESS.READY;
  }

  if (
    normalizedWalletState.smartAccount.status === "pending" ||
    normalizedWalletState.smartAccount.status === "creating"
  ) {
    return SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING;
  }

  return SMART_ACCOUNT_READINESS.SMART_ACCOUNT_REQUIRED;
}

function deriveBootstrapState({
  manualRequiresSmartAccount,
  normalizedWalletState,
}) {
  if (!normalizedWalletState.walletConnected) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.WALLET_REQUIRED;
  }

  if (
    normalizedWalletState.embeddedWallet.status === "pending" ||
    normalizedWalletState.embeddedWallet.status === "creating"
  ) {
    return SMART_ACCOUNT_BOOTSTRAP_STATE.EMBEDDED_WALLET_PENDING;
  }

  if (!manualRequiresSmartAccount) {
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

function deriveBridgeState({
  walletRequirements,
  normalizedWalletState,
}) {
  const manualSignerSurface = deriveManualSignerSurface(normalizedWalletState);
  const policyAccountAddress =
    normalizedWalletState.smartAccount.status === "ready" &&
    normalizedWalletState.smartAccount.address
      ? normalizedWalletState.smartAccount.address
      : null;
  const supportsDestination =
    walletRequirements.supportsSeparateExecutionDestination === true;
  const executionDestinationAddress =
    supportsDestination && policyAccountAddress
      ? policyAccountAddress
      : manualSignerSurface.address;
  const executionDestinationKind =
    supportsDestination && policyAccountAddress
      ? ACCOUNT_SURFACE_KIND.SMART_ACCOUNT
      : manualSignerSurface.kind;

  return {
    manualSignerAddress: manualSignerSurface.address,
    manualSignerKind: manualSignerSurface.kind,
    policyAccountAddress,
    executionDestinationAddress,
    executionDestinationKind,
    supportsSeparateExecutionDestination: supportsDestination,
    manualSigningMode: walletRequirements.manualSigningMode,
    automationAccountMode: walletRequirements.automationAccountMode,
    venueSigningMode: walletRequirements.venueSigningMode,
    notes: [
      "Manual venue signing stays wallet-first until AA-native venue signing is separately proven.",
      policyAccountAddress
        ? "The Privy smart account is the canonical policy and automation account."
        : "Automation remains fail-closed until the Privy smart account is ready.",
      supportsDestination
        ? policyAccountAddress
          ? "The current venue path supports a separate execution destination, so settlement can target the smart account while manual signing stays wallet-first."
          : "The current venue path supports a separate execution destination, but it still falls back to the manual signer until the smart account is ready."
        : "The current venue path does not yet prove a separate execution-destination surface, so settlement stays on the manual signer.",
    ],
  };
}

function createInspectionResult({
  providerId,
  manifest,
  implementation,
  normalizedWalletState,
  readinessWalletRequirements,
  readiness,
  automationReadiness,
  status,
  bootstrapState,
  bootstrapNotes,
}) {
  const bridgeState = deriveBridgeState({
    walletRequirements: readinessWalletRequirements,
    normalizedWalletState,
  });

  return {
    readiness,
    automationReadiness,
    providerId,
    status,
    address: normalizedWalletState.smartAccount.address ?? null,
    manualSigningMode: readinessWalletRequirements.manualSigningMode,
    automationAccountMode: readinessWalletRequirements.automationAccountMode,
    venueSigningMode: readinessWalletRequirements.venueSigningMode,
    bridgeState,
    bootstrap: {
      state: bootstrapState,
      chain: manifest.chain,
      implementation,
      signerAddress: bridgeState.manualSignerAddress,
      embeddedWalletAddress: normalizedWalletState.embeddedWallet.address,
      smartAccountAddress: normalizedWalletState.smartAccount.address,
      destinationAddress: bridgeState.executionDestinationAddress,
      approvalMode: "user_approved_only",
      paymasterReady: false,
      notes: bootstrapNotes,
    },
  };
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
      const manualRequiresSmartAccount =
        readinessWalletRequirements.requiresSmartAccount !== false;
      const automationReadiness =
        deriveAutomationReadiness(normalizedWalletState);
      const bootstrapState = deriveBootstrapState({
        manualRequiresSmartAccount,
        normalizedWalletState,
      });

      if (!manualRequiresSmartAccount) {
        return createInspectionResult({
          providerId,
          manifest,
          implementation,
          normalizedWalletState,
          readinessWalletRequirements,
          readiness: SMART_ACCOUNT_READINESS.NOT_REQUIRED,
          automationReadiness,
          status: "not_required",
          bootstrapState: SMART_ACCOUNT_BOOTSTRAP_STATE.READY,
          bootstrapNotes: [
            "Current manual venue signing remains wallet-first for this manifest.",
            automationReadiness === SMART_ACCOUNT_READINESS.READY
              ? "The Privy smart wallet is also ready as the canonical automation and destination account."
              : "Automation remains fail-closed until the Privy smart wallet is ready.",
          ],
        });
      }

      if (!normalizedWalletState.walletConnected) {
        return createInspectionResult({
          providerId,
          manifest,
          implementation,
          normalizedWalletState,
          readinessWalletRequirements,
          readiness: SMART_ACCOUNT_READINESS.WALLET_REQUIRED,
          automationReadiness,
          status: "wallet_required",
          bootstrapState: SMART_ACCOUNT_BOOTSTRAP_STATE.WALLET_REQUIRED,
          bootstrapNotes: [
            "Authenticate or connect a wallet before creating the Privy smart wallet.",
          ],
        });
      }

      if (
        bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.EMBEDDED_WALLET_PENDING
      ) {
        return createInspectionResult({
          providerId,
          manifest,
          implementation,
          normalizedWalletState,
          readinessWalletRequirements,
          readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING,
          automationReadiness,
          status: "embedded_wallet_pending",
          bootstrapState,
          bootstrapNotes: [
            "Privy embedded wallet creation is still pending.",
          ],
        });
      }

      if (bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.READY) {
        return createInspectionResult({
          providerId,
          manifest,
          implementation,
          normalizedWalletState,
          readinessWalletRequirements,
          readiness: SMART_ACCOUNT_READINESS.READY,
          automationReadiness,
          status: "ready",
          bootstrapState,
          bootstrapNotes: [
            `Privy smart wallet is ready for promoted manifest ${manifest.manifestId}.`,
          ],
        });
      }

      if (
        bootstrapState === SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_PENDING
      ) {
        return createInspectionResult({
          providerId,
          manifest,
          implementation,
          normalizedWalletState,
          readinessWalletRequirements,
          readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_PENDING,
          automationReadiness,
          status: "smart_account_pending",
          bootstrapState,
          bootstrapNotes: [
            "Privy smart wallet bootstrap has started but is not ready yet.",
          ],
        });
      }

      return createInspectionResult({
        providerId,
        manifest,
        implementation,
        normalizedWalletState,
        readinessWalletRequirements,
        readiness: SMART_ACCOUNT_READINESS.SMART_ACCOUNT_REQUIRED,
        automationReadiness,
        status: "smart_account_required",
        bootstrapState: SMART_ACCOUNT_BOOTSTRAP_STATE.SMART_ACCOUNT_REQUIRED,
        bootstrapNotes: [
          "Create the Privy smart wallet before smart-account-first automation can become ready.",
        ],
      });
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
          "Funding remains provider-agnostic and should target the current manual signer or smart-wallet destination address through Privy-supported methods.",
        walletConnectionLate: true,
        notes: [
          `Smart-account review is scoped to promoted manifest ${manifest.manifestId}.`,
          readinessWalletRequirements.requiresSmartAccount
            ? "Privy smart wallet bootstrap remains required before the manual execution lane can become live."
            : "Manual execution remains wallet-first while automation still requires the Privy smart wallet.",
          readinessWalletRequirements.minFundingUsd > 0
            ? `Minimum funding readiness remains ${readinessWalletRequirements.minFundingUsd} USD for this manifest.`
            : "Funding readiness follows the user-requested notional for the current venue-routed lane.",
          `Manual signing mode remains ${readinessWalletRequirements.manualSigningMode}.`,
          `Automation account mode remains ${readinessWalletRequirements.automationAccountMode}.`,
          `Venue signing mode remains ${readinessWalletRequirements.venueSigningMode}.`,
          "Operator and user approvals stay explicit; no autonomous execution is implied.",
        ],
      };
    },
  };
}
