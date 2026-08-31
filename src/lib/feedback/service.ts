import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import { getBusinessBySlug } from "@/lib/feedback/business";
import { buildDedupeHash } from "@/lib/feedback/dedupe";
import { normalizePhone, type FeedbackInput } from "@/lib/feedback/schema";
import { sendLowRatingAlert } from "@/lib/email/resend";
import {
  GOOGLE_REVIEW_MIN_RATING,
  type FeedbackOutcome,
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

function decideOutcome(
  rating: number,
  positiveRatingMin: number,
  googleReviewUrl: string | null,
): { outcome: FeedbackOutcome; redirectUrl: string | null; isPositive: boolean } {
  // Google routing requires clearing BOTH the business's configured threshold
  // AND the hard minimum (never below GOOGLE_REVIEW_MIN_RATING).
  const googleThreshold = Math.max(GOOGLE_REVIEW_MIN_RATING, positiveRatingMin);

  // Hard rule: ratings below the threshold NEVER get a redirect URL. Return
  // before `googleReviewUrl` is ever read, so a low rating cannot leak one.
  if (rating < googleThreshold) {
    return { outcome: "thank_you", redirectUrl: null, isPositive: false };
  }

  // Positive rating with no configured Google URL: graceful thanks, no redirect.
  if (!googleReviewUrl) {
    return { outcome: "thank_you", redirectUrl: null, isPositive: true };
  }

  return { outcome: "redirect_to_google", redirectUrl: googleReviewUrl, isPositive: true };
}

export async function processFeedbackSubmission(
  input: FeedbackInput,
  context: SubmissionContext,
): Promise<ServiceResult> {
  const business = await getBusinessBySlug(input.businessSlug);
  if (!business) {
    return { status: 404, body: { ok: false, error: "Feedback destination not found." } };
  }

  const supabase = createAdminClient();
  const env = getServerEnv();
  const phone = normalizePhone(input.customerPhone);

  const { outcome, redirectUrl, isPositive } = decideOutcome(
    input.rating,
    business.positiveRatingMin,
    business.googleReviewUrl,
  );

  const dedupeHash = buildDedupeHash({
    businessId: business.id,
    rating: input.rating,
    phone,
    message: input.message,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("feedback")
    .insert({
      business_id: business.id,
      rating: input.rating,
      message: input.message ?? null,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      outcome,
      status: "new",
      dedupe_hash: dedupeHash,
      ip_hash: context.ipHash,
      user_agent: context.userAgent,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      // Duplicate within the dedupe window — treat as the original submission.
      return {
        status: 200,
        body: { ok: true, outcome, redirectUrl, duplicate: true },
      };
    }
    console.error("[feedback] insert failed", insertError);
    return { status: 500, body: { ok: false, error: "Could not save your feedback. Please try again." } };
  }

  if (!isPositive) {
    await sendOwnerAlert({
      feedbackId: inserted.id,
      to: env.ownerNotificationEmail ?? business.ownerEmail,
      businessName: business.name,
      rating: input.rating,
      message: input.message,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
    });
  }

  return {
    status: 201,
    body: { ok: true, outcome, redirectUrl, duplicate: false },
  };
}

interface OwnerAlertInput {
  feedbackId: string;
  to: string;
  businessName: string;
  rating: number;
  message: string | undefined;
  customerName: string | undefined;
  customerPhone: string | undefined;
}

/** Best-effort: a delivery failure is logged, never surfaced to the customer. */
async function sendOwnerAlert(input: OwnerAlertInput): Promise<void> {
  const supabase = createAdminClient();

  const { data: log } = await supabase
    .from("notification_logs")
    .insert({ feedback_id: input.feedbackId, channel: "email", provider: "resend", state: "pending" })
    .select("id")
    .single();

  try {
    const { providerMessageId } = await sendLowRatingAlert({
      to: input.to,
      businessName: input.businessName,
      rating: input.rating,
      message: input.message,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      submittedAt: new Date(),
      feedbackId: input.feedbackId,
    });

    if (log) {
      await supabase
        .from("notification_logs")
        .update({
          state: "sent",
          provider_message_id: providerMessageId,
          attempted_at: new Date().toISOString(),
        })
        .eq("id", log.id);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 2000) : "Unknown email error.";
    console.error("[feedback] owner alert failed", errorMessage);
    if (log) {
      await supabase
        .from("notification_logs")
        .update({
          state: "failed",
          error_message: errorMessage,
          attempted_at: new Date().toISOString(),
        })
        .eq("id", log.id);
    }
  }
}
