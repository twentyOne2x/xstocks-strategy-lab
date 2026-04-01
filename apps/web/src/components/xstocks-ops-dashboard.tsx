import Link from "next/link";

import type {
  XStocksOpsBlockerCohort,
  XStocksOpsConversionRow,
  XStocksOpsDashboardModel,
  XStocksOpsStageRow,
  XStocksReportingBlocker,
  XStocksReportingCoverage,
} from "@/lib/xstocks-ops-dashboard";

function formatPercent(value: number | null) {
  return value === null ? "Unavailable" : `${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function coverageClassName(coverage: XStocksReportingCoverage) {
  return `ops-coverage-badge ops-coverage-badge-${coverage}`;
}

function severityClassName(severity: XStocksReportingBlocker["severity"]) {
  return `ops-severity-badge ops-severity-badge-${severity}`;
}

function renderCount(value: number | null) {
  return value === null ? "—" : String(value);
}

function MetricsGrid({ stage }: { stage: XStocksOpsStageRow }) {
  return (
    <div className="ops-stage-metrics">
      <div className="ops-stage-metric">
        <span>Subjects</span>
        <strong>{renderCount(stage.reached.subjects)}</strong>
      </div>
      <div className="ops-stage-metric">
        <span>Users</span>
        <strong>{renderCount(stage.reached.users)}</strong>
      </div>
      <div className="ops-stage-metric">
        <span>Wallets</span>
        <strong>{renderCount(stage.reached.wallets)}</strong>
      </div>
      <div className="ops-stage-metric">
        <span>Requests</span>
        <strong>{renderCount(stage.reached.executionRequests)}</strong>
      </div>
    </div>
  );
}

function StageCard({ stage }: { stage: XStocksOpsStageRow }) {
  return (
    <article className="ops-stage-card">
      <div className="ops-stage-head">
        <div className="ops-stage-copy">
          <span className="section-kicker">Stage {String(stage.order).padStart(2, "0")}</span>
          <h3>{stage.label}</h3>
          <p>{stage.definition}</p>
        </div>
        <span className={coverageClassName(stage.coverage)}>
          {stage.coverage.replaceAll("_", " ")}
        </span>
      </div>
      <MetricsGrid stage={stage} />
      <div className="ops-stage-foot">
        <span className="inline-pill">{stage.source}</span>
        {stage.notes.length > 0 ? (
          <ul className="ops-inline-list">
            {stage.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        {stage.blockers.length > 0 ? (
          <ul className="ops-inline-list ops-inline-list-warning">
            {stage.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function ConversionTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: XStocksOpsConversionRow[];
}) {
  return (
    <section className="ops-panel">
      <div className="panel-heading">
        <span className="section-kicker">Funnel Efficacy</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Measure</th>
              <th>From Count</th>
              <th>To Count</th>
              <th>Conversion</th>
              <th>Drop-Off</th>
              <th>Truth</th>
              <th>Blockers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.fromLabel}</td>
                <td>{row.toLabel}</td>
                <td>{row.measurement}</td>
                <td>{renderCount(row.fromCount)}</td>
                <td>{renderCount(row.toCount)}</td>
                <td>{formatPercent(row.conversionRatePct)}</td>
                <td>{renderCount(row.dropOffCount)}</td>
                <td>
                  <span className={coverageClassName(row.coverage)}>
                    {row.coverage.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  {row.blockers.length > 0 ? (
                    <ul className="ops-inline-list ops-inline-list-tight">
                      {row.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ops-muted">No stage-specific blocker recorded.</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BlockerCohorts({ cohorts }: { cohorts: XStocksOpsBlockerCohort[] }) {
  return (
    <section className="ops-panel">
      <div className="panel-heading">
        <span className="section-kicker">Blocker Cohorts</span>
        <h2>Where Users Fall Out</h2>
        <p>Funding-required and failed cohorts stay separate from the linear funnel tracks.</p>
      </div>
      <div className="ops-cohort-grid">
        {cohorts.map((cohort) => (
          <article key={cohort.stage} className="ops-cohort-card">
            <div className="ops-cohort-head">
              <div>
                <h3>{cohort.label}</h3>
                <p>{cohort.note}</p>
              </div>
              <span className={coverageClassName(cohort.coverage)}>
                {cohort.coverage.replaceAll("_", " ")}
              </span>
            </div>
            <div className="ops-cohort-count">
              <strong>{renderCount(cohort.count)}</strong>
              <span>{cohort.measurement}</span>
            </div>
            {cohort.blockers.length > 0 ? (
              <ul className="ops-inline-list ops-inline-list-warning">
                {cohort.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : (
              <p className="ops-muted">No blocker detail was attached to this cohort.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function GlobalBlockers({ blockers }: { blockers: XStocksReportingBlocker[] }) {
  return (
    <section className="ops-panel">
      <div className="panel-heading">
        <span className="section-kicker">Runtime Blockers</span>
        <h2>Current Constraints</h2>
        <p>Exact blockers emitted by the reporting layer, with the affected stage when known.</p>
      </div>
      <div className="ops-blocker-list">
        {blockers.map((blocker) => (
          <article key={blocker.blockerId} className="ops-blocker-card">
            <div className="ops-blocker-head">
              <span className={severityClassName(blocker.severity)}>{blocker.severity}</span>
              <span className="ops-muted">
                {blocker.affectedStage ? blocker.affectedStage.replaceAll("_", " ") : "global"}
              </span>
            </div>
            <h3>{blocker.title}</h3>
            <p>{blocker.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentExecutions({
  executions,
}: {
  executions: XStocksOpsDashboardModel["recentExecutions"];
}) {
  return (
    <section className="ops-panel">
      <div className="panel-heading">
        <span className="section-kicker">Execution Truth</span>
        <h2>Recent Executions</h2>
        <p>Wallets remain masked. Submitted and confirmed notional come directly from execution truth.</p>
      </div>
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Wallet</th>
              <th>State</th>
              <th>Assets</th>
              <th>Submitted USD</th>
              <th>Confirmed USD</th>
              <th>Blockers</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.executionRequestId}>
                <td>{execution.userLabel ?? "Anonymous"}</td>
                <td>{execution.walletLabel ?? "Hidden"}</td>
                <td>{execution.state.replaceAll("_", " ")}</td>
                <td>{execution.assetSymbols.join(", ")}</td>
                <td>{formatCurrency(execution.submittedVolumeUsd)}</td>
                <td>{formatCurrency(execution.confirmedVolumeUsd)}</td>
                <td>
                  {execution.blockers.length > 0 ? (
                    <ul className="ops-inline-list ops-inline-list-tight">
                      {execution.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ops-muted">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reconciliation({
  reconciliation,
}: {
  reconciliation: XStocksOpsDashboardModel["reconciliation"];
}) {
  return (
    <section className="ops-panel">
      <div className="panel-heading">
        <span className="section-kicker">Reconciliation</span>
        <h2>Volume Back To Execution Truth</h2>
        <p>{reconciliation.methodology}</p>
      </div>
      <div className="ops-reconciliation-summary">
        <div className="ops-stage-metric">
          <span>Submitted</span>
          <strong>{formatCurrency(reconciliation.submittedVolumeUsd)}</strong>
        </div>
        <div className="ops-stage-metric">
          <span>Confirmed</span>
          <strong>{formatCurrency(reconciliation.confirmedVolumeUsd)}</strong>
        </div>
      </div>
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Execution</th>
              <th>User</th>
              <th>Wallet</th>
              <th>Asset</th>
              <th>Leg State</th>
              <th>Target USD</th>
              <th>Submitted?</th>
              <th>Confirmed?</th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.lines.map((line) => (
              <tr key={line.legId}>
                <td>{line.executionRequestId}</td>
                <td>{line.userLabel ?? "Hidden"}</td>
                <td>{line.walletLabel ?? "Hidden"}</td>
                <td>{line.assetSymbol ?? "—"}</td>
                <td>{line.legState.replaceAll("_", " ")}</td>
                <td>{formatCurrency(line.targetNotionalUsd)}</td>
                <td>{line.includedInSubmittedVolume ? "Yes" : "No"}</td>
                <td>{line.includedInConfirmedVolume ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function XStocksOpsDashboard({
  model,
}: {
  model: XStocksOpsDashboardModel;
}) {
  return (
    <main className="app-frame ops-shell">
      <section className="ops-hero">
        <div className="ops-hero-top">
          <div className="ops-hero-copy">
            <span className="section-kicker">Operator Surface</span>
            <h1>xStocks Ops Dashboard</h1>
            <p>
              Internal-first reporting over the truthful xstocks funnel and execution
              ledger. Subjects, users, and wallets stay separate; wallet addresses stay masked.
            </p>
          </div>
          <div className="ops-hero-actions">
            <Link className="ops-button ops-button-secondary" href="/ops/xstocks/export">
              Export JSON
            </Link>
            <form action="/ops/xstocks/logout" method="post">
              <button className="ops-button" type="submit">
                Lock Dashboard
              </button>
            </form>
          </div>
        </div>
        <div className="ops-summary-grid">
          {model.summaryCards.map((card) => (
            <article key={card.key} className={`ops-summary-card ops-summary-card-${card.tone}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <span className="section-kicker">Truth Modes</span>
          <h2>Canonical vs Lower-Bound vs Missing</h2>
          <p>{model.truthBoundary.durableUserIdentity}</p>
        </div>
        <div className="ops-coverage-grid">
          {model.coverageLegend.map((item) => (
            <article key={item.coverage} className="ops-coverage-card">
              <span className={coverageClassName(item.coverage)}>{item.label}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <ul className="ops-inline-list">
          {model.truthBoundary.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <span className="section-kicker">Stage Ladder</span>
          <h2>Full Funnel and Execution Ladder</h2>
          <p>Every stage is rendered with its truth level and the distinct counts available for that stage.</p>
        </div>
        <div className="ops-stage-grid">
          {model.stageRows.map((stage) => (
            <StageCard key={stage.stage} stage={stage} />
          ))}
        </div>
      </section>

      <div className="ops-panel-grid">
        <ConversionTable
          title="Subject-Led Funnel"
          subtitle="Canonical subject conversion from landing through wallet-connected entry."
          rows={model.subjectConversionRows}
        />
        <ConversionTable
          title="Authenticated User Execution"
          subtitle="Execution progression for authenticated users after wallet connection."
          rows={model.userConversionRows}
        />
      </div>

      <ConversionTable
        title="Wallet Execution Progression"
        subtitle="Separate wallet-led progression to keep users and wallets distinct."
        rows={model.walletConversionRows}
      />

      <BlockerCohorts cohorts={model.blockerCohorts} />
      <GlobalBlockers blockers={model.blockers} />
      <RecentExecutions executions={model.recentExecutions} />
      <Reconciliation reconciliation={model.reconciliation} />
    </main>
  );
}

export function XStocksOpsAccessScreen({
  title,
  detail,
  error,
  configured,
}: {
  title: string;
  detail: string;
  error?: string | null;
  configured: boolean;
}) {
  return (
    <main className="app-frame ops-access-shell">
      <section className="ops-access-card">
        <span className="section-kicker">Operator Surface</span>
        <h1>{title}</h1>
        <p>{detail}</p>
        {configured ? (
          <form action="/ops/xstocks/unlock" method="post" className="ops-access-form">
            <label className="ops-access-label" htmlFor="ops-access-token">
              Dashboard token
            </label>
            <input
              className="ops-access-input"
              id="ops-access-token"
              name="token"
              type="password"
              autoComplete="current-password"
              placeholder="Enter the internal xstocks ops token"
              required
            />
            {error ? <p className="ops-access-error">{error}</p> : null}
            <button className="ops-button" type="submit">
              Unlock Dashboard
            </button>
          </form>
        ) : (
          <p className="ops-access-error">
            Configure `XSTOCKS_OPS_DASHBOARD_TOKEN` or `XSTOCKS_REPORTING_TOKEN` first.
          </p>
        )}
      </section>
    </main>
  );
}
