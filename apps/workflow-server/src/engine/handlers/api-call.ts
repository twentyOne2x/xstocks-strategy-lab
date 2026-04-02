import type { HandlerResult } from "./_base.js";

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const url = String(config.url ?? "");
  const method = String(config.method ?? "GET").toUpperCase();

  if (!url) {
    return { output: { error: "No URL provided", statusCode: 0 } };
  }

  try {
    const headers: Record<string, string> = config.headers
      ? JSON.parse(String(config.headers))
      : {};

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const resp = await fetch(url, {
      method,
      headers,
      body: method !== "GET" && config.body ? String(config.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let body: unknown;
    const contentType = resp.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      body = await resp.json();
    } else {
      body = await resp.text();
    }

    return {
      output: { url, method, statusCode: resp.status, body },
    };
  } catch (err) {
    return {
      output: { url, method, statusCode: 0, error: String(err) },
    };
  }
}
