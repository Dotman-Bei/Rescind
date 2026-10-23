import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clock, num, usd } from "@/lib/format";
import { GROUP_LABEL, groupOf, type MarketGroup } from "@/lib/markets";
import { PositionsTable } from "@/components/app/PositionsTable";
import { availableShares, effectiveLeverage, notional, vault, watchForVault } from "@/lib/sample";

type Params = { params: Promise<{ vaultId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: vault((await params).vaultId)?.name ?? "Vault" };
}

export default async function VaultView({ params }: Params) {
  const v = vault((await params).vaultId);
  if (!v) notFound();
  const w = watchForVault(v.id);
  const lev = effectiveLeverage(v);
  const total = v.positions.reduce((s, p) => s + notional(p), 0);
  const groups = (Object.keys(GROUP_LABEL) as MarketGroup[])
    .map((g) => {
      const ps = v.positions.filter((p) => groupOf(p.symbol) === g);
      return { g, n: ps.length, usd: ps.reduce((s, p) => s + notional(p), 0) };
    })
    .sort((a, b) => b.usd - a.usd);
  const topGroup = Math.max(groups[0]?.usd ?? 0, 1);
  const at20 = v.positions.filter((p) => p.leverage === 20).length;
  const avail = availableShares(v);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/vaults">Vaults</Link>
        <span aria-hidden="true">/</span>
        <span>{v.name}</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>{v.name}</h1>
          <p className="sub">
            {v.type === "protocol" ? "Protocol vault, run by Strike" : `Leader ${v.leader}`} · {v.feePct}% fee · {v.lockupDays}-day lockup ·{" "}
            {v.status === "active" ? "Active" : "Paused"}
          </p>
        </div>
        <div className="actions">
          <span className="stamp">Snapshot {clock(Date.UTC(2026, 9, 22, 20, 9, 58))}</span>
          {v.type === "protocol" ? (
            <span className="btn" aria-disabled="true">Read only</span>
          ) : w ? (
            <Link href={`/watches/${w.id}`} className="btn primary">Open watch</Link>
          ) : (
            <Link href={`/watches/new?vault=${v.id}`} className="btn primary">Watch this vault</Link>
          )}
        </div>
      </div>

      <div className="stack">
        <section className="kpis" aria-label="Vault now">
          <div className="kpi">
            <div className="kpi-label">Effective leverage</div>
            <div className="kpi-value answer">{num(lev)}<small>x</small></div>
            <div className="note">{at20 ? `${at20} of ${v.positions.length} positions on a 20x setting` : `${v.positions.length} positions`}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Equity</div>
            <div className="kpi-value">{usd(v.equity)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Share price</div>
            <div className="kpi-value">{v.sharePrice.toFixed(4)}</div>
            <div className="note">Started at 1.0000</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Leader stake</div>
            <div className="kpi-value">{v.leaderSharePct === null ? <span className="faint">—</span> : `${num(v.leaderSharePct)}%`}</div>
            <div className="note">{v.leaderSharePct === null ? "Leader row not matched" : "Of all shares"}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Depositors</div>
            <div className="kpi-value">{v.depositors}</div>
          </div>
        </section>

        <div className="cols stretch">
          <section className="panel span-6 summary" aria-labelledby="mine-h">
            <header>
              <h2 id="mine-h">Your position</h2>
              <span className="meta">GET /v2/vault/position</span>
            </header>
            <dl className="kv">
              <div><dt>Shares</dt><dd>{num(v.mine?.shares ?? 0)}</dd></div>
              <div><dt>Locked in a withdrawal</dt><dd>{num(v.mine?.locked ?? 0)}</dd></div>
              <div><dt>Available to arm</dt><dd>{num(avail)}</dd></div>
              <div><dt>Value at {v.sharePrice.toFixed(4)}</dt><dd>{usd((v.mine?.shares ?? 0) * v.sharePrice)}</dd></div>
            </dl>
            {!v.mine && (
              <p className="muted small-note">
                {v.type === "protocol" ? "Protocol vaults can't be armed." : "With no shares, a watch here runs as a dry run: it evaluates and logs, and never files."}
              </p>
            )}
            <h3 className="sub-h">Pending withdrawals in this vault</h3>
            {v.pendingInVault.length ? (
              <div className="rows">
                {v.pendingInVault.map((q) => (
                  <div className="line-row queue-row" key={q.id}>
                    <span>{q.who}<span className="sub">{q.id.slice(0, 8)}… · requested {clock(q.requestedAt)}</span></span>
                    <span className="num">{num(q.shares)} shares</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">None. A withdrawal filed now would be first in line for execution capacity.</p>
            )}
          </section>

          <section className="panel span-6 summary" aria-labelledby="groups-h">
            <header>
              <h2 id="groups-h">Exposure by market group</h2>
              <span className="meta">What allowed markets judges</span>
            </header>
            <div className="rows">
              {groups.map((x, k) => (
                <div className="group-row" key={x.g}>
                  <div className="group-line">
                    <span>{GROUP_LABEL[x.g]} <span className="faint">· {x.n} {x.n === 1 ? "market" : "markets"}</span></span>
                    <span className={x.n ? "num" : "num faint"}>{usd(x.usd, 0)} <span className="faint">{num(total ? (x.usd / total) * 100 : 0, 1)}%</span></span>
                  </div>
                  <span className="minibar wide" aria-hidden="true"><span style={{ width: `${(x.usd / topGroup) * 100}%` }} className={k === 0 && x.usd > 0 ? "lead" : undefined} /></span>
                </div>
              ))}
            </div>
            <p className="summary-foot num">Total notional {usd(total)} across {v.positions.length} {v.positions.length === 1 ? "position" : "positions"}</p>
          </section>

          <section className="panel flush span-12 pos-panel" aria-labelledby="pos-h">
            <header>
              <h2 id="pos-h">Positions</h2>
              <span className="meta">GET /v2/positions?vault_id · marks from GET /v2/markets</span>
            </header>
            <PositionsTable positions={v.positions} equity={v.equity} />
          </section>
        </div>
      </div>
    </>
  );
}
