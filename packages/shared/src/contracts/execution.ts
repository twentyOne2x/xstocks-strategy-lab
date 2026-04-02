import { z } from "zod";

import { authenticatedOwnerSchema } from "./auth.js";
import {
  activationManifestRefSchema,
  chainSchema,
  contractVersionSchema,
  executionApprovalStatusSchema,
  jsonRecordSchema,
  nonEmptyStringSchema,
  strategyModeSchema,
  strategySlotIdSchema,
  timestampSchema,
} from "./common.js";

export const EXECUTION_REQUEST_STATE_VALUES = [
  "requested",
  "quote_ready",
  "awaiting_approval",
  "submitted",
  "manual_followup_required",
  "confirmed",
  "blocked",
  "failed",
] as const;
export const executionRequestStateSchema = z.enum(
  EXECUTION_REQUEST_STATE_VALUES,
);
export type ExecutionRequestState = z.infer<typeof executionRequestStateSchema>;

export const EXECUTION_RUNTIME_OWNER_VALUES = [
  "operator_manual",
  "policy_bounded_automation",
] as const;
export const executionRuntimeOwnerSchema = z.enum(
  EXECUTION_RUNTIME_OWNER_VALUES,
);
export type ExecutionRuntimeOwner = z.infer<typeof executionRuntimeOwnerSchema>;

export const EXECUTION_TRIGGER_SOURCE_VALUES = [
  "operator_manual",
  "execute_all",
  "provider_staging",
  "policy_bounded_automation",
] as const;
export const executionTriggerSourceSchema = z.enum(
  EXECUTION_TRIGGER_SOURCE_VALUES,
);
export type ExecutionTriggerSource = z.infer<
  typeof executionTriggerSourceSchema
>;

export const EXECUTION_LEG_STATE_VALUES = [
  "pending",
  "deferred",
  "blocked",
  "quote_ready",
  "awaiting_approval",
  "submitted",
  "confirmed",
  "failed",
  "expired",
] as const;
export const executionLegStateSchema = z.enum(EXECUTION_LEG_STATE_VALUES);
export type ExecutionLegState = z.infer<typeof executionLegStateSchema>;

export const EXECUTION_RECEIPT_STATUS_VALUES = [
  "not_submitted",
  "pending",
  "confirmed",
  "reverted",
  "not_found",
] as const;
export const executionReceiptStatusSchema = z.enum(
  EXECUTION_RECEIPT_STATUS_VALUES,
);
export type ExecutionReceiptStatus = z.infer<
  typeof executionReceiptStatusSchema
>;

export const EXECUTION_MANUAL_SIGNING_MODE_VALUES = [
  "wallet_first",
] as const;
export const executionManualSigningModeSchema = z.enum(
  EXECUTION_MANUAL_SIGNING_MODE_VALUES,
);
export type ExecutionManualSigningMode = z.infer<
  typeof executionManualSigningModeSchema
>;

export const EXECUTION_AUTOMATION_ACCOUNT_MODE_VALUES = [
  "smart_account_required",
] as const;
export const executionAutomationAccountModeSchema = z.enum(
  EXECUTION_AUTOMATION_ACCOUNT_MODE_VALUES,
);
export type ExecutionAutomationAccountMode = z.infer<
  typeof executionAutomationAccountModeSchema
>;

export const EXECUTION_AUTOMATION_READINESS_VALUES = [
  "wallet_required",
  "smart_account_required",
  "smart_account_pending",
  "ready",
] as const;
export const executionAutomationReadinessSchema = z.enum(
  EXECUTION_AUTOMATION_READINESS_VALUES,
);
export type ExecutionAutomationReadiness = z.infer<
  typeof executionAutomationReadinessSchema
>;

export const EXECUTION_VENUE_SIGNING_MODE_VALUES = [
  "wallet_signer_manual_only",
] as const;
export const executionVenueSigningModeSchema = z.enum(
  EXECUTION_VENUE_SIGNING_MODE_VALUES,
);
export type ExecutionVenueSigningMode = z.infer<
  typeof executionVenueSigningModeSchema
>;

