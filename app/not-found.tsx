import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="app">
      <header className="report-bar">
        <Link href="/" className="wordmark-app">Rescind</Link>
      </header>
      <main className="report boundary">
        <section className="panel boundary-panel two-col" aria-labelledby="nf-h">
          <div className="boundary-main">
          <h1 id="nf-h">Nothing at this address</h1>
          <p className="muted">
            If someone sent you a receipt link, it may have been unpublished, or the link is mistyped. Receipts are public only
            while their owner keeps them published.
          </p>
          <div className="boundary-actions">
            <Link href="/" className="btn primary">Back to Rescind</Link>
            <Link href="/app" className="text-btn">Operator screens</Link>
          </div>
          </div>
          <nav className="boundary-links" aria-label="Places to go">
            <h2>Where to go instead</h2>
            <ul className="rows">
              <li className="line-row"><Link href="/" className="name-link">What Rescind does</Link></li>
              <li className="line-row"><Link href="/#how" className="name-link">How the exit clock works</Link></li>
              <li className="line-row"><Link href="/verify/rc_8Hq2vXk4Tn" className="name-link">A published sample receipt</Link></li>
              <li className="line-row"><Link href="/login" className="name-link">Operator login</Link></li>
            </ul>
          </nav>
        </section>
      </main>
    </div>
  );
}
