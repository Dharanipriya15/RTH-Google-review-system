import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export interface Business {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string | null;
  ownerEmail: string;
  positiveRatingMin: number;
}

function toHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Reads business config with the service-role client. Safe to call from Server
 * Components and route handlers only (never shipped to the browser).
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, google_review_url, owner_email, positive_rating_min")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    googleReviewUrl:
      toHttpsUrl(data.google_review_url) ?? toHttpsUrl(publicEnv.googleReviewUrl),
    ownerEmail: data.owner_email,
    positiveRatingMin: data.positive_rating_min,
  };
}
