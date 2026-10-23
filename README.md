# Rescind

**With Rescind, a Strike vault cannot stay outside your mandate for more than one check interval without your exit clock already running, and a cured breach costs you nothing.**

Rescind watches a Strike user vault against rules its depositor set. The moment the leader breaks one, it files that depositor's deferred withdrawal through the Strike API. If the leader cures before the withdrawal executes, Rescind cancels it, free.

**Live demo:** https://rescind-pi.vercel.app (landing page reads Strike mainnet live; sample receipt at https://rescind-pi.vercel.app/verify/rc_8Hq2vXk4Tn). The hosted demo is read-only: the worker that files and cancels runs on your own machine (see Setup).

Built for the Strike Hackathon (Oct 2026).

---

## Check it yourself

Every breach leaves a receipt that pairs two public Strike rows. No login, no trust in Rescind:

1. **The breaching fill:** `GET https://api.strikefinance.org/v2/history/fill?vault_id=<demo vault>`
2. **The withdrawal row:** `GET https://api.strikefinance.org/v2/vault/<demo vault>/history`. Find the row whose `id` is the receipt's withdrawal id. It shows the request `timestamp`, `execute_at_timestamp`, and `status` going `pending` → `cancelled` after the cure.

The withdrawal's `timestamp` minus the fill's `timestamp` is the claim. The public verify page (`/verify/<receipt id>`) links both rows and shows the gap.

## Status at submission (read this)

- **Live on mainnet, read side:** the worker watches three real Strike user vaults in **dry-run** mode
  (Glacier Arc Digital, MARKET WIZARDS, Strike V.I.S.I.O.N. Strategy), evaluates all four rules every 5 s, and
  logs "would file" when a mandate breaks. At submission, Glacier Arc breaks a crypto-only mandate (11 stock and
  commodity markets) and MARKET WIZARDS breaks a 2x limit (2.37x measured).
- **Verified on mainnet, auth:** a Rescind-generated Ed25519 key was registered with Authorize on Strike, and a
  signed `GET /v2/account` succeeded on the master account (no sub-account binding).
- **Verified on mainnet, write-side authorisation (Oct 23, 2026):** `scripts/probe.ts` sent both write routes with
  the API key, from an account holding no shares (so nothing could move):
  - `POST /v2/vault/withdraw` → `200 {"success":true,"message":"withdrawal request submitted","request_id":"2fe2de1d-…"}`.
    Strike accepts API-wallet keys on this master-only route; its engine then dropped the request (no shares,
    no history row, position unchanged).
  - `POST /v2/vault/:id/withdrawals/<unknown id>/cancel` → `404 withdrawal not found`. The key passed
    authorisation; only the id was unknown.
  This clears the PRD's main kill criterion (§24: "the withdraw or cancel route refuses API-wallet auth").
