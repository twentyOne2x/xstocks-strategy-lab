import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createLiveStateRepository } from "../../api/src/repositories/live-state-repository.js";
import { createResearchManifestRepository } from "../../api/src/repositories/research-manifest-repository.js";
import { createRuntimeStore } from "../../api/src/repositories/runtime-store.js";
import {
  applyRebalanceTransition,
  createSmartAccountProviderScaffold,
  deriveExecutionPlan,
  deriveRecommendation,
  deriveRebalanceOrchestration,
  normalizeUsd,
  normalizeWalletState,
  REBALANCE_RUNTIME_OWNER,
  REBALANCE_TRIGGER_SOURCE,
} from "../../../packages/policy/src/index.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

function createDefaultConfig() {
  return {
    repoRoot: REPO_ROOT,
    slotRegistryPath: resolve(
      REPO_ROOT,
      "packages/research/manifests/slot-registry.json",
    ),
    storePath: resolve(REPO_ROOT, "apps/api/data/runtime-store.json"),
    xstocksBaseUrl:
      process.env.XSTOCKS_API_BASE_URL ?? "https://api.xstocks.fi/api/v2",
  };
}

function getFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return undefined;
  }

  return argv[flagIndex + 1];
}

function hasFlag(argv, flagName) {
  return argv.includes(flagName);
}

function buildCommandReport(command, records) {
  const runtimeOwners = [...new Set(records.map((record) => record.runtimeOwner))];

  return {
    status: "ok",
    command,
    runtimeOwner: runtimeOwners.length === 1 ? runtimeOwners[0] : null,
    records: records.map((record) => ({
      slotId: record.slotId,
      targetManifestId: record.targetManifestId,
      baselineManifestId: record.baselineManifestId,
      state: record.state,
      runtimeOwner: record.runtimeOwner,
      triggerSource: record.triggerSource,
      scheduledFor: record.scheduledFor,
      summary: record.summary,
      rationale: record.rationale,
      updatedAt: record.updatedAt,
    })),
  };
}

export function parseRebalanceOrchestratorArgs(argv = process.argv.slice(2)) {
  const firstArg = argv[0];
  const command =
    firstArg && !firstArg.startsWith("--") ? firstArg : "evaluate";

  return {
    command,
    selector: {
      slotId: getFlagValue(argv, "--slot"),
      manifestId: getFlagValue(argv, "--manifest"),
    },
    triggerSource:
      getFlagValue(argv, "--trigger") ??
      REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
    nextState: getFlagValue(argv, "--state"),
    scheduledFor: getFlagValue(argv, "--schedule-at"),
    note: getFlagValue(argv, "--note"),
    resume: hasFlag(argv, "--resume"),
  };
}

function createRepositories(overrides = {}) {
  const config = {
    ...createDefaultConfig(),
    ...overrides,
  };

  return {
    manifestRepository:
      overrides.manifestRepository ??
      createResearchManifestRepository({
        repoRoot: config.repoRoot,
        slotRegistryPath: config.slotRegistryPath,
      }),
    liveStateRepository:
      overrides.liveStateRepository ??
      createLiveStateRepository({
        baseUrl: config.xstocksBaseUrl,
        fetchImpl: overrides.fetchImpl,
      }),
    runtimeStore:
      overrides.runtimeStore ??
      createRuntimeStore({
        storePath: config.storePath,
        now: overrides.now,
      }),
    now: overrides.now ?? (() => new Date().toISOString()),
  };
}

