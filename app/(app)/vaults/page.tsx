import Link from "next/link";
import { StatusPill } from "@/components/app/StatusPill";
import { num, usd } from "@/lib/format";
import { availableShares, vaults, watchForVault, type Vault } from "@/lib/sample";

export const metadata = { title: "Vaults" };

const order = (v: Vault) => (v.type === "protocol" ? 2 : v.mine ? 0 : 1);

export default function VaultsPage() {
  const list = [...vaults].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  const held = vaults.filter((v) => v.mine).length;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Vaults</h1>
          <p className="sub">
            {vaults.length} vaults on Strike. You hold shares in {held}. Pick one to watch; a vault you hold no shares in can only
            run as a dry run.
          </p>
        </div>
        <div className="actions">
          <span className="stamp">GET /v2/vaults · 30 s ago</span>
        </div>
      </div>

      <section className="panel flush" aria-labelledby="vaults-h">
        <header>
          <h2 id="vaults-h">On Strike now</h2>
          <span className="meta">Yours first, then by name</span>
        </header>
        <div className="table-wrap">
          <table className="vault-table">
            <thead>
              <tr>
                <th>Vault</th>
                <th className="n">Equity</th>
                <th className="n">Share price</th>
                <th className="n">Leader fee</th>
                <th className="n">Lockup</th>
                <th className="n">Min deposit</th>
                <th className="n">Depositors</th>
                <th className="n">Your shares</th>
                <th className="n"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => {
                const w = watchForVault(v.id);
                const avail = availableShares(v);
                return (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/vaults/${v.id}`} className="name-link">{v.name}</Link>
                      <span className="sub">
                        {v.type === "protocol" ? "Protocol vault · leader is Strike" : `Leader ${v.leader}`} · {v.status === "active" ? "Active" : "Paused"}
                      </span>
                      <span className="sub narrow-only">
                        {v.feePct}% fee · {v.lockupDays} d lockup · min {usd(v.minDeposit, 0)} · {v.depositors} depositors
                      </span>
                    </td>
                    <td className="n">{usd(v.equity)}</td>
                    <td className="n">{v.sharePrice.toFixed(4)}</td>
                    <td className="n">{v.feePct}%</td>
                    <td className="n">{v.lockupDays} d</td>
                    <td className="n">{usd(v.minDeposit, 0)}</td>
                    <td className="n">{v.depositors}</td>
                    <td className="n">
                      {v.mine ? (
                        <>
                          {num(v.mine.shares)}
                          <span className="sub">{avail > 0 ? `${num(avail)} available` : "All locked in a withdrawal"}</span>
                        </>
                      ) : (
                        <span className="faint">—</span>
                      )}
                    </td>
                    <td className="n action-cell">
                      {v.type === "protocol" ? (
                        <span className="faint small">Read only</span>
                      ) : w ? (
                        <Link href={`/watches/${w.id}`} className="card-link">Open watch</Link>
                      ) : (
                        <Link href={`/watches/new?vault=${v.id}`} className="btn small">{v.mine ? "Watch" : "Dry run"}</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="cols vault-notes">
        <p className="span-6 muted">
          <StatusPill status="off">Read only</StatusPill>{" "}
          Strike Liquidity Provider is run by Strike itself, so a depositor&rsquo;s mandate over a leader doesn&rsquo;t apply. You can
          open it to look, not arm it.
        </p>
        <p className="span-6 muted">
          Share counts come from GET /v2/vault/positions with your key. Every other figure is public: GET /v2/vaults needs no
          login.
        </p>
      </div>
    </>
  );
}
