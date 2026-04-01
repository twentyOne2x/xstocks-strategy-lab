import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { createRuntimeStore } from "../../../../apps/api/src/repositories/runtime-store.js";
import {
  createRebalanceOrchestrator,
} from "../rebalance-orchestrator.js";

const REPO_ROOT = resolve(
  "/Users/user/PycharmProjects/xstocks-strategy-lab",
);
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const DEFAULT_MANIFEST_ID = JSON.parse(readFileSync(SLOT_REGISTRY_PATH, "utf8")).slots[
  "onboarding.default_basket"
].currentManifestRef.manifestId;

function createStaticLiveStateRepository() {
  return {
    async loadBoundaryState({ manifest }) {
      return {
        liveXStocksState: {
          stateVersion: "worker-test.xstocks.v1",
          asOf: "2026-04-01T08:00:00.000Z",
          assets: manifest.executionBoundary.requiredAssets.map((assetSymbol) => ({
            assetSymbol,
            chain: "ethereum",
            status: "active",
            priceUsd: assetSymbol === "AUSD" ? 1 : 100,
          })),
        },
        liveRouteState: {
          stateVersion: "worker-test.routes.v1",
          asOf: "2026-04-01T08:00:00.000Z",
          routes: [
            {
              routeId: "cow_swap.ethereum",
              label: "Cow Swap on Ethereum",
              routeKind: "execution",
              chain: "ethereum",
              verificationTier: "public_verified",
              availability: "available",
              notes: "Verified Ethereum execution rail.",
            },
            {
              routeId: "flowdesk.ausd-rwa-strategy",
              label: "Flowdesk AUSD RWA Strategy",
              routeKind: "yield_vault",
              chain: "ethereum",
              verificationTier: "public_verified",
              availability: "available",
              notes: "Verified AUSD yield-buffer sleeve.",
            },
            {
              routeId: "euler.ethereum.directional",
              label: "Euler Directional",
              routeKind: "directional_market",
              chain: "ethereum",
              verificationTier: "unverified",
              availability: "preview_only",
              notes: "Directional lane remains preview-only until exact live proof exists.",
            },
          ],
        },
      };
    },
  };
}

async function createHarness() {
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-worker-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const runtimeStore = createRuntimeStore({
    storePath,
    now: () => "2026-04-01T08:00:00.000Z",
  });
  const orchestrator = createRebalanceOrchestrator({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    runtimeStore,
    liveStateRepository: createStaticLiveStateRepository(),
    now: () => "2026-04-01T08:00:00.000Z",
  });

  return {
    runtimeStore,
    orchestrator,
  };
}

test("worker evaluation stays preview-only until a slot has an activation baseline", async () => {
  const harness = await createHarness();
  const [rebalance] = await harness.orchestrator.evaluate({
    slotId: "onboarding.default_basket",
  });

  assert.equal(rebalance.state, "preview_only");
  assert.equal(rebalance.runtimeOwner, "operator_manual");
});