export const xstocksXChangeQuoteSchema = z.object({
  quoteId: nonEmptyStringSchema,
  requestedAt: timestampSchema,
  side: z.enum(["Buy", "Sell"]),
  quantity: z.union([z.number().finite(), nonEmptyStringSchema]),
  priceUsd: z.number().finite(),
  generalStatus: z.enum([
    "Provided",
    "Accepted",
    "Completed",
    "Expired",
    "Cancelled",
  ]),
  hedgingStatus: z.enum([
    "NotStarted",
    "PendingHedge",
    "InProgress",
    "Succeeded",
    "Failed",
    "Unwinding",
    "Unwound",
  ]),
  blockchainStatus: z.enum([
    "NotReady",
    "GeneratingSignature",
    "PendingExecution",
    "Executed",
    "ExpiredExecution",
    "Failed",
  ]),
  tokenDeployment: z.object({
    decimals: z.number().finite(),
    address: nonEmptyStringSchema,
    chainId: z.union([z.number().finite(), nonEmptyStringSchema]),
    network: nonEmptyStringSchema,
    id: nonEmptyStringSchema,
    token: z.object({
      symbol: nonEmptyStringSchema,
      name: nonEmptyStringSchema,
    }),
  }),
  contract: z
    .object({
      network: nonEmptyStringSchema,
      address: nonEmptyStringSchema,
    })
    .nullable(),
  signature: nonEmptyStringSchema,
  signaturePayload: z.unknown().nullable(),
});
export type XStocksXChangeQuote = z.infer<typeof xstocksXChangeQuoteSchema>;

export const cowSwapQuoteSchema = z.object({
  kind: z.literal("cow_swap"),
  quoteId: nonEmptyStringSchema,
  quotedAt: timestampSchema,
  expiration: timestampSchema,
  verified: z.boolean(),
  protocolFeeBps: nonEmptyStringSchema.nullable().optional(),
  order: z.object({
    sellToken: nonEmptyStringSchema,
    buyToken: nonEmptyStringSchema,
    receiver: nonEmptyStringSchema,
    sellAmount: nonEmptyStringSchema,
    buyAmount: nonEmptyStringSchema,
    validTo: z.number().int().nonnegative(),
    appData: nonEmptyStringSchema,
    feeAmount: nonEmptyStringSchema,
    kind: z.enum(["sell", "buy"]),
    partiallyFillable: z.boolean(),
    sellTokenBalance: nonEmptyStringSchema,
    buyTokenBalance: nonEmptyStringSchema,
    signingScheme: nonEmptyStringSchema,
    gasAmount: nonEmptyStringSchema.nullable().optional(),
    gasPrice: nonEmptyStringSchema.nullable().optional(),
    sellTokenPrice: nonEmptyStringSchema.nullable().optional(),
  }),
  owner: nonEmptyStringSchema,
});
export type CowSwapQuote = z.infer<typeof cowSwapQuoteSchema>;

export const oneInchFusionQuoteSchema = z.object({
  kind: z.literal("oneinch_fusion"),
  quoteId: nonEmptyStringSchema.nullable(),
  quotedAt: timestampSchema,
  fromTokenAddress: nonEmptyStringSchema,
  toTokenAddress: nonEmptyStringSchema,
  walletAddress: nonEmptyStringSchema,
  fromTokenAmount: nonEmptyStringSchema,
  toTokenAmount: nonEmptyStringSchema,
  settlementAddress: nonEmptyStringSchema,
  recommendedPreset: nonEmptyStringSchema,
  priceImpactPercent: z.union([z.number().finite(), nonEmptyStringSchema]).nullable(),
  orderHash: nonEmptyStringSchema.nullable().optional(),
  signerAddress: nonEmptyStringSchema.nullable().optional(),
  receiver: nonEmptyStringSchema.nullable().optional(),
  fee: z.object({
    receiver: nonEmptyStringSchema,
    bps: z.number().finite(),
    whitelistDiscountPercent: z.number().finite(),
  }),
  submissionSupported: z.boolean(),
});
export type OneInchFusionQuote = z.infer<typeof oneInchFusionQuoteSchema>;

export const lifiQuoteSchema = z.object({
  kind: z.literal("lifi_quote"),
  quoteId: nonEmptyStringSchema,
  quotedAt: timestampSchema,
  routeId: nonEmptyStringSchema,
  tool: nonEmptyStringSchema,
  fromTokenAddress: nonEmptyStringSchema,
  toTokenAddress: nonEmptyStringSchema,
  fromAddress: nonEmptyStringSchema,
  toAddress: nonEmptyStringSchema,
  fromTokenAmount: nonEmptyStringSchema,
  toTokenAmount: nonEmptyStringSchema,
  toAmountMin: nonEmptyStringSchema.nullable(),
  approvalAddress: nonEmptyStringSchema.nullable(),
  transactionRequest: jsonRecordSchema,
  includedSteps: z.array(jsonRecordSchema),
});
export type LifiQuote = z.infer<typeof lifiQuoteSchema>;

