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
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mainnet } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const ACCESS_TOKEN_CACHE_TTL_MS = 30_000;
const ACCESS_TOKEN_BACKOFF_MS = 10_000;
const IDENTITY_TOKEN_CACHE_TTL_MS = 30_000;
const IDENTITY_TOKEN_BACKOFF_MS = 10_000;

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
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken: fetchAccessToken,
  } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets = [] } = useWallets() as {
    wallets?: PrivyConnectedWalletLike[];
  };
  const accessTokenFetcherRef = useRef(fetchAccessToken);
  const accessTokenCacheRef = useRef<{
    token: string | null;
    expiresAt: number;
  }>({
    token: null,
    expiresAt: 0,
  });
  const accessTokenInFlightRef = useRef<Promise<string | null> | null>(null);
  const accessTokenBackoffUntilRef = useRef(0);
  const identityTokenCacheRef = useRef<{
    token: string | null;
    expiresAt: number;
  }>({
    token: null,
    expiresAt: 0,
  });
  const identityTokenInFlightRef = useRef<Promise<string | null> | null>(null);
  const identityTokenBackoffUntilRef = useRef(0);
  const [appConfig, setAppConfig] = useState<PrivyAppConfigLike>(
    disabledPrivyRuntimeContextValue.appConfig,
  );

  useEffect(() => {
    accessTokenFetcherRef.current = fetchAccessToken;
  }, [fetchAccessToken]);

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

  useEffect(() => {
    if (authenticated) {
      return;
    }

    accessTokenCacheRef.current = {
      token: null,
      expiresAt: 0,
    };
    accessTokenInFlightRef.current = null;
    accessTokenBackoffUntilRef.current = 0;
    identityTokenCacheRef.current = {
      token: null,
      expiresAt: 0,
    };
    identityTokenInFlightRef.current = null;
    identityTokenBackoffUntilRef.current = 0;
  }, [authenticated]);

  const getAccessTokenWithGuard = useCallback(async () => {
    if (!authenticated) {
      return null;
    }

    const nowMs = Date.now();
    const cachedToken = accessTokenCacheRef.current;

    if (cachedToken.token && cachedToken.expiresAt > nowMs) {
      return cachedToken.token;
    }

    if (accessTokenInFlightRef.current) {
      return accessTokenInFlightRef.current;
    }

    if (accessTokenBackoffUntilRef.current > nowMs) {
      return cachedToken.token;
    }

    const pendingAccessToken = (async () => {
      try {
        const nextToken = (await accessTokenFetcherRef.current()) ?? null;

        accessTokenCacheRef.current = {
          token: nextToken,
          expiresAt: nextToken ? Date.now() + ACCESS_TOKEN_CACHE_TTL_MS : 0,
        };
        accessTokenBackoffUntilRef.current = 0;

        return nextToken;
      } catch {
        accessTokenBackoffUntilRef.current = Date.now() + ACCESS_TOKEN_BACKOFF_MS;
        return accessTokenCacheRef.current.token;
      } finally {
        accessTokenInFlightRef.current = null;
      }
    })();

    accessTokenInFlightRef.current = pendingAccessToken;

    return pendingAccessToken;
  }, [authenticated]);

  const getIdentityTokenWithGuard = useCallback(async () => {
    if (!authenticated) {
      return null;
    }

    const nowMs = Date.now();
    const cachedToken = identityTokenCacheRef.current;

    if (cachedToken.token && cachedToken.expiresAt > nowMs) {
      return cachedToken.token;
    }

    if (identityTokenInFlightRef.current) {
      return identityTokenInFlightRef.current;
    }

    if (identityTokenBackoffUntilRef.current > nowMs) {
      return cachedToken.token;
    }

    const pendingIdentityToken = (async () => {
      try {
        const nextToken = (await fetchIdentityToken()) ?? null;

        identityTokenCacheRef.current = {
          token: nextToken,
          expiresAt: nextToken ? Date.now() + IDENTITY_TOKEN_CACHE_TTL_MS : 0,
        };
        identityTokenBackoffUntilRef.current = 0;

        return nextToken;
      } catch {
        identityTokenBackoffUntilRef.current =
          Date.now() + IDENTITY_TOKEN_BACKOFF_MS;
        return identityTokenCacheRef.current.token;
      } finally {
        identityTokenInFlightRef.current = null;
      }
    })();

    identityTokenInFlightRef.current = pendingIdentityToken;

    return pendingIdentityToken;
  }, [authenticated]);

  const createEmbeddedWallet = useCallback(async () => {
    try {
      const wallet = await createWallet();
      return wallet?.address ?? null;
    } catch {
      return null;
    }
  }, [createWallet]);

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
        getAccessToken: getAccessTokenWithGuard,
        getIdentityToken: getIdentityTokenWithGuard,
        createEmbeddedWallet,
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
