import Link from "next/link";

function ChartIcon({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" className="landing-icon" fill="none" height={size} viewBox="0 0 128 128" width={size} xmlns="http://www.w3.org/2000/svg">
      <rect fill="#0B0F0E" height="128" rx="28" width="128" />
      <rect fill="none" height="122" rx="25" stroke="#1F2927" strokeWidth="1.5" width="122" x="3" y="3" />
      <polyline fill="none" points="28,88 48,72 62,78 80,52 100,36" stroke="#1FD59A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <circle cx="100" cy="36" fill="#5FCEF0" r="4" />
    </svg>
  );
}

/* Visual flow diagram — replaces text-heavy "how it works" */
function FlowDiagram() {
  const nodes = [
    { label: "Profile", sub: "7 questions" },
    { label: "Match", sub: "AI-optimized" },
    { label: "Preview", sub: "Full transparency" },
    { label: "Fund", sub: "$10 min" },
  ];
  return (
    <div className="flow-diagram">
      {nodes.map((n, i) => (
        <div className="flow-node" key={n.label}>
          <div className="flow-node-circle">
            <span className="flow-node-num">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <strong>{n.label}</strong>
          <span>{n.sub}</span>
          {i < nodes.length - 1 && <div className="flow-connector" />}
        </div>
      ))}
    </div>
  );
}

const infraPartners = [
  { name: "xStocks", role: "Tokenized equities" },
  { name: "Privy", role: "Smart wallets" },
  { name: "CoW Protocol", role: "Trade execution" },
  { name: "Chainlink", role: "Automation rails" },
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
            <span className="landing-brand-powered">Powered by xStocks</span>
          </Link>
          <nav className="landing-header-nav">
            <a className="landing-header-link" href="#infra">Infrastructure</a>
            <Link className="button button-primary button-lg" href="/onboarding">
              Open Terminal
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-h1">
            Tokenized equities.<br />
            Your wallet. Your rules.
          </h1>
          <p className="landing-hero-sub">
            Get a portfolio of tokenized US equities matched to you.
            Preview everything. Fund with $10. Self-custody the whole way.
          </p>
          <div className="landing-hero-cta">
            <Link className="button button-primary button-xl" href="/onboarding">
              Open Terminal
            </Link>
            <Link className="button button-ghost button-lg" href="/workspace/comparison">
              Browse portfolios
            </Link>
          </div>
        </div>
      </section>

      {/* ── Built on top of ── */}
      <section className="landing-infra-band" id="infra">
        <div className="landing-infra-band-inner">
          <span className="landing-section-kicker">Built on top of</span>
          <div className="landing-infra-cards">
            {infraPartners.map((p) => (
              <div className="landing-infra-card" key={p.name}>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — visual flow ── */}
      <section className="landing-section">
        <div className="landing-section-inner landing-section-center">
          <span className="landing-section-kicker">How it works</span>
          <h2 className="landing-h2">Profile to portfolio in 60 seconds.</h2>
          <FlowDiagram />
        </div>
      </section>

      {/* ── Trust — visual chips, not paragraphs ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner landing-section-center">
          <h2 className="landing-h2">Always yours.</h2>
          <div className="landing-trust-chips">
            <div className="landing-trust-chip">
              <strong>Self-custody</strong>
              <span>Assets stay in your wallet</span>
            </div>
            <div className="landing-trust-chip">
              <strong>Full preview</strong>
              <span>See every holding before funding</span>
            </div>
            <div className="landing-trust-chip">
              <strong>Pause anytime</strong>
              <span>Turn off or exit whenever you want</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-section landing-bottom-cta">
        <div className="landing-section-inner landing-section-center">
          <h2 className="landing-h2">Ready?</h2>
          <p className="landing-hero-sub" style={{ textAlign: "center", maxWidth: "40ch", marginInline: "auto" }}>
            Seven questions. Preview the portfolio. Fund when you want.
          </p>
          <Link className="button button-primary button-xl" href="/onboarding">
            Open Terminal
          </Link>
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
            <Link href="/onboarding">Open Terminal</Link>
            <Link href="/workspace/comparison">Browse portfolios</Link>
          </div>
          <div className="landing-footer-infra">
            {infraPartners.map((p) => (
              <span key={p.name}>{p.name}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
