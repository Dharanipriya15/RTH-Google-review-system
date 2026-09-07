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
 * Service-account private keys are often pasted into a single-line env var
 * with literal `\n` escapes (required by most hosts, including Vercel).
 * Turn those into real newlines so the PEM parses correctly.
 */
function normalizePrivateKey(value: string | undefined): string | undefined {
  const normalized = optional(value)?.replace(/\\n/g, "\n");
  return normalized && normalized.includes("BEGIN PRIVATE KEY") ? normalized : undefined;
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
 * Google Sheets destination for 1–3★ (private) feedback, written via a
 * service account. `null` when any of the three required values is unset or
 * still a placeholder — callers must treat that as "not configured" and fail
 * loudly rather than silently skipping the write.
 */
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
  /** Optional sheet/tab name; falls back to the first tab when unset. */
  sheetName: string | undefined;
}

function resolveGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const spreadsheetId = optional(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
  const clientEmail = optional(process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY);
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    sheetName: optional(process.env.GOOGLE_SHEETS_SHEET_NAME),
  };
}

/**
 * Server-only config.
 *
 * Supabase credentials are REQUIRED — without them nothing works, so a missing
 * value throws loudly. Google Sheets credentials are read as a single
 * `googleSheets` object that is `null` when incomplete; `processFeedbackSubmission`
 * treats a missing config as a hard failure for 1–3★ submissions (it must never
 * report success without a row actually being written to the sheet).
 */
export function getServerEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    googleSheets: resolveGoogleSheetsConfig(),
    ipHashSalt: process.env.FEEDBACK_IP_HASH_SALT?.trim() || "raades-dev-salt",
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW ?? "3"),
    rateLimitWindowMs:
      Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600") * 1000,
  };
}
