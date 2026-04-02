import type { ApiExecutionLeg } from "@/lib/api-client";
import type { ExecutionArtifactView, ExecutionExplorerUrls } from "@/lib/contracts";

function normalizeExecutionText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTxHash(value: string | null | undefined): string | null {
  const normalized = normalizeExecutionText(value);
  return normalized && /^0x([A-Fa-f0-9]{64})$/u.test(normalized)
    ? normalized
    : null;
}

function normalizeExecutionChain(value: string | null | undefined): string | null {
  const normalized = normalizeExecutionText(value);
  return normalized ? normalized.toLowerCase() : null;
}

export function buildExecutionExplorerUrls({
  chain,
  txHash,
}: {
  chain?: string | null;
  txHash?: string | null;
}): ExecutionExplorerUrls {
  const normalizedChain = normalizeExecutionChain(chain);
  const normalizedTxHash = normalizeTxHash(txHash);

  if (normalizedChain !== "ethereum" || !normalizedTxHash) {
    return {
      etherscanTx: null,
      eigenPhiTx: null,
    };
  }

  return {
    etherscanTx: `https://etherscan.io/tx/${normalizedTxHash}`,
    eigenPhiTx: `https://eigenphi.io/mev/eigentx/${normalizedTxHash}`,
  };
}

export function buildExecutionArtifact({
  chain = null,
  txHash = null,
  venueOrderId = null,
}: {
  chain?: string | null;
  txHash?: string | null;
  venueOrderId?: string | null;
}): ExecutionArtifactView | null {
  const normalizedChain = normalizeExecutionChain(chain);
  const normalizedTxHash = normalizeTxHash(txHash);
  const normalizedVenueOrderId = normalizeExecutionText(venueOrderId);

  if (!normalizedTxHash && !normalizedVenueOrderId) {
    return null;
  }

  return {
    txHash: normalizedTxHash,
    venueOrderId: normalizedVenueOrderId,
    chain: normalizedChain,
    explorerUrls: buildExecutionExplorerUrls({
      chain: normalizedChain,
      txHash: normalizedTxHash,
    }),
  };
}

export function buildExecutionArtifactFromLeg(
  leg: Pick<ApiExecutionLeg, "receipt" | "venueStatus" | "approval" | "trade"> | null | undefined,
  chain: string | null,
): ExecutionArtifactView | null {
  return buildExecutionArtifact({
    chain,
    txHash:
      leg?.receipt?.txHash ??
      leg?.venueStatus?.settlementTxHash ??
      leg?.trade?.outTxHash ??
      null,
    venueOrderId:
      leg?.venueStatus?.venueOrderId ??
      leg?.approval?.venueOrderId ??
      null,
  });
}

export function formatExecutionHash(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}
