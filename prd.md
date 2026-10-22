# Rescind: Product Requirements Document

**Mechanism word:** Head-start.

**One sentence:** Rescind watches a Strike user vault against rules its depositor set and, the moment the leader breaks one, files that depositor's deferred withdrawal through the Strike API, cancelling it free if the leader cures before it executes.

**The claim:** "With Rescind, a vault cannot stay outside your mandate for more than one check interval without your exit clock already running, and a cured breach costs you nothing."

> Visual design, layout, typography, colour and component styling are defined in `frontend.md`. This PRD covers product behaviour, data, integrations, routes and engineering rules only. Where this document names a page, it lists what the page must contain and do, never how it looks.

> This PRD carries no build schedule, task breakdown or day-by-day plan.

---

## Table of contents
1. Event and target
2. Builder constraints
3. Problem: the person and the moment
4. Why the obvious fix fails
5. Product summary and mechanism
6. What's essential (host and sponsor primitives)
7. Users and roles
8. Functional requirements
9. Mandate rules: exact definitions
10. Rescind engine: state machine and edge cases
11. Strike API integration reference
12. Authentication and key handling
13. Data model
14. Pages and routes
15. API routes (internal)
16. Background worker
17. Receipts and the public verify page
18. Demo moment and demo setup
19. Judge's first 30 seconds and README requirements
20. Scope: In and Out
21. Non-functional requirements
22. Security and risk
23. Testing requirements
24. Kill criteria and fallback
25. Prior art and the gap
26. Runner-up and other candidates considered
27. Sponsor validation
28. Open items: Needs the user
29. Git commit rules
30. Definition of done (submission checklist)
31. Appendix A: live data snapshot (Oct 22, 2026)
32. Appendix B: research trail summary
33. Appendix C: sources

---

## 1. Event and target

| Item | Value | Source |
|---|---|---|
| Event | Strike Hackathon (first-ever), hosted by Strike Finance | S0 |
| Host | Strike Finance: perpetuals protocol "with full support for all major Cardano, Ethereum, and Solana wallets and all major stablecoins" | S0 |
| Building period began | Wed Oct 21, 2026, 10:00 AM "EST" | S0 |
| Submission deadline | **Fri Oct 23, 2026, 10:00 AM "EST"** | S0 |
| Deadline in Lagos | 15:00 if they mean Eastern daylight time (EDT, UTC-4); 16:00 if literal EST (UTC-5). **Plan to 15:00 Lagos.** | derived |
| Winners announced | Mon Oct 26, 2026 | S0 |
| Tracks | None. "There are no predefined tracks or categories." | S0 |
| Prizes | 1st 3,000 STRIKE · 2nd 2,000 STRIKE · 3rd 1,000 STRIKE (6,000 STRIKE total; title says "$3,000 in Prizes", USD conversion UNVERIFIED) | S0 |
| Extra upside | "Successful projects might even have the opportunity to get a direct investment from Strike and our partners." | S0 |
| Sponsor bounties | None. Strike is host and only sponsor. Rescind uses one deep sponsor: Strike (user vaults API + API wallets). | S0 |
| Core rule | "your project must build on top of Strike in some meaningful way." | S0 |
| Event type | `mixed` (five unweighted criteria split between depth and usefulness; no past winners) | 01-event-intel |
| Host goal | Stated: "Strike is building a behemoth of traders and builders." INFERRED: builder ecosystem growth on the v2 API, more volume through third-party apps, investment pipeline. | S0 |

S0 = https://medium.com/@strikecardano/strike-hackathon-starts-this-wednesday-3-000-in-prizes-158a029d655e

### 1.1 Judging criteria (unweighted) and how Rescind satisfies each

| Criterion | Weight | How Rescind satisfies it |
|---|---|---|
| Innovation and Creativity: "Does the project introduce something new, interesting, or unexpected?" | unweighted | Treats Strike's deferred, cancellable vault withdrawal as a free option and fires it on the leader's behaviour. No vault tool on Strike does this; Hyperliquid vaults have no per-request clock to exploit. |
| Integration With Strike: "How effectively does the project leverage Strike?" | unweighted | Core loop is Strike-only: public vault positions and history, `POST /v2/vault/withdraw`, withdrawal cancel, master API wallet signing. Uses the vaults API Strike documented for agents on Oct 20, 2026. |
| Utility and Impact: "Does the project solve a real problem or create a valuable new experience?" | unweighted | Gives depositors an enforceable rule over a leader who otherwise has unlimited trading authority over pooled money. Makes depositing into a stranger's vault less of a blind trust, which user vaults need to grow past 33 depositors. |
| Technical Execution: "functionality, reliability, technical quality, and overall execution." | unweighted | Polling + rules engine + two signed write calls + a public receipt pairing the breaching fill with the withdrawal row. Small surface, testable on mainnet with a test vault. |
| Future Potential: "Could the project continue growing beyond the hackathon?" | unweighted | Strike could ship it as native "exit rules"; leaders could advertise a published mandate ("Rescind-watched") to attract deposits. |

### 1.2 Submission requirements (all must be met)
1. **Build on Strike:** use, integrate with, or extend Strike's infrastructure, functionality, token, or ecosystem in a meaningful way.
2. **Demonstrate functionality:** working prototype / MVP / functional application demonstrating the core concept.
3. **Provide documentation:** clear description of the project, what it does, and how it interacts with Strike.
4. **Submit a demonstration:** video, live demo, or other materials. No length limit stated. Rescind targets a core demo moment under 30 seconds.
5. **Share code:** GitHub repository or equivalent.
- Originality: "developed or substantially advanced during the hackathon."
- Mainnet vs testnet: not specified. Testnet exists at `https://api-v2-testnet.strikefinance.org`.
- Submission link: "Coming Soon" at time of research (see §28).

---

## 2. Builder constraints

| Constraint | Value |
|---|---|
| Team | Solo |
| Build hours available | 16+ |
| Strongest stack | TypeScript / Next.js frontends; Rust (Soroban); Stellar SDK; passkeys / smart wallets |
| Cardano on-chain code (Aiken) | No preference stated. **Rescind uses none.** Everything is off-chain against Strike's API. |
| Strike account | Funded already (mainnet trades possible; small size only, ASSUMED) |
| Reuse rule | ASSUMED fresh build |
| Builder edge | Active trader; creates educational content about trading platforms on X; compares perp venue fee structures; has designed copy-trading with slashable leader bonds before |

---

## 3. Problem: the person and the moment

### 3.1 The person
A depositor in **Glacier Arc Digital**, Strike's largest user vault (live reads, Oct 22, 2026):
- 24 depositors, 25% leader fee (`leader_commission_bps` 2500), ~$42,353 equity, share price **0.676** against a starting price of 1, lockup 1 day, `min_deposit` 100.
- **18 open positions, 13 of them on a 20x leverage setting**, all cross margin, across crypto (NEAR, ETH, XRP, HYPE, BTC, ADA, SOL), stock perps (NVDA, TSLA, MU, SKHYNIX, SNDK, CXMT, SPCX, MINIMAX) and commodities (XAG, XAU, WTI).

Nothing here says the leader did anything wrong. It says a depositor has no way to hold the leader to *their own* limits.

Second example: **Strike V.I.S.I.O.N. Strategy** shows all-time PnL of **−$2,832** and share price **0.71** (live `GET /v2/vault/207ec034-…/portfolio`).

### 3.2 The moment
The leader does something the depositor would not accept: jumps leverage, trades a market the depositor never signed up for, or drives the share price down past the depositor's tolerance.

On Strike a withdrawal only executes `lockup_days × 24h` after the request, at the share price **at execution**, and "your proceeds absorb the unwind slippage" (strike-vaults skill). Every hour between the breach and the depositor noticing is an hour later exit at whatever price the leader's continued trading produces.

### 3.3 What they lose
Exit price, not information.

### 3.4 Pains this addresses (from 03-pain-bank)
- **P-13:** A depositor who wants out waits `lockup_days × 24h` after the request (1 to 30 days) and is paid at the share price at execution, not at request, when the leader is losing.
- **P-14:** A depositor absorbs the unwind slippage of their own withdrawal when the vault must close positions to pay them.
- **P-15:** A depositor has no enforced mandate: the leader can trade any market at any leverage through `vault_id`, and announcements are free text posted from the app.
- **P-16:** A depositor who saw a leader pause the vault sees it flip back to `active` when a deposit or withdrawal settles.
- **P-17:** A Glacier Arc Digital depositor pays the leader fee on profit from their own `avg_entry_price`, but has no signal when the leader is cutting their own stake.
- **P-31 (BUILDER-OBSERVED):** A small-balance trader will not deposit into a stranger's vault without a hard rule about what the leader may do.

---

## 4. Why the obvious fix fails

The obvious build is an **alert bot or a vault dashboard**: Telegram/Discord pings when a vault's leverage or drawdown crosses a line, or a vault analytics page.

1. **The exit is a clock, not a button.** On Strike a request starts a deferred clock and pays at execution-time share price. An alert at 3 a.m. becomes a request hours later; the delay is paid in exit price.
2. **An alert forces a binary choice; the clock is a free option.** A request can be cancelled "any time until the withdrawal executes", with no fee (strike-vaults skill). Filing on every breach and cancelling on cure strictly beats waiting. An alert bot holds no key, so it cannot use the option, and depositors hesitate. Hesitation is the loss.

