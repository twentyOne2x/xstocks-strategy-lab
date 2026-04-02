import type { ExecutionArtifactView as ExecutionArtifacts } from "@/lib/contracts";

function formatArtifactValue(value: string): string {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function humanizeChain(chain: string | null): string | null {
  if (!chain) {
    return null;
  }

  if (chain.toLowerCase() === "ethereum") {
    return "Ethereum";
  }

  return chain;
}

export function ExecutionArtifactLinks({
  artifacts,
}: {
  artifacts: ExecutionArtifacts | null | undefined;
}) {
  if (!artifacts || (!artifacts.txHash && !artifacts.venueOrderId)) {
    return null;
  }

  const chainLabel = humanizeChain(artifacts.chain);

  return (
    <div className="execution-artifacts">
      {chainLabel && <span className="execution-artifact-label">{chainLabel}</span>}
      {artifacts.venueOrderId && (
        <span className="execution-artifact-value">
          Order {formatArtifactValue(artifacts.venueOrderId)}
        </span>
      )}
      {artifacts.txHash && (
        <span className="execution-artifact-value">
          Tx {formatArtifactValue(artifacts.txHash)}
        </span>
      )}
      {artifacts.explorerUrls?.etherscanTx && (
        <a
          className="execution-artifact-link"
          href={artifacts.explorerUrls.etherscanTx}
          rel="noreferrer"
          target="_blank"
        >
          Etherscan
        </a>
      )}
      {artifacts.explorerUrls?.eigenPhiTx && (
        <a
          className="execution-artifact-link"
          href={artifacts.explorerUrls.eigenPhiTx}
          rel="noreferrer"
          target="_blank"
        >
          EigenPhi
        </a>
      )}
    </div>
  );
}
