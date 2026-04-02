import test from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "../../../node_modules/.pnpm/node_modules/viem/_esm/accounts/index.js";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { adaptResearchPromotedManifest } from "../../../packages/policy/src/index.js";
import {
  CHAINLINK_CRE_ETH_JWT_ALGORITHM,
  computeChainlinkCreEventDigest,
} from "../../../packages/shared/src/rebalance-provider.js";
import { API_ENDPOINTS } from "../src/contracts.js";
import { createRuntimeStore } from "../src/repositories/runtime-store.js";
import { createApiServer } from "../src/server.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const SYNTHETIC_MANIFEST_ID = "test.synthetic_quoteable_basket:promoted";
const TEST_CHAINLINK_CRE_PRIVATE_KEY = `0x${"55".repeat(32)}`;
const TEST_CHAINLINK_CRE_WORKFLOW_ID = "cre_workflow_provider_test";
const TEST_CHAINLINK_CRE_ACCOUNT = privateKeyToAccount(
  TEST_CHAINLINK_CRE_PRIVATE_KEY,
);

async function loadResearchManifest(slotId) {
  const raw = await readFile(
    resolve(
      REPO_ROOT,
      `packages/research/manifests/promoted/${slotId}/current.json`,
    ),
    "utf8",
  );

  return adaptResearchPromotedManifest(JSON.parse(raw));
}

function createSyntheticExecutableBasketManifest(baseManifest) {
  const liveReadyBadges = [
    "validated_strategy",
    "promoted_manifest",
    "basket_live_ready",
  ];

  return {
    ...baseManifest,
    manifestId: "test.synthetic_quoteable_basket:promoted",
    slotId: "onboarding.default_basket",
    strategyVersion: "synthetic_quoteable_basket_v1",
    frontend: {
      ...baseManifest.frontend,
      title: "Synthetic Quoteable Basket",
      badges: liveReadyBadges,
    },
    targetAllocations: [
      {
        sleeve: "core_xstocks",
        targetWeightPct: 47.5,
        assetSymbol: "NVDAx",
      },
      {
        sleeve: "core_xstocks",
        targetWeightPct: 47.5,
        assetSymbol: "TSLAx",
      },
      {
        sleeve: "yield_buffer",
        targetWeightPct: 5,
        assetSymbol: "AUSD",
        venueId: "flowdesk_ausd_rwa_strategy",
      },
    ],
    requiredAssets: ["NVDAx", "TSLAx", "AUSD"],
    requiredRoutes: [
      {
        routeId: "cow_swap.ethereum",
        label: "Cow Swap on Ethereum",
        routeKind: "execution",
        requiredFor: "core_xstocks",
      },
      {
        routeId: "flowdesk.ausd-rwa-strategy",
        label: "Flowdesk AUSD RWA Strategy",
        routeKind: "vault",
        requiredFor: "yield_buffer",
      },
    ],
    executionBoundary: {
      ...baseManifest.executionBoundary,
      requiredAssets: ["NVDAx", "TSLAx", "AUSD"],
      requiredRoutes: [
        {
          routeId: "cow_swap.ethereum",
          label: "Cow Swap on Ethereum",
          routeKind: "execution",
          requiredFor: "core_xstocks",
        },
        {
          routeId: "flowdesk.ausd-rwa-strategy",
          label: "Flowdesk AUSD RWA Strategy",
          routeKind: "vault",
          requiredFor: "yield_buffer",
        },
      ],
    },
    routeValidation: {
      executionEligibility: "executable",
      surfaceTruth: "live",
      routeTruthLabels: [
        {
          routeId: "cow_swap.ethereum",
          label: "Cow Swap on Ethereum",
          routeKind: "execution",
          chain: "ethereum",
          verificationTier: "public_verified",
          truthState: "live",
          availability: "available",
          requiredFor: "core_xstocks",
          reason: "Synthetic test basket keeps only directly quoteable core legs.",
        },
        {
          routeId: "flowdesk.ausd-rwa-strategy",
          label: "Flowdesk AUSD RWA Strategy",
          routeKind: "vault",
          chain: "ethereum",
          verificationTier: "public_verified",
          truthState: "live",
          availability: "available",
          requiredFor: "yield_buffer",
          reason: "AUSD yield-buffer vault remains live.",
        },
      ],
      proofNotes: [
        "Synthetic test basket constrains core legs to direct-quoteable CoW symbols only.",
      ],
      validationBadges: liveReadyBadges,
    },
  };
}