export const ensoBundleQuoteSchema = z.object({
  kind: z.literal("enso_bundle"),
  quoteId: nonEmptyStringSchema,
  quotedAt: timestampSchema,
  chainId: z.number().int().positive(),
  fromAddress: nonEmptyStringSchema,
  receiver: nonEmptyStringSchema.nullable(),
  routingStrategy: nonEmptyStringSchema,
  tx: jsonRecordSchema,
  gas: nonEmptyStringSchema.nullable(),
  priceImpact: z.number().finite().nullable(),
  amountsOut: z.record(z.string(), nonEmptyStringSchema),
  route: z.array(jsonRecordSchema),
  bundle: z.array(jsonRecordSchema),
  selectedOutputTokenAddress: nonEmptyStringSchema.nullable(),
  selectedOutputAmount: nonEmptyStringSchema.nullable(),
});
export type EnsoBundleQuote = z.infer<typeof ensoBundleQuoteSchema>;

export const executionQuoteSchema = z.union([
  cowSwapQuoteSchema,
  oneInchFusionQuoteSchema,
  lifiQuoteSchema,
  ensoBundleQuoteSchema,
  xstocksXChangeQuoteSchema,
]);
export type ExecutionQuote = z.infer<typeof executionQuoteSchema>;

export const eip712ExecutionApprovalSchema = z.object({
  approvalType: z.literal("eip712_signature"),
  status: executionApprovalStatusSchema,
  signerAddress: nonEmptyStringSchema,
  approvalTarget: nonEmptyStringSchema,
  orderToSign: jsonRecordSchema,
  signature: nonEmptyStringSchema.nullable(),
  approvedAt: timestampSchema.nullable(),
  submittedAt: timestampSchema.nullable(),
  venueOrderId: nonEmptyStringSchema.nullable(),
  notes: z.array(nonEmptyStringSchema),
});
export const walletTransactionApprovalSchema = z.object({
  approvalType: z.literal("wallet_transaction"),
  status: executionApprovalStatusSchema,
  signerAddress: nonEmptyStringSchema,
  approvalTarget: nonEmptyStringSchema,
  orderToSign: jsonRecordSchema,
  transactionRequest: jsonRecordSchema,
  signature: nonEmptyStringSchema.nullable(),
  approvedAt: timestampSchema.nullable(),
  submittedAt: timestampSchema.nullable(),
  venueOrderId: nonEmptyStringSchema.nullable(),
  notes: z.array(nonEmptyStringSchema),
});
export const executionApprovalSchema = z.union([
  eip712ExecutionApprovalSchema,
  walletTransactionApprovalSchema,
]);
export type ExecutionApproval = z.infer<typeof executionApprovalSchema>;

export const executionReceiptSchema = z.object({
  txHash: nonEmptyStringSchema,
  submittedAt: timestampSchema,
  lastCheckedAt: timestampSchema.nullable(),
  receiptStatus: executionReceiptStatusSchema,
  confirmedAt: timestampSchema.nullable(),
  revertedAt: timestampSchema.nullable(),
  blockNumber: z.number().int().nonnegative().nullable(),
  transactionIndex: z.number().int().nonnegative().nullable(),
  rpcUrl: nonEmptyStringSchema.nullable(),
  rawReceipt: jsonRecordSchema.nullable(),
});
export type ExecutionReceipt = z.infer<typeof executionReceiptSchema>;

export const executionTradeStatusSchema = z.object({
  event: nonEmptyStringSchema,
  timestamp: timestampSchema,
});
export type ExecutionTradeStatus = z.infer<typeof executionTradeStatusSchema>;

export const executionTradeSchema = z.object({
  tradeId: nonEmptyStringSchema,
  status: nonEmptyStringSchema,
  settledAt: timestampSchema.nullable(),
  outTxHash: nonEmptyStringSchema.nullable(),
  tradeStatuses: z.array(executionTradeStatusSchema),
});
export type ExecutionTrade = z.infer<typeof executionTradeSchema>;

