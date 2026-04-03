import type { PromotedManifest } from "@/lib/contracts";
import {
  postExecutionAction,
  resolveApiBase,
  type ApiActivationView,
  type ApiExecutionApproval,
  type ApiExecutionLeg,
  type ApiExecutionReadResponse,
  type ApiExecutionRequest,
} from "@/lib/api-client";

type StatusTone = "neutral" | "positive" | "warning";

type ManualExecutionAuth = {
  accessToken?: string | null;
  identityToken?: string | null;
};

type ManualExecutionWalletState = {
  connected: boolean;
  walletAddress: string | null;
  embeddedWallet: {
    status: string;
    address: string | null;
  };
  smartAccount: {
    status: string;
    address: string | null;
  };
};

type WalletWithProvider = {
  address?: string;
  getEthereumProvider?: () => Promise<{
    request: (payload: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
  }>;
};

type WalletRpcProvider = {
  request: (payload: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

type ManualExecutionFlowArgs = {
  manifest: PromotedManifest;
  requestedNotionalUsd: number;
  initiationAction: "create" | "execute_all";
  latestActivation: ApiActivationView | null;
  existingExecutionRequest: ApiExecutionRequest | null;
  portfolioExecutionAdapterId?: string | null;
  rebalanceId?: string;
  auth?: ManualExecutionAuth;
  wallets: WalletWithProvider[];
  activeWallet: WalletWithProvider | null;
  walletState: ManualExecutionWalletState;
  onStatus?: (status: { tone: StatusTone; message: string }) => void;
  onActivation?: (activation: ApiActivationView | null) => void;
  onExecutionRequest?: (request: ApiExecutionRequest | null) => void;
};

type ManualExecutionFlowResult = {
  activation: ApiActivationView | null;
  executionRequest: ApiExecutionRequest | null;
  blocker: string | null;
};

type ActivationSaveResponse = {
  version: string;
  generatedAt: string;
  activation: ApiActivationView;
};

type SignatureInput = {
  legId: string;
  assetSymbol: string;
  signerAddress: string | null;
  quoteId: string | null;
  orderHash: string | null;
  primaryType: string | null;
  domainName: string | null;
};

type ApiLifiQuote = Extract<
  NonNullable<ApiExecutionLeg["quote"]>,
  { kind: "lifi_quote" }
>;
type ApiEnsoBundleQuote = Extract<
  NonNullable<ApiExecutionLeg["quote"]>,
  { kind: "enso_bundle" }
>;

export const EXECUTION_REFRESH_EVENT = "xstocks:execution-refresh";
const ACTIVE_PORTFOLIO_EXECUTION_ADAPTER_ID = "oneinch_fusion";
const ACTIVE_PORTFOLIO_EXECUTION_ROUTE_ID = "1inch.ethereum";

function isPortfolioQuoteAdapter(adapterId: string | null | undefined) {
  return (
    adapterId === "enso_bundle" ||
    adapterId === "lifi_portfolio" ||
    adapterId === "portfolio_multiquoter"
  );
}

function emitRefresh(slotId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(EXECUTION_REFRESH_EVENT, {
      detail: {
        slotId,
      },
    }),
  );
}

function toStatusErrorMessage(
  fallback: string,
  error: { error: string | null; details: unknown; status: number },
) {
  if (typeof error.error === "string" && error.error.length > 0) {
    return error.error;
  }

  const detailBlocker =
    error.details &&
    typeof error.details === "object" &&
    Array.isArray((error.details as { blockers?: unknown[] }).blockers) &&
    typeof (error.details as { blockers: unknown[] }).blockers[0] === "string"
      ? ((error.details as { blockers: string[] }).blockers[0] as string)
      : null;

  return detailBlocker ?? fallback;
}

function normalizeAddress(value: string | null | undefined) {
  return typeof value === "string" ? value.toLowerCase() : null;
}

function addressesMatch(left: string | null | undefined, right: string | null | undefined) {
  const leftNormalized = normalizeAddress(left);
  const rightNormalized = normalizeAddress(right);

  return Boolean(leftNormalized && rightNormalized && leftNormalized === rightNormalized);
}

function buildActivationWalletState(walletState: ManualExecutionWalletState, fundedNotionalUsd: number) {
  return {
    walletConnected: walletState.connected,
    walletAddress: walletState.walletAddress,
    fundedNotionalUsd,
    ...(walletState.embeddedWallet.address
      ? {
          embeddedWallet: {
            status: walletState.embeddedWallet.status,
            address: walletState.embeddedWallet.address,
          },
        }
      : {}),
    smartAccount: {
      status: walletState.smartAccount.status,
      address: walletState.smartAccount.address,
    },
  };
}

async function postActivationSave(
  manifest: PromotedManifest,
  requestedNotionalUsd: number,
  walletState: ManualExecutionWalletState,
  auth?: ManualExecutionAuth,
) {
  const base = resolveApiBase();
  const response = await fetch(`${base}/api/activations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...(auth?.identityToken
        ? { "X-Privy-Identity-Token": auth.identityToken }
        : {}),
    },
    body: JSON.stringify({
      manifestId: manifest.manifest_id,
      userNotionalUsd: requestedNotionalUsd,
      walletState: buildActivationWalletState(walletState, requestedNotionalUsd),
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.data?.activation) {
    return {
      ok: false as const,
      error:
        typeof payload?.error === "string"
          ? payload.error
          : `Activation save failed with status ${response.status}.`,
      activation: null,
    };
  }

  return {
    ok: true as const,
    error: null,
    activation: (payload.data as ActivationSaveResponse).activation,
  };
}

async function readExecutionRequest(
  executionRequestId: string,
  auth?: ManualExecutionAuth,
) {
  const base = resolveApiBase();
  const response = await fetch(
    `${base}/api/executions?executionRequestId=${encodeURIComponent(executionRequestId)}&limit=1`,
    {
      headers: {
        ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
        ...(auth?.identityToken
          ? { "X-Privy-Identity-Token": auth.identityToken }
          : {}),
      },
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return null;
  }

  const data = payload?.data as ApiExecutionReadResponse | undefined;
  return data?.items?.[0] ?? null;
}

function quoteIdForLeg(leg: ApiExecutionRequest["legs"][number]) {
  if (typeof leg.quote?.quoteId === "string") {
    return leg.quote.quoteId;
  }

  return null;
}

function orderHashForLeg(leg: ApiExecutionRequest["legs"][number]) {
  const orderToSign = leg.approval?.orderToSign ?? {};
  const quoteOrderHash =
    leg.quote &&
    typeof leg.quote === "object" &&
    "orderHash" in leg.quote &&
    typeof leg.quote.orderHash === "string"
      ? leg.quote.orderHash
      : null;

  return typeof orderToSign.orderHash === "string"
    ? orderToSign.orderHash
    : quoteOrderHash;
}

function typedDataForLeg(leg: ApiExecutionRequest["legs"][number]) {
  const orderToSign = leg.approval?.orderToSign ?? {};
  const typedData =
    "typedData" in orderToSign ? orderToSign.typedData : null;

  return typedData && typeof typedData === "object"
    ? (typedData as Record<string, unknown>)
    : null;
}

function getActionableLegs(executionRequest: ApiExecutionRequest) {
  return executionRequest.legs.filter((leg) => leg.state !== "deferred");
}

function getQuotableLegs(executionRequest: ApiExecutionRequest) {
  return getActionableLegs(executionRequest).filter((leg) => leg.state === "pending");
}

function getAwaitingApprovalLegs(executionRequest: ApiExecutionRequest) {
  return getActionableLegs(executionRequest).filter(
    (leg) => leg.state === "awaiting_approval" || leg.state === "quote_ready",
  );
}

function getCurrentBlocker(executionRequest: ApiExecutionRequest | null) {
  if (!executionRequest) {
    return null;
  }

  return (
    executionRequest.blockers[0] ??
    executionRequest.legs.find((leg) => leg.blockers.length > 0)?.blockers[0] ??
    null
  );
}

function pickSignerWallet(
  signerAddress: string | null,
  wallets: WalletWithProvider[],
  activeWallet: WalletWithProvider | null,
) {
  if (signerAddress && activeWallet && addressesMatch(activeWallet.address, signerAddress)) {
    return activeWallet;
  }

  if (signerAddress) {
    const matchingWallet = wallets.find((wallet) => addressesMatch(wallet.address, signerAddress));

    if (matchingWallet) {
      return matchingWallet;
    }
  }

  if (activeWallet) {
    return activeWallet;
  }

  return wallets.find((wallet) => typeof wallet.getEthereumProvider === "function") ?? null;
}

async function signTypedData(
  wallet: WalletWithProvider,
  signerAddress: string,
  typedData: Record<string, unknown>,
) {
  if (typeof wallet.getEthereumProvider !== "function") {
    throw new Error("The selected Privy wallet cannot provide an Ethereum signer.");
  }

  const provider = await wallet.getEthereumProvider();
  const serializedTypedData = JSON.stringify(typedData);

  try {
    const signature = await provider.request({
      method: "eth_signTypedData_v4",
      params: [signerAddress, serializedTypedData],
    });

    if (typeof signature === "string" && signature.length > 0) {
      return signature;
    }
  } catch {
    // Fall through to eth_signTypedData below.
  }

  const fallbackSignature = await provider.request({
    method: "eth_signTypedData",
    params: [signerAddress, typedData],
  });

  if (typeof fallbackSignature !== "string" || fallbackSignature.length === 0) {
    throw new Error("Wallet did not return an EIP-712 signature.");
  }

  return fallbackSignature;
}

function normalizeTxHash(value: unknown) {
  return typeof value === "string" && /^0x([A-Fa-f0-9]{64})$/u.test(value)
    ? value
    : null;
}

function normalizeTransactionNumericField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `0x${BigInt(Math.trunc(value)).toString(16)}`;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = value.trim();
    if (normalized.startsWith("0x")) {
      return normalized;
    }

    if (/^\d+$/u.test(normalized)) {
      return `0x${BigInt(normalized).toString(16)}`;
    }
  }

  return undefined;
}

function normalizeWalletTransactionRequest(
  value: Record<string, unknown>,
  options: { fallbackFrom?: string | null; fallbackGas?: string | null } = {},
) {
  const normalized: Record<string, unknown> = {
    ...(options.fallbackFrom ? { from: options.fallbackFrom } : {}),
  };

  for (const [key, nestedValue] of Object.entries(value ?? {})) {
    if (nestedValue === undefined || nestedValue === null) {
      continue;
    }

    if (
      key === "chainId" ||
      key === "gas" ||
      key === "gasLimit" ||
      key === "gasPrice" ||
      key === "maxFeePerGas" ||
      key === "maxPriorityFeePerGas" ||
      key === "nonce" ||
      key === "value"
    ) {
      normalized[key === "gasLimit" ? "gas" : key] =
        normalizeTransactionNumericField(nestedValue) ?? nestedValue;
      continue;
    }

    normalized[key] = nestedValue;
  }

  if (!Object.hasOwn(normalized, "gas") && options.fallbackGas) {
    normalized.gas = normalizeTransactionNumericField(options.fallbackGas);
  }

  return normalized;
}

async function sendWalletTransaction(
  provider: WalletRpcProvider,
  transactionRequest: Record<string, unknown>,
) {
  const txHash = normalizeTxHash(
    await provider.request({
      method: "eth_sendTransaction",
      params: [transactionRequest],
    }),
  );

  if (!txHash) {
    throw new Error("Wallet did not return a transaction hash.");
  }

  return txHash;
}

async function waitForWalletReceipt(
  provider: WalletRpcProvider,
  txHash: string,
  {
    timeoutMs = 45_000,
    intervalMs = 1_500,
  }: {
    timeoutMs?: number;
    intervalMs?: number;
  } = {},
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });

    if (receipt && typeof receipt === "object") {
      return receipt as Record<string, unknown>;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

function getWalletTransactionApproval(
  leg: ApiExecutionLeg,
): (ApiExecutionApproval & { transactionRequest?: Record<string, unknown> }) | null {
  if (leg.approval?.approvalType !== "wallet_transaction") {
    return null;
  }

  return leg.approval;
}

function getLifiTransactionRequest(
  leg: ApiExecutionLeg,
): Record<string, unknown> | null {
  return leg.quote?.kind === "lifi_quote" &&
    leg.quote.transactionRequest &&
    typeof leg.quote.transactionRequest === "object"
    ? ((leg.quote as ApiLifiQuote).transactionRequest as Record<string, unknown>)
    : null;
}

function getEnsoBundleQuote(leg: ApiExecutionLeg): ApiEnsoBundleQuote | null {
  return leg.quote?.kind === "enso_bundle"
    ? (leg.quote as ApiEnsoBundleQuote)
    : null;
}

export function getExecutionSignatureInputs(
  executionRequest: ApiExecutionRequest | null,
): SignatureInput[] {
  if (!executionRequest) {
    return [];
  }

  return getAwaitingApprovalLegs(executionRequest)
    .map((leg) => {
      const typedData = typedDataForLeg(leg);
      const domain =
        typedData && typeof typedData.domain === "object"
          ? (typedData.domain as Record<string, unknown>)
          : null;

      return {
        legId: leg.legId,
        assetSymbol: leg.assetSymbol ?? leg.sleeve,
        signerAddress: leg.approval?.signerAddress ?? null,
        quoteId: quoteIdForLeg(leg),
        orderHash: orderHashForLeg(leg),
        primaryType:
          typedData && typeof typedData.primaryType === "string"
            ? typedData.primaryType
            : null,
        domainName:
          domain && typeof domain.name === "string" ? domain.name : null,
      };
    })
    .filter((input) => input.signerAddress || input.quoteId || input.orderHash);
}

async function ensureActivation(
  args: ManualExecutionFlowArgs,
) : Promise<ApiActivationView> {
  const shouldCreateActivation =
    !args.latestActivation ||
    args.latestActivation.requestedNotionalUsd !== args.requestedNotionalUsd ||
    args.latestActivation.status !== "ready";

  if (!shouldCreateActivation && args.latestActivation) {
    return args.latestActivation;
  }

  args.onStatus?.({
    tone: "neutral",
    message: "Persisting activation truth with the current hosted wallet boundary.",
  });

  const savedActivation = await postActivationSave(
    args.manifest,
    args.requestedNotionalUsd,
    args.walletState,
    args.auth,
  );

  if (!savedActivation.ok) {
    throw new Error(savedActivation.error);
  }

  args.onActivation?.(savedActivation.activation);
  return savedActivation.activation;
}

async function ensureExecutionRequest(
  activation: ApiActivationView,
  args: ManualExecutionFlowArgs,
) {
  const requestedPortfolioAdapterId =
    typeof args.portfolioExecutionAdapterId === "string" &&
    args.portfolioExecutionAdapterId.trim().length > 0
      ? args.portfolioExecutionAdapterId.trim()
      : null;
  const expectedExecutionAdapterId =
    requestedPortfolioAdapterId ?? ACTIVE_PORTFOLIO_EXECUTION_ADAPTER_ID;
  const reusableExecutionRequest =
    args.existingExecutionRequest &&
    args.existingExecutionRequest.activationId === activation.activationId &&
    (args.initiationAction !== "create" ||
      args.existingExecutionRequest.adapterId ===
        expectedExecutionAdapterId) &&
    args.existingExecutionRequest.state !== "confirmed" &&
    args.existingExecutionRequest.state !== "failed"
      ? args.existingExecutionRequest
      : null;

  if (reusableExecutionRequest) {
    return reusableExecutionRequest;
  }

  args.onStatus?.({
    tone: "neutral",
    message:
      args.initiationAction === "execute_all"
        ? "Staging the authenticated execute_all handoff."
        : "Creating the wallet-first 1inch execution request.",
  });

  const executionWrite = await postExecutionAction(
    {
      action: args.initiationAction,
      activationId: activation.activationId,
      ...(args.initiationAction === "create"
        ? requestedPortfolioAdapterId
          ? { executionAdapterId: requestedPortfolioAdapterId }
          : { executionRouteId: ACTIVE_PORTFOLIO_EXECUTION_ROUTE_ID }
        : {}),
      ...(args.rebalanceId ? { rebalanceId: args.rebalanceId } : {}),
    },
    args.auth,
  );

  if (!executionWrite.data?.executionRequest) {
    throw new Error(
      toStatusErrorMessage(
        "Execution request could not be created on the hosted manual lane.",
        executionWrite,
      ),
    );
  }

  const executionRequest = await readExecutionRequest(
    executionWrite.data.executionRequest.executionRequestId,
    args.auth,
  );

  if (!executionRequest) {
    throw new Error("Execution request was created but could not be reloaded.");
  }

  args.onExecutionRequest?.(executionRequest);
  return executionRequest;
}

async function quoteExecutionRequest(
  activation: ApiActivationView,
  executionRequest: ApiExecutionRequest,
  args: ManualExecutionFlowArgs,
) {
  if (isPortfolioQuoteAdapter(executionRequest.adapterId)) {
    args.onStatus?.({
      tone: "neutral",
      message:
        executionRequest.adapterId === "enso_bundle"
          ? "Preparing the Enso portfolio bundle."
          : "Preparing the portfolio execution request.",
    });

    const quoteResponse = await postExecutionAction(
      {
        action: "quote_portfolio",
        executionRequestId: executionRequest.executionRequestId,
      },
      args.auth,
    );

    if (!quoteResponse.data?.executionRequest) {
      const blocker = toStatusErrorMessage(
        executionRequest.adapterId === "enso_bundle"
          ? "Enso portfolio bundle quote failed."
          : "Portfolio quote request failed.",
        quoteResponse,
      );

      args.onStatus?.({
        tone: "warning",
        message: blocker,
      });

      return {
        executionRequest,
        blocker,
      };
    }

    const nextRequest = quoteResponse.data.executionRequest as ApiExecutionRequest;
    args.onExecutionRequest?.(nextRequest);

    return {
      executionRequest: nextRequest,
      blocker: null,
    };
  }

  let nextRequest = executionRequest;
  const quotableLegs = getQuotableLegs(nextRequest);

  for (const leg of quotableLegs) {
    args.onStatus?.({
      tone: "neutral",
      message: `Requesting live ${leg.assetSymbol ?? leg.sleeve} quote.`,
    });

    const quoteResponse = await postExecutionAction(
      {
        action: "quote_leg",
        executionRequestId: nextRequest.executionRequestId,
        legId: leg.legId,
      },
      args.auth,
    );

    if (!quoteResponse.data?.executionRequest) {
      const blocker = toStatusErrorMessage(
        `Quote request failed for ${leg.assetSymbol ?? leg.sleeve}.`,
        quoteResponse,
      );

      args.onStatus?.({
        tone: "warning",
        message: blocker,
      });

      return {
        executionRequest: nextRequest,
        blocker,
      };
    }

    nextRequest = quoteResponse.data.executionRequest as ApiExecutionRequest;
    args.onExecutionRequest?.(nextRequest);
  }

  return {
    executionRequest: nextRequest,
    blocker: null,
  };
}

async function executeLifiPortfolioFlow(
  approvalLegs: ApiExecutionLeg[],
  executionRequest: ApiExecutionRequest,
  args: ManualExecutionFlowArgs,
) {
  let nextRequest = executionRequest;

  for (const leg of approvalLegs) {
    const approval = getWalletTransactionApproval(leg);
    const signerAddress =
      approval?.signerAddress ??
      nextRequest.manualSignerAddress ??
      args.walletState.walletAddress;
    const signerWallet = pickSignerWallet(
      signerAddress,
      args.wallets,
      args.activeWallet,
    );

    if (!signerWallet || typeof signerWallet.getEthereumProvider !== "function") {
      return {
        executionRequest: nextRequest,
        blocker:
          "Privy did not expose the required signer wallet for the LI.FI route.",
      };
    }

    const provider = await signerWallet.getEthereumProvider();

    if (approval?.transactionRequest) {
      args.onStatus?.({
        tone: "neutral",
        message: `Awaiting wallet approval for ${leg.assetSymbol ?? leg.sleeve}.`,
      });

      const approvalTxHash = await sendWalletTransaction(
        provider,
        normalizeWalletTransactionRequest(approval.transactionRequest, {
          fallbackFrom: signerAddress,
        }),
      );
      const approvalReceipt = await waitForWalletReceipt(provider, approvalTxHash);

      if (!approvalReceipt) {
        return {
          executionRequest: nextRequest,
          blocker:
            "The LI.FI approval transaction is still pending confirmation. Retry after it confirms.",
        };
      }
    }

    const mainTransaction = getLifiTransactionRequest(leg);

    if (!mainTransaction) {
      return {
        executionRequest: nextRequest,
        blocker: `LI.FI did not return a wallet transaction for ${leg.assetSymbol ?? leg.sleeve}.`,
      };
    }

    args.onStatus?.({
      tone: "neutral",
      message: `Sending LI.FI transaction for ${leg.assetSymbol ?? leg.sleeve}.`,
    });

    const txHash = await sendWalletTransaction(
      provider,
      normalizeWalletTransactionRequest(mainTransaction, {
        fallbackFrom: signerAddress,
      }),
    );
    await waitForWalletReceipt(provider, txHash);

    const receiptResponse = await postExecutionAction(
      {
        action: "poll_receipt",
        executionRequestId: nextRequest.executionRequestId,
        legId: leg.legId,
        txHash,
      },
      args.auth,
    );

    if (!receiptResponse.data?.executionRequest) {
      return {
        executionRequest: nextRequest,
        blocker: toStatusErrorMessage(
          `Failed to persist the LI.FI transaction receipt for ${leg.assetSymbol ?? leg.sleeve}.`,
          receiptResponse,
        ),
      };
    }

    nextRequest = receiptResponse.data.executionRequest as ApiExecutionRequest;
    args.onExecutionRequest?.(nextRequest);
  }

  return {
    executionRequest: nextRequest,
    blocker: null,
  };
}

async function executeEnsoBundleFlow(
  approvalLegs: ApiExecutionLeg[],
  executionRequest: ApiExecutionRequest,
  args: ManualExecutionFlowArgs,
) {
  const primaryLeg = approvalLegs.find((leg) => getEnsoBundleQuote(leg)) ?? approvalLegs[0];
  const bundleQuote = primaryLeg ? getEnsoBundleQuote(primaryLeg) : null;
  const approval = primaryLeg ? getWalletTransactionApproval(primaryLeg) : null;
  const signerAddress =
    approval?.signerAddress ??
    executionRequest.manualSignerAddress ??
    args.walletState.walletAddress;
  const signerWallet = pickSignerWallet(
    signerAddress,
    args.wallets,
    args.activeWallet,
  );

  if (!primaryLeg || !bundleQuote || !signerWallet || typeof signerWallet.getEthereumProvider !== "function") {
    return {
      executionRequest,
      blocker:
        "The Enso bundle payload or signer wallet is not available on this surface.",
    };
  }

  const provider = await signerWallet.getEthereumProvider();

  if (approval?.transactionRequest) {
    args.onStatus?.({
      tone: "neutral",
      message: "Awaiting wallet approval for the starting USDC before the Enso bundle can be sent.",
    });

    const approvalTxHash = await sendWalletTransaction(
      provider,
      normalizeWalletTransactionRequest(approval.transactionRequest, {
        fallbackFrom: signerAddress,
      }),
    );
    const approvalReceipt = await waitForWalletReceipt(provider, approvalTxHash);

    if (!approvalReceipt) {
      return {
        executionRequest,
        blocker:
          "The Enso approval transaction is still pending confirmation. Retry after it confirms.",
      };
    }
  }

  args.onStatus?.({
    tone: "neutral",
    message: "Sending the selected Enso bundle transaction.",
  });

  const bundleTxHash = await sendWalletTransaction(
    provider,
    normalizeWalletTransactionRequest(bundleQuote.tx, {
      fallbackFrom: signerAddress,
      fallbackGas: bundleQuote.gas,
    }),
  );
  await waitForWalletReceipt(provider, bundleTxHash);

  let nextRequest = executionRequest;

  for (const leg of approvalLegs) {
    const receiptResponse = await postExecutionAction(
      {
        action: "poll_receipt",
        executionRequestId: nextRequest.executionRequestId,
        legId: leg.legId,
        txHash: bundleTxHash,
      },
      args.auth,
    );

    if (!receiptResponse.data?.executionRequest) {
      return {
        executionRequest: nextRequest,
        blocker: toStatusErrorMessage(
          "Failed to persist the Enso bundle receipt on all portfolio legs.",
          receiptResponse,
        ),
      };
    }

    nextRequest = receiptResponse.data.executionRequest as ApiExecutionRequest;
    args.onExecutionRequest?.(nextRequest);
  }

  return {
    executionRequest: nextRequest,
    blocker: null,
  };
}

export async function runManualExecutionFlow(
  args: ManualExecutionFlowArgs,
): Promise<ManualExecutionFlowResult> {
  if (!args.walletState.connected || !args.walletState.walletAddress) {
    return {
      activation: args.latestActivation,
      executionRequest: args.existingExecutionRequest,
      blocker: "Connect wallet with Privy before the hosted execution flow can continue.",
    };
  }

  try {
    const activation = await ensureActivation(args);
    let executionRequest = await ensureExecutionRequest(activation, args);
    const quoteResult = await quoteExecutionRequest(
      activation,
      executionRequest,
      args,
    );

    executionRequest = quoteResult.executionRequest;

    if (quoteResult.blocker) {
      return {
        activation,
        executionRequest,
        blocker: quoteResult.blocker,
      };
    }

    const approvalLegs = getAwaitingApprovalLegs(executionRequest);

    if (approvalLegs.length === 0) {
      const blocker = getCurrentBlocker(executionRequest);

      if (blocker) {
        args.onStatus?.({
          tone: "warning",
          message: blocker,
        });
      } else {
        args.onStatus?.({
          tone: "positive",
          message: "Hosted execution request is already up to date on this surface.",
        });
      }

      emitRefresh(args.manifest.slot_id);

      return {
        activation,
        executionRequest,
        blocker,
      };
    }

    if (approvalLegs.some((leg) => leg.quote?.kind === "lifi_quote")) {
      const lifiResult = await executeLifiPortfolioFlow(
        approvalLegs,
        executionRequest,
        args,
      );

      executionRequest = lifiResult.executionRequest;

      if (lifiResult.blocker) {
        args.onStatus?.({
          tone: "warning",
          message: lifiResult.blocker,
        });

        return {
          activation,
          executionRequest,
          blocker: lifiResult.blocker,
        };
      }
    } else if (approvalLegs.some((leg) => leg.quote?.kind === "enso_bundle")) {
      args.onStatus?.({
        tone: "neutral",
        message: "Enso returned the portfolio bundle. Preparing wallet approval and transaction submission.",
      });

      const ensoResult = await executeEnsoBundleFlow(
        approvalLegs,
        executionRequest,
        args,
      );

      executionRequest = ensoResult.executionRequest;

      if (ensoResult.blocker) {
        args.onStatus?.({
          tone: "warning",
          message: ensoResult.blocker,
        });

        return {
          activation,
          executionRequest,
          blocker: ensoResult.blocker,
        };
      }
    } else {

      for (const leg of approvalLegs) {
        const approvalTarget = leg.approval?.approvalTarget ?? null;
        const signerAddress = leg.approval?.signerAddress ?? null;
        const typedData = typedDataForLeg(leg);

        if (approvalTarget !== "oneinch_fusion_order" || !typedData || !signerAddress) {
          const blocker =
            approvalTarget === "cow_order"
              ? "This hosted browser helper remains pinned to wallet-first 1inch Fusion typed-data signing. CoW manual signing is not advanced in XSL-005."
              : "The current venue approval payload is not signable on this hosted helper.";

          args.onStatus?.({
            tone: "warning",
            message: blocker,
          });

          return {
            activation,
            executionRequest,
            blocker,
          };
        }

        const signerWallet = pickSignerWallet(signerAddress, args.wallets, args.activeWallet);

        if (!signerWallet) {
          const blocker =
            "Privy did not expose the required signer wallet for this 1inch Fusion order.";

          args.onStatus?.({
            tone: "warning",
            message: blocker,
          });

          return {
            activation,
            executionRequest,
            blocker,
          };
        }

        args.onStatus?.({
          tone: "neutral",
          message: `Awaiting wallet-first 1inch signature for ${leg.assetSymbol ?? leg.sleeve}.`,
        });

        let signature: string;

        try {
          signature = await signTypedData(signerWallet, signerAddress, typedData);
        } catch (error) {
          const blocker =
            error instanceof Error
              ? error.message
              : "Wallet signing failed for the 1inch Fusion order.";

          args.onStatus?.({
            tone: "warning",
            message: blocker,
          });

          return {
            activation,
            executionRequest,
            blocker,
          };
        }

        const submissionResponse = await postExecutionAction(
          {
            action: "record_submission",
            executionRequestId: executionRequest.executionRequestId,
            legId: leg.legId,
            signature,
          },
          args.auth,
        );

        if (!submissionResponse.data?.executionRequest) {
          const blocker = toStatusErrorMessage(
            `Submission failed for ${leg.assetSymbol ?? leg.sleeve}.`,
            submissionResponse,
          );

          args.onStatus?.({
            tone: "warning",
            message: blocker,
          });

          return {
            activation,
            executionRequest,
            blocker,
          };
        }

        executionRequest = submissionResponse.data.executionRequest as ApiExecutionRequest;
        args.onExecutionRequest?.(executionRequest);
      }
    }

    const finalBlocker = getCurrentBlocker(executionRequest);

    args.onStatus?.({
      tone: finalBlocker ? "warning" : "positive",
      message:
        finalBlocker ??
        "Wallet-first venue submission recorded. Receipt truth will continue to refresh from the backend.",
    });

    emitRefresh(args.manifest.slot_id);

    return {
      activation,
      executionRequest,
      blocker: finalBlocker,
    };
  } catch (error) {
    const blocker =
      error instanceof Error ? error.message : "Hosted manual execution failed.";

    args.onStatus?.({
      tone: "warning",
      message: blocker,
    });

    return {
      activation: args.latestActivation,
      executionRequest: args.existingExecutionRequest,
      blocker,
    };
  }
}
