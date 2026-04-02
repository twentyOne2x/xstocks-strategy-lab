"use client";

import {
  getIdentityToken as fetchIdentityToken,
  PrivyProvider as BasePrivyProvider,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { createContext, useContext, type ReactNode } from "react";
import { mainnet } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export type PrivyLinkedAccountLike = {
  type?: string;
  address?: string;
  walletClientType?: string;
  wallet_client_type?: string;
  chainType?: string;
  chain_type?: string;
};

export type PrivyConnectedWalletLike = {
  address?: string;
  walletClientType?: string;
};

type PrivyUserLike = {
  wallet?: {
    address?: string | null;
  } | null;
  email?: {
    address?: string | null;
  } | null;
  linkedAccounts?: unknown[] | null;
  linked_accounts?: unknown[] | null;
} | null;

type PrivyRuntimeContextValue = {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  user: PrivyUserLike;
  wallets: PrivyConnectedWalletLike[];
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  getIdentityToken: () => Promise<string | null>;
};

const disabledPrivyRuntimeContextValue: PrivyRuntimeContextValue = {
  enabled: false,
  ready: true,
  authenticated: false,
  user: null,
  wallets: [],
  login: () => undefined,
  logout: () => undefined,
  getAccessToken: async () => null,
  getIdentityToken: async () => null,
};

const PrivyRuntimeContext = createContext<PrivyRuntimeContextValue>(
  disabledPrivyRuntimeContextValue,
);

function PrivyRuntimeBridge({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const { wallets = [] } = useWallets() as {
    wallets?: PrivyConnectedWalletLike[];
  };

  return (
    <PrivyRuntimeContext.Provider
      value={{
        enabled: true,
        ready,
        authenticated,
        user: (user as PrivyUserLike) ?? null,
        wallets,
        login,
        logout,
        getAccessToken: async () => (await getAccessToken()) ?? null,
        getIdentityToken: async () => (await fetchIdentityToken()) ?? null,
      }}
    >
      {children}
    </PrivyRuntimeContext.Provider>
  );
}

export function usePrivyRuntime() {
  return useContext(PrivyRuntimeContext);
}

export function PrivyProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return (
      <PrivyRuntimeContext.Provider value={disabledPrivyRuntimeContextValue}>
        {children}
      </PrivyRuntimeContext.Provider>
    );
  }

  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#1FD59A",
        },
        loginMethods: ["email", "wallet"],
        defaultChain: mainnet,
        supportedChains: [mainnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <SmartWalletsProvider>
        <PrivyRuntimeBridge>{children}</PrivyRuntimeBridge>
      </SmartWalletsProvider>
    </BasePrivyProvider>
  );
}
