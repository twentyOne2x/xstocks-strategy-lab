export interface WorkflowTemplate {
  name: string;
  description: string;
  icon: string;
  category: "trading" | "alerts" | "social" | "defi";
  nodes: Array<{
    id: string;
    definitionId: string;
    role: "trigger" | "action";
    position: { x: number; y: number };
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export const templates: WorkflowTemplate[] = [
  {
    name: "Price Drop Alert",
    description: "Get notified when a token price drops below a threshold",
    icon: "📉",
    category: "alerts",
    nodes: [
      { id: "t1", definitionId: "price-alert", role: "trigger", position: { x: 300, y: 80 }, config: { token: "ETH", price: "3000", direction: "below" } },
      { id: "a1", definitionId: "notification", role: "action", position: { x: 300, y: 340 }, config: { channel: "discord", message: "Price alert: {{t1.token}} dropped to ${{t1.currentPrice}} (target: ${{t1.targetPrice}})" } },
    ],
    edges: [{ id: "e1", source: "t1", target: "a1" }],
  },
  {
    name: "Sentiment-Based Swap",
    description: "Analyze tweet sentiment, swap tokens if bullish",
    icon: "🧠",
    category: "trading",
    nodes: [
      { id: "t1", definitionId: "x-post", role: "trigger", position: { x: 300, y: 50 }, config: { username: "@ethereum" } },
      { id: "a1", definitionId: "sentiment", role: "action", position: { x: 300, y: 280 }, config: { text: "{{t1.text}}" } },
      { id: "a2", definitionId: "condition", role: "action", position: { x: 300, y: 510 }, config: { field: "label", operator: "==", value: "positive" } },
      { id: "a3", definitionId: "log", role: "action", position: { x: 300, y: 740 }, config: { message: "Bullish signal: score {{a1.score}} for {{a1.referencedAsset}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "a2" },
      { id: "e3", source: "a2", target: "a3" },
    ],
  },
  {
    name: "Whale Wallet Monitor",
    description: "Track a whale wallet and alert on large balance changes",
    icon: "🐋",
    category: "defi",
    nodes: [
      { id: "t1", definitionId: "balance", role: "trigger", position: { x: 300, y: 80 }, config: { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", token: "ETH", threshold: "100" } },
      { id: "a1", definitionId: "notification", role: "action", position: { x: 300, y: 340 }, config: { channel: "discord", message: "Whale alert: {{t1.address}} has {{t1.balance}} {{t1.token}} (threshold: {{t1.threshold}})" } },
    ],
    edges: [{ id: "e1", source: "t1", target: "a1" }],
  },
  {
    name: "Polymarket Arbitrage Scanner",
    description: "Monitor a prediction market and log when odds shift",
    icon: "🎯",
    category: "trading",
    nodes: [
      { id: "t1", definitionId: "polymarket", role: "trigger", position: { x: 300, y: 80 }, config: { marketId: "", marketQuestion: "", outcome: "Yes", threshold: "60", direction: "above" } },
      { id: "a1", definitionId: "log", role: "action", position: { x: 300, y: 340 }, config: { message: "Market: {{t1.question}} — {{t1.outcome}} at {{t1.currentPrice}}% (threshold {{t1.threshold}}%)" } },
    ],
    edges: [{ id: "e1", source: "t1", target: "a1" }],
  },
  {
    name: "New Block Logger",
    description: "Log every new block on a chain",
    icon: "⛓️",
    category: "defi",
    nodes: [
      { id: "t1", definitionId: "new-block", role: "trigger", position: { x: 300, y: 80 }, config: { chain: "ethereum" } },
      { id: "a1", definitionId: "log", role: "action", position: { x: 300, y: 340 }, config: { message: "New block #{{t1.blockNumber}} on {{t1.chain}} at {{t1.timestamp}}" } },
    ],
    edges: [{ id: "e1", source: "t1", target: "a1" }],
  },
  {
    name: "Tweet → Sentiment → Notify",
    description: "Analyze sentiment of tweets and push a notification summary",
    icon: "📊",
    category: "social",
    nodes: [
      { id: "t1", definitionId: "x-post", role: "trigger", position: { x: 300, y: 50 }, config: { username: "@VitalikButerin" } },
      { id: "a1", definitionId: "sentiment", role: "action", position: { x: 300, y: 280 }, config: { text: "{{t1.text}}" } },
      { id: "a2", definitionId: "notification", role: "action", position: { x: 300, y: 510 }, config: { channel: "push", message: "{{t1.username}} posted ({{a1.label}}, score: {{a1.score}}): {{t1.text}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "a2" },
    ],
  },
  {
    name: "Periodic API Health Check",
    description: "Call an API every interval and log the response",
    icon: "🏥",
    category: "alerts",
    nodes: [
      { id: "t1", definitionId: "every-period", role: "trigger", position: { x: 300, y: 80 }, config: { interval: "5", unit: "minutes" } },
      { id: "a1", definitionId: "api-call", role: "action", position: { x: 300, y: 310 }, config: { url: "https://httpbin.org/get", method: "GET" } },
      { id: "a2", definitionId: "log", role: "action", position: { x: 300, y: 540 }, config: { message: "Health check: status {{a1.statusCode}} from {{a1.url}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "a2" },
    ],
  },
  {
    name: "Price Alert → Token Swap",
    description: "When ETH drops below target, swap USDC to ETH (buy the dip)",
    icon: "💰",
    category: "trading",
    nodes: [
      { id: "t1", definitionId: "price-alert", role: "trigger", position: { x: 300, y: 50 }, config: { token: "ETH", price: "2500", direction: "below" } },
      { id: "a1", definitionId: "swap", role: "action", position: { x: 300, y: 280 }, config: { fromToken: "USDCx", fromTokenName: "USDC xStock", toToken: "ETH", toTokenName: "Ethereum", amount: "100", slippage: 0.5 } },
      { id: "a2", definitionId: "notification", role: "action", position: { x: 300, y: 510 }, config: { channel: "discord", message: "Bought the dip! Swapped {{a1.amountIn}} USDC → {{a1.amountOut}} ETH. Tx: {{a1.txHash}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "a2" },
    ],
  },
  {
    name: "Multi-Signal Dashboard",
    description: "Fan-out from a tweet to sentiment + notification simultaneously",
    icon: "📡",
    category: "social",
    nodes: [
      { id: "t1", definitionId: "x-post", role: "trigger", position: { x: 400, y: 50 }, config: { username: "@CryptoNewsAlerts" } },
      { id: "a1", definitionId: "sentiment", role: "action", position: { x: 200, y: 300 }, config: { text: "{{t1.text}}" } },
      { id: "a2", definitionId: "notification", role: "action", position: { x: 600, y: 300 }, config: { channel: "discord", message: "New crypto news from {{t1.username}}: {{t1.text}}" } },
      { id: "a3", definitionId: "log", role: "action", position: { x: 200, y: 530 }, config: { message: "Sentiment: {{a1.label}} ({{a1.score}}) | Asset: {{a1.referencedAsset}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "t1", target: "a2" },
      { id: "e3", source: "a1", target: "a3" },
    ],
  },
  {
    name: "Webhook → Process → Notify",
    description: "Receive external data via webhook, process and notify",
    icon: "🔗",
    category: "alerts",
    nodes: [
      { id: "t1", definitionId: "webhook", role: "trigger", position: { x: 300, y: 50 }, config: { path: "/my-webhook" } },
      { id: "a1", definitionId: "condition", role: "action", position: { x: 300, y: 280 }, config: { field: "payload.event", operator: "==", value: "alert" } },
      { id: "a2", definitionId: "notification", role: "action", position: { x: 300, y: 510 }, config: { channel: "email", message: "Webhook alert received: {{t1.payload}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "a2" },
    ],
  },
];
