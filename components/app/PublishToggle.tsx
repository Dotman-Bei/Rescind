"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { CopyButton } from "./CopyButton";

/** FR-33: publish or unpublish a receipt's public verify page. */
export function PublishToggle({ receiptId, initial, withLink = true }: { receiptId: string; initial: boolean; withLink?: boolean }) {
  const [on, setOn] = useState(initial);
  const [note, setNote] = useState<string | null>(null);

  async function change(next: boolean) {
    setOn(next);
    const r = await api(`/api/receipts/${receiptId}`, { method: "PATCH", body: { public: next } });
    if (r.sample) setNote("Sample build: not saved.");
    else if (!r.ok) {
      setOn(!next);
      setNote(r.error ?? "Couldn't change it.");
    } else setNote(null);
  }

  return (
    <span className="publish">
      <label className="publish-switch">
        <input type="checkbox" className="switch" checked={on} onChange={(e) => change(e.target.checked)} />
        <span>{on ? "Public" : "Private"}</span>
      </label>
      {withLink && on && <CopyButton value={`/verify/${receiptId}`} label="Copy link" className="text-btn" />}
      {note && <span className="small-note muted" role="status">{note}</span>}
    </span>
  );
}
