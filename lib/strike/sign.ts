// Strike API wallet signing (PRD §12.1), ported from strike-builder-reference src/api/auth.ts.
// Message: {METHOD}:{PATH}:{TIMESTAMP}:{NONCE}:{BODY_HASH}; PATH includes "?query"; BODY_HASH = hex sha256(body).
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2";
import { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));

export type Keys = { publicKey: string; privateKey: string };

const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");

export function generateKeys(): Keys {
  const priv = ed.utils.randomPrivateKey();
  return { privateKey: hex(priv), publicKey: hex(ed.getPublicKey(priv)) };
}

export function signHeaders(method: string, path: string, body: string, keys: Keys, clockOffsetMs = 0): Record<string, string> {
  const timestamp = Math.floor((Date.now() + clockOffsetMs) / 1000).toString();
  const nonce = randomUUID();
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}:${bodyHash}`;
  const signature = ed.sign(new TextEncoder().encode(message), Buffer.from(keys.privateKey, "hex"));
  return {
    "X-API-Wallet-Public-Key": keys.publicKey.toLowerCase(),
    "X-API-Wallet-Signature": hex(signature),
    "X-API-Wallet-Timestamp": timestamp,
    "X-API-Wallet-Nonce": nonce,
  };
}

// Private keys at rest: AES-256-GCM with BREACH_KEY_ENCRYPTION_SECRET, a fresh IV per record (PRD §12.3).
function secretKey() {
  const s = process.env.BREACH_KEY_ENCRYPTION_SECRET;
  if (!s || s.length < 16) throw new Error("BREACH_KEY_ENCRYPTION_SECRET is missing or shorter than 16 characters");
  return createHash("sha256").update(s).digest();
}

export function encryptPrivateKey(privateKey: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([c.update(privateKey, "utf8"), c.final()]);
  return { iv: iv.toString("hex"), data: Buffer.concat([enc, c.getAuthTag()]).toString("hex") };
}

export function decryptPrivateKey(rec: { iv: string; data: string }) {
  const buf = Buffer.from(rec.data, "hex");
  const d = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(rec.iv, "hex"));
  d.setAuthTag(buf.subarray(buf.length - 16));
  return Buffer.concat([d.update(buf.subarray(0, buf.length - 16)), d.final()]).toString("utf8");
}
