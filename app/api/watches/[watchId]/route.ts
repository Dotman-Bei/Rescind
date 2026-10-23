import { bad, body, queue } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ watchId: string }> }) {
  const watchId = (await params).watchId;
  const b = await body(req);
  if (b.mode === "armed" || b.mode === "dry_run" || b.mode === "paused") return queue({ type: "set_mode", watchId, mode: b.mode }, "Mode change queued");
  if (typeof b.auto_cancel === "boolean") return queue({ type: "set_auto_cancel", watchId, on: b.auto_cancel }, "Auto-cancel change queued");
  return bad("invalid request");
}
