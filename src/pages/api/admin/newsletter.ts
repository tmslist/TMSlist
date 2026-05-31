import type { APIRoute } from 'astro';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { newsletterSubscribers } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// GET: List subscribers or get stats-only
export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);
  try {
    const url = new URL(request.url);
    const statsOnly = url.searchParams.get('stats') === 'true';

    if (statsOnly) {
      const [total] = await db.select({ count: count() }).from(newsletterSubscribers);
      const [subscribed] = await db.select({ count: count() })
        .from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'subscribed'));
      const [unsubscribed] = await db.select({ count: count() })
        .from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'unsubscribed'));
      const [pending] = await db.select({ count: count() })
        .from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'pending'));

      // bySource breakdown
      const sourceRows = await db
        .select({ source: newsletterSubscribers.source, count: count() })
        .from(newsletterSubscribers)
        .groupBy(newsletterSubscribers.source);

      return json({
        total: Number(total?.count ?? 0),
        subscribed: Number(subscribed?.count ?? 0),
        unsubscribed: Number(unsubscribed?.count ?? 0),
        pending: Number(pending?.count ?? 0),
        bySource: Object.fromEntries(
          sourceRows.map(r => [r.source ?? 'unknown', Number(r.count)])
        ),
      });
    }

    const statusFilter = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (statusFilter) conditions.push(eq(newsletterSubscribers.status, statusFilter));
    if (search) conditions.push(
      sql`${newsletterSubscribers.email} ILIKE ${'%' + search + '%'} OR ${newsletterSubscribers.name} ILIKE ${'%' + search + '%'}`
    );
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [total] = await db.select({ count: count() }).from(newsletterSubscribers);
    const [subscribed] = await db.select({ count: count() })
      .from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'subscribed'));
    const [unsubscribed] = await db.select({ count: count() })
      .from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'unsubscribed'));

    const rows = await db.select().from(newsletterSubscribers)
      .where(whereClause)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(limit).offset(offset);

    return json({
      subscribers: rows,
      stats: {
        total: Number(total?.count ?? 0),
        subscribed: Number(subscribed?.count ?? 0),
        unsubscribed: Number(unsubscribed?.count ?? 0),
      },
      total: Number(total?.count ?? 0),
    });
  } catch (err) { console.error('[/api/admin/newsletter GET]', err); return json({ error: 'Internal server error' }, 500); }
};

// POST: Add subscriber / toggle subscription
export const POST: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);
  try {
    const body = await request.json();
    const { action, email, name, source } = body;

    if (action === 'unsubscribe') {
      await db.update(newsletterSubscribers)
        .set({ status: 'unsubscribed' })
        .where(eq(newsletterSubscribers.email, email));
      return json({ success: true });
    }

    if (action === 'resubscribe') {
      await db.update(newsletterSubscribers)
        .set({ status: 'subscribed', confirmedAt: new Date() })
        .where(eq(newsletterSubscribers.email, email));
      return json({ success: true });
    }

    // Default: subscribe (upsert)
    if (!email) return json({ error: 'email is required' }, 400);
    const [row] = await db.insert(newsletterSubscribers).values({
      email,
      name: name || null,
      source: source || 'admin',
      status: 'subscribed',
      confirmedAt: new Date(),
    }).onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { status: 'subscribed', confirmedAt: new Date() },
    }).returning();
    return json({ subscriber: row });
  } catch (err) { console.error('[/api/admin/newsletter POST]', err); return json({ error: 'Internal server error' }, 500); }
};

// DELETE: Remove subscriber
export const DELETE: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    } else {
      const body = await request.json();
      if (body?.email) {
        await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, body.email));
      }
    }
    return json({ success: true });
  } catch (err) { console.error('[/api/admin/newsletter DELETE]', err); return json({ error: 'Internal server error' }, 500); }
};
