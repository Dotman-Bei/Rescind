import { bad, body, ok, queue } from "@/lib/api";
import { getWatches } from "@/lib/data";
import { parseMandate } from "@/lib/mandate";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ watches: getWatches() });
}

export async function POST(req: Request) {
  const b = await body(req);
  if (typeof b.vault_id !== "string" || !/^[0-9a-f-]{36}$/.test(b.vault_id)) return bad("vault_id must be a vault UUID");
  const mandate = parseMandate(b.mandate as Record<string, unknown>);
  if (typeof mandate === "string") return bad(mandate);
  return queue(
    { type: "create_watch", vaultId: b.vault_id, mode: b.mode === "armed" ? "armed" : "dry_run", autoCancel: b.auto_cancel !== false, mandate },
    "Watch queued; the worker picks it up on its next tick",
  );
}
