import { z } from "zod";

import {
  activityScopeTypeSchema,
  contractVersionSchema,
  executionStateSchema,
  jsonRecordSchema,
  nonEmptyStringSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";

export const LEGACY_ACTIVITY_EVENT_TYPE_VALUES = [
  "recommendation_ready",
  "activation_requested",
  "activation_ready",
  "activation_submitted",
  "activation_succeeded",
  "activation_failed",
  "strategy_paused",
  "strategy_resumed",
  "strategy_replaced",
  "blocked",
] as const;
export const legacyActivityEventTypeSchema = z.enum(
  LEGACY_ACTIVITY_EVENT_TYPE_VALUES,
);
export type LegacyActivityEventType = z.infer<
  typeof legacyActivityEventTypeSchema
>;

export const ACTIVITY_EVENT_TYPE_VALUES = [
  "activation_saved",
  "wallet_connection_required",
  "funding_required",
  "smart_account_required",
  "smart_account_pending",
  "activation_ready",
  "activation_blocked",
] as const;
export const canonicalActivityEventTypeSchema = z.enum(
  ACTIVITY_EVENT_TYPE_VALUES,
);
export type CanonicalActivityEventType = z.infer<
  typeof canonicalActivityEventTypeSchema
>;

export const activityEventTypeSchema = z.union([
  legacyActivityEventTypeSchema,
  canonicalActivityEventTypeSchema,
]);
export type ActivityEventType = z.infer<typeof activityEventTypeSchema>;

export const activityScopeSchema = z.object({
  type: activityScopeTypeSchema,
  id: nonEmptyStringSchema,
});
export type ActivityScope = z.infer<typeof activityScopeSchema>;

const legacyActivityEventSchema = z.object({
  version: contractVersionSchema,
  eventId: nonEmptyStringSchema,
  eventType: legacyActivityEventTypeSchema,
  scope: activityScopeSchema,
  summary: nonEmptyStringSchema,
  occurredAt: timestampSchema,
  payload: jsonRecordSchema.optional(),
});

export const canonicalActivityEventSchema = z.object({
  event_id: nonEmptyStringSchema,
  activation_id: nonEmptyStringSchema.optional(),
  recommendation_id: nonEmptyStringSchema.optional(),
  directional_preview_id: nonEmptyStringSchema.optional(),
  manifest_id: nonEmptyStringSchema,
  slot_id: strategySlotIdSchema,
  created_at: timestampSchema,
  event_type: canonicalActivityEventTypeSchema,
  summary: nonEmptyStringSchema,
  status: executionStateSchema,
  details: jsonRecordSchema.nullable().optional(),
});
export type CanonicalActivityEvent = z.infer<
  typeof canonicalActivityEventSchema
>;

export const activityEventSchema = z.union([
  legacyActivityEventSchema,
  canonicalActivityEventSchema,
]);
export type ActivityEvent = z.infer<typeof activityEventSchema>;
