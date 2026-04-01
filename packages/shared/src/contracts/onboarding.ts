import { z } from "zod";

import {
  chainSchema,
  contractVersionSchema,
  discoverySelectionSchema,
  nonEmptyStringSchema,
  onboardingModePreferenceSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";

export const onboardingAnswersSchema = z.object({
  version: contractVersionSchema,
  preferredChain: chainSchema,
  modePreference: onboardingModePreferenceSchema,
  initialSelection: discoverySelectionSchema,
  selectedStarterSlotId: strategySlotIdSchema.optional(),
  selectedStarterBasketId: nonEmptyStringSchema.optional(),
  directionalOptIn: z.boolean(),
  submittedAt: timestampSchema,
});
export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const userProfileSchema = z.object({
  version: contractVersionSchema,
  preferredChain: chainSchema,
  modePreference: onboardingModePreferenceSchema,
  selectedScope: discoverySelectionSchema,
  activeSlotId: strategySlotIdSchema,
  starterBasketId: nonEmptyStringSchema.optional(),
  directionalAllowed: z.boolean(),
  yieldBufferAllowed: z.boolean(),
  updatedAt: timestampSchema,
});
export type UserProfile = z.infer<typeof userProfileSchema>;
