/** Shown on every screen when Rescind runs against sim/server.ts, so a simulated run is never mistaken for mainnet. */
export function SimBanner() {
  if (process.env.STRIKE_ENV !== "simulated") return null;
  return (
    <p className="notice sim-banner" role="note">
      <strong>Simulated Strike.</strong> These rows come from a local stand-in for Strike&rsquo;s API (sim/server.ts), not
      from Strike. The Strike URLs below would show nothing for them.
    </p>
  );
}
