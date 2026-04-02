import { useState, useRef, useEffect } from "react";

interface Token {
  symbol: string;
  name: string;
  underlyingSymbol: string;
  logo: string;
  deployment: string;
}

interface Props {
  value: string; // symbol
  displayName: string; // human-readable name
  onSelect: (token: Token | null) => void;
}

export function TokenSearch({ value, displayName, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tokens?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  }, [query]);

  const selected = value && displayName;

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border-default rounded-lg">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-medium text-accent">{value}</span>
            <span className="text-xs text-gray-400 truncate">{displayName}</span>
          </div>
          <button
            onClick={() => onSelect(null)}
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
            placeholder="Search tokens..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.trim() && setOpen(true)}
          />
          {open && (results.length > 0 || loading) && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto bg-surface-1 border border-border-default rounded-lg shadow-xl">
              {loading && <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>}
              {results.map((token) => (
                <button
                  key={token.symbol}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(token);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors border-b border-border-subtle last:border-b-0 flex items-center gap-2"
                >
                  <img src={token.logo} alt="" className="w-5 h-5 rounded-full flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white">{token.symbol}</span>
                      <span className="text-[10px] text-gray-500">({token.underlyingSymbol})</span>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
