import React from "react";

import type { ExecutionArtifactView } from "@/lib/contracts";
import { formatExecutionHash } from "@/lib/execution-artifacts";

export function ExecutionArtifactSummary({
  execution,
}: {
  execution: ExecutionArtifactView | null;
}) {
  if (!execution) {
    return null;
  }

  const shortTxHash = formatExecutionHash(execution.txHash);
  const explorerLinks = [
    execution.explorerUrls.etherscanTx
      ? {
          href: execution.explorerUrls.etherscanTx,
          label: "Etherscan",
        }
      : null,
    execution.explorerUrls.eigenPhiTx
      ? {
          href: execution.explorerUrls.eigenPhiTx,
          label: "EigenPhi",
        }
      : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  return (
    <div className="artifact-links">
      {execution.venueOrderId && (
        <span className="artifact-chip">Venue order {execution.venueOrderId}</span>
      )}
      {shortTxHash && <span className="artifact-chip">Tx {shortTxHash}</span>}
      {explorerLinks.map((link) => (
        <a
          key={link.label}
          className="table-link"
          href={link.href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
