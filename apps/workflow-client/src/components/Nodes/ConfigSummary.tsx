import { registry } from "@xstocks/workflow-shared";

// Fields to skip in the summary (auto-set hidden fields, raw IDs)
const HIDDEN_KEYS = new Set(["marketQuestion", "fromTokenName", "toTokenName", "marketId"]);

// Fields where we show a companion field's value instead
const DISPLAY_OVERRIDES: Record<string, { sourceKey: string; label: string }> = {
  // For polymarket: show the question text instead of the hex conditionId
  marketId: { sourceKey: "marketQuestion", label: "Market" },
};

// Truncate long values
function truncate(val: string, max = 20): string {
  return val.length > max ? val.slice(0, max) + "..." : val;
}

// Format a config value for display
function formatValue(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  const str = String(value);
  // Skip expression-only values (they show as {{uuid.key}} which isn't helpful)
  if (str.startsWith("{{") && str.endsWith("}}")) return null;
  // If it contains expressions mixed with text, show a shortened version
  if (str.includes("{{")) return truncate(str.replace(/\{\{[^}]+\}\}/g, "[...]"), 24);
  return truncate(str, 24);
}

interface Props {
  definitionId: string;
  config: Record<string, unknown>;
}

export function ConfigSummary({ definitionId, config }: Props) {
  const def = registry[definitionId];
  if (!def?.configFields) return null;

  const entries: Array<{ label: string; value: string }> = [];

  for (const field of def.configFields) {
    if (HIDDEN_KEYS.has(field.key)) {
      // Check if this hidden key has a display override
      const override = DISPLAY_OVERRIDES[field.key];
      if (override) {
        const overrideVal = formatValue(config[override.sourceKey]);
        if (overrideVal) entries.push({ label: override.label, value: overrideVal });
      }
      continue;
    }
    const raw = config[field.key];
    const formatted = formatValue(raw);
    if (formatted === null) continue;
    entries.push({ label: field.label, value: formatted });
  }

  if (entries.length === 0) return null;

  // Show at most 3 params to keep nodes compact
  const shown = entries.slice(0, 3);
  const more = entries.length - shown.length;

  return (
    <div className="px-3 pb-2 space-y-0.5">
      {shown.map((e) => (
        <div key={e.label} className="flex items-center gap-1.5 text-[10px]">
          <span className="text-gray-500 flex-shrink-0">{e.label}:</span>
          <span className="text-gray-300 truncate font-mono">{e.value}</span>
        </div>
      ))}
      {more > 0 && (
        <div className="text-[9px] text-gray-600">+{more} more</div>
      )}
    </div>
  );
}
