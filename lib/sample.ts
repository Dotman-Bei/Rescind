// Sample data for the app screens until the PRD §15 routes exist. Every figure that appears twice is
// one value here, and every derived figure (gaps, time left, totals) is computed, never typed.
// Replace before launch; docs/FRONTEND.md §6 lists what is sample.

const t = (h: number, m: number, s: number, ms = 0, d = 22) => Date.UTC(2026, 9, d, h, m, s, ms);
const DAY = 86_400_000;

/** "Now" for sample screens: Oct 22, 2026, 21:10 in Lagos (20:10 UTC). */
export const SAMPLE_NOW = t(20, 10, 0);

export const API = "https://api.strikefinance.org";

export type RuleId = "leverage" | "markets" | "drawdown" | "leaderStake";
export type RuleStatus = "pass" | "breach" | "unknown" | "off";

export type RuleResult = {
  rule: RuleId;
  status: RuleStatus;
  value: number | null; // leverage x, drawdown %, stake %, count of disallowed markets
  limit: number | null;
  detail?: string;
};

export type Fill = { id: string; symbol: string; side: "buy" | "sell"; size: number; price: number; ts: number };

export type Withdrawal = {
  id: string;
  requestedAt: number;
  executeAt: number;
  status: "pending" | "cancelled" | "completed" | "failed";
  cancelledAt?: number;
  shares: number;
  estimatedUsd: number;
};

export type Receipt = {
  id: string;
  watchId: string;
  vaultId: string;
  vaultName: string;
  lockupDays: number;
  mandateVersion: number;
  public: boolean;
  rules: RuleResult[];
  breachedLabel: string;
  fill: Fill;
  confirmedAt: number;
  snapshotLatencyMs: number;
  withdrawal: Withdrawal;
  cure?: { confirmedAt: number; note: string };
  prev?: string;
  next?: string;
};

export const DEMO_VAULT_ID = "9c41e0b7-2f6a-4d38-b1e5-7a0c3d9f6e21";

const r1Request = t(10, 3, 18, 902);
const r2Request = t(13, 41, 58, 877);

export const receipts: Receipt[] = [
  {
    id: "rc_8Hq2vXk4Tn",
    watchId: "w_demo",
    vaultId: DEMO_VAULT_ID,
    vaultName: "Rescind Demo Vault",
    lockupDays: 1,
    mandateVersion: 2,
    public: true,
    breachedLabel: "Effective leverage 14.8x > 5x",
    rules: [
      { rule: "leverage", status: "breach", value: 14.81, limit: 5 },
      { rule: "markets", status: "pass", value: 0, limit: null, detail: "ETH-USD is on your list" },
      { rule: "drawdown", status: "pass", value: 0.4, limit: 15 },
      { rule: "leaderStake", status: "off", value: null, limit: null },
    ],
    fill: { id: "4346118", symbol: "ETH-USD", side: "buy", size: 2.57, price: 2377.03, ts: t(10, 3, 12, 418) },
    confirmedAt: t(10, 3, 18, 344),
    snapshotLatencyMs: 212,
    withdrawal: {
      id: "7e2b9c14-3a5d-4f08-9b61-c2d8e4f1a370",
      requestedAt: r1Request,
      executeAt: r1Request + DAY,
      status: "cancelled",
      cancelledAt: t(10, 6, 40, 902),
      shares: 124.06,
      estimatedUsd: 124.21,
    },
    cure: { confirmedAt: t(10, 6, 38, 120), note: "Leader cut ETH to 0.52. Effective leverage 3.0x, all rules passing for 3 reads." },
    next: "rc_Zp4mW9sLqe",
  },
  {
    id: "rc_Zp4mW9sLqe",
    watchId: "w_demo",
    vaultId: DEMO_VAULT_ID,
    vaultName: "Rescind Demo Vault",
    lockupDays: 1,
    mandateVersion: 2,
    public: false,
    breachedLabel: "Effective leverage 7.9x > 5x",
    rules: [
      { rule: "leverage", status: "breach", value: 7.9, limit: 5 },
      { rule: "markets", status: "pass", value: 0, limit: null, detail: "SOL-USD is on your list" },
      { rule: "drawdown", status: "pass", value: 1.1, limit: 15 },
      { rule: "leaderStake", status: "off", value: null, limit: null },
    ],
    fill: { id: "4351907", symbol: "SOL-USD", side: "buy", size: 31.6, price: 103.08, ts: t(13, 41, 52, 604) },
    confirmedAt: t(13, 41, 58, 311),
    snapshotLatencyMs: 187,
    withdrawal: {
      id: "f41a6d02-8c3e-4b7a-a915-6e0b2d7c9f58",
      requestedAt: r2Request,
      executeAt: r2Request + DAY,
      status: "pending",
      shares: 124.06,
      estimatedUsd: 122.82,
    },
    prev: "rc_8Hq2vXk4Tn",
  },
];

