import Link from "next/link";

import { XStocksFunnelStageTracker } from "@/components/xstocks-funnel-stage-tracker";

export function BrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "brand-lockup-lg" : size === "sm" ? "brand-lockup-sm" : "";
  return (
    <div className={`brand-lockup ${s}`}>
      <span className="brand-247">24-7</span>
      <span className="brand-markets">MARKETS</span>
    </div>
  );
}

const infraPartners = [
  { name: "xStocks", role: "Tokenized equities on Ethereum", href: "https://xstocks.fi" },
  { name: "Privy", role: "Smart wallets and authentication", href: "https://privy.io" },
  { name: "CoW Protocol", role: "MEV-protected swap execution", href: "https://cow.fi" },
  { name: "1inch", role: "DEX aggregation and Fusion swaps", href: "https://1inch.io" },
  { name: "Chainlink CRE", role: "Automated rebalancing rails", href: "https://chain.link" },
];

const faq = [
  { q: "What are tokenized equities?", a: "Real US stocks represented as tokens on Ethereum. Each xStocks token is backed 1:1 by the underlying equity." },
  { q: "How much do I need to start?", a: "Choose a USDC amount that fits you. No fixed platform minimum." },
  { q: "Who holds my assets?", a: "You do. Assets stay in the wallet you connect through Privy. 24-7 Markets never takes custody." },
  { q: "How is the portfolio maintained?", a: "Chainlink CRE automation monitors drift and triggers rebalancing. CoW Protocol handles execution. Your assets stay in your wallet." },
  { q: "What if I want to stop?", a: "Pause or exit anytime. Your positions stay in your wallet." },
];

export function HomeTerminal() {
  return (
    <div className="landing">
      <XStocksFunnelStageTracker stage="landing_viewed" />

      {/* Header: reference style with black brand block, nav dividers, yellow CTA pushed right */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-header-brand" href="/">
            <BrandLockup size="sm" />
          </Link>
          <nav className="landing-header-nav">
            <a className="landing-header-link" href="#how-it-works">How it works</a>
            <a className="landing-header-link" href="#faq">FAQ</a>
          </nav>
          <Link className="landing-header-cta" href="/onboarding">
            Find my portfolio
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero watermark-bg">
        <div className="landing-hero-inner">
          <BrandLockup size="lg" />
          <div className="landing-hero-tagline">Powered by xStocks</div>
          <p className="landing-hero-sub">
            Tokenized equity portfolios you actually control.
            Matched to your profile. See every holding before you fund.
            Self-custody the whole way.
          </p>
          <div className="landing-hero-cta">
            <Link className="button button-secondary button-xl" href="/onboarding">
              Find my portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* Powered by: inline row */}
      <section className="landing-powered-band" id="infra">
        <span className="landing-powered-label">Powered by</span>
        {infraPartners.map((p) => (
          <a className="landing-powered-name" href={p.href} key={p.name} rel="noopener noreferrer" target="_blank">
            {p.name}
          </a>
        ))}
      </section>

      {/* How it works */}
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
              <p>We compare portfolio candidates and show you the one that fits your profile best.</p>
            </div>
            <div className="landing-flow-arrow" />
            <div className="landing-flow-step">
              <div className="landing-flow-num">3</div>
              <h3>See your portfolio</h3>
              <p>Every holding, allocation, and rebalancing rule. Full transparency before you commit.</p>
            </div>
            <div className="landing-flow-arrow" />
            <div className="landing-flow-step">
              <div className="landing-flow-num">4</div>
              <h3>Fund when ready</h3>
              <p>Connect your wallet through Privy and deposit USDC. Pause or exit whenever you want.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The stack: visual architecture diagram replacing boring feature cards */}
      <section className="landing-section landing-section-alt" id="stack">
        <div className="landing-section-inner landing-section-center">
          <span className="landing-section-kicker">The stack</span>
          <h2 className="landing-h2">How it all fits together.</h2>
        </div>
        <div className="landing-stack">
          <div className="landing-stack-layer landing-stack-layer-top">
            <div className="landing-stack-label">You</div>
            <div className="landing-stack-detail">Connect wallet. Choose portfolio. Approve changes. Full custody.</div>
          </div>
          <div className="landing-stack-layer">
            <div className="landing-stack-label">24-7 Markets</div>
            <div className="landing-stack-detail">Profile matching. Portfolio construction. Transparent preview.</div>
          </div>
          <div className="landing-stack-layer">
            <div className="landing-stack-label">Privy</div>
            <div className="landing-stack-detail">Smart wallets. Embedded authentication. Non-custodial key management.</div>
          </div>
          <div className="landing-stack-layer">
            <div className="landing-stack-label">Chainlink CRE</div>
            <div className="landing-stack-detail">Monitors drift. Triggers rebalancing. Automation rails.</div>
          </div>
          <div className="landing-stack-layer">
            <div className="landing-stack-label">CoW Protocol + 1inch</div>
            <div className="landing-stack-detail">MEV-protected swaps. DEX aggregation. Best execution routing.</div>
          </div>
          <div className="landing-stack-layer landing-stack-layer-bottom">
            <div className="landing-stack-label">xStocks</div>
            <div className="landing-stack-detail">Tokenized US equities. On-chain settlement. 1:1 backed.</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* Bottom CTA */}
      <section className="landing-section landing-bottom-cta watermark-bg">
        <div className="landing-section-inner landing-section-center">
          <h2 className="landing-h2">See which portfolio fits you.</h2>
          <Link className="button button-secondary button-xl" href="/onboarding">
            Find my portfolio
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand-block">
            <BrandLockup size="md" />
            <span className="landing-footer-powered">Powered by xStocks</span>
            <span className="landing-footer-desc">Tokenized equity portfolios trading 24/7.</span>
          </div>
          <div className="landing-footer-col">
            <strong>Product</strong>
            <Link href="/onboarding">Find my portfolio</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-footer-col">
            <strong>Infrastructure</strong>
            <a href="https://xstocks.fi" target="_blank" rel="noopener noreferrer">xStocks</a>
            <a href="https://privy.io" target="_blank" rel="noopener noreferrer">Privy</a>
            <a href="https://cow.fi" target="_blank" rel="noopener noreferrer">CoW Protocol</a>
            <a href="https://chain.link" target="_blank" rel="noopener noreferrer">Chainlink CRE</a>
          </div>
          <div className="landing-footer-col">
            <strong>Open Source</strong>
            <a href="https://github.com/twentyOne2x/xstocks-strategy-lab" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