A dashboard fails for a simpler reason: the vault page already shows positions, and nobody watches 18 positions at 20x around the clock.

---

## 5. Product summary and mechanism

### 5.1 Summary
A depositor connects a Strike account that holds vault shares, picks a vault, and sets a mandate of four rules. Rescind polls Strike's public vault endpoints every few seconds. When any rule is broken, Rescind immediately files `POST /v2/vault/withdraw` with the depositor's master API wallet, which starts the Strike exit clock. If the leader returns inside the mandate before the withdrawal executes, Rescind cancels the request for free. Every action produces a receipt that a judge or depositor can verify from public Strike URLs.

### 5.2 Mechanism (end to end)
```
depositor sets mandate {max effective leverage, allowed markets, max drawdown from peak share price, min leader stake}
        │
poller (every few s, public, no auth):
  GET /v2/positions?vault_id=…    GET /v2/vault/:id    GET /v2/vault/:id/history
  GET /v2/vault/:id/depositors    GET /v2/markPrice
        │
rules engine ── breach? ──► POST /v2/vault/withdraw {vault_id, withdraw_all:true}   (depositor master API wallet, Ed25519 signed)
        │                         └─► clock running: execute_at = now + lockup_days × 24h
        │
        ├── leader cures before execute_at ──► POST /v2/vault/:id/withdrawals/:wid/cancel   (free, shares unlock)
        └── not cured ──► engine pays out at execution (VAULT_WITHDRAWAL_EXECUTED)
        │
receipt: {breaching fill id + time, rule, measured vs limit, withdrawal id + request time,
          execute_at, cured/cancelled time} → public verify page
```

### 5.3 Port and delete-sponsor tests (from 04-candidates)
- **Port test: PASS.** Strike withdrawals are deferred `lockup_days × 24h` after each request and cancellable until execution. Hyperliquid vault withdrawals have no per-request clock (lockup counts from deposit: "User vaults have a lock-up period of 1 day"), so there is no clock to start early.
- **Delete-sponsor test: PASS.** Without Strike vaults there is nothing to exit.
- **Generic red flags hit: none.** Small user base today (3 user vaults, 33 depositors) is acknowledged; the demo runs on a vault the builder creates, so it does not depend on network effects.

---

## 6. What's essential

- **Host primitive:** Strike's **per-request, deferred, cancellable vault withdrawal** (`lockup_days × 24h` after request; cancel until execution). Without it there is no head-start to win and no free option to exercise; on Hyperliquid vaults you simply withdraw after lockup from deposit, so Rescind collapses into an alert.
- **Sponsor primitive:** Strike **public vault reads** (positions with leverage by `vault_id`, vault history with `status` and `execute_at_timestamp`) plus **master API wallet** vault writes. Without the reads there is no detection; without the writes there is no enforcement.
- **Verified in source:**
  - Public reads, live on mainnet Oct 22, 2026: `GET /v2/vaults`, `GET /v2/positions?vault_id=` (`user-api.yaml`, public selector `vault_id`), `GET /v2/vault/:id/history`, `GET /v2/vault/:id/portfolio`. https://github.com/strike-finance/strike-finance-skills/tree/main/openapi
  - Writes: `POST /v2/vault/withdraw`, `POST /v2/vault/:id/withdrawals/:withdrawal_id/cancel`, `POST /v2/vault/create`, documented in `skills/strike-vaults/SKILL.md`; route group "Trading + masterOnly" (API wallets allowed) in `skills/strike-auth/SKILL.md`, both in https://github.com/strike-finance/strike-finance-skills (commit 2026-10-20, "sync skills and OpenAPI specs with strike-v2-backend", package v0.0.4). **Not yet exercised live.** Not in the public docs "Vaults (Authenticated)" page, which lists only GETs. See §24.
  - Signing: `signRequest` / `authenticatedFetch` in https://github.com/strike-finance/strike-builder-reference/blob/main/src/api/auth.ts (synced 2026-10-20).

---

## 7. Users and roles

| Role | Description | What they do in Rescind |
|---|---|---|
| **Depositor** (primary) | Holds shares in a Strike user vault through a master account | Connects key, sets mandates, arms watches, reads receipts, overrides actions |
| **Verifier** (judge, other depositor, X audience) | Anyone with a receipt link | Opens the public verify page, follows links to raw Strike endpoints, checks timestamps |
| **Leader** (indirect) | Trades the vault | Not a Rescind user in v1. Their behaviour is the input. (Leader-published mandates are future potential, out of scope.) |

Target user is never "everyone": it is a depositor in a named Strike user vault (Glacier Arc Digital, MARKET WIZARDS, Strike V.I.S.I.O.N. Strategy).

---

## 8. Functional requirements

Priority: **P0** must ship for the demo and claim; **P1** ship if time allows; **P2** documented only.

### 8.1 Account connection
- **FR-01 (P0)** Paste-key onboarding: Rescind generates a fresh Ed25519 keypair server-side, shows only the public key (64 lowercase hex), and instructs the user to register it at `app.strikefinance.org/api-keys` using **"Authorize"** (not "Generate"). The private key never leaves the server.
- **FR-02 (P0)** Verify the key: call `GET /v2/account` signed with the key; store `account_id`; reject if the response indicates a sub-account-bound key (vault writes are masterOnly; sub-account keys get `403 not available to sub-account API keys`).
- **FR-03 (P1)** Builder Connect onboarding (CIP-30): `POST /auth/builder/request-signature` → user signs `message_to_sign` with their Cardano wallet (CIP-30 `signData`, COSE format `{coseSign1Hex}:{coseKeyHex}`) → `POST /auth/builder/verify-signature`. Requires a Rescind builder code (see §28). `fee_share_bps` = 0 (Rescind places no orders). Store `api_wallet_expired_at`.
- **FR-04 (P0)** Show key status: active, expiring (with date), expired/revoked (on `401 wallet expired or revoked`).
- **FR-05 (P0)** Disconnect: disarm all watches for the account and delete the stored private key. Instruct the user to also revoke the key on Strike's API keys page.

