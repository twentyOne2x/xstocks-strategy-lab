import { randomUUID } from "node:crypto";

import { readJsonFile, writeJsonFile } from "../json.js";

function createDefaultState(now) {
  return {
    schemaVersion: "2026-04-01.runtime-store.v6",
    meta: {
      createdAt: now(),
      updatedAt: now(),
    },
    activations: [],
    activityEvents: [],
    funnelEvents: [],
    rebalances: [],
    executionRequests: [],
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
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

function normalizeAuthenticatedOwner(owner) {
  if (!owner || typeof owner !== "object") {
    return null;
  }

  const normalizedOwner = {
    providerId: owner.providerId ?? owner.provider_id ?? "privy",
    appId: owner.appId ?? owner.app_id ?? null,
    userId: owner.userId ?? owner.user_id ?? null,
    sessionId: firstDefined(owner.sessionId, owner.session_id, null),
    issuer: owner.issuer ?? null,
    authenticatedAt:
      owner.authenticatedAt ?? owner.authenticated_at ?? null,
  };

  return normalizedOwner.appId &&
    normalizedOwner.userId &&
    normalizedOwner.issuer &&
    normalizedOwner.authenticatedAt
    ? normalizedOwner
    : null;
}

function normalizeActivation(activation) {
  if (!activation || typeof activation !== "object") {
    return activation;
  }

  return {
    ...activation,
    owner: normalizeAuthenticatedOwner(
      activation.owner ?? activation.authenticated_owner,
    ),
    activationId: activation.activationId ?? activation.activation_id,
    manifestId: activation.manifestId ?? activation.manifest_id,
    slotId: activation.slotId ?? activation.slot_id,
    recommendationId: activation.recommendationId ?? activation.recommendation_id,
    activationManifestRef:
      activation.activationManifestRef ?? activation.activation_manifest_ref,
    requestedNotionalUsd:
      activation.requestedNotionalUsd ?? activation.requested_notional_usd,
    surfaceTruth: activation.surfaceTruth ?? activation.surface_truth,
    createdAt: activation.createdAt ?? activation.created_at,
    updatedAt: activation.updatedAt ?? activation.updated_at,
    walletState: activation.walletState ?? activation.wallet_state,
    routeTruthLabels: activation.routeTruthLabels ?? activation.route_truth_labels,
    executionPlanSnapshot:
      activation.executionPlanSnapshot ?? activation.execution_plan_snapshot,
  };
}

function normalizeActivityEvent(event, index, now) {
  if (!event || typeof event !== "object") {
    return event;
  }

  return {
    ...event,
    version: event.version ?? "1",
    eventId: event.eventId ?? event.event_id ?? `legacy_evt_${index}`,
    scope:
      event.scope ??
      (event.activation_id
        ? {
            type: "activation",
            id: event.activation_id,
          }
        : null),
    occurredAt: event.occurredAt ?? event.created_at ?? now(),
    payload:
      event.payload ??
      {
        manifestId: event.manifestId ?? event.manifest_id ?? null,
        slotId: event.slotId ?? event.slot_id ?? null,
        status: event.status ?? null,
        details: event.details ?? null,
      },
  };
}

function normalizeFunnelEvent(event, index, now) {
  if (!event || typeof event !== "object") {
    return event;
  }

  const stage = event.stage ?? null;
  const subjectId = event.subjectId ?? event.subject_id ?? null;
  const manifestId = firstDefined(event.manifestId, event.manifest_id, null);
  const slotId = firstDefined(event.slotId, event.slot_id, null);
  const recommendationId = firstDefined(
    event.recommendationId,
    event.recommendation_id,
    null,
  );
  const owner = normalizeAuthenticatedOwner(
    event.owner ?? event.authenticated_owner,
  );
  const walletAddress = normalizeEthereumAddress(
    firstDefined(event.walletAddress, event.wallet_address, null),
  );

  return {
    version: event.version ?? "1",
    eventId: event.eventId ?? event.event_id ?? `funnel_evt_${index + 1}`,
    stage,
    occurredAt: event.occurredAt ?? event.occurred_at ?? now(),
    subjectId,
    owner,
    walletAddress,
    manifestId,
    slotId,
    recommendationId,
    source: event.source ?? "web",
    verificationMethod:
      event.verificationMethod ?? event.verification_method ?? "web_subject_known",
    dedupeKey:
      event.dedupeKey ??
      event.dedupe_key ??
      [stage, subjectId, manifestId ?? "none", recommendationId ?? "none"]
        .join(":"),
  };
}

function normalizeAutomationTruth(automationTruth = {}) {
  return {
    operatorManualRequired: Boolean(
      automationTruth.operatorManualRequired ??
        automationTruth.operator_manual_required ??
        true,
    ),
    autonomousExecutionProven: Boolean(
      automationTruth.autonomousExecutionProven ??
        automationTruth.autonomous_execution_proven ??
        false,
    ),
    providerTriggeredProven: Boolean(
      automationTruth.providerTriggeredProven ??
        automationTruth.provider_triggered_proven ??
        false,
    ),
    supportedTriggerSources: (
      automationTruth.supportedTriggerSources ??
      automationTruth.supported_trigger_sources ??
      ["operator_manual", "scheduled_cron"]
    ).map((value) => String(value)),
    notes: (automationTruth.notes ?? []).map((value) => String(value)),
  };
}

function normalizeRebalanceHistoryEntry(entry, index, now) {
  if (!entry || typeof entry !== "object") {
    return entry;
  }

  return {
    transitionId:
      entry.transitionId ?? entry.transition_id ?? `rebalance_hist_${index}`,
    eventType: entry.eventType ?? entry.event_type ?? "evaluation",
    fromState: firstDefined(entry.fromState, entry.from_state, null),
    toState:
      entry.toState ??
      entry.to_state ??
      entry.state ??
      "preview_only",
    triggerSource:
      entry.triggerSource ?? entry.trigger_source ?? "operator_manual",
    summary: entry.summary ?? "Rebalance state recorded.",
    rationale:
      entry.rationale ??
      entry.reason ??
      entry.summary ??
      "Rebalance state recorded.",
    scheduledFor: firstDefined(entry.scheduledFor, entry.scheduled_for, null),
    occurredAt: entry.occurredAt ?? entry.occurred_at ?? now(),
  };
}

function normalizeRebalance(rebalance, index, now) {
  if (!rebalance || typeof rebalance !== "object") {
    return rebalance;
  }

  const targetManifestId = firstDefined(
    rebalance.targetManifestId,
    rebalance.target_manifest_id,
    rebalance.manifestId,
    rebalance.manifest_id,
  );
  const baselineManifestId = firstDefined(
    rebalance.baselineManifestId,
    rebalance.baseline_manifest_id,
    null,
  );

  return {
    rebalanceId:
      rebalance.rebalanceId ??
      rebalance.rebalance_id ??
      `rebalance_${index}`,
    slotId: rebalance.slotId ?? rebalance.slot_id,
    chain: rebalance.chain ?? "ethereum",
    activationManifestRef:
      rebalance.activationManifestRef ?? rebalance.activation_manifest_ref,
    targetManifestId,
    baselineActivationId: firstDefined(
      rebalance.baselineActivationId,
      rebalance.baseline_activation_id,
      null,
    ),
    baselineManifestId,
    baselineManifestMatchesTarget: Boolean(
      firstDefined(
        rebalance.baselineManifestMatchesTarget,
        rebalance.baseline_manifest_matches_target,
        targetManifestId !== null && baselineManifestId === targetManifestId,
      ),
    ),
    state: rebalance.state ?? "preview_only",
    runtimeOwner:
      rebalance.runtimeOwner ?? rebalance.runtime_owner ?? "operator_manual",
    triggerSource:
      rebalance.triggerSource ?? rebalance.trigger_source ?? "operator_manual",
    summary: rebalance.summary ?? "Rebalance state recorded.",
    rationale:
      rebalance.rationale ??
      rebalance.reason ??
      rebalance.summary ??
      "Rebalance state recorded.",
    scheduledFor: firstDefined(
      rebalance.scheduledFor,
      rebalance.scheduled_for,
      null,
    ),
    allowedTransitions: (
      rebalance.allowedTransitions ??
      rebalance.allowed_transitions ??
      []
    ).map((value) => String(value)),
    recommendationState:
      rebalance.recommendationState ??
      rebalance.recommendation_state ??
      "monitor",
    executionState:
      rebalance.executionState ?? rebalance.execution_state ?? "blocked",
    executionEligibility:
      rebalance.executionEligibility ??
      rebalance.execution_eligibility ??
      "blocked",
    surfaceTruth:
      rebalance.surfaceTruth ?? rebalance.surface_truth ?? "blocked",
    blockers: (rebalance.blockers ?? []).map((value) => String(value)),
    warnings: (rebalance.warnings ?? []).map((value) => String(value)),
    automationTruth: normalizeAutomationTruth(
      rebalance.automationTruth ?? rebalance.automation_truth,
    ),
    nextAction: rebalance.nextAction ?? rebalance.next_action ?? null,
    createdAt: rebalance.createdAt ?? rebalance.created_at ?? now(),
    updatedAt: rebalance.updatedAt ?? rebalance.updated_at ?? now(),
    history: (
      rebalance.history ??
      rebalance.transitions ??
      []
    ).map((entry, historyIndex) =>
      normalizeRebalanceHistoryEntry(entry, historyIndex, now),
    ),
  };
}

function normalizeExecutionQuote(quote) {
  if (!quote || typeof quote !== "object") {
    return null;
  }

  if (
    quote.kind === "cow_swap" ||
    Object.hasOwn(quote, "order") ||
    Object.hasOwn(quote, "expiration")
  ) {
    return {
      kind: "cow_swap",
      quoteId: String(quote.quoteId ?? quote.quote_id ?? quote.id),
      quotedAt:
        quote.quotedAt ??
        quote.quoted_at ??
        quote.requestedAt ??
        quote.requested_at ??
        quote.createdAt,
      expiration: quote.expiration ?? quote.expiresAt ?? quote.expires_at,
      verified: Boolean(quote.verified ?? false),
      protocolFeeBps: firstDefined(
        quote.protocolFeeBps,
        quote.protocol_fee_bps,
        null,
      ),
      order: quote.order ?? {
        sellToken: quote.sellToken,
        buyToken: quote.buyToken,
        receiver: quote.receiver,
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
        validTo: quote.validTo,
        appData: quote.appData,
        feeAmount: quote.feeAmount,
        gasAmount: quote.gasAmount ?? null,
        gasPrice: quote.gasPrice ?? null,
        sellTokenPrice: quote.sellTokenPrice ?? null,
        kind: quote.orderKind ?? quote.kind ?? "sell",
        partiallyFillable: quote.partiallyFillable ?? false,
        sellTokenBalance: quote.sellTokenBalance ?? "erc20",
        buyTokenBalance: quote.buyTokenBalance ?? "erc20",
        signingScheme: quote.signingScheme ?? "eip712",
      },
      owner: quote.owner ?? quote.from ?? null,
    };
  }

  return {
    ...quote,
    quoteId: quote.quoteId ?? quote.quote_id ?? quote.id,
    requestedAt: quote.requestedAt ?? quote.requested_at ?? quote.createdAt,
    priceUsd: quote.priceUsd ?? quote.price_usd ?? quote.price,
    generalStatus: quote.generalStatus ?? quote.general_status,
    hedgingStatus: quote.hedgingStatus ?? quote.hedging_status,
    blockchainStatus: quote.blockchainStatus ?? quote.blockchain_status,
    tokenDeployment: quote.tokenDeployment ?? quote.token_deployment ?? null,
    signaturePayload:
      quote.signaturePayload ?? quote.signature_payload ?? null,
  };
}

function normalizeExecutionApproval(approval) {
  if (!approval || typeof approval !== "object") {
    return null;
  }

  return {
    approvalType:
      approval.approvalType ?? approval.approval_type ?? "eip712_signature",
    status: approval.status ?? "not_requested",
    signerAddress: approval.signerAddress ?? approval.signer_address,
    approvalTarget:
      approval.approvalTarget ?? approval.approval_target ?? "unknown",
    orderToSign: approval.orderToSign ?? approval.order_to_sign ?? null,
    signature: firstDefined(approval.signature, null),
    approvedAt: firstDefined(approval.approvedAt, approval.approved_at, null),
    submittedAt: firstDefined(
      approval.submittedAt,
      approval.submitted_at,
      null,
    ),
    venueOrderId: firstDefined(
      approval.venueOrderId,
      approval.venue_order_id,
      null,
    ),
    notes: (approval.notes ?? []).map((value) => String(value)),
  };
}

function normalizeExecutionReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return null;
  }

  return {
    ...receipt,
    txHash: receipt.txHash ?? receipt.tx_hash,
    submittedAt: receipt.submittedAt ?? receipt.submitted_at,
    lastCheckedAt: firstDefined(
      receipt.lastCheckedAt,
      receipt.last_checked_at,
      null,
    ),
    receiptStatus:
      receipt.receiptStatus ?? receipt.receipt_status ?? "not_submitted",
    confirmedAt: firstDefined(
      receipt.confirmedAt,
      receipt.confirmed_at,
      null,
    ),
    revertedAt: firstDefined(
      receipt.revertedAt,
      receipt.reverted_at,
      null,
    ),
    blockNumber: firstDefined(receipt.blockNumber, receipt.block_number, null),
    transactionIndex: firstDefined(
      receipt.transactionIndex,
      receipt.transaction_index,
      null,
    ),
    rpcUrl: firstDefined(receipt.rpcUrl, receipt.rpc_url, null),
    rawReceipt: firstDefined(receipt.rawReceipt, receipt.raw_receipt, null),
  };
}

