import type { RouteTruth, XStocksExecutionRailId, XStocksRailProofSource } from "./truth.js";

export const XSTOCKS_NETWORKS = [
  "Ethereum",
  "Polygon",
  "Gnosis",
  "BinanceSmartChain",
  "Arbitrum",
  "Avalanche",
  "Fantom",
  "Base",
  "Lisk",
  "Etherlink",
  "Sonic",
  "Solana",
  "Tron",
  "Ton",
  "Mantle",
  "HyperEVM",
  "Ink"
] as const;

export type XStocksNetwork = (typeof XSTOCKS_NETWORKS)[number];

export const XSTOCKS_STABLECOIN_CURRENCIES = ["USD", "CHF", "EUR"] as const;
export type XStocksStablecoinCurrency = (typeof XSTOCKS_STABLECOIN_CURRENCIES)[number];

export const XSTOCKS_MULTIPLIER_REASONS = [
  "FeeAccrual",
  "Dividend",
  "Split",
  "ReverseSplit",
  "Administrative"
] as const;

export type XStocksMultiplierReason = (typeof XSTOCKS_MULTIPLIER_REASONS)[number];

export interface XStocksPageInfo {
  readonly currentPage: number;
  readonly hasNextPage: boolean;
}

export interface XStocksStablecoinRaw {
  readonly symbol: string;
  readonly currency: XStocksStablecoinCurrency;
  readonly network: XStocksNetwork;
  readonly address: string;
  readonly decimals: number;
  readonly issuance: boolean;
  readonly redemption: boolean;
  readonly supportsAtomicSwaps: boolean;
  readonly solanaTokenProgram?: string;
}

export interface XStocksDeploymentRaw {
  readonly address: string;
  readonly network: XStocksNetwork;
  readonly wrapperAddress?: string;
  readonly supportsAtomicSwaps: boolean;
  readonly stablecoins: readonly XStocksStablecoinRaw[];
}

export interface XStocksAssetRaw {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly isin: string;
  readonly underlyingSymbol: string;
  readonly underlyingIsin: string;
  readonly description: string;
  readonly logo: string;
  readonly isTradingHalted: boolean;
  readonly deployments: readonly XStocksDeploymentRaw[];
}

export interface XStocksAssetListRaw {
  readonly nodes: readonly XStocksAssetRaw[];
  readonly page: XStocksPageInfo;
}

export interface XStocksPriceDataRaw {
  readonly quote: number | null;
}

export interface XStocksMultiplierRaw {
  readonly currentMultiplier: number;
  readonly newMultiplier: number;
  readonly activationDateTime: number;
  readonly reason: XStocksMultiplierReason | null;
}

export interface XStocksMultiplierHistoryEntryRaw {
  readonly id: string;
  readonly reason: XStocksMultiplierReason;
  readonly multiplier: number;
  readonly previousMultiplier: number;
  readonly activationDateTime: string;
}

export interface XStocksMultiplierHistoryRaw {
  readonly page: XStocksPageInfo;
  readonly nodes: readonly XStocksMultiplierHistoryEntryRaw[];
}

export interface XStocksProofOfReservesHoldingRaw {
  readonly provider: string;
  readonly quantity: string;
  readonly symbol: string;
}

export interface XStocksProofOfReservesRaw {
  readonly symbol: string;
  readonly timestamp: string;
  readonly sharesHeld: string;
  readonly circulatingSupply: string;
  readonly holdings: readonly XStocksProofOfReservesHoldingRaw[];
}

export interface XStocksSystemStatusRaw {
  readonly symbol: string;
  readonly isMarketTradingHalted: boolean;
  readonly isAtomicTradingHalted: boolean;
}

export interface XStocksStablecoin {
  readonly symbol: string;
  readonly currency: XStocksStablecoinCurrency;
  readonly network: XStocksNetwork;
  readonly address: string;
  readonly decimals: number;
  readonly issuance: boolean;
  readonly redemption: boolean;
  readonly supportsAtomicSwaps: boolean;
  readonly solanaTokenProgram: string | null;
}

export interface XStocksDeployment {
  readonly address: string;
  readonly network: XStocksNetwork;
  readonly wrapperAddress: string | null;
  readonly supportsAtomicSwaps: boolean;
  readonly stablecoins: readonly XStocksStablecoin[];
}

export interface XStocksAsset {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly isin: string;
  readonly underlyingSymbol: string;
  readonly underlyingIsin: string;
  readonly description: string;
  readonly logoUrl: string | null;
  readonly isTradingHalted: boolean;
  readonly deployments: readonly XStocksDeployment[];
}

export interface XStocksAssetPage {
  readonly nodes: readonly XStocksAsset[];
  readonly page: XStocksPageInfo;
}

