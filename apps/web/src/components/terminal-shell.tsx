"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { RouteId, TerminalChromeProps } from "@/lib/contracts";
import { getSmartAccountPanelData } from "@/lib/data-source";
import {
  describeRebalanceState,
  getManifestExplanationBundle,
  getRebalanceOrchestration,
  getRecommendationExplanationBundle,
} from "@/lib/portfolio-ui";
import { buildManifestContractBundle } from "@/lib/shared-contract-adapter";

import { BottomBlotter } from "@/components/bottom-blotter";
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
  const contracts = buildManifestContractBundle(selectedManifest);
  const bundle = chrome.currentRoute === "onboarding"
    ? getRecommendationExplanationBundle(selectedManifest)
    : getManifestExplanationBundle(selectedManifest);
  const orchestration = getRebalanceOrchestration(selectedManifest);
  const panel = selectedManifest.market_intelligence;

  return (
    <aside className="right-rail">
      <SmartAccountPanel account={account} />

      <section className="rail-card rail-card-condensed">
        <div className="panel-heading panel-heading-tight">
          <span className="section-kicker">{selectedManifest.frontend.title}</span>
          <p>{bundle.whatThisPortfolioDoes}</p>
        </div>
        <div className="info-stack">
          <div>
            <span>Status</span>
            <strong>{contracts.snapshot.truthState === "preview" ? "Preview — you keep full custody" : contracts.snapshot.truthState}</strong>
          </div>
          <div>
            <span>Rebalancing</span>
            <strong>{describeRebalanceState(orchestration)} · user-approved review</strong>
          </div>
          <div>
            <span>Network</span>
            <strong>{selectedManifest.market_intelligence.routeState.chain} · {selectedManifest.market_intelligence.routeState.primaryVenue}</strong>
          </div>
        </div>
        {panel.whatChanged.length > 0 && (
          <div className="panel-list">
            <span className="section-kicker">What changed</span>
            <ul>
              {panel.whatChanged.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {panel.drivers.length > 0 && (
          <div className="token-row">
            {panel.drivers.slice(0, 2).map((d) => (
              <span className="token-pill" key={d.label}>{d.label}: {d.value}</span>
            ))}
          </div>
        )}
      </section>
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
