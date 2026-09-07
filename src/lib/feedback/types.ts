export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * The lowest star rating that is ever routed straight to the business's
 * Google review page. At and above this rating the customer is redirected
 * immediately, client-side — no form is shown and nothing is ever written to
 * Supabase or the Google Sheet. Below it, the private feedback form is shown
 * and a submission is saved. `POST /api/feedback` re-derives and enforces the
 * same threshold, so a tampered client request can never sneak a "positive"
 * rating into storage.
 *
 * 5 & 4 stars  -> Google review page (client-side redirect, no API call)
 * 3, 2 & 1 star -> private feedback form -> Google Sheet (+ Supabase)
 */
export const GOOGLE_REVIEW_MIN_RATING = 4;

/** What the customer form sends to `POST /api/feedback`. */
export interface FeedbackRequestBody {
  businessSlug: string;
  rating: number;
  message?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Honeypot — must stay empty. */
  company_website?: string;
}

export type FeedbackFieldErrors = Partial<
  Record<"rating" | "message" | "customerName" | "customerPhone" | "customerEmail", string>
>;

export type FeedbackResponse =
  | {
      ok: true;
      /** True when this exact submission was already recorded moments ago (no new row was written). */
      duplicate: boolean;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: FeedbackFieldErrors;
    };
