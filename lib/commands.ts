// Web → worker commands. The worker is the only writer of data/state.json, so the web app drops
// one JSON file per command into data/commands/ and the worker applies them at the start of a tick.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DATA_DIR } from "./store";
import type { Mandate, Mode } from "./sample";

export type Command =
  | { type: "create_watch"; vaultId: string; mode: Mode; autoCancel: boolean; mandate: Omit<Mandate, "version" | "createdAt"> }
  | { type: "new_mandate"; watchId: string; mandate: Omit<Mandate, "version" | "createdAt"> }
  | { type: "set_mode"; watchId: string; mode: Mode }
  | { type: "set_auto_cancel"; watchId: string; on: boolean }
  | { type: "cancel"; watchId: string; pause: boolean }
  | { type: "keep"; watchId: string }
  | { type: "file_now"; watchId: string }
  | { type: "publish"; receiptId: string; public: boolean }
  | { type: "settings"; values: Partial<{ pollIntervalS: number; breachConfirmN: number; cureConfirmN: number; cureGraceS: number; maxAutoCancels24h: number }> };

const DIR = path.join(DATA_DIR, "commands");

export function enqueue(c: Command) {
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${Date.now()}-${randomUUID()}.json`);
  fs.writeFileSync(file + ".tmp", JSON.stringify(c));
  fs.renameSync(file + ".tmp", file);
}

export function drain(): Command[] {
  if (!fs.existsSync(DIR)) return [];
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const out: Command[] = [];
  for (const f of files) {
    const p = path.join(DIR, f);
    try {
      out.push(JSON.parse(fs.readFileSync(p, "utf8")));
    } catch {
      /* half-written: skip, it will be retried next tick */
      continue;
    }
    fs.rmSync(p, { force: true });
  }
  return out;
}
