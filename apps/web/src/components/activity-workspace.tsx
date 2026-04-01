import type { ActivityWorkspaceProps } from "@/lib/contracts";

export function ActivityWorkspace({ manifest, blotter }: ActivityWorkspaceProps) {
  return (
    <div className="screen-stack">
      <article className="panel-card">
        <span className="section-kicker">Activity</span>
        <h3>{manifest.frontend.title} · {manifest.live_state.state.replaceAll("_", " ")}</h3>
      </article>

      {blotter.activity.length > 0 && (
        <section className="panel-card">
          <span className="section-kicker">Recent events</span>
          <div className="timeline-list">
            {blotter.activity.map((event) => (
              <article className="timeline-item timeline-item-compact" key={event.id}>
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
        </section>
      )}

      <section className="panel-card">
        <span className="section-kicker">Positions</span>
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Role</th>
              <th>Exposure</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {blotter.positions.map((row) => (
              <tr key={row.id}>
                <td>{row.symbol}</td>
                <td>{row.sleeve}</td>
                <td>{row.exposureUsd}</td>
                <td>
                  <span className={`status-pill status-pill-${row.state}`}>{row.state}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
