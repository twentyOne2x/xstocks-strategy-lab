import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiExecutionRequest } from "@/lib/api-client";
import { runManualExecutionFlow } from "./manual-execution";

function createJsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  };
}

function createExecutionRequest({
  state = "requested",
  adapterId = "enso_bundle",
  legs,
}: {
  state?: string;
  adapterId?: string;
  legs: ApiExecutionRequest["legs"];
}): ApiExecutionRequest {
  return {
    version: "1",
    executionRequestId: "execreq_test",
    owner: {
      providerId: "privy",
      userId: "did:privy:test",
    },
    activationId: "activation_test",
    manifestId: "manifest_test",
    slotId: "onboarding.default_basket",
    chain: "ethereum",
    mode: "basket",
    runtimeOwner: "operator_manual",
    triggerSource: "operator_manual",
    adapterId,
    activationManifestRef: {
      manifestId: "manifest_test",
      slotId: "onboarding.default_basket",
      strategyVersion: "basket-test-v1",
      chain: "ethereum",
      mode: "basket",
    },
    requestedNotionalUsd: 100,
    fundingAssetSymbol: "USDC",
    manualSignerAddress: "0x1111111111111111111111111111111111111111",
    policyAccountAddress: null,
    executionDestinationAddress: "0x1111111111111111111111111111111111111111",
    manualSigningMode: "wallet_first",
    automationAccountMode: "smart_account_required",
    automationReadiness: "smart_account_required",
    venueSigningMode: "wallet_signer_manual_only",
    settlementAddress: "0x1111111111111111111111111111111111111111",
    state,
    blockers: [],
    warnings: [],
    legs,
    createdAt: "2026-04-02T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
  };
}

