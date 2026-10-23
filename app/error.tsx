"use client";
import Link from "next/link";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="app">
      <header className="report-bar">
        <Link href="/" className="wordmark-app">Rescind</Link>
      </header>
      <main className="report boundary">
        <section className="panel boundary-panel" aria-labelledby="err-h">
          <h1 id="err-h">This page failed to load</h1>
          <p className="muted">
            Rescind couldn&rsquo;t reach its data. The worker runs separately and keeps watching; nothing it does depends on this
            page.
          </p>
          <div className="boundary-actions">
            <button type="button" className="btn primary" onClick={reset}>Try again</button>
            <Link href="/" className="text-btn">Back to Rescind</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