export const receipt = (id: string) => receipts.find((r) => r.id === id);
export const gapMs = (r: Receipt) => r.withdrawal.requestedAt - r.fill.ts;

export const fillsUrl = (vaultId: string) => `${API}/v2/history/fill?vault_id=${vaultId}`;
export const historyUrl = (vaultId: string) => `${API}/v2/vault/${vaultId}/history`;

export const RULE_LABEL: Record<RuleId, string> = {
  leverage: "Max effective leverage",
  markets: "Allowed markets",
  drawdown: "Max drawdown from peak",
  leaderStake: "Min leader stake",
};

// ---------------------------------------------------------------------------------------------
// Account, vaults, watches and activity for the operator screens.

export const account = {
  label: "Depositor 2",
  strikeAccountId: "01a2c7e4-5b1d-7f3a-9c60-3e8d4b21f9a7",
  publicKey: "3f9a1c7e5b2d4f6088a1e3c5b7d9f1a2c4e6b8d0f2a4c6e8b1d3f5a7c9e1b3d5",
  keyStatus: "active" as "active" | "expiring" | "expired",
  keyExpiresAt: Date.UTC(2026, 10, 20, 17, 12),
  keyVerifiedAt: Date.UTC(2026, 9, 21, 17, 12),
  onboarding: "paste_key" as const,
  network: "mainnet" as "mainnet" | "testnet",
  workerHeartbeatAt: SAMPLE_NOW - 2_000,
  lastPollAt: SAMPLE_NOW - 2_000,
};

export type Position = { symbol: string; size: number; mark: number; leverage: number; margin: "cross" | "isolated" };

export type Vault = {
  id: string;
  accountId: string;
  name: string;
  type: "user" | "protocol";
  status: "active" | "paused";
  leader: string;
  equity: number;
  sharePrice: number;
  feePct: number;
  lockupDays: number;
  minDeposit: number;
  depositors: number;
  leaderSharePct: number | null;
  positions: Position[];
  pendingInVault: { id: string; who: string; shares: number; requestedAt: number }[];
  mine: { shares: number; locked: number; avgEntry: number; creditEncumbered: number } | null;
};

export const notional = (p: Position) => Math.abs(p.size * p.mark);
export const effectiveLeverage = (v: Vault) =>
  v.equity > 0 ? v.positions.reduce((s, p) => s + notional(p), 0) / v.equity : Infinity;

