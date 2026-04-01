import { generateKeyPairSync, sign as signJwtPayload } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  adaptResearchPromotedManifest,
  createActivationManifestRef,
  deriveExecutionPlan,
  deriveRecommendation,
} from "../../../packages/policy/src/index.js";
import { createApiServer } from "../../api/src/server.js";
import { createLiveStateRepository } from "../../api/src/repositories/live-state-repository.js";
import { createResearchManifestRepository } from "../../api/src/repositories/research-manifest-repository.js";
import { createRuntimeStore } from "../../api/src/repositories/runtime-store.js";
import { createRebalanceOrchestrator } from "./rebalance-orchestrator.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKER_ROOT = resolve(CURRENT_DIR, "..");
const REPO_ROOT = resolve(WORKER_ROOT, "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const DEFAULT_SLOT_ID = "onboarding.default_basket";
const DEFAULT_NOTIONAL_USD = 1000;
const TEST_PRIVY_APP_ID = "privy-rebalance-proof-app";
const TEST_PRIVY_APP_SECRET = "privy-rebalance-proof-secret";
const TEST_WALLET_ADDRESS = "0x1111111111111111111111111111111111111111";
const TEST_SMART_WALLET_ADDRESS =
  "0x2222222222222222222222222222222222222222";

function formatTimestampForPath(value) {
  return String(value).replace(/[:.]/g, "-");
}

function createDefaultStartTime() {
  return new Date(Date.now() - 60_000).toISOString();
}

function createSequenceClock(startIso = createDefaultStartTime()) {
  let currentMs = new Date(startIso).getTime();

  return () => {
    const iso = new Date(currentMs).toISOString();
    currentMs += 1000;
    return iso;
  };
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signEs256Jwt({ privateKey, kid, payload }) {
  const encodedHeader = encodeBase64UrlJson({
    alg: "ES256",
    kid,
    typ: "JWT",
  });
  const encodedPayload = encodeBase64UrlJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signJwtPayload("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${signature.toString("base64url")}`;
}

function parseFlagValue(argv, flagName) {
  const index = argv.indexOf(flagName);

  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

function jsonHeaders(headers = {}) {
  return {
    "Content-Type": "application/json",
    ...headers,
  };
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function createReadyWalletState(walletAddress, smartWalletAddress, fundedNotionalUsd) {
  return {
    walletConnected: true,
    walletAddress,
    fundedNotionalUsd,
    smartAccount: {
      status: "ready",
      address: smartWalletAddress,
    },
  };
}

function collectEnvAudit() {
  return {
    privyAppId: Boolean(process.env.PRIVY_APP_ID ?? process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    privyAppSecret: Boolean(process.env.PRIVY_APP_SECRET),
    privyJwksUrl: Boolean(process.env.PRIVY_JWKS_URL),
    ethereumRpcUrl: Boolean(process.env.ETHEREUM_RPC_URL),
    xstocksApiBaseUrl: Boolean(process.env.XSTOCKS_API_BASE_URL),
    cowApiBaseUrl: Boolean(process.env.COW_API_BASE_URL),
  };
}

async function writeJsonArtifact(artifactDir, name, payload) {
  const path = resolve(artifactDir, name);
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path;
}

async function writeTextArtifact(artifactDir, name, content) {
  const path = resolve(artifactDir, name);
  await writeFile(path, content, "utf8");
  return path;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {
        raw: text,
      };
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
}

async function chooseBaselineManifest(slotId) {
  const promotedDir = resolve(
    REPO_ROOT,
    "packages",
    "research",
    "manifests",
    "promoted",
    slotId,
  );
  const entries = await readdir(promotedDir);
  const baselineFiles = entries
    .filter((entry) => entry.endsWith(".json") && /baseline/i.test(entry))
    .sort();

  if (baselineFiles.length === 0) {
    throw new Error(`No historical baseline manifest exists for slot ${slotId}.`);
  }

  const path = resolve(promotedDir, baselineFiles.at(-1));
  const raw = JSON.parse(readFileSync(path, "utf8"));

  return {
    path,
    manifest: adaptResearchPromotedManifest(raw),
  };
}

async function createLocalPrivyProofHarness({ now }) {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const kid = "privy-rebalance-proof-key";
  const exportedJwk = publicKey.export({ format: "jwk" });
  const authenticatedAt = now();
  const nowSeconds = Math.floor(new Date(authenticatedAt).getTime() / 1000);
  const jwks = {
    keys: [
      {
        ...exportedJwk,
        kid,
        alg: "ES256",
        use: "sig",
      },
    ],
  };

  const accessToken = signEs256Jwt({
    privateKey,
    kid,
    payload: {
      iss: "privy.io",
      aud: TEST_PRIVY_APP_ID,
      sub: "did:privy:manual_rebalance_proof",
      sid: "session_manual_rebalance_proof",
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    },
  });
  const identityToken = signEs256Jwt({
    privateKey,
    kid,
    payload: {
      iss: "privy.io",
      aud: TEST_PRIVY_APP_ID,
      sub: "did:privy:manual_rebalance_proof",
      sid: "session_manual_rebalance_proof",
      iat: nowSeconds,
      exp: nowSeconds + 3600,
      linked_accounts: JSON.stringify([
        {
          type: "wallet",
          chain_type: "ethereum",
          address: TEST_WALLET_ADDRESS,
          wallet_client_type: "privy",
        },
        {
          type: "smart_wallet",
          address: TEST_SMART_WALLET_ADDRESS,
          smart_wallet_type: "safe",
        },
      ]),
    },
  });

  const userResponse = {
    id: "did:privy:manual_rebalance_proof",
    created_at: Date.parse(authenticatedAt),
    has_accepted_terms: true,
    is_guest: false,
    linked_accounts: [
      {
        type: "wallet",
        chain_type: "ethereum",
        address: TEST_WALLET_ADDRESS,
        wallet_client_type: "privy",
      },
      {
        type: "smart_wallet",
        address: TEST_SMART_WALLET_ADDRESS,
        smart_wallet_type: "safe",
      },
    ],
    mfa_methods: [],
  };
  const expectedAuthorization = `Basic ${Buffer.from(
    `${TEST_PRIVY_APP_ID}:${TEST_PRIVY_APP_SECRET}`,
  ).toString("base64")}`;

  const server = createHttpServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/jwks") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(`${JSON.stringify(jwks)}\n`);
      return;
    }

    if (
      request.method === "GET" &&
      url.pathname === "/v1/users/did%3Aprivy%3Amanual_rebalance_proof"
    ) {
      const authorization = request.headers.authorization ?? "";
      const appIdHeader = request.headers["privy-app-id"] ?? "";

      if (
        authorization !== expectedAuthorization ||
        appIdHeader !== TEST_PRIVY_APP_ID
      ) {
        response.statusCode = 401;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(`${JSON.stringify({ error: "unauthorized" })}\n`);
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(`${JSON.stringify(userResponse)}\n`);
      return;
    }

    response.statusCode = 404;
    response.end();
  });

  await new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    proofMode: "local_jwks_harness",
    appId: TEST_PRIVY_APP_ID,
    appSecret: TEST_PRIVY_APP_SECRET,
    apiBaseUrl: baseUrl,
    jwksUrl: `${baseUrl}/jwks`,
    walletAddress: TEST_WALLET_ADDRESS,
    smartWalletAddress: TEST_SMART_WALLET_ADDRESS,
    accessToken,
    identityToken,
    headers({ includeIdentityToken = true } = {}) {
      return {
        Authorization: `Bearer ${accessToken}`,
        ...(includeIdentityToken
          ? {
              "X-Privy-Identity-Token": identityToken,
            }
          : {}),
      };
    },
    owner() {
      return {
        providerId: "privy",
        appId: TEST_PRIVY_APP_ID,
        userId: "did:privy:manual_rebalance_proof",
        sessionId: "session_manual_rebalance_proof",
        issuer: "privy.io",
        authenticatedAt,
      };
    },
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

function summarizeQuoteAttempt(leg, response) {
  if (!response?.payload?.data?.executionRequest) {
    return {
      legId: leg.legId,
      assetSymbol: leg.assetSymbol ?? null,
      status: response?.status ?? null,
      ok: response?.ok ?? false,
      error: response?.payload?.error ?? null,
      blockerCode: response?.payload?.details?.blockerCode ?? null,
      quoteId: null,
      resultingState: null,
    };
  }

  const latestLeg =
    response.payload.data.executionRequest.legs.find(
      (item) => item.legId === leg.legId,
    ) ?? null;

  return {
    legId: leg.legId,
    assetSymbol: leg.assetSymbol ?? null,
    status: response.status,
    ok: response.ok,
    error: response.payload?.error ?? null,
    blockerCode: response.payload?.details?.blockerCode ?? null,
    quoteId: latestLeg?.quote?.quoteId ?? null,
    resultingState: latestLeg?.state ?? null,
  };
}

function buildSummaryMarkdown(summary) {
  const lines = [
    "# Manual Rebalance Proof Summary",
    "",
    `- Slot: \`${summary.slotId}\``,
    `- Current manifest: \`${summary.currentManifestId}\``,
    `- Baseline manifest: \`${summary.baselineManifestId}\``,
    `- Requested notional USD: \`${summary.requestedNotionalUsd}\``,
    `- Proof mode: \`${summary.proofMode}\``,
    "",
    "## Boundaries Reached",
    "",
    `- Review opened: \`${summary.boundaries.reviewOpened}\``,
    `- Execution request created: \`${summary.boundaries.executionRequestCreated}\``,
    `- Quote ready: \`${summary.boundaries.quoteReady}\``,
    `- Awaiting approval: \`${summary.boundaries.awaitingApproval}\``,
    `- Signed submission: \`${summary.boundaries.signedSubmission}\``,
    `- Receipt confirmed: \`${summary.boundaries.receiptConfirmed}\``,
    "",
    "## Live Proof",
    "",
    `- xStocks live boundary loaded: \`${summary.liveProof.xstocksBoundaryLoaded}\``,
    `- CoW live quotes attempted: \`${summary.liveProof.quoteAttempts}\``,
    `- Quote ids: \`${summary.liveProof.quoteIds.join(", ") || "none"}\``,
    `- Order uids: \`${summary.liveProof.orderUids.join(", ") || "none"}\``,
    `- Tx hashes: \`${summary.liveProof.txHashes.join(", ") || "none"}\``,
    "",
    "## Blocker",
    "",
    `- Code: \`${summary.blocker.code}\``,
    `- Detail: ${summary.blocker.detail}`,
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function findPendingLeg(executionRequest) {
  return executionRequest.legs.find((leg) => leg.state === "pending") ?? null;
}

function findAwaitingApprovalLeg(executionRequest) {
  return (
    executionRequest.legs.find((leg) => leg.state === "awaiting_approval") ??
    null
  );
}

function findBlockedLeg(executionRequest) {
  return (
    executionRequest?.legs.find(
      (leg) => leg.state === "blocked" || leg.state === "failed",
    ) ?? null
  );
}

function summarizeExecutionLegStates(executionRequest) {
  const counts = {
    pending: 0,
    awaitingApproval: 0,
    blocked: 0,
    failed: 0,
    confirmed: 0,
    submitted: 0,
    deferred: 0,
  };

  for (const leg of executionRequest?.legs ?? []) {
    if (leg.state === "pending") {
      counts.pending += 1;
    } else if (leg.state === "awaiting_approval") {
      counts.awaitingApproval += 1;
    } else if (leg.state === "blocked") {
      counts.blocked += 1;
    } else if (leg.state === "failed") {
      counts.failed += 1;
    } else if (leg.state === "confirmed") {
      counts.confirmed += 1;
    } else if (leg.state === "submitted") {
      counts.submitted += 1;
    } else if (leg.state === "deferred") {
      counts.deferred += 1;
    }
  }

  return counts;
}

function buildExecutionBlocker(executionRequest) {
  const blockedLeg = findBlockedLeg(executionRequest);

  if (blockedLeg) {
    return {
      code: `${blockedLeg.state}_execution_leg`,
      detail:
        blockedLeg.blockers?.[0] ??
        `Execution leg ${blockedLeg.legId} entered ${blockedLeg.state}.`,
      legId: blockedLeg.legId,
      assetSymbol: blockedLeg.assetSymbol ?? null,
      executionRequestState: executionRequest?.state ?? null,
    };
  }

  if ((executionRequest?.blockers?.length ?? 0) > 0) {
    return {
      code: "blocked_execution_request",
      detail: executionRequest.blockers[0],
      legId: null,
      assetSymbol: null,
      executionRequestState: executionRequest?.state ?? null,
    };
  }

  return null;
}

export function parseManualRebalanceProofArgs(
  argv = process.argv.slice(2),
) {
  return {
    slotId: parseFlagValue(argv, "--slot") ?? DEFAULT_SLOT_ID,
    requestedNotionalUsd: Number(
      parseFlagValue(argv, "--notional") ?? DEFAULT_NOTIONAL_USD,
    ),
    artifactDir: parseFlagValue(argv, "--artifact-dir"),
    scheduleAt: parseFlagValue(argv, "--schedule-at"),
    submissionSignature:
      parseFlagValue(argv, "--signature") ??
      process.env.XSTOCKS_MANUAL_REBALANCE_SIGNATURE ??
      null,
  };
}

export async function runManualRebalanceProof(options = {}) {
  const slotId = options.slotId ?? DEFAULT_SLOT_ID;
  const requestedNotionalUsd = Number(
    options.requestedNotionalUsd ?? DEFAULT_NOTIONAL_USD,
  );
  const now = options.now ?? createSequenceClock();
  const timestamp = formatTimestampForPath(now());
  const artifactDir =
    options.artifactDir ??
    resolve(REPO_ROOT, "tmp", "proof", `manual-rebalance-${timestamp}`);
  const submissionSignature = options.submissionSignature ?? null;
  const envAudit = collectEnvAudit();

  await mkdir(artifactDir, { recursive: true });

  const authHarness = options.authHarness ?? (await createLocalPrivyProofHarness({ now }));
  const manifestRepository =
    options.manifestRepository ??
    createResearchManifestRepository({
      repoRoot: REPO_ROOT,
      slotRegistryPath: SLOT_REGISTRY_PATH,
    });
  const currentRecord = await manifestRepository.getPromotedRecordBySlot(slotId);

  if (!currentRecord) {
    throw new Error(`No promoted record exists for slot ${slotId}.`);
  }

  const baselineSelection =
    options.baselineManifest ??
    (await chooseBaselineManifest(slotId));
  const baselineManifest =
    baselineSelection.manifest ?? baselineSelection;
  const liveStateRepository =
    options.liveStateRepository ?? createLiveStateRepository({});
  const currentBoundaryState = await liveStateRepository.loadBoundaryState({
    manifest: currentRecord.manifest,
  });
  const baselineBoundaryState = await liveStateRepository.loadBoundaryState({
    manifest: baselineManifest,
  });
  const storePath = resolve(artifactDir, "runtime-store.json");
  const runtimeStore = createRuntimeStore({
    storePath,
    now,
  });
  const apiServer = createApiServer({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    liveStateRepository,
    cowExecutionClient: options.cowExecutionClient,
    ethereumRpcClient: options.ethereumRpcClient,
    privyAppId: authHarness.appId,
    privyAppSecret: authHarness.appSecret,
    privyJwksUrl: authHarness.jwksUrl,
    privyApiBaseUrl: authHarness.apiBaseUrl,
    now,
  });

  let serverBaseUrl = null;

  try {
    await new Promise((resolveListen) => {
      apiServer.listen(0, "127.0.0.1", resolveListen);
    });
    const address = apiServer.address();
    serverBaseUrl = `http://127.0.0.1:${address.port}`;

    const fundedNotionalUsd = Math.max(requestedNotionalUsd * 1.25, requestedNotionalUsd);
    const walletState = createReadyWalletState(
      authHarness.walletAddress,
      authHarness.smartWalletAddress,
      fundedNotionalUsd,
    );
    const baselineRecommendation = deriveRecommendation({
      activation_manifest: baselineManifest,
      live_xstocks_state: baselineBoundaryState.liveXStocksState,
      live_route_state: baselineBoundaryState.liveRouteState,
      user_notional_usd: requestedNotionalUsd,
      wallet_state: walletState,
    });
    const baselineExecutionPlan = deriveExecutionPlan({
      activation_manifest: baselineManifest,
      live_xstocks_state: baselineBoundaryState.liveXStocksState,
      live_route_state: baselineBoundaryState.liveRouteState,
      user_notional_usd: requestedNotionalUsd,
      wallet_state: walletState,
    });
    const baselineActivation = {
      activationId: `activation_baseline_${timestamp}`,
      owner: authHarness.owner(),
      chain: baselineManifest.chain,
      manifestId: baselineManifest.manifestId,
      slotId: baselineManifest.slotId,
      recommendationId: baselineRecommendation.recommendationId,
      activationManifestRef: createActivationManifestRef(baselineManifest),
      requestedNotionalUsd,
      surfaceTruth: baselineExecutionPlan.surfaceTruth,
      status:
        baselineExecutionPlan.executionState === "ready" &&
        baselineExecutionPlan.executionEligibility === "executable"
          ? "ready"
          : baselineExecutionPlan.executionState,
      createdAt: now(),
      updatedAt: now(),
      walletState,
      routeTruthLabels: baselineExecutionPlan.routeTruthLabels,
      executionPlanSnapshot: baselineExecutionPlan,
    };

    await runtimeStore.appendActivation({
      activation: baselineActivation,
      activityEvents: [],
    });

    const orchestrator = createRebalanceOrchestrator({
      manifestRepository,
      liveStateRepository,
      runtimeStore,
      now,
    });
    const [scheduledRebalance] = await orchestrator.evaluate(
      { slotId },
      {
        triggerSource: "scheduled_cron",
        scheduledFor: options.scheduleAt ?? now(),
      },
    );
    const reviewRebalance =
      scheduledRebalance.state === "scheduled" ||
      scheduledRebalance.state === "rebalance_recommended"
        ? (
            await orchestrator.transition(
              { slotId },
              {
                nextState: "awaiting_operator",
                triggerSource: "operator_manual",
                note: "Operator opened manual rebalance proof review.",
              },
            )
          )[0]
        : scheduledRebalance;

    const workspaceResponse = await fetchJson(
      `${serverBaseUrl}/api/workspace?slotId=${encodeURIComponent(
        slotId,
      )}&userNotionalUsd=${requestedNotionalUsd}`,
      {
        headers: authHarness.headers(),
      },
    );
    const activityResponse = await fetchJson(
      `${serverBaseUrl}/api/activity?slotId=${encodeURIComponent(slotId)}`,
      {
        headers: authHarness.headers(),
      },
    );
    const activationCreateResponse = await fetchJson(
      `${serverBaseUrl}/api/activations`,
      {
        method: "POST",
        headers: jsonHeaders(authHarness.headers()),
        body: JSON.stringify({
          manifestId: currentRecord.manifest.manifestId,
          userNotionalUsd: requestedNotionalUsd,
          walletState,
        }),
      },
    );

    if (activationCreateResponse.status !== 201) {
      const blocker = {
        code: "missing_live_auth_context",
        detail:
          activationCreateResponse.payload?.error ??
          "Activation could not be created through the authenticated API boundary.",
      };

      const summary = {
        slotId,
        currentManifestId: currentRecord.manifest.manifestId,
        baselineManifestId: baselineManifest.manifestId,
        requestedNotionalUsd,
        proofMode: authHarness.proofMode,
        artifactDir,
        boundaries: {
          reviewOpened: reviewRebalance.state === "awaiting_operator",
          executionRequestCreated: false,
          quoteReady: false,
          awaitingApproval: false,
          signedSubmission: false,
          receiptConfirmed: false,
        },
        liveProof: {
          xstocksBoundaryLoaded: true,
          quoteAttempts: 0,
          quoteIds: [],
          orderUids: [],
          txHashes: [],
        },
        blocker,
      };

      await writeJsonArtifact(artifactDir, "summary.json", summary);
      await writeTextArtifact(
        artifactDir,
        "summary.md",
        buildSummaryMarkdown(summary),
      );
      return summary;
    }

    const activationPayload = activationCreateResponse.payload.data;
    const currentExecutionPlan = activationPayload.executionPlan ?? null;
    const executionCreateResponse = await fetchJson(
      `${serverBaseUrl}/api/executions`,
      {
        method: "POST",
        headers: jsonHeaders(authHarness.headers({ includeIdentityToken: false })),
        body: JSON.stringify({
          action: "create",
          activationId: activationPayload.activation.activationId,
        }),
      },
    );

    let latestExecutionRequest =
      executionCreateResponse.payload?.data?.executionRequest ?? null;
    const quoteAttemptSummaries = [];
    const quoteIds = [];
    const awaitingApprovalLegIds = [];
    const orderUids = [];
    const txHashes = [];
    let blocker = null;
    let submissionResponse = null;
    let awaitingApprovalReached = false;

    while (latestExecutionRequest) {
      const pendingLeg = findPendingLeg(latestExecutionRequest);

      if (!pendingLeg) {
        break;
      }

      const quoteResponse = await fetchJson(`${serverBaseUrl}/api/executions`, {
        method: "POST",
        headers: jsonHeaders(
          authHarness.headers({
            includeIdentityToken: false,
          }),
        ),
        body: JSON.stringify({
          action: "quote_leg",
          executionRequestId: latestExecutionRequest.executionRequestId,
          legId: pendingLeg.legId,
        }),
      });
      quoteAttemptSummaries.push(summarizeQuoteAttempt(pendingLeg, quoteResponse));

      if (!quoteResponse.ok) {
        blocker = {
          code: quoteResponse.payload?.details?.blockerCode ?? "missing_quoteability",
          detail:
            quoteResponse.payload?.error ??
            "A live CoW quote could not be prepared for the candidate rebalance leg.",
        };
        break;
      }

      latestExecutionRequest = quoteResponse.payload.data.executionRequest;
      const quotedLeg =
        latestExecutionRequest.legs.find((item) => item.legId === pendingLeg.legId) ??
        null;

      if (quotedLeg?.quote?.quoteId) {
        quoteIds.push(quotedLeg.quote.quoteId);
      }

      const quotedAwaitingApprovalLeg =
        findAwaitingApprovalLeg(latestExecutionRequest);

      if (quotedAwaitingApprovalLeg) {
        awaitingApprovalReached = true;
        awaitingApprovalLegIds.push(quotedAwaitingApprovalLeg.legId);
      }

      const executionBlocker = buildExecutionBlocker(latestExecutionRequest);

      if (executionBlocker) {
        blocker = executionBlocker;
        break;
      }
    }

    const awaitingApprovalLeg =
      !blocker &&
      latestExecutionRequest?.state === "awaiting_approval"
        ? findAwaitingApprovalLeg(latestExecutionRequest)
        : null;

    if (!blocker && latestExecutionRequest && awaitingApprovalLeg) {
      if (!submissionSignature) {
        blocker = {
          code: "missing_user_approval",
          detail:
            "All actionable CoW legs reached awaiting_approval, but no explicit EIP-712 signature was supplied for live submission.",
        };
      } else {
        submissionResponse = await fetchJson(`${serverBaseUrl}/api/executions`, {
          method: "POST",
          headers: jsonHeaders(authHarness.headers()),
          body: JSON.stringify({
            action: "record_submission",
            executionRequestId: latestExecutionRequest.executionRequestId,
            legId: awaitingApprovalLeg.legId,
            signature: submissionSignature,
          }),
        });

        if (!submissionResponse.ok) {
          blocker = {
            code:
              submissionResponse.payload?.details?.blockerCode ??
              "missing_signed_submission",
            detail:
              submissionResponse.payload?.error ??
              "The live CoW submission attempt did not succeed.",
          };
        } else {
          latestExecutionRequest = submissionResponse.payload.data.executionRequest;
          const submittedLeg =
            latestExecutionRequest.legs.find(
              (item) => item.legId === awaitingApprovalLeg.legId,
            ) ?? null;

          if (submittedLeg?.approval?.venueOrderId) {
            orderUids.push(submittedLeg.approval.venueOrderId);
          }
          if (submittedLeg?.receipt?.txHash) {
            txHashes.push(submittedLeg.receipt.txHash);
          }

          if (submittedLeg?.receipt?.receiptStatus !== "confirmed") {
            blocker = {
              code: "missing_settlement_receipt",
              detail:
                "A live signed submission was recorded, but no confirmed settlement receipt was returned in this proof run.",
            };
          }
        }
      }
    }

    if (!blocker && latestExecutionRequest) {
      blocker = buildExecutionBlocker(latestExecutionRequest);
    }

    if (!blocker) {
      blocker = {
        code: "missing_quoteability",
        detail:
          "The proof run did not advance to awaiting approval and did not return a more specific blocker.",
      };
    }

    const summary = {
      slotId,
      currentManifestId: currentRecord.manifest.manifestId,
      baselineManifestId: baselineManifest.manifestId,
      requestedNotionalUsd,
      proofMode: authHarness.proofMode,
      artifactDir,
      envAudit,
      currentManifest: {
        manifestId: currentRecord.manifest.manifestId,
        strategyVersion: currentRecord.manifest.strategyVersion,
      },
      baselineManifest: {
        manifestId: baselineManifest.manifestId,
        strategyVersion: baselineManifest.strategyVersion,
        sourcePath: baselineSelection.path ?? null,
      },
      executionPrerequisites: {
        activationBaseline: {
          activationId: baselineActivation.activationId,
          manifestId: baselineActivation.manifestId,
          status: baselineActivation.status,
          executionState:
            baselineActivation.executionPlanSnapshot?.executionState ?? null,
          executionEligibility:
            baselineActivation.executionPlanSnapshot?.executionEligibility ?? null,
        },
        rebalancePath: {
          scheduledState: scheduledRebalance.state,
          reviewState: reviewRebalance.state,
          targetManifestId: reviewRebalance.targetManifestId,
          baselineManifestId: reviewRebalance.baselineManifestId,
          triggerSource: reviewRebalance.triggerSource,
        },
        currentActivation: {
          activationId: activationPayload.activation.activationId,
          status: activationPayload.activation.status,
          surfaceTruth: currentExecutionPlan?.surfaceTruth ?? null,
          executionState: currentExecutionPlan?.executionState ?? null,
          executionEligibility: currentExecutionPlan?.executionEligibility ?? null,
        },
        authOwnership: {
          mode: authHarness.proofMode,
          ownerUserId: activationPayload.activation.owner?.userId ?? null,
          providerId: activationPayload.activation.owner?.providerId ?? null,
          walletAddress: authHarness.walletAddress,
          smartWalletAddress: authHarness.smartWalletAddress,
          livePrivyEnvPresent:
            envAudit.privyAppId &&
            envAudit.privyAppSecret &&
            envAudit.privyJwksUrl,
        },
        quoteability: {
          initialExecutionRequestState:
            executionCreateResponse.payload?.data?.executionRequest?.state ?? null,
          latestExecutionRequestState: latestExecutionRequest?.state ?? null,
          legStates: summarizeExecutionLegStates(latestExecutionRequest),
        },
      },
      authBoundary: {
        mode: authHarness.proofMode,
        livePrivyEnvPresent:
          envAudit.privyAppId &&
          envAudit.privyAppSecret &&
          envAudit.privyJwksUrl,
        accessMode: "bearer_plus_identity_token",
      },
      boundaries: {
        reviewOpened: reviewRebalance.state === "awaiting_operator",
        executionRequestCreated: executionCreateResponse.status === 200,
        quoteReady: quoteIds.length > 0,
        awaitingApproval: awaitingApprovalReached,
        signedSubmission:
          latestExecutionRequest?.state === "submitted" ||
          latestExecutionRequest?.state === "confirmed" ||
          latestExecutionRequest?.state === "manual_followup_required",
        receiptConfirmed:
          latestExecutionRequest?.legs.some(
            (leg) => leg.receipt?.receiptStatus === "confirmed",
          ) ?? false,
      },
      candidatePath: {
        scheduledState: scheduledRebalance.state,
        reviewState: reviewRebalance.state,
        baselineActivationId: baselineActivation.activationId,
        currentActivationId: activationPayload.activation.activationId,
        executionRequestId:
          latestExecutionRequest?.executionRequestId ??
          executionCreateResponse.payload?.data?.executionRequest?.executionRequestId ??
          null,
      },
      liveProof: {
        xstocksBoundaryLoaded: true,
        quoteAttempts: quoteAttemptSummaries.length,
        quoteIds: uniqueStrings(quoteIds),
        awaitingApprovalLegIds: uniqueStrings(awaitingApprovalLegIds),
        orderUids: uniqueStrings(orderUids),
        txHashes: uniqueStrings(txHashes),
      },
      blocker,
    };

    const artifacts = [
      ["env-audit.json", envAudit],
      [
        "candidate-manifests.json",
        {
          slotId,
          currentManifestId: currentRecord.manifest.manifestId,
          baselineManifestId: baselineManifest.manifestId,
          baselinePath: baselineSelection.path ?? null,
        },
      ],
      ["baseline-activation.json", baselineActivation],
      ["rebalance-scheduled.json", scheduledRebalance],
      ["rebalance-awaiting-operator.json", reviewRebalance],
      ["workspace-candidate.json", workspaceResponse],
      ["activity-candidate.json", activityResponse],
      ["activation-current.json", activationCreateResponse],
      ["execution-prerequisites.json", summary.executionPrerequisites],
      ["execution-request-created.json", executionCreateResponse],
      ["quote-attempts.json", quoteAttemptSummaries],
      ["execution-request-latest.json", latestExecutionRequest],
      ["submission-response.json", submissionResponse],
      ["summary.json", summary],
    ];

    for (const [name, payload] of artifacts) {
      await writeJsonArtifact(artifactDir, name, payload);
    }
    await writeTextArtifact(
      artifactDir,
      "summary.md",
      buildSummaryMarkdown(summary),
    );

    return summary;
  } finally {
    await Promise.allSettled([
      new Promise((resolveClose, rejectClose) => {
        if (!serverBaseUrl) {
          resolveClose();
          return;
        }

        apiServer.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }

          resolveClose();
        });
      }),
      authHarness.close(),
    ]);
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const parsedArgs = parseManualRebalanceProofArgs();
  const summary = await runManualRebalanceProof(parsedArgs);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
