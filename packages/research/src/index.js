import { fileURLToPath } from "node:url";

import { validateResearchBundle, loadResearchBundle } from "./bundle.js";
import { validatePromotedBoundary } from "./incumbents.js";
import { ensureResultsLedger, RESULTS_LEDGER_HEADERS } from "./results-ledger.js";
import { listOnboardingBasketSlots, listPublicStrategySlots } from "./slots.js";
import { resultsLedgerPath, toRepoRelative } from "./paths.js";

export * from "./bundle.js";
export * from "./constants.js";
export * from "./directional-preview.js";
export * from "./evaluate.js";
export * from "./explanations.js";
export * from "./fs.js";
export * from "./incumbents.js";
export * from "./results-ledger.js";
export * from "./shared-contracts.js";
export * from "./slots.js";
export * from "./hot/basket-policy.js";
export * from "./paths.js";

export function validateContracts() {
  const bundleValidation = validateResearchBundle(loadResearchBundle());
  ensureResultsLedger();

  return {
    status: "ok",
    bundle: bundleValidation,
    basketSlots: listOnboardingBasketSlots().map((slot) => slot.slotId),
    publicSlots: listPublicStrategySlots().map((slot) => slot.slotId),
    resultsLedger: {
      path: toRepoRelative(resultsLedgerPath),
      headerFields: RESULTS_LEDGER_HEADERS.length,
    },
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const command = process.argv[2] ?? "validate";
  const report =
    command === "promoted-boundary" ? validatePromotedBoundary() : validateContracts();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
