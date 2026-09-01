import type { FeedbackStatus } from "@/types/database";

const styles: Record<FeedbackStatus, { dot: string; text: string; bg: string }> = {
  new: { dot: "bg-gold", text: "text-[#6d4c14]", bg: "bg-gold-tint" },
  contacted: { dot: "bg-green", text: "text-green-deep", bg: "bg-green-tint" },
  resolved: { dot: "bg-ink-muted", text: "text-ink-soft", bg: "bg-paper-sink" },
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  const s = styles[status];
  return (
    <span
      className={`chip ${s.bg} ${s.text}`}
      style={{ textTransform: "capitalize", letterSpacing: "0.02em" }}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
