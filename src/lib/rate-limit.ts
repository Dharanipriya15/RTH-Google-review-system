import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Good enough for a single instance / low traffic. The `RateLimiter` interface
 * is intentionally tiny so this can be swapped for a Supabase- or Redis-backed
 * implementation later without touching call sites.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface Options {
  max: number;
  windowMs: number;
}

export function createInMemoryRateLimiter({ max, windowMs }: Options): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const cutoff = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((ts) => ts > cutoff);

      if (recent.length >= max) {
        const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000);
        hits.set(key, recent);
        return { allowed: false, remaining: 0, retryAfterSeconds };
      }

      recent.push(now);
      hits.set(key, recent);

      // Opportunistic cleanup so the map does not grow unbounded.
      if (hits.size > 5000) {
        for (const [k, v] of hits) {
          if (v.every((ts) => ts <= cutoff)) hits.delete(k);
        }
      }

      return {
        allowed: true,
        remaining: max - recent.length,
        retryAfterSeconds: 0,
      };
    },
  };
}
