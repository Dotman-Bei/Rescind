// Display formatting. Stored times are ms UTC (PRD §21); they are shown in the operator's timezone.
export const TZ = process.env.NEXT_PUBLIC_OPERATOR_TZ || "Africa/Lagos";

const parts = (ms: number, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour12: false, ...opts }).format(new Date(ms));

/** 11:03:12 */
export const clock = (ms: number) => parts(ms, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
/** 11:03 */
export const hm = (ms: number) => parts(ms, { hour: "2-digit", minute: "2-digit" });
/** 11:03:12.418 */
export const clockMs = (ms: number) => `${clock(ms)}.${String(ms % 1000).padStart(3, "0")}`;
/** Oct 23 */
export const day = (ms: number) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(new Date(ms));
/** Oct 23, 11:03 */
export const dayHm = (ms: number) => `${day(ms)}, ${hm(ms)}`;
/** 2026-10-22 */
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const usd = (n: number, dp = 2) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const num = (n: number, dp = 2) =>
  `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const pct = (n: number, dp = 1) => `${num(n, dp)}%`;
export const lev = (n: number, dp = 2) => (Number.isFinite(n) ? `${num(n, dp)}x` : "∞");

/** 6.5 s, 3 min 22 s, 17 h 32 m */
export function span(ms: number) {
  const s = Math.max(0, ms) / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${Math.round(s - m * 60)} s`;
  const h = Math.floor(m / 60);
  return `${h} h ${m - h * 60} m`;
}

/** 23:59:41 countdown */
export function hms(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

export const shortId = (id: string, n = 8) => (id.length > n ? id.slice(0, n) + "…" : id);
