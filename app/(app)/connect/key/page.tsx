import Link from "next/link";
import { KeyFlow } from "@/components/app/KeyFlow";
import { day } from "@/lib/format";
import { account } from "@/lib/sample";

export const metadata = { title: "Register your key" };

export default function KeyPage() {
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/connect">Connect</Link>
        <span aria-hidden="true">/</span>
        <span>Paste a key</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Register your public key</h1>
          <p className="sub">Three steps on this page. Rescind can&rsquo;t act until Strike knows the key and it checks out.</p>
        </div>
      </div>

      <div className="cols">
        <section className="panel span-8" aria-label="Steps">
          <KeyFlow
            sampleKey={account.publicKey}
            sampleAccount={{ accountId: account.strikeAccountId, expires: `${day(account.keyExpiresAt)}, 2026` }}
          />
        </section>

        <aside className="stack span-4">
          <section className="panel" aria-labelledby="why-h">
            <header><h2 id="why-h">Why Authorize, not Generate</h2></header>
            <p className="muted">
              Generate makes Strike create a key and show you its private half. Authorize registers a public key you already
              have, so the private half stays on this server and nowhere else.
            </p>
          </section>
          <section className="panel" aria-labelledby="fail-h">
            <header><h2 id="fail-h">If verification fails</h2></header>
            <dl className="fail-list">
              <div><dt>403 not available to sub-account API keys</dt><dd>The key is bound to a sub-account. Make a new one for the master.</dd></div>
              <div><dt>authentication failed</dt><dd>Strike hasn&rsquo;t seen the key. Authorize it, then verify again.</dd></div>
              <div><dt>401 wallet expired or revoked</dt><dd>Generate a fresh key. A public key can&rsquo;t be registered twice.</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
