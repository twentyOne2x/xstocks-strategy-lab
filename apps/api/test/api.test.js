import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signJwtPayload } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDirectionalPolicyRouteEntries } from "../../../packages/euler/dist/index.js";
import { adaptResearchPromotedManifest } from "../../../packages/policy/src/index.js";
import {
  CANONICAL_SPYX_LIVE_FIXTURE,
  createAusdBridgeAssetSnapshot,
  createXStocksBoundaryRepository,
} from "../../../packages/xstocks/dist/index.js";

import { createLiveStateRepository } from "../src/repositories/live-state-repository.js";
import { createResearchManifestRepository } from "../src/repositories/research-manifest-repository.js";
import { createRuntimeStore } from "../src/repositories/runtime-store.js";
import { createApiServer } from "../src/server.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SLOT_REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/research/manifests/slot-registry.json",
);
const DEFAULT_MANIFEST_ID = JSON.parse(
  readFileSync(SLOT_REGISTRY_PATH, "utf8"),
).slots["onboarding.default_basket"].currentManifestRef.manifestId;
const TEST_COW_ORDER_UID = `0x${"b".repeat(112)}`;
const TEST_COW_SIGNATURE = `0x${"ab".repeat(65)}`;
const TEST_SETTLEMENT_TX_HASH = `0x${"a".repeat(64)}`;
const TEST_PRIVY_APP_ID = "privy-app-test";
const TEST_PRIVY_APP_SECRET = "privy-app-secret-test";
const TEST_REPORTING_TOKEN = "xstocks-reporting-token-test";
const TEST_AUTORESEARCH_PROOF_TOKEN = "xstocks-autoresearch-proof-token-test";
const TEST_WALLET_ADDRESS = "0x1111111111111111111111111111111111111111";
const TEST_SMART_WALLET_ADDRESS = "0x2222222222222222222222222222222222222222";
const TEST_OTHER_WALLET_ADDRESS = "0x3333333333333333333333333333333333333333";
const TEST_OTHER_SMART_WALLET_ADDRESS =
  "0x4444444444444444444444444444444444444444";

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

async function createPrivyAuthTestHarness() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const kid = "privy-test-key";
  const exportedJwk = publicKey.export({ format: "jwk" });
  const authenticatedAt = new Date().toISOString();
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

  function createTokens({
    userId,
    sessionId,
    walletAddress,
    smartWalletAddress,
  }) {
    const accessToken = signEs256Jwt({
      privateKey,
      kid,
      payload: {
        iss: "privy.io",
        aud: TEST_PRIVY_APP_ID,
        sub: userId,
        sid: sessionId,
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
        sub: userId,
        sid: sessionId,
        iat: nowSeconds,
        exp: nowSeconds + 3600,
        linked_accounts: JSON.stringify([
          {
            type: "wallet",
            chain_type: "ethereum",
            address: walletAddress,
            wallet_client_type: "privy",
          },
          {
            type: "smart_wallet",
            address: smartWalletAddress,
            smart_wallet_type: "safe",
          },
        ]),
      },
    });

    return {
      accessToken,
      identityToken,
    };
  }

  const primary = {
    userId: "did:privy:user_primary",
    sessionId: "session_primary",
    walletAddress: TEST_WALLET_ADDRESS,
    smartWalletAddress: TEST_SMART_WALLET_ADDRESS,
    ...createTokens({
      userId: "did:privy:user_primary",
      sessionId: "session_primary",
      walletAddress: TEST_WALLET_ADDRESS,
      smartWalletAddress: TEST_SMART_WALLET_ADDRESS,
    }),
  };
  const other = {
    userId: "did:privy:user_other",
    sessionId: "session_other",
    walletAddress: TEST_OTHER_WALLET_ADDRESS,
    smartWalletAddress: TEST_OTHER_SMART_WALLET_ADDRESS,
    ...createTokens({
      userId: "did:privy:user_other",
      sessionId: "session_other",
      walletAddress: TEST_OTHER_WALLET_ADDRESS,
      smartWalletAddress: TEST_OTHER_SMART_WALLET_ADDRESS,
    }),
  };

  const usersById = new Map([
    [
      primary.userId,
      {
        id: primary.userId,
        created_at: Date.parse(authenticatedAt),
        has_accepted_terms: true,
        is_guest: false,
        linked_accounts: [
          {
            type: "wallet",
            chain_type: "ethereum",
            address: primary.walletAddress,
            wallet_client_type: "privy",
          },
          {
            type: "smart_wallet",
            address: primary.smartWalletAddress,
            smart_wallet_type: "safe",
          },
        ],
        mfa_methods: [],
      },
    ],
    [
      other.userId,
      {
        id: other.userId,
        created_at: Date.parse(authenticatedAt),
        has_accepted_terms: true,
        is_guest: false,
        linked_accounts: [
          {
            type: "wallet",
            chain_type: "ethereum",
            address: other.walletAddress,
            wallet_client_type: "privy",
          },
          {
            type: "smart_wallet",
            address: other.smartWalletAddress,
            smart_wallet_type: "safe",
          },
        ],
        mfa_methods: [],
      },
    ],
  ]);

  const server = createHttpServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/jwks") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(`${JSON.stringify(jwks)}\n`);
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/v1/users/")) {
      const authorization = request.headers.authorization ?? "";
      const appIdHeader = request.headers["privy-app-id"] ?? "";
      const expectedAuthorization = `Basic ${Buffer.from(
        `${TEST_PRIVY_APP_ID}:${TEST_PRIVY_APP_SECRET}`,
      ).toString("base64")}`;

      if (
        authorization !== expectedAuthorization ||
        appIdHeader !== TEST_PRIVY_APP_ID
      ) {
        response.statusCode = 401;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(`${JSON.stringify({ error: "unauthorized" })}\n`);
        return;
      }

      const userId = decodeURIComponent(url.pathname.slice("/v1/users/".length));
      const user = usersById.get(userId);

      if (!user) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(`${JSON.stringify({ error: "not_found" })}\n`);
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(`${JSON.stringify(user)}\n`);
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
    appId: TEST_PRIVY_APP_ID,
    appSecret: TEST_PRIVY_APP_SECRET,
    apiBaseUrl: baseUrl,
    jwksUrl: `${baseUrl}/jwks`,
    primary,
    other,
    headers({ user = "primary", includeIdentityToken = true } = {}) {
      const profile = user === "other" ? other : primary;

      return {
        Authorization: `Bearer ${profile.accessToken}`,
        ...(includeIdentityToken
          ? {
              "X-Privy-Identity-Token": profile.identityToken,
            }
          : {}),
      };
    },
    owner({ user = "primary" } = {}) {
      const profile = user === "other" ? other : primary;

      return {
        providerId: "privy",
        appId: TEST_PRIVY_APP_ID,
        userId: profile.userId,
        sessionId: profile.sessionId,
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

function createReadyWalletState(auth, { user = "primary" } = {}) {
  const profile = user === "other" ? auth.other : auth.primary;

  return {
    walletConnected: true,
    walletAddress: profile.walletAddress,
    fundedNotionalUsd: 1250,
    smartAccount: {
      status: "ready",
      address: profile.smartWalletAddress,
    },
  };
}

function createJsonHeaders(auth, options = {}) {
  return {
    "Content-Type": "application/json",
    ...auth.headers(options),
  };
}

function createReportingHeaders(token = TEST_REPORTING_TOKEN) {
  return {
    "X-Reporting-Token": token,
  };
}

function createAutoresearchProofHeaders(
  token = TEST_AUTORESEARCH_PROOF_TOKEN,
) {
  return {
    "X-Autoresearch-Proof-Token": token,
  };
}

function createStaticLiveStateRepository() {
  function createFetchedAsset(assetSymbol) {
    const normalizedSymbol = Buffer.from(assetSymbol)
      .toString("hex")
      .padEnd(39, "0")
      .slice(0, 39);

    return {
      assetSymbol,
      asset:
        assetSymbol === "AUSD"
          ? null
          : {
              deployments: [
                {
                  network: "Ethereum",
                  address: `0x1${normalizedSymbol}`,
                  wrapperAddress: `0x2${normalizedSymbol}`,
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
  }

  return {
    async loadBoundaryState({ manifest }) {
      return {
        liveXStocksState: {
          stateVersion: "api-test.xstocks.v1",
          asOf: "2026-03-31T12:00:00.000Z",
          assets: manifest.executionBoundary.requiredAssets.map((assetSymbol) => ({
            assetSymbol,
            chain: "ethereum",
            status: "active",
            priceUsd: assetSymbol === "AUSD" ? 1 : 100,
          })),
        },
        liveRouteState: {
          stateVersion: "api-test.routes.v1",
          asOf: "2026-03-31T12:00:00.000Z",
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
    async fetchRequiredAssets(requiredAssets) {
      return requiredAssets.map((assetSymbol) => createFetchedAsset(assetSymbol));
    },
    async fetchAssetSnapshot(symbol) {
      return createFetchedAsset(symbol);
    },
  };
}

function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createFixtureFetch(fixturesBySymbol = { SPYx: CANONICAL_SPYX_LIVE_FIXTURE }) {
  return async function fetchFixture(input) {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const backedQuoteMatch = url.pathname.match(/^\/api\/v1\/quotes\/assets\/([^/]+)$/u);
    const priceMatch = url.pathname.match(/\/public\/assets\/([^/]+)\/price-data$/);
    const assetMatch = url.pathname.match(/\/public\/assets\/([^/]+)$/);
    const proofMatch = url.pathname.match(/\/public\/proof-of-reserves\/([^/]+)$/);
    const statusMatch = url.pathname.match(/\/public\/system\/status\/([^/]+)$/);
    const symbol =
      decodeURIComponent(
        backedQuoteMatch?.[1] ??
          priceMatch?.[1] ??
          assetMatch?.[1] ??
          proofMatch?.[1] ??
          statusMatch?.[1] ??
          "",
      ) || null;
    const fixture = symbol ? fixturesBySymbol[symbol] : null;

    if (!fixture) {
      return createJsonResponse({ error: `No fixture for ${url.pathname}` }, 404);
    }

    if (backedQuoteMatch) {
      const scaled = Number(((fixture.priceData.quote ?? 0) * 100).toFixed(6));

      return createJsonResponse({
        symbol,
        bid: scaled,
        ask: scaled,
        currency: "USD",
        minOrderFiatValue: 1000,
      });
    }

    if (priceMatch) {
      return createJsonResponse(fixture.priceData);
    }

    if (proofMatch) {
      return createJsonResponse(fixture.proofOfReserves);
    }

    if (statusMatch) {
      return createJsonResponse(fixture.systemStatus);
    }

    if (assetMatch) {
      return createJsonResponse(fixture.asset);
    }

    return createJsonResponse({ error: `Unhandled fixture path ${url.pathname}` }, 404);
  };
}

function toLiveAssetView(asset) {
  return {
    assetSymbol: asset.assetSymbol,
    source: asset.source,
    chain: asset.chain,
    status: asset.status,
    priceUsd: asset.priceUsd,
    proofOfReserves: asset.proofOfReserves,
    deployments: asset.deployments,
    ...(asset.notes.length > 0 ? { notes: asset.notes } : {}),
  };
}

async function loadPromotedManifest(slotId) {
  const raw = await readFile(
    resolve(REPO_ROOT, `packages/research/manifests/promoted/${slotId}/current.json`),
    "utf8",
  );

  return adaptResearchPromotedManifest(JSON.parse(raw));
}

const DEFAULT_MANIFEST = await loadPromotedManifest("onboarding.default_basket");

function createSyntheticExecutableBasketManifest() {
  const liveReadyBadges = [
    "validated_strategy",
    "promoted_manifest",
    "basket_live_ready",
  ];

  return {
    ...DEFAULT_MANIFEST,
    frontend: {
      ...DEFAULT_MANIFEST.frontend,
      title: "Autopilot: CoW Core",
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
        routeKind: "yield_vault",
        requiredFor: "yield_buffer",
      },
    ],
    executionBoundary: {
      ...DEFAULT_MANIFEST.executionBoundary,
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
          routeKind: "yield_vault",
          requiredFor: "yield_buffer",
        },
      ],
      walletRequirements: {
        ...DEFAULT_MANIFEST.executionBoundary.walletRequirements,
        requiresSmartAccount: false,
        minFundingUsd: 0,
      },
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
          reason:
            "Synthetic API-test basket constrains the default lane to directly quoteable CoW core legs only.",
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
          reason: "Publicly verified rail is available.",
        },
      ],
      proofNotes: [
        "Synthetic API-test basket keeps the execution lane bound to direct-quoteable CoW core legs only.",
      ],
      validationBadges: liveReadyBadges,
    },
  };
}

function createSyntheticDefaultBasketManifestRepository() {
  const baseRepository = createResearchManifestRepository({
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
  });
  const syntheticManifest = createSyntheticExecutableBasketManifest();

  function maybeReplaceRecord(record) {
    if (!record || record.slotId !== "onboarding.default_basket") {
      return record;
    }

    return {
      ...record,
      manifest: syntheticManifest,
    };
  }

  return {
    async readSlotRegistry() {
      return baseRepository.readSlotRegistry();
    },
    async getPromotedRecordById(manifestId) {
      return maybeReplaceRecord(await baseRepository.getPromotedRecordById(manifestId));
    },
    async getPromotedRecordBySlot(slotId) {
      return maybeReplaceRecord(await baseRepository.getPromotedRecordBySlot(slotId));
    },
    async listPromotedRecords() {
      return (await baseRepository.listPromotedRecords()).map(maybeReplaceRecord);
    },
    async getPromotedManifestById(manifestId) {
      return (await this.getPromotedRecordById(manifestId))?.manifest ?? null;
    },
    async getPromotedManifestBySlot(slotId) {
      return (await this.getPromotedRecordBySlot(slotId))?.manifest ?? null;
    },
    async listPromotedManifests() {
      return (await this.listPromotedRecords()).map((record) => record.manifest);
    },
  };
}

function startServerWithSyntheticExecutableDefaultBasket(overrides = {}) {
  return startServer({
    manifestRepository: createSyntheticDefaultBasketManifestRepository(),
    ...overrides,
  });
}

async function loadQualificationFixture(name) {
  const raw = await readFile(
    resolve(REPO_ROOT, `scripts/fixtures/qualification/${name}.json`),
    "utf8",
  );

  return JSON.parse(raw);
}

async function startServer(overrides = {}) {
  const auth = "auth" in overrides ? overrides.auth : await createPrivyAuthTestHarness();
  const storeDir = await mkdtemp(resolve(tmpdir(), "xstocks-api-"));
  const storePath = resolve(storeDir, "runtime-store.json");
  const serverConfig = {
    repoRoot: REPO_ROOT,
    slotRegistryPath: SLOT_REGISTRY_PATH,
    storePath,
    ...overrides,
  };

  delete serverConfig.auth;

  if (auth) {
    if (!("privyAppId" in serverConfig)) {
      serverConfig.privyAppId = auth.appId;
    }

    if (!("privyAppSecret" in serverConfig)) {
      serverConfig.privyAppSecret = auth.appSecret;
    }

    if (!("privyJwksUrl" in serverConfig)) {
      serverConfig.privyJwksUrl = auth.jwksUrl;
    }

    if (!("privyApiBaseUrl" in serverConfig)) {
      serverConfig.privyApiBaseUrl = auth.apiBaseUrl;
    }
  }

  if (!("liveStateRepository" in serverConfig) && !("fetchImpl" in serverConfig)) {
    serverConfig.liveStateRepository = createStaticLiveStateRepository();
  }

  if (
    !("oneInchExecutionClient" in serverConfig) &&
    !("oneInchApiKey" in serverConfig)
  ) {
    serverConfig.oneInchApiKey = null;
  }

  const server = createApiServer(serverConfig);

  await new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    server,
    storePath,
    baseUrl,
    auth,
    async close() {
      await Promise.all([
        new Promise((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) {
              rejectClose(error);
              return;
            }

            resolveClose();
          });
        }),
        auth?.close?.() ?? Promise.resolve(),
      ]);
    },
  };
}

