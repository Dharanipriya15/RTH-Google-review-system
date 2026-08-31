export type Rating = 1 | 2 | 3 | 4 | 5;

export type FeedbackOutcome = "thank_you" | "redirect_to_google";

/**
 * The lowest star rating that may ever be routed to the business's Google
 * review page. Ratings below this ALWAYS get the private feedback flow and are
 * never sent to Google — no matter what the business config or the client
 * sends. Enforced on the server; the client uses it only to choose wording.
 *
 * 5 & 4 stars  -> Google review page
 * 3, 2 & 1 star -> private feedback form only
 */
export const GOOGLE_REVIEW_MIN_RATING = 4;

/** What the customer form sends to `POST /api/feedback`. */
export interface FeedbackRequestBody {
  businessSlug: string;
  rating: number;
  message?: string;
  customerName?: string;
  customerPhone?: string;
  /** Honeypot — must stay empty. */
  company_website?: string;
}

export type FeedbackFieldErrors = Partial<
  Record<"rating" | "message" | "customerName" | "customerPhone", string>
>;

export type FeedbackResponse =
  | {
      ok: true;
      outcome: FeedbackOutcome;
      /** Present only when `outcome === "redirect_to_google"`. */
      redirectUrl: string | null;
      duplicate: boolean;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: FeedbackFieldErrors;
    };
