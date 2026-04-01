import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createStaticLiveStateRepository } from "../src/repositories/static-live-state-repository.js";
import { createApiServer } from "../src/server.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const FIXTURE_DIR = resolve(REPO_ROOT, "scripts/fixtures/qualification");

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function startServer() {
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-qualification-api-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const server = createApiServer({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    liveStateRepository: createStaticLiveStateRepository(),
  });

  await new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }

          resolveClose();
        });
      });
    },
  };
}

test("api qualification endpoint returns canonical onboarding outputs for all local fixtures", async () => {
  const server = await startServer();
  const fixtureNames = [
    "active-leaders",
    "broad-cautious",
    "directional-opt-in",
    "theme-tilt",
  ];

  try {
    for (const fixtureName of fixtureNames) {
      const fixture = await loadJson(resolve(FIXTURE_DIR, `${fixtureName}.json`));
      const response = await fetch(`${server.baseUrl}/api/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fixture),
      });
      const payload = await response.json();
      const qualification = payload.data.qualification;

      assert.equal(response.status, 200, fixtureName);
      assert.equal(qualification.selection.slotId, fixture.expected.slotId);
      assert.equal(qualification.selection.mode, fixture.expected.mode);
      assert.equal(
        qualification.activationTruth.directionalPreviewOnly,
        fixture.expected.directionalPreviewOnly,
      );
      assert.equal(
        qualification.activationTruth.executionState,
        fixture.expected.executionState,
      );
      assert.equal(
        qualification.activationTruth.activationReady,
        fixture.expected.activationReady,
      );
      assert.equal(
        qualification.activationTruth.executionEligibility,
        fixture.expected.executionEligibility,
      );
      assert.equal(
        qualification.explanationSurface.surfaceId,
        "recommendation.explanationBundle",
      );
      assert.equal(
        qualification.manifestRef.manifestId,
        qualification.manifestId,
      );
    }
  } finally {
    await server.close();
  }
});
