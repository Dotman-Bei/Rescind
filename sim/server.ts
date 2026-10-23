// A local stand-in for the parts of Strike's API that Rescind uses, answering as the Strike docs
// (strike-finance-skills, strike-vaults SKILL.md) describe. It is NOT Strike: signatures are not verified
// and the "engine" is a few timers. Run: npx tsx sim/server.ts   (port 4100)
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.SIM_PORT ?? 4100);
const DAY = 86_400_000;
export const SIM_VAULT = "5e5e5e5e-0000-4000-8000-000000000001";

const marks: Record<string, number> = { "BTC-USD": 81107.37, "ETH-USD": 2377.03, "SOL-USD": 103.08, "ADA-USD": 0.2109, "XRP-USD": 1.2961 };
const vault = {
  vault_id: SIM_VAULT,
  type: "user",
  name: "Rescind Demo Vault",
  nickname: "demo-leader",
  equity: 412.5,
  share_price: 1.0012,
  status: "active",
  lockup_days: 1,
  leader_commission_bps: 1000,
};
let positions: { symbol: string; size: number; entry_price: number }[] = [{ symbol: "SOL-USD", size: 4, entry_price: 103.08 }];
const fills: { id: number; symbol: string; side: string; price: string; size: string; timestamp: number }[] = [];
type Row = { id: string; type: "withdrawal"; status: "pending" | "cancelled" | "completed"; timestamp: number; execute_at_timestamp: number; executed_timestamp?: number; shares_burned: string; estimated_usd: string; share_price: string };
const history: Row[] = [];
const depositor = { shares: 124.06, locked: 0 };
let fillId = 4_346_100;

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

/** Leader trades ETH until effective leverage (Σ|size × mark| ÷ equity) reaches the target. */
function leverTo(target: number) {
  const others = positions.filter((p) => p.symbol !== "ETH-USD").reduce((s, p) => s + Math.abs(p.size * marks[p.symbol]), 0);
  const ethNow = positions.find((p) => p.symbol === "ETH-USD")?.size ?? 0;
  const ethTarget = Math.max(0, (target * vault.equity - others) / marks["ETH-USD"]);
  const delta = +(ethTarget - ethNow).toFixed(3);
  positions = positions.filter((p) => p.symbol !== "ETH-USD");
  if (ethTarget > 0.0005) positions.push({ symbol: "ETH-USD", size: +ethTarget.toFixed(3), entry_price: marks["ETH-USD"] });
  fills.push({ id: ++fillId, symbol: "ETH-USD", side: delta >= 0 ? "buy" : "sell", price: marks["ETH-USD"].toFixed(2), size: Math.abs(delta).toFixed(3), timestamp: Date.now() });
  return { delta, ethTarget };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const p = url.pathname;
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const b = body ? JSON.parse(body) : {};
    // --- public reads ---
    if (p === "/v2/time") return json(res, 200, { serverTime: Date.now() });
    if (p === "/v2/markets") return json(res, 200, { markets: Object.fromEntries(Object.entries(marks).map(([s, m]) => [s, { symbol: s, mark_price: String(m) }])) });
    if (p === `/v2/vault/${SIM_VAULT}`) return json(res, 200, { ...vault, equity: String(vault.equity), share_price: String(vault.share_price) });
    if (p === "/v2/positions") return json(res, 200, { positions: positions.map((x) => ({ symbol: x.symbol, size: String(x.size), entry_price: String(x.entry_price), leverage: 20 })) });
    if (p === `/v2/vault/${SIM_VAULT}/depositors`) return json(res, 200, { depositors: [{ nickname: "demo-leader", share_percentage: "69.88" }] });
    if (p === "/v2/history/fill") return json(res, 200, { count: fills.length, fills: [...fills].reverse() });
    if (p === `/v2/vault/${SIM_VAULT}/history` || p === "/v2/vault/history") {
      const status = url.searchParams.get("status");
      return json(res, 200, { history: [...history].reverse().filter((r) => !status || r.status === status) });
    }
    // --- signed reads (signature not verified here) ---
    if (p === "/v2/account") return json(res, 200, { account_id: "51a51a51-0000-4000-8000-00000000d3p0", blockchain: "simulated" });
    if (p === "/v2/sub-accounts") return json(res, 200, { sub_accounts: [] });
    if (p === "/v2/vault/position") return json(res, 200, { vault_id: SIM_VAULT, shares: String(depositor.shares), shares_locked: String(depositor.locked), available_shares: String(depositor.shares - depositor.locked) });
    // --- writes, async like Strike's engine ---
    if (req.method === "POST" && p === "/v2/vault/withdraw") {
      if (b.vault_id !== SIM_VAULT) return json(res, 200, { success: true, request_id: randomUUID(), message: "withdrawal request submitted" });
      const id = randomUUID();
      const ts = Date.now();
      setTimeout(() => {
        const shares = depositor.shares - depositor.locked;
        depositor.locked += shares;
        history.push({ id, type: "withdrawal", status: "pending", timestamp: ts, execute_at_timestamp: ts + vault.lockup_days * DAY, shares_burned: shares.toFixed(8), estimated_usd: (shares * vault.share_price).toFixed(2), share_price: String(vault.share_price) });
        console.log(`[sim] withdrawal ${id.slice(0, 8)} pending, executes ${new Date(ts + DAY).toISOString()}`);
      }, 700);
      return json(res, 200, { success: true, request_id: id, message: "withdrawal request submitted" });
    }
    const cancel = p.match(/^\/v2\/vault\/([^/]+)\/withdrawals\/([^/]+)\/cancel$/);
    if (req.method === "POST" && cancel) {
      const row = history.find((r) => r.id === cancel[2]);
      if (cancel[1] !== SIM_VAULT || !row || row.status !== "pending") return json(res, 404, { error: "withdrawal not found" });
      setTimeout(() => {
        row.status = "cancelled";
        row.executed_timestamp = Date.now();
        depositor.locked -= Number(row.shares_burned);
        console.log(`[sim] withdrawal ${row.id.slice(0, 8)} cancelled, ${row.shares_burned} shares unlocked, no fee`);
      }, 700);
      return json(res, 200, { success: true, message: "withdrawal cancelled successfully" });
    }
    // --- control: play the leader ---
    if (req.method === "POST" && p === "/sim/leverage") {
      const r = leverTo(Number(b.target));
      console.log(`[sim] leader ${r.delta >= 0 ? "buys" : "sells"} ${Math.abs(r.delta)} ETH → ${b.target}x`);
      return json(res, 200, { ok: true, ...r });
    }
    json(res, 404, { error: "not found in simulator" });
  });
});

server.listen(PORT, () => console.log(`[sim] stand-in Strike on http://localhost:${PORT} (vault ${SIM_VAULT})`));
