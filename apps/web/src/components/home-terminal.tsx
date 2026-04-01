import Link from "next/link";

/* ────────────────────────────────────────────────────────
   Equity Terminal — Landing page
   Full-width marketing homepage. No app chrome.
   ──────────────────────────────────────────────────────── */

function ChartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="landing-icon"
      fill="none"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#0B0F0E" height="128" rx="28" width="128" />
      <rect
        fill="none"
        height="122"
        rx="25"
        stroke="#1F2927"
        strokeWidth="1.5"
        width="122"
        x="3"
        y="3"
      />
      <polyline
        fill="none"
        points="28,88 48,72 62,78 80,52 100,36"
        stroke="#1FD59A"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <circle cx="100" cy="36" fill="#5FCEF0" r="4" />
    </svg>
  );
}

const steps = [
  {
    number: "01",
    title: "Answer a few questions",
    body: "Seven short questions about your goals, risk comfort, and how actively you want the portfolio managed. Takes under a minute.",
  },
  {
    number: "02",
    title: "See the portfolio that fits you",
    body: "We show you the exact holdings, weights, and rebalancing logic before you commit anything. Every allocation is transparent.",
  },
  {
    number: "03",
    title: "Connect and fund when ready",
    body: "Link your wallet through Privy, deposit USDC, and the portfolio activates. No lock-ups, no hidden fees, no surprises.",
  },
  {
    number: "04",
    title: "Approve every change",
    body: "Rebalances are recommended, never forced. You review and approve before any trade executes. Pause or turn off at any time.",
  },
];

const trustPoints = [
  {
    title: "Self-custody",
    body: "Your assets stay in your wallet. Equity Terminal never takes custody. You hold the keys.",
  },
  {
    title: "Preview before deposit",
    body: "See every holding, every weight, and every rebalancing rule before a single dollar moves.",
  },
  {
    title: "User-approved execution",
    body: "No autonomous trading. Every rebalance requires your explicit approval before it runs.",
  },
];

const infra = [
  { label: "Portfolios", value: "xStocks" },
  { label: "Wallets", value: "Privy" },
  { label: "Execution", value: "CoW Protocol" },
  { label: "Network", value: "Ethereum" },
];

export function HomeTerminal() {
  return (
    <div className="landing">
      {/* ── Header ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/">
            <ChartIcon />
            <span className="landing-brand-name">Equity Terminal</span>
          </Link>
          <nav className="landing-header-nav">
            <a className="landing-header-link" href="#how-it-works">
              How it works
            </a>
            <a className="landing-header-link" href="#trust">
              Trust
            </a>
            <Link className="button button-primary button-sm" href="/onboarding">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <span className="landing-kicker">Powered by xStocks</span>
          <h1 className="landing-h1">
            Tokenized equity portfolios
            <br />
            you actually control.
          </h1>
          <p className="landing-hero-sub">
            Equity Terminal builds a portfolio of tokenized US equities matched
            to your profile. You see every holding before you deposit, approve
            every rebalance before it executes, and keep full custody of your
            assets the entire time.
          </p>
          <div className="landing-hero-cta">
            <Link className="button button-primary button-lg" href="/onboarding">
              Find my portfolio
            </Link>
            <Link className="button button-ghost button-lg" href="/workspace/comparison">
              Browse portfolios
            </Link>
          </div>
          <div className="landing-proof-row">
            <span>Self-custody</span>
            <span className="landing-proof-dot" />
            <span>Preview before deposit</span>
            <span className="landing-proof-dot" />
            <span>You approve every change</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">How it works</span>
          <h2 className="landing-h2">
            From profile to portfolio in four steps.
          </h2>
          <div className="landing-steps">
            {steps.map((step) => (
              <article className="landing-step" key={step.number}>
                <span className="landing-step-num">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="landing-section landing-section-alt" id="trust">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">Why self-custody matters</span>
          <h2 className="landing-h2">
            You hold the assets. You approve the trades.
          </h2>
          <p className="landing-section-sub">
            Most managed products take custody of your money, rebalance behind
            closed doors, and make you trust that the right thing happened.
            Equity Terminal works differently.
          </p>
          <div className="landing-trust-grid">
            {trustPoints.map((point) => (
              <article className="landing-trust-card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Infrastructure ── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">Infrastructure</span>
          <h2 className="landing-h2">
            Built on transparent, verifiable rails.
          </h2>
          <p className="landing-section-sub">
            Equity Terminal is the interface. The portfolio logic, wallet
            infrastructure, and trade execution are handled by proven,
            independent systems.
          </p>
          <div className="landing-infra-row">
            {infra.map((item) => (
              <div className="landing-infra-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-section landing-bottom-cta">
        <div className="landing-section-inner" style={{ textAlign: "center" }}>
          <h2 className="landing-h2">See which portfolio fits you.</h2>
          <p className="landing-section-sub" style={{ marginInline: "auto" }}>
            Seven questions. Under a minute. Preview everything before you
            deposit.
          </p>
          <div
            className="landing-hero-cta"
            style={{ justifyContent: "center" }}
          >
            <Link className="button button-primary button-lg" href="/onboarding">
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <ChartIcon />
            <div>
              <strong>Equity Terminal</strong>
              <span>Powered by xStocks</span>
            </div>
          </div>
          <div className="landing-footer-links">
            <Link href="/onboarding">Get started</Link>
            <Link href="/workspace/comparison">Browse portfolios</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#trust">Trust</a>
          </div>
          <div className="landing-footer-infra">
            {infra.map((item) => (
              <span key={item.label}>
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
