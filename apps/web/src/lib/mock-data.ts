import type {
  BlotterData,
  OnboardingQuestion,
  PromotedManifest,
  PublicStrategyCardData,
  StateStripItem,
  ThemeSummary,
} from "@/lib/contracts";

export const themes: ThemeSummary[] = [
  {
    id: "ai-infra",
    title: "AI Infra",
    stance: "Quality leaders, overweight infra demand.",
    description:
      "High-conviction basket for platform and infrastructure names tied to AI capex.",
    leadSymbols: ["NVDAx", "AVGOx", "MSFTx"],
  },
  {
    id: "us-tech-leaders",
    title: "US Tech Leaders",
    stance: "Rotate toward cash-generating mega cap leaders.",
    description:
      "Broader basket for users who want high information density without single-name concentration.",
    leadSymbols: ["AAPLx", "MSFTx", "GOOGLx"],
  },
  {
    id: "spy-core",
    title: "S&P Core",
    stance: "Stay close to index beta with explicit downside posture.",
    description:
      "Lower-volatility path designed for first-run users and funding-constrained accounts.",
    leadSymbols: ["SPYx", "BRK.Bx", "MSFTx"],
  },
];

export const stateStrip: StateStripItem[] = [
  {
    label: "xChange routes",
    value: "2 verified",
    delta: "+0",
    status: "steady",
    note: "Cow Swap and 1inch remain the promoted Ethereum execution surfaces.",
  },
  {
    label: "Promoted winners",
    value: "4 preview portfolios",
    delta: "+1",
    status: "up",
    note: "Only current promoted manifests are surfaced in the shell.",
  },
  {
    label: "PoR coverage",
    value: "99.2%",
    delta: "+0.3%",
    status: "up",
    note: "Mock strip for proof-of-reserves visibility in the terminal header.",
  },
  {
    label: "Funding posture",
    value: "Preview until deposit",
    delta: "explicit",
    status: "steady",
    note: "Qualification, comparison, and route review stay readable before activation.",
  },
];

