import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import { getCached, setCache } from '../../../utils/redis';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

/**
 * Vote on review helpfulness. Tracks via Redis to prevent duplicate votes.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required to vote' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 30, '1 h', 'reviews:vote');
    if (rateLimited) return rateLimited;
    const { reviewId, helpful } = await request.json();

    if (!reviewId || typeof helpful !== 'boolean') {
      return new Response(JSON.stringify({ error: 'reviewId and helpful (boolean) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use IP + reviewId to prevent duplicate votes
    const voteKey = `vote:${reviewId}:${ip}`;

    const existing = await getCached<boolean>(voteKey);
    if (existing !== null) {
      return new Response(JSON.stringify({ error: 'Already voted on this review' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record vote
    await setCache(voteKey, true, 86400 * 365); // 1 year TTL

    // Increment helpful/unhelpful count in Redis
    const field = helpful ? 'helpful' : 'unhelpful';
    const countKey = `review_votes:${reviewId}:${field}`;
    const current = (await getCached<number>(countKey)) || 0;
    await setCache(countKey, current + 1, 86400 * 365);

    // Also try to update DB — use separate queries to avoid unsafe column interpolation
    try {
      if (helpful) {
        await db.execute(sql`UPDATE reviews SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = ${reviewId}::uuid`);
      } else {
        await db.execute(sql`UPDATE reviews SET unhelpful_count = COALESCE(unhelpful_count, 0) + 1 WHERE id = ${reviewId}::uuid`);
      }
    } catch {
      // Column may not exist yet — vote still counted in Redis
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
