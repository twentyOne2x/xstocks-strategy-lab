import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createStaticLiveStateRepository } from "../../apps/api/src/repositories/static-live-state-repository.js";
import { createApiRuntimeService } from "../../apps/api/src/server.js";
import { QUALIFICATION_QUESTION_CATALOG } from "../../packages/policy/src/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(CURRENT_DIR, "..", "..");
export const QUALIFICATION_FIXTURE_DIR = resolve(
  REPO_ROOT,
  "scripts/fixtures/qualification",
);
export { QUALIFICATION_QUESTION_CATALOG };
export const CANONICAL_QUALIFICATION_FIXTURE_NAMES = Object.freeze([
  "broad-cautious",
  "theme-tilt",
  "active-leaders",
  "directional-opt-in",
]);

export async function listQualificationFixtures() {
  const entries = new Set(await readdir(QUALIFICATION_FIXTURE_DIR));

  return CANONICAL_QUALIFICATION_FIXTURE_NAMES.filter((fixtureName) =>
    entries.has(`${fixtureName}.json`),
  );
}

export async function loadQualificationFixture(nameOrPath) {
  const fixturePath =
    nameOrPath.endsWith(".json") || nameOrPath.includes("/")
      ? resolve(REPO_ROOT, nameOrPath)
      : resolve(QUALIFICATION_FIXTURE_DIR, `${nameOrPath}.json`);
  const raw = await readFile(fixturePath, "utf8");

  return JSON.parse(raw);
}

export function createQualificationService({ useLiveState = false } = {}) {
  return createApiRuntimeService(
    useLiveState
      ? {}
      : {
          liveStateRepository: createStaticLiveStateRepository(),
        },
  );
}

export function summarizeQualificationResult(responsePayload) {
  const qualification =
    responsePayload?.qualification ?? responsePayload?.data?.qualification;

  if (!qualification) {
    throw new Error("Missing qualification payload.");
  }

  return {
    normalizedAnswers: qualification.normalizedAnswers,
    userProfile: qualification.userProfile,
    selectedSlotId: qualification.selection.slotId,
    selectedMode: qualification.selection.mode,
    recommendationId: qualification.recommendation.recommendationId,
    manifestRef: qualification.manifestRef,
    explanationSurface: qualification.explanationSurface.surfaceId,
    activationTruth: qualification.activationTruth,
    directionalPreviewOnly: qualification.activationTruth.directionalPreviewOnly,
  };
}
