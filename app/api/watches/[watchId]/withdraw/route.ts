import { queue } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ watchId: string }> }) {
  return queue({ type: "file_now", watchId: (await params).watchId }, "Filing queued for the next tick");
}
