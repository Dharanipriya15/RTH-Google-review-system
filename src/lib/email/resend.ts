import "server-only";

import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { renderLowRatingEmail } from "@/lib/email/templates/low-rating";

/** True when RESEND_API_KEY and RESEND_FROM_EMAIL are both set (not placeholders). */
export function isEmailConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.resendApiKey && env.resendFromEmail);
}

export interface LowRatingAlertInput {
  to: string;
  businessName: string;
  rating: number;
  message: string | undefined;
  customerName: string | undefined;
  customerPhone: string | undefined;
  submittedAt: Date;
  feedbackId: string;
}

/**
 * Sends the owner alert for a low rating. Throws on failure (or when email is
 * not configured) so the caller can record it in `notification_logs`; it never
 * blocks the customer response.
 */
export async function sendLowRatingAlert(
  input: LowRatingAlertInput,
): Promise<{ providerMessageId: string | null }> {
  const env = getServerEnv();
  if (!env.resendApiKey || !env.resendFromEmail) {
    throw new Error(
      "Email not configured: set RESEND_API_KEY and a verified RESEND_FROM_EMAIL.",
    );
  }

  const { subject, html, text } = renderLowRatingEmail(input);

  const { data, error } = await new Resend(env.resendApiKey).emails.send({
    from: env.resendFromEmail,
    to: input.to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Resend rejected the message.");
  }

  return { providerMessageId: data?.id ?? null };
}
