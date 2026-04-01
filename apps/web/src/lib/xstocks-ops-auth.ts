import { createHash, timingSafeEqual } from "node:crypto";

const XSTOCKS_OPS_COOKIE_NAME = "xstocks_ops_access";
const XSTOCKS_OPS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function tokensMatch(left: string | null, right: string | null) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getXStocksOpsCookieName() {
  return XSTOCKS_OPS_COOKIE_NAME;
}

export function getXStocksOpsCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/ops/xstocks",
    maxAge: XSTOCKS_OPS_COOKIE_MAX_AGE_SECONDS,
  };
}

export function getXStocksOpsAccessToken() {
  return (
    process.env.XSTOCKS_OPS_DASHBOARD_TOKEN ??
    process.env.XSTOCKS_REPORTING_TOKEN ??
    null
  );
}

export function getXStocksReportingToken() {
  return (
    process.env.XSTOCKS_REPORTING_TOKEN ??
    process.env.XSTOCKS_OPS_DASHBOARD_TOKEN ??
    null
  );
}

export function isXStocksOpsAccessConfigured() {
  return Boolean(getXStocksOpsAccessToken());
}

export function verifyXStocksOpsAccessToken(candidate: string | null | undefined) {
  const expectedToken = getXStocksOpsAccessToken();

  if (!expectedToken || !candidate) {
    return false;
  }

  return tokensMatch(candidate.trim(), expectedToken);
}

export function createXStocksOpsCookieValue() {
  const accessToken = getXStocksOpsAccessToken();

  if (!accessToken) {
    return null;
  }

  return hashToken(accessToken);
}

export function hasXStocksOpsCookieAccess(cookieValue: string | null | undefined) {
  const expectedCookieValue = createXStocksOpsCookieValue();

  if (!expectedCookieValue || !cookieValue) {
    return false;
  }

  return tokensMatch(cookieValue, expectedCookieValue);
}
