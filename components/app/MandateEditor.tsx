"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/client";
import { ALL_MARKETS, CRYPTO_MAJORS, GROUP_LABEL, groupOf, marketsIn, short, type MarketGroup } from "@/lib/markets";

export type EditorVault = {
  id: string;
  name: string;
  heldSymbols: string[];
  effectiveLeverage: number;
  sharePrice: number;
  leaderSharePct: number | null;
  availableShares: number;
  creditEncumbered: number;
};

export type Draft = {
  leverage: { on: boolean; value: string };
  markets: { on: boolean; list: string[] };
  drawdown: { on: boolean; value: string };
  stake: { on: boolean; value: string };
};

type Verdict = "pass" | "breach" | "unknown" | "off";

const PRESETS: { name: string; d: Draft }[] = [
  { name: "Conservative", d: { leverage: { on: true, value: "3" }, markets: { on: true, list: CRYPTO_MAJORS }, drawdown: { on: true, value: "10" }, stake: { on: true, value: "5" } } },
  { name: "Balanced", d: { leverage: { on: true, value: "5" }, markets: { on: true, list: marketsIn("crypto") }, drawdown: { on: true, value: "15" }, stake: { on: true, value: "5" } } },
  { name: "Loose", d: { leverage: { on: true, value: "10" }, markets: { on: false, list: ALL_MARKETS }, drawdown: { on: true, value: "25" }, stake: { on: false, value: "5" } } },
];

const GROUPS: MarketGroup[] = ["crypto", "stocks", "indices", "commodities"];

function evaluate(d: Draft, v: EditorVault) {
  const lev = parseFloat(d.leverage.value);
  const dd = parseFloat(d.drawdown.value);
  const st = parseFloat(d.stake.value);
  const outside = v.heldSymbols.filter((s) => !d.markets.list.includes(s));
  const r: Record<keyof Draft, { verdict: Verdict; now: string }> = {
    leverage: !d.leverage.on
      ? { verdict: "off", now: `${v.effectiveLeverage.toFixed(2)}x now` }
      : { verdict: !(lev > 0) ? "unknown" : v.effectiveLeverage > lev ? "breach" : "pass", now: `${v.effectiveLeverage.toFixed(2)}x now` },
    markets: !d.markets.on
      ? { verdict: "off", now: `${v.heldSymbols.length} markets held` }
      : { verdict: outside.length ? "breach" : "pass", now: outside.length ? `${outside.length} held outside: ${outside.slice(0, 5).map(short).join(", ")}${outside.length > 5 ? ` and ${outside.length - 5} more` : ""}` : "Every held market is on the list" },
    drawdown: !d.drawdown.on
      ? { verdict: "off", now: "" }
      : { verdict: dd > 0 ? "pass" : "unknown", now: `Peak seeds at ${v.sharePrice.toFixed(4)} when you arm, so it starts at 0.0%${dd > 0 ? `. Fires below ${(v.sharePrice * (1 - dd / 100)).toFixed(4)}` : ""}` },
    stake: !d.stake.on
      ? { verdict: "off", now: "" }
      : v.leaderSharePct === null
        ? { verdict: "unknown", now: "Leader row not matched with certainty: reports unknown, never fires" }
        : { verdict: v.leaderSharePct < st ? "breach" : "pass", now: `Leader holds ${v.leaderSharePct.toFixed(2)}%` },
  };
  return r;
}

const PILL: Record<Verdict, string> = { pass: "pill pos", breach: "pill neg", unknown: "pill", off: "pill" };
const WORD: Record<Verdict, string> = { pass: "Pass", breach: "Would breach", unknown: "Unknown", off: "Off" };

