import { randomUUID } from "node:crypto";

import { readJsonFile, writeJsonFile } from "../json.js";

function createDefaultState(now) {
  return {
    schemaVersion: "2026-04-02.runtime-store.v10",
    meta: {
      createdAt: now(),
      updatedAt: now(),
    },
    activations: [],
    activityEvents: [],
    funnelEvents: [],
    providerReceipts: [],
    rebalances: [],
    executionRequests: [],
    autoresearchRuntime: {
      runtimeId: "strategy_lab_regular_autoresearch_v1",
      runtimeOwner: "worker_strategy_lab",
      cadenceHours: 24,
      status: "idle",
      truthBoundary: "worker_runtime_only",
      repoOwnedRuntime: true,
      recurringAutonomousProven: false,
      supportedTriggerSources: ["manual_cli", "scheduled_cron"],
      notes: [
        "Repo-owned worker runtime exists for regular basket autoresearch refresh.",
        "Scheduled cron is a supported trigger shape, not proof of a deployed recurring host.",
        "Promoted manifests remain the only public explanation boundary.",
      ],
      lastRequestedAt: null,
      lastStartedAt: null,
      lastCompletedAt: null,
      lastRunId: null,
      lastTriggerSource: null,
      nextDueAt: null,
      lastPromotionCount: 0,
      lastPromotedManifestIds: [],
      schedulerHost: null,
      proofUpdatedAt: null,
    },
    autoresearchRuns: [],
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeNonEmptyString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
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
    activationManifestRef: firstDefined(
      activation.activationManifestRef,
      activation.activation_manifest_ref,
      null,
    ),
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
  const subjectId = firstDefined(event.subjectId, event.subject_id, null);
  const activationId = firstDefined(
    event.activationId,
    event.activation_id,
    null,
  );
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
    activationId,
    manifestId,
    slotId,
    recommendationId,
    source: event.source ?? "web",
    verificationMethod:
      event.verificationMethod ?? event.verification_method ?? "web_subject_known",
    dedupeKey:
      event.dedupeKey ??
      event.dedupe_key ??
      [
        stage,
        subjectId ?? "none",
        activationId ?? "none",
        manifestId ?? "none",
        recommendationId ?? "none",
      ].join(":"),
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
    activationManifestRef: firstDefined(
      rebalance.activationManifestRef,
      rebalance.activation_manifest_ref,
      null,
    ),
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
    providerReceiptId: normalizeNonEmptyString(
      firstDefined(
        rebalance.providerReceiptId,
        rebalance.provider_receipt_id,
        null,
      ),
    ),
    executionRequestId: normalizeNonEmptyString(
      firstDefined(
        rebalance.executionRequestId,
        rebalance.execution_request_id,
        null,
      ),
    ),
    executionTriggerSource: normalizeNonEmptyString(
      firstDefined(
        rebalance.executionTriggerSource,
        rebalance.execution_trigger_source,
        null,
      ),
    ),
    executionRequestState: normalizeNonEmptyString(
      firstDefined(
        rebalance.executionRequestState,
        rebalance.execution_request_state,
        null,
      ),
    ),
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

function normalizeProviderJwtSummary(jwt) {
  if (!jwt || typeof jwt !== "object") {
    return null;
  }

  const audience = Array.isArray(jwt.audience ?? jwt.aud)
    ? jwt.audience ?? jwt.aud
    : typeof (jwt.audience ?? jwt.aud) === "string"
      ? [jwt.audience ?? jwt.aud]
      : [];

  return {
    alg: normalizeNonEmptyString(jwt.alg),
    kid: normalizeNonEmptyString(jwt.kid),
    issuer: normalizeEthereumAddress(firstDefined(jwt.issuer, jwt.iss, null)),
    subject: normalizeNonEmptyString(firstDefined(jwt.subject, jwt.sub, null)),
    audience: audience.map((value) => String(value)),
    jwtId: normalizeNonEmptyString(firstDefined(jwt.jwtId, jwt.jwt_id, jwt.jti, null)),
    issuedAt: firstDefined(jwt.issuedAt, jwt.issued_at, null),
    expiresAt: firstDefined(jwt.expiresAt, jwt.expires_at, null),
    notBefore: firstDefined(jwt.notBefore, jwt.not_before, null),
    digest: normalizeNonEmptyString(firstDefined(jwt.digest, jwt.requestDigest, null)),
  };
}

function normalizeProviderReceipt(receipt, index, now) {
  if (!receipt || typeof receipt !== "object") {
    return receipt;
  }

  return {
    version: receipt.version ?? "1",
    receiptId:
      receipt.receiptId ??
      receipt.receipt_id ??
      `provider_receipt_${index + 1}`,
    decision: receipt.decision ?? "rejected",
    statusCode: Number(firstDefined(receipt.statusCode, receipt.status_code, 500)),
    providerId: normalizeNonEmptyString(firstDefined(receipt.providerId, receipt.provider_id, null)),
    deliveryId: normalizeNonEmptyString(firstDefined(receipt.deliveryId, receipt.delivery_id, null)),
    eventId: normalizeNonEmptyString(firstDefined(receipt.eventId, receipt.event_id, null)),
    triggerSource:
      receipt.triggerSource ?? receipt.trigger_source ?? "provider_triggered",
    routePath:
      receipt.routePath ?? receipt.route_path ?? "/api/internal/rebalances/provider-events",
    receivedAt: firstDefined(receipt.receivedAt, receipt.received_at, now()),
    processedAt: firstDefined(receipt.processedAt, receipt.processed_at, now()),
    requestDigest: normalizeNonEmptyString(firstDefined(receipt.requestDigest, receipt.request_digest, null)),
    rawBodyDigest:
      receipt.rawBodyDigest ??
      receipt.raw_body_digest ??
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    signerAddress: normalizeEthereumAddress(
      firstDefined(receipt.signerAddress, receipt.signer_address, null),
    ),
    reasonCodes: (receipt.reasonCodes ?? receipt.reason_codes ?? []).map((value) =>
      String(value)
    ),
    reasonDetail:
      receipt.reasonDetail ?? receipt.reason_detail ?? "Provider receipt recorded.",
    duplicateOfReceiptId: normalizeNonEmptyString(
      firstDefined(
        receipt.duplicateOfReceiptId,
        receipt.duplicate_of_receipt_id,
        null,
      ),
    ),
    stateChanged: Boolean(
      firstDefined(receipt.stateChanged, receipt.state_changed, false),
    ),
    rebalanceId: normalizeNonEmptyString(firstDefined(receipt.rebalanceId, receipt.rebalance_id, null)),
    rebalanceState: normalizeNonEmptyString(firstDefined(receipt.rebalanceState, receipt.rebalance_state, null)),
    targetManifestId: normalizeNonEmptyString(
      firstDefined(receipt.targetManifestId, receipt.target_manifest_id, null),
    ),
    baselineManifestId: normalizeNonEmptyString(
      firstDefined(receipt.baselineManifestId, receipt.baseline_manifest_id, null),
    ),
    executionRequestId: normalizeNonEmptyString(
      firstDefined(receipt.executionRequestId, receipt.execution_request_id, null),
    ),
    executionTriggerSource: normalizeNonEmptyString(
      firstDefined(
        receipt.executionTriggerSource,
        receipt.execution_trigger_source,
        null,
      ),
    ),
    executionState: normalizeNonEmptyString(
      firstDefined(receipt.executionState, receipt.execution_state, null),
    ),
    rebalanceBlockers: (receipt.rebalanceBlockers ?? receipt.rebalance_blockers ?? []).map(
      (value) => String(value),
    ),
    request: receipt.request ?? null,
    jwt: normalizeProviderJwtSummary(receipt.jwt),
  };
}

function normalizeExecutionRequestLinkage(linkage) {
  if (!linkage || typeof linkage !== "object") {
    return null;
  }

  return {
    rebalanceId: normalizeNonEmptyString(
      firstDefined(linkage.rebalanceId, linkage.rebalance_id, null),
    ),
    providerReceiptId: normalizeNonEmptyString(
      firstDefined(linkage.providerReceiptId, linkage.provider_receipt_id, null),
    ),
    providerDeliveryId: normalizeNonEmptyString(
      firstDefined(
        linkage.providerDeliveryId,
        linkage.provider_delivery_id,
        null,
      ),
    ),
    providerEventId: normalizeNonEmptyString(
      firstDefined(linkage.providerEventId, linkage.provider_event_id, null),
    ),
  };
}

function normalizeExecutionLegArtifactLinkage(linkage) {
  if (!linkage || typeof linkage !== "object") {
    return null;
  }

  const executionRequestId = normalizeNonEmptyString(
    firstDefined(linkage.executionRequestId, linkage.execution_request_id, null),
  );

  if (!executionRequestId) {
    return null;
  }

  return {
    executionRequestId,
    ...(normalizeExecutionRequestLinkage(linkage) ?? {
      rebalanceId: null,
      providerReceiptId: null,
      providerDeliveryId: null,
      providerEventId: null,
    }),
  };
}

function normalizeExecutionQuote(quote) {
  if (!quote || typeof quote !== "object") {
    return null;
  }

  if (
    quote.kind === "oneinch_fusion" ||
    (Object.hasOwn(quote, "fromTokenAmount") &&
      Object.hasOwn(quote, "toTokenAmount") &&
      Object.hasOwn(quote, "recommendedPreset"))
  ) {
    return {
      kind: "oneinch_fusion",
      quoteId: firstDefined(quote.quoteId, quote.quote_id, quote.id, null),
      quotedAt:
        quote.quotedAt ??
        quote.quoted_at ??
        quote.requestedAt ??
        quote.requested_at ??
        quote.createdAt,
      fromTokenAddress:
        quote.fromTokenAddress ?? quote.from_token_address ?? null,
      toTokenAddress: quote.toTokenAddress ?? quote.to_token_address ?? null,
      walletAddress: quote.walletAddress ?? quote.wallet_address ?? null,
      fromTokenAmount:
        quote.fromTokenAmount ?? quote.from_token_amount ?? null,
      toTokenAmount: quote.toTokenAmount ?? quote.to_token_amount ?? null,
      settlementAddress:
        quote.settlementAddress ?? quote.settlement_address ?? null,
      recommendedPreset:
        quote.recommendedPreset ??
        quote.recommended_preset ??
        quote.preset ??
        null,
      priceImpactPercent: firstDefined(
        quote.priceImpactPercent,
        quote.price_impact_percent,
        null,
      ),
      orderHash: quote.orderHash ?? quote.order_hash ?? null,
      signerAddress: quote.signerAddress ?? quote.signer_address ?? null,
      receiver: quote.receiver ?? null,
      fee: quote.fee ?? {
        receiver: quote.feeReceiver ?? quote.fee_receiver ?? null,
        bps: quote.feeBps ?? quote.fee_bps ?? 0,
        whitelistDiscountPercent:
          quote.whitelistDiscountPercent ??
          quote.whitelist_discount_percent ??
          0,
      },
      submissionSupported: Boolean(
        firstDefined(
          quote.submissionSupported,
          quote.submission_supported,
          false,
        ),
      ),
    };
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
    linkage: normalizeExecutionLegArtifactLinkage(
      firstDefined(leg.linkage, leg.artifactLinkage, leg.artifact_linkage, null),
    ),
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
    rebalanceId: normalizeNonEmptyString(
      firstDefined(
        request.rebalanceId,
        request.rebalance_id,
        request.linkage?.rebalanceId,
        request.linkage?.rebalance_id,
        null,
      ),
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
    activationManifestRef: firstDefined(
      request.activationManifestRef,
      request.activation_manifest_ref,
      null,
    ),
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
    linkage: normalizeExecutionRequestLinkage(
      firstDefined(
        request.linkage,
        request.executionLinkage,
        request.execution_linkage,
        null,
      ),
    ),
    createdAt: request.createdAt ?? request.created_at ?? now(),
    updatedAt: request.updatedAt ?? request.updated_at ?? now(),
  };
}

function normalizeAutoresearchRuntime(runtime, now) {
  const defaultState = createDefaultState(now);
  const defaultRuntime = defaultState.autoresearchRuntime;

  if (!runtime || typeof runtime !== "object") {
    return defaultRuntime;
  }

  return {
    runtimeId:
      runtime.runtimeId ??
      runtime.runtime_id ??
      defaultRuntime.runtimeId,
    runtimeOwner:
      runtime.runtimeOwner ??
      runtime.runtime_owner ??
      defaultRuntime.runtimeOwner,
    cadenceHours: Number(
      firstDefined(
        runtime.cadenceHours,
        runtime.cadence_hours,
        defaultRuntime.cadenceHours,
      ),
    ),
    status: String(runtime.status ?? defaultRuntime.status),
    truthBoundary:
      runtime.truthBoundary ??
      runtime.truth_boundary ??
      defaultRuntime.truthBoundary,
    repoOwnedRuntime: Boolean(
      firstDefined(
        runtime.repoOwnedRuntime,
        runtime.repo_owned_runtime,
        defaultRuntime.repoOwnedRuntime,
      ),
    ),
    recurringAutonomousProven: Boolean(
      firstDefined(
        runtime.recurringAutonomousProven,
        runtime.recurring_autonomous_proven,
        defaultRuntime.recurringAutonomousProven,
      ),
    ),
    supportedTriggerSources: (
      runtime.supportedTriggerSources ??
      runtime.supported_trigger_sources ??
      defaultRuntime.supportedTriggerSources
    ).map((value) => String(value)),
    notes: (
      runtime.notes ??
      defaultRuntime.notes
    ).map((value) => String(value)),
    lastRequestedAt: firstDefined(
      runtime.lastRequestedAt,
      runtime.last_requested_at,
      null,
    ),
    lastStartedAt: firstDefined(
      runtime.lastStartedAt,
      runtime.last_started_at,
      null,
    ),
    lastCompletedAt: firstDefined(
      runtime.lastCompletedAt,
      runtime.last_completed_at,
      null,
    ),
    lastRunId: firstDefined(runtime.lastRunId, runtime.last_run_id, null),
    lastTriggerSource: firstDefined(
      runtime.lastTriggerSource,
      runtime.last_trigger_source,
      null,
    ),
    nextDueAt: firstDefined(runtime.nextDueAt, runtime.next_due_at, null),
    lastPromotionCount: Number(
      firstDefined(
        runtime.lastPromotionCount,
        runtime.last_promotion_count,
        defaultRuntime.lastPromotionCount,
      ),
    ),
    lastPromotedManifestIds: (
      runtime.lastPromotedManifestIds ??
      runtime.last_promoted_manifest_ids ??
      defaultRuntime.lastPromotedManifestIds
    ).map((value) => String(value)),
    schedulerHost: normalizeAutoresearchSchedulerHost(
      runtime.schedulerHost ?? runtime.scheduler_host,
    ),
    proofUpdatedAt: firstDefined(
      runtime.proofUpdatedAt,
      runtime.proof_updated_at,
      null,
    ),
  };
}

function normalizeAutoresearchSchedulerHost(host) {
  if (!host || typeof host !== "object") {
    return null;
  }

  const normalizedHost = {
    provider: normalizeNonEmptyString(host.provider),
    hostKind: normalizeNonEmptyString(
      host.hostKind ?? host.host_kind,
    ),
    projectId: normalizeNonEmptyString(host.projectId ?? host.project_id),
    projectName: normalizeNonEmptyString(
      host.projectName ?? host.project_name,
    ),
    environmentId: normalizeNonEmptyString(
      host.environmentId ?? host.environment_id,
    ),
    environmentName: normalizeNonEmptyString(
      host.environmentName ?? host.environment_name,
    ),
    serviceId: normalizeNonEmptyString(host.serviceId ?? host.service_id),
    serviceName: normalizeNonEmptyString(
      host.serviceName ?? host.service_name,
    ),
    cronSchedule: normalizeNonEmptyString(
      host.cronSchedule ?? host.cron_schedule,
    ),
  };

  return normalizedHost.provider &&
    normalizedHost.hostKind &&
    normalizedHost.projectId &&
    normalizedHost.projectName &&
    normalizedHost.environmentId &&
    normalizedHost.environmentName &&
    normalizedHost.serviceId &&
    normalizedHost.serviceName &&
    normalizedHost.cronSchedule
    ? normalizedHost
    : null;
}

function normalizeAutoresearchSchedulerReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return null;
  }

  const normalizedReceipt = {
    provider: normalizeNonEmptyString(receipt.provider),
    hostKind: normalizeNonEmptyString(
      receipt.hostKind ?? receipt.host_kind,
    ),
    receiptCapturedAt: firstDefined(
      receipt.receiptCapturedAt,
      receipt.receipt_captured_at,
      null,
    ),
    deploymentId: normalizeNonEmptyString(
      receipt.deploymentId ?? receipt.deployment_id,
    ),
    snapshotId: normalizeNonEmptyString(
      receipt.snapshotId ?? receipt.snapshot_id,
    ),
    publicDomain: normalizeNonEmptyString(
      receipt.publicDomain ?? receipt.public_domain,
    ),
    privateDomain: normalizeNonEmptyString(
      receipt.privateDomain ?? receipt.private_domain,
    ),
    projectId: normalizeNonEmptyString(receipt.projectId ?? receipt.project_id),
    projectName: normalizeNonEmptyString(
      receipt.projectName ?? receipt.project_name,
    ),
    environmentId: normalizeNonEmptyString(
      receipt.environmentId ?? receipt.environment_id,
    ),
    environmentName: normalizeNonEmptyString(
      receipt.environmentName ?? receipt.environment_name,
    ),
    serviceId: normalizeNonEmptyString(receipt.serviceId ?? receipt.service_id),
    serviceName: normalizeNonEmptyString(
      receipt.serviceName ?? receipt.service_name,
    ),
    cronSchedule: normalizeNonEmptyString(
      receipt.cronSchedule ?? receipt.cron_schedule,
    ),
    gitCommitSha: normalizeNonEmptyString(
      receipt.gitCommitSha ?? receipt.git_commit_sha,
    ),
    gitBranch: normalizeNonEmptyString(
      receipt.gitBranch ?? receipt.git_branch,
    ),
  };

  return normalizedReceipt.provider &&
    normalizedReceipt.hostKind &&
    normalizedReceipt.receiptCapturedAt &&
    normalizedReceipt.deploymentId &&
    normalizedReceipt.snapshotId &&
    normalizedReceipt.projectId &&
    normalizedReceipt.projectName &&
    normalizedReceipt.environmentId &&
    normalizedReceipt.environmentName &&
    normalizedReceipt.serviceId &&
    normalizedReceipt.serviceName &&
    normalizedReceipt.cronSchedule
    ? normalizedReceipt
    : null;
}

function normalizeAutoresearchRun(run, index, now) {
  if (!run || typeof run !== "object") {
    return run;
  }

  return {
    runId:
      run.runId ??
      run.run_id ??
      `autoresearch_run_${index + 1}`,
    runtimeId:
      run.runtimeId ??
      run.runtime_id ??
      "strategy_lab_regular_autoresearch_v1",
    runtimeOwner:
      run.runtimeOwner ??
      run.runtime_owner ??
      "worker_strategy_lab",
    triggerSource:
      run.triggerSource ??
      run.trigger_source ??
      "manual_cli",
    cadenceHours: Number(
      firstDefined(run.cadenceHours, run.cadence_hours, 24),
    ),
    status: String(run.status ?? "running"),
    truthBoundary:
      run.truthBoundary ??
      run.truth_boundary ??
      "worker_runtime_only",
    recurringAutonomousProven: Boolean(
      firstDefined(
        run.recurringAutonomousProven,
        run.recurring_autonomous_proven,
        false,
      ),
    ),
    startedAt: firstDefined(run.startedAt, run.started_at, now()),
    completedAt: firstDefined(run.completedAt, run.completed_at, null),
    slotIds: (run.slotIds ?? run.slot_ids ?? []).map((value) => String(value)),
    baselineSeeded: Boolean(
      firstDefined(run.baselineSeeded, run.baseline_seeded, false),
    ),
    waveExecuted: Boolean(
      firstDefined(run.waveExecuted, run.wave_executed, false),
    ),
    previousManifestIds: (
      run.previousManifestIds ??
      run.previous_manifest_ids ??
      []
    ).map((value) => String(value)),
    nextManifestIds: (
      run.nextManifestIds ??
      run.next_manifest_ids ??
      []
    ).map((value) => String(value)),
    promotedManifestIds: (
      run.promotedManifestIds ??
      run.promoted_manifest_ids ??
      []
    ).map((value) => String(value)),
    promotionCount: Number(
      firstDefined(run.promotionCount, run.promotion_count, 0),
    ),
    checks:
      run.checks && typeof run.checks === "object"
        ? {
            researchContractsOk: Boolean(
              firstDefined(
                run.checks.researchContractsOk,
                run.checks.research_contracts_ok,
                false,
              ),
            ),
            researchRunIntegrityOk: Boolean(
              firstDefined(
                run.checks.researchRunIntegrityOk,
                run.checks.research_run_integrity_ok,
                false,
              ),
            ),
            promotedBoundaryOk: Boolean(
              firstDefined(
                run.checks.promotedBoundaryOk,
                run.checks.promoted_boundary_ok,
                false,
              ),
            ),
          }
        : null,
    note: firstDefined(run.note, null),
    errorMessage: firstDefined(
      run.errorMessage,
      run.error_message,
      null,
    ),
    schedulerReceipt: normalizeAutoresearchSchedulerReceipt(
      run.schedulerReceipt ?? run.scheduler_receipt,
    ),
  };
}

function getNextAutoresearchDueAt(run) {
  return run.completedAt === null
    ? null
    : new Date(
        new Date(run.completedAt).getTime() +
          run.cadenceHours * 60 * 60 * 1000,
      ).toISOString();
}

function getAutoresearchRuntimeStatus(run) {
  return run.status === "failed"
    ? "failed"
    : run.status === "succeeded"
      ? "idle"
      : run.status;
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
    providerReceipts: (
      state.providerReceipts ??
      state.provider_receipts ??
      []
    ).map((receipt, index) => normalizeProviderReceipt(receipt, index, now)),
    rebalances: (state.rebalances ?? []).map((rebalance, index) =>
      normalizeRebalance(rebalance, index, now),
    ),
    executionRequests: (
      state.executionRequests ??
      state.execution_requests ??
      []
    ).map((request, index) => normalizeExecutionRequest(request, index, now)),
    autoresearchRuntime: normalizeAutoresearchRuntime(
      state.autoresearchRuntime ?? state.autoresearch_runtime,
      now,
    ),
    autoresearchRuns: (
      state.autoresearchRuns ??
      state.autoresearch_runs ??
      []
    ).map((run, index) => normalizeAutoresearchRun(run, index, now)),
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
    async appendProviderReceipt({ receipt }) {
      const state = await readState();
      const normalizedReceipt = normalizeProviderReceipt(receipt, 0, now);
      state.providerReceipts.unshift(normalizedReceipt);
      state.providerReceipts.sort((left, right) =>
        String(right.receivedAt).localeCompare(String(left.receivedAt)),
      );
      await writeState(state);
      return normalizedReceipt;
    },
    async upsertProviderReceipt({ receipt }) {
      const state = await readState();
      const normalizedReceipt = normalizeProviderReceipt(receipt, 0, now);
      const existingIndex = state.providerReceipts.findIndex(
        (item) => item.receiptId === normalizedReceipt.receiptId,
      );

      if (existingIndex === -1) {
        state.providerReceipts.unshift(normalizedReceipt);
      } else {
        state.providerReceipts.splice(existingIndex, 1, normalizedReceipt);
      }

      state.providerReceipts.sort((left, right) =>
        String(right.receivedAt).localeCompare(String(left.receivedAt)),
      );
      await writeState(state);
      return normalizedReceipt;
    },
    async listProviderReceipts({
      providerId,
      deliveryId,
      rebalanceId,
      decision,
      signerAddress,
      jwtId,
      requestDigest,
      limit = 100,
    } = {}) {
      const state = await readState();
      let providerReceipts = [...state.providerReceipts];

      if (providerId) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.providerId === providerId,
        );
      }

      if (deliveryId) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.deliveryId === deliveryId,
        );
      }

      if (rebalanceId) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.rebalanceId === rebalanceId,
        );
      }

      if (decision) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.decision === decision,
        );
      }

      if (signerAddress) {
        const normalizedSignerAddress = normalizeEthereumAddress(signerAddress);
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.signerAddress === normalizedSignerAddress,
        );
      }

      if (jwtId) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.jwt?.jwtId === jwtId,
        );
      }

      if (requestDigest) {
        providerReceipts = providerReceipts.filter(
          (receipt) => receipt.requestDigest === requestDigest,
        );
      }

      return providerReceipts.slice(0, limit);
    },
    async findProviderReceiptConflicts({
      providerId,
      deliveryId,
      signerAddress,
      jwtId,
      requestDigest,
    } = {}) {
      const state = await readState();
      const normalizedSignerAddress = normalizeEthereumAddress(signerAddress);

      return {
        delivery:
          state.providerReceipts.find(
            (receipt) =>
              receipt.providerId === providerId &&
              receipt.deliveryId === deliveryId,
          ) ?? null,
        jwtId:
          !normalizedSignerAddress || !jwtId
            ? null
            : state.providerReceipts.find(
              (receipt) =>
                receipt.signerAddress === normalizedSignerAddress &&
                receipt.jwt?.jwtId === jwtId,
            ) ?? null,
        requestDigest:
          !normalizedSignerAddress || !requestDigest
            ? null
            : state.providerReceipts.find(
              (receipt) =>
                receipt.signerAddress === normalizedSignerAddress &&
                receipt.requestDigest === requestDigest,
            ) ?? null,
      };
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
      rebalanceId,
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

      if (rebalanceId) {
        executionRequests = executionRequests.filter(
          (request) => request.rebalanceId === rebalanceId,
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
        providerReceipts: [...state.providerReceipts],
        executionRequests: [...state.executionRequests],
        autoresearchRuntime: state.autoresearchRuntime,
        autoresearchRuns: [...state.autoresearchRuns],
      };
    },
    async getAutoresearchRuntime() {
      const state = await readState();
      return state.autoresearchRuntime;
    },
    async listAutoresearchRuns({ limit = 20 } = {}) {
      const state = await readState();
      return [...state.autoresearchRuns]
        .sort((left, right) =>
          String(right.startedAt).localeCompare(String(left.startedAt)),
        )
        .slice(0, limit);
    },
    async beginAutoresearchRun({ run }) {
      const state = await readState();
      const normalizedRun = normalizeAutoresearchRun(run, 0, now);
      const existingIndex = state.autoresearchRuns.findIndex(
        (item) => item.runId === normalizedRun.runId,
      );

      if (existingIndex === -1) {
        state.autoresearchRuns.unshift(normalizedRun);
      } else {
        state.autoresearchRuns.splice(existingIndex, 1, normalizedRun);
      }

      state.autoresearchRuntime = normalizeAutoresearchRuntime(
        {
          ...state.autoresearchRuntime,
          status: "running",
          lastRequestedAt: normalizedRun.startedAt,
          lastStartedAt: normalizedRun.startedAt,
          lastRunId: normalizedRun.runId,
          lastTriggerSource: normalizedRun.triggerSource,
          cadenceHours: normalizedRun.cadenceHours,
        },
        now,
      );

      await writeState(state);
      return normalizedRun;
    },
    async completeAutoresearchRun({ run }) {
      const state = await readState();
      const normalizedRun = normalizeAutoresearchRun(run, 0, now);
      const existingIndex = state.autoresearchRuns.findIndex(
        (item) => item.runId === normalizedRun.runId,
      );

      if (existingIndex === -1) {
        state.autoresearchRuns.unshift(normalizedRun);
      } else {
        state.autoresearchRuns.splice(existingIndex, 1, normalizedRun);
      }

      const nextDueAt = getNextAutoresearchDueAt(normalizedRun);
      const runtimeStatus = getAutoresearchRuntimeStatus(normalizedRun);

      state.autoresearchRuntime = normalizeAutoresearchRuntime(
        {
          ...state.autoresearchRuntime,
          status: runtimeStatus,
          cadenceHours: normalizedRun.cadenceHours,
          lastRunId: normalizedRun.runId,
          lastTriggerSource: normalizedRun.triggerSource,
          lastCompletedAt: normalizedRun.completedAt,
          nextDueAt,
          lastPromotionCount: normalizedRun.promotionCount,
          lastPromotedManifestIds: normalizedRun.promotedManifestIds,
        },
        now,
      );

      state.autoresearchRuns.sort((left, right) =>
        String(right.startedAt).localeCompare(String(left.startedAt)),
      );
      await writeState(state);
      return normalizedRun;
    },
    async recordAutoresearchHostReceipt({ runtime, run }) {
      const state = await readState();
      const normalizedRun = normalizeAutoresearchRun(run, 0, now);
      const normalizedRuntime = normalizeAutoresearchRuntime(
        {
          ...state.autoresearchRuntime,
          ...runtime,
          status: getAutoresearchRuntimeStatus(normalizedRun),
          cadenceHours: normalizedRun.cadenceHours,
          lastRequestedAt: normalizedRun.startedAt,
          lastStartedAt: normalizedRun.startedAt,
          lastCompletedAt: normalizedRun.completedAt,
          lastRunId: normalizedRun.runId,
          lastTriggerSource: normalizedRun.triggerSource,
          nextDueAt: getNextAutoresearchDueAt(normalizedRun),
          lastPromotionCount: normalizedRun.promotionCount,
          lastPromotedManifestIds: normalizedRun.promotedManifestIds,
        },
        now,
      );
      const existingIndex = state.autoresearchRuns.findIndex(
        (item) => item.runId === normalizedRun.runId,
      );

      if (existingIndex === -1) {
        state.autoresearchRuns.unshift(normalizedRun);
      } else {
        state.autoresearchRuns.splice(existingIndex, 1, normalizedRun);
      }

      state.autoresearchRuntime = normalizedRuntime;
      state.autoresearchRuns.sort((left, right) =>
        String(right.startedAt).localeCompare(String(left.startedAt)),
      );
      await writeState(state);

      return {
        runtime: normalizedRuntime,
        run: normalizedRun,
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
