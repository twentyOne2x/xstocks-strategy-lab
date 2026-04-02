import { randomUUID, timingSafeEqual } from "node:crypto";

import { activityEventSchema } from "../../../../packages/shared/dist/contracts/activity.js";
import {
  xstocksFunnelEventIngestRequestSchema,
  xstocksFunnelEventSchema,
} from "../../../../packages/shared/dist/contracts/reporting.js";
import {
  deriveRebalanceOrchestration,
  createActivationManifestRef,
  compileQuestionnaireQualification,
  deriveAgentQualification,
  deriveReadinessWalletRequirements,
  createSmartAccountProviderScaffold,
  deriveExecutionPlan,
  derivePortfolioExplanationBundle,
  deriveQualificationDecision,
  deriveRecommendation,
  normalizeOnboardingAnswers,
  normalizeUsd,
  normalizeWalletState,
} from "../../../../packages/policy/src/index.js";

import {
  AUTORESEARCH_RUNTIME_RECEIPT_REQUEST_SCHEMA,
  API_ENDPOINTS,
  parseApiResponse,
} from "../contracts.js";
import { HttpError } from "../errors.js";
import {
  authenticateChainlinkCreProviderEvent,
  ChainlinkCreValidationError,
} from "./chainlink-cre-auth.js";
import { buildXStocksReportingSnapshot } from "./reporting-service.js";

const DEFAULT_SLOT_ID = "onboarding.default_basket";
const DEFAULT_RESPONSE_VERSION = "1";
const ACTIVITY_CONTRACT_VERSION = "1";
const EXECUTION_REQUEST_CONTRACT_VERSION = "1";
const CATALOG_SURFACES = new Set(["onboarding", "advanced"]);
const CATALOG_MODES = new Set(["basket", "directional"]);
const EXECUTION_ACTIONS = new Set([
  "create",
  "execute_all",
  "quote_leg",
  "record_submission",
  "poll_receipt",
]);
const OPERATOR_MANUAL_EXECUTION_ADAPTER_ID = "venue_router";
const COW_SWAP_EXECUTION_ADAPTER_ID = "cow_swap";
const COW_SWAP_EXECUTION_ROUTE_ID = "cow_swap.ethereum";
const ONEINCH_EXECUTION_ADAPTER_ID = "oneinch_fusion";
const ONEINCH_EXECUTION_ROUTE_ID = "1inch.ethereum";
const MANUAL_EXECUTION_ROUTE_SELECTIONS = Object.freeze({
  venue_router: {
    requestAdapterId: OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
    routeId: null,
    label: "venue-routed execution",
    allowCow: true,
    allowOneInch: true,
  },
  cow_swap: {
    requestAdapterId: COW_SWAP_EXECUTION_ADAPTER_ID,
    routeId: COW_SWAP_EXECUTION_ROUTE_ID,
    label: "CoW",
    allowCow: true,
    allowOneInch: false,
  },
  oneinch_fusion: {
    requestAdapterId: ONEINCH_EXECUTION_ADAPTER_ID,
    routeId: ONEINCH_EXECUTION_ROUTE_ID,
    label: "1inch Fusion",
    allowCow: false,
    allowOneInch: true,
  },
});
const YIELD_BUFFER_DEFERRED_WARNING =
  "Yield-buffer vault routing remains a manual follow-up. The first operator-manual lane only prepares and tracks the core xstocks sleeve.";
const COW_ORDER_UID_PATTERN = /^0x([A-Fa-f0-9]{112})$/u;
const XSTOCKS_FUNNEL_SUBJECT_PREFIX = "subj";
const BLOCKED_REQUEST_FIELDS = [
  "activation_manifest",
  "strategy_candidate",
  "raw_strategy_candidate",
  "candidate_result",
];
const PUBLIC_SKILL_PATH = "/skill.md";
const PUBLIC_AGENT_ROUTES = Object.freeze([
  "/onboarding",
  "/workspace/comparison",
  "/workspace/detail/[manifestSlug]",
  "/activate/[manifestSlug]",
]);
const PUBLIC_AGENT_APIS = Object.freeze([
  {
    method: "POST",
    path: API_ENDPOINTS.QUALIFY,
    purpose: "Qualify the user into a promoted xstocks lane.",
  },
  {
    method: "GET",
    path: API_ENDPOINTS.WORKSPACE,
    purpose: "Inspect public workspace truth and route labels for the selected lane.",
  },
  {
    method: "GET",
    path: API_ENDPOINTS.ACTIVATION_PREVIEW,
    purpose: "Read the public readiness preview for the selected lane.",
  },
  {
    method: "GET",
    path: API_ENDPOINTS.PUBLIC_AGENT_HANDOFF,
    purpose: "Read the explicit public-to-internal handoff boundary.",
  },
]);
const AUTHENTICATED_AGENT_APIS = Object.freeze([
  {
    method: "POST",
    path: API_ENDPOINTS.ACTIVATIONS,
    purpose: "Save activation from a verified authenticated user context.",
  },
  {
    method: "GET",
    path: API_ENDPOINTS.ACTIVITY,
    purpose: "Read activation activity for the authenticated owner.",
  },
  {
    method: "GET",
    path: API_ENDPOINTS.EXECUTIONS,
    purpose: "Read execution request state for the authenticated owner.",
  },
  {
    method: "POST",
    path: API_ENDPOINTS.EXECUTIONS,
    purpose: "Create or advance execution requests from the authenticated owner context.",
  },
]);
const PRIVATE_DETAILS_WITHHELD = Object.freeze([
  "private operator hosts",
  "auth tokens",
  "wallet secrets",
  "treasury details",
  "hidden custody internals",
]);

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function roundUsd(value) {
  return Number(Number(value).toFixed(2));
}

function normalizeEthereumAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{40})$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

function normalizeTxHash(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{64})$/u.test(normalized) ? normalized : null;
}

function buildPublicAgentSurface() {
  return {
    skillPath: PUBLIC_SKILL_PATH,
    publicRoutes: [...PUBLIC_AGENT_ROUTES],
    publicApis: PUBLIC_AGENT_APIS.map((surface) => ({ ...surface })),
  };
}

function derivePublicAgentHandoffBoundary(executionPlan) {
  if (
    executionPlan.executionEligibility === "executable" &&
    executionPlan.executionState === "ready"
  ) {
    return {
      publicSafeBridgeExists: true,
      directAuthenticatedBridgeExists: false,
      state: "ready_for_authenticated_activation",
      reason:
        "Public-safe preview has reached a truthful executable readiness snapshot, but activation save and execution still require authenticated ownership.",
      nextAction:
        "Hand off to the authenticated internal activation surface and save the activation from a verified user context.",
      authenticatedBoundary:
        "Verified Privy-authenticated user context and user-approved wallet or signature steps remain required after this point.",
      authenticatedApis: AUTHENTICATED_AGENT_APIS.map((surface) => ({
        ...surface,
      })),
      privateDetailsWithheld: [...PRIVATE_DETAILS_WITHHELD],
    };
  }

  if (executionPlan.executionEligibility === "blocked") {
    return {
      publicSafeBridgeExists: true,
      directAuthenticatedBridgeExists: false,
      state: "blocked",
      reason:
        executionPlan.blockers[0] ??
        "The lane is blocked at the public-safe handoff boundary.",
      nextAction:
        "Stop at the public boundary and report the exact blocker without implying activation or execution.",
      authenticatedBoundary:
        "Authenticated surfaces still exist, but they must not be used to bypass a blocked readiness state.",
      authenticatedApis: AUTHENTICATED_AGENT_APIS.map((surface) => ({
        ...surface,
      })),
      privateDetailsWithheld: [...PRIVATE_DETAILS_WITHHELD],
    };
  }

  const previewReasonByState = {
    wallet_required:
      "Public preview can explain the lane, but wallet readiness has not been supplied yet.",
    funding_required:
      "Public preview can explain the lane, but funding readiness is still incomplete.",
    smart_account_required:
      "Public preview can explain the lane, but the smart-account bootstrap step is still incomplete.",
    smart_account_pending:
      "Public preview can explain the lane, but the smart-account bootstrap step is still pending.",
    blocked:
      "This lane remains preview-only on the public surface and cannot cross into authenticated activation yet.",
  };

  const previewNextActionByState = {
    wallet_required:
      "Stay on public preview until the user reaches the authenticated wallet-connect step.",
    funding_required:
      "Stay on public preview until wallet funding is truthfully ready.",
    smart_account_required:
      "Stay on public preview until the authenticated smart-account step is completed.",
    smart_account_pending:
      "Stay on public preview until the authenticated smart-account step finishes.",
    blocked:
      "Keep the lane preview-only and stop before activation save.",
  };

  return {
    publicSafeBridgeExists: true,
    directAuthenticatedBridgeExists: false,
    state: "stay_public_preview",
    reason:
      previewReasonByState[executionPlan.executionState] ??
      "Public preview can continue, but the authenticated activation boundary has not been reached yet.",
    nextAction:
      previewNextActionByState[executionPlan.executionState] ??
      "Keep the lane on public preview and stop before activation save.",
    authenticatedBoundary:
      "Authenticated activation, activity, and execution surfaces begin only after verified user context is available.",
    authenticatedApis: AUTHENTICATED_AGENT_APIS.map((surface) => ({
      ...surface,
    })),
    privateDetailsWithheld: [...PRIVATE_DETAILS_WITHHELD],
  };
}

function normalizeSignature(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{130})$/u.test(normalized) ? normalized : null;
}

function normalizeOrderUid(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return COW_ORDER_UID_PATTERN.test(normalized) ? normalized : null;
}

function getOptionalSubjectId(payload = {}) {
  const subjectId = firstDefined(payload.subjectId, payload.subject_id);

  if (subjectId === undefined || subjectId === null || subjectId === "") {
    return null;
  }

  return String(subjectId).trim();
}

function readNamedBearerTokenFromRequest(
  request,
  directHeaderName = "x-reporting-token",
) {
  const directHeader = request.headers[directHeaderName];

  if (typeof directHeader === "string" && directHeader.trim().length > 0) {
    return directHeader.trim();
  }

  const authorization = request.headers.authorization;

  if (
    typeof authorization === "string" &&
    authorization.startsWith("Bearer ")
  ) {
    const bearerToken = authorization.slice("Bearer ".length).trim();

    return bearerToken.length > 0 ? bearerToken : null;
  }

  return null;
}

function tokensMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function toAtomicAmount(value, decimals) {
  const normalized = normalizeUsd(value, 0);
  const [whole, fraction = ""] = normalized.toFixed(decimals).split(".");
  return `${whole}${fraction.padEnd(decimals, "0").slice(0, decimals)}`
    .replace(/^0+/u, "") || "0";
}

function normalizeSelector(payload = {}) {
  return {
    manifestId: firstDefined(payload.manifestId, payload.manifest_id),
    slotId: firstDefined(payload.slotId, payload.slot_id),
  };
}

function getRequestedNotionalUsd(payload = {}) {
  return firstDefined(payload.userNotionalUsd, payload.user_notional_usd);
}

function getWalletState(payload = {}) {
  const directWalletState = firstDefined(payload.walletState, payload.wallet_state);

  if (directWalletState && typeof directWalletState === "object") {
    return directWalletState;
  }

  const walletConnected = firstDefined(
    payload.walletConnected,
    payload.wallet_connected,
  );
  const walletAddress = firstDefined(
    payload.walletAddress,
    payload.wallet_address,
  );
  const fundedNotionalUsd = firstDefined(
    payload.fundedNotionalUsd,
    payload.funded_notional_usd,
  );
  const fundingSource = firstDefined(
    payload.fundingSource,
    payload.funding_source,
  );
  const embeddedWalletStatus = firstDefined(
    payload.embeddedWalletStatus,
    payload.embedded_wallet_status,
  );
  const embeddedWalletAddress = firstDefined(
    payload.embeddedWalletAddress,
    payload.embedded_wallet_address,
  );
  const embeddedWalletProviderId = firstDefined(
    payload.embeddedWalletProviderId,
    payload.embedded_wallet_provider_id,
  );
  const smartAccountStatus = firstDefined(
    payload.smartAccountStatus,
    payload.smart_account_status,
  );
  const smartAccountAddress = firstDefined(
    payload.smartAccountAddress,
    payload.smart_account_address,
  );
  const smartAccountProviderId = firstDefined(
    payload.smartAccountProviderId,
    payload.smart_account_provider_id,
  );

  if (
    [
      walletConnected,
      walletAddress,
      fundedNotionalUsd,
      fundingSource,
      embeddedWalletStatus,
      embeddedWalletAddress,
      embeddedWalletProviderId,
      smartAccountStatus,
      smartAccountAddress,
      smartAccountProviderId,
    ].every((value) => value === undefined)
  ) {
    return undefined;
  }

  return {
    walletConnected:
      walletConnected === true ||
      walletConnected === "true" ||
      walletConnected === 1 ||
      walletConnected === "1",
    walletAddress: walletAddress ?? null,
    fundedNotionalUsd:
      fundedNotionalUsd === undefined ? 0 : Number(fundedNotionalUsd),
    fundingSource: fundingSource ?? null,
    embeddedWallet: {
      ...(embeddedWalletProviderId === undefined
        ? {}
        : { providerId: embeddedWalletProviderId }),
      status: embeddedWalletStatus ?? "not_created",
      address: embeddedWalletAddress ?? walletAddress ?? null,
    },
    smartAccount: {
      ...(smartAccountProviderId === undefined
        ? {}
        : { providerId: smartAccountProviderId }),
      status: smartAccountStatus ?? "not_started",
      address: smartAccountAddress ?? null,
    },
  };
}

function getOnboardingAnswersPayload(payload = {}) {
  const answersPayload = firstDefined(
    payload.onboardingAnswers,
    payload.onboarding_answers,
    isQuestionAnswersPayload(payload.answers) ? undefined : payload.answers,
  );

  if (answersPayload !== undefined) {
    if (
      !answersPayload ||
      typeof answersPayload !== "object" ||
      Array.isArray(answersPayload)
    ) {
      throw new HttpError(
        400,
        "answers must be an object using the shared onboarding answers shape.",
      );
    }

    return answersPayload;
  }

  if (
    payload.initialSelection !== undefined ||
    payload.modePreference !== undefined ||
    payload.mode_preference !== undefined ||
    payload.selectedStarterSlotId !== undefined ||
    payload.selected_starter_slot_id !== undefined ||
    payload.selectedStarterBasketId !== undefined ||
    payload.selected_starter_basket_id !== undefined ||
    payload.directionalOptIn !== undefined ||
    payload.directional_opt_in !== undefined
  ) {
    return payload;
  }

  return null;
}

function isQuestionAnswersPayload(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).some((key) => key.startsWith("q_")),
  );
}

function getQuestionAnswersPayload(payload = {}) {
  const answersPayload = firstDefined(
    payload.questionAnswers,
    payload.question_answers,
    isQuestionAnswersPayload(payload.answers) ? payload.answers : undefined,
  );

  if (answersPayload === undefined) {
    return null;
  }

  if (
    !answersPayload ||
    typeof answersPayload !== "object" ||
    Array.isArray(answersPayload)
  ) {
    throw new HttpError(
      400,
      "questionAnswers must be an object keyed by q_* onboarding question ids.",
    );
  }

  return answersPayload;
}

function assertNoRawCandidatePayload(payload) {
  for (const blockedField of BLOCKED_REQUEST_FIELDS) {
    if (Object.hasOwn(payload, blockedField)) {
      throw new HttpError(
        400,
        "Raw strategy candidates are not accepted. Use manifestId or slotId for a promoted manifest.",
      );
    }
  }
}

function normalizeCatalogFilter(value, allowedValues, label) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalizedValue = String(value).trim();

  if (!allowedValues.has(normalizedValue)) {
    throw new HttpError(
      400,
      `${label} must be one of: ${[...allowedValues].join(", ")}.`,
    );
  }

  return normalizedValue;
}

function resolveRequestedNotionalUsd(value, fallback = 0) {
  return normalizeUsd(value, fallback);
}

function requireAuthenticatedRequestContext(requestContext) {
  if (!requestContext?.owner?.userId) {
    throw new HttpError(401, "Privy authentication is required.");
  }

  return requestContext;
}

function addressInVerifiedSet(address, verifiedAddresses = []) {
  const normalizedAddress = normalizeEthereumAddress(address);

  return normalizedAddress
    ? verifiedAddresses.includes(normalizedAddress)
    : false;
}

function ensureActivationOwnership({ activation, requestContext }) {
  const authenticatedRequestContext =
    requireAuthenticatedRequestContext(requestContext);

  if (
    activation?.owner?.userId &&
    activation.owner.userId !== authenticatedRequestContext.owner.userId
  ) {
    throw new HttpError(404, "Activation was not found for the authenticated user.");
  }
}

function ensureExecutionOwnership({ executionRequest, requestContext }) {
  const authenticatedRequestContext =
    requireAuthenticatedRequestContext(requestContext);

  if (
    executionRequest?.owner?.userId &&
    executionRequest.owner.userId !== authenticatedRequestContext.owner.userId
  ) {
    throw new HttpError(
      404,
      "Execution request was not found for the authenticated user.",
    );
  }
}

function ensureWalletStateMatchesAuthenticatedUser({
  walletState,
  requestContext,
}) {
  const authenticatedRequestContext =
    requireAuthenticatedRequestContext(requestContext);
  const linkedWalletAddresses = uniqueStrings([
    ...authenticatedRequestContext.linkedWalletAddresses,
    ...authenticatedRequestContext.linkedEmbeddedWalletAddresses,
  ]);
  const connectedWalletAddress = firstDefined(
    walletState.walletAddress,
    walletState.embeddedWallet?.address,
  );

  if (walletState.walletConnected) {
    if (!normalizeEthereumAddress(connectedWalletAddress)) {
      throw new HttpError(
        403,
        "A connected wallet address is required when wallet readiness is reported.",
      );
    }

    if (!addressInVerifiedSet(connectedWalletAddress, linkedWalletAddresses)) {
      throw new HttpError(
        403,
        "Connected wallet readiness does not match the authenticated Privy user.",
      );
    }
  }

  if (
    walletState.embeddedWallet?.address &&
    !addressInVerifiedSet(
      walletState.embeddedWallet.address,
      linkedWalletAddresses,
    )
  ) {
    throw new HttpError(
      403,
      "Embedded wallet readiness does not match the authenticated Privy user.",
    );
  }

  if (
    ["ready", "pending", "creating"].includes(walletState.smartAccount?.status) &&
    !normalizeEthereumAddress(walletState.smartAccount?.address)
  ) {
    throw new HttpError(
      403,
      "A smart-account address is required when smart-account readiness is reported.",
    );
  }

  if (
    walletState.smartAccount?.address &&
    !addressInVerifiedSet(
      walletState.smartAccount.address,
      authenticatedRequestContext.linkedSmartWalletAddresses,
    )
  ) {
    throw new HttpError(
      403,
      "Smart-account readiness does not match the authenticated Privy user.",
    );
  }
}

