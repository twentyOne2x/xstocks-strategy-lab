export const DEFAULT_CHAIN = "ethereum" as const;

export const STARTER_BASKET_IDS = {
  MAG_7: "mag-7",
  AI_INFRA: "ai-infra",
  US_TECH_LEADERS: "us-tech-leaders",
  SP_CORE: "sp-core",
} as const;
export type StarterBasketId =
  (typeof STARTER_BASKET_IDS)[keyof typeof STARTER_BASKET_IDS];

export const STARTER_BASKET_LABELS: Record<StarterBasketId, string> = {
  [STARTER_BASKET_IDS.MAG_7]: "Mag 7",
  [STARTER_BASKET_IDS.AI_INFRA]: "AI Infra",
  [STARTER_BASKET_IDS.US_TECH_LEADERS]: "US Tech Leaders",
  [STARTER_BASKET_IDS.SP_CORE]: "S&P Core",
};

export const HERO_ASSET_SYMBOLS = ["MSTRx", "NVDAx", "SPYx"] as const;
export type HeroAssetSymbol = (typeof HERO_ASSET_SYMBOLS)[number];

export const STARTER_THEME_KEYS = [
  STARTER_BASKET_LABELS[STARTER_BASKET_IDS.MAG_7],
  STARTER_BASKET_LABELS[STARTER_BASKET_IDS.AI_INFRA],
  STARTER_BASKET_LABELS[STARTER_BASKET_IDS.US_TECH_LEADERS],
  STARTER_BASKET_LABELS[STARTER_BASKET_IDS.SP_CORE],
] as const;
export type StarterThemeKey = (typeof STARTER_THEME_KEYS)[number];
