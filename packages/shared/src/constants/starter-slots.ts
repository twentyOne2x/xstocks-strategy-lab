import type { StrategySlot } from "../contracts/portfolio.js";

import { DEFAULT_CHAIN, STARTER_BASKET_IDS } from "./starter-baskets.js";

export const STARTER_SLOT_IDS = {
  ONBOARDING_DEFAULT_BASKET: "onboarding.default_basket",
  ONBOARDING_ALT_BASKET_1: "onboarding.alt_basket_1",
  ONBOARDING_ALT_BASKET_2: "onboarding.alt_basket_2",
  ADVANCED_DEFAULT_DIRECTIONAL: "advanced.default_directional",
} as const;

export const ONBOARDING_DEFAULT_BASKET_SLOT = {
  slotId: STARTER_SLOT_IDS.ONBOARDING_DEFAULT_BASKET,
  mode: "basket",
  chain: DEFAULT_CHAIN,
  surface: "onboarding",
  position: 0,
  title: "Autopilot default basket",
  description: "Primary onboarding basket lane pinned to the Mag 7 starter basket.",
  starterBasketId: STARTER_BASKET_IDS.MAG_7,
} as const satisfies StrategySlot;

export const ONBOARDING_ALT_BASKET_1_SLOT = {
  slotId: STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_1,
  mode: "basket",
  chain: DEFAULT_CHAIN,
  surface: "onboarding",
  position: 1,
  title: "Autopilot alternate basket 1",
  description: "Secondary onboarding basket lane pinned to the AI Infra starter basket.",
  starterBasketId: STARTER_BASKET_IDS.AI_INFRA,
} as const satisfies StrategySlot;

export const ONBOARDING_ALT_BASKET_2_SLOT = {
  slotId: STARTER_SLOT_IDS.ONBOARDING_ALT_BASKET_2,
  mode: "basket",
  chain: DEFAULT_CHAIN,
  surface: "onboarding",
  position: 2,
  title: "Autopilot alternate basket 2",
  description:
    "Third onboarding basket lane pinned to the US Tech Leaders starter basket.",
  starterBasketId: STARTER_BASKET_IDS.US_TECH_LEADERS,
} as const satisfies StrategySlot;

export const ADVANCED_DEFAULT_DIRECTIONAL_SLOT = {
  slotId: STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL,
  mode: "directional",
  chain: DEFAULT_CHAIN,
  surface: "advanced",
  position: 0,
  title: "Directional default preview",
  description:
    "Advanced directional lane pinned to SPYx so the first preview stays on the strongest verified rail.",
  assetSymbol: "SPYx",
} as const satisfies StrategySlot;

export const STARTER_SLOT_CONSTANTS = [
  ONBOARDING_DEFAULT_BASKET_SLOT,
  ONBOARDING_ALT_BASKET_1_SLOT,
  ONBOARDING_ALT_BASKET_2_SLOT,
  ADVANCED_DEFAULT_DIRECTIONAL_SLOT,
] as const;
