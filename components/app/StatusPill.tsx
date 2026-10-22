const MAP: Record<string, { cls: string; text: string }> = {
  pass: { cls: "pos", text: "Pass" },
  breach: { cls: "neg", text: "Breach" },
  unknown: { cls: "", text: "Unknown" },
  off: { cls: "", text: "Off" },
  pending: { cls: "warn", text: "Pending" },
  cancelled: { cls: "pos", text: "Cancelled · cost $0.00" },
  completed: { cls: "", text: "Executed" },
  failed: { cls: "neg", text: "Failed" },
  armed: { cls: "", text: "Armed" },
  dry_run: { cls: "warn", text: "Dry run" },
  paused: { cls: "", text: "Paused" },
  active: { cls: "pos", text: "Active" },
  expiring: { cls: "warn", text: "Expiring" },
  expired: { cls: "neg", text: "Expired" },
  public: { cls: "", text: "Public" },
  private: { cls: "", text: "Private" },
};

export function StatusPill({ status, children }: { status: string; children?: React.ReactNode }) {
  const m = MAP[status] ?? { cls: "", text: status };
  return <span className={`pill ${m.cls}`.trim()}>{children ?? m.text}</span>;
}
