import assert from "node:assert/strict";
import test from "node:test";

import { researchResultRowSchema } from "../../../shared/dist/contracts/research.js";
import { loadResearchBundle } from "../bundle.js";
import { evaluateBasket } from "../evaluate.js";
import { buildBaselineBasketCandidate } from "../hot/basket-policy.js";
import {
  parseResultsLedgerText,
  RESULTS_LEDGER_HEADERS,
  serializeResultRowForLedger,
} from "../results-ledger.js";
import {
  normalizeResearchResultArtifact,
  parseResearchResultRow,
} from "../shared-contracts.js";

const LEGACY_CAMELCASE_RESULTS_LEDGER_HEADERS = [
  "version",
  "runId",
  "completedAtUtc",
  "stage",
  "mode",
  "slotId",
  "objectiveId",
  "status",
  "candidateRef",
  "incumbentRunId",
  "manualVersion",
  "evaluatorVersion",
  "researchDatasetId",
  "validationSetId",
  "universeId",
  "chainId",
  "liveTruthSourceId",
  "primaryScore",
  "incumbentScore",
  "deltaScore",
  "guardrailPass",
  "returnAnnPct",
  "maxDrawdownPct",
  "turnoverAnnPct",
  "costsTotalBps",
  "description",
  "benchmarkId",
  "constituentCountAvg",
  "weightMaxPct",
  "grossExposureAvgPct",
  "netExposureAvgPct",
  "leverageAvg",
  "borrowCostBps",
  "eulerMarketSetId",
  "eulerHealthMin",
];

function buildBaselineEvaluation() {
  const bundle = loadResearchBundle();
  const candidate = buildBaselineBasketCandidate("onboarding.default_basket", bundle);

  return evaluateBasket(candidate, {
    bundle,
    stage: "baseline",
    completedAtUtc: "2026-03-31T00:00:00.000Z",
    runId: "baseline-ledger-roundtrip-test",
  });
}

test("results ledger round-trips canonical snake_case research rows", () => {
  const evaluation = buildBaselineEvaluation();
  const canonicalArtifact = normalizeResearchResultArtifact(evaluation.resultRow);
  const ledgerText = [
    RESULTS_LEDGER_HEADERS.join("\t"),
    serializeResultRowForLedger(evaluation.resultRow),
    "",
  ].join("\n");

  assert.equal(RESULTS_LEDGER_HEADERS.includes("version"), false);
  assert.equal(RESULTS_LEDGER_HEADERS[0], "run_id");
  researchResultRowSchema.parse(canonicalArtifact);
  assert.deepEqual(parseResultsLedgerText(ledgerText), [
    parseResearchResultRow(evaluation.resultRow),
  ]);
});

test("results ledger still reads legacy camelCase rows with the version header", () => {
  const evaluation = buildBaselineEvaluation();
  const legacyLedgerLine = LEGACY_CAMELCASE_RESULTS_LEDGER_HEADERS.map((header) =>
    String(evaluation.resultRow[header] ?? ""),
  ).join("\t");
  const legacyLedgerText = [
    LEGACY_CAMELCASE_RESULTS_LEDGER_HEADERS.join("\t"),
    legacyLedgerLine,
    "",
  ].join("\n");

  assert.deepEqual(parseResultsLedgerText(legacyLedgerText), [
    parseResearchResultRow(evaluation.resultRow),
  ]);
});