test("worker scheduled-cron evaluation only schedules manual review and records the scheduler as runtime owner", async () => {
  const harness = await createHarness();

  await harness.runtimeStore.appendActivation({
    activation: {
      activationId: "act_prev",
      chain: "ethereum",
      manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
      slotId: "onboarding.default_basket",
      recommendationId: "rec_prev",
      activationManifestRef: {
        manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
        slotId: "onboarding.default_basket",
        strategyVersion: "basket-baseline-v0",
        chain: "ethereum",
        mode: "basket",
      },
      requestedNotionalUsd: 1000,
      surfaceTruth: "live",
      status: "ready",
      createdAt: "2026-04-01T07:00:00.000Z",
      updatedAt: "2026-04-01T07:00:00.000Z",
      walletState: {
        walletConnected: true,
        walletAddress: "0xabc",
        fundedNotionalUsd: 1250,
        smartAccount: {
          status: "ready",
          address: "0xsmart",
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: {
        executionPlanId: "exec_prev",
        generatedAt: "2026-04-01T07:00:00.000Z",
        activationManifestRef: {
          manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
          slotId: "onboarding.default_basket",
          strategyVersion: "basket-baseline-v0",
          chain: "ethereum",
          mode: "basket",
        },
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        requestedNotionalUsd: 1000,
        walletConnectionLate: true,
        routeTruthLabels: [],
        assetChecks: [],
        fundingPath: {
          provider: "privy",
          bridgeProvider: "lifi",
          minRequiredUsd: 1000,
          fundedNotionalUsd: 1250,
          fundingGapUsd: 0,
          topUpAsset: "USDC",
          status: "not_needed",
        },
        smartAccount: {
          readiness: "ready",
          providerId: "privy_embedded",
          status: "ready",
          address: "0xsmart",
          reviewArtifact: {
            providerId: "privy_embedded",
            providerName: "Privy embedded smart account",
            supportedChains: ["ethereum"],
            permissions: ["activate_promoted_manifest_only"],
            fundingBoundary: "Funding remains external to the smart account scaffold.",
            walletConnectionLate: true,
            notes: [],
          },
        },
        steps: [],
        allowedActions: [],
        blockers: [],
        warnings: [],
        liveStateSummary: {
          xstocksStateVersion: "worker-test.xstocks.v1",
          routeStateVersion: "worker-test.routes.v1",
        },
      },
    },
    activityEvents: [],
  });

  const [rebalance] = await harness.orchestrator.evaluate(
    { slotId: "onboarding.default_basket" },
    { triggerSource: "scheduled_cron" },
  );

  assert.equal(rebalance.state, "scheduled");
  assert.equal(rebalance.runtimeOwner, "worker_offchain_scheduler");
  assert.equal(rebalance.triggerSource, "scheduled_cron");
  assert.match(rebalance.rationale, /manual review/i);
});

test("worker evaluation recommends a manual rebalance when the promoted manifest drifts from the latest activation baseline", async () => {
  const harness = await createHarness();

  await harness.runtimeStore.appendActivation({
    activation: {
      activationId: "act_prev",
      chain: "ethereum",
      manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
      slotId: "onboarding.default_basket",
      recommendationId: "rec_prev",
      activationManifestRef: {
        manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
        slotId: "onboarding.default_basket",
        strategyVersion: "basket-baseline-v0",
        chain: "ethereum",
        mode: "basket",
      },
      requestedNotionalUsd: 1000,
      surfaceTruth: "live",
      status: "ready",
      createdAt: "2026-04-01T07:00:00.000Z",
      updatedAt: "2026-04-01T07:00:00.000Z",
      walletState: {
        walletConnected: true,
        walletAddress: "0xabc",
        fundedNotionalUsd: 1250,
        smartAccount: {
          status: "ready",
          address: "0xsmart",
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: {
        executionPlanId: "exec_prev",
        generatedAt: "2026-04-01T07:00:00.000Z",
        activationManifestRef: {
          manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
          slotId: "onboarding.default_basket",
          strategyVersion: "basket-baseline-v0",
          chain: "ethereum",
          mode: "basket",
        },
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        requestedNotionalUsd: 1000,
        walletConnectionLate: true,
        routeTruthLabels: [],
        assetChecks: [],
        fundingPath: {
          provider: "privy",
          bridgeProvider: "lifi",
          minRequiredUsd: 1000,
          fundedNotionalUsd: 1250,
          fundingGapUsd: 0,
          topUpAsset: "USDC",
          status: "not_needed",
        },
        smartAccount: {
          readiness: "ready",
          providerId: "privy_embedded",
          status: "ready",
          address: "0xsmart",
          reviewArtifact: {
            providerId: "privy_embedded",
            providerName: "Privy embedded smart account",
            supportedChains: ["ethereum"],
            permissions: ["activate_promoted_manifest_only"],
            fundingBoundary: "Funding remains external to the smart account scaffold.",
            walletConnectionLate: true,
            notes: [],
          },
        },
        steps: [],
        allowedActions: [],
        blockers: [],
        warnings: [],
        liveStateSummary: {
          xstocksStateVersion: "worker-test.xstocks.v1",
          routeStateVersion: "worker-test.routes.v1",
        },
      },
    },
    activityEvents: [],
  });

  const [rebalance] = await harness.orchestrator.evaluate({
    slotId: "onboarding.default_basket",
  });

  assert.equal(rebalance.targetManifestId, DEFAULT_MANIFEST_ID);
  assert.equal(rebalance.baselineManifestId, "onboarding.default_basket:basket-baseline-v0:promoted");
  assert.equal(rebalance.state, "rebalance_recommended");
});

test("worker transitions keep manual rebalance progress explicit", async () => {
  const harness = await createHarness();

  await harness.runtimeStore.appendActivation({
    activation: {
      activationId: "act_prev",
      chain: "ethereum",
      manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
      slotId: "onboarding.default_basket",
      recommendationId: "rec_prev",
      activationManifestRef: {
        manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
        slotId: "onboarding.default_basket",
        strategyVersion: "basket-baseline-v0",
        chain: "ethereum",
        mode: "basket",
      },
      requestedNotionalUsd: 1000,
      surfaceTruth: "live",
      status: "ready",
      createdAt: "2026-04-01T07:00:00.000Z",
      updatedAt: "2026-04-01T07:00:00.000Z",
      walletState: {
        walletConnected: true,
        walletAddress: "0xabc",
        fundedNotionalUsd: 1250,
        smartAccount: {
          status: "ready",
          address: "0xsmart",
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: {
        executionPlanId: "exec_prev",
        generatedAt: "2026-04-01T07:00:00.000Z",
        activationManifestRef: {
          manifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
          slotId: "onboarding.default_basket",
          strategyVersion: "basket-baseline-v0",
          chain: "ethereum",
          mode: "basket",
        },
        surfaceTruth: "live",
        executionState: "ready",
        executionEligibility: "executable",
        requestedNotionalUsd: 1000,
        walletConnectionLate: true,
        routeTruthLabels: [],
        assetChecks: [],
        fundingPath: {
          provider: "privy",
          bridgeProvider: "lifi",
          minRequiredUsd: 1000,
          fundedNotionalUsd: 1250,
          fundingGapUsd: 0,
          topUpAsset: "USDC",
          status: "not_needed",
        },
        smartAccount: {
          readiness: "ready",
          providerId: "privy_embedded",
          status: "ready",
          address: "0xsmart",
          reviewArtifact: {
            providerId: "privy_embedded",
            providerName: "Privy embedded smart account",
            supportedChains: ["ethereum"],
            permissions: ["activate_promoted_manifest_only"],
            fundingBoundary: "Funding remains external to the smart account scaffold.",
            walletConnectionLate: true,
            notes: [],
          },
        },
        steps: [],
        allowedActions: [],
        blockers: [],
        warnings: [],
        liveStateSummary: {
          xstocksStateVersion: "worker-test.xstocks.v1",
          routeStateVersion: "worker-test.routes.v1",
        },
      },
    },
    activityEvents: [],
  });

  await harness.orchestrator.evaluate({
    slotId: "onboarding.default_basket",
  });

  const [scheduled] = await harness.orchestrator.transition(
    { slotId: "onboarding.default_basket" },
    {
      nextState: "scheduled",
      scheduledFor: "2026-04-01T10:00:00.000Z",
    },
  );
  const [executing] = await harness.orchestrator.transition(
    { slotId: "onboarding.default_basket" },
    {
      nextState: "executing",
    },
  );
  const [rebalanced] = await harness.orchestrator.transition(
    { slotId: "onboarding.default_basket" },
    {
      nextState: "rebalanced",
    },
  );
  const latestRebalance = await harness.runtimeStore.getLatestRebalance({
    slotId: "onboarding.default_basket",
  });

  assert.equal(scheduled.state, "scheduled");
  assert.equal(executing.state, "executing");
  assert.equal(rebalanced.state, "rebalanced");
  assert.equal(latestRebalance.history.length, 4);
});
