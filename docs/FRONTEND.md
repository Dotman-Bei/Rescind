# Rescind: Frontend specification

This file is the `frontend.md` the PRD defers to. The PRD owns behaviour, data, routes and engineering
rules; this file owns how every page looks, reads and moves. Art direction follows the
`design-taste-frontend` skill (tasteskill v2). The dealt sheets are saved in `.taste-skill/direction.json`
(pages) and `.taste-skill/app/direction.json` (app screens).

- Landing direction: **The sentence is the layout**, seed 308787085. Type Anton / Work Sans, palette
  Newsprint and brass. One redraw: the proof section, from "Names as one sentence" to "The printed
  guest list". Reason: Rescind has no clients or press to list. Its proof is a receipt, which is a printed
  artefact.
- App style: **Achromatic ledger**, seed 1736224164, light, shell "Open plane", with the page's palette
  and type kept.

---

## 1. Who it is for, and the one action per page

**The person.** Someone who holds shares in a Strike user vault (Glacier Arc Digital, MARKET WIZARDS,
Strike V.I.S.I.O.N. Strategy) through a master account. They trade, they read API docs, and they know
what a 20x setting is. They don't trust a stranger with pooled money unless a rule holds the stranger
to account. They run Rescind on their own machine or VPS, alone (single operator, v1).

**The second person.** A verifier: a hackathon judge, another depositor, someone on X who was handed a
receipt link. They have never seen Rescind and will give it thirty seconds.

| Route | Reader | The one action it drives |
| --- | --- | --- |
| `/` | Depositor, judge | **Set your mandate** (`/connect`). Second: read the sample receipt. |
| `/verify/[receiptId]` | Verifier | **Open the two Strike URLs** and compare the timestamps. |
| `/login` | Operator | **Unlock** with the passphrase. |
| `/connect` | Operator | **Choose an onboarding path** (paste key). |
| `/connect/key` | Operator | **Verify the key** after registering it on Strike. |
| `/connect/wallet` | Operator | **Sign with your Cardano wallet**. |
| `/app` | Operator | **Act on the watch that needs attention** (a pending withdrawal). Second: add a watch. |
| `/vaults` | Operator | **Set a mandate**. |
| `/vaults/[vaultId]` | Operator | **Set a mandate** (or open the existing watch). |
| `/watches/new` | Operator | **Arm the watch** (or start a dry run). |
| `/watches/[watchId]` | Operator | **Cancel or keep the pending withdrawal** when one exists; else **File withdrawal now**. |
| `/watches/[watchId]/mandate` | Operator | **Save as version N+1**. |
| `/watches/[watchId]/activity` | Operator | **Find the event** (filter the log). |
| `/receipts` | Operator | **Publish a receipt** / copy its public link. |
| `/receipts/[receiptId]` | Operator | **Publish and copy the public link**. |
| `/settings` | Operator | **Save the engine settings**. Last and separate: disconnect. |
| `/dev/leader` | Builder (demo only) | **Place the breaching order** on the demo vault. |

---

## 2. Visual direction

### 2.1 Thesis

**Rescind is a clock you start early.** Everything on the public pages is set like newsprint: warm
paper-grey ground, near-black ink, compressed capitals at poster size. The one live thing is the exit
clock, and it sits *inside the headline*, where the word "clock" would be. Brass, the colour of a
stopwatch crown, appears once per screen: on the action, or on the clock.

The operator app is the same paper set as a ledger. There's no colour in the chrome. Figures are in
ink, and brass marks only the one data element each screen is about: the measured value against the
limit, or the elapsed part of the exit clock.

**The idea sentence.** On this page, *the depositor's `execute_at` countdown* becomes *the word inside
the sentence*. Competitor test: an alert bot (Copilot Watch) holds no key and starts no clock, so the
sentence fails for it. The idea belongs to Rescind.

