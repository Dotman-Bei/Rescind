"use client";
import { useState } from "react";
import { num, usd } from "@/lib/format";
import { short } from "@/lib/markets";
import type { Position } from "@/lib/sample";

const CAP = 10;
const notional = (p: Position) => Math.abs(p.size * p.mark);

/** Positions by notional at mark, largest first; the total always covers every row. */
export function PositionsTable({ positions, equity }: { positions: Position[]; equity: number }) {
  const [all, setAll] = useState(false);
  const rows = [...positions].sort((a, b) => notional(b) - notional(a));
  const shown = all ? rows : rows.slice(0, CAP);
  const total = rows.reduce((s, p) => s + notional(p), 0);
  const top = rows[0] ? notional(rows[0]) : 1;

  return (
    <>
      <div className="table-wrap">
        <table className="pos-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Side</th>
              <th className="n">Size</th>
              <th className="n">Mark</th>
              <th className="n">Notional at mark</th>
              <th className="share-col">Share of notional</th>
              <th className="n">Leverage setting</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p, k) => (
              <tr key={p.symbol}>
                <td className="name-link">{short(p.symbol)}</td>
                <td>{p.size < 0 ? "Short" : "Long"}</td>
                <td className="n">{num(Math.abs(p.size), p.size % 1 === 0 ? 0 : Math.abs(p.size) < 1 ? 4 : 2)}</td>
                <td className="n">{num(p.mark, p.mark < 10 ? 4 : 2)}</td>
                <td className="n">{usd(notional(p))}</td>
                <td className="share-col">
                  <span className="share-cell">
                    <span className="minibar wide" aria-hidden="true">
                      <span style={{ width: `${(notional(p) / top) * 100}%` }} className={k === 0 ? "lead" : undefined} />
                    </span>
                    <span className="num faint">{((notional(p) / total) * 100).toFixed(1)}%</span>
                  </span>
                </td>
                <td className="n">{p.leverage}x</td>
                <td className="faint">{p.margin === "cross" ? "Cross" : "Isolated"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pos-foot">
        {rows.length > CAP ? (
          <button type="button" className="text-btn" onClick={() => setAll(!all)} aria-expanded={all}>
            {all ? `Show the largest ${CAP}` : `Show all ${rows.length} positions`}
          </button>
        ) : (
          <span className="muted">{rows.length} {rows.length === 1 ? "position" : "positions"}</span>
        )}
        <span className="num pos-total">
          Total {usd(total)} ÷ equity {usd(equity, 0)} = <strong>{num(equity > 0 ? total / equity : Infinity)}x</strong>
        </span>
      </div>
    </>
  );
}
