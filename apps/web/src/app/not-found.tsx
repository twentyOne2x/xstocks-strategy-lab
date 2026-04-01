import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-shell">
      <div className="empty-state-card">
        <span className="section-kicker">xStocks Strategy Lab</span>
        <h1>View not found</h1>
        <p>
          This shell only serves promoted strategy routes. Pick a current view
          from the terminal home.
        </p>
        <Link className="button button-primary" href="/">
          Return to terminal
        </Link>
      </div>
    </main>
  );
}
