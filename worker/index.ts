// Rescind worker (PRD §16): polls each watched vault, evaluates the mandate, files and cancels
// withdrawals, and writes receipts. Run: npx tsx worker/index.ts
import { randomBytes } from "node:crypto";
import { drain, type Command } from "../lib/commands";
import { get, signed, StrikeError } from "../lib/strike/client";
import { decryptPrivateKey } from "../lib/strike/sign";
import { log, readState, writeState, type State, type StoredWatch } from "../lib/store";
import type { Fill, Receipt } from "../lib/sample";
import { breachLabel, effectiveLeverage, evaluate, type Snapshot } from "./rules";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* env from the shell */
}

const DAY = 86_400_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rid = () => "rc_" + randomBytes(8).toString("base64url").slice(0, 10);
let stopping = false;
process.on("SIGINT", () => (stopping = true));
process.on("SIGTERM", () => (stopping = true));

type VaultRow = { name: string; nickname: string; equity: string; share_price: string; status: string; lockup_days: number };
type PosRow = { symbol: string; size: string; entry_price: string };
type MarketRow = { symbol: string; mark_price?: string };
type HistRow = { id: string; status: string; timestamp: number; execute_at_timestamp?: number; executed_timestamp?: number; shares_burned?: string; estimated_usd?: string; actual_usd?: string };
type FillRow = { id: number | string; symbol: string; side: string; price: string; size: string; timestamp: number };

function keys(s: State) {
  if (!s.account || s.account.status !== "active") return null;
  return { publicKey: s.account.publicKey, privateKey: decryptPrivateKey(s.account.privateKeyEnc) };
}

async function snapshot(vaultId: string, marks: Map<string, number>): Promise<Snapshot> {
  const t0 = Date.now();
  const [v, p, d] = await Promise.all([
    get<VaultRow>(`/v2/vault/${vaultId}`),
    get<{ positions: PosRow[] }>(`/v2/positions?vault_id=${vaultId}`),
    get<{ depositors: { nickname?: string; share_percentage: string }[] }>(`/v2/vault/${vaultId}/depositors`).catch(() => ({ depositors: [] })),
  ]);
  let degraded = false;
  const positions = p.positions
    .filter((x) => Number(x.size) !== 0)
    .map((x) => {
      const m = marks.get(x.symbol);
      if (m === undefined) degraded = true;
      return { symbol: x.symbol, size: Number(x.size), mark: m ?? Number(x.entry_price), markFromEntry: m === undefined };
    });
  const leader = d.depositors.find((r) => r.nickname && r.nickname === v.nickname);
  return {
    takenAt: Date.now(),
    latencyMs: Date.now() - t0,
    equity: Number(v.equity),
    sharePrice: Number(v.share_price),
    status: v.status,
    leaderNickname: v.nickname,
    positions,
    leaderSharePct: leader ? Number(leader.share_percentage) : null,
    degraded,
  };
}

async function breachingFill(vaultId: string, since: number, symbols: string[]): Promise<Fill> {
  const r = await get<{ fills?: FillRow[]; history?: FillRow[] } | FillRow[]>(`/v2/history/fill?vault_id=${vaultId}&limit=50`);
  const rows = (Array.isArray(r) ? r : r.fills ?? r.history ?? []).sort((a, b) => a.timestamp - b.timestamp);
  const pick = rows.find((f) => f.timestamp >= since && (!symbols.length || symbols.includes(f.symbol))) ?? rows.at(-1);
  return pick
    ? { id: String(pick.id), symbol: pick.symbol, side: pick.side.toLowerCase().startsWith("b") ? "buy" : "sell", size: Number(pick.size), price: Number(pick.price), ts: pick.timestamp }
    : { id: "—", symbol: "—", side: "buy", size: 0, price: 0, ts: since };
}

