"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pass) {
      setError("Enter the passphrase.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await api("/api/auth/login", { method: "POST", body: { passphrase: pass } });
    setBusy(false);
    // Sample build: the auth route isn't wired yet, so any passphrase opens the sample screens.
    if (res.ok || res.sample) router.push("/app");
    else if (res.status === 401) setError("That passphrase doesn't match. Check BREACH_ADMIN_PASSPHRASE in your .env file.");
    else setError(`Couldn't reach Rescind's server (${res.status || "network"}). Is it running?`);
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="pass">Passphrase</label>
        <input
          id="pass"
          className="input"
          type="password"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "pass-error" : undefined}
        />
        {error && <p id="pass-error" className="field-error" role="alert">{error}</p>}
      </div>
      <button className="btn primary" type="submit" disabled={busy}>{busy ? "Unlocking…" : "Unlock"}</button>
    </form>
  );
}