function normalizeExecutionTradeStatus(status, index, now) {
  if (!status || typeof status !== "object") {
    return {
      event: `unknown_status_${index}`,
      timestamp: now(),
    };
  }

  return {
    event: status.event ?? status.type ?? `unknown_status_${index}`,
    timestamp: status.timestamp ?? status.createdAt ?? now(),
  };
}

function normalizeExecutionTrade(trade, now) {
  if (!trade || typeof trade !== "object") {
    return null;
  }

  return {
    tradeId: trade.tradeId ?? trade.trade_id ?? trade.id,
    status: trade.status ?? "unknown",
    settledAt: firstDefined(trade.settledAt, trade.settled_at, null),
    outTxHash: firstDefined(trade.outTxHash, trade.out_tx_hash, null),
    tradeStatuses: (trade.tradeStatuses ?? trade.trade_statuses ?? []).map(
      (status, index) => normalizeExecutionTradeStatus(status, index, now),
    ),
  };
}

function normalizeExecutionVenueStatus(status, now) {
  if (!status || typeof status !== "object") {
    return null;
  }

  return {
    venueId: status.venueId ?? status.venue_id ?? "unknown",
    venueOrderId: firstDefined(
      status.venueOrderId,
      status.venue_order_id,
      null,
    ),
    status: status.status ?? "submitted",
    settlementTxHash: firstDefined(
      status.settlementTxHash,
      status.settlement_tx_hash,
      null,
    ),
    lastCheckedAt: firstDefined(
      status.lastCheckedAt,
      status.last_checked_at,
      null,
    ),
    updatedAt: status.updatedAt ?? status.updated_at ?? now(),
    rawStatus: firstDefined(status.rawStatus, status.raw_status, null),
  };
}

