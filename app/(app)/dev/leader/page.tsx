import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaderConsole } from "@/components/app/LeaderConsole";
import { num, usd } from "@/lib/format";
import { short } from "@/lib/markets";
import { DEMO_VAULT_ID, effectiveLeverage, notional, vault, watchForVault } from "@/lib/sample";
import { headlineRule } from "@/lib/view";

export const metadata = { title: "Leader console" };

export default function LeaderPage() {
  // PRD §14: dev and demo builds only.
  if (process.env.BREACH_DEMO_MODE !== "1") notFound();
  const v = vault(DEMO_VAULT_ID)!;
  const w = watchForVault(v.id);
  const limit = w?.mandates[0].maxLeverage ?? 5;
  const total = v.positions.reduce((s, p) => s + notional(p), 0);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Leader console</h1>
          <p className="sub">Plays the leader of {v.name} for the demo: break the depositor&rsquo;s mandate, then cure it.</p>
        </div>
      </div>
      <p className="notice page-notice">
        Demo mode. This page places real orders on the demo vault with the leader&rsquo;s key. It is disabled when{" "}
        <code>BREACH_DEMO_MODE</code> is off.
      </p>

      <div className="cols stretch">
        <section className="panel span-5" aria-labelledby="ord-h">
          <header><h2 id="ord-h">Order on the demo vault</h2></header>
          <LeaderConsole positions={v.positions.map((p) => ({ symbol: p.symbol, size: p.size, mark: p.mark }))} equity={v.equity} limit={limit} />
        </section>

        <section className="panel span-7 flush leader-side" aria-labelledby="vp-h">
          <header>
            <h2 id="vp-h">{v.name} now</h2>
            <span className="meta">Equity {usd(v.equity)}</span>
          </header>
          <div className="leader-figure">
            <span className="muted">Effective leverage</span>
            <strong className="num">{num(effectiveLeverage(v))}x</strong>
            <span className="muted">against the depositor&rsquo;s {limit}x</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Market</th><th>Side</th><th className="n">Size</th><th className="n">Mark</th><th className="n">Notional</th></tr>
              </thead>
              <tbody>
                {v.positions.map((p) => (
                  <tr key={p.symbol}>
                    <td className="name-link">{short(p.symbol)}</td>
                    <td>{p.size < 0 ? "Short" : "Long"}</td>
                    <td className="n">{num(Math.abs(p.size))}</td>
                    <td className="n">{num(p.mark)}</td>
                    <td className="n">{usd(notional(p))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td>Total</td><td /><td /><td /><td className="n">{usd(total)}</td></tr>
              </tfoot>
            </table>
          </div>
          <div className="script">
            <h3 className="sub-h">The 30-second demo</h3>
            <ol className="script-steps">
              <li><strong>Push to 15x.</strong> Within about 10 s the watch shows the breach and a pending row appears in the vault&rsquo;s public history with its execute_at.</li>
              <li><strong>Cut to 3x.</strong> After 3 passing reads and the 30 s grace, Rescind cancels. The row flips to cancelled; cost $0.00.</li>
              <li><strong>Publish the receipt.</strong> Its verify page pairs the fill with the withdrawal row and shows the gap.</li>
            </ol>
          </div>
          {w && (
            <div className="panel-foot leader-foot">
              <span className="muted">Depositor&rsquo;s watch: {headlineRule(w)}.</span>
              <Link href={`/watches/${w.id}`} className="card-link">Open the watch</Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
