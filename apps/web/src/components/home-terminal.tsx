import Link from "next/link";

import { XStocksFunnelStageTracker } from "@/components/xstocks-funnel-stage-tracker";

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

const infraPartners = [
  { name: "xStocks", role: "Tokenized equities infrastructure", href: "https://xstocks.fi" },
  { name: "Privy", role: "Smart wallets and auth by Privy", href: "https://privy.io" },
  { name: "CoW Protocol", role: "Swaps powered by CoW Protocol", href: "https://cow.fi" },
  { name: "Chainlink CRE", role: "Automated rebalancing rails", href: "https://chain.link" },
];

const faq = [
  { q: "What are tokenized equities?", a: "Real US stocks represented as tokens on Ethereum. Each xStocks token is backed 1:1 by the underlying equity." },
  { q: "How much do I need to start?", a: "As little as $10 in USDC. No minimums, no lock-ups." },
  { q: "Who holds my assets?", a: "You do. Assets stay in your Privy smart wallet. Equity Terminal never takes custody." },
  { q: "How is the portfolio maintained?", a: "Chainlink CRE automation monitors the strategy and triggers rebalancing when needed, with execution routed through CoW Protocol while your assets stay in your wallet." },
  { q: "What if I want to stop?", a: "Pause or exit anytime. Your positions stay in your wallet." },
];

export function HomeTerminal() {
  return (
    <div className="landing">
      <XStocksFunnelStageTracker stage="landing_viewed" />

      {/* ── Header ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/">
            <ChartIcon size={36} />
            <div className="landing-brand-text">
              <span className="landing-brand-name">Equity Terminal</span>
              <span className="landing-brand-powered">Powered by xStocks</span>
            </div>
          </Link>
          <nav className="landing-header-nav">
            <a className="landing-header-link" href="#how-it-works">How it works</a>
            <a className="landing-header-link" href="#faq">FAQ</a>
            <Link className="button button-primary button-lg" href="/onboarding">
              Find my portfolio
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-h1">
            xStocks portfolios you actually control.
          </h1>
          <p className="landing-hero-sub">
            Equity Terminal matches you to a portfolio of tokenized US equities
            powered by xStocks. Smart wallets and auth run through Privy,
            swaps execute through CoW Protocol, and Chainlink CRE keeps the
            strategy automated. Preview every holding before you fund and get
            started with as little as $10.
          </p>
          <div className="landing-hero-cta">
            <Link className="button button-primary button-xl" href="/onboarding">
              Find my portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Infrastructure partners ── */}
      <section className="landing-infra-band" id="infra">
        <div className="landing-infra-band-inner">
          <div className="landing-infra-label">
            <span className="landing-section-kicker">Built on top of</span>
            <p>Every layer is an independent, verifiable system.</p>
          </div>
          <div className="landing-infra-cards">
            {infraPartners.map((p) => (
              <a className="landing-infra-card" href={p.href} key={p.name} rel="noopener noreferrer" target="_blank">
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-section-inner landing-section-center">
          <span className="landing-section-kicker">How it works</span>
          <h2 className="landing-h2">From profile to portfolio in under a minute.</h2>
          <div className="landing-flow">
            <div className="landing-flow-step">
              <div className="landing-flow-num">1</div>
              <h3>Answer 7 questions</h3>
              <p>Risk tolerance, theme preference, rebalance style. Takes about 45 seconds.</p>
            </div>
            <div className="landing-flow-arrow" />
            <div className="landing-flow-step">
              <div className="landing-flow-num">2</div>
              <h3>Get your match</h3>
              <p>We compare candidates and show you the portfolio that fits your profile.</p>
            </div>
            <div className="landing-flow-arrow" />
            <div className="landing-flow-step">
              <div className="landing-flow-num">3</div>
              <h3>Preview everything</h3>
              <p>See every holding, weight, and rebalancing rule before you commit anything.</p>
            </div>
            <div className="landing-flow-arrow" />
            <div className="landing-flow-step">
              <div className="landing-flow-num">4</div>
              <h3>Fund when ready</h3>
              <p>Deposit USDC to activate. $10 minimum. Pause or exit whenever you want.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">What you get</span>
          <h2 className="landing-h2">A real portfolio, not a black box.</h2>
          <div className="landing-features">
            <div className="landing-feature">
              <strong>Full custody</strong>
              <p>Your assets live in a Privy smart wallet that only you control. No seed phrase needed.</p>
            </div>
            <div className="landing-feature">
              <strong>Total transparency</strong>
              <p>Every holding, every weight, every trade route — visible before and after you deposit.</p>
            </div>
            <div className="landing-feature">
              <strong>Automated maintenance</strong>
              <p>Chainlink CRE monitors the portfolio and keeps the strategy on rails as allocations drift over time.</p>
            </div>
            <div className="landing-feature">
              <strong>$10 to start</strong>
              <p>No minimums, no lock-ups, no hidden fees. Pause or exit anytime with your full balance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-section" id="faq">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">Common questions</span>
          <h2 className="landing-h2">Quick answers.</h2>
          <div className="landing-faq">
            {faq.map((item) => (
              <details className="landing-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-section landing-bottom-cta">
        <div className="landing-section-inner landing-section-center">
          <h2 className="landing-h2">See which portfolio fits you.</h2>
          <p className="landing-hero-sub" style={{ textAlign: "center", maxWidth: "44ch", marginInline: "auto" }}>
            Seven questions. Under a minute. Preview everything before you deposit.
          </p>
          <Link className="button button-primary button-xl" href="/onboarding">
            Find my portfolio
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <ChartIcon size={40} />
            <div>
              <strong>Equity Terminal</strong>
              <span>Powered by xStocks</span>
            </div>
          </div>
          <div className="landing-footer-col">
            <strong>Product</strong>
            <Link href="/onboarding">Find my portfolio</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-footer-col">
            <strong>Infrastructure</strong>
            {infraPartners.map((p) => (
              <a href={p.href} key={p.name} rel="noopener noreferrer" target="_blank">{p.name}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
