import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_MSTRX_NORMALIZED_LIVE_STATE,
  CANONICAL_MSTRX_LIVE_FIXTURE,
  CANONICAL_SPYX_LIVE_FIXTURE,
  CANONICAL_SPYX_NORMALIZED_LIVE_STATE,
  CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
  XSTOCKS_EXECUTION_RAIL,
  XSTOCKS_PUBLIC_PATHS,
  ROUTE_TRUTH,
  buildExecutionRoutes,
  buildXStocksStateStripCollection,
  buildPolicyRouteStateFromFetchedAssets,
  createAusdBridgeAssetSnapshot,
  createCowSwapApiClient,
  createOneInchFusionApiClient,
  createXStocksClientApiClient,
  createXStocksBoundaryRepository,
  deriveExecutionRouteTruth,
  fetchXStocksBoundaryAsset,
  fetchNormalizedXStocksLiveState
} from "../dist/index.js";

function createFixtureClient(fixture) {
  return {
    baseUrl: "https://fixtures.xstocks.local",
    async get(path) {
      switch (path) {
        case XSTOCKS_PUBLIC_PATHS.asset(fixture.symbol):
          return fixture.asset;
        case XSTOCKS_PUBLIC_PATHS.priceData(fixture.symbol):
          return fixture.priceData;
        case XSTOCKS_PUBLIC_PATHS.multiplier(fixture.symbol):
          return fixture.multiplier;
        case XSTOCKS_PUBLIC_PATHS.multiplierHistory(fixture.symbol):
          return fixture.multiplierHistory;
        case XSTOCKS_PUBLIC_PATHS.proofOfReserves(fixture.symbol):
          return fixture.proofOfReserves;
        case XSTOCKS_PUBLIC_PATHS.systemStatus(fixture.symbol):
          return fixture.systemStatus;
        default:
          throw new Error(`Unexpected xstocks fixture path: ${path}`);
      }
    }
  };
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function createBackedQuoteFixture(priceUsd, symbol = "UNKNOWN") {
  const scaled = Number((priceUsd * 100).toFixed(6));

  return {
    symbol,
    bid: scaled,
    ask: scaled,
    currency: "USD",
    minOrderFiatValue: 1000,
  };
}

function createBoundaryFetch(fixtures, overrides = {}) {
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.symbol, fixture]));

  return async function fetchImpl(input) {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const path = url.pathname.replace(/^\/api\/v2/u, "");
    const override = overrides[path];

    if (override) {
      return typeof override === "function" ? override(url) : createJsonResponse(override);
    }

    const assetMatch = path.match(/^\/public\/assets\/([^/]+)$/u);
    if (assetMatch) {
      const symbol = decodeURIComponent(assetMatch[1]);
      return createJsonResponse(fixtureMap.get(symbol).asset);
    }

    const priceMatch = path.match(/^\/public\/assets\/([^/]+)\/price-data$/u);
    if (priceMatch) {
      const symbol = decodeURIComponent(priceMatch[1]);
      return createJsonResponse(fixtureMap.get(symbol).priceData);
    }

    const backedQuoteMatch = url.pathname.match(/^\/api\/v1\/quotes\/assets\/([^/]+)$/u);
    if (backedQuoteMatch) {
      const symbol = decodeURIComponent(backedQuoteMatch[1]);
      const fixture = fixtureMap.get(symbol);

      if (!fixture) {
        return createJsonResponse({ error: `No fixture for ${url.pathname}` }, 404);
      }

      return createJsonResponse(
        createBackedQuoteFixture(fixture.priceData.quote ?? 0, symbol),
      );
    }

    const statusMatch = path.match(/^\/public\/system\/status\/([^/]+)$/u);
    if (statusMatch) {
      const symbol = decodeURIComponent(statusMatch[1]);
      return createJsonResponse(fixtureMap.get(symbol).systemStatus);
    }

    const reservesMatch = path.match(/^\/public\/proof-of-reserves\/([^/]+)$/u);
    if (reservesMatch) {
      const symbol = decodeURIComponent(reservesMatch[1]);
      return createJsonResponse(fixtureMap.get(symbol).proofOfReserves);
    }

    throw new Error(`Unexpected fetch path in xstocks boundary test: ${path}`);
  };
}

