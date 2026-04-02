"use client";

import { useState, useEffect } from "react";

const slides = [
  {
    bg: "#ff1800",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(4rem, 10vw, 10rem)", fontStyle: "italic", margin: 0, lineHeight: 0.85, textShadow: "6px 6px 0 #0a0a0a", WebkitTextStroke: "3px #0a0a0a" }}>24-7</h1>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 3rem)", fontStyle: "italic", margin: "0.5rem 0 2rem", letterSpacing: "0.1em" }}>MARKETS</h2>
        <p style={{ fontSize: "1.4rem", maxWidth: "600px", margin: "0 auto", fontWeight: 600 }}>Tokenized equity portfolios trading 24/7.<br />Powered by xStocks.</p>
      </div>
    ),
  },
  {
    bg: "#fff",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>The Problem</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Why this matters.</h2>
        <ul style={{ fontSize: "1.3rem", lineHeight: 1.8, listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>Retail investors can&apos;t access professionally constructed equity portfolios without intermediaries.</li>
          <li style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>Existing DeFi portfolio products are opaque, complex, and require active management.</li>
          <li style={{ paddingLeft: "1.5rem", borderLeft: "4px solid #ff1800" }}>No transparent way to see exactly what you own, why, and how it rebalances.</li>
        </ul>
      </div>
    ),
  },
  {
    bg: "#0a0a0a",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>One Sentence</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontStyle: "italic", textTransform: "uppercase", maxWidth: "800px", margin: "0 auto", lineHeight: 1.1 }}>24-7 Markets matches your risk profile to an optimized tokenized equity portfolio — fully transparent, self-custody, automatically rebalanced.</h2>
      </div>
    ),
  },
  {
    bg: "#fff",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>What&apos;s Unique</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Four edges.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ padding: "1.5rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.2rem" }}>Autoresearch</strong><p style={{ margin: "0.5rem 0 0", color: "#555" }}>AI-powered portfolio optimization. Run many experiments, keep the winner. Inspired by Karpathy.</p></div>
          <div style={{ padding: "1.5rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.2rem" }}>Full Transparency</strong><p style={{ margin: "0.5rem 0 0", color: "#555" }}>Every holding, weight, and rebalance rule visible before deposit.</p></div>
          <div style={{ padding: "1.5rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.2rem" }}>Self-Custody</strong><p style={{ margin: "0.5rem 0 0", color: "#555" }}>Assets stay in your Privy wallet. We never take custody.</p></div>
          <div style={{ padding: "1.5rem", border: "3px solid #0a0a0a", boxShadow: "6px 6px 0 #0a0a0a" }}><strong style={{ fontSize: "1.2rem" }}>24/7 Access</strong><p style={{ margin: "0.5rem 0 0", color: "#555" }}>Tokenized equities trade around the clock on Ethereum.</p></div>
        </div>
      </div>
    ),
  },
  {
    bg: "#f5f5f5",
    color: "#0a0a0a",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Architecture</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>The Stack.</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: "700px", margin: "0 auto" }}>
          {[
            { label: "You", detail: "Connect wallet. Choose portfolio. Approve changes.", bg: "#ffd84d" },
            { label: "24-7 Markets", detail: "Profile matching. Autoresearch portfolio construction.", bg: "#fff" },
            { label: "Privy", detail: "Smart wallets. Embedded auth. Non-custodial keys.", bg: "#fff" },
            { label: "Chainlink CRE", detail: "Drift monitoring. Rebalance automation.", bg: "#fff" },
            { label: "CoW + 1inch", detail: "MEV-protected swaps. DEX aggregation.", bg: "#fff" },
            { label: "xStocks", detail: "Tokenized US equities. 1:1 backed. On-chain.", bg: "#0a0a0a", color: "#fff" },
          ].map((layer) => (
            <div key={layer.label} style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1rem 1.5rem", border: "3px solid #0a0a0a", borderBottom: "none", background: layer.bg, color: layer.color ?? "#0a0a0a" }}>
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontStyle: "italic", textTransform: "uppercase", minWidth: "160px" }}>{layer.label}</strong>
              <span style={{ fontSize: "1rem" }}>{layer.detail}</span>
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
        <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#0a0a0a" }}>Portfolio Intelligence</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem", textShadow: "3px 3px 0 #0a0a0a" }}>How Autoresearch Works.</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
          {[
            { num: "1", title: "Generate", desc: "Test different weights, holdings, and risk profiles." },
            { num: "2", title: "Replay-Test", desc: "Simulate each against 30 days of real market data." },
            { num: "3", title: "Promote", desc: "Best performer becomes your portfolio. Re-evaluated regularly." },
          ].map((step) => (
            <div key={step.num} style={{ textAlign: "center", maxWidth: "220px" }}>
              <div style={{ width: "60px", height: "60px", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 1rem", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontStyle: "italic", border: "3px solid #0a0a0a", boxShadow: "4px 4px 0 #0a0a0a" }}>{step.num}</div>
              <strong style={{ fontSize: "1.2rem", display: "block", marginBottom: "0.5rem" }}>{step.title}</strong>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>{step.desc}</p>
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
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Growth</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Viability &amp; Uptake.</h2>
        <ul style={{ fontSize: "1.2rem", lineHeight: 2, listStyle: "none", padding: 0 }}>
          <li>&#x2713; Live on Ethereum mainnet at <strong>24-7.markets</strong></li>
          <li>&#x2713; Onboarding: 7 questions, under 60 seconds to matched portfolio</li>
          <li>&#x2713; Infrastructure proven: xStocks tokens + CoW/1inch execution + Chainlink automation</li>
          <li>&#x2713; Target: Crypto-native users who want equity exposure without leaving DeFi</li>
          <li>&#x2713; Revenue: Rebalance execution fees, premium portfolio tiers</li>
        </ul>
      </div>
    ),
  },
  {
    bg: "#0a0a0a",
    color: "#fff",
    content: (
      <div>
        <p style={{ color: "#ff1800", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ecosystem Value</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 2rem" }}>Impact for xStocks.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ padding: "1.5rem", border: "2px solid #555" }}><strong style={{ color: "#ff1800", fontSize: "1.1rem" }}>Distribution</strong><p style={{ margin: "0.5rem 0 0", color: "#999" }}>First consumer-facing product built on xStocks tokens.</p></div>
          <div style={{ padding: "1.5rem", border: "2px solid #555" }}><strong style={{ color: "#ff1800", fontSize: "1.1rem" }}>Volume</strong><p style={{ margin: "0.5rem 0 0", color: "#999" }}>Every portfolio rebalance generates xStocks trading volume.</p></div>
          <div style={{ padding: "1.5rem", border: "2px solid #555" }}><strong style={{ color: "#ff1800", fontSize: "1.1rem" }}>Proof of Ecosystem</strong><p style={{ margin: "0.5rem 0 0", color: "#999" }}>Demonstrates xStocks tokens work in real portfolio products.</p></div>
          <div style={{ padding: "1.5rem", border: "2px solid #555" }}><strong style={{ color: "#ff1800", fontSize: "1.1rem" }}>Composability</strong><p style={{ margin: "0.5rem 0 0", color: "#999" }}>xStocks + Privy + CoW + 1inch + Chainlink working together.</p></div>
        </div>
      </div>
    ),
  },
  {
    bg: "#ff1800",
    color: "#fff",
    content: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 6vw, 6rem)", fontStyle: "italic", textTransform: "uppercase", margin: "0 0 1rem", textShadow: "4px 4px 0 #0a0a0a", WebkitTextStroke: "2px #0a0a0a" }}>Try it live.</h2>
        <p style={{ fontSize: "1.4rem", marginBottom: "2rem", fontWeight: 600 }}>24-7.markets</p>
        <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)" }}>Answer 7 questions. See your portfolio. Connect your wallet.</p>
      </div>
    ),
  },
];

export default function SlidesPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    document.title = "24-7 MARKETS — Pitch Deck";
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

  return (
    <div
      onClick={() => setCurrent((c) => Math.min(c + 1, slides.length - 1))}
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "clamp(2rem, 5vw, 6rem)",
        background: slide.bg,
        color: slide.color,
        transition: "background 400ms ease, color 400ms ease",
        cursor: current < slides.length - 1 ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1000px", width: "100%" }}>{slide.content}</div>
      <div style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "2rem",
        fontSize: "0.85rem",
        fontFamily: "var(--font-mono), monospace",
        opacity: 0.5,
        color: slide.color,
      }}>
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
