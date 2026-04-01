import type { MethodologyBadge } from "@/lib/contracts";

export function ValidationBadges({ badges }: { badges: MethodologyBadge[] }) {
  return (
    <div className="badge-row">
      {badges.map((badge) => (
        <div className={`badge badge-${badge.tone}`} key={`${badge.label}-${badge.detail}`}>
          <span>{badge.label}</span>
          <strong>{badge.detail}</strong>
        </div>
      ))}
    </div>
  );
}
