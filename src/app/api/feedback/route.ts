import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { feedbackSchema } from "@/lib/feedback/schema";
import { hashIp } from "@/lib/feedback/dedupe";
import { processFeedbackSubmission } from "@/lib/feedback/service";
import { createInMemoryRateLimiter } from "@/lib/rate-limit";
import type { FeedbackFieldErrors, FeedbackResponse } from "@/lib/feedback/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Built once and reused so the window persists across requests on a warm
// instance. Lazily created so `next build` never evaluates server env vars.
let rateLimiter: ReturnType<typeof createInMemoryRateLimiter> | null = null;

function getRateLimiter() {
  if (!rateLimiter) {
    const env = getServerEnv();
    rateLimiter = createInMemoryRateLimiter({
      max: Number.isFinite(env.rateLimitMax) ? env.rateLimitMax : 3,
      windowMs: Number.isFinite(env.rateLimitWindowMs)
        ? env.rateLimitWindowMs
        : 600_000,
    });
  }
  return rateLimiter;
}

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

function json(body: FeedbackResponse, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: NextRequest) {
  // Lightweight same-origin check for an unauthenticated mutation.
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    if (new URL(origin).host !== host) {
      return json({ ok: false, error: "Invalid request origin." }, 403);
    }
  }

  const ip = clientIp(request);
  const rate = getRateLimiter().check(ip ?? "unknown");
  if (!rate.allowed) {
    return json(
      { ok: false, error: "Too many submissions. Please try again shortly." },
      429,
      { "Retry-After": String(rate.retryAfterSeconds) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    const reportableFields: (keyof FeedbackFieldErrors)[] = [
      "rating",
      "message",
      "customerName",
      "customerPhone",
    ];
    const fieldErrors: FeedbackFieldErrors = {};
    for (const field of reportableFields) {
      const message = flattened.fieldErrors[field]?.[0];
      if (message) fieldErrors[field] = message;
    }
    return json(
      {
        ok: false,
        error: "Please check the form and try again.",
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      },
      400,
    );
  }

  const input = parsed.data;

  // Honeypot: silently accept and discard obvious bots.
  if (input.company_website && input.company_website.trim() !== "") {
    return json({ ok: true, duplicate: false }, 200);
  }

  const { status, body } = await processFeedbackSubmission(input, {
    ipHash: hashIp(ip, getServerEnv().ipHashSalt),
    userAgent: request.headers.get("user-agent"),
  });

  return json(body, status);
}
