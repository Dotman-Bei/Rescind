import Link from "next/link";
import { RuleTester } from "@/components/site/RuleTester";
import { SiteNav } from "@/components/site/SiteNav";
import { clockMs, dayHm, hm, shortId, span } from "@/lib/format";
import { readLargestUserVault } from "@/lib/live";
import { fillsUrl, gapMs, historyUrl, receipts } from "@/lib/sample";

export const revalidate = 30;

const i = (n: number) => ({ ["--i" as string]: n }) as React.CSSProperties;

/** 1.118 → ["1", ".12"]; 18 → ["18", ""] */
function split(n: number, dp: number): [string, string] {
  const [a, b] = n.toFixed(dp).split(".");
  return [a, b ? "." + b : ""];
}

// Stage widths follow the true durations, with a 12% floor so the short stages stay legible.
function stageShares(seconds: number[]) {
  const floor = 12;
  const total = seconds.reduce((a, b) => a + b, 0);
  const raw = seconds.map((s) => (s / total) * 100);
  const small = raw.filter((r) => r < floor).length;
  const bigTotal = raw.filter((r) => r >= floor).reduce((a, b) => a + b, 0);
  return raw.map((r) => (r < floor ? floor : (r / bigTotal) * (100 - small * floor)));
}

export default async function Landing() {
  const v = await readLargestUserVault();
  const sample = receipts[0];
  const w = sample.withdrawal;
  const lockupH = v.lockupDays * 24;

  const figures: { n: number; dp: number; cap: string }[] = [
    { n: v.positionCount, dp: 0, cap: `open positions in ${v.name}, all on cross margin` },
    { n: v.at20x, dp: 0, cap: "of them on a 20x leverage setting" },
    { n: v.effectiveLeverage, dp: 2, cap: "times equity: the exposure the vault actually carries, Σ|size × mark| ÷ equity" },
    { n: v.sharePrice, dp: 3, cap: "share price, against a start of 1.000" },
    ...(v.leaderSharePct !== null ? [{ n: v.leaderSharePct, dp: 2, cap: "percent of the shares held by the leader" }] : []),
  ];

  const stages = [
    { seconds: 10, dur: "Ten seconds", clause: "First, Rescind reads the vault every 5 s and confirms a breach on the second bad read." },
    { seconds: 1, dur: "Under a second", clause: "Then it files your withdrawal with your master API wallet. The exit clock starts." },
    { seconds: lockupH * 3600, dur: `${lockupH} hours`, clause: "While it runs, Rescind keeps reading. When every rule passes for three reads in a row, it cancels the withdrawal: free, and your shares unlock. If the leader breaks and fixes twice in a day, it stops cancelling on its own and leaves the decision to you.", long: true },
    { seconds: 120, dur: "At execution", clause: "If the leader never cures, Strike pays you at that moment's share price." },
  ];
  const shares = stageShares(stages.map((s) => s.seconds));

  const readLine =
    v.source === "live"
      ? `Read from api.strikefinance.org at ${hm(v.takenAt)}.`
      : `Snapshot from ${dayHm(v.takenAt)}; Strike didn't answer just now.`;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero wrap">
        <SiteNav />
        <div className="hero-body">
          <h1>
            <span className="row">
              <span className="word" style={i(0)}>Your exit</span>
            </span>
            {" "}
            <span className="row">
              <span className="word" style={i(2)}>starts at the breach</span>
            </span>
          </h1>
          <div className="hero-foot">
            <p className="lead">
              Rescind files your Strike vault withdrawal the moment a leader breaks your rules, and cancels it free if
              they cure in time.
            </p>
            <div className="actions">
              <a href="#receipt" className="link">Read a receipt</a>
              <Link href="/connect" className="button">Set your mandate</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- stats: the live vault ---------- */}
      <section className="ledger-sec section wrap" id="vault" aria-labelledby="vault-h">
        <div className="grid">
          <div className="ledger-left">
            <h2 id="vault-h" data-reveal style={i(0)}>
              <span className="soft">{v.name.split(" ").slice(0, 2).join(" ")},</span> read just now
            </h2>
            <figure className="ledger-photo" data-reveal style={i(1)}>
              <img
                src="/photos/trading-floor.jpg"
                width={1920}
                height={1285}
                loading="lazy"
                alt="The trading floor of the New York Stock Exchange from above: trading posts, screens and traders."
              />
            </figure>
          </div>
          <dl className="ledger">
            {figures.map((f, k) => {
              const [a, b] = split(f.n, f.dp);
              return (
                <div className="row" key={k}>
                  <dt className="sr-only">{f.cap}</dt>
                  <dd className="int" data-reveal style={i(k)}>{a}</dd>
                  <dd className="dec" data-reveal style={i(k)}>{b}</dd>
                  <dd className="cap" data-reveal style={i(k + 1)} aria-hidden="true">{f.cap}</dd>
                </div>
              );
            })}
          </dl>
          <div className="ledger-after" data-reveal style={i(2)}>
            <p className="statement">
              A 20x setting is not 20x exposure. Rescind measures what the vault carries, so your rule fires on the
              position, not the label.
            </p>
            <p className="small muted">
              {v.name} is the largest user vault on Strike by equity. {readLine} Rescind is not affiliated with it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- how it works: stages as one bar ---------- */}
      <section className="how on-field wrap" id="how" aria-labelledby="how-h">
        <h2 id="how-h" data-reveal>Ten seconds, then a day</h2>
        <div className="stages" data-ui role="list">
          {stages.map((s, k) => (
            <div
              className={s.long ? "stage long" : "stage"}
              role="listitem"
              key={s.dur}
              style={{ flex: `0 0 calc(${shares[k].toFixed(2)}% - 4.5px)`, ["--h" as string]: `${Math.max(72, shares[k] * 5)}px` }}
              data-reveal
            >
              <div className="bar">{s.dur}</div>
              <p className="clause">{s.clause}</p>
            </div>
          ))}
        </div>
        <div className="how-after">
          <p className="statement" data-reveal>
            An alert would have woken you at 3 a.m. You would still have had to file, and every hour you slept would be
            paid in exit price.
          </p>
          <figure data-reveal style={i(1)}>
            <video autoPlay muted loop playsInline preload="metadata" poster="/photos/clock-tick-poster.jpg" width={540} height={720} aria-hidden="true">
              <source src="/photos/clock-tick.webm" type="video/webm" />
            </video>
          </figure>
        </div>
      </section>

      {/* ---------- the chronometer ---------- */}
      <figure className="band wrap">
        <div className="frame">
          <img
            data-drift
            src="/photos/chronometer.jpg"
            width={1576}
            height={2046}
            loading="lazy"
            alt="Exploded line drawing of a ship chronometer's gear train: fusee, escape wheel, balance unit and hands."
          />
        </div>
      </figure>

      {/* ---------- showcase: the live thing ---------- */}
      <section className="try wrap" id="mandate" aria-labelledby="try-h">
        <h2 id="try-h" data-reveal>Write a rule</h2>
        <RuleTester
          vault={{
            name: v.name,
            effectiveLeverage: v.effectiveLeverage,
            sharePrice: v.sharePrice,
            leaderSharePct: v.leaderSharePct,
            heldSymbols: v.heldSymbols,
            lockupDays: v.lockupDays,
          }}
        />
      </section>

      {/* ---------- proof: the printed receipt ---------- */}
      <section className="proof on-field wrap" id="receipt" aria-labelledby="proof-h">
        <div className="grid proof-head">
          <h2 id="proof-h" data-reveal>Check it yourself</h2>
          <div className="copy" data-reveal style={i(1)}>
            <p>
              Every action leaves a receipt that pairs two public Strike rows. You need no login and no trust in us:
              open both URLs and compare the timestamps.
            </p>
            <Link href={`/verify/${sample.id}`} className="button paper">Open the sample receipt</Link>
          </div>
        </div>
        <div className="proof-stage">
          <article className="card" data-ui aria-label="Sample receipt">
            <h3>Receipt</h3>
            <p className="sub">{sample.vaultName} · mandate v{sample.mandateVersion} · sample</p>
            <p className="gap"><span>Gap, fill to filing</span><strong>{span(gapMs(sample))}</strong></p>
            <dl>
              <div className="line"><dt>Rule broken</dt><dd>{sample.breachedLabel}</dd></div>
              <div className="line"><dt>Breaching fill {sample.fill.id}</dt><dd>{clockMs(sample.fill.ts)}</dd></div>
              <div className="line"><dt>Fill</dt><dd>{sample.fill.symbol} {sample.fill.side} {sample.fill.size} at {sample.fill.price.toLocaleString("en-US")}</dd></div>
              <div className="line"><dt>Withdrawal {shortId(w.id)} filed</dt><dd>{clockMs(w.requestedAt)}</dd></div>
              <div className="line"><dt>Executes at</dt><dd>{dayHm(w.executeAt)}</dd></div>
              <div className="line"><dt>Status</dt><dd className="stamp">Cancelled {w.cancelledAt ? clockMs(w.cancelledAt).slice(0, 8) : ""} · cost $0.00</dd></div>
            </dl>
            <div className="urls">
              <span>Fills: <code>{fillsUrl(sample.vaultId)}</code></span>
              <span>History: <code>{historyUrl(sample.vaultId)}</code></span>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- FAQ: key safety ---------- */}
      <section className="faq wrap" id="safety" aria-labelledby="faq-h">
        <h2 id="faq-h" data-reveal>Your key, your machine</h2>
        <div className="faq-list">
          <div className="faq-aside" data-reveal style={i(1)}>
            <p>Rescind&rsquo;s Strike client allows these calls and refuses every other one:</p>
            <ul>
              <li><code>GET</code> the public vault reads</li>
              <li><code>POST /v2/vault/withdraw</code></li>
              <li><code>POST /v2/vault/:id/withdrawals/:id/cancel</code></li>
            </ul>
          </div>
          <div className="faq-items">
            {[
              ["Why does Rescind need a master key?", <>Vault withdrawals and cancels are master-only on Strike. A sub-account key gets <code>403 not available to sub-account API keys</code>, so Rescind refuses one when you verify.</>],
              ["Can the key move my money off Strike?", "No. Strike API wallets can trade, but they cannot withdraw to an external wallet. Rescind's Strike client only allows the public reads, the vault withdraw and the cancel. Order endpoints are blocked outside demo builds."],
              ["Where does the private key live?", "On the server you run. Rescind generates it there, encrypts it with AES-256-GCM, and never sends it to a browser or writes it to a log. You only ever see the public key."],
              ["What does a cancelled withdrawal cost?", "Nothing. Strike lets you cancel any time before it executes, with no fee, and the shares unlock at once."],
              ["What if the leader keeps breaking and fixing?", "Each cancel restarts your clock. After two automatic cancels in 24 hours, Rescind stops cancelling on its own and leaves the withdrawal running until you decide."],
              ["Should I use my main account?", "No. Make a dedicated depositor account that holds only vault shares, and connect that."],
            ].map(([q, a], k) => (
              <details key={k} data-reveal style={i(k)}>
                <summary>{q}<span className="chev" aria-hidden="true" /></summary>
                <p className="answer-text">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="ask on-field wrap" aria-labelledby="ask-h">
        <h2 id="ask-h">
          <span className="q">Armed,</span>
          <span className="sr-only"> </span>
          <span className="q q2">or dry run?</span>
        </h2>
        <div className="middle">
          <div className="choice">
            <Link href="/connect" className="button">Arm a watch</Link>
            <span className="or">or</span>
            <Link href="/connect" className="button paper">Start a dry run</Link>
          </div>
          <p className="note">Both start by connecting a key. A dry run evaluates and logs, and never files.</p>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="foot wrap">
        <div className="grid foot-top">
          <div className="invite">
            <h2 data-reveal>Set the rules before you deposit</h2>
            <Link href="/connect" className="button ink" data-reveal style={i(1)}>Set your mandate</Link>
          </div>
          <ul data-reveal style={i(2)}>
            <li><a href="#how">How it works</a></li>
            <li><a href="https://docs.strikefinance.org/api/vault-leader.md">Strike vault API</a></li>
            <li><Link href={`/verify/${sample.id}`}>Sample receipt</Link></li>
            <li><Link href="/login">Operator login</Link></li>
          </ul>
        </div>
        <div className="legal">
          <p>Not affiliated with Strike Finance. Not financial advice.</p>
        </div>
        <div className="bigname" aria-hidden="true">
          <svg viewBox="0 0 1000 260" preserveAspectRatio="xMidYMin meet">
            <text x="0" y="258" fontSize="340" textLength="1000" lengthAdjust="spacingAndGlyphs">RESCIND</text>
          </svg>
        </div>
      </footer>
    </>
  );
}
