import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const walletStateMock = vi.fn();

vi.mock("@/components/wallet-connect-button", () => ({
  WalletConnectButton: () => <div data-testid="wallet-connect-button">Wallet connect button</div>,
  useWalletState: () => walletStateMock(),
}));

import { PortfolioBuySurface } from "./portfolio-buy-surface";

describe("PortfolioBuySurface", () => {
  it("renders the primary buy CTA beside wallet state on the detail surface", () => {
    walletStateMock.mockReturnValue({
      connected: true,
      enabled: true,
    });

    const markup = renderToStaticMarkup(
      <PortfolioBuySurface
        activationHref="/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1"
        directionalPreviewOnly={false}
        manifestTitle="Autopilot: Mag 7 Core"
      />,
    );

    expect(markup).toContain("Primary buy surface");
    expect(markup).toContain("BUY PORTFOLIO");
    expect(markup).toContain("Wallet status");
    expect(markup).toContain("Connected");
    expect(markup).toContain(
      'href="/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1"',
    );
    expect(markup).toContain("Activation stays internal");
    expect(markup).toContain("Wallet connect button");
  });

  it("keeps directional lanes in preview-only language", () => {
    walletStateMock.mockReturnValue({
      connected: false,
      enabled: true,
    });

    const markup = renderToStaticMarkup(
      <PortfolioBuySurface
        activationHref="/activate/leveraged-tsla"
        directionalPreviewOnly={true}
        manifestTitle="Tesla Directional Vault"
      />,
    );

    expect(markup).toContain("Tesla Directional Vault");
    expect(markup).toContain("View directional preview");
    expect(markup).toContain("Preview only");
  });
});
