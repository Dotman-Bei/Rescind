"use client";
import { useEffect, useState } from "react";
import { dayHm, clock, span } from "@/lib/format";

type Props = {
  requestedAt: number;
  executeAt: number;
  /** Fixed "now" for server-rendered sample data; the bar advances from it each second. */
  now: number;
  cancelledAt?: number;
  executedAt?: number;
  live?: boolean;
};

/** The exit clock: a track as long as the lockup, the elapsed part in the data hue,
 *  "now" as an ink tick, and a cancel or execution stamped where it happened. */
export function ExitClockBar({ requestedAt, executeAt, now, cancelledAt, executedAt, live = true }: Props) {
  const [t, setT] = useState(now);
  const ended = cancelledAt ?? executedAt;

  useEffect(() => {
    if (ended || !live) return;
    const start = Date.now();
    const id = window.setInterval(() => setT(now + (Date.now() - start)), 1000);
    return () => window.clearInterval(id);
  }, [now, ended, live]);

  const total = executeAt - requestedAt;
  const at = Math.min(ended ?? t, executeAt);
  const share = Math.max(0, Math.min(1, (at - requestedAt) / total));
  const pct = `${(share * 100).toFixed(3)}%`;

  return (
    <div className="clockbar">
      <div className="ends">
        <span>Requested<strong>{clock(requestedAt)}</strong></span>
        <span>Executes<strong>{dayHm(executeAt)}</strong></span>
      </div>
      <div
        className={ended ? "track ended" : "track"}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
        aria-label="Exit clock elapsed"
      >
        <div className="fill" style={{ width: pct }} />
        <div className="tick" style={{ left: pct }} />
      </div>
      <p className="label">
        {cancelledAt ? (
          <><strong>Cancelled at {clock(cancelledAt)}</strong>, {span(cancelledAt - requestedAt)} into a {span(total)} clock. The rest never ran.</>
        ) : executedAt ? (
          <><strong>Executed at {clock(executedAt)}</strong>.</>
        ) : (
          <><strong>{span(executeAt - t)} left</strong> · {span(t - requestedAt)} elapsed. Cancelling now costs nothing.</>
        )}
      </p>
    </div>
  );
}
