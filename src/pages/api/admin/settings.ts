import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, doctors, reviews, leads, questions, treatments, users, siteSettings } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Return site stats and admin config
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const [
      clinicCount,
      doctorCount,
      reviewCount,
      leadCount,
      questionCount,
      treatmentCount,
      userCount,
      verifiedClinicCount,
      pendingReviewCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(clinics),
      db.select({ count: sql<number>`count(*)` }).from(doctors),
      db.select({ count: sql<number>`count(*)` }).from(reviews),
      db.select({ count: sql<number>`count(*)` }).from(leads),
      db.select({ count: sql<number>`count(*)` }).from(questions),
      db.select({ count: sql<number>`count(*)` }).from(treatments),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.verified} = true`),
      db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.verified} = false`),
    ]);

    // Fetch all site settings
    const allSettings = await db.select().from(siteSettings);
    const settingsMap: Record<string, unknown> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    return json({
      stats: {
        clinics: Number(clinicCount[0]?.count ?? 0),
        verifiedClinics: Number(verifiedClinicCount[0]?.count ?? 0),
        doctors: Number(doctorCount[0]?.count ?? 0),
        reviews: Number(reviewCount[0]?.count ?? 0),
        pendingReviews: Number(pendingReviewCount[0]?.count ?? 0),
        leads: Number(leadCount[0]?.count ?? 0),
        questions: Number(questionCount[0]?.count ?? 0),
        treatments: Number(treatmentCount[0]?.count ?? 0),
        users: Number(userCount[0]?.count ?? 0),
      },
      settings: settingsMap,
    });
  } catch (err) {
    console.error('Admin settings error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Save settings to siteSettings table
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, unknown> };

    if (!settings || typeof settings !== 'object') {
      return json({ error: 'Invalid settings payload' }, 400);
    }

    const now = new Date();
    const entries = Object.entries(settings);

    for (const [key, value] of entries) {
      await db
        .insert(siteSettings)
        .values({
          key,
          value: value as any,
          updatedBy: session!.userId,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: value as any,
            updatedBy: session!.userId,
            updatedAt: now,
          },
        });
    }

    return json({ success: true, updated: entries.length });
  } catch (err) {
    console.error('Settings save error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