export function createRebalanceOrchestrator(overrides = {}) {
  const {
    manifestRepository,
    liveStateRepository,
    runtimeStore,
    now,
  } = createRepositories(overrides);
  const smartAccountProvider = createSmartAccountProviderScaffold();

  function deriveBoundaryPayload({
    manifest,
    liveXStocksState,
    liveRouteState,
    requestedNotionalUsd,
    walletState,
  }) {
    const normalizedWalletState = normalizeWalletState(walletState);
    const normalizedRequestedNotionalUsd = normalizeUsd(requestedNotionalUsd, 0);
    const recommendation = deriveRecommendation({
      activation_manifest: manifest,
      live_xstocks_state: liveXStocksState,
      live_route_state: liveRouteState,
      user_notional_usd: normalizedRequestedNotionalUsd,
      wallet_state: normalizedWalletState,
    });
    const executionPlan = deriveExecutionPlan({
      activation_manifest: manifest,
      live_xstocks_state: liveXStocksState,
      live_route_state: liveRouteState,
      user_notional_usd: normalizedRequestedNotionalUsd,
      wallet_state: normalizedWalletState,
      smartAccountProvider,
    });

    return {
      recommendation,
      executionPlan,
      walletState: normalizedWalletState,
      requestedNotionalUsd: normalizedRequestedNotionalUsd,
    };
  }

  async function resolveRecords(selector = {}) {
    const { slotId, manifestId } = selector;

    if (manifestId) {
      const record = await manifestRepository.getPromotedRecordById(manifestId);
      if (!record) {
        throw new Error(`Promoted manifest ${manifestId} was not found.`);
      }

      return [record];
    }

    if (slotId) {
      const record = await manifestRepository.getPromotedRecordBySlot(slotId);
      if (!record) {
        throw new Error(`No promoted manifest was found for slot ${slotId}.`);
      }

      return [record];
    }

    return manifestRepository.listPromotedRecords();
  }

  async function evaluateRecord(
    record,
    {
      triggerSource = REBALANCE_TRIGGER_SOURCE.OPERATOR_MANUAL,
      scheduledFor = null,
      resume = false,
    } = {},
  ) {
    const manifest = record.manifest;
    const { liveXStocksState, liveRouteState } =
      await liveStateRepository.loadBoundaryState({ manifest });
    const [activations, latestRebalance] = await Promise.all([
      runtimeStore.listActivations({ slotId: manifest.slotId }),
      runtimeStore.getLatestRebalance({ slotId: manifest.slotId }),
    ]);
    const latestActivation = activations[0] ?? null;
    const boundaryPayload = deriveBoundaryPayload({
      manifest,
      liveXStocksState,
      liveRouteState,
      requestedNotionalUsd:
        latestActivation?.requestedNotionalUsd ??
        manifest.walletRequirements.minFundingUsd,
      walletState: latestActivation?.walletState ?? {},
    });
    const rebalance = deriveRebalanceOrchestration({
      activation_manifest: manifest,
      recommendation: boundaryPayload.recommendation,
      execution_plan: boundaryPayload.executionPlan,
      latest_activation: latestActivation,
      latest_rebalance: latestRebalance,
      trigger_source: triggerSource,
      scheduled_for: scheduledFor,
      now: now(),
      resume,
    });

    return runtimeStore.upsertRebalance({
      rebalance,
      eventType: resume ? "resume_evaluation" : "evaluation",
    });
  }

  async function evaluate(selector = {}, options = {}) {
    const records = await resolveRecords(selector);
    return Promise.all(
      records.map((record) => evaluateRecord(record, options)),
    );
  }

  async function transition(selector = {}, options = {}) {
    const nextState = options.nextState;

    if (!nextState) {
      throw new Error(
        "A target rebalance state is required. Use --state with transition.",
      );
    }

    if (!selector.slotId && !selector.manifestId) {
      throw new Error(
        "Transitions require --slot or --manifest so the worker updates one orchestration record at a time.",
      );
    }

    const [record] = await resolveRecords(selector);
    const manifest = record.manifest;
    const { liveXStocksState, liveRouteState } =
      await liveStateRepository.loadBoundaryState({ manifest });
    const [activations, latestRebalance] = await Promise.all([
      runtimeStore.listActivations({ slotId: manifest.slotId }),
      runtimeStore.getLatestRebalance({ slotId: manifest.slotId }),
    ]);
    const latestActivation = activations[0] ?? null;
    const boundaryPayload = deriveBoundaryPayload({
      manifest,
      liveXStocksState,
      liveRouteState,
      requestedNotionalUsd:
        latestActivation?.requestedNotionalUsd ??
        manifest.walletRequirements.minFundingUsd,
      walletState: latestActivation?.walletState ?? {},
    });
    const currentRebalance =
      latestRebalance ??
      deriveRebalanceOrchestration({
        activation_manifest: manifest,
        recommendation: boundaryPayload.recommendation,
        execution_plan: boundaryPayload.executionPlan,
        latest_activation: latestActivation,
        trigger_source: options.triggerSource,
        now: now(),
      });
    const transitionedRebalance = applyRebalanceTransition({
      current_rebalance: currentRebalance,
      next_state: nextState,
      trigger_source: options.triggerSource,
      scheduled_for: options.scheduledFor,
      note: options.note,
      now: now(),
    });

    return [
      await runtimeStore.upsertRebalance({
        rebalance: transitionedRebalance,
        eventType: `transition:${nextState}`,
      }),
    ];
  }

  return {
    async evaluate(selector = {}, options = {}) {
      return evaluate(selector, options);
    },
    async resume(selector = {}, options = {}) {
      return evaluate(selector, {
        ...options,
        resume: true,
      });
    },
    async transition(selector = {}, options = {}) {
      return transition(selector, options);
    },
  };
}

export async function runRebalanceOrchestrator(
  parsedArgs = parseRebalanceOrchestratorArgs(),
  overrides = {},
) {
  const orchestrator = createRebalanceOrchestrator(overrides);
  const selector = {
    manifestId: parsedArgs.selector?.manifestId,
    slotId: parsedArgs.selector?.slotId,
  };
  const options = {
    triggerSource: parsedArgs.triggerSource,
    nextState: parsedArgs.nextState,
    scheduledFor: parsedArgs.scheduledFor,
    note: parsedArgs.note,
    resume: parsedArgs.resume,
  };

  let records;

  if (parsedArgs.command === "transition") {
    records = await orchestrator.transition(selector, options);
  } else if (parsedArgs.command === "resume" || parsedArgs.resume) {
    records = await orchestrator.resume(selector, options);
  } else {
    records = await orchestrator.evaluate(selector, options);
  }

  const report = buildCommandReport(parsedArgs.command, records);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await runRebalanceOrchestrator();
}