function normalizeExecutionLeg(leg, index, now) {
  if (!leg || typeof leg !== "object") {
    return leg;
  }

  return {
    ...leg,
    legId: leg.legId ?? leg.leg_id ?? `exec_leg_${index + 1}`,
    requiredRouteId:
      leg.requiredRouteId ?? leg.required_route_id ?? leg.routeId ?? leg.route_id,
    targetWeightPct:
      leg.targetWeightPct ?? leg.target_weight_pct ?? leg.weightPct ?? 0,
    targetNotionalUsd:
      leg.targetNotionalUsd ??
      leg.target_notional_usd ??
      leg.notionalUsd ??
      0,
    paymentAssetSymbol:
      leg.paymentAssetSymbol ?? leg.payment_asset_symbol ?? "USDC",
    paymentTokenAddress: firstDefined(
      leg.paymentTokenAddress,
      leg.payment_token_address,
      null,
    ),
    paymentTokenDecimals: firstDefined(
      leg.paymentTokenDecimals,
      leg.payment_token_decimals,
      null,
    ),
    receivingTokenAddress: firstDefined(
      leg.receivingTokenAddress,
      leg.receiving_token_address,
      null,
    ),
    receivingTokenDecimals: firstDefined(
      leg.receivingTokenDecimals,
      leg.receiving_token_decimals,
      null,
    ),
    settlementAddress: firstDefined(
      leg.settlementAddress,
      leg.settlement_address,
      null,
    ),
    state: leg.state ?? "pending",
    blockers: (leg.blockers ?? []).map((value) => String(value)),
    warnings: (leg.warnings ?? []).map((value) => String(value)),
    quote: normalizeExecutionQuote(leg.quote),
    approval: normalizeExecutionApproval(leg.approval),
    venueStatus: normalizeExecutionVenueStatus(leg.venueStatus, now),
    receipt: normalizeExecutionReceipt(leg.receipt),
    trade: normalizeExecutionTrade(leg.trade, now),
  };
}

