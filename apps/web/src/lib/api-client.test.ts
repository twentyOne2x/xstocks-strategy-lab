import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchActivationPreview, resolveApiBase } from "./api-client";

describe("resolveApiBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses NEXT_PUBLIC_API_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveApiBase()).toBe("https://api.example.com");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveApiBase()).toBe("http://localhost:3001");
  });

  it("falls back to localhost in test", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "test");
    expect(resolveApiBase()).toBe("http://localhost:3001");
  });

  it("throws in production without explicit URL", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => resolveApiBase()).toThrow("NEXT_PUBLIC_API_URL is not set");
  });

  it("serializes live wallet state into activation preview requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NODE_ENV", "test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { executionPlan: null } }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await fetchActivationPreview(
      "onboarding.default_basket",
      100,
      {
        connected: true,
        walletAddress: "0x1111111111111111111111111111111111111111",
        embeddedWallet: {
          status: "ready",
          address: "0x2222222222222222222222222222222222222222",
          providerId: "privy",
        },
        smartAccount: {
          status: "ready",
          address: "0x3333333333333333333333333333333333333333",
          providerId: "privy",
        },
      },
      {
        accessToken: "access-token",
        identityToken: "identity-token",
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    const url = new URL(requestUrl);

    expect(url.origin).toBe("https://api.example.com");
    expect(url.pathname).toBe("/api/activation-preview");
    expect(url.searchParams.get("slotId")).toBe("onboarding.default_basket");
    expect(url.searchParams.get("userNotionalUsd")).toBe("100");
    expect(url.searchParams.get("walletConnected")).toBe("true");
    expect(url.searchParams.get("walletAddress")).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(url.searchParams.get("embeddedWalletStatus")).toBe("ready");
    expect(url.searchParams.get("embeddedWalletAddress")).toBe(
      "0x2222222222222222222222222222222222222222",
    );
    expect(url.searchParams.get("smartAccountStatus")).toBe("ready");
    expect(url.searchParams.get("smartAccountAddress")).toBe(
      "0x3333333333333333333333333333333333333333",
    );
    expect(requestInit?.headers).toEqual({
      Authorization: "Bearer access-token",
      "X-Privy-Identity-Token": "identity-token",
    });
  });

  it("preserves the legacy auth-only activation preview call shape", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NODE_ENV", "test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { executionPlan: null } }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await fetchActivationPreview("onboarding.default_basket", 100, {
      accessToken: "access-token",
      identityToken: "identity-token",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    const url = new URL(requestUrl);

    expect(url.searchParams.get("walletConnected")).toBeNull();
    expect(requestInit?.headers).toEqual({
      Authorization: "Bearer access-token",
      "X-Privy-Identity-Token": "identity-token",
    });
  });
});
