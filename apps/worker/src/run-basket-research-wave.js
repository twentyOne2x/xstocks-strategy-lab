import { fileURLToPath } from "node:url";

import {
  appendResultRow,
  createPromotedIncumbent,
  describeBasketSearchSurface,
  describeBasketPolicyChanges,
  diffBasketPolicyProfiles,
  evaluateBasket,
  getBasketSlot,
  listBasketChallengerCandidates,
  listOnboardingBasketSlots,
  loadIncumbentForSlot,
  loadResearchBundle,
  readResultsLedger,
  readRunSummary,
  summarizeBasketPolicyChanges,
  writeIncumbent,
  writeRunSummary,
} from "../../../packages/research/src/index.js";
import { generatePromotedManifests } from "./generate-promoted-manifests.js";
import { seedBasketBaselines } from "./seed-basket-baselines.js";

function requestedSlotIds() {
  const slotFlagIndex = process.argv.indexOf("--slot");
  if (slotFlagIndex === -1) {
    return listOnboardingBasketSlots().map((slot) => slot.slotId);
  }

  const slotId = process.argv[slotFlagIndex + 1];
  if (!slotId) {
    throw new Error("Expected a slot ID after --slot");
  }

  return [slotId];
}

function hasExistingChallenge(rows, candidateRef, incumbentRunId) {
  return rows.some(
    (row) =>
      row.mode === "basket" &&
      row.stage === "challenger_running" &&
      row.candidateRef === candidateRef &&
      row.incumbentRunId === incumbentRunId,
  );
}

function buildIncumbentSnapshot(incumbent) {
  return {
    incumbentId: incumbent.incumbentId,
    runId: incumbent.runId,
    strategyVersion: incumbent.strategyVersion,
    score: incumbent.validation.score,
    promotedAt: incumbent.promotedAt,
  };
}

function buildBestChallenger(challengers) {
  const executed = challengers.filter((challenger) => challenger.runId);
  if (executed.length === 0) {
    return null;
  }

  return [...executed].sort(
    (left, right) =>
      right.primaryScore - left.primaryScore ||
      right.deltaScore - left.deltaScore ||
      left.candidateRef.localeCompare(right.candidateRef),
  )[0];
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatSignedScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  const rounded = Number(value.toFixed(6));
  return rounded >= 0 ? `+${rounded}` : String(rounded);
}

function formatScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return String(Number(value.toFixed(6)));
}

export function buildChallengerDecisionSummary({
  status,
  deltaScore,
  primaryScore,
  incumbentScore,
  guardrailPass,
  familyLabel,
  changeSummary,
}) {
  if (status === "skipped_existing") {
    return `Skipped because this challenger was already evaluated against the current incumbent. Family: ${familyLabel}. ${changeSummary}`;
  }

  const normalizedChangeSummary = changeSummary.endsWith(".")
    ? changeSummary
    : `${changeSummary}.`;
  const familyClause = familyLabel ? `Family: ${familyLabel}. ` : "";

  if (guardrailPass === false) {
    return `Lost on guardrails. ${familyClause}${normalizedChangeSummary} Score printed ${formatScore(primaryScore)}.`;
  }

  if (status === "keep") {
    return `Won by ${formatSignedScore(deltaScore)} score. ${familyClause}${normalizedChangeSummary} Score moved from ${formatScore(incumbentScore)} to ${formatScore(primaryScore)} with guardrails still green.`;
  }

  return `Lost by ${formatSignedScore(deltaScore)} score. ${familyClause}${normalizedChangeSummary} Score moved from ${formatScore(incumbentScore)} to ${formatScore(primaryScore)}, so this combination did not justify promotion.`;
}

function parameterLabels(parameterIds) {
  const labels = {
    selection_universe: "selection universe",
    holdings_count: "breadth",
    starter_bias_pct: "starter-basket bias",
    signal_power: "weighting",
    cash_weight: "cash",
    max_weight_pct: "cap",
    rebalance_threshold_bps: "rebalance",
  };

  return parameterIds.map((parameterId) => labels[parameterId] ?? parameterId);
}

