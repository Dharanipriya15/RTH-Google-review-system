import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FeedbackStatus } from "@/types/database";

export interface DashboardStats {
  total: number;
  averageRating: number;
  lowRatingCount: number;
  googleRedirectCount: number;
  /** Count of feedback per star, index 0 = 1 star … index 4 = 5 stars. */
  ratingCounts: [number, number, number, number, number];
}

export interface FeedbackRow {
  id: string;
  rating: number;
  message: string | null;
  customerName: string | null;
  customerPhone: string | null;
  outcome: "thank_you" | "redirect_to_google";
  status: FeedbackStatus;
  createdAt: string;
}

const EMPTY_STATS: DashboardStats = {
  total: 0,
  averageRating: 0,
  lowRatingCount: 0,
  googleRedirectCount: 0,
  ratingCounts: [0, 0, 0, 0, 0],
};

export async function getDashboardData(businessId: string): Promise<{
  stats: DashboardStats;
  recent: FeedbackRow[];
}> {
  const supabase = await createSupabaseServerClient();

  const [{ data: statsRow }, { data: recentRows }, { data: ratingRows }] =
    await Promise.all([
      supabase
        .from("feedback_stats")
        .select("total, average_rating, low_rating_count, google_redirect_count")
        .eq("business_id", businessId)
        .maybeSingle(),
      supabase
        .from("feedback")
        .select(
          "id, rating, message, customer_name, customer_phone, outcome, status, created_at",
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("feedback")
        .select("rating")
        .eq("business_id", businessId)
        .limit(2000),
    ]);

  const ratingCounts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const row of ratingRows ?? []) {
    const idx = (row.rating as number) - 1;
    if (idx >= 0 && idx < 5) ratingCounts[idx] += 1;
  }

  const stats: DashboardStats = statsRow
    ? {
        total: statsRow.total ?? 0,
        averageRating: Number(statsRow.average_rating ?? 0),
        lowRatingCount: statsRow.low_rating_count ?? 0,
        googleRedirectCount: statsRow.google_redirect_count ?? 0,
        ratingCounts,
      }
    : { ...EMPTY_STATS, ratingCounts };

  const recent: FeedbackRow[] = (recentRows ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    message: row.message,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    outcome: row.outcome,
    status: row.status,
    createdAt: row.created_at,
  }));

  return { stats, recent };
}
