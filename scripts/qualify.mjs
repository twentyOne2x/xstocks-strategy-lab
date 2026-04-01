import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  QUALIFICATION_QUESTION_CATALOG,
  createQualificationService,
  listQualificationFixtures,
  loadQualificationFixture,
} from "./lib/qualification-runtime.mjs";

function readFlagValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/qualify.mjs --fixture <name> [--out <path>] [--live]
  node scripts/qualify.mjs --input <path> [--out <path>] [--live]
  node scripts/qualify.mjs --list-fixtures
  node scripts/qualify.mjs --list-questions
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (hasFlag(args, "--help")) {
    printHelp();
    return;
  }

  if (hasFlag(args, "--list-fixtures")) {
    const fixtures = await listQualificationFixtures();
    process.stdout.write(`${fixtures.join("\n")}\n`);
    return;
  }

  if (hasFlag(args, "--list-questions")) {
    process.stdout.write(`${JSON.stringify(QUALIFICATION_QUESTION_CATALOG, null, 2)}\n`);
    return;
  }

  const fixtureName = readFlagValue(args, "--fixture");
  const inputPath = readFlagValue(args, "--input");
  const outputPath = readFlagValue(args, "--out");
  const useLiveState = hasFlag(args, "--live");

  if (!fixtureName && !inputPath) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const payload = fixtureName
    ? await loadQualificationFixture(fixtureName)
    : await loadQualificationFixture(inputPath);
  const service = createQualificationService({ useLiveState });
  const result = await service.qualify(payload);
  const output = `${JSON.stringify(result, null, 2)}\n`;

  if (outputPath) {
    await writeFile(resolve(outputPath), output, "utf8");
  }

  process.stdout.write(output);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exit(1);
});
