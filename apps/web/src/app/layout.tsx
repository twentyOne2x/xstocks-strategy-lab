import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { PrivyProvider } from "@/components/privy-provider";

import "./globals.css";

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "24-7 MARKETS — Tokenized equity portfolios powered by xStocks",
  description:
    "Find the xStocks portfolio that fits you. Answer a few questions, preview every holding, then connect and fund when ready.",
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://24-7.markets"),
  openGraph: {
    title: "24-7 MARKETS",
    description: "Tokenized equity portfolios powered by xStocks",
    siteName: "24-7 MARKETS",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet" />
      </head>
      <body className={body.variable}>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
