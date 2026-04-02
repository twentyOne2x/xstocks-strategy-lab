import { create } from "zustand";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function ToastItemView({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const colors = {
    success: "border-green-500/40 bg-green-500/10 text-green-400",
    error: "border-red-500/40 bg-red-500/10 text-red-400",
    info: "border-accent/40 bg-accent/10 text-accent",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg ${colors[toast.type]} animate-slide-in`}
    >
      <span className="text-sm">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100 text-xs">
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItemView key={t.id} toast={t} />
      ))}
    </div>
  );
}
