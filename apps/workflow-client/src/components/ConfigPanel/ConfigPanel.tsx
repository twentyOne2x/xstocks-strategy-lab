import { registry } from "@xstocks/workflow-shared";
import { useWorkflowStore } from "../../store/workflowStore";
import { useUIStore } from "../../store/uiStore";
import { FieldRenderer } from "./FieldRenderer";
import { MarketSearch } from "./MarketSearch";
import { TokenSearch } from "./TokenSearch";
import { WalletTokenSelect } from "./WalletTokenSelect";
import { TemplatePresets } from "./TemplatePresets";
import { getUpstreamNodes } from "../../lib/getUpstreamNodes";

export function ConfigPanel() {
  const { selectedNodeId, nodes, edges, updateNodeConfig, deleteNode, selectNode } = useWorkflowStore();
  const { setConfigPanelOpen } = useUIStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const defId = node.data.definitionId as string;
  const def = registry[defId];
  const config = (node.data.config as Record<string, unknown>) ?? {};
  const upstreamNodes = getUpstreamNodes(node.id, nodes, edges);

  function handleFieldChange(key: string, value: unknown) {
    updateNodeConfig(node!.id, { ...config, [key]: value });
  }

  function handlePresetApply(values: Record<string, unknown>) {
    updateNodeConfig(node!.id, { ...config, ...values });
  }

  function handleDelete() {
    deleteNode(node!.id);
    setConfigPanelOpen(false);
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-surface-0 border-l border-border-default flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
            style={{ backgroundColor: (def?.color ?? "#444") + "22" }}
          >
            {node.data.icon as string}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{node.data.label as string}</div>
            <div className="text-[10px] text-gray-500 capitalize">{node.data.role as string}</div>
          </div>
        </div>
        <button
          onClick={() => { selectNode(null); }}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {def?.presets?.length ? (
          <TemplatePresets presets={def.presets} onApply={handlePresetApply} />
        ) : null}

        {/* Outputs */}
        {def?.outputs?.length ? (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Outputs</div>
            <div className="space-y-1">
              {def.outputs.map((f) => (
                <div key={f.key} className="flex items-center gap-2 px-2 py-1 bg-surface-2 rounded-md">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">{f.key}</span>
                  <span className="text-xs text-gray-400">{f.label}</span>
                  <span className="text-[10px] text-gray-600 ml-auto">{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {def?.configFields?.length ? (
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Configuration</div>
            {def.configFields.map((field) => {
              // Special: Polymarket market selector
              if (defId === "polymarket" && field.key === "marketId") {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {field.label}
                      {field.required && <span className="text-accent ml-0.5">*</span>}
                    </label>
                    <MarketSearch
                      value={String(config.marketId ?? "")}
                      questionValue={String(config.marketQuestion ?? "")}
                      onSelect={(market) => {
                        // Batch both fields in one update to avoid stale closure
                        updateNodeConfig(node!.id, {
                          ...config,
                          marketId: market.id ? (market.conditionId || market.id) : "",
                          marketQuestion: market.id ? market.question : "",
                        });
                      }}
                    />
                  </div>
                );
              }
              // Hide the marketQuestion field (it's set automatically by MarketSearch)
              if (defId === "polymarket" && field.key === "marketQuestion") {
                return null;
              }
              // Wallet token select (from connected wallet balances)
              if (field.type === "wallet-token-select") {
                const nameKey = field.key + "Name";
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {field.label}
                      {field.required && <span className="text-accent ml-0.5">*</span>}
                    </label>
                    <WalletTokenSelect
                      value={String(config[field.key] ?? "")}
                      displayName={String(config[nameKey] ?? "")}
                      onSelect={(token) => {
                        updateNodeConfig(node!.id, {
                          ...config,
                          [field.key]: token ? token.symbol : "",
                          [nameKey]: token ? token.name : "",
                        });
                      }}
                    />
                  </div>
                );
              }
              // Token search fields
              if (field.type === "token-search") {
                const nameKey = field.key + "Name";
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {field.label}
                      {field.required && <span className="text-accent ml-0.5">*</span>}
                    </label>
                    <TokenSearch
                      value={String(config[field.key] ?? "")}
                      displayName={String(config[nameKey] ?? "")}
                      onSelect={(token) => {
                        updateNodeConfig(node!.id, {
                          ...config,
                          [field.key]: token ? token.symbol : "",
                          [nameKey]: token ? token.name : "",
                        });
                      }}
                    />
                  </div>
                );
              }
              // Hide auto-set token name fields
              if (field.key === "fromTokenName" || field.key === "toTokenName") {
                return null;
              }
              return (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={config[field.key] ?? field.defaultValue}
                  onChange={handleFieldChange}
                  upstreamNodes={field.type === "text" || field.type === "textarea" ? upstreamNodes : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-600 text-center py-4">No configuration required</div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-default">
        <button
          onClick={handleDelete}
          className="w-full py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          Delete node
        </button>
      </div>
    </aside>
  );
}
