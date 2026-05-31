import type { APIRoute } from 'astro';
import { eq, desc, count, and, or, like } from 'drizzle-orm';
import { db } from '../../../db';
import { subscriptions, clinics } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET /api/admin/subscriptions — list all subscriptions with clinic info
export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin', 'editor')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || '';
    const planFilter = url.searchParams.get('plan') || '';
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (statusFilter) conditions.push(eq(subscriptions.status, statusFilter as any));
    if (planFilter) conditions.push(eq(subscriptions.plan, planFilter as any));
    if (search) {
      conditions.push(
        or(
          like(clinics.name, `%${search}%`),
          like(subscriptions.stripeCustomerId, `%${search}%`),
          like(subscriptions.stripeSubscriptionId, `%${search}%`)
        ) ?? undefined
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db.select({ count: count() }).from(subscriptions);
    const [activeResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const rows = await db
      .select({
        id: subscriptions.id,
        clinicId: subscriptions.clinicId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        stripeCustomerId: subscriptions.stripeCustomerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        billingCurrency: subscriptions.billingCurrency,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
      })
      .from(subscriptions)
      .leftJoin(clinics, eq(subscriptions.clinicId, clinics.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return json({
      data: rows,
      stats: {
        total: Number(totalResult?.count ?? 0),
        active: Number(activeResult?.count ?? 0),
        returned: rows.length,
      },
      error: null,
    });
  } catch (err) {
    console.error('[/api/admin/subscriptions GET]', err);
    return json({ data: null, stats: null, error: 'Internal server error' }, 500);
  }
};