export function MandateEditor({
  vault,
  initial,
  mode,
  watchId,
  nextVersion,
}: {
  vault: EditorVault;
  initial: Draft;
  mode: "create" | "edit";
  watchId?: string;
  nextVersion?: number;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [showSymbols, setShowSymbols] = useState(false);
  const canArm = vault.availableShares > 0 && vault.creditEncumbered === 0;
  const [armed, setArmed] = useState(mode === "create" ? canArm : true);
  const [autoCancel, setAutoCancel] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const res = useMemo(() => evaluate(d, vault), [d, vault]);
  const enabled = (Object.keys(res) as (keyof Draft)[]).filter((k) => res[k].verdict !== "off");
  const breaching = enabled.filter((k) => res[k].verdict === "breach");

  useEffect(() => {
    if (!confirm) return;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirm(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm]);

  const set = <K extends keyof Draft>(k: K, patch: Partial<Draft[K]>) => setD((x) => ({ ...x, [k]: { ...x[k], ...patch } }));
  const toggleSymbol = (s: string) =>
    set("markets", { list: d.markets.list.includes(s) ? d.markets.list.filter((x) => x !== s) : [...d.markets.list, s] });
  const groupState = (g: MarketGroup) => {
    const all = marketsIn(g);
    const n = all.filter((s) => d.markets.list.includes(s)).length;
    return n === all.length ? "all" : n ? "some" : "none";
  };
  const toggleGroup = (g: MarketGroup) => {
    const all = marketsIn(g);
    set("markets", { list: groupState(g) === "all" ? d.markets.list.filter((s) => !all.includes(s)) : [...new Set([...d.markets.list, ...all])] });
  };

  async function submit() {
    setBusy(true);
    const body = {
      vault_id: vault.id,
      mode: armed ? "armed" : "dry_run",
      auto_cancel: autoCancel,
      mandate: {
        max_effective_leverage: d.leverage.on ? d.leverage.value : null,
        allowed_markets: d.markets.on ? d.markets.list : null,
        max_drawdown: d.drawdown.on ? String(parseFloat(d.drawdown.value) / 100) : null,
        min_leader_stake_pct: d.stake.on ? d.stake.value : null,
      },
    };
    const r = mode === "create" ? await api("/api/watches", { method: "POST", body }) : await api(`/api/watches/${watchId}/mandate`, { method: "POST", body: body.mandate });
    setBusy(false);
    setConfirm(false);
    if (r.ok) router.push(mode === "create" ? "/app" : `/watches/${watchId}`);
    else if (r.sample) setNotice(mode === "create" ? "Sample build: the watch routes aren't wired, so nothing was saved. This is what would be sent to Strike's poller." : `Sample build: version ${nextVersion} wasn't saved.`);
    else setNotice(r.error ?? `Saving failed (${r.status}).`);
  }

  const primary = mode === "edit" ? `Save as version ${nextVersion}` : armed ? "Arm watch" : "Start dry run";
  const onPrimary = () => (armed && breaching.length && mode === "create" ? setConfirm(true) : submit());

  const row = (k: keyof Draft, title: string, help: string, control: React.ReactNode) => (
    <div className={d[k].on ? "rule-edit" : "rule-edit off"} key={k}>
      <div className="rule-edit-head">
        <label className="rule-toggle">
          <input type="checkbox" className="switch" checked={d[k].on} onChange={(e) => set(k, { on: e.target.checked } as Partial<Draft[typeof k]>)} />
          <span>{title}</span>
        </label>
        <span className={PILL[res[k].verdict]}>{WORD[res[k].verdict]}</span>
      </div>
      <p className="rule-help">{help}</p>
      {d[k].on && control}
      {res[k].now && <p className="rule-now">{res[k].now}</p>}
    </div>
  );

  const num = (k: "leverage" | "drawdown" | "stake", unit: string, label: string) => (
    <div className="num-field">
      <input
        className="input"
        inputMode="decimal"
        aria-label={label}
        value={d[k].value}
        onChange={(e) => set(k, { value: e.target.value.replace(/[^0-9.]/g, "") })}
      />
      <span className="unit">{unit}</span>
    </div>
  );

  return (
    <div className="cols stretch">
      <section className="panel span-8" aria-labelledby="mandate-h">
        <header>
          <h2 id="mandate-h">Mandate</h2>
          <span className="presets">
            <span className="faint">Start from</span>
            {PRESETS.map((p) => (
              <button key={p.name} type="button" className="text-btn" onClick={() => setD(p.d)}>{p.name}</button>
            ))}
          </span>
        </header>
        {row("leverage", "Max effective leverage", "Σ|size × mark| ÷ vault equity. Not the per-position leverage setting.", num("leverage", "x", "Max effective leverage"))}
        {row(
          "markets",
          "Allowed markets",
          "A position in any market off this list is a breach. Groups are shortcuts; the list is what's saved.",
          <div className="markets">
            <div className="chips" role="group" aria-label="Market groups">
              {GROUPS.map((g) => (
                <button key={g} type="button" className="chip" aria-pressed={groupState(g) === "all"} data-some={groupState(g) === "some" || undefined} onClick={() => toggleGroup(g)}>
                  {GROUP_LABEL[g]} <span className="faint">{marketsIn(g).length}</span>
                </button>
              ))}
              <button type="button" className="text-btn" onClick={() => setShowSymbols(!showSymbols)} aria-expanded={showSymbols}>
                {showSymbols ? "Hide symbols" : `Choose symbols (${d.markets.list.length} of ${ALL_MARKETS.length})`}
              </button>
            </div>
            {showSymbols && (
              <div className="chips symbols" role="group" aria-label="Markets">
                {ALL_MARKETS.map((s) => (
                  <button key={s} type="button" className="chip small" aria-pressed={d.markets.list.includes(s)} onClick={() => toggleSymbol(s)} title={GROUP_LABEL[groupOf(s)]}>
                    {short(s)}
                  </button>
                ))}
              </div>
            )}
          </div>,
        )}
        {row("drawdown", "Max drawdown from peak", "Measured from the highest share price since you arm, not the vault's all-time high.", num("drawdown", "%", "Max drawdown"))}
        {row("stake", "Min leader stake", "The leader's share of the vault. Strike only enforces 5% on the leader's own withdrawals.", num("stake", "%", "Min leader stake"))}
      </section>

      <aside className="side-col span-4">
        <section className={breaching.length ? "panel check breach" : "panel check"} aria-labelledby="check-h" aria-live="polite">
          <header><h2 id="check-h">Against {vault.name} now</h2></header>
          <p className="check-figure">
            <strong>{breaching.length}</strong> of {enabled.length} {enabled.length === 1 ? "rule" : "rules"} would breach
          </p>
          <p className="muted">
            {enabled.length === 0
              ? "Turn on at least one rule to arm."
              : breaching.length
                ? armed && mode === "create"
                  ? "Arming files a withdrawal immediately, on the second breaching read."
                  : "A dry run would log this as a breach and file nothing."
                : "Nothing would fire right now."}
          </p>
          <ul className="check-list">
            {([
              ["leverage", "Max effective leverage"],
              ["markets", "Allowed markets"],
              ["drawdown", "Max drawdown"],
              ["stake", "Min leader stake"],
            ] as [keyof Draft, string][]).map(([k, label]) => (
              <li key={k}>
                <span>{label}</span>
                <span className={PILL[res[k].verdict]}>{WORD[res[k].verdict]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel mode-panel" aria-labelledby="mode-h">
          <header><h2 id="mode-h">{mode === "edit" ? "Save" : "Mode"}</h2></header>
          {mode === "create" && (
            <>
              <div className="segmented" role="group" aria-label="Mode">
                <button type="button" aria-pressed={armed} disabled={!canArm} onClick={() => setArmed(true)}>Armed</button>
                <button type="button" aria-pressed={!armed} onClick={() => setArmed(false)}>Dry run</button>
              </div>
              {!canArm && (
                <p className="small-note muted">
                  {vault.creditEncumbered > 0
                    ? "Some of your shares back a Credit line. Rescind won't arm: withdraw_all would include them."
                    : "You hold no available shares here, so this watch can only dry-run."}
                </p>
              )}
              {armed && (
              <label className="switch-row">
                <span>
                  Cancel on cure
                  <span className="sub">When every rule passes for 3 reads, cancel the withdrawal. Free.</span>
                </span>
                <input type="checkbox" className="switch" checked={autoCancel} onChange={(e) => setAutoCancel(e.target.checked)} />
              </label>
              )}
            </>
          )}
          <div className="mode-actions">
            <button type="button" className="btn primary" disabled={enabled.length === 0 || busy} onClick={onPrimary}>{primary}</button>
            <Link href={mode === "edit" && watchId ? `/watches/${watchId}` : "/vaults"} className="text-btn">Cancel</Link>
          </div>
          {notice && <p className="notice" role="status">{notice}</p>}
          {mode === "create" && (
            <dl className="kv what-happens">
              <div><dt>Breach confirmed</dt><dd>On the 2nd bad read, about 10 s</dd></div>
              {armed ? (
                <>
                  <div><dt>Then</dt><dd>withdraw_all, {vault.availableShares.toFixed(2)} shares</dd></div>
                  <div><dt>Exit clock</dt><dd>Lockup × 24 h, cancellable</dd></div>
                  <div><dt>On cure</dt><dd>{autoCancel ? "Cancel after 3 passing reads" : "Keep running"}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>Then</dt><dd>Logged as &ldquo;would file&rdquo;</dd></div>
                  <div><dt>Writes to Strike</dt><dd>None</dd></div>
                  <div><dt>Arm later</dt><dd>Any time you hold shares</dd></div>
                </>
              )}
            </dl>
          )}
          {mode === "edit" && <p className="muted">The new version applies from the next read. Receipts keep the version that fired them.</p>}
        </section>
      </aside>

      {confirm && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirm(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="arm-h" ref={dialog}>
            <h2 id="arm-h">Arm and file now?</h2>
            <p>
              {breaching.length} {breaching.length === 1 ? "rule already breaches" : "rules already breach"}. Rescind will file a withdrawal for all{" "}
              {vault.availableShares.toFixed(2)} available shares within about 10 seconds, and the exit clock starts.
            </p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>Go back</button>
              <button type="button" className="btn" onClick={() => { setArmed(false); setConfirm(false); }}>Dry run instead</button>
              <button type="button" className="btn primary" onClick={submit} disabled={busy}>Arm and file</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
