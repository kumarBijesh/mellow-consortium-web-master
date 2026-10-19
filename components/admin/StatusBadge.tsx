const STYLES: Record<string, string> = {
  ACTIVE: "bg-teal/10 text-teal border-teal/20",
  PENDING_SETUP: "bg-gold/10 text-gold border-gold/25",
  DISABLED: "bg-white dark:bg-white/[0.04] text-muted dark:text-white/40 border-line dark:border-white/10",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
        STYLES[status] ?? "bg-white dark:bg-white/[0.04] text-muted dark:text-white/40 border-line dark:border-white/10"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
