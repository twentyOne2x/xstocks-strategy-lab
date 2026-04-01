import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { PrivyProvider } from "@/components/privy-provider";

import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Equity Terminal — Tokenized equity portfolios powered by xStocks",
  description:
    "Find the xStocks portfolio that fits you. Answer a few questions, preview every holding, then connect and fund when ready.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
