import { useState, useRef, useEffect } from "react";
import type { ConfigField } from "@xstocks/workflow-shared";
import type { UpstreamNodeInfo } from "../../lib/getUpstreamNodes";
import { ExpressionInput, type ExpressionInputHandle } from "./ExpressionInput";

interface Props {
  field: ConfigField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  upstreamNodes?: UpstreamNodeInfo[];
}

// --- Dropdown ---

function ExpressionDropdown({
  upstreamNodes,
  onInsert,
  onClose,
}: {
  upstreamNodes: UpstreamNodeInfo[];
  onInsert: (nodeId: string, key: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-56 max-h-52 overflow-y-auto bg-surface-1 border border-border-default rounded-lg shadow-xl"
    >
      {upstreamNodes.map((node) => (
        <div key={node.nodeId}>
          <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-gray-400 bg-surface-2 sticky top-0">
            <span>{node.nodeIcon}</span>
            <span className="font-medium truncate">{node.nodeName}</span>
          </div>
          {node.outputs.map((f) => (
            <button
              key={f.key}
              onClick={() => onInsert(node.nodeId, f.key)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 transition-colors flex items-center gap-2"
            >
              <span className="px-1 py-0.5 rounded bg-green-500/10 text-green-400 font-mono text-[10px]">{f.key}</span>
              <span className="text-gray-500 truncate">{f.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Main component ---

export function FieldRenderer({ field, value, onChange, upstreamNodes }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const exprRef = useRef<ExpressionInputHandle>(null);

  const baseInput = "w-full bg-surface-2 border border-border-default rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors";
  const hasUpstream = upstreamNodes && upstreamNodes.length > 0;
  const strValue = String(value ?? "");
  const hasExpressions = typeof value === "string" && /\{\{.+?\}\}/.test(value);

  function handleInsert(nodeId: string, key: string) {
    exprRef.current?.insertReference(nodeId, key);
    setDropdownOpen(false);
  }

  // Use ExpressionInput for text/textarea when upstream nodes exist OR the value already has expressions
  const useExprInput = (hasUpstream || hasExpressions) && (field.type === "text" || field.type === "textarea");

  return (
    <div>
      <div className="flex items-center justify-between mb-1 relative">
        <label className="block text-xs font-medium text-gray-400">
          {field.label}
          {field.required && <span className="text-accent ml-0.5">*</span>}
        </label>
        {hasUpstream && (field.type === "text" || field.type === "textarea") && (
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
              dropdownOpen
                ? "bg-accent/20 text-accent"
                : "bg-surface-2 text-gray-500 hover:text-accent"
            }`}
            title="Insert reference from upstream node"
          >
            {"{  }"}
          </button>
        )}
        {dropdownOpen && hasUpstream && (
          <ExpressionDropdown
            upstreamNodes={upstreamNodes!}
            onInsert={handleInsert}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {useExprInput ? (
        <ExpressionInput
          ref={exprRef}
          value={strValue}
          onChange={(val) => onChange(field.key, val)}
          placeholder={field.placeholder}
          multiline={field.type === "textarea"}
          className={`${baseInput} ${hasExpressions ? "!border-accent/30" : ""} ${
            field.type === "textarea" ? "min-h-[72px]" : "min-h-[34px]"
          } flex flex-wrap items-center content-start gap-y-0.5`}
        />
      ) : (
        <>
          {field.type === "text" && (
            <input
              type="text"
              className={baseInput}
              placeholder={field.placeholder}
              value={strValue}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}

          {field.type === "textarea" && (
            <textarea
              className={`${baseInput} resize-none`}
              rows={3}
              placeholder={field.placeholder}
              value={strValue}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}
        </>
      )}

      {field.type === "number" && (
        <input
          type="number"
          className={baseInput}
          placeholder={field.placeholder}
          value={(value as number) ?? ""}
          onChange={(e) => onChange(field.key, e.target.valueAsNumber)}
        />
      )}

      {field.type === "select" && (
        <select
          className={`${baseInput} cursor-pointer`}
          value={(value as string) ?? field.defaultValue ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-2">
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "toggle" && (
        <button
          onClick={() => onChange(field.key, !value)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            value ? "bg-accent" : "bg-surface-3"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              value ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      )}
    </div>
  );
}
