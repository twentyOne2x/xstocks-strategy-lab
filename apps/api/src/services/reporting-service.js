import {
  XSTOCKS_FUNNEL_LEDGER_STAGE_VALUES,
  XSTOCKS_REPORTING_LADDER_STAGE_VALUES,
} from "../../../../packages/shared/dist/contracts/reporting.js";

const REPORTING_STAGE_ORDER = Object.freeze([
  ...XSTOCKS_REPORTING_LADDER_STAGE_VALUES,
]);
const CANONICAL_FUNNEL_STAGE_SET = new Set(XSTOCKS_FUNNEL_LEDGER_STAGE_VALUES);
const STAGE_DEFINITIONS = Object.freeze({
  landing_viewed: "Unique visitors who reached the landing surface.",
  onboarding_started: "Visitors who explicitly started onboarding.",
  qualification_completed:
    "Visitors whose onboarding answers were re-derived by the API into a valid qualification result.",
  portfolio_recommended:
    "Visitors who received a portfolio recommendation from an API-verified qualification result.",
  activation_viewed:
    "Visitors who reached a promoted activation surface resolved by manifestId or slotId.",
  wallet_connected:
    "Authenticated Privy users with one verified linked wallet recorded at the connection boundary.",
  funding_required:
    "Users with a saved activation snapshot currently blocked on funding.",
  quote_ready: "Users or wallets with at least one persisted quoted execution leg.",
  awaiting_approval:
    "Users or wallets with at least one persisted execution leg awaiting user approval.",
  submitted: "Users or wallets with at least one persisted submitted execution leg.",
  confirmed: "Users or wallets with at least one persisted confirmed execution leg.",
  failed: "Users or wallets with at least one persisted failed execution leg.",
});

function roundUsd(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function normalizeAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^0x([A-Fa-f0-9]{40})$/u.test(normalized)
    ? normalized.toLowerCase()
    : null;
}

