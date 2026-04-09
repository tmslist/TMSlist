import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import { getCached, setCache } from '../../../utils/redis';

export const prerender = false;

/**
 * Track clinic engagement events.
 * Events: profile_view, phone_click, website_click, search_impression, lead_submit
 *
 * Uses Redis for fast writes, batched to Postgres periodically.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { clinicId, event } = await request.json();

    if (!clinicId || !event) {
      return new Response(JSON.stringify({ error: 'clinicId and event required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validEvents = ['profile_view', 'phone_click', 'website_click', 'search_impression', 'lead_submit'];
    if (!validEvents.includes(event)) {
      return new Response(JSON.stringify({ error: 'Invalid event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `analytics:${clinicId}:${event}:${today}`;

    // Try Redis increment (fast path)
    const cached = await getCached<number>(key);
    if (cached !== null) {
      await setCache(key, cached + 1, 86400 * 7); // 7 day TTL
    } else {
      await setCache(key, 1, 86400 * 7);
    }

    // Also write directly to DB (simple upsert)
    try {
      await db.execute(sql`
        INSERT INTO clinic_analytics (clinic_id, event_type, event_date, count)
        VALUES (${clinicId}, ${event}, ${today}::date, 1)
        ON CONFLICT (clinic_id, event_type, event_date)
        DO UPDATE SET count = clinic_analytics.count + 1, updated_at = now()
      `);
    } catch {
      // Table may not exist yet — analytics still tracked in Redis
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
