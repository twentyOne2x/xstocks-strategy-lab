import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  basketSummaryNeedsRefresh,
  buildBaselineBasketCandidate,
  createPromotedIncumbent,
  evaluateBasket,
  fixturesDir,
  listOnboardingBasketSlots,
  loadResearchBundle,
  readResultsLedger,
  readRunSummary,
  toRepoRelative,
  appendResultRow,
  writeIncumbent,
  writeJson,
  writeRunSummary,
} from "../../../packages/research/src/index.js";

function findExistingBaselineRow(existingRows, candidate) {
  return existingRows.find(
    (row) =>
      row.stage === "baseline" &&
      row.slotId === candidate.slotId &&
      row.candidateRef === candidate.candidateRef,
  );
}

export function seedBasketBaselines(options = {}) {
  const emitReport = options.emitReport ?? true;
  const bundle = loadResearchBundle();
  const slots = listOnboardingBasketSlots();
  const existingRows = readResultsLedger();
  const seeded = [];
  let defaultFixture = null;

  for (const slot of slots) {
    const candidate = buildBaselineBasketCandidate(slot.slotId, bundle);
    const existingRow = findExistingBaselineRow(existingRows, candidate);
    let summary;

    if (existingRow) {
      summary = readRunSummary(existingRow.runId);
      if (!summary?.resultRow || basketSummaryNeedsRefresh(summary)) {
        summary = evaluateBasket(candidate, {
          bundle,
          stage: "baseline",
          runId: existingRow.runId,
          completedAtUtc: existingRow.completedAtUtc,
        }).summary;
        writeRunSummary(summary);
      }
    } else {
      const evaluation = evaluateBasket(candidate, {
        bundle,
        stage: "baseline",
      });
      appendResultRow(evaluation.resultRow);
      writeRunSummary(evaluation.summary);
      summary = evaluation.summary;
    }

    const incumbent = createPromotedIncumbent({
      slot,
      evaluation: summary,
    });
    writeIncumbent(incumbent);

    if (slot.slotId === "onboarding.default_basket") {
      defaultFixture = summary.resultRow;
    }

    seeded.push({
      slotId: slot.slotId,
      runId: summary.runId,
      candidateRef: summary.candidateRef,
      status: summary.status,
    });
  }

  if (defaultFixture) {
    const fixturePath = path.join(fixturesDir, "sample-research-result-row.json");
    writeJson(fixturePath, defaultFixture);
  }

  const report = {
    status: "ok",
    seededSlots: seeded,
    fixturePath: toRepoRelative(path.join(fixturesDir, "sample-research-result-row.json")),
  };

  if (emitReport) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  seedBasketBaselines();
}
