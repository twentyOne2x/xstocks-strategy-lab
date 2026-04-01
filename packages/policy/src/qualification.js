import { z } from "../../shared/node_modules/zod/index.js";

import {
  STARTER_BASKET_IDS,
  STARTER_SLOT_CONSTANTS,
  STARTER_SLOT_IDS,
} from "../../shared/dist/index.js";
import {
  chainSchema,
  contractVersionSchema,
  discoverySelectionSchema,
  nonEmptyStringSchema,
  onboardingModePreferenceSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "../../shared/dist/contracts/common.js";
import {
  agentQualificationSchema,
  qualificationSelectionSchema,
} from "../../shared/dist/contracts/qualification.js";
import {
  onboardingAnswersSchema,
  userProfileSchema,
} from "../../shared/dist/contracts/onboarding.js";

import {
  EXECUTION_ELIGIBILITY,
  EXECUTION_STATE,
  normalizeUsd,
  normalizeWalletState,
} from "./contracts.js";
import { deriveExecutionPlan } from "./execution-plan.js";
import {
  assertPromotedActivationManifest,
  createActivationManifestRef,
} from "./manifest.js";
import { deriveRecommendation } from "./recommendation.js";
import { CONTRACT_VERSION } from "./shared-contracts.js";

const DEFAULT_SLOT_ID = STARTER_SLOT_IDS.ONBOARDING_DEFAULT_BASKET;
const DIRECTIONAL_SLOT_ID = STARTER_SLOT_IDS.ADVANCED_DEFAULT_DIRECTIONAL;

const onboardingAnswersInputSchema = z.object({
  version: contractVersionSchema.optional(),
  preferredChain: chainSchema.optional(),
  modePreference: onboardingModePreferenceSchema.optional(),
  initialSelection: discoverySelectionSchema.optional(),
  selectedStarterSlotId: strategySlotIdSchema.optional(),
  selectedStarterBasketId: nonEmptyStringSchema.optional(),
  directionalOptIn: z.boolean().optional(),
  submittedAt: timestampSchema.optional(),
});

const STARTER_SLOT_BY_ID = new Map(
  STARTER_SLOT_CONSTANTS.map((slot) => [slot.slotId, slot]),
);

const BASKET_SLOT_ID_BY_BASKET_ID = new Map(
  STARTER_SLOT_CONSTANTS.filter((slot) => slot.mode === "basket").map((slot) => [
    slot.starterBasketId,
    slot.slotId,
  ]),
);

const THEME_KEY_TO_BASKET_ID = new Map([
  ["mag-7", STARTER_BASKET_IDS.MAG_7],
  ["mag7", STARTER_BASKET_IDS.MAG_7],
  ["mag 7", STARTER_BASKET_IDS.MAG_7],
  ["broad-market", STARTER_BASKET_IDS.MAG_7],
  ["broad market", STARTER_BASKET_IDS.MAG_7],
  ["broad", STARTER_BASKET_IDS.MAG_7],
  ["ai-infra", STARTER_BASKET_IDS.AI_INFRA],
  ["ai infra", STARTER_BASKET_IDS.AI_INFRA],
  ["theme-tilt", STARTER_BASKET_IDS.AI_INFRA],
  ["theme tilt", STARTER_BASKET_IDS.AI_INFRA],
  ["tech-ai", STARTER_BASKET_IDS.AI_INFRA],
  ["tech ai", STARTER_BASKET_IDS.AI_INFRA],
  ["us-tech-leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["us tech leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["active-leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["active leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["cross-market-leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
  ["cross market leaders", STARTER_BASKET_IDS.US_TECH_LEADERS],
]);

const HERO_ASSET_KEY_TO_SYMBOL = new Map([
  ["mstrx", "MSTRx"],
  ["mstr", "MSTRx"],
  ["nvdax", "NVDAx"],
  ["nvda", "NVDAx"],
  ["spyx", "SPYx"],
  ["spy", "SPYx"],
]);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeLookupKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function canonicalizeThemeKey(value) {
  const normalizedValue = normalizeLookupKey(value);
  return THEME_KEY_TO_BASKET_ID.get(normalizedValue) ?? null;
}

function canonicalizeHeroAssetKey(value) {
  const normalizedValue = normalizeLookupKey(value).replaceAll("-", "");
  return HERO_ASSET_KEY_TO_SYMBOL.get(normalizedValue) ?? String(value).trim();
}

function resolveBasketIdFromSlotId(slotId) {
  const slot = STARTER_SLOT_BY_ID.get(slotId);
  return slot?.mode === "basket" ? slot.starterBasketId : null;
}

function resolveSlotIdFromBasketId(basketId) {
  return BASKET_SLOT_ID_BY_BASKET_ID.get(basketId) ?? null;
}

function canonicalizeSelection(selection) {
  if (!selection) {
    return null;
  }

  const parsedSelection = discoverySelectionSchema.parse(selection);

  if (parsedSelection.type === "theme") {
    return {
      ...parsedSelection,
      key: canonicalizeThemeKey(parsedSelection.key) ?? parsedSelection.key.trim(),
    };
  }

  if (parsedSelection.type === "hero_asset") {
    return {
      ...parsedSelection,
      key: canonicalizeHeroAssetKey(parsedSelection.key),
    };
  }

  return {
    ...parsedSelection,
    key: parsedSelection.key.trim(),
  };
}

function deriveStarterBasketIdFromSelection(selection) {
  if (!selection) {
    return null;
  }

  if (selection.type === "theme") {
    return canonicalizeThemeKey(selection.key);
  }

  if (selection.type === "public_strategy") {
    const parsedSlotId = strategySlotIdSchema.safeParse(selection.key);
    if (!parsedSlotId.success) {
      return null;
    }

    return resolveBasketIdFromSlotId(parsedSlotId.data);
  }

  return null;
}

function deriveStarterSlotIdFromSelection(selection) {
  if (!selection) {
    return null;
  }

  if (selection.type === "theme") {
    const basketId = canonicalizeThemeKey(selection.key);
    return basketId ? resolveSlotIdFromBasketId(basketId) : null;
  }

  if (selection.type === "public_strategy") {
    const parsedSlotId = strategySlotIdSchema.safeParse(selection.key);
    return parsedSlotId.success ? parsedSlotId.data : null;
  }

  return null;
}

export function normalizeOnboardingAnswers(
  onboarding_answers,
  { submittedAt = new Date().toISOString() } = {},
) {
  const parsedInput = onboardingAnswersInputSchema.parse(onboarding_answers ?? {});
  const preferredChain = parsedInput.preferredChain ?? "ethereum";
  const modePreference = parsedInput.modePreference ?? "not_sure_yet";
  const directionalOptIn = parsedInput.directionalOptIn === true;
  const initialSelection =
    canonicalizeSelection(parsedInput.initialSelection) ??
    (parsedInput.selectedStarterSlotId
      ? {
          type: "public_strategy",
          key: parsedInput.selectedStarterSlotId,
        }
      : parsedInput.selectedStarterBasketId
        ? {
            type: "theme",
            key:
              canonicalizeThemeKey(parsedInput.selectedStarterBasketId) ??
              parsedInput.selectedStarterBasketId.trim(),
          }
        : null);

  invariant(
    initialSelection,
    "Onboarding answers require initialSelection or an explicit starter slot/basket.",
  );

  const explicitStarterBasketId =
    canonicalizeThemeKey(parsedInput.selectedStarterBasketId) ??
    parsedInput.selectedStarterBasketId ??
    null;

  const derivedStarterBasketId =
    modePreference === "directional" && directionalOptIn
      ? null
      : explicitStarterBasketId ??
        deriveStarterBasketIdFromSelection(initialSelection) ??
        (parsedInput.selectedStarterSlotId
          ? resolveBasketIdFromSlotId(parsedInput.selectedStarterSlotId)
          : null);

  const derivedStarterSlotId =
    modePreference === "directional" && directionalOptIn
      ? undefined
      : parsedInput.selectedStarterSlotId ??
        (derivedStarterBasketId
          ? resolveSlotIdFromBasketId(derivedStarterBasketId)
          : null) ??
        deriveStarterSlotIdFromSelection(initialSelection) ??
        undefined;

  return onboardingAnswersSchema.parse({
    version: parsedInput.version ?? CONTRACT_VERSION,
    preferredChain,
    modePreference,
    initialSelection,
    ...(derivedStarterSlotId ? { selectedStarterSlotId: derivedStarterSlotId } : {}),
    ...(derivedStarterBasketId
      ? { selectedStarterBasketId: derivedStarterBasketId }
      : {}),
    directionalOptIn,
    submittedAt: parsedInput.submittedAt ?? submittedAt,
  });
}

export function deriveQualificationDecision({ onboarding_answers }) {
  const baseAnswers = normalizeOnboardingAnswers(onboarding_answers);
  const reasonCodes = [`mode_preference:${baseAnswers.modePreference}`];
  let safeFallbackApplied = false;
  let selectedSlotId = null;

  if (baseAnswers.modePreference === "directional") {
    invariant(
      baseAnswers.directionalOptIn,
      "Directional qualification requires directionalOptIn=true.",
    );
    invariant(
      !baseAnswers.selectedStarterBasketId,
      "Directional qualification cannot target a basket starter id.",
    );
    invariant(
      baseAnswers.selectedStarterSlotId === undefined ||
        baseAnswers.selectedStarterSlotId === DIRECTIONAL_SLOT_ID,
      "Directional qualification cannot target a basket slot.",
    );
    selectedSlotId = DIRECTIONAL_SLOT_ID;
    reasonCodes.push("slot_from_directional_opt_in");
  } else if (baseAnswers.selectedStarterSlotId) {
    invariant(
      baseAnswers.selectedStarterSlotId !== DIRECTIONAL_SLOT_ID,
      "Directional slot requires directional modePreference and opt-in.",
    );
    selectedSlotId = baseAnswers.selectedStarterSlotId;
    reasonCodes.push(`slot_from_selected_starter_slot:${selectedSlotId}`);
  } else if (baseAnswers.selectedStarterBasketId) {
    selectedSlotId = resolveSlotIdFromBasketId(baseAnswers.selectedStarterBasketId);
    invariant(
      selectedSlotId,
      `No onboarding basket slot is registered for ${baseAnswers.selectedStarterBasketId}.`,
    );
    reasonCodes.push(
      `slot_from_selected_starter_basket:${baseAnswers.selectedStarterBasketId}`,
    );
  } else if (baseAnswers.initialSelection.type === "theme") {
    const slotIdFromTheme = deriveStarterSlotIdFromSelection(
      baseAnswers.initialSelection,
    );
    invariant(
      slotIdFromTheme,
      `Theme selection ${baseAnswers.initialSelection.key} does not map to a basket slot.`,
    );
    selectedSlotId = slotIdFromTheme;
    reasonCodes.push(`slot_from_theme:${baseAnswers.initialSelection.key}`);
  } else if (baseAnswers.initialSelection.type === "public_strategy") {
    const parsedSlotId = strategySlotIdSchema.safeParse(
      baseAnswers.initialSelection.key,
    );
    invariant(
      parsedSlotId.success,
      `Public strategy selection ${baseAnswers.initialSelection.key} must resolve to a strategy slot id before qualification.`,
    );
    invariant(
      parsedSlotId.data !== DIRECTIONAL_SLOT_ID,
      "Directional slot requires directional modePreference and opt-in.",
    );
    selectedSlotId = parsedSlotId.data;
    reasonCodes.push(
      `slot_from_public_strategy:${baseAnswers.initialSelection.key}`,
    );
  } else if (
    baseAnswers.initialSelection.type === "hero_asset" &&
    baseAnswers.directionalOptIn
  ) {
    selectedSlotId = DIRECTIONAL_SLOT_ID;
    reasonCodes.push(`slot_from_hero_asset:${baseAnswers.initialSelection.key}`);
  }

  if (!selectedSlotId) {
    safeFallbackApplied = true;
    selectedSlotId = DEFAULT_SLOT_ID;
    reasonCodes.push(`fallback:${DEFAULT_SLOT_ID}`);
  }

  const slot = STARTER_SLOT_BY_ID.get(selectedSlotId);
  invariant(slot, `Unknown starter slot ${selectedSlotId}.`);

  const starterBasketId =
    slot.mode === "basket" ? resolveBasketIdFromSlotId(selectedSlotId) : null;
  const normalizedAnswers = onboardingAnswersSchema.parse({
    ...baseAnswers,
    selectedStarterSlotId: selectedSlotId,
    ...(starterBasketId ? { selectedStarterBasketId: starterBasketId } : {}),
  });
  const userProfile = userProfileSchema.parse({
    version: CONTRACT_VERSION,
    preferredChain: normalizedAnswers.preferredChain,
    modePreference: normalizedAnswers.modePreference,
    selectedScope: normalizedAnswers.initialSelection,
    activeSlotId: selectedSlotId,
    ...(starterBasketId ? { starterBasketId } : {}),
    directionalAllowed:
      normalizedAnswers.directionalOptIn || selectedSlotId === DIRECTIONAL_SLOT_ID,
    yieldBufferAllowed: slot.mode === "basket",
    updatedAt: normalizedAnswers.submittedAt,
  });
  const selection = qualificationSelectionSchema.parse({
    slotId: selectedSlotId,
    mode: slot.mode,
    ...(starterBasketId ? { starterBasketId } : {}),
    safeFallbackApplied,
    reasonCodes,
  });

  return {
    normalizedAnswers,
    userProfile,
    selection,
  };
}

export function deriveAgentQualification({
  onboarding_answers,
  activation_manifest,
  live_xstocks_state,
  live_route_state,
  user_notional_usd,
  wallet_state,
}) {
  const manifest = assertPromotedActivationManifest(activation_manifest);
  const { normalizedAnswers, userProfile, selection } =
    deriveQualificationDecision({
      onboarding_answers,
    });

  invariant(
    selection.slotId === manifest.slotId,
    `Qualification selected ${selection.slotId}, but manifest ${manifest.manifestId} is pinned to ${manifest.slotId}.`,
  );

  const normalizedWalletState = normalizeWalletState(wallet_state);
  const requestedNotionalUsd = normalizeUsd(
    user_notional_usd,
    manifest.walletRequirements.minFundingUsd,
  );
  const recommendation = deriveRecommendation({
    activation_manifest: manifest,
    live_xstocks_state,
    live_route_state,
    user_notional_usd: requestedNotionalUsd,
    wallet_state: normalizedWalletState,
  });
  const executionPlan = deriveExecutionPlan({
    activation_manifest: manifest,
    live_xstocks_state,
    live_route_state,
    user_notional_usd: requestedNotionalUsd,
    wallet_state: normalizedWalletState,
  });

  return agentQualificationSchema.parse({
    version: CONTRACT_VERSION,
    normalizedAnswers,
    userProfile,
    selection,
    manifestId: manifest.manifestId,
    manifestRef: createActivationManifestRef(manifest),
    recommendation,
    explanationSurface: {
      surfaceId: "recommendation.explanationBundle",
      summary: recommendation.explanationSummary,
      bundle: recommendation.explanationBundle,
      researchExplanationAvailable:
        Object.hasOwn(manifest, "researchExplanationBundle") ||
        Object.hasOwn(manifest, "explanationBundle"),
      researchTuningSummaryAvailable:
        Object.hasOwn(manifest, "researchTuningSummary") ||
        Object.hasOwn(manifest, "tuningSummary"),
    },
    activationTruth: {
      surfaceTruth: executionPlan.surfaceTruth,
      executionState: executionPlan.executionState,
      executionEligibility: executionPlan.executionEligibility,
      requestedNotionalUsd,
      fundedNotionalUsd: executionPlan.fundingPath.fundedNotionalUsd,
      fundingGapUsd: executionPlan.fundingPath.fundingGapUsd,
      fundingAssetSymbol: manifest.activationTemplate.fundingAssetSymbol,
      minFundingUsd: manifest.walletRequirements.minFundingUsd,
      depositRequired:
        executionPlan.executionState !== EXECUTION_STATE.READY &&
        executionPlan.executionEligibility !== EXECUTION_ELIGIBILITY.BLOCKED,
      activationReady:
        executionPlan.executionState === EXECUTION_STATE.READY &&
        executionPlan.executionEligibility === EXECUTION_ELIGIBILITY.EXECUTABLE,
      directionalPreviewOnly:
        selection.mode === "directional" &&
        executionPlan.executionEligibility !== EXECUTION_ELIGIBILITY.EXECUTABLE,
      blockers: executionPlan.blockers,
      warnings: executionPlan.warnings,
    },
  });
}
