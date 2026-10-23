"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

type Mode = "armed" | "dry_run" | "paused";

/** FR-13 mode switch, FR-14 auto-cancel, FR-23 flapping guard, FR-16 file now. */
export function WatchControls({
  watchId,
  initialMode,
  canArm,
  autoCancel: initialAuto,
  autoCancelsUsed,
  maxAutoCancels,
  hasPending,
  mandateVersion,
  mandateSince,
}: {
  watchId: string;
  initialMode: Mode;
  canArm: boolean;
  autoCancel: boolean;
  autoCancelsUsed: number;
  maxAutoCancels: number;
  hasPending: boolean;
  mandateVersion: number;
  mandateSince: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [auto, setAuto] = useState(initialAuto);
  const [note, setNote] = useState<string | null>(null);
  const [confirmFile, setConfirmFile] = useState(false);
  const guardTripped = autoCancelsUsed >= maxAutoCancels;

  async function patch(body: Record<string, unknown>, done: string) {
    const r = await api(`/api/watches/${watchId}`, { method: "PATCH", body });
    setNote(r.ok ? done : r.sample ? `${done} (Sample build: not saved.)` : r.error ?? `Failed (${r.status}).`);
  }

  async function fileNow() {
    setConfirmFile(false);
    const r = await api(`/api/watches/${watchId}/withdraw`, { method: "POST" });
    setNote(r.ok ? "Withdrawal submitted. Waiting for Strike's history row to show it pending." : r.sample ? "Sample build: nothing was filed." : r.error ?? `Filing failed (${r.status}).`);
  }

  return (
    <div className="controls">
      <div className="control-block">
        <span className="label">Mode</span>
        <div className="segmented" role="group" aria-label="Mode">
          {(["armed", "dry_run", "paused"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              disabled={m === "armed" && !canArm}
              onClick={() => {
                setMode(m);
                patch({ mode: m }, m === "armed" ? "Armed." : m === "dry_run" ? "Switched to dry run: Rescind evaluates and never writes." : "Paused: no reads until you resume.");
              }}
            >
              {m === "armed" ? "Armed" : m === "dry_run" ? "Dry run" : "Paused"}
            </button>
          ))}
        </div>
        {!canArm && <span className="small-note muted">No available shares, so this watch can&rsquo;t arm.</span>}
      </div>

      <label className="switch-row">
        <span>
          Cancel on cure
          <span className="sub">
            {guardTripped
              ? `Off: ${autoCancelsUsed} automatic cancels in 24 h hit the limit. A flapping leader could keep restarting your clock.`
              : `${autoCancelsUsed} of ${maxAutoCancels} automatic cancels used in 24 h. At ${maxAutoCancels}, it turns itself off.`}
          </span>
        </span>
        <input
          type="checkbox"
          className="switch"
          checked={auto && !guardTripped}
          onChange={(e) => {
            setAuto(e.target.checked);
            patch({ auto_cancel: e.target.checked }, e.target.checked ? "Auto-cancel on." : "Auto-cancel off: withdrawals run to execution unless you cancel.");
          }}
        />
      </label>

      <dl className="kv control-kv">
        <div>
          <dt>Mandate</dt>
          <dd>v{mandateVersion} · since {mandateSince} · <Link href={`/watches/${watchId}/mandate`} className="text-btn">Edit</Link></dd>
        </div>
      </dl>

      <div className="control-block">
        <button type="button" className="btn" disabled={hasPending || mode !== "armed"} onClick={() => setConfirmFile(true)}>
          File withdrawal now
        </button>
        <span className="small-note muted">
          {hasPending ? "One Rescind withdrawal at a time: one is already pending." : mode !== "armed" ? "Only an armed watch can file." : "Files for all available shares, whatever the rules say."}
        </span>
      </div>

      {note && <p className="notice" role="status">{note}</p>}

      {confirmFile && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirmFile(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="file-h">
            <h2 id="file-h">File a withdrawal now?</h2>
            <p>The exit clock starts at once. No rule is breached, so Rescind won&rsquo;t cancel it on its own.</p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setConfirmFile(false)}>Go back</button>
              <button type="button" className="btn primary" onClick={fileNow}>File withdrawal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
