import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  REPO_ROOT,
  createQualificationService,
  listQualificationFixtures,
  loadQualificationFixture,
  summarizeQualificationResult,
} from "./lib/qualification-runtime.mjs";

function readFlagValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function defaultOutputDir() {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return resolve(REPO_ROOT, "tmp/qualification-proofs", stamp);
}

function verifyFixtureResult(fixture, qualification) {
  const expected = fixture.expected ?? {};

  assert.equal(
    qualification.selection.slotId,
    expected.slotId,
    `${fixture.scenarioId}: unexpected slot`,
  );
  assert.equal(
    qualification.selection.mode,
    expected.mode,
    `${fixture.scenarioId}: unexpected mode`,
  );
  assert.equal(
    qualification.activationTruth.executionState,
    expected.executionState,
    `${fixture.scenarioId}: unexpected executionState`,
  );
  assert.equal(
    qualification.activationTruth.directionalPreviewOnly,
    expected.directionalPreviewOnly,
    `${fixture.scenarioId}: unexpected directional preview truth`,
  );
  assert.equal(
    qualification.activationTruth.activationReady,
    expected.activationReady,
    `${fixture.scenarioId}: unexpected activation readiness`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const requestedFixture = readFlagValue(args, "--fixture");
  const outputDir = readFlagValue(args, "--output-dir") ?? defaultOutputDir();
  const useLiveState = hasFlag(args, "--live");
  const fixtures = requestedFixture
    ? [requestedFixture]
    : await listQualificationFixtures();
  const service = createQualificationService({ useLiveState });

  await mkdir(outputDir, { recursive: true });

  const summary = [];

  for (const fixtureName of fixtures) {
    const fixture = await loadQualificationFixture(fixtureName);
    const result = await service.qualify(fixture);
    const qualification = result.qualification;

    verifyFixtureResult(fixture, qualification);

    const output = {
      fixture,
      result,
      summary: summarizeQualificationResult(result),
    };
    summary.push({
      scenarioId: fixture.scenarioId,
      label: fixture.label,
      selectedSlotId: qualification.selection.slotId,
      selectedMode: qualification.selection.mode,
      recommendationId: qualification.recommendation.recommendationId,
      manifestId: qualification.manifestId,
      explanationSurface: qualification.explanationSurface.surfaceId,
      executionState: qualification.activationTruth.executionState,
      activationReady: qualification.activationTruth.activationReady,
      directionalPreviewOnly: qualification.activationTruth.directionalPreviewOnly,
    });

    await writeFile(
      resolve(outputDir, `${fixture.scenarioId}.json`),
      `${JSON.stringify(output, null, 2)}\n`,
      "utf8",
    );
  }

  await writeFile(
    resolve(outputDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  for (const entry of summary) {
    process.stdout.write(
      `${entry.scenarioId}: slot=${entry.selectedSlotId} mode=${entry.selectedMode} execution=${entry.executionState} recommendation=${entry.recommendationId} directionalPreviewOnly=${entry.directionalPreviewOnly}\n`,
    );
  }
  process.stdout.write(`proof_dir=${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exit(1);
});
