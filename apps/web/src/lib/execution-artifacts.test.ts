import { describe, expect, it } from "vitest";

import { buildExecutionArtifact } from "./execution-artifacts";

describe("execution artifact helpers", () => {
  it("derives Ethereum explorer URLs from a real tx hash", () => {
    const txHash = `0x${"b".repeat(64)}`;

    expect(
      buildExecutionArtifact({
        chain: "ethereum",
        txHash,
        venueOrderId: "fusion-order-2",
      }),
    ).toEqual({
      txHash,
      venueOrderId: "fusion-order-2",
      chain: "ethereum",
      explorerUrls: {
        etherscanTx: `https://etherscan.io/tx/${txHash}`,
        eigenPhiTx: `https://eigenphi.io/mev/eigentx/${txHash}`,
      },
    });
  });

  it("fails closed when a tx hash is missing", () => {
    expect(
      buildExecutionArtifact({
        chain: "ethereum",
        venueOrderId: "fusion-order-3",
      }),
    ).toEqual({
      txHash: null,
      venueOrderId: "fusion-order-3",
      chain: "ethereum",
      explorerUrls: {
        etherscanTx: null,
        eigenPhiTx: null,
      },
    });
  });
});
