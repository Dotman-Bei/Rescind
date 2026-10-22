import Link from "next/link";
import { StatusPill } from "@/components/app/StatusPill";
import { day } from "@/lib/format";
import { account } from "@/lib/sample";

export const metadata = { title: "Connect" };

const CAN: [string, string, boolean][] = [
  ["Read your vault shares", "GET /v2/vault/positions, /v2/vault/position", true],
  ["File a vault withdrawal", "POST /v2/vault/withdraw", true],
  ["Cancel a vault withdrawal", "POST /v2/vault/:id/withdrawals/:id/cancel", true],
  ["Place orders", "Strike allows it; Rescind's client blocks it outside demo builds", false],
  ["Withdraw to an external wallet", "Strike API wallets can't, whoever holds the key", false],
];

export default function ConnectPage() {
  const builderCode = process.env.BREACH_BUILDER_CODE;
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Connect a depositor account</h1>
          <p className="sub">
            Rescind needs a master API wallet on the account that holds your vault shares. It can trade, but it cannot withdraw
            to an external wallet.
          </p>
        </div>
        <div className="actions">
          <span className="stamp">
            Connected now: {account.label} · key {account.keyStatus}, expires {day(account.keyExpiresAt)}
          </span>
        </div>
      </div>

      <div className="cols stretch">
        <section className="panel span-6 path" aria-labelledby="paste-h">
          <header>
            <h2 id="paste-h">Paste a key</h2>
            <StatusPill status="active">Recommended</StatusPill>
          </header>
          <p>
            Rescind makes a fresh Ed25519 keypair on this server. You register the public key on Strike with{" "}
            <strong>Authorize</strong>, then Rescind checks it. About two minutes.
          </p>
          <ol className="path-steps">
            <li>Generate the keypair here. Only the public key is shown.</li>
            <li>Authorize it at app.strikefinance.org/api-keys, bound to your master account.</li>
            <li>Verify. Rescind calls GET /v2/account with it and refuses a sub-account key.</li>
          </ol>
          <div className="path-foot">
            <Link href="/connect/key" className="btn primary">Generate a key</Link>
          </div>
        </section>

        <section className="panel span-6 path" aria-labelledby="wallet-h">
          <header>
            <h2 id="wallet-h">Builder Connect</h2>
            <StatusPill status={builderCode ? "active" : "unknown"}>{builderCode ? "Available" : "Not set up"}</StatusPill>
          </header>
          <p>
            Sign one message with your Cardano wallet (CIP-30). Strike creates the API wallet for you and locks withdrawals to
            the wallet you signed with.
          </p>
          <ol className="path-steps">
            <li>Rescind asks Strike for a message that names this key and the builder code.</li>
            <li>Your wallet signs it. No transaction, no fee.</li>
            <li>Strike revokes older Rescind keys for the account and issues the new one.</li>
          </ol>
          <div className="path-foot">
            {builderCode ? (
              <Link href="/connect/wallet" className="btn">Use my wallet</Link>
            ) : (
              <>
                <button className="btn" disabled>Use my wallet</button>
                <span className="small muted">
                  Not available: this server has no <code>BREACH_BUILDER_CODE</code>. Paste a key instead.
                </span>
              </>
            )}
          </div>
        </section>

        <section className="panel span-8 path" aria-labelledby="can-h">
          <header>
            <h2 id="can-h">What the key can do</h2>
            <span className="meta">Strike routes &ldquo;Trading + masterOnly&rdquo;</span>
          </header>
          <div className="rows">
            {CAN.map(([what, how, yes]) => (
              <div className="line-row can-row" key={what}>
                <span className="can-what">{what}<span className="sub">{how}</span></span>
                <StatusPill status="off">{yes ? "Can" : "Can't"}</StatusPill>
              </div>
            ))}
          </div>
          <div className="path-foot">
            <a className="card-link" href="https://docs.strikefinance.org/api/getting-started.md" target="_blank" rel="noreferrer">Strike API wallet docs</a>
          </div>
        </section>

        <section className="panel span-4 path" aria-labelledby="ded-h">
          <header>
            <h2 id="ded-h">Use a dedicated account</h2>
          </header>
          <p className="notice">Connect an account that holds only vault shares. Don&rsquo;t connect your trading account.</p>
          <p className="ded-copy muted">
            A master key can trade. Keeping it on an account with nothing but vault shares means the worst it can do is file
            or cancel your own withdrawal.
          </p>
          <p className="ded-copy muted">
            No second account yet? Any new wallet that signs in to Strike gets one. Fund it with at least the vault&rsquo;s
            minimum deposit, then deposit from it.
          </p>
          <div className="path-foot">
            <a className="card-link" href="https://app.strikefinance.org" target="_blank" rel="noreferrer">Open Strike</a>
          </div>
        </section>
      </div>
    </>
  );
}
