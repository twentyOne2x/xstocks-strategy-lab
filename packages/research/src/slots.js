import path from "node:path";

import {
  CHAIN,
  DIRECTIONAL_PREVIEW_STRATEGY_VERSION,
  ONBOARDING_BASKET_SLOT_IDS,
  PRIMARY_BENCHMARK_ID,
} from "./constants.js";
import { incumbentsDir, promotedManifestRoot } from "./paths.js";
import { parseStrategySlot } from "./shared-contracts.js";

function defineSlot(slot) {
  parseStrategySlot(slot);
  return Object.freeze(slot);
}

const SLOT_DEFINITIONS = [
  defineSlot({
    slotId: "onboarding.default_basket",
    mode: "basket",
    chain: CHAIN,
    surface: "onboarding",
    position: 0,
    title: "Autopilot: Mag 7 Core",
    description: "Default onboarding basket anchored to the pinned Mag 7 baseline.",
    starterBasketId: "mag7",
    strategyVersion: "basket-baseline-v1",
    subtitle: "Default onboarding basket anchored to the pinned Mag 7 baseline.",
    riskLabel: "moderate",
    summary:
      "Long-only xStocks basket that keeps the onboarding lane simple while preserving concentrated mega-cap upside.",
    benchmarkId: PRIMARY_BENCHMARK_ID,
    rebalanceThresholdBps: 300,
    targetCashWeight: 0.05,
    concentrationCapPct: 18,
    disableConditions: [
      "slot_not_promoted",
      "research_manifest_missing",
      "xstocks_live_state_stale",
    ],
  }),
  defineSlot({
    slotId: "onboarding.alt_basket_1",
    mode: "basket",
    chain: CHAIN,
    surface: "onboarding",
    position: 1,
    title: "Autopilot: AI Infra",
    description: "Alternative onboarding basket tilted toward AI infrastructure names.",
    starterBasketId: "ai_infra",
    strategyVersion: "basket-baseline-v1",
    subtitle: "Alternative onboarding basket tilted toward AI infrastructure names.",
    riskLabel: "elevated",
    summary:
      "Higher-beta AI infrastructure basket for users who want a more concentrated compute and tooling tilt.",
    benchmarkId: PRIMARY_BENCHMARK_ID,
    rebalanceThresholdBps: 325,
    targetCashWeight: 0.08,
    concentrationCapPct: 22,
    disableConditions: [
      "slot_not_promoted",
      "research_manifest_missing",
      "xstocks_live_state_stale",
    ],
  }),
  defineSlot({
    slotId: "onboarding.alt_basket_2",
    mode: "basket",
    chain: CHAIN,
    surface: "onboarding",
    position: 2,
    title: "Autopilot: US Tech Leaders",
    description:
      "Alternative onboarding basket for broader US tech leadership exposure.",
    starterBasketId: "us_tech_leaders",
    strategyVersion: "basket-baseline-v1",
    subtitle: "Alternative onboarding basket for broader US tech leadership exposure.",
    riskLabel: "moderate",
    summary:
      "Broader US tech basket that stays basket-first while diversifying away from a pure Mag 7 concentration profile.",
    benchmarkId: PRIMARY_BENCHMARK_ID,
    rebalanceThresholdBps: 275,
    targetCashWeight: 0.04,
    concentrationCapPct: 17,
    disableConditions: [
      "slot_not_promoted",
      "research_manifest_missing",
      "xstocks_live_state_stale",
    ],
  }),
  defineSlot({
    slotId: "advanced.default_directional",
    mode: "directional",
    chain: CHAIN,
    surface: "advanced",
    position: 0,
    title: "Directional default preview",
    description:
      "Preview-only advanced directional lane pinned to SPYx while exact live Euler proof remains unverified.",
    assetSymbol: "SPYx",
    strategyVersion: DIRECTIONAL_PREVIEW_STRATEGY_VERSION,
    subtitle: "Preview-only incumbent for the advanced directional lane.",
    riskLabel: "high",
    summary:
      "Preview-only SPYx directional incumbent that stays blocked for execution until exact live xStocks-on-Euler proof is independently verified.",
    venueId: "euler",
    borrowAssetSymbol: "AUSD",
    disableConditions: [
      "slot_not_promoted",
      "preview_only",
      "route_unverified",
      "directional_activation_disabled",
    ],
  }),
];

export function listPublicStrategySlots() {
  return SLOT_DEFINITIONS;
}

export function listOnboardingBasketSlots() {
  return SLOT_DEFINITIONS.filter((slot) => ONBOARDING_BASKET_SLOT_IDS.includes(slot.slotId));
}

export function getStrategySlot(slotId) {
  const slot = SLOT_DEFINITIONS.find((entry) => entry.slotId === slotId);
  if (!slot) {
    throw new Error(`Unknown strategy slot: ${slotId}`);
  }

  return slot;
}

export function getBasketSlot(slotId) {
  const slot = getStrategySlot(slotId);
  if (slot.mode !== "basket") {
    throw new Error(`Slot ${slotId} is not a basket slot.`);
  }

  return slot;
}

export function getDirectionalSlot(slotId) {
  const slot = getStrategySlot(slotId);
  if (slot.mode !== "directional") {
    throw new Error(`Slot ${slotId} is not a directional slot.`);
  }

  return slot;
}

export function publicSlotFor(slotId) {
  return parseStrategySlot(getStrategySlot(slotId));
}

export function incumbentPathForSlot(slotId) {
  const slot = getStrategySlot(slotId);
  return path.join(incumbentsDir, slot.mode, `${slotId}.json`);
}

export function promotedManifestDirForSlot(slotId) {
  return path.join(promotedManifestRoot, slotId);
}
