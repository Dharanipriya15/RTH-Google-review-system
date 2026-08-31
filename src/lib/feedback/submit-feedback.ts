import type { FeedbackResponse, Rating } from "@/lib/feedback/types";

export interface SubmitFeedbackInput {
  businessSlug: string;
  rating: Rating;
  message?: string;
  customerName?: string;
  customerPhone?: string;
  /** Honeypot value; forwarded so the server can discard bot submissions. */
  companyWebsite?: string;
}

/**
 * Posts the feedback to the server route. The server decides the outcome
 * (thank-you vs. Google redirect) and whether to email the owner.
 */
export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<Extract<FeedbackResponse, { ok: true }>> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessSlug: input.businessSlug,
      rating: input.rating,
      message: input.message,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      company_website: input.companyWebsite,
    }),
  });

  let data: FeedbackResponse;
  try {
    data = (await response.json()) as FeedbackResponse;
  } catch {
    throw new Error("We could not reach the server. Please try again.");
  }

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && data.error ? data.error : "We could not submit your feedback. Please try again.";
    throw new Error(message);
  }

  return data;
}
