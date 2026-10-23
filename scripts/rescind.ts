// Operator commands. Run with: npx tsx scripts/rescind.ts <command>
//   keygen [label]            make a fresh Ed25519 keypair, store the private half encrypted, print the public half
//   verify                    signed GET /v2/account; refuses a sub-account key (PRD FR-02)
//   position <vaultId>        your shares in a vault
//   smoke <vaultId> --confirm file a real withdraw_all, wait for the pending row, cancel it, wait for cancelled (PRD §23)
import { get, signed, StrikeError } from "../lib/strike/client";
import { decryptPrivateKey, encryptPrivateKey, generateKeys } from "../lib/strike/sign";
import { readState, update } from "../lib/store";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* env may come from the shell instead */
}

const [cmd, ...args] = process.argv.slice(2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function keys() {
  const a = readState().account;
  if (!a) throw new Error("No key yet. Run: npx tsx scripts/rescind.ts keygen");
  return { publicKey: a.publicKey, privateKey: decryptPrivateKey(a.privateKeyEnc) };
}

type HistoryRow = { id: string; status: string; timestamp: number; execute_at_timestamp?: number; executed_timestamp?: number; shares_burned?: string; estimated_usd?: string };

async function findRow(vaultId: string, id: string) {
  const r = await signed<{ history: HistoryRow[] }>("GET", `/v2/vault/history?vault_id=${vaultId}&type=withdrawal&limit=20`, keys());
  return r.history.find((h) => h.id === id);
}

async function main() {
  if (cmd === "keygen") {
    const k = generateKeys();
    update((s) => {
      s.account = {
        label: args[0] ?? "Depositor",
        strikeAccountId: null,
        publicKey: k.publicKey,
        privateKeyEnc: encryptPrivateKey(k.privateKey),
        status: "unverified",
        createdAt: Date.now(),
      };
    });
    console.log(`\nPublic key (register it with Authorize, NOT Generate, at app.strikefinance.org/api-keys,\nbound to the MASTER account of the depositor):\n\n  ${k.publicKey}\n\nThen run: npx tsx scripts/rescind.ts verify\n`);
    return;
  }

  if (cmd === "verify") {
    const acct = await signed<Record<string, unknown>>("GET", "/v2/account", keys());
    const id = (acct.account_id ?? acct.id ?? (acct.account as Record<string, unknown>)?.id) as string | undefined;
    let sub: unknown = null;
    try {
      sub = await signed<unknown>("GET", "/v2/sub-accounts", keys());
    } catch (e) {
      if (e instanceof StrikeError && e.status === 403) throw new Error("This key is bound to a sub-account. Vault withdrawals are master-only.");
    }
    update((s) => {
      if (s.account) Object.assign(s.account, { strikeAccountId: id ?? null, status: "active", verifiedAt: Date.now() });
    });
    console.log("Verified. Account:", id ?? JSON.stringify(acct).slice(0, 200));
    console.log("Sub-accounts response:", JSON.stringify(sub).slice(0, 200));
    return;
  }

  if (cmd === "position") {
    const p = await signed<Record<string, string>>("GET", `/v2/vault/position?vault_id=${args[0]}`, keys());
    console.log(p);
    return;
  }

  if (cmd === "smoke") {
    const vaultId = args[0];
    if (!vaultId) throw new Error("Usage: smoke <vaultId> --confirm");
    const v = await get<{ name: string; lockup_days: number; share_price: string }>(`/v2/vault/${vaultId}`);
    const pos = await signed<{ available_shares: string }>("GET", `/v2/vault/position?vault_id=${vaultId}`, keys());
    console.log(`Vault ${v.name}: lockup ${v.lockup_days} d, share price ${v.share_price}. Your available shares: ${pos.available_shares}.`);
    if (!args.includes("--confirm")) {
      console.log("\nDry run. Add --confirm to file a REAL withdraw_all and cancel it straight after.");
      return;
    }
    const t0 = Date.now();
    const w = await signed<{ request_id: string; message: string }>("POST", "/v2/vault/withdraw", keys(), { vault_id: vaultId, withdraw_all: true });
    console.log(`Filed in ${Date.now() - t0} ms: ${w.request_id} (${w.message})`);
    let row: HistoryRow | undefined;
    for (let i = 0; i < 20 && row?.status !== "pending"; i++) {
      await sleep(1500);
      row = await findRow(vaultId, w.request_id);
    }
    if (!row) throw new Error("No pending row after 30 s. The engine may have rejected it (VAULT_WITHDRAWAL_REQUEST_FAILED).");
    console.log(`Pending. Requested ${new Date(row.timestamp).toISOString()}, executes ${new Date(row.execute_at_timestamp!).toISOString()}.`);
    const c = await signed<{ message: string }>("POST", `/v2/vault/${vaultId}/withdrawals/${w.request_id}/cancel`, keys());
    console.log("Cancel:", c.message);
    for (let i = 0; i < 20 && row?.status !== "cancelled"; i++) {
      await sleep(1500);
      row = await findRow(vaultId, w.request_id);
    }
    const after = await signed<{ available_shares: string }>("GET", `/v2/vault/position?vault_id=${vaultId}`, keys());
    console.log(`Final status: ${row?.status}. Available shares before ${pos.available_shares}, after ${after.available_shares}.`);
    console.log(row?.status === "cancelled" && after.available_shares === pos.available_shares ? "\nSMOKE TEST PASSED: file, pending, cancel, no cost." : "\nCheck the result above.");
    return;
  }

  console.log("Commands: keygen [label] | verify | position <vaultId> | smoke <vaultId> [--confirm]");
}

main().catch((e) => {
  console.error("Error:", e instanceof StrikeError ? `${e.status} ${e.message}` : (e as Error).message);
  process.exit(1);
});
