// The landing page's live fact (PRD §14 `/`): Strike's largest user vault, read from the public API
// with no auth headers (PRD §12.1), and a snapshot to fall back on when Strike can't be reached.
import "server-only";

const HOST = process.env.STRIKE_ENV === "testnet" ? "https://api-v2-testnet.strikefinance.org" : "https://api.strikefinance.org";

export type LiveVault = {
  vaultId: string;
  name: string;
  leaderNickname: string;
  equity: number;
  sharePrice: number;
  lockupDays: number;
  leaderFeePct: number;
  positionCount: number;
  at20x: number;
  effectiveLeverage: number;
  leaderSharePct: number | null;
  heldSymbols: string[];
  takenAt: number; // ms UTC
  source: "live" | "snapshot";
};

// Read on Oct 22, 2026 at 21:04 UTC+1 from the same endpoints.
export const FALLBACK: LiveVault = {
  vaultId: "2e782d92-86f0-48f2-9171-eb0c4633656e",
  name: "Glacier Arc Digital",
  leaderNickname: "GlacierArcDigital",
  equity: 41743.69,
  sharePrice: 0.666,
  lockupDays: 1,
  leaderFeePct: 25,
  positionCount: 18,
  at20x: 13,
  effectiveLeverage: 1.118,
  leaderSharePct: 86.08,
  heldSymbols: [
    "BTC-USD", "XRP-USD", "NEAR-USD", "ETH-USD", "HYPE-USD", "ADA-USD", "SOL-USD", "XAG-USD", "SNDK-USD",
    "CXMT-USD", "NVDA-USD", "XAU-USD", "TSLA-USD", "SKHYNIX-USD", "WTI-USD", "MINIMAX-USD", "MU-USD", "SPCX-USD",
  ],
  takenAt: Date.UTC(2026, 9, 22, 20, 4, 0),
  source: "snapshot",
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(HOST + path, { next: { revalidate: 30 }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

type VaultRow = {
  vault_id: string; type: string; name: string; nickname: string; equity: string; share_price: string;
  lockup_days: number; leader_commission_bps: number;
};
type Position = { symbol: string; size: string; leverage: number; entry_price: string; upnl: string };
type Market = { symbol: string; mark_price?: string };
type Depositor = { nickname?: string; share_percentage: string };

export async function readLargestUserVault(): Promise<LiveVault> {
  try {
    const { vaults } = await get<{ vaults: VaultRow[] }>("/v2/vaults");
    const v = vaults.filter((x) => x.type === "user").sort((a, b) => Number(b.equity) - Number(a.equity))[0];
    if (!v) return FALLBACK;
    const [{ positions }, { markets }, deps] = await Promise.all([
      get<{ positions: Position[] }>(`/v2/positions?vault_id=${v.vault_id}`),
      get<{ markets: Record<string, Market> }>("/v2/markets"),
      get<{ depositors: Depositor[] }>(`/v2/vault/${v.vault_id}/depositors`).catch(() => ({ depositors: [] })),
    ]);
    const equity = Number(v.equity);
    const open = positions.filter((p) => Number(p.size) !== 0);
    // R1: Σ|size × mark| ÷ equity. A missing mark falls back to entry (a degraded read, PRD §9).
    const notional = open.reduce((sum, p) => {
      const mark = Number(markets[p.symbol]?.mark_price ?? p.entry_price);
      return sum + Math.abs(Number(p.size) * mark);
    }, 0);
    // R4: the leader row is matched by nickname only; anything less certain is reported unknown.
    const leaderRow = deps.depositors.find((d) => d.nickname && d.nickname === v.nickname);
    return {
      vaultId: v.vault_id,
      name: v.name,
      leaderNickname: v.nickname,
      equity,
      sharePrice: Number(v.share_price),
      lockupDays: v.lockup_days,
      leaderFeePct: v.leader_commission_bps / 100,
      positionCount: open.length,
      at20x: open.filter((p) => p.leverage === 20).length,
      effectiveLeverage: equity > 0 ? notional / equity : Infinity,
      leaderSharePct: leaderRow ? Number(leaderRow.share_percentage) : null,
      heldSymbols: open.map((p) => p.symbol),
      takenAt: Date.now(),
      source: "live",
    };
  } catch (err) {
    console.error("[live] falling back to snapshot:", (err as Error).message);
    return FALLBACK;
  }
}
