import { queue } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ watchId: string }> }) {
  return queue({ type: "keep", watchId: (await params).watchId }, "Auto-cancel off for this withdrawal");
}
