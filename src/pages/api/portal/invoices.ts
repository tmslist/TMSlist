import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { subscriptions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Invoices are simulated from the subscriptions table since we use Stripe
// In production you'd have a proper invoices table; for now derive from subscriptions
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner')) return json({ error: 'Forbidden' }, 403);

  try {
    const userRows = await db.select({ clinicId: (await import('../../../db/schema')).users.clinicId })
      .from((await import('../../../db/schema')).users)
      .where(eq((await import('../../../db/schema')).users.id, session.userId)).limit(1);
    const clinicId = userRows[0]?.clinicId;
    if (!clinicId) return json({ data: [] });

    const subs = await db.select().from(subscriptions).where(eq(subscriptions.clinicId, clinicId));

    // Derive invoices from subscription records
    const invoices = subs.map(sub => ({
      id: sub.stripeSubscriptionId ?? sub.id,
      amount: sub.plan === 'featured' ? 9900 : sub.plan === 'premium' ? 19900 : sub.plan === 'pro' ? 29900 : 4900,
      currency: (sub.billingCurrency ?? 'usd').toUpperCase(),
      status: sub.status === 'active' ? 'paid' : sub.status === 'past_due' ? 'overdue' : sub.status === 'canceled' ? 'void' : 'pending',
      dueDate: sub.currentPeriodEnd?.toISOString() ?? null,
      paidAt: sub.currentPeriodEnd?.toISOString() ?? null,
      plan: sub.plan,
      description: `${sub.plan} plan subscription`,
    }));

    return json({ data: invoices });
  } catch (err) {
    console.error('[GET /api/portal/invoices]', err);
    return json({ error: 'Failed to load invoices' }, 500);
  }
};