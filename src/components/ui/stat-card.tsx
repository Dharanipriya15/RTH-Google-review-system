import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label">{label}</p>
        {icon && <span className="text-green/60">{icon}</span>}
      </div>
      <p className="font-display mt-3 text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-caption">{hint}</p>}
    </div>
  );
}
