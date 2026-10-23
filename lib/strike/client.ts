// Strike REST client (PRD §11). Public reads go out unsigned (§12.1: a key header forces full auth).
// Writes are limited to an allowlist (§22): vault withdraw and cancel, plus order/create/deposit in demo mode.
import { signHeaders, type Keys } from "./sign";

export const HOST = process.env.STRIKE_ENV === "testnet" ? "https://api-v2-testnet.strikefinance.org" : "https://api.strikefinance.org";

const WRITE_ALLOW = [/^POST \/v2\/vault\/withdraw$/, /^POST \/v2\/vault\/[0-9a-f-]+\/withdrawals\/[0-9a-f-]+\/cancel$/];
const DEMO_ALLOW = [/^POST \/v2\/order$/, /^POST \/v2\/vault\/(create|deposit)$/];

export class StrikeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let clockOffset = 0;
let clockSyncedAt = 0;

/** Keep signed timestamps within Strike's 3-minute window (PRD §10.2). */
export async function syncClock(force = false) {
  if (!force && Date.now() - clockSyncedAt < 10 * 60_000) return clockOffset;
  const t0 = Date.now();
  const { serverTime } = await get<{ serverTime: number }>("/v2/time");
  clockOffset = serverTime - Math.round((t0 + Date.now()) / 2);
  clockSyncedAt = Date.now();
  return clockOffset;
}

async function parse<T>(res: Response, path: string): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) throw new StrikeError(res.status, (data as { error?: string })?.error ?? `${path} ${res.status}`);
  return data as T;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(HOST + path, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  return parse<T>(res, path);
}

export async function signed<T>(method: "GET" | "POST", path: string, keys: Keys, body?: unknown): Promise<T> {
  if (method !== "GET") {
    const id = `${method} ${path.split("?")[0]}`;
    const ok = WRITE_ALLOW.some((r) => r.test(id)) || (process.env.BREACH_DEMO_MODE === "1" && DEMO_ALLOW.some((r) => r.test(id)));
    if (!ok) throw new Error(`Rescind's client refuses ${id}`);
  }
  await syncClock();
  const raw = body === undefined ? "" : JSON.stringify(body);
  const res = await fetch(HOST + path, {
    method,
    headers: { ...signHeaders(method, path, raw, keys, clockOffset), ...(raw ? { "content-type": "application/json" } : {}) },
    body: raw || undefined,
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  return parse<T>(res, path);
}
