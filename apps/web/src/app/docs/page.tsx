import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/home-terminal";

export const metadata: Metadata = {
  title: "Documentation — 24-7 MARKETS",
  description: "How 24-7 Markets works. Autoresearch, portfolio construction, infrastructure, custody, rebalancing.",
};

export default function DocsPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-header-brand" href="/">
            <BrandLockup size="sm" />
          </Link>
          <nav className="landing-header-nav">
            <Link className="landing-header-link" href="/">Home</Link>
            <Link className="landing-header-link" href="/onboarding">Onboarding</Link>
          </nav>
          <Link className="landing-header-cta" href="/onboarding">
            Find my portfolio
          </Link>
        </div>
      </header>

      <section className="landing-section">
        <div className="landing-section-inner" style={{ maxWidth: 800 }}>
          <span className="landing-section-kicker">Documentation</span>
          <h1 className="landing-h2">How 24-7 Markets works.</h1>

          <div className="docs-toc">
            <a href="#autoresearch">Autoresearch</a>
            <a href="#portfolios">Portfolio construction</a>
            <a href="#onboarding">Onboarding flow</a>
            <a href="#infrastructure">Infrastructure</a>
            <a href="#custody">Custody and control</a>
            <a href="#rebalancing">Rebalancing</a>
            <a href="#risks">Risks and limitations</a>
          </div>

          <article className="docs-section" id="autoresearch">
            <h2>Autoresearch</h2>
            <p>
              Autoresearch is the engine that selects your portfolio. Inspired by Andrej Karpathy&apos;s
              approach to training neural networks — run many experiments, keep the winner — it continuously
              tests different portfolio configurations against real market data.
            </p>
            <h3>How it works</h3>
            <ol>
              <li><strong>Generate candidates</strong> — Different combinations of assets, weights, and risk
              profiles are created as portfolio candidates.</li>
              <li><strong>Replay-test</strong> — Each candidate is simulated against recent historical market
              data (typically 30 days). Performance metrics like return, drawdown, and turnover are measured.</li>
              <li><strong>Promote the winner</strong> — The best-performing candidate becomes the active
              portfolio for that slot. This evaluation cycle runs regularly.</li>
            </ol>
            <p>
              When you complete the onboarding questionnaire, your answers determine which portfolio slot
              fits you. The portfolio you see is the current champion from the latest Autoresearch cycle
              for that slot.
            </p>
          </article>

          <article className="docs-section" id="portfolios">
            <h2>Portfolio construction</h2>
            <p>
              Each portfolio is a basket of tokenized US equities (xStocks tokens) plus a USDC cash reserve.
              Every token is backed 1:1 by the underlying equity held by xStocks.
            </p>
            <h3>Asset roles</h3>
            <ul>
              <li><strong>Core holdings</strong> — The primary growth drivers of the portfolio. These carry
              the largest weights.</li>
              <li><strong>Growth drivers</strong> — Complementary positions that add revenue breadth
              and diversification.</li>
              <li><strong>Stability anchors</strong> — Lower-volatility positions that reduce overall
              portfolio drawdown.</li>
              <li><strong>Cash reserve</strong> — USDC held for rebalancing liquidity and withdrawal
              readiness. This is always visible and never hidden.</li>
            </ul>
            <p>
              Weights are set by the Autoresearch evaluation and only change when a new winning
              configuration is promoted.
            </p>
          </article>

          <article className="docs-section" id="onboarding">
            <h2>Onboarding flow</h2>
            <p>
              The 7-question onboarding determines your risk tolerance, theme preference, rebalance style,
              and conviction level. Your answers narrow down which portfolio type fits you best.
            </p>
            <p>
              After answering, you see a simulated replay showing how the portfolio would have performed
              over the last 30 days starting from $1,000. This is a backtest, not a guarantee of future
              performance.
            </p>
            <p>
              You can review every holding, weight, and rebalancing rule before connecting your wallet
              or depositing anything.
            </p>
          </article>

          <article className="docs-section" id="infrastructure">
            <h2>Infrastructure</h2>
            <h3>xStocks</h3>
            <p>Tokenized US equities on Ethereum. Each xStocks token represents a 1:1 backed position
            in the underlying stock. Settlement happens on-chain.</p>
            <h3>Privy</h3>
            <p>Handles wallet creation and authentication. You can connect with an existing wallet or
            create a new smart wallet through Privy. Your keys stay with you — 24-7 Markets never
            takes custody.</p>
            <h3>CoW Protocol</h3>
            <p>Executes trades with MEV protection. When the portfolio rebalances, CoW Protocol finds
            the best execution route and protects your trades from front-running.</p>
            <h3>1inch</h3>
            <p>DEX aggregation for optimal swap routing. Works alongside CoW Protocol to ensure you
            get the best available price across decentralized exchanges.</p>
            <h3>Chainlink CRE</h3>
            <p>Automation rails for rebalancing. Monitors portfolio drift and triggers rebalance
            reviews when thresholds are crossed. Runs on Chainlink&apos;s decentralized infrastructure.</p>
          </article>

          <article className="docs-section" id="custody">
            <h2>Custody and control</h2>
            <p>
              24-7 Markets is non-custodial. Your assets stay in the wallet you connect through Privy.
              You approve all changes before they execute.
            </p>
            <ul>
              <li><strong>Pause</strong> — Stop all rebalancing activity at any time. Your positions stay
              in your wallet.</li>
              <li><strong>Exit</strong> — Withdraw your assets whenever you want. No lock-up periods.</li>
              <li><strong>Transparency</strong> — Every holding, weight, route, and rebalance rule is
              visible before you fund.</li>
            </ul>
          </article>

          <article className="docs-section" id="rebalancing">
            <h2>Rebalancing</h2>
            <p>
              Portfolios are rebalanced based on rules set during the Autoresearch evaluation:
            </p>
            <ul>
              <li><strong>Drift threshold</strong> — Rebalancing only triggers when asset weights drift
              beyond a set threshold (typically 2-3%).</li>
              <li><strong>Scheduled checks</strong> — The system checks for drift on a regular cadence
              (monthly, biweekly, or weekly depending on your portfolio type).</li>
              <li><strong>Your approval</strong> — You approve all rebalances before they execute.
              Nothing trades without your confirmation.</li>
            </ul>
          </article>

          <article className="docs-section" id="risks">
            <h2>Risks and limitations</h2>
            <ul>
              <li>Past performance shown in replays does not guarantee future results.</li>
              <li>Tokenized equities carry smart contract risk in addition to market risk.</li>
              <li>Rebalancing incurs swap fees and potential slippage.</li>
              <li>The cash reserve reduces full equity exposure — this is intentional for
              rebalancing liquidity.</li>
              <li>24-7 Markets is in preview. Some features are simulated until full activation.</li>
            </ul>
          </article>
        </div>
      </section>

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
            <Link href="/docs">Documentation</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div className="landing-footer-col">
            <strong>Infrastructure</strong>
            <a href="https://xstocks.fi" target="_blank" rel="noopener noreferrer">xStocks</a>
            <a href="https://privy.io" target="_blank" rel="noopener noreferrer">Privy</a>
            <a href="https://cow.fi" target="_blank" rel="noopener noreferrer">CoW Protocol</a>
            <a href="https://1inch.io" target="_blank" rel="noopener noreferrer">1inch</a>
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
