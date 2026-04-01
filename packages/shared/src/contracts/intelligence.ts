import { z } from "zod";

import {
  allocatorHintSchema,
  chainSchema,
  contractVersionSchema,
  nonEmptyStringSchema,
  riskRegimeSchema,
  signalHorizonSchema,
  signalScopeTypeSchema,
  signalStanceSchema,
  rebalanceUrgencySchema,
  stringArraySchema,
  timestampSchema,
} from "./common.js";

export const providerSummarySchema = z.object({
  providerCount: z.number().int().nonnegative(),
  providers: z.array(nonEmptyStringSchema).min(1),
  tags: stringArraySchema,
});
export type ProviderSummary = z.infer<typeof providerSummarySchema>;

export const signalArtifactSchema = z.object({
  version: contractVersionSchema,
  chain: chainSchema,
  signalId: nonEmptyStringSchema,
  generatedAt: timestampSchema,
  expiresAt: timestampSchema,
  scopeType: signalScopeTypeSchema,
  scopeKey: nonEmptyStringSchema,
  stance: signalStanceSchema,
  confidence: z.number().finite().min(0).max(1),
  horizon: signalHorizonSchema,
  riskRegime: riskRegimeSchema,
  rebalanceUrgency: rebalanceUrgencySchema,
  allocatorHint: allocatorHintSchema,
  topReasons: z.array(nonEmptyStringSchema).min(1),
  providerSummary: providerSummarySchema,
});
export type SignalArtifact = z.infer<typeof signalArtifactSchema>;
