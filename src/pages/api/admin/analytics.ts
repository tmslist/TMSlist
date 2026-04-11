import type { APIRoute } from 'astro';
import { sql, gte, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, reviews, leads, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - days * 2);

    // Run all queries in parallel
    const [
      leadsByDay,
      leadsByType,
      reviewsByDay,
      clinicsByDay,
      usersByDay,
      topClinicsByLeads,
      topClinicsByReviews,
      currentPeriodLeads,
      previousPeriodLeads,
      currentPeriodReviews,
      previousPeriodReviews,
      currentPeriodClinics,
      previousPeriodClinics,
      currentPeriodUsers,
      previousPeriodUsers,
    ] = await Promise.all([
      // Leads by day
      db
        .select({
          day: sql<string>`date_trunc('day', ${leads.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(leads)
        .where(gte(leads.createdAt, since))
        .groupBy(sql`date_trunc('day', ${leads.createdAt})::date`)
        .orderBy(sql`day`),

      // Leads by type
      db
        .select({
          type: leads.type,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(leads)
        .where(gte(leads.createdAt, since))
        .groupBy(leads.type),

      // Reviews by day
      db
        .select({
          day: sql<string>`date_trunc('day', ${reviews.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(reviews)
        .where(gte(reviews.createdAt, since))
        .groupBy(sql`date_trunc('day', ${reviews.createdAt})::date`)
        .orderBy(sql`day`),

      // Clinics by day
      db
        .select({
          day: sql<string>`date_trunc('day', ${clinics.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(clinics)
        .where(gte(clinics.createdAt, since))
        .groupBy(sql`date_trunc('day', ${clinics.createdAt})::date`)
        .orderBy(sql`day`),

      // Users by day
      db
        .select({
          day: sql<string>`date_trunc('day', ${users.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(users)
        .where(gte(users.createdAt, since))
        .groupBy(sql`date_trunc('day', ${users.createdAt})::date`)
        .orderBy(sql`day`),

      // Top 10 clinics by lead count
      db
        .select({
          clinicId: clinics.id,
          clinicName: clinics.name,
          city: clinics.city,
          state: clinics.state,
          count: sql<number>`count(${leads.id})`.as('count'),
        })
        .from(clinics)
        .innerJoin(leads, sql`${leads.clinicId} = ${clinics.id}`)
        .groupBy(clinics.id, clinics.name, clinics.city, clinics.state)
        .orderBy(desc(sql`count`))
        .limit(10),

      // Top 10 clinics by review count
      db
        .select({
          clinicId: clinics.id,
          clinicName: clinics.name,
          city: clinics.city,
          state: clinics.state,
          count: sql<number>`count(${reviews.id})`.as('count'),
        })
        .from(clinics)
        .innerJoin(reviews, sql`${reviews.clinicId} = ${clinics.id}`)
        .groupBy(clinics.id, clinics.name, clinics.city, clinics.state)
        .orderBy(desc(sql`count`))
        .limit(10),

      // Current period totals
      db.select({ count: sql<number>`count(*)` }).from(leads).where(gte(leads.createdAt, since)),
      db.select({ count: sql<number>`count(*)` }).from(leads).where(sql`${leads.createdAt} >= ${prevSince} AND ${leads.createdAt} < ${since}`),
      db.select({ count: sql<number>`count(*)` }).from(reviews).where(gte(reviews.createdAt, since)),
      db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.createdAt} >= ${prevSince} AND ${reviews.createdAt} < ${since}`),
      db.select({ count: sql<number>`count(*)` }).from(clinics).where(gte(clinics.createdAt, since)),
      db.select({ count: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.createdAt} >= ${prevSince} AND ${clinics.createdAt} < ${since}`),
      db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, since)),
      db.select({ count: sql<number>`count(*)` }).from(users).where(sql`${users.createdAt} >= ${prevSince} AND ${users.createdAt} < ${since}`),
    ]);

    const current = {
      leads: Number(currentPeriodLeads[0]?.count ?? 0),
      reviews: Number(currentPeriodReviews[0]?.count ?? 0),
      clinics: Number(currentPeriodClinics[0]?.count ?? 0),
      users: Number(currentPeriodUsers[0]?.count ?? 0),
    };
    const previous = {
      leads: Number(previousPeriodLeads[0]?.count ?? 0),
      reviews: Number(previousPeriodReviews[0]?.count ?? 0),
      clinics: Number(previousPeriodClinics[0]?.count ?? 0),
      users: Number(previousPeriodUsers[0]?.count ?? 0),
    };

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return json({
      overview: {
        leads: { count: current.leads, change: pctChange(current.leads, previous.leads) },
        reviews: { count: current.reviews, change: pctChange(current.reviews, previous.reviews) },
        clinics: { count: current.clinics, change: pctChange(current.clinics, previous.clinics) },
        users: { count: current.users, change: pctChange(current.users, previous.users) },
      },
      leadsByDay: leadsByDay.map((r) => ({ date: r.day, count: Number(r.count) })),
      leadsByType: leadsByType.map((r) => ({ type: r.type, count: Number(r.count) })),
      reviewsByDay: reviewsByDay.map((r) => ({ date: r.day, count: Number(r.count) })),
      clinicsByDay: clinicsByDay.map((r) => ({ date: r.day, count: Number(r.count) })),
      usersByDay: usersByDay.map((r) => ({ date: r.day, count: Number(r.count) })),
      topClinicsByLeads: topClinicsByLeads.map((r) => ({
        id: r.clinicId,
        name: r.clinicName,
        location: `${r.city}, ${r.state}`,
        count: Number(r.count),
      })),
      topClinicsByReviews: topClinicsByReviews.map((r) => ({
        id: r.clinicId,
        name: r.clinicName,
        location: `${r.city}, ${r.state}`,
        count: Number(r.count),
      })),
      days,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
