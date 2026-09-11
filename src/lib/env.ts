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
  if (
    /REPLACE_WITH|your-verified-domain|your_api_key|your-domain\.com|your-project|your-spreadsheet-id/i.test(
      trimmed,
    )
  ) {
    return undefined;
  }
  return trimmed;
}

/**
 * Canonical site origin. Prefers an explicit NEXT_PUBLIC_SITE_URL, then falls
 * back to the Vercel-provided production domain (set automatically on Vercel),
 * then localhost for local dev. Used only server-side, for metadata.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Public config — safe to reference from Client Components. */
export const publicEnv = {
  siteUrl: resolveSiteUrl(),
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
 * Apps Script web app that records a 1–3★ submission: it appends one row to
 * the Feedback sheet AND emails the owner. The Next.js server calls it once
 * per submission. `null` when unset or still a placeholder — callers must
 * treat that as "not configured" and fail loudly rather than silently
 * dropping the submission.
 */
export interface AppsScriptNotifyConfig {
  /** The web-app deployment URL, ending in `/exec`. */
  url: string;
  /** Shared secret echoed in the POST body; the script rejects mismatches. */
  secret: string;
}

function resolveAppsScriptNotifyConfig(): AppsScriptNotifyConfig | null {
  const url = optional(process.env.APPS_SCRIPT_NOTIFY_URL);
  const secret = optional(process.env.APPS_SCRIPT_NOTIFY_SECRET);
  if (!url || !secret) return null;
  // Reject the .env.example placeholders so a half-filled config reads as
  // "not configured" and the submission fails loudly rather than every call
  // to the webhook failing.
  if (url.includes("DEPLOYMENT_ID") || /^replace-with-/i.test(secret)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  // https everywhere; http only for a local mock during development.
  if (parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocal && process.env.NODE_ENV !== "production")) {
    return { url, secret };
  }
  return null;
}

/**
 * Server-only config.
 *
 * Supabase credentials are REQUIRED — without them nothing works, so a missing
 * value throws loudly. `appsScriptNotify` is `null` when incomplete;
 * `processFeedbackSubmission` treats that as a hard failure for 1–3★
 * submissions (it must never report success without the sheet row + email
 * actually happening).
 */
export function getServerEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    appsScriptNotify: resolveAppsScriptNotifyConfig(),
    ipHashSalt: process.env.FEEDBACK_IP_HASH_SALT?.trim() || "raades-dev-salt",
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW ?? "3"),
    rateLimitWindowMs:
      Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600") * 1000,
  };
}