export const manifests: PromotedManifest[] = [
  {
    manifest_id: "manifest_ai_infra_v12",
    slot_id: "onboarding.default_basket",
    mode: "basket",
    chain: "Ethereum",
    strategy_version: "basket-starter-h6-p100-c5-cap18-a0-r300-v1",
    theme_id: "ai-infra",
    slug: "onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
    hero_symbol: "NVDAx",
    frontend: {
      title: "AI Infra Leaders",
      subtitle: "Promoted default for concentrated AI infrastructure exposure.",
      risk_label: "Moderate",
      summary:
        "Four-name portfolio leaning into AI compute leaders with a cash reserve to soften rebalance churn.",
      thesis:
        "Momentum stays positive while breadth improves, so the promoted winner keeps NVDAx and AVGOx heavy but leaves room for MSFTx stability and reserve carry.",
      badges: [
        {
          label: "Current default",
          detail: "Promoted basket winner",
          tone: "current",
        },
        {
          label: "Validated",
          detail: "12m replay held above benchmark",
          tone: "validated",
        },
        {
          label: "Replay ready",
          detail: "$1,000 comparison available",
          tone: "accent",
        },
      ],
    },
    validation: {
      dataset_version: "bundle-2026-q1-r3",
      evaluator_version: "eval-0.4.2",
      objective_id: "risk-adjusted-upside",
      score: 74,
      delta_vs_incumbent: 8.6,
      promoted_at: "2026-03-29T09:40:00Z",
      last_validated_at: "2026-03-31T07:15:00Z",
    },
    activation_template: {
      route_summary:
        "Fund USDC, convert through verified Ethereum xChange route, settle portfolio positions through promoted weights.",
      allowed_actions: [
        "Connect wallet",
        "Fund wallet",
        "Activate strategy",
        "Pause strategy",
      ],
      funding_options: ["USDC transfer", "Existing smart account balance"],
      rails: ["Cow Swap", "1inch", "xChange"],
      reversible: true,
      required_state: "activation_ready",
    },
    fallback: {
      previous_incumbent_id: "manifest_ai_infra_v11",
      disable_conditions: [
        "Reserve coverage drops below threshold",
        "Route slippage widens outside replay band",
      ],
    },
    market_intelligence: {
      scopeLabel: "Market Intelligence",
      currentView: "Positive breadth expansion across AI infra leaders.",
      confidence: "78 / 100",
      horizon: "15 to 45 trading days",
      implication:
        "Favor the promoted basket over single-name chase. Keep reserve carry available for rebalance adds.",
      whatChanged: [
        "Broadcom breadth improved after enterprise bookings beat.",
        "MSFTx regained relative strength without forcing the basket into equal weight.",
        "Dealer positioning on NVDAx cooled enough to reduce gap risk.",
      ],
      promptQueue: [
        {
          label: "Why now",
          prompt: "Show the breadth change that pushed this basket ahead of the balanced alternative.",
        },
        {
          label: "Reserve logic",
          prompt: "Explain why the cash reserve stays explicit before the next rebalance.",
        },
      ],
      drivers: [
        {
          label: "Earnings revision pulse",
          value: "positive",
          tone: "positive",
          note: "Upward revisions clustered in semiconductor infra names.",
        },
        {
          label: "Retail crowding",
          value: "neutral",
          tone: "neutral",
          note: "Crowding cooled from last week extremes.",
        },
        {
          label: "Route resilience",
          value: "watch",
          tone: "warning",
          note: "Execution path remains good but reserve sensitivity is visible.",
        },
      ],
      routeState: {
        chain: "Ethereum",
        primaryVenue: "Cow Swap",
        backupVenue: "1inch",
        reserveWindow: "Healthy reserve spread",
        multiplierWindow: "1.00x spot positions",
        proofOfReserves: "99.2% disclosed backing",
        status: "view_ready",
      },
      walletState: {
        state: "view_ready",
        accountLabel: "No wallet connected",
        fundingLabel: "Funding not required yet",
        permissionSummary: "Permissions appear only on activation review.",
      },
      vaultState: {
        venue: "xChange basket route",
        structure: "Spot basket with cash reserve",
        borrowAsset: "None",
        reversibility: "Pause or turn off without hidden leverage unwind",
        status: "Promoted",
      },
      actions: ["See the view", "Compare replay", "Deposit to activate"],
    },
    explanation: {
      thesis:
        "Momentum stays positive while breadth improves, so the promoted winner keeps NVDAx and AVGOx heavy but leaves room for MSFTx stability and reserve carry.",
      whatThisDoes:
        "Holds four tokenized AI infrastructure names with a visible cash reserve so the basket can rebalance without hiding route friction.",
      bestForUser:
        "Best for users who want concentrated AI-infra exposure but still want the cash reserve and rebalance rules explained up front.",
      howItChanges:
        "The basket only changes when the promoted weights refresh and the cash reserve still clears the rebalance thresholds.",
      replayInterpretation:
        "Replay shows how the promoted basket would have behaved over the validated window. It is not a live execution promise.",
      holdingRationales: [
        {
          symbol: "NVDAx",
          sleeve: "Core leader",
          rationale: "Top AI infrastructure stock: drives portfolio growth.",
        },
        {
          symbol: "AVGOx",
          sleeve: "Throughput kicker",
          rationale: "Adds diversification with steady revenue growth alongside NVDA.",
        },
        {
          symbol: "MSFTx",
          sleeve: "Stability anchor",
          rationale: "Stability anchor: reduces overall portfolio risk.",
        },
        {
          symbol: "USDC",
          sleeve: "Reserve buffer",
          rationale: "Cash reserve: available for rebalancing or withdrawal.",
        },
      ],
      bundle: {
        whatThisPortfolioDoes:
          "Holds four tokenized AI infrastructure names with a visible cash reserve so the basket can rebalance without hiding route friction.",
        howItIsBuilt:
          "The basket keeps NVDAx and AVGOx as the core growth positions, adds MSFTx as a stability anchor, and preserves a visible USDC reserve buffer for cleaner rebalances.",
        howItChanges:
          "The basket only changes when the promoted weights refresh and the cash reserve still clears the rebalance thresholds.",
        whatWouldTriggerNextRebalance:
          "A promoted-weight refresh or reserve-threshold drift is required before the next rebalance review is worth taking.",
        howToReadReplay:
          "Replay shows how the promoted basket would have behaved over the validated window. It is not a live execution promise.",
        bestFor:
          "Best for users who want concentrated AI-infra exposure but still want the cash reserve and rebalance rules explained up front.",
        components: [
          {
            componentId: "nvdax-core",
            kind: "asset",
            sleeve: "Core leader",
            title: "NVDAx",
            rationale: "Top AI infrastructure stock: drives portfolio growth.",
            targetWeightPct: 32,
            grossExposurePct: null,
            assetSymbol: "NVDAx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "avgox-throughput",
            kind: "asset",
            sleeve: "Throughput kicker",
            title: "AVGOx",
            rationale: "Adds diversification with steady revenue growth alongside NVDA.",
            targetWeightPct: 24,
            grossExposurePct: null,
            assetSymbol: "AVGOx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "msftx-ballast",
            kind: "asset",
            sleeve: "Stability anchor",
            title: "MSFTx",
            rationale: "Stability anchor: reduces overall portfolio risk.",
            targetWeightPct: 21,
            grossExposurePct: null,
            assetSymbol: "MSFTx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "usdc-reserve",
            kind: "cash_buffer",
            sleeve: "Reserve buffer",
            title: "USDC reserve",
            rationale: "Cash reserve: available for rebalancing or withdrawal.",
            targetWeightPct: 23,
            grossExposurePct: null,
            assetSymbol: "USDC",
            basketId: null,
            venueId: "smart_account_balance",
          },
        ],
      },
    },
    replay: {
      startingCapital: 1000,
      endingCapital: 1284,
      netReturnPct: 28.4,
      maxDrawdownPct: -9.8,
      turnoverPct: 12.1,
      winRatePct: 67,
      monthlyEdgePct: 2.4,
    },
    comparison: [
      {
        label: "AI Infra Leaders",
        mode: "basket",
        posture: "Winner",
        whyItWon:
          "Best mix of upside capture and manageable drawdown on the pinned bundle.",
        endingValue: 1284,
        alphaPct: 10.9,
        drawdownPct: -9.8,
        score: 74,
        riskLabel: "Moderate",
        href: "/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
      },
      {
        label: "Mag 7 Cash Balance",
        mode: "basket",
        posture: "Alternative",
        whyItWon:
          "Lower turnover and cleaner breadth, but weaker upside when semis accelerate.",
        endingValue: 1176,
        alphaPct: 2.1,
        drawdownPct: -7.2,
        score: 66,
        riskLabel: "Moderate",
        href: "/workspace/detail/onboarding-alt-basket-1--basket-core-h5-p100-c2-cap22-a0-r275-v1",
      },
      {
        label: "SPY Core Shield",
        mode: "basket",
        posture: "Defensive",
        whyItWon:
          "Best capital protection, but did not keep pace when the theme broadened out.",
        endingValue: 1089,
        alphaPct: -3.4,
        drawdownPct: -4.1,
        score: 59,
        riskLabel: "Measured",
        href: "/workspace/detail/onboarding-alt-basket-2--basket-starter-h6-p100-c1-cap17-a0-r275-v1",
      },
    ],
    allocations: [
      {
        symbol: "NVDAx",
        targetWeight: "32%",
        sleeve: "Core leader",
        venue: "xChange / Cow Swap",
        multiplier: "1.00x",
        proofOfReserves: "98.9%",
        rationale: "Top AI infrastructure stock: drives portfolio growth.",
      },
      {
        symbol: "AVGOx",
        targetWeight: "24%",
        sleeve: "Throughput kicker",
        venue: "xChange / Cow Swap",
        multiplier: "1.00x",
        proofOfReserves: "99.0%",
        rationale: "Adds diversification with steady revenue growth alongside NVDA.",
      },
      {
        symbol: "MSFTx",
        targetWeight: "21%",
        sleeve: "Stability anchor",
        venue: "xChange / 1inch",
        multiplier: "1.00x",
        proofOfReserves: "99.3%",
        rationale: "Stability anchor: reduces overall portfolio risk.",
      },
      {
        symbol: "USDC",
        targetWeight: "23%",
        sleeve: "Reserve buffer",
        venue: "Smart account balance",
        multiplier: "Cash",
        proofOfReserves: "N/A",
        rationale: "Cash reserve: available for rebalancing or withdrawal.",
      },
    ],
    route_notes: [
      "Primary route uses verified Ethereum xChange execution through Cow Swap.",
      "1inch remains the secondary venue for route fallback and quote comparison.",
      "No hidden leverage in the promoted portfolio positions.",
    ],
    methodology_notes: [
      "Replay uses the pinned Q1 research bundle with fixed evaluator rules.",
      "Promoted score favors risk-adjusted upside rather than raw return alone.",
      "User-facing surface hides discarded challengers and raw results rows.",
    ],
    live_state: {
      state: "view_ready",
      routeLabel: "Route available",
      routeSummary: "Cow Swap primary, 1inch backup",
      reserveLabel: "Cash reserve ready",
      multiplierLabel: "Spot basket only",
      proofOfReservesLabel: "PoR visible per position",
      pauseRule: "Pause stops future rebalances, current holdings remain explicit.",
    },
    preview: {
      recommendationExplanationBundle: null,
      rebalanceOrchestration: null,
      executionPreview: null,
    },
  },
  {
    manifest_id: "manifest_mag7_balance_v7",
    slot_id: "onboarding.alt_basket_1",
    mode: "basket",
    chain: "Ethereum",
    strategy_version: "basket-core-h5-p100-c2-cap22-a0-r275-v1",
    theme_id: "us-tech-leaders",
    slug: "onboarding-alt-basket-1--basket-core-h5-p100-c2-cap22-a0-r275-v1",
    hero_symbol: "MSFTx",
    frontend: {
      title: "Mag 7 Cash Balance",
      subtitle: "Broader quality basket with lighter concentration and lower churn.",
      risk_label: "Moderate",
      summary:
        "Balanced mega-cap allocation built for users who want a calmer default than the focused AI infra basket.",
      thesis:
        "Quality leadership remains intact, but the promoted basket trims the highest-beta names and lets cash damp volatility between rebalances.",
      badges: [
        {
          label: "Validated",
          detail: "Breadth-first basket",
          tone: "validated",
        },
        {
          label: "Lower churn",
          detail: "Turnover held under 9%",
          tone: "positive",
        },
      ],
    },
    validation: {
      dataset_version: "bundle-2026-q1-r3",
      evaluator_version: "eval-0.4.2",
      objective_id: "risk-adjusted-upside",
      score: 66,
      delta_vs_incumbent: 1.8,
      promoted_at: "2026-03-27T15:10:00Z",
      last_validated_at: "2026-03-31T07:15:00Z",
    },
    activation_template: {
      route_summary:
        "Build a diversified mega-cap basket through verified Ethereum spot routes with a visible cash reserve.",
      allowed_actions: [
        "Connect wallet",
        "Fund wallet",
        "Activate strategy",
        "Pause strategy",
      ],
      funding_options: ["USDC transfer", "Bridge into smart account"],
      rails: ["Cow Swap", "1inch", "xChange"],
      reversible: true,
      required_state: "activation_ready",
    },
    fallback: {
      previous_incumbent_id: "manifest_mag7_balance_v6",
      disable_conditions: ["Theme breadth deteriorates below quality threshold"],
    },
    market_intelligence: {
      scopeLabel: "Market Intelligence",
      currentView: "Mega-cap quality remains constructive, but upside leadership is less concentrated.",
      confidence: "69 / 100",
      horizon: "20 to 60 trading days",
      implication:
        "Use broader quality exposure when concentration risk matters more than maximal theme capture.",
      whatChanged: [
        "Equal-weight breadth improved across software and platform names.",
        "Semiconductor leadership remained intact but less singular.",
        "Cash buffer improved risk-adjusted results in choppy weeks.",
      ],
      promptQueue: [
        {
          label: "Breadth check",
          prompt: "Compare this balanced basket against the concentrated AI infra winner on breadth and turnover.",
        },
        {
          label: "Cash reserve",
          prompt: "Show how the cash reserve reduced churn versus the faster basket.",
        },
      ],
      drivers: [
        {
          label: "Breadth",
          value: "positive",
          tone: "positive",
          note: "More names contributing to trend support.",
        },
        {
          label: "Concentration",
          value: "moderating",
          tone: "neutral",
          note: "Reduced single-name dependency versus the infra basket.",
        },
        {
          label: "Execution drag",
          value: "low",
          tone: "positive",
          note: "Lower rebalance frequency helped route efficiency.",
        },
      ],
      routeState: {
        chain: "Ethereum",
        primaryVenue: "1inch",
        backupVenue: "Cow Swap",
        reserveWindow: "Cash reserve absorbing minor dislocations",
        multiplierWindow: "1.00x spot positions",
        proofOfReserves: "99.1% disclosed backing",
        status: "view_ready",
      },
      walletState: {
        state: "view_ready",
        accountLabel: "No wallet connected",
        fundingLabel: "Funding staged later",
        permissionSummary: "Only activation review requests permissions.",
      },
      vaultState: {
        venue: "xChange basket route",
        structure: "Diversified spot basket",
        borrowAsset: "None",
        reversibility: "Pause halts future rebalances only",
        status: "Promoted",
      },
      actions: ["See the view", "Compare replay", "Deposit to activate"],
    },
    explanation: {
      thesis:
        "Quality leadership remains intact, but the promoted basket trims the highest-beta names and lets cash damp volatility between rebalances.",
      whatThisDoes:
        "Builds a broader mega-cap basket with a larger cash reserve so turnover and route churn stay calmer than the concentrated AI basket.",
      bestForUser:
        "Best for users who want broad tech exposure, lower churn, and a clearer first deposit path than the higher-conviction basket.",
      howItChanges:
        "This basket changes on the promoted refresh cadence, with the cash reserve absorbing smaller drifts before a full rebalance is worth taking.",
      replayInterpretation:
        "Replay compares the promoted balanced basket against the same validated window. It does not imply live automation.",
      holdingRationales: [
        {
          symbol: "MSFTx",
          sleeve: "Quality anchor",
          rationale: "Largest and most stable holding: anchors the portfolio.",
        },
        {
          symbol: "AAPLx",
          sleeve: "Cash flow stabilizer",
          rationale: "Adds diversification across consumer and cloud platforms.",
        },
        {
          symbol: "GOOGLx",
          sleeve: "AI demand proxy",
          rationale: "Exposure to AI revenue growth with lower hardware risk.",
        },
        {
          symbol: "USDC",
          sleeve: "Reserve buffer",
          rationale: "Cash reserve: keeps trading costs low and provides rebalance flexibility.",
        },
      ],
      bundle: {
        whatThisPortfolioDoes:
          "Builds a broader mega-cap basket with a larger cash reserve so turnover and route churn stay calmer than the concentrated AI basket.",
        howItIsBuilt:
          "The portfolio spreads exposure across quality mega-cap leaders and keeps a larger USDC cash reserve so the basket can absorb smaller drifts without forcing trades.",
        howItChanges:
          "This basket changes on the promoted refresh cadence, with the cash reserve absorbing smaller drifts before a full rebalance is worth taking.",
        whatWouldTriggerNextRebalance:
          "A promoted refresh or a larger cash-reserve drift triggers the next rebalance review.",
        howToReadReplay:
          "Replay compares the promoted balanced basket against the same validated window. It does not imply live automation.",
        bestFor:
          "Best for users who want broad tech exposure, lower churn, and a clearer first deposit path than the higher-conviction basket.",
        components: [
          {
            componentId: "msftx-quality-anchor",
            kind: "asset",
            sleeve: "Quality anchor",
            title: "MSFTx",
            rationale: "Largest and most stable holding: anchors the portfolio.",
            targetWeightPct: 24,
            grossExposurePct: null,
            assetSymbol: "MSFTx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "aaplx-cashflow-ballast",
            kind: "asset",
            sleeve: "Cash flow stabilizer",
            title: "AAPLx",
            rationale: "Adds diversification across consumer and cloud platforms.",
            targetWeightPct: 19,
            grossExposurePct: null,
            assetSymbol: "AAPLx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "googlx-ai-proxy",
            kind: "asset",
            sleeve: "AI demand proxy",
            title: "GOOGLx",
            rationale: "Exposure to AI revenue growth with lower hardware risk.",
            targetWeightPct: 18,
            grossExposurePct: null,
            assetSymbol: "GOOGLx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "usdc-cash-buffer",
            kind: "cash_buffer",
            sleeve: "Reserve buffer",
            title: "USDC reserve",
            rationale: "Cash reserve: keeps trading costs low and provides rebalance flexibility.",
            targetWeightPct: 39,
            grossExposurePct: null,
            assetSymbol: "USDC",
            basketId: null,
            venueId: "smart_account_balance",
          },
        ],
      },
    },
    replay: {
      startingCapital: 1000,
      endingCapital: 1176,
      netReturnPct: 17.6,
      maxDrawdownPct: -7.2,
      turnoverPct: 8.4,
      winRatePct: 61,
      monthlyEdgePct: 1.6,
    },
    comparison: [],
    allocations: [
      {
        symbol: "MSFTx",
        targetWeight: "24%",
        sleeve: "Quality anchor",
        venue: "xChange / 1inch",
        multiplier: "1.00x",
        proofOfReserves: "99.3%",
        rationale: "Largest and most stable holding: anchors the portfolio.",
      },
      {
        symbol: "AAPLx",
        targetWeight: "19%",
        sleeve: "Cash flow stabilizer",
        venue: "xChange / 1inch",
        multiplier: "1.00x",
        proofOfReserves: "99.0%",
        rationale: "Adds diversification across consumer and cloud platforms.",
      },
      {
        symbol: "GOOGLx",
        targetWeight: "18%",
        sleeve: "AI demand proxy",
        venue: "xChange / Cow Swap",
        multiplier: "1.00x",
        proofOfReserves: "98.8%",
        rationale: "Exposure to AI revenue growth with lower hardware risk.",
      },
      {
        symbol: "USDC",
        targetWeight: "39%",
        sleeve: "Reserve buffer",
        venue: "Smart account balance",
        multiplier: "Cash",
        proofOfReserves: "N/A",
        rationale: "Cash reserve: keeps trading costs low and provides rebalance flexibility.",
      },
    ],
    route_notes: [
      "Broader basket prefers 1inch first because multi-asset quote routing looks cleaner in this mock state.",
      "Fallback to Cow Swap remains visible in the route strip and activation review.",
    ],
    methodology_notes: [
      "Same dataset and evaluator version as other basket winners.",
      "Promotion favored calmer drawdown profile over absolute return.",
    ],
    live_state: {
      state: "view_ready",
      routeLabel: "Route available",
      routeSummary: "1inch primary, Cow Swap backup",
      reserveLabel: "High cash reserve",
      multiplierLabel: "Spot basket only",
      proofOfReservesLabel: "PoR visible per position",
      pauseRule: "Pause stops future rebalances.",
    },
    preview: {
      recommendationExplanationBundle: null,
      rebalanceOrchestration: null,
      executionPreview: null,
    },
  },
  {
    manifest_id: "manifest_spy_core_v5",
    slot_id: "onboarding.alt_basket_2",
    mode: "basket",
    chain: "Ethereum",
    strategy_version: "basket-starter-h6-p100-c1-cap17-a0-r275-v1",
    theme_id: "spy-core",
    slug: "onboarding-alt-basket-2--basket-starter-h6-p100-c1-cap17-a0-r275-v1",
    hero_symbol: "SPYx",
    frontend: {
      title: "SPY Core Shield",
      subtitle: "Lower-volatility default for users prioritizing capital protection.",
      risk_label: "Measured",
      summary:
        "Index-adjacent basket that keeps SPYx at the center and uses reserve posture to reduce churn.",
      thesis:
        "Stay close to beta, keep route complexity simple, and surface a calmer activation path for first funding.",
      badges: [
        {
          label: "Current defensive view",
          detail: "Lower-volatility starter",
          tone: "current",
        },
        {
          label: "Validated",
          detail: "Best drawdown control",
          tone: "validated",
        },
      ],
    },
    validation: {
      dataset_version: "bundle-2026-q1-r3",
      evaluator_version: "eval-0.4.2",
      objective_id: "capital-preservation",
      score: 59,
      delta_vs_incumbent: 4.1,
      promoted_at: "2026-03-25T12:00:00Z",
      last_validated_at: "2026-03-31T07:15:00Z",
    },
    activation_template: {
      route_summary:
        "Keep the route simple around SPYx, hold a cash reserve, and expose every reversible control before activation.",
      allowed_actions: [
        "Connect wallet",
        "Fund wallet",
        "Activate strategy",
        "Turn off strategy",
      ],
      funding_options: ["USDC transfer", "Bank-to-wallet rail once available"],
      rails: ["Cow Swap", "xChange"],
      reversible: true,
      required_state: "connect_required",
    },
    fallback: {
      previous_incumbent_id: "manifest_spy_core_v4",
      disable_conditions: ["SPYx reserve coverage degrades materially"],
    },
    market_intelligence: {
      scopeLabel: "Market Intelligence",
      currentView: "Constructive but late-cycle; preserve optionality.",
      confidence: "61 / 100",
      horizon: "30 to 90 trading days",
      implication:
        "Prefer SPYx-centered exposure when the user values smoother funding and activity posture.",
      whatChanged: [
        "Macro breadth stayed positive but narrower than AI infra.",
        "Defensive overlay produced cleaner rebalance timing.",
      ],
      promptQueue: [
        {
          label: "Mandate fit",
          prompt: "Explain why this portfolio is the calmer first-deposit path.",
        },
        {
          label: "Reserve posture",
          prompt: "Show how the cash reserve protects first-run users during wider spreads.",
        },
      ],
      drivers: [
        {
          label: "Macro breadth",
          value: "positive",
          tone: "positive",
          note: "Healthy, but less explosive than theme leadership.",
        },
        {
          label: "Volatility posture",
          value: "contained",
          tone: "positive",
          note: "Supports a cleaner first activation experience.",
        },
      ],
      routeState: {
        chain: "Ethereum",
        primaryVenue: "Cow Swap",
        backupVenue: "None",
        reserveWindow: "Wide cash reserve",
        multiplierWindow: "1.00x spot positions",
        proofOfReserves: "99.5% disclosed backing",
        status: "connect_required",
      },
      walletState: {
        state: "connect_required",
        accountLabel: "Wallet required before activation review",
        fundingLabel: "Funding staged after wallet connect",
        permissionSummary: "No hidden approvals before the final step.",
      },
      vaultState: {
        venue: "xChange spot route",
        structure: "SPYx core basket",
        borrowAsset: "None",
        reversibility: "Turn off strategy without directional unwind",
        status: "Promoted",
      },
      actions: ["See the view", "Connect wallet", "Deposit to activate"],
    },
    explanation: {
      thesis:
        "Stay close to beta, keep route complexity simple, and surface a calmer activation path for first funding.",
      whatThisDoes:
        "Keeps SPYx at the center, adds a small stability anchor, and preserves a large cash reserve so first-run users see a simple spot basket.",
      bestForUser:
        "Best for users who care more about capital protection and a calmer activation path than squeezing out every bit of upside.",
      howItChanges:
        "It changes less often than the other baskets and only refreshes when the defensive posture or reserve thresholds move enough to matter.",
      replayInterpretation:
        "Replay here is for reading the protective posture of the basket, not for promising a fixed downside profile.",
      holdingRationales: [
        {
          symbol: "SPYx",
          sleeve: "Core beta",
          rationale: "Core index exposure: tracks the S&amp;P 500.",
        },
        {
          symbol: "MSFTx",
          sleeve: "Stability anchor",
          rationale: "Adds quality tech exposure for growth alongside the index.",
        },
        {
          symbol: "USDC",
          sleeve: "Reserve buffer",
          rationale: "Cash reserve: flexibility for your first deposit.",
        },
      ],
      bundle: {
        whatThisPortfolioDoes:
          "Keeps SPYx at the center, adds a small stability anchor, and preserves a large cash reserve so first-run users see a simple spot basket.",
        howItIsBuilt:
          "The portfolio stays anchored to SPYx, uses MSFTx as a lighter stability anchor, and leaves a large USDC cash reserve to keep the first funding path cleaner.",
        howItChanges:
          "It changes less often than the other baskets and only refreshes when the defensive posture or reserve thresholds move enough to matter.",
        whatWouldTriggerNextRebalance:
          "A defensive-posture shift or reserve-threshold move is needed before the next rebalance review.",
        howToReadReplay:
          "Replay here is for reading the protective posture of the basket, not for promising a fixed downside profile.",
        bestFor:
          "Best for users who care more about capital protection and a calmer activation path than squeezing out every bit of upside.",
        components: [
          {
            componentId: "spyx-core-beta",
            kind: "asset",
            sleeve: "Core beta",
            title: "SPYx",
            rationale: "Core index exposure: tracks the S&amp;P 500.",
            targetWeightPct: 48,
            grossExposurePct: null,
            assetSymbol: "SPYx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "msftx-quality-ballast",
            kind: "asset",
            sleeve: "Stability anchor",
            title: "MSFTx",
            rationale: "Adds quality tech exposure for growth alongside the index.",
            targetWeightPct: 14,
            grossExposurePct: null,
            assetSymbol: "MSFTx",
            basketId: null,
            venueId: "xChange",
          },
          {
            componentId: "usdc-defensive-buffer",
            kind: "cash_buffer",
            sleeve: "Reserve buffer",
            title: "USDC reserve",
            rationale: "Cash reserve: flexibility for your first deposit.",
            targetWeightPct: 38,
            grossExposurePct: null,
            assetSymbol: "USDC",
            basketId: null,
            venueId: "smart_account_balance",
          },
        ],
      },
    },
    replay: {
      startingCapital: 1000,
      endingCapital: 1089,
      netReturnPct: 8.9,
      maxDrawdownPct: -4.1,
      turnoverPct: 5.2,
      winRatePct: 58,
      monthlyEdgePct: 0.9,
    },
    comparison: [],
    allocations: [
      {
        symbol: "SPYx",
        targetWeight: "48%",
        sleeve: "Core beta",
        venue: "xChange / Cow Swap",
        multiplier: "1.00x",
        proofOfReserves: "99.5%",
        rationale: "Core index exposure: tracks the S&amp;P 500.",
      },
      {
        symbol: "MSFTx",
        targetWeight: "14%",
        sleeve: "Stability anchor",
        venue: "xChange / 1inch",
        multiplier: "1.00x",
        proofOfReserves: "99.3%",
        rationale: "Adds quality tech exposure for growth alongside the index.",
      },
      {
        symbol: "USDC",
        targetWeight: "38%",
        sleeve: "Reserve buffer",
        venue: "Smart account balance",
        multiplier: "Cash",
        proofOfReserves: "N/A",
        rationale: "Cash reserve: flexibility for your first deposit.",
      },
    ],
    route_notes: [
      "This route intentionally stays simple for first-run activation.",
      "No leverage or borrow dependency on the default path.",
    ],
    methodology_notes: [
      "Optimized for capital preservation and legibility, not maximum upside.",
      "Same promoted-manifest boundary as the rest of the shell.",
    ],
    live_state: {
      state: "connect_required",
      routeLabel: "Route visible",
      routeSummary: "Cow Swap spot route",
      reserveLabel: "Large cash reserve",
      multiplierLabel: "Spot basket only",
      proofOfReservesLabel: "PoR visible",
      pauseRule: "Turn off strategy keeps remaining spot holdings explicit.",
    },
    preview: {
      recommendationExplanationBundle: null,
      rebalanceOrchestration: null,
      executionPreview: null,
    },
  },
  {
    manifest_id: "manifest_mstr_long_v3",
    slot_id: "advanced.default_directional",
    mode: "directional",
    chain: "Ethereum",
    strategy_version: "directional-preview-v1",
    theme_id: "ai-infra",
    slug: "advanced-default-directional--directional-preview-v1",
    hero_symbol: "MSTRx",
    frontend: {
      title: "MSTRx Conviction Long",
      subtitle: "Directional shell centered on an explicit leverage view.",
      risk_label: "High",
      summary:
        "Directional expression for users who want a high-conviction long with venue and unwind context front and center.",
      thesis:
        "Momentum and proxy-beta leadership remain strong enough to support a conviction long, but the shell keeps funding, unwind, and fallback rails explicit before activation.",
      badges: [
        {
          label: "Directional view",
          detail: "Venue-aware shell",
          tone: "current",
        },
        {
          label: "Validated",
          detail: "Directional preview available",
          tone: "validated",
        },
        {
          label: "Rail caution",
          detail: "Morpho fallback visible",
          tone: "warning",
        },
      ],
    },
    validation: {
      dataset_version: "bundle-2026-q1-r3",
      evaluator_version: "eval-0.4.2",
      objective_id: "conviction-long",
      score: 71,
      delta_vs_incumbent: 5.2,
      promoted_at: "2026-03-30T17:20:00Z",
      last_validated_at: "2026-03-31T07:15:00Z",
    },
    activation_template: {
      route_summary:
        "Review wallet, funding, directional route, and fallback lending path before activating the long view.",
      allowed_actions: [
        "Connect wallet",
        "Fund wallet",
        "Activate strategy",
        "Pause strategy",
      ],
      funding_options: ["USDC transfer", "SPYx collateral account", "Bridge into smart account"],
      rails: ["Euler context", "Morpho proof path", "Cow Swap"],
      reversible: true,
      required_state: "funding_required",
    },
    fallback: {
      previous_incumbent_id: "manifest_mstr_long_v2",
      disable_conditions: [
        "Directional health factor drops below the promoted band",
        "Verified lending route unavailable",
      ],
    },
    market_intelligence: {
      scopeLabel: "Market Intelligence",
      currentView: "High-conviction upside, but keep route and vault clarity visible.",
      confidence: "82 / 100",
      horizon: "10 to 30 trading days",
      implication:
        "Directional expression is warranted only for users who accept an explicit funding and unwind path.",
      whatChanged: [
        "Proxy-beta leadership accelerated alongside BTC-linked reflexivity.",
        "Liquidity remains good enough for directional preview, but fallback venue truth matters.",
        "Funding posture moved from connect-required to funding-required in the mock live state.",
      ],
      promptQueue: [
        {
          label: "Directional risk",
          prompt: "Show the route, funding, and unwind conditions that keep this preview-only.",
        },
        {
          label: "Venue truth",
          prompt: "Compare Euler context against the Morpho fallback proof path before deposit.",
        },
      ],
      drivers: [
        {
          label: "Momentum impulse",
          value: "strong positive",
          tone: "positive",
          note: "Fastest signal improvement of any promoted view.",
        },
        {
          label: "Route certainty",
          value: "mixed",
          tone: "warning",
          note: "Directional proof path is visible, but venue claims stay explicit.",
        },
        {
          label: "Borrow posture",
          value: "contained",
          tone: "neutral",
          note: "Fallback proof path points to Morpho context if needed.",
        },
      ],
      routeState: {
        chain: "Ethereum",
        primaryVenue: "Euler context",
        backupVenue: "Morpho proof path",
        reserveWindow: "Funding required before activation",
        multiplierWindow: "1.35x preview band",
        proofOfReserves: "99.0% disclosed xStock backing",
        status: "funding_required",
      },
      walletState: {
        state: "funding_required",
        accountLabel: "Wallet connected, smart account provisioned",
        fundingLabel: "Funding required to reach activation-ready",
        permissionSummary: "Directional permissions reviewed before execution.",
      },
      vaultState: {
        venue: "Directional vault shell",
        structure: "Conviction long preview",
        borrowAsset: "AUSD fallback path",
        reversibility: "Pause or unwind through explicit route review",
        status: "Funding required",
      },
      actions: ["See the view", "Open activation review", "Deposit to activate"],
    },
    explanation: {
      thesis:
        "Momentum and proxy-beta leadership remain strong enough to support a conviction long, but the shell keeps funding, unwind, and fallback rails explicit before activation.",
      whatThisDoes:
        "Shows a directional long on MSTRx with an explicit funding reserve and fail-closed venue context instead of pretending the route is live.",
      bestForUser:
        "Best for users who explicitly want a higher-conviction directional preview and are comfortable reading venue, funding, and unwind constraints before deposit.",
      howItChanges:
        "The directional shell only changes when the promoted view updates and the route, funding, and unwind checks stay inside preview-safe bounds.",
      replayInterpretation:
        "Replay here is directional preview context only. It is not proof of live scheduled rebalancing or live xStocks-on-Euler execution.",
      holdingRationales: [
        {
          symbol: "MSTRx",
          sleeve: "Hero position",
          rationale: "High-conviction bet on this asset's price direction.",
        },
        {
          symbol: "USDC",
          sleeve: "Collateral and fees",
          rationale: "Cash reserve: held for risk management.",
        },
      ],
      bundle: {
        whatThisPortfolioDoes:
          "Shows a directional long on MSTRx with an explicit funding reserve and fail-closed venue context instead of pretending the route is live.",
        howItIsBuilt:
          "The preview pairs a high-conviction MSTRx directional expression with a visible funding reserve so route, unwind, and fallback constraints stay readable before any deposit decision.",
        howItChanges:
          "The directional shell only changes when the promoted view updates and the route, funding, and unwind checks stay inside preview-safe bounds.",
        whatWouldTriggerNextRebalance:
          "A new promoted directional view or a route, funding, or unwind constraint breach triggers the next review.",
        howToReadReplay:
          "Replay here is directional preview context only. It is not proof of live scheduled rebalancing or live xStocks-on-Euler execution.",
        bestFor:
          "Best for users who explicitly want a higher-conviction directional preview and are comfortable reading venue, funding, and unwind constraints before deposit.",
        components: [
          {
            componentId: "mstrx-directional-expression",
            kind: "directional_expression",
            sleeve: "Hero position",
            title: "MSTRx conviction long",
            rationale: "High-conviction bet on this asset's price direction.",
            targetWeightPct: null,
            grossExposurePct: 135,
            assetSymbol: "MSTRx",
            basketId: null,
            venueId: "directional_route_shell",
          },
          {
            componentId: "usdc-funding-sleeve",
            kind: "cash_buffer",
            sleeve: "Collateral and fees",
            title: "USDC funding reserve",
            rationale: "Cash reserve: held for risk management.",
            targetWeightPct: null,
            grossExposurePct: null,
            assetSymbol: "USDC",
            basketId: null,
            venueId: "smart_account_balance",
          },
        ],
      },
    },
    replay: {
      startingCapital: 1000,
      endingCapital: 1396,
      netReturnPct: 39.6,
      maxDrawdownPct: -18.6,
      turnoverPct: 16.4,
      winRatePct: 63,
      monthlyEdgePct: 3.1,
    },
    comparison: [
      {
        label: "MSTRx Conviction Long",
        mode: "directional",
        posture: "Directional leader",
        whyItWon:
          "Highest upside capture in the promoted directional set, with route caution kept explicit.",
        endingValue: 1396,
        alphaPct: 15.7,
        drawdownPct: -18.6,
        score: 71,
        riskLabel: "High",
        href: "/workspace/detail/advanced-default-directional--directional-preview-v1",
      },
      {
        label: "AI Infra Leaders",
        mode: "basket",
        posture: "Basket winner",
        whyItWon:
          "Lower drawdown and cleaner reserve handling for users who do not want directional exposure.",
        endingValue: 1284,
        alphaPct: 10.9,
        drawdownPct: -9.8,
        score: 74,
        riskLabel: "Moderate",
        href: "/workspace/detail/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
      },
    ],
    allocations: [
      {
        symbol: "MSTRx",
        targetWeight: "Directional long",
        sleeve: "Hero position",
        venue: "Directional route shell",
        multiplier: "1.35x preview",
        proofOfReserves: "99.0%",
        rationale: "High-conviction bet on this asset's price direction.",
      },
      {
        symbol: "USDC",
        targetWeight: "Funding reserve",
        sleeve: "Collateral and fees",
        venue: "Smart account balance",
        multiplier: "Cash",
        proofOfReserves: "N/A",
        rationale: "Cash reserve: held for risk management.",
      },
    ],
    route_notes: [
      "Directional shell keeps Euler context visible without overclaiming exact live market support.",
      "Morpho proof path remains the explicit fallback context in this mock promoted view.",
      "Funding and unwind controls stay in the right rail and activation review.",
    ],
    methodology_notes: [
      "Directional view still uses the same promoted-manifest boundary.",
      "Health-factor and liquidation-distance language belongs in activation and detail, not the home surface.",
    ],
    live_state: {
      state: "funding_required",
      routeLabel: "Funding required",
      routeSummary: "Directional route staged, fallback venue visible",
      reserveLabel: "Funding reserve pending",
      multiplierLabel: "1.35x preview band",
      proofOfReservesLabel: "PoR visible",
      pauseRule: "Pause freezes future actions and surfaces unwind guidance.",
    },
    preview: {
      recommendationExplanationBundle: null,
      rebalanceOrchestration: null,
      executionPreview: null,
    },
  },
];

