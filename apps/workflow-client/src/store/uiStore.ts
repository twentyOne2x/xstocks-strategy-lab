import { create } from "zustand";

interface UIStore {
  sidebarTab: "trigger" | "action";
  sidebarFilter: "all" | "on-chain" | "off-chain";
  sidebarSearch: string;
  configPanelOpen: boolean;
  setSidebarTab: (tab: "trigger" | "action") => void;
  setSidebarFilter: (filter: "all" | "on-chain" | "off-chain") => void;
  setSidebarSearch: (query: string) => void;
  setConfigPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarTab: "trigger",
  sidebarFilter: "all",
  sidebarSearch: "",
  configPanelOpen: false,
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarFilter: (filter) => set({ sidebarFilter: filter }),
  setSidebarSearch: (query) => set({ sidebarSearch: query }),
  setConfigPanelOpen: (open) => set({ configPanelOpen: open }),
}));
