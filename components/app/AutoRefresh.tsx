"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renders the server screen every few seconds so the worker's latest read shows without a reload. */
export function AutoRefresh({ seconds = 3, on = true }: { seconds?: number; on?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds, on]);
  return null;
}