function createActivityEvent({
  activation,
  eventType,
  summary,
  now,
  payload = undefined,
}) {
  return activityEventSchema.parse({
    version: ACTIVITY_CONTRACT_VERSION,
    eventId: `evt_${randomUUID()}`,
    chain: activation.chain,
    eventType,
    scope: {
      type: "activation",
      id: activation.activationId,
    },
    summary,
    occurredAt: now(),
    ...(payload === undefined ? {} : { payload }),
  });
}

function buildActivityEvents({ activation, executionPlan, now }) {
  const events = [
    createActivityEvent({
      activation,
      eventType: "activation_requested",
      summary: `Saved activation request for promoted manifest ${activation.manifestId}.`,
      now,
      payload: {
        manifestId: activation.manifestId,
        slotId: activation.slotId,
        surfaceTruth: executionPlan.surfaceTruth,
        executionState: executionPlan.executionState,
      },
    }),
  ];

  if (executionPlan.executionState !== "ready") {
    events.push(
      createActivityEvent({
        activation,
        eventType: "blocked",
        summary:
          "Activation remains preview-only or blocked until every required rail and wallet check passes.",
        now,
        payload: {
          manifestId: activation.manifestId,
          slotId: activation.slotId,
          executionState: executionPlan.executionState,
          blockers: executionPlan.blockers,
          warnings: executionPlan.warnings,
        },
      }),
    );
  }

  return events;
}

function buildManifestExplanationView(manifest) {
  const bundle = derivePortfolioExplanationBundle(manifest);

  return {
    thesis: bundle.whatThisPortfolioDoes,
    whatThisDoes: bundle.whatThisPortfolioDoes,
    bestForUser: bundle.bestFor,
    howItChanges: bundle.howItChanges,
    replayInterpretation: bundle.howToReadReplay,
    holdingRationales: bundle.components.map((component) => ({
      symbol: component.assetSymbol ?? component.basketId ?? component.title,
      sleeve: component.sleeve,
      rationale: component.rationale,
    })),
    bundle,
  };
}

function buildManifestView(manifest) {
  const walletRequirements = deriveReadinessWalletRequirements(manifest);
  const replayCurve =
    manifest.replay?.replayCurve?.length > 0
      ? manifest.replay.replayCurve
      : manifest.replay?.points ?? [];

  return {
    manifestId: manifest.manifestId,
    slotId: manifest.slotId,
    mode: manifest.mode,
    chain: manifest.chain,
    strategyVersion: manifest.strategyVersion,
    promoted: true,
    source:
      manifest.executionBoundary?.source ?? {
        type: "research_promoted_manifest",
        manifestId: manifest.manifestId,
        slotId: manifest.slotId,
      },
    frontend: {
      title: manifest.frontend.title,
      subtitle: manifest.frontend.subtitle,
      riskLabel: manifest.frontend.riskLabel,
      summary: manifest.frontend.summary,
      badges: manifest.frontend.badges ?? [],
    },
    explanation: buildManifestExplanationView(manifest),
    explanationBundle: manifest.researchExplanationBundle ?? null,
    tuningSummary: manifest.researchTuningSummary ?? null,
    replay: manifest.replay
      ? {
          startingCapital: manifest.replay.startingCapital,
          endingCapital: manifest.replay.endingCapital,
          netReturnPct: manifest.replay.netReturnPct,
          maxDrawdownPct: manifest.replay.maxDrawdownPct,
          turnoverPct: manifest.replay.turnoverPct,
          winRatePct: manifest.replay.winRatePct,
          replayCurve,
          points: manifest.replay.points ?? replayCurve,
        }
      : null,
    marketIntelligence: manifest.marketIntelligence
      ? {
          currentView: manifest.marketIntelligence.currentView,
          horizon: manifest.marketIntelligence.horizon,
          whatChanged: manifest.marketIntelligence.whatChanged,
          drivers: manifest.marketIntelligence.drivers,
        }
      : null,
    validation: {
      datasetVersion: manifest.validation.datasetVersion,
      evaluatorVersion: manifest.validation.evaluatorVersion,
      objectiveId: manifest.validation.objectiveId,
      score: manifest.validation.score,
      deltaVsIncumbent: manifest.validation.deltaVsIncumbent,
      promotedAt: manifest.validation.promotedAt,
    },
    fallback: {
      previousIncumbentId: manifest.fallback.previousIncumbentId,
      disableConditions: manifest.fallback.disableConditions ?? [],
    },
    activationTemplate: {
      mode: manifest.activationTemplate.mode,
      templateId: manifest.activationTemplate.templateId,
      fundingAssetSymbol: manifest.activationTemplate.fundingAssetSymbol,
      ...(manifest.mode === "basket"
        ? { starterBasketId: manifest.activationTemplate.starterBasketId }
        : { assetSymbol: manifest.activationTemplate.assetSymbol }),
    },
    requiredAssets: manifest.requiredAssets,
    requiredRoutes: manifest.requiredRoutes,
    walletRequirements: {
      requiresWallet: walletRequirements.requiresWallet,
      requiresSmartAccount: walletRequirements.requiresSmartAccount,
      minFundingUsd: walletRequirements.minFundingUsd,
      preferredFundingProvider: walletRequirements.preferredFundingProvider,
      topUpAsset: walletRequirements.topUpAsset,
      manualSigningMode: walletRequirements.manualSigningMode,
      automationAccountMode: walletRequirements.automationAccountMode,
      venueSigningMode: walletRequirements.venueSigningMode,
      supportsSeparateExecutionDestination:
        walletRequirements.supportsSeparateExecutionDestination,
    },
    signalRefs: manifest.signalRefs,
    targetAllocations: manifest.targetAllocations ?? [],
    targetDirectionalExpression: manifest.targetDirectionalExpression ?? null,
    routeValidation: manifest.routeValidation
      ? {
          executionEligibility: manifest.routeValidation.executionEligibility,
          surfaceTruth: manifest.routeValidation.surfaceTruth,
          routeTruthLabels: manifest.routeValidation.routeTruthLabels,
          proofNotes: manifest.routeValidation.proofNotes,
          validationBadges: manifest.routeValidation.validationBadges,
        }
      : null,
    permissions: manifest.permissions,
    legacyFallback: manifest.legacyFallback === true,
  };
}

function buildLiveStateView({ liveXStocksState, liveRouteState }) {
  return {
    liveXStocksState: {
      stateVersion: liveXStocksState.stateVersion,
      asOf: liveXStocksState.asOf,
      assets: (liveXStocksState.assets ?? []).map((asset) => ({
        assetSymbol: asset.assetSymbol,
        source: asset.source,
        chain: asset.chain,
        status: asset.status,
        priceUsd: asset.priceUsd ?? null,
        proofOfReserves: asset.proofOfReserves ?? null,
        notes: asset.notes,
        deployments: asset.deployments ?? {},
      })),
    },
    liveRouteState: {
      stateVersion: liveRouteState.stateVersion,
      asOf: liveRouteState.asOf,
      routes: (liveRouteState.routes ?? []).map((route) => ({
        routeId: route.routeId,
        label: route.label,
        routeKind: route.routeKind,
        chain: route.chain,
        verificationTier: route.verificationTier,
        availability: route.availability,
        notes: route.notes,
      })),
    },
  };
}

function buildExecutionPlanPreview(executionPlan) {
  return {
    surfaceTruth: executionPlan.surfaceTruth,
    executionState: executionPlan.executionState,
    executionEligibility: executionPlan.executionEligibility,
    routeTruthLabels: executionPlan.routeTruthLabels,
    blockers: executionPlan.blockers,
    warnings: executionPlan.warnings,
  };
}

function serializeRebalance(rebalance) {
  if (!rebalance) {
    return null;
  }

  const { history: _history, ...summary } = rebalance;
  return summary;
}

function serializeRebalanceHistory(rebalance) {
  return [...(rebalance?.history ?? [])];
}

function createAssetIndex(liveXStocksState) {
  return new Map(
    (liveXStocksState?.assets ?? []).map((asset) => [asset.assetSymbol, asset]),
  );
}

function buildAllocationTargetPreviewRows({
  manifest,
  requestedNotionalUsd,
  liveXStocksState,
}) {
  const assetIndex = createAssetIndex(liveXStocksState);

  return (manifest.targetAllocations ?? []).map((allocation, index) => {
    const liveAsset = allocation.assetSymbol
      ? assetIndex.get(allocation.assetSymbol)
      : null;
    const targetNotionalUsd = Number(
      ((requestedNotionalUsd * allocation.targetWeightPct) / 100).toFixed(2),
    );

    return {
      allocationId: `${manifest.manifestId}:allocation:${index + 1}`,
      sleeve: allocation.sleeve,
      ...(allocation.assetSymbol ? { assetSymbol: allocation.assetSymbol } : {}),
      ...(allocation.basketId ? { basketId: allocation.basketId } : {}),
      ...(allocation.venueId ? { venueId: allocation.venueId } : {}),
      targetWeightPct: allocation.targetWeightPct,
      targetNotionalUsd,
      liveAsset:
        liveAsset === undefined || liveAsset === null
          ? null
          : {
              status: liveAsset.status,
              priceUsd: liveAsset.priceUsd ?? null,
              proofOfReserves: liveAsset.proofOfReserves ?? null,
            },
    };
  });
}

function buildTargetSummary(manifest) {
  const rankedAssetSymbols = (manifest.targetAllocations ?? [])
    .filter((allocation) => typeof allocation.assetSymbol === "string")
    .sort((left, right) => right.targetWeightPct - left.targetWeightPct)
    .map((allocation) => allocation.assetSymbol);
  const leadAssets = [...new Set(rankedAssetSymbols)].slice(0, 3);

  if (leadAssets.length === 0 && manifest.targetDirectionalExpression?.assetSymbol) {
    leadAssets.push(manifest.targetDirectionalExpression.assetSymbol);
  }

  return {
    fundingAssetSymbol: manifest.activationTemplate.fundingAssetSymbol,
    allocationCount:
      manifest.mode === "basket"
        ? manifest.targetAllocations.length
        : manifest.targetDirectionalExpression
          ? 1
          : 0,
    requiredAssetCount: manifest.requiredAssets.length,
    leadAssets,
  };
}

function pickNextAction(executionPlan) {
  const nextStep = executionPlan?.steps?.find((step) => step.status !== "complete");

  if (!nextStep) {
    return null;
  }

  return {
    title: nextStep.title,
    detail: nextStep.detail,
    status: nextStep.status,
  };
}

function serializeActivityEvent(event) {
  return activityEventSchema.parse(event);
}

function serializeActivation(activation) {
  return {
    activationId: activation.activationId,
    owner: activation.owner ?? null,
    chain: activation.chain,
    manifestId: activation.manifestId,
    slotId: activation.slotId,
    recommendationId: activation.recommendationId,
    activationManifestRef: activation.activationManifestRef,
    requestedNotionalUsd: activation.requestedNotionalUsd,
    surfaceTruth: activation.surfaceTruth,
    status: activation.status,
    createdAt: activation.createdAt,
    updatedAt: activation.updatedAt,
    walletState: activation.walletState,
    routeTruthLabels: activation.routeTruthLabels,
    executionPlanSnapshot: activation.executionPlanSnapshot,
  };
}

function buildActivitySummary({
  items,
  activations,
  executionPlan,
  rebalanceOrchestration,
}) {
  const latestActivation = activations[0] ?? null;
  const latestEvent = items[0] ?? null;

  return {
    activationCount: activations.length,
    eventCount: items.length,
    latestActivationId: latestActivation?.activationId ?? null,
    latestActivationStatus: latestActivation?.status ?? null,
    latestEventId: latestEvent?.eventId ?? null,
    latestEventType: latestEvent?.eventType ?? null,
    latestEventAt: latestEvent?.occurredAt ?? null,
    nextAction:
      rebalanceOrchestration?.nextAction ??
      pickNextAction(latestActivation?.executionPlanSnapshot ?? executionPlan),
  };
}

function buildActivityPositions({
  manifest,
  requestedNotionalUsd,
  liveXStocksState,
  source,
  updatedAt,
  status,
}) {
  const assetIndex = createAssetIndex(liveXStocksState);

  if (manifest.mode === "directional") {
    const targetDirectionalExpression = manifest.targetDirectionalExpression;

    if (!targetDirectionalExpression) {
      return [];
    }

    const liveAsset = assetIndex.get(targetDirectionalExpression.assetSymbol);
    const targetNotionalUsd = Number(
      (
        (requestedNotionalUsd * targetDirectionalExpression.grossExposurePct) /
        100
      ).toFixed(2),
    );

    return [
      {
        positionId: `${manifest.manifestId}:directional`,
        assetSymbol: targetDirectionalExpression.assetSymbol,
        sleeve: "directional",
        targetWeightPct: targetDirectionalExpression.grossExposurePct,
        targetNotionalUsd,
        venueId: manifest.requiredRoutes[0]?.routeId ?? null,
        priceUsd: liveAsset?.priceUsd ?? null,
        status: source === "activation_snapshot" ? status : "preview",
        updatedAt,
      },
    ];
  }

  return buildAllocationTargetPreviewRows({
    manifest,
    requestedNotionalUsd,
    liveXStocksState,
  }).map((row) => ({
    positionId: row.allocationId,
    assetSymbol: row.assetSymbol ?? row.basketId ?? "unknown",
    sleeve: row.sleeve,
    targetWeightPct: row.targetWeightPct,
    targetNotionalUsd: row.targetNotionalUsd,
    venueId: row.venueId ?? null,
    priceUsd: row.liveAsset?.priceUsd ?? null,
    status: source === "activation_snapshot" ? status : "preview",
    updatedAt,
  }));
}

function buildActivityHistory(items) {
  return items.map((item) => {
    const executionState = item.payload?.executionState;
    let status = "pending";

    if (executionState === "blocked" || item.eventType === "blocked") {
      status = "blocked";
    } else if (executionState === "ready") {
      status = "settled";
    }

    return {
      id: item.eventId,
      occurredAt: item.occurredAt,
      type: item.eventType,
      summary: item.summary,
      status,
    };
  });
}

function buildActivityLifecycle(items, executionPlan) {
  const nextAction = pickNextAction(executionPlan)?.title ?? null;

  return items.map((item) => ({
    id: item.eventId,
    occurredAt: item.occurredAt,
    title: item.eventType,
    detail: item.summary,
    state: item.payload?.executionState ?? "preview",
    nextAction,
  }));
}

function buildActivitySurface({
  manifest,
  liveXStocksState,
  items,
  activations,
  executionPlan,
  rebalanceOrchestration,
}) {
  const latestActivation = activations[0] ?? null;
  const source = latestActivation ? "activation_snapshot" : "manifest_preview";
  const requestedNotionalUsd =
    latestActivation?.requestedNotionalUsd ??
    manifest.walletRequirements.minFundingUsd;
  const updatedAt = latestActivation?.updatedAt ?? executionPlan.generatedAt;

  return {
    source,
    currentState: {
      surfaceTruth: latestActivation?.surfaceTruth ?? executionPlan.surfaceTruth,
      executionState: latestActivation?.status ?? executionPlan.executionState,
      pauseAvailable: manifest.permissions.allowPause,
      turnOffAvailable: manifest.permissions.allowTurnOff,
    },
    positions: buildActivityPositions({
      manifest,
      requestedNotionalUsd,
      liveXStocksState,
      source,
      updatedAt,
      status: latestActivation?.status ?? executionPlan.executionState,
    }),
    history: buildActivityHistory(items),
    lifecycle: buildActivityLifecycle(items, executionPlan),
    nextAction: rebalanceOrchestration?.nextAction ?? pickNextAction(executionPlan),
  };
}

function resolveManualSignerAddress(walletState = {}) {
  const embeddedWalletAddress = walletState.embeddedWallet?.address ?? null;

  if (walletState.walletConnected && embeddedWalletAddress) {
    return embeddedWalletAddress;
  }

  if (walletState.walletConnected && walletState.walletAddress) {
    return walletState.walletAddress;
  }

  return null;
}

function resolvePolicyAccountAddress(walletState = {}) {
  const smartAccountAddress = walletState.smartAccount?.address ?? null;

  if (walletState.smartAccount?.status === "ready" && smartAccountAddress) {
    return smartAccountAddress;
  }

  return null;
}

function resolveExecutionDestinationAddress(
  walletState = {},
  { supportsSeparateExecutionDestination = true } = {},
) {
  const policyAccountAddress = resolvePolicyAccountAddress(walletState);

  if (supportsSeparateExecutionDestination && policyAccountAddress) {
    return policyAccountAddress;
  }

  return resolveManualSignerAddress(walletState);
}

function resolveExecutionSignerAddress(walletState = {}) {
  return resolveManualSignerAddress(walletState);
}

function createExecutionBridgeState({
  walletState = {},
  executionPlanSnapshot = null,
}) {
  const supportsSeparateExecutionDestination =
    executionPlanSnapshot?.smartAccount?.bridgeState
      ?.supportsSeparateExecutionDestination ?? true;
  const manualSignerAddress = resolveManualSignerAddress(walletState);
  const policyAccountAddress = resolvePolicyAccountAddress(walletState);
  const executionDestinationAddress = resolveExecutionDestinationAddress(
    walletState,
    { supportsSeparateExecutionDestination },
  );

  return {
    manualSignerAddress,
    policyAccountAddress,
    executionDestinationAddress,
    manualSigningMode:
      executionPlanSnapshot?.smartAccount?.manualSigningMode ?? "wallet_first",
    automationAccountMode:
      executionPlanSnapshot?.automationExecution?.accountMode ??
      executionPlanSnapshot?.smartAccount?.automationAccountMode ??
      "smart_account_required",
    automationReadiness:
      executionPlanSnapshot?.automationExecution?.readiness ??
      executionPlanSnapshot?.smartAccount?.automationReadiness ??
      (policyAccountAddress ? "ready" : "smart_account_required"),
    venueSigningMode:
      executionPlanSnapshot?.smartAccount?.venueSigningMode ??
      "wallet_signer_manual_only",
  };
}

