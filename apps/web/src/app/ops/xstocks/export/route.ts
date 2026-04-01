import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getXStocksOpsCookieName,
  getXStocksReportingToken,
  hasXStocksOpsCookieAccess,
} from "@/lib/xstocks-ops-auth";
import { fetchXStocksOpsReport } from "@/lib/xstocks-ops-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(getXStocksOpsCookieName())?.value ?? null;

  if (!hasXStocksOpsCookieAccess(accessCookie)) {
    return NextResponse.json(
      {
        error: "Operator access is required.",
      },
      { status: 401 },
    );
  }

  const reportingToken = getXStocksReportingToken();

  if (!reportingToken) {
    return NextResponse.json(
      {
        error: "Reporting token is not configured.",
      },
      { status: 503 },
    );
  }

  const report = await fetchXStocksOpsReport({
    reportingToken,
    limit: 50,
  });

  return new NextResponse(`${JSON.stringify(report, null, 2)}\n`, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="xstocks-ops-report.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