async function file(s: State, w: StoredWatch, snap: Snapshot, reason: "breach" | "manual") {
  const k = keys(s);
  if (!k) return log(s, w.id, { ts: Date.now(), kind: "error", text: "Can't file: no verified key", detail: "Run scripts/rescind.ts verify." });
  // Idempotency (PRD §10.2): never file while one is already pending for this account and vault.
  const pending = await signed<{ history: HistRow[] }>("GET", `/v2/vault/history?vault_id=${w.vaultId}&type=withdrawal&status=pending&limit=5`, k);
  if (pending.history.length) {
    log(s, w.id, { ts: Date.now(), kind: "filing", text: "Skipped filing: a withdrawal is already pending", detail: pending.history[0].id });
    return;
  }
  const confirmedAt = Date.now();
  const res = await signed<{ request_id: string }>("POST", "/v2/vault/withdraw", k, { vault_id: w.vaultId, withdraw_all: true });
  const requestedAt = Date.now();
  const breachedSymbols = w.rules.find((r) => r.rule === "markets" && r.status === "breach") ? [] : snap.positions.map((p) => p.symbol);
  const fill = await breachingFill(w.vaultId, w.lastPassAt ?? w.createdAt, breachedSymbols).catch(() => ({ id: "—", symbol: "—", side: "buy" as const, size: 0, price: 0, ts: requestedAt }));
  const prev = s.receipts.filter((r) => r.watchId === w.id).at(-1);
  const receipt: Receipt = {
    id: rid(),
    watchId: w.id,
    vaultId: w.vaultId,
    vaultName: w.vaultName,
    lockupDays: w.lockupDays,
    mandateVersion: w.mandates[0].version,
    public: false,
    rules: w.rules,
    breachedLabel: reason === "manual" ? "Filed by hand" : breachLabel(w.rules),
    fill,
    confirmedAt,
    snapshotLatencyMs: snap.latencyMs,
    withdrawal: { id: res.request_id, requestedAt, executeAt: requestedAt + w.lockupDays * DAY, status: "pending", shares: 0, estimatedUsd: 0 },
    prev: prev?.id,
  };
  if (prev) prev.next = receipt.id;
  s.receipts.push(receipt);
  w.pendingReceiptId = receipt.id;
  w.state = "armed_pending";
  log(s, w.id, { ts: requestedAt, kind: "filing", text: `Withdrawal filed: ${res.request_id.slice(0, 8)}…`, detail: `POST /v2/vault/withdraw, withdraw_all. ${requestedAt - confirmedAt} ms.` });
}

async function trackPending(s: State, w: StoredWatch) {
  const r = s.receipts.find((x) => x.id === w.pendingReceiptId);
  if (!r) return;
  const h = await get<{ history: HistRow[] }>(`/v2/vault/${w.vaultId}/history?type=withdrawal&limit=50`);
  const row = h.history.find((x) => x.id === r.withdrawal.id);
  if (!row) return;
  r.withdrawal.requestedAt = row.timestamp;
  if (row.execute_at_timestamp) r.withdrawal.executeAt = row.execute_at_timestamp;
  r.withdrawal.shares = Number(row.shares_burned ?? r.withdrawal.shares);
  r.withdrawal.estimatedUsd = Number(row.estimated_usd ?? r.withdrawal.estimatedUsd);
  if (row.status === "cancelled" && r.withdrawal.status !== "cancelled") {
    r.withdrawal.status = "cancelled";
    r.withdrawal.cancelledAt = row.executed_timestamp ?? Date.now();
    w.pendingReceiptId = undefined;
    w.state = w.mode === "armed" ? "armed_clear" : w.state;
    log(s, w.id, { ts: r.withdrawal.cancelledAt, kind: "cancel", text: `Withdrawal cancelled: ${r.withdrawal.id.slice(0, 8)}… · cost $0.00`, detail: "Strike history row status cancelled. Shares unlocked." });
  } else if (row.status === "completed") {
    r.withdrawal.status = "completed";
    w.pendingReceiptId = undefined;
    w.state = "exited";
    log(s, w.id, { ts: row.executed_timestamp ?? Date.now(), kind: "execution", text: `Withdrawal executed: $${row.actual_usd ?? "?"}`, detail: "The watch has exited." });
  }
}