function normalizeExecutionRequest(request, index, now) {
  if (!request || typeof request !== "object") {
    return request;
  }

  return {
    version: request.version ?? "1",
    executionRequestId:
      request.executionRequestId ??
      request.execution_request_id ??
      `execution_request_${index + 1}`,
    owner: normalizeAuthenticatedOwner(
      request.owner ?? request.authenticated_owner,
    ),
    activationId: request.activationId ?? request.activation_id,
    manifestId: request.manifestId ?? request.manifest_id,
    slotId: request.slotId ?? request.slot_id,
    chain: request.chain ?? "ethereum",
    mode: request.mode ?? "basket",
    runtimeOwner: request.runtimeOwner ?? request.runtime_owner ?? "operator_manual",
    triggerSource:
      request.triggerSource ?? request.trigger_source ?? "operator_manual",
    adapterId: request.adapterId ?? request.adapter_id ?? "unknown",
    activationManifestRef:
      request.activationManifestRef ?? request.activation_manifest_ref,
    requestedNotionalUsd:
      request.requestedNotionalUsd ?? request.requested_notional_usd ?? 0,
    fundingAssetSymbol:
      request.fundingAssetSymbol ?? request.funding_asset_symbol ?? "USDC",
    settlementAddress: firstDefined(
      request.settlementAddress,
      request.settlement_address,
      null,
    ),
    state: request.state ?? "requested",
    blockers: (request.blockers ?? []).map((value) => String(value)),
    warnings: (request.warnings ?? []).map((value) => String(value)),
    legs: (request.legs ?? []).map((leg, legIndex) =>
      normalizeExecutionLeg(leg, legIndex, now),
    ),
    createdAt: request.createdAt ?? request.created_at ?? now(),
    updatedAt: request.updatedAt ?? request.updated_at ?? now(),
  };
}

