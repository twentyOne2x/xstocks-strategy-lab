import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function parseEnvFile(raw) {
  const entries = {};

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value =
      rawValue.length >= 2 &&
      ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'")))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!key || Object.hasOwn(process.env, key)) {
      continue;
    }

    entries[key] = value;
  }

  return entries;
}

export function loadEnvFromFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    Object.assign(process.env, parseEnvFile(raw));
    return true;
  } catch {
    return false;
  }
}

export function defaultSharedEnvPath() {
  return (
    process.env.XSTOCKS_SHARED_ENV_PATH ??
    process.env.ATTN_SHARED_ENV_PATH ??
    resolve(process.env.HOME ?? "~", ".config/attn/shared.env")
  );
}

export function bootstrapSharedEnv(repoRoot) {
  const loadedPaths = [];
  const sharedEnvPath = defaultSharedEnvPath();

  if (sharedEnvPath && loadEnvFromFile(sharedEnvPath)) {
    loadedPaths.push(sharedEnvPath);
  }

  const candidatePaths = [
    resolve(repoRoot, ".vercel/.env.production.local"),
    resolve(repoRoot, "apps/web/.env.local"),
    resolve(repoRoot, "apps/api/.env.local"),
  ];

  for (const candidatePath of candidatePaths) {
    if (loadEnvFromFile(candidatePath)) {
      loadedPaths.push(candidatePath);
    }
  }

  return {
    loadedPaths,
    sharedEnvPath,
  };
}

export function optionalEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function expandHomePath(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return value ?? null;
  }

  const home = process.env.HOME ?? "~";
  const trimmed = value.trim();

  if (trimmed === "~") {
    return home;
  }

  if (trimmed.startsWith("~/")) {
    return resolve(home, trimmed.slice(2));
  }

  if (trimmed.startsWith("$HOME/")) {
    return resolve(home, trimmed.slice("$HOME/".length));
  }

  if (trimmed.startsWith("${HOME}/")) {
    return resolve(home, trimmed.slice("${HOME}/".length));
  }

  return trimmed;
}

export function requiredEnv(name, contextLabel = null) {
  const value = optionalEnv(name);

  if (value) {
    return value;
  }

  throw new Error(
    `${name} is required${contextLabel ? ` for ${contextLabel}` : ""}.`,
  );
}

export function resolveSecret({
  envName,
  commandEnvName,
  contextLabel = null,
}) {
  const directValue = optionalEnv(envName);

  if (directValue) {
    return {
      source: envName,
      value: directValue,
    };
  }

  const command = optionalEnv(commandEnvName);

  if (command) {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: "/bin/zsh",
    }).trim();

    if (!output) {
      throw new Error(
        `${commandEnvName} ran successfully but did not return a secret value${contextLabel ? ` for ${contextLabel}` : ""}.`,
      );
    }

    return {
      source: commandEnvName,
      value: output,
    };
  }

  return {
    source: null,
    value: null,
  };
}
