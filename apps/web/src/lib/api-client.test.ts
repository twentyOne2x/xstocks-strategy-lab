import { describe, expect, it, vi, afterEach } from "vitest";

import { resolveApiBase } from "./api-client";

describe("resolveApiBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
