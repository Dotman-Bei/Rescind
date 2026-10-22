"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const KNOWN = [
  { id: "eternl", name: "Eternl" },
  { id: "lace", name: "Lace" },
  { id: "nami", name: "Nami" },
  { id: "typhoncip30", name: "Typhon" },
  { id: "yoroi", name: "Yoroi" },
];

type Cip30 = { enable: () => Promise<{ getUsedAddresses: () => Promise<string[]>; signData: (addr: string, hex: string) => Promise<{ signature: string; key: string }> }> };
declare global {
  interface Window { cardano?: Record<string, Cip30 | undefined> }
}

const toHex = (s: string) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");

export function WalletFlow({ sampleMessage, publicKey }: { sampleMessage: string; publicKey: string }) {
  const [found, setFound] = useState<Record<string, boolean> | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; nonce: string; sample: boolean } | null>(null);
  const [done, setDone] = useState<{ expires: string; sample: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = window.cardano ?? {};
    setFound(Object.fromEntries(KNOWN.map((w) => [w.id, !!c[w.id]?.enable])));
  }, []);

  const name = KNOWN.find((w) => w.id === wallet)?.name ?? "your wallet";
  const any = found && Object.values(found).some(Boolean);

  async function request() {
    setBusy(true);
    setError(null);
    const res = await api<{ nonce: string; message_to_sign: string }>("/api/connect/request-signature", {
      method: "POST",
      body: { chain: "cardano", fee_share_bps: 0, public_key: publicKey },
    });
    setBusy(false);
    if (res.ok && res.data) setMessage({ text: res.data.message_to_sign, nonce: res.data.nonce, sample: false });
    else if (res.sample) setMessage({ text: sampleMessage, nonce: "sample", sample: true });
    else setError(res.error ?? "Strike refused the request. Check BREACH_BUILDER_CODE on the server.");
  }

  async function sign() {
    if (!message) return;
    setBusy(true);
    setError(null);
    try {
      if (message.sample) {
        setDone({ expires: "Jan 20, 2027", sample: true });
        return;
      }
      const w = await window.cardano![wallet!]!.enable();
      const [addr] = await w.getUsedAddresses();
      const sig = await w.signData(addr, toHex(message.text));
      const res = await api<{ api_wallet_expired_at: string }>("/api/connect/verify-signature", {
        method: "POST",
        body: { nonce: message.nonce, wallet_signature: `${sig.signature}:${sig.key}` },
      });
      if (res.ok && res.data) setDone({ expires: res.data.api_wallet_expired_at, sample: false });
      else setError(res.status === 400 ? "That signature expired or was already used. Request a new message." : res.error ?? "Verification failed.");
    } catch {
      setError(`${name} didn't sign. Nothing was sent to Strike.`);
    } finally {
      setBusy(false);
    }
  }

  const step = done ? 4 : message ? 3 : wallet ? 2 : 1;
  const cls = (n: number) => (step === n ? "flow-step current" : step > n ? "flow-step done" : "flow-step");

  return (
    <>
    <section className="panel span-6" aria-label="Choose and request">
    <ol className="flow">
      <li className={cls(1)}>
        <h2>Choose a wallet</h2>
        <div className="wallets" role="radiogroup" aria-label="Cardano wallets">
          {KNOWN.map((w) => {
            const has = found?.[w.id];
            return (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={wallet === w.id}
                className="wallet-row"
                disabled={!has && !message?.sample}
                onClick={() => setWallet(w.id)}
              >
                <span>{w.name}</span>
                <span className="faint">{found === null ? "Checking…" : has ? "Detected" : "Not installed"}</span>
              </button>
            );
          })}
        </div>
        {found && !any && (
          <p className="notice">
            No CIP-30 wallet found in this browser. Install Eternl, Lace or Nami, or{" "}
            <Link href="/connect/key" className="text-btn">paste a key instead</Link>.
          </p>
        )}
        {!any && !message && (
          <button type="button" className="text-btn" onClick={() => { setWallet("eternl"); }}>
            Walk through the flow without a wallet
          </button>
        )}
      </li>

      <li className={cls(2)}>
        <h2>Ask Strike for the message</h2>
        <p>Rescind sends your chain, a 0 bps fee share and the new public key. Strike answers with one message and a 5-minute nonce.</p>
        <button type="button" className="btn primary" onClick={request} disabled={!wallet || busy || !!message}>
          {busy && !message ? "Requesting…" : "Request message"}
        </button>
      </li>
    </ol>
    </section>
    <section className="panel span-6" aria-label="Sign and finish">
    <ol className="flow" start={3}>
      <li className={cls(3)}>
        <h2>Sign it</h2>
        {message ? (
          <>
            <pre className="well message">{message.text}</pre>
            {message.sample && (
              <p className="notice">Sample build: the connect routes aren&rsquo;t wired, so nothing goes to your wallet or to Strike.</p>
            )}
            <button type="button" className="btn primary" onClick={sign} disabled={busy || !!done}>
              {busy ? "Waiting for the wallet…" : `Sign with ${name}`}
            </button>
          </>
        ) : (
          <>
            <p>You sign the message exactly as Strike sends it. It is data, not a transaction: no fee, nothing moves. It will read like this:</p>
            <pre className="well message preview" aria-label="Example message">{sampleMessage}</pre>
          </>
        )}
        {error && <p className="notice neg" role="alert">{error}</p>}
      </li>

      <li className={cls(4)}>
        <h2>Done</h2>
        {done ? (
          <>
            <p className="notice pos" role="status">
              API wallet created. Expires {done.expires}.{done.sample && " Sample result."}
            </p>
            <Link href="/vaults" className="btn primary">Pick a vault</Link>
          </>
        ) : (
          <p>Strike creates a master-bound API wallet and Rescind stores it encrypted. Withdrawals to outside wallets stay locked to this wallet.</p>
        )}
      </li>
    </ol>
    </section>
    </>
  );
}
