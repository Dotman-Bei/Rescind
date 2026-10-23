// Lists the vaults the connected account holds shares in (GET /v2/vault/positions).
import { signed } from "../lib/strike/client";
import { decryptPrivateKey } from "../lib/strike/sign";
import { readState } from "../lib/store";

async function main() {
  process.loadEnvFile(".env.local");
  const a = readState().account!;
  const keys = { publicKey: a.publicKey, privateKey: decryptPrivateKey(a.privateKeyEnc) };
  console.log(JSON.stringify(await signed<unknown>("GET", "/v2/vault/positions", keys)).slice(0, 1500));
  console.log(JSON.stringify(await signed<unknown>("GET", "/v2/account", keys)).slice(0, 800));
}
main().catch((e) => console.error("Error:", e.message));
