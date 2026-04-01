import { readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(CURRENT_DIR, "..");
const TARGET_DIRS = ["src", "test", "scripts"];

async function collectJavaScriptFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && extname(entry.name) === ".js") {
      files.push(entryPath);
    }
  }

  return files;
}

function checkFileSyntax(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--check", filePath], {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Syntax check failed for ${filePath}`));
    });
  });
}

const files = (
  await Promise.all(
    TARGET_DIRS.map(async (dirName) => {
      const absoluteDir = join(APP_ROOT, dirName);
      return collectJavaScriptFiles(absoluteDir);
    }),
  )
).flat();

for (const filePath of files) {
  await checkFileSyntax(filePath);
}