export const vaults: Vault[] = [
  {
    id: DEMO_VAULT_ID, accountId: "vault_9c41e0b7", name: "Rescind Demo Vault", type: "user", status: "active",
    leader: "rescind-demo-leader", equity: 408.54, sharePrice: 0.9916, feePct: 10, lockupDays: 1, minDeposit: 10,
    depositors: 2, leaderSharePct: 69.88,
    positions: [{ symbol: "SOL-USD", size: 31.6, mark: 103.4, leverage: 20, margin: "cross" }],
    pendingInVault: [{ id: "f41a6d02-8c3e-4b7a-a915-6e0b2d7c9f58", who: "Depositor 2 (you)", shares: 124.06, requestedAt: r2Request }],
    mine: { shares: 124.06, locked: 124.06, avgEntry: 1.0, creditEncumbered: 0 },
  },
  {
    id: "536b4d72-687d-5e8e-a3be-cef0757c795f", accountId: "vault_536b4d72", name: "MARKET WIZARDS", type: "user", status: "active",
    leader: "MARKET WIZARDS", equity: 1835.58, sharePrice: 0.9209, feePct: 5, lockupDays: 1, minDeposit: 50,
    depositors: 5, leaderSharePct: null,
    positions: [
      { symbol: "NVDA-USD", size: 2.1, mark: 212.17, leverage: 5, margin: "cross" },
      { symbol: "XAU-USD", size: 0.12, mark: 4025.92, leverage: 10, margin: "cross" },
      { symbol: "BTC-USD", size: 0.004, mark: 81107.37, leverage: 10, margin: "cross" },
      { symbol: "SP500-USD", size: -0.05, mark: 6650.0, leverage: 5, margin: "cross" },
    ],
    pendingInVault: [],
    mine: { shares: 53.21, locked: 0, avgEntry: 0.9396, creditEncumbered: 0 },
  },
  {
    id: "207ec034-1692-4864-a19b-b0fb9ce2e7ac", accountId: "vault_207ec034", name: "Strike V.I.S.I.O.N. Strategy", type: "user", status: "active",
    leader: "V.I.S.I.O.N.", equity: 11160.03, sharePrice: 0.7102, feePct: 10, lockupDays: 1, minDeposit: 100,
    depositors: 4, leaderSharePct: 12.4,
    positions: [
      { symbol: "BTC-USD", size: 0.05, mark: 81107.37, leverage: 10, margin: "cross" },
      { symbol: "ETH-USD", size: -1.2, mark: 2377.03, leverage: 10, margin: "cross" },
      { symbol: "SOL-USD", size: 20, mark: 103.08, leverage: 10, margin: "cross" },
    ],
    pendingInVault: [],
    mine: null,
  },
  {
    id: "3fd3ab0b-318b-4f99-9ad6-66e9e917bea8", accountId: "vault_3fd3ab0b", name: "Strike Liquidity Provider (SLP)", type: "protocol", status: "active",
    leader: "Strike", equity: 1035070.99, sharePrice: 1.1526, feePct: 0, lockupDays: 1, minDeposit: 100,
    depositors: 242, leaderSharePct: null,
    positions: [
      { symbol: "BTC-USD", size: -1.5, mark: 81107.37, leverage: 5, margin: "cross" },
      { symbol: "ETH-USD", size: -20, mark: 2377.03, leverage: 5, margin: "cross" },
      { symbol: "SOL-USD", size: -300, mark: 103.08, leverage: 5, margin: "cross" },
    ],
    pendingInVault: [],
    mine: null,
  },
  {
    id: "2e782d92-86f0-48f2-9171-eb0c4633656e", accountId: "vault_2e782d92", name: "Glacier Arc Digital", type: "user", status: "active",
    leader: "GlacierArcDigital", equity: 41743.69, sharePrice: 0.666, feePct: 25, lockupDays: 1, minDeposit: 100,
    depositors: 24, leaderSharePct: 86.08,
    // Read from GET /v2/positions?vault_id=2e782d92-… on Oct 22, 2026; marks from GET /v2/markets.
    positions: [
      { symbol: "SOL-USD", size: 108.14, mark: 103.08, leverage: 20, margin: "cross" },
      { symbol: "ADA-USD", size: 51391, mark: 0.21088, leverage: 20, margin: "cross" },
      { symbol: "BTC-USD", size: 0.12371, mark: 81107.37, leverage: 10, margin: "cross" },
      { symbol: "ETH-USD", size: 2.968, mark: 2377.03, leverage: 20, margin: "cross" },
      { symbol: "XAG-USD", size: 59.055, mark: 54.6151, leverage: 20, margin: "cross" },
      { symbol: "SNDK-USD", size: 0.61, mark: 1233.5, leverage: 20, margin: "cross" },
      { symbol: "NVDA-USD", size: -3.09, mark: 212.1731, leverage: 20, margin: "cross" },
      { symbol: "HYPE-USD", size: 7.69, mark: 76.968, leverage: 20, margin: "cross" },
      { symbol: "XRP-USD", size: 448.2, mark: 1.2961, leverage: 20, margin: "cross" },
      { symbol: "MU-USD", size: -0.65, mark: 848.2229, leverage: 20, margin: "cross" },
      { symbol: "SKHYNIX-USD", size: -0.52, mark: 891.0, leverage: 20, margin: "cross" },
      { symbol: "TSLA-USD", size: 0.71, mark: 372.9887, leverage: 20, margin: "cross" },
      { symbol: "NEAR-USD", size: 48.7, mark: 4.8612, leverage: 10, margin: "cross" },
      { symbol: "MINIMAX-USD", size: 5.39, mark: 20.076, leverage: 10, margin: "cross" },
      { symbol: "WTI-USD", size: -0.58, mark: 99.1424, leverage: 20, margin: "cross" },
      { symbol: "CXMT-USD", size: 9.8, mark: 5.7898, leverage: 10, margin: "cross" },
      { symbol: "XAU-USD", size: 0.005, mark: 4025.922, leverage: 20, margin: "cross" },
      { symbol: "SPCX-USD", size: -0.1, mark: 145.4212, leverage: 5, margin: "cross" },
    ],
    pendingInVault: [],
    mine: null,
  },
];