function maskAddress(value) {
  const normalized = normalizeAddress(value);

  if (!normalized) {
    return null;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

function createAccumulator() {
  return {
    subjects: new Set(),
    users: new Set(),
    wallets: new Set(),
    smartWallets: new Set(),
    activations: new Set(),
    executionRequests: new Set(),
    executionLegs: new Set(),
  };
}

function finalizeAccumulator(accumulator) {
  return {
    subjects: accumulator.subjects.size,
    users: accumulator.users.size,
    wallets: accumulator.wallets.size,
    smartWallets: accumulator.smartWallets.size,
    activations: accumulator.activations.size,
    executionRequests: accumulator.executionRequests.size,
    executionLegs: accumulator.executionLegs.size,
  };
}

function accumulatorHasRecords(accumulator) {
  return (
    accumulator.subjects.size > 0 ||
    accumulator.users.size > 0 ||
    accumulator.wallets.size > 0 ||
    accumulator.smartWallets.size > 0 ||
    accumulator.activations.size > 0 ||
    accumulator.executionRequests.size > 0 ||
    accumulator.executionLegs.size > 0
  );
}

function getActivationUserId(activation) {
  return activation?.owner?.userId ?? null;
}

function getActivationWalletAddress(activation) {
  return activation?.walletState?.walletConnected
    ? normalizeAddress(activation.walletState.walletAddress)
    : null;
}

function getActivationSmartWalletAddress(activation) {
  return normalizeAddress(activation?.walletState?.smartAccount?.address);
}

function getRequestUserId(request, activation) {
  return request?.owner?.userId ?? getActivationUserId(activation);
}

function getRequestWalletAddress(request, activation) {
  for (const leg of request?.legs ?? []) {
    const signerAddress = normalizeAddress(leg?.approval?.signerAddress);

    if (signerAddress) {
      return signerAddress;
    }

    const quoteOwner = normalizeAddress(leg?.quote?.owner);

    if (quoteOwner) {
      return quoteOwner;
    }
  }

  return getActivationWalletAddress(activation);
}

function getRequestSmartWalletAddress(request, activation) {
  return (
    normalizeAddress(request?.settlementAddress) ??
    getActivationSmartWalletAddress(activation)
  );
}

function addActivationContext(accumulator, activation) {
  const userId = getActivationUserId(activation);
  const walletAddress = getActivationWalletAddress(activation);
  const smartWalletAddress = getActivationSmartWalletAddress(activation);

  if (userId) {
    accumulator.users.add(userId);
  }

  if (walletAddress) {
    accumulator.wallets.add(walletAddress);
  }

  if (smartWalletAddress) {
    accumulator.smartWallets.add(smartWalletAddress);
  }

  if (activation?.activationId) {
    accumulator.activations.add(activation.activationId);
  }
}

function addFunnelEventContext(accumulator, event) {
  if (event?.subjectId) {
    accumulator.subjects.add(event.subjectId);
  }

  if (event?.owner?.userId) {
    accumulator.users.add(event.owner.userId);
  }

  const walletAddress = normalizeAddress(event?.walletAddress);

  if (walletAddress) {
    accumulator.wallets.add(walletAddress);
  }
}

function addExecutionRequestContext(accumulator, request, activation) {
  const userId = getRequestUserId(request, activation);
  const walletAddress = getRequestWalletAddress(request, activation);
  const smartWalletAddress = getRequestSmartWalletAddress(request, activation);

  if (userId) {
    accumulator.users.add(userId);
  }

  if (walletAddress) {
    accumulator.wallets.add(walletAddress);
  }

  if (smartWalletAddress) {
    accumulator.smartWallets.add(smartWalletAddress);
  }

  if (activation?.activationId) {
    accumulator.activations.add(activation.activationId);
  }

  if (request?.executionRequestId) {
    accumulator.executionRequests.add(request.executionRequestId);
  }
}

function addExecutionLegContext(accumulator, request, leg, activation) {
  addExecutionRequestContext(accumulator, request, activation);

  if (leg?.legId) {
    accumulator.executionLegs.add(leg.legId);
  }
}

function isQuotedLeg(leg) {
  return Boolean(leg?.quote);
}

function isAwaitingApprovalLeg(leg) {
  return (
    leg?.state === "awaiting_approval" ||
    leg?.approval?.status === "awaiting_user" ||
    isQuotedLeg(leg)
  );
}

function isSubmittedLeg(leg) {
  return (
    leg?.approval?.status === "submitted" ||
    ["submitted", "confirmed", "failed"].includes(leg?.state) ||
    Boolean(leg?.receipt?.submittedAt)
  );
}

function isConfirmedLeg(leg) {
  return (
    leg?.state === "confirmed" || leg?.receipt?.receiptStatus === "confirmed"
  );
}

function isFailedLeg(leg) {
  return leg?.state === "failed" || leg?.receipt?.receiptStatus === "reverted";
}

function buildLabelMap(values, prefix) {
  const orderedValues = [...new Set(values.filter(Boolean))].sort();
  const labels = new Map();

  orderedValues.forEach((value, index) => {
    labels.set(value, `${prefix}_${String(index + 1).padStart(3, "0")}`);
  });

  return labels;
}

function summarizeExecutionRequest(request, activation, userLabels) {
  const legs = request?.legs ?? [];
  const submittedLegCount = legs.filter(isSubmittedLeg).length;
  const confirmedLegCount = legs.filter(isConfirmedLeg).length;
  const failedLegCount = legs.filter(isFailedLeg).length;
  const blockers = uniqueStrings([
    ...(request?.blockers ?? []),
    ...legs.flatMap((leg) => leg?.blockers ?? []),
  ]);
  const userId = getRequestUserId(request, activation);

  return {
    executionRequestId: request.executionRequestId,
    activationId: request.activationId,
    userLabel: userId ? userLabels.get(userId) ?? null : null,
    walletLabel: maskAddress(getRequestWalletAddress(request, activation)),
    smartWalletLabel: maskAddress(getRequestSmartWalletAddress(request, activation)),
    assetSymbols: uniqueStrings(
      legs
        .map((leg) => leg?.assetSymbol)
        .filter((value) => typeof value === "string"),
    ),
    requestedNotionalUsd: roundUsd(request.requestedNotionalUsd),
    state: request.state,
    submittedLegCount,
    confirmedLegCount,
    failedLegCount,
    submittedVolumeUsd: roundUsd(
      legs
        .filter(isSubmittedLeg)
        .reduce((total, leg) => total + Number(leg.targetNotionalUsd ?? 0), 0),
    ),
    confirmedVolumeUsd: roundUsd(
      legs
        .filter(isConfirmedLeg)
        .reduce((total, leg) => total + Number(leg.targetNotionalUsd ?? 0), 0),
    ),
    blockerCount: blockers.length,
    blockers,
    updatedAt: request.updatedAt,
  };
}

function aggregateRuntimeBlockers({ activations, executionRequests, activationById }) {
  const runtimeBlockers = new Map();

  function appendBlocker({
    detail,
    activation,
    executionRequest,
    affectedStage = null,
  }) {
    const normalizedDetail = String(detail ?? "").trim();

    if (!normalizedDetail) {
      return;
    }

    const existing = runtimeBlockers.get(normalizedDetail) ?? {
      detail: normalizedDetail,
      users: new Set(),
      executionRequests: new Set(),
      affectedStage,
    };

    const userId =
      activation?.owner?.userId ??
      executionRequest?.owner?.userId ??
      null;

    if (userId) {
      existing.users.add(userId);
    }

    if (executionRequest?.executionRequestId) {
      existing.executionRequests.add(executionRequest.executionRequestId);
    }

    if (!existing.affectedStage && affectedStage) {
      existing.affectedStage = affectedStage;
    }

    runtimeBlockers.set(normalizedDetail, existing);
  }

  activations.forEach((activation) => {
    const activationStage =
      activation?.executionPlanSnapshot?.executionState === "funding_required"
        ? "funding_required"
        : null;

    uniqueStrings(activation?.executionPlanSnapshot?.blockers ?? []).forEach(
      (detail) => {
        appendBlocker({
          detail,
          activation,
          affectedStage: activationStage,
        });
      },
    );
  });

  executionRequests.forEach((executionRequest) => {
    const activation = activationById.get(executionRequest.activationId) ?? null;

    uniqueStrings([
      ...(executionRequest?.blockers ?? []),
      ...(executionRequest?.legs ?? []).flatMap((leg) => leg?.blockers ?? []),
    ]).forEach((detail) => {
      appendBlocker({
        detail,
        activation,
        executionRequest,
      });
    });
  });

  return [...runtimeBlockers.values()]
    .sort((left, right) => {
      const requestDelta =
        right.executionRequests.size - left.executionRequests.size;

      if (requestDelta !== 0) {
        return requestDelta;
      }

      const userDelta = right.users.size - left.users.size;

      if (userDelta !== 0) {
        return userDelta;
      }

      return left.detail.localeCompare(right.detail);
    })
    .map((item, index) => ({
      blockerId: `runtime_blocker_${index + 1}`,
      severity: "warning",
      title: item.detail,
      detail: item.detail,
      affectedStage: item.affectedStage,
      affectedUsers: item.users.size,
      affectedExecutionRequests: item.executionRequests.size,
    }));
}

function buildFixedBlockers() {
  return [
    {
      blockerId: "missing_partner_auth_model",
      severity: "warning",
      title: "Partner self-serve auth is not implemented in-repo.",
      detail:
        "This first reporting slice is operator-token gated. There is no canonical partner-facing identity or sharing boundary in this repo yet.",
      affectedStage: null,
      affectedUsers: null,
      affectedExecutionRequests: null,
    },
    {
      blockerId: "funding_required_lower_bound_only",
      severity: "warning",
      title: "Funding-required counts are still lower-bound.",
      detail:
        "funding_required still begins at saved activation snapshots. The repo does not yet have a canonical funding-state event ledger before activation save.",
      affectedStage: "funding_required",
      affectedUsers: null,
      affectedExecutionRequests: null,
    },
  ];
}

export function buildXStocksReportingSnapshot({
  snapshot,
  limit = 10,
}) {
  const activations = [...(snapshot?.activations ?? [])].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const funnelEvents = [...(snapshot?.funnelEvents ?? [])].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
  const executionRequests = [...(snapshot?.executionRequests ?? [])].sort(
    (left, right) => right.updatedAt.localeCompare(left.updatedAt),
  );
  const activationById = new Map(
    activations.map((activation) => [activation.activationId, activation]),
  );
  const userLabels = buildLabelMap(
    [
      ...funnelEvents.map((event) => event?.owner?.userId ?? null),
      ...activations.map((activation) => getActivationUserId(activation)),
      ...executionRequests.map((request) =>
        getRequestUserId(request, activationById.get(request.activationId) ?? null),
      ),
    ],
    "usr",
  );
  const funnelEventsByStage = new Map(
    REPORTING_STAGE_ORDER.map((stage) => [
      stage,
      funnelEvents.filter((event) => event.stage === stage),
    ]),
  );

  const ladder = REPORTING_STAGE_ORDER.map((stage, index) => {
    const accumulator = createAccumulator();
    const notes = [];
    const blockers = [];
    let coverage = "canonical";
    let source = "runtime_store.execution_requests";
    let definition = STAGE_DEFINITIONS[stage];

    if (CANONICAL_FUNNEL_STAGE_SET.has(stage)) {
      source = "runtime_store.funnel_events";

      if (stage === "landing_viewed") {
        notes.push(
          "Counts are unique repo-owned funnel subjects, not inferred person identities.",
        );
      }

      if (stage === "wallet_connected") {
        notes.push(
          "Counts require a verified Privy-authenticated user and one linked wallet address.",
        );
      }

      (funnelEventsByStage.get(stage) ?? []).forEach((event) =>
        addFunnelEventContext(accumulator, event),
      );
    } else if (stage === "funding_required") {
      coverage = "lower_bound";
      source = "runtime_store.activations.executionPlanSnapshot";
      notes.push(
        "Counts begin at activation save and do not capture users who left before persisting an activation snapshot.",
      );
      activations
        .filter(
          (activation) =>
            activation?.status === "funding_required" ||
            activation?.executionPlanSnapshot?.executionState ===
              "funding_required",
        )
        .forEach((activation) => addActivationContext(accumulator, activation));
    } else {
      const predicate =
        stage === "quote_ready"
          ? isQuotedLeg
          : stage === "awaiting_approval"
            ? isAwaitingApprovalLeg
            : stage === "submitted"
              ? isSubmittedLeg
              : stage === "confirmed"
                ? isConfirmedLeg
                : isFailedLeg;

      if (stage === "awaiting_approval") {
        notes.push(
          "The persisted execution lane currently records quote capture and awaiting-user approval together, so this stage is derived from quoted legs.",
        );
      }

      executionRequests.forEach((request) => {
        const activation = activationById.get(request.activationId) ?? null;

        (request?.legs ?? [])
          .filter(predicate)
          .forEach((leg) => addExecutionLegContext(accumulator, request, leg, activation));
      });
    }

    if (!accumulatorHasRecords(accumulator)) {
      blockers.push("No matching repo-owned records exist yet.");
    }

    return {
      stage,
      order: index + 1,
      coverage,
      definition,
      source,
      reached: finalizeAccumulator(accumulator),
      notes,
      blockers,
    };
  });

  const stageByName = new Map(ladder.map((item) => [item.stage, item]));
  const submittedLegs = [];
  const confirmedLegs = [];
  const failedLegs = [];
  const quotedRequestIds = new Set();
  const awaitingApprovalRequestIds = new Set();
  const submittedRequestIds = new Set();
  const confirmedRequestIds = new Set();
  const failedRequestIds = new Set();
  const overallUsers = new Set();
  const overallSmartWallets = new Set();
  const reconciliationLines = [];

  funnelEvents.forEach((event) => {
    if (event?.owner?.userId) {
      overallUsers.add(event.owner.userId);
    }
  });

  activations.forEach((activation) => {
    const userId = getActivationUserId(activation);
    const walletAddress = getActivationWalletAddress(activation);
    const smartWalletAddress = getActivationSmartWalletAddress(activation);

    if (userId) {
      overallUsers.add(userId);
    }

    if (smartWalletAddress) {
      overallSmartWallets.add(smartWalletAddress);
    }
  });

  executionRequests.forEach((request) => {
    const activation = activationById.get(request.activationId) ?? null;
    const userId = getRequestUserId(request, activation);
    const walletAddress = getRequestWalletAddress(request, activation);
    const smartWalletAddress = getRequestSmartWalletAddress(request, activation);

    if (userId) {
      overallUsers.add(userId);
    }

    if (smartWalletAddress) {
      overallSmartWallets.add(smartWalletAddress);
    }

    let requestHasQuotedLeg = false;
    let requestAwaitingApproval = false;
    let requestHasSubmittedLeg = false;
    let requestHasConfirmedLeg = false;
    let requestHasFailedLeg = false;

    (request?.legs ?? []).forEach((leg) => {
      const includedInSubmittedVolume = isSubmittedLeg(leg);
      const includedInConfirmedVolume = isConfirmedLeg(leg);
      const includedInFailed = isFailedLeg(leg);

      if (isQuotedLeg(leg)) {
        requestHasQuotedLeg = true;
      }

      if (leg?.state === "awaiting_approval" || leg?.approval?.status === "awaiting_user") {
        requestAwaitingApproval = true;
      }

      if (includedInSubmittedVolume) {
        requestHasSubmittedLeg = true;
        submittedLegs.push(leg);
      }

      if (includedInConfirmedVolume) {
        requestHasConfirmedLeg = true;
        confirmedLegs.push(leg);
      }

      if (includedInFailed) {
        requestHasFailedLeg = true;
        failedLegs.push(leg);
      }

      if (!includedInSubmittedVolume && !includedInConfirmedVolume) {
        return;
      }

      const userLabel = userId ? userLabels.get(userId) ?? null : null;
      const inclusionReasons = [];

      if (includedInSubmittedVolume) {
        inclusionReasons.push("approval_submitted_or_receipt_recorded");
      }

      if (includedInConfirmedVolume) {
        inclusionReasons.push("receipt_confirmed");
      }

      reconciliationLines.push({
        executionRequestId: request.executionRequestId,
        legId: leg.legId,
        userLabel,
        walletLabel: maskAddress(walletAddress),
        assetSymbol: leg?.assetSymbol ?? null,
        targetNotionalUsd: roundUsd(leg?.targetNotionalUsd),
        legState: leg?.state,
        includedInSubmittedVolume,
        includedInConfirmedVolume,
        inclusionReasons,
        updatedAt: request.updatedAt,
      });
    });

    if (requestHasQuotedLeg) {
      quotedRequestIds.add(request.executionRequestId);
    }

    if (requestAwaitingApproval) {
      awaitingApprovalRequestIds.add(request.executionRequestId);
    }

    if (requestHasSubmittedLeg) {
      submittedRequestIds.add(request.executionRequestId);
    }

    if (requestHasConfirmedLeg) {
      confirmedRequestIds.add(request.executionRequestId);
    }

    if (requestHasFailedLeg) {
      failedRequestIds.add(request.executionRequestId);
    }
  });

  const blockers = [
    ...buildFixedBlockers(),
    ...aggregateRuntimeBlockers({
      activations,
      executionRequests,
      activationById,
    }),
  ];
  const recentExecutions = executionRequests
    .slice(0, Math.max(1, Math.min(Number(limit ?? 10), 50)))
    .map((request) =>
      summarizeExecutionRequest(
        request,
        activationById.get(request.activationId) ?? null,
        userLabels,
      ),
    );

  return {
    privacy: {
      accessMode: "operator_token",
      rawUserIds: "hidden",
      walletAddresses: "masked",
    },
    truthBoundary: {
      durableUserIdentity:
        "Distinct user truth begins only when the repo verifies Privy-authenticated user ownership. Anonymous funnel subjects stay separate from authenticated users and wallets.",
      preActivationFunnelLedger:
        "landing_viewed, onboarding_started, qualification_completed, portfolio_recommended, and activation_viewed are now canonical first-party funnel-subject events owned by this repo.",
      activationViewLedger:
        "activation_viewed is captured from the activation surface only after the manifest resolves through repo-owned contracts.",
      walletConnectionCoverage:
        "wallet_connected is canonical from Privy-authenticated wallet events; funding_required remains lower-bound from saved activation snapshots only.",
      executionVolumeCoverage:
        "submitted_volume_usd and confirmed_volume_usd are canonical sums of stored execution legs only.",
      notes: [
        "Anonymous funnel subjects are durable browser-scoped repo identifiers, not person identity claims.",
        "The repo still does not prove continuity from an anonymous subject to a later authenticated activation unless that bridge was recorded in the same subject stream.",
        "Execution volume excludes preview, recommendation, wallet-connect-only, and quote-only activity.",
      ],
    },
    ladder,
    metrics: {
      funnel: {
        landingViewed: stageByName.get("landing_viewed")?.reached.subjects ?? 0,
        onboardingStarted:
          stageByName.get("onboarding_started")?.reached.subjects ?? 0,
        qualificationCompleted:
          stageByName.get("qualification_completed")?.reached.subjects ?? 0,
        portfolioRecommended:
          stageByName.get("portfolio_recommended")?.reached.subjects ?? 0,
        activationViewed:
          stageByName.get("activation_viewed")?.reached.subjects ?? 0,
      },
      users: {
        authenticated: overallUsers.size,
        walletConnected: stageByName.get("wallet_connected")?.reached.users ?? 0,
        fundingRequired: stageByName.get("funding_required")?.reached.users ?? 0,
        quoteReady: stageByName.get("quote_ready")?.reached.users ?? 0,
        awaitingApproval:
          stageByName.get("awaiting_approval")?.reached.users ?? 0,
        submitted: stageByName.get("submitted")?.reached.users ?? 0,
        confirmed: stageByName.get("confirmed")?.reached.users ?? 0,
        failed: stageByName.get("failed")?.reached.users ?? 0,
      },
      wallets: {
        connected: stageByName.get("wallet_connected")?.reached.wallets ?? 0,
        smart: overallSmartWallets.size,
        quoteReady: stageByName.get("quote_ready")?.reached.wallets ?? 0,
        awaitingApproval:
          stageByName.get("awaiting_approval")?.reached.wallets ?? 0,
        submitted: stageByName.get("submitted")?.reached.wallets ?? 0,
        confirmed: stageByName.get("confirmed")?.reached.wallets ?? 0,
        failed: stageByName.get("failed")?.reached.wallets ?? 0,
      },
      activations: {
        total: activations.length,
        ready: activations.filter((activation) => activation?.status === "ready").length,
        blocked: activations.filter((activation) => activation?.status === "blocked").length,
        fundingRequired: activations.filter(
          (activation) => activation?.status === "funding_required",
        ).length,
      },
      executions: {
        requestsTotal: executionRequests.length,
        requestsWithQuotedLeg: quotedRequestIds.size,
        requestsAwaitingApproval: awaitingApprovalRequestIds.size,
        requestsWithSubmittedLeg: submittedRequestIds.size,
        requestsWithConfirmedLeg: confirmedRequestIds.size,
        requestsWithFailedLeg: failedRequestIds.size,
        submittedLegs: submittedLegs.length,
        confirmedLegs: confirmedLegs.length,
        failedLegs: failedLegs.length,
      },
      volumeUsd: {
        submitted: roundUsd(
          submittedLegs.reduce(
            (total, leg) => total + Number(leg?.targetNotionalUsd ?? 0),
            0,
          ),
        ),
        confirmed: roundUsd(
          confirmedLegs.reduce(
            (total, leg) => total + Number(leg?.targetNotionalUsd ?? 0),
            0,
          ),
        ),
      },
    },
    blockers,
    recentExecutions,
    reconciliation: {
      methodology:
        "submitted_volume_usd sums execution leg targetNotionalUsd only after a real submission is recorded; confirmed_volume_usd sums only legs with confirmed settlement receipts. Preview, connect-only, and quote-only activity are excluded.",
      submittedVolumeUsd: roundUsd(
        reconciliationLines.reduce(
          (total, line) =>
            total +
            (line.includedInSubmittedVolume ? Number(line.targetNotionalUsd) : 0),
          0,
        ),
      ),
      confirmedVolumeUsd: roundUsd(
        reconciliationLines.reduce(
          (total, line) =>
            total +
            (line.includedInConfirmedVolume ? Number(line.targetNotionalUsd) : 0),
          0,
        ),
      ),
      lines: reconciliationLines.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      ),
    },
  };
}
