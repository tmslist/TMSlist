import type { APIRoute } from 'astro';
import { sql, eq, gte } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, reviews, leads, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      clinicsTotal,
      clinicsVerified,
      clinicsPending,
      clinicsAdded7d,
      reviewsPending,
      leadsTotal,
      leadsRecent,
      usersActive,
    ] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(clinics),
      db.select({ c: sql<number>`count(*)` }).from(clinics).where(eq(clinics.verified, true)),
      db.select({ c: sql<number>`count(*)` }).from(clinics).where(eq(clinics.verified, false)),
      db.select({ c: sql<number>`count(*)` }).from(clinics).where(gte(clinics.createdAt, sevenDaysAgo)),
      db.select({ c: sql<number>`count(*)` }).from(reviews).where(eq(reviews.approved, false)),
      db.select({ c: sql<number>`count(*)` }).from(leads).where(gte(leads.createdAt, thirtyDaysAgo)),
      db.select({ c: sql<number>`count(*)` }).from(leads).where(gte(leads.createdAt, sevenDaysAgo)),
      db.select({ c: sql<number>`count(*)` }).from(users),
    ]);

    return json({
      clinics: {
        total: Number(clinicsTotal[0]?.c ?? 0),
        verified: Number(clinicsVerified[0]?.c ?? 0),
        pending: Number(clinicsPending[0]?.c ?? 0),
        addedLast7d: Number(clinicsAdded7d[0]?.c ?? 0),
      },
      moderation: {
        pendingReviews: Number(reviewsPending[0]?.c ?? 0),
      },
      leads: {
        last30d: Number(leadsTotal[0]?.c ?? 0),
        last7d: Number(leadsRecent[0]?.c ?? 0),
      },
      users: {
        total: Number(usersActive[0]?.c ?? 0),
      },
    });
  } catch (err) {
    console.error('dashboard-stats error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
