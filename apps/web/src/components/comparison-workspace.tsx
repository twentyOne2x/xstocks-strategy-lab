import Link from "next/link";

import type { ComparisonWorkspaceProps } from "@/lib/contracts";
import { formatCurrency, formatPercent } from "@/lib/data-source";
import { getManifestExplanationBundle } from "@/lib/portfolio-ui";

import { WorkspaceSpotlight } from "@/components/workspace-spotlight";

export function ComparisonWorkspace({ focusManifest, blotter }: ComparisonWorkspaceProps) {
  const bundle = getManifestExplanationBundle(focusManifest);

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
