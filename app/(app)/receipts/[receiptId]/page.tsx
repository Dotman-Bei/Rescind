import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishToggle } from "@/components/app/PublishToggle";
import { ReceiptBody } from "@/components/app/ReceiptBody";
import { StatusPill } from "@/components/app/StatusPill";
import { clockMs, span } from "@/lib/format";
import { gapMs } from "@/lib/sample";
import { getReceipt } from "@/lib/data";

export const dynamic = "force-dynamic";
import { withdrawalStatusText } from "@/lib/view";

type Params = { params: Promise<{ receiptId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Receipt ${(await params).receiptId}` };
}

export default async function ReceiptPage({ params }: Params) {
  const r = getReceipt((await params).receiptId);
  if (!r) notFound();
  const w = r.withdrawal;

  const responses = [
    {
      call: "POST /v2/vault/withdraw",
      at: w.requestedAt,
      body: JSON.stringify({ success: true, request_id: w.id, message: "withdrawal request submitted" }, null, 2),
    },
    ...(w.cancelledAt
      ? [{ call: `POST /v2/vault/:id/withdrawals/${w.id.slice(0, 8)}…/cancel`, at: w.cancelledAt, body: JSON.stringify({ success: true, message: "withdrawal cancelled successfully" }, null, 2) }]
      : []),
  ];

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/receipts">Receipts</Link>
        <span aria-hidden="true">/</span>
        <span>{r.id}</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Withdrawal filed {span(gapMs(r))} after the breaching fill</h1>
          <p className="sub">
            Receipt {r.id} · {r.vaultName} · mandate v{r.mandateVersion} · <StatusPill status={w.status}>{withdrawalStatusText(r)}</StatusPill>
          </p>
        </div>
        <div className="actions">
          <PublishToggle receiptId={r.id} initial={r.public} />
        </div>
      </div>

      <ReceiptBody r={r} />

      <section className="panel internal" aria-labelledby="int-h">
        <header>
          <h2 id="int-h">Internal</h2>
          <span className="meta">Never on the public page</span>
        </header>
        <div className="two-col">
          <dl className="kv">
            <div><dt>Breach confirmed (Rescind clock)</dt><dd>{clockMs(r.confirmedAt)}</dd></div>
            <div><dt>Confirmation to filing</dt><dd>{span(w.requestedAt - r.confirmedAt)}</dd></div>
            <div><dt>Snapshot latency</dt><dd>{r.snapshotLatencyMs} ms</dd></div>
            <div><dt>Mandate version</dt><dd>v{r.mandateVersion}</dd></div>
            <div>
              <dt>Chain on this watch</dt>
              <dd>
                {r.prev && <Link href={`/receipts/${r.prev}`} className="card-link">Previous {r.prev}</Link>}
                {r.next && <Link href={`/receipts/${r.next}`} className="card-link">Next {r.next}</Link>}
                {!r.prev && !r.next && <span className="faint">—</span>}
              </dd>
            </div>
          </dl>
          <div className="responses">
            {responses.map((x) => (
              <div key={x.call}>
                <p className="small muted">{x.call} · {clockMs(x.at)} · keys and signatures redacted</p>
                <pre className="well">{x.body}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
