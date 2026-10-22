"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#mandate", label: "Mandate" },
  { href: "/#receipt", label: "Receipt" },
  { href: "/#safety", label: "Key safety" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav">
      <Link href="/" className="wordmark">Rescind</Link>
      <nav className="nav-links" aria-label="Main">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
        <button className="nav-menu" aria-expanded={open} aria-controls="site-sheet" onClick={() => setOpen(true)}>
          Menu
        </button>
        <Link href="/connect" className="button">Connect your key</Link>
      </nav>
      <div className="sheet" id="site-sheet" hidden={!open} role="dialog" aria-label="Menu">
        <div className="nav" style={{ paddingBlock: 0 }}>
          <span className="wordmark">Rescind</span>
          <button className="nav-menu" style={{ display: "inline-flex" }} onClick={() => setOpen(false)}>Close</button>
        </div>
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}><a href={l.href} onClick={() => setOpen(false)}>{l.label}</a></li>
          ))}
          <li><Link href="/login">Operator login</Link></li>
        </ul>
      </div>
    </header>
  );
}
