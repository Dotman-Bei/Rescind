import "@/styles/app.css";
import { AppShell } from "@/components/app/AppShell";
import { day } from "@/lib/format";
import { getAccount } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false } };

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const account = getAccount();
  const keyLine = account.keyStatus === "active" ? `Key active · expires ${day(account.keyExpiresAt)}` : `Key ${account.keyStatus}`;
  return (
    <div className="app">
      <AppShell
        account={{ label: account.label, keyLine, network: account.network === "mainnet" ? "Mainnet" : "Testnet" }}
        demo={process.env.BREACH_DEMO_MODE === "1"}
      >
        {children}
      </AppShell>
    </div>
  );
}
