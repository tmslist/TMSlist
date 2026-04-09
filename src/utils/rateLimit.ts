import { apiRateLimit, formRateLimit } from './redis';

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
