"use client";
import { useEffect, useMemo, useState } from "react";
import { CRYPTO_MAJORS, GROUP_LABEL, groupOf, short, type MarketGroup } from "@/lib/markets";

export type TesterVault = {
  name: string;
  effectiveLeverage: number;
  sharePrice: number;
  leaderSharePct: number | null;
  heldSymbols: string[];
  lockupDays: number;
};

type Verdict = "pass" | "breach" | "unknown";
type Answer = { rule: string; measured: string; limit: string; verdict: Verdict; says: string; files: boolean };

const EXAMPLES = ["crypto only", "max 15% drawdown", "leader keeps 90%", "max 1x leverage"];

function judge(text: string, v: TesterVault): Answer | null {
  const s = text.toLowerCase();
  const n = s.match(/(\d+(?:\.\d+)?)/)?.[1];
  const value = n === undefined ? null : parseFloat(n);

  if (/draw|drop|fall|dd\b/.test(s) && value !== null) {
    const floor = v.sharePrice * (1 - value / 100);
    return {
      rule: "Max drawdown from peak",
      measured: "0.0%",
      limit: `${value}%`,
      verdict: "pass",
      says: `The peak seeds at ${v.sharePrice.toFixed(3)} when you arm, so today's drawdown is 0.0%. Rescind would file the moment the share price fell below ${floor.toFixed(3)}.`,
      files: false,
    };
  }
  if (/leader|stake|keeps|skin/.test(s) && value !== null) {
    if (v.leaderSharePct === null)
      return {
        rule: "Min leader stake", measured: "Unknown", limit: `${value}%`, verdict: "unknown", files: false,
        says: "Rescind couldn't match the leader's depositor row with certainty, so this rule reports unknown and never fires on its own.",
      };
    const breach = v.leaderSharePct < value;
    return {
      rule: "Min leader stake",
      measured: `${v.leaderSharePct.toFixed(2)}%`,
      limit: `${value}%`,
      verdict: breach ? "breach" : "pass",
      says: breach
        ? `The leader holds ${v.leaderSharePct.toFixed(2)}% of ${v.name}, under your ${value}%.`
        : `The leader holds ${v.leaderSharePct.toFixed(2)}% of ${v.name}. Your floor is ${value}%. Rescind would stay quiet.`,
      files: breach,
    };
  }
  if ((/lev/.test(s) || /\d\s*x\b/.test(s)) && value !== null) {
    const breach = v.effectiveLeverage > value;
    const m = v.effectiveLeverage.toFixed(2);
    return {
      rule: "Max effective leverage",
      measured: `${m}x`,
      limit: `${value}x`,
      verdict: breach ? "breach" : "pass",
      says: breach
        ? `${v.name} carries ${m}x its equity, over your ${value}x.`
        : `${v.name} carries ${m}x its equity. Your limit is ${value}x. Rescind would stay quiet.`,
      files: breach,
    };
  }
  const groups: MarketGroup[] = [];
  if (/crypto|coin/.test(s) && !/major/.test(s)) groups.push("crypto");
  if (/stock|equit|share/.test(s)) groups.push("stocks");
  if (/commod|metal|gold|silver|oil/.test(s)) groups.push("commodities");
  if (/indic|index/.test(s)) groups.push("indices");
  if (groups.length || /major/.test(s)) {
    const allowed = (sym: string) => (/major/.test(s) && CRYPTO_MAJORS.includes(sym)) || groups.includes(groupOf(sym));
    const outside = v.heldSymbols.filter((sym) => !allowed(sym));
    const label = [/major/.test(s) ? "Crypto majors" : null, ...groups.map((g) => GROUP_LABEL[g])].filter(Boolean).join(", ");
    const breach = outside.length > 0;
    return {
      rule: "Allowed markets",
      measured: `${outside.length} outside`,
      limit: label,
      verdict: breach ? "breach" : "pass",
      says: breach
        ? `${v.name} holds ${outside.length} ${outside.length === 1 ? "market" : "markets"} outside your list: ${outside.map(short).join(", ")}.`
        : `Every market ${v.name} holds is on your list. Rescind would stay quiet.`,
      files: breach,
    };
  }
  return null;
}

export function RuleTester({ vault }: { vault: TesterVault }) {
  const [text, setText] = useState("max 3x leverage");
  const [executeAt, setExecuteAt] = useState<string | null>(null);
  const answer = useMemo(() => judge(text, vault), [text, vault]);

  // The visitor's own clock and timezone, so it is only known after mount.
  useEffect(() => {
    const at = new Date(Date.now() + vault.lockupDays * 86_400_000);
    const time = at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    setExecuteAt(vault.lockupDays === 1 ? `${time} tomorrow` : `${at.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`);
  }, [vault.lockupDays, text]);

  return (
    <>
      <label htmlFor="rule" className="sr-only">A mandate rule to test</label>
      <input
        id="rule"
        className="try-input"
        data-ui
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="try-body">
        <div className="answer" data-ui aria-live="polite" data-reveal style={{ ["--i" as string]: 1 }}>
          {answer ? (
            <>
              <p className={`verdict ${answer.verdict}`}>
                {answer.verdict === "breach" ? "Breach" : answer.verdict === "pass" ? "Pass" : "Unknown"}
              </p>
              <dl>
                <dt>Rule</dt><dd>{answer.rule}</dd>
                <dt>Measured</dt><dd>{answer.measured}</dd>
                <dt>Your limit</dt><dd>{answer.limit}</dd>
              </dl>
              <p className="says">
                {answer.says}
                {answer.files && (
                  <> Rescind would file now. The withdrawal would execute at {executeAt ?? "the end of the lockup"}, unless the leader cures first.</>
                )}
              </p>
            </>
          ) : (
            <p className="says">
              Rescind knows four rules: max leverage, allowed markets, max drawdown from peak, and minimum leader stake.
              Try &ldquo;max 15% drawdown&rdquo;.
            </p>
          )}
          <p className="src">Judged against {vault.name}, as read from Strike&rsquo;s public API.</p>
        </div>
        <div className="examples" data-reveal style={{ ["--i" as string]: 2 }}>
          <p>Or try one of these:</p>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)}>{ex}</button>
          ))}
        </div>
      </div>
    </>
  );
}
