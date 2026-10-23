import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptBody } from "@/components/app/ReceiptBody";
import { StatusPill } from "@/components/app/StatusPill";
import { span } from "@/lib/format";
import { gapMs } from "@/lib/sample";
import { getReceipt } from "@/lib/data";

export const dynamic = "force-dynamic";
import { withdrawalStatusText } from "@/lib/view";

type Params = { params: Promise<{ receiptId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = getReceipt((await params).receiptId);
  return r?.public ? { title: `Receipt: ${r.vaultName}` } : { title: "Receipt not found" };
}

export default async function VerifyPage({ params }: Params) {
  const r = getReceipt((await params).receiptId);
  // Only published receipts are public (PRD FR-33).
  if (!r || !r.public) notFound();
  const gap = gapMs(r);

  return (
    <>
      <header className="report-bar">
        <Link href="/" className="wordmark-app">Rescind</Link>
        <nav aria-label="Rescind">
          <Link href="/#how">How Rescind works</Link>
          <Link href="/">What is this?</Link>
        </nav>
      </header>

      <main className="report">
        <div className="title-row">
          <div>
            <h1>Withdrawal filed {span(gap)} after the breaching fill</h1>
            <p className="sub">
              {r.vaultName} · mandate v{r.mandateVersion} · {r.breachedLabel.replace(">", "against a")} limit
            </p>
          </div>
          <div className="actions">
            <StatusPill status={r.withdrawal.status}>{withdrawalStatusText(r)}</StatusPill>
          </div>
        </div>

        <ReceiptBody r={r} />

        <p className="report-foot small faint">
          Rescind shows only data Strike already publishes. Not affiliated with Strike Finance. Not financial advice.
        </p>
      </main>
    </>
  );
}
