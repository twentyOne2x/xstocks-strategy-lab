"use client";

import { useState } from "react";

import type { BlotterData } from "@/lib/contracts";

type BlotterTab = "positions" | "history" | "rebalancing" | "activity";

const stateTooltips: Record<string, string> = {
  active: "This position is live and tracking the portfolio strategy.",
  paused: "Temporarily paused. No trades will execute until resumed.",
  watch: "Being monitored for potential changes.",
  view_ready: "Preview is ready. Review before funding.",
  blocked: "Action required before this can proceed.",
  funding_required: "Deposit USDC to activate.",
  settled: "Trade completed and settled on-chain.",
  pending: "Waiting for confirmation.",
};

const tabLabels: Array<{ id: BlotterTab; label: string }> = [
  { id: "positions", label: "Positions" },
  { id: "history", label: "History" },
  { id: "rebalancing", label: "Rebalancing" },
  { id: "activity", label: "Activity" },
];

export function BottomBlotter({
  blotter,
  focusManifestSlug,
}: {
  blotter: BlotterData;
  focusManifestSlug: string;
}) {
  const [activeTab, setActiveTab] = useState<BlotterTab>("positions");

  return (
    <section className="blotter">
      <div className="blotter-header">
        <div>
          <span className="section-kicker">Portfolio ledger</span>
          <p className="blotter-note">Preview data until deposit.</p>
        </div>
        <div className="blotter-tabs" role="tablist">
          {tabLabels.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`blotter-tab ${activeTab === tab.id ? "blotter-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "positions" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Symbol</th>
              <th>Role</th>
              <th>Exposure</th>
              <th>Route</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {blotter.positions.map((row) => (
              <tr key={row.id}>
                <td><span className={`status-pill status-pill-${row.state}`} title={stateTooltips[row.state] ?? ""}>{row.state}</span></td>
                <td>{row.symbol}</td>
                <td>{row.sleeve}</td>
                <td>{row.exposureUsd}</td>
                <td>{row.route}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "history" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Status</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {blotter.history.map((row) => (
              <tr key={row.id}>
                <td>{row.timestamp}</td>
                <td><span className={`status-pill status-pill-${row.status}`}>{row.status}</span></td>
                <td>{row.type}</td>
                <td>{row.description}</td>
                <td>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "rebalancing" && (
        <div className="rebalance-board">
          {blotter.rebalancing.map((row) => (
            <article
              className={`rebalance-item ${row.manifestSlug === focusManifestSlug ? "rebalance-item-active" : ""}`}
              key={row.id}
            >
              <div className="rebalance-head">
                <div>
                  <span className="section-kicker">{row.strategyTitle}</span>
                  <h3>{row.window}</h3>
                </div>
                <span className={`status-pill status-pill-${row.state}`}>{row.state}</span>
              </div>
              <p>{row.trigger}</p>
              {row.action && <p className="panel-note">{row.action}</p>}
            </article>
          ))}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="timeline-list">
          {blotter.activity.map((event) => (
            <article className="timeline-item" key={event.id}>
              <div className="timeline-meta">
                <span className="timeline-time">{event.time}</span>
                <span className={`status-pill status-pill-${event.state}`}>{event.state}</span>
              </div>
              <div className="timeline-copy">
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                {event.nextAction && event.nextAction !== "No action" && (
                  <p className="panel-note">{event.nextAction}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
