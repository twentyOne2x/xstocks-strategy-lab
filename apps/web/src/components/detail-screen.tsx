import type { DetailScreenProps } from "@/lib/contracts";
import {
  describeManualVsScheduledTruth,
  describeNextReviewWindow,
  describeRebalanceState,
  getPrimaryPortfolioComponents,
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
  const primaryComponents = getPrimaryPortfolioComponents(manifest, 5);

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
          <span className="section-kicker">Why this fits</span>
          <div className="info-stack">
            <div>
              <span>What this portfolio does</span>
              <strong>{bundle.whatThisPortfolioDoes}</strong>
            </div>
            <div>
              <span>How it is built</span>
              <strong>{bundle.howItIsBuilt}</strong>
            </div>
            <div>
              <span>Best for</span>
              <strong>{bundle.bestFor}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <span className="section-kicker">Replay and refresh</span>
          <div className="info-stack">
            <div>
              <span>How to read the replay</span>
              <strong>{bundle.howToReadReplay}</strong>
            </div>
            <div>
              <span>What changes</span>
              <strong>{bundle.howItChanges}</strong>
            </div>
            <div>
              <span>What triggers a refresh</span>
              <strong>{bundle.whatWouldTriggerNextRebalance}</strong>
            </div>
            <div>
              <span>Next review window</span>
              <strong>{describeNextReviewWindow(orchestration)}</strong>
            </div>
            <div>
              <span>Rebalancing</span>
              <strong>{describeRebalanceState(orchestration)} · user-approved review</strong>
            </div>
            <div>
              <span>Review ownership</span>
              <strong>{describeManualVsScheduledTruth(orchestration)}</strong>
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

      <section className="panel-grid panel-grid-two">
        <article className="panel-card">
          <span className="section-kicker">Why these holdings are here</span>
          <div className="allocation-stack">
            {primaryComponents.map((component) => (
              <div className="allocation-row" key={component.componentId}>
                <div>
                  <strong>{component.title}</strong>
                  <p>{component.rationale}</p>
                </div>
                <span>{component.exposureLabel}</span>
              </div>
            ))}
          </div>
        </article>

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
      </section>
    </div>
  );
}
