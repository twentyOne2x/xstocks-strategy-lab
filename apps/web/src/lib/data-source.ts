import type {
  ActivationScreenProps,
  ActivityWorkspaceProps,
  BlotterData,
  ComparisonWorkspaceProps,
  DetailScreenProps,
  HomeTerminalProps,
  MethodologyBadge,
  PromotedManifest,
  PublicStrategyCardData,
  RebalanceState,
  ReplayPoint,
  RouteId,
  SmartAccountPanelData,
  TerminalChromeProps,
  WorkspaceSpotlightData,
} from "@/lib/contracts";
import {
  fetchActivationPreview,
  fetchActivity,
  fetchCatalog,
  fetchWorkspace,
} from "@/lib/api-client";
import {
  adaptActivityToBlotter,
  attachPreviewTruthToManifest,
  adaptLiveStateToStrip,
  adaptManifestToFrontend,
  describeRebalanceAutomationTruth,
  enrichAllocationsWithLiveState,
} from "@/lib/api-adapter";
import {
  blotter as mockBlotter,
  manifests as mockManifests,
  onboardingQuestions,
  publicStrategies as mockPublicStrategies,
  stateStrip as mockStateStrip,
  themes,
} from "@/lib/mock-data";
import {
  buildPublicStrategiesFromManifests,
  DEFAULT_STRATEGY_SLOT_ID,
  resolveManifestSelector,
} from "@/lib/promoted-manifest-identity";
import { buildManifestContractBundle, findManifestRebalance } from "@/lib/shared-contract-adapter";

/* ── Local manifest map (fallback) ── */

const mockManifestMap = new Map(mockManifests.map((m) => [m.slug, m]));
const emptyPublicBlotter: BlotterData = {
  positions: [],
  history: [],
  activity: [],
  rebalancing: [],
};

/* ── API-backed catalog fetch ── */

interface CatalogSnapshot {
  defaultSlotId: string;
  manifests: PromotedManifest[];
  publicStrategies: PublicStrategyCardData[];
}

async function fetchApiCatalogSnapshot(
  surface?: string,
): Promise<CatalogSnapshot | null> {
  try {
    const catalog = await fetchCatalog(surface);
    if (!catalog || catalog.items.length === 0) return null;

    const manifests = catalog.items.map((item) =>
      adaptManifestToFrontend(item.manifest, item.slot),
    );

    return {
      defaultSlotId: catalog.defaultSlotId,
      manifests,
      publicStrategies: buildPublicStrategiesFromManifests(manifests),
    };
  } catch {
    return null;
  }
}

/* ── Manifest getters (sync fallback, async preferred) ── */

export function getPromotedManifest(slug: string): PromotedManifest | undefined {
  return resolveManifestSelector(mockManifests, slug) ?? mockManifestMap.get(slug);
}

export function getFeaturedManifest(): PromotedManifest {
  const manifest = getPromotedManifest(DEFAULT_STRATEGY_SLOT_ID);
  if (!manifest) {
    throw new Error(
      `Featured manifest for slot "${DEFAULT_STRATEGY_SLOT_ID}" is missing.`,
    );
  }
  return manifest;
}

/* ── Formatting ── */

