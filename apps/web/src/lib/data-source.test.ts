import { describe, expect, it } from "vitest";

import {
  buildMethodologyBadges,
  getDetailScreenData,
  getFeaturedManifest,
  getWorkspaceSpotlightData,
  getTerminalChrome,
} from "./data-source";

describe("data source", () => {
  it("derives methodology badges from the promoted manifest contract", () => {
    const manifest = getFeaturedManifest();
    const badges = buildMethodologyBadges(manifest);

    expect(badges.map((badge) => badge.label)).toEqual([
      "Current default",
      "Validated",
      "Replay ready",
      "Dataset",
      "Evaluator",
      "Objective",
    ]);
  });

  it("keeps the terminal chrome aligned to a promoted manifest", () => {
    const chrome = getTerminalChrome("detail", "mstr-conviction-long");

    expect(chrome.selectedManifest.slug).toBe("mstr-conviction-long");
    expect(chrome.selectedManifest.mode).toBe("directional");
    expect(chrome.promotedWinners).toHaveLength(4);
  });

  it("can resolve the selected manifest from a strategy slot instead of a fixed slug", () => {
    const chrome = getTerminalChrome("comparison", "onboarding.alt_basket_2");

    expect(chrome.selectedManifest.slot_id).toBe("onboarding.alt_basket_2");
    expect(chrome.selectedManifest.slug).toBe("spy-core-shield");
  });

  it("throws when a detail route requests a non-promoted view", () => {
    expect(() => getDetailScreenData("lab-only-view")).toThrow(
      /not found/,
    );
  });

  it("uses replay points carried on the manifest instead of a slug template", () => {
    const manifest = {
      ...getFeaturedManifest(),
      replay: {
        ...getFeaturedManifest().replay,
        points: [
          { label: "Open", value: 1000 },
          { label: "Now", value: 1450 },
        ],
      },
    };
    const spotlight = getWorkspaceSpotlightData(manifest);

    expect(spotlight.points).toEqual(manifest.replay.points);
  });

  it("prefers manifest replayCurve over legacy replay points when both exist", () => {
    const manifest = {
      ...getFeaturedManifest(),
      replay: {
        ...getFeaturedManifest().replay,
        replayCurve: [
          { label: "Open", value: 1000 },
          { label: "Now", value: 1525 },
        ],
        points: [
          { label: "Open", value: 1000 },
          { label: "Now", value: 1111 },
        ],
      },
    };

    const spotlight = getWorkspaceSpotlightData(manifest);

    expect(spotlight.points).toEqual(manifest.replay.replayCurve);
  });

  it("falls back to replay metrics instead of a flat 0% line when no curve is carried", () => {
    const manifest = {
      ...getFeaturedManifest(),
      replay: {
        ...getFeaturedManifest().replay,
        startingCapital: 1000,
        endingCapital: 1450,
        replayCurve: undefined,
        points: undefined,
      },
    };

    const spotlight = getWorkspaceSpotlightData(manifest);

    expect(spotlight.points[0]?.value).toBe(1000);
    expect(spotlight.points.at(-1)?.value).toBe(1450);
  });
});
