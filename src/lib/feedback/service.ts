import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessBySlug } from "@/lib/feedback/business";
import { buildDedupeHash } from "@/lib/feedback/dedupe";
import { normalizePhone, type FeedbackInput } from "@/lib/feedback/schema";
import { recordFeedback, isFeedbackSinkConfigured } from "@/lib/feedback/sink";
import {
  GOOGLE_REVIEW_MIN_RATING,
  type FeedbackFieldErrors,
  type FeedbackResponse,
} from "@/lib/feedback/types";

interface SubmissionContext {
  ipHash: string | null;
  userAgent: string | null;
}

interface ServiceResult {
  status: number;
  body: FeedbackResponse;
}

const PG_UNIQUE_VIOLATION = "23505";

const SINK_UNAVAILABLE_BODY: FeedbackResponse = {
  ok: false,
  error: "We couldn't record your feedback right now. Please try again shortly.",
};

/**
 * Persists a 1–3★ submission. 4–5★ ratings are redirected to Google entirely
 * client-side (see `FeedbackExperience`) and never reach this endpoint in the
 * normal flow; the threshold check below is a server-side backstop against a
 * tampered request, so a "positive" rating can never be written anywhere.
 *
 * Two guarantees, each enforced by an independent idempotency key:
 *   1. Exactly one DB row — the `feedback.dedupe_hash` unique index. A
 *      double-click / retry with the same rating+phone+message inside the
 *      10-minute window collides here instead of inserting again.
 *   2. Exactly one sheet row + at most one email — the Apps Script web app
 *      (`recordFeedback`) keys on the Supabase row id, so calling it again for
 *      the same submission re-returns the first result and writes nothing new.
 *
 * The sink call is authoritative: if it fails, the submission is reported as
 * failed to the customer (HTTP 502), even though the Supabase row was already
 * saved. A customer retry re-runs the sink for real.
 *
 * No extra DB columns are required — this works against the base schema.
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

  // Name/phone/email are mandatory on the low-rating form (mirrors the
  // client's `isLowRating` requirement) so a direct API call can't bypass it.
  const fieldErrors: FeedbackFieldErrors = {};
  if (!input.customerName) fieldErrors.customerName = "Please enter your name.";
  if (!input.customerPhone) fieldErrors.customerPhone = "Please enter your phone number.";
  if (!input.customerEmail) fieldErrors.customerEmail = "Please enter your email address.";
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 400,
      body: { ok: false, error: "Please check the form and try again.", fieldErrors },
    };
  }

  if (!isFeedbackSinkConfigured()) {
    console.error(
      "[feedback] Feedback sink is not configured (APPS_SCRIPT_NOTIFY_URL / APPS_SCRIPT_NOTIFY_SECRET); the submission was not recorded.",
    );
    return { status: 502, body: SINK_UNAVAILABLE_BODY };
  }

  const supabase = createAdminClient();
  const phone = normalizePhone(input.customerPhone);
  const dedupeHash = buildDedupeHash({
    businessId: business.id,
    rating: input.rating,
    phone,
    message: input.message,
  });

  // --- 1. One DB row -----------------------------------------------------------
  // customerEmail is intentionally omitted here: the Supabase `feedback` table
  // has no customer_email column (this insert is only a secondary copy for the
  // admin dashboard). Email is captured in full on the Google Sheet row.
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
    .select("id, created_at")
    .single();

  let feedbackId: string;
  let createdAt: string;
  let isDuplicate = false;

  if (insertError) {
    if (insertError.code !== PG_UNIQUE_VIOLATION) {
      console.error("[feedback] Supabase insert failed", insertError);
      return {
        status: 500,
        body: { ok: false, error: "Could not save your feedback. Please try again." },
      };
    }

    isDuplicate = true;
    const { data: existing, error: existingError } = await supabase
      .from("feedback")
      .select("id, created_at")
      .eq("dedupe_hash", dedupeHash)
      .maybeSingle();

    if (existingError || !existing) {
      console.error(
        "[feedback] Could not load the existing row after a unique violation",
        existingError,
      );
      return {
        status: 500,
        body: { ok: false, error: "Could not save your feedback. Please try again." },
      };
    }

    feedbackId = existing.id;
    createdAt = existing.created_at;
  } else {
    feedbackId = inserted.id;
    createdAt = inserted.created_at;
  }

  // "Created At" comes from the (stable) Supabase row so it is identical across
  // retries; the Apps Script also keys idempotency on `feedbackId`.
  const createdAtIso = new Date(createdAt).toISOString();

  // --- 2. One sheet row + one email (idempotent on feedbackId) ---------------
  try {
    const result = await recordFeedback({
      feedbackId,
      businessName: business.name,
      rating: input.rating,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      message: input.message,
      createdAtIso,
    });
    console.info(
      `[feedback] recorded ${feedbackId}: sheet row ${result.sheetRow}, emailed=${result.emailed}, deduped=${result.deduped}`,
    );
  } catch (error) {
    console.error(
      "[feedback] Feedback sink failed",
      error instanceof Error ? error.message : error,
    );
    return { status: 502, body: SINK_UNAVAILABLE_BODY };
  }

  return { status: isDuplicate ? 200 : 201, body: { ok: true, duplicate: isDuplicate } };
}
