import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  XStocksOpsAccessScreen,
  XStocksOpsDashboard,
} from "@/components/xstocks-ops-dashboard";
import {
  getXStocksOpsCookieName,
  getXStocksReportingToken,
  hasXStocksOpsCookieAccess,
  isXStocksOpsAccessConfigured,
} from "@/lib/xstocks-ops-auth";
import {
  buildXStocksOpsDashboardModel,
  fetchXStocksOpsReport,
} from "@/lib/xstocks-ops-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "xStocks Ops Dashboard",
  description: "Operator-safe funnel and execution truth for xstocks.",
  robots: {
    index: false,
    follow: false,
  },
};

function readErrorMessage(errorParam: string | string[] | undefined) {
  const normalized =
    typeof errorParam === "string"
      ? errorParam
      : Array.isArray(errorParam)
        ? errorParam[0]
        : null;

  switch (normalized) {
    case "invalid-token":
      return "The supplied ops token was not accepted.";
    case "missing-token":
      return "Enter the configured ops token to unlock the dashboard.";
    default:
      return null;
  }
}

export default async function XStocksOpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(getXStocksOpsCookieName())?.value ?? null;
  const hasAccess = hasXStocksOpsCookieAccess(accessCookie);
  const accessConfigured = isXStocksOpsAccessConfigured();

  if (!accessConfigured || !hasAccess) {
    return (
      <XStocksOpsAccessScreen
        configured={accessConfigured}
        title="Unlock xStocks Ops"
        detail="This route stays operator/internal first. Use the configured token to inspect funnel efficacy, blocker cohorts, and execution truth."
        error={readErrorMessage(params.error)}
      />
    );
  }

  const reportingToken = getXStocksReportingToken();

  if (!reportingToken) {
    return (
      <XStocksOpsAccessScreen
        configured={false}
        title="Reporting Token Missing"
        detail="The dashboard access gate is present, but the server-side reporting token needed to fetch `/api/reporting/xstocks` is not configured."
      />
    );
  }

  try {
    const report = await fetchXStocksOpsReport({
      reportingToken,
      limit: 25,
    });
    const model = buildXStocksOpsDashboardModel(report);

    return <XStocksOpsDashboard model={model} />;
  } catch (error) {
    return (
      <XStocksOpsAccessScreen
        configured={false}
        title="Reporting Route Unavailable"
        detail={
          error instanceof Error
            ? error.message
            : "The reporting API could not be read for this dashboard."
        }
      />
    );
  }
}
