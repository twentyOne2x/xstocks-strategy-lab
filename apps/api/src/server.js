import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createCowSwapApiClient } from "../../../packages/xstocks/dist/index.js";
import { API_ENDPOINT_CONTRACTS, API_ENDPOINTS } from "./contracts.js";
import { HttpError } from "./errors.js";
import { readJsonRequestBody, sendJson } from "./json.js";
import { createLiveStateRepository } from "./repositories/live-state-repository.js";
import { createResearchManifestRepository } from "./repositories/research-manifest-repository.js";
import { createRuntimeStore } from "./repositories/runtime-store.js";
import { createApiService } from "./services/api-service.js";
import { createEthereumRpcClient } from "./services/ethereum-rpc.js";
import { createPrivyAuthService } from "./services/privy-auth.js";

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
    storePath: resolve(APP_ROOT, "data/runtime-store.json"),
    xstocksBaseUrl:
      process.env.XSTOCKS_API_BASE_URL ?? "https://api.xstocks.fi/api/v2",
    cowApiBaseUrl: process.env.COW_API_BASE_URL ?? undefined,
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL ?? null,
    privyAppId:
      process.env.PRIVY_APP_ID ?? process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? null,
    privyAppSecret: process.env.PRIVY_APP_SECRET ?? null,
    privyJwksUrl: process.env.PRIVY_JWKS_URL ?? null,
    privyApiBaseUrl: process.env.PRIVY_API_BASE_URL ?? undefined,
    reportingToken: process.env.XSTOCKS_REPORTING_TOKEN ?? null,
  };
}

export function createApiRuntimeService(overrides = {}) {
  const config = {
    ...createDefaultConfig(),
    ...overrides,
  };

  return createApiService({
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
      }),
    cowExecutionClient:
      overrides.cowExecutionClient ??
      createCowSwapApiClient({
        baseUrl: config.cowApiBaseUrl,
        fetch: overrides.fetchImpl,
      }),
    ethereumRpcClient:
      overrides.ethereumRpcClient ??
      createEthereumRpcClient({
        rpcUrl: config.ethereumRpcUrl ?? undefined,
        fetchImpl: overrides.fetchImpl,
      }),
    privyAuthService:
      overrides.privyAuthService ??
      createPrivyAuthService({
        appId: config.privyAppId,
        appSecret: config.privyAppSecret,
        jwksUrl: config.privyJwksUrl,
        apiBaseUrl: config.privyApiBaseUrl,
        fetchImpl: overrides.privyFetchImpl ?? overrides.fetchImpl,
      }),
    reportingToken: config.reportingToken,
    now: overrides.now,
  });
}

function createErrorPayload(error) {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      payload: {
        error: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof SyntaxError) {
    return {
      statusCode: 400,
      payload: {
        error: "Request body must be valid JSON.",
      },
    };
  }

  return {
    statusCode: 500,
    payload: {
      error: "Internal server error.",
    },
  };
}

export function createApiServer(overrides = {}) {
  const service = createApiRuntimeService(overrides);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "OPTIONS") {
        response.statusCode = 204;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        response.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type,Authorization,X-Privy-Identity-Token,X-Reporting-Token",
        );
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === API_ENDPOINTS.HEALTH) {
        sendJson(response, 200, {
          data: {
            status: "ok",
            endpoints: API_ENDPOINT_CONTRACTS,
          },
        });
        return;
      }

      if (
        request.method === "GET" &&
        url.pathname === API_ENDPOINTS.RECOMMENDATIONS
      ) {
        const result = await service.getRecommendation(
          Object.fromEntries(url.searchParams),
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "POST" && url.pathname === API_ENDPOINTS.QUALIFY) {
        const body = await readJsonRequestBody(request);
        const result = await service.qualify(body);
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "GET" && url.pathname === API_ENDPOINTS.CATALOG) {
        const result = await service.readCatalog(
          Object.fromEntries(url.searchParams),
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "GET" && url.pathname === API_ENDPOINTS.WORKSPACE) {
        const requestContext = await service.authenticateRequest(request);
        const result = await service.readWorkspace(
          Object.fromEntries(url.searchParams),
          {
            requestContext,
          },
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (
        request.method === "GET" &&
        url.pathname === API_ENDPOINTS.ACTIVATION_PREVIEW
      ) {
        const requestContext = await service.authenticateRequest(request);
        const result = await service.getActivationPreview(
          Object.fromEntries(url.searchParams),
          {
            requestContext,
          },
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === API_ENDPOINTS.MANIFEST_PREFLIGHT
      ) {
        const body = await readJsonRequestBody(request);
        const result = await service.preflightManifest(body);
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "POST" && url.pathname === API_ENDPOINTS.ACTIVATIONS) {
        const body = await readJsonRequestBody(request);
        const requestContext = await service.authenticateRequest(request, {
          required: true,
        });
        const result = await service.saveActivation(body, {
          requestContext,
        });
        sendJson(response, 201, { data: result });
        return;
      }

      if (request.method === "GET" && url.pathname === API_ENDPOINTS.ACTIVITY) {
        const requestContext = await service.authenticateRequest(request, {
          required: true,
        });
        const result = await service.readActivity(
          Object.fromEntries(url.searchParams),
          {
            requestContext,
          },
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "GET" && url.pathname === API_ENDPOINTS.EXECUTIONS) {
        const requestContext = await service.authenticateRequest(request, {
          required: true,
        });
        const result = await service.readExecutions(
          Object.fromEntries(url.searchParams),
          {
            requestContext,
          },
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (
        request.method === "GET" &&
        url.pathname === API_ENDPOINTS.XSTOCKS_REPORTING
      ) {
        const reportingContext = await service.authenticateReportingRequest(
          request,
          {
            required: true,
          },
        );
        const result = await service.readXStocksReporting(
          Object.fromEntries(url.searchParams),
          {
            reportingContext,
          },
        );
        sendJson(response, 200, { data: result });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === API_ENDPOINTS.XSTOCKS_FUNNEL_EVENTS
      ) {
        const body = await readJsonRequestBody(request);
        const requestContext = await service.authenticateRequest(request);
        const result = await service.ingestXStocksFunnelEvent(body, {
          requestContext,
        });
        sendJson(response, 200, { data: result });
        return;
      }

      if (request.method === "POST" && url.pathname === API_ENDPOINTS.EXECUTIONS) {
        const body = await readJsonRequestBody(request);
        const requestContext = await service.authenticateRequest(request, {
          required: true,
        });
        const result = await service.writeExecution(body, {
          requestContext,
        });
        sendJson(response, 200, { data: result });
        return;
      }

      throw new HttpError(404, "Route not found.");
    } catch (error) {
      const { statusCode, payload } = createErrorPayload(error);
      sendJson(response, statusCode, payload);
    }
  });
}
