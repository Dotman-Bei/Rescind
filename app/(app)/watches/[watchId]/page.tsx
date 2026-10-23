import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/app/CopyButton";
import { ExitClockBar } from "@/components/app/ExitClockBar";
import { PendingActions } from "@/components/app/PendingActions";
import { RuleLedger } from "@/components/app/RuleLedger";
import { WatchControls } from "@/components/app/WatchControls";
import { ago, clock, day, dayHm, hm, range } from "@/lib/format";
import { availableShares } from "@/lib/sample";
import { getAccount, getActivity, getReceipts, getSettings, getVaultForWatch, getWatch, isLive, now } from "@/lib/data";
import { AutoRefresh } from "@/components/app/AutoRefresh";

export const dynamic = "force-dynamic";
import { headlineRule, pendingFor, stateText } from "@/lib/view";

type Params = { params: Promise<{ watchId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = getWatch((await params).watchId);
  return { title: w ? getVaultForWatch(w)?.name : "Watch" };
}

const STATES = [
  { id: "clear", label: "Clear" },
  { id: "filing", label: "Filing" },
  { id: "pending", label: "Withdrawal pending" },
  { id: "cancelling", label: "Cancelling" },
  { id: "exited", label: "Exited" },
];

export default async function WatchDetail({ params }: Params) {
  const w = getWatch((await params).watchId);
  if (!w) notFound();
  const v = getVaultForWatch(w)!;
  const account = getAccount();
  const settings = getSettings();
  const receipts = getReceipts();
  const SAMPLE_NOW = now();
  const pending = pendingFor(w);
  const breach = w.rules.find((r) => r.status === "breach");
  const log = getActivity(w.id);
  const last = receipts.filter((r) => r.watchId === w.id).at(-1);
  const current =
    w.state === "armed_pending" ? "pending" : w.state === "armed_filing" ? "filing" : w.state === "armed_cancelling" ? "cancelling" : w.state === "exited" ? "exited" : "clear";

  const finding = pending
    ? `Breach since ${clock(pending.confirmedAt)}. ${headlineRule(w)}. The withdrawal executes ${day(pending.withdrawal.executeAt)} at ${hm(pending.withdrawal.executeAt)}.`
    : w.mode === "dry_run" && breach
      ? `Dry run. ${headlineRule(w)}: armed, this would have filed. Nothing has been sent to Strike.`
      : `Inside the mandate. ${headlineRule(w)}.`;

  return (
    <>
      <AutoRefresh on={isLive()} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/app">Watches</Link>
        <span aria-hidden="true">/</span>
        <span>{v.name}</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>{v.name}</h1>
          <p className="sub">{finding}</p>
        </div>
        <div className="actions">
          <span className="stamp">Polled {ago(SAMPLE_NOW - account.lastPollAt)} ago</span>
          <Link href={`/vaults/${v.id}`} className="btn">Vault</Link>
        </div>
      </div>

      {w.mode !== "dry_run" && (
        <ol className="states" aria-label="Watch state">
          {STATES.map((s) => (
            <li key={s.id} aria-current={s.id === current ? "step" : undefined}>
              {s.id === current && <span className="dot" aria-hidden="true" />}
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <div className="cols">
        <div className="stack span-8">
          <section className="panel" aria-labelledby="w-h">
            {pending ? (
              <>
                <header>
                  <h2 id="w-h">Withdrawal pending</h2>
                  <span className="meta">
                    <Link href={`/receipts/${pending.id}`} className="card-link">Receipt</Link>
                  </span>
                </header>
                <ExitClockBar requestedAt={pending.withdrawal.requestedAt} executeAt={pending.withdrawal.executeAt} now={SAMPLE_NOW} />
                <dl className="kv pending-kv">
                  <div>
                    <dt>Withdrawal id</dt>
                    <dd className="id-cell">
                      <span className="id">{pending.withdrawal.id.slice(0, 8)}…</span>
                      <CopyButton value={pending.withdrawal.id} className="text-btn" />
                    </dd>
                  </div>
                  <div><dt>Requested</dt><dd>{dayHm(pending.withdrawal.requestedAt)}:{clock(pending.withdrawal.requestedAt).slice(6)}</dd></div>
                  <div><dt>Shares</dt><dd>{pending.withdrawal.shares.toFixed(2)}, all available · est. ${pending.withdrawal.estimatedUsd.toFixed(2)}</dd></div>
                  <div><dt>Breaching fill</dt><dd>{pending.fill.id} · {pending.fill.symbol} {pending.fill.side} {pending.fill.size}</dd></div>
                </dl>
                <PendingActions watchId={w.id} withdrawalId={pending.withdrawal.id} stillBreaching={!!breach} autoCancel={w.autoCancel} />
              </>
            ) : (
              <>
                <header>
                  <h2 id="w-h">{w.mode === "dry_run" ? "Dry run" : "No withdrawal pending"}</h2>
                </header>
                <p className="lead-line">
                  {w.mode === "dry_run"
                    ? breach
                      ? "Breaching since the first read. Armed, Rescind would have filed for all available shares and the exit clock would be running."
                      : "Every rule passes. A dry run logs what it would do and never writes to Strike."
                    : `Every rule passes. The next confirmed breach files within about ${settings.pollIntervalS * settings.breachConfirmN} s.`}
                </p>
                <dl className="kv pending-kv">
                  <div><dt>Evaluations</dt><dd>{w.evaluations.toLocaleString("en-US")} since {day(w.createdAt)}</dd></div>
                  <div><dt>Peak share price since {w.mode === "dry_run" ? "watched" : "armed"}</dt><dd>{w.peakSharePrice.toFixed(4)} · now {v.sharePrice.toFixed(4)}</dd></div>
                  <div><dt>Last receipt</dt><dd>{last ? <Link href={`/receipts/${last.id}`} className="card-link">{last.id}</Link> : <span className="faint">None yet</span>}</dd></div>
                  <div><dt>Shares you could withdraw</dt><dd>{availableShares(v).toFixed(2)}</dd></div>
                </dl>
                {w.mode === "dry_run" && availableShares(v) === 0 && (
                  <div className="panel-foot">
                    <span className="muted">To arm it, deposit {v.minDeposit ? `at least $${v.minDeposit} ` : ""}into the vault from this account.</span>
                    <Link href={`/vaults/${v.id}`} className="card-link">Open vault</Link>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="rules-h">
            <header>
              <h2 id="rules-h">Rules, live</h2>
              <span className="meta">Mandate v{w.mandates[0].version} · {stateText(w)}</span>
            </header>
            <RuleLedger rules={w.rules} caption="Rules at the latest read" />
          </section>
        </div>

        <div className="stack span-4">
          <section className="panel" aria-labelledby="ctl-h">
            <header><h2 id="ctl-h">Controls</h2></header>
            <WatchControls
              watchId={w.id}
              initialMode={w.mode}
              canArm={availableShares(v) > 0 || w.mode === "armed"}
              autoCancel={w.autoCancel}
              autoCancelsUsed={w.autoCancels24h}
              maxAutoCancels={settings.maxAutoCancels24h}
              hasPending={!!pending}
              mandateVersion={w.mandates[0].version}
              mandateSince={dayHm(w.mandates[0].createdAt)}
            />
          </section>

          <section className="panel recent" aria-labelledby="act-h">
            <header>
              <h2 id="act-h">Recent activity</h2>
            </header>
            <ol className="recent-list">
              {log.slice(0, 4).map((a) => (
                <li key={a.ts} className={`kind-${a.kind}`}>
                  <span className="num faint">{a.until ? range(a.ts, a.until) : clock(a.ts)}</span>
                  <span>{a.count ? `${a.count.toLocaleString("en-US")} ${a.text.toLowerCase()}` : a.text}</span>
                </li>
              ))}
            </ol>
            <div className="panel-foot">
              <Link href={`/watches/${w.id}/activity`} className="card-link">View all activity</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