export const publicStrategies: PublicStrategyCardData[] = [
  {
    id: "strategy_ai_infra",
    slotId: "onboarding.default_basket",
    manifestSlug: "onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
    title: "AI Infra Leaders",
    summary: "Concentrated AI infrastructure basket with reserve carry.",
    mode: "basket",
    convictionLabel: "Promoted winner",
    audience: "Theme-led basket users",
    riskLabel: "Moderate",
    promotedAt: "2026-03-29T09:40:00Z",
    themeTitle: "AI Infra",
  },
  {
    id: "strategy_mag7_balance",
    slotId: "onboarding.alt_basket_1",
    manifestSlug: "onboarding-alt-basket-1--basket-core-h5-p100-c2-cap22-a0-r275-v1",
    title: "Mag 7 Cash Balance",
    summary: "Broader quality basket with calmer turnover.",
    mode: "basket",
    convictionLabel: "Balanced default",
    audience: "Broader tech exposure",
    riskLabel: "Moderate",
    promotedAt: "2026-03-27T15:10:00Z",
    themeTitle: "US Tech Leaders",
  },
  {
    id: "strategy_spy_core",
    slotId: "onboarding.alt_basket_2",
    manifestSlug: "onboarding-alt-basket-2--basket-starter-h6-p100-c1-cap17-a0-r275-v1",
    title: "SPY Core Shield",
    summary: "Index-centered starter path with defensive reserve posture.",
    mode: "basket",
    convictionLabel: "Calmer default",
    audience: "First activation",
    riskLabel: "Measured",
    promotedAt: "2026-03-25T12:00:00Z",
    themeTitle: "S&P Core",
  },
  {
    id: "strategy_mstr_long",
    slotId: "advanced.default_directional",
    manifestSlug: "advanced-default-directional--directional-preview-v1",
    title: "MSTRx Conviction Long",
    summary: "Directional shell with funding and fallback route context visible.",
    mode: "directional",
    convictionLabel: "High-conviction view",
    audience: "Directional users",
    riskLabel: "High",
    promotedAt: "2026-03-30T17:20:00Z",
    themeTitle: "AI Infra",
  },
];

