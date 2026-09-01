import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { FeedbackList } from "@/components/admin/feedback-list";
import { RatingBars } from "@/components/admin/rating-bars";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getDashboardData } from "@/lib/admin/dashboard";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Feedback overview",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-svh place-items-center px-6 text-center">
        <p className="max-w-md text-sm leading-6 text-ink-muted">
          Add the Supabase environment variables to enable the admin dashboard.
        </p>
      </main>
    );
  }

  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/sign-in");

  const { stats, recent } = await getDashboardData(admin.adminUser.business_id);

  return (
    <div className="min-h-svh bg-paper">
      <DashboardHeader name={admin.adminUser.display_name} />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="eyebrow">Overview</p>
        <h1 className="display-lg mt-1.5 text-ink">Feedback overview</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Everything guests have shared, newest first.
        </p>

        <div className="stagger mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total feedback" value={String(stats.total)} />
          <StatCard
            label="Average rating"
            value={stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
            hint={stats.averageRating ? "out of 5" : undefined}
          />
          <StatCard
            label="Private (1–3★)"
            value={String(stats.lowRatingCount)}
            hint="handled by the team"
          />
          <StatCard
            label="Sent to Google"
            value={String(stats.googleRedirectCount)}
            hint="4–5★ guests"
          />
        </div>

        <div className="mt-6">
          <RatingBars counts={stats.ratingCounts} />
        </div>

        <div className="mt-6">
          <FeedbackList rows={recent} />
        </div>
      </main>
    </div>
  );
}
