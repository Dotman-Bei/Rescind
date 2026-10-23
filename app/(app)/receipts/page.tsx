import Link from "next/link";
import { PublishToggle } from "@/components/app/PublishToggle";
import { StatusPill } from "@/components/app/StatusPill";
import { clockMs, dayHm, shortId, span } from "@/lib/format";
import { gapMs } from "@/lib/sample";
import { getReceipts } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Receipts" };

export default function ReceiptsPage() {
  const list = [...getReceipts()].sort((a, b) => b.confirmedAt - a.confirmedAt);
  const published = list.filter((r) => r.public).length;
  const latestPublic = list.find((r) => r.public);
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Receipts</h1>
          <p className="sub">
            {list.length} receipts · {published} public. Each one pairs the fill that broke a rule with the withdrawal Rescind
            filed for it.
          </p>
        </div>
      </div>

      <div className="stack">
        <section className="panel flush" aria-labelledby="rl-h">
          <header>
            <h2 id="rl-h">All receipts</h2>
            <span className="meta">Newest first</span>
          </header>
          <div className="table-wrap">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Rule broken</th>
                  <th className="n">Gap</th>
                  <th>Withdrawal</th>
                  <th className="n">Confirmed</th>
                  <th>Public page</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No receipts yet. Rescind writes one the moment an armed watch files a withdrawal; dry runs never file.{" "}
                      <Link href="/app" className="text-btn">See your watches</Link>
                    </td>
                  </tr>
                )}
                {list.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/receipts/${r.id}`} className="name-link">{r.id}</Link>
                      <span className="sub">{r.vaultName} · v{r.mandateVersion}</span>
                    </td>
                    <td>{r.breachedLabel}</td>
                    <td className="n">{span(gapMs(r))}</td>
                    <td><StatusPill status={r.withdrawal.status} /></td>
                    <td className="n">{dayHm(r.confirmedAt)}</td>
                    <td><PublishToggle receiptId={r.id} initial={r.public} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {latestPublic && (
          <section className="panel" aria-labelledby="prev-h">
            <header>
              <h2 id="prev-h">Latest public receipt, as a verifier sees it</h2>
              <Link href={`/verify/${latestPublic.id}`} className="card-link">Open public page</Link>
            </header>
            <div className="gap-axis">
              <div className="gap-end">
                <span className="gap-dot" aria-hidden="true" />
                <span className="muted">Breaching fill {latestPublic.fill.id}</span>
                <strong className="num">{clockMs(latestPublic.fill.ts)}</strong>
              </div>
              <div className="gap-span">
                <strong className="num">{span(gapMs(latestPublic))}</strong>
                <span className="gap-line" aria-hidden="true" />
                <span className="muted small">{latestPublic.breachedLabel}</span>
              </div>
              <div className="gap-end right">
                <span className="gap-dot" aria-hidden="true" />
                <span className="muted">Withdrawal {shortId(latestPublic.withdrawal.id)} requested</span>
                <strong className="num">{clockMs(latestPublic.withdrawal.requestedAt)}</strong>
              </div>
            </div>
          </section>
        )}

        <div className="cols stretch">
          <section className="panel span-6" aria-labelledby="pub-h">
            <header><h2 id="pub-h">What a public page shows</h2></header>
            <ul className="plain-list">
              <li>The vault, the rule broken, and the measured value against your limit.</li>
              <li>The breaching fill and the withdrawal row, each linked to Strike&rsquo;s public URL.</li>
              <li>The two timestamps and the gap between them.</li>
              <li>The exit clock, and the cure or execution that ended it.</li>
            </ul>
          </section>
          <section className="panel span-6" aria-labelledby="priv-h">
            <header><h2 id="priv-h">What stays private</h2></header>
            <ul className="plain-list">
              <li>Your Strike account id, unless Strike already shows it in the vault&rsquo;s public history.</li>
              <li>Your API key and everything Rescind stores about it.</li>
              <li>Raw API responses and snapshot latency.</li>
              <li>Other watches and their mandates.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
