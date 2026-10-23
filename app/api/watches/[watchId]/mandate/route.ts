import { bad, body, queue } from "@/lib/api";
import { parseMandate } from "@/lib/mandate";

export async function POST(req: Request, { params }: { params: Promise<{ watchId: string }> }) {
  const mandate = parseMandate(await body(req));
  if (typeof mandate === "string") return bad(mandate);
  return queue({ type: "new_mandate", watchId: (await params).watchId, mandate }, "New mandate version queued");
}
