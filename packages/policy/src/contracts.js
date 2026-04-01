export const ROUTE_TRUTH_LABEL = Object.freeze({
  LIVE: "live",
  PREVIEW: "preview",
  BLOCKED: "blocked",
  MENTOR_CONFIRMED: "mentor_confirmed",
  UNVERIFIED: "unverified",
});

export const EXECUTION_STATE = Object.freeze({
  READY: "ready",
  WALLET_REQUIRED: "wallet_required",
  FUNDING_REQUIRED: "funding_required",
  SMART_ACCOUNT_REQUIRED: "smart_account_required",
  SMART_ACCOUNT_PENDING: "smart_account_pending",
  BLOCKED: "blocked",
});

export const EXECUTION_ELIGIBILITY = Object.freeze({
  EXECUTABLE: "executable",
  PREVIEW_ONLY: "preview_only",
  BLOCKED: "blocked",
});

export const SMART_ACCOUNT_READINESS = Object.freeze({
  NOT_REQUIRED: "not_required",
  WALLET_REQUIRED: "wallet_required",
  SMART_ACCOUNT_REQUIRED: "smart_account_required",
  SMART_ACCOUNT_PENDING: "smart_account_pending",
  READY: "ready",
});

export const SMART_ACCOUNT_BOOTSTRAP_STATE = Object.freeze({
  WALLET_REQUIRED: "wallet_required",
  EMBEDDED_WALLET_PENDING: "embedded_wallet_pending",
  SMART_ACCOUNT_REQUIRED: "smart_account_required",
  SMART_ACCOUNT_PENDING: "smart_account_pending",
  READY: "ready",
  BLOCKED: "blocked",
});

export const FUNDING_READINESS = Object.freeze({
  DESTINATION_REQUIRED: "destination_required",
  FUNDING_REQUIRED: "funding_required",
  FUNDED: "funded",
  BLOCKED: "blocked",
});

export const VERIFICATION_TIER = Object.freeze({
  PUBLIC_VERIFIED: "public_verified",
  MENTOR_REPORTED: "mentor_reported",
  UNVERIFIED: "unverified",
});

export function normalizeUsd(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Number(parsed.toFixed(2)));
}

export function normalizeWalletState(walletState = {}) {
  const embeddedWallet =
    walletState.embeddedWallet ?? walletState.embedded_wallet ?? {};
  const smartAccount = walletState.smartAccount ?? walletState.smart_account ?? {};

  return {
    walletConnected: Boolean(
      walletState.walletConnected ?? walletState.wallet_connected,
    ),
    walletAddress: walletState.walletAddress ?? walletState.wallet_address ?? null,
    fundedNotionalUsd: normalizeUsd(
      walletState.fundedNotionalUsd ?? walletState.funded_notional_usd,
      0,
    ),
    fundingSource: walletState.fundingSource ?? walletState.funding_source ?? null,
    embeddedWallet: {
      providerId:
        embeddedWallet.providerId ??
        embeddedWallet.provider_id ??
        "privy_embedded_wallet",
      status:
        embeddedWallet.status ??
        (walletState.walletConnected ?? walletState.wallet_connected
          ? "ready"
          : "not_created"),
      address:
        embeddedWallet.address ??
        walletState.walletAddress ??
        walletState.wallet_address ??
        null,
    },
    smartAccount: {
      providerId: smartAccount.providerId ?? smartAccount.provider_id ?? "privy_embedded",
      status: smartAccount.status ?? "not_created",
      address: smartAccount.address ?? null,
      implementation:
        smartAccount.implementation ??
        smartAccount.smartWalletType ??
        smartAccount.smart_wallet_type ??
        "privy_smart_wallet",
      chain: smartAccount.chain ?? "ethereum",
    },
  };
}