test("fetchNormalizedXStocksLiveState returns the canonical normalized live state", async () => {
  const state = await fetchNormalizedXStocksLiveState(
    createFixtureClient(CANONICAL_SPYX_LIVE_FIXTURE),
    CANONICAL_SPYX_LIVE_FIXTURE.symbol,
    {
      network: CANONICAL_SPYX_LIVE_FIXTURE.network,
      fetchedAt: CANONICAL_SPYX_LIVE_FIXTURE.fetchedAt
    }
  );

  assert.deepEqual(state, CANONICAL_SPYX_NORMALIZED_LIVE_STATE);

  const routesById = new Map(state.executionRoutes.map((route) => [route.id, route]));

  assert.equal(state.routeTruth, ROUTE_TRUTH.LIVE);
  assert.equal(routesById.get(XSTOCKS_EXECUTION_RAIL.COW_SWAP)?.truth, ROUTE_TRUTH.LIVE);
  assert.equal(routesById.get(XSTOCKS_EXECUTION_RAIL.COW_SWAP)?.proofSource, "verified_public");
  assert.equal(routesById.get(XSTOCKS_EXECUTION_RAIL.ONEINCH)?.truth, ROUTE_TRUTH.LIVE);
  assert.equal(
    routesById.get(XSTOCKS_EXECUTION_RAIL.SPREAD_FINANCE)?.truth,
    ROUTE_TRUTH.MENTOR_CONFIRMED
  );
  assert.equal(
    routesById.get(XSTOCKS_EXECUTION_RAIL.SPREAD_FINANCE)?.proofSource,
    "mentor_reported"
  );
});

test("buildXStocksStateStripCollection sorts canonical state strips and preserves collection metadata", () => {
  const collection = buildXStocksStateStripCollection(
    [CANONICAL_SPYX_NORMALIZED_LIVE_STATE, CANONICAL_MSTRX_NORMALIZED_LIVE_STATE].reverse(),
    {
      generatedAt: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP,
      network: "Ethereum",
      page: {
        currentPage: 0,
        hasNextPage: false
      }
    }
  );

  assert.deepEqual(collection.nodes.map((node) => node.symbol), ["MSTRx", "SPYx"]);
  assert.deepEqual(collection.page, {
    currentPage: 0,
    hasNextPage: false
  });
  assert.equal(collection.generatedAt, CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP);
  assert.deepEqual(collection.nodes[1].asset.atomicSwapNetworks, ["Ethereum", "Ink"]);
  assert.equal(
    collection.nodes[1].routes.find((route) => route.id === XSTOCKS_EXECUTION_RAIL.SPREAD_FINANCE)?.truth,
    ROUTE_TRUTH.MENTOR_CONFIRMED
  );
});

test("deriveExecutionRouteTruth fails closed when canonical trading state is halted", () => {
  const liveRoutes = buildExecutionRoutes(
    CANONICAL_SPYX_NORMALIZED_LIVE_STATE.asset,
    CANONICAL_SPYX_NORMALIZED_LIVE_STATE.systemStatus
  );
  const blockedRoutes = buildExecutionRoutes(
    CANONICAL_SPYX_NORMALIZED_LIVE_STATE.asset,
    {
      ...CANONICAL_SPYX_NORMALIZED_LIVE_STATE.systemStatus,
      isMarketTradingHalted: true,
      isAtomicTradingHalted: true,
      canTradeMarket: false,
      canTradeAtomic: false
    }
  );

  assert.equal(deriveExecutionRouteTruth(liveRoutes), ROUTE_TRUTH.LIVE);
  assert.equal(deriveExecutionRouteTruth(blockedRoutes), ROUTE_TRUTH.BLOCKED);
  assert.equal(blockedRoutes.every((route) => route.truth === ROUTE_TRUTH.BLOCKED), true);
});

