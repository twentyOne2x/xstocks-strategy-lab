/* ──────────────────────────────────────────────
   Holdings display helpers
   Clean labels and truthful links for assets and venues
   ────────────────────────────────────────────── */

/**
 * Maps known xStocks asset symbols to their canonical public page.
 * Only includes symbols with a real, verifiable destination.
 */
const assetLinks: Record<string, string> = {
  NVDAx: "https://app.xstocks.fi/asset/NVDAx",
  AVGOx: "https://app.xstocks.fi/asset/AVGOx",
  MSFTx: "https://app.xstocks.fi/asset/MSFTx",
  AAPLx: "https://app.xstocks.fi/asset/AAPLx",
  GOOGLx: "https://app.xstocks.fi/asset/GOOGLx",
  SPYx: "https://app.xstocks.fi/asset/SPYx",
  MSTRx: "https://app.xstocks.fi/asset/MSTRx",
};

/**
 * Maps raw venue identifiers to clean user-facing labels and optional links.
 */
const venueMap: Record<string, { label: string; href?: string }> = {
  "xChange": { label: "xChange", href: "https://app.xstocks.fi/xchange" },
  "xChange / Cow Swap": { label: "xChange / CoW", href: "https://app.xstocks.fi/xchange" },
  "xChange / 1inch": { label: "xChange / 1inch", href: "https://app.xstocks.fi/xchange" },
  "xChange basket route": { label: "xChange", href: "https://app.xstocks.fi/xchange" },
  "xChange spot route": { label: "xChange", href: "https://app.xstocks.fi/xchange" },
  "Cow Swap": { label: "CoW Protocol", href: "https://swap.cow.fi" },
  "1inch": { label: "1inch", href: "https://app.1inch.io" },
  "Smart account balance": { label: "Smart account" },
  "smart_account_balance": { label: "Smart account" },
  "Smart account": { label: "Smart account" },
  "Directional route shell": { label: "Directional vault" },
  "Directional vault shell": { label: "Directional vault" },
  "flowdesk_ausd_rwa_strategy": { label: "Morpho vault", href: "https://app.morpho.org" },
};

const assetDescriptions: Record<string, string> = {
  NVDAx: "NVIDIA Corporation — AI chip leader. Designs GPUs powering AI training and inference worldwide.",
  AVGOx: "Broadcom Inc — Semiconductor and infrastructure software. Supplies networking and custom AI chips.",
  MSFTx: "Microsoft Corporation — Cloud and AI platform. Azure, Office 365, and enterprise software leader.",
  AAPLx: "Apple Inc — Consumer electronics and services. iPhone, Mac, and growing services revenue.",
  GOOGLx: "Alphabet Inc — Search, advertising, and cloud. Owns Google, YouTube, and Waymo.",
  SPYx: "S&P 500 ETF — Broad US equity market exposure. Tracks the 500 largest US companies.",
  MSTRx: "MicroStrategy — Business intelligence and Bitcoin treasury company.",
  USDC: "USD Coin — Stablecoin pegged 1:1 to the US dollar. Used as the cash reserve in portfolios.",
};

export function getAssetDescription(symbol: string): string | null {
  return assetDescriptions[symbol] ?? null;
}

export function getAssetHref(symbol: string): string | null {
  return assetLinks[symbol] ?? null;
}

export function getVenueDisplay(rawVenue: string): { label: string; href: string | null } {
  const mapped = venueMap[rawVenue];
  if (mapped) return { label: mapped.label, href: mapped.href ?? null };
  // Clean up unknown venue IDs: replace underscores, title case
  const cleaned = rawVenue
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label: cleaned, href: null };
}

/**
 * Returns a clean, user-facing rationale for a holding.
 * Falls back to the sleeve name if the rationale is missing or internal-sounding.
 */
export function getCleanRationale(rationale: string | undefined, sleeve: string): string {
  if (!rationale) return formatSleeve(sleeve);

  // Catch internal-sounding fallback text
  const internalPatterns = [
    "carried forward from the promoted manifest",
    "role carried forward",
    "from the promoted",
    "from the manifest",
  ];
  const lower = rationale.toLowerCase();
  if (internalPatterns.some((p) => lower.includes(p))) {
    return formatSleeve(sleeve);
  }

  return rationale;
}

function formatSleeve(sleeve: string): string {
  const mapped: Record<string, string> = {
    "Core leader": "Core holding: drives portfolio growth",
    "Throughput kicker": "Growth driver: adds revenue breadth",
    "Quality ballast": "Stability anchor: reduces overall risk",
    "Reserve buffer": "Cash reserve: available for rebalancing or withdrawal",
    "core_leader": "Core holding: drives portfolio growth",
    "throughput_kicker": "Growth driver: adds revenue breadth",
    "quality_ballast": "Stability anchor: reduces overall risk",
    "reserve_buffer": "Cash reserve: available for rebalancing or withdrawal",
    "cash_buffer": "Cash reserve: available for rebalancing or withdrawal",
    "Core holding": "Core holding: drives portfolio growth",
    "Core beta": "Core index exposure",
    "Quality growth": "Quality growth: balances the portfolio",
    "Cash buffer": "Cash reserve: available for rebalancing or withdrawal",
  };
  return mapped[sleeve] ?? sleeve.replace(/_/g, " ");
}
