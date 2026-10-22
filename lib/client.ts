// Calls to Rescind's own API routes (PRD §15). Until the backend lands those routes return 404;
// callers then fall back to sample behaviour and say so, rather than pretending a write happened.
export type ApiResult<T> = { ok: boolean; status: number; data?: T; error?: string; sample: boolean };

export async function api<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    if (res.status === 404 && res.headers.get("content-type")?.includes("text/html")) {
      return { ok: false, status: 404, sample: true };
    }
    const data = (await res.json().catch(() => undefined)) as (T & { error?: string }) | undefined;
    return { ok: res.ok, status: res.status, data, error: data?.error, sample: false };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message, sample: false };
  }
}