- **Not yet exercised on mainnet:** a withdrawal that reaches `pending` with an `execute_at`, a cancel of it, and a
  real receipt. That needs vault shares (MARKET WIZARDS' minimum is $50).
  `npx tsx scripts/rescind.ts smoke <vaultId> --confirm` runs it once the account holds shares.
- **End to end against a simulated Strike:** `sim/server.ts` is a local stand-in that answers as Strike's docs
  describe (withdraw returns a request id, the history row goes `pending` with `execute_at` = request + 24 h,
  cancel flips it to `cancelled`). Running the real worker against it, unchanged, the full cycle passed: leader
  pushed to 15x → breach confirmed on the 2nd read → `withdraw_all` filed 9.5 s after the breaching fill → leader
  cut to 3x → cure after the 30 s grace → cancelled 35.7 s into a 24 h clock, 124.06 shares unlocked, no fee →
  receipt published. Every screen shows a "Simulated Strike" banner in this mode. To reproduce:
  `npx tsx sim/server.ts`, then run the scripts and worker with `STRIKE_ENV=simulated RESCIND_DATA=data-sim`,
  and drive the leader with `curl -X POST localhost:4100/sim/leverage -d '{"target":15}'`.
- The receipt shown on `/verify/rc_8Hq2vXk4Tn` is **sample data** that shows what a real receipt looks like.

## One live fact

Strike's largest user vault, **Glacier Arc Digital**, holds **18 positions, 13 of them on a 20x leverage setting**, across crypto, stock and commodity perps. Its **actual exposure is 2.11x equity** (Σ|size × mark| ÷ equity, read Oct 23, 2026 10:22 UTC from `GET /v2/positions?vault_id=2e782d92-86f0-48f2-9171-eb0c4633656e` and `GET /v2/markets`).

A 20x setting is not 20x exposure. Rescind measures what the vault carries, so a rule fires on the position, not the label. The landing page reads this live.

## The person and the moment

A depositor in a stranger's vault has no way to hold the leader to *their own* limits. The leader can trade any market at any leverage. When the leader does something the depositor wouldn't accept, Strike's exit is a clock, not a button: a withdrawal executes `lockup_days × 24 h` after the request, at the share price **at execution**, and the depositor's proceeds absorb the unwind. Every hour between the breach and the depositor noticing is paid in exit price.

## Why an alert bot isn't enough

1. **The exit is a clock.** An alert at 3 a.m. becomes a request hours later.
2. **The clock is a free option.** A pending withdrawal can be cancelled any time before it executes, at no cost. Filing on every breach and cancelling on cure strictly beats waiting. An alert bot holds no key, so it can't use the option.

## How it uses Strike

| Endpoint | Auth | Why it's essential |
| --- | --- | --- |
| `GET /v2/vault/:id` | public | Equity and share price for R1 and R3 |
| `GET /v2/positions?vault_id=` | public | Sizes for effective leverage (R1) and markets (R2) |
| `GET /v2/markets` | public | Mark prices (R1) and the market list (R2) |
| `GET /v2/vault/:id/depositors` | public | Leader stake (R4) |
| `GET /v2/history/fill?vault_id=` | public | The breaching fill on the receipt |
| `GET /v2/vault/:id/history` | public | The withdrawal row: pending, cancelled or completed |
| `GET /v2/time` | public | Clock sync for signed timestamps |
| `GET /v2/account`, `/v2/sub-accounts`, `/v2/vault/position`, `/v2/vault/history` | API wallet | Verify the key is master-bound; read shares; idempotency check before filing |
| `POST /v2/vault/withdraw` `{vault_id, withdraw_all: true}` | API wallet, master only | **Starts the exit clock** |
| `POST /v2/vault/:id/withdrawals/:withdrawal_id/cancel` | API wallet, master only | **Calls it off, free** |

The host primitive is Strike's per-request, deferred, cancellable vault withdrawal. Without it there is no head start to win and no free option to exercise.

### The mandate (four rules)

- **R1 Max effective leverage:** Σ|size × mark| ÷ vault equity. Equity ≤ 0 is a breach. A missing mark falls back to entry price and marks the read degraded.
- **R2 Allowed markets:** any held symbol off your list.
- **R3 Max drawdown from peak:** peak share price since you armed, seeded when you arm.
- **R4 Min leader stake:** the leader's share of the vault. An unmatched leader row reports `unknown` and never fires.

A breach is confirmed on 2 consecutive breaching reads (5 s apart by default). A cure is 3 passing reads plus a 30 s grace. Degraded or stale reads never confirm either. After 2 automatic cancels in 24 h, auto-cancel turns itself off (flapping guard).

## Key safety

- Vault withdraw and cancel are **master-only** on Strike, so Rescind needs a master API wallet, and that wallet can also trade. **Use a dedicated depositor account that holds only vault shares.**
- **Strike API wallets cannot withdraw to an external wallet.**
- Rescind's Strike client **allows only** the public reads, the vault withdraw and the cancel. Order, create and deposit are blocked unless `BREACH_DEMO_MODE=1` (`lib/strike/client.ts`).
- The keypair is generated on your machine. The private key is stored **encrypted with AES-256-GCM** (`BREACH_KEY_ENCRYPTION_SECRET`, fresh IV per record) and is never sent to a browser or logged.
- Self-hosted, single operator.

## Setup and run

Requires Node 22+.

```bash
npm install
cp .env.example .env.local      # set BREACH_KEY_ENCRYPTION_SECRET (32+ random chars)

# 1. Key: generate, then register the printed public key on Strike
#    (app.strikefinance.org/api-keys → Authorize, bound to the MASTER account)
npx tsx scripts/rescind.ts keygen "Depositor"
npx tsx scripts/rescind.ts verify

# 2. Smoke test on mainnet (files a real withdraw_all, then cancels it)
npx tsx scripts/rescind.ts smoke <vaultId>            # dry run: shows what it would do
npx tsx scripts/rescind.ts smoke <vaultId> --confirm

# 3. Watch a vault (dry run by default; --armed to file for real)
npx tsx scripts/rescind.ts watch <vaultId> --armed --lev 5 --markets majors --dd 15

# 4. Run the worker and the web app (two terminals)
npx tsx worker/index.ts
npm run dev                     # http://localhost:3217
```

`STRIKE_ENV=testnet` switches every call to `api-v2-testnet.strikefinance.org`.

## Layout

- `worker/`: the poller, rules engine (`rules.ts`) and state machine (`index.ts`). It is the only writer of `data/state.json`.
- `lib/strike/`: request signing (ported from strike-builder-reference `auth.ts`) and the allowlisted client.
- `app/`: Next.js App Router. Public `/` and `/verify/[id]`; operator screens under `app/(app)`; `/api/*` routes queue commands for the worker (`lib/commands.ts`).
- `docs/FRONTEND.md`: the design spec.

## Limits and known risks

- **The write path is documented by Strike but was first exercised in this build.** The smoke test (`scripts/rescind.ts smoke`) is the check.
- Storage is a JSON file (`data/state.json`), not the SQLite the PRD names. The records and shapes are the same.
- The operator passphrase gate (`/login`) is designed but not enforced yet. **Don't expose the web app to the internet.**
- Builder Connect (CIP-30) is designed, but the server routes aren't wired; use paste-key.
- The vault picker, vault view, new-watch and settings screens still render sample data. Watches, activity, receipts and verify are live.
- Credit-encumbered shares are out of scope: `withdraw_all` includes them.
- Small user base today (a handful of user vaults). The demo runs on a vault the builder controls and doesn't depend on network effects.

---

## Image credits

All via Wikimedia Commons:

- Trading floor of the New York Stock Exchange, by Carol M. Highsmith (public domain).
- Hamilton Model 21 marine chronometer, figure 13 of its 1943 manual, by Hamilton Watch Company (public domain).
- Andreas Huber clock ticking, Wien Museum, by Furkan Akkurt (CC BY-SA 4.0).

Not affiliated with Strike Finance. Not financial advice.
