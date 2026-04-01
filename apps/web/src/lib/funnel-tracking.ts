"use client";

import { resolveApiBase } from "@/lib/api-client";

const SUBJECT_STORAGE_KEY = "xstocks.funnel.subject_id";

export type XStocksWebFunnelStage =
  | "landing_viewed"
  | "onboarding_started"
  | "activation_viewed"
  | "wallet_connected";

export interface XStocksQualificationReadData {
  qualification?: {
    selection?: {
      slotId?: string;
      mode?: string;
    };
    manifestRef?: {
      slotId?: string;
      mode?: string;
      manifestId?: string;
    };
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStoredSubjectId() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(SUBJECT_STORAGE_KEY);
}

function writeStoredSubjectId(subjectId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SUBJECT_STORAGE_KEY, subjectId);
}

function clearStoredSubjectId() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SUBJECT_STORAGE_KEY);
}

async function readErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload?.error ?? payload?.data?.error ?? `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
}

export async function trackXStocksFunnelStage({
  stage,
  manifestId,
  slotId,
  accessToken,
  identityToken,
}: {
  stage: XStocksWebFunnelStage;
  manifestId?: string;
  slotId?: string;
  accessToken?: string | null;
  identityToken?: string | null;
}) {
  const requestStage = async (subjectId: string | null) =>
    fetch(`${resolveApiBase()}/api/funnel-events/xstocks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(identityToken ? { "X-Privy-Identity-Token": identityToken } : {}),
      },
      body: JSON.stringify({
        stage,
        ...(subjectId ? { subjectId } : {}),
        ...(manifestId ? { manifestId } : {}),
        ...(slotId ? { slotId } : {}),
      }),
    });

  const storedSubjectId = readStoredSubjectId();
  let response = await requestStage(storedSubjectId);

  if (response.status === 409 && storedSubjectId) {
    clearStoredSubjectId();
    response = await requestStage(null);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await response.json();
  const nextSubjectId = payload?.data?.subjectId;

  if (typeof nextSubjectId === "string" && nextSubjectId.length > 0) {
    writeStoredSubjectId(nextSubjectId);
  }

  return payload?.data ?? null;
}

export async function recordXStocksQualification({
  questionAnswers,
}: {
  questionAnswers: Record<string, string>;
}): Promise<XStocksQualificationReadData | null> {
  let subjectId = readStoredSubjectId();

  if (!subjectId) {
    const subjectBootstrap = await trackXStocksFunnelStage({
      stage: "onboarding_started",
    });
    subjectId =
      typeof subjectBootstrap?.subjectId === "string"
        ? subjectBootstrap.subjectId
        : readStoredSubjectId();
  }

  if (!subjectId) {
    return null;
  }

  const requestQualification = async (trackedSubjectId: string) =>
    fetch(`${resolveApiBase()}/api/qualify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subjectId: trackedSubjectId,
        questionAnswers,
      }),
    });

  let response = await requestQualification(subjectId);

  if (response.status === 409) {
    clearStoredSubjectId();
    const subjectBootstrap = await trackXStocksFunnelStage({
      stage: "onboarding_started",
    });
    const nextSubjectId =
      typeof subjectBootstrap?.subjectId === "string"
        ? subjectBootstrap.subjectId
        : readStoredSubjectId();

    if (!nextSubjectId) {
      throw new Error(await readErrorMessage(response));
    }

    response = await requestQualification(nextSubjectId);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await response.json();
  return payload?.data ?? null;
}
