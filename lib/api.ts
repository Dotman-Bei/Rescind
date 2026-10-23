// Small helpers for the internal API routes (PRD §15): JSON in, JSON out, commands to the worker.
import { NextResponse } from "next/server";
import { enqueue, type Command } from "./commands";

export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ success: true, ...data });
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function queue(c: Command, message: string) {
  enqueue(c);
  return ok({ message, queued: c.type });
}

export const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : NaN);
