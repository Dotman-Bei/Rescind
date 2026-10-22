"use client";
import { useEffect } from "react";

/** Section entrances (once, on entering view) and the slow drift on the chronometer band.
 *  Content is visible without script: the hidden start state only applies under html.js. */
export function Motion() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    targets.forEach((el) => io.observe(el));
    const safety = window.setTimeout(() => {
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
    }, 2500);

    const drift = document.querySelectorAll<HTMLElement>("[data-drift]");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        drift.forEach((el) => {
          const r = el.parentElement!.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
          el.style.transform = `translateY(${(-p * 12).toFixed(2)}%) scale(${(1.06 - p * 0.06).toFixed(4)})`;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
