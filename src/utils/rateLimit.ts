import { Ratelimit } from '@upstash/ratelimit';
import { apiRateLimit, formRateLimit, redis } from './redis';

/**
 * Check rate limit for a request. Returns null if allowed, or a Response if blocked.
 */
export async function checkRateLimit(
  request: Request,
  type: 'api' | 'form' = 'api'
): Promise<Response | null> {
  const limiter = type === 'form' ? formRateLimit() : apiRateLimit();
  if (!limiter) return null; // Redis not configured, allow all

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

/**
 * Strict rate limit by a custom identifier (email, IP, etc.).
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
    // Fail-closed: if Redis is down, block the request and log a critical error.
    // An attacker who DoSes Redis should NOT be able to bypass rate limits.
    console.error('[rateLimit] CRITICAL: Redis unavailable — blocking request. Investigate Redis connectivity immediately.');
    return new Response(JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: 60,
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
    });
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

/** Extract client IP from request headers. */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
