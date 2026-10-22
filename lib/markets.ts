// Market groups for the allowed-markets rule (PRD §9 R2). Strike's /v2/markets has no category
// field, so groups are a static map over the live symbol list. Groups are a convenience only:
// a stored mandate is always the explicit symbol list.

export type MarketGroup = "crypto" | "stocks" | "indices" | "commodities";

export const GROUP_LABEL: Record<MarketGroup, string> = {
  crypto: "Crypto",
  stocks: "Stock perps",
  indices: "Indices",
  commodities: "Commodities",
};

const CRYPTO = ["ADA", "BNB", "BTC", "DOGE", "ETH", "HYPE", "LIT", "NEAR", "NIGHT", "PUMP", "SOL", "XRP", "ZEC"];
const INDICES = ["NAS100", "SP500"];
const COMMODITIES = ["WTI", "XAG", "XAU"];

export const CRYPTO_MAJORS = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"];

export function groupOf(symbol: string): MarketGroup {
  const base = symbol.replace(/-USD$/, "");
  if (CRYPTO.includes(base)) return "crypto";
  if (INDICES.includes(base)) return "indices";
  if (COMMODITIES.includes(base)) return "commodities";
  return "stocks";
}

// The 33 markets live on Oct 22, 2026 (GET /v2/markets).
export const ALL_MARKETS = [
  "AAOI-USD", "ADA-USD", "BNB-USD", "BTC-USD", "COIN-USD", "CRCL-USD", "CXMT-USD", "DOGE-USD", "DRAM-USD",
  "ETH-USD", "GOOGL-USD", "HYPE-USD", "LIT-USD", "MINIMAX-USD", "MU-USD", "NAS100-USD", "NEAR-USD",
  "NIGHT-USD", "NVDA-USD", "PUMP-USD", "SKHYNIX-USD", "SNDK-USD", "SOL-USD", "SP500-USD", "SPCX-USD",
  "TSLA-USD", "UNITREE-USD", "WTI-USD", "XAG-USD", "XAU-USD", "XRP-USD", "ZEC-USD", "ZHIPU-USD",
];

export function marketsIn(group: MarketGroup, markets: string[] = ALL_MARKETS) {
  return markets.filter((m) => groupOf(m) === group);
}

export const short = (symbol: string) => symbol.replace(/-USD$/, "");