export function buildMethodologyBadges(manifest: PromotedManifest): MethodologyBadge[] {
  return [
    ...manifest.frontend.badges,
    { label: "Dataset", detail: manifest.validation.dataset_version, tone: "methodology" },
    { label: "Evaluator", detail: manifest.validation.evaluator_version, tone: "methodology" },
    { label: "Objective", detail: manifest.validation.objective_id, tone: "neutral" },
  ];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/* ── Replay points ── */

function buildReplayPointsFromManifest(manifest: PromotedManifest): ReplayPoint[] {
  if (manifest.replay.points && manifest.replay.points.length > 0) {
    return manifest.replay.points.map((point) => ({
      label: point.label,
      value: point.value,
    }));
  }

  const labels = ["Open", "W1", "W2", "W3", "W4", "W5", "W6", "Now"];
  const start = manifest.replay.startingCapital;
  const end = manifest.replay.endingCapital;

  return labels.map((label, index) => ({
    label,
    value:
      start +
      ((end - start) * index) / Math.max(labels.length - 1, 1),
  }));
}

export function getWorkspaceSpotlightData(
  manifest: PromotedManifest,
  blotter: BlotterData = mockBlotter,
): WorkspaceSpotlightData {
  const orchestration = manifest.preview?.rebalanceOrchestration ?? null;
  const apiBackedRebalance = orchestration
    ? {
        id: orchestration.rebalanceId,
        manifestSlug: manifest.slug,
        strategyTitle: manifest.frontend.title,
        window:
          orchestration.state === "rebalance_recommended"
            ? "Review recommended"
            : orchestration.state === "rebalance_deferred"
              ? "No review queued"
              : orchestration.state === "scheduled"
                ? "Scheduled review"
                : orchestration.state.replaceAll("_", " "),
        trigger: orchestration.summary,
        action: orchestration.nextAction?.detail ?? orchestration.rationale,
        route:
          orchestration.runtimeOwner === "worker_offchain_scheduler"
            ? "Scheduled check"
            : "You approve changes",
        impact: describeRebalanceAutomationTruth(orchestration),
        state: (
          orchestration.state === "blocked" || orchestration.state === "failed"
            ? "act"
            : orchestration.state === "rebalance_recommended" ||
                orchestration.state === "awaiting_operator"
              ? "consider"
              : orchestration.state === "scheduled" ||
                  orchestration.state === "rebalance_deferred" ||
                  orchestration.state === "paused" ||
                  orchestration.state === "executing" ||
                  orchestration.state === "rebalanced"
                ? "monitor"
                : "none"
        ) as RebalanceState,
      }
    : null;

  return {
    points: buildReplayPointsFromManifest(manifest),
    rebalance: apiBackedRebalance ?? findManifestRebalance(blotter, manifest.slug),
  };
}

/* ── Smart account (sync fallback) ── */

export function getSmartAccountPanelData(manifest: PromotedManifest): SmartAccountPanelData {
  const bundle = buildManifestContractBundle(manifest);
  const maxLeverage = bundle.activationPayload.permissions.maxLeverage;
  const orchestration = manifest.preview?.rebalanceOrchestration ?? null;
  const automationLabel = describeRebalanceAutomationTruth(orchestration);
  const buyingPower =
    manifest.market_intelligence.walletState.fundingLabel === "No fixed minimum in policy"
      ? "No fixed minimum"
      : manifest.market_intelligence.walletState.fundingLabel;

  return {
    readinessLabel: "Preview — deposit opens activation",
    readinessState: manifest.live_state.state === "view_ready" ? "view_ready"
      : manifest.live_state.state === "connect_required" ? "connect_required"
      : manifest.live_state.state === "funding_required" ? "funding_required"
      : "activation_ready",
    addressLabel: "Provision on wallet link",
    ownerLabel: "Preview until deposit",
    fundingAsset: bundle.activationPayload.fundingAssetSymbol,
    buyingPower,
    policyLabel: `${manifest.mode} preview with pause controls`,
    syncLabel: `Refreshed ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`,
    automationLabel,
    nextAction: orchestration?.nextAction?.title ?? "Review the preview before deposit.",
    accountSurfaces: [
      {
        label: "Manual signer",
        value: "Wallet-first",
        note: "Current manual approval stays on the linked or embedded wallet.",
      },
      {
        label: "Policy account",
        value: "Provision on wallet link",
        note: "Automation stays blocked until the smart account exists.",
      },
      {
        label: "Execution destination",
        value: "Manual signer until smart account",
        note: "Separate smart-account destination appears only once bootstrap is ready.",
      },
      {
        label: "Venue signing",
        value: "Wallet signer manual only",
        note: "AA-native CoW or 1inch signing is deferred.",
      },
      {
        label: "Automation readiness",
        value: "Smart account required",
        note: "Automation stays fail-closed without the verified smart account.",
      },
    ],
    actionLinks: [
      { label: "Open detail", href: `/workspace/detail/${manifest.slug}`, tone: "ghost" },
      {
        label: "Deposit to activate",
        href: `/activate/${manifest.slug}`,
        tone: manifest.live_state.state === "funding_required" || manifest.live_state.state === "activation_ready"
          ? "primary" : "secondary",
      },
    ],
    permissions: [
      {
        label: "Pause",
        value: bundle.activationPayload.permissions.canPause ? "Enabled" : "Review",
        note: manifest.live_state.pauseRule,
      },
      {
        label: "Turn off",
        value: bundle.activationPayload.permissions.canTurnOff ? "Enabled" : "Not exposed",
        note: manifest.activation_template.reversible ? "Reversible." : "Your review required.",
      },
      {
        label: "Slippage",
        value: `${bundle.activationPayload.permissions.maxSlippageBps} bps`,
        note: `Via ${manifest.live_state.routeSummary}`,
      },
      {
        label: "Exposure",
        value: maxLeverage ? `${maxLeverage.toFixed(2)}x max` : "Spot only",
        note: `Borrow: ${manifest.market_intelligence.vaultState.borrowAsset}`,
      },
    ],
  };
}

/* ── Async API-backed terminal chrome ── */

export async function getTerminalChromeAsync(
  currentRoute: RouteId,
  slugOrSlot = DEFAULT_STRATEGY_SLOT_ID,
  options: {
    allowMockFallback?: boolean;
    requireSelectorMatch?: boolean;
  } = {},
): Promise<TerminalChromeProps> {
  const allowMockFallback = options.allowMockFallback ?? true;
  const requireSelectorMatch = options.requireSelectorMatch ?? false;
  const catalogSnapshot = await fetchApiCatalogSnapshot();
  if (!catalogSnapshot && !allowMockFallback) {
    throw new Error("Catalog API is unavailable. The canonical preview path stayed fail-closed instead of falling back to local mock data.");
  }
  const allManifests = catalogSnapshot?.manifests ?? mockManifests;
  const selectorMatch = resolveManifestSelector(allManifests, slugOrSlot);

  if (requireSelectorMatch && slugOrSlot && !selectorMatch) {
    throw new Error(`No promoted manifest matched selector "${slugOrSlot}".`);
  }

  const selectedManifest = selectorMatch
    ?? resolveManifestSelector(
      allManifests,
      catalogSnapshot?.defaultSlotId ?? DEFAULT_STRATEGY_SLOT_ID,
    )
    ?? allManifests[0]
    ?? getFeaturedManifest();

  // Try to load workspace for live state enrichment
  const workspace = await fetchWorkspace(selectedManifest.slot_id);
  if (!workspace && !allowMockFallback) {
    throw new Error(`Workspace API is unavailable for ${selectedManifest.slot_id}. The canonical preview path did not fall back silently.`);
  }
  let enrichedManifest = selectedManifest;
  let manifestsForUi = allManifests;
  let stateStrip = mockStateStrip;
  let blotter: BlotterData = mockBlotter;

  if (workspace) {
    const workspaceManifest = adaptManifestToFrontend(
      workspace.manifest,
      workspace.slot,
    );
    enrichedManifest = enrichAllocationsWithLiveState(
      workspaceManifest,
      workspace.workspace.liveState,
    );
    enrichedManifest = attachPreviewTruthToManifest(enrichedManifest, {
      recommendation: workspace.workspace.recommendation,
      rebalanceOrchestration: workspace.workspace.rebalanceOrchestration,
      executionPreview: workspace.workspace.executionPlanPreview,
    });
    manifestsForUi = allManifests.map((manifest) =>
      manifest.slot_id === enrichedManifest.slot_id ? enrichedManifest : manifest,
    );
    // Build state strip from live state
    stateStrip = adaptLiveStateToStrip(workspace.workspace.liveState, manifestsForUi);
  }

  // Try to load activity for blotter
  const activityData = await fetchActivity(selectedManifest.slot_id);
  if (activityData) {
    if (activityData.rebalanceOrchestration) {
      enrichedManifest = attachPreviewTruthToManifest(enrichedManifest, {
        rebalanceOrchestration: activityData.rebalanceOrchestration,
      });
      manifestsForUi = manifestsForUi.map((manifest) =>
        manifest.slot_id === enrichedManifest.slot_id ? enrichedManifest : manifest,
      );
    }
    blotter = adaptActivityToBlotter(activityData, manifestsForUi);
  } else if (!allowMockFallback) {
    // Public comparison/detail flows must not depend on the authenticated
    // activity API or silently reuse stale mock history when that owner-only
    // surface is unavailable.
    blotter = emptyPublicBlotter;
  }

  return {
    currentRoute,
    stateStrip,
    themes,
    publicStrategies: buildPublicStrategiesFromManifests(manifestsForUi),
    promotedWinners: manifestsForUi,
    selectedManifest: enrichedManifest,
    blotter,
  };
}

/* ── Sync fallback (for non-async contexts) ── */

export function getTerminalChrome(
  currentRoute: RouteId,
  slugOrSlot = DEFAULT_STRATEGY_SLOT_ID,
): TerminalChromeProps {
  const selectedManifest = resolveManifestSelector(mockManifests, slugOrSlot)
    ?? getFeaturedManifest();
  return {
    currentRoute,
    stateStrip: mockStateStrip,
    themes,
    publicStrategies: mockPublicStrategies,
    promotedWinners: mockManifests,
    selectedManifest,
    blotter: mockBlotter,
  };
}

/* ── Async page data loaders ── */

export async function getHomeTerminalDataAsync(): Promise<{
  props: HomeTerminalProps;
  chrome: TerminalChromeProps;
  apiSourced: boolean;
}> {
  const chrome = await getTerminalChromeAsync("home");
  const apiSourced = chrome.stateStrip !== mockStateStrip;

  return {
    props: {
      featuredManifest: chrome.selectedManifest,
      highlightedTheme: themes[0],
      blotter: chrome.blotter,
      modeEntries: [
        {
          title: "xStocks basket portfolios",
          description: "Tokenized equity portfolios with rules-based rebalancing. Preview before deposit.",
          href: "/workspace/comparison",
          stats: [`${chrome.promotedWinners.length} portfolios`, "Preview until deposit"],
        },
        {
          title: "Directional xStocks preview",
          description: "Directional xStocks position with explicit funding and unwind controls. Preview-only.",
          href: `/workspace/detail/${chrome.promotedWinners.find((m) => m.mode === "directional")?.slug ?? "directional-preview"}`,
          stats: ["Preview-only", "Deposit gate explicit"],
        },
      ],
    },
    chrome,
    apiSourced,
  };
}

export async function getDetailScreenDataAsync(slug: string): Promise<{
  props: DetailScreenProps;
  chrome: TerminalChromeProps;
  apiSourced: boolean;
}> {
  const chrome = await getTerminalChromeAsync("detail", slug, {
    allowMockFallback: false,
    requireSelectorMatch: true,
  });
  return {
    props: { manifest: chrome.selectedManifest, blotter: chrome.blotter },
    chrome,
    apiSourced: chrome.stateStrip !== mockStateStrip,
  };
}

export async function getComparisonWorkspaceDataAsync(slug?: string): Promise<{
  props: ComparisonWorkspaceProps;
  chrome: TerminalChromeProps;
}> {
  const chrome = await getTerminalChromeAsync(
    "comparison",
    slug ?? DEFAULT_STRATEGY_SLOT_ID,
    { allowMockFallback: false },
  );
  return {
    props: { focusManifest: chrome.selectedManifest, blotter: chrome.blotter },
    chrome,
  };
}

export async function getActivationScreenDataAsync(slug: string): Promise<{
  props: ActivationScreenProps;
  chrome: TerminalChromeProps;
  executionPlan: unknown | null;
}> {
  const chrome = await getTerminalChromeAsync("activation", slug, {
    allowMockFallback: false,
    requireSelectorMatch: true,
  });
  const preview = await fetchActivationPreview(chrome.selectedManifest.slot_id);
  const manifest = preview
    ? attachPreviewTruthToManifest(
        enrichAllocationsWithLiveState(
          adaptManifestToFrontend(preview.manifest, preview.slot),
          preview.liveState,
        ),
        {
          recommendation: preview.recommendation,
          rebalanceOrchestration: preview.rebalanceOrchestration,
        },
      )
    : chrome.selectedManifest;
  const activationChrome = {
    ...chrome,
    selectedManifest: manifest,
  };
  return {
    props: { manifest },
    chrome: activationChrome,
    executionPlan: preview?.executionPlan ?? null,
  };
}

export async function getActivityWorkspaceDataAsync(slug?: string): Promise<{
  props: ActivityWorkspaceProps;
  chrome: TerminalChromeProps;
}> {
  const chrome = await getTerminalChromeAsync(
    "activity",
    slug ?? DEFAULT_STRATEGY_SLOT_ID,
    { allowMockFallback: false },
  );
  return {
    props: { manifest: chrome.selectedManifest, blotter: chrome.blotter },
    chrome,
  };
}

/* ── Sync page data loaders (retained for compatibility) ── */

export function getHomeTerminalData(): HomeTerminalProps {
  return {
    featuredManifest: getFeaturedManifest(),
    highlightedTheme: themes[0],
    blotter: mockBlotter,
    modeEntries: [
      {
        title: "xStocks basket portfolios",
        description: "Tokenized equity portfolios with rules-based rebalancing. Preview before deposit.",
        href: "/workspace/comparison",
        stats: ["4 portfolios", "Preview until deposit"],
      },
      {
        title: "Directional xStocks preview",
        description: "Directional xStocks position with explicit funding and unwind controls. Preview-only.",
        href: "/workspace/detail/mstr-conviction-long",
        stats: ["Preview-only", "Deposit gate explicit"],
      },
    ],
  };
}

export async function getOnboardingQuestionFlowDataAsync() {
  const catalogSnapshot = await fetchApiCatalogSnapshot("onboarding");

  if (!catalogSnapshot) {
    throw new Error(
      "Catalog API is unavailable for onboarding. The recommendation picker stayed fail-closed instead of reusing stale mock strategies.",
    );
  }

  return {
    questions: onboardingQuestions,
    recommendedStrategies: catalogSnapshot.publicStrategies,
  };
}

export function getOnboardingQuestionFlowData() {
  return { questions: onboardingQuestions, recommendedStrategies: mockPublicStrategies };
}

export function getComparisonWorkspaceData(
  slug = DEFAULT_STRATEGY_SLOT_ID,
): ComparisonWorkspaceProps {
  return { focusManifest: getPromotedManifest(slug) ?? getFeaturedManifest(), blotter: mockBlotter };
}

export function getDetailScreenData(slug: string): DetailScreenProps {
  const manifest = getPromotedManifest(slug);
  if (!manifest) throw new Error(`Manifest "${slug}" not found.`);
  return { manifest, blotter: mockBlotter };
}

export function getActivationScreenData(slug: string): ActivationScreenProps {
  const detail = getDetailScreenData(slug);
  return { manifest: detail.manifest };
}

export function getActivityWorkspaceData(
  slug = DEFAULT_STRATEGY_SLOT_ID,
): ActivityWorkspaceProps {
  return {
    manifest: getPromotedManifest(slug) ?? getFeaturedManifest(),
    blotter: mockBlotter,
  };
}
