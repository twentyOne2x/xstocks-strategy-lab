"use client";

import { useState, useEffect } from "react";

const slides = [
  {
    bg: "#ff1800",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(5rem, 12vw, 12rem)", fontStyle: "italic", margin: 0, lineHeight: 0.85, textShadow: "6px 6px 0 #0a0a0a", WebkitTextStroke: "3px #0a0a0a" }}>24-7</h1>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 4rem)", fontStyle: "italic", margin: "0.5rem 0 2rem", letterSpacing: "0.1em" }}>MARKETS</h2>
        <p style={{ fontSize: "1.8rem", maxWidth: "700px", margin: "0 auto", fontWeight: 600 }}>Tokenized equity portfolios trading 24/7.<br />Powered by xStocks.</p>
      </div>
    ),
  },
  {
    bg: "#fff",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>The Problem</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Why this matters.</h2>
        <ul style={{ fontSize: "1.5rem", lineHeight: 1.8, listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>Building a diversified stock portfolio today requires intermediaries who take custody of your assets and charge management fees.</li>
          <li style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>Existing portfolio products are opaque: you cannot see exactly what you own, why those holdings were chosen, or how rebalancing works.</li>
          <li style={{ paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>There is no simple way to get a professionally constructed, automatically rebalanced stock portfolio while keeping full control of your assets.</li>
        </ul>
      </div>
    ),
  },
  {
    bg: "#0a0a0a",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>One Sentence</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontStyle: "italic", textTransform: "uppercase", maxWidth: "900px", margin: "0 auto 2rem", lineHeight: 1.1 }}>24-7 Markets matches your risk profile to an optimized stock portfolio.</h2>
        <ul style={{ listStyle: "none", padding: 0, fontSize: "1.5rem", lineHeight: 2, textAlign: "left", maxWidth: "700px", margin: "0 auto" }}>
          <li>&#x2713; Fully transparent: see every holding and rule</li>
          <li>&#x2713; Self-custody: your wallet, your assets</li>
          <li>&#x2713; Automatically rebalanced by Chainlink</li>
          <li>&#x2713; Available around the clock via xStocks</li>
        </ul>
      </div>
    ),
  },
  {
    bg: "#fff",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>What Makes Us Unique</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Four edges.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ padding: "2rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.5rem" }}>Autoresearch</strong><p style={{ margin: "0.5rem 0 0", color: "#333", fontSize: "1.2rem", lineHeight: 1.5 }}>AI-powered portfolio optimization inspired by Karpathy. Run many experiments, keep the winner. Built on the <strong>xStocks Strategy Lab</strong> evaluation pipeline.</p></div>
          <div style={{ padding: "2rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.5rem" }}>Full Transparency</strong><p style={{ margin: "0.5rem 0 0", color: "#333", fontSize: "1.2rem", lineHeight: 1.5 }}>Every holding, weight, and rebalance rule visible before deposit. Powered by <strong>Chainlink CRE</strong> automation rails.</p></div>
          <div style={{ padding: "2rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.5rem" }}>Self-Custody</strong><p style={{ margin: "0.5rem 0 0", color: "#333", fontSize: "1.2rem", lineHeight: 1.5 }}>Assets stay in your wallet via <strong>Privy</strong> smart wallets. We never take custody. Non-custodial key management.</p></div>
          <div style={{ padding: "2rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.5rem" }}>Best Execution</strong><p style={{ margin: "0.5rem 0 0", color: "#333", fontSize: "1.2rem", lineHeight: 1.5 }}>Optimal trade execution via <strong>CoW Protocol</strong> and <strong>1inch Fusion</strong>. Aggregates across decentralized exchanges for best price.</p></div>
        </div>
      </div>
    ),
  },
  {
    bg: "#f5f5f5",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Architecture</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>The Stack.</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: "800px", margin: "0 auto" }}>
          {[
            { label: "You", detail: "Connect wallet. Choose portfolio. Approve changes. Full custody.", bg: "#ffd84d" },
            { label: "24-7 Markets", detail: "Profile matching. Autoresearch portfolio construction. Transparent preview.", bg: "#fff" },
            { label: "Privy", detail: "Smart wallets. Embedded authentication. Non-custodial key management.", bg: "#fff" },
            { label: "Chainlink CRE", detail: "Drift monitoring. Automated rebalance triggers. Decentralized rails.", bg: "#fff" },
            { label: "CoW + 1inch", detail: "DEX aggregation. Best execution routing across decentralized exchanges.", bg: "#fff" },
            { label: "xStocks", detail: "Tokenized US equities. 1:1 backed. On-chain settlement. 24/7 trading.", bg: "#0a0a0a", color: "#fff" },
          ].map((layer) => (
            <div key={layer.label} style={{ display: "flex", alignItems: "center", gap: "2rem", padding: "1.2rem 2rem", border: "3px solid #0a0a0a", borderBottom: "none", background: layer.bg, color: layer.color ?? "#0a0a0a" }}>
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontStyle: "italic", textTransform: "uppercase", minWidth: "180px" }}>{layer.label}</strong>
              <span style={{ fontSize: "1.15rem", lineHeight: 1.4 }}>{layer.detail}</span>
            </div>
          ))}
          <div style={{ borderBottom: "3px solid #0a0a0a" }} />
        </div>
      </div>
    ),
  },
  {
    bg: "#ff1800",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#0a0a0a" }}>Portfolio Intelligence</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2.5rem", textShadow: "3px 3px 0 #0a0a0a" }}>How Autoresearch Works.</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
          {[
            { num: "1", title: "Generate", desc: "Test different weights, holdings, and risk profiles across multiple candidates." },
            { num: "2", title: "Replay-Test", desc: "Simulate each candidate against 30 days of real market data. Measure return, drawdown, turnover." },
            { num: "3", title: "Promote", desc: "Best performer becomes the active portfolio. Re-evaluated on every research cycle." },
          ].map((step) => (
            <div key={step.num} style={{ textAlign: "center", maxWidth: "260px" }}>
              <div style={{ width: "70px", height: "70px", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 1.2rem", fontFamily: "var(--font-display)", fontSize: "1.8rem", fontStyle: "italic", border: "3px solid #0a0a0a", boxShadow: "4px 4px 0 #0a0a0a" }}>{step.num}</div>
              <strong style={{ fontSize: "1.5rem", display: "block", marginBottom: "0.8rem" }}>{step.title}</strong>
              <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 500, lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    bg: "#fff",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Growth</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Viability and Uptake.</h2>
        <ul style={{ fontSize: "1.4rem", lineHeight: 2, listStyle: "none", padding: 0 }}>
          <li>&#x2713; Live on <strong>Ethereum mainnet</strong> at <strong>24-7.markets</strong></li>
          <li>&#x2713; Onboarding: 7 questions, under 60 seconds to a matched portfolio</li>
          <li>&#x2713; Infrastructure proven: <strong>xStocks</strong> tokens, <strong>CoW Protocol</strong> and <strong>1inch Fusion</strong> execution, <strong>Chainlink CRE</strong> automation</li>
          <li>&#x2713; Target: users wanting quick access to stock portfolios and strategies trading 24/7</li>
          <li>&#x2713; Revenue: rebalance execution fees, premium portfolio tiers</li>
        </ul>
      </div>
    ),
  },
  {
    bg: "#0a0a0a",
    color: "#fff",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ecosystem Value</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Impact for xStocks.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ padding: "2.5rem", border: "2px solid #555" }}>
            <strong style={{ color: "#ff1800", fontSize: "1.8rem", display: "block", marginBottom: "1rem" }}>Distribution</strong>
            <p style={{ margin: 0, color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; First product on xStocks</p>
            <p style={{ margin: "0.5rem 0 0", color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Optimised onboarding conversion</p>
          </div>
          <div style={{ padding: "2.5rem", border: "2px solid #555" }}>
            <strong style={{ color: "#ff1800", fontSize: "1.8rem", display: "block", marginBottom: "1rem" }}>Volume</strong>
            <p style={{ margin: 0, color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Rebalances drive trading</p>
            <p style={{ margin: "0.5rem 0 0", color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Manual to fully automated</p>
          </div>
          <div style={{ padding: "2.5rem", border: "2px solid #555" }}>
            <strong style={{ color: "#ff1800", fontSize: "1.8rem", display: "block", marginBottom: "1rem" }}>Security</strong>
            <p style={{ margin: 0, color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Fully non-custodial</p>
            <p style={{ margin: "0.5rem 0 0", color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; User approves every trade</p>
          </div>
          <div style={{ padding: "2.5rem", border: "2px solid #555" }}>
            <strong style={{ color: "#ff1800", fontSize: "1.8rem", display: "block", marginBottom: "1rem" }}>Composability</strong>
            <p style={{ margin: 0, color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Five protocols in production</p>
            <p style={{ margin: "0.5rem 0 0", color: "#bbb", fontSize: "1.3rem", lineHeight: 1.6 }}>&#x2022; Proven end-to-end stack</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    bg: "#ff1800",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(4rem, 8vw, 8rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 1.5rem", textShadow: "5px 5px 0 #0a0a0a", WebkitTextStroke: "2px #0a0a0a" }}>Try it live.</h2>
        <p style={{ fontSize: "3rem", marginBottom: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", fontStyle: "italic" }}>24-7.markets</p>
        {/* QR code to 24-7.markets */}
        <div style={{ margin: "0 auto 1.5rem", width: "160px", height: "160px", background: "#fff", padding: "12px", borderRadius: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=136x136&data=https://24-7.markets&bgcolor=FFFFFF&color=0a0a0a`} alt="QR code to 24-7.markets" width="136" height="136" style={{ display: "block" }} />
        </div>
        <p style={{ fontSize: "1.8rem", fontWeight: 600 }}>Answer 7 questions. See your portfolio. Connect your wallet.</p>
      </div>
    ),
  },
];

export default function SlidesPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    document.title = "24-7 MARKETS: Pitch Deck";
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        setCurrent((c) => Math.max(c - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const slide = slides[current];

  const isDark = slide.bg === "#0a0a0a";
  const isRed = slide.bg === "#ff1800";
  const wmFill = isDark ? "rgba(255,255,255,0.04)" : isRed ? "rgba(10,10,10,0.07)" : "rgba(10,10,10,0.04)";
  const wmSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='140'%3E%3Ctext x='100' y='85' transform='rotate(-12, 360, 70)' font-family='Arial Black,sans-serif' font-size='52' font-weight='900' font-style='italic' fill='${encodeURIComponent(wmFill)}' letter-spacing='0.02em'%3E24-7 MARKETS%3C/text%3E%3C/svg%3E")`;

  return (
    <div
      onClick={() => setCurrent((c) => Math.min(c + 1, slides.length - 1))}
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "clamp(2rem, 5vw, 5rem)",
        background: slide.bg,
        color: slide.color,
        transition: "background 400ms ease, color 400ms ease",
        cursor: current < slides.length - 1 ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Watermark */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: wmSvg, backgroundRepeat: "repeat", backgroundSize: "290px 56px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ maxWidth: "1100px", width: "100%", position: "relative", zIndex: 1 }}>{slide.content}</div>
      <div style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "2rem",
        fontSize: "0.95rem",
        fontFamily: "var(--font-mono), monospace",
        opacity: 0.5,
        color: slide.color,
      }}>
        {current + 1} / {slides.length}
      </div>
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(c - 1, 0)); }}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "2rem",
            background: "none",
            border: "2px solid currentColor",
            color: slide.color,
            padding: "6px 16px",
            fontSize: "0.85rem",
            fontFamily: "var(--font-mono), monospace",
            cursor: "pointer",
            opacity: 0.5,
          }}
          type="button"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
