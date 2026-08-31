import "server-only";

import { createHash } from "node:crypto";

/** Submissions that match on all of these within one bucket are duplicates. */
const BUCKET_MS = 10 * 60 * 1000;

interface DedupeParts {
  businessId: string;
  rating: number;
  phone: string | null;
  message: string | undefined;
}

export function buildDedupeHash({
  businessId,
  rating,
  phone,
  message,
}: DedupeParts): string {
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const payload = [
    businessId,
    rating,
    phone ?? "",
    (message ?? "").toLowerCase(),
    bucket,
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export function hashIp(ip: string | null, salt: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
