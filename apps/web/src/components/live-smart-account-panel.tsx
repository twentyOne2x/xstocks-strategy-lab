"use client";

import { useEffect, useState } from "react";

import { usePrivyRuntime } from "@/components/privy-provider";
import { SmartAccountPanel } from "@/components/smart-account-panel";
import { useWalletState } from "@/components/wallet-connect-button";
import { adaptExecutionPlanToSmartAccount } from "@/lib/api-adapter";
import {
  DEFAULT_MANUAL_NOTIONAL_USD,
  fetchActivationPreview,
} from "@/lib/api-client";
import type {
  PromotedManifest,
  SmartAccountPanelData,
} from "@/lib/contracts";
import { getSmartAccountPanelData } from "@/lib/data-source";

export function LiveSmartAccountPanel({
  manifest,
}: {
  manifest: PromotedManifest;
}) {
  const walletState = useWalletState();
  const { authenticated, getAccessToken, getIdentityToken } = usePrivyRuntime();
  const [account, setAccount] = useState<SmartAccountPanelData>(() =>
    getSmartAccountPanelData(manifest),
  );

  useEffect(() => {
    setAccount(getSmartAccountPanelData(manifest));
  }, [manifest]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAccountTruth() {
      if (!authenticated) {
        if (!cancelled) {
          setAccount(getSmartAccountPanelData(manifest));
        }
        return;
      }

      const [accessToken, identityToken] = await Promise.all([
        getAccessToken().catch(() => null),
        getIdentityToken().catch(() => null),
      ]);
      const preview = await fetchActivationPreview(
        manifest.slot_id,
        DEFAULT_MANUAL_NOTIONAL_USD,
        walletState.connected
          ? {
              connected: true,
              walletAddress: walletState.walletAddress,
              embeddedWallet: {
                status: walletState.embeddedWallet.status,
                address: walletState.embeddedWallet.address,
                providerId: "privy",
              },
              smartAccount: {
                status: walletState.smartAccount.status,
                address: walletState.smartAccount.address,
                providerId: "privy",
              },
            }
          : undefined,
        {
          accessToken,
          identityToken,
        },
      );

      if (cancelled) {
        return;
      }

      if (preview?.executionPlan) {
        setAccount(adaptExecutionPlanToSmartAccount(preview.executionPlan, manifest));
        return;
      }

      setAccount(getSmartAccountPanelData(manifest));
    }

    void refreshAccountTruth();

    return () => {
      cancelled = true;
    };
  }, [
    authenticated,
    getAccessToken,
    getIdentityToken,
    manifest,
    walletState.connected,
    walletState.walletAddress,
    walletState.embeddedWallet.address,
    walletState.embeddedWallet.status,
    walletState.smartAccount.address,
    walletState.smartAccount.status,
  ]);

  return <SmartAccountPanel account={account} />;
}