function createCowExecutionClientStub({
  orderUid = TEST_COW_ORDER_UID,
  orderStatus = {
    uid: TEST_COW_ORDER_UID,
    status: "fulfilled",
    settlementTxHash: TEST_SETTLEMENT_TX_HASH,
    raw: {
      status: "fulfilled",
    },
  },
} = {}) {
  return {
    async requestQuote(input) {
      return {
        quote: {
          sellToken: input.sellToken,
          buyToken: input.buyToken,
          receiver: input.receiver ?? input.owner,
          sellAmount: input.sellAmountBeforeFee ?? "950000000",
          buyAmount: "1234500000000000000",
          validTo: 1_775_000_000,
          appData: "0x1234",
          feeAmount: "1000000",
          gasAmount: "210000",
          gasPrice: "15000000000",
          sellTokenPrice: "1",
          kind: input.kind,
          partiallyFillable: false,
          sellTokenBalance: "erc20",
          buyTokenBalance: "erc20",
          signingScheme: "eip712",
        },
        from: input.owner,
        expiration: "2026-04-01T10:43:22.662874542Z",
        id: 1126290448,
        verified: true,
        protocolFeeBps: "2",
      };
    },
    async submitOrder() {
      return orderUid;
    },
    async getOrder(uid) {
      if (!orderStatus) {
        return null;
      }

      return {
        ...orderStatus,
        uid,
      };
    },
  };
}

function createOneInchExecutionClientStub({
  quoteId = "oneinch_quote_1",
  fromTokenAmount = "20000000",
  toTokenAmount = "113576036691965274",
  recommendedPreset = "fast",
} = {}) {
  return {
    async requestQuote(input) {
      return {
        quoteId,
        fromTokenAmount:
          input.amount ?? fromTokenAmount,
        toTokenAmount,
        feeToken: input.toTokenAddress,
        presets: {
          [recommendedPreset]: {
            auctionDuration: 180,
            startAuctionIn: 0,
            bankFee: "0",
            initialRateBump: 0,
            auctionStartAmount: toTokenAmount,
            auctionEndAmount: toTokenAmount,
            tokenFee: "0",
            exclusiveResolver: null,
            estP: 0,
            allowPartialFills: false,
            allowMultipleFills: false,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
            },
            points: [],
            startAmount: toTokenAmount,
          },
        },
        fee: {
          receiver: "0x9999999999999999999999999999999999999999",
          bps: 0,
          whitelistDiscountPercent: 0,
        },
        integratorFee: 0,
        integratorFeeShare: 0,
        settlementAddress: "0x399740157391a9f1bf4e9921a8834f9bc8f2678e",
        whitelist: [],
        recommended_preset: recommendedPreset,
        priceImpactPercent: 0.12,
      };
    },
  };
}

