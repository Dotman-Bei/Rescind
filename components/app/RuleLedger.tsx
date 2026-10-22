import { RULE_LABEL, type RuleResult } from "@/lib/sample";
import { StatusPill } from "./StatusPill";

const fmt = (r: RuleResult, v: number | null) => {
  if (v === null) return "—";
  if (r.rule === "leverage") return `${v.toFixed(2)}x`;
  if (r.rule === "markets") return `${v} outside`;
  return `${v.toFixed(r.rule === "leaderStake" ? 2 : 1)}%`;
};

const limitText = (r: RuleResult) => {
  if (r.status === "off") return "Off";
  if (r.rule === "markets") return r.detail ?? "Your list";
  return r.limit === null ? "—" : r.rule === "leverage" ? `${r.limit}x` : `${r.limit}%`;
};

/** One row per rule: measured against limit as a bar with a tick at the limit. For the stake rule the
 *  breach is falling below the floor, so the bar still fills toward the tick. */
function Bullet({ r }: { r: RuleResult }) {
  if (r.status === "off" || r.value === null || r.rule === "markets") return <span aria-hidden="true" />;
  const limit = r.limit ?? 0;
  const max = Math.max(limit * 2, r.value * 1.15, 1);
  return (
    <div className="bullet" aria-hidden="true">
      <div className={r.status === "breach" ? "bar breach" : "bar"} style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }} />
      <div className="limit" style={{ left: `${(limit / max) * 100}%` }} />
    </div>
  );
}

export function RuleLedger({ rules, caption }: { rules: RuleResult[]; caption?: string }) {
  return (
    <div className="rules" role="table" aria-label={caption ?? "Rules"}>
      <div className="rule-row head" role="row">
        <span role="columnheader">Rule</span>
        <span role="columnheader" className="n">Measured</span>
        <span role="columnheader" className="n">Limit</span>
        <span role="columnheader" aria-hidden="true" />
        <span role="columnheader" className="verdict">Verdict</span>
      </div>
      {rules.map((r) => (
        <div className={r.status === "off" ? "rule-row off" : "rule-row"} role="row" key={r.rule}>
          <span className="name" role="cell">
            {RULE_LABEL[r.rule]}
            {r.rule === "markets" && r.detail && r.status !== "off" && <small>{r.detail}</small>}
          </span>
          <span className="n" role="cell">{r.status === "off" ? "—" : fmt(r, r.value)}</span>
          <span className="n" role="cell">{r.rule === "markets" ? (r.status === "off" ? "Off" : "List") : limitText(r)}</span>
          <Bullet r={r} />
          <span className="verdict" role="cell"><StatusPill status={r.status} /></span>
          <span className="mobile-vals">
            {r.status === "off" ? "Rule off" : `Measured ${fmt(r, r.value)} · limit ${r.rule === "markets" ? "your list" : limitText(r)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
