import Link from "next/link";
import { ExitClockBar } from "@/components/app/ExitClockBar";
import { PendingActions } from "@/components/app/PendingActions";
import { StatusPill } from "@/components/app/StatusPill";
import { ago, day, hm, span } from "@/lib/format";
import { getAccount, getReceipts, getSettings, getWatches, isLive, now } from "@/lib/data";
import { AutoRefresh } from "@/components/app/AutoRefresh";

export const dynamic = "force-dynamic";
import { MODE_LABEL, headlineRule, pendingFor, rulesCount, stateText, vaultName } from "@/lib/view";

export const metadata = { title: "Watches" };

export default function WatchesHome() {
  const watches = getWatches();
  const receipts = getReceipts();
  const account = getAccount();
  const settings = getSettings();
  const SAMPLE_NOW = now();
  const pending = watches.map((w) => ({ w, r: pendingFor(w) })).filter((x) => x.r);
  const lead = pending[0];
  const published = receipts.filter((r) => r.public).length;

  return (
    <>
      <AutoRefresh on={isLive()} />
      <div className="title-row">
        <div>
          <h1>Watches</h1>
          <p className="sub">
            {lead
              ? `${vaultName(lead.w)} broke your ${lead.r!.rules.find((x) => x.status === "breach")?.limit}x limit at ${hm(lead.r!.fill.ts)}. Your withdrawal executes tomorrow at ${hm(lead.r!.withdrawal.executeAt)} unless the leader cures.`
              : (() => {
                  const out = watches.filter((w) => w.rules.some((r) => r.status === "breach"));
                  const dry = watches.filter((w) => w.mode === "dry_run").length;
                  if (!out.length) return "Every watched vault is inside its mandate. No exit clock is running.";
                  return `${out.length} of ${watches.length} vaults are outside their mandate now.${dry === watches.length ? " All are dry runs, so nothing was filed." : ""}`;
                })()}
          </p>
        </div>
        <div className="actions">
          <span className="stamp">Polled {ago(SAMPLE_NOW - account.lastPollAt)} ago</span>
          <Link href="/vaults" className="btn primary">Set a mandate</Link>
        </div>
      </div>

      <div className="stack">
        {pending.map(({ w, r }) => (
          <section className="panel pending" key={w.id} aria-labelledby={`p-${w.id}`}>
            <header>
              <h2 id={`p-${w.id}`}>
                Exit clock running · <Link href={`/watches/${w.id}`} className="name-link">{vaultName(w)}</Link>
              </h2>
              <span className="meta">Withdrawal {r!.withdrawal.id.slice(0, 8)}… · {r!.withdrawal.shares.toFixed(2)} shares · est. ${r!.withdrawal.estimatedUsd.toFixed(2)}</span>
            </header>
            <div className="pending-body">
              <ExitClockBar requestedAt={r!.withdrawal.requestedAt} executeAt={r!.withdrawal.executeAt} now={SAMPLE_NOW} />
              <div className="pending-side">
                <p>
                  <strong>{headlineRule(w)}.</strong>{" "}
                  {w.autoCancel
                    ? `Auto-cancel is on: Rescind cancels when every rule passes for ${settings.cureConfirmN} reads. ${w.autoCancels24h} of ${settings.maxAutoCancels24h} auto-cancels used in 24 h.`
                    : "Auto-cancel is off for this withdrawal."}
                </p>
                <PendingActions watchId={w.id} withdrawalId={r!.withdrawal.id} stillBreaching autoCancel={w.autoCancel} />
              </div>
            </div>
          </section>
        ))}

        <section className="panel flush" aria-labelledby="list-h">
          <header>
            <h2 id="list-h">All watches</h2>
            <span className="meta">{watches.length} watches · polled every {settings.pollIntervalS} s</span>
          </header>
          <div className="table-wrap">
            <table className="watch-table">
              <thead>
                <tr>
                  <th>Vault</th>
                  <th>State</th>
                  <th>Leading rule</th>
                  <th className="n">Rules breached</th>
                  <th className="n">Exit clock</th>
                </tr>
              </thead>
              <tbody>
                {watches.map((w) => {
                  const c = rulesCount(w);
                  const p = pendingFor(w);
                  const state = stateText(w);
                  return (
                    <tr key={w.id}>
                      <td>
                        <Link href={`/watches/${w.id}`} className="name-link">{vaultName(w)}</Link>
                        <span className="sub">{MODE_LABEL[w.mode]} · mandate v{w.mandates[0].version}</span>
                      </td>
                      <td>
                        <StatusPill status={state === "Withdrawal pending" ? "pending" : state === "Would file" ? "breach" : "pass"}>
                          {state}
                        </StatusPill>
                      </td>
                      <td>{headlineRule(w)}</td>
                      <td className="n">
                        {c.breached} of {c.on}
                        {c.unknown > 0 && <span className="sub">{c.unknown} unknown</span>}
                      </td>
                      <td className="n">
                        {p ? span(p.withdrawal.executeAt - SAMPLE_NOW) + " left" : <span className="faint">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="kpis" aria-label="Account">
          <div className="kpi">
            <div className="kpi-label">Account</div>
            <div className="kpi-value">{account.label}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">API key</div>
            <div className="kpi-value">Active</div>
            <div className="note">Expires {day(account.keyExpiresAt)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Worker</div>
            <div className="kpi-value">{Math.round((SAMPLE_NOW - account.workerHeartbeatAt) / 1000)}<small>s ago</small></div>
            <div className="note">Last heartbeat</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Receipts</div>
            <div className="kpi-value">{receipts.length}</div>
            <div className="note"><Link href="/receipts" className="card-link">{published} public</Link></div>
          </div>
        </section>
      </div>
    </>
  );
}
