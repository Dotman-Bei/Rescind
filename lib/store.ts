// Persistent state shared by the web app and the worker: one JSON file, written atomically.
// PRD §13 asks for SQLite; this file store holds the same records with the same shapes until that lands.
import fs from "node:fs";
import path from "node:path";
import type { Activity, Mandate, Receipt, RuleResult, WatchState, Mode } from "./sample";

export const DATA_DIR = path.join(process.cwd(), process.env.RESCIND_DATA || "data");
const FILE = path.join(DATA_DIR, "state.json");

export type StoredAccount = {
  label: string;
  strikeAccountId: string | null;
  publicKey: string;
  privateKeyEnc: { iv: string; data: string };
  status: "unverified" | "active" | "expired" | "revoked";
  createdAt: number;
  verifiedAt?: number;
};

export type StoredWatch = {
  id: string;
  vaultId: string;
  vaultName: string;
  lockupDays: number;
  mode: Mode;
  state: WatchState;
  autoCancel: boolean;
  autoCancelTimes: number[]; // ms of automatic cancels, for the 24 h flapping guard
  peakSharePrice: number;
  mandates: Mandate[]; // newest first
  rules: RuleResult[];
  breachStreak: number;
  cureStreak: number;
  lastPassAt?: number;
  pendingReceiptId?: string;
  evaluations: number;
  createdAt: number;
  lastReadAt?: number;
  lastError?: string;
  snapshot?: { equity: number; sharePrice: number; effectiveLeverage: number; positions: { symbol: string; size: number; mark: number }[] };
};

export type State = {
  account: StoredAccount | null;
  watches: StoredWatch[];
  receipts: Receipt[];
  activity: Record<string, Activity[]>;
  heartbeatAt: number;
  settings: { pollIntervalS: number; breachConfirmN: number; cureConfirmN: number; cureGraceS: number; maxAutoCancels24h: number };
};

const EMPTY: State = {
  account: null,
  watches: [],
  receipts: [],
  activity: {},
  heartbeatAt: 0,
  settings: { pollIntervalS: 5, breachConfirmN: 2, cureConfirmN: 3, cureGraceS: 30, maxAutoCancels24h: 2 },
};

export function readState(): State {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function writeState(s: State) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, FILE);
}

/** Read, change, write. Both the worker and the web app go through this. */
export function update<T>(fn: (s: State) => T): T {
  const s = readState();
  const out = fn(s);
  writeState(s);
  return out;
}

export function log(s: State, watchId: string, a: Activity) {
  const list = (s.activity[watchId] ??= []);
  // Runs of identical evaluations collapse into one summarised row (FRONTEND.md §3.13).
  const top = list[0];
  if (a.kind === "evaluation" && top?.kind === "evaluation" && top.text === a.text) {
    top.until = a.ts;
    top.count = (top.count ?? 1) + 1;
    return;
  }
  list.unshift(a.kind === "evaluation" ? { ...a, count: 1, until: a.ts } : a);
  if (list.length > 300) list.length = 300;
}

export const hasLiveData = () => readState().watches.length > 0;
