// Mandate rules R1–R4 (PRD §9), evaluated on one snapshot.
import type { Mandate, RuleResult, RuleStatus } from "../lib/sample";

export type Snapshot = {
  takenAt: number;
  latencyMs: number;
  equity: number;
  sharePrice: number;
  status: string;
  leaderNickname: string;
  positions: { symbol: string; size: number; mark: number; markFromEntry: boolean }[];
  leaderSharePct: number | null;
  degraded: boolean;
};

export function effectiveLeverage(s: Snapshot) {
  const notional = s.positions.reduce((t, p) => t + Math.abs(p.size * p.mark), 0);
  return s.equity > 0 ? notional / s.equity : Infinity;
}

export function evaluate(m: Mandate, s: Snapshot, peak: number): { rules: RuleResult[]; overall: RuleStatus } {
  const rules: RuleResult[] = [];

  // R1: Σ|size × mark| ÷ equity; equity ≤ 0 is a breach (insolvent).
  if (m.maxLeverage === null) rules.push({ rule: "leverage", status: "off", value: null, limit: null });
  else {
    const lev = effectiveLeverage(s);
    rules.push({ rule: "leverage", status: lev > m.maxLeverage ? "breach" : "pass", value: Number.isFinite(lev) ? lev : 9999, limit: m.maxLeverage });
  }

  // R2: any held symbol off the list.
  if (m.allowedMarkets === null) rules.push({ rule: "markets", status: "off", value: null, limit: null });
  else {
    const outside = s.positions.filter((p) => p.size !== 0 && !m.allowedMarkets!.includes(p.symbol)).map((p) => p.symbol.replace(/-USD$/, ""));
    rules.push({
      rule: "markets",
      status: outside.length ? "breach" : "pass",
      value: outside.length,
      limit: null,
      detail: outside.length ? `${outside.slice(0, 6).join(", ")}${outside.length > 6 ? ` and ${outside.length - 6} more` : ""}` : "Every held market is on your list",
    });
  }

  // R3: drawdown from the highest share price seen since the version was armed.
  if (m.maxDrawdownPct === null) rules.push({ rule: "drawdown", status: "off", value: null, limit: null });
  else {
    const dd = peak > 0 ? (1 - s.sharePrice / peak) * 100 : 0;
    rules.push({ rule: "drawdown", status: dd > m.maxDrawdownPct ? "breach" : "pass", value: Math.max(0, dd), limit: m.maxDrawdownPct });
  }

  // R4: the leader's share; an unmatched leader row is unknown and never confirms a breach.
  if (m.minLeaderStakePct === null) rules.push({ rule: "leaderStake", status: "off", value: null, limit: null });
  else if (s.leaderSharePct === null) rules.push({ rule: "leaderStake", status: "unknown", value: null, limit: m.minLeaderStakePct, detail: "Leader row not matched with certainty" });
  else rules.push({ rule: "leaderStake", status: s.leaderSharePct < m.minLeaderStakePct ? "breach" : "pass", value: s.leaderSharePct, limit: m.minLeaderStakePct });

  const overall: RuleStatus = rules.some((r) => r.status === "breach") ? "breach" : rules.some((r) => r.status === "unknown") ? "unknown" : "pass";
  return { rules, overall };
}

export function breachLabel(rules: RuleResult[]) {
  const r = rules.find((x) => x.status === "breach");
  if (!r) return "";
  if (r.rule === "leverage") return `Effective leverage ${r.value!.toFixed(1)}x > ${r.limit}x`;
  if (r.rule === "markets") return `${r.value} ${r.value === 1 ? "market" : "markets"} outside your list`;
  if (r.rule === "drawdown") return `Drawdown ${r.value!.toFixed(1)}% > ${r.limit}%`;
  return `Leader stake ${r.value!.toFixed(2)}% < ${r.limit}%`;
}
