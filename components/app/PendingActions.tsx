"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

type Outcome = { text: string; tone: "pos" | "warn" | "neg" };

/** FR-15: cancel the pending Rescind withdrawal now, or keep it (disable auto-cancel for this one). */
export function PendingActions({
  watchId,
  withdrawalId,
  stillBreaching,
  autoCancel,
}: {
  watchId: string;
  withdrawalId: string;
  stillBreaching: boolean;
  autoCancel: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [kept, setKept] = useState(!autoCancel);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirm) return;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirm(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm]);

  async function cancel(pause: boolean) {
    setBusy(true);
    const res = await api(`/api/watches/${watchId}/cancel`, { method: "POST", body: { withdrawal_id: withdrawalId, pause } });
    setBusy(false);
    setConfirm(false);
    if (res.ok || res.sample)
      setOutcome({
        tone: "pos",
        text: `Cancel sent. Rescind will confirm it from Strike's history row${pause ? " and the watch is paused" : ""}.${res.sample ? " (Sample build: nothing was sent.)" : ""}`,
      });
    else if (res.status === 404 || /not found/.test(res.error ?? ""))
      setOutcome({ tone: "warn", text: "Strike says the withdrawal no longer exists: it already executed or was cancelled. Re-reading history." });
    else setOutcome({ tone: "neg", text: `The cancel failed (${res.error ?? res.status}). The withdrawal is still pending.` });
  }

  async function keep() {
    setBusy(true);
    const res = await api(`/api/watches/${watchId}/keep`, { method: "POST" });
    setBusy(false);
    if (res.ok || res.sample) {
      setKept(true);
      setOutcome({ tone: "warn", text: `Auto-cancel is off for this withdrawal. It runs to execution unless you cancel it.${res.sample ? " (Sample build.)" : ""}` });
    }
  }

  return (
    <div className="pending-actions">
      <div className="pending-buttons">
        <button type="button" className="btn" onClick={() => setConfirm(true)} disabled={busy}>Cancel withdrawal</button>
        {!kept && (
          <button type="button" className="text-btn" onClick={keep} disabled={busy}>Keep it</button>
        )}
      </div>
      {outcome && <p className={`notice ${outcome.tone === "warn" ? "" : outcome.tone}`} role="status">{outcome.text}</p>}

      {confirm && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirm(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-h" ref={dialog}>
            <h2 id="cancel-h">Cancel withdrawal {withdrawalId.slice(0, 8)}…?</h2>
            <p>The exit clock stops and your shares unlock. Cancelling costs nothing.</p>
            {stillBreaching && (
              <p className="notice">
                The rule is still breached. If the watch stays armed, Rescind files a new withdrawal on the next confirmed
                breach, about 10 s from now, and a new clock starts.
              </p>
            )}
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>Keep it running</button>
              {stillBreaching && (
                <button type="button" className="btn" onClick={() => cancel(true)} disabled={busy}>Cancel and pause watch</button>
              )}
              <button type="button" className="btn primary" onClick={() => cancel(false)} disabled={busy}>Cancel withdrawal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
