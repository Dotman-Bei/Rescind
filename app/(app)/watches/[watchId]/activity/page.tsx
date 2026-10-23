import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityLog } from "@/components/app/ActivityLog";
import { day } from "@/lib/format";
import { activity, vault, watch } from "@/lib/sample";

type Params = { params: Promise<{ watchId: string }> };

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ params }: Params) {
  const w = watch((await params).watchId);
  if (!w) notFound();
  const v = vault(w.vaultId)!;
  const rows = activity[w.id] ?? [];

  return (
    <>
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