export interface XStocksPriceData {
  readonly symbol: string;
  readonly quoteUsd: number | null;
  readonly hasQuote: boolean;
}

export interface XStocksPendingMultiplier {
  readonly value: number;
  readonly activationDateTime: string;
  readonly reason: XStocksMultiplierReason | null;
}

export interface XStocksMultiplier {
  readonly symbol: string;
  readonly network: XStocksNetwork;
  readonly currentMultiplier: number;
  readonly pendingMultiplier: XStocksPendingMultiplier | null;
}

export interface XStocksMultiplierHistoryEntry {
  readonly id: string;
  readonly symbol: string;
  readonly network: XStocksNetwork;
  readonly reason: XStocksMultiplierReason;
  readonly multiplier: number;
  readonly previousMultiplier: number;
  readonly delta: number;
  readonly activationDateTime: string;
}

export interface XStocksMultiplierHistoryPage {
  readonly page: XStocksPageInfo;
  readonly nodes: readonly XStocksMultiplierHistoryEntry[];
}

export interface XStocksProofOfReservesHolding {
  readonly provider: string;
  readonly quantity: string;
  readonly symbol: string;
}

export interface XStocksProofOfReserves {
  readonly symbol: string;
  readonly timestamp: string | null;
  readonly sharesHeld: string | null;
  readonly circulatingSupply: string | null;
  readonly proofAvailable: boolean;
  readonly coverageRatio: number | null;
  readonly holdings: readonly XStocksProofOfReservesHolding[];
}

export interface XStocksSystemStatus {
  readonly symbol: string;
  readonly isMarketTradingHalted: boolean;
  readonly isAtomicTradingHalted: boolean;
  readonly canTradeMarket: boolean;
  readonly canTradeAtomic: boolean;
}

export const XSTOCKS_REGISTERED_WALLET_STATUS_VALUES = [
  "Pending",
  "Active",
  "Inactive",
] as const;
export type XStocksRegisteredWalletStatus =
  (typeof XSTOCKS_REGISTERED_WALLET_STATUS_VALUES)[number];

export interface XStocksRegisteredWallet {
  readonly address: string;
  readonly status: XStocksRegisteredWalletStatus;
  readonly createdAt: string;
}

export interface XStocksRegisteredWalletList {
  readonly nodes: readonly XStocksRegisteredWallet[];
}

export const XSTOCKS_XCHANGE_SIDE_VALUES = ["Buy", "Sell"] as const;
export type XStocksXChangeSide = (typeof XSTOCKS_XCHANGE_SIDE_VALUES)[number];

export const XSTOCKS_XCHANGE_GENERAL_STATUS_VALUES = [
  "Provided",
  "Accepted",
  "Completed",
  "Expired",
  "Cancelled",
] as const;
export type XStocksXChangeGeneralStatus =
  (typeof XSTOCKS_XCHANGE_GENERAL_STATUS_VALUES)[number];

export const XSTOCKS_XCHANGE_HEDGING_STATUS_VALUES = [
  "NotStarted",
  "PendingHedge",
  "InProgress",
  "Succeeded",
  "Failed",
  "Unwinding",
  "Unwound",
] as const;
export type XStocksXChangeHedgingStatus =
  (typeof XSTOCKS_XCHANGE_HEDGING_STATUS_VALUES)[number];

export const XSTOCKS_XCHANGE_BLOCKCHAIN_STATUS_VALUES = [
  "NotReady",
  "GeneratingSignature",
  "PendingExecution",
  "Executed",
  "ExpiredExecution",
  "Failed",
] as const;
export type XStocksXChangeBlockchainStatus =
  (typeof XSTOCKS_XCHANGE_BLOCKCHAIN_STATUS_VALUES)[number];

export interface XStocksXChangeQuoteRequest {
  readonly identifier: string;
  readonly side: XStocksXChangeSide;
  readonly quantity?: number | string;
  readonly cashAmount?: number | string;
  readonly network: XStocksNetwork;
  readonly paymentWalletIdentifier: string;
  readonly receivingWalletIdentifier: string;
}

export interface XStocksXChangeTokenDeployment {
  readonly decimals: number;
  readonly address: string;
  readonly chainId: number | string;
  readonly network: string;
  readonly id: string;
  readonly token: {
    readonly symbol: string;
    readonly name: string;
  };
}

export interface XStocksXChangeContract {
  readonly network: string;
  readonly address: string;
}

