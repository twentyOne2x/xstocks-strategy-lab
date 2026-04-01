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
  { name: "xStocks", role: "Tokenized equities", href: "https://xstocks.fi" },
  { name: "Privy", role: "Wallet and auth", href: "https://privy.io" },
  { name: "CoW Protocol", role: "Swap execution", href: "https://cow.fi" },
];

const faq = [
  { q: "What are tokenized equities?", a: "Real US stocks represented as tokens on Ethereum. Each xStocks token is backed 1:1 by the underlying equity." },
  { q: "How much do I need to start?", a: "Choose a USDC amount that fits you. No fixed platform minimum." },
  { q: "Who holds my assets?", a: "You do. Assets stay in the wallet you connect through Privy. 24-7 Markets never takes custody." },
  { q: "How is the portfolio maintained?", a: "The product surfaces rebalance reviews. Every live execution step stays user-approved." },
  { q: "What if I want to stop?", a: "Pause or exit anytime. Your positions stay in your wallet." },
];

export function HomeTerminal() {
  return (
    <div className="landing">
      <XStocksFunnelStageTracker stage="landing_viewed" />

      {/* Header matching reference: white bar, black brand block, nav links with dividers, yellow CTA */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-header-brand" href="/">
            <BrandLockup size="sm" />
          </Link>
          <nav className="landing-header-nav">
            <a className="landing-header-link" href="#how-it-works">How it works</a>
            <a className="landing-header-link" href="#faq">FAQ</a>
            <Link className="landing-header-cta" href="/onboarding">
              Find my portfolio
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero: tighter padding */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <BrandLockup size="lg" />
          <div className="landing-hero-tagline">Powered by xStocks</div>
          <p className="landing-hero-sub">
            Tokenized equity portfolios you actually control.
            Matched to your profile. Preview every holding.
            Fund with USDC. Self-custody the whole way.
          </p>
          <div className="landing-hero-cta">
            <Link className="button button-secondary button-xl" href="/onboarding">
              Find my portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* Infrastructure partners */}
      <section className="landing-infra-band" id="infra">
        <div className="landing-infra-band-inner">
          <div className="landing-infra-label">
            <span className="landing-section-kicker">Built on top of</span>
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

      {/* How it works: bigger steps */}
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
              <h3>Preview everything</h3>
              <p>Every holding, every weight, every rebalancing rule. Full transparency before you commit.</p>
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

      {/* What you get */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <span className="landing-section-kicker">What you get</span>
          <h2 className="landing-h2">A real portfolio, not a black box.</h2>
          <div className="landing-features">
            <div className="landing-feature">
              <strong>Full custody</strong>
              <p>Your assets stay in the wallet you connect through Privy.</p>
            </div>
            <div className="landing-feature">
              <strong>Total transparency</strong>
              <p>Every holding, every weight, every trade route is visible.</p>
            </div>
            <div className="landing-feature">
              <strong>User-approved</strong>
              <p>Every execution step requires your signed approval.</p>
            </div>
            <div className="landing-feature">
              <strong>Flexible funding</strong>
              <p>Choose the USDC amount that fits you. Pause or exit anytime.</p>
            </div>
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

      {/* Bottom CTA: tighter padding */}
      <section className="landing-section landing-bottom-cta">
        <div className="landing-section-inner landing-section-center">
          <h2 className="landing-h2">See which portfolio fits you.</h2>
          <Link className="button button-secondary button-xl" href="/onboarding">
            Find my portfolio
          </Link>
        </div>
      </section>

      {/* Footer: 3x bigger brand, GitHub link, infra stack */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand-block">
            <BrandLockup size="md" />
            <span className="landing-footer-powered">Powered by xStocks</span>
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