async function cancel(s: State, w: StoredWatch, auto: boolean) {
  const k = keys(s);
  const r = s.receipts.find((x) => x.id === w.pendingReceiptId);
  if (!k || !r) return;
  try {
    await signed("POST", `/v2/vault/${w.vaultId}/withdrawals/${r.withdrawal.id}/cancel`, k);
    w.state = "armed_cancelling";
    if (auto) w.autoCancelTimes.push(Date.now());
    log(s, w.id, { ts: Date.now(), kind: "cancel", text: `${auto ? "Cure confirmed. " : ""}Cancel sent: ${r.withdrawal.id.slice(0, 8)}…`, detail: auto ? `${s.settings.cureConfirmN} passing reads.` : "Cancelled by hand." });
  } catch (e) {
    // 404: already executed or cancelled (PRD §10.2); the next history read decides.
    log(s, w.id, { ts: Date.now(), kind: "error", text: `Cancel answered ${(e as StrikeError).status ?? ""} ${(e as Error).message}`, detail: "Re-reading history." });
  }
}

function apply(s: State, c: Command) {
  const w = "watchId" in c ? s.watches.find((x) => x.id === c.watchId) : undefined;
  const now = Date.now();
  switch (c.type) {
    case "create_watch":
      if (s.watches.some((x) => x.vaultId === c.vaultId)) return;
      s.watches.push({
        id: "w_" + randomBytes(4).toString("hex"),
        vaultId: c.vaultId,
        vaultName: c.vaultId.slice(0, 8),
        lockupDays: 1,
        mode: c.mode,
        state: c.mode === "armed" ? "armed_clear" : "dry_run",
        autoCancel: c.autoCancel,
        autoCancelTimes: [],
        peakSharePrice: 0,
        mandates: [{ ...c.mandate, version: 1, createdAt: now }],
        rules: [],
        breachStreak: 0,
        cureStreak: 0,
        evaluations: 0,
        createdAt: now,
      });
      log(s, s.watches.at(-1)!.id, { ts: now, kind: "config", text: `Watch created, ${c.mode === "armed" ? "armed" : "dry run"}, mandate v1` });
      return;
    case "new_mandate":
      if (!w) return;
      w.mandates.unshift({ ...c.mandate, version: w.mandates[0].version + 1, createdAt: now });
      return log(s, w.id, { ts: now, kind: "config", text: `Mandate v${w.mandates[0].version} saved` });
    case "set_mode":
      if (!w) return;
      w.mode = c.mode;
      if (c.mode === "armed") w.peakSharePrice = 0; // re-seeded on the next read (PRD §9 R3)
      return log(s, w.id, { ts: now, kind: "config", text: `Mode set to ${c.mode.replace("_", " ")}` });
    case "set_auto_cancel":
      if (w) w.autoCancel = c.on;
      return;
    case "keep":
      if (w) w.autoCancel = false;
      return w && log(s, w.id, { ts: now, kind: "config", text: "Kept: auto-cancel off for this withdrawal" });
    case "publish": {
      const r = s.receipts.find((x) => x.id === c.receiptId);
      if (r) r.public = c.public;
      return;
    }
    case "settings":
      Object.assign(s.settings, c.values);
      return;
  }
}

