"use client";

import { useEffect, useRef } from "react";

import { trackXStocksFunnelStage, type XStocksWebFunnelStage } from "@/lib/funnel-tracking";

export function XStocksFunnelStageTracker({
  stage,
  manifestId,
  slotId,
}: {
  stage: XStocksWebFunnelStage;
  manifestId?: string;
  slotId?: string;
}) {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;
    void trackXStocksFunnelStage({
      stage,
      manifestId,
      slotId,
    }).catch(() => {});
  }, [stage, manifestId, slotId]);

  return null;
}