function joinLabels(values) {
  if (values.length === 0) {
    return "none";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function buildSlotIncumbentInterpretation({
  startingScore,
  endingScore,
  finalPolicyChangeSummary,
  finalDimensions,
  incumbentInterpretation,
}) {
  const scoreDelta = Number((endingScore - startingScore).toFixed(6));
  return `Score moved from ${formatScore(startingScore)} to ${formatScore(endingScore)} (${formatSignedScore(scoreDelta)}) versus the seeded baseline. ${incumbentInterpretation} Winning dimensions versus baseline: ${joinLabels(parameterLabels(finalDimensions))}. Final parameter shifts: ${finalPolicyChangeSummary}`;
}

function summarizeFamilyList(families) {
  if (!families || families.length === 0) {
    return "none";
  }

  return families
    .map((family) => `${family.familyLabel} (${formatSignedScore(family.bestDeltaScore ?? 0)})`)
    .join(", ");
}

export function summarizeChallengerFamilies(challengers) {
  const families = new Map();

  for (const challenger of challengers) {
    const familyId = challenger.familyId ?? challenger.taxonomy?.familyId ?? "unclassified";
    if (!families.has(familyId)) {
      families.set(familyId, {
        familyId,
        familyLabel: challenger.familyLabel ?? challenger.taxonomy?.familyLabel ?? "Unclassified",
        familyClassId:
          challenger.familyClassId ?? challenger.taxonomy?.familyClassId ?? "unclassified",
        familyClassLabel:
          challenger.familyClassLabel ?? challenger.taxonomy?.familyClassLabel ?? "Unclassified",
        operatorSummary:
          challenger.familySummary ??
          challenger.taxonomy?.operatorSummary ??
          "Candidate family was not classified.",
        attemptedCount: 0,
        executedCount: 0,
        promotedCount: 0,
        bestDeltaScore: null,
        bestStatus: null,
        bestStrategyVersion: null,
      });
    }

    const family = families.get(familyId);
    family.attemptedCount += 1;
    if (challenger.runId) {
      family.executedCount += 1;
    }
    if (challenger.promoted) {
      family.promotedCount += 1;
    }

    if (
      family.bestDeltaScore === null ||
      (typeof challenger.deltaScore === "number" && challenger.deltaScore > family.bestDeltaScore)
    ) {
      family.bestDeltaScore =
        typeof challenger.deltaScore === "number" ? challenger.deltaScore : family.bestDeltaScore;
      family.bestStatus = challenger.status ?? null;
      family.bestStrategyVersion = challenger.strategyVersion ?? null;
    }
  }

  return [...families.values()].sort(
    (left, right) =>
      right.promotedCount - left.promotedCount ||
      (right.bestDeltaScore ?? -Infinity) - (left.bestDeltaScore ?? -Infinity) ||
      left.familyLabel.localeCompare(right.familyLabel),
  );
}

export function buildSlotOperatorSummary({
  finalPolicyChangeSummary,
  finalDimensions,
  challengerFamilies,
  endingSummary,
}) {
  const promotedFamilies = challengerFamilies.filter((family) => family.promotedCount > 0);
  const losingFamilies = challengerFamilies.filter(
    (family) => family.executedCount > 0 && family.promotedCount === 0,
  );
  const operatorSummary = endingSummary?.tuningSummary?.operatorSummary ?? {};
  const strategyFamily = endingSummary?.tuningSummary?.strategyFamily?.familyLabel ?? "Current incumbent";

  return {
    headline: `${strategyFamily} is the current incumbent family.`,
    whatChanged: finalPolicyChangeSummary,
    whatWorked: `Winning dimensions: ${joinLabels(parameterLabels(finalDimensions))}. Winning families: ${summarizeFamilyList(promotedFamilies.slice(0, 3))}.`,
    whatDidNotWork:
      losingFamilies.length > 0
        ? `Families that did not earn promotion: ${summarizeFamilyList(losingFamilies.slice(0, 3))}.`
        : "No losing challenger families were recorded in this wave.",
    currentState:
      operatorSummary.whatThisIs ??
      endingSummary?.tuningSummary?.headline ??
      "Current state unavailable.",
    whyThisIncumbent:
      operatorSummary.whyThisIncumbent ??
      endingSummary?.tuningSummary?.incumbentInterpretation ??
      "Incumbent rationale unavailable.",
    whatToWatch:
      operatorSummary.whatToWatch ??
      (endingSummary?.tuningSummary?.watchpoints ?? []).slice(0, 2).join(" ") ??
      "No watchpoints recorded.",
  };
}

export function runBasketResearchWave(options = {}) {
  const slotIds = options.slotIds ?? requestedSlotIds();
  const emitReport = options.emitReport ?? true;
  const skipExisting = options.skipExisting ?? process.argv.includes("--skip-existing");

  seedBasketBaselines({ emitReport: false });

  const bundle = loadResearchBundle();
  const ledgerRows = readResultsLedger();
  const slotReports = [];

  for (const slotId of slotIds) {
    const slot = getBasketSlot(slotId);
    const surface = describeBasketSearchSurface(slotId, bundle);
    let incumbent = loadIncumbentForSlot(slotId);

    if (!incumbent) {
      throw new Error(`Missing basket incumbent for ${slotId} after baseline seeding.`);
    }

    let incumbentRunId = incumbent.runId;
    let incumbentScore = incumbent.validation.score;
    const startingIncumbent = buildIncumbentSnapshot(incumbent);
    let currentIncumbentPolicyProfile = surface.defaultPolicyProfile;
    const challengerReports = [];

    for (const candidate of listBasketChallengerCandidates(slotId, bundle)) {
      const changedParameterIds = diffBasketPolicyProfiles(
        currentIncumbentPolicyProfile,
        candidate.policyProfile,
      );

      if (skipExisting && hasExistingChallenge(ledgerRows, candidate.candidateRef, incumbentRunId)) {
        const changedParameters = describeBasketPolicyChanges(
          currentIncumbentPolicyProfile,
          candidate.policyProfile,
        );
        const changeSummary = summarizeBasketPolicyChanges(
          currentIncumbentPolicyProfile,
          candidate.policyProfile,
        );
        challengerReports.push({
          candidateRef: candidate.candidateRef,
          strategyVersion: candidate.strategyVersion,
          templateId: candidate.policy?.policyId ?? null,
          taxonomy: candidate.taxonomy,
          familyId: candidate.taxonomy?.familyId ?? null,
          familyLabel: candidate.taxonomy?.familyLabel ?? null,
          familyClassId: candidate.taxonomy?.familyClassId ?? null,
          familyClassLabel: candidate.taxonomy?.familyClassLabel ?? null,
          familySummary: candidate.taxonomy?.operatorSummary ?? null,
          status: "skipped_existing",
          incumbentRunId,
          changedParameterIds,
          changedParameters,
          changeSummary,
          decisionSummary: buildChallengerDecisionSummary({
            status: "skipped_existing",
            deltaScore: null,
            primaryScore: null,
            incumbentScore: null,
            guardrailPass: null,
            familyLabel: candidate.taxonomy?.familyLabel ?? null,
            changeSummary,
          }),
          policy: candidate.policy,
          policyProfile: candidate.policyProfile,
        });
        continue;
      }

      const evaluation = evaluateBasket(candidate, {
        bundle,
        stage: "challenger_running",
        incumbentRunId,
        incumbentScore,
      });

      appendResultRow(evaluation.resultRow);
      writeRunSummary(evaluation.summary);
      ledgerRows.push(evaluation.resultRow);

      const challengerReport = {
        candidateRef: candidate.candidateRef,
        strategyVersion: candidate.strategyVersion,
        templateId: candidate.policy?.policyId ?? null,
        taxonomy: candidate.taxonomy,
        familyId: candidate.taxonomy?.familyId ?? null,
        familyLabel: candidate.taxonomy?.familyLabel ?? null,
        familyClassId: candidate.taxonomy?.familyClassId ?? null,
        familyClassLabel: candidate.taxonomy?.familyClassLabel ?? null,
        familySummary: candidate.taxonomy?.operatorSummary ?? null,
        runId: evaluation.resultRow.runId,
        incumbentRunId,
        status: evaluation.resultRow.status,
        primaryScore: evaluation.resultRow.primaryScore,
        deltaScore: evaluation.resultRow.deltaScore,
        guardrailPass: evaluation.resultRow.guardrailPass,
        changedParameterIds,
        changedParameters: describeBasketPolicyChanges(
          currentIncumbentPolicyProfile,
          candidate.policyProfile,
        ),
        changeSummary: summarizeBasketPolicyChanges(
          currentIncumbentPolicyProfile,
          candidate.policyProfile,
        ),
        policy: candidate.policy,
        policyProfile: candidate.policyProfile,
        promoted: false,
      };
      challengerReport.decisionSummary = buildChallengerDecisionSummary({
        status: challengerReport.status,
        deltaScore: challengerReport.deltaScore,
        primaryScore: challengerReport.primaryScore,
        incumbentScore,
        guardrailPass: challengerReport.guardrailPass,
        familyLabel: challengerReport.familyLabel,
        changeSummary: challengerReport.changeSummary,
      });

      if (evaluation.resultRow.status === "keep") {
        const promotedIncumbent = createPromotedIncumbent({
          slot,
          evaluation: evaluation.summary,
          previousIncumbentId: incumbent.incumbentId,
        });
        writeIncumbent(promotedIncumbent);
        incumbent = promotedIncumbent;
        incumbentRunId = promotedIncumbent.runId;
        incumbentScore = promotedIncumbent.validation.score;
        currentIncumbentPolicyProfile = candidate.policyProfile;
        challengerReport.promoted = true;
      }

      challengerReports.push(challengerReport);
    }

    const endingSummary = readRunSummary(incumbent.runId);
    const finalPolicyChangeSummary = summarizeBasketPolicyChanges(
      surface.defaultPolicyProfile,
      currentIncumbentPolicyProfile,
    );
    const finalChangedParameterIdsVsBaseline = diffBasketPolicyProfiles(
      surface.defaultPolicyProfile,
      currentIncumbentPolicyProfile,
    );
    const dimensionsThatMovedOutcomes = uniqueStrings(
      challengerReports
        .filter((challenger) => challenger.promoted)
        .flatMap((challenger) => challenger.changedParameterIds ?? []),
    );
    const challengerFamilies = summarizeChallengerFamilies(challengerReports);
    slotReports.push({
      slotId,
      anchorBasketId: surface.anchorBasketId,
      baselinePolicy: surface.baselinePolicy,
      defaultPolicyProfile: surface.defaultPolicyProfile,
      fixedParameters: surface.fixedParameters,
      tunableParameters: surface.tunableParameters,
      searchProfiles: surface.searchProfiles,
      startingIncumbent,
      executedChallengerCount: challengerReports.filter((challenger) => challenger.runId).length,
      promotedChallengerCount: challengerReports.filter((challenger) => challenger.promoted).length,
      challengers: challengerReports,
      challengerFamilies,
      bestChallenger: buildBestChallenger(challengerReports),
      winningChallengerSummaries: challengerReports
        .filter((challenger) => challenger.promoted)
        .map((challenger) => challenger.decisionSummary),
      failedChallengerSummaries: challengerReports
        .filter((challenger) => challenger.status === "discard")
        .map((challenger) => challenger.decisionSummary),
      dimensionsThatMovedOutcomes,
      finalChangedParameterIdsVsBaseline,
      finalPolicyChangeSummary,
      finalPolicyProfile: currentIncumbentPolicyProfile,
      endingIncumbent: buildIncumbentSnapshot(incumbent),
      endingMetrics: endingSummary?.metrics ?? null,
      incumbentInterpretation: buildSlotIncumbentInterpretation({
        startingScore: startingIncumbent.score,
        endingScore: incumbent.validation.score,
        finalPolicyChangeSummary,
        finalDimensions: finalChangedParameterIdsVsBaseline,
        incumbentInterpretation:
          endingSummary?.tuningSummary?.incumbentInterpretation ??
          endingSummary?.tuningSummary?.headline ??
          "Final incumbent interpretation unavailable.",
      }),
      operatorSummary: buildSlotOperatorSummary({
        finalPolicyChangeSummary,
        finalDimensions: finalChangedParameterIdsVsBaseline,
        challengerFamilies,
        endingSummary,
      }),
    });
  }

  const manifestReport = generatePromotedManifests(slotIds, { emitReport: false });
  const report = {
    status: "ok",
    slotReports,
    manifestReport,
  };

  if (emitReport) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runBasketResearchWave();
}