export const executionVenueStatusSchema = z.object({
  venueId: nonEmptyStringSchema,
  venueOrderId: nonEmptyStringSchema.nullable(),
  status: nonEmptyStringSchema,
  settlementTxHash: nonEmptyStringSchema.nullable(),
  lastCheckedAt: timestampSchema.nullable(),
  updatedAt: timestampSchema,
  rawStatus: jsonRecordSchema.nullable(),
});
export type ExecutionVenueStatus = z.infer<typeof executionVenueStatusSchema>;

export const executionRequestLinkageSchema = z.object({
  rebalanceId: nonEmptyStringSchema.nullable(),
  providerReceiptId: nonEmptyStringSchema.nullable(),
  providerDeliveryId: nonEmptyStringSchema.nullable(),
  providerEventId: nonEmptyStringSchema.nullable(),
});
export type ExecutionRequestLinkage = z.infer<
  typeof executionRequestLinkageSchema
>;

export const executionLegArtifactLinkageSchema =
  executionRequestLinkageSchema.extend({
    executionRequestId: nonEmptyStringSchema,
  });
export type ExecutionLegArtifactLinkage = z.infer<
  typeof executionLegArtifactLinkageSchema
>;

export const executionRequestLegSchema = z.object({
  legId: nonEmptyStringSchema,
  sequence: z.number().int().positive(),
  sleeve: nonEmptyStringSchema,
  assetSymbol: nonEmptyStringSchema.optional(),
  venueId: nonEmptyStringSchema.optional(),
  adapterId: nonEmptyStringSchema,
  requiredRouteId: nonEmptyStringSchema,
  targetWeightPct: z.number().finite().nonnegative(),
  targetNotionalUsd: z.number().finite().nonnegative(),
  paymentAssetSymbol: nonEmptyStringSchema,
  paymentTokenAddress: nonEmptyStringSchema.nullable(),
  paymentTokenDecimals: z.number().int().nonnegative().nullable().optional(),
  receivingTokenAddress: nonEmptyStringSchema.nullable(),
  receivingTokenDecimals: z.number().int().nonnegative().nullable().optional(),
  settlementAddress: nonEmptyStringSchema.nullable(),
  state: executionLegStateSchema,
  blockers: z.array(nonEmptyStringSchema),
  warnings: z.array(nonEmptyStringSchema),
  quote: executionQuoteSchema.nullable(),
  approval: executionApprovalSchema.nullable(),
  venueStatus: executionVenueStatusSchema.nullable(),
  receipt: executionReceiptSchema.nullable(),
  trade: executionTradeSchema.nullable(),
  linkage: executionLegArtifactLinkageSchema.nullable().optional(),
});
export type ExecutionRequestLeg = z.infer<typeof executionRequestLegSchema>;

export const executionRequestSchema = z.object({
  version: contractVersionSchema,
  executionRequestId: nonEmptyStringSchema,
  owner: authenticatedOwnerSchema.nullable(),
  rebalanceId: nonEmptyStringSchema.nullable().optional(),
  activationId: nonEmptyStringSchema,
  manifestId: nonEmptyStringSchema,
  slotId: strategySlotIdSchema,
  chain: chainSchema,
  mode: strategyModeSchema,
  runtimeOwner: executionRuntimeOwnerSchema,
  triggerSource: executionTriggerSourceSchema,
  adapterId: nonEmptyStringSchema,
  activationManifestRef: activationManifestRefSchema,
  requestedNotionalUsd: z.number().finite().nonnegative(),
  fundingAssetSymbol: nonEmptyStringSchema,
  manualSignerAddress: nonEmptyStringSchema.nullable(),
  policyAccountAddress: nonEmptyStringSchema.nullable(),
  executionDestinationAddress: nonEmptyStringSchema.nullable(),
  manualSigningMode: executionManualSigningModeSchema,
  automationAccountMode: executionAutomationAccountModeSchema,
  automationReadiness: executionAutomationReadinessSchema,
  venueSigningMode: executionVenueSigningModeSchema,
  settlementAddress: nonEmptyStringSchema.nullable(),
  state: executionRequestStateSchema,
  blockers: z.array(nonEmptyStringSchema),
  warnings: z.array(nonEmptyStringSchema),
  legs: z.array(executionRequestLegSchema),
  linkage: executionRequestLinkageSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type ExecutionRequest = z.infer<typeof executionRequestSchema>;
