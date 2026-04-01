import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));

export const researchRoot = path.resolve(sourceDir, "..");
export const repoRoot = path.resolve(researchRoot, "../..");
export const bundleDir = path.join(researchRoot, "data", "research-bundle-v2");
export const bundleManifestPath = path.join(bundleDir, "manifest.json");
export const resultsLedgerPath = path.join(researchRoot, "runs", "results.tsv");
export const runSummariesDir = path.join(researchRoot, "runs", "summaries");
export const fixturesDir = path.join(researchRoot, "fixtures");
export const incumbentsDir = path.join(researchRoot, "incumbents");
export const promotedManifestRoot = path.join(researchRoot, "manifests", "promoted");
export const slotRegistryPath = path.join(researchRoot, "manifests", "slot-registry.json");

export function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}
