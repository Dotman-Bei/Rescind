"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

/** FR-05: disarm every watch and delete the stored private key, with a confirmation that names the account. */
export function DisconnectButton({ label, watches }: { label: string; watches: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function go() {
    const r = await api("/api/keys/current", { method: "DELETE" });
    setOpen(false);
    setNote(r.ok ? "Disconnected. Now revoke the key on Strike's API keys page." : r.sample ? "Sample build: nothing was deleted." : r.error ?? `Failed (${r.status}).`);
  }

  return (
    <>
      <button type="button" className="btn danger" onClick={() => setOpen(true)}>Disconnect account</button>
      {note && <p className="notice" role="status">{note}</p>}
      {open && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dc-h">
            <h2 id="dc-h">Disconnect {label}?</h2>
            <p>
              All {watches} watches stop and the stored private key is deleted. Any pending withdrawal stays on Strike and runs to
              execution unless you cancel it there.
            </p>
            <div className="field">
              <label htmlFor="dc-confirm">Type {label} to confirm</label>
              <input id="dc-confirm" ref={ref} className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </div>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Keep connected</button>
              <button type="button" className="btn danger" disabled={typed !== label} onClick={go}>Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
