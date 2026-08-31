/**
 * Centralised environment access.
 *
 * `publicEnv` values are safe for the browser (they are inlined by Next at
 * build time). `getServerEnv()` values are secrets and must only be read from
 * server-only modules.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Returns a trimmed value, or undefined when empty or an unfilled placeholder. */
function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/REPLACE_WITH|your-verified-domain|your_api_key|your-domain\.com/i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/** Public config — safe to reference from Client Components. */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  /** Fallback Google review URL; the business row in Supabase is the source of truth. */
  googleReviewUrl: optional(process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL),
} as const;

/** True when the Supabase browser client can be constructed. */
export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function getSupabasePublicConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey),
  };
}

/**
 * Server-only config.
 *
 * Supabase credentials are REQUIRED — without them nothing works, so a missing
 * value throws loudly. Resend credentials are OPTIONAL here: if they are unset
 * or still placeholders, feedback is still saved and the customer flow is
 * unaffected — only the owner email is skipped (and logged). See
 * `isEmailConfigured()` in `lib/email/resend.ts`.
 */
export function getServerEnv() {
  const ownerEmail = optional(process.env.OWNER_NOTIFICATION_EMAIL);
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    resendApiKey: optional(process.env.RESEND_API_KEY),
    resendFromEmail: optional(process.env.RESEND_FROM_EMAIL),
    /** Optional override; falls back to businesses.owner_email in the database. */
    ownerNotificationEmail: ownerEmail && ownerEmail.includes("@") ? ownerEmail : undefined,
    ipHashSalt: process.env.FEEDBACK_IP_HASH_SALT?.trim() || "raades-dev-salt",
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW ?? "3"),
    rateLimitWindowMs:
      Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600") * 1000,
  };
}
