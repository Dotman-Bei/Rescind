import { CopyButton } from "./CopyButton";
import { ExitClockBar } from "./ExitClockBar";
import { RuleLedger } from "./RuleLedger";
import { clockMs, shortId, span } from "@/lib/format";
import { fillsUrl, gapMs, historyUrl, type Receipt } from "@/lib/sample";
import { now } from "@/lib/data";

/** The public body of a receipt (PRD §17), shared by the verify page and the operator's receipt page. */
export function ReceiptBody({ r }: { r: Receipt }) {
  const w = r.withdrawal;
  const gap = gapMs(r);
  const fills = fillsUrl(r.vaultId);
  const history = historyUrl(r.vaultId);
  return (
    <div className="cols">
      <section className="panel span-12 gapblock" aria-labelledby="gap-h">
        <header>
          <h2 id="gap-h">The gap</h2>
          <span className="meta">Both times come from Strike, not from Rescind</span>
        </header>
        <div className="gap-axis">
          <div className="gap-end">
            <span className="gap-dot" aria-hidden="true" />
            <span className="muted">Breaching fill {r.fill.id}</span>
            <strong className="num">{clockMs(r.fill.ts)}</strong>
            <span className="muted small">
              {r.fill.symbol} {r.fill.side} {r.fill.size} at {r.fill.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="gap-span" aria-label={`Gap ${span(gap)}`}>
            <strong className="num">{span(gap)}</strong>
            <span className="gap-line" aria-hidden="true" />
            <span className="muted small">Rule confirmed on the 2nd read, filed {span(w.requestedAt - r.confirmedAt)} later</span>
          </div>
          <div className="gap-end right">
            <span className="gap-dot" aria-hidden="true" />
            <span className="muted">Withdrawal {shortId(w.id)} requested</span>
            <strong className="num">{clockMs(w.requestedAt)}</strong>
            <span className="muted small">{w.shares.toFixed(2)} shares, all available · est. ${w.estimatedUsd.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <section className="panel span-12" aria-labelledby="clock-h">
        <header>
          <h2 id="clock-h">Exit clock</h2>
          <span className="meta">{r.lockupDays}-day lockup: execute_at is the request plus {r.lockupDays * 24} h</span>
        </header>
        <ExitClockBar requestedAt={w.requestedAt} executeAt={w.executeAt} now={now()} cancelledAt={w.cancelledAt} />
        {r.cure && (
          <p className="cure">
            <strong>Cured at {clockMs(r.cure.confirmedAt).slice(0, 8)}.</strong> {r.cure.note} The cancel cost nothing and the
            shares unlocked.
          </p>
        )}
      </section>

      <section className="panel span-12" aria-labelledby="check-h">
        <header>
          <h2 id="check-h">Check it yourself</h2>
          <span className="meta">No login needed</span>
        </header>
        <ol className="steps">
          <li>
            <p>
              Open the vault&rsquo;s fills. Find fill <strong>{r.fill.id}</strong>: {r.fill.symbol}, {r.fill.side},{" "}
              {r.fill.size} at {r.fill.price.toLocaleString("en-US")}, at <strong className="num">{clockMs(r.fill.ts)}</strong>.
            </p>
            <div className="joined">
              <input className="input" readOnly value={fills} aria-label="Fills URL" />
              <a className="btn" href={fills} target="_blank" rel="noreferrer">Open fills</a>
            </div>
          </li>
          <li>
            <p>
              Open the vault&rsquo;s history. Find withdrawal <strong>{shortId(w.id)}</strong>: requested{" "}
              <strong className="num">{clockMs(w.requestedAt)}</strong>, status <strong>{w.status}</strong>.
            </p>
            <div className="joined">
              <input className="input" readOnly value={history} aria-label="History URL" />
              <a className="btn" href={history} target="_blank" rel="noreferrer">Open history</a>
            </div>
          </li>
          <li>
            <p>
              Subtract. The withdrawal&rsquo;s timestamp minus the fill&rsquo;s is the gap above: {span(gap)}. Strike reports
              both in milliseconds since 1970, UTC.
            </p>
          </li>
        </ol>
      </section>

      <section className="panel span-12" aria-labelledby="measured-h">
        <header>
          <h2 id="measured-h">What was measured</h2>
          <span className="meta">At confirmation</span>
        </header>
        <RuleLedger rules={r.rules} caption="Rules at confirmation" />
        <p className="small muted foot-note">
          Effective leverage is Σ|size × mark| ÷ vault equity, not the per-position leverage setting.
        </p>
      </section>

      <section className="panel span-12 chain" aria-labelledby="chain-h">
        <h2 id="chain-h">On this watch</h2>
        <p className="muted">
          {r.next
            ? "The leader broke the same rule again later. Rescind filed a new withdrawal and a new clock started; that receipt is not published."
            : "This is the latest receipt on this watch."}
        </p>
        <CopyButton value={`/verify/${r.id}`} label="Copy this link" />
      </section>
    </div>
  );
}
