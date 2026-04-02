import type { IOField } from "@xstocks/workflow-shared";

interface Props {
  outputs?: IOField[];
}

export function IOPills({ outputs }: Props) {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[9px] text-gray-600 uppercase font-medium w-5 flex-shrink-0">out</span>
        {outputs.map((f) => (
          <span key={f.key} className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">
            {f.key}
          </span>
        ))}
      </div>
    </div>
  );
}
