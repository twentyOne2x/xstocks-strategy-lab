import Link from "next/link";

import type { ComparisonWorkspaceProps } from "@/lib/contracts";
import { formatCurrency, formatPercent } from "@/lib/data-source";
import { getManifestExplanationBundle } from "@/lib/portfolio-ui";

import { WorkspaceSpotlight } from "@/components/workspace-spotlight";

export function ComparisonWorkspace({ focusManifest, blotter }: ComparisonWorkspaceProps) {
  const bundle = getManifestExplanationBundle(focusManifest);
  const selectedComparison =
    focusManifest.comparison.find((entry) => entry.href.endsWith(`/${focusManifest.slug}`))
    ?? focusManifest.comparison[0]
    ?? null;

  return (
    <div className="screen-stack">
      <WorkspaceSpotlight
        manifest={focusManifest}
        blotter={blotter}
        contextLabel="Compare portfolios"
        title="How this portfolio stacks up."
        description={bundle.whatThisPortfolioDoes}
        primaryAction={{
          href: `/workspace/detail/${focusManifest.slug}`,
          label: "View full detail",
        }}
        secondaryAction={{
          href: "/onboarding",
          label: "Retake onboarding",
        }}
      />

      <section className="panel-grid panel-grid-two">
        <article className="panel-card">
          <span className="section-kicker">Why this portfolio leads</span>
          <div className="info-stack">
            <div>
              <span>Promoted view</span>
              <strong>{selectedComparison?.whyItWon ?? bundle.whatThisPortfolioDoes}</strong>
            </div>
            <div>
              <span>Best for</span>
              <strong>{bundle.bestFor}</strong>
            </div>
            <div>
              <span>What changes next</span>
              <strong>{bundle.whatWouldTriggerNextRebalance}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <span className="section-kicker">How to read the replay</span>
          <div className="info-stack">
            <div>
              <span>Replay interpretation</span>
              <strong>{bundle.howToReadReplay}</strong>
            </div>
            <div>
              <span>Construction</span>
              <strong>{bundle.howItIsBuilt}</strong>
            </div>
          </div>
        </article>
      </section>

      {focusManifest.comparison.length > 0 && (
        <section className="panel-card">
          <span className="section-kicker">Other portfolios</span>
          <table className="data-table">
            <thead>
              <tr>
                <th>Portfolio</th>
                <th>End value</th>
                <th>Edge</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {focusManifest.comparison.map((entry) => (
                <tr key={entry.label}>
                  <td>
                    <Link className="table-link" href={entry.href}>
                      {entry.label}
                    </Link>
                    <p className="panel-note">{entry.whyItWon}</p>
                  </td>
                  <td>{formatCurrency(entry.endingValue)}</td>
                  <td>{formatPercent(entry.alphaPct)}</td>
                  <td>{entry.riskLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