function createEthereumRpcClientStub() {
  return {
    rpcUrl: "https://ethereum-rpc.test",
    async getTransactionReceipt() {
      return {
        status: "confirmed",
        blockNumber: 123,
        transactionIndex: 0,
        rawReceipt: {
          status: "0x1",
          blockNumber: "0x7b",
          transactionIndex: "0x0",
        },
      };
    },
  };
}

test("live-state repository matches the package-owned boundary repository for manifest-scoped reads", async () => {
  const manifest = await loadPromotedManifest("advanced.default_directional");
  const fetchImpl = createFixtureFetch();
  const asOf = "2026-03-31T12:00:00.000Z";
  const repository = createLiveStateRepository({
    baseUrl: "https://fixtures.test/api/v2",
    fetchImpl,
  });
  const packageRepository = createXStocksBoundaryRepository({
    baseUrl: "https://fixtures.test/api/v2",
    fetchImpl,
    additionalRoutes: buildDirectionalPolicyRouteEntries(),
  });

  const liveState = await repository.loadBoundaryState({ manifest, asOf });
  const expectedLiveState = await packageRepository.loadBoundaryState({ manifest, asOf });
  const ausdAsset = liveState.liveXStocksState.assets.find((asset) => asset.assetSymbol === "AUSD");

  assert.deepEqual(liveState, expectedLiveState);
  assert.deepEqual(ausdAsset, toLiveAssetView(createAusdBridgeAssetSnapshot()));
  assert.equal(
    liveState.liveRouteState.routes.find((route) => route.routeId === "cow_swap.ethereum")
      ?.verificationTier,
    "public_verified",
  );
  assert.equal(
    liveState.liveRouteState.routes.find((route) => route.routeId === "1inch.ethereum")
      ?.verificationTier,
    "public_verified",
  );
  assert.equal(
    liveState.liveRouteState.routes.find((route) => route.routeId === "spread.ink")
      ?.verificationTier,
    "mentor_reported",
  );
  assert.equal(
    liveState.liveRouteState.routes.find((route) => route.routeId === "morpho.spyx-ausd")
      ?.availability,
    "available",
  );
  assert.equal(
    liveState.liveRouteState.routes.find(
      (route) => route.routeId === "flowdesk.ausd-rwa-strategy",
    )?.availability,
    "available",
  );
  assert.equal(
    liveState.liveRouteState.routes.find((route) => route.routeId === "euler.ethereum.directional")
      ?.availability,
    "preview_only",
  );
});

test("recommendation fetch returns a promoted recommendation payload from research manifests", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/recommendations?slotId=onboarding.default_basket&userNotionalUsd=1000`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.manifest.manifestId, DEFAULT_MANIFEST_ID);
    assert.equal(
      payload.data.recommendation.activationManifestRef.manifestId,
      DEFAULT_MANIFEST_ID,
    );
    assert.equal(payload.data.executionPlanPreview.surfaceTruth, "preview");
    assert.equal(
      payload.data.manifest.explanationBundle?.truthMode,
      "promoted_incumbent_and_run_summary_only",
    );
    assert.match(
      payload.data.manifest.tuningSummary?.headline ?? "",
      /300 bps rebalance trigger/i,
    );
    assert.equal(Object.hasOwn(payload.data.manifest, "rawExplanationBundle"), false);
    assert.equal(
      payload.data.recommendation.explanationBundle.components[0].assetSymbol,
      "NVDAx",
    );
  } finally {
    await harness.close();
  }
});

test("catalog read returns promoted-manifest-backed results from research", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/catalog?surface=onboarding`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.defaultSlotId, "onboarding.default_basket");
    assert.equal(payload.data.items.length, 3);

    const defaultItem = payload.data.items.find(
      (item) => item.slot.slotId === "onboarding.default_basket",
    );

    assert.ok(defaultItem);
    assert.equal(defaultItem.manifest.manifestId, DEFAULT_MANIFEST_ID);
    assert.equal(defaultItem.manifest.source.type, "research_promoted_manifest");
    assert.equal(defaultItem.manifest.legacyFallback, false);
    assert.equal(
      defaultItem.manifest.explanationBundle?.cashWeightPct,
      DEFAULT_MANIFEST.researchExplanationBundle.cashWeightPct,
    );
    assert.equal(
      defaultItem.manifest.tuningSummary?.currentKnobs.length > 0,
      true,
    );
    assert.equal(defaultItem.manifest.replay?.startingCapital, 1000);
    assert.equal(
      defaultItem.manifest.replay?.endingCapital,
      DEFAULT_MANIFEST.replay.endingCapital,
    );
    assert.equal(
      defaultItem.manifest.replay?.turnoverPct,
      DEFAULT_MANIFEST.replay.turnoverPct,
    );
    assert.equal(defaultItem.manifest.replay?.points.length > 1, true);
    assert.equal(
      defaultItem.manifest.marketIntelligence?.currentView,
      DEFAULT_MANIFEST.marketIntelligence.currentView,
    );
    assert.equal(
      defaultItem.manifest.marketIntelligence?.whatChanged[0],
      DEFAULT_MANIFEST.marketIntelligence.whatChanged[0],
    );
    assert.equal(
      defaultItem.manifest.marketIntelligence?.drivers.some(
        (driver) => driver.label === "Benchmark edge",
      ),
      true,
    );
    assert.equal(Object.hasOwn(defaultItem.manifest, "rawExplanationBundle"), false);
    assert.match(defaultItem.manifest.explanation.thesis, /xStocks basket|yield buffer/i);
    assert.ok(defaultItem.manifest.explanation.holdingRationales.length > 0);
    assert.ok(defaultItem.manifest.explanation.bundle.components.length > 0);
    assert.equal(defaultItem.manifest.walletRequirements.requiresSmartAccount, false);
    assert.equal(defaultItem.manifest.walletRequirements.minFundingUsd, 0);
    assert.equal(defaultItem.defaultRequestedNotionalUsd, 0);
    assert.equal(defaultItem.executionPreview.surfaceTruth, "preview");
    assert.match(
      defaultItem.executionPreview.blockers[0] ?? "",
      /Connect a wallet first/i,
    );
    assert.ok(
      payload.data.items.every(
        (item) => item.manifest.source.type === "research_promoted_manifest",
      ),
    );
    assert.ok(
      payload.data.items.every((item) => item.manifest.legacyFallback === false),
    );
  } finally {
    await harness.close();
  }
});

test("workspace read returns manifest-driven workspace data", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/workspace?slotId=onboarding.default_basket&userNotionalUsd=1000`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.slot.slotId, "onboarding.default_basket");
    assert.equal(payload.data.manifest.manifestId, DEFAULT_MANIFEST_ID);
    assert.equal(payload.data.manifest.source.type, "research_promoted_manifest");
    assert.equal(payload.data.manifest.legacyFallback, false);
    assert.equal(
      payload.data.manifest.explanationBundle?.benchmarkDelta.excessReturnAfterCostPct,
      DEFAULT_MANIFEST.researchExplanationBundle.benchmarkDelta.excessReturnAfterCostPct,
    );
    assert.equal(
      payload.data.manifest.tuningSummary?.headline,
      DEFAULT_MANIFEST.researchTuningSummary.headline,
    );
    assert.equal(payload.data.manifest.replay?.startingCapital, 1000);
    assert.equal(
      payload.data.manifest.replay?.endingCapital,
      DEFAULT_MANIFEST.replay.endingCapital,
    );
    assert.equal(
      payload.data.manifest.replay?.points.at(-1)?.value,
      DEFAULT_MANIFEST.replay.points.at(-1)?.value,
    );
    assert.equal(
      payload.data.manifest.marketIntelligence?.currentView,
      DEFAULT_MANIFEST.marketIntelligence.currentView,
    );
    assert.equal(
      payload.data.manifest.marketIntelligence?.drivers[0]?.label,
      DEFAULT_MANIFEST.marketIntelligence.drivers[0]?.label,
    );
    assert.match(payload.data.manifest.explanation.whatThisDoes, /tokenized equities|basket/i);
    assert.equal(
      payload.data.workspace.recommendation.activationManifestRef.manifestId,
      DEFAULT_MANIFEST_ID,
    );
    assert.equal(
      payload.data.workspace.recommendation.explanationBundle.components[0].assetSymbol,
      "NVDAx",
    );
    assert.match(
      payload.data.manifest.explanation.bundle.whatWouldTriggerNextRebalance,
      /scheduler/i,
    );
    assert.ok(payload.data.workspace.targetAllocations.length > 0);
    assert.ok(
      payload.data.workspace.liveState.liveXStocksState.assets.some(
        (asset) => asset.assetSymbol === "NVDAx",
      ),
    );
    assert.equal(
      payload.data.workspace.rebalanceOrchestration.state,
      "preview_only",
    );
    assert.equal(payload.data.workspace.activitySummary.activationCount, 0);
  } finally {
    await harness.close();
  }
});

test("manifest preflight rejects raw manifest payloads", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/manifests/preflight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activation_manifest: {
          manifest_id: "raw",
        },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /Raw strategy candidates are not accepted/);
  } finally {
    await harness.close();
  }
});

test("activation preview read stays fail-closed for preview-only directional manifests", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/activation-preview?slotId=advanced.default_directional&userNotionalUsd=2500`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      payload.data.manifest.manifestId,
      "advanced.default_directional:directional-preview-v1:promoted",
    );
    assert.equal(payload.data.manifest.legacyFallback, false);
    assert.equal(payload.data.manifest.explanationBundle, null);
    assert.equal(payload.data.manifest.tuningSummary, null);
    assert.match(payload.data.manifest.explanation.replayInterpretation, /not/i);
    assert.equal(payload.data.executionPlan.surfaceTruth, "preview");
    assert.equal(payload.data.executionPlan.executionState, "blocked");
    assert.equal(payload.data.executionPlan.executionEligibility, "preview_only");
    assert.equal(payload.data.executionPlan.routeTruthLabels[0].truthState, "unverified");
    assert.equal(payload.data.rebalanceOrchestration.state, "preview_only");
    assert.equal(payload.data.latestActivation, null);
  } finally {
    await harness.close();
  }
});