test("createXStocksBoundaryRepository loads basket boundary state and keeps AUSD as an explicit bridge helper", async () => {
  const repository = createXStocksBoundaryRepository({
    fetchImpl: createBoundaryFetch([CANONICAL_SPYX_LIVE_FIXTURE, CANONICAL_MSTRX_LIVE_FIXTURE]),
    now: () => CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP
  });

  const boundaryState = await repository.loadBoundaryState({
    manifest: {
      executionBoundary: {
        requiredAssets: ["SPYx", "MSTRx", "AUSD"]
      }
    }
  });

  assert.deepEqual(
    boundaryState.liveXStocksState.assets.map((asset) => asset.assetSymbol),
    ["SPYx", "MSTRx", "AUSD"]
  );
  assert.equal(boundaryState.liveXStocksState.assets[2].source, "stablecoin_bridge");
  assert.equal(boundaryState.liveXStocksState.assets[2].proofOfReserves, "repo_scaffolded");
  assert.equal(
    boundaryState.liveRouteState.routes.find((route) => route.routeId === "cow_swap.ethereum")?.availability,
    "available"
  );
  assert.equal(
    boundaryState.liveRouteState.routes.find((route) => route.routeId === "spread.ink")?.availability,
    "unavailable"
  );
});

test("createXStocksBoundaryRepository uses Backed quote midpoints for priceUsd on fetched assets", async () => {
  const backedPriceUsd = 712.34;
  const repository = createXStocksBoundaryRepository({
    fetchImpl: createBoundaryFetch(
      [CANONICAL_SPYX_LIVE_FIXTURE],
      {
        "/api/v1/quotes/assets/SPYx": createBackedQuoteFixture(backedPriceUsd, "SPYx"),
      },
    ),
  });

  const asset = await repository.fetchAssetSnapshot("SPYx");

  assert.equal(asset.priceUsd, backedPriceUsd);
  assert.equal(asset.priceData?.quoteUsd, CANONICAL_SPYX_LIVE_FIXTURE.priceData.quote);
});

test("createXStocksBoundaryRepository falls back to xStocks price data when Backed quotes fail", async () => {
  const repository = createXStocksBoundaryRepository({
    fetchImpl: createBoundaryFetch(
      [CANONICAL_SPYX_LIVE_FIXTURE],
      {
        "/api/v1/quotes/assets/SPYx": () =>
          new Response(JSON.stringify({ error: "upstream unavailable" }), {
            status: 503,
            headers: {
              "content-type": "application/json",
            },
          }),
      },
    ),
  });

  const asset = await repository.fetchAssetSnapshot("SPYx");

  assert.equal(asset.priceUsd, CANONICAL_SPYX_LIVE_FIXTURE.priceData.quote);
  assert.match(asset.notes.join(" "), /Backed quote request failed with status 503/u);
});

test("buildPolicyRouteStateFromFetchedAssets derives Ethereum and Ink route availability from deployments", async () => {
  const fetchImpl = createBoundaryFetch([CANONICAL_SPYX_LIVE_FIXTURE, CANONICAL_MSTRX_LIVE_FIXTURE]);
  const repository = createXStocksBoundaryRepository({
    fetchImpl,
    now: () => CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP
  });
  const spyxOnlyAssets = await repository.fetchRequiredAssets(["SPYx", "AUSD"]);
  const mixedAssets = await repository.fetchRequiredAssets(["SPYx", "MSTRx", "AUSD"]);

  const spyxRoutes = buildPolicyRouteStateFromFetchedAssets(spyxOnlyAssets, {
    asOf: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP
  });
  const mixedRoutes = buildPolicyRouteStateFromFetchedAssets(mixedAssets, {
    asOf: CANONICAL_XSTOCKS_FIXTURE_TIMESTAMP
  });

  assert.equal(
    spyxRoutes.routes.find((route) => route.routeId === "spread.ink")?.availability,
    "available"
  );
  assert.equal(
    mixedRoutes.routes.find((route) => route.routeId === "spread.ink")?.availability,
    "unavailable"
  );
});

