export function RatingBars({
  counts,
}: {
  counts: [number, number, number, number, number];
}) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-lg text-ink">Rating breakdown</h2>
      <p className="mt-1 text-caption">
        {total === 0 ? "No ratings yet" : `Across ${total} ${total === 1 ? "rating" : "ratings"}`}
      </p>

      <div className="mt-4 space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          const width = total === 0 ? 0 : (count / max) * 100;
          const positive = star >= 4;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="flex w-8 shrink-0 items-center gap-0.5 text-sm font-semibold text-ink-soft tabular-nums">
                {star}
                <svg viewBox="0 0 24 24" className="size-3 text-gold" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.6l2.7 5.94 6.3.72-4.7 4.3 1.24 6.24L12 16.9l-5.54 2.9L7.7 13.56 3 9.26l6.3-.72z" />
                </svg>
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    positive ? "bg-green" : "bg-gold"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-ink-muted tabular-nums">
                {count} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
