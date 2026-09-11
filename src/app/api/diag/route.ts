// TEMPORARY diagnostic route — safe to delete once the pipeline is verified.
// GET /api/diag → reports which parts of the feedback pipeline are configured
// and reachable. Does NOT write a sheet row or send an email.
import "server-only";

import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessBySlug } from "@/lib/feedback/business";
import { isFeedbackSinkConfigured } from "@/lib/feedback/sink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redact(v: string | undefined) {
  if (!v) return { set: false };
  return { set: true, length: v.length, preview: v.slice(0, 18) };
}

export async function GET() {
  // Dev-only. Never expose config previews in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const trace: Record<string, unknown> = {};
  const env = getServerEnv();

  trace.env = {
    supabaseUrl: redact(env.supabaseUrl),
    supabaseServiceRoleKey: redact(env.supabaseServiceRoleKey),
    APPS_SCRIPT_NOTIFY_URL: redact(process.env.APPS_SCRIPT_NOTIFY_URL),
    APPS_SCRIPT_NOTIFY_SECRET: redact(process.env.APPS_SCRIPT_NOTIFY_SECRET),
    resolvedAppsScriptNotify: env.appsScriptNotify ? { url: env.appsScriptNotify.url } : null,
    isFeedbackSinkConfigured: isFeedbackSinkConfigured(),
  };

  try {
    const business = await getBusinessBySlug("raades-tea-house");
    trace.business = business ? { id: business.id, slug: business.slug } : "NOT FOUND";
  } catch (e) {
    trace.business = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("feedback").select("id, dedupe_hash").limit(1);
    trace.feedbackTable = error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    trace.feedbackTable = { error: e instanceof Error ? e.message : String(e) };
  }

  // Reachability only: GET the /exec URL. The Apps Script doGet returns
  // {ok:true,service:...}. A login/HTML page here means the deployment's
  // "Who has access" is not "Anyone" or it needs re-authorising.
  if (env.appsScriptNotify) {
    try {
      const res = await fetch(env.appsScriptNotify.url, { redirect: "follow", cache: "no-store" });
      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* keep parsed null */
      }
      trace.appsScriptReachability = parsed
        ? { ok: true, status: res.status, body: parsed }
        : { ok: false, status: res.status, note: "non-JSON — deployment access/auth problem", preview: text.slice(0, 120) };
    } catch (e) {
      trace.appsScriptReachability = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    trace.appsScriptReachability = { skipped: "APPS_SCRIPT_NOTIFY_URL/SECRET not configured" };
  }

  return NextResponse.json(trace, { status: 200 });
}
