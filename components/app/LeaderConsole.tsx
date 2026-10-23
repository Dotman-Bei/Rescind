"use client";
import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import { num, usd } from "@/lib/format";
import { CRYPTO_MAJORS, short } from "@/lib/markets";

type Pos = { symbol: string; size: number; mark: number };

const MARKS: Record<string, number> = { "BTC-USD": 81107.37, "ETH-USD": 2377.03, "SOL-USD": 103.4, "ADA-USD": 0.21088, "XRP-USD": 1.2961 };

/** Demo only: places orders on the demo vault with the leader's key (POST /v2/order with vault_id). */
export function LeaderConsole({ positions, equity, limit }: { positions: Pos[]; equity: number; limit: number }) {
  const [symbol, setSymbol] = useState("ETH-USD");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const notional = (ps: Pos[]) => ps.reduce((s, p) => s + Math.abs(p.size * p.mark), 0);
  const now = notional(positions) / equity;

  const after = useMemo(() => {
    const q = parseFloat(size);
    if (!(q > 0)) return null;
    const signed = side === "buy" ? q : -q;
    const ps = positions.map((p) => ({ ...p }));
    const hit = ps.find((p) => p.symbol === symbol);
    if (hit) hit.size += signed;
    else ps.push({ symbol, size: signed, mark: MARKS[symbol] });
    return notional(ps) / equity;
  }, [size, side, symbol, positions, equity]);

  // Presets: the exact order that takes the vault to a target effective leverage.
  function preset(target: number) {
    const gap = target * equity - notional(positions);
    if (gap > 0) {
      setSymbol("ETH-USD");
      setSide("buy");
      setSize((gap / MARKS["ETH-USD"]).toFixed(3));
    } else {
      const largest = [...positions].sort((a, b) => Math.abs(b.size * b.mark) - Math.abs(a.size * a.mark))[0];
      setSymbol(largest.symbol);
      setSide(largest.size > 0 ? "sell" : "buy");
      setSize((Math.min(Math.abs(largest.size), -gap / largest.mark)).toFixed(2));
    }
    setNote(null);
  }

  async function place(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("/api/dev/leader/order", { method: "POST", body: { symbol, side, size, type: "market" } });
    setNote(r.ok ? "Order sent. Watch the depositor's screen: Rescind reads every 5 s." : r.sample ? "Sample build: the order route isn't wired, so nothing was placed." : r.error ?? `Rejected (${r.status}).`);
  }

  return (
    <form className="leader-form" onSubmit={place}>
      <div className="presets-row">
        <span className="faint">Demo moves</span>
        <button type="button" className="btn small" onClick={() => preset(15)}>Push to 15x</button>
        <button type="button" className="btn small" onClick={() => preset(3)}>Cut to 3x</button>
      </div>
      <div className="field">
        <label htmlFor="mkt">Market</label>
        <select id="mkt" className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {CRYPTO_MAJORS.map((s) => <option key={s} value={s}>{short(s)} · mark {num(MARKS[s], MARKS[s] < 10 ? 4 : 2)}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="label">Side</span>
        <div className="segmented" role="group" aria-label="Side">
          <button type="button" aria-pressed={side === "buy"} onClick={() => setSide("buy")}>Buy</button>
          <button type="button" aria-pressed={side === "sell"} onClick={() => setSide("sell")}>Sell</button>
        </div>
      </div>
      <div className="field">
        <label htmlFor="sz">Size</label>
        <div className="num-field">
          <input id="sz" className="input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))} />
          <span className="unit">{short(symbol)}</span>
        </div>
        <span className="hint">{parseFloat(size) > 0 ? `${usd(parseFloat(size) * MARKS[symbol])} at mark, market order` : "Market order, reduce or add."}</span>
      </div>
      <dl className="kv after-kv">
        <div><dt>Effective leverage now</dt><dd>{num(now)}x</dd></div>
        <div>
          <dt>After this order</dt>
          <dd className={after !== null && after > limit ? "over" : undefined}>
            {after === null ? <span className="faint">—</span> : `${num(after)}x${after > limit ? `, over the ${limit}x mandate` : ""}`}
          </dd>
        </div>
      </dl>
      <button className="btn primary" type="submit" disabled={!(parseFloat(size) > 0)}>Place order</button>
      {note && <p className="notice" role="status">{note}</p>}
    </form>
  );
}
