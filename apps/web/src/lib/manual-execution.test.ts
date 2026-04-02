import { afterEach, describe, expect, it, vi } from "vitest";

const { postExecutionActionMock, resolveApiBaseMock } = vi.hoisted(() => ({
  postExecutionActionMock: vi.fn(),
  resolveApiBaseMock: vi.fn(() => "https://api.example.com"),
}));

vi.mock("./api-client", async () => {
  const actual = await vi.importActual<typeof import("./api-client")>("./api-client");

  return {
    ...actual,
    postExecutionAction: postExecutionActionMock,
    resolveApiBase: resolveApiBaseMock,
  };
});

import { runManualExecutionFlow } from "./manual-execution";

const manifest = {
  manifest_id: "onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted",
} as const;

const walletState = {
  connected: true,
  walletAddress: "0x1111111111111111111111111111111111111111",
  embeddedWallet: {
    status: "ready",
    address: "0x2222222222222222222222222222222222222222",
  },
  smartAccount: {
    status: "ready",
    address: "0x3333333333333333333333333333333333333333",
  },
} as const;

const freshActivation = {
  activationId: "act_fresh",
  manifestId: manifest.manifest_id,
  slotId: "onboarding.default_basket",
  requestedNotionalUsd: 100,
  surfaceTruth: "live",
  status: "ready",
  createdAt: "2026-04-02T08:00:00.000Z",
  updatedAt: "2026-04-02T08:00:00.000Z",
};

function buildExecutionRequest(activationId: string) {
  return {
    executionRequestId: "execreq_1",
    activationId,
    state: "requested",
    blockers: [],
    warnings: [],
    legs: [],
  };
}

describe("runManualExecutionFlow activation reuse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    postExecutionActionMock.mockReset();
    resolveApiBaseMock.mockClear();
  });

  it("creates a fresh activation when the saved activation is not live and ready", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input === "https://api.example.com/api/activations") {
        return {
          ok: true,
          json: async () => ({
            data: {
              activation: freshActivation,
            },
          }),
        };
      }

      if (
        input ===
        "https://api.example.com/api/executions?executionRequestId=execreq_1&limit=1"
      ) {
        return {
          ok: true,
          json: async () => ({
            data: {
              items: [buildExecutionRequest(freshActivation.activationId)],
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch call: ${input}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    postExecutionActionMock.mockResolvedValue({
      data: {
        executionRequest: {
          executionRequestId: "execreq_1",
        },
      },
    });

    const result = await runManualExecutionFlow({
      manifest,
      requestedNotionalUsd: 100,
      initiationAction: "create",
      latestActivation: {
        ...freshActivation,
        activationId: "act_blocked",
        surfaceTruth: "preview",
        status: "blocked",
      },
      existingExecutionRequest: null,
      auth: {
        accessToken: "access-token",
      },
      wallets: [],
      activeWallet: null,
      walletState,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/activations",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(postExecutionActionMock).toHaveBeenCalledWith(
      {
        action: "create",
        activationId: "act_fresh",
        executionRouteId: "1inch.ethereum",
      },
      {
        accessToken: "access-token",
      },
    );
    expect(result.activation?.activationId).toBe("act_fresh");
    expect(result.blocker).toBeNull();
  });

  it("reuses a same-notional activation only when it is already live and ready", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (
        input ===
        "https://api.example.com/api/executions?executionRequestId=execreq_1&limit=1"
      ) {
        return {
          ok: true,
          json: async () => ({
            data: {
              items: [buildExecutionRequest("act_ready")],
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch call: ${input}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    postExecutionActionMock.mockResolvedValue({
      data: {
        executionRequest: {
          executionRequestId: "execreq_1",
        },
      },
    });

    const result = await runManualExecutionFlow({
      manifest,
      requestedNotionalUsd: 100,
      initiationAction: "create",
      latestActivation: {
        ...freshActivation,
        activationId: "act_ready",
      },
      existingExecutionRequest: null,
      auth: {
        accessToken: "access-token",
      },
      wallets: [],
      activeWallet: null,
      walletState,
    });

    expect(fetchMock).not.toHaveBeenCalledWith(
      "https://api.example.com/api/activations",
      expect.anything(),
    );
    expect(postExecutionActionMock).toHaveBeenCalledWith(
      {
        action: "create",
        activationId: "act_ready",
        executionRouteId: "1inch.ethereum",
      },
      {
        accessToken: "access-token",
      },
    );
    expect(result.activation?.activationId).toBe("act_ready");
    expect(result.blocker).toBeNull();
  });
});
