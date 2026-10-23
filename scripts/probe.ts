// Free mainnet probe of the write path (PRD §24 kill criterion): does Strike accept an API-wallet key
// on POST /v2/vault/withdraw and the cancel route? Run against a vault the account holds NO shares in,
// so the engine rejects the withdrawal on its own and nothing can move.
// Usage: npx tsx scripts/probe.ts <vaultId>
import { randomUUID } from "node:crypto";
import { signed, StrikeError } from "../lib/strike/client";
import { decryptPrivateKey } from "../lib/strike/sign";
import { readState } from "../lib/store";

async function main() {
  process.loadEnvFile(".env.local");
  const vaultId = process.argv[2];
  const a = readState().account!;
  const keys = { publicKey: a.publicKey, privateKey: decryptPrivateKey(a.privateKeyEnc) };

  const pos = await signed<{ shares?: string; available_shares?: string }>("GET", `/v2/vault/position?vault_id=${vaultId}`, keys);
  console.log("Position before:", JSON.stringify(pos));
  if (Number(pos.available_shares ?? 0) > 0) throw new Error("This account holds shares here. Use smoke, not probe.");

  console.log("\n1) POST /v2/vault/withdraw");
  try {
    const r = await signed<unknown>("POST", "/v2/vault/withdraw", keys, { vault_id: vaultId, withdraw_all: true });
    console.log("   ACCEPTED:", JSON.stringify(r));
  } catch (e) {
    console.log(`   ${(e as StrikeError).status ?? ""} ${(e as Error).message}`);
  }

  console.log("\n2) POST /v2/vault/:id/withdrawals/<made-up id>/cancel");
  try {
    const r = await signed<unknown>("POST", `/v2/vault/${vaultId}/withdrawals/${randomUUID()}/cancel`, keys);
    console.log("   ACCEPTED:", JSON.stringify(r));
  } catch (e) {
    console.log(`   ${(e as StrikeError).status ?? ""} ${(e as Error).message}`);
  }

  await new Promise((r) => setTimeout(r, 4000));
  const hist = await signed<{ history: unknown[] }>("GET", `/v2/vault/history?vault_id=${vaultId}&type=withdrawal&limit=5`, keys);
  console.log("\nOwn withdrawal rows after:", JSON.stringify(hist.history));
  const after = await signed<{ available_shares?: string }>("GET", `/v2/vault/position?vault_id=${vaultId}`, keys);
  console.log("Position after:", JSON.stringify(after));
}

main().catch((e) => console.error("Error:", (e as Error).message));
