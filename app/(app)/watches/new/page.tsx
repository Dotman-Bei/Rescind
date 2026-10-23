import Link from "next/link";
import { MandateEditor, type Draft } from "@/components/app/MandateEditor";
import { marketsIn } from "@/lib/markets";
import { settings, availableShares, effectiveLeverage, vault, watchForVault } from "@/lib/sample";

export const metadata = { title: "New watch" };

const DEFAULT: Draft = {
  leverage: { on: true, value: "3" },
  markets: { on: true, list: marketsIn("crypto") },
  drawdown: { on: true, value: "15" },
  stake: { on: true, value: "5" },
};

export default async function NewWatch({ searchParams }: { searchParams: Promise<{ vault?: string }> }) {
  const v = vault((await searchParams).vault ?? "");

  if (!v || v.type === "protocol") {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>New watch</h1>
            <p className="sub">
              {v ? `${v.name} is run by Strike itself, so a depositor's mandate doesn't apply.` : "Pick the vault to watch first."}
            </p>
          </div>
        </div>
        <div className="panel">
          <p className="muted">Watches are set from a vault. <Link href="/vaults" className="text-btn">Choose a vault</Link></p>
        </div>
      </>
    );
  }

  const existing = watchForVault(v.id);
  if (existing) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Watch {v.name}</h1>
            <p className="sub">This vault already has a watch. One watch per vault; edit its mandate instead.</p>
          </div>
          <div className="actions">
            <Link href={`/watches/${existing.id}/mandate`} className="btn primary">Edit mandate</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/vaults">Vaults</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/vaults/${v.id}`}>{v.name}</Link>
        <span aria-hidden="true">/</span>
        <span>New watch</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Watch {v.name}</h1>
          <p className="sub">Set the four rules. Rescind checks them against the vault every {settings.pollIntervalS} s.</p>
        </div>
      </div>
      <MandateEditor
        mode="create"
        initial={DEFAULT}
        vault={{
          id: v.id,
          name: v.name,
          heldSymbols: v.positions.map((p) => p.symbol),
          effectiveLeverage: effectiveLeverage(v),
          sharePrice: v.sharePrice,
          leaderSharePct: v.leaderSharePct,
          availableShares: availableShares(v),
          creditEncumbered: v.mine?.creditEncumbered ?? 0,
        }}
      />
    </>
  );
}
