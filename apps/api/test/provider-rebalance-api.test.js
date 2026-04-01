import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signJwtPayload } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { adaptResearchPromotedManifest } from "../../../packages/policy/src/index.js";
import {
  createProviderRebalanceRequestDigest,
} from "../../../packages/shared/src/rebalance.js";
import { createRuntimeStore } from "../src/repositories/runtime-store.js";
import { createApiServer } from "../src/server.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
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

function signEs256kJwt({ privateKey, kid, payload }) {
  const encodedHeader = encodeBase64UrlJson({
    alg: "ES256K",
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

async function startProviderHarness() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
  });
  const signerAddress = "0x5555555555555555555555555555555555555555";
  const audience = "xstocks-provider-rebalance-review";
  const kid = "provider-signing-key";
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-provider-rebalance-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const manifestRepository = await createSyntheticManifestRepository();
  const server = createApiServer({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    manifestRepository,
    liveStateRepository: createStaticLiveStateRepository(),
    providerRebalanceJwtAudience: audience,
    providerRebalanceSignerAllowlist: [
      {
        address: signerAddress,
        providerIds: ["chainlink_cre"],
        kid,
        jwk: publicKey.export({ format: "jwk" }),
      },
    ],
  });

  await new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const runtimeStore = createRuntimeStore({ storePath });
  await runtimeStore.appendActivation({
    activation: {
      activationId: "activation_provider_1",
      owner: null,
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
      deliveryId: "delivery_1",
      eventId: "event_1",
      eventType: "rebalance_review_requested",
      triggerMode: "review_only",
      chain: "ethereum",
      slotId: "onboarding.default_basket",
      activationId: "activation_provider_1",
      triggeredAt: "2026-04-01T18:00:00.000Z",
      summary: "Open operator review for the promoted drift event.",
      ...overrides,
    };
    const requestDigest = createProviderRebalanceRequestDigest(requestBody);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = signEs256kJwt({
      privateKey,
      kid,
      payload: {
        iss: signerAddress,
        sub: "chainlink-cre-provider",
        aud: audience,
        iat: nowSeconds,
        exp: nowSeconds + 3600,
        jti: jwtId,
        digest: requestDigest,
      },
    });

    return {
      body: {
        ...requestBody,
        requestDigest,
      },
      token,
    };
  }

  return {
    baseUrl,
    runtimeStore,
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
    const response = await fetch(
      `${harness.baseUrl}/api/internal/rebalances/provider-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${signedRequest.token}`,
        },
        body: JSON.stringify(signedRequest.body),
      },
    );
    const payload = await response.json();
    const latestRebalance = await harness.runtimeStore.getLatestRebalance({
      slotId: "onboarding.default_basket",
    });
    const providerReceipts = await harness.runtimeStore.listProviderReceipts({
      deliveryId: "delivery_1",
    });
    const executionRequests = await harness.runtimeStore.listExecutionRequests();

    assert.equal(response.status, 202);
    assert.equal(payload.data.accepted, true);
    assert.equal(payload.data.receipt.decision, "accepted");
    assert.deepEqual(payload.data.receipt.reasonCodes, ["accepted_review_only"]);
    assert.equal(payload.data.rebalanceOrchestration.state, "awaiting_operator");
    assert.equal(payload.data.rebalanceOrchestration.triggerSource, "provider_triggered");
    assert.equal(
      payload.data.rebalanceOrchestration.automationTruth.providerTriggeredProven,
      true,
    );
    assert.equal(latestRebalance.state, "awaiting_operator");
    assert.equal(latestRebalance.triggerSource, "provider_triggered");
    assert.equal(providerReceipts.length, 1);
    assert.equal(providerReceipts[0].decision, "accepted");
    assert.equal(executionRequests.length, 0);
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
      requestDigest: "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    };
    const response = await fetch(
      `${harness.baseUrl}/api/internal/rebalances/provider-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${signedRequest.token}`,
        },
        body: JSON.stringify(tamperedBody),
      },
    );
    const payload = await response.json();
    const providerReceipts = await harness.runtimeStore.listProviderReceipts({
      deliveryId: "delivery_1",
    });

    assert.equal(response.status, 401);
    assert.equal(payload.data.accepted, false);
    assert.equal(payload.data.receipt.decision, "rejected");
    assert.deepEqual(payload.data.receipt.reasonCodes, ["request_digest_mismatch"]);
    assert.equal(payload.data.rebalanceOrchestration, null);
    assert.equal(providerReceipts.length, 1);
    assert.equal(providerReceipts[0].decision, "rejected");
  } finally {
    await harness.close();
  }
});

test("provider rebalance ingress rejects duplicate deliveries and records the replay receipt", async () => {
  const harness = await startProviderHarness();

  try {
    const signedRequest = harness.createSignedRequest();
    const endpoint = `${harness.baseUrl}/api/internal/rebalances/provider-events`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${signedRequest.token}`,
      },
      body: JSON.stringify(signedRequest.body),
    };

    const firstResponse = await fetch(endpoint, requestOptions);
    const secondResponse = await fetch(endpoint, requestOptions);
    const secondPayload = await secondResponse.json();
    const providerReceipts = await harness.runtimeStore.listProviderReceipts({
      deliveryId: "delivery_1",
    });

    assert.equal(firstResponse.status, 202);
    assert.equal(secondResponse.status, 409);
    assert.equal(secondPayload.data.accepted, false);
    assert.deepEqual(secondPayload.data.receipt.reasonCodes, ["duplicate_delivery"]);
    assert.equal(providerReceipts.length, 2);
    assert.equal(providerReceipts[0].decision, "rejected");
    assert.equal(providerReceipts[1].decision, "accepted");
    assert.equal(
      typeof secondPayload.data.receipt.duplicateOfReceiptId,
      "string",
    );
  } finally {
    await harness.close();
  }
});
