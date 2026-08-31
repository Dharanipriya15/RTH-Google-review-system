import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getDashboardData } from "@/lib/admin/dashboard";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ed] px-6 text-center">
        <p className="max-w-md text-sm leading-6 text-ink-muted">
          Add the Supabase environment variables to <code>.env.local</code> to enable the
          admin dashboard.
        </p>
      </main>
    );
  }

  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/sign-in");

  const { stats, recent } = await getDashboardData(admin.adminUser.business_id);

  const metrics: [string, string][] = [
    ["Total feedback", String(stats.total)],
    ["Average rating", stats.averageRating ? stats.averageRating.toFixed(2) : "—"],
    ["Low ratings (1–3★)", String(stats.lowRatingCount)],
    ["Sent to Google", String(stats.googleRedirectCount)],
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Raade&apos;s Tea House</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl text-ink">Feedback overview</h1>
          {admin.adminUser.display_name && (
            <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-bold text-tea-dark">
              {admin.adminUser.display_name}
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Card className="p-5" key={label}>
              <p className="text-sm text-ink-muted">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#ece3d2] p-6">
            <h2 className="text-lg font-bold text-ink">Recent feedback</h2>
            <span className="text-sm text-ink-muted">{recent.length} shown</span>
          </div>

          {recent.length === 0 ? (
            <p className="p-6 text-sm text-ink-muted">No feedback yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#faf6ec] text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-6 py-3 font-semibold">When</th>
                    <th className="px-6 py-3 font-semibold">Rating</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Message</th>
                    <th className="px-6 py-3 font-semibold">Outcome</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id} className="border-t border-[#f0e9db] align-top">
                      <td className="whitespace-nowrap px-6 py-4 text-ink-muted">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gold">
                        {"★".repeat(row.rating)}
                        <span className="text-[#d9cfbd]">{"★".repeat(5 - row.rating)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-ink">{row.customerName ?? "—"}</div>
                        {row.customerPhone && (
                          <div className="text-xs text-ink-muted">{row.customerPhone}</div>
                        )}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-ink-muted">
                        {row.message ?? <span className="italic">No message</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-ink-muted">
                        {row.outcome === "redirect_to_google" ? "Google review" : "Thank you"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