test("createCowSwapApiClient requests quotes against the CoW API shape", async () => {
  const requests = [];
  const client = createCowSwapApiClient({
    baseUrl: "https://cow.fi.test",
    fetch: async (input, init = {}) => {
      requests.push({
        url: String(input),
        method: init.method,
        body: init.body,
        signal: init.signal,
      });
      return createJsonResponse({
        quote: {
          sellToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          buyToken: "0x1234000000000000000000000000000000000000",
          receiver: "0x00000000000000000000000000000000000000aa",
          sellAmount: "1000000",
          buyAmount: "900000000000000000",
          validTo: 1775000000,
          appData: "0x1234",
          feeAmount: "5000",
          kind: "sell",
          partiallyFillable: false,
          sellTokenBalance: "erc20",
          buyTokenBalance: "erc20",
          signingScheme: "eip712"
        },
        from: "0x00000000000000000000000000000000000000aa",
        expiration: "2026-04-01T10:43:22.662874542Z",
        id: 1126290448,
        verified: true
      });
    }
  });

  const quote = await client.requestQuote({
    sellToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    buyToken: "0x1234000000000000000000000000000000000000",
    owner: "0x00000000000000000000000000000000000000aa",
    receiver: "0x00000000000000000000000000000000000000aa",
    kind: "sell",
    sellAmountBeforeFee: "1000000"
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://cow.fi.test/quote");
  assert.equal(requests[0].method, "POST");
  assert.match(String(requests[0].body), /"sellAmountBeforeFee":"1000000"/);
  assert.equal(quote.id, 1126290448);
  assert.equal(quote.quote.signingScheme, "eip712");
  assert.ok(requests[0].signal instanceof AbortSignal);
});

test("createCowSwapApiClient times out stalled quote requests after the configured wait", async () => {
  const client = createCowSwapApiClient({
    baseUrl: "https://cow.fi.test",
    requestTimeoutMs: 10,
    fetch: async (_input, init = {}) =>
      await new Promise((resolve, reject) => {
        init.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  });

  await assert.rejects(
    client.requestQuote({
      sellToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      buyToken: "0x1234000000000000000000000000000000000000",
      owner: "0x00000000000000000000000000000000000000aa",
      receiver: "0x00000000000000000000000000000000000000aa",
      kind: "sell",
      sellAmountBeforeFee: "1000000",
    }),
    /CoW request timed out after 10ms for \/quote/u,
  );
});

test("createCowSwapApiClient fails closed on non-2xx order submission", async () => {
  const client = createCowSwapApiClient({
    baseUrl: "https://cow.fi.test",
    fetch: async () =>
      new Response("invalid signature", {
        status: 422,
        headers: {
          "content-type": "text/plain"
        }
      })
  });

  await assert.rejects(
    client.submitOrder({
      sellToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      buyToken: "0x1234000000000000000000000000000000000000",
      receiver: "0x00000000000000000000000000000000000000aa",
      sellAmount: "1000000",
      buyAmount: "900000000000000000",
      validTo: 1775000000,
      appData: "0x1234",
      feeAmount: "5000",
      kind: "sell",
      partiallyFillable: false,
      sellTokenBalance: "erc20",
      buyTokenBalance: "erc20",
      signingScheme: "eip712",
      from: "0x00000000000000000000000000000000000000aa",
      signature: "0xabcdef"
    }),
    /CoW order submission failed with status 422/u
  );
});

test("createOneInchFusionApiClient requests Fusion quotes with bearer auth", async () => {
  const requests = [];
  const client = createOneInchFusionApiClient({
    authKey: "test-oneinch-key",
    baseUrl: "https://api.1inch.dev/fusion",
    networkId: 1,
    fetch: async (input, init = {}) => {
      requests.push({
        url: String(input),
        method: init.method,
        headers: init.headers,
        signal: init.signal,
      });

      return createJsonResponse({
        quoteId: "quote_1",
        fromTokenAmount: "20000000",
        toTokenAmount: "113576036691965274",
        feeToken: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
        presets: {},
        fee: {
          receiver: "0x90cbe4bdd538d6e9b379bff5fe72c3d67a521de5",
          bps: 0,
          whitelistDiscountPercent: 0,
        },
        integratorFee: 0,
        integratorFeeShare: 0,
        settlementAddress: "0x399740157391a9f1bf4e9921a8834f9bc8f2678e",
        whitelist: [],
        recommended_preset: "fast",
        priceImpactPercent: 0.38,
      });
    },
  });

  const quote = await client.requestQuote({
    fromTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    toTokenAddress: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
    amount: "20000000",
    walletAddress: "0x1111111111111111111111111111111111111111",
    enableEstimate: true,
    source: "xstocks-strategy-lab",
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(
    requests[0].headers.authorization,
    "Bearer test-oneinch-key",
  );
  assert.match(requests[0].url, /^https:\/\/api\.1inch\.dev\/fusion\//u);
  assert.match(
    requests[0].url,
    /\/quoter\/v2\.0\/1\/quote\/receive\?/u,
  );
  assert.match(requests[0].url, /enableEstimate=true/u);
  assert.match(requests[0].url, /source=xstocks-strategy-lab/u);
  assert.ok(requests[0].signal instanceof AbortSignal);
  assert.equal(quote.quoteId, "quote_1");
  assert.equal(quote.recommended_preset, "fast");
});

test("createOneInchFusionApiClient times out stalled Fusion quotes", async () => {
  const client = createOneInchFusionApiClient({
    authKey: "test-oneinch-key",
    requestTimeoutMs: 10,
    fetch: async (_input, init = {}) =>
      await new Promise((resolve, reject) => {
        init.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  });

  await assert.rejects(
    client.requestQuote({
      fromTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      toTokenAddress: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
      amount: "20000000",
      walletAddress: "0x1111111111111111111111111111111111111111",
      enableEstimate: true,
    }),
    /1inch Fusion request timed out after 10ms/u,
  );
});

test("createOneInchFusionApiClient fails closed on non-2xx Fusion quote responses", async () => {
  const client = createOneInchFusionApiClient({
    authKey: "test-oneinch-key",
    fetch: async () =>
      new Response(
        JSON.stringify({
          error: "Bad Request",
          code: "CANNOT_FETCH_PRICE",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  await assert.rejects(
    client.requestQuote({
      fromTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      toTokenAddress: "0xdeadbeef00000000000000000000000000000000",
      amount: "20000000",
      walletAddress: "0x1111111111111111111111111111111111111111",
      enableEstimate: true,
    }),
    /1inch Fusion quote request failed with status 400/u,
  );
});

test("createOneInchFusionApiClient prepares Fusion orders with a string receiver", async () => {
  const requests = [];
  const client = createOneInchFusionApiClient({
    authKey: "test-oneinch-key",
    baseUrl: "https://api.1inch.dev/fusion",
    networkId: 1,
    fetch: async (input, init = {}) => {
      requests.push({
        url: String(input),
        method: init.method,
      });

      return createJsonResponse({
        quoteId: "quote_prepare_1",
        fromTokenAmount: "20000000",
        toTokenAmount: "113576036691965274",
        marketAmount: "113576036691965274",
        feeToken: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
        presets: {
          fast: {
            auctionDuration: 180,
            startAuctionIn: 36,
            bankFee: "0",
            initialRateBump: 200461,
            auctionStartAmount: "114000000000000000",
            auctionEndAmount: "113576036691965274",
            tokenFee: "0",
            points: [
              {
                delay: 24,
                coefficient: 50461,
              },
            ],
            allowPartialFills: true,
            allowMultipleFills: true,
            exclusiveResolver: null,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
            },
          },
          medium: {
            auctionDuration: 180,
            startAuctionIn: 12,
            bankFee: "0",
            initialRateBump: 210661,
            auctionStartAmount: "114200000000000000",
            auctionEndAmount: "113576036691965274",
            tokenFee: "0",
            points: [
              {
                delay: 24,
                coefficient: 50461,
              },
            ],
            allowPartialFills: true,
            allowMultipleFills: true,
            exclusiveResolver: null,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
            },
          },
          slow: {
            auctionDuration: 600,
            startAuctionIn: 12,
            bankFee: "0",
            initialRateBump: 302466,
            auctionStartAmount: "114500000000000000",
            auctionEndAmount: "113576036691965274",
            tokenFee: "0",
            points: [
              {
                delay: 24,
                coefficient: 50461,
              },
            ],
            allowPartialFills: true,
            allowMultipleFills: true,
            exclusiveResolver: null,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
            },
          },
        },
        fee: {
          receiver: "0x90cbe4bdd538d6e9b379bff5fe72c3d67a521de5",
          bps: 0,
          whitelistDiscountPercent: 0,
        },
        integratorFee: 0,
        integratorFeeShare: 0,
        settlementAddress: "0x399740157391a9f1bf4e9921a8834f9bc8f2678e",
        whitelist: [
          "0x84d99aa569d93a9ca187d83734c8c4a519c4e9b1",
        ],
        prices: {
          usd: {
            fromToken: "1",
            toToken: "31.55",
          },
        },
        volume: {
          usd: {
            fromToken: "20",
            toToken: "20.1",
          },
        },
        autoK: 5.5,
        recommended_preset: "fast",
        priceImpactPercent: 0.38,
      });
    },
  });

  const preparedOrder = await client.prepareOrder({
    fromTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    toTokenAddress: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
    amount: "20000000",
    walletAddress: "0x1111111111111111111111111111111111111111",
    receiver: "0x2222222222222222222222222222222222222222",
    enableEstimate: true,
  });

  assert.equal(requests.length, 2);
  assert.equal(preparedOrder.receiver, "0x2222222222222222222222222222222222222222");
  assert.equal(preparedOrder.signerAddress, "0x1111111111111111111111111111111111111111");
  assert.match(preparedOrder.orderHash, /^0x[a-f0-9]{64}$/u);
  assert.match(preparedOrder.extension, /^0x[a-f0-9]*$/iu);
  assert.notEqual(preparedOrder.extension, "[object Object]");
});

test("createOneInchFusionApiClient submits encoded extension bytes", async () => {
  const requests = [];
  const client = createOneInchFusionApiClient({
    authKey: "test-oneinch-key",
    baseUrl: "https://api.1inch.dev/fusion",
    networkId: 1,
    fetch: async (input, init = {}) => {
      requests.push({
        url: String(input),
        method: init.method,
        body: init.body ? JSON.parse(String(init.body)) : null,
      });

      if (requests.length <= 2) {
        return createJsonResponse({
          quoteId: "quote_submit_1",
          fromTokenAmount: "20000000",
          toTokenAmount: "113576036691965274",
          marketAmount: "113576036691965274",
          feeToken: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
          presets: {
            fast: {
              auctionDuration: 180,
              startAuctionIn: 36,
              bankFee: "0",
              initialRateBump: 200461,
              auctionStartAmount: "114000000000000000",
              auctionEndAmount: "113576036691965274",
              tokenFee: "0",
              points: [
                {
                  delay: 24,
                  coefficient: 50461,
                },
              ],
              allowPartialFills: true,
              allowMultipleFills: true,
              exclusiveResolver: null,
              gasCost: {
                gasBumpEstimate: 0,
                gasPriceEstimate: "0",
              },
            },
            medium: {
              auctionDuration: 180,
              startAuctionIn: 12,
              bankFee: "0",
              initialRateBump: 210661,
              auctionStartAmount: "114200000000000000",
              auctionEndAmount: "113576036691965274",
              tokenFee: "0",
              points: [
                {
                  delay: 24,
                  coefficient: 50461,
                },
              ],
              allowPartialFills: true,
              allowMultipleFills: true,
              exclusiveResolver: null,
              gasCost: {
                gasBumpEstimate: 0,
                gasPriceEstimate: "0",
              },
            },
            slow: {
              auctionDuration: 600,
              startAuctionIn: 12,
              bankFee: "0",
              initialRateBump: 302466,
              auctionStartAmount: "114500000000000000",
              auctionEndAmount: "113576036691965274",
              tokenFee: "0",
              points: [
                {
                  delay: 24,
                  coefficient: 50461,
                },
              ],
              allowPartialFills: true,
              allowMultipleFills: true,
              exclusiveResolver: null,
              gasCost: {
                gasBumpEstimate: 0,
                gasPriceEstimate: "0",
              },
            },
          },
          fee: {
            receiver: "0x90cbe4bdd538d6e9b379bff5fe72c3d67a521de5",
            bps: 0,
            whitelistDiscountPercent: 0,
          },
          integratorFee: 0,
          integratorFeeShare: 0,
          settlementAddress: "0x399740157391a9f1bf4e9921a8834f9bc8f2678e",
          whitelist: [
            "0x84d99aa569d93a9ca187d83734c8c4a519c4e9b1",
          ],
          prices: {
            usd: {
              fromToken: "1",
              toToken: "31.55",
            },
          },
          volume: {
            usd: {
              fromToken: "20",
              toToken: "20.1",
            },
          },
          autoK: 5.5,
          recommended_preset: "fast",
          priceImpactPercent: 0.38,
        });
      }

      return createJsonResponse({
        orderHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      });
    },
  });

  const preparedOrder = await client.prepareOrder({
    fromTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    toTokenAddress: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
    amount: "20000000",
    walletAddress: "0x1111111111111111111111111111111111111111",
    receiver: "0x2222222222222222222222222222222222222222",
    enableEstimate: true,
  });

  const submission = await client.submitOrder({
    order: preparedOrder.order,
    signature:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1b",
    quoteId: preparedOrder.quoteId,
    extension: preparedOrder.extension,
    orderHash: preparedOrder.orderHash,
  });

  assert.equal(requests.length, 3);
  assert.equal(requests[2].method, "POST");
  assert.equal(requests[2].body.quoteId, preparedOrder.quoteId);
  assert.equal(requests[2].body.extension, preparedOrder.extension);
  assert.match(requests[2].body.extension, /^0x[a-f0-9]*$/iu);
  assert.notEqual(requests[2].body.extension, "[object Object]");
  assert.equal(
    submission.orderHash,
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  );
});

test("fetchXStocksBoundaryAsset preserves halted assets and unverified reserves without overclaiming route truth", async () => {
  const haltedFixture = {
    ...CANONICAL_SPYX_LIVE_FIXTURE,
    proofOfReserves: {
      symbol: "SPYx",
      timestamp: null,
      sharesHeld: null,
      circulatingSupply: null,
      holdings: []
    },
    systemStatus: {
      symbol: "SPYx",
      isMarketTradingHalted: true,
      isAtomicTradingHalted: true
    }
  };
  const repository = createXStocksBoundaryRepository({
    fetchImpl: createBoundaryFetch([haltedFixture])
  });

  const asset = await repository.fetchAssetSnapshot("SPYx");

  assert.equal(asset.status, "halted");
  assert.equal(asset.proofOfReserves, "unverified");
  assert.equal(asset.routeTruth, ROUTE_TRUTH.BLOCKED);
  assert.equal(asset.executionRoutes.every((route) => route.truth === ROUTE_TRUTH.BLOCKED), true);
});

test("createAusdBridgeAssetSnapshot keeps the AUSD gap in package scope as an execution-boundary special case", () => {
  const ausdBridge = createAusdBridgeAssetSnapshot();

  assert.equal(ausdBridge.assetSymbol, "AUSD");
  assert.equal(ausdBridge.source, "stablecoin_bridge");
  assert.equal(ausdBridge.status, "active");
  assert.equal(ausdBridge.proofOfReserves, "repo_scaffolded");
  assert.equal(ausdBridge.deployments.Ethereum?.supportsAtomicSwaps, true);
  assert.match(ausdBridge.notes.join(" "), /not a claim that AUSD is an xStocks public asset/i);
});

test("createXStocksClientApiClient attaches the API key and can request xChange quotes", async () => {
  const requests = [];
  const client = createXStocksClientApiClient({
    apiKey: "test-api-key",
    fetch: async (input, init) => {
      requests.push({
        url: input.toString(),
        init,
      });

      if (input.toString().endsWith("/client/registered-wallets")) {
        return createJsonResponse({
          nodes: [
            {
              address: "0xabc",
              status: "Active",
              createdAt: "2026-04-01T08:00:00.000Z",
            },
          ],
        });
      }

      if (input.toString().endsWith("/trades/xchange/rfq")) {
        return createJsonResponse({
          id: "quote_1",
          quantity: "1.25",
          price: 120.45,
          generalStatus: "Provided",
          hedgingStatus: "PendingHedge",
          blockchainStatus: "GeneratingSignature",
          createdAt: "2026-04-01T08:00:00.000Z",
          clientId: "client_1",
          tokenDeployment: {
            decimals: 18,
            address: "0xasset",
            chainId: 1,
            network: "Ethereum",
            id: "deployment_1",
            token: {
              symbol: "AAPLx",
              name: "Apple xStock",
            },
          },
          contract: {
            network: "Ethereum",
            address: "0xcontract",
          },
          side: "Buy",
          signature: "0xsig",
          signaturePayload: {
            domain: {
              chainId: 1,
            },
          },
        });
      }

      throw new Error(`Unexpected xstocks authenticated URL ${input}`);
    },
  });

  const wallets = await client.listRegisteredWallets();
  const quote = await client.requestXChangeQuote({
    identifier: "AAPLx",
    side: "Buy",
    cashAmount: "100.00",
    network: "Ethereum",
    paymentWalletIdentifier: "0xabc",
    receivingWalletIdentifier: "0xabc",
  });

  assert.equal(wallets.nodes[0].status, "Active");
  assert.equal(quote.id, "quote_1");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].init.headers["x-api-key"], "test-api-key");
  assert.match(requests[1].url, /\/trades\/xchange\/rfq$/);
  assert.match(requests[1].init.body, /"identifier":"AAPLx"/);
});