function findManifestRouteId(manifest, requiredFor) {
  return (
    manifest.requiredRoutes.find((route) => route.requiredFor === requiredFor)?.routeId ??
    manifest.requiredRoutes[0]?.routeId ??
    "unknown"
  );
}

function findEthereumDeployment(fetchedAsset) {
  return (
    fetchedAsset?.asset?.deployments?.find(
      (deployment) => deployment.network === "Ethereum",
    ) ?? null
  );
}

function findFundingStablecoin(deployment, symbol) {
  return (
    deployment?.stablecoins?.find(
      (stablecoin) =>
        stablecoin.network === "Ethereum" && stablecoin.symbol === symbol,
    ) ?? null
  );
}

function resolveCowReceivingToken(deployment) {
  if (!deployment) {
    return {
      address: null,
      source: "missing",
    };
  }

  if (deployment.wrapperAddress) {
    return {
      address: deployment.wrapperAddress,
      source: "wrapperAddress",
    };
  }

  if (deployment.address) {
    return {
      address: deployment.address,
      source: "deployment.address",
    };
  }

  return {
    address: null,
    source: "missing",
  };
}

function resolveOneInchReceivingToken(deployment) {
  if (!deployment) {
    return {
      address: null,
      source: "missing",
    };
  }

  if (deployment.address) {
    return {
      address: deployment.address,
      source: "deployment.address",
    };
  }

  if (deployment.wrapperAddress) {
    return {
      address: deployment.wrapperAddress,
      source: "wrapperAddress",
    };
  }

  return {
    address: null,
    source: "missing",
  };
}

function resolveManualExecutionRouteSelection({
  requestedRouteId,
  requestedAdapterId,
} = {}) {
  const normalizedRouteId =
    typeof requestedRouteId === "string" && requestedRouteId.trim().length > 0
      ? requestedRouteId.trim()
      : null;
  const normalizedAdapterId =
    typeof requestedAdapterId === "string" && requestedAdapterId.trim().length > 0
      ? requestedAdapterId.trim().toLowerCase()
      : null;

  if (normalizedRouteId === null && normalizedAdapterId === null) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.venue_router;
  }

  if (normalizedAdapterId === COW_SWAP_EXECUTION_ADAPTER_ID) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.cow_swap;
  }

  if (
    normalizedAdapterId === ONEINCH_EXECUTION_ADAPTER_ID ||
    normalizedAdapterId === "1inch" ||
    normalizedAdapterId === "oneinch"
  ) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.oneinch_fusion;
  }

  if (normalizedRouteId === COW_SWAP_EXECUTION_ROUTE_ID) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.cow_swap;
  }

  if (normalizedRouteId === ONEINCH_EXECUTION_ROUTE_ID) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.oneinch_fusion;
  }

  throw new HttpError(
    400,
    `executionRouteId must be one of ${COW_SWAP_EXECUTION_ROUTE_ID} or ${ONEINCH_EXECUTION_ROUTE_ID}.`,
  );
}

function resolveManualExecutionRouteSelectionFromLeg(leg, executionRequest) {
  const adapterId = leg.adapterId ?? executionRequest?.adapterId ?? null;

  if (adapterId === OPERATOR_MANUAL_EXECUTION_ADAPTER_ID) {
    return MANUAL_EXECUTION_ROUTE_SELECTIONS.venue_router;
  }

  return resolveManualExecutionRouteSelection({
    requestedRouteId: leg.requiredRouteId,
    requestedAdapterId: adapterId,
  });
}

function formatUsdAmount(value) {
  return Number(normalizeUsd(value, 0)).toFixed(2);
}

function buildCowQuoteAttemptContext({
  leg,
  signerAddress,
  settlementAddress,
}) {
  return {
    sellToken: leg.paymentTokenAddress,
    buyToken: leg.receivingTokenAddress,
    receiver: settlementAddress,
    owner: signerAddress,
    kind: "sell",
    sellAmountBeforeFee: toAtomicAmount(
      leg.targetNotionalUsd,
      leg.paymentTokenDecimals ?? 6,
    ),
    targetNotionalUsd: Number(formatUsdAmount(leg.targetNotionalUsd)),
  };
}

function buildOneInchQuoteAttemptContext({
  leg,
  signerAddress,
  receivingTokenAddress,
}) {
  return {
    fromTokenAddress: leg.paymentTokenAddress,
    toTokenAddress: receivingTokenAddress,
    walletAddress: signerAddress,
    amount: toAtomicAmount(
      leg.targetNotionalUsd,
      leg.paymentTokenDecimals ?? 6,
    ),
    enableEstimate: true,
    source: "xstocks-strategy-lab",
    targetNotionalUsd: Number(formatUsdAmount(leg.targetNotionalUsd)),
  };
}

function parseCowErrorPayload(rawBody) {
  if (typeof rawBody !== "string" || rawBody.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawBody);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return {
      errorType:
        typeof parsed.errorType === "string" ? parsed.errorType : null,
      description:
        typeof parsed.description === "string" &&
        parsed.description.trim().length > 0
          ? parsed.description.trim()
          : null,
    };
  } catch {
    return null;
  }
}

function deriveCowQuoteBlockerClass({ statusCode, errorType }) {
  if (errorType === "NoLiquidity") {
    return "cow_no_liquidity";
  }

  if (errorType === "InternalServerError") {
    return "cow_internal_server_error";
  }

  if (Number.isInteger(statusCode) && statusCode > 0) {
    return `cow_quote_http_${statusCode}`;
  }

  return "cow_quote_error";
}

function parseOneInchErrorPayload(rawBody) {
  if (typeof rawBody !== "string" || rawBody.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawBody);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return {
      code: typeof parsed.code === "string" ? parsed.code : null,
      description:
        typeof parsed.description === "string" &&
        parsed.description.trim().length > 0
          ? parsed.description.trim()
          : null,
      error:
        typeof parsed.error === "string" && parsed.error.trim().length > 0
          ? parsed.error.trim()
          : null,
    };
  } catch {
    return null;
  }
}

function deriveOneInchQuoteBlockerClass({ statusCode, code }) {
  if (code === "PATHFINDER_UNKNOWN") {
    return "oneinch_pathfinder_unknown";
  }

  if (typeof code === "string" && code.trim().length > 0) {
    return `oneinch_${code.trim().toLowerCase()}`;
  }

  if (Number.isInteger(statusCode) && statusCode > 0) {
    return `oneinch_quote_http_${statusCode}`;
  }

  return "oneinch_quote_error";
}

function normalizeCowQuoteFailure(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const statusMatch = errorMessage.match(
    /^CoW quote request failed with status (?<status>\d+):\s*(?<body>.*)$/su,
  );
  const statusCode = statusMatch?.groups?.status
    ? Number.parseInt(statusMatch.groups.status, 10)
    : null;
  const rawBody =
    statusMatch?.groups?.body && statusMatch.groups.body.trim().length > 0
      ? statusMatch.groups.body.trim()
      : null;
  const parsedPayload = parseCowErrorPayload(rawBody);
  const errorType = parsedPayload?.errorType ?? null;
  const errorDescription = parsedPayload?.description ?? null;

  return {
    message: errorMessage,
    statusCode,
    rawBody,
    errorType,
    errorDescription,
    blockerClass: deriveCowQuoteBlockerClass({
      statusCode,
      errorType,
    }),
  };
}

function normalizeOneInchQuoteFailure(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const statusMatch = errorMessage.match(
    /^1inch Fusion quote request failed with status (?<status>\d+):\s*(?<body>.*)$/su,
  );
  const statusCode = statusMatch?.groups?.status
    ? Number.parseInt(statusMatch.groups.status, 10)
    : null;
  const rawBody =
    statusMatch?.groups?.body && statusMatch.groups.body.trim().length > 0
      ? statusMatch.groups.body.trim()
      : null;
  const parsedPayload = parseOneInchErrorPayload(rawBody);
  const errorCode = parsedPayload?.code ?? null;
  const errorDescription =
    parsedPayload?.description ?? parsedPayload?.error ?? null;

  return {
    message: errorMessage,
    statusCode,
    rawBody,
    errorCode,
    errorDescription,
    blockerClass: deriveOneInchQuoteBlockerClass({
      statusCode,
      code: errorCode,
    }),
  };
}

function buildCowQuoteFailureMessage({ leg, quoteAttempt, quoteFailure }) {
  const parts = [
    `CoW quote request failed for ${leg.assetSymbol ?? leg.legId}.`,
    `buyToken=${quoteAttempt.buyToken ?? "missing"}`,
    `sellToken=${quoteAttempt.sellToken ?? "missing"}`,
    `sellAmountBeforeFee=${quoteAttempt.sellAmountBeforeFee}`,
    `targetNotionalUsd=${formatUsdAmount(leg.targetNotionalUsd)}`,
    `receiver=${quoteAttempt.receiver ?? "missing"}`,
    `blockerClass=${quoteFailure.blockerClass}`,
  ];

  if (quoteFailure.errorType) {
    parts.push(`venueErrorType=${quoteFailure.errorType}`);
  }

  if (quoteFailure.errorDescription) {
    parts.push(`venueErrorDescription=${quoteFailure.errorDescription}`);
  }

  parts.push(`reason=${quoteFailure.message}`);

  return parts.join(" ");
}

function buildOneInchQuoteFailureMessage({ leg, quoteAttempt, quoteFailure }) {
  const parts = [
    `1inch Fusion quote request failed for ${leg.assetSymbol ?? leg.legId}.`,
    `buyToken=${quoteAttempt.toTokenAddress ?? "missing"}`,
    `sellToken=${quoteAttempt.fromTokenAddress ?? "missing"}`,
    `amount=${quoteAttempt.amount}`,
    `targetNotionalUsd=${formatUsdAmount(leg.targetNotionalUsd)}`,
    `blockerClass=${quoteFailure.blockerClass}`,
  ];

  if (quoteFailure.errorCode) {
    parts.push(`venueErrorCode=${quoteFailure.errorCode}`);
  }

  if (quoteFailure.errorDescription) {
    parts.push(`venueErrorDescription=${quoteFailure.errorDescription}`);
  }

  parts.push(`reason=${quoteFailure.message}`);

  return parts.join(" ");
}

function stripExecutionQuoteBlockers(messages = []) {
  return messages.filter(
    (message) =>
      !String(message).startsWith("CoW quote request failed") &&
      !String(message).startsWith("1inch Fusion quote request failed") &&
      !String(message).startsWith("CoW order submission failed") &&
      !String(message).startsWith("1inch Fusion order submission failed"),
  );
}

function createExecutionRequestLinkage({
  rebalance = null,
  providerReceipt = null,
} = {}) {
  const linkage = {
    rebalanceId: rebalance?.rebalanceId ?? null,
    providerReceiptId:
      providerReceipt?.receiptId ?? rebalance?.providerReceiptId ?? null,
  };

  return Object.values(linkage).some((value) => value !== null)
    ? linkage
    : null;
}

function createExecutionLegArtifactLinkage({
  executionRequestId,
  requestLinkage = null,
}) {
  if (!executionRequestId || !requestLinkage) {
    return null;
  }

  return {
    executionRequestId,
    rebalanceId: requestLinkage.rebalanceId ?? null,
    providerReceiptId: requestLinkage.providerReceiptId ?? null,
  };
}

function createExecutionLeg({
  executionRequestId = null,
  allocation,
  sequence,
  requestedNotionalUsd,
  fundingAssetSymbol,
  signerAddress,
  settlementAddress,
  fetchedAsset,
  manifest,
  activation,
  routeSelection = MANUAL_EXECUTION_ROUTE_SELECTIONS.venue_router,
  executionPlanSnapshot = activation.executionPlanSnapshot,
  requestLinkage = null,
}) {
  const targetNotionalUsd = roundUsd(
    (requestedNotionalUsd * allocation.targetWeightPct) / 100,
  );

  if (allocation.sleeve !== "core_xstocks") {
    return {
      legId: `${activation.activationId}:leg:${sequence}`,
      sequence,
      sleeve: allocation.sleeve,
      assetSymbol: allocation.assetSymbol,
      venueId: allocation.venueId,
      adapterId: allocation.venueId ?? "manual_followup",
      requiredRouteId: findManifestRouteId(manifest, allocation.sleeve),
      targetWeightPct: allocation.targetWeightPct,
      targetNotionalUsd,
      paymentAssetSymbol: fundingAssetSymbol,
      paymentTokenAddress: null,
      paymentTokenDecimals: null,
      receivingTokenAddress: null,
      receivingTokenDecimals: null,
      settlementAddress,
      state: "deferred",
      blockers: [],
      warnings: [YIELD_BUFFER_DEFERRED_WARNING],
      quote: null,
      approval: null,
      venueStatus: null,
      receipt: null,
      trade: null,
      linkage: createExecutionLegArtifactLinkage({
        executionRequestId,
        requestLinkage,
      }),
    };
  }

  const deployment = findEthereumDeployment(fetchedAsset);
  const fundingStablecoin = findFundingStablecoin(deployment, fundingAssetSymbol);
  const cowReceivingToken = resolveCowReceivingToken(deployment);
  const oneInchReceivingToken = resolveOneInchReceivingToken(deployment);
  const selectedReceivingToken =
    routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID
      ? oneInchReceivingToken
      : routeSelection.requestAdapterId === COW_SWAP_EXECUTION_ADAPTER_ID
        ? cowReceivingToken
        : {
            address: cowReceivingToken.address ?? oneInchReceivingToken.address,
            source:
              cowReceivingToken.address
                ? cowReceivingToken.source
                : oneInchReceivingToken.source,
          };
  const blockers = [];

  if (!selectedReceivingToken.address) {
    blockers.push(
      routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID
        ? `Ethereum execution token metadata is missing for ${allocation.assetSymbol}; 1inch requires deployment.address metadata on the live xstocks asset.`
        : routeSelection.requestAdapterId === COW_SWAP_EXECUTION_ADAPTER_ID
          ? `Ethereum execution token metadata is missing for ${allocation.assetSymbol}; CoW requires wrapperAddress or deployment.address metadata on the live xstocks asset.`
          : `Ethereum execution token metadata is missing for ${allocation.assetSymbol}; neither CoW wrapperAddress nor 1inch deployment.address is available.`,
    );
  }

  if (!fundingStablecoin?.address) {
    blockers.push(
      `${allocation.assetSymbol} does not expose ${fundingAssetSymbol} as an Ethereum payment asset in the live xstocks metadata required for venue-routed execution.`,
    );
  }

  if (!signerAddress) {
    blockers.push(
      "A verified signer wallet is required before the user-approved venue-routed lane can quote or submit this leg.",
    );
  }

  if (!settlementAddress) {
    blockers.push(
      "A settlement wallet or smart-wallet destination is required before the user-approved venue-routed lane can quote or submit this leg.",
    );
  }

  if (
    executionPlanSnapshot?.executionState !== "ready" ||
    executionPlanSnapshot?.executionEligibility !== "executable"
  ) {
    blockers.push(
      "The saved activation snapshot is not in a ready/executable state.",
    );
  }

  return {
    legId: `${activation.activationId}:leg:${sequence}`,
    sequence,
    sleeve: allocation.sleeve,
    assetSymbol: allocation.assetSymbol,
    venueId:
      routeSelection.routeId ??
      allocation.venueId ??
      findManifestRouteId(manifest, allocation.sleeve),
    adapterId: routeSelection.requestAdapterId,
    requiredRouteId:
      routeSelection.routeId ?? findManifestRouteId(manifest, allocation.sleeve),
    targetWeightPct: allocation.targetWeightPct,
    targetNotionalUsd,
    paymentAssetSymbol: fundingAssetSymbol,
    paymentTokenAddress: fundingStablecoin?.address ?? null,
    paymentTokenDecimals: fundingStablecoin?.decimals ?? null,
    receivingTokenAddress: selectedReceivingToken.address,
    receivingTokenDecimals: null,
    settlementAddress,
    state: blockers.length > 0 ? "blocked" : "pending",
    blockers,
    warnings: uniqueStrings([
      "Venue-routed execution stays user-approved: venue-specific orders must be signed before the backend can submit them.",
      routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID
        ? `${allocation.assetSymbol} is pinned to the 1inch Ethereum route for this execution request.`
        : routeSelection.requestAdapterId === COW_SWAP_EXECUTION_ADAPTER_ID
          ? `${allocation.assetSymbol} is pinned to the CoW Ethereum route for this execution request.`
          : null,
      cowReceivingToken.source === "wrapperAddress" &&
      routeSelection.requestAdapterId !== ONEINCH_EXECUTION_ADAPTER_ID
        ? `${allocation.assetSymbol} will quote against the Ethereum wrapperAddress surfaced by xStocks route metadata.`
        : null,
      oneInchReceivingToken.source === "deployment.address" &&
      routeSelection.requestAdapterId !== COW_SWAP_EXECUTION_ADAPTER_ID
        ? `${allocation.assetSymbol} can also RFQ against the Ethereum deployment.address surfaced by xStocks route metadata.`
        : null,
    ]),
    quote: null,
    approval: null,
    venueStatus: null,
    receipt: null,
    trade: null,
    linkage: createExecutionLegArtifactLinkage({
      executionRequestId,
      requestLinkage,
    }),
  };
}

function deriveExecutionRequestState({ blockers, legs }) {
  const actionableLegs = legs.filter((leg) => leg.state !== "deferred");

  if (actionableLegs.some((leg) => leg.state === "failed")) {
    return "failed";
  }

  if (blockers.length > 0 || actionableLegs.some((leg) => leg.state === "blocked")) {
    return "blocked";
  }

  if (
    actionableLegs.length > 0 &&
    actionableLegs.every((leg) => leg.state === "confirmed")
  ) {
    return legs.some((leg) => leg.state === "deferred")
      ? "manual_followup_required"
      : "confirmed";
  }

  if (actionableLegs.some((leg) => leg.state === "submitted")) {
    return "submitted";
  }

  if (actionableLegs.some((leg) => leg.state === "awaiting_approval")) {
    return "awaiting_approval";
  }

  if (actionableLegs.some((leg) => leg.state === "quote_ready")) {
    return "quote_ready";
  }

  return "requested";
}

