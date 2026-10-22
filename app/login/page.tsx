import Link from "next/link";
import { LoginForm } from "@/components/app/LoginForm";
import { ago } from "@/lib/format";
import { SAMPLE_NOW, account, settings, watches } from "@/lib/sample";

export default function LoginPage() {
  const armed = watches.filter((w) => w.mode === "armed").length;
  const dry = watches.filter((w) => w.mode === "dry_run").length;
  return (
    <>
      <header className="report-bar">
        <Link href="/" className="wordmark-app">Rescind</Link>
        <nav aria-label="Public">
          <Link href="/">What is Rescind?</Link>
        </nav>
      </header>
      <main className="report login-main">
        <div className="cols login-cols">
          <section className="panel span-5" aria-labelledby="login-h">
            <h1 id="login-h" className="login-title">Unlock Rescind</h1>
            <p className="muted login-sub">
              This Rescind runs on your machine. Enter the operator passphrase set in <code>BREACH_ADMIN_PASSPHRASE</code>.
            </p>
            <LoginForm />
            <p className="small muted login-foot">
              Verifying a receipt? You don&rsquo;t need to log in. <Link href="/" className="text-btn">Go to the public page</Link>
            </p>
          </section>

          <section className="panel span-7" aria-labelledby="health-h">
            <header>
              <h2 id="health-h">This instance</h2>
              <span className="meta">From /api/health, public</span>
            </header>
            <dl className="kv">
              <div><dt>Worker</dt><dd>Last tick {ago(SAMPLE_NOW - account.workerHeartbeatAt)} ago</dd></div>
              <div><dt>Strike</dt><dd>Reachable · {account.network === "mainnet" ? "api.strikefinance.org" : "api-v2-testnet.strikefinance.org"}</dd></div>
              <div><dt>Poll interval</dt><dd>Every {settings.pollIntervalS} s</dd></div>
              <div><dt>Watches</dt><dd>{armed} armed · {dry} dry run</dd></div>
              <div><dt>Clock</dt><dd>Within 0.2 s of Strike&rsquo;s GET /v2/time</dd></div>
              <div><dt>Database</dt><dd>SQLite · migrations current</dd></div>
            </dl>
            <p className="notice login-notice">
              The worker keeps watching while this page is locked. Locking only closes the operator screens.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