test("activation preview exports linked-wallet-first funding truth for the current basket lane", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/activation-preview?slotId=onboarding.default_basket&userNotionalUsd=25&walletConnected=true&walletAddress=${TEST_WALLET_ADDRESS}&fundedNotionalUsd=25`,
    );
    const payload = await response.json();
    const smartWalletStep = payload.data.executionPlan.steps.find(
      (step) => step.stepId === "prepare_smart_account",
    );

    assert.equal(response.status, 200);
    assert.equal(payload.data.manifest.walletRequirements.requiresSmartAccount, false);
    assert.equal(payload.data.manifest.walletRequirements.minFundingUsd, 0);
    assert.equal(payload.data.executionPlan.executionState, "blocked");
    assert.equal(payload.data.executionPlan.executionEligibility, "preview_only");
    assert.equal(payload.data.executionPlan.smartAccount.readiness, "not_required");
    assert.equal(payload.data.executionPlan.fundingPath.minRequiredUsd, 25);
    assert.equal(smartWalletStep?.title, "Smart wallet optional");
    assert.match(smartWalletStep?.detail ?? "", /optional/i);
    assert.match(
      payload.data.executionPlan.warnings.join(" "),
      /MSFTx|cow_no_liquidity/i,
    );
  } finally {
    await harness.close();
  }
});

test("public agent handoff read returns a public-safe preview boundary", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=1000`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.slot.slotId, "onboarding.default_basket");
    assert.match(
      payload.data.manifestRef.manifestId,
      /^onboarding\.default_basket:.*:promoted$/u,
    );
    assert.equal(payload.data.publicSurface.skillPath, "/skill.md");
    assert.equal(
      payload.data.publicSurface.publicApis.some(
        (surface) => surface.path === "/api/public-agent-handoff",
      ),
      true,
    );
    assert.equal(
      payload.data.readiness.executionPlanPreview.executionState,
      "blocked",
    );
    assert.equal(
      payload.data.readiness.executionPlanPreview.executionEligibility,
      "preview_only",
    );
    assert.equal(payload.data.handoff.publicSafeBridgeExists, true);
    assert.equal(payload.data.handoff.directAuthenticatedBridgeExists, false);
    assert.equal(payload.data.handoff.state, "stay_public_preview");
    assert.match(payload.data.handoff.reason, /preview-only|cannot cross/i);
    assert.equal(
      payload.data.handoff.authenticatedApis.some(
        (surface) => surface.path === "/api/activations",
      ),
      true,
    );
  } finally {
    await harness.close();
  }
});

