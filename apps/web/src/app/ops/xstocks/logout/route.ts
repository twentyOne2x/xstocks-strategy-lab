import { NextResponse } from "next/server";

import {
  getXStocksOpsCookieName,
  getXStocksOpsCookieOptions,
} from "@/lib/xstocks-ops-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/ops/xstocks", request.url), 303);

  response.cookies.set({
    name: getXStocksOpsCookieName(),
    value: "",
    ...getXStocksOpsCookieOptions(),
    maxAge: 0,
  });

  return response;
}
