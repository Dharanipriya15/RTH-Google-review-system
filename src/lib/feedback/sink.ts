import "server-only";

import { getServerEnv } from "@/lib/env";

/** True when APPS_SCRIPT_NOTIFY_URL + APPS_SCRIPT_NOTIFY_SECRET are set to real values. */
export function isFeedbackSinkConfigured(): boolean {
  return getServerEnv().appsScriptNotify !== null;
}

export interface FeedbackSinkPayload {
  /** Supabase feedback row id — the Apps Script idempotency key. */
  feedbackId: string;
  businessName: string;
  rating: number;
  customerName: string | undefined;
  customerPhone: string | undefined;
  customerEmail: string | undefined;
  message: string | undefined;
  /** Deterministic per submission (the Supabase row's created_at). */
  createdAtIso: string;
}

export interface FeedbackSinkResult {
  /** 1-based row number written in the Feedback sheet. */
  sheetRow: number;
  /** Whether the owner email was sent (true for ratings 1–3). */
  emailed: boolean;
  /** True when the Apps Script had already processed this feedbackId. */
  deduped: boolean;
}

/** Abort if the Apps Script hangs, so a submission never stalls on it. */
const TIMEOUT_MS = 15_000;

/**
 * Sends the submission to the Apps Script web app, which appends exactly one
 * row to the Feedback sheet and emails the owner (ratings 1–3). Idempotent on
 * `feedbackId`: a retry re-returns the first result without writing again.
 *
 * Throws on any failure — the caller MUST treat that as a hard failure and
 * report it to the customer, never as a silent success.
 */
export async function recordFeedback(
  payload: FeedbackSinkPayload,
): Promise<FeedbackSinkResult> {
  const config = getServerEnv().appsScriptNotify;
  if (!config) {
    throw new Error(
      "Feedback sink is not configured: set APPS_SCRIPT_NOTIFY_URL and APPS_SCRIPT_NOTIFY_SECRET.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(config.url, {
      method: "POST",
      // Apps Script /exec 302-redirects to script.googleusercontent.com; fetch
      // follows it. text/plain avoids a CORS preflight and still arrives as
      // e.postData.contents.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: config.secret, ...payload }),
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `Apps Script request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Apps Script HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  let parsed: { ok?: boolean; error?: string; sheetRow?: number; emailed?: boolean; deduped?: boolean };
  try {
    parsed = JSON.parse(text);
  } catch {
    // Almost always: the deployment needs re-authorising, or "Who has access"
    // isn't "Anyone" — Apps Script then returns an HTML login page.
    throw new Error(`Apps Script returned non-JSON (check the deployment): ${text.slice(0, 200)}`);
  }

  if (!parsed.ok) {
    throw new Error(`Apps Script error: ${parsed.error ?? "ok:false"}`);
  }

  return {
    sheetRow: parsed.sheetRow ?? 0,
    emailed: Boolean(parsed.emailed),
    deduped: Boolean(parsed.deduped),
  };
}