function updateExecutionRequestState(request) {
  const coreBlockedMessages = request.legs
    .filter((leg) => leg.state === "blocked")
    .flatMap((leg) => leg.blockers);
  const blockers = uniqueStrings([...request.blockers, ...coreBlockedMessages]);

  return {
    ...request,
    blockers,
    warnings: uniqueStrings([
      ...request.warnings,
      ...request.legs.flatMap((leg) => leg.warnings),
    ]),
    state: deriveExecutionRequestState({
      blockers,
      legs: request.legs,
    }),
    updatedAt: request.updatedAt,
  };
}

function createExecutionRequest({
  activation,
  manifest,
  fetchedAssets,
  now,
  routeSelection = MANUAL_EXECUTION_ROUTE_SELECTIONS.venue_router,
  runtimeOwner = "operator_manual",
  triggerSource = "operator_manual",
  rebalance = null,
  providerReceipt = null,
  executionPlanSnapshot = activation.executionPlanSnapshot,
}) {
  const requestedNotionalUsd = activation.requestedNotionalUsd;
  const fundingAssetSymbol =
    manifest.activationTemplate.fundingAssetSymbol ?? "USDC";
  const bridgeState = createExecutionBridgeState({
    walletState: activation.walletState,
    executionPlanSnapshot,
  });
  const signerAddress = bridgeState.manualSignerAddress;
  const settlementAddress = bridgeState.executionDestinationAddress;
  const executionRequestId = `execreq_${randomUUID()}`;
  const requestLinkage = createExecutionRequestLinkage({
    rebalance,
    providerReceipt,
  });
  const fetchedAssetIndex = new Map(
    fetchedAssets.map((asset) => [asset.assetSymbol, asset]),
  );
  const request = {
    version: EXECUTION_REQUEST_CONTRACT_VERSION,
    executionRequestId,
    owner: activation.owner ?? null,
    rebalanceId: rebalance?.rebalanceId ?? null,
    activationId: activation.activationId,
    manifestId: manifest.manifestId,
    slotId: manifest.slotId,
    chain: manifest.chain,
    mode: manifest.mode,
    runtimeOwner,
    triggerSource,
    adapterId: routeSelection.requestAdapterId,
    activationManifestRef: activation.activationManifestRef,
    requestedNotionalUsd,
    fundingAssetSymbol,
    manualSignerAddress: bridgeState.manualSignerAddress,
    policyAccountAddress: bridgeState.policyAccountAddress,
    executionDestinationAddress: bridgeState.executionDestinationAddress,
    manualSigningMode: bridgeState.manualSigningMode,
    automationAccountMode: bridgeState.automationAccountMode,
    automationReadiness: bridgeState.automationReadiness,
    venueSigningMode: bridgeState.venueSigningMode,
    settlementAddress,
    state: "requested",
    blockers: uniqueStrings(
      [
        manifest.mode !== "basket"
          ? "Operator-manual execution currently supports basket manifests only."
          : null,
        manifest.chain !== "ethereum"
          ? "Operator-manual execution currently supports Ethereum mainnet only."
          : null,
      ].filter(Boolean),
    ),
    warnings:
      bridgeState.automationReadiness !== "ready"
        ? [
            "Automation remains fail-closed until the Privy smart account is ready.",
          ]
        : [],
    legs: (manifest.targetAllocations ?? []).map((allocation, index) =>
      createExecutionLeg({
        executionRequestId,
        allocation,
        sequence: index + 1,
        requestedNotionalUsd,
        fundingAssetSymbol,
        signerAddress,
        settlementAddress,
        fetchedAsset: allocation.assetSymbol
          ? fetchedAssetIndex.get(allocation.assetSymbol)
          : null,
        manifest,
        activation,
        routeSelection,
        executionPlanSnapshot,
        requestLinkage,
      }),
    ),
    linkage: requestLinkage,
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    ...request,
    warnings: uniqueStrings([
      ...request.warnings,
      ...request.legs.flatMap((leg) => leg.warnings),
    ]),
    state: deriveExecutionRequestState({
      blockers: request.blockers,
      legs: request.legs,
    }),
  };
}

function toStoredExecutionQuote(quote, quotedAt) {
  return {
    kind: "cow_swap",
    quoteId: String(quote.id),
    quotedAt,
    expiration: quote.expiration,
    verified: Boolean(quote.verified),
    protocolFeeBps: quote.protocolFeeBps ?? null,
    order: {
      sellToken: quote.quote.sellToken,
      buyToken: quote.quote.buyToken,
      receiver: quote.quote.receiver,
      sellAmount: quote.quote.sellAmount,
      buyAmount: quote.quote.buyAmount,
      validTo: quote.quote.validTo,
      appData: quote.quote.appData,
      feeAmount: quote.quote.feeAmount,
      gasAmount: quote.quote.gasAmount ?? null,
      gasPrice: quote.quote.gasPrice ?? null,
      sellTokenPrice: quote.quote.sellTokenPrice ?? null,
      kind: quote.quote.kind,
      partiallyFillable: quote.quote.partiallyFillable,
      sellTokenBalance: quote.quote.sellTokenBalance,
      buyTokenBalance: quote.quote.buyTokenBalance,
      signingScheme: quote.quote.signingScheme,
    },
    owner: quote.from,
  };
}

function toStoredOneInchExecutionQuote(quote, quoteAttempt, quotedAt) {
  return {
    kind: "oneinch_fusion",
    quoteId: quote.quoteId ?? null,
    quotedAt,
    fromTokenAddress: quoteAttempt.fromTokenAddress,
    toTokenAddress: quoteAttempt.toTokenAddress,
    walletAddress: quoteAttempt.walletAddress,
    fromTokenAmount: quote.fromTokenAmount,
    toTokenAmount: quote.toTokenAmount,
    settlementAddress: quote.settlementAddress,
    recommendedPreset: quote.recommendedPreset ?? quote.recommended_preset,
    priceImpactPercent: quote.priceImpactPercent ?? null,
    orderHash: quote.orderHash ?? null,
    signerAddress: quote.signerAddress ?? quoteAttempt.walletAddress,
    receiver: quote.receiver ?? quoteAttempt.walletAddress,
    fee: {
      receiver: quote.fee.receiver,
      bps: quote.fee.bps,
      whitelistDiscountPercent: quote.fee.whitelistDiscountPercent,
    },
    submissionSupported: true,
  };
}

function createApprovalFromCowQuote(storedQuote) {
  return {
    approvalType: "eip712_signature",
    status: "awaiting_user",
    signerAddress: storedQuote.owner,
    approvalTarget: "cow_order",
    orderToSign: {
      ...storedQuote.order,
      from: storedQuote.owner,
    },
    signature: null,
    approvedAt: null,
    submittedAt: null,
    venueOrderId: null,
    notes: [
      "The user must sign this CoW order via an EIP-712-compatible wallet flow before backend submission.",
    ],
  };
}

function createApprovalFromQuote(storedQuote, preparedOrder = null) {
  if (storedQuote.kind === "oneinch_fusion") {
    if (!preparedOrder) {
      throw new Error(
        "1inch Fusion approval payloads require a prepared order artifact.",
      );
    }

    return {
      approvalType: "eip712_signature",
      status: "awaiting_user",
      signerAddress: storedQuote.signerAddress,
      approvalTarget: "oneinch_fusion_order",
      orderToSign: {
        quoteId: preparedOrder.quoteId,
        orderHash: preparedOrder.orderHash,
        order: preparedOrder.order,
        extension: preparedOrder.extension,
        typedData: preparedOrder.typedData,
      },
      signature: null,
      approvedAt: null,
      submittedAt: null,
      venueOrderId: null,
      notes: [
        "The user must sign this 1inch Fusion EIP-712 typed-data order before backend submission.",
      ],
    };
  }

  return createApprovalFromCowQuote(storedQuote);
}

function getExecutionVenueLabel(leg) {
  if (leg?.quote?.kind === "oneinch_fusion") {
    return "1inch Fusion";
  }

  if (leg?.quote?.kind === "cow_swap") {
    return "CoW";
  }

  if (leg?.venueId === ONEINCH_EXECUTION_ROUTE_ID) {
    return "1inch Fusion";
  }

  return "CoW";
}

function buildExecutionActivityEvents({
  activation,
  executionRequest,
  previousLeg = null,
  leg,
  now,
}) {
  const events = [];
  const txHash = leg.receipt?.txHash ?? null;
  const venueOrderId = leg.venueStatus?.venueOrderId ?? null;
  const venueLabel = getExecutionVenueLabel(leg);

  if (
    (leg.state === "awaiting_approval" || leg.state === "quote_ready") &&
    previousLeg?.state !== leg.state
  ) {
    events.push(
      createActivityEvent({
        activation,
        eventType: "activation_ready",
        summary:
          leg.state === "awaiting_approval"
            ? `${venueLabel} quote prepared and awaiting user approval for ${leg.assetSymbol ?? leg.sleeve}.`
            : `${venueLabel} quote prepared for ${leg.assetSymbol ?? leg.sleeve}; submission remains blocked on the current backend boundary.`,
        now,
        payload: {
          executionRequestId: executionRequest.executionRequestId,
          legId: leg.legId,
          quoteId: leg.quote?.quoteId ?? null,
          requestState: executionRequest.state,
        },
      }),
    );
  }

  if (venueOrderId && venueOrderId !== previousLeg?.venueStatus?.venueOrderId) {
    events.push(
      createActivityEvent({
        activation,
        eventType: "activation_submitted",
        summary: `Recorded user-approved ${venueLabel} submission for ${leg.assetSymbol ?? leg.sleeve}.`,
        now,
        payload: {
          executionRequestId: executionRequest.executionRequestId,
          legId: leg.legId,
          venueOrderId,
          txHash,
          requestState: executionRequest.state,
        },
      }),
    );
  }

  if (leg.state === "confirmed" && previousLeg?.state !== "confirmed") {
    events.push(
      createActivityEvent({
        activation,
        eventType: "activation_succeeded",
        summary: `${venueLabel} execution confirmed for ${leg.assetSymbol ?? leg.sleeve}.`,
        now,
        payload: {
          executionRequestId: executionRequest.executionRequestId,
          legId: leg.legId,
          venueOrderId,
          txHash,
          requestState: executionRequest.state,
        },
      }),
    );
  } else if (leg.state === "failed" && previousLeg?.state !== "failed") {
    events.push(
      createActivityEvent({
        activation,
        eventType: "activation_failed",
        summary: `${venueLabel} execution failed for ${leg.assetSymbol ?? leg.sleeve}.`,
        now,
        payload: {
          executionRequestId: executionRequest.executionRequestId,
          legId: leg.legId,
          venueOrderId,
          txHash,
          requestState: executionRequest.state,
        },
      }),
    );
  }

  return events;
}

function compareAtomicAmountStrings(left, right) {
  const leftValue = BigInt(String(left ?? "0"));
  const rightValue = BigInt(String(right ?? "0"));

  if (leftValue === rightValue) {
    return 0;
  }

  return leftValue > rightValue ? 1 : -1;
}

function selectVenueQuoteCandidate(candidates) {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    if (left.submissionSupported !== right.submissionSupported) {
      return left.submissionSupported ? -1 : 1;
    }

    const amountComparison = compareAtomicAmountStrings(
      right.outputAmount,
      left.outputAmount,
    );

    if (amountComparison !== 0) {
      return amountComparison;
    }

    return left.adapterId.localeCompare(right.adapterId);
  })[0];
}

function buildQuoteFailureRawStatus(quoteAttempts) {
  const attempts = Object.values(quoteAttempts ?? {}).filter(Boolean);
  const primaryFailure =
    attempts.find(
      (attempt) =>
        attempt?.status === "failed" &&
        attempt.venueId === COW_SWAP_EXECUTION_ROUTE_ID,
    ) ??
    attempts.find(
      (attempt) =>
        attempt?.status === "failed" &&
        attempt.venueId === ONEINCH_EXECUTION_ROUTE_ID,
    ) ??
    attempts.find((attempt) => attempt?.status === "failed") ??
    null;

  return {
    selectedVenueId: null,
    quoteAttempts,
    buyToken:
      primaryFailure?.buyToken ??
      primaryFailure?.toTokenAddress ??
      null,
    sellToken:
      primaryFailure?.sellToken ??
      primaryFailure?.fromTokenAddress ??
      null,
    sellAmountBeforeFee:
      primaryFailure?.sellAmountBeforeFee ??
      primaryFailure?.amount ??
      null,
    error: primaryFailure?.error ?? null,
    errorStatusCode: primaryFailure?.errorStatusCode ?? null,
    errorType: primaryFailure?.errorType ?? primaryFailure?.errorCode ?? null,
    errorDescription: primaryFailure?.errorDescription ?? null,
    errorBody: primaryFailure?.errorBody ?? null,
    blockerClass: primaryFailure?.blockerClass ?? null,
  };
}

function sortCatalogRecords(records) {
  const surfaceOrder = {
    onboarding: 0,
    advanced: 1,
  };

  return [...records].sort((left, right) => {
    const leftSurface = surfaceOrder[left.slot.surface] ?? Number.MAX_SAFE_INTEGER;
    const rightSurface = surfaceOrder[right.slot.surface] ?? Number.MAX_SAFE_INTEGER;

    return leftSurface - rightSurface || left.slot.position - right.slot.position;
  });
}

