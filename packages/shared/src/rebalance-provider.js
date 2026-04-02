import { createHash } from "node:crypto";

import { z } from "../node_modules/zod/index.js";

import {
  chainSchema,
  nonEmptyStringSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "../dist/contracts/common.js";

export const CHAINLINK_CRE_PROVIDER_ID = "chainlink_cre";
export const CHAINLINK_CRE_EVENT_VERSION = "1";
export const CHAINLINK_CRE_REVIEW_REQUESTED_STATE = "awaiting_operator";
export const CHAINLINK_CRE_REVIEW_EXECUTION_MODE = "review_only";
export const CHAINLINK_CRE_CANONICAL_EXECUTION_MODE = "canonical_execution";
export const CHAINLINK_CRE_ETH_JWT_ALGORITHM = "ETH_PERSONAL_SIGN";

export const CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA = z.object({
  version: z.literal(CHAINLINK_CRE_EVENT_VERSION),
  providerId: z.literal(CHAINLINK_CRE_PROVIDER_ID),
  providerEventId: nonEmptyStringSchema,
  workflowId: nonEmptyStringSchema,
  workflowExecutionId: nonEmptyStringSchema,
  triggerType: nonEmptyStringSchema,
  triggeredAt: timestampSchema,
  slotId: strategySlotIdSchema,
  chain: chainSchema,
  targetManifestId: nonEmptyStringSchema,
  baselineManifestId: nonEmptyStringSchema.nullable().optional(),
  reviewReason: z.object({
    kind: nonEmptyStringSchema,
    observedDriftBps: z.number().int().nonnegative().nullable().optional(),
    thresholdBps: z.number().int().nonnegative().nullable().optional(),
  }),
  reviewIntent: z.object({
    requestedState: z.literal(CHAINLINK_CRE_REVIEW_REQUESTED_STATE),
    executionMode: z.enum([
      CHAINLINK_CRE_REVIEW_EXECUTION_MODE,
      CHAINLINK_CRE_CANONICAL_EXECUTION_MODE,
    ]),
  }),
});

export const CHAINLINK_CRE_JWT_CLAIMS_SCHEMA = z.object({
  digest: z
    .string()
    .regex(/^0x([A-Fa-f0-9]{64})$/u, "digest must be a 32-byte 0x-prefixed hex string."),
  iss: nonEmptyStringSchema,
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
  jti: nonEmptyStringSchema,
  providerId: z.literal(CHAINLINK_CRE_PROVIDER_ID),
  workflowId: nonEmptyStringSchema,
  workflowExecutionId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  targetManifestId: nonEmptyStringSchema,
  chain: chainSchema,
});

export const CHAINLINK_CRE_PROVIDER_EVENT_RECEIPT_DECISION_SCHEMA = z.enum([
  "accepted",
  "rejected",
  "duplicate",
]);

export const CHAINLINK_CRE_PROVIDER_EVENT_RECEIPT_SCHEMA = z.object({
  receiptId: nonEmptyStringSchema,
  receivedAt: timestampSchema,
  providerId: nonEmptyStringSchema,
  providerEventId: nonEmptyStringSchema.nullable(),
  workflowId: nonEmptyStringSchema.nullable(),
  workflowExecutionId: nonEmptyStringSchema.nullable(),
  slotId: strategySlotIdSchema.nullable(),
  chain: chainSchema.nullable(),
  targetManifestId: nonEmptyStringSchema.nullable(),
  dedupeKey: nonEmptyStringSchema.nullable(),
  digest: z
    .string()
    .regex(/^0x([A-Fa-f0-9]{64})$/u)
    .nullable(),
  signerAddress: z
    .string()
    .regex(/^0x([A-Fa-f0-9]{40})$/u)
    .nullable(),
  issuer: nonEmptyStringSchema.nullable(),
  jti: nonEmptyStringSchema.nullable(),
  tokenIssuedAt: timestampSchema.nullable(),
  tokenExpiresAt: timestampSchema.nullable(),
  decision: CHAINLINK_CRE_PROVIDER_EVENT_RECEIPT_DECISION_SCHEMA,
  errorCode: nonEmptyStringSchema.nullable(),
  reason: nonEmptyStringSchema,
  duplicateOfReceiptId: nonEmptyStringSchema.nullable(),
});

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, sortJsonValue(value[key])]),
    );
  }

  return value;
}

export function canonicalizeChainlinkCreEventBody(body) {
  return JSON.stringify(sortJsonValue(body));
}

export function computeChainlinkCreEventDigest(body) {
  return `0x${createHash("sha256")
    .update(canonicalizeChainlinkCreEventBody(body), "utf8")
    .digest("hex")}`;
}

export function buildChainlinkCreEventDedupeKey(body) {
  const parsedBody = CHAINLINK_CRE_PROVIDER_EVENT_SCHEMA.parse(body);

  return [
    CHAINLINK_CRE_PROVIDER_ID,
    parsedBody.workflowId,
    parsedBody.workflowExecutionId,
    parsedBody.slotId,
    parsedBody.targetManifestId,
    parsedBody.chain,
  ].join(":");
}
