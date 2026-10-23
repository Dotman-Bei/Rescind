import { body, queue } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ watchId: string }> }) {
  const b = await body(req);
  return queue({ type: "cancel", watchId: (await params).watchId, pause: b.pause === true }, "Cancel queued for the next tick");
}