function normalizeState(state, now) {
  const defaultState = createDefaultState(now);

  return {
    schemaVersion: state.schemaVersion ?? state.schema_version ?? defaultState.schemaVersion,
    meta: {
      createdAt:
        state.meta?.createdAt ?? state.meta?.created_at ?? defaultState.meta.createdAt,
      updatedAt:
        state.meta?.updatedAt ?? state.meta?.updated_at ?? defaultState.meta.updatedAt,
    },
    activations: (state.activations ?? []).map(normalizeActivation),
    activityEvents: (state.activityEvents ?? state.activity_events ?? []).map(
      (event, index) => normalizeActivityEvent(event, index, now),
    ),
    funnelEvents: (state.funnelEvents ?? state.funnel_events ?? []).map(
      (event, index) => normalizeFunnelEvent(event, index, now),
    ),
    rebalances: (state.rebalances ?? []).map((rebalance, index) =>
      normalizeRebalance(rebalance, index, now),
    ),
    executionRequests: (
      state.executionRequests ??
      state.execution_requests ??
      []
    ).map((request, index) => normalizeExecutionRequest(request, index, now)),
  };
}

function shouldAppendRebalanceHistory(existing, next) {
  if (!existing) {
    return true;
  }

  return (
    existing.state !== next.state ||
    existing.targetManifestId !== next.targetManifestId ||
    existing.baselineManifestId !== next.baselineManifestId ||
    existing.triggerSource !== next.triggerSource ||
    existing.scheduledFor !== next.scheduledFor ||
    existing.summary !== next.summary ||
    existing.rationale !== next.rationale
  );
}

