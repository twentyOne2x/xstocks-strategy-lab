import { fileURLToPath } from "node:url";

import {
  appendResultRow,
  buildDefaultDirectionalCandidate,
  createDirectionalPreviewIncumbent,
  evaluateDirectional,
  getDirectionalSlot,
  readResultsLedger,
  readRunSummary,
  writeIncumbent,
  writeRunSummary,
} from "../../../packages/research/src/index.js";

function findExistingPreviewRow(existingRows, candidate) {
  return existingRows.find(
    (row) =>
      row.stage === "preview_stub" &&
      row.slotId === candidate.slotId &&
      row.candidateRef === candidate.candidateRef,
  );
}

export function seedDirectionalPreview(options = {}) {
  const emitReport = options.emitReport ?? true;
  const slot = getDirectionalSlot("advanced.default_directional");
  const candidate = buildDefaultDirectionalCandidate();
  const existingRows = readResultsLedger();
  const existingRow = findExistingPreviewRow(existingRows, candidate);

  let summary;
  if (existingRow) {
    summary = readRunSummary(existingRow.runId);
    if (!summary?.resultRow) {
      summary = evaluateDirectional(candidate, {
        stage: "preview_stub",
        runId: existingRow.runId,
        completedAtUtc: existingRow.completedAtUtc,
      }).summary;
      writeRunSummary(summary);
    }
  } else {
    const evaluation = evaluateDirectional(candidate, {
      stage: "preview_stub",
    });
    appendResultRow(evaluation.resultRow);
    writeRunSummary(evaluation.summary);
    summary = evaluation.summary;
  }

  const incumbent = createDirectionalPreviewIncumbent({
    slot,
    evaluation: summary,
  });
  writeIncumbent(incumbent);

  const report = {
    status: "ok",
    slotId: slot.slotId,
    runId: summary.runId,
    candidateRef: summary.candidateRef,
    previewOnly: true,
  };

  if (emitReport) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  seedDirectionalPreview();
}