export const blotter: BlotterData = {
  positions: [
    {
      id: "pos_1",
      symbol: "NVDAx",
      sleeve: "AI Infra Leaders",
      mode: "basket",
      exposureUsd: "$3,240",
      pnlPct: "+12.4%",
      route: "Cow Swap / xChange",
      nextRebalance: "10:30 UTC monitor",
      state: "active",
      updatedAt: "2m ago",
    },
    {
      id: "pos_2",
      symbol: "SPYx",
      sleeve: "SPY Core Shield",
      mode: "basket",
      exposureUsd: "$1,980",
      pnlPct: "+3.1%",
      route: "Cow Swap / xChange",
      nextRebalance: "14:00 UTC sweep",
      state: "watch",
      updatedAt: "14m ago",
    },
    {
      id: "pos_3",
      symbol: "MSTRx",
      sleeve: "Directional Vault",
      mode: "directional",
      exposureUsd: "$1,420",
      pnlPct: "+18.7%",
      route: "Directional shell",
      nextRebalance: "Await funding",
      state: "paused",
      updatedAt: "6m ago",
    },
  ],
  history: [
    {
      id: "hist_1",
      timestamp: "09:42 UTC",
      type: "Activation",
      description: "AI Infra Leaders activated with cash reserve intact.",
      venue: "Cow Swap",
      amount: "$2,500",
      status: "settled",
      execution: null,
    },
    {
      id: "hist_2",
      timestamp: "08:15 UTC",
      type: "Rebalance",
      description: "Trimmed AVGOx and added cash buffer after spread widened.",
      venue: "1inch",
      amount: "$420",
      status: "settled",
      execution: null,
    },
    {
      id: "hist_3",
      timestamp: "07:05 UTC",
      type: "Funding",
      description: "USDC transfer confirmed for directional review.",
      venue: "Smart account",
      amount: "$1,200",
      status: "pending",
      execution: null,
    },
  ],
  activity: [
    {
      id: "event_1",
      time: "Now",
      title: "One position paused",
      detail: "A directional position was paused because funding dropped below the required level.",
      state: "paused",
      nextAction: "Check funding",
      execution: null,
    },
    {
      id: "event_2",
      time: "12m ago",
      title: "Portfolio on track",
      detail: "All holdings are within target. No rebalance needed right now.",
      state: "active",
      nextAction: "No action needed",
      execution: null,
    },
    {
      id: "event_3",
      time: "31m ago",
      title: "Onboarding completed",
      detail: "You answered the profile questions and were matched to this portfolio.",
      state: "view_ready",
      nextAction: "View portfolio",
      execution: null,
    },
  ],
  rebalancing: [
    {
      id: "rebalance_1",
      manifestSlug: "onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
      strategyTitle: "AI Infra Leaders",
      window: "10:30 UTC quote check",
      trigger: "AVGOx spread widened above the replay band while reserve cash remains intact.",
      action: "Trim AVGOx by one position step and refill the USDC reserve buffer.",
      route: "Cow Swap primary, 1inch backup",
      impact: "$420 rebalance clip",
      state: "monitor",
    },
    {
      id: "rebalance_2",
      manifestSlug: "advanced-default-directional--directional-preview-v1",
      strategyTitle: "MSTRx Conviction Long",
      window: "On funding arrival",
      trigger: "Smart account is provisioned but still below the directional funding threshold.",
      action: "Fund the shell, refresh health-factor checks, then enable activation.",
      route: "Euler context with Morpho fallback",
      impact: "$1,200 funding unlock",
      state: "act",
    },
    {
      id: "rebalance_3",
      manifestSlug: "onboarding-alt-basket-1--basket-core-h5-p100-c2-cap22-a0-r275-v1",
      strategyTitle: "Mag 7 Cash Balance",
      window: "16:00 UTC breadth pass",
      trigger: "Breadth remains constructive, but the cash reserve can absorb more than usual.",
      action: "Hold unless software breadth fades and cash needs redeployment.",
      route: "1inch primary, Cow Swap backup",
      impact: "No action unless breadth weakens",
      state: "consider",
    },
    {
      id: "rebalance_4",
      manifestSlug: "onboarding-alt-basket-2--basket-starter-h6-p100-c1-cap17-a0-r275-v1",
      strategyTitle: "SPY Core Shield",
      window: "Daily close review",
      trigger: "Capital-preservation mandate remains intact and no route stress is visible.",
      action: "Keep the cash reserve unchanged unless SPYx reserve coverage slips.",
      route: "Cow Swap spot route",
      impact: "Stand pat",
      state: "none",
    },
  ],
};

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "q_goal_preference",
    screenIndex: 1,
    prompt: "What matters most?",
    helper: "Strongest signal for which portfolio fits you.",
    options: [
      {
        id: "broad_exposure",
        label: "Broad exposure",
        description: "Wide basket across tokenized equities.",
        qualification: {
          selection: { type: "theme", key: "broad_market" },
          yieldBufferAllowed: true,
          fitNote: "Broad exposure keeps the basket wide and the setup simpler.",
        },
      },
      {
        id: "theme_tilt",
        label: "A specific theme",
        description: "Lean into a sector like AI or tech leaders.",
        qualification: {
          selection: { type: "theme", key: "ai-infra" },
          yieldBufferAllowed: false,
          fitNote: "The user wants a recognizable theme lane, not a generic index basket.",
        },
      },
      {
        id: "leaders",
        label: "Highest conviction",
        description: "Concentrate in the strongest names.",
        qualification: {
          selection: { type: "theme", key: "cross_market_leaders" },
          fitNote: "Leader-first selection means a tighter, more active basket.",
        },
      },
      {
        id: "unsure",
        label: "Choose a strong default for me",
        description: "Not sure yet is fine. Start with the broadest, simplest preview.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Uncertainty routes to the safest default preview.",
        },
      },
    ],
  },
  {
    id: "q_theme_preference",
    screenIndex: 1,
    conditional: true,
    triggeredByQuestionId: "q_goal_preference",
    triggeredByOptionIds: ["theme_tilt"],
    prompt: "Which theme?",
    helper: "Pick the sector that fits your conviction.",
    options: [
      {
        id: "tech_ai",
        label: "Tech + AI",
        description: "AI infrastructure and platform leaders.",
        qualification: {
          selection: { type: "theme", key: "ai-infra" },
          fitNote: "Tech/AI lane selected.",
        },
      },
      {
        id: "consumer_platforms",
        label: "Consumer platforms",
        description: "Internet and marketplace names.",
        qualification: {
          selection: { type: "theme", key: "us-tech-leaders" },
          fitNote: "Consumer platform lane selected.",
        },
      },
      {
        id: "quality_cashflow",
        label: "Quality cashflow",
        description: "Steady cash-generating mega caps.",
        qualification: {
          selection: { type: "theme", key: "spy-core" },
          fitNote: "Quality/cashflow lane selected.",
        },
      },
      {
        id: "unsure",
        label: "Not sure: pick the cleanest setup",
        description: "Pick the theme with the cleanest setup right now.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Theme left open; system picks the cleanest default.",
        },
      },
    ],
  },
  {
    id: "q_expression_preference",
    screenIndex: 2,
    prompt: "How concentrated?",
    helper: "Decides how tight and active the basket gets.",
    options: [
      {
        id: "simple",
        label: "Keep it simple",
        description: "Broader holdings, less movement.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Simple expression caps concentration and activity.",
        },
      },
      {
        id: "tilted",
        label: "Noticeable tilt",
        description: "Some conviction, not constant movement.",
        qualification: {
          fitNote: "Tilted expression supports thematic or moderately active baskets.",
        },
      },
      {
        id: "active",
        label: "Selective and active",
        description: "Tighter basket, higher conviction.",
        qualification: {
          fitNote: "Active expression required for directional eligibility.",
        },
      },
      {
        id: "unsure",
        label: "Not sure",
        description: "Default toward simpler unless other signals are clear.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Expression uncertainty resolves toward simpler setup.",
        },
      },
    ],
  },
  {
    id: "q_risk_level",
    screenIndex: 3,
    prompt: "How much volatility?",
    helper: "Sets concentration limits and single-name caps.",
    options: [
      {
        id: "low",
        label: "Lower swings",
        description: "Broader basket, tighter caps.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Low risk means broader basket and tighter caps.",
        },
      },
      {
        id: "medium",
        label: "Balanced",
        description: "Middle ground between protection and upside.",
        qualification: {
          fitNote: "Medium risk is the default band.",
        },
      },
      {
        id: "high",
        label: "More upside",
        description: "Tighter basket, larger top weights.",
        qualification: {
          fitNote: "High risk allows tighter baskets and larger position sizes.",
        },
      },
      {
        id: "unsure",
        label: "Not sure",
        description: "Resolve to medium unless the safe-default path applies.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Risk uncertainty resolves to medium.",
        },
      },
    ],
  },
  {
    id: "q_drawdown_sensitivity",
    screenIndex: 3,
    conditional: true,
    triggeredByQuestionId: "q_risk_level",
    triggeredByOptionIds: ["low", "medium", "high"],
    prompt: "How protective in a downturn?",
    helper: "Optional: skip if unsure.",
    options: [
      {
        id: "high",
        label: "Tighter protection",
        description: "Reduce worst-case depth.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "High drawdown sensitivity clips risk one tier.",
        },
      },
      {
        id: "medium",
        label: "Moderate pullbacks OK",
        description: "Some depth for better upside.",
        qualification: {
          fitNote: "Moderate drawdown tolerance is the default.",
        },
      },
      {
        id: "low",
        label: "Deeper pullbacks OK",
        description: "More room for the strategy to run.",
        qualification: {
          fitNote: "Low drawdown sensitivity allows higher volatility tolerance.",
        },
      },
      {
        id: "unset",
        label: "Skip / not sure",
        description: "Leave this unset and let the risk answer do the work.",
        qualification: {
          fitNote: "Drawdown refinement skipped.",
        },
      },
    ],
  },
  {
    id: "q_rebalance_preference",
    screenIndex: 4,
    prompt: "How often should it rebalance?",
    helper: "How frequently the portfolio adjusts holdings.",
    options: [
      {
        id: "low_touch",
        label: "Leave it alone mostly",
        description: "Monthly checks. Minimal changes.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Low-touch rebalancing keeps turnover minimal.",
        },
      },
      {
        id: "scheduled",
        label: "Steady rhythm",
        description: "Regular refreshes on a schedule.",
        qualification: {
          fitNote: "Scheduled rebalancing is the default cadence.",
        },
      },
      {
        id: "active",
        label: "Track leadership actively",
        description: "Weekly or event-driven refreshes.",
        qualification: {
          fitNote: "Active rebalancing supports faster leadership tracking.",
        },
      },
      {
        id: "unsure",
        label: "Not sure",
        description: "Resolve to a steady scheduled rhythm.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Rebalance uncertainty resolves to scheduled cadence.",
        },
      },
    ],
  },
  {
    id: "q_directional_appetite",
    screenIndex: 5,
    prompt: "When the market turns?",
    helper: "Can the portfolio change stance or only rotate names?",
    options: [
      {
        id: "long_only",
        label: "Stay long, rotate names",
        description: "Long-only basket, rotates between holdings.",
        qualification: {
          modePreference: "basket",
          directionalOptIn: false,
          fitNote: "Long-only keeps the strategy rotating within the basket.",
        },
      },
      {
        id: "adaptive",
        label: "Stay long, get defensive",
        description: "Long-led but can get cautious in downturns.",
        qualification: {
          modePreference: "basket",
          directionalOptIn: false,
          fitNote: "Adaptive stays long-led but can tilt defensive.",
        },
      },
      {
        id: "directional",
        label: "Change stance entirely",
        description: "Can shift market direction, not just reshuffle.",
        qualification: {
          modePreference: "directional",
          directionalOptIn: true,
          fitNote: "Directional opt-in enabled but still hard-gated.",
        },
      },
      {
        id: "unsure",
        label: "Keep it simple for now",
        description: "Resolve to long-only to keep it straightforward.",
        qualification: {
          modePreference: "basket",
          directionalOptIn: false,
          yieldBufferAllowed: true,
          fitNote: "Stance uncertainty resolves to long-only.",
        },
      },
    ],
  },
  {
    id: "q_automation_comfort",
    screenIndex: 6,
    prompt: "Automation comfort?",
    helper: "How much should the portfolio adjust between your approvals?",
    options: [
      {
        id: "low",
        label: "Predictable only",
        description: "Changes only on a fixed schedule.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Low automation blocks directional and caps mode complexity.",
        },
      },
      {
        id: "medium",
        label: "Rules-based is fine",
        description: "Follows its own rules on schedule.",
        qualification: {
          fitNote: "Medium automation is the default comfort level.",
        },
      },
      {
        id: "high",
        label: "Fast rules-based shifts",
        description: "Acts quickly when conditions warrant.",
        qualification: {
          fitNote: "High automation required for directional eligibility.",
        },
      },
      {
        id: "unsure",
        label: "Not sure",
        description: "Resolve to medium and keep changes rules-based.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Automation uncertainty resolves to medium.",
        },
      },
    ],
  },
  {
    id: "q_certainty",
    screenIndex: 7,
    prompt: "How decided are you?",
    helper: "Sets how confidently we match the portfolio.",
    options: [
      {
        id: "high",
        label: "I know what I want",
        description: "Lock in with high confidence.",
        qualification: {
          fitNote: "High certainty supports full recommendation confidence.",
        },
      },
      {
        id: "medium",
        label: "I have a leaning",
        description: "Match me on my answers.",
        qualification: {
          fitNote: "Medium certainty supports solid recommendation.",
        },
      },
      {
        id: "unsure",
        label: "Skip / not sure",
        description: "Treat this as exploring and keep the preview flexible.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Certainty left open: treat the user as exploring.",
        },
      },
      {
        id: "low",
        label: "Just exploring",
        description: "Show me the preview.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Exploring: preview stays broad and low-commitment.",
        },
      },
      {
        id: "default_requested",
        label: "Give me the safest default preview",
        description: "Start broad and simple now. Tighten it later.",
        qualification: {
          yieldBufferAllowed: true,
          fitNote: "Default requested: safe fallback applied.",
        },
      },
    ],
  },
];
