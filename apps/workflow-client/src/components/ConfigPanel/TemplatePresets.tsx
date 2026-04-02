import type { ConfigPreset } from "@xstocks/workflow-shared";

interface Props {
  presets: ConfigPreset[];
  onApply: (values: Record<string, unknown>) => void;
}

export function TemplatePresets({ presets, onApply }: Props) {
  if (!presets.length) return null;

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Presets</div>
      <div className="space-y-1.5">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onApply(preset.values)}
            className="w-full text-left px-3 py-2 rounded-lg bg-surface-2 border border-border-default hover:border-accent transition-colors"
          >
            <div className="text-sm font-medium text-white">{preset.name}</div>
            <div className="text-xs text-gray-500">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
