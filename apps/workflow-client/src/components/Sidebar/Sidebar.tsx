import { useState } from "react";
import { triggers, actions } from "@xstocks/workflow-shared";
import { useUIStore } from "../../store/uiStore";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { ItemCard } from "./ItemCard";
import type { NodeCategory } from "@xstocks/workflow-shared";

export function Sidebar() {
  const { sidebarTab, sidebarFilter, sidebarSearch, setSidebarTab, setSidebarFilter, setSidebarSearch } = useUIStore();
  const [collapsed, setCollapsed] = useState(false);

  const items = sidebarTab === "trigger" ? triggers : actions;

  if (collapsed) {
    return (
      <aside className="w-10 flex-shrink-0 bg-surface-0 border-r border-border-default flex flex-col items-center py-3">
        <button
          onClick={() => setCollapsed(false)}
          className="text-gray-500 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    );
  }

  const filtered = items.filter((item) => {
    if (sidebarFilter !== "all" && item.category !== (sidebarFilter as NodeCategory)) return false;
    if (sidebarSearch && !item.name.toLowerCase().includes(sidebarSearch.toLowerCase()) &&
        !item.description.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-0 border-r border-border-default flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nodes</h2>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-500 hover:text-white transition-colors"
            title="Collapse sidebar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        {/* Tab switcher */}
        <div className="flex bg-surface-2 rounded-lg p-0.5 mb-3">
          {(["trigger", "action"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                sidebarTab === tab ? "bg-surface-3 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
        <SearchBar value={sidebarSearch} onChange={setSidebarSearch} />
      </div>

      {/* Filter */}
      <div className="px-3 py-2 border-b border-border-default">
        <CategoryFilter value={sidebarFilter as "all" | NodeCategory} onChange={setSidebarFilter} />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">No results</div>
        ) : (
          filtered.map((def) => <ItemCard key={def.id} def={def} />)
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border-default">
        <p className="text-[10px] text-gray-600 text-center">Drag nodes onto the canvas</p>
      </div>
    </aside>
  );
}