export function createApiService({
  manifestRepository,
  liveStateRepository,
  runtimeStore,
  cowExecutionClient = null,
  oneInchExecutionClient = null,
  ethereumRpcClient = null,
  privyAuthService = null,
  reportingToken = null,
  autoresearchProofToken = null,
  chainlinkCreSignerAllowlist = [],
  chainlinkCreWorkflowAllowlist = [],
  now = () => new Date().toISOString(),
}) {
  const smartAccountProvider = createSmartAccountProviderScaffold();

  async function resolvePromotedRecord(selector = {}) {
    const { manifestId, slotId } = normalizeSelector(selector);

    if (manifestId) {
      const record = await manifestRepository.getPromotedRecordById(manifestId);
      if (!record) {
        throw new HttpError(404, `Promoted manifest ${manifestId} was not found.`);
      }
      return record;
    }

    const resolvedSlotId = slotId ?? DEFAULT_SLOT_ID;
    const record = await manifestRepository.getPromotedRecordBySlot(resolvedSlotId);
    if (!record) {
      throw new HttpError(
        404,
        `No promoted manifest was found for slot ${resolvedSlotId}.`,
      );
    }

    return record;
  }

  async function resolveManifest(selector = {}) {
    return (await resolvePromotedRecord(selector)).manifest;
  }

  async function resolveQualificationAnswers(payload = {}) {
    const questionAnswersPayload = getQuestionAnswersPayload(payload);
    if (questionAnswersPayload) {
      try {
        return compileQuestionnaireQualification({
          question_answers: questionAnswersPayload,
          submittedAt: now(),
        }).normalizedOnboardingAnswers;
      } catch (error) {
        throw new HttpError(400, error.message);
      }
    }

    const onboardingAnswersPayload = getOnboardingAnswersPayload(payload);

    if (!onboardingAnswersPayload) {
      throw new HttpError(
        400,
        "Qualification requests require an answers payload using the shared onboarding answers shape.",
      );
    }

    let normalizedAnswers;

    try {
      normalizedAnswers = normalizeOnboardingAnswers(onboardingAnswersPayload, {
        submittedAt: now(),
      });
    } catch (error) {
      throw new HttpError(400, error.message);
    }

    if (
      !normalizedAnswers.selectedStarterSlotId &&
      normalizedAnswers.initialSelection.type === "public_strategy"
    ) {
      const record = await manifestRepository.getPromotedRecordById(
        normalizedAnswers.initialSelection.key,
      );

      if (!record) {
        throw new HttpError(
          400,
          `public_strategy key ${normalizedAnswers.initialSelection.key} did not resolve to a promoted manifest id or strategy slot id.`,
        );
      }

      normalizedAnswers = normalizeOnboardingAnswers(
        {
          ...normalizedAnswers,
          selectedStarterSlotId: record.slotId,
        },
        {
          submittedAt: normalizedAnswers.submittedAt,
        },
      );
    }

    return normalizedAnswers;
  }

  function createFunnelSubjectId() {
    return `${XSTOCKS_FUNNEL_SUBJECT_PREFIX}_${randomUUID()}`;
  }

  async function resolveFunnelSubject(
    subjectId,
    { allowCreate = false, required = false } = {},
  ) {
    if (!subjectId) {
      if (allowCreate) {
        return {
          subjectId: createFunnelSubjectId(),
          createdSubject: true,
        };
      }

      if (required) {
        throw new HttpError(
          400,
          "subjectId is required for this canonical funnel event.",
        );
      }

      return {
        subjectId: null,
        createdSubject: false,
      };
    }

    const exists = await runtimeStore.hasFunnelSubject(subjectId);

    if (!exists) {
      throw new HttpError(
        409,
        `Unknown funnel subject ${subjectId}. Restart from a repo-owned tracked surface before emitting follow-on events.`,
      );
    }

    return {
      subjectId,
      createdSubject: false,
    };
  }

  function buildFunnelEventDedupeKey({
    stage,
    subjectId,
    activationId = null,
    manifestId = null,
    recommendationId = null,
    walletAddress = null,
  }) {
    if (stage === "portfolio_recommended") {
      return [
        stage,
        subjectId ?? "none",
        manifestId ?? "none",
        recommendationId ?? "none",
      ].join(":");
    }

    if (stage === "activation_viewed") {
      return [stage, subjectId ?? "none", manifestId ?? "none"].join(":");
    }

    if (stage === "wallet_connected") {
      return [stage, subjectId ?? "none", walletAddress ?? "none"].join(":");
    }

    if (stage === "activation_saved_funding_blocked") {
      return [
        stage,
        activationId ?? "none",
        manifestId ?? "none",
        walletAddress ?? "none",
      ].join(":");
    }

    return [stage, subjectId ?? "none"].join(":");
  }

  function createFunnelEvent({
    stage,
    subjectId,
    activationId = null,
    owner = null,
    walletAddress = null,
    manifest = null,
    recommendationId = null,
    source,
    verificationMethod,
  }) {
    const normalizedWalletAddress = normalizeEthereumAddress(walletAddress);
    const manifestId = manifest?.manifestId ?? null;
    const slotId = manifest?.slotId ?? null;

    return xstocksFunnelEventSchema.parse({
      version: DEFAULT_RESPONSE_VERSION,
      eventId: `funnel_evt_${randomUUID()}`,
      stage,
      occurredAt: now(),
      subjectId,
      owner,
      walletAddress: normalizedWalletAddress,
      activationId,
      manifestId,
      slotId,
      recommendationId: recommendationId ?? null,
      source,
      verificationMethod,
      dedupeKey: buildFunnelEventDedupeKey({
        stage,
        subjectId,
        activationId,
        manifestId,
        recommendationId,
        walletAddress: normalizedWalletAddress,
      }),
    });
  }

  async function persistFunnelEvents(events = []) {
    if (!events.length) {
      return [];
    }

    return runtimeStore.upsertFunnelEvents({
      funnelEvents: events,
    });
  }

  async function loadLiveState(manifest) {
    return liveStateRepository.loadBoundaryState({ manifest });
  }

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
      manifestRef: createActivationManifestRef(manifest),
      recommendation,
      executionPlan,
      walletState: normalizedWalletState,
      requestedNotionalUsd: normalizedRequestedNotionalUsd,
    };
  }

  async function loadManifestActivity(manifestId, limit = 200, ownerUserId = null) {
    if (!ownerUserId) {
      return {
        items: [],
        activations: [],
      };
    }

    const [items, activations] = await Promise.all([
      runtimeStore.listActivity({ manifestId, ownerUserId, limit }),
      runtimeStore.listActivations({ manifestId, ownerUserId }),
    ]);

    return {
      items: items.map(serializeActivityEvent),
      activations: activations.map(serializeActivation),
    };
  }

  async function loadSlotRuntime(manifest, ownerUserId = null) {
    if (!ownerUserId) {
      return {
        latestActivation: null,
        latestRebalance: null,
        rebalanceHistory: [],
      };
    }

    const [slotActivations, latestRebalanceRecord] = await Promise.all([
      runtimeStore.listActivations({
        slotId: manifest.slotId,
        ownerUserId,
      }),
      runtimeStore.getLatestRebalance({ slotId: manifest.slotId }),
    ]);
    const latestActivation =
      slotActivations.length > 0 ? serializeActivation(slotActivations[0]) : null;
    const latestRebalance = serializeRebalance(latestRebalanceRecord);

    return {
      latestActivation,
      latestRebalance,
      rebalanceHistory: serializeRebalanceHistory(latestRebalanceRecord),
    };
  }

  async function loadGlobalSlotRuntime(manifest) {
    const [slotActivations, latestRebalanceRecord] = await Promise.all([
      runtimeStore.listActivations({
        slotId: manifest.slotId,
      }),
      runtimeStore.getLatestRebalance({ slotId: manifest.slotId }),
    ]);

    return {
      latestActivation:
        slotActivations.length > 0 ? serializeActivation(slotActivations[0]) : null,
      latestRebalance: serializeRebalance(latestRebalanceRecord),
      rebalanceHistory: serializeRebalanceHistory(latestRebalanceRecord),
    };
  }

  function buildRebalanceOrchestration({
    manifest,
    boundaryPayload,
    latestActivation,
    latestRebalance,
    triggerSource = latestRebalance?.triggerSource,
    providerTriggeredProven = false,
    resume = false,
  }) {
    return deriveRebalanceOrchestration({
      activation_manifest: manifest,
      recommendation: boundaryPayload.recommendation,
      execution_plan: boundaryPayload.executionPlan,
      latest_activation: latestActivation,
      latest_rebalance: latestRebalance,
      trigger_source: triggerSource,
      provider_triggered_proven: providerTriggeredProven,
      resume,
      now: now(),
    });
  }

  function buildProviderEventReceipt({
    validation = null,
    receiptCandidate = null,
    decision,
    reason,
    errorCode = null,
    duplicateOfReceiptId = null,
    rebalance = null,
  }) {
    const body = validation?.body ?? null;
    const claims = validation?.claims ?? null;
    const signerAddress = validation?.signerAddress ?? receiptCandidate?.signerAddress ?? null;
    const digest = validation?.digest ?? receiptCandidate?.digest ?? null;
    const dedupeKey = validation?.dedupeKey ?? receiptCandidate?.dedupeKey ?? null;

    return {
      receiptId: `provider_evt_rcpt_${randomUUID()}`,
      receivedAt: now(),
      providerId:
        body?.providerId ??
        receiptCandidate?.providerId ??
        claims?.providerId ??
        "chainlink_cre",
      deliveryId: body?.deliveryId ?? receiptCandidate?.deliveryId ?? null,
      eventId: body?.eventId ?? receiptCandidate?.eventId ?? null,
      providerEventId: body?.providerEventId ?? receiptCandidate?.providerEventId ?? null,
      workflowId: body?.workflowId ?? receiptCandidate?.workflowId ?? claims?.workflowId ?? null,
      workflowExecutionId:
        body?.workflowExecutionId ??
        receiptCandidate?.workflowExecutionId ??
        claims?.workflowExecutionId ??
        null,
      slotId: body?.slotId ?? receiptCandidate?.slotId ?? claims?.slotId ?? null,
      chain: body?.chain ?? receiptCandidate?.chain ?? claims?.chain ?? null,
      targetManifestId:
        body?.targetManifestId ??
        receiptCandidate?.targetManifestId ??
        claims?.targetManifestId ??
        null,
      dedupeKey,
      digest,
      signerAddress,
      issuer: claims?.iss ?? receiptCandidate?.issuer ?? null,
      jti: claims?.jti ?? receiptCandidate?.jti ?? null,
      tokenIssuedAt:
        claims?.iat !== undefined
          ? new Date(claims.iat * 1000).toISOString()
          : receiptCandidate?.tokenIssuedAt ?? null,
      tokenExpiresAt:
        claims?.exp !== undefined
          ? new Date(claims.exp * 1000).toISOString()
          : receiptCandidate?.tokenExpiresAt ?? null,
      decision,
      errorCode,
      rebalanceId: rebalance?.rebalanceId ?? null,
      reason,
      duplicateOfReceiptId,
    };
  }

  async function persistProviderEventReceipt(input) {
    return runtimeStore.recordProviderEventReceipt({
      receipt: buildProviderEventReceipt(input),
    });
  }

  async function rejectProviderTriggeredReview({
    validation = null,
    receiptCandidate = null,
    statusCode = 409,
    errorCode,
    message,
  }) {
    const receipt = await persistProviderEventReceipt({
      validation,
      receiptCandidate,
      decision: "rejected",
      reason: message,
      errorCode,
    });

    throw new HttpError(statusCode, message, {
      errorCode,
      receiptId: receipt.receiptId,
    });
  }

  async function loadActivationById(activationId, requestContext) {
    const authenticatedRequestContext =
      requireAuthenticatedRequestContext(requestContext);
    const [activation] = await runtimeStore.listActivations({
      activationId,
      ownerUserId: authenticatedRequestContext.owner.userId,
    });

    if (!activation) {
      throw new HttpError(
        404,
        `Activation ${activationId} was not found for the authenticated user.`,
      );
    }

    const serializedActivation = serializeActivation(activation);
    ensureActivationOwnership({
      activation: serializedActivation,
      requestContext: authenticatedRequestContext,
    });
    return serializedActivation;
  }

  async function loadExecutionRequestById(executionRequestId, requestContext) {
    const authenticatedRequestContext =
      requireAuthenticatedRequestContext(requestContext);
    const executionRequest = await runtimeStore.getExecutionRequest({
      executionRequestId,
      ownerUserId: authenticatedRequestContext.owner.userId,
    });

    if (!executionRequest) {
      throw new HttpError(
        404,
        `Execution request ${executionRequestId} was not found for the authenticated user.`,
      );
    }

    ensureExecutionOwnership({
      executionRequest,
      requestContext: authenticatedRequestContext,
    });
    return executionRequest;
  }

  async function loadRebalanceForExecuteAll({
    activation,
    rebalanceId = null,
  }) {
    const rebalances = await runtimeStore.listRebalances({
      slotId: activation.slotId,
      limit: 50,
    });
    const rebalance =
      rebalanceId
        ? rebalances.find((item) => item.rebalanceId === rebalanceId) ?? null
        : rebalances[0] ?? null;

    if (!rebalance) {
      throw new HttpError(
        404,
        "Provider-backed execute_all requires a persisted rebalance review for this slot.",
      );
    }

    if (rebalance.triggerSource !== "provider_triggered") {
      throw new HttpError(
        409,
        "execute_all currently supports provider-triggered awaiting_operator review state only.",
      );
    }

    if (rebalance.state !== "awaiting_operator") {
      throw new HttpError(
        409,
        `execute_all requires awaiting_operator review state, received ${rebalance.state}.`,
      );
    }

    return rebalance;
  }

  async function loadAcceptedProviderReceiptForRebalance(rebalance) {
    const providerReceipts = await runtimeStore.listProviderEventReceipts({
      slotId: rebalance.slotId,
      decision: "accepted",
      limit: 50,
    });
    const providerReceipt =
      providerReceipts.find((item) => item.rebalanceId === rebalance.rebalanceId) ??
      null;

    if (!providerReceipt) {
      throw new HttpError(
        409,
        "Accepted provider receipt linkage is required before provider-backed execute_all can stage execution.",
      );
    }

    return providerReceipt;
  }

  function ensureExecuteAllStagingProof({
    activation,
    requestContext,
  }) {
    const authenticatedRequestContext =
      requireAuthenticatedRequestContext(requestContext);

    if (!activation.owner?.userId || !activation.owner?.authenticatedAt) {
      throw new HttpError(
        409,
        "Saved activation ownership proof is missing; provider-backed execute_all cannot stage execution.",
      );
    }

    if (!authenticatedRequestContext.owner?.sessionId) {
      throw new HttpError(
        409,
        "Current authenticated session proof is required before provider-backed execute_all can stage execution.",
      );
    }

    const signerAddress = resolveExecutionSignerAddress(activation.walletState);
    const settlementAddress = resolveSettlementAddress(activation.walletState);
    const verifiedAddresses = uniqueStrings([
      ...authenticatedRequestContext.linkedWalletAddresses,
      ...authenticatedRequestContext.linkedEmbeddedWalletAddresses,
    ]);

    if (!signerAddress) {
      throw new HttpError(
        409,
        "A verified signer wallet proof is required before provider-backed execute_all can stage execution.",
      );
    }

    if (!addressInVerifiedSet(signerAddress, verifiedAddresses)) {
      throw new HttpError(
        403,
        "Provider-backed execute_all signer proof does not match the authenticated Privy user.",
      );
    }

    if (!settlementAddress) {
      throw new HttpError(
        409,
        "A settlement wallet or smart-wallet destination is required before provider-backed execute_all can stage execution.",
      );
    }
  }

  function applyExecutionLinkage({
    executionRequest,
    rebalance = null,
    providerReceipt = null,
  }) {
    const requestLinkage = createExecutionRequestLinkage({
      rebalance,
      providerReceipt,
    });

    return {
      ...executionRequest,
      rebalanceId: rebalance?.rebalanceId ?? executionRequest.rebalanceId ?? null,
      linkage: requestLinkage,
      legs: executionRequest.legs.map((leg) => ({
        ...leg,
        linkage: createExecutionLegArtifactLinkage({
          executionRequestId: executionRequest.executionRequestId,
          requestLinkage,
        }),
      })),
    };
  }

  function replaceExecutionLeg(executionRequest, nextLeg) {
    return {
      ...executionRequest,
      legs: executionRequest.legs.map((leg) =>
        leg.legId === nextLeg.legId ? nextLeg : leg,
      ),
      updatedAt: now(),
    };
  }

  async function persistExecutionRequest({
    executionRequest,
    activation,
    activityEvents = [],
  }) {
    const nextExecutionRequest = {
      ...executionRequest,
      updatedAt: now(),
    };
    const normalizedExecutionRequest = updateExecutionRequestState(
      nextExecutionRequest,
    );

    await runtimeStore.upsertExecutionRequest({
      executionRequest: normalizedExecutionRequest,
      activityEvents,
    });

    return {
      executionRequest: normalizedExecutionRequest,
      activityEvents,
    };
  }

  async function persistProviderExecutionHandoff({
    executionRequest,
    activation,
    rebalance,
    providerReceipt,
    activityEvents = [],
  }) {
    const linkedExecutionRequest = applyExecutionLinkage({
      executionRequest,
      rebalance,
      providerReceipt,
    });
    const persistedExecution = await persistExecutionRequest({
      executionRequest: linkedExecutionRequest,
      activation,
      activityEvents,
    });
    const nextRebalance = await runtimeStore.upsertRebalance({
      rebalance: {
        ...rebalance,
        providerReceiptId:
          providerReceipt.receiptId ?? rebalance.providerReceiptId ?? null,
        executionRequestId:
          persistedExecution.executionRequest.executionRequestId,
        executionTriggerSource:
          persistedExecution.executionRequest.triggerSource,
        executionRequestState: persistedExecution.executionRequest.state,
      },
      eventType: "execution_staged",
    });

    return {
      executionRequest: persistedExecution.executionRequest,
      activityEvents: persistedExecution.activityEvents,
      providerReceipt,
      rebalance: nextRebalance,
    };
  }

  async function refreshReceiptForLeg(leg) {
    if (!leg.receipt?.txHash || !ethereumRpcClient) {
      return leg;
    }

    let chainReceipt = null;

    try {
      chainReceipt = await ethereumRpcClient.getTransactionReceipt(
        leg.receipt.txHash,
      );
    } catch {
      return {
        ...leg,
        state: "submitted",
        receipt: {
          ...leg.receipt,
          lastCheckedAt: now(),
          receiptStatus: leg.receipt.receiptStatus ?? "pending",
          rpcUrl: ethereumRpcClient.rpcUrl ?? leg.receipt.rpcUrl ?? null,
        },
      };
    }

    const receiptStatus = chainReceipt?.status ?? "pending";

    return {
      ...leg,
      state:
        receiptStatus === "confirmed"
          ? "confirmed"
          : receiptStatus === "reverted"
            ? "failed"
            : "submitted",
      receipt: {
        ...(leg.receipt ?? {}),
        lastCheckedAt: now(),
        receiptStatus,
        confirmedAt:
          receiptStatus === "confirmed"
            ? leg.receipt.confirmedAt ?? now()
            : leg.receipt.confirmedAt ?? null,
        revertedAt:
          receiptStatus === "reverted"
            ? leg.receipt.revertedAt ?? now()
            : leg.receipt.revertedAt ?? null,
        blockNumber: chainReceipt?.blockNumber ?? leg.receipt.blockNumber ?? null,
        transactionIndex:
          chainReceipt?.transactionIndex ??
          leg.receipt.transactionIndex ??
          null,
        rpcUrl: ethereumRpcClient.rpcUrl ?? leg.receipt.rpcUrl ?? null,
        rawReceipt: chainReceipt?.rawReceipt ?? leg.receipt.rawReceipt ?? null,
      },
      venueStatus: {
        ...(leg.venueStatus ?? {
          venueId: leg.venueId ?? OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
          venueOrderId: leg.approval?.venueOrderId ?? null,
          settlementTxHash: leg.receipt.txHash,
        }),
        status:
          receiptStatus === "confirmed"
            ? "confirmed"
            : receiptStatus === "reverted"
              ? "failed"
              : "submitted",
        settlementTxHash: leg.receipt.txHash,
        lastCheckedAt: now(),
        updatedAt: now(),
        rawStatus: leg.venueStatus?.rawStatus ?? null,
      },
    };
  }

  function mapCowVenueState(status) {
    const normalizedStatus = String(status ?? "submitted").toLowerCase();

    if (
      ["fulfilled", "executed", "traded", "settled", "presignaturepending"]
        .includes(normalizedStatus)
    ) {
      return normalizedStatus === "presignaturepending" ? "submitted" : "confirmed";
    }

    if (
      ["cancelled", "canceled", "expired", "failed", "invalidated"].includes(
        normalizedStatus,
      )
    ) {
      return "failed";
    }

    return "submitted";
  }

  async function refreshCowVenueStatus(leg) {
    if (!cowExecutionClient || !leg.approval?.venueOrderId) {
      return leg;
    }

    try {
      const venueStatus = await cowExecutionClient.getOrder(leg.approval.venueOrderId);

      if (!venueStatus) {
        return leg;
      }

      const nextState = mapCowVenueState(venueStatus.status);
      const settlementTxHash =
        normalizeTxHash(venueStatus.settlementTxHash) ??
        leg.venueStatus?.settlementTxHash ??
        null;

      return {
        ...leg,
        state:
          leg.receipt?.txHash && leg.state !== "failed"
            ? leg.state
            : nextState,
        venueStatus: {
          venueId: leg.venueId ?? OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
          venueOrderId: venueStatus.uid,
          status: venueStatus.status,
          settlementTxHash,
          lastCheckedAt: now(),
          updatedAt: now(),
          rawStatus: venueStatus.raw ?? null,
        },
        receipt:
          settlementTxHash && !leg.receipt
            ? {
                txHash: settlementTxHash,
                submittedAt: leg.approval.submittedAt ?? now(),
                lastCheckedAt: null,
                receiptStatus: "pending",
                confirmedAt: null,
                revertedAt: null,
                blockNumber: null,
                transactionIndex: null,
                rpcUrl: ethereumRpcClient?.rpcUrl ?? null,
                rawReceipt: null,
              }
            : leg.receipt,
      };
    } catch {
      return leg;
    }
  }

  function mapOneInchVenueState(status) {
    const normalizedStatus = String(status ?? "pending").toLowerCase();

    if (normalizedStatus === "filled") {
      return "confirmed";
    }

    if (
      [
        "false-predicate",
        "not-enough-balance-or-allowance",
        "expired",
        "wrong-permit",
        "cancelled",
        "invalid-signature",
      ].includes(normalizedStatus)
    ) {
      return "failed";
    }

    return "submitted";
  }

  async function refreshOneInchVenueStatus(leg) {
    if (!oneInchExecutionClient || !leg.approval?.venueOrderId) {
      return leg;
    }

    try {
      const venueStatus = await oneInchExecutionClient.getOrderStatus(
        leg.approval.venueOrderId,
      );

      if (!venueStatus) {
        return leg;
      }

      const nextState = mapOneInchVenueState(venueStatus.status);
      const settlementTxHash =
        nextState === "confirmed"
          ? normalizeTxHash(venueStatus.settlementTxHash) ??
            leg.venueStatus?.settlementTxHash ??
            null
          : leg.venueStatus?.settlementTxHash ?? null;

      return {
        ...leg,
        state:
          leg.receipt?.txHash && leg.state !== "failed"
            ? leg.state
            : nextState,
        warnings:
          String(venueStatus.status).toLowerCase() === "partially-filled"
            ? uniqueStrings([
                ...leg.warnings,
                "1inch Fusion order is partially filled; final settlement remains pending.",
              ])
            : leg.warnings,
        venueStatus: {
          venueId: leg.venueId ?? ONEINCH_EXECUTION_ROUTE_ID,
          venueOrderId: venueStatus.orderHash,
          status: venueStatus.status,
          settlementTxHash,
          lastCheckedAt: now(),
          updatedAt: now(),
          rawStatus: venueStatus.raw ?? null,
        },
        receipt:
          settlementTxHash && !leg.receipt
            ? {
                txHash: settlementTxHash,
                submittedAt: leg.approval.submittedAt ?? now(),
                lastCheckedAt: null,
                receiptStatus: "pending",
                confirmedAt: null,
                revertedAt: null,
                blockNumber: null,
                transactionIndex: null,
                rpcUrl: ethereumRpcClient?.rpcUrl ?? null,
                rawReceipt: null,
              }
            : leg.receipt,
      };
    } catch {
      return leg;
    }
  }

  async function refreshVenueStatusForLeg(leg, executionRequest = null) {
    const routeSelection = resolveManualExecutionRouteSelectionFromLeg(
      leg,
      executionRequest,
    );

    if (routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID) {
      return await refreshOneInchVenueStatus(leg);
    }

    return await refreshCowVenueStatus(leg);
  }

  return {
    async authenticateRequest(request, options = {}) {
      if (!privyAuthService) {
        if (options.required) {
          throw new HttpError(
            503,
            "Privy auth verification is not configured on this backend.",
          );
        }

        return null;
      }

      return privyAuthService.authenticateRequest(request, options);
    },

    async authenticateReportingRequest(request, options = {}) {
      if (!reportingToken) {
        if (options.required) {
          throw new HttpError(
            503,
            "Operator reporting token is not configured on this backend.",
          );
        }

        return null;
      }

      const suppliedToken = readNamedBearerTokenFromRequest(
        request,
        "x-reporting-token",
      );

      if (!suppliedToken) {
        throw new HttpError(401, "Operator reporting token is required.");
      }

      if (!tokensMatch(suppliedToken, reportingToken)) {
        throw new HttpError(403, "Operator reporting token is invalid.");
      }

      return {
        accessMode: "operator_token",
      };
    },

    async authenticateAutoresearchProofRequest(request, options = {}) {
      if (!autoresearchProofToken) {
        if (options.required) {
          throw new HttpError(
            503,
            "Autoresearch proof token is not configured on this backend.",
          );
        }

        return null;
      }

      const suppliedToken = readNamedBearerTokenFromRequest(
        request,
        "x-autoresearch-proof-token",
      );

      if (!suppliedToken) {
        throw new HttpError(401, "Autoresearch proof token is required.");
      }

      if (!tokensMatch(suppliedToken, autoresearchProofToken)) {
        throw new HttpError(403, "Autoresearch proof token is invalid.");
      }

      return {
        accessMode: "autoresearch_proof_token",
      };
    },

    async ingestXStocksFunnelEvent(body = {}, { requestContext = null } = {}) {
      let request;

      try {
        request = xstocksFunnelEventIngestRequestSchema.parse(body);
      } catch (error) {
        throw new HttpError(
          400,
          error instanceof Error ? error.message : "Invalid funnel event payload.",
        );
      }

      const requestedSubjectId = getOptionalSubjectId(request);
      const { subjectId, createdSubject } = await resolveFunnelSubject(
        requestedSubjectId,
        {
          allowCreate: true,
        },
      );

      let manifest = null;
      let owner = null;
      let walletAddress = null;
      let verificationMethod = "web_subject_known";

      if (request.stage === "landing_viewed") {
        verificationMethod = createdSubject
          ? "web_subject_bootstrap"
          : "web_subject_known";
      } else if (request.stage === "onboarding_started") {
        verificationMethod = createdSubject
          ? "web_subject_bootstrap"
          : "web_subject_known";
      } else if (request.stage === "activation_viewed") {
        if (!request.manifestId && !request.slotId) {
          throw new HttpError(
            400,
            "activation_viewed requires manifestId or slotId.",
          );
        }

        manifest = await resolveManifest(request);
        verificationMethod = "manifest_activation_route";
      } else {
        const authenticatedRequestContext =
          requireAuthenticatedRequestContext(requestContext);
        walletAddress =
          authenticatedRequestContext.linkedWalletAddresses[0] ??
          authenticatedRequestContext.linkedEmbeddedWalletAddresses[0] ??
          null;

        if (!walletAddress) {
          throw new HttpError(
            409,
            "wallet_connected requires one verified linked wallet address.",
          );
        }

        owner = authenticatedRequestContext.owner;
        verificationMethod = "privy_wallet_auth";
      }

      const events = await persistFunnelEvents([
        createFunnelEvent({
          stage: request.stage,
          subjectId,
          owner,
          walletAddress,
          manifest,
          source: "web",
          verificationMethod,
        }),
      ]);

      return parseApiResponse("xstocks_funnel_event_ingest", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        request,
        subjectId,
        createdSubject,
        events,
      });
    },

    async getRecommendation(query = {}) {
      assertNoRawCandidatePayload(query);
      const manifest = await resolveManifest(query);
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd: getRequestedNotionalUsd(query),
        walletState: getWalletState(query),
      });

      return parseApiResponse("recommendation_fetch", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        manifestRef: boundaryPayload.manifestRef,
        manifest: buildManifestView(manifest),
        recommendation: boundaryPayload.recommendation,
        executionPlanPreview: buildExecutionPlanPreview(boundaryPayload.executionPlan),
      });
    },

    async qualify(body = {}) {
      assertNoRawCandidatePayload(body);
      const onboardingAnswers = await resolveQualificationAnswers(body);
      let qualificationDecision;

      try {
        qualificationDecision = deriveQualificationDecision({
          onboarding_answers: onboardingAnswers,
        });
      } catch (error) {
        throw new HttpError(400, error.message);
      }

      const manifest = await resolveManifest({
        slotId: qualificationDecision.selection.slotId,
      });
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const requestedNotionalUsd = resolveRequestedNotionalUsd(
        getRequestedNotionalUsd(body),
        manifest.walletRequirements.minFundingUsd,
      );
      let qualification;

      try {
        qualification = deriveAgentQualification({
          onboarding_answers: onboardingAnswers,
          activation_manifest: manifest,
          live_xstocks_state: liveXStocksState,
          live_route_state: liveRouteState,
          user_notional_usd: requestedNotionalUsd,
          wallet_state: getWalletState(body),
        });
      } catch (error) {
        throw new HttpError(400, error.message);
      }

      const requestedSubjectId = getOptionalSubjectId(body);

      if (requestedSubjectId) {
        const { subjectId } = await resolveFunnelSubject(requestedSubjectId, {
          required: true,
        });

        await persistFunnelEvents([
          createFunnelEvent({
            stage: "qualification_completed",
            subjectId,
            manifest,
            recommendationId: qualification.recommendation.recommendationId,
            source: "api",
            verificationMethod: "questionnaire_qualification",
          }),
          createFunnelEvent({
            stage: "portfolio_recommended",
            subjectId,
            manifest,
            recommendationId: qualification.recommendation.recommendationId,
            source: "api",
            verificationMethod: "questionnaire_qualification",
          }),
        ]);
      }

      return parseApiResponse("qualification_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        qualification,
      });
    },

    async readCatalog(query = {}) {
      assertNoRawCandidatePayload(query);
      const surface = normalizeCatalogFilter(
        query.surface,
        CATALOG_SURFACES,
        "surface",
      );
      const mode = normalizeCatalogFilter(query.mode, CATALOG_MODES, "mode");
      const registry =
        typeof manifestRepository.readSlotRegistry === "function"
          ? await manifestRepository.readSlotRegistry()
          : null;
      let records = await manifestRepository.listPromotedRecords();

      if (surface) {
        records = records.filter((record) => record.slot.surface === surface);
      }

      if (mode) {
        records = records.filter((record) => record.slot.mode === mode);
      }

      const items = await Promise.all(
        sortCatalogRecords(records).map(async (record) => {
          const manifest = record.manifest;
          const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
          const boundaryPayload = deriveBoundaryPayload({
            manifest,
            liveXStocksState,
            liveRouteState,
            requestedNotionalUsd: resolveRequestedNotionalUsd(
              undefined,
              manifest.walletRequirements.minFundingUsd,
            ),
            walletState: undefined,
          });

          return {
            slot: record.slot,
            manifest: buildManifestView(manifest),
            defaultRequestedNotionalUsd: manifest.walletRequirements.minFundingUsd,
            targetSummary: buildTargetSummary(manifest),
            executionPreview: buildExecutionPlanPreview(
              boundaryPayload.executionPlan,
            ),
          };
        }),
      );

      return parseApiResponse("catalog_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: registry?.generatedAtUtc ?? now(),
        defaultSlotId: DEFAULT_SLOT_ID,
        items,
      });
    },

    async readWorkspace(query = {}, { requestContext = null } = {}) {
      assertNoRawCandidatePayload(query);
      const record = await resolvePromotedRecord(query);
      const manifest = record.manifest;
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const requestedNotionalUsd = resolveRequestedNotionalUsd(
        getRequestedNotionalUsd(query),
        manifest.walletRequirements.minFundingUsd,
      );
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd,
        walletState: getWalletState(query),
      });
      const ownerUserId = requestContext?.owner?.userId ?? null;
      const [runtimeActivity, slotRuntime] = await Promise.all([
        loadManifestActivity(manifest.manifestId, 200, ownerUserId),
        loadSlotRuntime(manifest, ownerUserId),
      ]);
      const rebalanceBoundaryPayload =
        getWalletState(query) === undefined && slotRuntime.latestActivation
          ? deriveBoundaryPayload({
              manifest,
              liveXStocksState,
              liveRouteState,
              requestedNotionalUsd:
                slotRuntime.latestActivation.requestedNotionalUsd ??
                boundaryPayload.requestedNotionalUsd,
              walletState: slotRuntime.latestActivation.walletState,
            })
          : boundaryPayload;
      const rebalanceOrchestration = buildRebalanceOrchestration({
        manifest,
        boundaryPayload: rebalanceBoundaryPayload,
        latestActivation: slotRuntime.latestActivation,
        latestRebalance: slotRuntime.latestRebalance,
      });
      const summaryActivations = slotRuntime.latestActivation
        ? [slotRuntime.latestActivation]
        : runtimeActivity.activations;

      return parseApiResponse("workspace_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        slot: record.slot,
        manifest: buildManifestView(manifest),
        workspace: {
          requestedNotionalUsd: boundaryPayload.requestedNotionalUsd,
          fundingAssetSymbol: manifest.activationTemplate.fundingAssetSymbol,
          targetAllocations: buildAllocationTargetPreviewRows({
            manifest,
            requestedNotionalUsd: boundaryPayload.requestedNotionalUsd,
            liveXStocksState,
          }),
          targetDirectionalExpression: manifest.targetDirectionalExpression ?? null,
          cashOrYieldBufferTarget:
            boundaryPayload.recommendation.portfolioMode === "basket"
              ? boundaryPayload.recommendation.cashOrYieldBufferTarget
              : null,
          recommendation: boundaryPayload.recommendation,
          executionPlanPreview: buildExecutionPlanPreview(
            boundaryPayload.executionPlan,
          ),
          liveState: buildLiveStateView({
            liveXStocksState,
            liveRouteState,
          }),
          rebalanceOrchestration,
          activitySummary: buildActivitySummary({
            items: runtimeActivity.items,
            activations: summaryActivations,
            executionPlan: boundaryPayload.executionPlan,
            rebalanceOrchestration,
          }),
        },
      });
    },

    async getActivationPreview(query = {}, { requestContext = null } = {}) {
      assertNoRawCandidatePayload(query);
      const record = await resolvePromotedRecord(query);
      const manifest = record.manifest;
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const requestedNotionalUsd = resolveRequestedNotionalUsd(
        getRequestedNotionalUsd(query),
        manifest.walletRequirements.minFundingUsd,
      );
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd,
        walletState: getWalletState(query),
      });
      const ownerUserId = requestContext?.owner?.userId ?? null;
      const slotRuntime = await loadSlotRuntime(manifest, ownerUserId);
      const rebalanceBoundaryPayload =
        getWalletState(query) === undefined && slotRuntime.latestActivation
          ? deriveBoundaryPayload({
              manifest,
              liveXStocksState,
              liveRouteState,
              requestedNotionalUsd:
                slotRuntime.latestActivation.requestedNotionalUsd ??
                boundaryPayload.requestedNotionalUsd,
              walletState: slotRuntime.latestActivation.walletState,
            })
          : boundaryPayload;
      const rebalanceOrchestration = buildRebalanceOrchestration({
        manifest,
        boundaryPayload: rebalanceBoundaryPayload,
        latestActivation: slotRuntime.latestActivation,
        latestRebalance: slotRuntime.latestRebalance,
      });
      const latestActivation =
        (
          await runtimeStore.listActivations({
            manifestId: manifest.manifestId,
            ownerUserId,
          })
        )
          .map(serializeActivation)[0] ?? null;

      return parseApiResponse("activation_preview_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        slot: record.slot,
        manifest: buildManifestView(manifest),
        requestedNotionalUsd: boundaryPayload.requestedNotionalUsd,
        recommendation: boundaryPayload.recommendation,
        executionPlan: boundaryPayload.executionPlan,
        liveState: buildLiveStateView({
          liveXStocksState,
          liveRouteState,
        }),
        rebalanceOrchestration,
        latestActivation,
      });
    },

    async getPublicAgentHandoff(query = {}) {
      assertNoRawCandidatePayload(query);
      const record = await resolvePromotedRecord(query);
      const manifest = record.manifest;
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const requestedNotionalUsd = resolveRequestedNotionalUsd(
        getRequestedNotionalUsd(query),
        manifest.walletRequirements.minFundingUsd,
      );
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd,
        walletState: getWalletState(query),
      });

      return parseApiResponse("public_agent_handoff_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        slot: record.slot,
        manifestRef: boundaryPayload.manifestRef,
        publicSurface: buildPublicAgentSurface(),
        readiness: {
          requestedNotionalUsd: boundaryPayload.requestedNotionalUsd,
          executionPlanPreview: buildExecutionPlanPreview(
            boundaryPayload.executionPlan,
          ),
        },
        handoff: derivePublicAgentHandoffBoundary(
          boundaryPayload.executionPlan,
        ),
      });
    },

    async preflightManifest(body = {}) {
      assertNoRawCandidatePayload(body);
      const manifest = await resolveManifest(body);
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);

      return deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd: getRequestedNotionalUsd(body),
        walletState: getWalletState(body),
      });
    },

    async saveActivation(body = {}, { requestContext = null } = {}) {
      const authenticatedRequestContext =
        requireAuthenticatedRequestContext(requestContext);
      assertNoRawCandidatePayload(body);
      const requestedSubjectId = getOptionalSubjectId(body);
      const manifest = await resolveManifest(body);
      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd: getRequestedNotionalUsd(body),
        walletState: getWalletState(body),
      });
      ensureWalletStateMatchesAuthenticatedUser({
        walletState: boundaryPayload.walletState,
        requestContext: authenticatedRequestContext,
      });
      const { subjectId } = await resolveFunnelSubject(requestedSubjectId, {
        required: false,
      });

      const activation = {
        activationId: `act_${randomUUID()}`,
        owner: authenticatedRequestContext.owner,
        chain: manifest.chain,
        manifestId: manifest.manifestId,
        slotId: manifest.slotId,
        recommendationId: boundaryPayload.recommendation.recommendationId,
        activationManifestRef: boundaryPayload.manifestRef,
        requestedNotionalUsd: boundaryPayload.requestedNotionalUsd,
        surfaceTruth: boundaryPayload.executionPlan.surfaceTruth,
        status: boundaryPayload.executionPlan.executionState,
        createdAt: now(),
        updatedAt: now(),
        walletState: boundaryPayload.walletState,
        routeTruthLabels: boundaryPayload.executionPlan.routeTruthLabels,
        executionPlanSnapshot: boundaryPayload.executionPlan,
      };

      const activityEvents = buildActivityEvents({
        activation,
        executionPlan: boundaryPayload.executionPlan,
        now,
      });

      await runtimeStore.appendActivation({
        activation,
        activityEvents,
      });

      if (boundaryPayload.executionPlan.executionState === "funding_required") {
        await persistFunnelEvents([
          createFunnelEvent({
            stage: "activation_saved_funding_blocked",
            subjectId,
            activationId: activation.activationId,
            owner: activation.owner,
            walletAddress: activation.walletState?.walletAddress ?? null,
            manifest,
            recommendationId: activation.recommendationId,
            source: "api",
            verificationMethod: "activation_save_snapshot",
          }),
        ]);
      }

      return {
        activation,
        activityEvents,
        executionPlan: boundaryPayload.executionPlan,
      };
    },

    async writeExecution(body = {}, { requestContext = null } = {}) {
      const authenticatedRequestContext =
        requireAuthenticatedRequestContext(requestContext);
      const action = String(body.action ?? "create");

      if (!EXECUTION_ACTIONS.has(action)) {
        throw new HttpError(
          400,
          `execution action must be one of: ${[...EXECUTION_ACTIONS].join(", ")}.`,
        );
      }

      if (action === "create") {
        const activationId = firstDefined(body.activationId, body.activation_id);
        const routeSelection = resolveManualExecutionRouteSelection({
          requestedRouteId: firstDefined(
            body.executionRouteId,
            body.execution_route_id,
          ),
          requestedAdapterId: firstDefined(
            body.executionAdapterId,
            body.execution_adapter_id,
            body.adapterId,
            body.adapter_id,
          ),
        });

        if (!activationId) {
          throw new HttpError(
            400,
            "activationId is required to create an operator-manual execution request.",
          );
        }

        const activation = await loadActivationById(
          activationId,
          authenticatedRequestContext,
        );
        const record = await manifestRepository.getPromotedRecordById(
          activation.manifestId,
        );

        if (!record) {
          throw new HttpError(
            404,
            `Promoted manifest ${activation.manifestId} was not found.`,
          );
        }

        const fetchedAssets = await liveStateRepository.fetchRequiredAssets(
          record.manifest.requiredAssets,
        );
        const executionRequest = createExecutionRequest({
          activation,
          manifest: record.manifest,
          fetchedAssets,
          now,
          routeSelection,
        });
        const persisted = await persistExecutionRequest({
          executionRequest,
          activation,
        });

        return parseApiResponse("execution_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          action,
          ...persisted,
        });
      }

      if (action === "execute_all") {
        const activationId = firstDefined(body.activationId, body.activation_id);
        const rebalanceId = firstDefined(body.rebalanceId, body.rebalance_id);

        if (!activationId) {
          throw new HttpError(
            400,
            "activationId is required to stage provider-backed execute_all execution.",
          );
        }

        const activation = await loadActivationById(
          activationId,
          authenticatedRequestContext,
        );
        const rebalance = await loadRebalanceForExecuteAll({
          activation,
          rebalanceId,
        });
        const providerReceipt = await loadAcceptedProviderReceiptForRebalance(
          rebalance,
        );

        ensureExecuteAllStagingProof({
          activation,
          requestContext: authenticatedRequestContext,
        });

        const existingExecutionRequest = rebalance.executionRequestId
          ? await runtimeStore.getExecutionRequest({
            executionRequestId: rebalance.executionRequestId,
            ownerUserId: authenticatedRequestContext.owner.userId,
          })
          : null;

        if (existingExecutionRequest) {
          const persisted = await persistProviderExecutionHandoff({
            executionRequest: existingExecutionRequest,
            activation,
            rebalance,
            providerReceipt,
          });

          return parseApiResponse("execution_write", {
            version: DEFAULT_RESPONSE_VERSION,
            generatedAt: now(),
            action,
            executionRequest: persisted.executionRequest,
            activityEvents: persisted.activityEvents,
          });
        }

        const record = await manifestRepository.getPromotedRecordById(
          rebalance.targetManifestId,
        );

        if (!record) {
          throw new HttpError(
            404,
            `Promoted manifest ${rebalance.targetManifestId} was not found.`,
          );
        }

        const fetchedAssets = await liveStateRepository.fetchRequiredAssets(
          record.manifest.requiredAssets,
        );
        const executionRequest = createExecutionRequest({
          activation,
          manifest: record.manifest,
          fetchedAssets,
          now,
          runtimeOwner: "operator_manual",
          triggerSource: "provider_staging",
          rebalance,
          providerReceipt,
          executionPlanSnapshot: {
            executionState: rebalance.executionState,
            executionEligibility: rebalance.executionEligibility,
          },
        });
        const persisted = await persistProviderExecutionHandoff({
          executionRequest,
          activation,
          rebalance,
          providerReceipt,
        });

        return parseApiResponse("execution_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          action,
          executionRequest: persisted.executionRequest,
          activityEvents: persisted.activityEvents,
        });
      }

      const executionRequestId = firstDefined(
        body.executionRequestId,
        body.execution_request_id,
      );

      if (!executionRequestId) {
        throw new HttpError(
          400,
          "executionRequestId is required for execution updates.",
        );
      }

      const executionRequest = await loadExecutionRequestById(
        executionRequestId,
        authenticatedRequestContext,
      );
      const activation = await loadActivationById(
        executionRequest.activationId,
        authenticatedRequestContext,
      );
      const legId = firstDefined(body.legId, body.leg_id);

      if (action === "quote_leg") {
        if (!legId) {
          throw new HttpError(
            400,
            "legId is required to request a live venue quote.",
          );
        }

        const leg = executionRequest.legs.find((item) => item.legId === legId);

        if (!leg) {
          throw new HttpError(
            404,
            `Execution leg ${legId} was not found on ${executionRequestId}.`,
          );
        }

        if (leg.state === "deferred") {
          throw new HttpError(
            409,
            "This execution leg is intentionally deferred and is not quote-capable in the first operator-manual lane.",
          );
        }

        const remainingLegBlockers = stripExecutionQuoteBlockers(leg.blockers);
        if (remainingLegBlockers.length > 0) {
          throw new HttpError(409, remainingLegBlockers[0], {
            blockers: remainingLegBlockers,
          });
        }

        const nextLegBase = {
          ...leg,
          blockers: stripExecutionQuoteBlockers(leg.blockers),
        };
        const nextRequestBase = {
          ...executionRequest,
          blockers: stripExecutionQuoteBlockers(executionRequest.blockers),
        };
        const routeSelection = resolveManualExecutionRouteSelectionFromLeg(
          leg,
          executionRequest,
        );
        const signerAddress = resolveExecutionSignerAddress(activation.walletState);
        const fetchedAsset =
          leg.assetSymbol && typeof liveStateRepository.fetchAssetSnapshot === "function"
            ? await liveStateRepository.fetchAssetSnapshot(leg.assetSymbol)
            : null;
        const deployment = findEthereumDeployment(fetchedAsset);
        const fundingStablecoin = findFundingStablecoin(
          deployment,
          leg.paymentAssetSymbol,
        );
        const cowReceivingToken = resolveCowReceivingToken(deployment);
        const oneInchReceivingToken = resolveOneInchReceivingToken(deployment);
        const quoteCandidates = [];
        const quoteFailures = [];
        const quoteAttempts = {};

        if (routeSelection.allowCow && cowExecutionClient) {
          if (
            fundingStablecoin?.address &&
            signerAddress &&
            executionRequest.settlementAddress &&
            cowReceivingToken.address
          ) {
            const quoteAttempt = buildCowQuoteAttemptContext({
              leg: {
                ...leg,
                paymentTokenAddress: fundingStablecoin.address,
                paymentTokenDecimals:
                  fundingStablecoin.decimals ?? leg.paymentTokenDecimals,
                receivingTokenAddress: cowReceivingToken.address,
              },
              signerAddress,
              settlementAddress: executionRequest.settlementAddress,
            });

            try {
              const quote = await cowExecutionClient.requestQuote(quoteAttempt);
              const storedQuote = toStoredExecutionQuote(quote, now());
              quoteAttempts[COW_SWAP_EXECUTION_ADAPTER_ID] = {
                status: "quoted",
                venueId: COW_SWAP_EXECUTION_ROUTE_ID,
                submissionSupported: true,
                quoteId: storedQuote.quoteId,
                buyAmount: storedQuote.order.buyAmount,
                sellAmount: storedQuote.order.sellAmount,
                ...quoteAttempt,
              };
              quoteCandidates.push({
                adapterId: COW_SWAP_EXECUTION_ADAPTER_ID,
                venueId: COW_SWAP_EXECUTION_ROUTE_ID,
                receivingTokenAddress: cowReceivingToken.address,
                storedQuote,
                approval: createApprovalFromCowQuote(storedQuote),
                state: "awaiting_approval",
                outputAmount: storedQuote.order.buyAmount,
                submissionSupported: true,
                warnings: [],
              });
            } catch (error) {
              const quoteFailure = normalizeCowQuoteFailure(error);
              const failureMessage = buildCowQuoteFailureMessage({
                leg,
                quoteAttempt,
                quoteFailure,
              });
              quoteFailures.push(failureMessage);
              quoteAttempts[COW_SWAP_EXECUTION_ADAPTER_ID] = {
                status: "failed",
                venueId: COW_SWAP_EXECUTION_ROUTE_ID,
                ...quoteAttempt,
                error: quoteFailure.message,
                errorStatusCode: quoteFailure.statusCode,
                errorType: quoteFailure.errorType,
                errorDescription: quoteFailure.errorDescription,
                errorBody: quoteFailure.rawBody,
                blockerClass: quoteFailure.blockerClass,
              };
            }
          } else {
            quoteAttempts[COW_SWAP_EXECUTION_ADAPTER_ID] = {
              status: "skipped",
              venueId: COW_SWAP_EXECUTION_ROUTE_ID,
              reason:
                !fundingStablecoin?.address
                  ? `${leg.assetSymbol} is missing an Ethereum ${leg.paymentAssetSymbol} payment token for CoW.`
                  : !signerAddress
                    ? "A verified signer wallet is required before CoW can quote this leg."
                    : !executionRequest.settlementAddress
                      ? "A settlement destination is required before CoW can quote this leg."
                      : `Ethereum CoW buy-token metadata is missing for ${leg.assetSymbol}.`,
            };
          }
        } else {
          quoteAttempts[COW_SWAP_EXECUTION_ADAPTER_ID] = {
            status: "skipped",
            venueId: COW_SWAP_EXECUTION_ROUTE_ID,
            reason: routeSelection.allowCow
              ? "CoW client is not configured for this runtime."
              : `Execution request is pinned to ${routeSelection.label}.`,
          };
        }

        if (routeSelection.allowOneInch && oneInchExecutionClient) {
          if (fundingStablecoin?.address && signerAddress && oneInchReceivingToken.address) {
            const quoteAttempt = buildOneInchQuoteAttemptContext({
              leg: {
                ...leg,
                paymentTokenAddress: fundingStablecoin.address,
                paymentTokenDecimals:
                  fundingStablecoin.decimals ?? leg.paymentTokenDecimals,
              },
              signerAddress,
              receivingTokenAddress: oneInchReceivingToken.address,
            });

            try {
              const preparedOrder = await oneInchExecutionClient.prepareOrder({
                ...quoteAttempt,
                receiver:
                  executionRequest.settlementAddress ?? quoteAttempt.walletAddress,
              });
              const storedQuote = toStoredOneInchExecutionQuote(
                {
                  ...preparedOrder.quote,
                  orderHash: preparedOrder.orderHash,
                  signerAddress: preparedOrder.signerAddress,
                  receiver: preparedOrder.receiver,
                },
                quoteAttempt,
                now(),
              );
              quoteAttempts[ONEINCH_EXECUTION_ADAPTER_ID] = {
                status: "quoted",
                venueId: ONEINCH_EXECUTION_ROUTE_ID,
                submissionSupported: true,
                quoteId: storedQuote.quoteId,
                orderHash: preparedOrder.orderHash,
                buyAmount: storedQuote.toTokenAmount,
                sellAmount: storedQuote.fromTokenAmount,
                recommendedPreset: storedQuote.recommendedPreset,
                settlementAddress: storedQuote.settlementAddress,
                ...quoteAttempt,
              };
              quoteCandidates.push({
                adapterId: ONEINCH_EXECUTION_ADAPTER_ID,
                venueId: ONEINCH_EXECUTION_ROUTE_ID,
                receivingTokenAddress: oneInchReceivingToken.address,
                storedQuote,
                approval: createApprovalFromQuote(storedQuote, preparedOrder),
                state: "awaiting_approval",
                outputAmount: storedQuote.toTokenAmount,
                submissionSupported: true,
                warnings: [],
              });
            } catch (error) {
              const quoteFailure = normalizeOneInchQuoteFailure(error);
              const failureMessage = buildOneInchQuoteFailureMessage({
                leg,
                quoteAttempt,
                quoteFailure,
              });
              quoteFailures.push(failureMessage);
              quoteAttempts[ONEINCH_EXECUTION_ADAPTER_ID] = {
                status: "failed",
                venueId: ONEINCH_EXECUTION_ROUTE_ID,
                ...quoteAttempt,
                error: quoteFailure.message,
                errorStatusCode: quoteFailure.statusCode,
                errorCode: quoteFailure.errorCode,
                errorDescription: quoteFailure.errorDescription,
                errorBody: quoteFailure.rawBody,
                blockerClass: quoteFailure.blockerClass,
              };
            }
          } else {
            quoteAttempts[ONEINCH_EXECUTION_ADAPTER_ID] = {
              status: "skipped",
              venueId: ONEINCH_EXECUTION_ROUTE_ID,
              reason:
                !fundingStablecoin?.address
                  ? `${leg.assetSymbol} is missing an Ethereum ${leg.paymentAssetSymbol} payment token for 1inch Fusion.`
                  : !signerAddress
                    ? "A verified signer wallet is required before 1inch Fusion can quote this leg."
                    : `Ethereum deployment.address metadata is missing for ${leg.assetSymbol}.`,
            };
          }
        } else {
          quoteAttempts[ONEINCH_EXECUTION_ADAPTER_ID] = {
            status: "skipped",
            venueId: ONEINCH_EXECUTION_ROUTE_ID,
            reason: routeSelection.allowOneInch
              ? "1inch Fusion client is not configured for this runtime."
              : `Execution request is pinned to ${routeSelection.label}.`,
          };
        }

        const selectedCandidate = selectVenueQuoteCandidate(quoteCandidates);

        if (!selectedCandidate) {
          const quoteSkipReasons = Object.values(quoteAttempts)
            .filter((attempt) => attempt?.status === "skipped" && attempt.reason)
            .map((attempt) => attempt.reason);
          const blockedLeg = {
            ...nextLegBase,
            state: "blocked",
            blockers: uniqueStrings([
              ...nextLegBase.blockers,
              ...quoteFailures,
              ...quoteSkipReasons,
            ]),
            venueStatus: {
              venueId: leg.venueId ?? OPERATOR_MANUAL_EXECUTION_ADAPTER_ID,
              venueOrderId: null,
              status: "quote_failed",
              settlementTxHash: null,
              lastCheckedAt: null,
              updatedAt: now(),
              rawStatus: buildQuoteFailureRawStatus(quoteAttempts),
            },
          };
          const persisted = await persistExecutionRequest({
            executionRequest: replaceExecutionLeg(nextRequestBase, blockedLeg),
            activation,
          });

          return parseApiResponse("execution_write", {
            version: DEFAULT_RESPONSE_VERSION,
            generatedAt: now(),
            action,
            ...persisted,
          });
        }

        const selectionReason =
          quoteCandidates.length === 1
            ? `${selectedCandidate.venueId} was the only venue that returned a live quote.`
            : selectedCandidate.submissionSupported
              ? `${selectedCandidate.venueId} was selected because it is currently the strongest submission-capable venue in the repo-owned manual lane.`
              : `${selectedCandidate.venueId} was selected because CoW did not return a live quote for this leg.`;
        const quotedLeg = {
          ...nextLegBase,
          state: selectedCandidate.state,
          venueId: selectedCandidate.venueId,
          adapterId: selectedCandidate.adapterId,
          requiredRouteId: selectedCandidate.venueId,
          paymentTokenAddress: fundingStablecoin?.address ?? leg.paymentTokenAddress,
          paymentTokenDecimals:
            fundingStablecoin?.decimals ?? leg.paymentTokenDecimals,
          receivingTokenAddress: selectedCandidate.receivingTokenAddress,
          quote: selectedCandidate.storedQuote,
          approval: selectedCandidate.approval,
          warnings: uniqueStrings([
            ...nextLegBase.warnings,
            ...selectedCandidate.warnings,
          ]),
          venueStatus: {
            venueId: selectedCandidate.venueId,
            venueOrderId: null,
            status: "quote_ready",
            settlementTxHash: null,
            lastCheckedAt: null,
            updatedAt: now(),
            rawStatus: {
              selectedVenueId: selectedCandidate.venueId,
              selectedAdapterId: selectedCandidate.adapterId,
              selectionReason,
              submissionSupported: selectedCandidate.submissionSupported,
              quoteAttempts,
            },
          },
        };
        const nextRequest = replaceExecutionLeg(nextRequestBase, quotedLeg);
        const persisted = await persistExecutionRequest({
          executionRequest: nextRequest,
          activation,
          activityEvents: buildExecutionActivityEvents({
            activation,
            executionRequest: updateExecutionRequestState(nextRequest),
            previousLeg: leg,
            leg: quotedLeg,
            now,
          }),
        });

        return parseApiResponse("execution_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          action,
          ...persisted,
        });
      }

      if (!legId) {
        throw new HttpError(
          400,
          "legId is required for submission and receipt actions.",
        );
      }

      const leg = executionRequest.legs.find((item) => item.legId === legId);

      if (!leg) {
        throw new HttpError(
          404,
          `Execution leg ${legId} was not found on ${executionRequestId}.`,
        );
      }

      const suppliedTxHashRaw = firstDefined(body.txHash, body.tx_hash);
      const suppliedTxHash = normalizeTxHash(suppliedTxHashRaw);

      if (suppliedTxHashRaw !== undefined && !suppliedTxHash) {
        throw new HttpError(
          400,
          "txHash must be a 0x-prefixed 32-byte transaction hash.",
        );
      }

      const routeSelection = resolveManualExecutionRouteSelectionFromLeg(
        leg,
        executionRequest,
      );

      if (action === "record_submission") {
        const signature = normalizeSignature(
          firstDefined(body.signature, body.orderSignature, body.order_signature),
        );
        const txHash = suppliedTxHash;

        if (!signature) {
          throw new HttpError(
            400,
            "signature must be a 65-byte 0x-prefixed EIP-712 signature.",
          );
        }

        if (!leg.quote || !leg.approval?.orderToSign) {
          throw new HttpError(
            409,
            "A live execution quote and approval payload must be captured before submission can be recorded.",
          );
        }

        if (
          !addressInVerifiedSet(
            leg.approval.signerAddress,
            uniqueStrings([
              ...authenticatedRequestContext.linkedWalletAddresses,
              ...authenticatedRequestContext.linkedEmbeddedWalletAddresses,
            ]),
          )
        ) {
          throw new HttpError(
            403,
            routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID
              ? "The 1inch Fusion signer address is not linked to the authenticated Privy user."
              : "The CoW signer address is not linked to the authenticated Privy user.",
          );
        }

        try {
          let venueOrderId;
          let submissionRawStatus = null;

          if (routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID) {
            if (!oneInchExecutionClient) {
              throw new HttpError(
                503,
                "1inch Fusion client is not configured for signed order submission.",
              );
            }

            const orderToSign = leg.approval.orderToSign ?? {};

            if (
              !orderToSign.order ||
              !orderToSign.quoteId ||
              !orderToSign.extension ||
              !orderToSign.orderHash
            ) {
              throw new HttpError(
                409,
                "A prepared 1inch Fusion order payload is required before signed submission can be recorded.",
              );
            }

            const submission = await oneInchExecutionClient.submitOrder({
              order: orderToSign.order,
              signature,
              quoteId: orderToSign.quoteId,
              extension: orderToSign.extension,
              orderHash: orderToSign.orderHash,
            });
            venueOrderId = normalizeTxHash(submission.orderHash);
            submissionRawStatus = submission.raw ?? null;

            if (!venueOrderId) {
              throw new Error("1inch Fusion returned an invalid order hash.");
            }
          } else {
            if (!cowExecutionClient) {
              throw new HttpError(
                503,
                "CoW client is not configured for signed order submission.",
              );
            }

            const rawVenueOrderId = await cowExecutionClient.submitOrder({
              ...leg.approval.orderToSign,
              signature,
            });
            venueOrderId = normalizeOrderUid(rawVenueOrderId);

            if (!venueOrderId) {
              throw new Error("CoW returned an invalid order uid.");
            }
          }

          let nextLeg = {
            ...leg,
            state: "submitted",
            approval: {
              ...leg.approval,
              status: "submitted",
              signature,
              approvedAt: leg.approval.approvedAt ?? now(),
              submittedAt: now(),
              venueOrderId,
            },
            venueStatus: {
              venueId: leg.venueId ?? routeSelection.requestAdapterId,
              venueOrderId,
              status: "submitted",
              settlementTxHash: txHash,
              lastCheckedAt: null,
              updatedAt: now(),
              rawStatus: submissionRawStatus ?? leg.venueStatus?.rawStatus ?? null,
            },
            receipt: txHash
              ? {
                  txHash,
                  submittedAt: leg.receipt?.submittedAt ?? now(),
                  lastCheckedAt: null,
                  receiptStatus: "pending",
                  confirmedAt: null,
                  revertedAt: null,
                  blockNumber: null,
                  transactionIndex: null,
                  rpcUrl: ethereumRpcClient?.rpcUrl ?? null,
                  rawReceipt: null,
                }
              : leg.receipt,
          };

          nextLeg = await refreshVenueStatusForLeg(nextLeg, executionRequest);
          nextLeg = await refreshReceiptForLeg(nextLeg);
          const nextRequest = replaceExecutionLeg(executionRequest, nextLeg);
          const persisted = await persistExecutionRequest({
            executionRequest: nextRequest,
            activation,
            activityEvents: buildExecutionActivityEvents({
              activation,
              executionRequest: updateExecutionRequestState(nextRequest),
              previousLeg: leg,
              leg: nextLeg,
              now,
            }),
          });

          return parseApiResponse("execution_write", {
            version: DEFAULT_RESPONSE_VERSION,
            generatedAt: now(),
            action,
            ...persisted,
          });
        } catch (error) {
          const blockedLeg = {
            ...leg,
            state: "blocked",
            approval: leg.approval
              ? {
                  ...leg.approval,
                  status: "failed",
                }
              : null,
            blockers: uniqueStrings([
              ...leg.blockers,
              `${
                routeSelection.requestAdapterId === ONEINCH_EXECUTION_ADAPTER_ID
                  ? "1inch Fusion"
                  : "CoW"
              } order submission failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ]),
          };
          const nextRequest = replaceExecutionLeg(executionRequest, blockedLeg);
          const persisted = await persistExecutionRequest({
            executionRequest: nextRequest,
            activation,
            activityEvents: buildExecutionActivityEvents({
              activation,
              executionRequest: updateExecutionRequestState(nextRequest),
              previousLeg: leg,
              leg: blockedLeg,
              now,
            }),
          });

          return parseApiResponse("execution_write", {
            version: DEFAULT_RESPONSE_VERSION,
            generatedAt: now(),
            action,
            ...persisted,
          });
        }
      }

      let refreshedLeg =
        suppliedTxHash
          ? {
              ...leg,
              receipt: {
                txHash: suppliedTxHash,
                submittedAt: leg.receipt?.submittedAt ?? now(),
                lastCheckedAt: null,
                receiptStatus: leg.receipt?.receiptStatus ?? "pending",
                confirmedAt: leg.receipt?.confirmedAt ?? null,
                revertedAt: leg.receipt?.revertedAt ?? null,
                blockNumber: leg.receipt?.blockNumber ?? null,
                transactionIndex: leg.receipt?.transactionIndex ?? null,
                rpcUrl: ethereumRpcClient?.rpcUrl ?? leg.receipt?.rpcUrl ?? null,
                rawReceipt: leg.receipt?.rawReceipt ?? null,
              },
              venueStatus: {
                ...(leg.venueStatus ?? {
                  venueId: leg.venueId ?? routeSelection.requestAdapterId,
                  venueOrderId: leg.approval?.venueOrderId ?? null,
                  status: "submitted",
                }),
                settlementTxHash: suppliedTxHash,
                lastCheckedAt: null,
                updatedAt: now(),
                rawStatus: leg.venueStatus?.rawStatus ?? null,
              },
            }
          : leg;

      refreshedLeg = await refreshVenueStatusForLeg(
        refreshedLeg,
        executionRequest,
      );

      if (!refreshedLeg.receipt?.txHash) {
        const nextLeg = {
          ...refreshedLeg,
          warnings: uniqueStrings([
            ...refreshedLeg.warnings,
            `Settlement transaction hash is not available yet; ${routeSelection.label} order remains submitted.`,
          ]),
        };
        const nextRequest = replaceExecutionLeg(executionRequest, nextLeg);
        const persisted = await persistExecutionRequest({
          executionRequest: nextRequest,
          activation,
          activityEvents: buildExecutionActivityEvents({
            activation,
            executionRequest: updateExecutionRequestState(nextRequest),
            previousLeg: leg,
            leg: nextLeg,
            now,
          }),
        });

        return parseApiResponse("execution_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          action,
          ...persisted,
        });
      }

      refreshedLeg = await refreshReceiptForLeg(refreshedLeg);
      const nextRequest = replaceExecutionLeg(executionRequest, refreshedLeg);
      const persisted = await persistExecutionRequest({
        executionRequest: nextRequest,
        activation,
        activityEvents: buildExecutionActivityEvents({
          activation,
          executionRequest: updateExecutionRequestState(nextRequest),
          previousLeg: leg,
          leg: refreshedLeg,
          now,
        }),
      });

      return parseApiResponse("execution_write", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        action,
        ...persisted,
      });
    },

    async readExecutions(query = {}, { requestContext = null } = {}) {
      const authenticatedRequestContext =
        requireAuthenticatedRequestContext(requestContext);
      const limit = Math.max(1, Math.min(Number(query.limit ?? 50), 200));
      const executionRequestId = firstDefined(
        query.executionRequestId,
        query.execution_request_id,
      );
      const activationId = firstDefined(query.activationId, query.activation_id);
      const manifestId = firstDefined(query.manifestId, query.manifest_id);
      const slotId = firstDefined(query.slotId, query.slot_id);
      const items = await runtimeStore.listExecutionRequests({
        executionRequestId,
        activationId,
        manifestId,
        slotId,
        ownerUserId: authenticatedRequestContext.owner.userId,
        limit,
      });

      return parseApiResponse("execution_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        limit,
        items,
      });
    },

    async readAutoresearchRuntime(query = {}) {
      const limit = Math.max(1, Math.min(Number(query.limit ?? 10), 50));
      const [runtime, runs] = await Promise.all([
        runtimeStore.getAutoresearchRuntime(),
        runtimeStore.listAutoresearchRuns({ limit }),
      ]);

      return parseApiResponse("autoresearch_runtime_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        limit,
        runtime,
        runs,
      });
    },

    async recordAutoresearchRuntimeReceipt(body = {}) {
      let request;

      try {
        request = AUTORESEARCH_RUNTIME_RECEIPT_REQUEST_SCHEMA.parse(body);
      } catch (error) {
        throw new HttpError(
          400,
          error instanceof Error
            ? error.message
            : "Invalid autoresearch runtime receipt payload.",
        );
      }

      const persisted = await runtimeStore.recordAutoresearchHostReceipt({
        runtime: request.runtime,
        run: request.run,
      });

      return parseApiResponse("autoresearch_runtime_receipt_write", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        runtime: persisted.runtime,
        run: persisted.run,
      });
    },

    async recordProviderTriggeredRebalanceReview(
      body = {},
      { request = null } = {},
    ) {
      let validation;

      try {
        validation = await authenticateChainlinkCreProviderEvent({
          request,
          requestBody: body,
          signerAllowlist: chainlinkCreSignerAllowlist,
          workflowAllowlist: chainlinkCreWorkflowAllowlist,
          now,
        });
      } catch (error) {
        if (error instanceof ChainlinkCreValidationError) {
          if (error.receiptCandidate) {
            await persistProviderEventReceipt({
              receiptCandidate: error.receiptCandidate,
              decision: "rejected",
              reason: error.message,
              errorCode: error.errorCode,
            });
          }

          throw new HttpError(error.statusCode, error.message, {
            errorCode: error.errorCode,
            ...(error.details ? { validation: error.details } : {}),
          });
        }

        throw error;
      }

      const duplicateByJti = await runtimeStore.getProviderEventReceiptByJti({
        jti: validation.claims.jti,
      });

      if (duplicateByJti) {
        const duplicateReceipt = await persistProviderEventReceipt({
          validation,
          decision: "duplicate",
          reason: `Chainlink CRE jti ${validation.claims.jti} was already processed.`,
          errorCode: "duplicate_jti",
          duplicateOfReceiptId: duplicateByJti.receiptId,
        });

        return parseApiResponse("provider_triggered_rebalance_review_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          receipt: duplicateReceipt,
          rebalanceOrchestration:
            duplicateByJti.decision === "accepted"
              ? serializeRebalance(
                  await runtimeStore.getLatestRebalance({
                    slotId: validation.body.slotId,
                  }),
                )
              : null,
        });
      }

      const duplicateByDedupeKey =
        await runtimeStore.getAcceptedProviderEventReceiptByDedupeKey({
          dedupeKey: validation.dedupeKey,
        });

      if (duplicateByDedupeKey) {
        const duplicateReceipt = await persistProviderEventReceipt({
          validation,
          decision: "duplicate",
          reason:
            `Chainlink CRE dedupe key ${validation.dedupeKey} was already accepted.`,
          errorCode: "duplicate_dedupe_key",
          duplicateOfReceiptId: duplicateByDedupeKey.receiptId,
        });

        return parseApiResponse("provider_triggered_rebalance_review_write", {
          version: DEFAULT_RESPONSE_VERSION,
          generatedAt: now(),
          receipt: duplicateReceipt,
          rebalanceOrchestration: serializeRebalance(
            await runtimeStore.getLatestRebalance({
              slotId: validation.body.slotId,
            }),
          ),
        });
      }

      let record = null;

      try {
        record = await manifestRepository.getPromotedRecordBySlot(
          validation.body.slotId,
        );
      } catch {
        record = null;
      }

      if (!record) {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "unknown_promoted_slot",
          message:
            `No promoted manifest was found for slot ${validation.body.slotId}.`,
        });
      }

      if (record.manifest.manifestId !== validation.body.targetManifestId) {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "manifest_scope_mismatch",
          message:
            `Provider event target manifest ${validation.body.targetManifestId} does not match the current promoted manifest ${record.manifest.manifestId}.`,
        });
      }

      if (record.manifest.chain !== validation.body.chain) {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "chain_scope_mismatch",
          message:
            `Provider event chain ${validation.body.chain} does not match the promoted manifest chain ${record.manifest.chain}.`,
        });
      }

      const manifest = record.manifest;
      const slotRuntime = await loadGlobalSlotRuntime(manifest);

      if (!slotRuntime.latestActivation) {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "missing_activation_baseline",
          message:
            `Slot ${manifest.slotId} has no live activation baseline, so provider-triggered review stays preview-only.`,
        });
      }

      if (slotRuntime.latestRebalance?.state === "paused") {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "operator_paused",
          message:
            `Slot ${manifest.slotId} is paused, so provider-triggered review cannot reopen execution handling.`,
        });
      }

      if (slotRuntime.latestRebalance?.state === "executing") {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: "rebalance_already_executing",
          message:
            `Slot ${manifest.slotId} is already executing, so provider-triggered review cannot open another review.`,
        });
      }

      const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
      const boundaryPayload = deriveBoundaryPayload({
        manifest,
        liveXStocksState,
        liveRouteState,
        requestedNotionalUsd:
          slotRuntime.latestActivation.requestedNotionalUsd ??
          manifest.walletRequirements.minFundingUsd,
        walletState: slotRuntime.latestActivation.walletState ?? {},
      });
      const rebalanceOrchestration = buildRebalanceOrchestration({
        manifest,
        boundaryPayload,
        latestActivation: slotRuntime.latestActivation,
        latestRebalance: slotRuntime.latestRebalance,
        triggerSource: "provider_triggered",
        providerTriggeredProven: true,
        resume: true,
      });

      if (rebalanceOrchestration.state !== "awaiting_operator") {
        await rejectProviderTriggeredReview({
          validation,
          statusCode: 409,
          errorCode: `rebalance_state_${rebalanceOrchestration.state}`,
          message:
            `Provider-triggered review may only open awaiting_operator, but local runtime truth resolved to ${rebalanceOrchestration.state}.`,
        });
      }

      const persistedRebalance = await runtimeStore.upsertRebalance({
        rebalance: rebalanceOrchestration,
        eventType: "provider_triggered_review",
      });
      const receipt = await persistProviderEventReceipt({
        validation,
        decision: "accepted",
        reason:
          "Validated Chainlink CRE event opened operator review for the current promoted manifest.",
        rebalance: persistedRebalance,
      });

      return parseApiResponse("provider_triggered_rebalance_review_write", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        receipt,
        rebalanceOrchestration: serializeRebalance(persistedRebalance),
      });
    },

    async readXStocksReporting(query = {}, { reportingContext = null } = {}) {
      if (!reportingContext) {
        throw new HttpError(
          401,
          "Operator reporting access is required for this route.",
        );
      }

      const limit = Math.max(1, Math.min(Number(query.limit ?? 10), 50));
      const snapshot = await runtimeStore.readReportingSnapshot();
      const report = buildXStocksReportingSnapshot({
        snapshot,
        limit,
      });

      return parseApiResponse("xstocks_reporting_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        ...report,
      });
    },

    async readActivity(query = {}, { requestContext = null } = {}) {
      const authenticatedRequestContext =
        requireAuthenticatedRequestContext(requestContext);
      assertNoRawCandidatePayload(query);
      const limit = Math.max(1, Math.min(Number(query.limit ?? 50), 200));
      const activationId = firstDefined(query.activationId, query.activation_id);
      const selector = normalizeSelector(query);
      let record = null;
      let manifestId = firstDefined(query.manifestId, query.manifest_id);

      if (selector.manifestId || selector.slotId) {
        record = await resolvePromotedRecord(query);
        manifestId = record.manifest.manifestId;
      }

      const [rawItems, rawActivations] = await Promise.all([
        runtimeStore.listActivity({
          activationId,
          manifestId,
          ownerUserId: authenticatedRequestContext.owner.userId,
          limit,
        }),
        runtimeStore.listActivations({
          activationId,
          manifestId,
          ownerUserId: authenticatedRequestContext.owner.userId,
        }),
      ]);
      const items = rawItems.map(serializeActivityEvent);
      const activations = rawActivations.map(serializeActivation);

      if (!record && activations[0]?.manifestId) {
        record = await manifestRepository.getPromotedRecordById(
          activations[0].manifestId,
        );
      }

      let manifest = null;
      let slot = null;
      let activitySurface = null;
      let rebalanceOrchestration = null;
      let rebalanceHistory = [];

      if (record) {
        manifest = record.manifest;
        slot = record.slot;
        const { liveXStocksState, liveRouteState } = await loadLiveState(manifest);
        const slotRuntime = await loadSlotRuntime(
          manifest,
          authenticatedRequestContext.owner.userId,
        );
        const currentRequestedNotionalUsd =
          slotRuntime.latestActivation?.requestedNotionalUsd ??
          activations[0]?.requestedNotionalUsd ??
          manifest.walletRequirements.minFundingUsd;
        const executionPlan =
          activations[0]?.executionPlanSnapshot ??
          deriveBoundaryPayload({
            manifest,
            liveXStocksState,
            liveRouteState,
            requestedNotionalUsd: currentRequestedNotionalUsd,
            walletState:
              slotRuntime.latestActivation?.walletState ?? activations[0]?.walletState,
          }).executionPlan;
        const boundaryPayload = deriveBoundaryPayload({
          manifest,
          liveXStocksState,
          liveRouteState,
          requestedNotionalUsd: currentRequestedNotionalUsd,
          walletState:
            slotRuntime.latestActivation?.walletState ?? activations[0]?.walletState,
        });
        const surfaceActivations =
          activations.length > 0
            ? activations
            : slotRuntime.latestActivation
              ? [slotRuntime.latestActivation]
              : [];

        rebalanceOrchestration = buildRebalanceOrchestration({
          manifest,
          boundaryPayload,
          latestActivation: slotRuntime.latestActivation,
          latestRebalance: slotRuntime.latestRebalance,
        });
        rebalanceHistory = slotRuntime.rebalanceHistory;

        activitySurface = buildActivitySurface({
          manifest,
          liveXStocksState,
          items,
          activations: surfaceActivations,
          executionPlan,
          rebalanceOrchestration,
        });
      }

      return parseApiResponse("activity_read", {
        version: DEFAULT_RESPONSE_VERSION,
        generatedAt: now(),
        limit,
        manifest: manifest ? buildManifestView(manifest) : null,
        slot,
        items,
        activations,
        rebalanceOrchestration,
        rebalanceHistory,
        activitySurface,
      });
    },
  };
}
