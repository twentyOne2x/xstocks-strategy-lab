import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  webpack: (config) => {
    // Privy smart-wallets imports optional deps that may not resolve
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "permissionless/clients/pimlico": false,
      "permissionless/accounts": false,
      "permissionless/actions/pimlico": false,
    };
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
    ];
    return config;
  },
};

export default nextConfig;
