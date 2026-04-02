import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  async rewrites() {
    return {
      beforeFiles: [
        // docs.24-7.markets → /docs
        {
          source: "/:path*",
          has: [{ type: "host", value: "docs.24-7.markets" }],
          destination: "/docs/:path*",
        },
        // slides.24-7.markets → /slides
        {
          source: "/:path*",
          has: [{ type: "host", value: "slides.24-7.markets" }],
          destination: "/slides/:path*",
        },
        // xstocks.24-7.markets → /slides (the pitch deck)
        {
          source: "/:path*",
          has: [{ type: "host", value: "xstocks.24-7.markets" }],
          destination: "/slides/:path*",
        },
      ],
    };
  },
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
