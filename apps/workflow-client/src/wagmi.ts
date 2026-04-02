import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Workflow Builder",
  // WalletConnect projectId — get yours free at https://cloud.walletconnect.com
  // Using a placeholder; replace with your own for production
  projectId: (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID ?? "workflow-builder-dev",
  chains: [mainnet, sepolia],
});
