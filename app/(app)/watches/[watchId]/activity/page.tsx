import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityLog } from "@/components/app/ActivityLog";
import { day } from "@/lib/format";
import { getActivity, getVaultForWatch, getWatch, isLive } from "@/lib/data";
import { AutoRefresh } from "@/components/app/AutoRefresh";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ watchId: string }> };

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ params }: Params) {
  const w = getWatch((await params).watchId);
  if (!w) notFound();
  const v = getVaultForWatch(w)!;
  const rows = getActivity(w.id);

  return (
    <>
      <AutoRefresh on={isLive()} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/app">Watches</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/watches/${w.id}`}>{v.name}</Link>
        <span aria-hidden="true">/</span>
        <span>Activity</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Activity</h1>
          <p className="sub">
            {v.name} · {w.evaluations.toLocaleString("en-US")} evaluations since {day(w.createdAt)}, passing and breaching runs
            summarised. Newest first.
          </p>
        </div>
      </div>
      <ActivityLog rows={rows} />
    </>
  );
}
