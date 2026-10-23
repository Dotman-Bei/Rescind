"use client";
import { useState } from "react";
import { api } from "@/lib/client";

type Values = { pollIntervalS: number; breachConfirmN: number; cureConfirmN: number; cureGraceS: number; maxAutoCancels24h: number };

const FIELDS: { key: keyof Values; label: string; unit: string; min: number; max: number; hint: string }[] = [
  { key: "pollIntervalS", label: "Poll interval", unit: "s", min: 3, max: 60, hint: "How often each vault is read. 3 s at the least." },
  { key: "breachConfirmN", label: "Breach confirmations", unit: "reads", min: 1, max: 5, hint: "Breaching reads in a row before Rescind files." },
  { key: "cureConfirmN", label: "Cure confirmations", unit: "reads", min: 1, max: 10, hint: "Passing reads in a row before a cure counts." },
  { key: "cureGraceS", label: "Cure grace", unit: "s", min: 0, max: 600, hint: "Least time after filing before a cancel." },
  { key: "maxAutoCancels24h", label: "Max auto-cancels per 24 h", unit: "", min: 1, max: 10, hint: "After this many, auto-cancel turns itself off." },
];

/** The summary this panel produces, shown beside it (FRONTEND.md §3.16). */
export function engineSummary(v: Values) {
  const breach = v.pollIntervalS * v.breachConfirmN;
  const cure = Math.max(v.pollIntervalS * v.cureConfirmN, v.cureGraceS);
  return `A breach is confirmed within about ${breach} s, and a cure within about ${cure} s of the leader fixing it. After ${v.maxAutoCancels24h} automatic cancels in a day, Rescind stops cancelling and lets the withdrawal run.`;
}

export function EngineSettings({ initial }: { initial: Values }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState<string | null>(null);
  const errors = FIELDS.filter((f) => !(v[f.key] >= f.min && v[f.key] <= f.max)).map((f) => f.key);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (errors.length) return;
    const r = await api("/api/settings", { method: "PATCH", body: v });
    setSaved(r.ok ? "Saved. The worker picks it up on its next tick." : r.sample ? "Sample build: not saved." : r.error ?? `Failed (${r.status}).`);
  }

  return (
    <form className="settings-form" onSubmit={save} noValidate>
      <p className="engine-summary" aria-live="polite">{errors.length ? "Fix the values below to see what they do." : engineSummary(v)}</p>
      <div className="field-grid">
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            <div className="num-field">
              <input
                id={f.key}
                className="input"
                inputMode="numeric"
                value={Number.isNaN(v[f.key]) ? "" : v[f.key]}
                aria-invalid={errors.includes(f.key)}
                aria-describedby={`${f.key}-hint`}
                onChange={(e) => {
                  setSaved(null);
                  setV({ ...v, [f.key]: parseInt(e.target.value.replace(/\D/g, ""), 10) });
                }}
              />
              {f.unit && <span className="unit">{f.unit}</span>}
            </div>
            <span id={`${f.key}-hint`} className={errors.includes(f.key) ? "field-error" : "hint"}>
              {errors.includes(f.key) ? `Between ${f.min} and ${f.max}.` : f.hint}
            </span>
          </div>
        ))}
      </div>
      <div className="form-foot">
        {saved && <span className="small muted" role="status">{saved}</span>}
        <button className="btn primary" type="submit" disabled={errors.length > 0}>Save engine settings</button>
      </div>
    </form>
  );
}
