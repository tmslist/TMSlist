import type { APIRoute } from 'astro';
import { eq, count, desc, and, gte, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
  subscriptions,
  clinics,
} from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET /api/admin/billing — billing/subscription overview
export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin', 'editor')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const url = new URL(request.url);
    const daysParam = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '30') || 30, 365));
    const since = new Date();
    since.setDate(since.getDate() - daysParam);

    // Counts by status
    const [totalResult] = await db.select({ count: count() }).from(subscriptions);
    const [activeResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    const [canceledResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'canceled'));
    const [pastDueResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'past_due'));

    // Counts by plan
    const planRows = await db
      .select({
        plan: subscriptions.plan,
        count: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.plan);

    // New subscriptions in period
    const [newInPeriod] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, since));

    // Subscriptions expiring in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const [expiringSoon] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.currentPeriodEnd} <= ${sevenDaysFromNow}`,
          sql`${subscriptions.currentPeriodEnd} >= now()`
        )
      );

    // MRR estimate — use plan mapping if Stripe price env is set
    const stripeConfigured = !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder'
    );

    const planPrices: Record<string, number> = {
      featured: 99,
      premium: 199,
      verified: 79,
      pro: 299,
      enterprise: 999,
    };

    let estimatedMrr = 0;
    let mrrNote = 'estimate_only';

    if (stripeConfigured) {
      // If Stripe is wired, would use actual Stripe API here
      mrrNote = 'from_stripe';
    } else {
      // Estimate from plan counts
      for (const row of planRows) {
        const price = planPrices[row.plan ?? 'featured'] ?? 0;
        estimatedMrr += price * Number(row.count);
      }
    }

    const stats = {
      total: Number(totalResult?.count ?? 0),
      active: Number(activeResult?.count ?? 0),
      canceled: Number(canceledResult?.count ?? 0),
      past_due: Number(pastDueResult?.count ?? 0),
      new_in_period: Number(newInPeriod?.count ?? 0),
      expiring_soon: Number(expiringSoon?.count ?? 0),
      estimated_mrr: estimatedMrr,
      mrr_note: mrrNote,
      by_plan: Object.fromEntries(
        planRows.map((r) => [r.plan ?? 'unknown', Number(r.count)])
      ),
      stripe_configured: stripeConfigured,
      period_days: daysParam,
    };

    return json({ data: null, stats, error: null });
  } catch (err) {
    console.error('[/api/admin/billing GET]', err);
    return json({ data: null, stats: null, error: 'Internal server error' }, 500);
  }
};