export interface XStocksXChangeQuote {
  readonly id: string;
  readonly quantity: number | string;
  readonly price: number;
  readonly generalStatus: XStocksXChangeGeneralStatus;
  readonly hedgingStatus: XStocksXChangeHedgingStatus;
  readonly blockchainStatus: XStocksXChangeBlockchainStatus;
  readonly createdAt: string;
  readonly clientId: string;
  readonly tokenDeployment: XStocksXChangeTokenDeployment;
  readonly contract: XStocksXChangeContract | null;
  readonly side: XStocksXChangeSide;
  readonly signature: string;
  readonly signaturePayload: unknown | null;
}

export interface XStocksTradeStatusEntry {
  readonly event: string;
  readonly timestamp: string;
}

export interface XStocksTrade {
  readonly id: string;
  readonly type: string;
  readonly initiatedAt: string;
  readonly settledAt: string | null;
  readonly status: string;
  readonly asset: string | null;
  readonly assetPair: string | null;
  readonly inAsset: string | null;
  readonly outAsset: string | null;
  readonly network: string | null;
  readonly inTxHash: string | null;
  readonly outTxHash: string | null;
  readonly tradeStatuses: readonly XStocksTradeStatusEntry[];
}

export interface XStocksTradePage {
  readonly nodes: readonly XStocksTrade[];
  readonly page: XStocksPageInfo;
}

export const COW_SWAP_ORDER_KIND_VALUES = ["sell", "buy"] as const;
export type CowSwapOrderKind = (typeof COW_SWAP_ORDER_KIND_VALUES)[number];

export interface CowSwapQuoteRequest {
  readonly sellToken: string;
  readonly buyToken: string;
  readonly owner: string;
  readonly receiver?: string;
  readonly kind: CowSwapOrderKind;
  readonly sellAmountBeforeFee?: string;
  readonly buyAmountAfterFee?: string;
  readonly appData?: string;
  readonly partiallyFillable?: boolean;
}

export interface CowSwapQuotedOrder {
  readonly sellToken: string;
  readonly buyToken: string;
  readonly receiver: string;
  readonly sellAmount: string;
  readonly buyAmount: string;
  readonly validTo: number;
  readonly appData: string;
  readonly feeAmount: string;
  readonly gasAmount?: string;
  readonly gasPrice?: string;
  readonly sellTokenPrice?: string;
  readonly kind: CowSwapOrderKind;
  readonly partiallyFillable: boolean;
  readonly sellTokenBalance: string;
  readonly buyTokenBalance: string;
  readonly signingScheme: string;
}

export interface CowSwapQuoteResponse {
  readonly quote: CowSwapQuotedOrder;
  readonly from: string;
  readonly expiration: string;
  readonly id: number | string;
  readonly verified: boolean;
  readonly protocolFeeBps?: string;
}

export interface CowSwapOrderDraft {
  readonly sellToken: string;
  readonly buyToken: string;
  readonly receiver: string;
  readonly sellAmount: string;
  readonly buyAmount: string;
  readonly validTo: number;
  readonly appData: string;
  readonly feeAmount: string;
  readonly kind: CowSwapOrderKind;
  readonly partiallyFillable: boolean;
  readonly sellTokenBalance: string;
  readonly buyTokenBalance: string;
  readonly signingScheme: string;
  readonly from: string;
}

export interface CowSwapOrderSubmission {
  readonly sellToken: string;
  readonly buyToken: string;
  readonly receiver: string;
  readonly sellAmount: string;
  readonly buyAmount: string;
  readonly validTo: number;
  readonly appData: string;
  readonly feeAmount: string;
  readonly kind: CowSwapOrderKind;
  readonly partiallyFillable: boolean;
  readonly sellTokenBalance: string;
  readonly buyTokenBalance: string;
  readonly signingScheme: string;
  readonly from: string;
  readonly signature: string;
}

export interface CowSwapOrderStatus {
  readonly uid: string;
  readonly status: string;
  readonly settlementTxHash?: string | null;
  readonly raw?: Record<string, unknown> | null;
}

export interface OneInchFusionQuoteRequest {
  readonly fromTokenAddress: string;
  readonly toTokenAddress: string;
  readonly amount: string;
  readonly walletAddress?: string;
  readonly enableEstimate?: boolean;
  readonly source?: string;
  readonly permit?: string;
  readonly isPermit2?: boolean;
  readonly slippage?: number;
}

export interface OneInchFusionQuotePresetGasCost {
  readonly gasBumpEstimate: number | string;
  readonly gasPriceEstimate: string;
}

export interface OneInchFusionQuotePresetPoint {
  readonly delay: number;
  readonly coefficient: number | string;
}

