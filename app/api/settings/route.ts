import { bad, body, num, queue } from "@/lib/api";

const RANGE = { pollIntervalS: [3, 60], breachConfirmN: [1, 5], cureConfirmN: [1, 10], cureGraceS: [0, 600], maxAutoCancels24h: [1, 10] } as const;

export async function PATCH(req: Request) {
  const b = await body(req);
  const values: Record<string, number> = {};
  for (const [k, [lo, hi]] of Object.entries(RANGE)) {
    const v = num(b[k]);
    if (v === null) continue;
    if (!(v >= lo && v <= hi)) return bad(`${k} must be between ${lo} and ${hi}`);
    values[k] = v;
  }
  return queue({ type: "settings", values }, "Settings queued");
}
