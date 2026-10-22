"use client";
import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { api } from "@/lib/client";

type Verified = { accountId: string; expires: string };
type Failure = { title: string; body: string };

const FAILURES: Record<string, Failure> = {
  sub: {
    title: "This key is bound to a sub-account",
    body: "Vault withdrawals are master-only. Generate a new key and bind it to the master account.",
  },
  unknown: {
    title: "Strike doesn't know this key yet",
    body: "Register it with Authorize, then verify again. Registration can take a few seconds to reach the API.",
  },
  expired: {
    title: "This key is expired or revoked",
    body: "Strike answered 401 wallet expired or revoked. Generate a new key; a used public key can't be registered twice.",
  },
};

export function KeyFlow({ sampleKey, sampleAccount }: { sampleKey: string; sampleAccount: Verified }) {
  const [key, setKey] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [busy, setBusy] = useState<"gen" | "verify" | null>(null);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const step = verified ? 3 : key ? 2 : 1;

  async function generate() {
    setBusy("gen");
    const res = await api<{ public_key: string }>("/api/keys/generate", { method: "POST" });
    setBusy(null);
    setGeneratedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    if (res.ok && res.data) setKey(res.data.public_key);
    else {
      setSample(true);
      setKey(sampleKey);
    }
  }

  async function verify() {
    setBusy("verify");
    setFailure(null);
    const res = await api<{ account_id: string; expires_at: string; error?: string }>("/api/keys/verify", { method: "POST" });
    setBusy(null);
    if (res.sample) return setVerified(sampleAccount);
    if (res.ok && res.data) return setVerified({ accountId: res.data.account_id, expires: res.data.expires_at });
    const e = res.error ?? "";
    setFailure(/sub-account/.test(e) ? FAILURES.sub : /expired|revoked/.test(e) ? FAILURES.expired : FAILURES.unknown);
  }

  const cls = (n: number) => (step === n ? "flow-step current" : step > n ? "flow-step done" : "flow-step");

  return (
    <ol className="flow">
      <li className={cls(1)}>
        <h2>Your public key</h2>
        {key ? (
          <>
            <div className="joined">
              <input className="input id" readOnly value={key} aria-label="Public key, 64 hex characters" />
              <CopyButton value={key} className="btn" />
            </div>
            {sample ? (
              <p className="notice">{"Sample build: the key routes aren't wired yet, so this is a placeholder. Don't register it on Strike."}</p>
            ) : (
              <p className="small muted">{`Generated on this server at ${generatedAt}. The private key never leaves it.`}</p>
            )}
          </>
        ) : (
          <>
            <p>Rescind makes a fresh Ed25519 keypair on this server and shows you only the public half.</p>
            <button className="btn primary" onClick={generate} disabled={busy !== null}>
              {busy === "gen" ? "Generating…" : "Generate keypair"}
            </button>
          </>
        )}
      </li>

      <li className={cls(2)}>
        <h2>Authorize it on Strike</h2>
        <p>
          Open Strike&rsquo;s API keys page, choose <strong>Authorize</strong> (not Generate), paste the key, and bind it to your
          master account, not a sub-account.
        </p>
        <a className="btn" href="https://app.strikefinance.org/api-keys" target="_blank" rel="noreferrer" aria-disabled={step < 2}>
          Open Strike API keys
        </a>
      </li>

      <li className={cls(3)}>
        <h2>Verify</h2>
        {verified ? (
          <>
            <p className="notice pos" role="status">
              Verified. Account {verified.accountId.slice(0, 8)}… · master key · expires {verified.expires}.{sample && " Sample account."}
            </p>
            <div className="flow-actions">
              <Link href="/vaults" className="btn primary">Pick a vault</Link>
              <Link href="/app" className="text-btn">Back to watches</Link>
            </div>
          </>
        ) : (
          <>
            <p>Rescind signs GET /v2/account with the key, stores the account id, and refuses a sub-account key.</p>
            {failure && (
              <div className="notice neg" role="alert">
                <span><strong>{failure.title}.</strong> {failure.body}</span>
              </div>
            )}
            <button className="btn primary" onClick={verify} disabled={!key || busy !== null}>
              {busy === "verify" ? "Verifying…" : "Verify key"}
            </button>
          </>
        )}
      </li>
    </ol>
  );
}