async function tick() {
  const s = readState();
  const cmds = drain();
  for (const c of cmds) if (c.type !== "cancel" && c.type !== "file_now") apply(s, c);
  const active = s.watches.filter((w) => w.mode !== "paused" && w.state !== "exited");
  let marks = new Map<string, number>();
  if (active.length) {
    const m = await get<{ markets: Record<string, MarketRow> }>("/v2/markets");
    marks = new Map(Object.values(m.markets).filter((x) => x.mark_price).map((x) => [x.symbol, Number(x.mark_price)]));
  }
  for (const w of active) {
    try {
      const snap = await snapshot(w.vaultId, marks);
      if (w.vaultName.length <= 8) {
        const v = await get<VaultRow>(`/v2/vault/${w.vaultId}`);
        w.vaultName = v.name;
        w.lockupDays = v.lockup_days;
      }
      if (!w.peakSharePrice) w.peakSharePrice = snap.sharePrice;
      w.peakSharePrice = Math.max(w.peakSharePrice, snap.sharePrice);
      const { rules, overall } = evaluate(w.mandates[0], snap, w.peakSharePrice);
      w.rules = rules;
      w.evaluations++;
      w.lastReadAt = snap.takenAt;
      w.lastError = undefined;
      w.snapshot = { equity: snap.equity, sharePrice: snap.sharePrice, effectiveLeverage: effectiveLeverage(snap), positions: snap.positions.map(({ symbol, size, mark }) => ({ symbol, size, mark })) };
      // Degraded reads never confirm a breach or a cure on their own (PRD §9 R1).
      if (overall === "breach" && !snap.degraded) {
        w.breachStreak++;
        w.cureStreak = 0;
      } else if (overall === "pass") {
        w.cureStreak++;
        w.breachStreak = 0;
        w.lastPassAt = snap.takenAt;
      }
      log(s, w.id, { ts: snap.takenAt, kind: "evaluation", text: overall === "breach" ? (w.pendingReceiptId ? "Breaching reads, withdrawal already pending" : w.mode === "dry_run" ? "Breaching reads, dry run" : "Breaching reads") : overall === "pass" ? "Passing reads" : "Reads with a rule unknown" });

      if (w.pendingReceiptId) await trackPending(s, w);

      const manual = cmds.find((c) => (c.type === "cancel" || c.type === "file_now") && c.watchId === w.id);
      if (manual?.type === "cancel" && w.pendingReceiptId) {
        await cancel(s, w, false);
        if (manual.pause) w.mode = "paused";
      }
      if (manual?.type === "file_now" && !w.pendingReceiptId && w.mode === "armed") await file(s, w, snap, "manual");

      if (w.breachStreak === s.settings.breachConfirmN) {
        log(s, w.id, { ts: snap.takenAt, kind: "breach", text: `${w.mode === "dry_run" ? "Would file: " : "Breach confirmed: "}${breachLabel(rules)}`, detail: `${w.breachStreak} breaching reads in a row.` });
      }
      if (w.mode === "armed" && !w.pendingReceiptId && w.breachStreak >= s.settings.breachConfirmN) await file(s, w, snap, "breach");

      const r = s.receipts.find((x) => x.id === w.pendingReceiptId);
      const recentAutoCancels = w.autoCancelTimes.filter((t) => Date.now() - t < DAY).length;
      if (
        r && r.withdrawal.status === "pending" && w.state === "armed_pending" && w.autoCancel &&
        w.cureStreak >= s.settings.cureConfirmN && Date.now() - r.withdrawal.requestedAt >= s.settings.cureGraceS * 1000
      ) {
        if (recentAutoCancels >= s.settings.maxAutoCancels24h) {
          w.autoCancel = false; // flapping guard (PRD FR-23)
          log(s, w.id, { ts: Date.now(), kind: "config", text: "Auto-cancel turned off: flapping guard", detail: `${recentAutoCancels} automatic cancels in 24 h.` });
        } else {
          r.cure = { confirmedAt: Date.now(), note: `All rules passing for ${w.cureStreak} reads. ${breachLabel(rules) || "Effective leverage " + effectiveLeverage(snap).toFixed(2) + "x."}` };
          await cancel(s, w, true);
        }
      }
    } catch (e) {
      w.lastError = (e as Error).message;
      log(s, w.id, { ts: Date.now(), kind: "error", text: `Read failed: ${(e as Error).message}`, detail: "Stale read. It can't confirm a breach or a cure." });
    }
  }
  s.heartbeatAt = Date.now();
  writeState(s);
  return s.settings.pollIntervalS;
}

async function main() {
  console.log("[worker] started");
  while (!stopping) {
    const t0 = Date.now();
    let interval = 5;
    try {
      interval = await tick();
    } catch (e) {
      console.error("[worker] tick failed:", (e as Error).message);
    }
    await sleep(Math.max(500, interval * 1000 - (Date.now() - t0)));
  }
  console.log("[worker] stopped");
}

main();
