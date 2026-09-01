import { StatusBadge } from "@/components/ui/status-badge";
import type { FeedbackRow } from "@/lib/admin/dashboard";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`size-3.5 ${n <= rating ? "text-gold" : "text-line"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.6l2.7 5.94 6.3.72-4.7 4.3 1.24 6.24L12 16.9l-5.54 2.9L7.7 13.56 3 9.26l6.3-.72z" />
        </svg>
      ))}
    </span>
  );
}

function Outcome({ value }: { value: FeedbackRow["outcome"] }) {
  return value === "redirect_to_google" ? (
    <span className="text-green">Google review</span>
  ) : (
    <span className="text-ink-muted">Private</span>
  );
}

export function FeedbackList({ rows }: { rows: FeedbackRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="card px-6 py-14 text-center">
        <p className="font-display text-xl text-ink">No feedback yet</p>
        <p className="mx-auto mt-2 max-w-sm text-caption">
          Responses from the guest feedback page will appear here as they come in.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg text-ink">Recent feedback</h2>
        <span className="text-caption">{rows.length} shown</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-soft text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted">
              <th className="px-6 py-3 font-semibold">When</th>
              <th className="px-6 py-3 font-semibold">Rating</th>
              <th className="px-6 py-3 font-semibold">Guest</th>
              <th className="px-6 py-3 font-semibold">Message</th>
              <th className="px-6 py-3 font-semibold">Outcome</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line-soft align-top last:border-0"
              >
                <td className="whitespace-nowrap px-6 py-4 text-ink-muted">
                  {formatDate(row.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Stars rating={row.rating} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-ink">{row.customerName ?? "—"}</div>
                  {row.customerPhone && (
                    <div className="text-xs text-ink-muted">{row.customerPhone}</div>
                  )}
                </td>
                <td className="max-w-xs px-6 py-4 text-ink-soft">
                  {row.message ?? <span className="italic text-ink-muted">No message</span>}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Outcome value={row.outcome} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-line-soft md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <Stars rating={row.rating} />
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {row.message ?? <span className="italic text-ink-muted">No message</span>}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <span>{formatDate(row.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <Outcome value={row.outcome} />
              {row.customerName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{row.customerName}</span>
                </>
              )}
              {row.customerPhone && <span>{row.customerPhone}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
