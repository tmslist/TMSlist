import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics, doctors, reviews } from '../../../db/schema';
import { sql, eq, isNull } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const [total, verified, noPhone, noEmail, noDesc, noHours, noMachines] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(clinics),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(eq(clinics.verified, true)),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(isNull(clinics.phone)),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(isNull(clinics.email)),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(isNull(clinics.description)),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.openingHours} IS NULL OR array_length(${clinics.openingHours}, 1) IS NULL`),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.machines} IS NULL OR array_length(${clinics.machines}, 1) IS NULL`),
  ]);

  const [noDoctors, noReviews, doctorsNoBio, doctorsNoImage, stale] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.id} NOT IN (SELECT DISTINCT clinic_id FROM doctors)`),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.reviewCount} = 0`),
    db.select({ c: sql<number>`count(*)` }).from(doctors).where(isNull(doctors.bio)),
    db.select({ c: sql<number>`count(*)` }).from(doctors).where(isNull(doctors.imageUrl)),
    db.select({ c: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.updatedAt} < NOW() - INTERVAL '6 months'`),
  ]);

  const dupes = await db.execute(sql`SELECT name, count(*) as cnt FROM clinics GROUP BY name HAVING count(*) > 1 ORDER BY cnt DESC LIMIT 20`);

  return new Response(JSON.stringify({
    total: Number(total[0]?.c ?? 0),
    verified: Number(verified[0]?.c ?? 0),
    issues: {
      missingPhone: Number(noPhone[0]?.c ?? 0),
      missingEmail: Number(noEmail[0]?.c ?? 0),
      missingDescription: Number(noDesc[0]?.c ?? 0),
      missingHours: Number(noHours[0]?.c ?? 0),
      missingMachines: Number(noMachines[0]?.c ?? 0),
      noDoctors: Number(noDoctors[0]?.c ?? 0),
      noReviews: Number(noReviews[0]?.c ?? 0),
      doctorsMissingBio: Number(doctorsNoBio[0]?.c ?? 0),
      doctorsMissingImage: Number(doctorsNoImage[0]?.c ?? 0),
      staleListings: Number(stale[0]?.c ?? 0),
    },
    duplicates: dupes.rows || [],
  }), { headers: { 'Content-Type': 'application/json' } });
};
