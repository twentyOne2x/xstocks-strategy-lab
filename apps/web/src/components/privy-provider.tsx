"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import type { ReactNode } from "react";
import { mainnet } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function PrivyProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
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
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </BasePrivyProvider>
  );
}
