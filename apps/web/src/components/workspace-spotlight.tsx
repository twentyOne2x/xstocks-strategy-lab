import Link from "next/link";

import type { BlotterData, PromotedManifest } from "@/lib/contracts";
import { formatCurrency, formatPercent, getWorkspaceSpotlightData } from "@/lib/data-source";
import {
  getManifestExplanationBundle,
  getPrimaryPortfolioComponents,
} from "@/lib/portfolio-ui";

function buildPath(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function WorkspaceSpotlight({
  manifest,
  blotter,
  contextLabel,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  manifest: PromotedManifest;
  blotter?: BlotterData;
  contextLabel: string;
  title: string;
  description: string;
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
}) {
  const spotlight = getWorkspaceSpotlightData(manifest, blotter);
  const values = spotlight.points.map((p) => p.value);
  const path = buildPath(values);
  const bundle = getManifestExplanationBundle(manifest);
  const primaryComponents = getPrimaryPortfolioComponents(manifest, 4);

  return (
    <section className="workspace-showcase">
      <div className="workspace-primary">
        <div className="workspace-heading">
          <span className="section-kicker">{contextLabel}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <article className="workspace-chart-card">
          <div className="workspace-chart-head">
            <div>
              <span className="section-kicker">How this portfolio behaves</span>
              <h3>{manifest.frontend.title}</h3>
            </div>
            <div className="workspace-state-pill">
              <span>Runs on</span>
              <strong>{manifest.market_intelligence.routeState.chain}</strong>
            </div>
          </div>

          <div className="workspace-toolbar">
            <span className="preview-chip">Preview</span>
            <span className="token-pill">{manifest.frontend.risk_label} risk</span>
            <span className="token-pill">{manifest.allocations.length} holdings</span>
          </div>

          <div className="workspace-chart-meta">
            <div>
              <span>$1k replay result</span>
              <strong>{formatCurrency(manifest.replay.endingCapital)}</strong>
            </div>
            <div>
              <span>Return</span>
              <strong>{formatPercent(manifest.replay.netReturnPct)}</strong>
            </div>
            <div>
              <span>Worst drawdown</span>
              <strong>{formatPercent(manifest.replay.maxDrawdownPct)}</strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{manifest.market_intelligence.confidence}</strong>
            </div>
          </div>

          <p className="panel-note" style={{ fontSize: "0.82rem" }}>
            {bundle.howToReadReplay}
          </p>

          <div className="workspace-chart-shell" aria-hidden="true">
            <svg className="workspace-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="workspaceLine" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#1FD59A" />
                  <stop offset="100%" stopColor="#5FCEF0" />
                </linearGradient>
              </defs>
              <path className="workspace-chart-fill" d={`${path} L 100 100 L 0 100 Z`} />
              <path className="workspace-chart-line" d={path} />
            </svg>
          </div>

          <div className="action-stack action-stack-inline">
            <Link className="button button-primary" href={primaryAction.href}>
              {primaryAction.label}
            </Link>
            {secondaryAction ? (
              <Link className="button button-secondary" href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        </article>
      </div>

      <aside className="workspace-secondary">
        <article className="panel-card panel-card-subtle">
          <span className="section-kicker">How this is built</span>
          <h3>{manifest.frontend.title}</h3>
          <p>{bundle.howItIsBuilt}</p>
          <p className="panel-note">{bundle.bestFor}</p>
        </article>

        <article className="panel-card panel-card-subtle">
          <span className="section-kicker">Why these holdings are here</span>
          <div className="allocation-stack">
            {primaryComponents.map((component) => (
              <div className="allocation-row" key={`${manifest.slug}-${component.componentId}`}>
                <div>
                  <strong>{component.title}</strong>
                  <p>{component.rationale}</p>
                </div>
                <span>{component.exposureLabel}</span>
              </div>
            ))}
          </div>
        </article>
      </aside>
    </section>
  );
}
