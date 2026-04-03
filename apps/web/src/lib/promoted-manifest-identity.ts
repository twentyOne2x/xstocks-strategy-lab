import type {
  PromotedManifest,
  PublicStrategyCardData,
} from "@/lib/contracts";

export const DEFAULT_STRATEGY_SLOT_ID = "onboarding.default_basket";

const THEME_TITLE_BY_ID: Record<string, string> = {
  "ai-infra": "AI Infra",
  "us-tech-leaders": "US Tech Leaders",
  "mag7-core": "Mag 7 Core",
  directional: "Directional",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function audienceForManifest(manifest: PromotedManifest): string {
  if (manifest.mode === "directional") {
    return "Directional users";
  }

  if (manifest.slot_id === "onboarding.default_basket") {
    return "Default onboarding basket";
  }

  if (manifest.slot_id === "onboarding.alt_basket_1") {
    return "Theme-led basket users";
  }

  if (manifest.slot_id === "onboarding.alt_basket_2") {
    return "Broader basket users";
  }

  return "Portfolio preview";
}

function convictionLabelForManifest(manifest: PromotedManifest): string {
  const currentBadge = manifest.frontend.badges.find((badge) => badge.tone === "current");
  if (currentBadge?.detail) {
    return currentBadge.detail;
  }

  if (currentBadge?.label) {
    return currentBadge.label;
  }

  return manifest.mode === "directional" ? "Directional preview" : "Promoted portfolio";
}

function themeTitleForManifest(manifest: PromotedManifest): string {
  return THEME_TITLE_BY_ID[manifest.theme_id] ?? manifest.frontend.title;
}

export function buildPromotedManifestSlug(
  slotId: string,
  strategyVersion: string,
): string {
  return `${slugify(slotId)}--${slugify(strategyVersion)}`;
}

export function resolveManifestSelector(
  manifests: PromotedManifest[],
  selector?: string | null,
): PromotedManifest | undefined {
  if (!selector) {
    return undefined;
  }

  const normalizedSelector = selector.trim();

  return (
    manifests.find(
      (manifest) =>
        manifest.slug === normalizedSelector ||
        manifest.slot_id === normalizedSelector,
    )
  );
}

export function buildPublicStrategyCard(
  manifest: PromotedManifest,
): PublicStrategyCardData {
  return {
    id: `strategy_${slugify(manifest.slot_id)}_${slugify(manifest.strategy_version)}`,
    slotId: manifest.slot_id,
    manifestSlug: manifest.slug,
    title: manifest.frontend.title,
    summary: manifest.frontend.summary,
    mode: manifest.mode,
    convictionLabel: convictionLabelForManifest(manifest),
    audience: audienceForManifest(manifest),
    riskLabel: manifest.frontend.risk_label,
    promotedAt: manifest.validation.promoted_at,
    themeTitle: themeTitleForManifest(manifest),
  };
}

export function buildPublicStrategiesFromManifests(
  manifests: PromotedManifest[],
): PublicStrategyCardData[] {
  return manifests.map((manifest) => buildPublicStrategyCard(manifest));
}
