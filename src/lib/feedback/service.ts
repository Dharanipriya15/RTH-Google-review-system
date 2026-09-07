import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessBySlug } from "@/lib/feedback/business";
import { buildDedupeHash } from "@/lib/feedback/dedupe";
import { normalizePhone, type FeedbackInput } from "@/lib/feedback/schema";
import { appendFeedbackRow, isGoogleSheetsConfigured } from "@/lib/sheets/google-sheets";
import { GOOGLE_REVIEW_MIN_RATING, type FeedbackResponse } from "@/lib/feedback/types";

interface SubmissionContext {
  ipHash: string | null;
  userAgent: string | null;
}

interface ServiceResult {
  status: number;
  body: FeedbackResponse;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Persists a 1–3★ submission. 4–5★ ratings are redirected to Google entirely
 * client-side (see `FeedbackExperience`) and never reach this endpoint in the
 * normal flow; the threshold check below is a server-side backstop against a
 * tampered request, so a "positive" rating can never be written anywhere.
 *
 * On success the feedback is saved to Supabase (for the admin dashboard) and
 * appended to the Google Sheet, which is the client's primary record. The
 * Sheet write is authoritative: if it fails, the whole submission is reported
 * as failed to the customer, even though the Supabase row was already saved.
 * Whether the client is notified of the new row is handled entirely on the
 * Google Sheets side (an Apps Script trigger) — this code has no email or
 * notification step of its own.
 */
export async function processFeedbackSubmission(
  input: FeedbackInput,
  context: SubmissionContext,
): Promise<ServiceResult> {
  const business = await getBusinessBySlug(input.businessSlug);
  if (!business) {
    return { status: 404, body: { ok: false, error: "Feedback destination not found." } };
  }

  const googleThreshold = Math.max(GOOGLE_REVIEW_MIN_RATING, business.positiveRatingMin);
  if (input.rating >= googleThreshold) {
    // Hard rule: this endpoint never persists a "positive" rating anywhere.
    return { status: 200, body: { ok: true, duplicate: false } };
  }

  const supabase = createAdminClient();
  const phone = normalizePhone(input.customerPhone);
  const dedupeHash = buildDedupeHash({
    businessId: business.id,
    rating: input.rating,
    phone,
    message: input.message,
  });

  // customerEmail is intentionally omitted here: the Supabase `feedback` table
  // has no customer_email column (this insert is only a secondary copy for the
  // admin dashboard). Email is captured in full on the Google Sheet row below.
  const { data: inserted, error: insertError } = await supabase
    .from("feedback")
    .insert({
      business_id: business.id,
      rating: input.rating,
      message: input.message ?? null,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      outcome: "thank_you",
      status: "new",
      dedupe_hash: dedupeHash,
      ip_hash: context.ipHash,
      user_agent: context.userAgent,
    })
    .select("id")
    .single();

  let feedbackId: string;

  if (insertError) {
    if (insertError.code !== PG_UNIQUE_VIOLATION) {
      console.error("[feedback] Supabase insert failed", insertError);
      return {
        status: 500,
        body: { ok: false, error: "Could not save your feedback. Please try again." },
      };
    }

    // Same business/rating/phone/message within the last 10 minutes. If that
    // original submission already made it into the Sheet, this is a genuine
    // duplicate (double-click, retry) — report success without writing again.
    // If it never made it into the Sheet (e.g. the earlier attempt hit a
    // Sheets outage), fall through and retry the Sheet write for real, so a
    // customer retrying after a failure is never told "success" for nothing.
    const { data: existing } = await supabase
      .from("feedback")
      .select("id, sheet_synced_at")
      .eq("dedupe_hash", dedupeHash)
      .maybeSingle();

    if (existing?.sheet_synced_at) {
      return { status: 200, body: { ok: true, duplicate: true } };
    }
    feedbackId = existing?.id ?? "";
  } else {
    feedbackId = inserted.id;
  }

  if (!isGoogleSheetsConfigured()) {
    console.error(
      "[feedback] Google Sheets is not configured; the submission was not recorded in the sheet.",
    );
    return {
      status: 502,
      body: {
        ok: false,
        error: "We couldn't record your feedback right now. Please try again shortly.",
      },
    };
  }

  try {
    await appendFeedbackRow({
      rating: input.rating,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      message: input.message,
      submittedAt: new Date(),
    });
  } catch (error) {
    console.error(
      "[feedback] Google Sheets append failed",
      error instanceof Error ? error.message : error,
    );
    return {
      status: 502,
      body: {
        ok: false,
        error: "We couldn't record your feedback right now. Please try again shortly.",
      },
    };
  }

  if (feedbackId) {
    const { error: syncError } = await supabase
      .from("feedback")
      .update({ sheet_synced_at: new Date().toISOString() })
      .eq("id", feedbackId);
    if (syncError) {
      // The Sheet row is already written — this only affects our own retry
      // bookkeeping, so log it but don't fail a submission that already
      // succeeded from the customer's perspective.
      console.error("[feedback] Failed to mark sheet_synced_at", syncError);
    }
  }

  return { status: 201, body: { ok: true, duplicate: Boolean(insertError) } };
}
