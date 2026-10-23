"use client";
import { useState } from "react";
import { clock, clockMs, day, range } from "@/lib/format";
import type { Activity } from "@/lib/sample";

const FILTERS: { id: string; label: string; kinds: Activity["kind"][] }[] = [
  { id: "all", label: "All", kinds: [] },
  { id: "breach", label: "Breaches", kinds: ["breach"] },
  { id: "filing", label: "Filings", kinds: ["filing"] },
  { id: "cancel", label: "Cancels", kinds: ["cancel"] },
  { id: "error", label: "Errors", kinds: ["error"] },
];

const KIND: Record<Activity["kind"], { label: string; cls: string }> = {
  evaluation: { label: "Reads", cls: "pill" },
  breach: { label: "Breach", cls: "pill neg" },
  filing: { label: "Filing", cls: "pill warn" },
  cancel: { label: "Cancel", cls: "pill pos" },
  execution: { label: "Executed", cls: "pill" },
  error: { label: "Error", cls: "pill neg" },
  config: { label: "Mandate", cls: "pill" },
};

export function ActivityLog({ rows }: { rows: Activity[] }) {
  const [f, setF] = useState("all");
  const filter = FILTERS.find((x) => x.id === f)!;
  const shown = filter.kinds.length ? rows.filter((r) => filter.kinds.includes(r.kind)) : rows;
  let lastDay = "";

  return (
    <>
      <div className="segmented filters" role="group" aria-label="Filter activity">
        {FILTERS.map((x) => {
          const n = x.kinds.length ? rows.filter((r) => x.kinds.includes(r.kind)).length : rows.length;
          return (
            <button key={x.id} type="button" aria-pressed={f === x.id} onClick={() => setF(x.id)}>
              {x.label} <span className="faint">{n}</span>
            </button>
          );
        })}
      </div>
      <section className="panel flush" aria-label="Activity">
        <ol className="log">
          {shown.map((a) => {
            const d = day(a.ts);
            const head = d !== lastDay ? d : null;
            lastDay = d;
            return (
              <li key={a.ts} className="log-row">
                <span className="log-when num">
                  {head && <span className="log-day">{head}</span>}
                  {a.until ? range(a.ts, a.until) : a.ts % 1000 ? clockMs(a.ts) : clock(a.ts)}
                </span>
                <span className="log-what">
                  <span className={KIND[a.kind].cls}>{a.text.startsWith("Cure") ? "Cure" : KIND[a.kind].label}</span>
                  <strong>{a.count ? `${a.count.toLocaleString("en-US")} ${a.text.toLowerCase()}` : a.text}</strong>
                </span>
                <span className="log-detail muted">{a.detail}</span>
              </li>
            );
          })}
          {!shown.length && (
            <li className="log-row empty-row">
              <span className="muted">No {filter.label.toLowerCase()} on this watch yet.</span>
            </li>
          )}
        </ol>
      </section>
    </>
  );
}