async function createSyntheticManifestRepository() {
  const baseManifest = await loadResearchManifest("onboarding.default_basket");
  const manifest = createSyntheticExecutableBasketManifest(baseManifest);
  const slot = {
    slotId: manifest.slotId,
    mode: manifest.mode ?? "basket",
    currentManifestRef: {
      manifestId: manifest.manifestId,
    },
  };

  return {
    async getPromotedRecordBySlot(slotId) {
      return slotId === manifest.slotId ? { slot, manifest } : null;
    },
    async getPromotedRecordById(manifestId) {
      return manifestId === manifest.manifestId ? { slot, manifest } : null;
    },
    async listPromotedRecords() {
      return [{ slot, manifest }];
    },
  };
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function signChainlinkCreJwt({
  body,
  account = TEST_CHAINLINK_CRE_ACCOUNT,
  jti = `jti_${body.workflowExecutionId}`,
  issuedAt = "2026-04-01T18:00:00.000Z",
  expiresAt = "2026-04-01T18:04:00.000Z",
} = {}) {
  const encodedHeader = encodeBase64UrlJson({
    alg: CHAINLINK_CRE_ETH_JWT_ALGORITHM,
    kid: account.address,
    typ: "JWT",
  });
  const encodedPayload = encodeBase64UrlJson({
    digest: computeChainlinkCreEventDigest(body),
    iss: "chainlink-cre.test",
    iat: Math.floor(new Date(issuedAt).getTime() / 1000),
    exp: Math.floor(new Date(expiresAt).getTime() / 1000),
    jti,
    providerId: body.providerId,
    workflowId: body.workflowId,
    workflowExecutionId: body.workflowExecutionId,
    slotId: body.slotId,
    targetManifestId: body.targetManifestId,
    chain: body.chain,
  });
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await account.signMessage({
    message: signingInput,
  });

  return `${signingInput}.${Buffer.from(signature.slice(2), "hex").toString("base64url")}`;
}

function createStaticLiveStateRepository() {
  return {
    async loadBoundaryState({ manifest }) {
      return {
        liveXStocksState: {
          stateVersion: "provider-rebalance-test.xstocks.v1",
          asOf: "2026-04-01T18:00:00.000Z",
          assets: manifest.executionBoundary.requiredAssets.map((assetSymbol) => ({
            assetSymbol,
            chain: "ethereum",
            status: "active",
            priceUsd: assetSymbol === "AUSD" ? 1 : 100,
          })),
        },
        liveRouteState: {
          stateVersion: "provider-rebalance-test.routes.v1",
          asOf: "2026-04-01T18:00:00.000Z",
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
              notes: "Verified AUSD sleeve.",
            },
          ],
        },
      };
    },
    async fetchRequiredAssets(requiredAssets) {
      return requiredAssets.map((assetSymbol) => ({
        assetSymbol,
        asset: {
          deployments: [
            {
              network: "Ethereum",
              address: `0x1${assetSymbol.toLowerCase().padEnd(39, "0").slice(0, 39)}`,
              wrapperAddress: `0x2${assetSymbol.toLowerCase().padEnd(39, "0").slice(0, 39)}`,
              supportsAtomicSwaps: true,
              stablecoins: [
                {
                  symbol: "USDC",
                  network: "Ethereum",
                  address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
          ],
        },
      }));
    },
    async fetchAssetSnapshot(symbol) {
      return {
        assetSymbol: symbol,
        asset: {
          deployments: [
            {
              network: "Ethereum",
              address: "0x1111111111111111111111111111111111111111",
              wrapperAddress: "0x2222222222222222222222222222222222222222",
              supportsAtomicSwaps: true,
              stablecoins: [
                {
                  symbol: "USDC",
                  network: "Ethereum",
                  address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
          ],
        },
      };
    },
  };
}

function createStoredOwner(overrides = {}) {
  return {
    providerId: "privy",
    appId: "privy-app-test",
    userId: "did:privy:provider-test",
    sessionId: "session_provider_test",
    issuer: "privy.io",
    authenticatedAt: "2026-04-01T17:00:00.000Z",
    ...overrides,
  };
}

function createPrivyRequestContext(overrides = {}) {
  const owner = createStoredOwner(overrides.owner);

  return {
    owner,
    linkedWalletAddresses: [
      "0x1111111111111111111111111111111111111111",
      ...(overrides.linkedWalletAddresses ?? []),
    ],
    linkedEmbeddedWalletAddresses: [
      "0x2222222222222222222222222222222222222222",
      ...(overrides.linkedEmbeddedWalletAddresses ?? []),
    ],
    linkedSmartWalletAddresses: [
      "0x2222222222222222222222222222222222222222",
      ...(overrides.linkedSmartWalletAddresses ?? []),
    ],
    linkedAccounts: [],
    accessTokenSource: "provider-test",
    accessTokenVerified: true,
    identityTokenSource: null,
    identityTokenVerified: false,
    linkedAccountsSource: "provider-test",
    privyUserId: owner.userId,
  };
}

async function startProviderHarness({
  activationOwner = null,
  privyRequestContext = null,
} = {}) {
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-provider-rebalance-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const manifestRepository = await createSyntheticManifestRepository();
  const server = createApiServer({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    now: () => "2026-04-01T18:02:00.000Z",
    manifestRepository,
    liveStateRepository: createStaticLiveStateRepository(),
    chainlinkCreSignerAllowlist: [TEST_CHAINLINK_CRE_ACCOUNT.address],
    chainlinkCreWorkflowAllowlist: [TEST_CHAINLINK_CRE_WORKFLOW_ID],
    privyAuthService: privyRequestContext
      ? {
        async authenticateRequest() {
          return privyRequestContext;
        },
      }
      : null,
  });

  await new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const runtimeStore = createRuntimeStore({ storePath });
  await runtimeStore.appendActivation({
    activation: {
      activationId: "activation_provider_1",
      owner: activationOwner,
      chain: "ethereum",
      manifestId: "onboarding.default_basket:promoted:baseline_v1",
      slotId: "onboarding.default_basket",
      recommendationId: "recommendation_1",
      activationManifestRef: null,
      requestedNotionalUsd: 1000,
      surfaceTruth: "live",
      status: "ready",
      createdAt: "2026-04-01T17:00:00.000Z",
      updatedAt: "2026-04-01T17:00:00.000Z",
      walletState: {
        walletConnected: true,
        walletAddress: "0x1111111111111111111111111111111111111111",
        fundedNotionalUsd: 1250,
        smartAccount: {
          status: "ready",
          address: "0x2222222222222222222222222222222222222222",
        },
      },
      routeTruthLabels: [],
      executionPlanSnapshot: null,
    },
    activityEvents: [],
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  function createSignedRequest({
    overrides = {},
    jwtId = "provider_jti_1",
  } = {}) {
    const requestBody = {
      version: "1",
      providerId: "chainlink_cre",
      providerEventId: "delivery_1",
      workflowId: TEST_CHAINLINK_CRE_WORKFLOW_ID,
      workflowExecutionId: "workflow_exec_1",
      triggerType: "cron",
      chain: "ethereum",
      slotId: "onboarding.default_basket",
      triggeredAt: "2026-04-01T18:00:00.000Z",
      targetManifestId: SYNTHETIC_MANIFEST_ID,
      baselineManifestId: "onboarding.default_basket:promoted:baseline_v1",
      reviewReason: {
        kind: "manifest_drift",
        observedDriftBps: 425,
        thresholdBps: 300,
      },
      reviewIntent: {
        requestedState: "awaiting_operator",
        executionMode: "review_only",
      },
      ...overrides,
    };

    return {
      body: requestBody,
      tokenPromise: signChainlinkCreJwt({
        body: requestBody,
        jti: jwtId,
      }),
    };
  }

  return {
    baseUrl,
    runtimeStore,
    privyRequestContext,
    createSignedRequest,
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

test("provider rebalance ingress accepts a signed review-only event and opens awaiting_operator only", async () => {
  const harness = await startProviderHarness();

  try {
    const signedRequest = harness.createSignedRequest();
    const token = await signedRequest.tokenPromise;
    const response = await fetch(
      `${harness.baseUrl}${API_ENDPOINTS.CHAINLINK_CRE_PROVIDER_TRIGGERED_REVIEW}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(signedRequest.body),
      },
    );
    const payload = await response.json();
    const latestRebalance = await harness.runtimeStore.getLatestRebalance({
      slotId: "onboarding.default_basket",
    });
    const providerReceipts = await harness.runtimeStore.listProviderEventReceipts({
      slotId: "onboarding.default_basket",
      limit: 10,
    });
    const executionRequests = await harness.runtimeStore.listExecutionRequests();

    assert.equal(response.status, 200);
    assert.equal(payload.data.receipt.decision, "accepted");
    assert.equal(payload.data.rebalanceOrchestration.state, "awaiting_operator");
    assert.equal(payload.data.rebalanceOrchestration.triggerSource, "provider_triggered");
    assert.equal(
      payload.data.rebalanceOrchestration.automationTruth.providerTriggeredProven,
      true,
    );
    assert.equal(latestRebalance.state, "awaiting_operator");
    assert.equal(latestRebalance.triggerSource, "provider_triggered");
    assert.equal(
      latestRebalance.providerReceiptId,
      payload.data.rebalanceOrchestration.providerReceiptId,
    );
    assert.equal(providerReceipts.length, 1);
    assert.equal(providerReceipts[0].decision, "accepted");
    assert.equal(executionRequests.length, 0);
  } finally {
    await harness.close();
  }
});

test("execute_all stages provider-triggered review through canonical execution linkage", async () => {
  const harness = await startProviderHarness({
    activationOwner: createStoredOwner(),
    privyRequestContext: createPrivyRequestContext(),
  });

  try {
    const signedRequest = harness.createSignedRequest();
    const token = await signedRequest.tokenPromise;
    const providerResponse = await fetch(
      `${harness.baseUrl}${API_ENDPOINTS.CHAINLINK_CRE_PROVIDER_TRIGGERED_REVIEW}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(signedRequest.body),
      },
    );
    const providerPayload = await providerResponse.json();
    const executeAllResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "execute_all",
        activationId: "activation_provider_1",
      }),
    });
    const executeAllPayload = await executeAllResponse.json();
    const latestRebalance = await harness.runtimeStore.getLatestRebalance({
      slotId: "onboarding.default_basket",
    });
    const providerReceipts = await harness.runtimeStore.listProviderEventReceipts({
      slotId: "onboarding.default_basket",
      decision: "accepted",
      limit: 10,
    });
    const executionRequests = await harness.runtimeStore.listExecutionRequests({
      rebalanceId: latestRebalance.rebalanceId,
    });

    assert.equal(providerResponse.status, 200);
    assert.equal(executeAllResponse.status, 200);
    assert.equal(
      executeAllPayload.data.executionRequest.triggerSource,
      "provider_staging",
    );
    assert.equal(
      executeAllPayload.data.executionRequest.runtimeOwner,
      "operator_manual",
    );
    assert.equal(
      executeAllPayload.data.executionRequest.rebalanceId,
      latestRebalance.rebalanceId,
    );
    assert.equal(
      executeAllPayload.data.executionRequest.manifestId,
      providerPayload.data.rebalanceOrchestration.targetManifestId,
    );
    assert.equal(
      executeAllPayload.data.executionRequest.linkage.providerReceiptId,
      providerPayload.data.receipt.receiptId,
    );
    assert.equal(executionRequests.length, 1);
    assert.equal(providerReceipts.length, 1);
    assert.equal(
      latestRebalance.executionRequestId,
      executionRequests[0].executionRequestId,
    );
    assert.equal(latestRebalance.executionTriggerSource, "provider_staging");
    assert.equal(latestRebalance.executionRequestState, "requested");
    assert.equal(
      executionRequests[0].legs.every(
        (leg) =>
          leg.linkage.executionRequestId === executionRequests[0].executionRequestId
          && leg.linkage.providerReceiptId === providerPayload.data.receipt.receiptId,
      ),
      true,
    );
  } finally {
    await harness.close();
  }
});

test("execute_all fails closed when current session proof is missing", async () => {
  const harness = await startProviderHarness({
    activationOwner: createStoredOwner(),
    privyRequestContext: createPrivyRequestContext({
      owner: {
        sessionId: null,
      },
    }),
  });

  try {
    const signedRequest = harness.createSignedRequest();
    const token = await signedRequest.tokenPromise;
    const providerResponse = await fetch(
      `${harness.baseUrl}${API_ENDPOINTS.CHAINLINK_CRE_PROVIDER_TRIGGERED_REVIEW}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(signedRequest.body),
      },
    );
    const executeAllResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "execute_all",
        activationId: "activation_provider_1",
      }),
    });
    const executeAllPayload = await executeAllResponse.json();
    const latestRebalance = await harness.runtimeStore.getLatestRebalance({
      slotId: "onboarding.default_basket",
    });
    const providerReceipts = await harness.runtimeStore.listProviderEventReceipts({
      slotId: "onboarding.default_basket",
      decision: "accepted",
      limit: 10,
    });
    const executionRequests = await harness.runtimeStore.listExecutionRequests({
      rebalanceId: latestRebalance.rebalanceId,
    });

    assert.equal(providerResponse.status, 200);
    assert.equal(executeAllResponse.status, 409);
    assert.match(executeAllPayload.error, /session proof is required/i);
    assert.equal(executionRequests.length, 0);
    assert.equal(providerReceipts.length, 1);
    assert.equal(latestRebalance.executionRequestId, null);
  } finally {
    await harness.close();
  }
});

test("provider rebalance ingress rejects request-digest tampering and persists the rejection receipt", async () => {
  const harness = await startProviderHarness();

  try {
    const signedRequest = harness.createSignedRequest();
    const tamperedBody = {
      ...signedRequest.body,
      workflowExecutionId: "workflow_exec_tampered",
    };
    const token = await signedRequest.tokenPromise;
    const response = await fetch(
      `${harness.baseUrl}${API_ENDPOINTS.CHAINLINK_CRE_PROVIDER_TRIGGERED_REVIEW}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tamperedBody),
      },
    );
    const payload = await response.json();
    const providerReceipts = await harness.runtimeStore.listProviderEventReceipts({
      slotId: "onboarding.default_basket",
      decision: "rejected",
      limit: 10,
    });

    assert.equal(response.status, 403);
    assert.equal(payload.details.errorCode, "provider_scope_mismatch");
    assert.equal(providerReceipts.length, 1);
    assert.equal(providerReceipts[0].decision, "rejected");
    assert.equal(providerReceipts[0].errorCode, "provider_scope_mismatch");
  } finally {
    await harness.close();
  }
});

test("provider rebalance ingress rejects duplicate deliveries and records the replay receipt", async () => {
  const harness = await startProviderHarness();

  try {
    const signedRequest = harness.createSignedRequest();
    const token = await signedRequest.tokenPromise;
    const endpoint = `${harness.baseUrl}${API_ENDPOINTS.CHAINLINK_CRE_PROVIDER_TRIGGERED_REVIEW}`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(signedRequest.body),
    };

    const firstResponse = await fetch(endpoint, requestOptions);
    const secondResponse = await fetch(endpoint, requestOptions);
    const secondPayload = await secondResponse.json();
    const providerReceipts = await harness.runtimeStore.listProviderEventReceipts({
      slotId: "onboarding.default_basket",
      limit: 10,
    });

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(providerReceipts.length, 2);
    assert.equal(secondPayload.data.receipt.decision, "duplicate");
    assert.equal(secondPayload.data.receipt.errorCode, "duplicate_jti");
    assert.equal(providerReceipts[0].decision, "duplicate");
    assert.equal(providerReceipts[1].decision, "accepted");
    assert.equal(
      typeof secondPayload.data.receipt.duplicateOfReceiptId,
      "string",
    );
  } finally {
    await harness.close();
  }
});
