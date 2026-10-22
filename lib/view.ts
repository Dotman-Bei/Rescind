// Words for the operator screens, derived from the sample (later: API) objects.
import { RULE_LABEL, overall, receipt, vault, type RuleResult, type Watch } from "./sample";

export const MODE_LABEL = { armed: "Armed", dry_run: "Dry run", paused: "Paused" } as const;

/** The watch's state as the operator would say it. */
export function stateText(w: Watch) {
  if (w.mode === "paused") return "Paused";
  if (w.state === "armed_pending") return "Withdrawal pending";
  if (w.state === "armed_filing") return "Filing";
  if (w.state === "armed_cancelling") return "Cancelling";
  if (w.state === "armed_error") return "Write failed, retrying";
  if (w.state === "exited") return "Exited";
  if (w.mode === "dry_run") return overall(w) === "breach" ? "Would file" : "Clear";
  return "Clear";
}

export function ruleValue(r: RuleResult) {
  if (r.value === null) return "—";
  if (r.rule === "leverage") return `${r.value.toFixed(2)}x`;
  if (r.rule === "markets") return `${r.value} outside`;
  return `${r.value.toFixed(2)}%`;
}

export function ruleLimit(r: RuleResult) {
  if (r.limit === null) return r.rule === "markets" ? "your list" : "—";
  return r.rule === "leverage" ? `${r.limit}x` : `${r.limit}%`;
}

/** "Effective leverage 8.00x > 5x", or the closest-to-limit passing rule. */
export function headlineRule(w: Watch) {
  const on = w.rules.filter((r) => r.status !== "off");
  const b = on.find((r) => r.status === "breach");
  const r = b ?? on.find((r) => r.status === "pass" && r.rule === "leverage") ?? on[0];
  if (!r) return "No rules on";
  const name = RULE_LABEL[r.rule].replace(/^Max |^Min /, "").replace(/^effective/, "Effective").replace(/^allowed/, "Allowed");
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  if (r.rule === "markets") return b ? `${r.value} markets outside your list` : "All markets on your list";
  return `${label} ${ruleValue(r)} ${r.status === "breach" ? (r.rule === "leaderStake" ? "<" : ">") : "of"} ${ruleLimit(r)}`;
}

export function rulesCount(w: Watch) {
  const on = w.rules.filter((r) => r.status !== "off");
  const breached = on.filter((r) => r.status === "breach").length;
  const unknown = on.filter((r) => r.status === "unknown").length;
  return { on: on.length, breached, unknown };
}

export function pendingFor(w: Watch) {
  const r = w.pendingReceiptId ? receipt(w.pendingReceiptId) : undefined;
  return r && r.withdrawal.status === "pending" ? r : undefined;
}

export const vaultName = (w: Watch) => vault(w.vaultId)?.name ?? w.vaultId;
