import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize only when env vars are available
function getRedis() {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

let _redis: Redis | null = null;
export function redis() {
  if (!_redis) _redis = getRedis();
  return _redis;
}

// Rate limiters
export function apiRateLimit() {
  const r = redis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  });
}

export function formRateLimit() {
  const r = redis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 submissions per minute
    analytics: true,
    prefix: 'ratelimit:form',
  });
}

// Cache helpers
export async function getCached<T>(key: string): Promise<T | null> {
  const r = redis();
  if (!r) return null;
  return r.get<T>(key);
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300) {
  const r = redis();
  if (!r) return;
  await r.set(key, value, { ex: ttlSeconds });
}

export async function invalidateCache(pattern: string) {
  const r = redis();
  if (!r) return;
  const keys = await r.keys(pattern);
  if (keys.length > 0) {
    await r.del(...keys);
  }
}
