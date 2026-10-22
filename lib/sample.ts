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
