"use client";
import { useEffect, useState } from "react";
import { hms } from "@/lib/format";

/** The exit clock inside the headline: a one-day lockup counting down from the moment the page opens. */
export function HeroClock({ lockupDays, variant }: { lockupDays: number; variant: "inline" | "phone" }) {
  const total = lockupDays * 86_400_000;
  const [left, setLeft] = useState(total);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => setLeft(total - (Date.now() - start)), 1000);
    return () => window.clearInterval(id);
  }, [total]);

  return (
    <span
      className={variant === "inline" ? "slot shutter" : "slot slot-phone shutter"}
      data-ui
      role="timer"
      aria-label={`Exit clock: ${hms(left)} until the withdrawal executes`}
    >
      <span className="digits" aria-hidden="true">{hms(left)}</span>
    </span>
  );
}
