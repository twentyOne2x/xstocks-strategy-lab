import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  adaptResearchPromotedManifest,
  compileQuestionnaireQualification,
  deriveAgentQualification,
} from "../src/index.js";
import { createStaticLiveStateRepository } from "../../../apps/api/src/repositories/static-live-state-repository.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const FIXTURE_DIR = resolve(REPO_ROOT, "scripts/fixtures/qualification");
const liveStateRepository = createStaticLiveStateRepository();

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadManifest(slotId) {
  const rawManifest = await loadJson(
    resolve(
      REPO_ROOT,
      `packages/research/manifests/promoted/${slotId}/current.json`,
    ),
  );

  return adaptResearchPromotedManifest(rawManifest);
}

const fixtureNames = [
  "broad-cautious",
  "theme-tilt",
  "active-leaders",
  "directional-opt-in",
  "skip-not-sure",
];

for (const fixtureName of fixtureNames) {
  test(`qualification compiler resolves ${fixtureName}`, async () => {
    const fixture = await loadJson(resolve(FIXTURE_DIR, `${fixtureName}.json`));
    const compiled = compileQuestionnaireQualification({
      question_answers: fixture.answers,
      submittedAt: "2026-04-01T12:00:00.000Z",
    });
    const selectedSlotId =
      compiled.normalizedOnboardingAnswers.selectedStarterSlotId ??
      compiled.slotPreview.mode_id;

    assert.equal(selectedSlotId, fixture.expected.slotId);

    const manifest = await loadManifest(selectedSlotId);
    const boundaryState = await liveStateRepository.loadBoundaryState({ manifest });
    const qualification = deriveAgentQualification({
      onboarding_answers: compiled.normalizedOnboardingAnswers,
      activation_manifest: manifest,
      live_xstocks_state: boundaryState.liveXStocksState,
      live_route_state: boundaryState.liveRouteState,
      user_notional_usd: manifest.walletRequirements.minFundingUsd,
      wallet_state: fixture.walletState,
    });

    assert.equal(qualification.selection.slotId, fixture.expected.slotId);
    assert.equal(qualification.selection.mode, fixture.expected.mode);
    assert.equal(
      qualification.normalizedAnswers.initialSelection.type,
      fixture.expected.selectionType,
    );
    assert.equal(
      qualification.normalizedAnswers.initialSelection.key,
      fixture.expected.selectionKey,
    );
    assert.equal(
      qualification.normalizedAnswers.selectedStarterSlotId,
      fixture.expected.slotId,
    );
    assert.equal(
      qualification.activationTruth.executionState,
      fixture.expected.executionState,
    );
    assert.equal(
      qualification.activationTruth.directionalPreviewOnly,
      fixture.expected.directionalPreviewOnly,
    );
    assert.equal(
      qualification.activationTruth.activationReady,
      fixture.expected.activationReady,
    );
    assert.equal(
      qualification.activationTruth.executionEligibility,
      fixture.expected.executionEligibility,
    );
    assert.equal(
      qualification.explanationSurface.surfaceId,
      "recommendation.explanationBundle",
    );
    assert.equal(
      qualification.explanationSurface.matchSummary.truthMode,
      "questionnaire_and_promoted_manifest_only",
    );
    assert.equal(
      qualification.explanationSurface.matchSummary.slotId,
      fixture.expected.slotId,
    );
    assert.equal(
      qualification.explanationSurface.researchTruth.promotedManifestId,
      qualification.manifestId,
    );
    assert.equal(
      qualification.explanationSurface.researchTruth.slotId,
      fixture.expected.slotId,
    );
    assert.equal(
      qualification.userProfile.activeSlotId,
      fixture.expected.slotId,
    );
    assert.equal(
      qualification.recommendation.recommendationId.startsWith("rec_"),
      true,
    );
    assert.equal(
      qualification.manifestId,
      qualification.recommendation.activationManifestRef.manifestId,
    );

    if (fixture.expected.mode === "basket") {
      assert.equal(
        qualification.explanationSurface.researchTruth.explanationSource,
        "promoted_research_bundle",
      );
      assert.equal(
        qualification.explanationSurface.researchExplanationBundle !== null,
        true,
      );
      assert.equal(
        qualification.explanationSurface.researchTruth.researchBackedSurfacesBlocked,
        false,
      );
    } else {
      assert.equal(
        qualification.explanationSurface.researchTruth.explanationSource,
        "canonical_promoted_manifest_only",
      );
      assert.equal(
        qualification.explanationSurface.researchExplanationBundle,
        null,
      );
      assert.equal(
        qualification.explanationSurface.researchTruth.researchBackedSurfacesBlocked,
        true,
      );
    }

    if (fixture.expected.starterBasketId) {
      assert.equal(
        qualification.normalizedAnswers.selectedStarterBasketId,
        fixture.expected.starterBasketId,
      );
      assert.equal(
        qualification.userProfile.starterBasketId,
        fixture.expected.starterBasketId,
      );
    }
  });
}