### 8.2 Vault selection
- **FR-06 (P0)** List vaults from `GET /v2/vaults` (name, type, status, equity, share price, leader fee, lockup days, min deposit, depositors). Protocol vaults (SLP) are shown but **cannot be armed** in v1 (leader is Strike, mandate concept doesn't apply; still allowed as read-only view). This is a picker, not a ranking or analytics view.
- **FR-07 (P0)** Show the connected account's vault positions from `GET /v2/vault/positions` (authenticated) so the user can see which vaults they hold shares in.
- **FR-08 (P0)** A watch can only be **armed** on a vault where the account holds available shares (`GET /v2/vault/position?vault_id=` → `available_shares > 0`). Watches on vaults without shares run in **dry-run** mode (evaluate and log, never write).

### 8.3 Mandate
- **FR-09 (P0)** Mandate editor with exactly four rules (see §9): max effective leverage, allowed markets, max drawdown from peak share price, min leader stake. Each rule can be enabled or disabled; at least one must be enabled to arm.
- **FR-10 (P0)** Pre-arm check: evaluate the mandate against the current vault snapshot and show which rules would already be in breach. If any are, the user must confirm before arming (arming would file immediately).
- **FR-11 (P0)** Mandate is versioned. Editing an armed mandate creates a new version; receipts reference the version that triggered them.
- **FR-12 (P1)** Mandate presets the user can start from (e.g. "Conservative: 3x, crypto majors only, 10% drawdown, 5% leader stake"). Presets are values only.

### 8.4 Watch lifecycle
- **FR-13 (P0)** Watch modes: `dry_run` (evaluate, log, never write), `armed` (file and cancel automatically), `paused` (no evaluation).
- **FR-14 (P0)** Auto-cancel setting per watch: `on` (default; cancel on cure) or `off` (never cancel automatically; withdrawal runs to execution unless the user cancels manually).
- **FR-15 (P0)** Manual override buttons on an armed watch with a pending Rescind withdrawal: "Cancel withdrawal now" and "Keep withdrawal (disable auto-cancel for this one)".
- **FR-16 (P0)** Manual "File withdrawal now" action independent of rules.

### 8.5 Detection and enforcement
- **FR-17 (P0)** Poll the public endpoints listed in §11.2 for every armed or dry-run watch at the configured interval (default 5 s, minimum 3 s).
- **FR-18 (P0)** Evaluate all enabled rules on every successful snapshot. A breach is confirmed after **2 consecutive breaching snapshots** (default; configurable 1 to 5) to avoid acting on a single stale read.
- **FR-19 (P0)** On confirmed breach in `armed` mode with no pending Rescind withdrawal: call `POST /v2/vault/withdraw {vault_id, withdraw_all: true}`. If the account has Credit-encumbered shares, see FR-30.
- **FR-20 (P0)** After filing, read back `GET /v2/vault/:id/history?…` (or `GET /v2/vault/history?vault_id=` authenticated) and the user stream to obtain `withdrawal_id` (= `request_id` from the withdraw response), `execute_at_timestamp`, `status: pending`.
- **FR-21 (P0)** Cure detection: cure is confirmed when all enabled rules pass for **N consecutive snapshots** (default 3) and at least `cure_grace_seconds` (default 30) have passed since the breach was filed.
- **FR-22 (P0)** On confirmed cure with auto-cancel on and withdrawal still `pending`: call `POST /v2/vault/:id/withdrawals/:withdrawal_id/cancel`. Confirm with `VAULT_WITHDRAWAL_CANCELLED` or the history row `status: cancelled`.
- **FR-23 (P0)** Flapping guard: after **K auto-cancels per watch per 24 h** (default 2), auto-cancel is disabled until the user re-enables it. Rationale: each cancel resets the clock; a flapping leader could otherwise keep pushing the exit back.
- **FR-24 (P0)** Never double-file: if a Rescind-filed withdrawal is `pending`, a new breach on the same watch only updates the receipt (adds the new rule violation); it does not file again.
- **FR-25 (P0)** Re-breach after cancel: file a new withdrawal (new clock). The receipt chain links the cancelled and the new withdrawal.
- **FR-26 (P0)** Detect execution: on `VAULT_WITHDRAWAL_EXECUTED` or history row `completed`, record `actual_usd`, `execution_share_price`, `leader_fee`, and move the watch to `exited`.
- **FR-27 (P0)** Detect execution delays and failures: `VAULT_WITHDRAWAL_EXECUTE_FAILED` (retryable or blocked), and the documented retry reasons (`withdrawal is still locked until <ms>`, `insufficient protected Vault capacity…`). Show them on the watch and receipt.
- **FR-28 (P1)** Pending-withdrawal queue awareness: "Only one withdrawal per vault holds execution capacity at a time." Show if other withdrawals in the vault history are pending ahead.
- **FR-29 (P1)** Subscribe to the user stream (`wss://api.strikefinance.org/ws/user-api`, `session.logon`) for the depositor account to receive `VAULT_WITHDRAWAL_*` events instead of only polling history.
- **FR-30 (P0)** Credit-encumbered shares: if `GET /v2/vault/position` shows the account holds Credit-encumbered shares, Rescind refuses to arm and explains why. (`withdraw_all` "Withdraws every available share, including Credit-encumbered ones", which can create a debt remainder with a 24-hour deadline; handling is out of scope.)
- **FR-31 (P0)** Paused vault: withdrawal requests "are accepted while the vault is `paused`", so Rescind still files. Show vault status; never trust a `paused` read for more than one cycle (it can flip back to `active`).

### 8.6 Receipts and verification
- **FR-32 (P0)** Every breach creates a receipt (§17) linking the breaching fill (from `GET /v2/history/fill?vault_id=`) and the withdrawal row.
- **FR-33 (P0)** Public verify page per receipt, reachable without login, that shows only public data and links to the raw Strike endpoints.
- **FR-34 (P0)** Activity log per watch: every evaluation result summary, filing, cancel, execution, error.

### 8.7 Settings
- **FR-35 (P0)** Global settings: poll interval, breach confirmation count, cure confirmation count, cure grace, max auto-cancels per 24 h.
- **FR-36 (P1)** Key rotation: generate a new keypair, register, verify, swap, delete old.

---

## 9. Mandate rules: exact definitions

All amounts are Strike decimal strings parsed with arbitrary-precision decimal arithmetic (no floats).

### R1. Max effective leverage
- **Inputs:** `GET /v2/positions?vault_id=<id>` → per position `symbol`, `size` (signed base units); `GET /v2/markPrice` (all symbols array, or per symbol; cached ~5 s) → `p` mark price; `GET /v2/vault/:id` → `equity`.
- **Value:** `effective_leverage = Σ |size_i × mark_i| ÷ equity`.
- **Breach condition:** `effective_leverage > max_effective_leverage`.
- **Why not the `leverage` field:** each position's `leverage` is the account's setting for that market (Glacier shows 20 on most), not actual exposure. Rescind measures real exposure. The UI may show the per-position setting as context.
- **Edge cases:** `equity ≤ 0` → treat as breach (the vault is insolvent). Missing mark for a symbol → fall back to `entry_price` and flag the snapshot as degraded; a degraded snapshot cannot confirm a breach alone.

### R2. Allowed markets
- **Inputs:** positions (`symbol`) and the market list from `GET /v2/markets`.
- **Value:** set of symbols with non-zero size not in `allowed_markets`.
- **Breach condition:** set non-empty.
- **Editor:** choose from the live market list; offer groups as shortcuts (crypto, stock perps, commodities) derived from the market list. Groups are a convenience; the stored mandate is the explicit symbol list.
- **Optional (P1):** also breach on open orders in disallowed markets via `GET /v2/openOrders?vault_id=` (public selector).

### R3. Max drawdown from peak share price
- **Inputs:** `GET /v2/vault/:id` → `share_price`.
- **Peak:** highest `share_price` observed since the mandate version was armed. On arm, seed the peak with the current `share_price` (not the vault's all-time high: the depositor accepts the vault as it is when they arm).
- **Value:** `drawdown = 1 − share_price ÷ peak`.
- **Breach condition:** `drawdown > max_drawdown` (fraction, e.g. 0.15).
- **Note:** Strike's `GET /v2/vault/:id/portfolio` `max_drawdown` is per period and may be omitted with little history; Rescind does not rely on it.

### R4. Min leader stake
- **Inputs:** `GET /v2/vault/:id` → `leader_account_id`, `nickname`; `GET /v2/vault/:id/depositors` → rows with `address`, `nickname`, `share_percentage`.
- **Value:** the leader's `share_percentage` (the row whose `address` equals the leader's wallet or account id, or whose `nickname` matches the vault's leader nickname).
- **Breach condition:** `leader_share_pct < min_leader_stake_pct`.
- **Note:** Strike enforces a 5% floor only on the leader's own withdrawal requests; "Deposits by others can still dilute the leader below 5%." Rescind lets the depositor set their own floor. If the leader row cannot be matched with certainty, R4 is reported as `unknown` and never confirms a breach. **Confirm the matching rule against live data before relying on it.**

### Evaluation output (per snapshot)
`{ snapshot_id, taken_at, degraded: bool, rules: [{rule, enabled, value, limit, status: pass|breach|unknown}], overall: pass|breach|unknown }`

---

## 10. Rescind engine: state machine and edge cases

### 10.1 Watch states
```
draft ──arm──► armed_clear ──breach confirmed──► armed_filing ──200 + request_id──► armed_pending
   ▲              ▲   │                              │ error                          │      │
   │              │   └─pause─► paused               └──► armed_error (retry w/ backoff)│      │
   │              │                                                                   │      │
   │              └──────── cancel confirmed ◄── armed_cancelling ◄── cure confirmed ─┘      │
   │                                                                                         │
   │                                                    VAULT_WITHDRAWAL_EXECUTED ───────────┴──► exited
dry_run (evaluate + log only, never writes)
```

### 10.2 Rules
- One active watch per (account, vault).
- Write calls are idempotent at the app level: before any `POST /v2/vault/withdraw`, read pending withdrawals for this account and vault (`GET /v2/vault/history?vault_id=&type=withdrawal&status=pending`, authenticated) and skip if one exists.
- Engine-level rejections arrive asynchronously as `VAULT_WITHDRAWAL_REQUEST_FAILED` (e.g. `insufficient available shares`, `no position found for account…`). The worker must read history/stream after filing to confirm `pending`; a 200 from the API means "submitted", not "accepted".
- Cancel race: a cancel at or after execution returns `404 withdrawal not found`. Treat as "already executed or already cancelled" and re-read history to decide.
- Cancel failures arrive as `VAULT_WITHDRAWAL_CANCEL_FAILED` with an internal `request_id` the API never returned; correlate by time and vault.
- Unknown `vault_id` on withdraw: the API returns 200 then fails in the engine; Rescind validates vault existence first.
- Partial withdrawal `shares` must have at most 8 decimals; Rescind uses `withdraw_all: true` (exact full balance).
- Clock skew: sync with `GET /v2/time` at start and every 10 minutes; timestamps must be within 3 minutes of server time and never in the future.
- Rate limits: per API wallet public key for authenticated calls, per IP for public reads; on `429 {"error":"rate limit exceeded"}` back off exponentially and mark snapshots stale. Stale snapshots cannot confirm a breach or a cure.
- `503 service unavailable` / `503 vault data is temporarily unavailable`: treat as stale, retry.

### 10.3 Withdrawal economics shown to the user (from strike-vaults skill)
- Payout: `gross = shares × share_price` at execution, after any unwind.
- Leader fee: `commission_bps/10000 × max(0, exec_share_price − avg_entry_price_at_request) × shares`, capped at `gross`; `net = gross − fee`. No fee on protocol vaults.
- Unwind: with `allow_proportional_close: true`, positions reduced in proportion; otherwise 10% of the single largest position per round, up to 10 rounds per attempt. Unwind orders use client id `vault_wd_<order_id>` and are reduce-only IOC limit within `min(5%, market bound)` of mark, retried every 10 s.
- Payout capacity is limited by the vault's Recovery max margin ratio (default 0.5).
- Strike's own withdrawal fee to an external wallet is a flat $1 (Builder Codes docs); vault withdrawal credits USD to the Strike balance, not an external wallet. Rescind never withdraws to an external wallet (API wallets cannot).

---

## 11. Strike API integration reference

### 11.1 Hosts
- Mainnet REST: `https://api.strikefinance.org`
- Testnet REST: `https://api-v2-testnet.strikefinance.org`
- User WebSocket: `wss://api.strikefinance.org/ws/user-api` (logon with `session.logon` using the same key; subscribe `{"method":"subscribe","channel":"userstream"}`)
- Config flag `STRIKE_ENV=mainnet|testnet` switches hosts.

### 11.2 Public reads (no auth)
| Endpoint | Use | Key fields |
|---|---|---|
| `GET /v2/time` | Clock sync | `serverTime` |
| `GET /v2/markets` | Market list for R2 | symbols |
| `GET /v2/markPrice` | Marks for R1 (array without `symbol`) | `s`, `p` |
| `GET /v2/vaults` (`?leader_account_id=`, `?type=protocol`) | Vault picker, vault state | `vault_id`, `account_id` (`vault_` + 8 chars), `type`, `name`, `leader_account_id`, `nickname`, `leader_commission_bps`, `total_shares`, `share_price`, `equity`, `wallet_balance`, `min_leader_share_pct`, `lockup_days`, `min_deposit`, `allow_proportional_close`, `status`, `is_verified`, `apr`, `all_time_pnl`, `return_24h`, `depositors`, `fee_earned` |
| `GET /v2/vault/:id` | Per-poll vault state (R1 equity, R3 share price) | same as above |
| `GET /v2/positions?vault_id=` | R1, R2 | `symbol`, `size`, `leverage`, `margin_mode`, `entry_price`, `upnl`, `liquidation_price` |
| `GET /v2/openOrders?vault_id=` | R2 optional | orders |
| `GET /v2/history/fill?vault_id=` | Breaching fill for receipts | `id`, `trade_id`, `order_id`, `symbol`, `side`, `price`, `size`, `timestamp`, `leverage` |
| `GET /v2/vault/:id/history` | Withdrawal rows (public) | `id` (= `withdrawal_id` for withdrawals), `type`, `status`, `timestamp`, `shares_burned`, `estimated_usd`, `actual_usd`, `share_price`, `execution_share_price`, `leader_fee`, `avg_entry_price`, `execute_at_timestamp`, `executed_timestamp`, `address`, `nickname` |
| `GET /v2/vault/:id/depositors` | R4 | `address`, `nickname`, `share_percentage`, `current_equity` (positions < $1 hidden) |
| `GET /v2/vault/:id/portfolio` | Context only | `total_value_locked`, `max_drawdown`, `sharpe_ratio`, `all_time_pnl` |

Pass the vault **UUID**, not `vault_…`, to account-style endpoints (the `vault_` form fails the UUID check).

### 11.3 Authenticated reads (depositor key)
| Endpoint | Use |
|---|---|
| `GET /v2/account` | Verify key, get `account_id` |
| `GET /v2/vault/positions` | Vaults the account holds |
| `GET /v2/vault/position?vault_id=` | `shares`, `shares_locked`, `available_shares`, `avg_entry_price`, `current_value`, `unrealized_pnl` |
| `GET /v2/vault/history?vault_id=&type=withdrawal&status=pending` | Own pending withdrawals |
| `GET /v2/sub-accounts` | Detect sub-account-bound keys (a sub-account key receives an empty list) |

### 11.4 Writes (depositor master key, "Trading + masterOnly")
| Endpoint | Body | Response |
|---|---|---|
| `POST /v2/vault/withdraw` | `{"vault_id": "...", "withdraw_all": true}` (or `{"vault_id","shares"}`, ≤ 8 decimals) | `{"success": true, "request_id": "uuid", "message": "withdrawal request submitted"}`; `request_id` is the `withdrawal_id` |
| `POST /v2/vault/:id/withdrawals/:withdrawal_id/cancel` | none | `{"success": true, "message": "withdrawal cancelled successfully"}`; errors `404 withdrawal not found`, `403 unauthorized to cancel this withdrawal`, `404 vault_id does not match withdrawal`, `500 failed to cancel withdrawal` |
| `POST /v2/vault/create` (demo only, leader account) | `name`, `description`, `initial_deposit` (≥ 100), `leader_commission_bps` (0 to 5000; `0` becomes 1000), `lockup_days` (1 to 30), `min_deposit` (default 100), `allow_proportional_close` | `{"success": true, "request_id": "uuid", "message": "vault creation request submitted"}`; vault id not returned, find via `GET /v2/vaults?leader_account_id=`. One active vault per account (`user already has an active vault`). |
| `POST /v2/vault/deposit` (demo only, depositor) | `{"vault_id","usd_amount"}` | async; `VAULT_DEPOSIT_FAILED` on engine rejection |

Withdraw body is decoded strictly: unknown fields, non-string amounts, or empty `vault_id` → `400 {"error":"invalid request"}`.

### 11.5 Vault user-stream events consumed
`VAULT_WITHDRAWAL_REQUESTED` (`withdrawal_id`, `vault_id`, `shares`, `estimated_usd`, `share_price`, `request_timestamp`, `execute_at_timestamp`, `avg_entry_price`), `VAULT_WITHDRAWAL_CANCELLED` (`withdrawal_id`, `shares_unlocked`), `VAULT_WITHDRAWAL_EXECUTED` (`gross_usd`, `leader_fee`, `net_usd`, `actual_usd`, `execution_share_price`, `remaining_shares`, `execution_timestamp`), `VAULT_WITHDRAWAL_REQUEST_FAILED`, `VAULT_WITHDRAWAL_CANCEL_FAILED`, `VAULT_WITHDRAWAL_EXECUTE_FAILED`, `VAULT_DEPOSITED`, `VAULT_DEPOSIT_FAILED`. Events arrive wrapped: `{"e":"ACCOUNT_UPDATE","E":…,"data":{"event_type":"VAULT_…","event_data":{…}}}`.

---

## 12. Authentication and key handling

### 12.1 Request signing (Strike API wallets)
- Ed25519 keypair. Library: `@noble/ed25519` **v2** with `ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))` from `@noble/hashes/sha2.js` (v2 exports only `.js` subpaths). v3 renamed APIs; pin v2.
- Headers on every authenticated request: `X-API-Wallet-Public-Key`, `X-API-Wallet-Signature`, `X-API-Wallet-Timestamp` (Unix seconds), `X-API-Wallet-Nonce` (unique UUID per request).
- Signed message: `{METHOD}:{PATH}:{TIMESTAMP}:{NONCE}:{BODY_HASH}`; `BODY_HASH` = SHA-256 of the exact JSON body bytes (empty string for GET). Sign the full path including query string. Serialize the body once and send exactly those bytes.
- Server checks: timestamp within 3 minutes; nonce unused; valid signature; wallet active.
- Errors to handle: `missing API wallet authentication headers`, `signature expired or invalid timestamp`, `authentication failed`, `wallet expired or revoked`, `nonce already used`, `403 not available to sub-account API keys`.
- Reference implementation to port: `src/api/auth.ts` (`signRequest`, `authenticatedFetch`) in strike-builder-reference.
- Generate a **fresh keypair for every connect**: public keys are unique; re-registering a used key fails with `500 failed to create API wallet`. Send the public key in lowercase hex exactly as registered.
- If any `X-API-Wallet-Public-Key` header is present, even public reads are fully verified; send public reads **without** auth headers.

### 12.2 Builder Connect (P1 path)
- `POST /auth/builder/request-signature` with `address`, `chain: "cardano"`, `code` (Rescind builder code), `fee_share_bps: 0`, `public_key`; response `nonce` (expires 5 min), `message_to_sign`.
- User signs `message_to_sign` exactly (it binds builder code, fee cap, wallet, chain, API wallet public key, nonce and timestamp).
- `POST /auth/builder/verify-signature` with `nonce`, `wallet_signature` (`{coseSign1Hex}:{coseKeyHex}`). On success Strike creates the account if needed, approves the builder, **revokes existing API wallets for that account and builder code**, and creates a new master-bound API wallet. Response: `account_id`, `nickname`, `builder_code`, `fee_share_bps`, `api_wallet_id`, `api_wallet_public_key`, `api_wallet_expired_at`.
- Nonces are single-use; replay returns 400.

### 12.3 Key storage
- Private keys encrypted at rest with AES-256-GCM using a server secret (`BREACH_KEY_ENCRYPTION_SECRET`), unique IV per record.
- Decrypt only inside the worker or the server action performing a signed call; never send to the browser; never log.
- Logs carry counts, ids and statuses only.

### 12.4 App sessions
- Single-operator self-hosted app (v1). Access to the app UI is protected by an operator passphrase (`BREACH_ADMIN_PASSPHRASE`) with an HTTP-only session cookie. The `/verify/*` routes and `/` are public.

---

## 13. Data model

Storage: SQLite via an ORM (Drizzle or Prisma). Decimal values stored as strings.

| Table | Fields |
|---|---|
| `accounts` | `id`, `strike_account_id`, `label`, `chain` (cardano/ethereum/solana, optional), `wallet_address` (optional), `onboarding` (`paste_key` / `builder_connect`), `created_at` |
| `api_wallets` | `id`, `account_id`, `public_key`, `private_key_enc`, `iv`, `api_wallet_id` (Builder Connect), `expires_at`, `status` (active/expired/revoked/deleted), `verified_at`, `created_at` |
| `vault_cache` | `vault_id`, `account_id_vault` (`vault_xxxxxxxx`), `name`, `type`, `leader_account_id`, `leader_nickname`, `lockup_days`, `min_deposit`, `status`, `last_seen_at` |
| `mandates` | `id`, `watch_id`, `version`, `max_effective_leverage` (nullable), `allowed_markets` (JSON, nullable), `max_drawdown` (nullable), `min_leader_stake_pct` (nullable), `peak_share_price_seed`, `created_at` |
| `watches` | `id`, `account_id`, `vault_id`, `mode` (dry_run/armed/paused), `state` (§10.1), `auto_cancel` (bool), `auto_cancels_24h`, `breach_confirm_n`, `cure_confirm_n`, `cure_grace_s`, `peak_share_price`, `active_mandate_version`, `created_at`, `updated_at` |
| `snapshots` | `id`, `watch_id`, `taken_at`, `equity`, `share_price`, `positions` (JSON), `marks` (JSON), `leader_share_pct`, `degraded`, `stale`, `latency_ms` |
| `evaluations` | `id`, `snapshot_id`, `watch_id`, `mandate_version`, `rules` (JSON per §9), `overall` |
| `breaches` | `id`, `watch_id`, `mandate_version`, `first_breach_snapshot_id`, `confirmed_snapshot_id`, `rules_breached` (JSON), `breaching_fill_id`, `breaching_fill_ts`, `confirmed_at`, `cured_at` (nullable) |
| `withdrawal_actions` | `id`, `breach_id`, `watch_id`, `kind` (file/cancel), `withdrawal_id`, `requested_at`, `execute_at`, `status` (submitted/pending/cancelled/completed/failed/blocked), `api_response` (JSON, redacted), `engine_error`, `actual_usd`, `execution_share_price`, `leader_fee`, `created_at`, `updated_at` |
| `receipts` | `id` (public, unguessable), `breach_id`, `vault_id`, `summary` (JSON), `public` (bool), `created_at` |
| `activity_log` | `id`, `watch_id`, `ts`, `level`, `event`, `detail` (JSON, no secrets) |
| `settings` | key/value: poll interval, confirmation counts, grace, max auto-cancels, `STRIKE_ENV` |

Retention: keep raw snapshots for 7 days; keep evaluations linked to breaches forever; aggregate others.

---

## 14. Pages and routes

Framework: Next.js (App Router), TypeScript. Visual design per `frontend.md`. Each page below lists purpose, data, and required actions only.

| Route | Access | Purpose | Must contain / do |
|---|---|---|---|
| `/` | Public | Landing | One-sentence product description; the claim; "Check it yourself" explanation with a link to a sample receipt; link to `/connect`; the live fact about Strike's largest user vault (from `GET /v2/vaults` + positions, fetched live with a fallback snapshot) |
| `/login` | Public | Operator access | Passphrase form; redirects to `/app` |
| `/connect` | Operator | Onboarding chooser | Two paths: paste key (P0) and Builder Connect (P1); explains that the key can trade but cannot withdraw to external wallets, and that a dedicated depositor account holding only vault shares is recommended |
| `/connect/key` | Operator | Paste-key flow | Generate keypair; show public key with copy action; instructions to register with "Authorize" at `app.strikefinance.org/api-keys`; "Verify" action calling `GET /v2/account`; error states for sub-account key, invalid, expired |
| `/connect/wallet` | Operator | Builder Connect (CIP-30) flow | Wallet detection (CIP-30 providers), request-signature, show `message_to_sign`, sign, verify-signature, store key; error states |
| `/app` | Operator | Watch list home | All watches with vault name, mode, state, current overall evaluation, pending withdrawal (if any) with time until `execute_at`; account and key status; link to add watch |
| `/vaults` | Operator | Vault picker | List from `GET /v2/vaults` with fields in FR-06; marks vaults where the connected account holds shares; "Watch this vault" action; protocol vaults read-only |
| `/vaults/[vaultId]` | Operator | Vault live view | Current snapshot: equity, share price, positions (symbol, size, notional at mark, leverage setting, margin mode), effective leverage, leader stake, status, lockup days; pending withdrawals in the vault history; the account's own position (`shares`, `shares_locked`, `available_shares`) |
| `/watches/new?vault=[vaultId]` | Operator | Create watch + mandate | Mandate editor (four rules, enable toggles, market selector with groups); pre-arm check against the current snapshot (FR-10); mode selection (dry run / armed); auto-cancel toggle; confirmation if already breaching |
| `/watches/[watchId]` | Operator | Watch detail | Live rule-by-rule evaluation (value vs limit, pass/breach/unknown); state machine position; pending withdrawal with `withdrawal_id`, request time, `execute_at`; override actions (FR-15, FR-16); pause/resume; dry-run/arm switch; flapping guard status |
| `/watches/[watchId]/mandate` | Operator | Edit mandate | Edit creates a new version (FR-11); shows version history |
| `/watches/[watchId]/activity` | Operator | Activity log | Chronological log of evaluations (summarised), filings, cancels, executions, errors |
| `/receipts` | Operator | Receipt list | All receipts across watches with status and public toggle |
| `/receipts/[receiptId]` | Operator | Receipt detail (private) | Full receipt (§17) plus internal fields (API responses redacted, latency); publish/unpublish toggle; copy public link |
| `/verify/[receiptId]` | Public | Public verify page | Public receipt fields only; direct links to the raw Strike URLs for the breaching fill and the withdrawal row; the timestamps to compare and the computed gap; plain explanation of how to check |
| `/settings` | Operator | Settings | Poll interval, confirmation counts, cure grace, max auto-cancels/24h, network (mainnet/testnet, read-only display from env); key rotation (P1); disconnect account (FR-05) |
| `/dev/leader` | Operator, **dev/demo builds only** (`BREACH_DEMO_MODE=1`) | Demo leader console | For the demo vault owned by the leader account: place and close a position (`POST /v2/order` with `vault_id`), show vault positions. Disabled in production builds. |
| `/api/health` | Public | Health | Worker heartbeat age, last poll time, Strike reachability |

Error routes: `not-found` and `error` boundaries for all segments.

---

## 15. API routes (internal, Next.js route handlers)

All operator routes require the session cookie. Request and response bodies validated with a schema library (zod).

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Passphrase login |
| POST | `/api/auth/logout` | End session |
| POST | `/api/keys/generate` | Create keypair, store encrypted, return public key |
| POST | `/api/keys/verify` | Signed `GET /v2/account`; reject sub-account keys; bind to account |
| DELETE | `/api/keys/[id]` | Delete stored private key, disarm watches |
| POST | `/api/connect/request-signature` | Proxy to Strike `POST /auth/builder/request-signature` |
| POST | `/api/connect/verify-signature` | Proxy to Strike `POST /auth/builder/verify-signature`, store wallet |
| GET | `/api/vaults` | Cached `GET /v2/vaults` |
| GET | `/api/vaults/[vaultId]/snapshot` | Latest snapshot + evaluation context |
| GET | `/api/vaults/[vaultId]/position` | Account's vault position (authenticated read) |
| GET | `/api/markets` | Cached `GET /v2/markets` |
| GET / POST | `/api/watches` | List / create watch with mandate |
| GET / PATCH / DELETE | `/api/watches/[watchId]` | Read / update mode, auto-cancel, pause / delete |
| POST | `/api/watches/[watchId]/mandate` | New mandate version |
| POST | `/api/watches/[watchId]/preview` | Evaluate a draft mandate against the current snapshot (FR-10) |
| POST | `/api/watches/[watchId]/withdraw` | Manual file (FR-16) |
| POST | `/api/watches/[watchId]/cancel` | Manual cancel (FR-15) |
| POST | `/api/watches/[watchId]/keep` | Disable auto-cancel for the current withdrawal |
| GET | `/api/watches/[watchId]/activity` | Activity log page |
| GET | `/api/receipts` | List receipts |
| GET / PATCH | `/api/receipts/[receiptId]` | Read / publish toggle |
| GET | `/api/public/receipts/[receiptId]` | Public receipt JSON (no auth, published only) |
| GET | `/api/health` | Health |
| POST | `/api/dev/leader/order` | Demo only: leader order with `vault_id` |

---

## 16. Background worker

- A long-running Node process (`worker/`), separate from the Next.js server, sharing the database and the Strike client library. Serverless cron is minute-level and cannot meet a few-second poll; Rescind is **self-hosted** (VPS, Railway, Fly, or local machine for the demo).
- Loop per tick: for each `armed` / `dry_run` watch, fetch the public reads in parallel (dedupe per vault across watches), compute marks once per tick, evaluate, advance the state machine, perform writes, write receipts and logs.
- Scheduling: per-vault fetch at most once per tick; jitter; global concurrency cap.
- Heartbeat row updated every tick; `/api/health` reports age.
- User-stream client (P1) per connected account, reconnect with backoff, keepalive per strike-userstream skill.
- Graceful shutdown: finish in-flight writes, persist state.
- All write paths go through one module with pre-write checks (§10.2) and post-write confirmation.

---

## 17. Receipts and the public verify page

### 17.1 Receipt contents
- Vault: name, `vault_id`, lockup days.
- Mandate version and the rule(s) breached, with measured value and limit at confirmation.
- **Breaching fill:** first fill in `GET /v2/history/fill?vault_id=` for the offending symbol at or after the last passing snapshot: `id`, `symbol`, `side`, `size`, `price`, `timestamp`.
- Breach confirmed at (Rescind clock) and snapshot latency.
- **Withdrawal:** `withdrawal_id`, request `timestamp`, `execute_at_timestamp`, final `status` (`pending` → `cancelled` / `completed`).
- If cancelled: cure confirmed at, cancel time, rules passing at cure.
- If executed: `execution_share_price`, `actual_usd`, `leader_fee`.
- **Gap:** `withdrawal.timestamp − breaching_fill.timestamp` (the claim).
- Chain: links to previous/next receipts on the same watch (re-breach after cancel).

### 17.2 How a judge checks the claim
Open two public URLs, no login:
1. `GET https://api.strikefinance.org/v2/history/fill?vault_id=<demo vault>` → time of the first breaching fill.
2. `GET https://api.strikefinance.org/v2/vault/<demo vault>/history` → the depositor's withdrawal row: request `timestamp`, `execute_at_timestamp`, `status` (`pending` → `cancelled` after the cure).

The gap between the two timestamps is the claim. The verify page links both rows and shows the gap.

### 17.3 Public data rule
The verify page shows only what Strike already exposes publicly (vault fills, vault history rows, vault id). It never shows the depositor's account id unless already visible in the public vault history row (`address` / `nickname`).

---

## 18. Demo moment and demo setup

### 18.1 Demo moment (target under 30 seconds)
- **Before:** the leader opens a ~15x position in a test vault against a depositor mandate of max 5x. Without Rescind, the depositor's account shows nothing; no withdrawal row exists; the clock isn't running.
- **After:** within one poll, Rescind shows "BREACH: effective leverage 14.8x > 5x" (illustrative), a `pending` withdrawal row appears in the public vault history with its `execute_at`. The leader cuts to 3x; the row flips to `cancelled`; Rescind shows "Cured. Cost: 0."

### 18.2 Demo setup requirements
- **Leader account:** the user's funded main account creates a test vault (`POST /v2/vault/create` or in the app): `initial_deposit` ≥ 100, `lockup_days` 1, `min_deposit` set low enough for the depositor, `allow_proportional_close: true`. One active vault per account.
- **Depositor account:** a second master account (second wallet; Builder Connect creates accounts for new wallets) funded with at least the vault's `min_deposit` (minimum external deposit is $5). Deposits into the vault from this account.
- **Depositor key:** master-bound API wallet registered on the depositor account.
- **Cost estimate:** ≈ $100 vault seed + small deposit + $1 external withdrawal fees.
- **Fallback:** if a second account cannot be funded in time, demo on an existing user vault with the user's own deposit (MARKET WIZARDS, `min_deposit` 50), using a mandate the vault currently breaches in dry-run, then one armed file + manual cancel.
- **Mandate for the demo:** max effective leverage 5x, allowed markets = crypto majors, max drawdown 15%.
- Demo leader actions can be done through the Strike app or `/dev/leader`.

---

## 19. Judge's first 30 seconds and README requirements

### 19.1 Video, first 30 seconds
Split view. Left: the leader's terminal opens a 15x ETH position in a test vault. Right: the depositor's Rescind watch with mandate "max 5x · crypto only · max 15% drawdown". About five seconds later the watch shows "BREACH: effective leverage 14.8x > 5x (fill 4346…)". Next line: "Exit clock started: withdrawal `wd_…` executes 15:42 tomorrow", with the public vault history row underneath. The leader cuts to 3x. Watch: "Cured. Withdrawal cancelled. Cost: 0." (Numbers, fill id and time are illustrative.)

### 19.2 README (required content, in this order)
1. The negative claim.
2. "Check it yourself": the two public URLs (vault fills and vault history), the demo vault id, and the timestamps to compare.
3. One live fact: Strike's largest user vault holds 18 positions, 13 of them on a 20x leverage setting, across crypto, stock and commodity perps (live `GET /v2/positions?vault_id=2e782d92-…`, Oct 22, 2026).
4. The person and the moment (§3), why the obvious fix fails (§4).
5. How it uses Strike: endpoint table (§11) and why each is essential (§6).
6. Key safety: master key requirement, self-host, dedicated depositor account, API wallets cannot withdraw to external wallets and the destination is locked to the onboarding wallet.
7. Setup and run (env vars, DB migration, start web + worker, testnet switch).
8. Limits and known risks (§22, §24).
9. Not affiliated with Strike Finance. Not financial advice.

---

## 20. Scope

**In:**
- Mandate editor with four rules: max effective leverage (Σ|notional| ÷ vault equity), allowed markets, max drawdown from peak share price, min leader stake share
- Poller on public endpoints; rules engine; withdraw + cancel calls signed with the depositor's master API wallet
- One onboarding path: paste a key registered at app.strikefinance.org/api-keys, or Builder Connect (CIP-30) using the reference app's flow
- Receipt log and a public verify page that links the breaching fill and the withdrawal row
- A test vault for the demo (`initial_deposit` ≥ 100) plus a second depositor account

**Out (explicitly cut, do not let these creep back in):**
- Telegram / Discord alerts
- Vault discovery, ranking, analytics dashboards
- Copy-trading features of any kind
- Leader-side tools, AI scoring, mobile app
- Credit-encumbered share handling (`credit_line_sources`)
- Auto re-deposit after exit
- Multi-user hosted SaaS (v1 is single-operator self-hosted)
- Any Cardano on-chain code

---

## 21. Non-functional requirements

| Area | Requirement |
|---|---|
| Detection latency | A breach is confirmed within `poll_interval × breach_confirm_n` + request time of the breaching state being visible on public endpoints (target ≤ 15 s with defaults) |
| Filing latency | Withdraw call sent within 1 s of confirmation |
| Correctness | Never file twice for one pending withdrawal; never cancel a withdrawal Rescind did not file unless the user clicks cancel; stale/degraded snapshots never confirm breach or cure |
| Precision | Decimal math only; respect 8-decimal share precision |
| Rate limits | Back off on 429; dedupe vault reads across watches |
| Availability | Worker restarts resume from persisted state; heartbeat visible |
| Observability | Structured logs (no secrets); activity log per watch |
| Time | Server clock synced to `GET /v2/time`; all stored times in ms UTC; displayed in the operator's local timezone |
| Config | All secrets via env: `STRIKE_ENV`, `DATABASE_URL`, `BREACH_KEY_ENCRYPTION_SECRET`, `BREACH_ADMIN_PASSPHRASE`, `BREACH_BUILDER_CODE` (P1), `BREACH_DEMO_MODE` |
| Accessibility | All actions keyboard-reachable; states conveyed in text, not only visually |

---

## 22. Security and risk

- **Key risk:** vault writes are masterOnly, so Rescind needs a master API wallet, which can also trade. Mitigations: self-host; use a dedicated depositor account that holds only vault shares; API wallets cannot withdraw to external wallets and Builder Connect locks the withdrawal destination server-side to the onboarding wallet (https://docs.strikefinance.org/api/builder-codes.md). Rescind's code never calls order, leverage or external-withdraw endpoints outside `/dev/leader` in demo mode (enforced by an allowlist in the Strike client: production builds only permit the endpoints in §11.2 to §11.4 minus create/deposit).
- Private keys encrypted at rest, never sent to the browser, never logged.
- Operator passphrase gate; secure, HTTP-only, SameSite cookies.
- Public verify routes expose only public Strike data.
- Input validation on every route; strict JSON for Strike writes.
- Dependency pinning (`@noble/ed25519` v2, `@noble/hashes` ≥ 1.8).

---

## 23. Testing requirements

- **Unit:** rule calculations R1 to R4 (including degraded/unknown cases, equity ≤ 0, missing marks, leader row matching); state machine transitions; flapping guard; idempotency guard; decimal parsing; signing (message format, body hash, header set) against known vectors derived from the reference implementation.
- **Integration (mocked Strike):** full breach → file → cure → cancel; breach → execute; re-breach after cancel; 429 and 503 handling; engine async rejection (`VAULT_WITHDRAWAL_REQUEST_FAILED`); cancel 404 race.
- **Testnet:** exercise `POST /v2/vault/withdraw` and cancel on `https://api-v2-testnet.strikefinance.org` if a funded testnet account is available (UNVERIFIED that testnet accounts can be funded).
- **Mainnet smoke test (first thing to validate, see §24):** with the depositor master key, file one withdrawal on the demo vault, confirm `pending` with `execute_at`, cancel, confirm `cancelled`, confirm no fee and shares unlocked.
- **UI:** route-level tests for onboarding, watch creation, overrides, verify page rendering.

---

## 24. Kill criteria and fallback

| Condition | Action |
|---|---|
| `POST /v2/vault/withdraw` or the cancel route refuses API-wallet auth (JWT only) | Enforcement is gone. Narrow to alert + one-tap deep link, or switch to the runner-up **Drift Ledger** (§26). |
| Cancelling turns out to cost something (fee, penalty, lost shares) | Drop the free-option claim; fire only on hard breaches; auto-cancel default off. |
| Strike says in Discord they don't want automated exits (vault-run concern) | Reframe as a leader-published mandate ("this vault is Rescind-watched") or drop. |
| Second master account can't be created or funded in time | Run the demo on an existing user vault with the user's own deposit (MARKET WIZARDS `min_deposit` 50). |
| Small user base (33 depositors across 3 user vaults) | Demo does not depend on it; "Utility" and "Future Potential" rest on vaults growing. State this plainly in the README. |
| R4 leader row cannot be matched reliably | Ship R1 to R3; R4 reported `unknown`. |

---

## 25. Prior art and the gap

| Project | What it does | Link |
|---|---|---|
| GuardAI (Chainlink hackathon 2026) | On-chain vault that withdraws all user assets when a market-wide Systemic Risk Index ≥ 70; permanent exit; Ethereum (Tenderly testnet) | https://chain.link/hack-26/projects/guardai |
| AutoVault (Chainlink hackathon 2026) | Withdraws treasury funds on exploit-like signals scored against 47 signatures, behind a timelock; Sepolia | https://chain.link/hack-26/projects/autovault |
| Hyperliquid vault analytics | Passive vault stats, no action | https://tradingstrategy.ai/vaults/hyperdash-vault-1 |
| Copilot Watch (built during this hackathon, Oct 22) | Telegram/Discord alerts for Strike copy traders; public reads only; never holds a key | https://github.com/benryandev/copilot-watch |
| Copilot Check (built during this hackathon, Oct 22) | Worth-copying report, replay and paper copy for Hyperliquid wallets on Strike | https://github.com/benryandev/copilot-check |
| Strike Copilot | Copy-trading review, discovery and setup via Claude | https://github.com/benryandev/strike-copilot |
| Bolt | Memecoin whose treasury copy-trades on Strike and burns | https://www.boltstriker.io/ |

**Verdict: CROWDED** (the "auto-withdraw on trigger" shape exists elsewhere). **Gap:** Rescind triggers on the **leader's conduct against the depositor's own rules**, not protocol or market risk, and uses Strike's cancellable deferred clock as a free option: fire early, back out on cure. None of the above can do either. All Strike community tools are about copy trading; none serve vault depositors.

---

## 26. Runner-up and other candidates considered

**Runner-up: Drift Ledger.** For a Strike follower of a Hyperliquid lead, it measures how many bps worse each copied fill was than the lead's own fill, per market (HL `userFillsByTime` paired with `GET /v2/history/fill?account_id=&source=copy` by `copy:<subscription>` client id), and auto-excludes markets above a limit via `PATCH /v2/copy/subscribe/:id {excluded_symbols}`. Score 21. Lost on demo moment (a slow leak, not an event) and on a half-checkable claim (exclusions aren't public), and it sits in the copy lane already worked by three named tools. Kept as the fallback if §24's first kill criterion fires.

Third place: **Engine Stops** (20): resting reduce-only stops per copied slice; unverified interaction with the copy ledger's attributed size.

Scorecard (0 to 3, `mixed`, no doubling):

| Criterion | Rescind | Orphan Sweep | Drift Ledger | Engine Stops | Credit Floor | Margin Match | Copy Receipt |
|---|---|---|---|---|---|---|---|
| Specificity | 3 | 3 | 2 | 2 | 3 | 3 | 2 |
| Host essential | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| Sponsor essential | 3 | 3 | 3 | 3 | 3 | 3 | 2 |
| Demo moment | 3 | 1 | 2 | 2 | 2 | 1 | 1 |
| Feasibility | 2 | 2 | 3 | 1 | **0** | 2 | 3 |
| Defensible claim | 3 | 3 | 2 | 3 | 2 | 3 | 2 |
| Novelty | 2 | 1 | 2 | 2 | 3 | 1 | 1 |
| Judging fit | 2 | 2 | 2 | 2 | 2 | 2 | 1 |
| After-life | 2 | 2 | 2 | 2 | 2 | 2 | 1 |
| **Total** | **23** | 20 | 21 | 20 | killed | 20 | 16 |

Rejected or dropped, with reasons:
- **Credit Floor:** killed, feasibility 0. No documented repay / add-collateral endpoint; collateral top-ups need a user CIP-30 `signTx`.
- **Orphan Sweep:** detection duplicates Copilot Watch A2; orphan can't be staged on cue.
- **Margin Match:** Copilot Watch A7 already computes the number; trigger not stageable.
- **Copy Receipt:** Copilot Check covers the creator use case; read-only.
- **Scoped Connect:** fails port test (Hyperliquid agent wallets have the same shape).
- **Agent Leash:** fails port test and is a category pitch.
- **SLP Receipts:** report/dashboard; value is a happy-path positive claim.
- **Copy Pool:** fails port test; needs depositors that won't exist; competes with Strike's own copy product.
- **Clan Ledger:** dashboard; intra-clan half credit is uncomputable (no counterparty in public fills).

---

## 27. Sponsor validation

Post in Strike's Discord (https://discord.com/invite/PuWbEmrEee) or send to their developer relations team before relying on the write path:

> "Hi Strike team, I'm building Rescind for the hackathon: depositors in user vaults set rules (max leverage, allowed markets, max drawdown), and when a leader breaks one, Rescind files that depositor's vault withdrawal through the API immediately and cancels it for free if the leader cures before it executes. Can I rely on `POST /v2/vault/withdraw` and the withdrawal-cancel route from a master API wallet, and is this a use of vaults you'd want to see?"

Status: **PENDING USER**

DevRel story Strike could post: "Team X used Strike's vault API to give every depositor an enforceable mandate: break it, and the depositor's exit clock is already running; fix it, and the exit is called off for free. Anyone can check it from public data."

---

## 28. Open items: Needs the user

- Official submission form link (post said "Coming Soon"; check Discord / X).
- Judges panel (not announced as of Oct 22; UNVERIFIED).
- Any @strikeperps X posts about the hackathon (X not readable during research).
- What other teams are building this round, especially vault depositor tooling.
- Sponsor validation reply (§27).
- Whether a Strike builder code can be registered in time for the Builder Connect path (Strike Builder Dashboard). If not, ship paste-key only.
- Whether a testnet account can be funded to exercise vault writes before mainnet.

---

## 29. Git commit rules

Git commits are a required part of the development process.
During the build, commit changes continuously instead of waiting until the entire project is finished.

### Commit frequency
For a normal build, aim for 50+ meaningful commits across the development process.
Do NOT create 50 meaningless commits just to reach the number. Every commit should represent a real, completed development step.

Make a commit whenever you complete a logical unit of work, such as:
- Creating a new page
- Creating or modifying a component
- Adding a feature
- Implementing an API endpoint
- Adding database functionality
- Adding authentication logic
- Adding validation
- Adding error handling
- Connecting frontend to backend
- Adding a utility/helper
- Adding a configuration
- Refactoring a specific section
- Fixing a bug
- Improving an existing feature
- Adding tests
- Fixing failing tests
- Improving responsiveness
- Fixing accessibility issues
- Updating documentation
- Completing a route
- Completing a major UI section
- Integrating an external service

### Commit process
After completing each logical development unit:
1. Check the current changes.
2. Verify that the changes work.
3. Stage only the relevant files.
4. Create a descriptive commit.
5. Continue building from the committed state.

Use conventional commit messages where appropriate:
- `feat: add dashboard`
- `feat: add wallet connection`
- `feat: implement transaction history`
- `fix: resolve wallet connection error`
- `refactor: simplify auth middleware`
- `test: add dashboard tests`
- `style: improve mobile layout`
- `docs: update setup instructions`

### Important rules
- Do NOT wait until the end of the project to commit everything.
- Do NOT make one giant commit containing the entire project.
- Do NOT create fake changes solely to increase the commit count.
- Do NOT repeatedly modify and commit the same thing without a meaningful reason.
- Keep commits small, focused, and logically separated.
- Before moving to the next major feature, make sure the previous feature has been committed.
- If a task contains several independent steps, commit each completed step separately.
- If you encounter and fix a bug during development, commit the fix separately.
- If you make a meaningful refactor, commit it separately.

### Target
For a substantial project, aim for 50+ meaningful commits by the time the build is complete, distributed naturally throughout development.
The commit history should clearly show the progression of the project from initial setup → individual features → integrations → fixes → testing → polish → final state.
At the end of the build, run `git log` and verify that the history accurately reflects the development process.

### Never commit
- `.env` files, private keys, database files with key material, or API responses containing account data. Add these to `.gitignore` before the first commit.

---

## 30. Definition of done (submission checklist)

- [ ] Mainnet smoke test passed: file → `pending` with `execute_at` → cancel → `cancelled`, no cost (§23)
- [ ] All P0 functional requirements implemented
- [ ] All routes in §14 exist; `/dev/leader` disabled outside demo mode
- [ ] Demo recorded: breach to `pending` row to cure to `cancelled` in under 30 seconds
- [ ] At least one published receipt whose verify page links both public Strike rows
- [ ] README per §19.2
- [ ] Repo public on GitHub with 50+ meaningful commits per §29
- [ ] Submission includes working prototype, documentation of how it interacts with Strike, demo video, and repo link (§1.2)
- [ ] Sponsor validation message sent (§27)
- [ ] Submitted before Fri Oct 23, 10:00 AM US Eastern (15:00 Lagos)

---

## 31. Appendix A: live data snapshot (Oct 22, 2026)

### A.1 Vaults (`GET /v2/vaults`)
| Name | vault_id | Type | Status | Equity (USD) | Share price | Leader fee (bps) | Lockup (days) | Min deposit | Depositors | Created |
|---|---|---|---|---|---|---|---|---|---|---|
| MARKET WIZARDS | 536b4d72-687d-5e8e-a3be-cef0757c795f | user | active | 1,872.98 | 0.9396 | 500 | 1 | 50 | 5 | 2026-09-19 |
| Strike V.I.S.I.O.N. Strategy | 207ec034-1692-4864-a19b-b0fb9ce2e7ac | user | active | 11,160.03 | 0.7102 | 1000 | 1 | 100 | 4 | 2026-04-26 |
| Strike Liquidity Provider (SLP) | 3fd3ab0b-318b-4f99-9ad6-66e9e917bea8 | protocol | active | 1,035,070.99 | 1.1526 | 0 | 1 | 100 | 242 | 2026-04-05 |
| Glacier Arc Digital | 2e782d92-86f0-48f2-9171-eb0c4633656e | user | active | 42,352.94 | 0.6757 | 2500 | 1 | 100 | 24 | 2026-04-04 |

### A.2 Glacier Arc Digital positions (`GET /v2/positions?vault_id=2e782d92-…`)
18 positions, all cross margin: NEAR-USD 10x, ETH-USD 20x, XRP-USD 20x, HYPE-USD 20x, BTC-USD 10x, ADA-USD 20x, SOL-USD 20x, XAG-USD 20x, SNDK-USD 20x, CXMT-USD 10x, NVDA-USD (short) 20x, XAU-USD 20x, TSLA-USD 20x, SKHYNIX-USD (short) 20x, WTI-USD (short) 20x, MINIMAX-USD 10x, MU-USD (short) 20x, SPCX-USD (short) 5x. Thirteen on a 20x setting.

### A.3 Strike V.I.S.I.O.N. Strategy
- History: 26 rows; most recent are completed withdrawals at share prices 0.710 and 0.774, each with `execute_at_timestamp` = request + 86,400,000 ms (1 day lockup confirmed in data).
- Portfolio: TVL 11,160.03; sharpe 0.3985; all-time PnL −2,832.31.

### A.4 Other live reads
- Copy leaderboard (`GET /v2/copy/leaderboard?status=active`): 129+ active copies, mostly Hyperliquid leads.
- Credit (`GET /v2/credit/collateral-assets`): 4 collateral assets (ADA, LP_SUNDAE_USDCx_USDM, SCALED_AAVE_V3_ETH_aUSDC, sUSDrf), 81 open lines, ~$359k debt.

---

## 32. Appendix B: research trail summary

- **00 Constraints:** solo, 16+ h, funded account, Aiken not required, deadline Fri Oct 23 10:00 AM ET (plan 15:00 Lagos).
- **01 Event intel:** no tracks; five unweighted criteria; example categories (trading tools, automation, social trading, data and analytics, new applications); named community projects (Bolt, Strike Copilot, Hizz); recent shipments in ~90 days: agent skills for copy trading, grid bot, RFQ and vaults (Oct 20), builder reference synced with v2 backend (Oct 20), copy spec v1.2.0 with per-copy stop loss (~Oct 13), user vaults API, Credit (live), RFQ (ships disabled), $1M liquidity deployment (Jul 15). Event type `mixed`.
- **Strike facts:** hybrid design (matching, positions, liquidations, funding on the off-chain Strike Node; custody in on-chain locker contracts); Cardano (CIP-30), Ethereum (EIP-191) and Solana wallets into one book; API wallets trade but cannot withdraw; keys bind to master or one sub-account; public reads of any account by `account_id`, `vault_id` or `blockchain_address`; copy trading follows Strike accounts or Hyperliquid wallets; withdrawals have rolling 1h/24h limits, validator approvals and a large-withdrawal queue.
- **02 Wants and overlap:** host would showcase products that make copy trading and vaults safe enough for real size, drive builder-code volume, and strengthen "security, efficiency, and transparency"; overlap zones: Z1 cross-venue copy integrity, **Z2 vault depositor exits (Rescind)**, Z3 Cardano DeFi collateral risk, Z4 delegated trading authority (weak on port test). One deep sponsor: Strike.
- **03 Pain bank:** 31 pains (28 externally sourced, 3 builder-observed). Rescind draws on P-13, P-14, P-15, P-16, P-17, P-31.
- **04 Candidates:** 12 generated; 9 passed both tests; 7 survived red flags.
- **05 Prior art:** no DEAD candidates; Rescind CROWDED with a named angle; Credit Floor CLEAR but later killed on feasibility.
- **06 Scorecard:** Rescind 23, Drift Ledger 21, Engine Stops 20 (tiebreak on demo moment).
- **07 Final checks:** winner Rescind, runner-up Drift Ledger; final delivery checklist passed with the caveat that vault writes are documented in Strike's synced skills but not yet exercised live.

Full files: `00-constraints.md` to `07-final-checks.md` and `FINAL_IDEA.md` in `idea-research/strike-hackathon/`.

---

## 33. Appendix C: sources

- Event post: https://medium.com/@strikecardano/strike-hackathon-starts-this-wednesday-3-000-in-prizes-158a029d655e
- Strike docs index: https://docs.strikefinance.org/llms.txt
- API getting started: https://docs.strikefinance.org/api/getting-started.md
- Builder Codes: https://docs.strikefinance.org/api/builder-codes.md
- Builder Connect: https://docs.strikefinance.org/api/builder-codes/builder-connect.md
- Vault leader API: https://docs.strikefinance.org/api/vault-leader.md
- Vaults (authenticated, GET only): https://docs.strikefinance.org/api/vaults/vaults-authenticated.md
- Positions API: https://docs.strikefinance.org/api/user/rest-api/positions.md
- History API: https://docs.strikefinance.org/api/user/rest-api/history.md
- Orders API: https://docs.strikefinance.org/api/trade/orders.md
- Subaccounts API: https://docs.strikefinance.org/api/subaccounts.md
- Copy trading (product): https://docs.strikefinance.org/perpetuals/copy-trading.md
- Copy trading (authenticated API): https://docs.strikefinance.org/api/copy-trading/copy-trading-authenticated.md
- Strike Node: https://docs.strikefinance.org/perpetuals/strike-node.md
- Withdrawal security: https://docs.strikefinance.org/perpetuals/deposits-and-withdrawals/withdrawal-security-and-controls.md
- Credit settings: https://docs.strikefinance.org/api/credit/settings.md
- Borrow and Earn: https://docs.strikefinance.org/perpetuals/vaults/borrow-and-earn.md
- Strike agent skills + OpenAPI (commit 2026-10-20): https://github.com/strike-finance/strike-finance-skills
- Builder reference app (commit 2026-10-20): https://github.com/strike-finance/strike-builder-reference
- Hermes skill: https://github.com/strike-finance/strike-finance-hermes-skill
- Live API reads (Oct 22, 2026): https://api.strikefinance.org/v2/vaults ; https://api.strikefinance.org/v2/positions?vault_id=2e782d92-86f0-48f2-9171-eb0c4633656e ; https://api.strikefinance.org/v2/vault/207ec034-1692-4864-a19b-b0fb9ce2e7ac/history ; https://api.strikefinance.org/v2/vault/207ec034-1692-4864-a19b-b0fb9ce2e7ac/portfolio ; https://api.strikefinance.org/v2/copy/leaderboard?status=active ; https://api.strikefinance.org/v2/credit/collateral-assets
- Hyperliquid vault depositors: https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults/for-vault-depositors
- Prior art: https://github.com/benryandev/copilot-watch ; https://github.com/benryandev/copilot-check ; https://github.com/benryandev/strike-copilot ; https://www.boltstriker.io/ ; https://chain.link/hack-26/projects/guardai ; https://chain.link/hack-26/projects/autovault ; https://tradingstrategy.ai/vaults/hyperdash-vault-1
- Strike treasury proposals: https://medium.com/@strikecardano/cardano-governance-proposal-sustainable-yield-for-the-treasury-31db26c4b681 ; https://www.cardanocube.com/governance/gov_actions/gov_action1suskjc6c4nw58c6wtmv77xe79gwj47wp4gvh9cqhhxujwxmam3cqqkz5nwj
- sUSDrf yield article (2026-10-18): https://www.diariobitcoin.com/stablecoin/cardano-enfrenta-dudas-por-un-rendimiento-de-casi-50-en-el-token-susdrf/