export const vault = (id: string) => vaults.find((v) => v.id === id);
export const availableShares = (v: Vault) => (v.mine ? v.mine.shares - v.mine.locked : 0);

export type Mode = "armed" | "dry_run" | "paused";
export type WatchState =
  | "draft" | "armed_clear" | "armed_filing" | "armed_pending" | "armed_cancelling" | "armed_error" | "exited" | "dry_run" | "paused";

export type Mandate = {
  version: number;
  createdAt: number;
  maxLeverage: number | null;
  allowedMarkets: string[] | null;
  allowedLabel: string | null;
  maxDrawdownPct: number | null;
  minLeaderStakePct: number | null;
};

export type Watch = {
  id: string;
  vaultId: string;
  mode: Mode;
  state: WatchState;
  autoCancel: boolean;
  autoCancels24h: number;
  peakSharePrice: number;
  mandates: Mandate[]; // newest first; [0] is active
  rules: RuleResult[]; // latest evaluation
  breachReadsInARow: number;
  pendingReceiptId?: string;
  evaluations: number;
  createdAt: number;
};

const MAJORS = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"];
const CRYPTO = ["ADA-USD", "BNB-USD", "BTC-USD", "DOGE-USD", "ETH-USD", "HYPE-USD", "LIT-USD", "NEAR-USD", "NIGHT-USD", "PUMP-USD", "SOL-USD", "XRP-USD", "ZEC-USD"];

export const watches: Watch[] = [
  {
    id: "w_demo", vaultId: DEMO_VAULT_ID, mode: "armed", state: "armed_pending", autoCancel: true, autoCancels24h: 1,
    peakSharePrice: 1.0012, breachReadsInARow: 4618, pendingReceiptId: "rc_Zp4mW9sLqe", evaluations: 18_316,
    createdAt: Date.UTC(2026, 9, 21, 17, 20),
    mandates: [
      { version: 2, createdAt: t(9, 58, 4), maxLeverage: 5, allowedMarkets: MAJORS, allowedLabel: "Crypto majors (5)", maxDrawdownPct: 15, minLeaderStakePct: null },
      { version: 1, createdAt: Date.UTC(2026, 9, 21, 17, 20), maxLeverage: 10, allowedMarkets: CRYPTO, allowedLabel: "Crypto (13)", maxDrawdownPct: 25, minLeaderStakePct: null },
    ],
    rules: [
      { rule: "leverage", status: "breach", value: 8.0, limit: 5 },
      { rule: "markets", status: "pass", value: 0, limit: null, detail: "SOL-USD is on your list" },
      { rule: "drawdown", status: "pass", value: 0.96, limit: 15 },
      { rule: "leaderStake", status: "off", value: null, limit: null },
    ],
  },
  {
    id: "w_mw", vaultId: "536b4d72-687d-5e8e-a3be-cef0757c795f", mode: "armed", state: "armed_clear", autoCancel: true, autoCancels24h: 0,
    peakSharePrice: 0.9396, breachReadsInARow: 0, evaluations: 51_204, createdAt: Date.UTC(2026, 9, 19, 8, 30),
    mandates: [
      { version: 1, createdAt: Date.UTC(2026, 9, 19, 8, 30), maxLeverage: 3, allowedMarkets: null, allowedLabel: null, maxDrawdownPct: 10, minLeaderStakePct: 5 },
    ],
    rules: [
      { rule: "leverage", status: "pass", value: 0.86, limit: 3 },
      { rule: "markets", status: "off", value: null, limit: null },
      { rule: "drawdown", status: "pass", value: 1.99, limit: 10 },
      { rule: "leaderStake", status: "unknown", value: null, limit: 5, detail: "Leader row not matched with certainty" },
    ],
  },
  {
    id: "w_glacier", vaultId: "2e782d92-86f0-48f2-9171-eb0c4633656e", mode: "dry_run", state: "dry_run", autoCancel: true, autoCancels24h: 0,
    peakSharePrice: 0.6757, breachReadsInARow: 15_904, evaluations: 15_910, createdAt: Date.UTC(2026, 9, 21, 20, 0),
    mandates: [
      { version: 1, createdAt: Date.UTC(2026, 9, 21, 20, 0), maxLeverage: 3, allowedMarkets: CRYPTO, allowedLabel: "Crypto (13)", maxDrawdownPct: 15, minLeaderStakePct: 50 },
    ],
    rules: [
      { rule: "leverage", status: "pass", value: 1.12, limit: 3 },
      { rule: "markets", status: "breach", value: 11, limit: null, detail: "XAG, SNDK, NVDA, MU, SKHYNIX, TSLA and 5 more" },
      { rule: "drawdown", status: "pass", value: 1.44, limit: 15 },
      { rule: "leaderStake", status: "pass", value: 86.08, limit: 50 },
    ],
  },
];

