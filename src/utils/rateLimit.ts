/**
 * Lightweight in-memory sliding window rate limiter.
 * Used as fallback when Upstash Redis is unavailable.
 * PER-INSTANCE memory — works correctly for single-tenant/serverless with one cold start per instance.
 * For multi-instance deployments, Upstash Redis is required for true distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp when window expires
}

const store = new Map<string, RateLimitEntry>();

/**
 * Parse a window string like "15 m", "1 h", "5 m" into milliseconds.
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(m|min|h|s|ms)$/);
  if (!match) return 60_000; // default 1 minute
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1_000;
    case 'm':
    case 'min': return value * 60_000;
    case 'h': return value * 3_600_000;
    default: return 60_000;
  }
}

/**
 * Sliding window rate limit check.
 * @param key - Unique identifier (IP, email, etc.)
 * @param maxRequests - Max requests allowed in the window
 * @param window - Window duration (e.g. "15 m", "1 h", "5 m")
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  window: string
): { success: boolean; remaining: number; reset: number } {
  const windowMs = parseWindow(window);
  const now = Date.now();

  // Clean up expired entries periodically (lightweight — every ~50 calls)
  if (Math.random() < 0.02) {
    const cutoff = now - windowMs;
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= cutoff) store.delete(k);
    }
  }

  const entry = store.get(key);
  const windowStart = now - windowMs;

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, reset: resetAt };
  }

  if (entry.resetAt > now && entry.count >= maxRequests) {
    // Over limit
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  // Within window, under limit
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, reset: entry.resetAt };
}

/**
 * Strict rate limit by a custom identifier (email, IP, etc.).
 * Tries Upstash Redis first, falls back to in-memory if Redis is unavailable.
 * Returns null if allowed, or a 429 Response if blocked.
 */
export async function strictRateLimit(
  identifier: string,
  maxRequests: number,
  window: string,
  prefix: string,
): Promise<Response | null> {
  const r = redis();
  if (!r) {
    // Fallback: in-memory rate limiter (per-instance, best-effort)
    const result = inMemoryRateLimit(`${prefix}:${identifier}`, maxRequests, window);
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      });
    }
    return null;
  }

  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(maxRequests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });

  const { success, limit, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response(JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return null;
}

/**
 * Check rate limit for a request. Returns null if allowed, or a Response if blocked.
 * Uses Redis if available, falls back to in-memory.
 */
export async function checkRateLimit(
  request: Request,
  type: 'api' | 'form' = 'api'
): Promise<Response | null> {
  const limiter = type === 'form' ? formRateLimit() : apiRateLimit();
  if (!limiter) {
    // Fallback: in-memory rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const window = type === 'form' ? '1 m' : '1 m';
    const maxReq = type === 'form' ? 5 : 60;
    const result = inMemoryRateLimit(`${type}:${ip}`, maxReq, window);
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: 'Too many requests',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      });
    }
    return null;
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return new Response(JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return null;
}

/** Extract client IP from request headers. */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
