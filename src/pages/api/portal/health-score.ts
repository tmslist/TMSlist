import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics, doctors, reviews, users } from '../../../db/schema';
import { eq, count } from 'drizzle-orm';

export const prerender = false;

interface HealthItem {
  name: string;
  completed: boolean;
  points: number;
  tip: string;
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userRows = await db
      .select({ clinicId: users.clinicId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [clinicRows, doctorCount, reviewCount] = await Promise.all([
      db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1),
      db.select({ count: count() }).from(doctors).where(eq(doctors.clinicId, clinicId)),
      db.select({ count: count() }).from(reviews).where(eq(reviews.clinicId, clinicId)),
    ]);

    const clinic = clinicRows[0];
    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const items: HealthItem[] = [
      {
        name: 'Has description',
        completed: !!clinic.description && clinic.description.length > 10,
        points: 10,
        tip: 'Add a detailed description of your clinic to help patients understand your services.',
      },
      {
        name: 'Has phone number',
        completed: !!clinic.phone,
        points: 10,
        tip: 'Add a phone number so patients can reach you directly.',
      },
      {
        name: 'Has website',
        completed: !!clinic.website,
        points: 10,
        tip: 'Link your website to drive more traffic and build credibility.',
      },
      {
        name: 'Has email',
        completed: !!clinic.email,
        points: 10,
        tip: 'Add an email address for patients who prefer written communication.',
      },
      {
        name: 'Has opening hours',
        completed: !!clinic.openingHours && clinic.openingHours.length > 0,
        points: 10,
        tip: 'List your opening hours so patients know when you are available.',
      },
      {
        name: 'Has TMS machines listed',
        completed: !!clinic.machines && clinic.machines.length > 0,
        points: 10,
        tip: 'List your TMS devices (e.g., NeuroStar, BrainsWay) to attract patients searching for specific technology.',
      },
      {
        name: 'Has specialties',
        completed: !!clinic.specialties && clinic.specialties.length > 0,
        points: 10,
        tip: 'Add your treatment specialties (e.g., depression, OCD, anxiety) to appear in relevant searches.',
      },
      {
        name: 'Has insurance info',
        completed: !!clinic.insurances && clinic.insurances.length > 0,
        points: 10,
        tip: 'List accepted insurance providers to help patients filter by coverage.',
      },
      {
        name: 'Has at least 1 doctor',
        completed: (doctorCount[0]?.count || 0) > 0,
        points: 10,
        tip: 'Add your treating physicians to build trust and showcase expertise.',
      },
      {
        name: 'Has at least 1 review',
        completed: (reviewCount[0]?.count || 0) > 0,
        points: 10,
        tip: 'Encourage satisfied patients to leave a review to boost your visibility.',
      },
    ];

    const score = items.filter((i) => i.completed).reduce((sum, i) => sum + i.points, 0);
    const maxScore = items.reduce((sum, i) => sum + i.points, 0);

    return new Response(JSON.stringify({ score, maxScore, items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal health score error:', err);
    return new Response(JSON.stringify({ error: 'Failed to calculate health score' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