describe("runManualExecutionFlow", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("keeps hosted 1inch as the default public buy route", async () => {
    const createdRequest = createExecutionRequest({
      adapterId: "oneinch_fusion",
      legs: [],
    });
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            activation: {
              activationId: "activation_test",
              manifestId: "manifest_test",
              slotId: "onboarding.default_basket",
              requestedNotionalUsd: 100,
              surfaceTruth: "live",
              status: "ready",
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:00:00.000Z",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            action: "create",
            executionRequest: createdRequest,
            activityEvents: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            items: [createdRequest],
          },
        }),
      );
    global.fetch = fetchMock as typeof fetch;

    const statuses: string[] = [];
    await runManualExecutionFlow({
      manifest: {
        manifest_id: "manifest_test",
        slot_id: "onboarding.default_basket",
      } as never,
      requestedNotionalUsd: 100,
      initiationAction: "create",
      latestActivation: null,
      existingExecutionRequest: null,
      auth: {
        accessToken: "access_test",
        identityToken: "identity_test",
      },
      wallets: [],
      activeWallet: null,
      walletState: {
        connected: true,
        walletAddress: "0x1111111111111111111111111111111111111111",
        embeddedWallet: {
          status: "ready",
          address: "0x1111111111111111111111111111111111111111",
        },
        smartAccount: {
          status: "not-required",
          address: null,
        },
      },
      onStatus: (status) => {
        statuses.push(status.message);
      },
    });

    const createCallBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));

    expect(createCallBody.executionRouteId).toBe("1inch.ethereum");
    expect(createCallBody.executionAdapterId).toBeUndefined();
    expect(statuses).toContain("Creating the wallet-first 1inch execution request.");
  });

  it("executes the Enso bundle path when an Enso request already exists", async () => {
    const baseLeg = {
      legId: "activation_test:leg:1",
      sequence: 1,
      sleeve: "core_xstocks",
      assetSymbol: "NVDAx",
      venueId: "enso.ethereum",
      adapterId: "enso_bundle",
      requiredRouteId: "enso.ethereum",
      targetWeightPct: 100,
      targetNotionalUsd: 100,
      paymentAssetSymbol: "USDC",
      paymentTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      paymentTokenDecimals: 6,
      receivingTokenAddress: "0x9999000000000000000000000000000000000001",
      receivingTokenDecimals: 18,
      settlementAddress: "0x1111111111111111111111111111111111111111",
      state: "pending",
      blockers: [],
      warnings: [],
      quote: null,
      approval: null,
      venueStatus: null,
      receipt: null,
      trade: null,
      linkage: null,
    } as ApiExecutionRequest["legs"][number];
    const createdRequest = createExecutionRequest({
      legs: [baseLeg],
    });
    const quotedRequest = createExecutionRequest({
      legs: [
        {
          ...baseLeg,
          state: "awaiting_approval",
          quote: {
            kind: "enso_bundle",
            quoteId: "enso:bundle:test",
            quotedAt: "2026-04-02T00:00:00.000Z",
            chainId: 1,
            fromAddress: "0x1111111111111111111111111111111111111111",
            receiver: "0x1111111111111111111111111111111111111111",
            routingStrategy: "router",
            tx: {
              from: "0x1111111111111111111111111111111111111111",
              to: "0x7777777777777777777777777777777777777777",
              data: "0xdeadbeef",
              value: "0x0",
            },
            gas: "275000",
            priceImpact: 0.01,
            amountsOut: {
              "0x9999000000000000000000000000000000000001":
                "1000000000000000000",
            },
            route: [],
            bundle: [],
            selectedOutputTokenAddress:
              "0x9999000000000000000000000000000000000001",
            selectedOutputAmount: "1000000000000000000",
          },
          approval: {
            approvalType: "wallet_transaction",
            status: "awaiting_user",
            signerAddress: "0x1111111111111111111111111111111111111111",
            approvalTarget: "erc20_allowance",
            orderToSign: {},
            transactionRequest: {
              from: "0x1111111111111111111111111111111111111111",
              to: "0x6666666666666666666666666666666666666666",
              data: "0xapprove",
              value: "0x0",
            },
            signature: null,
            approvedAt: null,
            submittedAt: null,
            venueOrderId: null,
            notes: [],
          },
          venueStatus: {
            venueId: "enso.ethereum",
            venueOrderId: "enso:bundle:test",
            status: "quote_ready",
            settlementTxHash: null,
            lastCheckedAt: null,
            updatedAt: "2026-04-02T00:00:00.000Z",
            rawStatus: {
              provider: "enso",
            },
          },
        },
      ],
    });
    const confirmedRequest = createExecutionRequest({
      state: "confirmed",
      legs: [
        {
          ...quotedRequest.legs[0],
          state: "confirmed",
          approval: {
            ...quotedRequest.legs[0].approval!,
            status: "submitted",
            submittedAt: "2026-04-02T00:01:00.000Z",
          },
          receipt: {
            txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            submittedAt: "2026-04-02T00:01:00.000Z",
            lastCheckedAt: "2026-04-02T00:01:30.000Z",
            receiptStatus: "confirmed",
            confirmedAt: "2026-04-02T00:01:30.000Z",
            revertedAt: null,
            blockNumber: 123,
            transactionIndex: 0,
            rpcUrl: "https://ethereum-rpc.test",
            rawReceipt: {
              status: "0x1",
            },
          },
        },
      ],
    });

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            activation: {
              activationId: "activation_test",
              manifestId: "manifest_test",
              slotId: "onboarding.default_basket",
              requestedNotionalUsd: 100,
              surfaceTruth: "live",
              status: "ready",
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:00:00.000Z",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            action: "create",
            executionRequest: createdRequest,
            activityEvents: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            items: [createdRequest],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            action: "quote_portfolio",
            executionRequest: quotedRequest,
            activityEvents: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            action: "poll_receipt",
            executionRequest: confirmedRequest,
            activityEvents: [],
          },
        }),
      );
    global.fetch = fetchMock as typeof fetch;

    const providerRequest = vi
      .fn()
      .mockResolvedValueOnce(
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      )
      .mockResolvedValueOnce({
        status: "0x1",
      })
      .mockResolvedValueOnce(
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      )
      .mockResolvedValueOnce({
        status: "0x1",
      });

    const statuses: string[] = [];
    const result = await runManualExecutionFlow({
      manifest: {
        manifest_id: "manifest_test",
        slot_id: "onboarding.default_basket",
      } as never,
      requestedNotionalUsd: 100,
      initiationAction: "create",
      latestActivation: null,
      existingExecutionRequest: null,
      portfolioExecutionAdapterId: "enso_bundle",
      auth: {
        accessToken: "access_test",
        identityToken: "identity_test",
      },
      wallets: [
        {
          address: "0x1111111111111111111111111111111111111111",
          getEthereumProvider: async () => ({
            request: providerRequest,
          }),
        },
      ],
      activeWallet: {
        address: "0x1111111111111111111111111111111111111111",
        getEthereumProvider: async () => ({
          request: providerRequest,
        }),
      },
      walletState: {
        connected: true,
        walletAddress: "0x1111111111111111111111111111111111111111",
        embeddedWallet: {
          status: "ready",
          address: "0x1111111111111111111111111111111111111111",
        },
        smartAccount: {
          status: "not-required",
          address: null,
        },
      },
      onStatus: (status) => {
        statuses.push(status.message);
      },
    });

    const createCallBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    const quoteCallBody = JSON.parse(String(fetchMock.mock.calls[3][1]?.body));
    const receiptCallBody = JSON.parse(String(fetchMock.mock.calls[4][1]?.body));

    expect(result.blocker).toBeNull();
    expect(createCallBody.executionAdapterId).toBe("enso_bundle");
    expect(quoteCallBody.action).toBe("quote_portfolio");
    expect(receiptCallBody.txHash).toBe(
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
    expect(statuses).toContain("Preparing the Enso portfolio bundle.");
    expect(statuses).toContain(
      "Enso returned the portfolio bundle. Preparing wallet approval and transaction submission.",
    );
    expect(statuses).toContain(
      "Awaiting wallet approval for the starting USDC before the Enso bundle can be sent.",
    );
    expect(statuses).toContain("Sending the selected Enso bundle transaction.");
    expect(providerRequest).toHaveBeenCalledWith({
      method: "eth_sendTransaction",
      params: [
        expect.objectContaining({
          to: "0x6666666666666666666666666666666666666666",
        }),
      ],
    });
    expect(providerRequest).toHaveBeenCalledWith({
      method: "eth_sendTransaction",
      params: [
        expect.objectContaining({
          to: "0x7777777777777777777777777777777777777777",
        }),
      ],
    });
  });

  it("fails fast after activation save when the saved activation is already non-ready", async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(200, {
        data: {
          activation: {
            activationId: "activation_test",
            manifestId: "manifest_test",
            slotId: "onboarding.default_basket",
            requestedNotionalUsd: 100,
            surfaceTruth: "live",
            status: "funding_required",
            createdAt: "2026-04-02T00:00:00.000Z",
            updatedAt: "2026-04-02T00:00:00.000Z",
          },
          executionPlan: {
            executionState: "blocked",
            executionEligibility: "non_executable",
            blockers: ["Deposit USDC in your wallet before continuing."],
          },
        },
      }),
    );
    global.fetch = fetchMock as typeof fetch;

    const statuses: string[] = [];
    const activations: Array<{ status: string | null }> = [];
    const result = await runManualExecutionFlow({
      manifest: {
        manifest_id: "manifest_test",
        slot_id: "onboarding.default_basket",
      } as never,
      requestedNotionalUsd: 100,
      initiationAction: "create",
      latestActivation: null,
      existingExecutionRequest: null,
      auth: {
        accessToken: "access_test",
        identityToken: "identity_test",
      },
      wallets: [],
      activeWallet: null,
      walletState: {
        connected: true,
        walletAddress: "0x1111111111111111111111111111111111111111",
        embeddedWallet: {
          status: "ready",
          address: "0x1111111111111111111111111111111111111111",
        },
        smartAccount: {
          status: "not-required",
          address: null,
        },
      },
      onStatus: (status) => {
        statuses.push(status.message);
      },
      onActivation: (activation) => {
        activations.push({ status: activation?.status ?? null });
      },
    });

    expect(result.blocker).toBe("Deposit USDC in your wallet before continuing.");
    expect(result.executionRequest).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(activations).toEqual([{ status: "funding_required" }]);
    expect(statuses).toContain(
      "Persisting activation truth with the current hosted wallet boundary.",
    );
    expect(statuses.at(-1)).toBe("Deposit USDC in your wallet before continuing.");
  });
});