export function createRuntimeStore({
  storePath,
  now = () => new Date().toISOString(),
}) {
  async function ensureStore() {
    try {
      await readJsonFile(storePath);
    } catch {
      await writeJsonFile(storePath, createDefaultState(now));
    }
  }

  async function readState() {
    await ensureStore();
    return normalizeState(await readJsonFile(storePath), now);
  }

  async function writeState(state) {
    const nextState = {
      ...state,
      meta: {
        ...(state.meta ?? {}),
        updatedAt: now(),
      },
    };

    await writeJsonFile(storePath, nextState);
  }

  return {
    async appendActivation({ activation, activityEvents }) {
      const state = await readState();
      state.activations.unshift(activation);
      state.activityEvents.unshift(...activityEvents);
      await writeState(state);
      return { activation, activityEvents };
    },
    async upsertFunnelEvents({ funnelEvents = [] }) {
      const state = await readState();
      const persistedEvents = [];

      for (const funnelEvent of funnelEvents) {
        const normalizedEvent = normalizeFunnelEvent(funnelEvent, 0, now);
        const existingIndex = state.funnelEvents.findIndex(
          (item) => item.dedupeKey === normalizedEvent.dedupeKey,
        );

        if (existingIndex === -1) {
          state.funnelEvents.unshift(normalizedEvent);
          persistedEvents.push(normalizedEvent);
        } else {
          const existingEvent = state.funnelEvents[existingIndex];
          state.funnelEvents.splice(existingIndex, 1, existingEvent);
          persistedEvents.push(existingEvent);
        }
      }

      state.funnelEvents.sort((left, right) =>
        right.occurredAt.localeCompare(left.occurredAt),
      );
      await writeState(state);
      return persistedEvents;
    },
    async listFunnelEvents({
      stage,
      subjectId,
      ownerUserId,
      manifestId,
      slotId,
      limit = 200,
    } = {}) {
      const state = await readState();
      let funnelEvents = [...state.funnelEvents];

      if (stage) {
        funnelEvents = funnelEvents.filter((event) => event.stage === stage);
      }

      if (subjectId) {
        funnelEvents = funnelEvents.filter((event) => event.subjectId === subjectId);
      }

      if (ownerUserId) {
        funnelEvents = funnelEvents.filter(
          (event) => event.owner?.userId === ownerUserId,
        );
      }

      if (manifestId) {
        funnelEvents = funnelEvents.filter(
          (event) => event.manifestId === manifestId,
        );
      }

      if (slotId) {
        funnelEvents = funnelEvents.filter((event) => event.slotId === slotId);
      }

      return funnelEvents.slice(0, limit);
    },
    async hasFunnelSubject(subjectId) {
      if (!subjectId) {
        return false;
      }

      const state = await readState();
      return state.funnelEvents.some((event) => event.subjectId === subjectId);
    },
    async listActivity({
      activationId,
      manifestId,
      ownerUserId,
      limit = 50,
    } = {}) {
      const state = await readState();
      let activations = [...state.activations];
      let activityEvents = [...state.activityEvents];

      if (ownerUserId) {
        activations = activations.filter(
          (activation) => activation.owner?.userId === ownerUserId,
        );
        const ownedActivationIds = new Set(
          activations.map((activation) => activation.activationId),
        );
        activityEvents = activityEvents.filter((event) =>
          ownedActivationIds.has(event.scope?.id),
        );
      }

      if (activationId) {
        activityEvents = activityEvents.filter(
          (event) => event.scope?.id === activationId,
        );
      }

      if (manifestId) {
        activityEvents = activityEvents.filter(
          (event) => event.payload?.manifestId === manifestId,
        );
      }

      return activityEvents.slice(0, limit);
    },
    async listActivations({ activationId, manifestId, slotId, ownerUserId } = {}) {
      const state = await readState();
      let activations = [...state.activations];

      if (ownerUserId) {
        activations = activations.filter(
          (activation) => activation.owner?.userId === ownerUserId,
        );
      }

      if (activationId) {
        activations = activations.filter(
          (activation) => activation.activationId === activationId,
        );
      }

      if (manifestId) {
        activations = activations.filter(
          (activation) => activation.manifestId === manifestId,
        );
      }

      if (slotId) {
        activations = activations.filter(
          (activation) => activation.slotId === slotId,
        );
      }

      return activations;
    },
    async upsertExecutionRequest({ executionRequest, activityEvents = [] }) {
      const state = await readState();
      const normalizedRequest = normalizeExecutionRequest(
        executionRequest,
        0,
        now,
      );
      const existingIndex = state.executionRequests.findIndex(
        (item) => item.executionRequestId === normalizedRequest.executionRequestId,
      );

      if (existingIndex === -1) {
        state.executionRequests.unshift(normalizedRequest);
      } else {
        state.executionRequests.splice(existingIndex, 1, normalizedRequest);
      }

      if (activityEvents.length > 0) {
        state.activityEvents.unshift(...activityEvents);
      }

      state.executionRequests.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
      await writeState(state);
      return normalizedRequest;
    },
    async listExecutionRequests({
      executionRequestId,
      activationId,
      manifestId,
      slotId,
      ownerUserId,
      limit = 50,
    } = {}) {
      const state = await readState();
      let executionRequests = [...state.executionRequests];

      if (ownerUserId) {
        executionRequests = executionRequests.filter(
          (request) => request.owner?.userId === ownerUserId,
        );
      }

      if (executionRequestId) {
        executionRequests = executionRequests.filter(
          (request) => request.executionRequestId === executionRequestId,
        );
      }

      if (activationId) {
        executionRequests = executionRequests.filter(
          (request) => request.activationId === activationId,
        );
      }

      if (manifestId) {
        executionRequests = executionRequests.filter(
          (request) => request.manifestId === manifestId,
        );
      }

      if (slotId) {
        executionRequests = executionRequests.filter(
          (request) => request.slotId === slotId,
        );
      }

      return executionRequests.slice(0, limit);
    },
    async getExecutionRequest({ executionRequestId, ownerUserId } = {}) {
      const [executionRequest] = await this.listExecutionRequests({
        executionRequestId,
        ownerUserId,
        limit: 1,
      });

      return executionRequest ?? null;
    },
    async readReportingSnapshot() {
      const state = await readState();

      return {
        schemaVersion: state.schemaVersion,
        meta: state.meta,
        activations: [...state.activations],
        activityEvents: [...state.activityEvents],
        funnelEvents: [...state.funnelEvents],
        executionRequests: [...state.executionRequests],
      };
    },
    async upsertRebalance({ rebalance, eventType = "evaluation" }) {
      const state = await readState();
      const normalizedRebalance = normalizeRebalance(rebalance, 0, now);
      const existingIndex = state.rebalances.findIndex(
        (item) =>
          item.rebalanceId === normalizedRebalance.rebalanceId ||
          item.slotId === normalizedRebalance.slotId,
      );
      const existing =
        existingIndex === -1 ? null : state.rebalances[existingIndex];
      const occurredAt = normalizedRebalance.updatedAt ?? now();
      const nextRebalance = {
        ...normalizedRebalance,
        createdAt: existing?.createdAt ?? normalizedRebalance.createdAt ?? occurredAt,
        updatedAt: occurredAt,
        history: existing?.history ?? [],
      };

      if (shouldAppendRebalanceHistory(existing, nextRebalance)) {
        nextRebalance.history = [
          {
            transitionId: `rtr_${randomUUID()}`,
            eventType,
            fromState: existing?.state ?? null,
            toState: nextRebalance.state,
            triggerSource: nextRebalance.triggerSource,
            summary: nextRebalance.summary,
            rationale: nextRebalance.rationale,
            scheduledFor: nextRebalance.scheduledFor,
            occurredAt,
          },
          ...(existing?.history ?? []),
        ];
      }

      if (existingIndex === -1) {
        state.rebalances.unshift(nextRebalance);
      } else {
        state.rebalances.splice(existingIndex, 1, nextRebalance);
      }

      state.rebalances.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
      await writeState(state);
      return nextRebalance;
    },
    async listRebalances({ slotId, manifestId, limit = 50 } = {}) {
      const state = await readState();
      let rebalances = [...state.rebalances];

      if (slotId) {
        rebalances = rebalances.filter((rebalance) => rebalance.slotId === slotId);
      }

      if (manifestId) {
        rebalances = rebalances.filter(
          (rebalance) => rebalance.targetManifestId === manifestId,
        );
      }

      return rebalances.slice(0, limit);
    },
    async getLatestRebalance({ slotId, manifestId } = {}) {
      const [latestRebalance] = await this.listRebalances({
        slotId,
        manifestId,
        limit: 1,
      });

      return latestRebalance ?? null;
    },
  };
}
