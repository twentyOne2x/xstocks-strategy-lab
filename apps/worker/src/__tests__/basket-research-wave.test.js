import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChallengerDecisionSummary,
  buildSlotIncumbentInterpretation,
  buildSlotOperatorSummary,
  summarizeChallengerFamilies,
} from "../run-basket-research-wave.js";

test("worker challenger decision summaries stay concise and operator-readable", () => {
  const keepSummary = buildChallengerDecisionSummary({
    status: "keep",
    deltaScore: 0.302,
    primaryScore: 6.00166,
    incumbentScore: 5.69966,
    guardrailPass: true,
    familyLabel: "Core Focus + Low Cash",
    changeSummary:
      "Selection universe: starter basket only -> core universe; Breadth: 7 names -> 6 names; Cash sleeve: 5% AUSD -> 2% AUSD",
  });
  const discardSummary = buildChallengerDecisionSummary({
    status: "discard",
    deltaScore: -0.58186,
    primaryScore: 5.4198,
    incumbentScore: 6.00166,
    guardrailPass: true,
    familyLabel: "Core Focus + Tighter Cap",
    changeSummary: "Single-name cap: 18% -> 16%; Cash sleeve: 2% AUSD -> 5% AUSD",
  });

  assert.match(keepSummary, /^Won by \+0\.302 score\./);
  assert.match(keepSummary, /Family: Core Focus \+ Low Cash\./);
  assert.match(keepSummary, /Selection universe: starter basket only -> core universe/);
  assert.match(keepSummary, /Score moved from 5\.69966 to 6\.00166/);
  assert.match(discardSummary, /^Lost by -0\.58186 score\./);
  assert.match(discardSummary, /Family: Core Focus \+ Tighter Cap\./);
  assert.match(discardSummary, /did not justify promotion/);
});

test("worker incumbent interpretations explain the final basket in wave context", () => {
  const interpretation = buildSlotIncumbentInterpretation({
    startingScore: 3.58936,
    endingScore: 6.00166,
    finalPolicyChangeSummary:
      "Selection universe: starter basket only -> core universe; Breadth: 7 names -> 6 names; Cash sleeve: 5% AUSD -> 2% AUSD",
    finalDimensions: ["selection_universe", "holdings_count", "cash_weight"],
    incumbentInterpretation:
      "6-name core universe basket with 2% in AUSD. NVDAx is the largest sleeve at 18%. After costs it outperformed basket.sp500_core_v1 by 29.55% in the frozen window.",
  });

  assert.match(interpretation, /Score moved from 3\.58936 to 6\.00166 \(\+2\.4123\) versus the seeded baseline\./);
  assert.match(interpretation, /Winning dimensions versus baseline: selection universe, breadth, and cash\./);
  assert.match(interpretation, /Final parameter shifts: Selection universe: starter basket only -> core universe/);
});

test("worker family summaries group challenger outcomes by family", () => {
  const families = summarizeChallengerFamilies([
    {
      familyId: "core_focus_low_cash",
      familyLabel: "Core Focus + Low Cash",
      familyClassId: "core_universe_capital_mix",
      familyClassLabel: "Core-universe capital mix",
      familySummary: "Widens into the core universe, trims breadth by one name, and lowers the AUSD sleeve.",
      runId: "run-1",
      promoted: true,
      status: "keep",
      deltaScore: 0.302,
      strategyVersion: "basket-core-h6-p100-c2-cap18-a0-r300-v1",
    },
    {
      familyId: "core_focus_tighter_cap",
      familyLabel: "Core Focus + Tighter Cap",
      familyClassId: "core_universe_risk_controls",
      familyClassLabel: "Core-universe risk controls",
      familySummary: "Widens into the core universe, trims breadth, and tightens concentration limits.",
      runId: "run-2",
      promoted: false,
      status: "discard",
      deltaScore: -0.58186,
      strategyVersion: "basket-core-h6-p100-c5-cap16-a0-r300-v1",
    },
  ]);

  assert.equal(families.length, 2);
  assert.equal(families[0].familyId, "core_focus_low_cash");
  assert.equal(families[0].promotedCount, 1);
  assert.equal(families[0].bestStrategyVersion, "basket-core-h6-p100-c2-cap18-a0-r300-v1");
  assert.equal(families[1].familyClassId, "core_universe_risk_controls");
});

test("worker slot operator summaries explain what changed and what mattered", () => {
  const summary = buildSlotOperatorSummary({
    finalPolicyChangeSummary:
      "Selection universe: starter basket only -> core universe; Breadth: 7 names -> 6 names; Cash sleeve: 5% AUSD -> 2% AUSD",
    finalDimensions: ["selection_universe", "holdings_count", "cash_weight"],
    challengerFamilies: [
      {
        familyId: "core_focus_low_cash",
        familyLabel: "Core Focus + Low Cash",
        promotedCount: 1,
        executedCount: 1,
        bestDeltaScore: 0.302,
      },
      {
        familyId: "core_focus_tighter_cap",
        familyLabel: "Core Focus + Tighter Cap",
        promotedCount: 0,
        executedCount: 1,
        bestDeltaScore: -0.58186,
      },
    ],
    endingSummary: {
      tuningSummary: {
        strategyFamily: { familyLabel: "Core Focus + Low Cash" },
        operatorSummary: {
          whatThisIs:
            "Core Focus + Low Cash keeps 98% in xStocks across 6 core universe names anchored to Mag 7, with 2% in AUSD.",
          whyThisIncumbent:
            "Core Focus + Low Cash. 6-name core universe basket with 2% in AUSD. After costs it outperformed basket.sp500_core_v1 by 30.01% in the frozen window.",
          whatToWatch:
            "NVDAx is the largest sleeve at 18% against a 18% single-name cap. Frozen turnover is 98% with 44.3 bps of estimated total costs.",
        },
      },
    },
  });

  assert.match(summary.headline, /Core Focus \+ Low Cash is the current incumbent family/);
  assert.match(summary.whatWorked, /Winning dimensions: selection universe, breadth, and cash/);
  assert.match(summary.whatWorked, /Core Focus \+ Low Cash \(\+0.302\)/);
  assert.match(summary.whatDidNotWork, /Core Focus \+ Tighter Cap \(-0.58186\)/);
  assert.match(summary.currentState, /98% in xStocks/);
  assert.match(summary.whyThisIncumbent, /After costs it outperformed/);
});