export const watch = (id: string) => watches.find((w) => w.id === id);
export const watchForVault = (vaultId: string) => watches.find((w) => w.vaultId === vaultId);
export const overall = (w: Watch): RuleStatus =>
  w.rules.some((r) => r.status === "breach") ? "breach" : w.rules.some((r) => r.status === "unknown") ? "unknown" : "pass";

export type Activity = {
  ts: number;
  kind: "evaluation" | "breach" | "filing" | "cancel" | "execution" | "error" | "config";
  text: string;
  detail?: string;
  /** a summarised run of evaluations ends here */
  until?: number;
  count?: number;
};

export const activity: Record<string, Activity[]> = {
  w_demo: [
    { ts: t(17, 2, 11), kind: "error", text: "Strike answered 429 rate limit exceeded", detail: "Backed off 4 s. 2 snapshots marked stale; stale reads never confirm a breach or a cure." },
    { ts: t(13, 42, 3), until: SAMPLE_NOW - 2_000, count: 4_617, kind: "evaluation", text: "Breaching reads, withdrawal already pending", detail: "No new filing: one pending withdrawal per watch." },
    { ts: t(13, 41, 59, 512), kind: "filing", text: "Withdrawal pending, executes Oct 23, 14:41", detail: "Strike history row f41a6d02… status pending." },
    { ts: r2Request, kind: "filing", text: "Withdrawal filed: f41a6d02…", detail: "POST /v2/vault/withdraw, withdraw_all. Request id returned in 566 ms." },
    { ts: t(13, 41, 58, 311), kind: "breach", text: "Breach confirmed: effective leverage 7.90x > 5x", detail: "2nd breaching read. Fill 4351907, SOL-USD buy 31.6 at 103.08." },
    { ts: t(10, 6, 41), until: t(13, 41, 53), count: 2_571, kind: "evaluation", text: "Passing reads", detail: "All enabled rules passing." },
    { ts: t(10, 6, 40, 902), kind: "cancel", text: "Withdrawal cancelled: 7e2b9c14… · cost $0.00", detail: "124.06 shares unlocked. Auto-cancels in 24 h: 1 of 2." },
    { ts: t(10, 6, 38, 120), kind: "cancel", text: "Cure confirmed: 3 passing reads, 199 s after filing", detail: "Effective leverage 3.00x." },
    { ts: t(10, 3, 19, 610), kind: "filing", text: "Withdrawal pending, executes Oct 23, 11:03", detail: "Strike history row 7e2b9c14… status pending." },
    { ts: r1Request, kind: "filing", text: "Withdrawal filed: 7e2b9c14…", detail: "POST /v2/vault/withdraw, withdraw_all. Request id returned in 558 ms." },
    { ts: t(10, 3, 18, 344), kind: "breach", text: "Breach confirmed: effective leverage 14.81x > 5x", detail: "2nd breaching read. Fill 4346118, ETH-USD buy 2.57 at 2,377.03." },
    { ts: t(9, 58, 9), until: t(10, 3, 13), count: 60, kind: "evaluation", text: "Passing reads", detail: "All enabled rules passing." },
    { ts: t(9, 58, 4), kind: "config", text: "Mandate v2 saved and armed", detail: "Max 5x · crypto majors · max 15% drawdown. Peak seeded at 1.0012." },
  ],
};

export const settings = {
  pollIntervalS: 5,
  breachConfirmN: 2,
  cureConfirmN: 3,
  cureGraceS: 30,
  maxAutoCancels24h: 2,
};
