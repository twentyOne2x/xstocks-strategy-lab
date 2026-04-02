import { useState, useRef, useEffect } from "react";

interface Market {
  id: string;
  question: string;
  slug: string;
  image: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  volume24hr: number;
  endDate: string;
  conditionId: string;
  clobTokenIds: string[];
}

interface Props {
  value: string; // marketId
  questionValue: string;
  onSelect: (market: Market) => void;
}

export function MarketSearch({ value, questionValue, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/polymarket/markets?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);
  }, [query]);

  const selected = value && questionValue;

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border-default rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">{questionValue}</div>
          </div>
          <button
            onClick={() => onSelect({ id: "", question: "", slug: "", image: "", outcomes: [], outcomePrices: [], volume: 0, volume24hr: 0, endDate: "", conditionId: "", clobTokenIds: [] })}
            className="text-gray-500 hover:text-white text-xs flex-shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            placeholder="Search Polymarket..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.trim() && setOpen(true)}
          />
          {open && (results.length > 0 || loading) && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto bg-surface-1 border border-border-default rounded-lg shadow-xl">
              {loading && <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>}
              {results.map((market) => {
                const yesPrice = market.outcomePrices?.[0];
                const pct = yesPrice != null ? `${Math.round(Number(yesPrice) * 100)}%` : "—";
                return (
                  <button
                    key={market.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(market);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors border-b border-border-subtle last:border-b-0"
                  >
                    <div className="text-xs text-white leading-snug">{market.question}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span className="text-green-400 font-medium">Yes {pct}</span>
                      <span>Vol: ${market.volume24hr != null ? Math.round(market.volume24hr).toLocaleString() : "—"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
