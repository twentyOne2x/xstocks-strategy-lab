import { describe, expect, it } from "vitest";

import { manifests as mockManifests } from "./mock-data";
import {
  buildPromotedManifestSlug,
  buildPublicStrategiesFromManifests,
  resolveManifestSelector,
} from "./promoted-manifest-identity";

describe("promoted manifest identity", () => {
  it("builds live route slugs from slot plus strategy version", () => {
    expect(
      buildPromotedManifestSlug(
        "onboarding.default_basket",
        "basket-starter-h6-p100-c5-cap18-a0-r300-v1",
      ),
    ).toBe(
      "onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1",
    );
  });

  it("resolves exact slugs or slot ids and drops deleted legacy showcase slugs", () => {
    const liveManifests = mockManifests.map((manifest, index) => ({
      ...manifest,
      strategy_version: `live-slot-${index + 1}`,
      slug: buildPromotedManifestSlug(manifest.slot_id, `live-slot-${index + 1}`),
    }));

    const currentDefaultManifest = liveManifests.find(
      (manifest) => manifest.slot_id === "onboarding.default_basket",
    );

    expect(currentDefaultManifest).toBeDefined();
    expect(
      resolveManifestSelector(liveManifests, "legacy-showcase-default-basket"),
    ).toBeUndefined();
    expect(
      resolveManifestSelector(liveManifests, currentDefaultManifest!.slug),
    ).toEqual(currentDefaultManifest);
    expect(
      resolveManifestSelector(liveManifests, currentDefaultManifest!.slot_id),
    ).toEqual(currentDefaultManifest);
  });

  it("builds public strategy cards from the live manifest identity instead of static mock slugs", () => {
    const liveManifests = mockManifests.map((manifest, index) => ({
      ...manifest,
      strategy_version: `live-slot-${index + 1}`,
      slug: buildPromotedManifestSlug(manifest.slot_id, `live-slot-${index + 1}`),
    }));

    const strategies = buildPublicStrategiesFromManifests(liveManifests);

    expect(
      strategies.map((strategy) => ({
        slotId: strategy.slotId,
        manifestSlug: strategy.manifestSlug,
      })),
    ).toEqual(
      liveManifests.map((manifest) => ({
        slotId: manifest.slot_id,
        manifestSlug: manifest.slug,
      })),
    );
  });
});
