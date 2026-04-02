import { describe, expect, it } from "vitest";

import { deriveWalletState } from "@/components/wallet-state";

describe("deriveWalletState", () => {
  it("keeps manual signing wallet-first and automation fail-closed before smart-account bootstrap", () => {
    const state = deriveWalletState({
      enabled: true,
      ready: true,
      authenticated: true,
      user: {
        wallet: {
          address: "0x1111111111111111111111111111111111111111",
        },
        linkedAccounts: [
          {
            type: "wallet",
            address: "0x1111111111111111111111111111111111111111",
            chainType: "ethereum",
            walletClientType: "metamask",
          },
        ],
      },
      wallets: [],
    });

    expect(state.manualSignerAddress).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(state.policyAccountAddress).toBeNull();
    expect(state.executionDestinationAddress).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(state.embeddedWallet.status).toBe("creating");
    expect(state.smartAccount.status).toBe("not_started");
    expect(state.automationReadiness).toBe("smart_account_required");
  });

  it("marks smart-account bootstrap pending once the embedded wallet is ready", () => {
    const state = deriveWalletState({
      enabled: true,
      ready: true,
      authenticated: true,
      user: {
        wallet: {
          address: "0x1111111111111111111111111111111111111111",
        },
        linkedAccounts: [
          {
            type: "wallet",
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            chainType: "ethereum",
            walletClientType: "privy",
          },
        ],
      },
      wallets: [
        {
          address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          walletClientType: "privy",
        },
      ],
    });

    expect(state.manualSignerAddress).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(state.policyAccountAddress).toBeNull();
    expect(state.executionDestinationAddress).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(state.embeddedWallet.status).toBe("ready");
    expect(state.smartAccount.status).toBe("creating");
    expect(state.automationReadiness).toBe("smart_account_pending");
  });

  it("surfaces the smart account as policy and execution destination once ready", () => {
    const state = deriveWalletState({
      enabled: true,
      ready: true,
      authenticated: true,
      user: {
        wallet: {
          address: "0x1111111111111111111111111111111111111111",
        },
        smartWallet: {
          address: "0x2222222222222222222222222222222222222222",
          smartWalletType: "safe",
        },
        linkedAccounts: [
          {
            type: "wallet",
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            chainType: "ethereum",
            walletClientType: "privy",
          },
          {
            type: "smart_wallet",
            address: "0x2222222222222222222222222222222222222222",
          },
        ],
      },
      wallets: [
        {
          address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          walletClientType: "privy",
        },
      ],
    });

    expect(state.manualSignerAddress).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(state.policyAccountAddress).toBe(
      "0x2222222222222222222222222222222222222222",
    );
    expect(state.executionDestinationAddress).toBe(
      "0x2222222222222222222222222222222222222222",
    );
    expect(state.automationReadiness).toBe("ready");
    expect(state.smartAccount.status).toBe("ready");
  });
});
