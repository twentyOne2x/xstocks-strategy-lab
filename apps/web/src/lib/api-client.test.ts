import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CLIENT_API_TIMEOUT_MS,
  fetchActivationPreview,
  getApiFetchTimeoutMs,
  resolveApiBase,
  SERVER_API_TIMEOUT_MS,
} from "./api-client";

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

  it("uses NEXT_PUBLIC_SITE_URL in production when the API URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://24-7.markets/");
    expect(resolveApiBase()).toBe("https://24-7.markets");
  });

  it("uses VERCEL_URL in production when no explicit public URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_URL", "xstocks-strategy-lab.vercel.app");
    expect(resolveApiBase()).toBe("https://xstocks-strategy-lab.vercel.app");
  });

  it("uses the browser origin in production when running client-side", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", {
      location: {
        origin: "https://24-7.markets",
      },
    });
    expect(resolveApiBase()).toBe("https://24-7.markets");
  });

  it("throws in production when no deployment origin can be derived", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => resolveApiBase()).toThrow("API base URL is not set");
  });

  it("uses the longer timeout for server-side API fetches", () => {
    expect(getApiFetchTimeoutMs()).toBe(SERVER_API_TIMEOUT_MS);
  });

  it("uses the shorter timeout for client-side API fetches", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://24-7.markets",
      },
    });
    expect(getApiFetchTimeoutMs()).toBe(CLIENT_API_TIMEOUT_MS);
  });

  it("serializes live wallet state into activation preview requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NODE_ENV", "test");
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(new AbortController().signal);
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
    expect(timeoutSpy).toHaveBeenCalledWith(SERVER_API_TIMEOUT_MS);
  });
});
