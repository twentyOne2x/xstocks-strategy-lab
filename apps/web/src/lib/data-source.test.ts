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
});
