import type { SmartAccountPanelData } from "@/lib/contracts";

export function SmartAccountPanel({ account }: { account: SmartAccountPanelData }) {
  return (
    <section className="smart-account-panel">
      <div className="panel-heading panel-heading-tight">
        <span className="section-kicker">Your account</span>
      </div>
      <div className="smart-account-statebar">
        <span className={`status-pill status-pill-${account.readinessState}`}>
          {account.readinessState.replaceAll("_", " ")}
        </span>
        <p>{account.nextAction}</p>
      </div>
      <div className="info-stack">
        <div>
          <span>Deposit</span>
          <strong>{account.buyingPower} · {account.fundingAsset}</strong>
        </div>
        {account.accountSurfaces.map((surface) => (
          <div key={surface.label}>
            <span>{surface.label}</span>
            <strong>{surface.value}</strong>
            <p className="panel-note">{surface.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