test("public agent handoff read can mark a lane ready for authenticated activation without exposing private details", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/public-agent-handoff?slotId=onboarding.default_basket&userNotionalUsd=1000&walletConnected=true&walletAddress=0x1111111111111111111111111111111111111111&fundedNotionalUsd=1000`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.readiness.executionPlanPreview.surfaceTruth, "preview");
    assert.equal(
      payload.data.readiness.executionPlanPreview.executionState,
      "blocked",
    );
    assert.equal(
      payload.data.readiness.executionPlanPreview.executionEligibility,
      "preview_only",
    );
    assert.equal(
      payload.data.handoff.state,
      "stay_public_preview",
    );
    assert.equal(payload.data.handoff.directAuthenticatedBridgeExists, false);
    assert.match(
      payload.data.handoff.reason,
      /preview-only|cannot cross/i,
    );
    assert.equal(
      Object.hasOwn(payload.data, "latestActivation"),
      false,
    );
  } finally {
    await harness.close();
  }
});

test("activation preview can use the package-owned live-state path and stays fail-closed", async () => {
  const harness = await startServer({
    fetchImpl: createFixtureFetch(),
    xstocksBaseUrl: "https://fixtures.test/api/v2",
  });

  try {
    const response = await fetch(
      `${harness.baseUrl}/api/activation-preview?slotId=advanced.default_directional&userNotionalUsd=2500`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.manifest.source.type, "research_promoted_manifest");
    assert.equal(payload.data.manifest.legacyFallback, false);
    assert.equal(payload.data.executionPlan.surfaceTruth, "preview");
    assert.equal(payload.data.executionPlan.executionState, "blocked");
    assert.equal(payload.data.executionPlan.executionEligibility, "preview_only");
    assert.equal(payload.data.executionPlan.routeTruthLabels[0].truthState, "unverified");
    assert.equal(
      payload.data.liveState.liveRouteState.routes.find(
        (route) => route.routeId === "morpho.spyx-ausd",
      )?.verificationTier,
      "public_verified",
    );
    assert.equal(
      payload.data.liveState.liveRouteState.routes.find(
        (route) => route.routeId === "flowdesk.ausd-rwa-strategy",
      )?.availability,
      "available",
    );
    assert.equal(
      payload.data.liveState.liveRouteState.routes.find(
        (route) => route.routeId === "euler.ethereum.directional",
      )?.availability,
      "preview_only",
    );
    assert.equal(
      payload.data.liveState.liveXStocksState.assets.find((asset) => asset.assetSymbol === "AUSD")
        ?.source,
      "stablecoin_bridge",
    );
  } finally {
    await harness.close();
  }
});

test("activation save persists canonical activation and activity records", async () => {
  const harness = await startServer();

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();

    assert.equal(activationResponse.status, 201);
    assert.equal(activationPayload.data.activation.status, "blocked");
    assert.equal(activationPayload.data.activityEvents.length, 2);
    assert.equal(
      activationPayload.data.executionPlan.executionEligibility,
      "preview_only",
    );

    const activityResponse = await fetch(
      `${harness.baseUrl}/api/activity?activationId=${activationPayload.data.activation.activationId}`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const activityPayload = await activityResponse.json();

    assert.equal(activityResponse.status, 200);
    assert.equal(activityPayload.data.items.length, 2);
    assert.equal(activityPayload.data.activations.length, 1);
    assert.equal(
      activityPayload.data.activations[0].manifestId,
      DEFAULT_MANIFEST_ID,
    );
    assert.equal(
      activityPayload.data.activations[0].owner.userId,
      harness.auth.primary.userId,
    );
    assert.equal(
      activityPayload.data.rebalanceOrchestration.state,
      "rebalance_deferred",
    );

    const storedRaw = await readFile(harness.storePath, "utf8");
    const storedState = JSON.parse(storedRaw);
    assert.equal(storedState.activations.length, 1);
    assert.equal(storedState.activityEvents.length, 2);
    assert.equal(storedState.rebalances.length, 0);
  } finally {
    await harness.close();
  }
});

test("activation save fails closed without Privy auth", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.match(payload.error, /Privy access token is required/i);
  } finally {
    await harness.close();
  }
});

test("activation save fails closed when wallet readiness does not match the verified Privy identity", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          user: "other",
        }),
      },
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.match(payload.error, /wallet readiness does not match/i);
  } finally {
    await harness.close();
  }
});

test("activation save succeeds with access-token auth when wallet readiness matches the canonical Privy user", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.activation.owner.userId, harness.auth.primary.userId);
  } finally {
    await harness.close();
  }
});

test("activity read remains compatible with the activity workspace boundary", async () => {
  const harness = await startServer();

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();

    assert.equal(activationResponse.status, 201);

    const activityResponse = await fetch(
      `${harness.baseUrl}/api/activity?manifestId=${DEFAULT_MANIFEST_ID}`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const activityPayload = await activityResponse.json();

    assert.equal(activityResponse.status, 200);
    assert.equal(activityPayload.data.manifest.manifestId, DEFAULT_MANIFEST_ID);
    assert.equal(activityPayload.data.manifest.legacyFallback, false);
    assert.equal(
      activityPayload.data.manifest.explanationBundle?.reasonCodes[0].kind,
      "starter_basket",
    );
    assert.match(
      activityPayload.data.manifest.tuningSummary?.watchpoints[0] ?? "",
      /largest sleeve|turnover|benchmark edge/i,
    );
    assert.equal(activityPayload.data.slot.slotId, "onboarding.default_basket");
    assert.equal(activityPayload.data.activations.length, 1);
    assert.equal(
      activityPayload.data.activations[0].activationId,
      activationPayload.data.activation.activationId,
    );
    assert.equal(
      activityPayload.data.rebalanceOrchestration.state,
      "rebalance_deferred",
    );
    assert.equal(activityPayload.data.activitySurface.source, "activation_snapshot");
    assert.ok(activityPayload.data.activitySurface.positions.length > 0);
    assert.ok(activityPayload.data.activitySurface.history.length > 0);
    assert.ok(activityPayload.data.activitySurface.lifecycle.length > 0);
  } finally {
    await harness.close();
  }
});

test("workspace and activity surfaces expose a recommended rebalance when the slot baseline trails the promoted manifest", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket();
  const runtimeStore = createRuntimeStore({
    storePath: harness.storePath,
    now: () => "2026-04-01T08:00:00.000Z",
  });

  try {
    await runtimeStore.appendActivation({
      activation: {
        activationId: "act_prev",
        owner: harness.auth.owner(),
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
        walletState: createReadyWalletState(harness.auth),
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
            address: harness.auth.primary.smartWalletAddress,
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
            xstocksStateVersion: "api-test.xstocks.v1",
            routeStateVersion: "api-test.routes.v1",
          },
        },
      },
      activityEvents: [],
    });

    const workspaceResponse = await fetch(
      `${harness.baseUrl}/api/workspace?slotId=onboarding.default_basket&userNotionalUsd=1000`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const workspacePayload = await workspaceResponse.json();
    const activityResponse = await fetch(
      `${harness.baseUrl}/api/activity?slotId=onboarding.default_basket`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const activityPayload = await activityResponse.json();

    assert.equal(workspaceResponse.status, 200);
    assert.equal(
      workspacePayload.data.workspace.rebalanceOrchestration.state,
      "rebalance_recommended",
    );
    assert.equal(activityResponse.status, 200);
    assert.equal(
      activityPayload.data.rebalanceOrchestration.state,
      "rebalance_recommended",
    );
    assert.equal(activityPayload.data.rebalanceHistory.length, 0);
  } finally {
    await harness.close();
  }
});

test("workspace and activity surfaces expose scheduled worker-owned review without claiming autonomous execution", async () => {
  const harness = await startServer();
  const runtimeStore = createRuntimeStore({
    storePath: harness.storePath,
    now: () => "2026-04-01T08:00:00.000Z",
  });

  try {
    await runtimeStore.appendActivation({
      activation: {
        activationId: "act_prev",
        owner: harness.auth.owner(),
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
        walletState: createReadyWalletState(harness.auth),
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
            address: harness.auth.primary.smartWalletAddress,
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
            xstocksStateVersion: "api-test.xstocks.v1",
            routeStateVersion: "api-test.routes.v1",
          },
        },
      },
      activityEvents: [],
    });

    await runtimeStore.upsertRebalance({
      rebalance: {
        rebalanceId: "rebalance_onboarding_default_basket",
        slotId: "onboarding.default_basket",
        chain: "ethereum",
        activationManifestRef: {
          manifestId: DEFAULT_MANIFEST_ID,
          slotId: "onboarding.default_basket",
          strategyVersion: "basket-baseline-v1",
          chain: "ethereum",
          mode: "basket",
        },
        targetManifestId: DEFAULT_MANIFEST_ID,
        baselineActivationId: "act_prev",
        baselineManifestId: "onboarding.default_basket:basket-baseline-v0:promoted",
        baselineManifestMatchesTarget: false,
        state: "scheduled",
        runtimeOwner: "worker_offchain_scheduler",
        triggerSource: "scheduled_cron",
        summary: "Manual rebalance review has been scheduled.",
        rationale:
          "A cron-triggered worker evaluation queued a manual review for 2026-04-01T10:00:00.000Z.",
        scheduledFor: "2026-04-01T10:00:00.000Z",
        allowedTransitions: ["awaiting_operator", "executing", "paused", "failed"],
        recommendationState: "full_rebalance",
        executionState: "ready",
        executionEligibility: "executable",
        surfaceTruth: "live",
        blockers: [],
        warnings: [],
        automationTruth: {
          operatorManualRequired: true,
          autonomousExecutionProven: false,
          providerTriggeredProven: false,
          supportedTriggerSources: ["operator_manual", "scheduled_cron"],
          notes: [
            "Operator confirmation remains required before any rebalance execution claim.",
          ],
        },
        nextAction: {
          title: "Wait for scheduled review window",
          detail: "Manual review is queued for 2026-04-01T10:00:00.000Z.",
          status: "scheduled",
        },
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
      },
      eventType: "evaluation",
    });

    const workspaceResponse = await fetch(
      `${harness.baseUrl}/api/workspace?slotId=onboarding.default_basket&userNotionalUsd=1000`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const workspacePayload = await workspaceResponse.json();
    const activityResponse = await fetch(
      `${harness.baseUrl}/api/activity?slotId=onboarding.default_basket`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const activityPayload = await activityResponse.json();

    assert.equal(workspaceResponse.status, 200);
    assert.equal(
      workspacePayload.data.workspace.rebalanceOrchestration.state,
      "scheduled",
    );
    assert.equal(
      workspacePayload.data.workspace.rebalanceOrchestration.runtimeOwner,
      "worker_offchain_scheduler",
    );
    assert.equal(
      workspacePayload.data.workspace.rebalanceOrchestration.nextAction.status,
      "scheduled",
    );
    assert.equal(activityResponse.status, 200);
    assert.equal(
      activityPayload.data.rebalanceOrchestration.state,
      "scheduled",
    );
    assert.equal(
      activityPayload.data.rebalanceOrchestration.runtimeOwner,
      "worker_offchain_scheduler",
    );
    assert.equal(
      activityPayload.data.rebalanceOrchestration.automationTruth.autonomousExecutionProven,
      false,
    );
    assert.equal(activityPayload.data.rebalanceHistory.length, 1);
  } finally {
    await harness.close();
  }
});

test("directional preflight stays preview-only and fail-closed from research manifests", async () => {
  const harness = await startServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/manifests/preflight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotId: "advanced.default_directional",
        userNotionalUsd: 2500,
        walletState: {
          walletConnected: true,
          fundedNotionalUsd: 3000,
          smartAccount: {
            status: "ready",
            address: harness.auth.primary.smartWalletAddress,
          },
        },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.executionPlan.surfaceTruth, "preview");
    assert.equal(payload.data.executionPlan.executionState, "blocked");
    assert.equal(
      payload.data.executionPlan.routeTruthLabels[0].truthState,
      "unverified",
    );
  } finally {
    await harness.close();
  }
});

test("execution create persists an operator-manual execution request from a ready activation snapshot", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket();

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const executionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const executionPayload = await executionResponse.json();

    assert.equal(executionResponse.status, 200);
    assert.equal(executionPayload.data.executionRequest.activationId, activationPayload.data.activation.activationId);
    assert.equal(executionPayload.data.executionRequest.runtimeOwner, "operator_manual");
    assert.equal(executionPayload.data.executionRequest.triggerSource, "operator_manual");
    assert.equal(
      executionPayload.data.executionRequest.legs.some((leg) => leg.state === "deferred"),
      true,
    );
    assert.equal(
      executionPayload.data.executionRequest.legs.filter((leg) => leg.state === "pending").length > 0,
      true,
    );

    const readResponse = await fetch(
      `${harness.baseUrl}/api/executions?activationId=${activationPayload.data.activation.activationId}`,
      {
        headers: harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
    );
    const readPayload = await readResponse.json();

    assert.equal(readResponse.status, 200);
    assert.equal(readPayload.data.items.length, 1);
  } finally {
    await harness.close();
  }
});

test("authenticated CoW activation can reach quote readiness at a small requested notional without a smart wallet", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub(),
  });

  try {
    const walletState = {
      walletConnected: true,
      walletAddress: harness.auth.primary.walletAddress,
      fundedNotionalUsd: 25,
    };
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState,
      }),
    });
    const activationPayload = await activationResponse.json();

    assert.equal(activationResponse.status, 201);
    assert.equal(activationPayload.data.activation.status, "ready");
    assert.equal(
      activationPayload.data.executionPlan.executionEligibility,
      "executable",
    );
    assert.equal(
      activationPayload.data.executionPlan.smartAccount.readiness,
      "not_required",
    );
    assert.equal(
      activationPayload.data.executionPlan.fundingPath.minRequiredUsd,
      25,
    );

    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    assert.equal(createResponse.status, 200);
    assert.ok(quoteLeg);

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const quotedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(quotedLeg.state, "awaiting_approval");
    assert.equal(
      quotedLeg.receivingTokenAddress,
      quoteLeg.receivingTokenAddress,
    );
    assert.equal(
      quotedLeg.quote.order.buyToken,
      quoteLeg.receivingTokenAddress,
    );
    assert.equal(
      quotedLeg.quote.order.receiver,
      harness.auth.primary.walletAddress.toLowerCase(),
    );
    assert.equal(
      quotedLeg.approval.signerAddress,
      harness.auth.primary.walletAddress.toLowerCase(),
    );
  } finally {
    await harness.close();
  }
});

test("execution dual-RFQs CoW and 1inch but keeps CoW selected when both venues quote", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub(),
    oneInchExecutionClient: createOneInchExecutionClientStub({
      toTokenAmount: "223576036691965274",
    }),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState: {
          walletConnected: true,
          walletAddress: harness.auth.primary.walletAddress,
          fundedNotionalUsd: 25,
        },
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const quotedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(quotedLeg.state, "awaiting_approval");
    assert.equal(quotedLeg.quote.kind, "cow_swap");
    assert.equal(quotedLeg.adapterId, "cow_swap");
    assert.equal(quotedLeg.venueId, "cow_swap.ethereum");
    assert.equal(
      quotedLeg.venueStatus.rawStatus.selectedAdapterId,
      "cow_swap",
    );
    assert.equal(
      quotedLeg.venueStatus.rawStatus.quoteAttempts.cow_swap.status,
      "quoted",
    );
    assert.equal(
      quotedLeg.venueStatus.rawStatus.quoteAttempts.oneinch_fusion.status,
      "quoted",
    );
    assert.match(
      quotedLeg.venueStatus.rawStatus.selectionReason,
      /submission-capable venue/i,
    );
  } finally {
    await harness.close();
  }
});

test("execution falls back to 1inch quote readiness when CoW returns no liquidity", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: {
      async requestQuote() {
        throw new Error(
          'CoW quote request failed with status 404: {"errorType":"NoLiquidity","description":"no route found"}',
        );
      },
      async submitOrder() {
        return TEST_COW_ORDER_UID;
      },
      async getOrder() {
        return null;
      },
    },
    oneInchExecutionClient: createOneInchExecutionClientStub(),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState: {
          walletConnected: true,
          walletAddress: harness.auth.primary.walletAddress,
          fundedNotionalUsd: 25,
        },
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const quotedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(quotePayload.data.executionRequest.state, "quote_ready");
    assert.equal(quotedLeg.state, "quote_ready");
    assert.equal(quotedLeg.quote.kind, "oneinch_fusion");
    assert.equal(quotedLeg.adapterId, "oneinch_fusion");
    assert.equal(quotedLeg.venueId, "1inch.ethereum");
    assert.equal(quotedLeg.approval, null);
    assert.notEqual(quotedLeg.receivingTokenAddress, quoteLeg.receivingTokenAddress);
    assert.match(quotedLeg.receivingTokenAddress, /^0x1/u);
    assert.equal(
      quotedLeg.venueStatus.rawStatus.selectedAdapterId,
      "oneinch_fusion",
    );
    assert.equal(
      quotedLeg.venueStatus.rawStatus.quoteAttempts.cow_swap.blockerClass,
      "cow_no_liquidity",
    );
    assert.equal(
      quotedLeg.venueStatus.rawStatus.quoteAttempts.oneinch_fusion.status,
      "quoted",
    );
    assert.match(
      quotedLeg.warnings.join(" "),
      /1inch Fusion quote capture is proven/i,
    );
  } finally {
    await harness.close();
  }
});

test("execution create fails closed for a foreign activation owner", async () => {
  const harness = await startServer();

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const executionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          user: "other",
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const executionPayload = await executionResponse.json();

    assert.equal(executionResponse.status, 404);
    assert.match(
      executionPayload.error,
      /Activation .* was not found for the authenticated user/i,
    );
  } finally {
    await harness.close();
  }
});

test("execution quote, approval, submission, and receipt actions persist live CoW truth", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub(),
    ethereumRpcClient: createEthereumRpcClientStub(),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const quotedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(quotedLeg.state, "awaiting_approval");
    assert.equal(quotedLeg.quote.kind, "cow_swap");
    assert.equal(quotedLeg.quote.quoteId, "1126290448");
    assert.equal(quotedLeg.quote.owner, harness.auth.primary.walletAddress.toLowerCase());
    assert.equal(quotedLeg.quote.order.buyToken, quoteLeg.receivingTokenAddress);
    assert.equal(
      quotedLeg.quote.order.receiver,
      harness.auth.primary.smartWalletAddress.toLowerCase(),
    );
    assert.equal(quotedLeg.approval.status, "awaiting_user");
    assert.equal(
      quotedLeg.approval.signerAddress,
      harness.auth.primary.walletAddress.toLowerCase(),
    );
    assert.equal(quotedLeg.venueStatus.status, "quote_ready");

    const submissionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
        signature: TEST_COW_SIGNATURE,
      }),
    });
    const submissionPayload = await submissionResponse.json();
    const submittedLeg = submissionPayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(submissionResponse.status, 200);
    assert.equal(submittedLeg.state, "confirmed");
    assert.equal(submittedLeg.receipt.receiptStatus, "confirmed");
    assert.equal(submittedLeg.receipt.txHash, TEST_SETTLEMENT_TX_HASH);
    assert.equal(submittedLeg.approval.status, "submitted");
    assert.equal(submittedLeg.approval.venueOrderId, TEST_COW_ORDER_UID);
    assert.equal(submittedLeg.trade, null);
    assert.equal(
      submissionPayload.data.activityEvents.some(
        (event) => event.eventType === "activation_submitted",
      ),
      true,
    );
    assert.equal(
      submissionPayload.data.activityEvents.some(
        (event) => event.eventType === "activation_succeeded",
      ),
      true,
    );
  } finally {
    await harness.close();
  }
});

test("execution quote failures persist exact CoW request diagnostics instead of a generic blocker", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: {
      async requestQuote() {
        throw new Error(
          'CoW quote request failed with status 404: {"errorType":"NoLiquidity","description":"no route found"}',
        );
      },
      async submitOrder() {
        return TEST_COW_ORDER_UID;
      },
      async getOrder() {
        return null;
      },
    },
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState: {
          walletConnected: true,
          walletAddress: harness.auth.primary.walletAddress,
          fundedNotionalUsd: 25,
        },
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const blockedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(blockedLeg.state, "blocked");
    const cowAttempt = blockedLeg.venueStatus.rawStatus.quoteAttempts.cow_swap;
    assert.equal(
      blockedLeg.blockers[0].includes(
        `sellAmountBeforeFee=${cowAttempt.sellAmountBeforeFee}`,
      ),
      true,
    );
    assert.equal(
      blockedLeg.blockers[0].includes(
        `targetNotionalUsd=${Number(quoteLeg.targetNotionalUsd).toFixed(2)}`,
      ),
      true,
    );
    assert.match(blockedLeg.blockers[0], /blockerClass=cow_no_liquidity/i);
    assert.match(blockedLeg.blockers[0], /NoLiquidity/i);
    assert.equal(blockedLeg.venueStatus.status, "quote_failed");
    assert.equal(
      cowAttempt.buyToken,
      quoteLeg.receivingTokenAddress,
    );
    assert.match(cowAttempt.sellAmountBeforeFee, /^[0-9]+$/u);
    assert.equal(cowAttempt.errorStatusCode, 404);
    assert.equal(cowAttempt.errorType, "NoLiquidity");
    assert.equal(
      cowAttempt.errorDescription,
      "no route found",
    );
    assert.equal(
      cowAttempt.blockerClass,
      "cow_no_liquidity",
    );
    assert.match(cowAttempt.error, /NoLiquidity/i);
  } finally {
    await harness.close();
  }
});

test("execution quote failures persist exact CoW internal-error diagnostics when the venue returns a 500 shell", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: {
      async requestQuote() {
        throw new Error(
          'CoW quote request failed with status 500: {"errorType":"InternalServerError","description":""}',
        );
      },
      async submitOrder() {
        return TEST_COW_ORDER_UID;
      },
      async getOrder() {
        return null;
      },
    },
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState: {
          walletConnected: true,
          walletAddress: harness.auth.primary.walletAddress,
          fundedNotionalUsd: 25,
        },
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    const quoteResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const quotePayload = await quoteResponse.json();
    const blockedLeg = quotePayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(quoteResponse.status, 200);
    assert.equal(blockedLeg.state, "blocked");
    assert.match(
      blockedLeg.blockers[0],
      /blockerClass=cow_internal_server_error/i,
    );
    assert.match(
      blockedLeg.blockers[0],
      /venueErrorType=InternalServerError/i,
    );
    assert.equal(blockedLeg.venueStatus.status, "quote_failed");
    const cowAttempt = blockedLeg.venueStatus.rawStatus.quoteAttempts.cow_swap;
    assert.equal(cowAttempt.errorStatusCode, 500);
    assert.equal(
      cowAttempt.errorType,
      "InternalServerError",
    );
    assert.equal(cowAttempt.errorDescription, null);
    assert.equal(
      cowAttempt.blockerClass,
      "cow_internal_server_error",
    );
    assert.equal(
      cowAttempt.errorBody,
      '{"errorType":"InternalServerError","description":""}',
    );
  } finally {
    await harness.close();
  }
});

test("execution submission fails closed when no user signature is supplied", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub(),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });

    const submissionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });
    const submissionPayload = await submissionResponse.json();

    assert.equal(submissionResponse.status, 400);
    assert.match(
      submissionPayload.error,
      /signature must be a 65-byte 0x-prefixed EIP-712 signature/i,
    );
  } finally {
    await harness.close();
  }
});

test("execution submission fails closed when the selected quote is 1inch-only", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: {
      async requestQuote() {
        throw new Error(
          'CoW quote request failed with status 404: {"errorType":"NoLiquidity","description":"no route found"}',
        );
      },
      async submitOrder() {
        return TEST_COW_ORDER_UID;
      },
      async getOrder() {
        return null;
      },
    },
    oneInchExecutionClient: createOneInchExecutionClientStub(),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 25,
        walletState: {
          walletConnected: true,
          walletAddress: harness.auth.primary.walletAddress,
          fundedNotionalUsd: 25,
        },
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });

    const submissionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
        signature: TEST_COW_SIGNATURE,
      }),
    });
    const submissionPayload = await submissionResponse.json();

    assert.equal(submissionResponse.status, 409);
    assert.match(
      submissionPayload.error,
      /1inch Fusion quote capture is proven/i,
    );
  } finally {
    await harness.close();
  }
});

test("execution submission succeeds with access-token auth when the signer is linked on the canonical Privy user", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub(),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });

    const submissionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
        signature: TEST_COW_SIGNATURE,
      }),
    });
    const submissionPayload = await submissionResponse.json();
    const submittedLeg = submissionPayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(submissionResponse.status, 200);
    assert.equal(submittedLeg.approval.status, "submitted");
  } finally {
    await harness.close();
  }
});

test("execution records a failed CoW venue state when the venue invalidates the order", async () => {
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    cowExecutionClient: createCowExecutionClientStub({
      orderStatus: {
        uid: TEST_COW_ORDER_UID,
        status: "cancelled",
        settlementTxHash: null,
        raw: {
          status: "cancelled",
        },
      },
    }),
  });

  try {
    const activationResponse = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd: 1000,
        walletState: createReadyWalletState(harness.auth),
      }),
    });
    const activationPayload = await activationResponse.json();
    const createResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId: activationPayload.data.activation.activationId,
      }),
    });
    const createPayload = await createResponse.json();
    const quoteLeg = createPayload.data.executionRequest.legs.find(
      (leg) => leg.state === "pending",
    );

    await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
      }),
    });

    const submissionResponse = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth),
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId: createPayload.data.executionRequest.executionRequestId,
        legId: quoteLeg.legId,
        signature: TEST_COW_SIGNATURE,
      }),
    });
    const submissionPayload = await submissionResponse.json();
    const failedLeg = submissionPayload.data.executionRequest.legs.find(
      (leg) => leg.legId === quoteLeg.legId,
    );

    assert.equal(submissionResponse.status, 200);
    assert.equal(failedLeg.state, "failed");
    assert.equal(failedLeg.venueStatus.status, "cancelled");
    assert.equal(failedLeg.receipt, null);
    assert.equal(
      submissionPayload.data.activityEvents.some(
        (event) => event.eventType === "activation_failed",
      ),
      true,
    );
  } finally {
    await harness.close();
  }
});

test("xstocks reporting route fails closed without the operator token", async () => {
  const harness = await startServer({
    reportingToken: TEST_REPORTING_TOKEN,
  });

  try {
    const response = await fetch(`${harness.baseUrl}/api/reporting/xstocks`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.match(payload.error, /operator reporting token is required/i);
  } finally {
    await harness.close();
  }
});

test("autoresearch runtime proof surface stays local-only until a host receipt is recorded", async () => {
  const harness = await startServer({
    autoresearchProofToken: TEST_AUTORESEARCH_PROOF_TOKEN,
  });

  try {
    const initialResponse = await fetch(
      `${harness.baseUrl}/api/runtime/autoresearch?limit=5`,
    );
    const initialPayload = await initialResponse.json();

    assert.equal(initialResponse.status, 200);
    assert.equal(initialPayload.data.runtime.truthBoundary, "worker_runtime_only");
    assert.equal(initialPayload.data.runtime.recurringAutonomousProven, false);
    assert.equal(initialPayload.data.runtime.schedulerHost, null);
    assert.deepEqual(initialPayload.data.runs, []);

    const receiptResponse = await fetch(
      `${harness.baseUrl}/api/internal/autoresearch/receipts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAutoresearchProofHeaders(),
        },
        body: JSON.stringify({
          runtime: {
            runtimeId: "strategy_lab_regular_autoresearch_v1",
            runtimeOwner: "worker_strategy_lab",
            cadenceHours: 24,
            status: "idle",
            truthBoundary: "railway_cron_service",
            repoOwnedRuntime: true,
            recurringAutonomousProven: true,
            supportedTriggerSources: ["manual_cli", "scheduled_cron"],
            notes: [
              "Repo-owned worker runtime exists for regular basket autoresearch refresh.",
              "Recurring autoresearch is now hosted by Railway cron_service autoresearch-worker in production.",
              "Railway scheduler cadence is 5 6 * * *.",
              "Promoted manifests remain the only public explanation boundary.",
            ],
            lastRequestedAt: "2026-04-01T06:05:00.000Z",
            lastStartedAt: "2026-04-01T06:05:00.000Z",
            lastCompletedAt: "2026-04-01T06:06:00.000Z",
            lastRunId: "autoresearch_railway_1",
            lastTriggerSource: "scheduled_cron",
            nextDueAt: "2026-04-02T06:06:00.000Z",
            lastPromotionCount: 1,
            lastPromotedManifestIds: [
              "onboarding.default_basket:starter-trim-v2:promoted",
            ],
            schedulerHost: {
              provider: "railway",
              hostKind: "cron_service",
              projectId: "project_1",
              projectName: "xstocks-strategy-lab-preview",
              environmentId: "env_1",
              environmentName: "production",
              serviceId: "svc_1",
              serviceName: "autoresearch-worker",
              cronSchedule: "5 6 * * *",
            },
            proofUpdatedAt: "2026-04-01T06:06:05.000Z",
          },
          run: {
            runId: "autoresearch_railway_1",
            runtimeId: "strategy_lab_regular_autoresearch_v1",
            runtimeOwner: "worker_strategy_lab",
            triggerSource: "scheduled_cron",
            cadenceHours: 24,
            status: "succeeded",
            truthBoundary: "railway_cron_service",
            recurringAutonomousProven: true,
            startedAt: "2026-04-01T06:05:00.000Z",
            completedAt: "2026-04-01T06:06:00.000Z",
            slotIds: ["onboarding.default_basket"],
            baselineSeeded: true,
            waveExecuted: true,
            previousManifestIds: [
              "onboarding.default_basket:baseline-v1:promoted",
            ],
            nextManifestIds: [
              "onboarding.default_basket:starter-trim-v2:promoted",
            ],
            promotedManifestIds: [
              "onboarding.default_basket:starter-trim-v2:promoted",
            ],
            promotionCount: 1,
            checks: {
              researchContractsOk: true,
              researchRunIntegrityOk: true,
              promotedBoundaryOk: true,
            },
            note: "railway cron service",
            errorMessage: null,
            schedulerReceipt: {
              provider: "railway",
              hostKind: "cron_service",
              receiptCapturedAt: "2026-04-01T06:06:05.000Z",
              deploymentId: "deployment_1",
              snapshotId: "snapshot_1",
              publicDomain: null,
              privateDomain: "autoresearch-worker.railway.internal",
              projectId: "project_1",
              projectName: "xstocks-strategy-lab-preview",
              environmentId: "env_1",
              environmentName: "production",
              serviceId: "svc_1",
              serviceName: "autoresearch-worker",
              cronSchedule: "5 6 * * *",
              gitCommitSha: "abc123",
              gitBranch: "main",
            },
          },
        }),
      },
    );
    const receiptPayload = await receiptResponse.json();

    assert.equal(receiptResponse.status, 200);
    assert.equal(
      receiptPayload.data.runtime.truthBoundary,
      "railway_cron_service",
    );
    assert.equal(
      receiptPayload.data.runtime.recurringAutonomousProven,
      true,
    );
    assert.equal(
      receiptPayload.data.run.schedulerReceipt.serviceName,
      "autoresearch-worker",
    );

    const verifiedResponse = await fetch(
      `${harness.baseUrl}/api/runtime/autoresearch?limit=5`,
    );
    const verifiedPayload = await verifiedResponse.json();

    assert.equal(verifiedResponse.status, 200);
    assert.equal(
      verifiedPayload.data.runtime.schedulerHost.serviceName,
      "autoresearch-worker",
    );
    assert.equal(
      verifiedPayload.data.runtime.recurringAutonomousProven,
      true,
    );
    assert.equal(verifiedPayload.data.runs.length, 1);
    assert.equal(
      verifiedPayload.data.runs[0].schedulerReceipt.deploymentId,
      "deployment_1",
    );
  } finally {
    await harness.close();
  }
});

