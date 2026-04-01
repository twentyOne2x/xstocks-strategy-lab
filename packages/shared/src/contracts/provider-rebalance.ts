import { z } from "zod";

import {
  chainSchema,
  contractVersionSchema,
  jsonRecordSchema,
  nonEmptyStringSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";
import {
  executionRequestStateSchema,
  executionTriggerSourceSchema,
} from "./execution.js";

const ethereumAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/u)
  .transform((value) => value.toLowerCase());

const requestDigestSchema = z.string().trim().regex(/^sha256:[a-f0-9]{64}$/u);

const providerIdSchema = z.enum(["chainlink_cre"]);
const eventTypeSchema = z.enum(["rebalance_review_requested"]);
const triggerModeSchema = z.enum(["review_only"]);
const receiptDecisionSchema = z.enum(["accepted", "rejected"]);
const rebalanceStateSchema = z.enum([
  "preview_only",
  "rebalance_recommended",
  "rebalance_deferred",
  "scheduled",
  "awaiting_operator",
  "executing",
  "rebalanced",
  "blocked",
  "paused",
  "failed",
]);
const receiptReasonCodeSchema = z.enum([
  "accepted_review_only",
  "activation_not_found",
  "authorization_missing",
  "authorization_scheme_invalid",
  "duplicate_delivery",
  "internal_error",
  "jwt_audience_invalid",
  "jwt_digest_missing",
  "jwt_digest_mismatch",
  "jwt_expired",
  "jwt_id_missing",
  "jwt_issued_in_future",
  "jwt_malformed",
  "jwt_not_yet_valid",
  "jwt_signature_invalid",
  "jwt_signer_invalid",
  "manual_lane_not_ready",
  "promoted_manifest_mismatch",
  "provider_auth_not_configured",
  "provider_trigger_failed_closed",
  "replayed_jwt_id",
  "replayed_request_digest",
  "request_digest_invalid",
  "request_digest_mismatch",
  "request_json_invalid",
  "request_schema_invalid",
  "review_state_not_opened",
  "slot_mismatch",
]);

const jwtSummarySchema = z.object({
  alg: nonEmptyStringSchema.nullable(),
  kid: nonEmptyStringSchema.nullable(),
  issuer: ethereumAddressSchema.nullable(),
  subject: nonEmptyStringSchema.nullable(),
  audience: z.array(nonEmptyStringSchema),
  jwtId: nonEmptyStringSchema.nullable(),
  issuedAt: timestampSchema.nullable(),
  expiresAt: timestampSchema.nullable(),
  notBefore: timestampSchema.nullable(),
  digest: requestDigestSchema.nullable(),
});

export const providerRebalanceReviewRequestSchema = z.object({
  version: contractVersionSchema,
  providerId: providerIdSchema,
  deliveryId: nonEmptyStringSchema,
  eventId: nonEmptyStringSchema,
  eventType: eventTypeSchema,
  triggerMode: triggerModeSchema,
  chain: chainSchema,
  slotId: strategySlotIdSchema,
  activationId: nonEmptyStringSchema,
  triggeredAt: timestampSchema,
  requestDigest: requestDigestSchema,
  claimedManifestId: nonEmptyStringSchema.optional(),
  claimedBaselineManifestId: nonEmptyStringSchema.optional(),
  observedDriftBps: z.number().int().nonnegative().nullable().optional(),
  summary: nonEmptyStringSchema.optional(),
  metadata: jsonRecordSchema.optional(),
});

export const providerRebalanceReceiptSchema = z.object({
  version: contractVersionSchema,
  receiptId: nonEmptyStringSchema,
  decision: receiptDecisionSchema,
  statusCode: z.number().int().min(100).max(599),
  providerId: providerIdSchema.nullable(),
  deliveryId: nonEmptyStringSchema.nullable(),
  eventId: nonEmptyStringSchema.nullable(),
  triggerSource: z.literal("provider_triggered"),
  routePath: nonEmptyStringSchema,
  receivedAt: timestampSchema,
  processedAt: timestampSchema,
  requestDigest: requestDigestSchema.nullable(),
  rawBodyDigest: requestDigestSchema,
  signerAddress: ethereumAddressSchema.nullable(),
  reasonCodes: z.array(receiptReasonCodeSchema).min(1),
  reasonDetail: nonEmptyStringSchema,
  duplicateOfReceiptId: nonEmptyStringSchema.nullable(),
  stateChanged: z.boolean(),
  rebalanceId: nonEmptyStringSchema.nullable(),
  rebalanceState: rebalanceStateSchema.nullable(),
  targetManifestId: nonEmptyStringSchema.nullable(),
  baselineManifestId: nonEmptyStringSchema.nullable(),
  executionRequestId: nonEmptyStringSchema.nullable(),
  executionTriggerSource: executionTriggerSourceSchema.nullable(),
  executionState: executionRequestStateSchema.nullable(),
  rebalanceBlockers: z.array(nonEmptyStringSchema),
  request: providerRebalanceReviewRequestSchema.nullable(),
  jwt: jwtSummarySchema.nullable(),
});

export type ProviderRebalanceReviewRequest = z.infer<
  typeof providerRebalanceReviewRequestSchema
>;
export type ProviderRebalanceReceipt = z.infer<
  typeof providerRebalanceReceiptSchema
>;
