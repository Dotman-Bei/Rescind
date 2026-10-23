import { bad, body, ok, queue } from "@/lib/api";
import { getReceipt } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const r = getReceipt((await params).receiptId);
  return r ? ok({ receipt: r }) : bad("receipt not found", 404);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const b = await body(req);
  if (typeof b.public !== "boolean") return bad("public must be true or false");
  return queue({ type: "publish", receiptId: (await params).receiptId, public: b.public }, b.public ? "Publishing" : "Unpublishing");
}
