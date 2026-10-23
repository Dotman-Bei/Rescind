// Validates a mandate body from the editor (FR-09: four rules, at least one on).
import { num } from "./api";
import type { Mandate } from "./sample";

export function parseMandate(m: Record<string, unknown> | undefined): Omit<Mandate, "version" | "createdAt"> | string {
  if (!m) return "mandate is required";
  const maxLeverage = num(m.max_effective_leverage);
  const dd = num(m.max_drawdown);
  const stake = num(m.min_leader_stake_pct);
  const markets = Array.isArray(m.allowed_markets) ? (m.allowed_markets as unknown[]).filter((x): x is string => typeof x === "string") : null;
  if ([maxLeverage, dd, stake].some((x) => Number.isNaN(x))) return "rule values must be numbers";
  if (maxLeverage === null && dd === null && stake === null && markets === null) return "turn on at least one rule";
  return {
    maxLeverage,
    allowedMarkets: markets,
    allowedLabel: markets ? `${markets.length} markets` : null,
    maxDrawdownPct: dd === null ? null : dd <= 1 ? dd * 100 : dd,
    minLeaderStakePct: stake,
  };
}
