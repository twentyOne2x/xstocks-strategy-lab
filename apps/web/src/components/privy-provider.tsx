"use client";

import {
  getIdentityToken as fetchIdentityToken,
  PrivyProvider as BasePrivyProvider,
  useCreateWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

export type PrivyAppConfigLike = {
  status: "idle" | "loaded" | "error";
  embeddedWalletCreateOnLogin: string | null;
  smartWalletsEnabled: boolean | null;
};

type PrivySmartWalletLike = {
  address?: string | null;
  smartWalletType?: string | null;
  smartWalletVersion?: string | null;
} | null;

export type PrivyUserLike = {
  wallet?: {
    address?: string | null;
  } | null;
  smartWallet?: PrivySmartWalletLike;
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
  appConfig: PrivyAppConfigLike;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  getIdentityToken: () => Promise<string | null>;
  createEmbeddedWallet: () => Promise<string | null>;
};

type PrivyPublicAppConfigResponse = {
  embedded_wallet_config?: {
    create_on_login?: string | null;
    ethereum?: {
      create_on_login?: string | null;
    } | null;
  } | null;
  smart_wallet_config?: {
    enabled?: boolean | null;
  } | null;
};

const disabledPrivyRuntimeContextValue: PrivyRuntimeContextValue = {
  enabled: false,
  ready: true,
  authenticated: false,
  user: null,
  wallets: [],
  appConfig: {
    status: "idle",
    embeddedWalletCreateOnLogin: null,
    smartWalletsEnabled: null,
  },
  login: () => undefined,
  logout: () => undefined,
  getAccessToken: async () => null,
  getIdentityToken: async () => null,
  createEmbeddedWallet: async () => null,
};

const PrivyRuntimeContext = createContext<PrivyRuntimeContextValue>(
  disabledPrivyRuntimeContextValue,
);

function toRuntimeAppConfig(
  payload: PrivyPublicAppConfigResponse | null,
  status: PrivyAppConfigLike["status"],
): PrivyAppConfigLike {
  return {
    status,
    embeddedWalletCreateOnLogin:
      payload?.embedded_wallet_config?.ethereum?.create_on_login ??
      payload?.embedded_wallet_config?.create_on_login ??
      null,
    smartWalletsEnabled:
      typeof payload?.smart_wallet_config?.enabled === "boolean"
        ? payload.smart_wallet_config.enabled
        : null,
  };
}

function PrivyRuntimeBridge({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets = [] } = useWallets() as {
    wallets?: PrivyConnectedWalletLike[];
  };
  const [appConfig, setAppConfig] = useState<PrivyAppConfigLike>(
    disabledPrivyRuntimeContextValue.appConfig,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAppConfig() {
      try {
        const response = await fetch(
          `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}`,
          {
            headers: {
              Accept: "application/json",
              "privy-app-id": PRIVY_APP_ID,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Privy app config lookup failed with ${response.status}.`);
        }

        const payload =
          (await response.json()) as PrivyPublicAppConfigResponse;

        if (!cancelled) {
          setAppConfig(toRuntimeAppConfig(payload, "loaded"));
        }
      } catch {
        if (!cancelled) {
          setAppConfig(toRuntimeAppConfig(null, "error"));
        }
      }
    }

    void loadAppConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PrivyRuntimeContext.Provider
      value={{
        enabled: true,
        ready,
        authenticated,
        user: (user as PrivyUserLike) ?? null,
        wallets,
        appConfig,
        login,
        logout,
        getAccessToken: async () => (await getAccessToken()) ?? null,
        getIdentityToken: async () => (await fetchIdentityToken()) ?? null,
        createEmbeddedWallet: async () => {
          try {
            const wallet = await createWallet();
            return wallet?.address ?? null;
          } catch {
            return null;
          }
        },
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
            createOnLogin: "all-users",
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
