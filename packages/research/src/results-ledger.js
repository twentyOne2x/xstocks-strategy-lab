import fs from "node:fs";
import path from "node:path";

import {
  ensureDir,
  ensureDirForFile,
  fileExists,
  readJson,
  writeJson,
  writeText,
} from "./fs.js";
import { resultsLedgerPath, runSummariesDir } from "./paths.js";
import {
  normalizeResearchResultArtifact,
  parseResearchResultRow,
  RESEARCH_RESULT_ARTIFACT_HEADERS,
} from "./shared-contracts.js";

export const RESULTS_LEDGER_HEADERS = RESEARCH_RESULT_ARTIFACT_HEADERS;

const LEGACY_RESULTS_LEDGER_HEADERS = [
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

function sanitizeValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).replaceAll("\t", " ").replaceAll("\n", " ");
}

function parseLedgerRows(headers, rows) {
  return rows
    .filter(Boolean)
    .map((row) => {
      const values = row.split("\t");
      const rawRow = Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      );
      return parseResearchResultRow(rawRow);
    });
}

export function serializeResultRowForLedger(row) {
  const normalizedRow = normalizeResearchResultArtifact(row);
  return RESULTS_LEDGER_HEADERS.map((header) => sanitizeValue(normalizedRow[header])).join("\t");
}

function writeLedgerRows(rows) {
  const body = rows.map((row) => serializeResultRowForLedger(row)).join("\n");
  const suffix = body ? `\n${body}\n` : "\n";
  writeText(resultsLedgerPath, `${RESULTS_LEDGER_HEADERS.join("\t")}${suffix}`);
}

export function parseResultsLedgerText(contents) {
  const trimmedContents = contents.trimEnd();
  if (!trimmedContents) {
    return [];
  }

  const [headerLine, ...rows] = trimmedContents.split("\n");
  const canonicalHeader = RESULTS_LEDGER_HEADERS.join("\t");
  const legacyHeader = LEGACY_RESULTS_LEDGER_HEADERS.join("\t");

  if (headerLine === canonicalHeader) {
    return parseLedgerRows(RESULTS_LEDGER_HEADERS, rows);
  }

  if (headerLine === legacyHeader) {
    return parseLedgerRows(LEGACY_RESULTS_LEDGER_HEADERS, rows);
  }

  throw new Error(`Unsupported results ledger header format at ${resultsLedgerPath}`);
}

export function ensureResultsLedger() {
  ensureDirForFile(resultsLedgerPath);
  if (!fileExists(resultsLedgerPath)) {
    writeLedgerRows([]);
    return;
  }

  const contents = fs.readFileSync(resultsLedgerPath, "utf8").trimEnd();
  if (!contents) {
    writeLedgerRows([]);
    return;
  }

  const canonicalHeader = RESULTS_LEDGER_HEADERS.join("\t");
  const [headerLine] = contents.split("\n");

  if (headerLine === canonicalHeader) {
    return;
  }

  writeLedgerRows(parseResultsLedgerText(contents));
}

export function readResultsLedger() {
  ensureResultsLedger();
  const contents = fs.readFileSync(resultsLedgerPath, "utf8").trimEnd();
  return parseResultsLedgerText(contents);
}

export function appendResultRow(row) {
  ensureResultsLedger();
  const serialized = serializeResultRowForLedger(row);
  fs.appendFileSync(resultsLedgerPath, `${serialized}\n`, "utf8");
}

export function runSummaryPath(runId) {
  return path.join(runSummariesDir, `${runId}.json`);
}

export function writeRunSummary(summary) {
  ensureDir(runSummariesDir);
  const summaryPath = runSummaryPath(summary.runId);
  writeJson(summaryPath, summary);
  return summaryPath;
}

export function readRunSummary(runId) {
  const summaryPath = runSummaryPath(runId);
  return fileExists(summaryPath) ? readJson(summaryPath) : null;
}
