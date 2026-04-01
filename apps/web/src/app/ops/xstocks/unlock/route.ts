import { NextResponse } from "next/server";

import {
  createXStocksOpsCookieValue,
  getXStocksOpsCookieName,
  getXStocksOpsCookieOptions,
  isXStocksOpsAccessConfigured,
  verifyXStocksOpsAccessToken,
} from "@/lib/xstocks-ops-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const redirectUrl = new URL("/ops/xstocks", request.url);
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();

  if (!isXStocksOpsAccessConfigured()) {
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!token) {
    redirectUrl.searchParams.set("error", "missing-token");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!verifyXStocksOpsAccessToken(token)) {
    redirectUrl.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const response = NextResponse.redirect(redirectUrl, 303);
  const cookieValue = createXStocksOpsCookieValue();

  if (!cookieValue) {
    return NextResponse.redirect(redirectUrl, 303);
  }

  response.cookies.set({
    name: getXStocksOpsCookieName(),
    value: cookieValue,
    ...getXStocksOpsCookieOptions(),
  });

  return response;
}