**The live thing.** On the landing page, the visitor types a mandate rule ("max 3x leverage", "crypto
only", "max 15% drawdown", "leader keeps 90%"). Rescind judges it against Strike's largest user vault
as read live from `api.strikefinance.org`, and answers "Rescind would stay quiet" or "Breach. Rescind
would file now; it would execute at 21:04 tomorrow." Without script, the input shows a prefilled rule
and its server-rendered answer.

**The signature element in the app.** The **exit clock bar**: one track as long as the lockup
(`request` → `execute_at`), with the elapsed part filled in brass, "now" as a 1px ink tick, and the
cure or cancel stamped on the track where it happened. It appears on `/app` rows, on the watch detail,
on receipts and on the verify page. The second element is the **rule ledger**: one row per rule,
measured value against limit as a bar with a 1px tick at the limit (`Charts.bullet`), and pass, breach
or unknown in words.

### 2.2 Palette (exact values)

Public pages, **Newsprint and brass**:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#e8e8e3` | Paper ground for the upper page |
| `--surface` | `#dcdcd6` | One tone step: open FAQ row, input wells, the receipt card's ground step |
| `--ink` | `#181715` | All running text (14.6:1 on `--bg`) |
| `--muted` | `#63625c` | Secondary notes only (5.0:1 on `--bg`) |
| `--accent` | `#bfb21a` | Brass. The primary button fill and the hero clock. Once per screen |
| `--accent-ink` | `#181715` | Text on brass (8.2:1) |
| `--field-1` | `#181715` | Whole sections flipped to near-black |
| `--field-1-ink` | `#e8e8e3` | Text on the dark field (14.6:1) |
| `--field-1-muted` | `#a3a29b` | Secondary text on the dark field (7.0:1) |
| `--paper` | `#f4f3ee` | The printed receipt card |
| `--positive` | `#247b50` | "Pass", "Cancelled · cost 0" |
| `--negative` | `#b3261e` | "Breach" (text only, never a ground) |

App screens, **Achromatic ledger** mapped onto the same paper:

| Token | Value | Role |
| --- | --- | --- |
| `--ground` | `#f1f1ec` | Newsprint, lifted. The face of the app (the "ground from the product's world") |
| `--surface` | `#fcfcfa` | Cards, panels, tables |
| `--raised` | `#f6f6f2` | Settings panels, key-value wells |
| `--active` | `#e4e4dd` | Active nav pill, selected list row |
| `--border` | `#e3e3dc` | Card edges |
| `--rule` | `#edede7` | Row rules |
| `--control` | `#cfcfc7` | Input and select borders |
| `--text` | `#181715` | Ink |
| `--muted` | `#5c5b55` | Secondary (6.6:1 on surface) |
| `--faint` | `#6b6a63` | Meta, placeholders (5.3:1 on surface, 4.8:1 on ground) |
| `--primary` | `#181715` | The one filled button per screen: near-black, paper label |
| `--data` | `#8a7d0c` | Dark brass. The one data hue (4.1:1 on surface), under 1% of pixels |
| `--positive` / pill | `#247b50` / `#dcfae5` + `#04250e` | Pass, cancelled at no cost, completed |
| `--negative` / pill | `#c4242a` / `#ffedea` + `#831c1e` | Breach, failed |
| `--notice` pill | `#fffbeb` + border `#fde68a` + `#92400e` | Pending withdrawal, dry run, stale snapshot |

### 2.3 Typefaces (two)

- **Anton** 400, uppercase, tracking −0.01em, leading 0.86. Display only: the hero sentence, section
  headings on public pages, the cropped wordmark, and the wordmark at the top of the app sidebar.
- **Work Sans** 400 and 600. Everything else: body, UI, every figure (with `tabular-nums`), IDs.
  There is no monospace anywhere except real code: the raw Strike URLs on the verify page sit in
  `<code>`.

Public page steps (five sizes, no more):

```css
--step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem); /* 13–14: credits, legal */
--step-body:  clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);  /* 17–19: body, captions, questions */
--step-lead:  clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);     /* 20–26: supporting line, statements */
--step-head:  clamp(2.5rem, 1.2rem + 5vw, 5.5rem);          /* 40–88: section headings, figures */
--step-display: clamp(3.25rem, 0.6rem + 11.2vw, 10.5rem);   /* 52–168: the hero sentence */
```

App sizes: 12 / 14 / 16 / 24, plus 30 for the one answer figure on a screen. Weights 400 and 600; 600 is
for money and card titles only.

### 2.4 Spacing scale

4px base: `4, 8, 12, 16, 24, 32, 48, 64, 96, 160, 200`.

- Public page margins: `clamp(16px, 2.2vw, 32px)`, equal on both sides at every width. 12-column
  grid, 24px gutters. Section gap 160–200px on desktop, 96px on phones.
- App: sidebar 240px; canvas gutter 32px (16px on phones); one gap of 16px between cards, horizontal
  and vertical; card padding 20px; nav pitch 34px; control height 36px in forms, 32px in toolbars;
  table rows 48px.
- Radius: public pages are square everywhere (buttons included). App is tight: 8px cards, 6px
  controls, 4px chips; 999px only on status pills.

### 2.5 Motion rules

Public pages:
- **Signature move: the shutter.** The hero's clock slot opens from its left edge with a clip-path
  over 1.1s while the digits inside settle from 1.12 scale to rest. It happens once, on load.
- **Entrances:** inside each section, the heading, then the text, then the figure, staggered 70ms,
  rising 24px with opacity over 600ms, `cubic-bezier(.22,1,.36,1)`. Triggered once by
  IntersectionObserver. Content is visible by default; the hidden start state is only applied after JS
  marks `html.js`.
- **One moving picture:** the clock really counts down, one second at a time. The chronometer
  photograph drifts in scale from 1.06 to 1.0 as it crosses the viewport.
- **Feedback:** buttons darken on hover and move 1px on press (120ms). Links grow their underline
  offset. FAQ rows lay their tone tile in over 200ms. The proof sentence of the stage bar has no
  extra motion.
- `prefers-reduced-motion`: no travel and no scale. Content appears at once and the clock still
  ticks (that's information, not decoration).

App screens: no entrances. Motion is feedback only: hover, press and focus (120ms), a menu or dialog
opening (160ms, opacity and 4px rise), a new activity row arriving (background flash `--active` →
transparent over 600ms), and the exit clock's fill advancing each second.

---

## 3. Pages in build order, with copy

Times are shown in the operator's local timezone (Lagos, UTC+1, in the sample data). All sample data
for the app lives in `lib/sample.ts` and is listed in section 6.

### 3.1 `/` Landing (public)

**Nav** (plain bar, no chrome): `RESCIND` wordmark left · How it works · Mandate · Receipt · Key
safety · **Set your mandate** (button, square, brass). On a phone: wordmark and the button only, with
links behind a "Menu" text button.

**Hero: the sentence alone.** (The countdown frame that sat inside the sentence was removed at the owner's request.)
- `h1` (aria-label "Your exit clock starts at the breach"): **YOUR EXIT [clock] STARTS AT THE BREACH**.
  The bracket is a brass frame one cap-height tall holding a live countdown from 24:00:00, the
  length of a one-day lockup. On a phone the clock leaves the line and sits between "YOUR EXIT" and
  "STARTS AT THE BREACH" as its own 3:2 frame.
- Supporting line (one sentence): "Rescind files your Strike vault withdrawal the moment a leader breaks
  your rules, and cancels it free if they cure in time."
- Button: **Set your mandate**. Text link beside it: "Read a receipt".

**Section: stats, as a column aligned on the decimal** (`#vault`)
- `h2`, two lines, the first in muted ink: "Glacier Arc, / read just now" (the first two words of the live vault's name). The
  statement under the figures says it is the largest user vault on Strike by equity.
- Figures, live from `GET /v2/vaults`, `GET /v2/positions?vault_id=` and
  `GET /v2/vault/:id/depositors`, with a fallback snapshot taken Oct 22, 2026:
  - `18` "open positions in Glacier Arc Digital, all cross margin"
  - `13` "of them on a 20x leverage setting"
  - `1.12` "times equity: the exposure the vault actually carries, Σ|size × mark| ÷ equity"
  - `0.666` "share price, against a start of 1.000"
  - `86.08` "percent of the shares held by the leader"
- Statement under the figures: "A 20x setting is not 20x exposure. Rescind measures what the vault
  carries, so your rule fires on the position, not the label."
- Source line (small): "Read from api.strikefinance.org at 21:04. Glacier Arc Digital is a user vault on
  Strike; Rescind is not affiliated with it."
- Picture: the NYSE trading floor (Carol M. Highsmith, public domain), in greyscale, set in columns 1–5
  under the heading. Caption: "Trading floor of the New York Stock Exchange. Carol M. Highsmith."

**Section: how it works, as stages on one bar** (`#how`, dark field)
- `h2`: "Ten seconds, then a day"
- The bar (`data-ui`), segment widths from the true durations with a 12% floor:
  - "Ten seconds": "First, Rescind reads the vault every 5 s and confirms a breach on the second bad read."
  - "Under a second": "Then it files your withdrawal with your master API wallet. The exit clock starts."
  - "24 hours": "While it runs, a cure cancels the withdrawal. Free, and your shares unlock."
  - "At execution": "If the leader never cures, Strike pays you at that moment's share price."
- Statement below, beside a muted greyscale loop of a ticking museum wall clock (Furkan Akkurt, CC BY-SA
  4.0): "An alert would have woken you at 3 a.m. You would still have had to file, and every hour you slept
  would be paid in exit price."

**Rest: the chronometer.** One full-bleed band: figure 13 of the 1943 Hamilton Model 21 marine chronometer
manual (public domain), an exploded line drawing of the gear train, multiplied onto the newsprint ground.
Caption: "Hamilton Model 21 marine chronometer, figure 13 of its 1943 manual."

**Section: showcase, a headline you can type** (`#mandate`)
- `h2` in muted ink: "Write a rule". The input below it, in full ink with an 8px tone bar under it, completes
  the sentence.
- The input, at display scale, prefilled `max 3x leverage`.
- The answer panel (`data-ui`, max 560px): rule, measured, limit, verdict, and the consequence line.
  - Pass: "Glacier Arc Digital carries 1.12x. Your limit is 3x. Rescind would stay quiet."
  - Breach: "Glacier Arc Digital holds 11 markets outside crypto: XAG, SNDK, CXMT, NVDA, XAU, TSLA,
    SKHYNIX, WTI, MINIMAX, MU, SPCX. Rescind would file now. The withdrawal would execute at 21:04
    tomorrow."
  - Unparsed: "Rescind knows four rules: max leverage, allowed markets, max drawdown from peak, and
    minimum leader stake. Try 'max 15% drawdown'."
- Example buttons: "crypto only" · "max 15% drawdown" · "leader keeps 90%" · "max 1x leverage".

**Section: proof, the printed receipt** (`#receipt`, dark field)
- `h2`: "Check it yourself"
- Lead: "Every action leaves a receipt that pairs two public Strike rows. You need no login and no
  trust in us: open both URLs and compare the timestamps."
- The card (paper, turned 1.5°, cut off by the section's bottom edge), headed "Receipt": **Gap, fill to
  filing: 6.5 s** first, then rule broken ("Effective leverage 14.8x > 5x"), breaching fill 4346118 at
  11:03:12.418 (ETH-USD buy 2.57 at 2,377.03), withdrawal 7e2b9c14… filed 11:03:18.902, executes Oct 23,
  11:03, status "Cancelled 11:06:40 · cost $0.00", and the two public URLs, which the crop cuts.
- Beside the heading, the lead and a button: "Open the sample receipt" → `/verify/rc_8Hq2vXk4Tn`.
- FAQ left column: the three calls Rescind's Strike client allows, so the indent holds a fact.

**Section: FAQ, wide heading and indented questions** (`#safety`)
- `h2`: "Your key, your machine"
- Six questions (`<details>`):
  1. "Why does Rescind need a master key?" Vault withdrawals and cancels are master-only on Strike. A
     sub-account key gets `403 not available to sub-account API keys`, so Rescind refuses one when you
     verify.
  2. "Can the key move my money off Strike?" No. Strike API wallets can trade, but they cannot
     withdraw to an external wallet. Rescind's Strike client only allows the public reads, the vault
     withdraw and the cancel. Order endpoints are blocked outside demo builds.
  3. "Where does the private key live?" On the server you run. Rescind generates it there, encrypts
     it with AES-256-GCM, and never sends it to a browser or writes it to a log. You only ever see the
     public key.
  4. "What does a cancelled withdrawal cost?" Nothing. Strike lets you cancel any time before it
     executes, with no fee, and the shares unlock at once.
  5. "What if the leader keeps breaking and fixing?" Each cancel restarts your clock. After two
     automatic cancels in 24 hours, Rescind stops cancelling on its own and leaves the withdrawal
     running until you decide.
  6. "Should I use my main account?" No. Make a dedicated depositor account that holds only vault
     shares, and connect that.

**Section: CTA, a question at both edges** (dark field, 100svh)
- Line one, top: "ARMED," Line two, bottom: "OR DRY RUN?"
- Buttons: **Arm a watch** · or · **Start a dry run** (both → `/connect`).
- Line: "Both start by connecting a key. A dry run evaluates and logs, and never files."

**Footer: an invitation over the cropped name**
- `h2`: "Set the rules / before you deposit." Button: **Set your mandate**.
- Links: How it works · Strike vault API · Sample receipt · Operator login.
- Legal row: "Not affiliated with Strike Finance. Not financial advice." and the photo credits.
- `RESCIND` at full width, cropped by the bottom edge.

### 3.2 `/verify/[receiptId]` Public verify page

A report screen (no sidebar shell): a 48px top bar with the wordmark on the column's left edge, a
centred 1100px column.

- `h1`: "Withdrawal filed 6.5 s after the breaching fill"
- Subline: "Rescind Demo Vault · mandate v2 · effective leverage 14.8x against a 5x limit"
- Status pill: "Cancelled · cost $0.00" (or "Pending · executes Oct 23, 11:04", or "Executed").
- **The gap block** (the screen's answer): two timestamps on one axis. "Breaching fill 11:03:12.418"
  and "Withdrawal requested 11:03:18.902", with **6.5 s** at 30px between them.
- **The exit clock bar** for this withdrawal: requested 11:03:18 → execute_at Oct 23 11:03:18, with the
  cure stamped at 11:06:41 and the track ending there ("Cancelled, 3 min 22 s in").
- **Check it yourself** (an `<ol>`, numbering allowed as real order):
  1. "Open the vault's fills. Find fill 4346118: ETH-USD, buy, 2.57 at 2,377.03, at 11:03:12.418."
     `GET https://api.strikefinance.org/v2/history/fill?vault_id=…` (button: **Open fills**)
  2. "Open the vault's history. Find withdrawal 7e2b9c14: requested 11:03:18.902, status cancelled."
     `GET https://api.strikefinance.org/v2/vault/…/history` (button: **Open history**)
  3. "Subtract. The withdrawal timestamp minus the fill timestamp is the gap above."
- **What was measured**: the rule ledger at confirmation (four rows; disabled rules shown as "Off").
- **Chain**: "Next on this watch: re-breach at 14:41, withdrawal pending" (when published).
- Foot: "Rescind shows only data Strike already publishes. Not affiliated with Strike Finance."

### 3.3 App shell + `/login`

**Shell (Open plane).** A 240px sidebar on the ground with no rule. Top: the `RESCIND` wordmark in
Anton 20px, then the account switcher ("Depositor 2 · key active"). Nav on a 34px pitch, 16px outline
icons: Watches · Vaults · Receipts. Group "Account": Connect · Settings. Bottom: network ("Mainnet") and
"Lock" (log out). Active item: a neutral grey pill (`--active`). On phones: a 48px top bar with the
screen name, a "Menu" button that opens a full-screen sheet, and at most one action.

**`/login`** (no shell). Centred 400px form on the ground, the wordmark above.
- `h1`: "Unlock Rescind"
- Line: "This Rescind runs on your machine. Enter the operator passphrase set in
  `BREACH_ADMIN_PASSPHRASE`."
- Field label "Passphrase", button **Unlock**.
- Error: "That passphrase doesn't match. Check the value in your .env file."
- Foot link: "Verifying a receipt? You don't need to log in." → `/`.

### 3.4 `/connect` Onboarding chooser
- `h1`: "Connect a depositor account"
- Subline: "Rescind needs a master API wallet on the account that holds your vault shares. It can
  trade, but it cannot withdraw to an external wallet."
- Two panels side by side (stacked on phones):
  - **Paste a key** (recommended, P0): "Rescind makes a fresh Ed25519 keypair. You register the public
    key on Strike with Authorize. Two minutes." Button **Generate a key**.
  - **Builder Connect** (P1): "Sign one message with your Cardano wallet (CIP-30). Strike creates the
    API wallet for you. Needs a Rescind builder code." Button **Use my wallet** (secondary). When no
    builder code is configured, the panel stays readable and says: "Not available: no
    `BREACH_BUILDER_CODE` set on this server."
- Notice: "Use a dedicated depositor account that holds only vault shares. Don't connect your
  trading account."

### 3.5 `/connect/key` Paste-key flow
A three-part vertical flow on one screen, with the active part in ink and the others muted:
- `h1`: "Register your public key"
- Part "Your public key": the 64-hex key in a joined field + **Copy** button. "Generated on this
  server at 21:10. The private key never leaves it."
- Part "Authorize it on Strike": "Open app.strikefinance.org/api-keys, choose **Authorize** (not
  Generate), paste the key, and bind it to your master account, not a sub-account." Link **Open
  Strike API keys**.
- Part "Verify": button **Verify key** (primary). Success: "Verified. Account 01a2c7e4… · master
  key · expires Nov 20, 2026." then **Pick a vault**.
- Errors, in the part that failed: sub-account ("This key is bound to a sub-account. Vault withdrawals
  are master-only. Generate a new key and bind it to the master account."); not registered
  ("Strike doesn't know this key yet. Register it with Authorize, then verify again."); expired or
  revoked.

### 3.6 `/connect/wallet` Builder Connect
- `h1`: "Connect with your Cardano wallet"
- Wallets detected (CIP-30): rows with name and "Detected" / "Not installed". Empty: "No CIP-30 wallet
  found in this browser. Install Eternl, Lace or Nami, or paste a key instead."
- Steps on one screen: request signature → the `message_to_sign` shown in full in a well → **Sign
  with Eternl** → verify. Success: "API wallet created. Expires Jan 20, 2027."
- Note: "Builder Connect revokes any older API wallet Strike issued to Rescind for this account."

### 3.7 `/app` Watches (home)
**Question: "Is any vault outside my mandate, and is an exit clock running?"**
- `h1`: "Watches". Subline (the finding): "Rescind Demo Vault broke your 5x limit at 14:41. Your
  withdrawal executes tomorrow at 14:41." Right: freshness "Polled 2 s ago" and **Set a mandate**.
- **Pending withdrawal card** first (the time-sensitive block): vault, rule, the exit clock bar, "23 h
  59 m left", and the actions **Cancel withdrawal** (secondary) and **Keep it** (text).
- **Watches table:** vault · mode (Armed / Dry run / Paused) · state in words ("Withdrawal pending",
  "Clear", "Would file") · rules (e.g. "1 of 3 breached") · exit clock (time left or a dash) · last
  poll. Phone: two-line rows.
- **Account strip** (one divided container): account, key status ("Active · expires Nov 20"), worker
  heartbeat ("2 s ago"), network ("Mainnet").
- First run (no watches): "No watches yet. Pick a vault you hold shares in and set its mandate."
  **Pick a vault**.

### 3.8 `/vaults` Vault picker
- `h1`: "Vaults". Subline: "4 vaults on Strike. You hold shares in 2. A picker, not a ranking."
- Table: name (+ "You hold shares" chip) · type · status · equity · share price · leader fee · lockup ·
  min deposit · depositors · action (**Watch** / **Open watch** / "Protocol vault: read only").
- Protocol vault (SLP) row: action reads "Read only" with the reason on hover and in text below.

### 3.9 `/vaults/[vaultId]` Vault live view
**Question: "What is this vault carrying right now?"**
- `h1`: vault name. Subline: "Leader GlacierArcDigital · 25% fee · 1-day lockup · Active".
- KPI strip (one divided container): equity · share price · effective leverage (the answer figure,
  in the data hue) · leader stake · depositors.
- Positions table: symbol · side · size · notional at mark · leverage setting · margin mode, with
  notional bars in grey and the total row.
- Right column: **Your position** (shares, locked, available, value) or "You hold no shares here.
  A watch on this vault runs as a dry run." Then **Pending withdrawals in this vault** (a list, or
  "None pending.").
- Action: **Set a mandate** (or **Open watch**).

### 3.10 `/watches/new?vault=` Create watch
- `h1`: "Watch Glacier Arc Digital". Subline: "Set the four rules. Rescind checks them against the vault
  every 5 s."
- **Mandate editor**: four rule rows, each with an on/off switch, its control and its live
  pre-arm value:
  - Max effective leverage: number field "3" + "x". Now: "1.12x".
  - Allowed markets: group chips "Crypto 13", "Stock perps 15", "Indices 2", "Commodities 3", and a
    searchable symbol list. Now: "11 held outside your list".
  - Max drawdown from peak: "15" + "%". "Peak seeds at 0.6660 when you arm."
  - Min leader stake: "5" + "%". Now: "86.08%".
- Presets (text buttons): Conservative (3x · crypto majors · 10% · 5%) · Balanced (5x · crypto ·
  15% · 5%) · Loose (10x · any market · 25% · off).
- **Pre-arm check panel**: "2 of 4 rules would breach now. Arming files a withdrawal immediately."
- Mode: Armed / Dry run (segmented). Auto-cancel on cure: switch, on.
- Holdings gate: "You hold no shares here, so this watch can only dry-run." Credit gate: "Some of your
  shares back a Credit line. Rescind won't arm: `withdraw_all` would include them."
- Primary: **Arm watch** (or **Start dry run**). Confirmation dialog when breaching: "Arm and file
  now? 2 rules already breach. Rescind will file a withdrawal for all 1,240.55 available shares."

### 3.11 `/watches/[watchId]` Watch detail
**Question: "Is my exit clock running, and should it be?"**
- `h1`: vault name. Subline (finding): "Breach since 14:41:58. Effective leverage 14.8x against 5x."
- State line: the state machine as words across one row (Clear → Filing → Pending → Cancelling →
  Exited), the current one in ink with a dot, the rest muted.
- **Pending withdrawal** card: the exit clock bar, withdrawal id (copy), requested, execute at, time
  left; **Cancel withdrawal now** · **Keep withdrawal** (disables auto-cancel for this one).
- **Rule ledger** (live): one row per rule: measured · limit · bar with limit tick · Pass / Breach /
  Unknown / Off.
- Side: Mode (Armed / Dry run / Paused), Auto-cancel (on, "1 of 2 auto-cancels used in 24 h"),
  Mandate v2 (link "Edit mandate"), **File withdrawal now** (when none pending).
- Recent activity: five rows and "View all".

### 3.12 `/watches/[watchId]/mandate` Edit mandate
- `h1`: "Mandate". Subline: "Editing creates version 3. Receipts keep the version that fired them."
- The same editor as 3.10 (prefilled) beside **Versions**: v2 (active, since 10:58) and v1 (Oct 21),
  each with its four values.
- Primary: **Save as version 3**.

### 3.13 `/watches/[watchId]/activity` Activity log
- `h1`: "Activity". Subline: "Rescind Demo Vault · 4,318 evaluations since Oct 21, summarised."
- Filters (one row): All · Breaches · Filings · Cancels · Errors.
- Rows: time · event in words · detail. Example: "14:41:59 Withdrawal filed: 7f3d…, executes Oct 23
  14:41:59". Evaluations are summarised: "11:06–14:41 · 2,571 passing snapshots".

### 3.14 `/receipts` Receipts
- `h1`: "Receipts". Subline: "2 receipts · 1 public".
- Table: vault · rule · gap · withdrawal status · confirmed at · Public toggle · "Copy link".

### 3.15 `/receipts/[receiptId]` Receipt (private)
- `h1`: "Receipt rc_8Hq2vXk4Tn". The public content of 3.2, plus internal fields: snapshot latency,
  mandate version, redacted API responses (in `<pre><code>`), and the chain.
- Right: **Publish** switch and the public URL with **Copy link**.

### 3.16 `/settings` Settings
Two-column settings layout. Sections:
- **Engine**: poll interval (5 s, min 3), breach confirmations (2, 1–5), cure confirmations (3), cure
  grace (30 s), max auto-cancels per 24 h (2). Preview in the label column: "With these values a
  breach is confirmed within about 10 s, and a cure within about 30 s."
- **Network**: "Mainnet · api.strikefinance.org" (read-only, from `STRIKE_ENV`).
- **Key**: public key, status, expiry; **Rotate key** (P1).
- **Disconnect** (last, alone): "Disarms all 3 watches and deletes the stored private key. Revoke the
  key on Strike's API keys page too." **Disconnect account** (negative outline), with a confirmation
  that names the account.

### 3.17 `/dev/leader` Demo leader console (demo builds only)
- `h1`: "Leader console". Notice: "Demo mode. This page places real orders on the demo vault with the
  leader's key. It is disabled when `BREACH_DEMO_MODE` is off."
- Order form: market, side, size, leverage. Presets: **Open 15x ETH** · **Cut to 3x**.
- Vault positions table with effective leverage.

### 3.18 Not found and error
- Not found: `h1` "Nothing at this address" · "The receipt may be unpublished, or the link is
  mistyped." · **Back to Rescind**.
- Error: `h1` "This page failed to load" · "Rescind couldn't reach its data. The worker keeps
  running." · **Try again**.

---

## 4. Components

| Component | Desktop | Phone |
| --- | --- | --- |
| **Site nav** | Wordmark left, four text links, brass button right. Plain bar, not sticky. | Wordmark, button, "Menu" text button opening a full-screen sheet. |
| **Hero sentence + clock slot** | One or two lines of Anton; the clock is inline, one cap-height tall, on the baseline. | Two lines; the clock drops to its own 3:2 frame between them. |
| **Decimal ledger** | Three-track grid: integer right-aligned, decimals left, caption on the baseline. | Figures at 15vw, split at 52%; caption under each. |
| **Stage bar** | One row of segments sized by real duration, 22vh tall. | Vertical stack, heights proportional, 72px minimum. |
| **Rule input + answer** | Display-size input; answer panel up to 560px; example text buttons. | 11vw input scrolling inside itself; examples as 44px blocks. |
| **Receipt card** | 56% wide, turned 1.5°, cut by the section bottom. | 92% wide, turned 1°. |
| **FAQ rows** | Questions from column 5; tone tile on open. | Full width; tile bleeds to the edges. |
| **App sidebar** | 240px, on the ground, grey pill for the active item. | 48px top bar + full-screen menu sheet. |
| **Title row** | `h1` 24/600, a grey finding line, actions and freshness on the right. | `h1` 22px; one primary action stays; the rest go into the menu. |
| **KPI strip** | One container split by 1px dividers, label over value. | 2-column grid (odd count: last cell spans). |
| **Data table** | 12px grey sentence-case headers, 48px rows, right-aligned tabular numbers. | Two-line rows below 640px: identity + key number, other fields in grey on line 2. |
| **Exit clock bar** | Track = lockup; brass elapsed fill; ink "now" tick; cure stamp. Labels at both ends. | Full width; labels above. |
| **Rule ledger row** | Rule · measured · limit · bullet bar · verdict pill. | Rule + verdict on line 1; measured/limit and bar on line 2. |
| **Status pill** | Pale tint + dark ink of the same hue, 20px tall. Never squeezed. | Same. |
| **Switch, segmented control, fields** | Labels above fields, 36px inputs, toggles 28×16 in green or ink when on. | 44px touch targets. |
| **Confirm dialog** | Centred, 480px, real shadow (it floats). | Bottom sheet. |
| **Copy button** | Text "Copy" beside the value in a joined field; "Copied" for 2 s. | Same. |
| **Empty / loading / error** | Frame and header kept; grey bars at real size; one-sentence error with Retry. | Same. |

---

## 5. Avoid

The skill's house rules apply everywhere. These are the generic moves this product would be most
tempted by:

- A centred hero with "Protect your vault deposits" over three icon cards ("Monitor", "Detect", "Act").
- Eyebrows and pills above headings ("NEW", "HOW IT WORKS", "Strike Hackathon 2026").
- 01 / 02 / 03 step numbers on the stages. Order is shown by position on the bar.
- Monospace for figures or labels, or terminal styling. Rescind is a ledger, not a hacker console.
- Neon green on black, glowing "LIVE" dots, glass panels, gradient blobs, a dark crypto dashboard.
- A violet or indigo accent, cream ground with terracotta.
- KPI tiles with icons in tinted circles, sparklines, green "+12.5%" on a week-old account.
- Shadows on resting cards; hairline grids; thin rules as decoration on public pages.
- Invented proof: user counts, testimonials, "trusted by", partner logos. The only proof is the
  receipt and the live vault.
- Styled accent words in headlines (italic, brass-coloured word).
- A coloured sidebar, brand-coloured primary buttons in the app, or colour on every status.
- Copy like "seamless", "empower", "unlock", "next-generation", "peace of mind".

---

## 6. As built

- Dev server: `npm run dev` serves on port 3217 (3000 and 3100 are taken on this machine by other projects).
- The two-sheet split: `styles/site.css` (public pages, scoped under `.site`) and `styles/app.css` (verify,
  login and the operator screens, scoped under `.app`), loaded from the root layout so `notFound()` pages
  keep their styles.
- Writes go through `lib/client.ts` to the PRD §15 routes. Until the backend exists those return 404, and
  every action says "Sample build: nothing was sent" instead of pretending.
- Every screen passed `inspect.mjs` (desktop 1440, tablet 768, phone 390) with 0 FAIL; see the build log
  in the session report for the remaining defended WARNs.

## 7. Sample data (to replace before launch)

The app screens render from `lib/sample.ts` until the backend routes in PRD §15 exist. The landing
page's live fact reads Strike's public API and falls back to the snapshot in `lib/fallback.ts`.

- Account "Depositor 2", `strike_account_id` 01a2c7e4-5b1d-7f3a-9c60-3e8d4b21f9a7, key 3f9a1c7e…b3d5,
  expires Nov 20, 2026.
- "Rescind Demo Vault" (`9c41e0b7-2f6a-4d38-b1e5-7a0c3d9f6e21`): equity $412.50, share price 1.0012,
  2 depositors, 10% fee, 1-day lockup, min deposit $10.
- Three watches: Rescind Demo Vault (armed, pending), MARKET WIZARDS (armed, clear), Glacier Arc Digital
  (dry run, would file).
- Receipts `rc_8Hq2vXk4Tn` (cancelled, public) and `rc_Zp4mW9sLqe` (pending, private), with fill
  4346118 and withdrawal 7e2b9c14-….
- Fill and withdrawal timestamps, gap 6.5 s, and the 14.8x figure (illustrative, from PRD §18).