test("xstocks reporting route returns masked truthful metrics reconciled to execution legs only", async () => {
  const quoteClient = createCowExecutionClientStub();
  const confirmedOrderUid = `0x${"c".repeat(112)}`;
  const failedOrderUid = `0x${"d".repeat(112)}`;
  let submissionCount = 0;
  const harness = await startServerWithSyntheticExecutableDefaultBasket({
    reportingToken: TEST_REPORTING_TOKEN,
    cowExecutionClient: {
      requestQuote: quoteClient.requestQuote,
      async submitOrder() {
        submissionCount += 1;
        return submissionCount === 1 ? confirmedOrderUid : failedOrderUid;
      },
      async getOrder(uid) {
        if (uid === confirmedOrderUid) {
          return {
            uid,
            status: "fulfilled",
            settlementTxHash: TEST_SETTLEMENT_TX_HASH,
            raw: {
              status: "fulfilled",
            },
          };
        }

        if (uid === failedOrderUid) {
          return {
            uid,
            status: "cancelled",
            settlementTxHash: null,
            raw: {
              status: "cancelled",
            },
          };
        }

        return null;
      },
    },
    ethereumRpcClient: createEthereumRpcClientStub(),
  });

  async function createActivation({
    user = "primary",
    userNotionalUsd = 1000,
    walletState = createReadyWalletState(harness.auth, { user }),
  } = {}) {
    const response = await fetch(`${harness.baseUrl}/api/activations`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth, { user }),
      body: JSON.stringify({
        manifestId: DEFAULT_MANIFEST_ID,
        userNotionalUsd,
        walletState,
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    return payload.data.activation;
  }

  async function createExecution(activationId, { user = "primary" } = {}) {
    const response = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          user,
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "create",
        activationId,
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    return payload.data.executionRequest;
  }

  async function ingestFunnelEvent(
    body,
    { user = "primary", authenticated = false } = {},
  ) {
    const response = await fetch(
      `${harness.baseUrl}/api/funnel-events/xstocks`,
      {
        method: "POST",
        headers: authenticated
          ? {
              "Content-Type": "application/json",
              ...harness.auth.headers({
                user,
                includeIdentityToken: false,
              }),
            }
          : {
              "Content-Type": "application/json",
            },
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    return payload.data;
  }

  async function quoteExecutionLeg(executionRequestId, legId, { user = "primary" } = {}) {
    const response = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...harness.auth.headers({
          user,
          includeIdentityToken: false,
        }),
      },
      body: JSON.stringify({
        action: "quote_leg",
        executionRequestId,
        legId,
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    return payload.data.executionRequest;
  }

  async function submitExecutionLeg(executionRequestId, legId, { user = "primary" } = {}) {
    const response = await fetch(`${harness.baseUrl}/api/executions`, {
      method: "POST",
      headers: createJsonHeaders(harness.auth, { user }),
      body: JSON.stringify({
        action: "record_submission",
        executionRequestId,
        legId,
        signature: TEST_COW_SIGNATURE,
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    return payload.data.executionRequest;
  }

  try {
    const primaryLanding = await ingestFunnelEvent({
      stage: "landing_viewed",
    });
    await ingestFunnelEvent({
      stage: "onboarding_started",
      subjectId: primaryLanding.subjectId,
    });
    await ingestFunnelEvent({
      stage: "activation_viewed",
      subjectId: primaryLanding.subjectId,
      manifestId: DEFAULT_MANIFEST_ID,
    });
    await ingestFunnelEvent(
      {
        stage: "wallet_connected",
        subjectId: primaryLanding.subjectId,
      },
      {
        authenticated: true,
      },
    );

    const otherLanding = await ingestFunnelEvent({
      stage: "landing_viewed",
    });
    await ingestFunnelEvent(
      {
        stage: "wallet_connected",
        subjectId: otherLanding.subjectId,
      },
      {
        user: "other",
        authenticated: true,
      },
    );

    const fundingRequiredActivation = await createActivation({
      walletState: {
        walletConnected: true,
        walletAddress: harness.auth.primary.walletAddress,
        fundedNotionalUsd: 0,
        smartAccount: {
          status: "ready",
          address: harness.auth.primary.smartWalletAddress,
        },
      },
    });
    assert.equal(fundingRequiredActivation.status, "funding_required");

    const quoteOnlyActivation = await createActivation();
    const quoteOnlyRequest = await createExecution(quoteOnlyActivation.activationId);
    const quoteOnlyLeg = quoteOnlyRequest.legs.find((leg) => leg.state === "pending");
    const quoteOnlyQuotedRequest = await quoteExecutionLeg(
      quoteOnlyRequest.executionRequestId,
      quoteOnlyLeg.legId,
    );

    const confirmedActivation = await createActivation();
    const confirmedRequest = await createExecution(confirmedActivation.activationId);
    const confirmedLeg = confirmedRequest.legs.find((leg) => leg.state === "pending");
    await quoteExecutionLeg(confirmedRequest.executionRequestId, confirmedLeg.legId);
    const confirmedSubmittedRequest = await submitExecutionLeg(
      confirmedRequest.executionRequestId,
      confirmedLeg.legId,
    );

    const failedActivation = await createActivation({ user: "other" });
    const failedRequest = await createExecution(failedActivation.activationId, {
      user: "other",
    });
    const failedLeg = failedRequest.legs.find((leg) => leg.state === "pending");
    await quoteExecutionLeg(failedRequest.executionRequestId, failedLeg.legId, {
      user: "other",
    });
    const failedSubmittedRequest = await submitExecutionLeg(
      failedRequest.executionRequestId,
      failedLeg.legId,
      {
        user: "other",
      },
    );

    const confirmedExecutionLeg = confirmedSubmittedRequest.legs.find(
      (leg) => leg.legId === confirmedLeg.legId,
    );
    const failedExecutionLeg = failedSubmittedRequest.legs.find(
      (leg) => leg.legId === failedLeg.legId,
    );
    const quotedOnlyExecutionLeg = quoteOnlyQuotedRequest.legs.find(
      (leg) => leg.legId === quoteOnlyLeg.legId,
    );
    const expectedSubmittedVolume = Number(
      (
        Number(confirmedExecutionLeg.targetNotionalUsd) +
        Number(failedExecutionLeg.targetNotionalUsd)
      ).toFixed(2),
    );
    const expectedConfirmedVolume = Number(
      Number(confirmedExecutionLeg.targetNotionalUsd).toFixed(2),
    );

    assert.equal(Boolean(quotedOnlyExecutionLeg.quote), true);
    assert.equal(quotedOnlyExecutionLeg.approval.status, "awaiting_user");
    assert.equal(confirmedExecutionLeg.state, "confirmed");
    assert.equal(failedExecutionLeg.state, "failed");

    const reportResponse = await fetch(
      `${harness.baseUrl}/api/reporting/xstocks?limit=10`,
      {
        headers: createReportingHeaders(),
      },
    );
    const reportPayload = await reportResponse.json();
    const report = reportPayload.data;

    assert.equal(reportResponse.status, 200);
    assert.equal(report.privacy.walletAddresses, "masked");
    assert.equal(report.privacy.rawUserIds, "hidden");
    assert.equal(report.metrics.funnel.landingViewed, 2);
    assert.equal(report.metrics.funnel.onboardingStarted, 1);
    assert.equal(report.metrics.funnel.activationViewed, 1);
    assert.equal(report.metrics.users.authenticated, 2);
    assert.equal(report.metrics.wallets.connected, 2);
    assert.equal(report.metrics.wallets.smart, 2);
    assert.equal(report.metrics.activations.total, 4);
    assert.equal(report.metrics.users.activationSavedFundingBlocked, 1);
    assert.equal(report.metrics.activations.savedFundingBlocked, 1);
    assert.equal(report.metrics.executions.requestsTotal, 3);
    assert.equal(report.metrics.executions.requestsWithQuotedLeg, 3);
    assert.equal(report.metrics.executions.requestsAwaitingApproval, 1);
    assert.equal(report.metrics.executions.requestsWithSubmittedLeg, 2);
    assert.equal(report.metrics.executions.requestsWithConfirmedLeg, 1);
    assert.equal(report.metrics.executions.requestsWithFailedLeg, 1);
    assert.equal(report.metrics.volumeUsd.submitted, expectedSubmittedVolume);
    assert.equal(report.metrics.volumeUsd.confirmed, expectedConfirmedVolume);
    assert.equal(
      report.ladder.find((stage) => stage.stage === "landing_viewed").coverage,
      "canonical",
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "wallet_connected").coverage,
      "canonical",
    );
    assert.equal(
      report.ladder.find(
        (stage) => stage.stage === "activation_saved_funding_blocked",
      ).coverage,
      "canonical",
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "submitted").coverage,
      "canonical",
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "wallet_connected").reached.subjects,
      2,
    );
    assert.equal(
      report.ladder.find(
        (stage) => stage.stage === "activation_saved_funding_blocked",
      ).reached.users,
      1,
    );
    assert.equal(
      report.ladder.find(
        (stage) => stage.stage === "activation_saved_funding_blocked",
      ).reached.activations,
      1,
    );
    assert.equal(
      report.ladder.find(
        (stage) => stage.stage === "activation_saved_funding_blocked",
      ).source,
      "runtime_store.funnel_events",
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "quote_ready").reached.executionRequests,
      3,
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "submitted").reached.executionRequests,
      2,
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "confirmed").reached.executionRequests,
      1,
    );
    assert.equal(
      report.ladder.find((stage) => stage.stage === "failed").reached.executionRequests,
      1,
    );
    assert.equal(
      report.blockers.some(
        (blocker) => blocker.blockerId === "missing_partner_auth_model",
      ),
      true,
    );
    assert.equal(
      report.blockers.some(
        (blocker) =>
          blocker.blockerId === "generic_funding_readiness_pre_save_unproven",
      ),
      true,
    );
    assert.equal(
      report.recentExecutions.every((item) =>
        item.walletLabel === null
          ? true
          : /^0x[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/u.test(item.walletLabel),
      ),
      true,
    );
    assert.equal(report.reconciliation.submittedVolumeUsd, expectedSubmittedVolume);
    assert.equal(report.reconciliation.confirmedVolumeUsd, expectedConfirmedVolume);
    assert.equal(
      report.reconciliation.lines.length,
      2,
    );
    assert.equal(
      report.reconciliation.lines.some(
        (line) =>
          line.legId === quoteOnlyLeg.legId &&
          line.includedInSubmittedVolume === true,
      ),
      false,
    );
    assert.equal(
      report.reconciliation.lines.reduce(
        (total, line) =>
          total +
          (line.includedInSubmittedVolume ? Number(line.targetNotionalUsd) : 0),
        0,
      ),
      expectedSubmittedVolume,
    );
    assert.equal(
      report.reconciliation.lines.reduce(
        (total, line) =>
          total +
          (line.includedInConfirmedVolume ? Number(line.targetNotionalUsd) : 0),
        0,
      ),
      expectedConfirmedVolume,
    );
  } finally {
    await harness.close();
  }
});

test("qualification endpoint returns canonical agent-facing qualification output", async () => {
  const harness = await startServer();

  try {
    for (const fixtureName of [
      "broad-cautious",
      "theme-tilt",
      "active-leaders",
      "directional-opt-in",
    ]) {
      const fixture = await loadQualificationFixture(fixtureName);
      const response = await fetch(`${harness.baseUrl}/api/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fixture),
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(
        payload.data.qualification.selection.slotId,
        fixture.expected.slotId,
      );
      assert.equal(
        payload.data.qualification.selection.mode,
        fixture.expected.mode,
      );
      assert.equal(
        payload.data.qualification.activationTruth.executionState,
        fixture.expected.executionState,
      );
      assert.equal(
        payload.data.qualification.activationTruth.directionalPreviewOnly,
        fixture.expected.directionalPreviewOnly,
      );
      assert.equal(
        payload.data.qualification.explanationSurface.surfaceId,
        "recommendation.explanationBundle",
      );
    }
  } finally {
    await harness.close();
  }
});
