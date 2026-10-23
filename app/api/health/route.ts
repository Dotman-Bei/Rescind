import { NextResponse } from "next/server";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = readState();
  const age = s.heartbeatAt ? Date.now() - s.heartbeatAt : null;
  let strike = false;
  try {
    strike = (await fetch("https://api.strikefinance.org/v2/time", { signal: AbortSignal.timeout(4000) })).ok;
  } catch {
    strike = false;
  }
  return NextResponse.json({ worker_heartbeat_age_ms: age, worker_ok: age !== null && age < 30_000, watches: s.watches.length, strike_reachable: strike });
}
