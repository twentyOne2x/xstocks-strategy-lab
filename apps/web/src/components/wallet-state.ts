import type {
  PrivyConnectedWalletLike,
  PrivyLinkedAccountLike,
  PrivyUserLike,
} from "@/components/privy-provider";

export type DerivedWalletState = ReturnType<typeof deriveWalletState>;

function getLinkedAccounts(user: PrivyUserLike): PrivyLinkedAccountLike[] {
  if (!user || typeof user !== "object") {
    return [];
  }

  const linkedAccounts =
    user.linkedAccounts ??
    user.linked_accounts ??
    [];

  return Array.isArray(linkedAccounts)
    ? (linkedAccounts as PrivyLinkedAccountLike[])
    : [];
}

function findFirstLinkedWalletAddress(linkedAccounts: PrivyLinkedAccountLike[]) {
  return (
    linkedAccounts.find(
      (account) =>
        account.type === "wallet" &&
        account.address &&
        (account.chainType === "ethereum" ||
          account.chain_type === "ethereum" ||
          account.chainType === undefined),
    )?.address ?? null
  );
}

function findEmbeddedWalletAddress(
  wallets: PrivyConnectedWalletLike[],
  linkedAccounts: PrivyLinkedAccountLike[],
) {
  const connectedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy" && wallet.address,
  );

  if (connectedWallet?.address) {
    return connectedWallet.address;
  }

  const linkedWallet = linkedAccounts.find(
    (account) =>
      account.type === "wallet" &&
      (account.walletClientType === "privy" ||
        account.wallet_client_type === "privy") &&
      (account.chainType === "ethereum" ||
        account.chain_type === "ethereum" ||
        account.chainType === undefined),
  );

  return linkedWallet?.address ?? null;
}

function findSmartAccountAddress(
  user: PrivyUserLike,
  linkedAccounts: PrivyLinkedAccountLike[],
) {
  if (user?.smartWallet?.address) {
    return user.smartWallet.address;
  }

  return (
    linkedAccounts.find(
      (account) => account.type === "smart_wallet" && account.address,
    )?.address ?? null
  );
}

export function shortAddress(value: string | null) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not ready";
}

export function deriveWalletState({
  enabled,
  ready,
  authenticated,
  user,
  wallets,
}: {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  user: PrivyUserLike;
  wallets: PrivyConnectedWalletLike[];
}) {
  const linkedAccounts = authenticated ? getLinkedAccounts(user) : [];
  const walletAddress = authenticated
    ? user?.wallet?.address ?? findFirstLinkedWalletAddress(linkedAccounts)
    : null;
  const embeddedWalletAddress = authenticated
    ? findEmbeddedWalletAddress(wallets, linkedAccounts)
    : null;
  const smartAccountAddress = authenticated
    ? findSmartAccountAddress(user, linkedAccounts)
    : null;
  const manualSignerAddress = embeddedWalletAddress ?? walletAddress ?? null;
  const needsEmbeddedWalletBootstrap =
    authenticated && !embeddedWalletAddress;
  const needsSmartAccountBootstrap =
    authenticated && Boolean(embeddedWalletAddress) && !smartAccountAddress;
  const embeddedWalletStatus = !authenticated
    ? "not_created"
    : embeddedWalletAddress
      ? "ready"
      : "creating";
  const smartAccountStatus = !authenticated
    ? "not_started"
    : smartAccountAddress
      ? "ready"
      : needsSmartAccountBootstrap
        ? "creating"
        : "not_started";
  const automationReadiness = !authenticated || !manualSignerAddress
    ? "wallet_required"
    : smartAccountAddress
      ? "ready"
      : embeddedWalletAddress
        ? "smart_account_pending"
        : "smart_account_required";
  const automationBlocker = !authenticated || !manualSignerAddress
    ? "Connect a wallet to start the hosted bootstrap path."
    : !embeddedWalletAddress
      ? "Privy has not finished creating the embedded wallet yet."
      : !smartAccountAddress
        ? "Privy has not finished linking the Ethereum smart account yet."
        : null;

  return {
    enabled,
    ready,
    connected: authenticated,
    walletAddress,
    embeddedWallet: {
      status: embeddedWalletStatus,
      address: embeddedWalletAddress,
    },
    smartAccount: {
      status: smartAccountStatus,
      address: smartAccountAddress,
    },
    needsEmbeddedWalletBootstrap,
    needsSmartAccountBootstrap,
    manualSignerAddress,
    policyAccountAddress: smartAccountAddress,
    executionDestinationAddress: smartAccountAddress ?? manualSignerAddress,
    automationReadiness,
    automationBlocker,
    manualSigningMode: "wallet_first",
    automationAccountMode: "smart_account_required",
    venueSigningMode: "wallet_signer_manual_only",
  };
}
