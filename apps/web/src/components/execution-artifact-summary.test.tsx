import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExecutionArtifactSummary } from "./execution-artifact-summary";

describe("ExecutionArtifactSummary", () => {
  it("renders explorer links when a tx hash is available", () => {
    const txHash = `0x${"c".repeat(64)}`;
    const markup = renderToStaticMarkup(
      <ExecutionArtifactSummary
        execution={{
          txHash,
          venueOrderId: "fusion-order-4",
          chain: "ethereum",
          explorerUrls: {
            etherscanTx: `https://etherscan.io/tx/${txHash}`,
            eigenPhiTx: `https://eigenphi.io/mev/eigentx/${txHash}`,
          },
        }}
      />,
    );

    expect(markup).toContain("Venue order fusion-order-4");
    expect(markup).toContain(`href="https://etherscan.io/tx/${txHash}"`);
    expect(markup).toContain(`href="https://eigenphi.io/mev/eigentx/${txHash}"`);
  });

  it("renders nothing when execution truth is missing", () => {
    expect(renderToStaticMarkup(<ExecutionArtifactSummary execution={null} />)).toBe(
      "",
    );
  });
});
