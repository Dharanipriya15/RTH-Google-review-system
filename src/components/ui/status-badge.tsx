import type { FeedbackStatus } from "@/types/database";
const styles: Record<FeedbackStatus, string> = { new: "bg-amber-100 text-amber-900", contacted: "bg-sky-100 text-sky-900", resolved: "bg-emerald-100 text-emerald-900" };
export function StatusBadge({ status }: { status: FeedbackStatus }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[status]}`}>{status}</span>; }
