"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const icon = {
  watches: <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Zm6.5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  vaults: <path d="M2.5 3.5h11v9h-11zM2.5 6.5h11M6 9.5h4" />,
  receipts: <path d="M4 1.5h8v13l-2-1.2-2 1.2-2-1.2-2 1.2zM6 5h4M6 8h4" />,
  connect: <path d="M10 6a3 3 0 1 0-2.6 3l1.6 1.6V12H10.5v1.5H12V15h2.5v-2.4l-4.1-4.1A3 3 0 0 0 10 6Z" />,
  settings: <path d="M2.5 4h7M12.5 4h1M2.5 8h2M7.5 8h6M2.5 12h7M12.5 12h1M9.5 2.5v3M4.5 6.5v3M9.5 10.5v3" />,
  lock: <path d="M4 7.5h8v6H4zM5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5" />,
  leader: <path d="M2.5 13.5 6 9l3 2.5 4.5-6M10.5 5.5h3v3" />,
};

function Icon({ name }: { name: keyof typeof icon }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon[name]}
    </svg>
  );
}

type NavLink = { href: string; label: string; icon: keyof typeof icon; match: (p: string) => boolean };

const MAIN: NavLink[] = [
  { href: "/app", label: "Watches", icon: "watches", match: (p) => p === "/app" || p.startsWith("/watches") },
  { href: "/vaults", label: "Vaults", icon: "vaults", match: (p) => p.startsWith("/vaults") },
  { href: "/receipts", label: "Receipts", icon: "receipts", match: (p) => p.startsWith("/receipts") },
];
const ACCOUNT: NavLink[] = [
  { href: "/connect", label: "Connect", icon: "connect", match: (p) => p.startsWith("/connect") },
  { href: "/settings", label: "Settings", icon: "settings", match: (p) => p.startsWith("/settings") },
];

export function AppShell({
  children,
  account,
  demo,
}: {
  children: React.ReactNode;
  account: { label: string; keyLine: string; network: string };
  demo: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const all = [...MAIN, ...ACCOUNT];
  const current = all.find((l) => l.match(path))?.label ?? (path.startsWith("/dev") ? "Leader console" : "Rescind");

  const item = (l: NavLink) => (
    <Link key={l.href} href={l.href} className="nav-item" aria-current={l.match(path) ? "page" : undefined}>
      <Icon name={l.icon} />
      {l.label}
    </Link>
  );

  return (
    <div className="shell">
      <div className="topbar">
        <Link href="/app" className="wordmark-app">Rescind</Link>
        <span className="screen">{current}</span>
        <button type="button" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}>Menu</button>
      </div>
      <aside id="sidebar" className={open ? "sidebar open" : "sidebar"} aria-label="Rescind">
        <div className="brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/app" className="wordmark-app">Rescind</Link>
          {open && (
            <button type="button" className="btn small" onClick={() => setOpen(false)}>Close</button>
          )}
        </div>
        <Link href="/settings" className="switcher">
          <strong>{account.label}</strong>
          <span><span className="dot" style={{ color: "var(--positive)" }} aria-hidden="true" />{account.keyLine}</span>
        </Link>
        <nav aria-label="Main">{MAIN.map(item)}</nav>
        <p className="group-label">Account</p>
        <nav aria-label="Account">{ACCOUNT.map(item)}</nav>
        {demo && (
          <>
            <p className="group-label">Demo build</p>
            <Link href="/dev/leader" className="nav-item" aria-current={path.startsWith("/dev") ? "page" : undefined}>
              <Icon name="leader" />
              Leader console
            </Link>
          </>
        )}
        <div className="bottom">
          <p className="group-label" style={{ marginTop: 0 }}>{account.network}</p>
          <Link href="/login" className="nav-item">
            <Icon name="lock" />
            Lock
          </Link>
        </div>
      </aside>
      <main className="canvas">{children}</main>
    </div>
  );
}
