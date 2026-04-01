import type { DetailScreenProps } from "@/lib/contracts";
import {
  describeRebalanceState,
  getManifestExplanationBundle,
  getPrimaryActionLabel,
  getRebalanceOrchestration,
  isDirectionalPreviewOnly,
} from "@/lib/portfolio-ui";
import { getAssetHref, getCleanRationale, getVenueDisplay } from "@/lib/holdings-display";

import { WorkspaceSpotlight } from "@/components/workspace-spotlight";

export function DetailScreen({ manifest, blotter }: DetailScreenProps) {
  const bundle = getManifestExplanationBundle(manifest);
  const orchestration = getRebalanceOrchestration(manifest);
  const directionalPreviewOnly = isDirectionalPreviewOnly(manifest);

  return (
    <div className="screen-stack">
      <WorkspaceSpotlight
        manifest={manifest}
        blotter={blotter}
        contextLabel="Portfolio detail"
        title={manifest.frontend.title}
        description={bundle.whatThisPortfolioDoes}
        primaryAction={{
          href: `/activate/${manifest.slug}`,
          label: getPrimaryActionLabel(manifest),
        }}
        secondaryAction={{
          href: "/workspace/comparison",
          label: "Compare portfolios",
        }}
      />

      <section className="panel-grid panel-grid-two">
        <article className="panel-card">
          <span className="section-kicker">Holdings</span>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Weight</th>
                <th>Role</th>
                <th>Venue</th>
              </tr>
            </thead>
            <tbody>
              {manifest.allocations.map((row) => {
                const assetHref = getAssetHref(row.symbol);
                const venue = getVenueDisplay(row.venue);
                return (
                  <tr key={`${row.symbol}-${row.sleeve}`}>
                    <td>{assetHref ? <a className="table-link" href={assetHref} target="_blank" rel="noopener noreferrer">{row.symbol}</a> : row.symbol}</td>
                    <td>{row.targetWeight}</td>
                    <td>{getCleanRationale(row.rationale, row.sleeve)}</td>
                    <td>{venue.href ? <a className="table-link" href={venue.href} target="_blank" rel="noopener noreferrer">{venue.label}</a> : venue.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>

        <article className="panel-card">
          <span className="section-kicker">How it works</span>
          <div className="info-stack">
            <div>
              <span>What changes</span>
              <strong>{bundle.howItChanges}</strong>
            </div>
            <div>
              <span>What triggers a refresh</span>
              <strong>{bundle.whatWouldTriggerNextRebalance}</strong>
            </div>
            <div>
              <span>Rebalancing</span>
              <strong>{describeRebalanceState(orchestration)} · Chainlink CRE</strong>
            </div>
            <div>
              <span>Route</span>
              <strong>{manifest.live_state.routeSummary}</strong>
            </div>
            <div>
              <span>Pause behavior</span>
              <strong>{manifest.live_state.pauseRule}</strong>
            </div>
            {directionalPreviewOnly && (
              <div>
                <span>Directional</span>
                <strong>Preview only — you keep full custody</strong>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
