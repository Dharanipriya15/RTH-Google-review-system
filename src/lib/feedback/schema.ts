import { z } from "zod";

const MESSAGE_MAX = 2000;
const NAME_MAX = 120;
const PHONE_MAX = 32;

/** Collapse whitespace and trim; return undefined for empty strings. */
const optionalText = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .refine((value) => value.length <= max, {
      message: `Please keep this under ${max} characters.`,
    })
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();

/**
 * Server-side validation for the feedback endpoint. Unknown keys are stripped.
 * The message is optional for every rating.
 */
export const feedbackSchema = z.object({
  businessSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Unknown feedback destination."),
  // Accept a real number, or a numeric string (e.g. "4"). Reject everything
  // else — arrays, objects, booleans — which `Number()` would silently coerce
  // (`Number([5]) === 5`). Must be an integer 1–5.
  rating: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? Number(value) : value,
    z
      .number({ error: "Please select a rating." })
      .int("Please select a rating.")
      .min(1, "Please select a rating.")
      .max(5, "Please select a rating."),
  ),
  message: optionalText(MESSAGE_MAX),
  customerName: optionalText(NAME_MAX),
  customerPhone: optionalText(PHONE_MAX).refine(
    (value) => value === undefined || /^[+()\-\s\d]{6,32}$/.test(value),
    { message: "Please enter a valid phone number." },
  ),
  company_website: z.string().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Digits-and-plus only, for a stable dedupe key. */
export function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}
