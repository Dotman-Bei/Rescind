import Link from "next/link";
import { WalletFlow } from "@/components/app/WalletFlow";
import { account } from "@/lib/sample";

export const metadata = { title: "Builder Connect" };

const SAMPLE_MESSAGE = `Strike Builder Connect
Builder code: RESCIND
Fee share: 0 bps
Chain: cardano
Wallet: addr1q89haz0u…uhtfzg
API wallet public key: 3f9a1c7e…c9e1b3d5
Nonce: 7c1d9e2a-55b0-4e61-9f3c-08a4d2e6b1f7
Issued at: 2026-10-22T20:10:00Z`;

export default function WalletPage() {
  const builderCode = process.env.BREACH_BUILDER_CODE;
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/connect">Connect</Link>
        <span aria-hidden="true">/</span>
        <span>Builder Connect</span>
      </nav>
      <div className="title-row">
        <div>
          <h1>Connect with your Cardano wallet</h1>
          <p className="sub">One signature, no transaction. Strike issues the API wallet and Rescind keeps it on this server.</p>
        </div>
      </div>

      {!builderCode && (
        <p className="notice page-notice">
          This server has no <code>BREACH_BUILDER_CODE</code>, so Strike would refuse the request. The flow below runs on sample
          data until one is set.
        </p>
      )}

      <div className="cols stretch">
        <WalletFlow sampleMessage={SAMPLE_MESSAGE} publicKey={account.publicKey} />
        <section className="panel span-12" aria-labelledby="binds-h">
          <div className="two-col">
            <div>
              <h2 id="binds-h">What the message binds</h2>
              <ul className="plain-list">
                <li>Rescind&rsquo;s builder code and a 0 bps fee share: Rescind places no orders.</li>
                <li>Your wallet address and chain.</li>
                <li>The public key Rescind just generated.</li>
                <li>A single-use nonce that expires in 5 minutes.</li>
              </ul>
            </div>
            <div>
              <h2>What Strike does next</h2>
              <p className="muted">
                Creates your Strike account if it doesn&rsquo;t exist, approves Rescind as a builder, revokes any older API wallet it
                issued to Rescind for this account, and creates a new master-bound one. Withdrawals to outside wallets stay locked
                to the wallet that signed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
