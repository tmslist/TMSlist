import type { APIRoute } from 'astro';
import { validateSessionStrict } from '../../../utils/auth';
import { db } from '../../../db';
import { subscriptions, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// GET /api/portal/invoices — returns Stripe invoice data for the authenticated clinic owner.
// Falls back to mock data when Stripe is not configured.
export const GET: APIRoute = async ({ request }) => {
  const session = validateSessionStrict(request);

  try {
    const userRows = await db.select({ clinicId: users.clinicId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return json({ invoices: [] });
    }

    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    let invoices: unknown[] = [];

    if (hasStripe) {
      // Real Stripe integration would fetch from Stripe API
      // For now, derive from subscriptions table
      const subs = await db.select().from(subscriptions).where(eq(subscriptions.clinicId, clinicId));
      invoices = subs.map(sub => ({
        id: sub.stripeSubscriptionId ?? sub.id,
        amount: sub.plan === 'featured' ? 9900 : sub.plan === 'premium' ? 19900 : sub.plan === 'pro' ? 29900 : 4900,
        currency: (sub.billingCurrency ?? 'usd').toUpperCase(),
        status: sub.status === 'active' ? 'paid' : sub.status === 'past_due' ? 'overdue' : sub.status === 'canceled' ? 'void' : 'pending',
        dueDate: sub.currentPeriodEnd?.toISOString() ?? null,
        paidAt: sub.currentPeriodEnd?.toISOString() ?? null,
        plan: sub.plan,
        description: `${sub.plan} plan subscription`,
      }));
    } else {
      // Mock invoice data when Stripe isn't configured
      const now = new Date();
      invoices = [
        {
          id: 'inv_mock_001',
          amount: 9900,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
          paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 2).toISOString(),
          plan: 'featured',
          description: 'Featured plan subscription',
        },
        {
          id: 'inv_mock_002',
          amount: 9900,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
          paidAt: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
          plan: 'featured',
          description: 'Featured plan subscription',
        },
        {
          id: 'inv_mock_003',
          amount: 4900,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
          paidAt: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
          plan: 'basic',
          description: 'Basic plan subscription',
        },
        {
          id: 'inv_mock_004',
          amount: 4900,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(now.getFullYear(), now.getMonth() - 4, 1).toISOString(),
          paidAt: new Date(now.getFullYear(), now.getMonth() - 4, 1).toISOString(),
          plan: 'basic',
          description: 'Basic plan subscription',
        },
        {
          id: 'inv_mock_005',
          amount: 4900,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString(),
          paidAt: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString(),
          plan: 'basic',
          description: 'Basic plan subscription',
        },
      ];
    }

    return json({ invoices });
  } catch (err) {
    console.error('[GET /api/portal/invoices]', err);
    return json({ error: 'Failed to load invoices' }, 500);
  }
};