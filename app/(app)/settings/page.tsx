import Link from "next/link";
import { CopyButton } from "@/components/app/CopyButton";
import { DisconnectButton } from "@/components/app/DisconnectButton";
import { EngineSettings } from "@/components/app/EngineSettings";
import { StatusPill } from "@/components/app/StatusPill";
import { dayHm } from "@/lib/format";
import { account, settings, watches } from "@/lib/sample";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  const testnet = account.network === "testnet";
  return (
    <div className="settings">
      <div className="title-row">
        <div>
          <h1>Settings</h1>
          <p className="sub">For this Rescind and the account it watches with. Changes reach the worker on its next tick.</p>
        </div>
      </div>

      <section className="set-row" aria-labelledby="eng-h">
        <div className="set-label">
          <h2 id="eng-h">Engine</h2>
          <p>How fast Rescind reads, and how sure it must be before it files or cancels.</p>
          <p className="set-why">
            Two confirmations stop one stale read from filing. Stale and degraded reads never confirm a breach or a cure, whatever
            these say.
          </p>
        </div>
        <div className="set-panel">
          <EngineSettings initial={settings} />
        </div>
      </section>

      <section className="set-row" aria-labelledby="net-h">
        <div className="set-label">
          <h2 id="net-h">Network</h2>
          <p>Set by <code>STRIKE_ENV</code> when the server starts. Read only here.</p>
        </div>
        <div className="set-panel">
          <dl className="kv">
            <div><dt>Network</dt><dd>{testnet ? "Testnet" : "Mainnet"}</dd></div>
            <div><dt>REST</dt><dd>{testnet ? "api-v2-testnet.strikefinance.org" : "api.strikefinance.org"}</dd></div>
            <div><dt>User stream</dt><dd>wss://api.strikefinance.org/ws/user-api</dd></div>
            <div><dt>Clock</dt><dd>Synced to GET /v2/time every 10 min</dd></div>
          </dl>
        </div>
      </section>

      <section className="set-row" aria-labelledby="key-h">
        <div className="set-label">
          <h2 id="key-h">API key</h2>
          <p>The master API wallet Rescind signs with. Its private half is encrypted on this server and never leaves it.</p>
        </div>
        <div className="set-panel">
          <dl className="kv">
            <div><dt>Account</dt><dd>{account.label} · {account.strikeAccountId.slice(0, 8)}…</dd></div>
            <div>
              <dt>Public key</dt>
              <dd className="id-cell"><span className="id">{account.publicKey.slice(0, 12)}…{account.publicKey.slice(-6)}</span><CopyButton value={account.publicKey} className="text-btn" /></dd>
            </div>
            <div><dt>Status</dt><dd><StatusPill status={account.keyStatus} /></dd></div>
            <div><dt>Verified</dt><dd>{dayHm(account.keyVerifiedAt)}</dd></div>
            <div><dt>Expires</dt><dd>{dayHm(account.keyExpiresAt)}</dd></div>
          </dl>
          <div className="form-foot">
            <span className="small muted">Makes a new keypair, verifies it, then deletes this one.</span>
            <Link href="/connect/key" className="btn">Rotate key</Link>
          </div>
        </div>
      </section>

      <section className="set-row danger-row" aria-labelledby="dc-h2">
        <div className="set-label">
          <h2 id="dc-h2">Disconnect</h2>
          <p>Stops all {watches.length} watches and deletes the stored private key.</p>
        </div>
        <div className="set-panel">
          <p>
            Revoke the key on Strike&rsquo;s API keys page too: deleting it here doesn&rsquo;t tell Strike. A pending withdrawal
            stays pending on Strike after you disconnect.
          </p>
          <div className="form-foot">
            <DisconnectButton label={account.label} watches={watches.length} />
          </div>
        </div>
      </section>
    </div>
  );
}
