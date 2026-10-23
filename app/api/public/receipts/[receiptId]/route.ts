import { bad, ok } from "@/lib/api";
import { getReceipt } from "@/lib/data";

export const dynamic = "force-dynamic";

/** PRD FR-33: published receipts only, public fields only. */
export async function GET(_req: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const r = getReceipt((await params).receiptId);
  if (!r || !r.public) return bad("receipt not found", 404);
  const { snapshotLatencyMs, confirmedAt, ...pub } = r;
  void snapshotLatencyMs;
  void confirmedAt;
  return ok({ receipt: pub });
}
