import { fileURLToPath } from "node:url";

import {
  describeBasketSearchSurface,
  listOnboardingBasketSlots,
  loadResearchBundle,
} from "../../../packages/research/src/index.js";

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

export function auditBasketSurface(slotIds = requestedSlotIds()) {
  const bundle = loadResearchBundle();
  const report = {
    status: "ok",
    slots: slotIds.map((slotId) => describeBasketSearchSurface(slotId, bundle)),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  auditBasketSurface();
}
