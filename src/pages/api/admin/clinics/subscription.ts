import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { subscriptions } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const url = new URL(request.url);
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return json({ error: 'clinicId required' }, 400);

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clinicId, clinicId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!sub) {
      return json({ data: null });
    }

    return json({
      data: {
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        billingCurrency: sub.billingCurrency,
        createdAt: sub.createdAt,
      },
    });
  } catch (err) {
    console.error('Clinic subscription error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};