export interface OneInchFusionQuotePreset {
  readonly auctionDuration: number;
  readonly startAuctionIn: number;
  readonly bankFee: string;
  readonly initialRateBump: number | string;
  readonly auctionStartAmount: string;
  readonly auctionEndAmount: string;
  readonly tokenFee: string;
  readonly exclusiveResolver: string | null;
  readonly estP: number | string;
  readonly allowPartialFills: boolean;
  readonly allowMultipleFills: boolean;
  readonly gasCost: OneInchFusionQuotePresetGasCost;
  readonly points: readonly OneInchFusionQuotePresetPoint[];
  readonly startAmount: string;
}

export interface OneInchFusionQuoteResponse {
  readonly quoteId: string | null;
  readonly fromTokenAmount: string;
  readonly toTokenAmount: string;
  readonly feeToken: string;
  readonly presets: Record<string, OneInchFusionQuotePreset>;
  readonly fee: {
    readonly receiver: string;
    readonly bps: number;
    readonly whitelistDiscountPercent: number;
  };
  readonly integratorFee: number;
  readonly integratorFeeShare: number;
  readonly settlementAddress: string;
  readonly whitelist: readonly string[];
  readonly recommended_preset: string;
  readonly prices?: {
    readonly usd?: {
      readonly fromToken: string;
      readonly toToken: string;
    };
  };
  readonly volume?: {
    readonly usd?: {
      readonly fromToken: string;
      readonly toToken: string;
    };
  };
  readonly suggested?: boolean;
  readonly priceImpactPercent?: number | string | null;
  readonly autoK?: number | string;
  readonly k?: number | string;
  readonly mxK?: number | string;
  readonly gas?: number | string;
  readonly pfGas?: number | string;
  readonly marketAmount?: string;
  readonly surplusFee?: number | string;
}

export interface XStocksExecutionRoute {
  readonly id: XStocksExecutionRailId;
  readonly label: string;
  readonly chain: XStocksNetwork;
  readonly truth: RouteTruth;
  readonly proofSource: XStocksRailProofSource;
  readonly deploymentAddress: string | null;
  readonly wrapperAddress: string | null;
  readonly stablecoinSymbols: readonly string[];
  readonly supportsAtomicSwaps: boolean;
  readonly blockers: readonly string[];
  readonly notes: readonly string[];
}

export interface XStocksNormalizedLiveState {
  readonly symbol: string;
  readonly network: XStocksNetwork;
  readonly fetchedAt: string;
  readonly asset: XStocksAsset;
  readonly priceData: XStocksPriceData;
  readonly multiplier: XStocksMultiplier;
  readonly multiplierHistory: XStocksMultiplierHistoryPage;
  readonly proofOfReserves: XStocksProofOfReserves;
  readonly systemStatus: XStocksSystemStatus;
  readonly executionRoutes: readonly XStocksExecutionRoute[];
  readonly routeTruth: RouteTruth;
}

export interface XStocksStateStripPricing {
  readonly quoteUsd: number | null;
  readonly hasQuote: boolean;
  readonly currentMultiplier: number;
  readonly pendingMultiplier: number | null;
  readonly pendingActivationDateTime: string | null;
  readonly pendingReason: XStocksMultiplierReason | null;
}

export interface XStocksStateStripReserves {
  readonly proofAvailable: boolean;
  readonly timestamp: string | null;
  readonly sharesHeld: string | null;
  readonly circulatingSupply: string | null;
  readonly coverageRatio: number | null;
  readonly providerCount: number;
  readonly holdings: readonly XStocksProofOfReservesHolding[];
}

export interface XStocksStateStripStatus {
  readonly isTradingHalted: boolean;
  readonly isMarketTradingHalted: boolean;
  readonly isAtomicTradingHalted: boolean;
  readonly canTradeMarket: boolean;
  readonly canTradeAtomic: boolean;
}

export interface XStocksStateStripAsset {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly underlyingSymbol: string;
  readonly logoUrl: string | null;
  readonly networks: readonly XStocksNetwork[];
  readonly atomicSwapNetworks: readonly XStocksNetwork[];
}

export interface XStocksStateStripPayload {
  readonly generatedAt: string;
  readonly symbol: string;
  readonly network: XStocksNetwork;
  readonly routeTruth: RouteTruth;
  readonly asset: XStocksStateStripAsset;
  readonly pricing: XStocksStateStripPricing;
  readonly reserves: XStocksStateStripReserves;
  readonly status: XStocksStateStripStatus;
  readonly routes: readonly XStocksExecutionRoute[];
  readonly multiplierHistory: readonly XStocksMultiplierHistoryEntry[];
}

export interface XStocksStateStripCollectionPayload {
  readonly generatedAt: string;
  readonly network: XStocksNetwork;
  readonly page: XStocksPageInfo | null;
  readonly nodes: readonly XStocksStateStripPayload[];
}
