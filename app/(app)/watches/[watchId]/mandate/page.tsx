import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MandateEditor, type Draft } from "@/components/app/MandateEditor";
import { dayHm } from "@/lib/format";
import { ALL_MARKETS } from "@/lib/markets";
import { availableShares, effectiveLeverage, type Mandate } from "@/lib/sample";
import { getVaultForWatch, getWatch } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ watchId: string }> };

export const metadata: Metadata = { title: "Mandate" };

const toDraft = (m: Mandate): Draft => ({
  leverage: { on: m.maxLeverage !== null, value: String(m.maxLeverage ?? 5) },
  markets: { on: m.allowedMarkets !== null, list: m.allowedMarkets ?? ALL_MARKETS },
  drawdown: { on: m.maxDrawdownPct !== null, value: String(m.maxDrawdownPct ?? 15) },
  stake: { on: m.minLeaderStakePct !== null, value: String(m.minLeaderStakePct ?? 5) },
});

const summary = (m: Mandate) =>
  [
    m.maxLeverage !== null ? `max ${m.maxLeverage}x` : null,
    m.allowedLabel ? m.allowedLabel.toLowerCase() : null,
    m.maxDrawdownPct !== null ? `max ${m.maxDrawdownPct}% drawdown` : null,
    m.minLeaderStakePct !== null ? `leader keeps ${m.minLeaderStakePct}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");

export default async function MandatePage({ params }: Params) {
  const w = getWatch((await params).watchId);
  if (!w) notFound();
  const v = getVaultForWatch(w)!;
  const next = w.mandates[0].version + 1;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/app">Watches</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/watches/${w.id}`}>{v.name}</Link>
        <span aria-hidden="true">/</span>
        <span>Mandate</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Mandate</h1>
          <p className="sub">Editing creates version {next}. Receipts keep the version that fired them.</p>
        </div>
      </div>
      <MandateEditor
        mode="edit"
        watchId={w.id}
        nextVersion={next}
        initial={toDraft(w.mandates[0])}
        vault={{
          id: v.id,
          name: v.name,
          heldSymbols: v.positions.map((p) => p.symbol),
          effectiveLeverage: effectiveLeverage(v),
          sharePrice: v.sharePrice,
          peak: w.peakSharePrice,
          leaderSharePct: v.leaderSharePct,
          availableShares: availableShares(v),
          creditEncumbered: v.mine?.creditEncumbered ?? 0,
        }}
        aside={
          <section className="panel" aria-labelledby="ver-h">
            <header><h2 id="ver-h">Versions</h2></header>
            <ol className="versions">
              {w.mandates.map((m, k) => (
                <li key={m.version}>
                  <span className="ver-line">
                    <strong>v{m.version}</strong>
                    {k === 0 ? <span className="pill pos">Active</span> : <span className="faint">Retired</span>}
                  </span>
                  <span className="muted">{summary(m)}</span>
                  <span className="faint small">Since {dayHm(m.createdAt)}</span>
                </li>
              ))}
            </ol>
          </section>
        }
      />
    </>
  );
}
