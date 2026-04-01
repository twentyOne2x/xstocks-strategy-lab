import fs from "node:fs";
import path from "node:path";

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function ensureDirForFile(filePath) {
  ensureDir(path.dirname(filePath));
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(filePath, value) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, value, "utf8");
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}
