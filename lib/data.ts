// What the operator screens render: live records from the worker's store when it has any,
// otherwise the sample set, so the screens never show an empty shell.
import "server-only";
import * as sample from "./sample";
import { readState, type StoredWatch } from "./store";
import type { Activity, Receipt, Vault, Watch } from "./sample";

export function isLive() {
  return readState().watches.length > 0;
}

/** "Now" for the screens: the real clock when live, the frozen sample moment otherwise. */
export function now() {
  return isLive() ? Date.now() : sample.SAMPLE_NOW;
}

function toWatch(w: StoredWatch): Watch {
  return {
    id: w.id,
    vaultId: w.vaultId,
    mode: w.mode,
    state: w.state,
    autoCancel: w.autoCancel,
    autoCancels24h: w.autoCancelTimes.filter((t) => Date.now() - t < 86_400_000).length,
    peakSharePrice: w.peakSharePrice,
    mandates: w.mandates,
    rules: w.rules,
    breachReadsInARow: w.breachStreak,
    pendingReceiptId: w.pendingReceiptId,
    evaluations: w.evaluations,
    createdAt: w.createdAt,
  };
}

function toVault(w: StoredWatch): Vault {
  const s = w.snapshot;
  return {
    id: w.vaultId,
    accountId: "vault_" + w.vaultId.slice(0, 8),
    name: w.vaultName,
    type: "user",
    status: "active",
    leader: "",
    equity: s?.equity ?? 0,
    sharePrice: s?.sharePrice ?? 0,
    feePct: 0,
    lockupDays: w.lockupDays,
    minDeposit: 0,
    depositors: 0,
    leaderSharePct: (w.rules.find((r) => r.rule === "leaderStake")?.value as number | null) ?? null,
    positions: (s?.positions ?? []).map((p) => ({ ...p, leverage: 0, margin: "cross" as const })),
    pendingInVault: [],
    mine: null,
  };
}

export function getWatches(): Watch[] {
  const s = readState();
  return s.watches.length ? s.watches.map(toWatch) : sample.watches;
}

export function getWatch(id: string): Watch | undefined {
  return getWatches().find((w) => w.id === id);
}

export function getVaultForWatch(w: Watch): Vault | undefined {
  const s = readState().watches.find((x) => x.id === w.id);
  return s ? toVault(s) : sample.vault(w.vaultId);
}

export function getReceipts(): Receipt[] {
  const s = readState();
  return s.watches.length ? s.receipts : sample.receipts;
}

export function getReceipt(id: string): Receipt | undefined {
  return readState().receipts.find((r) => r.id === id) ?? sample.receipt(id);
}

export function getActivity(watchId: string): Activity[] {
  const s = readState();
  return s.watches.length ? (s.activity[watchId] ?? []) : (sample.activity[watchId] ?? []);
}

export function getAccount() {
  const s = readState();
  if (!s.account || !s.watches.length) return { ...sample.account, live: false };
  return {
    ...sample.account,
    label: s.account.label,
    strikeAccountId: s.account.strikeAccountId ?? "",
    publicKey: s.account.publicKey,
    keyStatus: (s.account.status === "active" ? "active" : "expired") as "active" | "expired",
    keyVerifiedAt: s.account.verifiedAt ?? s.account.createdAt,
    workerHeartbeatAt: s.heartbeatAt,
    lastPollAt: s.heartbeatAt,
    network: (process.env.STRIKE_ENV === "simulated" ? "simulated" : process.env.STRIKE_ENV === "testnet" ? "testnet" : "mainnet") as "mainnet" | "testnet",
    live: true,
  };
}

export function getSettings() {
  const s = readState();
  return s.watches.length ? s.settings : sample.settings;
}
