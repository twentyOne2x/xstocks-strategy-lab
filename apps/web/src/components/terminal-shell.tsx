"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { RouteId, TerminalChromeProps } from "@/lib/contracts";
import { getSmartAccountPanelData } from "@/lib/data-source";

import { BottomBlotter } from "@/components/bottom-blotter";
import { RebalanceControlPanel } from "@/components/rebalance-control-panel";
import { SmartAccountPanel } from "@/components/smart-account-panel";

const routeLabels: Array<{ id: RouteId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "onboarding", label: "Onboarding" },
  { id: "comparison", label: "Compare" },
  { id: "detail", label: "Detail" },
  { id: "activation", label: "Deposit" },
  { id: "activity", label: "Activity" },
];

function hrefForRoute(routeId: RouteId, manifestSlug: string) {
  switch (routeId) {
    case "home": return "/";
    case "onboarding": return "/onboarding";
    case "comparison": return "/workspace/comparison";
    case "detail": return `/workspace/detail/${manifestSlug}`;
    case "activation": return `/activate/${manifestSlug}`;
    case "activity": return "/activity";
  }
}

function RightRail({ chrome }: { chrome: TerminalChromeProps }) {
  const { selectedManifest } = chrome;
  const account = getSmartAccountPanelData(selectedManifest);

  return (
    <aside className="right-rail">
      <RebalanceControlPanel manifest={selectedManifest} />
      <SmartAccountPanel account={account} />
    </aside>
  );
}

export function TerminalShell({
  children,
  ...chrome
}: TerminalChromeProps & { children: ReactNode }) {
  return (
    <main className="app-frame">
      <header className="topbar">
        <Link className="brand-cluster" href="/">
          <div className="brand-mark">24-7</div>
          <div>
            <span className="section-kicker">24-7 Markets</span>
            <h1>Powered by xStocks</h1>
          </div>
        </Link>
        <div className="topbar-side">
          <span className="preview-chip">Preview</span>
          <nav className="topnav" aria-label="Navigation">
            {routeLabels.map((route) => (
              <Link
                className={`nav-link ${chrome.currentRoute === route.id ? "nav-link-active" : ""}`}
                href={hrefForRoute(route.id, chrome.selectedManifest.slug)}
                key={route.id}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="shell-grid">
        <section className="workspace-main">{children}</section>
        <RightRail chrome={chrome} />
      </div>

      <BottomBlotter
        blotter={chrome.blotter}
        focusManifestSlug={chrome.selectedManifest.slug}
      />
    </main>
  );
}
