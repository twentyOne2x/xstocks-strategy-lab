import type { NodeCategory } from "@xstocks/workflow-shared";

type Filter = "all" | NodeCategory;

interface Props {
  value: Filter;
  onChange: (v: Filter) => void;
}

const OPTIONS: { label: string; value: Filter; activeColor: string; activeBg: string }[] = [
  { label: "All",       value: "all",       activeColor: "#E8652C", activeBg: "#E8652C22" },
  { label: "On-chain",  value: "on-chain",  activeColor: "#10B981", activeBg: "#10B98122" },
  { label: "Off-chain", value: "off-chain", activeColor: "#8B5CF6", activeBg: "#8B5CF622" },
];

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={value === opt.value ? { color: opt.activeColor, backgroundColor: opt.activeBg, borderColor: opt.activeColor } : {}}
          className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors border ${
            value === opt.value
              ? "border-opacity-40"
              : "bg-surface-2 text-gray-400 hover:text-white border-border-default"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
